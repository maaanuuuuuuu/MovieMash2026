# Codex Agent Guidance

This file provides frontend-specific guidance to Codex when working with this codebase.

Use [PromptV1.md](C:/Users/USER/Desktop/devs/MovieMash2026/PromptV1.md) as the product source of truth for v1 behavior.
Use [docs/functional-spec.md](C:/Users/USER/Desktop/devs/MovieMash2026/docs/functional-spec.md) as the current functional documentation for implemented behavior. Update it in the same change whenever a feature, route, data model, persistence rule, ranking rule, filter, or user-facing behavior changes.

## Common Commands

- `npm install`: install dependencies.
- `npm run dev`: start the Vite dev server on port 4173.
- `npm run build`: run TypeScript project checks and build production assets.
- `npm run preview`: serve the built app locally on port 4173.
- `npm run lint`: run ESLint.
- `npm run test`: run Vitest unit and integration tests once.
- `npm run test:watch`: run Vitest in watch mode.
- `npm run test:e2e`: run Playwright browser tests.

When implementing UI behavior, run the dev server and use browser tooling such as Chrome DevTools or Playwright to inspect the app. Check mobile portrait first.

## Project Layout

Current scaffold:

- `src/main.tsx`: React entry point.
- `src/App.tsx`: temporary scaffold root. Replace with routes and app shell as the implementation grows.
- `src/index.css`: global CSS and design tokens.
- `src/App.css`: scaffold CSS. Remove or split as feature styles are introduced.
- `public/`: static public assets.
- `PromptV1.md`: product requirements for v1.

Target layout as the app grows:

- `src/app/`: app shell, routing, service worker registration, and app-level providers.
- `src/common/`: shared components, hooks, utilities, and browser helpers.
- `src/common/designSystem/`: reusable design primitives, tokens, icons, and motion helpers.
- `src/domain/`: generic comparable item types, ranking types, and pure domain contracts.
- `src/modules/comparison/`: comparison screen UI, gestures, confirmation animation, and flow orchestration.
- `src/modules/ranking/`: ranking page UI and stability display.
- `src/modules/content/`: film adapter, local dataset access, and source abstractions for future categories.
- `src/modules/persistence/`: Dexie database setup, repositories, migrations, and local state loading.
- `src/modules/rankingEngine/`: Elo-style update logic, stability calculation, and ranking summaries.
- `src/modules/pairing/`: adaptive matchup selection and short speculative queue logic.
- `src/data/`: frozen local item datasets.
- `src/assets/posters/`: production poster assets for offline use.
- `scripts/`: dev-time ingestion and validation scripts, including TMDb metadata and poster freezing.
- `tests/` or colocated `*.test.ts(x)`: unit and integration tests.
- `e2e/`: Playwright browser tests when flows need a real browser.

Keep core ranking, pairing, and persistence code generic. Film-specific fields should stay inside the content adapter and presentation layer.

## Critical Frontend Directives

- The default route must be the comparison screen, not the ranking page.
- Build mobile portrait first. Then verify tablet and desktop layouts.
- Keep the experience fast. After each action, move to the next meaningful comparison with minimal delay.
- Do not make the app feel like a CRUD interface. Favor direct gestures, light motion, and immediate feedback.
- Ranking access must stay visually secondary through a floating icon-only button.
- Hide the ranking button while the user is actively interacting. Fade it back in after 5 seconds of inactivity.
- Use local frozen data and local poster assets in production. Do not add a production runtime dependency on TMDb or any other external API.
- When changing `src/data/films.ts`, film genres, or exposed genre filters, verify that the exposed genre filters, excluding `All`, cover every film at least once. If coverage fails, propose and document a revised genre filter set before finishing the change.
- Store user state in IndexedDB through Dexie. Do not add accounts, sync, backend storage, or onboarding for v1.
- Add offline support for the app shell, frozen dataset, and poster assets.
- Do not generate exhaustive item pairs. Use the adaptive pairing strategy from `PromptV1.md`.
- Keep a short speculative matchup queue only. Refresh it after each outcome.
- Prevent not-seen removal when only 10 active items remain.
- Show the ranking stability celebration only once.

## Coding Style

- Single responsibility: keep each component or hook focused on one purpose. Split rendering, data loading, and stateful logic when they start to mix.
- Size: target about 100 lines per component or hook, hard cap 150 unless the file is central and clearly easier to read as one unit. If you exceed this, explain in your reply to the user why this component is bigger than it should be, not in a code comment.
- Prefer composition and extraction over adding more branches to one file.
- One React component per file. If a second component is needed, extract it to its own PascalCase file.
- In exhaustive `switch` statements, use a `default` branch with a `never` check such as `return value satisfies never` so TypeScript verifies all cases are handled.
- Every new `useEffect` needs a short 1-2 line comment in simple English explaining what the effect does.
- Make the smallest safe change that solves the task. Avoid broad refactors unless the task clearly requires them.
- Named imports only. Always import specific exports, such as `import { useState } from 'react'`. Do not import a global namespace unless a package requires it.
- Keep pure ranking and pairing logic free of React, Dexie, routing, DOM APIs, and film-specific fields.
- Prefer deterministic functions that can be unit tested with seeded or injected randomness.

## Frontend Architecture Patterns

### Component Organization

- Feature modules live in `src/modules/`.
- Common reusable code lives in `src/common/`.
- Design primitives live in `src/common/designSystem/`.
- Domain logic lives outside feature UI, usually in `src/domain/`, `src/modules/rankingEngine/`, or `src/modules/pairing/`.
- Persistence logic lives in `src/modules/persistence/`.
- Content source logic lives in `src/modules/content/`.

### Styling Guidelines

- Current styling baseline is plain CSS with Vite. Tailwind CSS is not installed. Do not write Tailwind-only code unless Tailwind has been added to the project first.
- Define reusable CSS variables for colors, spacing, radii, shadows, and motion timing in global CSS.
- Prefer component-level class names and small focused CSS sections over large global selectors.
- Avoid `className` on React components unless the component explicitly accepts and forwards it. `className` on HTML elements is acceptable.
- Visual fidelity matters for the comparison loop. Customize styles when they improve speed, clarity, playfulness, or touch ergonomics.
- Custom styles are expected for gestures, animation, poster cards, and responsive layout.
- No inline styles unless a value is truly dynamic, such as drag transform coordinates or computed animation values.
- Avoid clutter, heavy chrome, and generic dashboard visuals.

### TypeScript Patterns

- Define explicit types for component props.
- Do not use `any`. Use proper typing or `unknown` with type guards.
- Code must pass TypeScript strict mode checks.
- Use generic item types for ranking, pairing, and persistence boundaries.
- Keep film-specific types separate from generic comparable-item types.
- Use discriminated unions for outcome events such as left win, right win, tie, and not seen.

## File Naming Conventions

- Components: PascalCase, such as `ComparisonScreen.tsx`.
- Hooks: camelCase with a `use` prefix, such as `useIdleVisibility.ts`.
- Utilities: camelCase, such as `calculateEloUpdate.ts`.
- Types: colocate when local; use `types.ts` only for shared module contracts.
- Tests: file name plus `.test.ts` or `.test.tsx`, such as `selectMatchup.test.ts`.
- Playwright tests: `.spec.ts`, such as `comparisonFlow.spec.ts`.

## Testing Guidelines

- Use Vitest for pure unit tests and React integration tests.
- Use React Testing Library for component behavior.
- Use Playwright for browser-level flows that need navigation, layout, IndexedDB, service worker, or gesture checks.
- Add deterministic unit tests for the ranking engine.
- Add deterministic unit tests for matchup selection.
- Add integration tests for the main comparison flow and ranking page behavior.
- Prefer meaningful tests over coverage numbers.
- For adaptive algorithms, inject or seed randomness so tests are repeatable.
- Before finishing substantial work, run `npm run build`, `npm run lint`, and the relevant tests.

## Browser Validation

- Use Chrome DevTools or Playwright after meaningful UI changes.
- Test at least one mobile viewport around 390x844 and one desktop viewport.
- Check that text fits within cards and buttons.
- Check that tap targets are comfortable on mobile.
- Check the console for runtime errors.
- For offline work, verify production build behavior through `npm run build` and `npm run preview`.

## Code Quality

- Simple English everywhere: write all agent-authored text, comments, commit messages, and PR descriptions in simple English for non-native readers.
- Use short sentences and plain words.
- Avoid idioms and vague product language.
- Keep comments rare and useful.
- Do not leave scaffold assets, demo copy, or unused files in place after replacing the Vite starter UI.
- Do not introduce broad dependencies without a clear reason tied to `PromptV1.md`.
