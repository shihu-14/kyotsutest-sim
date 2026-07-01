# PDF Page Rendering

Render document pages consistently before placing UI on top.

- Use one canonical source for the document pages when possible.
- Preserve the PDF or page image aspect ratio in every mode.
- Keep page scale, viewport scale, and overlay scale separate in naming.
- Avoid stretching a page to fill both width and height.
- If pages are images, record their natural width and height or use normalized
  coordinates.
- Verify cover pages and content pages; they often have different mark regions.

When layout changes, confirm the page bottom, top navigation, and side panels do
not clip the document.
