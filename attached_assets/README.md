# attached_assets/

Optional **working-reference** files for local development (for example screenshots, branding notes, or design references). Nothing in this folder is required to run the app.

## Purpose

Files here are **working references only** — they are not served by the application and are not imported by any source code.

## What lives here vs. `artifacts/accessibility-now/public/`

| Location | Purpose |
|---|---|
| `attached_assets/` | Local working references, not served |
| `artifacts/accessibility-now/public/` | Application assets — served at runtime (favicon.svg, opengraph.jpg, robots.txt, sitemap.xml) |

The production images (`favicon.svg`, `opengraph.jpg`) were derived from reference files in this directory and committed into `artifacts/accessibility-now/public/` where they are correctly served by the Vite dev server and production build.

## Media asset guidance

- **Images used by the app** → copy into `artifacts/accessibility-now/public/` and reference via root-relative URL (e.g. `/favicon.svg`)
- **Audio/video files > 1 MB** → host on a remote CDN (e.g. Cloudflare R2, AWS S3, Cloudinary) and reference via HTTPS URL — do not commit binary media files > 1 MB to the repo
- **Audio/video files < 1 MB** → may be committed to `artifacts/accessibility-now/public/` if genuinely needed at runtime

## Do not

- Import files from this directory in application source code
- Rely on this directory being present in production
- Commit large binary files here (the repo is not a media CDN)
