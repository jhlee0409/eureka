import { FigmaAuth, FigmaNode, ScreenData, ScreenGroup, PrefixGroup, CoverData, TextStyleData } from '../types';

const FIGMA_API_BASE = 'https://api.figma.com/v1';

// Label patterns for field extraction
const LABEL_PATTERNS = {
  screenId: ['화면 ID', 'screen id', 'screenid', '화면id', '화면 아이디'],
  createdDate: ['작성일', 'date', 'created', '날짜', '작성 일자', '생성일'],
  screenInformation: ['screen information', 'screeninformation', '화면 정보', '스크린 정보', '화면정보'],
  description: ['description', 'desc', '설명', '기획', 'spec', '상세 설명', '기획안', 'memo', 'full_list'],
};

export const extractFigmaInfo = (input: string): { fileKey: string; nodeId: string | null } => {
  if (!input) return { fileKey: '', nodeId: null };
  const fileKeyMatch = input.match(/(?:file|design)\/([a-zA-Z0-9]{22,24})/);
  const fileKey = fileKeyMatch ? fileKeyMatch[1] : input.trim();
  const urlParams = new URLSearchParams(input.includes('?') ? input.split('?')[1] : '');
  let nodeId = urlParams.get('node-id');
  if (nodeId) nodeId = nodeId.replace('-', ':');
  return { fileKey, nodeId };
};

/**
 * Collects all TEXT nodes from a node tree with parent information
 */
interface TextNodeInfo {
  name: string;
  characters?: string;
  type: string;
  parentName: string;
}

const collectAllTextNodes = (
  node: FigmaNode,
  parentName: string = ''
): TextNodeInfo[] => {
  const texts: TextNodeInfo[] = [];

  if (node.type === 'TEXT' && node.characters) {
    texts.push({
      name: node.name,
      characters: node.characters,
      type: node.type,
      parentName,
    });
  }

  if (node.children) {
    for (const child of node.children) {
      texts.push(...collectAllTextNodes(child, node.name));
    }
  }

  return texts;
};

/**
 * Extracts label-value pairs from text nodes
 * Pattern: If a text's characters matches a label, the NEXT text's characters is the value
 * Enhanced: Skips number labels (1-2 chars) and looks ahead for actual content
 */
const extractLabelValuePairs = (
  textNodes: TextNodeInfo[]
): Array<{ label: string; value: string }> => {
  const pairs: Array<{ label: string; value: string }> = [];
  const allLabels = Object.values(LABEL_PATTERNS).flat();

  for (let i = 0; i < textNodes.length; i++) {
    const current = textNodes[i];
    const currentText = (current.characters || current.name || '').toLowerCase().trim();

    // Check if current text is a label
    const isLabel = allLabels.some(label => currentText === label.toLowerCase());

    if (isLabel && i + 1 < textNodes.length) {
      let nextNode = textNodes[i + 1];
      let nextText = (nextNode.characters || nextNode.name || '').trim();

      // Check if next is also a label
      const nextIsLabel = allLabels.some(label => nextText.toLowerCase() === label.toLowerCase());

      if (nextIsLabel) {
        // No value found (label followed by another label), skip
        continue;
      }

      // If next text is very short (1-2 chars, likely a number label), look ahead
      if (nextText.length <= 2 && i + 2 < textNodes.length) {
        const nextNextNode = textNodes[i + 2];
        const nextNextText = (nextNextNode.characters || nextNextNode.name || '').trim();

        // If the text after the short text is much longer, use that instead
        if (nextNextText.length > 10) {
          nextText = nextNextText;
        }
      }

      if (nextText) {
        pairs.push({
          label: current.characters || current.name || '',
          value: nextText,
        });
      }
    }
  }

  return pairs;
};

/**
 * Extracts specific field value from pairs or text nodes
 */
const extractFieldValue = (
  pairs: Array<{ label: string; value: string }>,
  textNodes: TextNodeInfo[],
  patterns: string[]
): string | undefined => {
  // First try to find from label-value pairs
  for (const pair of pairs) {
    if (patterns.some(p => pair.label.toLowerCase().includes(p.toLowerCase()))) {
      return pair.value;
    }
  }

  // Fallback: find from text nodes with specific names
  // Prioritize "full_list" nodes for description field
  const priorityNodes = textNodes.filter(node =>
    node.name.toLowerCase().includes('full_list') ||
    node.parentName.toLowerCase().includes('full_list')
  );

  if (priorityNodes.length > 0) {
    const descriptions = priorityNodes
      .map(node => node.characters)
      .filter(Boolean)
      .join('\n\n');
    if (descriptions) return descriptions;
  }

  // Standard search in text nodes
  for (const node of textNodes) {
    const nameLower = (node.name || '').toLowerCase();
    if (patterns.some(p => nameLower.includes(p.toLowerCase()))) {
      // Return characters if different from name, otherwise skip (it's just a label)
      if (node.characters && node.characters.toLowerCase() !== nameLower) {
        return node.characters;
      }
    }
  }

  return undefined;
};

/**
 * Extract all descriptions from the container
 * Each screen ID has its own container with full_list descriptions
 */
const findDescriptionText = (node: FigmaNode, suffix?: string): string => {
  // Collect all text nodes
  const textNodes = collectAllTextNodes(node);

  if (textNodes.length === 0) return '';

  console.log(`🔍 [findDescriptionText] Extracting descriptions for container`);

  // Find all full_list nodes
  const fullListNodes = textNodes.filter(node =>
    node.name.toLowerCase().includes('full_list') ||
    node.parentName.toLowerCase().includes('full_list')
  );

  console.log(`🔍 [findDescriptionText] Found ${fullListNodes.length} full_list nodes`);

  // Extract all descriptions with their labels
  const descriptionParts: string[] = [];
  let currentLabel = '';
  let currentDescription = '';

  for (let i = 0; i < fullListNodes.length; i++) {
    const text = (fullListNodes[i].characters || '').trim();

    // Short text (1-3 chars) is likely a label: "1", "ㅅ", "3", "4", etc.
    if (text.length <= 3 && text.length > 0) {
      // Save previous label-description pair if exists
      if (currentLabel && currentDescription) {
        descriptionParts.push(`${currentLabel}. ${currentDescription}`);
      }

      currentLabel = text;
      currentDescription = '';
    }
    // Long text is the description content
    else if (text.length > 10) {
      currentDescription = text;
    }
  }

  // Add the last pair
  if (currentLabel && currentDescription) {
    descriptionParts.push(`${currentLabel}. ${currentDescription}`);
  }

  // If we found structured descriptions, join them
  if (descriptionParts.length > 0) {
    const result = descriptionParts.join('\n\n');
    console.log(`✅ [findDescriptionText] Extracted ${descriptionParts.length} label-description pairs`);
    console.log(`✅ [findDescriptionText] Labels found: ${descriptionParts.map(d => d.split('.')[0]).join(', ')}`);
    return result;
  }

  // Fallback: try label-value extraction
  console.log(`⚠️ [findDescriptionText] No structured descriptions found, trying label-value extraction`);
  const labelValuePairs = extractLabelValuePairs(textNodes);
  const description = extractFieldValue(
    labelValuePairs,
    textNodes,
    LABEL_PATTERNS.description
  );

  return description || '';
};

/**
 * Extracts screen information from node using label-value pairs
 * Returns undefined if value is "-" or empty
 */
const findScreenInformation = (node: FigmaNode): string | undefined => {
  // Collect all text nodes
  const textNodes = collectAllTextNodes(node);

  if (textNodes.length === 0) return undefined;

  // Extract label-value pairs
  const labelValuePairs = extractLabelValuePairs(textNodes);

  // Try to extract screen information using enhanced logic
  const screenInfo = extractFieldValue(
    labelValuePairs,
    textNodes,
    LABEL_PATTERNS.screenInformation
  );

  // Return undefined if value is "-" or empty
  if (!screenInfo || screenInfo.trim() === '-' || screenInfo.trim() === '') {
    return undefined;
  }

  return screenInfo;
};

/**
 * Extracts date pattern like YY.MM.DD or YYYY.MM.DD
 */
const extractDate = (text: string): string | undefined => {
  const dateMatch = text.match(/([0-9]{2,4})\.([0-9]{2})\.([0-9]{2})/);
  return dateMatch ? dateMatch[0] : undefined;
};

/**
 * Extracts cover page data from a FRAME node named "표지"
 */
const extractCoverData = (node: FigmaNode): CoverData | undefined => {
  // Check if this is a cover node
  const nodeName = (node.name || '').trim();
  if (nodeName !== '표지' || node.type !== 'FRAME') {
    return undefined;
  }

  // Extract background color
  const fills = (node as any).fills;
  let backgroundColor = { r: 0, g: 0, b: 0, a: 1 }; // default black
  if (fills && fills[0] && fills[0].type === 'SOLID') {
    backgroundColor = fills[0].color;
  }

  // Extract dimensions and position of the cover frame
  const boundingBox = (node as any).absoluteBoundingBox;
  const width = boundingBox?.width || 1920;
  const height = boundingBox?.height || 1080;
  const frameX = boundingBox?.x || 0;
  const frameY = boundingBox?.y || 0;

  // Collect all TEXT nodes
  const textNodes: TextStyleData[] = [];

  const collectTextNodes = (n: any) => {
    if (n.type === 'TEXT' && n.characters) {
      const style = n.style || {};
      const textFills = n.fills || [];
      let textColor = { r: 1, g: 1, b: 1, a: 1 }; // default white
      if (textFills[0] && textFills[0].type === 'SOLID') {
        textColor = textFills[0].color;
      }

      const textBoundingBox = n.absoluteBoundingBox || {};

      // Convert absolute coordinates to relative coordinates (relative to frame)
      const relativeX = (textBoundingBox.x || 0) - frameX;
      const relativeY = (textBoundingBox.y || 0) - frameY;

      textNodes.push({
        characters: n.characters,
        fontFamily: style.fontFamily || 'Pretendard',
        fontWeight: style.fontWeight || 400,
        fontSize: style.fontSize || 16,
        color: textColor,
        textAlign: style.textAlignHorizontal || 'LEFT',
        position: {
          x: relativeX,
          y: relativeY,
          width: textBoundingBox.width || 0,
          height: textBoundingBox.height || 0,
        }
      });
    }

    if (n.children) {
      n.children.forEach(collectTextNodes);
    }
  };

  collectTextNodes(node);

  if (textNodes.length === 0) {
    return undefined; // No text found, not a valid cover
  }

  return {
    backgroundColor,
    width,
    height,
    textNodes
  };
};

/**
 * Searches for a cover node ("표지") associated with a screen's prefix section
 * E.g., AGRE_0001 → finds 표지 that contains AGRE_XXXX screen IDs
 */
const findCoverForScreen = (document: FigmaNode, screenName: string): CoverData | undefined => {
  // Extract prefix from screen name (e.g., AGRE_0001 → AGRE)
  const prefix = screenName.split('_')[0];

  // Search for a FRAME named "표지" that contains screen IDs with matching prefix
  const searchForCover = (node: any): FigmaNode | undefined => {
    if ((node.name || '').trim() === '표지' && node.type === 'FRAME') {
      // Check if this cover contains any screen ID with matching prefix
      // Method 1: Check node names (e.g., AGRE_0001 as child node)
      const hasMatchingScreenIdNode = (n: any, depth = 0): boolean => {
        if (depth > 5) return false;

        const nodeName = (n.name || '').trim();
        const match = /^([A-Z]+)_[0-9]+(_(.+))?$/.exec(nodeName);

        if (match && match[1] === prefix) {
          console.log(`✅ Found cover for prefix "${prefix}": screen ID node "${nodeName}"`);
          return true;
        }

        if (n.children) {
          return n.children.some((child: any) => hasMatchingScreenIdNode(child, depth + 1));
        }

        return false;
      };

      // Method 2: Check TEXT content (e.g., "AUTO_0004 / LINK_0001" in text)
      const hasMatchingTextContent = (n: any, depth = 0): boolean => {
        if (depth > 5) return false;

        if (n.type === 'TEXT' && n.characters) {
          const text = n.characters.trim();
          const regex = new RegExp(`${prefix}_[0-9]+`, 'i');
          if (regex.test(text)) {
            console.log(`✅ Found cover for prefix "${prefix}": in text content "${text.substring(0, 50)}"`);
            return true;
          }
        }

        if (n.children) {
          return n.children.some((child: any) => hasMatchingTextContent(child, depth + 1));
        }

        return false;
      };

      if (hasMatchingScreenIdNode(node) || hasMatchingTextContent(node)) {
        return node;
      }
    }

    if (node.children) {
      for (const child of node.children) {
        const found = searchForCover(child);
        if (found) return found;
      }
    }

    return undefined;
  };

  const coverNode = searchForCover(document);
  return coverNode ? extractCoverData(coverNode) : undefined;
};

/**
 * Find any parent screen (without suffix) with same prefix
 * E.g., for AUTO_0004_1, find any AUTO_XXXX (like AUTO_0001, AUTO_0002, AUTO_0004)
 * All screens with same prefix (AUTO, PSET, etc) share same container
 */
const findPrefixParentScreen = (documentRoot: FigmaNode, prefix: string): FigmaNode | null => {
  const prefixRegex = new RegExp(`^${prefix}_[0-9]+$`); // Match PREFIX_XXXX (no suffix)

  function search(node: FigmaNode): FigmaNode | null {
    const nodeName = (node.name || '').trim();
    if (prefixRegex.test(nodeName)) return node;

    if (node.children) {
      for (const child of node.children) {
        const found = search(child);
        if (found) return found;
      }
    }
    return null;
  }

  return search(documentRoot);
};

/**
 * Find the FRAME with exact screen name (e.g., AUTO_0004_1) and return its container
 * Each screen ID has its own independent container
 */
const getScreenContainer = (documentRoot: FigmaNode, screenName: string): FigmaNode | null => {
  console.log(`🔍 [getScreenContainer] Looking for screen "${screenName}"`);

  // Recursively find the FRAME with exact matching name
  const findScreenFrame = (node: FigmaNode): FigmaNode | null => {
    if (node.type === 'FRAME' && node.name === screenName) {
      console.log(`✅ [getScreenContainer] Found exact screen FRAME: "${node.name}"`);
      return node;
    }

    if (node.children) {
      for (const child of node.children) {
        const found = findScreenFrame(child);
        if (found) return found;
      }
    }

    return null;
  };

  const screenFrame = findScreenFrame(documentRoot);

  if (screenFrame) {
    // The screen FRAME itself is the container (contains full_list nodes)
    console.log(`✅ [getScreenContainer] Using screen FRAME as container: "${screenFrame.name}"`);
    return screenFrame;
  }

  console.log(`⚠️ [getScreenContainer] Screen "${screenName}" not found`);
  return null;
};

const parseFrames = (
  node: FigmaNode,
  screens: ScreenData[],
  context: { page: string; section?: string; date?: string } = { page: 'Default' },
  documentRoot?: FigmaNode,
  ancestors: FigmaNode[] = []
) => {
  // Updated REGEX to allow Korean characters and special characters in suffix
  // Examples: AUTO_0004_5, AUTO_0004_ㅅ, AUTO_0004_가
  const REGEX = /^([A-Z]+_[0-9]+)(_(.+))?$/;
  const nodeName = (node.name || '').trim();
  const nextContext = { ...context };

  // Try to find a date in the current container's name
  const foundDate = extractDate(nodeName);
  if (foundDate) nextContext.date = foundDate;


  if (node.type === 'CANVAS') {
    nextContext.page = nodeName;
  } else if (node.type === 'SECTION') {
    if (!nodeName.match(REGEX)) nextContext.section = nodeName;
  }

  const match = nodeName.match(REGEX);
  const isMatchableType = ['FRAME', 'COMPONENT', 'INSTANCE', 'SECTION', 'GROUP', 'TEXT'].includes(node.type);

  if (isMatchableType && match) {
    const baseId = match[1];
    const suffix = match[3];

    // Get container for this specific screen ID
    // Each screen ID has its own independent container
    let containerNode = node; // fallback to the node itself
    const container = getScreenContainer(documentRoot!, nodeName);
    if (container) {
      containerNode = container;
      console.log(`[${nodeName}] Using screen-specific container: ${container.type} - "${container.name}"`);
    } else {
      // Fallback to own grandparent
      if (ancestors.length >= 2) {
        containerNode = ancestors[ancestors.length - 2];
        console.log(`[${nodeName}] ⚠️ No prefix parent found, using own grandparent: ${containerNode.type} - "${containerNode.name}"`);
      } else {
        console.log(`[${nodeName}] ⚠️ No container found, using node itself`);
      }
    }

    // Collect text nodes for debugging
    const textNodes = collectAllTextNodes(containerNode);
    console.log(`[${nodeName}] Found ${textNodes.length} text nodes in container (type: ${containerNode.type}, name: ${containerNode.name})`);

    // Pass suffix to findDescriptionText for matching numbered descriptions
    const description = findDescriptionText(containerNode, suffix);
    const screenInfo = findScreenInformation(containerNode);

    if (description) {
      console.log(`[${nodeName}] Description: ${description.substring(0, 100)}...`);
    } else {
      console.log(`[${nodeName}] ⚠️ No description found`);
    }

    if (screenInfo) {
      console.log(`[${nodeName}] Screen Info: ${screenInfo}`);
    } else {
      console.log(`[${nodeName}] ℹ️ Screen Info: empty or "-"`);
    }

    // Try to find cover data for this screen
    let coverData: CoverData | undefined;
    if (documentRoot) {
      coverData = findCoverForScreen(documentRoot, nodeName);
      if (coverData) {
        console.log(`[${nodeName}] ✅ Found cover with ${coverData.textNodes.length} text nodes`);
      }
    }

    screens.push({
      id: node.id,
      figmaId: node.id,
      name: nodeName,
      description,
      screenInformation: screenInfo,
      baseId: baseId,
      suffix: suffix,
      isParent: !suffix,
      pageName: nextContext.page,
      sectionName: nextContext.section,
      createdDate: nextContext.date,
      coverData
    });
    return;
  }

  if (node.children && Array.isArray(node.children)) {
    const nextAncestors = [...ancestors, node];
    node.children.forEach(child => parseFrames(child, screens, nextContext, documentRoot, nextAncestors));
  }
};

export const fetchFigmaFile = async (auth: FigmaAuth): Promise<Record<string, Record<string, PrefixGroup>>> => {
  // Use test.json as dummy data instead of Figma API
  console.log('📦 Using test.json as dummy data');
  const response = await fetch('/test.json');
  if (!response.ok) {
    throw new Error(`Failed to load test.json: ${response.statusText}`);
  }
  const data = await response.json();
  const rawScreens: ScreenData[] = [];

  // test.json has nodes structure with nodeId "34:2749"
  const testNodeId = '34:2749';
  if (data.nodes && data.nodes[testNodeId]) {
    const nodeEntry = data.nodes[testNodeId];
    if (nodeEntry && nodeEntry.document) {
      parseFrames(
        nodeEntry.document,
        rawScreens,
        { page: nodeEntry.document.name || 'Synced Node', date: extractDate(nodeEntry.document.name || '') },
        nodeEntry.document, // Pass document root for container search
        [] // Start with empty ancestors array
      );
    } else {
      throw new Error(`Node ${testNodeId} not found in test.json.`);
    }
  }

  if (rawScreens.length === 0) throw new Error("No screens found matching pattern (e.g., AUTO_0001).");

  console.log('✅ Parsed screens from test.json:', rawScreens.length);

  // Debug: Check first few screens
  console.log('🔍 First 5 screens:');
  rawScreens.slice(0, 5).forEach(s => {
    console.log(`  - name: "${s.name}", baseId: "${s.baseId}", suffix: "${s.suffix || 'none'}"`);
  });

  // Skip image API call when using test.json
  // Thumbnails will use coverData instead

  // Group by PREFIX (AUTO, PSET, LINK, etc.)
  // Each prefix becomes a separate card
  // Inside each prefix, group by baseId
  const prefixGroups: Record<string, Record<string, PrefixGroup>> = {};

  rawScreens.forEach(screen => {
    const prefix = screen.baseId.split('_')[0]; // AUTO, PSET, LINK, etc.

    if (!prefixGroups[screen.pageName]) prefixGroups[screen.pageName] = {};

    if (!prefixGroups[screen.pageName][prefix]) {
      prefixGroups[screen.pageName][prefix] = {
        prefix,
        baseIds: {},
        pageName: screen.pageName
      };
    }

    const group = prefixGroups[screen.pageName][prefix];

    if (!group.baseIds[screen.baseId]) {
      group.baseIds[screen.baseId] = [];
    }

    group.baseIds[screen.baseId].push(screen);
  });

  // Add cover data for each prefix (from any baseId in that prefix)
  Object.values(prefixGroups).forEach(pageGroups => {
    Object.values(pageGroups).forEach(prefixGroup => {
      const anyScreen = Object.values(prefixGroup.baseIds)[0]?.[0];
      if (anyScreen) {
        prefixGroup.coverData = anyScreen.coverData;
      }
    });
  });

  // Sort variants by suffix within each baseId
  Object.values(prefixGroups).forEach(pageGroups => {
    Object.values(pageGroups).forEach(prefixGroup => {
      Object.keys(prefixGroup.baseIds).forEach(baseId => {
        prefixGroup.baseIds[baseId].sort((a, b) => {
          const aNum = parseInt(a.suffix || '0', 10);
          const bNum = parseInt(b.suffix || '0', 10);
          return aNum - bNum;
        });
      });
    });
  });

  console.log('📦 Prefix groups:', prefixGroups);

  return prefixGroups;
};
