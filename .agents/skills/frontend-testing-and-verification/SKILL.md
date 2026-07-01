---
name: frontend-testing-and-verification
description: Test and verify frontend behavior in a React + Vite + TypeScript app. Use for Vitest, Testing Library, fake timers, build checks, browser screenshots, visual QA, interaction regressions, and deciding the smallest useful verification for a change.
---

# Frontend Testing And Verification

Match verification to risk and blast radius.

## Workflow

1. Identify whether the change affects pure logic, component behavior, timing,
   styling, layout, or assets.
2. Prefer focused tests near the changed module.
3. Run targeted tests first when iterating.
4. Run `npm test` and `npm run build` before finalizing code changes when
   possible.
5. For visual changes, inspect rendered output with browser screenshots or
   manual visual QA.
6. Report commands run and any checks skipped.

## References

- Read `references/vitest.md` for unit and component test commands.
- Read `references/testing-library.md` for user-facing component assertions.
- Read `references/fake-timers.md` for countdowns, animations, and delays.
- Read `references/browser-visual-qa.md` for screenshot and visual checks.
