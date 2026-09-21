import { visit } from 'unist-util-visit';
import type { Root, Image } from 'mdast';

// Reads a size directive from the image's TITLE field (must be quoted per
// CommonMark spec), e.g. ![alt](url "=400x"), ![alt](url "=x300"),
// ![alt](url "=400x300"). An unquoted suffix directly in the URL is not
// valid Markdown and will silently fail to parse as an image at all.
export default function remarkImageSize() {
  return (tree: Root) => {
    visit(tree, 'image', (node: Image) => {
      if (!node.title) return;

      const match = node.title.match(/^=(\d*)x(\d*)$/);
      if (!match) return;

      const [, width, height] = match;

      node.data = node.data || {};
      node.data.hProperties = {
        ...(node.data.hProperties || {}),
        ...(width ? { width } : {}),
        ...(height ? { height } : {}),
      };

      node.title = null; // consume it so it doesn't also render as a title tooltip
    });
  };
}