# Browser Visual QA

Use browser verification when CSS, layout, assets, scrolling, canvas, or image
alignment changes.

Checklist:

- Start the dev server if the app needs Vite runtime behavior.
- Capture normal desktop and narrow viewport screenshots when responsive layout
  is affected.
- Check that the primary content is visible, not clipped, and scrollable where
  intended.
- Check that images load from the intended asset path and are not replaced by
  placeholders.
- Check hover, selected, disabled, and modal states if changed.
- Compare before and after when the change is a narrow visual fix.

Do not rely only on tests for pixel alignment, scrollbars, image cropping, or
document overlay coordinates.
