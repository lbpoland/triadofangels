# ToA content pipeline

This directory now holds the structured-content source layer for the site.

## Current authority model
The project is now split into three content tiers:

1. **Authoritative structured content**
   - `content/source/music-library.authoritative.json`
   - `content/source/publishing-library.authoritative.json`

2. **Built runtime modules**
   - `js/generated/music-library.data.js`
   - `js/generated/publishing-library.data.js`

3. **Generated reference snapshots**
   - `content/generated/*.json`

Runtime pages still consume the existing helper surfaces in:
- `js/data.js`
- `js/publishing-data.js`

But those helpers now sit on top of generated runtime modules instead of hand-authored catalog blobs.

## Why this matters
The site already behaves like a generated content platform for:
- albums
- tracks
- books
- series
- sagas

Moving catalog ownership into structured content files is a safer long-term model than storing all truth inside large runtime JS modules.

## Current workflow
1. Edit the authoritative content JSON truthfully.
2. Run `npm run toa:content:build`.
3. Run `npm run toa:qa`.

`npm run toa:qa` now rebuilds generated content artifacts automatically before validation.

## Directory contents
- `content/source/` — authoritative structured content files
- `content/generated/` — normalized generated JSON snapshots and catalog index
- `content/schemas/` — source/snapshot schema references

## Future target
Move generator/controller ownership further toward the structured content source layer while keeping the current canonical route model stable.


## Architecture elevation 04
The content build now produces four useful generated artifact families:
- runtime data modules (`js/generated/*.data.js`)
- runtime index modules (`js/generated/*.indexes.js`)
- generated reference snapshots and relations (`content/generated/*.json`)
- a content build manifest (`content/generated/content-build-manifest.json`)

That means the content pipeline now preserves both runtime compatibility and machine-readable ownership diagnostics.

## Generated authority-support artifacts
- `content/generated/music-library.entities.json` — flattened music entity/track catalog for controller-safe consumption
- `content/generated/publishing-library.entities.json` — flattened publishing entity/relationship catalog
- `content/generated/source-authority.index.json` — source/runtime/generated ownership index for reconstruction

## Architecture elevation 06
The content build now also emits:
- `content/generated/catalog.controller-contracts.json` — route/controller ownership map for runtime helper surfaces
- `content/generated/content-authority-report.json` — source/runtime/generated governance summary
- richer generated lookup modules with canonical-path and nested entity resolution

Runtime helper modules still preserve their public contract, but they now resolve through generated lookup artifacts first.

## Architecture elevation 07
The source layer now includes collection-readiness manifests:
- `content/source/music-library.collections.manifest.json`
- `content/source/publishing-library.collections.manifest.json`

The build now emits:
- `content/generated/source-collections.index.json`
- `content/generated/source-collection-readiness.json`

These do not perform a risky full source split yet. They define how the current authoritative source files map to future normalized collections while preserving route/entity ownership.

## Architecture elevation 08
The content pipeline now understands collection-aware input manifests under `content/source/music/` and `content/source/publishing/`.

The build now emits:
- `content/generated/source-collection-build-inputs.json`
- richer direct controller-contract expectations inside `content/generated/catalog.controller-contracts.json`

Search-page-specific scope-chip and finder-input ownership also moved further into `css/search-utility.css`, reducing shell-layer overlap.

## Architecture elevation 09
The builder now consumes collection-aware stub directories and input manifests as optional governance inputs without changing live authoritative runtime ownership.

The build now emits:
- `content/generated/source-collection-consumption.json`

The publishing series and saga controllers now adopt dedicated controller-record resolvers instead of manually reconstructing their context from lower-level bridge helpers.

Shell governance now emits a richer enforcement report with anomaly classes, remediation classes, and explicit coverage policy output.

## Architecture elevation 10
The builder now recognizes optional collection-entry JSON files inside the collection stub directories as governed inputs without changing the live authoritative source model.

The build now emits:
- `content/generated/source-collection-entry-consumption.json`

This keeps future source normalization safer by recording discovered collection-entry files, mapped collection identity, and authority-match status before any risky authoritative split.

The publishing library page now reads its top-level catalog sets directly from generated runtime modules and uses resolver-backed saga/series lookup contracts, reducing reliance on bridge-owned arrays.

## Architecture elevation 11
Non-detail runtime pages now have dedicated helper modules:
- `js/music-page-helpers.js`
- `js/publishing-page-helpers.js`

That lets broader runtime surfaces adopt deterministic helper logic without importing the compatibility bridge modules directly.

Optional collection-entry governance now emits richer comparison output in:
- `content/generated/source-collection-entry-consumption.json`

Shell governance now shares policy constants through:
- `tools/toa-shell-policy.mjs`

This improves exception handling and keeps shell audit / ledger classification logic aligned.

## Architecture elevation 12
The content build now emits a dedicated search runtime contract:
- `js/generated/site-search.data.js`

That lets the search page consume a generated search-oriented dataset instead of stitching together multiple raw runtime modules directly.

The collection stub directories now also support optional `entries.manifest.json` files for future split preparation. The builder records both discovered entries and manifest-declared entries so future normalization can compare intent vs reality safely before any authoritative migration.


## Architecture elevation 13
The search page now consumes a stronger generated runtime contract that includes pre-shaped track search records and search summary counts:
- `js/generated/site-search.data.js`

Optional collection-entry governance now records richer mismatch classification and per-collection readiness diagnostics in:
- `content/generated/source-collection-entry-consumption.json`

Shell governance now emits area-level remediation summaries in:
- `reports/shell-audit/shell-area-remediation-summaries.json`

## Architecture elevation 17
Search/runtime contract enforcement is now stricter and more explicit.

The build now emits richer governed metadata in:
- `content/generated/search-runtime-contract.json`
- `content/generated/catalog.controller-contracts.json`
- `content/generated/content-authority-report.json`
- `content/generated/source-collection-authority-readiness.json`

New useful governed fields include:
- required search-result fields by dataset
- canonical field ownership by dataset
- consumer expectations for `js/search-page.js`
- page-family governance for albums, tracks, books, series, and sagas
- authority-level dominant mismatch family, readiness distribution, clean-match ratio, unresolved-entry ratio, declared/discovered divergence, comparison reason codes, and comparison notes

Shell governance now emits a more actionable consolidated policy report in:
- `reports/shell-audit/shell-policy-consolidated.json`

That report now distinguishes real route families such as album routes, track routes, publishing route families, search surfaces, games surfaces, and root shell surfaces instead of collapsing everything into a single coarse bucket.

Homepage-only Now Live deck ownership also moved farther out of shared core CSS and into:
- `css/home.css`



## Architecture elevation 18
The content pipeline now emits family-level canonical-route validation under:
- `content/generated/catalog.route-validation.json`

The build also now records stronger per-family contract metadata in:
- `content/generated/catalog.route-ownership.json`
- `content/generated/catalog.controller-contracts.json`
- `content/generated/content-authority-report.json`
- `content/generated/search-runtime-contract.json`

New useful governed fields include:
- route prefix ownership by family
- controller resolver export ownership by family
- detail/list consumer expectations by family
- route-validation refs for albums, tracks, books, series, and sagas
- canonical collision and invalid-prefix diagnostics
- relation-warning diagnostics for track/series/book family bindings

The publishing library page also moved book-href shaping farther into:
- `js/publishing-page-helpers.js`

That reduces page-local helper ownership and makes non-detail publishing runtime behavior easier to validate safely.


## Architecture elevation 19
The content pipeline now emits explicit consumer-adoption and bridge-triage governance under:
- `content/generated/catalog.consumer-adoption.json`

The build also now records stronger adoption usefulness in:
- `content/generated/catalog.route-validation.json`
- `content/generated/catalog.route-ownership.json`
- `content/generated/catalog.controller-contracts.json`
- `content/generated/content-authority-report.json`
- `content/generated/search-runtime-contract.json`

New useful governed fields include:
- family-level detail/runtime consumer adoption summaries
- domain-level compatibility-bridge diagnostics for music and publishing
- shared search-page consumer adoption status
- count-integrity vs relation-integrity route-validation summaries
- entity/route count mismatch diagnostics by family

Homepage-only trust / decision / pairing route-surface ownership also moved farther into:
- `css/home.css`

That keeps home-only route-stage presentation out of shared shell CSS while making family-consumer governance more explicit for future normalization work.


## Architecture elevation 20
The content pipeline now emits richer adoption-readiness and lawful bridge-retention usefulness under:
- `content/generated/catalog.consumer-adoption.json`

Route validation now records cleaner readiness dimensions under:
- `content/generated/catalog.route-validation.json`

The richer usefulness output now also flows through:
- `content/generated/catalog.route-ownership.json`
- `content/generated/catalog.controller-contracts.json`
- `content/generated/content-authority-report.json`
- `content/generated/search-runtime-contract.json`

New useful governed fields include:
- readiness score percentages for detail, list-runtime, shared-search, family, and overall consumer adoption
- reason-code rollups for consumer drift classification
- lawful detail-only bridge-retention classification for compatibility surfaces
- shared-search readiness status as its own route-validation dimension
- per-family consumer readiness scorecards threaded back into route validation

Homepage-only continuity/signature support styling also moved farther into:
- `css/home.css`

That keeps more homepage-only support/route styling out of shared shell CSS while making bridge-retention and adoption readiness easier to trust before any future normalization or controller hardening work.


## Architecture elevation 21
The content pipeline now emits clearer bridge-free coverage and family-comparison usefulness under:
- `content/generated/catalog.consumer-adoption.json`
- `content/generated/catalog.route-validation.json`

That richer usefulness also flows through:
- `content/generated/catalog.route-ownership.json`
- `content/generated/catalog.controller-contracts.json`
- `content/generated/content-authority-report.json`
- `content/generated/search-runtime-contract.json`

New useful governed fields include:
- domain-level bridge-free coverage summaries and coverage-label comparison
- total bridge-free vs bridge-backed consumer coverage percentages
- family-comparison rows with route-share, shared-search participation, and bridge-coverage context
- family-level domain averages for readiness and bridge-free coverage
- search-runtime summary fields for bridge coverage and family-comparison status

Homepage-only continuity-map layout ownership also moved farther into:
- `css/home.css`

That keeps the shared shell layer narrower while making bridge-retention and family-readiness comparison easier to trust before any future bridge retirement or deeper controller normalization work.
