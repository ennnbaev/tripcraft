# TripCraft UI handoff

Implement this design in the existing TripCraft frontend (React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query, React Router, Leaflet).
API contract: `API.md` in the repo is the source of truth for field names. The design uses exactly those fields.

## What is in this folder

- `design/*.dc.html` — one file per screen. They are HTML prototypes (a small templating runtime: `{{hole}}`, `<sc-for>`, `<sc-if>`), **not** code to copy. Read them for structure, copy, states and behaviour. The JS at the bottom of each file shows the mock data and the interaction logic.
  - `Main.dc.html` — New trip form (route `/`)
  - `Generating.dc.html` — generation state while `POST /api/trips` is pending (5–30 s)
  - `Trip.dc.html` — trip page (route `/trips/:id`)
  - `Trips.dc.html` — My trips (route `/trips`)
  - `Stats.dc.html` — AI usage (route `/stats`)
  - `M-*.dc.html` are only phone-width previews of the same screens; there is no separate mobile code. Every screen is one responsive page.
- `tripcraft.css` — every design token as CSS variables (light on `.tc-theme`, dark on `[data-theme="dark"]`) plus reference CSS for every component (`tc-` classes). Port the tokens into `src/styles/tokens.css` and map them into Tailwind's `@theme inline` (see below). Port component values to Tailwind classes, or keep `tc-` classes as a `@layer components` if that's faster — but be consistent.
- `tokens.json` — the TripCraft design system tokens (same values, machine-readable).

## Global rules (from the TripCraft design system)

- Fonts: Poppins 500/600/700 (`font-heading`: headings, labels, buttons, numbers) and Rubik 400/500 (body). Load: `https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Rubik:wght@400;500&display=swap`.
- Colors: mint = action (primary button, selected chips, route line); violet = anything that calls the AI (Regenerate, Generate packing list, AI badge, focus ring); coral/sun/sky = accents; `danger` only for errors and delete. Text on mint is `on-mint`, never white.
- Each `Category` has a fixed color triple `cat-<name>`, `cat-<name>-tint`, `cat-<name>-ink` and a Lucide icon. Keep one `categoryStyle` map in `src/lib/category.ts` and build badges, pins and photo fallbacks from it:
  FOOD utensils · MUSEUMS landmark · NATURE mountain · NIGHTLIFE moon · SHOPPING shopping-bag · HISTORY castle · ART palette · SPORT bike · SIGHTSEEING camera · TRANSPORT bus · OTHER ellipsis.
- Slots: MORNING `slot-morning` (sun), AFTERNOON `slot-afternoon` (sky), EVENING `slot-evening` (indigo).
- Icons: `lucide-react`, 18px in controls, 14px inline, `currentColor`.
- Radii: 10 inputs, 16 cards, 28 hero, pill for buttons/chips/badges. Controls 44px tall (32px small).
- Copy: sentence case, no exclamation marks, no emoji. Show enums as words (`MEDIUM` → "Medium", `INVALID_JSON` → "Invalid JSON"). Money: local currency first, USD after: `90 GEL ≈ $33`; `0` → "Free" in `mint-ink`. Use `font-variant-numeric: tabular-nums` for money and stats.
- Every itinerary shows: "Prices and details are estimates. Check before you go."
- Theme: `data-theme` on `<html>`, default to OS preference.
- Respect `prefers-reduced-motion` (stop orbit, shimmer, spin, ring).
- Every screen has loading, error and empty states (see each file).
- Accessibility: real `<button>`/`<a>`, labels on inputs, `aria-pressed`/`aria-selected`/`aria-checked` as in the prototypes, focus ring 2px violet with 2px offset (sun on the dark header).

Tailwind mapping:

```css
@import "tailwindcss";
@import "./styles/tokens.css";
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
@theme inline {
  --font-heading: var(--font-display);
  --font-sans: var(--font-body);
  --color-surface: var(--surface);
  --color-surface-sunken: var(--surface-sunken);
  --color-surface-raised: var(--surface-raised);
  --color-surface-deep: var(--surface-deep);
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-ink-subtle: var(--ink-subtle);
  --color-on-deep: var(--on-deep);
  --color-border: var(--border);
  --color-border-strong: var(--border-strong);
  --color-mint: var(--mint);
  --color-on-mint: var(--on-mint);
  /* …same for every other token, including all cat-* and slot-* */
  --radius-input: var(--radius-sm);
  --radius-card: var(--radius-md);
  --radius-panel: var(--radius-lg);
  --shadow-soft: var(--shadow-card);
  --shadow-lift: var(--shadow-float);
}
```
(Theme keys must not reuse a token's own name, otherwise you get a CSS variable cycle.)

## Shared components to build

`Header` (wordmark "Trip" + mint "Craft" next to a round mint mark with map-pin; nav: New trip, My trips, AI stats; on ≤720px hide the wordmark text and nav icons), `Button` (primary / secondary / ghost / ai / ai-solid / danger / on-deep, sm, icon), `Field`, `Stepper`, `SegmentedControl`, `InterestChips`, `CategoryBadge`, `AiBadge`, `Notice` (info / success / warn / error), `Skeleton`, `GenerationLoading`, `DayTabs`, `DayCard`, `ActivityCard`, `RegenerateDay`, `MapPanel`, `BudgetSummary`, `TipsCard`, `PackingList`, `TripListItem`, `EmptyState`, `ConfirmDialog`, `StatTile`, `RequestsChart`, `StatusBadge`.

## Screens

### 1. New trip (`Main.dc.html`)
- Dark teal hero, "Where to next?" (mint "next?"), lead text, white planner card on top.
- Fields map 1:1 to `TripRequest`: destination (text, map-pin icon, max 255), startDate, endDate (`type="date"`, helper "3 days · 10–12 Nov 2026" / "Up to 14 days"), travelers stepper 1–10, budgetLevel and pace as segmented controls with a one-line hint under each, interests as toggle chips (category dot → check when selected), notes textarea with `n / 500` counter, language text (default "English", max 30, helper "The app stays in English. Only the plan is translated.").
- Client validation identical to the API (start not in the past, end ≥ start, length 1–14, at least one interest). Errors appear under fields after the first submit, plus an error notice at the top of the card. Also show 400 `details` from the backend under the matching fields.
- Footer: "We'll plan 3 days in Tbilisi. It usually takes 5–30 seconds." + primary "Plan my trip".
- Desktop grid: destination 6/12, dates 3+3; travelers 3, budget 5, pace 4; interests 12; notes 8, language 4. One column on phones.

### 2. Generating (`Generating.dc.html`)
- Shown while the `POST /api/trips` mutation is pending (same route or an overlay; your choice, but keep the form values so "Edit trip" goes back with them filled).
- Card: orbiting dots (mint/coral/sun) around a violet sparkles disc, AI badge, "Planning 3 days in Tbilisi", summary line, progress bar (asymptotic fake progress — there is no streaming yet), elapsed seconds, a 5-step checklist driven by elapsed time, Cancel (aborts the request).
- Shimmer skeleton of 3 day columns below (1 on phones).
- Success → navigate to `/trips/:id`.
- 429 → "The free AI limit is reached" / "Please try again in a minute." 502 → "We couldn't build a valid plan" / "The AI answer didn't pass our checks, even after a retry. Please try again." Both: info note "No trip was created. Your answers in the form are kept.", buttons Try again + Edit trip, small code line.

### 3. Trip (`Trip.dc.html`)
- Dark band: back link "My trips", "Delete trip" (opens ConfirmDialog → `DELETE`, then navigate to `/trips`), h1 "N days in {city}", full destination, meta row (dates, travelers, budget, pace, language), interest badges, AI badge, created/updated, notes.
- Day tabs (Day N + "Tue 10 Nov").
- Desktop: two columns — day card (max 560px) on the left, sticky map on the right. Phones: tabs, map (300px), day card.
- Day card: dark day number tile, title, "Tue 10 Nov 2026 · 6 stops · 330 GEL ≈ $122"; activities grouped by slot (slot rail with colored dot + "2 stops"), only non-empty slots; ActivityCard = square photo slot (photo from Wikimedia/Unsplash by name + destination, cached; fallback = solid category color + icon) with number disc, time, duration ("1 h 30 min"), "No map location" when lat/lng is null, name, description, category badge, cost.
- Selecting an activity card highlights its pin and vice versa (`aria-pressed`).
- RegenerateDay panel (violet tint) at the bottom of each day: textarea 0–500 with counter, suggestion chips that append text, note "Only this day changes. We'll avoid places from your other days.", violet "Regenerate day" button. While pending: overlay on the day card with the orbit + "Regenerating day N". Success: replace the trip in the query cache with the response, 1 s mint ring on the day card, success notice "Day N is updated…", clear feedback. 429/502: error notice inside the panel, trip unchanged.
- Map: Leaflet + CARTO Positron / Dark Matter tiles, teardrop pins in the category color with a white numbered disc, dotted mint polyline in time order, fit bounds to the day, chip "Day 1 · 5 of 6 stops on the map", bottom card for the selected stop with an external link. See "Place details" below for the next step.
- Overview under the columns: BudgetSummary (total, ≈ USD, per person, bar per day, category split bar + legend, disclaimer) and TipsCard ("Good to know", numbered sun discs) side by side; PackingList full width: empty state with violet "Generate packing list" → `POST /api/trips/{id}/packing-list` → skeleton → category cards with checkboxes (checked state can live in localStorage), "Regenerate list" when it exists.

### 4. My trips (`Trips.dc.html`)
- `GET /api/trips`. Row: 72px tinted thumb with map-pin (tone cycles coral/sky/sun/mint), destination, "10–12 Nov 2026 · 3 days", "Created 24 Oct 2026", "Past trip" badge if endDate < today, delete icon button, "Open" button (hidden on phones; whole text block is a link).
- Delete turns the row into an inline danger confirm ("Delete Tbilisi trip? … AI usage stats stay."), then `DELETE` with optimistic removal and a success notice.
- Loading skeleton rows, error notice with Try again, EmptyState ("No trips yet" + "Plan your first trip").

### 5. AI usage (`Stats.dc.html`)
- `GET /api/stats`. Six tiles: requests, successful (+%), errors (+ error rate), avg latency (s + ms), input tokens, output tokens (k + full).
- Requests by day: 14 stacked bars (mint success, danger errors), y axis 0–25 (compute a nice max from data), hover/tap tooltip "Sat 24 Oct · 22 requests · 3 errors", on phones show every other x label.
- By prompt template: name, requests, mini bar, avg latency. By provider: table. Recent requests: table in an `overflow-x: auto` box, "Today 13:31", trip "#42" or "Deleted" when `tripId` is null, "—" for null tokens/latency, StatusBadge (Success mint, Invalid JSON sun, Rate limited sky, Error danger) + error message under it.
- Refresh button (refetch), loading skeleton, error notice, empty state.

## Place details (new requirement)

Clicking a pin (or the selected stop card) should open a place-details panel, like tapping a place in Google Maps:
- Desktop: a panel that slides over the map from the right; phones: a bottom sheet.
- Content: photo, name, category badge, time + duration + estimated cost from the itinerary, description, and when available rating / opening hours / address / website from a place lookup.
- Actions: "Open in Google Maps" (`https://www.google.com/maps/search/?api=1&query=<name>, <destination>` — or `query_place_id` when we have one), "Directions" (`https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>`), "Open in OpenStreetMap".
- Phase 1 (free, no key): keep Leaflet, fill the panel from the itinerary + Wikipedia/Wikimedia summary and photo, and use the Google Maps deep links above.
- Phase 2 (optional): Google Maps JavaScript API via `@vis.gl/react-google-maps` + Places API (New) Text Search / Place Details for rating, hours, photos, reviews. Needs a Google Cloud billing account and an API key restricted to the site's domain; call Places from the backend so the key and usage stay controlled, and cache results per (name, destination).

## Suggested order

1. Tokens + Tailwind theme + fonts + Header + Button/Field basics.
2. New trip form + Generating state wired to `POST /api/trips`.
3. Trip page (day tabs, cards, map, overview), then Regenerate, then Packing list.
4. My trips, then Stats.
5. Place details panel (phase 1).

After each step, run the app and check it at 1440px and 390px wide, in light and dark.
