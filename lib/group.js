function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, value, i) => sum + value * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const normB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
  if (!normA || !normB) return 0;
  return dot / (normA * normB);
}

export function groupByEmbedding(items, threshold = 0.86) {
  const groups = [];

  for (const item of items) {
    let placed = false;
    for (const group of groups) {
      const similarity = cosineSimilarity(item.embedding, group.centroid);
      if (similarity >= threshold) {
        group.items.push(item);
        group.centroid = group.centroid.map((value, idx) => (value * (group.items.length - 1) + item.embedding[idx]) / group.items.length);
        placed = true;
        break;
      }
    }

    if (!placed) {
      groups.push({
        centroid: [...item.embedding],
        items: [item]
      });
    }
  }

  return groups.map((group, index) => ({
    id: `group-${index + 1}`,
    images: group.items.map((item) => item.image),
    evidence: group.items.map((item) => item.analysis)
  }));
}
