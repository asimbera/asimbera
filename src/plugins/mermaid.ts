import type { RemarkPlugin } from '@astrojs/markdown-remark';
import { visit } from 'unist-util-visit';

export const mermaid: RemarkPlugin<[]> = () => (tree) => {
  visit(tree, 'code', (node, index, parent) => {
    if (node.lang === 'mermaid') {
      parent!.children.splice(index!, 1, {
        type: 'html',
        value: `<pre class="mermaid">${node.value}</pre>`,
      });
    }
  });
};
