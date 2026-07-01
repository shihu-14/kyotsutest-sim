# Vitest

Use Vitest for pure utilities, component behavior, and timing logic.

- Run all tests with `npm test`.
- Use targeted runs while iterating, for example `npm test -- MarkSheet`.
- Keep expected values meaningful; do not change tests only to match broken
  behavior.
- For pure logic, test inputs and outputs directly.
- For React components, use Testing Library and assert visible behavior.
- Keep tests deterministic. Avoid real time, random data, and network access.

When a test fails, fix the implementation unless the test is clearly asserting
obsolete behavior from an explicitly requested spec change.
