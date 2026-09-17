# Steel Thread v3 Accessibility Audit

**Accessibility Assurance · Senior Engineer Review**

Livestock Information service — GOV.UK Prototype Kit build. Scope: the four live views under `app/views/steel-thread/v3/`, excluding `_deprecated/`.

- **Pages audited:** 4
- **Method:** code inspection + Playwright/axe-core + manual keyboard & forced-colors testing
- **Standard:** WCAG 2.2 AA · GDS Design System
- **Server:** govuk-prototype-kit 13.20.2 · govuk-frontend 6.4.0 · MoJ Frontend 10.0.1

---

## 1. Scope & journey

### What this service does

A cattle keeper's "Livestock Information" dashboard: they land on their holding's details, review the animals registered to it, search and sort that herd, and follow up on any BCMS-flagged error records. There is no form submission journey in scope — every page in this set is a read-only view driven by session data, reached only after the (out-of-scope, deprecated) One Login authentication flow.

| View | Route | Role |
|---|---|---|
| Holding details | `/steel-thread/v3/holding-details` | Landing page after sign-in; CPH, address, herd mark |
| Animals on holding | `/steel-thread/v3/animals-on-holding` | Searchable, sortable, paginated herd list |
| Animal error record | `/steel-thread/v3/animal-error-record` | List of BCMS-flagged records as summary cards |
| Cattle details | `/steel-thread/v3/cattle/:earTagNumber` | Single-animal record, dam/sire lineage |

### Interactive surface

One live-filtering GET search form; one MoJ sortable-table (client-side, JS-enhanced); GOV.UK pagination on two listing pages; a persistent MoJ sub-navigation tri-tab; a notification banner; a back link; and a scripted-history "Back" control. No modals, no accordions, no date pickers, no client-side form validation, no autocomplete widgets.

### Critical path

Land on holding details → open *Animals on holding* → find an animal (search and/or sort) → open its record, or follow the error-record banner to resolve a flagged animal. Everything below is assessed against that path.

---

## 2. Headline

### Overall assessment: Generally accessible but remediation required

The four views are built almost entirely from audited GOV.UK Frontend and MoJ Frontend components, and it shows: automated scanning returns a single moderate axe violation across all four pages, contrast is strong throughout, and there's no keyboard trap anywhere in the flow. But the small amount of custom code carries a disproportionate share of the risk — a duplicated header override strips the page-level `banner` landmark from every view, the herd table doesn't reflow at 320px/400% zoom, and the search button disappears in Windows High Contrast Mode. None of these block the critical path outright, but each is the kind of defect that a formal accessibility statement audit will catch, and all four are cheap to fix now versus expensive once copy-pasted further.

| Critical | High | Medium | Low |
|---|---|---|---|
| 0 | 4 | 5 | 4 |

---

## 3. Detailed findings

Ordered by severity. Each finding names a root cause, not a symptom — where a defect produces several visible effects, they're described together under the one implementation problem that causes them.

### [High] No `banner` landmark on any page — header block is duplicated and overridden past its wrapper

**Stage:** Blocker before production

**WCAG:** 1.3.1 Info and Relationships (A) · 2.4.1 Bypass Blocks (A)

**Location:** All four views, plus `app/views/layouts/main.html`. Confirmed by rendering all four pages and enumerating landmarks — none contain a `header`/`banner` element.

**Problem:** GOV.UK Frontend's base template only wraps the header in a landmark `<header class="govuk-template__header">` when the `{% block header %}` chain reaches it via `{{ super() }}`. `layouts/main.html` overrides that block with its own `govukHeader()` + `govukServiceNavigation()` call and never calls `super()`, so the wrapper is skipped. Every one of the four view templates then *redefines the same block again*, byte-for-byte, rather than inheriting it — meaning the layout's own override isn't even being used; each page carries its own copy.

```nunjucks
{# present verbatim in main.html AND in each of the 4 views #}
{% block header %}
  {{ govukHeader({ homepageUrl: '/index.html' }) }}
  {{ govukServiceNavigation({ ... }) }}
{% endblock %}
```

Axe-core independently flags the consequence on the cattle-details page: `region` — "All page content should be contained by landmarks" (moderate), pointing at the back link, which sits directly in the container with nothing above it to land in.

**User impact:** Screen reader users who jump between landmarks (a primary navigation method in NVDA/JAWS/VoiceOver) cannot land on "banner" to reach the crown logo, service name, or sign-out control — that region is invisible to landmark navigation on every page in the service.

**How to reproduce:**
1. Load any of the four pages.
2. Inspect the DOM, or use a screen reader's landmark list (NVDA: Insert+F7 → Landmarks).
3. Observe no `header`/`banner` entry exists — the page goes straight from body to a `section[aria-label="Service information"]`.

**Expected behaviour:** The rendered page exposes a single `banner` landmark wrapping the GOV.UK header, as govuk-frontend produces by default when its block chain is left intact.

**Recommended fix:** Delete the duplicated `{% block header %}` from all four view templates — they add nothing over the layout. In `layouts/main.html`, either remove the header override entirely (govuk-branded.njk's default already renders the correct branded header + service nav when `serviceName`/`serviceUrl` are set), or if the custom slot content (the "Sign out" nav item) must stay, call `{{ super() }}` inside the override so the base template's `<header>` wrapper is preserved.

**GDS consideration:** This is exactly the failure mode the GOV.UK Frontend template's block/landmark structure is designed to prevent — overriding a block without calling `super()` silently discards the semantics the design system built in.

**Acceptance criteria:** Each of the four rendered pages contains exactly one `<header class="govuk-template__header">` (or equivalent landmark) wrapping the GOV.UK header and service navigation; axe-core's `region` check no longer fires on cattle-details; a screen reader's landmark list shows "banner" on every page.

---

### [High] Herd table forces the whole page to scroll horizontally below ~900px / at 400% zoom

**Stage:** Should fix before production

**WCAG:** 1.4.10 Reflow (AA)

**Location:** `animals-on-holding.html` — `.app-dashboard-table-wrapper` table; styles in `_dashboard.scss` and `application.scss`.

**Problem:** Measured directly with Playwright at a 320px viewport (the 400%-zoom equivalent width WCAG 1.4.10 is tested against): the whole `<html>` document scrolls horizontally by up to 493px, not just the table. Root-cause bisection confirmed two compounding rules: every data column carries `white-space: nowrap` via `.app-table__cell--no-wrap`, and the table itself is pinned to `min-width: 720px` in `_dashboard.scss`. The intended overflow container, `.app-dashboard-table-wrapper { overflow-x: auto }`, does correctly scroll the table on its own — but the page around it doesn't contain that scroll: the 833px-wide table forces its ancestors, and ultimately `<html>`, wider than the viewport. Reflow starts failing at any viewport narrower than ~900px.

**User impact:** Low-vision users at high browser zoom, and anyone on a phone in portrait, get a page that scrolls in two directions at once for content that isn't a map or data-viz — precisely what 1.4.10 exists to prevent. The overall page layout (heading, search box, inset text, pagination) shifts sideways along with the table.

**How to reproduce:**
1. Open Animals on holding.
2. Resize the browser to 320–768px wide, or set zoom to 400% at a standard 1280px width.
3. Scroll the page (not the table) right — the header, search box and body text move with it.

**Expected behaviour:** Only the table itself scrolls horizontally inside its own bounded container; the page (and everything outside the table) stays fixed at the viewport width.

**Recommended fix:** Give the wrapper a hard `max-width: 100%` constraint that the table is allowed to violate internally without pushing its ancestors — the standard pattern is `overflow-x: auto` on a wrapper with explicit width containment plus `contain: layout` or an ancestor `overflow-x: hidden` on the grid column, not just the wrapper. Confirmed fix: removing `white-space: nowrap` from the data columns and the table's fixed `min-width` resolves it outright; if the no-wrap columns are wanted for legibility, keep them but audit every ancestor up to `<html>` for a width constraint that actually clips instead of relying on the innermost wrapper alone.

**GDS consideration:** GOV.UK Frontend's own table component doesn't set fixed widths or forced no-wrap; this is added app CSS layered on top of it, and it's the layering that breaks containment.

**Acceptance criteria:** At 320px viewport width and at 400% zoom on a 1280px layout, `document.documentElement.scrollWidth` equals `clientWidth` on Animals on holding; the table remains independently horizontally scrollable.

---

### [High] Search button is a blank, unlabelled box in Windows High Contrast / forced-colors mode

**Stage:** Should fix before production

**WCAG:** 1.4.11 Non-text Contrast (AA) · 4.1.2 Name, Role, Value (A) in practice, once forced-colors strips the background image

**Location:** `animals-on-holding.html` line 90 (`.search-submit`); styles in `_search.scss`.

**Problem:** The submit button hides its text with the classic sprite technique — `text-indent: -5000px; overflow: hidden` — and shows a magnifying-glass icon via CSS `background-image` instead. Forced-colors mode (Windows High Contrast) strips background images from non-`<img>` elements by design and normalizes the button to a plain system-colour box. Screenshotting the control under `forced-colors: active` confirms the result: an entirely blank white rectangle with no icon and no visible text — the label is still off-screen at -5000px, so nothing renders.

**User impact:** Users who rely on Windows High Contrast (a first-class Windows accessibility feature, not an edge case) see an empty box where the primary search action should be. There's no icon, no text, no border differentiating it from background — the control is only discoverable by accident (tabbing onto it) or trial-and-error clicking.

**How to reproduce:**
1. Enable Windows High Contrast, or in Chrome DevTools set *Rendering → Emulate CSS media feature forced-colors: active*.
2. Open Animals on holding.
3. Look at the search button next to the input.

**Expected behaviour:** The button remains visually identifiable and its label legible in forced-colors mode, as any standard GOV.UK button is (GOV.UK Frontend buttons use real text, not background-image sprites, for this exact reason).

**Recommended fix:** Replace the background-image + text-indent hack with an inline SVG icon (`fill="currentColor"`, so it follows forced-colors' text-colour substitution) plus visually-hidden real text, matching how GOV.UK Frontend renders its own icons — or simply use a standard `govukButton` with visible "Search" text, which is both more GDS-aligned and immune to this class of bug entirely.

**GDS consideration:** This bespoke `.search-wrapper`/`.search-submit` CSS is inherited from an old GOV.UK finder-frontend pattern (there's a commented-out reference to the original asset URL in the SCSS) that predates the current GDS search component and doesn't reflect current guidance.

**Code-level guidance:**
```html
<button type="submit" class="search-submit">
  <svg aria-hidden="true" focusable="false" ...><path fill="currentColor" .../></svg>
  <span class="govuk-visually-hidden">Search</span>
</button>
```

**Acceptance criteria:** Under forced-colors emulation, the search button shows a visible icon or text rendered in the OS-selected button-text colour, not an empty box.

---

### [High] Cattle-details "Back" link is dead without JavaScript

**Stage:** Should fix before production

**WCAG:** Not a direct SC citation — a progressive-enhancement / robustness failure the audit brief specifically asks to check (§11)

**Location:** `animal-details.html:27` — `govukBackLink({ href: "javascript:window.history.back()" })`.

**Problem:** Verified with JavaScript disabled: the link renders with `href="javascript:window.history.back()"` exactly as authored, but browsers refuse to execute `javascript:` URIs when scripting is off. The link becomes fully inert — focusable, styled, but does nothing on click or Enter.

**User impact:** Any user whose JavaScript fails to load or is disabled (corporate lockdown, extension conflict, slow/blocked script, or a deliberate no-JS assistive setup) lands on an animal's detail page with no way back except the persistent top navigation — the one link built specifically for that purpose does nothing.

**How to reproduce:**
1. Disable JavaScript (Chrome DevTools → Command Menu → "Disable JavaScript").
2. Navigate from Animals on holding to any cattle record.
3. Activate the "Back" link.

**Expected behaviour:** The back link works whether or not JavaScript has run, consistent with progressive enhancement principles and the GOV.UK Prototype Kit's own guidance to prefer a real `href` where the referring page is known.

**Recommended fix:** Since the route the user always arrives from is knowable server-side (`/steel-thread/v3/animals-on-holding` for every current entry point to cattle-details), set a real `href` to that route rather than a script URI. If multiple referrers are genuinely possible in future, pass the origin as a query parameter and read it server-side, or progressively enhance a real fallback href with JS history navigation rather than relying on JS alone.

**Acceptance criteria:** With JavaScript disabled, activating "Back" from a cattle-details page navigates to a working page (not a no-op).

---

### [Medium] Column sort silently applies to the current page only, not the full 34-record herd

**Stage:** Should fix before user testing

**WCAG:** 3.2.4-adjacent (Consistent Identification) — primarily a cognitive-accessibility / predictable-behaviour defect rather than a strict SC failure

**Location:** `animals-on-holding.html` table + MoJ sortable-table component; pagination is computed server-side in `app/routes/steel-thread-v3.js`.

**Problem:** Confirmed by test: clicking "Date of birth" re-sorts only the 25 rows already in the DOM for page 1 of 34 total records; nothing is fetched or reconciled with page 2. The "Showing 1 to 25 of 34 results" caption and pagination links remain unchanged and imply a globally-ordered list, but paging to page 2 shows the original (unsorted-by-DOB) 9 remaining rows, not the next slice of a globally date-sorted list.

**User impact:** A keeper sorting by date of birth to find their oldest/newest animals will reasonably conclude the whole herd is now ordered that way. It isn't — records on page 2 are excluded from the sort entirely. This is misleading for every user, and it's an assistive-technology-relevant instance of a control not doing what its accessible name and live-region announcement ("Date of birth, sorted ascending") imply it does at document scope.

**How to reproduce:**
1. Open Animals on holding (34 animals, page size 25).
2. Click "Date of birth" to sort ascending.
3. Note the first 25 rows are correctly ordered.
4. Go to page 2 — the remaining 9 are in their original (registration) order, not a continuation of the date sort.

**Expected behaviour:** Either sort the complete dataset (server round-trip, or a client-side sort applied before pagination slices it) or make the page-scoped nature of the sort explicit and disable/hide sorting whenever more than one page of results exists.

**Recommended fix:** Cheapest correct fix for a dataset this size: sort server-side before pagination (mirror the existing `sort` query-param pattern already used on the error-record route) so "sorted" always means "sorted across all matching records." If client-side sort must stay, at minimum disable it when `pagination` is present, with a visible note explaining why.

**Acceptance criteria:** With more than one page of results, activating a sort control either reorders records across all pages consistently, or the control communicates — visibly and to assistive technology — that it applies to the current page only.

---

### [Medium] Scrollable table region isn't independently keyboard-focusable, per the WAI-ARIA scrollable-region pattern

**Stage:** Should fix before production

**WCAG:** 2.1.1 Keyboard (A) — the scrolling mechanism itself has no keyboard path

**Location:** `animals-on-holding.html:167` — `<div class="app-dashboard-table-wrapper">`.

**Problem:** At narrow widths the table clips (see the Reflow finding above); the wrapper does scroll, but only via mouse drag, trackpad, or touch. It carries no `tabindex="0"`, no `role="region"`, and no `aria-label`. Confirmed by test: tabbing through the page does reach the wrapper's contents indirectly — focusing a sort button in a clipped column does auto-scroll it into view — but data cells in columns 2 through 6 (date of birth, age, date on holding, sex, breed) contain no focusable element at all, so a keyboard user has no way to deliberately bring those specific cells into view on demand.

**User impact:** A sighted keyboard-only user (e.g. a motor-impairment or switch-access user) at a narrow viewport can only see clipped data columns by accident, via whichever header sort button happens to scroll them into frame — there is no direct, discoverable way to scroll the table itself.

**How to reproduce:**
1. Narrow the viewport below ~900px.
2. Tab through the page using only the keyboard.
3. Try to bring the "Breed" column's data cells into view without using a mouse.

**Expected behaviour:** The scrollable container itself is a keyboard-operable region, per the WAI-ARIA APG's scrollable-region-with-nested-interactive-content pattern.

**Recommended fix:** Add `tabindex="0" role="region" aria-label="Animals on holding table"` to `.app-dashboard-table-wrapper`, so it receives focus in tab order and native arrow-key scrolling applies to it directly.

**GDS consideration:** This is the documented WAI-ARIA Authoring Practices pattern for exactly this situation (a scrolling container holding non-interactive content), referenced directly in GOV.UK Frontend's own table guidance for wide tables.

**Acceptance criteria:** The table wrapper appears in the tab order; once focused, arrow keys scroll it horizontally; it announces as a labelled region to assistive technology.

---

### [Medium] Breed abbreviation expansion is mouse-hover only

**Stage:** Backlog / enhancement

**WCAG:** Not a direct SC failure (native `title` tooltips are a documented platform limitation, exempt from 1.4.13) — flagged as a real usability gap for the audit's cognitive-accessibility remit

**Location:** `animals-on-holding.html:160` — `<abbr title="...">HO</abbr><span class="govuk-visually-hidden">, Holstein Friesian</span>`.

**Problem:** Screen reader users get the full breed name via the visually-hidden companion span — that half works. But `<abbr>` is not natively focusable and its `title` only surfaces on mouse hover, so sighted keyboard-only and touch users see a dashed-underline "HO" that visually promises more information but can never be triggered without a mouse.

**User impact:** Keyboard-only and touch users (motor impairment, switch access, tablets) cannot ever see what "HO" or "HOX" stands for, despite the visual affordance suggesting they can.

**How to reproduce:**
1. Open Animals on holding.
2. Using only Tab/keyboard (no mouse), try to reveal what a breed code like "HOX" means.

**Expected behaviour:** The expansion is available to every input modality, not just mouse hover.

**Recommended fix:** Simplest: don't abbreviate at all — a column this narrow doesn't demand it — show "Holstein Friesian" and drop the code, or show "Holstein Friesian (HO)" so the full name is always visible without interaction.

**Acceptance criteria:** The full breed name is visible to sighted users regardless of input device, without requiring hover.

---

### [Medium] MoJ sub-navigation focus indicator is a thin underline, inconsistent with the GDS-standard yellow focus state used everywhere else

**Stage:** Fix as part of normal engineering work

**WCAG:** 2.4.7 Focus Visible (AA) is technically met; flagged for consistency under §12 GDS review

**Location:** `.moj-sub-navigation__link`, present on all four pages' tri-tab navigation.

**Problem:** Measured directly: every other focusable element on these pages (links, buttons, sort headers, pagination) gets the standard GOV.UK focus treatment — a solid yellow background plus a black box-shadow border. The MoJ sub-navigation link instead gets `box-shadow: none`, a transparent outline, and only a 5px black `::before` bar. It's a legitimate, visible indicator on its own, but it's a materially weaker, differently-styled signal sitting one hop away in the same nav cluster as fully GDS-styled tabs.

**User impact:** Low-vision users scanning for "the yellow box" as their learned focus cue can miss that the sub-navigation tab is focused at all, since it doesn't match the pattern the rest of the page trained them to look for.

**Recommended fix:** Apply the standard govuk-frontend focus mixin (background `govuk-functional-colour(focus)` + box-shadow border) to `.moj-sub-navigation__link:focus` rather than the component's default underline-only state.

**GDS consideration:** MoJ Frontend and GOV.UK Frontend focus states should read as one system when both appear on the same page; this is a component-boundary seam showing through.

**Acceptance criteria:** Tabbing to a sub-navigation link produces the same yellow-background-plus-border focus treatment as every other link on the page.

---

### [Medium] "Sign out" is a non-functional placeholder link on every page

**Stage:** Blocker before production

**WCAG:** Robustness / expected-behaviour — no SC citation for the placeholder state itself, but the control's eventual real behaviour will need 2.4.4 (Link Purpose) and likely a confirmation step

**Location:** All four views — `govukServiceNavigation`'s `navigationEnd` slot: `<a class="govuk-service-navigation__link" href="#">Sign out</a>`.

**Problem:** Reasonable for a prototype at this stage, and not something to fix now — flagged because it's easy to forget this is the account-exit control present in the persistent header of every page in the service, and an empty `href="#"` gives keyboard and screen reader users no indication anything is wrong when it does nothing.

**Recommended fix:** Before this progresses past prototype: wire it to a real sign-out route (ideally a POST, per GDS session-security convention, not a bare GET link) and remove the placeholder `href="#"`.

**Acceptance criteria:** "Sign out" performs a real sign-out action and is no longer a dead link.

---

### [Low] Header, sub-navigation and notification-banner markup is copy-pasted across all four templates instead of shared

**Stage:** Fix as part of normal engineering work

**Location:** All four view files repeat the identical `govukHeader`/`govukServiceNavigation` block, the identical `moj-sub-navigation` list (with only the `aria-current` position differing), and — on two pages — an identical notification banner.

**Problem:** This is the direct cause of the High-severity landmark bug above (H1): because the header is redefined per-page rather than inherited, a fix applied to one page's copy silently doesn't apply to the other three. The sub-navigation has the same risk profile — a future fifth page is one paste-and-forget away from a wrong `aria-current`.

**Recommended fix:** Extract the sub-navigation into a Nunjucks macro or partial parameterised by "current page," and let the header live only in `layouts/main.html` (see H1). This is the standard maintainability lever the audit brief's §14 asks for — accessibility behaviour that depends on how consistently four different files happen to be kept in sync is a regression waiting to happen.

**Acceptance criteria:** Header and sub-navigation markup exist in exactly one place each, parameterised per page, not duplicated per view.

---

### [Low] Search hint text doesn't explain the sex-filter's exact-match behaviour

**Stage:** Backlog / enhancement

**Location:** `app/routes/steel-thread-v3.js:160-173` — the search matches ear tag/breed by substring, but sex only on an exact "male"/"female" token.

**Problem:** The hint text ("search by sex or breed") doesn't distinguish this from the substring matching used elsewhere, so a user typing "fem" gets zero sex-filtered results with no explanation why, while the same partial-word approach works for breed.

**Recommended fix:** Either make sex matching consistent (substring, like the rest) or state the exact-match requirement in the hint text.

---

### [Low] Redundant `title="Search"` attribute on an already-labelled input

**Stage:** Backlog / enhancement

**Location:** `animals-on-holding.html:88`.

**Problem:** The input already has a correctly associated `<label for="search-reservations">`; the extra `title` attribute is inert in most browser/AT pairings (label wins) but is dead weight that occasionally surfaces as a redundant tooltip, and invites confusion for a future editor who assumes it's doing something.

**Recommended fix:** Remove the `title` attribute.

---

### [Low] "No sire details recorded" fallback breaks the summary-list DOM pattern used everywhere else

**Stage:** Backlog / enhancement

**Location:** `animal-details.html:148-151`.

**Problem:** Every other data section on this page renders a `<dl class="govuk-summary-list">`; the "no sire" branch instead renders a plain paragraph. Not a WCAG violation, but an inconsistent pattern between conditional branches that a screen reader user navigating by "list" or "definition list" element type would experience as the sire information sometimes existing structurally and sometimes not.

**Recommended fix:** Keep the same summary-list wrapper in both branches, with the "no sire" row using a single "Sire details — Not recorded" row.

---

## 4. Prioritised fixes

### P0 — Must fix

None. No finding in this audit blocks completion of the critical path outright — no keyboard trap, no unlabelled form control, no unreachable interactive element.

### P1 — Fix before production

- Remove the duplicated header block from all four templates; restore the `banner` landmark *(fixes H1 — smallest change with the largest landmark-navigation payoff)*.
- Constrain the herd table's overflow to itself so the page stops scrolling horizontally below ~900px *(H2)*.
- Replace the sprite-hidden search button with an inline SVG + visually-hidden text *(H3)*.
- Give the cattle-details back link a real `href` *(H4)*.
- Sort the full result set, or disable sort under pagination *(M1)*.

### P2 — Fix as part of normal engineering work

- Make the table wrapper a focusable, labelled scroll region *(M2)*.
- Align the MoJ sub-navigation focus style with the GDS standard *(M4)*.
- Extract the header and sub-navigation into shared partials/macros *(L1 — also closes off recurrence of H1)*.

### P3 — Nice to have / pre-production checklist

- Show full breed names instead of a hover-only abbreviation *(M3)*.
- Wire "Sign out" to a real route before this leaves prototype *(M5)*.
- Clarify or fix the sex-search matching rule *(L2)*; drop the redundant `title` attribute *(L3)*; make the no-sire fallback consistent *(L4)*.

---

## 5. Summary

### Key strengths

- Near-total reliance on audited GOV.UK Frontend and MoJ Frontend components (summary lists, notification banner, pagination, sortable table, summary cards) rather than bespoke reimplementations — this is why the defect count is as low as it is.
- Contrast is strong throughout: every text/background pairing measured (body text, links, tags, captions) clears AA by a wide margin, several at 9:1 or higher.
- The error-record summary cards give each record its own heading, which is correct use of the pattern and genuinely helps screen reader users jump between records.
- No keyboard traps anywhere in the four views; every interactive control is reachable and operable by keyboard alone.
- The search results count is correctly wired to a live region, so filtering the herd list is announced to screen reader users without a page reload.

### Biggest risks

- The landmark bug (H1) is invisible in ordinary manual testing — it only surfaces via automated landmark scanning or actual screen reader navigation, meaning it could easily still be present when this service reaches a formal accessibility statement audit.
- The custom CSS layered on top of GOV.UK Frontend (the table wrapper, the search button) is where every High-severity finding lives — the audited components underneath are sound. Future ad-hoc styling carries the same risk pattern.
- Duplicated markup across the four templates (L1) means a fix applied to one page doesn't propagate — exactly what produced H1 in the first place.
- The sort/pagination mismatch (M1) is a data-integrity issue as much as an accessibility one, and will only get worse as the herd size (and page count) grows.

### Top 10 fixes, by impact

1. Delete the duplicated header block in all four views — restores the `banner` landmark service-wide in one small change.
2. Constrain the herd table's overflow so the page itself stops scrolling horizontally under 900px / at 400% zoom.
3. Replace the search button's background-image sprite with an inline SVG + visually-hidden label.
4. Give the cattle-details back link a real, working `href`.
5. Sort the complete result set server-side, or disable the sort control when results are paginated.
6. Make the table wrapper a keyboard-focusable, labelled scroll region.
7. Bring the MoJ sub-navigation focus style in line with the rest of the page.
8. Extract the header and sub-navigation into a single shared partial, parameterised per page.
9. Stop hiding breed names behind a mouse-only tooltip.
10. Wire "Sign out" to a real route ahead of any production milestone.

### GDS alignment

Strong where it counts most: the service leans on GOV.UK Frontend and MoJ Frontend components rather than reinventing them, and the pages that are pure component composition (holding details, animal error record, cattle details) are close to exemplary. The gap is in the custom layer bolted on around those components — the herd table's wrapper CSS and the search control both predate or diverge from current GDS patterns, and the header override pattern undermines a landmark structure GOV.UK Frontend otherwise provides for free. None of this reflects a wholesale departure from GDS; it reflects a small number of specific seams where custom code meets the design system.

### Testing gaps — not verified in this audit

- Real screen reader software (NVDA, JAWS, VoiceOver) — assessed via rendered DOM/ARIA tree and axe-core, not a live AT session
- Physical mobile devices — reflow tested via emulated viewports, not real hardware/OS combinations
- Cross-browser testing (Safari, Firefox, Edge) — testing ran on Chromium only
- User testing with disabled users
- The One Login authentication journey (`_deprecated/`) — explicitly out of scope for this audit
- `prefers-reduced-motion` behaviour beyond confirming no CSS transitions/animations exist on these four pages to begin with
- Server response under real network latency (loading-state accessibility) — the prototype backend responds effectively instantly

---

*Audited routes: `/steel-thread/v3/holding-details` · `/animals-on-holding` · `/animal-error-record` · `/cattle/:earTagNumber` — `app/views/steel-thread/v3/_deprecated/` excluded per scope.*

*Automated tooling: axe-core 4.10.2 via Playwright (Chromium), against WCAG 2.1A/AA, 2.2AA and best-practice rule sets.*
