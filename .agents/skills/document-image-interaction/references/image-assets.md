# Image Assets

Keep image assets traceable and intentional.

- Store app assets under `src/assets/` when imported by React or CSS.
- Keep stamp, background, and document assets in clear subfolders when there are
  multiple related files.
- Use the user-provided asset directly when the request requires exact visual
  matching.
- Do not generate replacement imagery unless explicitly asked or no usable
  source exists.
- Remove unused assets only after checking imports, CSS references, and public
  paths.
- Verify transparency, cropping, and natural dimensions after replacing stamps
  or mark images.
