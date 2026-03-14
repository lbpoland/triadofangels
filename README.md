# Triad of Angels — Live Site Repo

This repository is the production source for the static Triad of Angels / ToA Studios website.

## What belongs here

- live HTML, CSS, JS, assets, and templates
- the current sync / QA / release toolchain
- a small maintainer doc set that describes the real live system

## What does not belong in the active repo surface

- old AI pass notes
- wave paperwork
- signoff ledgers
- patch manifests
- recap reports
- historical blueprint doctrine

Historical process material is quarantined under `_archive/`.
Unused, non-production assets are quarantined under `_archive/assets-vault/`. Current asset-audit outputs live under `reports/asset-audit/` and now count same-site absolute asset URLs as live references.

## Core commands

```bash
npm run toa:refresh
npm run toa:qa
npm run toa:sync-layout
npm run toa:release
```

Use `npm run toa:refresh:with-head-normalize` only when importing or repairing external HTML that may contain malformed `<head>` markup.

## Single-source layout system

- `templates/toa-header.html`
- `templates/toa-footer.html`

These are the only authoring sources for the shared header and footer.
Every page receives generated header/footer markup inside protected marker regions via `tools/toa-layout-sync.mjs`.

## Docs to trust

- `docs/HEADER_FOOTER_SYNC_SYSTEM.md`
- `docs/MENUS_AND_DROPDOWNS.md`
- `docs/TOOLS_REFERENCE.md`
- `tools/TOA_REFRESH_PIPELINE.md`

Everything else that is historical or experimental has been moved under `_archive/`.
