# AGENTS.md

Root policy in `/Users/eiichi/.codex/AGENTS.md` applies first. This file adds
project-specific guidance for `kyotsutest_sim`.

## Project Context

This is a React 19, Vite, TypeScript, and Vitest app for an exam simulation UI.
Before changing behavior, inspect `package.json`, the relevant component, the
matching style rules, and nearby tests.

## Local Workflow

- Prefer existing component boundaries, names, CSS classes, and data shapes.
- Keep UI changes aligned with the current screen structure unless the request
  explicitly asks for a redesign.
- Do not touch `src/`, assets, package files, or generated output when the task
  is only to update agent instructions or local skills.
- For implementation changes, run `npm test` and `npm run build` when possible.
- For visual UI changes, also verify the rendered screen with browser
  screenshots or explicit manual visual QA.

## Skill Routing

Use local skills under `.agents/skills/` when they match the task:

| Task | Skill |
| --- | --- |
| React, Vite, TypeScript implementation or refactor | `react-vite-typescript-app` |
| General web app UI layout, controls, hierarchy, responsive design, accessibility | `web-ui-design-system` |
| Vitest, Testing Library, fake timers, or browser visual verification | `frontend-testing-and-verification` |
| PDF/page images, coordinate overlays, mark positions, or image assets | `document-image-interaction` |
| Test, quiz, scoring, review, timer, page navigation, or answer workflow UI | `assessment-workflow-ui` |

Read only the skills and references needed for the current task. Keep skill
changes concise and use one-level `references/` files for details.

## Git

Follow the root Git policy. Because agent instruction files are special, commit
changes to `AGENTS.md` or `.agents/` only when the user explicitly asked for
those files to be created or changed.
