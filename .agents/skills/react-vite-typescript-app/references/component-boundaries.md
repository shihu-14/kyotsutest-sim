# Component Boundaries

Split components around ownership and repeated UI, not around visual fragments
alone.

- Screen-level components may coordinate state and pass plain props downward.
- Leaf components should be predictable: receive data and callbacks, render UI.
- Keep layout wrappers close to the screen that owns the layout.
- Keep domain actions named by user intent, for example `onFinishExam` instead
  of `onClick`.
- Avoid prop drilling only when it is already making the code hard to change.
- Do not introduce context unless multiple distant branches need the same
  mutable state.

For risky UI changes, update the smallest component that owns the behavior and
reuse existing CSS classes where possible.
