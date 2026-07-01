# State And Effects

Prefer simple render data flow.

- Store only user input, server or storage data, timers, and interaction state.
- Derive totals, filtered lists, selected records, and display labels during
  render or with a small pure helper.
- Avoid effects for synchronizing values that can be computed directly.
- Use effects for external systems: timers, DOM APIs, storage, network, browser
  events, and subscriptions.
- Clean up timers and event listeners in the effect cleanup.
- Keep effect dependencies honest; do not suppress dependency issues by hiding
  values.

When logic becomes hard to test, move the pure calculation to `src/utils/` and
test it directly.
