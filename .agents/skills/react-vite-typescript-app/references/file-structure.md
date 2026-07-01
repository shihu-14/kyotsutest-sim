# File Structure

Use the existing structure before creating new folders.

- `src/components/`: reusable or screen-level React components.
- `src/data/`: exam data and fixtures used by the app.
- `src/hooks/`: reusable React hooks with no component markup.
- `src/styles/`: global CSS and screen transition styles.
- `src/test/`: shared test setup.
- `src/types.ts`: shared app-level TypeScript types.
- `src/utils/`: pure utilities and rendering helpers with focused tests.

Guidelines:

- Co-locate tests with the module they verify using `*.test.ts` or
  `*.test.tsx`.
- Do not create a new abstraction folder unless several modules already need
  the same boundary.
- Keep app-wide types in `src/types.ts`; keep component-private types in the
  component file.
- Do not move files as part of a behavior fix unless the move is requested or
  needed to make the change safe.
