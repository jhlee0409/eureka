import { FigmaAuth, FigmaNode, ScreenData, ScreenGroup } from '../types';

const FIGMA_API_BASE = 'https://api.figma.com/v1';

export const extractFigmaInfo = (input: string): { fileKey: string; nodeId: string | null } => {
  if (!input) return { fileKey: '', nodeId: null };
  const fileKeyMatch = input.match(/(?:file|design)\/([a-zA-Z0-9]{22,24})/);
  const fileKey = fileKeyMatch ? fileKeyMatch[1] : input.trim();
  const urlParams = new URLSearchParams(input.includes('?') ? input.split('?')[1] : '');
  let nodeId = urlParams.get('node-id');
  if (nodeId) nodeId = nodeId.replace('-', ':');
  return { fileKey, nodeId };
};

const findDescriptionText = (node: FigmaNode): string => {
  const targetNames = ['description', 'spec', '설명', 'screen spec', 'desc', '기획', '기획안', 'memo'];
  const name = (node.name || '').toLowerCase().trim();
  if (node.type === 'TEXT' && targetNames.some(t => name.includes(t))) return node.characters || '';
  if (node.children) {
    for (const child of node.children) {
      const found = findDescriptionText(child);
      if (found) return found;
    }
  }
  return '';
};

/**
 * Extracts date pattern like YY.MM.DD or YYYY.MM.DD
 */
const extractDate = (text: string): string | undefined => {
  const dateMatch = text.match(/([0-9]{2,4})\.([0-9]{2})\.([0-9]{2})/);
  return dateMatch ? dateMatch[0] : undefined;
};

const parseFrames = (
  node: FigmaNode,
  screens: ScreenData[],
  context: { page: string; section?: string; date?: string } = { page: 'Default' }
) => {
  const REGEX = /^([A-Z]+_[0-9]+)(_([0-9]+))?$/;
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
    screens.push({
      id: node.id,
      figmaId: node.id,
      name: nodeName,
      description: findDescriptionText(node),
      baseId: baseId,
      suffix: suffix,
      isParent: !suffix,
      pageName: nextContext.page,
      sectionName: nextContext.section,
      createdDate: nextContext.date
    });
    return;
  }

  if (node.children && Array.isArray(node.children)) {
    node.children.forEach(child => parseFrames(child, screens, nextContext));
  }
};

export const fetchFigmaFile = async (auth: FigmaAuth): Promise<Record<string, Record<string, ScreenGroup>>> => {
  const { fileKey, nodeId } = extractFigmaInfo(auth.fileKey);
  if (!fileKey) throw new Error("Invalid Figma File Key");

  const endpoint = nodeId
    ? `${FIGMA_API_BASE}/files/${fileKey}/nodes?ids=${nodeId}`
    : `${FIGMA_API_BASE}/files/${fileKey}`;

  const response = await fetch(endpoint, {
    headers: { 'X-Figma-Token': auth.personalAccessToken }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Figma API returned ${response.status}: ${errorData.err || response.statusText}`);
  }

  const data = await response.json();
  const rawScreens: ScreenData[] = [];

  if (nodeId) {
    const nodeEntry = data.nodes[nodeId];
    if (nodeEntry && nodeEntry.document) {
      parseFrames(nodeEntry.document, rawScreens, { page: nodeEntry.document.name || 'Synced Node', date: extractDate(nodeEntry.document.name || '') });
    } else {
      throw new Error(`Node ${nodeId} not found.`);
    }
  } else if (data.document) {
    parseFrames(data.document, rawScreens);
  }

  if (rawScreens.length === 0) throw new Error("No screens found matching pattern (e.g., AUTO_0001).");

  const ids = rawScreens.map(s => s.figmaId).join(',');
  const imageRes = await fetch(`${FIGMA_API_BASE}/images/${fileKey}?ids=${ids}&format=png&scale=1`, {
    headers: { 'X-Figma-Token': auth.personalAccessToken }
  });

  if (imageRes.ok) {
    const imageData = await imageRes.json();
    rawScreens.forEach(s => {
      if (imageData.images && imageData.images[s.figmaId]) s.thumbnailUrl = imageData.images[s.figmaId];
    });
  }

  const pageGroups: Record<string, Record<string, ScreenGroup>> = {};

  rawScreens.forEach(screen => {
    if (!pageGroups[screen.pageName]) pageGroups[screen.pageName] = {};
    if (screen.isParent) {
      if (!pageGroups[screen.pageName][screen.baseId]) {
        pageGroups[screen.pageName][screen.baseId] = { parent: screen, children: [], pageName: screen.pageName };
      } else {
        pageGroups[screen.pageName][screen.baseId].parent = screen;
      }
    }
  });

  rawScreens.filter(s => !s.isParent).forEach(child => {
    const page = pageGroups[child.pageName];
    if (page && page[child.baseId]) {
      page[child.baseId].children.push(child);
    } else if (page) {
      page[child.baseId] = {
        parent: { ...child, isParent: true, name: `${child.baseId} (Parent Missing)` },
        children: [child],
        pageName: child.pageName
      };
    }
  });

  Object.values(pageGroups).forEach(groups => {
    Object.values(groups).forEach(group => {
      group.children.sort((a, b) => parseInt(a.suffix || '0', 10) - parseInt(b.suffix || '0', 10));
    });
  });

  return pageGroups;
};
