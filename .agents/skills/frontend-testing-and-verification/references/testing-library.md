# Testing Library

Test the UI the way a user experiences it.

- Prefer queries by role, label, text, and accessible name.
- Use `userEvent` for interactions instead of manually firing low-level events.
- Assert visible results and callback effects, not private component state.
- Avoid brittle assertions tied to incidental DOM structure.
- Keep one test focused on one behavior.
- For disabled or hidden controls, assert both availability and consequence.

If a useful assertion is hard to write, check whether the component lacks
semantic markup or accessible labels.
