const fs = require('fs');

// Label patterns
const LABEL_PATTERNS = {
  screenId: ['화면 ID', 'screen id', 'screenid', '화면id', '화면 아이디'],
  createdDate: ['작성일', 'date', 'created', '날짜', '작성 일자', '생성일'],
  screenInformation: ['screen information', 'screeninformation', '화면 정보', '스크린 정보', '화면정보'],
  description: ['description', 'desc', '설명', '기획', 'spec', '상세 설명', '기획안', 'memo', 'full_list'],
};

// Collect all TEXT nodes
function collectAllTextNodes(node, parentName = '', result = []) {
  if (node.type === 'TEXT' && node.characters) {
    result.push({
      name: node.name,
      characters: node.characters,
      type: node.type,
      parentName,
    });
  }

  if (node.children) {
    for (const child of node.children) {
      collectAllTextNodes(child, node.name, result);
    }
  }

  return result;
}

// Extract label-value pairs
function extractLabelValuePairs(textNodes) {
  const pairs = [];
  const allLabels = Object.values(LABEL_PATTERNS).flat();

  for (let i = 0; i < textNodes.length; i++) {
    const current = textNodes[i];
    const currentText = (current.characters || current.name || '').toLowerCase().trim();

    const isLabel = allLabels.some(label => currentText === label.toLowerCase());

    if (isLabel && i + 1 < textNodes.length) {
      let nextNode = textNodes[i + 1];
      let nextText = (nextNode.characters || nextNode.name || '').trim();

      // Check if next is also a label
      const nextIsLabel = allLabels.some(label => nextText.toLowerCase() === label.toLowerCase());

      if (nextIsLabel) {
        // No value found, skip
        continue;
      }

      // If next text is very short (1-2 chars, likely a number label), try the one after
      if (nextText.length <= 2 && i + 2 < textNodes.length) {
        const nextNextNode = textNodes[i + 2];
        const nextNextText = (nextNextNode.characters || nextNextNode.name || '').trim();

        // If the next-next is much longer, use that instead
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
}

// Extract field value
function extractFieldValue(pairs, textNodes, patterns) {
  // First try to find from label-value pairs
  for (const pair of pairs) {
    if (patterns.some(p => pair.label.toLowerCase().includes(p.toLowerCase()))) {
      return pair.value;
    }
  }

  // Prioritize "full_list" nodes
  const priorityNodes = textNodes.filter(node =>
    node.name.toLowerCase().includes('full_list') ||
    node.parentName.toLowerCase().includes('full_list')
  );

  if (priorityNodes.length > 0) {
    const descriptions = priorityNodes
      .map(node => node.characters)
      .filter(Boolean)
      .filter(text => text.length > 10) // Filter out short texts like "1", "2"
      .join('\n\n');
    if (descriptions) return descriptions;
  }

  // Standard search
  for (const node of textNodes) {
    const nameLower = (node.name || '').toLowerCase();
    if (patterns.some(p => nameLower.includes(p.toLowerCase()))) {
      if (node.characters && node.characters.toLowerCase() !== nameLower) {
        return node.characters;
      }
    }
  }

  return undefined;
}

// Main parsing
console.log('📖 Loading test.json...');
const data = JSON.parse(fs.readFileSync('./test.json', 'utf8'));

console.log('\n📊 File Info:');
console.log('- Name:', data.name);
console.log('- Last Modified:', data.lastModified);

const nodeId = Object.keys(data.nodes)[0];
console.log('\n🔍 Parsing node:', nodeId);

const document = data.nodes[nodeId].document;
console.log('- Document type:', document.type);
console.log('- Document name:', document.name);
console.log('- Children count:', document.children?.length);

// Find first screen (AUTO_ pattern)
let firstScreen = null;
function findFirstScreen(node) {
  if (node.type === 'TEXT' && node.name && /^[A-Z]+_[0-9]+/.test(node.name)) {
    return node;
  }
  if (node.children) {
    for (const child of node.children) {
      const found = findFirstScreen(child);
      if (found) return found;
    }
  }
  return null;
}

firstScreen = findFirstScreen(document);
console.log('\n🎯 First screen found:', firstScreen?.name);

// Find the top-level group containing the screen
function findTopLevelGroup(node, targetId, depth = 0) {
  // If this node contains the target, and we're at a good depth, return it
  if (depth > 0 && depth <= 2 && containsNode(node, targetId)) {
    return node;
  }

  if (node.children) {
    for (const child of node.children) {
      const found = findTopLevelGroup(child, targetId, depth + 1);
      if (found) return found;
    }
  }

  return null;
}

function containsNode(node, targetId) {
  if (node.id === targetId) return true;
  if (node.children) {
    for (const child of node.children) {
      if (containsNode(child, targetId)) return true;
    }
  }
  return false;
}

let screenGroup = findTopLevelGroup(document, firstScreen?.id);
if (!screenGroup) {
  console.log('⚠️  Could not find top group, using first child');
  screenGroup = document.children[0];
}

console.log('\n📦 Screen Group:', screenGroup?.name);
console.log('- Type:', screenGroup?.type);
console.log('- Children:', screenGroup?.children?.length);

// Collect text nodes
const textNodes = collectAllTextNodes(screenGroup);
console.log('\n📝 Collected TEXT nodes:', textNodes.length);
console.log('\nFirst 10 TEXT nodes:');
textNodes.slice(0, 10).forEach((node, i) => {
  console.log(`[${i}] name="${node.name}" parent="${node.parentName}"`);
  console.log(`    chars="${node.characters.substring(0, 50)}${node.characters.length > 50 ? '...' : ''}"`);
});

// Extract label-value pairs
const labelValuePairs = extractLabelValuePairs(textNodes);
console.log('\n🏷️  Label-Value Pairs:', labelValuePairs.length);
labelValuePairs.forEach(pair => {
  console.log(`- "${pair.label}" → "${pair.value.substring(0, 50)}${pair.value.length > 50 ? '...' : ''}"`);
});

// Extract fields
const screenId = extractFieldValue(labelValuePairs, textNodes, LABEL_PATTERNS.screenId);
const createdDate = extractFieldValue(labelValuePairs, textNodes, LABEL_PATTERNS.createdDate);
const screenInformation = extractFieldValue(labelValuePairs, textNodes, LABEL_PATTERNS.screenInformation);
const description = extractFieldValue(labelValuePairs, textNodes, LABEL_PATTERNS.description);

console.log('\n✅ Extracted Fields:');
console.log('- Screen ID:', screenId || '(not found)');
console.log('- Created Date:', createdDate || '(not found)');
console.log('- Screen Information:', screenInformation?.substring(0, 50) || '(not found)');
console.log('- Description:', description ? `${description.substring(0, 100)}... (${description.length} chars)` : '(not found)');

console.log('\n✨ Done!');
