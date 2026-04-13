---
description: Common React UI best practices (repo-aligned)
---

# Repo-aligned conventions

- Prefer `*.jsx` for UI components under `src/ui/` (this repo mostly uses JSX, not TSX).
- Keep explicit `import React from 'react'` / `import React, { ... } from 'react'` in `*.jsx` files for consistency with the existing codebase.
- Formatting is enforced by Prettier:
  - Single quotes
  - Semicolons
  - 2-space indentation
  - `printWidth` ~ 140
- Styling patterns used in this repo:
  - CSS Modules: `import css from './Component.module.css'`
  - `classnames` helper: `import cx from 'classnames'`
  - MUI (`@mui/material`) and Emotion (`@emotion/styled`) in some components

# Component structure

- Keep components small and focused.
- Prefer function components with named exports, e.g. `export const MyComponent = (...) => { ... }` or `export function MyComponent() { ... }`.
- Keep render logic readable:
  - Extract complex conditions into variables.
  - Extract repeated UI into small subcomponents.

# State management

- Prefer local component state (`useState`) for strictly-local UI state.
- Use the existing Redux patterns (`useDispatch`, `useSelector`) for shared/app state.
- Avoid copying Redux state into local state unless you need a derived/transient UI value.
- For derived data:
  - Prefer deriving directly in render when cheap.
  - Use memoization (`useMemo`) for expensive derivations.

# Event handlers and re-renders

- Avoid inline heavy computations inside JSX.
- Use `useCallback` when:
  - Passing handlers deep into the tree
  - Passing handlers to memoized children
- Use `React.memo` for leaf components that re-render often and are expensive to render.
- Avoid unnecessary re-renders from object/array literals:
  - Hoist constants out of the component when possible.
  - Memoize objects passed as props when needed.

# MUI / Emotion usage

- Prefer MUI components for consistent UI controls when already used in the surrounding area.
- Keep styling approach consistent within a component:
  - For small one-offs: MUI `sx` prop is acceptable.
  - For reusable styled variants: prefer Emotion `styled(...)`.
  - For layout/structure and app-specific visuals: prefer CSS Modules.
- Avoid overriding too many internal MUI classes unless necessary (maintenance cost).

# CSS Modules conventions

- Use `css.someClass` and combine with `cx(...)`.
- Keep class naming consistent within the file (the repo uses both simple names and BEM-like `block__element`).
- Prefer layout utilities (e.g. existing `Layout/*` components) rather than duplicating layout CSS.

# Accessibility

- Ensure interactive elements are semantic:
  - Use `<button>` for actions, `<a>` for navigation.
- Add accessible labels:
  - Provide `aria-label` for icon-only controls.
  - Ensure tooltips are not the only source of meaning.
- Ensure focus states are visible for keyboard navigation.

# Error handling and user feedback

- Prefer user-visible error feedback for recoverable UI errors (existing modal patterns are used in this repo).
- Do not swallow errors silently; log only when it helps debugging.

# Testing

- Use Testing Library patterns already present in the repo.
- Prefer selecting by role/label/text; use `data-testid` when there is no good semantic selector.
- Keep `testId` props stable when exposed by shared UI components (e.g. `UIButton`).

# Performance

- Avoid expensive work on every render (especially in panels that re-render with sliders).
- Debounce/throttle high-frequency updates when needed (sliders, mouse move, drag).
- Prefer rendering only what’s visible/needed; avoid mounting heavy panels when not active.
