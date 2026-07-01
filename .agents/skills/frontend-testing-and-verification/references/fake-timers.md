# Fake Timers

Use fake timers for countdowns, scoring delays, animation delays, and debounced
UI.

- Enable fake timers before rendering code that creates timers.
- Advance time inside `act` when React state updates are expected.
- Keep timer constants synchronized with tests by naming the user-visible
  phases in the test.
- Restore real timers after each test when fake timers are enabled.
- Prefer checking phase transitions over implementation details such as exact
  timer IDs.

For animation-heavy flows, test the meaningful states: before delay, during
transition, after transition, and final interaction availability.
