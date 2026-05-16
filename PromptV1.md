# Mobile-First Pairwise Ranking App

## Objective

Build a greenfield mobile-first pairwise ranking web app for fast, repeated taste decisions.

Design the system around a generic comparable-item model so other categories can be supported later without major rework, but ship version 1 with films only. Use film-specific language only where the v1 experience truly needs it.

The product should feel lightweight, fast, slightly playful, and rewarding. It should not feel like a CRUD app. The main goal is fast preference expression, quick convergence toward a satisfying ranking, and continued refinement over time.

## Product Constraints

- This is a responsive web app, not a native app.
- Deploy target is GitHub Pages.
- The app should support offline use after load so users are not disrupted by network loss.
- Version 1 is anonymous and frontend-only.
- There are no accounts, no backend, no sync, and no onboarding in v1.

## Core Experience

- The default route is the comparison screen.
- Show two items side by side as the main interaction surface.
- Tapping the left item chooses the left item.
- Tapping the right item chooses the right item.
- A tie action sits between the two cards.
- The user can drag a single card vertically far enough from its origin to mark that item as not seen.
- Swipe up means the user has not seen it but is interested in it later.
- Swipe down means the user wants it removed from their active comparison pool.
- If the drag does not cross the threshold, the card should animate back into place.
- After every action, transition immediately into the next meaningful comparison with very little interruption.
- Add a very short, satisfying confirmation animation after each committed action so the interaction loop feels rewarding and addictive without slowing the flow.
- Ranking access should remain visually secondary through a floating icon-only button.
- Hide that button while the user is actively interacting.
- Fade it back in after 5 seconds of inactivity.

## Ranking and Pairing Logic

- Do not generate exhaustive pairs.
- Implement adaptive pairing intended to produce a good-feeling ranking quickly, then refine it over time.
- Use an Elo-style model or a similarly lightweight rating system.
- Ties are real outcomes and must update the ranking accordingly.
- If an item is marked not seen, remove it from that user's active ranking pool and store whether it is `interested` or `removed`.
- Prevent further not-seen actions once only 10 active items remain.
- Let the user restore interested or removed items from a dedicated saved-items screen.
- Favor items that have never appeared in a comparison yet until all active items have been seen at least once.
- After that, bias pair selection toward meaningful comparisons such as nearby ratings, while keeping some exploration.
- To avoid slowness between turns, keep a short speculative queue of the next 3 to 5 candidate matchups precomputed while the user is thinking or during idle time.
- Do not precompute a long rigid sequence. Refresh or invalidate the short queue after each outcome so pairing stays adaptive.

## Ranking Page

- Ranking lives on a separate page and must not be the default entry point.
- Show ordered items.
- Show simple confidence or stability tiers using these labels:
  - new
  - settling
  - stable
- Continue serving comparisons even after the ranking becomes reasonably stable.
- Show celebratory milestone notifications when the current ranking filter first reaches stable top 10, stable top 15, and stable top 20.
- A stable top milestone is reached when every item inside that top N has the `stable` tier.
- Each milestone notification should include a call to action to open the matching ranking page.
- Show each milestone only once per ranking filter in v1.

## Persistence

- Store all user state locally in IndexedDB.
- Clearing browser storage resets the experience.
- No explicit in-app reset is required in v1.

## Content Source and Data Pipeline

- Seed v1 with about 100 well-known films released in 1980 or later.
- The list should be a balanced mix, not heavily skewed only mainstream or only cinephile.
- Poster, English title, and release year are mandatory for every shipped film.
- There must be zero runtime dependency on an external API after deployment.
- During development, use TMDb as an acceptable source to gather and validate film metadata and poster assets.
- Build a dev-time ingestion pipeline that fetches candidate films from TMDb, validates required fields, and freezes the result into a local source file and local poster assets for production use.
- The production app should read from the frozen local dataset, not from TMDb.
- Design the source layer so different source files can be offered later without rewriting ranking or UI logic.
- The shipped v1 UI does not need user-facing category switching, but the underlying domain model and naming should support non-film categories later.

## Technical Architecture

- Use React, TypeScript, and Vite.
- Use Dexie on top of IndexedDB for persistence.
- Add offline support with a service worker for the app shell, local dataset, and poster assets.
- Keep domain concerns separated:
  - generic item model
  - film-specific content adapter
  - ranking engine
  - adaptive pairing strategy
  - local persistence
  - presentation and UI
- Avoid coupling the core ranking or storage logic to film-specific fields.
- Keep the comparison screen optimized for mobile portrait first, while remaining usable on larger screens.

## Testing Requirements

- Add deterministic unit tests for the ranking engine.
- Add deterministic unit tests for the matchup selection algorithm.
- Add integration tests for the main comparison flow and the ranking page behavior.
- Recent browsers only are sufficient. No legacy browser support is required.

## Out of Scope for Version 1

- Accounts
- Sync
- Backend storage
- Onboarding
- Filters or segments
- Full undo history beyond the short swipe undo window
- Shipped UI for non-film categories

## Implementation Priorities

- Optimize for perceived speed and continuity more than theoretical ranking sophistication.
- Prefer the simplest ranking and pairing model that feels good in use and is easy to tune.
- Posters should be available offline after load, not dependent on live remote URLs in production.
- Keep the visual design intentional and playful, but avoid clutter or game-like chrome that gets in the way of rapid repeated decisions.
- The final result should feel like a fast taste-ranking game, not a data management interface.

## Delivery Expectation

Produce a working v1 implementation with:

- a comparison-first mobile UI
- adaptive pair generation
- persistent local ranking state
- a separate ranking page
- offline-capable local data and poster assets
- a content ingestion pipeline for freezing the film dataset
- unit tests for ranking and pairing logic
- integration tests for the main user flows
