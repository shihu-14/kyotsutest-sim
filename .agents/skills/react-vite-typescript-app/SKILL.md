---
name: react-vite-typescript-app
description: Build, modify, or refactor React 19 + Vite + TypeScript application code. Use for component boundaries, state shape, hooks, effects, file placement, props, typed utilities, and changes that should follow this repo's existing React patterns.
---

# React Vite TypeScript App

Start from the current code, not from a generic template.

## Workflow

1. Inspect `package.json`, the target component, related styles, types, utils,
   and tests before editing.
2. Keep state minimal and close to the component that owns it.
3. Prefer derived values during render over extra state or effects.
4. Move shared logic only when reuse is real or a boundary is already clear.
5. Preserve existing naming, props style, and CSS class patterns.
6. Add or update focused tests when behavior changes.

## References

- Read `references/file-structure.md` when deciding where code should live.
- Read `references/state-and-effects.md` when adding state, hooks, or effects.
- Read `references/component-boundaries.md` when splitting or composing UI.
