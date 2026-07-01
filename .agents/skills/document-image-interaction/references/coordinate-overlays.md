# Coordinate Overlays

Overlay positions must be derived from the rendered page coordinate system.

- Prefer normalized coordinates from the page box: `x`, `y`, `width`, `height`
  as fractions of the page size.
- Convert normalized coordinates to CSS pixels after page scale is known.
- Keep click targets and visual marks aligned but independently adjustable when
  necessary.
- Check both exam and review/scoring modes if they share the same marks.
- Use screenshots to validate vertical and horizontal alignment.
- Avoid one-off CSS nudges that apply only to the current page count or zoom.

When a user reports alignment drift, first verify page aspect ratio and overlay
coordinate origin before changing individual marks.
