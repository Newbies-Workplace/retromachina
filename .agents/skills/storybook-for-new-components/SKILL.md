---
name: storybook-for-new-components
description: Ensure every new custom visual React component in the Retromachina web app has useful co-located Storybook stories. Use when adding, extracting, or substantially splitting UI components; skip shadcn, generated, vendored, and other externally sourced components.
---

# Storybook for new components

When adding a custom visual React component under `apps/web/src`, create a co-located `ComponentName.stories.tsx` in the same change.

Do not require a story for:

- shadcn components in `apps/web/src/components/ui`;
- generated, vendored, or copied third-party components;
- providers, contexts, hooks, route-only wrappers, and components with no visual output;
- an existing component that is only being consumed without material visual changes.

## Story coverage

- Follow the repository's existing `Meta` and `StoryObj` conventions and use a title matching the component hierarchy.
- Include a default or idle story and the meaningful visual states introduced by the component, such as loading, empty, error, selected, expanded, or completed states.
- Add interaction callbacks as Storybook args. Use decorators or small local fixtures for required layout and context.
- If a component cannot be rendered without live API, router, socket, or broad application context, extract its visual portion into a prop-driven component and write stories for that component.
- Keep fixtures deterministic. Time-dependent animations should calculate their active timestamp inside the story render rather than once at module load.

## Verification

Run Biome on the component and its story, then run `npm run build-storybook` from `apps/web`. A new custom visual component is incomplete until both the component and its representative stories build successfully.
