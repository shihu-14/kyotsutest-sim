---
name: document-image-interaction
description: Work with document pages, PDFs, page images, image assets, and coordinate overlays in a frontend UI. Use for rendered PDF pages, mark positions, clickable overlays, asset replacement, scale-preserving previews, and keeping visual coordinates consistent across modes.
---

# Document Image Interaction

Treat the rendered document as the source of geometry.

## Workflow

1. Identify the source asset: PDF, generated page image, uploaded image, or CSS
   background.
2. Preserve aspect ratio unless the request explicitly changes it.
3. Define overlay coordinates in the same coordinate system as the rendered
   page.
4. Verify scale, scroll, and coordinate mapping in the browser.
5. Keep assets organized by domain and avoid unused duplicate images.
6. Prefer data-driven coordinates over CSS-only guesses when overlays must
   match document marks.

## References

- Read `references/pdf-page-rendering.md` for PDF or page-image workflows.
- Read `references/coordinate-overlays.md` for clickable or stamped overlays.
- Read `references/image-assets.md` for asset organization and replacement.
