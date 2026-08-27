# Livestock Traceability

An interactive prototype of the **Livestock Information** service, built with the [GOV.UK Prototype Kit](https://prototype-kit.service.gov.uk/docs/).

## Purpose

This repository is a design and research tool, not a production service. It's used by the DEFRA design team to explore and test concepts for the future Livestock Information service — the service that lets farmers and keepers register, report and trace livestock (cattle, sheep, pigs and other species) across their holdings.

The prototype is used to:

- turn design ideas into clickable, realistic-looking journeys quickly
- run user research sessions and gather feedback before anything is built
- give stakeholders a tangible way to review and sign off on proposed journeys
- compare alternative approaches to the same problem side by side (e.g. different versions of the same journey)

Because it's built on real GOV.UK Design System components, it looks and feels like a real service — but there's no real backend. Data entered is stored only in the browser session and nothing is saved permanently or sent to any live DEFRA system.

## Viewing content

The prototype's homepage (`/`) lists **current** prototype journeys, split into:

- **Front office** — journeys a farmer or keeper would use (e.g. cattle birth registration, reporting and viewing livestock information)
- **Back office** — journeys used by DEFRA/back-office staff (e.g. finding and viewing holding details)

Each row in these tables represents a distinct journey or concept, with columns for:

| Column | Meaning |
|---|---|
| Date | When the version was published |
| Description | What the journey/concept is |
| Tags | Status of the work (see [Tags](#tags) below) |
| Author | Who built it |
| Link | Opens the prototype journey, starting from its first screen |

### Archive

Older or superseded prototype journeys are periodically moved out of the homepage and into the **Archive** page, linked from the sub-navigation at the top of the homepage (`/archive`).

Archiving keeps the homepage focused on what's currently relevant, while preserving old journeys for reference — nothing is deleted. Prototypes end up in the archive when:

- a newer version has replaced them
- the concept was explored and parked, or superseded by a different direction
- the journey is no longer part of active research/design work

The archive is grouped by theme (e.g. Livestock movement, Vet visits, BVD Eradication, Strategic Auth, Miscellaneous), and each entry keeps its original date, description, author and link so past work stays traceable.

**When adding or replacing a journey:** add the new version to the relevant table on the homepage (`app/views/index.html`), and move any version it replaces down into the equivalent table on the archive page (`app/views/archive.html`), keeping its original date/author/tag information intact.

### Tags

The `Tags` column on the homepage and archive tables uses [GOV.UK tag components](https://design-system.service.gov.uk/components/tag/) to flag the status or milestone of a piece of work, for example:

- `UR round 1` / `UR round 2` — the version of the prototype used in a specific round of user research
- `Alpha assessment` — the version presented at an alpha assessment
- `Release candidate` — the version being considered for the next phase
- `MVP` — a minimum viable product concept
- `Current` — the version currently considered live/relevant among several variants

Tags make it possible to tell at a glance which version of a journey was used for a particular milestone, without needing to check git history. When you publish a version that reaches a milestone (a research round, an assessment, a design review), add or update its tag rather than relying on the description or date alone.

## Getting started (new developers)

### Prerequisites

- [Node.js](https://nodejs.org/) `^16.x`, `^18.x`, or `>= 20.x`
- npm (comes with Node.js)

### Setup

```bash
# Clone the repository
git clone https://github.com/defra-design/livestock-traceability.git
cd livestock-traceability

# Install dependencies
npm install

# Start the prototype in development mode
npm run dev
```

The prototype will be available at [http://localhost:3000](http://localhost:3000) (the exact port is shown in the terminal output). The `dev` script watches for file changes and reloads automatically.

Other available scripts:

```bash
npm run serve   # Serve the prototype without watching for changes
npm start       # Start the prototype kit (production-style start)
```

### Project structure

```
app/
  config.json     # Service name and prototype kit plugin config
  routes.js        # Loads every route file under app/routes/ automatically
  routes/          # One routes file per journey — add new journeys here
  views/           # Nunjucks templates, one folder per journey (often versioned: v1, v2, v3...)
  assets/          # Images, stylesheets and client-side JS
  data/            # Session/mock data used by prototype journeys
```

- Each journey lives in its own folder under `app/views/`, often with multiple version subfolders (`v1`, `v2`, ...) as the design evolves.
- Routes are split by journey under `app/routes/` and are loaded automatically — you don't need to register new route files anywhere else.
- To add a new journey: create a `views/<journey-name>/` folder for its templates and a matching `routes/<journey-name>.js` file, then link to its start page from the homepage table in `app/views/index.html`.

### Useful links

- [GOV.UK Prototype Kit documentation](https://prototype-kit.service.gov.uk/docs/)
- [GOV.UK Design System](https://design-system.service.gov.uk/)
- [Creating routes in the Prototype Kit](https://prototype-kit.service.gov.uk/docs/create-routes)

## Licence

[MIT](LICENCE.txt)
