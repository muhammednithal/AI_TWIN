type Node = { type: string; value?: string; url?: string; children?: Node[] };

// Transform text nodes only: code, existing links and raw HTML remain untouched.
export function memoryCitations() {
  return (tree: Node) => {
    function visit(node: Node) {
      if (
        !node.children ||
        ['link', 'linkReference', 'code', 'inlineCode', 'html'].includes(node.type)
      )
        return;
      node.children = node.children.flatMap((child): Node[] => {
        if (child.type !== 'text' || !child.value) {
          visit(child);
          return [child];
        }
        const parts: Node[] = [];
        let offset = 0;
        for (const match of child.value.matchAll(/\[(M[1-9]\d*)\]/g)) {
          parts.push({ type: 'text', value: child.value.slice(offset, match.index) });
          parts.push({
            type: 'link',
            url: `#memory-${match[1]}`,
            children: [{ type: 'text', value: match[1] }],
          });
          offset = match.index + match[0].length;
        }
        parts.push({ type: 'text', value: child.value.slice(offset) });
        return parts;
      });
    }
    visit(tree);
  };
}

export function missingInformation(result: string) {
  const match = result.match(
    /^#{1,3}\s+(?:Assumptions\s*(?:&|and)\s*missing information|Missing information|What to verify)\s*\n([\s\S]*?)(?=^#{1,3}\s|$(?![\s\S]))/im,
  );
  return match?.[1].trim() || '';
}
