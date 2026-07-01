# Navigation

Navigation should reveal where the user is and what can happen next.

- Use tabs for peer views that can be switched freely.
- Use step indicators for sequential flows.
- Use page controls for document-like navigation.
- Use breadcrumbs only when hierarchy matters.
- Keep destructive exits visually separate from primary progress actions.
- Disable or hide impossible navigation consistently. Prefer hiding edge arrows
  when no previous or next page exists if the established UI uses that pattern.
- Keep selected navigation items the same size as unselected items unless the
  layout explicitly reserves fixed space for the change.

For long horizontal page lists, fix the visible viewport width and scroll the
selected item into a predictable aligned position.
