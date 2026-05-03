# Product Roadmap — accessibility.now

Last updated: May 2026

---

## Status key

| Status | Meaning |
|---|---|
| ✅ Launched | Merged and live in production |
| 🔄 In progress | Being built right now |
| 📋 Accepted | Scoped, approved, next in queue |
| 💡 Planned | Backlog — prioritised but not yet scheduled |

---

## ✅ Launched

| Feature | Notes |
|---|---|
| Homepage with live URL audit tool | Playwright + axe-core scan, score card, violations list |
| Audit result page (`/audit-result`) | Score gauge, severity breakdown, PDF download |
| Services pages (Audits / Remediation / Monitoring) | Full copy, animated sections |
| EAA page (`/eaa`) | Timeline, scope, directive explainer |
| Work / case studies page (`/work`) | 3 case study cards |
| About page (`/about`) | Team bio, brand story |
| Contact page (`/contact`) | Lead capture form → `POST /api/leads` |
| Pricing page (`/pricing`) | 3-tier cards (Free / €3,500 / €890/mo), FAQ accordion |
| Tools — Contrast Checker (`/tools/contrast-checker`) | WCAG AA/AAA pass/fail, live preview |
| Tools — Focus Order (`/tools/focus-order`) | Playwright-driven tab-order visualiser |
| Tools — Screen Reader Preview (`/tools/screen-reader`) | ARIA tree + reading-order render |
| Monitoring dashboard (`/monitor/:token`) | Score history, trend chart (Recharts), scan log |
| WCAG 2.1/2.2 Developer Guide (`/resources/wcag-guide`) | POUR principles, 24 AA criteria tables |
| EAA Compliance Checklist (`/resources/eaa-checklist`) | 42 items, 5 sections, localStorage, progress bars |
| Blog (`/resources/blog`) | Index + 3 full articles (EAA enforcement, e-commerce failures, automated vs manual) |
| Privacy Policy (`/legal/privacy`) | Full GDPR-compliant, 11 sections |
| Accessibility Statement (`/legal/accessibility`) | Conformance table, AT test matrix, known issues |
| API Server (`/api`) | Express 5, Drizzle ORM, Playwright scan engine |
| PostgreSQL database | 4 tables: audits, leads, monitored_urls, monitoring_scans |
| PDF report generation | `GET /api/audit/:id/pdf` via PDFKit |
| Email notifications | nodemailer, no-op when SMTP vars absent |
| GitHub sync via post-merge | Token-auth push on every merge |
| Docs suite | design.md, roadmap.md, memory.md, admin.md, README |
| Drizzle migration files | Versioned SQL in `lib/db/migrations/` |

---

## 🔄 In progress

| Feature | Task | Notes |
|---|---|---|
| Docs, migrations, assets & GitHub sync | #37 | This task |
| Redesign About page | #42 | Less text, more visual — blocked on #37 |

---

## 📋 Accepted / Coming soon

| Feature | Task |
|---|---|
| Apply new design to Resources and Legal pages | #38 |
| EAA Checklist PDF download | #43 |
| Blog article author bylines + reading time | #44 |

---

## 💡 Planned backlog (Q2–Q3 2026)

Rough priority order:

| Priority | Feature | Task | Why |
|---|---|---|---|
| 1 | Add a 'Talk to us' contact form on Pricing page | #39 | Direct conversion path from Pricing |
| 2 | Show score trend chart on first scan | #34 | UX — currently hidden until 2+ scans |
| 3 | Show comparison table of all three pricing tiers | #40 | Reduces bounce on Pricing page |
| 4 | Send real monitoring emails when scan results are ready | #32 | Core monitoring feature |
| 5 | Export WCAG checklist results as PDF | #43 | Stakeholder reporting |
| 6 | Share contrast check / audit result via permalink | #35 | Viral / referral channel |
| 7 | Add Tools section to homepage as feature teaser | #36 | Surface discoverability |
| 8 | Add WCAG 2.2 criteria to interactive checklist | #33 | Content completeness |
| 9 | Cache focus-order results for repeated scans | #30 | Performance — Playwright cold-starts are slow |
| 10 | Share focus-order analysis via permalink | #31 | Like contrast checker share feature |
| 11 | Show reading-order score and export in Screen Reader Preview | #29 | Adds quantitative value to tool |
| 12 | Let users cancel/pause monitoring | #27 | User control — currently no way to stop |
| 13 | Keep GitHub backup credentials fresh | #41 | Ops hygiene — token rotation |

---

## Technical debt notes

- `drizzle-kit push` was used for schema changes during initial development; migrations are now generated but the push script is retained for local dev convenience
- Orval `mode: "single"` was chosen to avoid TypeScript naming conflicts — do not change to split mode without auditing all generated type names
- Playwright browser binaries are installed on every merge via `post-merge.sh` — acceptable for now but slow (~30s); consider caching if deploy time becomes an issue
