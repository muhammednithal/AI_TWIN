import { describe, expect, it } from 'vitest';
import { memoryCitations, missingInformation } from './evidence';

describe('task evidence', () => {
  it('turns memory references into local links without transforming code or existing links', () => {
    const tree = {
      type: 'root',
      children: [
        { type: 'paragraph', children: [{ type: 'text', value: 'A claim [M1], another [M25].' }] },
        { type: 'inlineCode', value: '[M2]' },
        { type: 'link', url: 'https://example.com', children: [{ type: 'text', value: '[M3]' }] },
      ],
    };
    memoryCitations()(tree);
    expect(JSON.stringify(tree)).toContain('#memory-M1');
    expect(JSON.stringify(tree)).toContain('#memory-M25');
    expect(JSON.stringify(tree)).not.toContain('#memory-M2"');
    expect(JSON.stringify(tree)).not.toContain('#memory-M3');
  });
  it('extracts gaps without including subsequent next steps', () => {
    expect(
      missingInformation(
        '## Result\nAnswer\n## Assumptions & missing information\nVerify current figures.\n\n## Next steps\nResearch.',
      ),
    ).toBe('Verify current figures.');
    expect(missingInformation('## Missing information\nNo dated source.')).toBe('No dated source.');
    expect(missingInformation('An old answer without headings.')).toBe('');
  });
});
