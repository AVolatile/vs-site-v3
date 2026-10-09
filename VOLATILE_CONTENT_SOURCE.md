# Volatile Content Source — Anthony Volatile / Volatile Solutions

Recorded: October 7, 2026. Asset and visual decisions A1–A7 added October 8, 2026. English Projects copy, production image families and alt text approved October 8, 2026; see B2.

**This file stores factual source material. It is not final website copy, a redesign, a marketing exercise, or authorization to begin migration.**

# Current Phase 2 inquiry workflow — October 9, 2026

The user reports the full Phase 1 workflow is verified on live staging: Identity/admin roles, Neon, intake, list/detail, status/notes and filtering/sorting. Phase 2 explicitly approves a same-route List/Pipeline switch and private persistent inquiry activity. The earlier Kanban deferral is superseded only for this scope; automation, proposals, uploads, reminders, tasks, portal and advanced analytics remain deferred.

Pipeline uses seven existing status columns (New through Lost), excludes Archived, reuses detail and the protected update endpoint, and supports drag/drop plus a labeled non-drag Move control. List stays the default and keeps archived/filter/sort access. View/detail context lives in the URL with Back/Forward support. Counts derive from returned records; card summaries contain no notes or activity.

Migration `002_create_inquiry_activity.sql` is new; `001` remains unchanged. Creation, actual status changes and actual note changes are recorded atomically on the server with system/admin actors. Full notes are not copied into history. Old records are not backfilled and show "No activity recorded yet." Archiving retains history. Apply `002` manually to the intended Neon branch before deploying Phase 2. This pass performs no Neon migration. Full operational/API contracts are in `INQUIRY_ADMIN_SETUP.md`.

# Historical inquiry and admin foundation — October 8, 2026

The user explicitly approved a public project inquiry wizard, server-side Netlify Functions, Neon persistence and the initial private Netlify Identity admin workspace. This supersedes earlier mailto-only/no-admin/no-auth/no-Neon restrictions only for this Phase 1 scope. No real database connection, migration, Identity user, invitation or deployment was created: DATABASE_URL and a linked Netlify project were absent locally.

- Public route `/start-a-project/`: five steps (project type; contact/business; summary/help/stage; budget/timeline; review/consent). Required fields, adjacent errors, Back/Edit, keyboard focus, value preservation, explicit submit, loading/disabled controls, stable retry UUID, successful receipt state and failure/email fallback. Copy and editable ranges live in `src/data/inquiry.json`; no prices or delivery promises are added.
- Updated five business-intent CTA contracts: navigation Start a Project (both header states/drawer), hero Work With Me, Services Discuss a Project, About Let's Work Together and portfolio closing Start a Project → `/start-a-project/`. Footer Get in Touch remains company email. All portfolio items/filters/images/destinations, View My Work, phone, socials and legal links remain unchanged.
- Modern Functions in `netlify/functions/` handle public POST and protected list/detail/PATCH through explicit `/api/inquiries` and `/api/admin/inquiries[/<uuid>]` aliases before existing general routing. Shared strict Zod validation rejects enum/type/length/email/URL/consent/mass-assignment errors; bounded body reading, honeypot, minimum timing and native per-IP rate limit provide basic spam protection. Error responses/logs exclude database/identity secrets and exception details. Every private request verifies Identity getUser plus admin role before database access; mutations also require same-origin requests.
- Server-only `netlify/lib/inquiry-store.ts` uses @neondatabase/serverless and Functions-scoped DATABASE_URL. Parameterized queries create/list/get/update. `database/migrations/001_create_inquiries.sql` creates the minimal UUID-based table with source, consent timestamp, status, notes, unique submission key/fingerprint and indexes; no seeds/drop/delete. Identical retries return the same receipt; stale private edits conflict instead of overwriting notes. Date-object milliseconds are preserved for updatedAt checks.
- Private route `/admin/`, public login/callback shell `/admin/login/`: @netlify/identity email login, invitation/password-recovery handling, no signup UI or automatic admin assignment. Dashboard metrics derive from actual rows; list supports status filtering, newest/oldest/status sorting and 25-row pages; detail includes submitted fields, email action, eight approved statuses and private notes. Logout/authorization failures clear data/notes/contact hrefs; keyboard focus returns to the selected row or login form as appropriate. Admin uses Nova tokens with a minimal private layout, no public navigation entry/analytics and noindex/nofollow; excluded from sitemap. CDN admin-role gates have a login fallback; API authorization stands independently.
- Added compatible packages: @netlify/identity 2.0.0, @netlify/functions 6.0.2, @neondatabase/serverless 1.2.0; development @netlify/vite-plugin 3.0.1. Astro remains static with existing build behavior, English-only scope and Polish redirects. Dev-only API alias middleware mirrors production while disabling local CDN role/image/header emulation. `.env.example` documents only an empty DATABASE_URL key; local env/Netlify artifacts are ignored. Public Layout forwards recognized Identity callback fragments to login without putting the Identity SDK or database access into public markup.
- Full schema, exact source files, environment/configuration prerequisites and manual invitation/role/migration steps are in [INQUIRY_ADMIN_SETUP.md](INQUIRY_ADMIN_SETUP.md). Invite-only setup and real Identity cookies/callback/session/CDN checks require a configured deployment. Role assignment applies on next login or token refresh, not immediately. No real Neon test is claimed.
- **Validation:** all 76 data JSON files parse; Astro/TypeScript checks 417 files with zero errors; the safe temporary static build emits eight public/admin pages; both Functions bundle through Netlify's esbuild bundler. The 31 inquiry/auth/persistence-contract tests plus 11 URL tests pass (42 total); data/import/registration/motion checks pass. Atomic audit retains only the untouched ChecklistItem margin violation and HeroSplit advisory. No broad QA subprocess or asset generator is run.
- **Browser/credential boundary:** public wizard checks at 320/375/430/768/1024/1440px pass five-step validation, Back/Edit preservation, plain-text review, consent, disabled controls, double-submit prevention, stable-key mocked failure/retry/success, keyboard and Astro client-router entrance. Mocked admin checks pass real SDK login against intercepted synthetic responses, list/status/sort/detail, note/status failure/conflict/save, keyboard focus, logout cleanup and all six widths without overflow/runtime errors. These are explicit mocks, not real Identity or Neon success. Real local Functions return public invalid-payload 422, missing-database 503, unauthenticated read/update 401 and forged-role-cookie 401. No live DB credentials, migration, account/invitation or deployment are used. Client build contains no DATABASE_URL/Neon driver/connection string; admin HTML contains no private records and admin is excluded from sitemap. Final hashes preserve all existing image/legacy assets and the portfolio's 134 entries/42 thumbnails/48 contained boards. Changes are 13 existing source/config/document files plus 21 additions, listed in INQUIRY_ADMIN_SETUP.md.
- Deferred: kanban, email notifications/automation, uploads, proposals, client portal, advanced analytics and CRM automation. No fake lead/customer records, outbound emails or new image assets are included.

# Current portfolio regression correction and thumbnail restoration — October 8, 2026

Explicitly authorized correction of the earlier blanket imageFit assignment and a narrow thumbnail inventory expansion. This supersedes the prior 98-contain decision and six-thumbnail count. The user specifically confirmed **cover for all non-brand-board cards, including advertising/PVD**, resolving the conflict with the request to leave those cards visually unchanged. Their artwork, descriptions, classification and card shell remain unchanged; their card crop/fill intentionally changes to cover.

## Presentation rules and regression cause

The earlier pass preserved a global contain rule by explicitly assigning contain to all 98 entries. That produced letterboxing and reduced image scale for websites/apps, while thumbnail art remained inside a generic 4:3 frame. The correction assigns contain only to the 48 inspected multi-panel identity boards. The 50 preexisting non-board records now use cover; the 36 restored thumbnails also use cover. **Final fit audit: 48 contain / 86 cover, 134 total.**

- The 48 brand boards keep their warm Nova cream surface, centered 94% picture with 3% inset, unchanged 4:3 outer frame, and no image zoom. Ledger & Loom, Ember & Fig and FlowPilot remain fully visible.
- Websites, apps and advertising/PVD use cover in the existing full 4:3 frame, with their existing hover behavior. Mula alone uses optional `imagePosition: "center top"` to retain its upper wordmark while filling the frame. Other images use center positioning. This controls CSS object-position through the same card renderer rather than project-specific selectors.
- All 42 thumbnails use optional `mediaAspect: "16:9"`. Their picture fills the frame with cover and no hover zoom, preserving the native near-16:9 composition (1672×941, differing from exact 16:9 by less than 0.1%). No inset or added background bars; the rest of the card markup, radius, text and CTA styling remain. The thumbnail card category now correctly reads YouTube Thumbnails rather than the historical Ads & Social cardLabel.
- Optional type fields are imageFit, imagePosition and mediaAspect; imageFit defaults to cover and mediaAspect absence retains 4:3. The existing PortfolioCollection, SmartImage, filters/history, Show More, assets and complete View Artwork destinations are reused. No new component/library, global styles, routes, SEO, homepage/localization or navbar changes.

## Narrow thumbnail inventory

A fresh recursive legacy filename/folder audit found **42 decoded, pixel-distinct PNGs**, all 1672×941, under `legacy-assets/Graphic Design/Thumbnails/`. Other filename matches under `legacy-assets/portfolio/` are website/product previews and do not become YouTube entries. All 42 actual thumbnail compositions were visually reviewed. There are no exact duplicates; shared series styling does not make the different headlines, portraits, subject matter and layouts duplicate work.

Six previously represented primary images remain on their original IDs, assets and descriptions. **36 individual entries added; zero new collection cards; final YouTube count 42 (previously six).** The existing six had broad topic titles but exposed only one image each, with no series gallery. The other 36 are now reachable individually through View Artwork rather than being hidden as undocumented supporting exports. Every thumbnail remains Creative Portfolio / unverified; no creator/client relationship, video publication, view count or result is invented. New descriptions describe artwork composition, including any illustrative business/finance headline, without asserting an outcome.

Visual topic audit: AI/Productivity 5; Finance 7; Faith/Lifestyle 15; Fitness 6; Food 6; Real Estate 3. Filename corrections: `ai-tools/ai-thumbnails-side-hustles-thumbnail.png` depicts Crypto Crash Ahead; `ai-tools/work-10x-faster-thumbnail.png` depicts Protect Your Crypto; `finance-investing/protect-your-crypto-thumbnail.png` depicts Work 10X Faster; the generic ChatGPT-named finance image depicts Fix Your Paycheck. Topic tags follow the artwork, not these misleading filenames.

Filter labels and IDs remain All, Websites, Web Apps & Digital Products, Branding, Advertising & Marketing and YouTube Thumbnails. Counts are **All 134 / Websites 11 / Web Apps 5 / Branding 48 / Advertising 30 / Thumbnails 42** (website/app memberships overlap). The `creative` alias still selects branding/ads/thumbnails, now 120 entries. All still opens with the original curated twelve; Show More reveals twelve at a time. All 98 prior entries stay in their original order, and the 36 additions are interleaved by visual topic at the end. Fros Lawncare, TimeDock and StillPoint remain excluded.

## Final image presentation audit

Every runtime record is listed below. Position is center unless explicitly noted; 4:3 is the unchanged default. Thumbnail 16:9 affects only the media frame. Brand-board inset affects only the contained picture.

| Project | Category membership | imageFit | Position / media frame |
| --- | --- | --- | --- |
| The Moody Brewer | Websites | cover | center; 4:3 |
| PVD Photography | Advertising & Marketing | cover | center; 4:3 |
| MetricForge | Web Apps & Digital Products | cover | center; 4:3 |
| Ledger & Loom | Branding | contain | center; 4:3; 94% board inset |
| Northline Strength | Websites | cover | center; 4:3 |
| Mula | Web Apps & Digital Products | cover | center top; 4:3 |
| Luma Spritz | Advertising & Marketing | cover | center; 4:3 |
| GlassDash | Web Apps & Digital Products | cover | center; 4:3 |
| Jobly | Web Apps & Digital Products, Websites | cover | center; 4:3 |
| Cloud Keep | Web Apps & Digital Products, Websites | cover | center; 4:3 |
| Ember & Fig | Branding | contain | center; 4:3; 94% board inset |
| Aura Active | Advertising & Marketing | cover | center; 4:3 |
| Birdie Bay | Websites | cover | center; 4:3 |
| PVD Photography — Senior Portraits | Advertising & Marketing | cover | center; 4:3 |
| FlowPilot | Branding | contain | center; 4:3; 94% board inset |
| Frost | Websites | cover | center; 4:3 |
| ScholarLink | Websites | cover | center; 4:3 |
| Kindwell | Branding | contain | center; 4:3; 94% board inset |
| Harbor & Steel | Websites | cover | center; 4:3 |
| Sable Row | Advertising & Marketing | cover | center; 4:3 |
| Northline Plumbing | Websites | cover | center; 4:3 |
| TaskNest | Branding | contain | center; 4:3; 94% board inset |
| Sonoran Comfort Systems | Websites | cover | center; 4:3 |
| Solartec | Websites | cover | center; 4:3 |
| Alder & Finch | Advertising & Marketing | cover | center; 4:3 |
| Carbon Cue | Branding | contain | center; 4:3; 94% board inset |
| Crestline Wealth Partners | Branding | contain | center; 4:3; 94% board inset |
| Luma Grove Clinic | Branding | contain | center; 4:3; 94% board inset |
| Glossline Studio | Branding | contain | center; 4:3; 94% board inset |
| Iron Vale | Branding | contain | center; 4:3; 94% board inset |
| Northline Real Estate | Branding | contain | center; 4:3; 94% board inset |
| Atlas Drift | Branding | contain | center; 4:3; 94% board inset |
| Benny's Burgers | Branding | contain | center; 4:3; 94% board inset |
| Rift Product Advertising | Advertising & Marketing | cover | center; 4:3 |
| Clip Forge | Branding | contain | center; 4:3; 94% board inset |
| Bridgewell Funding | Branding | contain | center; 4:3; 94% board inset |
| Haven Bloom Health | Branding | contain | center; 4:3; 94% board inset |
| Gravelhorn Outfitters | Branding | contain | center; 4:3; 94% board inset |
| Align & Aura | Branding | contain | center; 4:3; 94% board inset |
| HearthMark Lending | Branding | contain | center; 4:3; 94% board inset |
| Solara Stay | Branding | contain | center; 4:3; 94% board inset |
| Juniper Hearth | Branding | contain | center; 4:3; 94% board inset |
| Vanta Pulse | Advertising & Marketing | cover | center; 4:3 |
| Patchline | Branding | contain | center; 4:3; 94% board inset |
| Meridian Oak | Branding | contain | center; 4:3; 94% board inset |
| Pearl & Pine Dental | Branding | contain | center; 4:3; 94% board inset |
| MirrorBay Detail | Branding | contain | center; 4:3; 94% board inset |
| ForgeHouse Athletics | Branding | contain | center; 4:3; 94% board inset |
| KeyHaven Property | Branding | contain | center; 4:3; 94% board inset |
| Tide & Trail | Branding | contain | center; 4:3; 94% board inset |
| Copper Fork | Branding | contain | center; 4:3; 94% board inset |
| Macro Forge Meals | Advertising & Marketing | cover | center; 4:3 |
| Table Shift | Branding | contain | center; 4:3; 94% board inset |
| Penny Pilot | Branding | contain | center; 4:3; 94% board inset |
| Solenne Dermatology | Branding | contain | center; 4:3; 94% board inset |
| Route Forge | Branding | contain | center; 4:3; 94% board inset |
| GloveHouse Boxing | Branding | contain | center; 4:3; 94% board inset |
| RoomWright Studio | Branding | contain | center; 4:3; 94% board inset |
| Bloom & Brick | Branding | contain | center; 4:3; 94% board inset |
| Fry Bird | Branding | contain | center; 4:3; 94% board inset |
| Volt Electrolytes | Advertising & Marketing | cover | center; 4:3 |
| Harborline Capital | Branding | contain | center; 4:3; 94% board inset |
| Stridewell Therapy | Branding | contain | center; 4:3; 94% board inset |
| Volt Nest | Branding | contain | center; 4:3; 94% board inset |
| MacroMap | Branding | contain | center; 4:3; 94% board inset |
| SagePoint Realty | Branding | contain | center; 4:3; 94% board inset |
| Lantern Lane | Branding | contain | center; 4:3; 94% board inset |
| Hollow Cup | Branding | contain | center; 4:3; 94% board inset |
| Brew Core | Advertising & Marketing | cover | center; 4:3 |
| Wrench Run | Branding | contain | center; 4:3; 94% board inset |
| RangeLab Recovery | Branding | contain | center; 4:3; 94% board inset |
| Vale & Stone | Branding | contain | center; 4:3; 94% board inset |
| Old Harbor | Branding | contain | center; 4:3; 94% board inset |
| Crunch Forge | Advertising & Marketing | cover | center; 4:3 |
| Level Up | Advertising & Marketing | cover | center; 4:3 |
| Vyra Active | Advertising & Marketing | cover | center; 4:3 |
| Flowstate AI | Advertising & Marketing | cover | center; 4:3 |
| Revnue Admin | Advertising & Marketing | cover | center; 4:3 |
| Vault IQ | Advertising & Marketing | cover | center; 4:3 |
| Harbor Room — Local Table Night | Advertising & Marketing | cover | center; 4:3 |
| Ironwood Training Hall | Advertising & Marketing | cover | center; 4:3 |
| Juniper House — Author Evening | Advertising & Marketing | cover | center; 4:3 |
| Paper Lantern Studio | Advertising & Marketing | cover | center; 4:3 |
| Blue Harbor Advisory | Advertising & Marketing | cover | center; 4:3 |
| Hale Street Realty | Advertising & Marketing | cover | center; 4:3 |
| Stonebridge Web Services | Advertising & Marketing | cover | center; 4:3 |
| Westmere Talent | Advertising & Marketing | cover | center; 4:3 |
| Cedar Plate | Advertising & Marketing | cover | center; 4:3 |
| House of Laurel | Advertising & Marketing | cover | center; 4:3 |
| Kindred Desk | Advertising & Marketing | cover | center; 4:3 |
| Marlow Pantry | Advertising & Marketing | cover | center; 4:3 |
| North Ledger Consulting | Advertising & Marketing | cover | center; 4:3 |
| AI & Productivity Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Faith & Lifestyle Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Finance Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Fitness Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Food Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Real Estate Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Is AI Replacing Creativity? — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Crypto Crash Ahead? — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| God Broke My Plans — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Build Muscle Faster — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| $25 Meal Prep — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Buy Now? Market Update — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| AI Side Hustles That Work — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Protect Your Crypto — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| God Changed My Desires — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Home Workouts Can Work — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Date Night Dinner at Home — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Worth Moving Here? — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Automate Your Business — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Fix Your Paycheck — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| God Closed That Door — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Why You Are Not Losing Fat — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Food Myth Busted — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Work 10X Faster — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Altcoins About to Run? — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| God Is Rebuilding Me — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Stop Training Glutes Wrong — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Viral Food: Worth It? — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Buy Before the Breakout? — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| God Removed the Distractions — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Stop Training Wrong — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Worth the Hype? — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Start Crypto the Right Way — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| God Changed My Circle — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| I Had to Let Go — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| I Was Lukewarm — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| This Season Has a Purpose — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| I Stopped Forcing It — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| Stop Running from God — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| The Test Before the Blessing — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| The Prayer I Almost Quit — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |
| When God Feels Silent — Thumbnail Design | YouTube Thumbnails | cover | center; 16:9 |

## Restored thumbnail source and production families

Only the 36 missing thumbnail families are new. Each raw PNG is a byte-preserved copy at `src/assets/raw/t001-nova/portfolio/<family>.png`. Each production family is `public/assets/images/t001-nova/portfolio/<family>{,@220,@480,@640,@1080,@1280,@1600}.{webp,avif}`: 800px unsuffixed base, seven widths, two formats, no enlargement. Full-artwork links use the existing convention at @1280.webp. Sharp outputs use project WebP quality 80 and AVIF quality 50. **36 raw PNGs + 504 derivatives**; all existing family bytes are preserved in the final result. SHA-256 below refers to the preserved legacy/raw source.

| Family | Exact legacy source | Source SHA-256 |
| --- | --- | --- |
| `thumbnail-is-ai-replacing-creativity` | `legacy-assets/Graphic Design/Thumbnails/ai-tools/ai-replacing-creativity.png` | `c1187428e04b3e326a0908fb356798c9c5e781b441535371a40774f2008fea3d` |
| `thumbnail-ai-side-hustles-that-work` | `legacy-assets/Graphic Design/Thumbnails/ai-tools/ai-side-hustles-that-work-thumbnail.png` | `f871496a94bb9dcc2057447f20ec86e1dd44125f1c53fa646e415d49de2ba1a9` |
| `thumbnail-crypto-crash-ahead` | `legacy-assets/Graphic Design/Thumbnails/ai-tools/ai-thumbnails-side-hustles-thumbnail.png` | `a305c4d8c75253aafd54499878610079b888d00a412017cbeafdcc36f7c30596` |
| `thumbnail-automate-your-business` | `legacy-assets/Graphic Design/Thumbnails/ai-tools/automate-your-business-ai-thumbnail.png` | `cd9c6e36ccba82ff9502c62980f79ebbc5484adbc45a07cc3b5a5767a34d152b` |
| `thumbnail-protect-your-crypto` | `legacy-assets/Graphic Design/Thumbnails/ai-tools/work-10x-faster-thumbnail.png` | `0580e498312a77dd90187807cc7a06b64c25b56e1fb52db9b7be9f790888cdbf` |
| `thumbnail-god-broke-my-plans` | `legacy-assets/Graphic Design/Thumbnails/faith-god/broke-my-plans-thumbnail.png` | `54a7a51f304e55dea491abd1d8c1e1f72b06cc48a5d45dcfd3cb38ee8ef24b4a` |
| `thumbnail-god-changed-my-desires` | `legacy-assets/Graphic Design/Thumbnails/faith-god/god-changed-desires-thumbnail.png` | `7e16af419204f4237b690dc5b30f428424f7abfe75ea2bd6c181e22c3faac389` |
| `thumbnail-god-closed-that-door` | `legacy-assets/Graphic Design/Thumbnails/faith-god/god-closed-that-door-thumbnail.png` | `d364e03b4d80006e643ce28703ab19f7009c9c814a9fe7c4e7cb8e56a79c8666` |
| `thumbnail-god-is-rebuilding-me` | `legacy-assets/Graphic Design/Thumbnails/faith-god/god-is-rebuilding-me-thumbnail.png` | `9aa84979aa4aeca72cdd70162c367a65c441f2e64117533bfd5f8b0cbc0d292b` |
| `thumbnail-god-removed-the-distractions` | `legacy-assets/Graphic Design/Thumbnails/faith-god/god-removed-distractions-thumbnail.png` | `96c9d84ca3b14f84a7e7823ad7f038e736e6e6ce4e2e64b27e729e742b2a09c5` |
| `thumbnail-god-changed-my-circle` | `legacy-assets/Graphic Design/Thumbnails/faith-god/got-changed-my-circle-thumbnail.png` | `2c5fdae438c9695dd73e885c8e7e2228ac4eff0a09848bd1d438c6df2449354c` |
| `thumbnail-i-had-to-let-go` | `legacy-assets/Graphic Design/Thumbnails/faith-god/i-had-to-let-go-thumbnail.png` | `f4727bd1eac81214c46e71ca6df61ccf6c2c6f90b381b41259800cd930416ac4` |
| `thumbnail-i-was-lukewarm` | `legacy-assets/Graphic Design/Thumbnails/faith-god/i-was-lukewarm-thumbnail.png` | `425de31570d89dc81af355fd079fd86f867cfa6ca5e4925ddda3eeea62b2fca6` |
| `thumbnail-this-season-has-a-purpose` | `legacy-assets/Graphic Design/Thumbnails/faith-god/season-has-purpose-thumbnail.png` | `2aa7c85b08ba69bf968ec7bb4ce09fd45c763f9f64d00b24332efc51a118f9de` |
| `thumbnail-i-stopped-forcing-it` | `legacy-assets/Graphic Design/Thumbnails/faith-god/stop-forcing-it-thumbnail.png` | `58c2ae1c55a0a72a8696d2057e1e4a7d86ddb0b5913d7fa3e2b234e9d5e584e6` |
| `thumbnail-stop-running-from-god` | `legacy-assets/Graphic Design/Thumbnails/faith-god/stop-running-from-god-thumbnail.png` | `6f059fec18afa866f33842683ab6e1754d848b24667e73cba994893c7f9f015a` |
| `thumbnail-the-test-before-the-blessing` | `legacy-assets/Graphic Design/Thumbnails/faith-god/test-before-blessing-thumbnail.png` | `a8ab93475b8a51223709ad13fb498f88f46673fc83a00549ebf12ffa83d4811b` |
| `thumbnail-the-prayer-i-almost-quit` | `legacy-assets/Graphic Design/Thumbnails/faith-god/the-prayer-almost-quit-thumbnail.png` | `34bce13027973e541451782f5c9d237bf86c077c99a5f5f7d93789f64c5cfec1` |
| `thumbnail-when-god-feels-silent` | `legacy-assets/Graphic Design/Thumbnails/faith-god/when-god-feels-silent-thumbnail.png` | `f42ad213d5caece819b7b1f3182a3a2ceb77cc7e6c99b75a9ed8d7d6816b5cb2` |
| `thumbnail-fix-your-paycheck` | `legacy-assets/Graphic Design/Thumbnails/finance-investing/ChatGPT Image May 23, 2026, 09_10_05 PM.png` | `acc26307a757492f727eca45ea7f3948d93e9399adf6db948d88bb3d5bec252c` |
| `thumbnail-altcoins-about-to-run` | `legacy-assets/Graphic Design/Thumbnails/finance-investing/alt-coins-running-thumbnail.png` | `c9a677345a646bcaa68d70d64e6bfcb23ad5643b781c14d3c43a0d92ea4354b5` |
| `thumbnail-buy-before-the-breakout` | `legacy-assets/Graphic Design/Thumbnails/finance-investing/buy-before-the-breakout-thumbnail.png` | `2327bff759d14835357727cdda73c21a5e81abf66a5bf7bcaa046e6a6afc3801` |
| `thumbnail-work-10x-faster` | `legacy-assets/Graphic Design/Thumbnails/finance-investing/protect-your-crypto-thumbnail.png` | `8009f2a953a1f3151147b51f548e807ca627f963c9d5332739a11a487271ee1b` |
| `thumbnail-start-crypto-the-right-way` | `legacy-assets/Graphic Design/Thumbnails/finance-investing/start-crypto-right-thumbnail.png` | `d344fab670e6e4754d3df1362c26c0441ec5b364525c6ef8f3c0445d701cc8fa` |
| `thumbnail-build-muscle-faster` | `legacy-assets/Graphic Design/Thumbnails/fitness/build-muscle-faster-thumbnail.png` | `c135c9112a034a44f2d0c73cd16a701bf9faa3009435c1cf5269fc9338f601fc` |
| `thumbnail-home-workouts-can-work` | `legacy-assets/Graphic Design/Thumbnails/fitness/home-workouts-thumbnail.png` | `4db088cc4887f7fc1e2373e908c7ccac5995125af00d0eeecf02c9c3c94df6e4` |
| `thumbnail-why-you-are-not-losing-fat` | `legacy-assets/Graphic Design/Thumbnails/fitness/not-losing-fat-thumbnail.png` | `e1887fcdb1ecfdba11656fdf8ab33f39cc01349837fa9196b0863b53d36e4ecc` |
| `thumbnail-stop-training-glutes-wrong` | `legacy-assets/Graphic Design/Thumbnails/fitness/stop-training-glutes-wrong-thumbnail.png` | `b4b308c0369e42ce89e3f81d5b0343b1324eb2df65a7f617691dc8f594c070f1` |
| `thumbnail-stop-training-wrong` | `legacy-assets/Graphic Design/Thumbnails/fitness/stop-training-wrong-thumbnail.png` | `11c4013dc560570a1b48e2be36c12a7ad11a426474ab697bdb0d67c8c5160c4a` |
| `thumbnail-25-meal-prep` | `legacy-assets/Graphic Design/Thumbnails/food-restaurant/cheap-meal-prep-thumbnail.png` | `15c272da87a3bbbf79f9d76d7f3c06e066f764b760d9e744374388af0901f1f3` |
| `thumbnail-date-night-dinner-at-home` | `legacy-assets/Graphic Design/Thumbnails/food-restaurant/date-night-dinner-thumbnail.png` | `bae30683979459f5994833dc27366ce2f432f9b372986fcec04f5dd15c606496` |
| `thumbnail-food-myth-busted` | `legacy-assets/Graphic Design/Thumbnails/food-restaurant/food-myth-busted-thumbnail.png` | `33d0150f33acea5ba23e1d0429550f32c08c80c6f16d189dab091602de4d37af` |
| `thumbnail-viral-food-worth-it` | `legacy-assets/Graphic Design/Thumbnails/food-restaurant/viral-food-worth-it-thumbnail.png` | `34e4463a33455d7f6caaa396f2e9eebdd74923edd156c8b981ce08de5634a1bb` |
| `thumbnail-worth-the-hype` | `legacy-assets/Graphic Design/Thumbnails/food-restaurant/worth-the-hype-thumbnail.png` | `11b58b28c8a89a1214bc14fa5d4584bbe07a5ca12b47b6b32c28214e3802efb1` |
| `thumbnail-buy-now-market-update` | `legacy-assets/Graphic Design/Thumbnails/real-estate/real-estate-buy-now-market-update-thumbnail.png` | `2aa9bc7d9a8eebccec2b01cc6c93a81465478b594768236719697f3b92f86b43` |
| `thumbnail-worth-moving-here` | `legacy-assets/Graphic Design/Thumbnails/real-estate/worth-moving-here-thumbnail.png` | `608c082a5047f525d6be06d5f13bfac0e2e35971d16c4a07c16a715711cf137e` |

## Regression-pass validation and final isolation

- All 75 data JSON files parse. All 134 IDs are unique; the original 98 records preserve order, copy/tags/classification/client status, image paths and destinations. Changes to them are imageFit, thumbnail mediaAspect and Mula imagePosition. All 42 thumbnail source/raw mappings match byte-for-byte. All 504 new derivatives fully decode via Sharp with expected widths/aspect and no enlargement.
- `npm run check:types`: 399 Astro/TypeScript files, zero errors. Safe direct `npm run astro -- build --outDir /private/tmp/vs-portfolio-regression-build-20261008`: five public pages. Data-contract, import, registration and motion validators pass via `node --import tsx`; focused `npm run test -- --run src/utils/url.test.ts`: 11 tests pass.
- Real browser comparison at 320/375/430/768/1024/1440px: all 48 board picture geometry/fit/background remain unchanged; existing 92 non-thumbnail card/frame dimensions, radius, metadata/description/action positions remain unchanged. All 86 non-board cards use cover; all 42 thumbnail media frames use 16:9 without inset/zoom, and all were visually inspected from actual viewport screenshots. Explicit before/after inspection includes MetricForge, Mula, Northline Strength, Birdie Bay, Moody Brewer, Ledger & Loom, Ember & Fig and FlowPilot. No horizontal overflow, duplicate IDs, or browser runtime errors.
- All six category counts, invalid query fallback, creative union (120), keyboard filters, back/forward, Show More focus/history, late restored-entry anchors and homepage portfolio flows pass. All 120 full creative artwork resources return and decode at >=1080px; View Artwork remains a complete resource, not the card crop. Lazy/async SmartImage attributes remain on all 134 cards. Reduced-motion filtering has no grid animation. Local sample of 30 filter changes including layout: mean 4.7ms, max 10ms. All initially shows 12; no pagination/dependency change.
- The complete Vitest suite reports 859/869 passing on the first run. Seven failures concern untouched AboutExpert/demo-thumbnail/removed-Polish-route contracts; three QA subprocess failures initially encountered sandbox IPC restrictions. A permitted focused QA retry passes three of four tests; qa:client exceeds its 60-second subprocess deadline. These are recorded rather than fixed in this presentation pass. Atomic audit retains the untouched ChecklistItem margin violation and HeroSplit advisory.
- **QA pipeline side effect corrected:** the legacy qa:client test invoked the broad asset pipeline despite this pass using direct safe builds. Final SHA-256 inspection detected 150 rewritten preexisting derivatives and 12 unrequested generated derivatives. The 150 were restored from a pre-change static build after verifying every backup against the initial hashes; the 12 test-generated files were removed. No asset pipeline processes remain. A fresh safe build then verifies every built asset equals the final public file. This incident does not leave a source/artwork or family change in the final workspace.
- Final SHA-256 comparison: exactly portfolio.json, PortfolioItem types, PortfolioCollection and the two migration/source documents modified; 36 raw PNG + 504 derivative additions only; no preexisting asset/legacy changes and no deletions. Global CSS, other components, homepage/localization, navbar, metadata/noindex and all legacy bytes remain unchanged.

# Current brand-board presentation refinement — October 8, 2026

Explicitly authorized targeted image treatment and the previously requested category separation. This note supersedes the earlier five-filter/no-image-presentation-field statements below. All 98 entries, their order, factual copy, classifications, image families, destinations, card geometry and homepage flows remain intact.

- **Measured starting behavior:** every existing portfolio image already used contain, including websites, applications and advertisements. The premise that these cards used cover did not match runtime. Changing their fit would change the successful presentation the user expressly asked to preserve.
- **Presentation contract:** optional `PortfolioItem.imageFit` accepts `cover` or `contain`, defaulting to cover when absent. All 98 existing records explicitly retain contain: **98 contain / 0 cover**. Of these, the 48 reviewed identity boards receive the new board treatment; the other 50 retain their previous image geometry, background and hover behavior. No imagePosition field is needed.
- **Identity-board treatment:** entries tagged `Brand Identity` in branding, with contain fit, use the existing Nova `--color-brand-cream` surface. Their picture occupies 94% of the unchanged 4:3 frame, centered with a 3% inset on each side. The entire board remains visible without stretching; photographic hover zoom is omitted for these boards. Outer radius, grid, card heights, text/metadata/actions and other motion remain unchanged. View Artwork continues opening the existing complete larger resource.
- **Reviewed boards (48):** Ledger & Loom; Ember & Fig; FlowPilot; Kindwell; TaskNest; Carbon Cue; Crestline Wealth Partners; Luma Grove Clinic; Glossline Studio; Iron Vale; Northline Real Estate; Atlas Drift; Benny's Burgers; Clip Forge; Bridgewell Funding; Haven Bloom Health; Gravelhorn Outfitters; Align & Aura; HearthMark Lending; Solara Stay; Juniper Hearth; Patchline; Meridian Oak; Pearl & Pine Dental; MirrorBay Detail; ForgeHouse Athletics; KeyHaven Property; Tide & Trail; Copper Fork; Table Shift; Penny Pilot; Solenne Dermatology; Route Forge; GloveHouse Boxing; RoomWright Studio; Bloom & Brick; Fry Bird; Harborline Capital; Stridewell Therapy; Volt Nest; MacroMap; SagePoint Realty; Lantern Lane; Hollow Cup; Wrench Run; RangeLab Recovery; Vale & Stone; Old Harbor. These are actual multi-panel boards, not a blanket treatment of arbitrary advertising or standalone logos.
- **Current filters:** All (98 total, 12 initially), Websites (11), Web Apps & Digital Products (5), Branding (48), Advertising & Marketing (30), YouTube Thumbnails (6). Luma Spritz remains an advertisement and no longer also belongs to branding. The six thumbnail collections move from ads to thumbnails. Optional category `cardLabel` preserves the previous card metadata wording/placement while filter labels follow the approved taxonomy. `creativeCategoryIds` includes branding, ads and thumbnails, preserving the 84-entry Creative Work union. Show More, filter/history code and destination aliases are unchanged.
- **Validation:** all 75 data JSON files parse, 98 unique records and existing image/action paths validate, Astro/TypeScript checks 399 files with zero errors, the five-page temporary static build passes, data contracts and 11 URL tests pass. Browser comparisons at 320/375/430/768/1440px confirm unchanged geometry/text/action positions on all 98 cards, scoped framing on all 48 boards and unchanged image presentation on the other 50. Ember & Fig, FlowPilot, Ledger & Loom and Copper Fork were visually checked in the actual grid. Six filters, creative alias, query/history, keyboard, reduced motion, homepage links and all 48 complete artwork resources pass with no browser errors or horizontal overflow. Atomic audit retains only the preexisting ChecklistItem margin violation and HeroSplit advisory, outside this pass. No source artwork or responsive family is created, changed or regenerated.

# Current Portfolio UX and navbar branding — October 8, 2026

Explicitly authorized polish of the completed 98-entry portfolio and replacement of the navbar's text brand with the approved horizontal Volatile Solutions logo. This supersedes the full-list browsing behavior and opening order recorded below. No projects were added, removed, reclassified or rewritten; Fros Lawncare, TimeDock and StillPoint remain excluded. Homepage content, metadata/noindex, navigation placement, drawer architecture, motion engine and all existing portfolio assets remain unchanged.

## Graphical navbar logo

- Approved source: `legacy-assets/Logos/logo-with-text.png`, 1672×941 RGBA PNG. Fully transparent margins and isolated alpha=1 residue surround the actual mark/wording; substantive alpha>1 bounds are `(78,313)`–`(1613,614)`. Production cropping uses `(76,311)`–`(1615,616)`, retaining a two-pixel safety margin and all visible artwork.
- Byte-preserved original copy: `src/assets/raw/t001-nova/t001-nova-navbar-logo-source.png`. Prepared raw crop: `src/assets/raw/t001-nova/t001-nova-navbar-logo.png`. Production: `/assets/images/t001-nova/t001-nova-navbar-logo.png`, 1539×305, lossless transparent PNG, 154,496 bytes. No color, lettering, sharpening or logo redesign; crop pixels match the original source exactly.
- Existing company branding source now supplies logoImage, logoWidth and logoHeight. The existing Logo atom renders the graphical asset with truthful intrinsic dimensions, responsive height and automatic width. It stays in the original left brand position in both static/floating and fixed header states across all five public routes. No duplicate drawer logo is added.
- Measured mobile logo: approximately 202×40px at 320/375/430px. Desktop/tablet: approximately 222×44px at 768/1024/1440px. The full horizontal wording remains, with no mark-only variant. The native source supports high-density displays; existing Nova headers have light surfaces suitable for the logo's dark lettering. Header height remains approximately 69.6px.
- Both header logo anchors retain `/` and use accessible name "Volatile Solutions home"; logo alt is "Volatile Solutions". The company name remains centrally stored as text for metadata/accessibility, while customer-facing navbar branding is graphical.

## Curated browsing and card polish

- All 98 item records remain field-for-field identical; only order, browsing configuration and three interface labels change in portfolio.json. The initial twelve are The Moody Brewer, PVD Photography, MetricForge, Ledger & Loom, Northline Strength, Mula, Luma Spritz, GlassDash, Jobly, Cloud Keep, Ember & Fig and Aura Active. The remaining diverse ordering is retained.
- `browsing.initialCount=12` and `browsing.increment=12`. With JavaScript, All initially shows twelve and the existing Nova Button reveals another twelve until all 98 are visible. The live status reads "Showing 12 of 98 projects" and updates after each reveal. Filter labels remain clean; separate per-button counts are intentionally omitted.
- Filtered categories show all matches: Websites 11, Web Apps & Digital Products 5, Branding & Visual Design 49, Ads & Social 36. `?category=creative` still shows the 84-entry branding/ads union. No pagination routes, React, dependencies or virtualized list.
- Expanded All limits are stored in the existing history state; filtering and back/forward preserve them. Direct anchors reveal enough preceding All batches to include their target, including late entries and conflicting category/anchor combinations. State is reapplied on Astro after-swap and page-load so the server-rendered full collection does not flash during history transitions.
- Show More supports keyboard activation, aria-controls, a dynamic next-batch accessible label, and a polite live count. Focus moves to the first newly revealed heading, including the final two-item batch, so completion never leaves focus on a hidden button. Hidden cards cannot participate in tab navigation. Filters preserve keyboard focus; reduced motion disables the existing filter fade, and progressive reveal adds no animation.
- Without JavaScript, all 98 server-rendered records remain available; inactive filters and Show More controls stay hidden.
- Existing 4:3 frames and contained full artwork remain. The responsive picture wrapper is constrained to the frame; this fixes square-source intrinsic sizing that could overflow and clip artwork even with object-fit:contain. No imageFit/imagePosition fields, new crop exceptions or portfolio derivatives are introduced. Cards stretch within desktop grid rows and place their actions at the bottom; mobile content remains natural height. Title, description and tag wrapping are preserved without truncation.
- Actions remain Visit Website for the verified website, View Project for external demos, and View Artwork for real static work. External destinations use the external-link arrow; same-origin artwork resources use an image icon. Full-card links and invented detail pages are not added. View Artwork continues opening the larger existing production image in a new tab, preserving complete artwork.

## UX validation and performance

- JSON, all 98 unchanged item records/classifications/IDs/destinations and existing image paths pass validation. All 84 artwork actions still resolve to actual image files, and all fourteen existing external project URLs remain unchanged. All three homepage portfolio destinations pass browser checks.
- Astro/TypeScript: 399 files, zero errors. Temporary static build: five pages, successful. Existing URL tests: 11 passed. Data contracts, imports, registrations and motion checks pass. The atomic audit retains its preexisting ChecklistItem margin violation and HeroSplit pill advisory; neither unrelated file changed.
- Browser widths: 320, 375, 430, 768, 1024 and 1440px, including high-density emulation. No horizontal/card-text overflow, logo clipping or navigation collision; 44px filter targets, aligned desktop actions, fixed-header branding, drawer open/close, logo home navigation from every public route, all category URLs, history, late anchors, keyboard behavior, reduced motion, unique IDs and no-JavaScript fallback pass. Final browser run reports zero runtime exceptions.
- All 98 cards retain native lazy loading and asynchronous decoding. Local Chrome sample: 2,555 DOM elements, six initial card-image requests, approximately 63ms DOMContentLoaded. Twenty-five filter changes including forced layout averaged approximately 4.1ms, maximum 8.0ms. These are local inspection measurements, not Lighthouse or production-network guarantees. Full records remain in the DOM to keep filtering, direct anchors and no-JavaScript access simple.
- SHA-256 comparisons preserve the legacy logo, all legacy artwork/process sources and every existing portfolio raw/production image family. Only the scoped UI/data/type files and these two migration documents change; three logo-only PNG files are created. No global asset-generation command is run and nothing is deployed.

Final isolation note: two Finder metadata files changed independently during the pass, `legacy-assets/.DS_Store` and `legacy-assets/Graphic Design/Real Clients/.DS_Store`. They were not edited or reverted by the implementation. All legacy raster artwork, the approved source logo, the process Markdown and all preexisting portfolio source/production images remain byte-identical. The intended changes remain nine scoped UI/data/type/document files plus three logo PNG additions.

# Current Portfolio expansion — October 8, 2026

Explicitly authorized comprehensive expansion of the existing English portfolio. This supersedes the initial ten-entry selection and earlier deferrals only where supported below. The five primary filters, Nova PortfolioCollection, route, card architecture, navigation, typography, CSS, homepage project links and noindex policy remain unchanged. No case-study pages or admin features were added.

The user expressly requested leaving **Fros Lawncare, TimeDock and StillPoint out** during this pass. Their absence is intentional, not a claim that the work does not exist.

## Expanded inventory and evidence boundaries

Audited every current legacy raster by decoding it, checking dimensions and hashes, and visually inspecting the relevant website, identity, advertising, social and thumbnail work. The current library has **152 images**: 17 portfolio-folder images, 48 brand boards, 15 product/digital advertising concepts, 14 square social/event/service/flyer graphics, 3 LinkedIn banners, 42 thumbnails, 5 PVD client graphics, 4 founder images and 4 company-logo rasters. The older asset inventory remains a dated snapshot; current measured dimensions take precedence for this pass. No decoded-pixel duplicates were found. Distinct works can still share campaign/layout conventions.

Compared the original ten records, LEGACY_PROJECT_LINKS.md, LEGACY_ASSET_INVENTORY.md, approved source facts, the current public portfolio at https://volatile-solutions.net/portfolio and the 120-item creative data at https://volatile-solutions.net/js/graphic-portfolio-data.js?v=20260524packages1. The public links were extracted from actual HTML and all 14 project destinations returned HTTP 200 with verified TLS. Entry-page availability does not verify APIs, authentication, bookings, storage security, app functionality or business operations.

**Final live collection: 98 entries, including 88 additions and all ten retained records.** These are portfolio entries, not 98 clients, launches or delivered software applications. All actual available public website/software projects are included; the larger creative library accounts for the greater number of creative cards. Software and client work stay prominent in the default ordering and dedicated filters.

| Filter | Matching entries |
| --- | --- |
| All | 98 |
| Websites | 11 |
| Web Apps & Digital Products | 5 |
| Branding & Visual Design | 49 |
| Ads & Social | 36 |

Category counts overlap because some entries have multiple categories. The Creative Work query selects the branding/ads union: 84 entries. The default order starts The Moody Brewer, Mula, Ledger & Loom, MetricForge, PVD Photography, Cloud Keep, Northline Strength, GlassDash, Ember & Fig and Luma Spritz. Remaining identity sectors and marketing pieces are interleaved. No artificial item ceiling was applied.

## Classification and deliverable safety

- Verified Client Work is limited to Moody Brewer and the two distinct PVD advertising deliverables. PVD wedding and senior-portrait promotions are intentionally separate creative works; additional variants do not become extra project cards. No photography authorship, client website build or advertising result is claimed for PVD.
- Portfolio Work denotes a supported website/product presentation with unresolved client/personal/concept relationship. It never means Verified Client Work.
- Creative Portfolio denotes real creative artifacts without asserting a paying client. Identity-board app mockups do not establish working software; the only published category for those boards is Branding & Visual Design.
- Concept Project is used where the current public creative data expressly identifies a concept, and for Northline Plumbing, whose live page explicitly describes a fictional service brand.
- FLOWSTATE AI, REVNUE and VAULTIQ are advertisements/interface mockups under Ads & Social, not completed AI, finance or security applications. No backend or security claim is inferred.
- No new project technologies are published: the inspected public badges are not sufficient stack evidence. TimeDock's documented Electron/React/SQLite facts remain historical source context for an excluded record.
- No growth, ROI, revenue impact, conversion, customer or traffic claims are added. Existing illustrative interface/business details are distinguished from Anthony's results.

## Full candidate inventory

A = already included and retained; B = supported and added; C = potential project / insufficient evidence or explicitly excluded; D = alternate or supporting source, not another project; E = unsuitable as a project entry. Each live record below has a real image. Additional D/E file dispositions follow in the complete image audit.

| Project | Evidence found | Current status | Classification | Category | Add now? |
| --- | --- | --- | --- | --- | --- |
| The Moody Brewer | `legacy-assets/portfolio/moody-brewer-thumbnail.png` | A — retained | Verified Client Work | websites | Retain |
| Mula | `legacy-assets/portfolio/mula-thumbnail.png` | B — added | Portfolio Work | web-apps | Yes |
| Ledger & Loom | `legacy-assets/Graphic Design/Brand Kits/Finance/Ledger-and-Loom.png` | A — retained | Creative Portfolio | branding | Retain |
| MetricForge | `legacy-assets/portfolio/metric-forge-thumbnail.png` | A — retained | Portfolio Work | web-apps | Retain |
| PVD Photography | `legacy-assets/Graphic Design/Real Clients/PVD Photographer/PVD Wedding Photography Editorial Collage.png` | A — retained | Verified Client Work | ads | Retain |
| Cloud Keep | `legacy-assets/portfolio/cloud-keep-thumbnail.png` | B — added | Portfolio Work | web-apps, websites | Yes |
| Northline Strength | `legacy-assets/portfolio/northline-thumbnail.png` | A — retained | Portfolio Work | websites | Retain |
| GlassDash | `legacy-assets/portfolio/glass-dash-thumbnail.png` | A — retained | Portfolio Work | web-apps | Retain |
| Ember & Fig | `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Ember_and_Fig.png` | B — added | Creative Portfolio | branding | Yes |
| Luma Spritz | `legacy-assets/Graphic Design/Food-and-Beverage/luma-spritz-water.png` | A — retained | Concept Project | ads, branding | Retain |
| Jobly | `legacy-assets/portfolio/jobly-thumbnail.png` | A — retained | Portfolio Work | web-apps, websites | Retain |
| Birdie Bay | `legacy-assets/portfolio/birdie-bay-thumbnail.png` | B — added | Portfolio Work | websites | Yes |
| PVD Photography — Senior Portraits | `legacy-assets/Graphic Design/Real Clients/PVD Photographer/Senior Portraits_ Your Year, Your Story.png` | B — added | Verified Client Work | ads | Yes |
| FlowPilot | `legacy-assets/Graphic Design/Brand Kits/SaaS/Flow-Pilot.png` | B — added | Creative Portfolio | branding | Yes |
| Frost | `legacy-assets/portfolio/frost-thumbnail.png` | B — added | Portfolio Work | websites | Yes |
| Aura Active | `legacy-assets/Graphic Design/Energy Drinks/aura-active.png` | B — added | Concept Project | ads | Yes |
| ScholarLink | `legacy-assets/portfolio/scholar-link-thumbnail.png` | B — added | Portfolio Work | websites | Yes |
| Kindwell | `legacy-assets/Graphic Design/Brand Kits/Medical/Kindwell.png` | B — added | Creative Portfolio | branding | Yes |
| Harbor & Steel | `legacy-assets/portfolio/harbor-steel-thumbnail.png` | B — added | Portfolio Work | websites | Yes |
| Sable Row | `legacy-assets/Graphic Design/Social Media Promo/Social Posts/sable-row-clothing.png` | A — retained | Creative Portfolio | ads | Retain |
| Northline Plumbing | `legacy-assets/portfolio/plumbing-thumbnail.png` | B — added | Concept Project | websites | Yes |
| TaskNest | `legacy-assets/Graphic Design/Brand Kits/SaaS/Task-Nest.png` | B — added | Creative Portfolio | branding | Yes |
| Sonoran Comfort Systems | `legacy-assets/portfolio/sonoran-comfort-thumbnail.png` | B — added | Portfolio Work | websites | Yes |
| Solartec | `legacy-assets/portfolio/solar-thumbnail.png` | B — added | Portfolio Work | websites | Yes |
| Alder & Finch | `legacy-assets/Graphic Design/Social Media Promo/Promo Flyers/cleaning-company-promo.png` | A — retained | Creative Portfolio | ads | Retain |
| Carbon Cue | `legacy-assets/Graphic Design/Brand Kits/SaaS/Carbon-Cue.png` | B — added | Creative Portfolio | branding | Yes |
| Crestline Wealth Partners | `legacy-assets/Graphic Design/Brand Kits/Finance/Crestline-Wealth.png` | B — added | Creative Portfolio | branding | Yes |
| Luma Grove Clinic | `legacy-assets/Graphic Design/Brand Kits/Medical/Luma-Grove.png` | B — added | Creative Portfolio | branding | Yes |
| Glossline Studio | `legacy-assets/Graphic Design/Brand Kits/Auto/Glossline-Studio.png` | B — added | Creative Portfolio | branding | Yes |
| Iron Vale | `legacy-assets/Graphic Design/Brand Kits/Fitness/Iron-Valve.png` | B — added | Creative Portfolio | branding | Yes |
| Northline Real Estate | `legacy-assets/Graphic Design/Brand Kits/Real Estate/Northline-Real-Estate.png` | B — added | Creative Portfolio | branding | Yes |
| Atlas Drift | `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Atlas-Drift.png` | B — added | Creative Portfolio | branding | Yes |
| Benny's Burgers | `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Bennys-Burgers.png` | B — added | Creative Portfolio | branding | Yes |
| Rift Product Advertising | `legacy-assets/Graphic Design/Energy Drinks/rift-energy.png` | B — added | Concept Project | ads | Yes |
| Clip Forge | `legacy-assets/Graphic Design/Brand Kits/SaaS/Clip-Forge.png` | B — added | Creative Portfolio | branding | Yes |
| Bridgewell Funding | `legacy-assets/Graphic Design/Brand Kits/Finance/Bridgewell-Funding.png` | B — added | Creative Portfolio | branding | Yes |
| Haven Bloom Health | `legacy-assets/Graphic Design/Brand Kits/Medical/Haven-Bloom-Health.png` | B — added | Creative Portfolio | branding | Yes |
| Gravelhorn Outfitters | `legacy-assets/Graphic Design/Brand Kits/Auto/Gravelhorn-Outfitters.png` | B — added | Creative Portfolio | branding | Yes |
| Align & Aura | `legacy-assets/Graphic Design/Brand Kits/Fitness/Align-and-Aura.png` | B — added | Creative Portfolio | branding | Yes |
| HearthMark Lending | `legacy-assets/Graphic Design/Brand Kits/Real Estate/HearthMark-Lending.png` | B — added | Creative Portfolio | branding | Yes |
| Solara Stay | `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Solara-Stay.png` | B — added | Creative Portfolio | branding | Yes |
| Juniper Hearth | `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Juniper-Hearth.png` | B — added | Creative Portfolio | branding | Yes |
| Vanta Pulse | `legacy-assets/Graphic Design/Energy Drinks/vanta-pulse-energy.png` | B — added | Concept Project | ads | Yes |
| Patchline | `legacy-assets/Graphic Design/Brand Kits/SaaS/Patchline.png` | B — added | Creative Portfolio | branding | Yes |
| Meridian Oak | `legacy-assets/Graphic Design/Brand Kits/Finance/Meridian-Oak.png` | B — added | Creative Portfolio | branding | Yes |
| Pearl & Pine Dental | `legacy-assets/Graphic Design/Brand Kits/Medical/Pearl-and-Pine-Dental.png` | B — added | Creative Portfolio | branding | Yes |
| MirrorBay Detail | `legacy-assets/Graphic Design/Brand Kits/Auto/MirrorBay-Detail.png` | B — added | Creative Portfolio | branding | Yes |
| ForgeHouse Athletics | `legacy-assets/Graphic Design/Brand Kits/Fitness/ForgeHouse-Athletics.png` | B — added | Creative Portfolio | branding | Yes |
| KeyHaven Property | `legacy-assets/Graphic Design/Brand Kits/Real Estate/KeyHaven-Property.png` | B — added | Creative Portfolio | branding | Yes |
| Tide & Trail | `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Tide-and-Trail.png` | B — added | Creative Portfolio | branding | Yes |
| Copper Fork | `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Copper-Fork.png` | B — added | Creative Portfolio | branding | Yes |
| Macro Forge Meals | `legacy-assets/Graphic Design/Fitness/macro-forge-meals.png` | B — added | Concept Project | ads | Yes |
| Table Shift | `legacy-assets/Graphic Design/Brand Kits/SaaS/Table-Shift.png` | B — added | Creative Portfolio | branding | Yes |
| Penny Pilot | `legacy-assets/Graphic Design/Brand Kits/Finance/Penny-Pilot.png` | B — added | Creative Portfolio | branding | Yes |
| Solenne Dermatology | `legacy-assets/Graphic Design/Brand Kits/Medical/Solenne-Dermatology.png` | B — added | Creative Portfolio | branding | Yes |
| Route Forge | `legacy-assets/Graphic Design/Brand Kits/Auto/Route-Forge.png` | B — added | Creative Portfolio | branding | Yes |
| GloveHouse Boxing | `legacy-assets/Graphic Design/Brand Kits/Fitness/GloveHouse-Boxing.png` | B — added | Creative Portfolio | branding | Yes |
| RoomWright Studio | `legacy-assets/Graphic Design/Brand Kits/Real Estate/RoomWright-Studio.png` | B — added | Creative Portfolio | branding | Yes |
| Bloom & Brick | `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Bloom-and-Brick.png` | B — added | Creative Portfolio | branding | Yes |
| Fry Bird | `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Fry-Bird.png` | B — added | Creative Portfolio | branding | Yes |
| Volt Electrolytes | `legacy-assets/Graphic Design/Fitness/volt-electrolytes.png` | B — added | Concept Project | ads | Yes |
| Harborline Capital | `legacy-assets/Graphic Design/Brand Kits/Finance/Harborline-Capital.png` | B — added | Creative Portfolio | branding | Yes |
| Stridewell Therapy | `legacy-assets/Graphic Design/Brand Kits/Medical/Stridewell-Therapy.png` | B — added | Creative Portfolio | branding | Yes |
| Volt Nest | `legacy-assets/Graphic Design/Brand Kits/Auto/Volt-Nest.png` | B — added | Creative Portfolio | branding | Yes |
| MacroMap | `legacy-assets/Graphic Design/Brand Kits/Fitness/MacroMap.png` | B — added | Creative Portfolio | branding | Yes |
| SagePoint Realty | `legacy-assets/Graphic Design/Brand Kits/Real Estate/SagePoint-Realty.png` | B — added | Creative Portfolio | branding | Yes |
| Lantern Lane | `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Lantern-Lane.png` | B — added | Creative Portfolio | branding | Yes |
| Hollow Cup | `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Hollow-Cup.png` | B — added | Creative Portfolio | branding | Yes |
| Brew Core | `legacy-assets/Graphic Design/Food-and-Beverage/brew-core-coffee.png` | B — added | Concept Project | ads | Yes |
| Wrench Run | `legacy-assets/Graphic Design/Brand Kits/Auto/Wrench-Run.png` | B — added | Creative Portfolio | branding | Yes |
| RangeLab Recovery | `legacy-assets/Graphic Design/Brand Kits/Fitness/RangeLab-Recovery.png` | B — added | Creative Portfolio | branding | Yes |
| Vale & Stone | `legacy-assets/Graphic Design/Brand Kits/Real Estate/Vale-and-Stone.png` | B — added | Creative Portfolio | branding | Yes |
| Old Harbor | `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Old-Harbor.png` | B — added | Creative Portfolio | branding | Yes |
| Crunch Forge | `legacy-assets/Graphic Design/Food-and-Beverage/crunch-forge-snack.png` | B — added | Concept Project | ads | Yes |
| Level Up | `legacy-assets/Graphic Design/Supplements/level-up-pre.png` | B — added | Concept Project | ads | Yes |
| Vyra Active | `legacy-assets/Graphic Design/Supplements/vyra-active.png` | B — added | Concept Project | ads | Yes |
| Flowstate AI | `legacy-assets/Graphic Design/Tech/flowstate-ai.png` | B — added | Concept Project | ads | Yes |
| Revnue Admin | `legacy-assets/Graphic Design/Tech/revnue-admin.png` | B — added | Concept Project | ads | Yes |
| Vault IQ | `legacy-assets/Graphic Design/Tech/vault-iq-security.png` | B — added | Concept Project | ads | Yes |
| Harbor Room — Local Table Night | `legacy-assets/Graphic Design/Social Media Promo/Event Graphics/harbor-room-local-table-night.png` | B — added | Creative Portfolio | ads | Yes |
| Ironwood Training Hall | `legacy-assets/Graphic Design/Social Media Promo/Event Graphics/ironwood-training-event.png` | B — added | Concept Project | ads | Yes |
| Juniper House — Author Evening | `legacy-assets/Graphic Design/Social Media Promo/Event Graphics/juniper-house-author-evening.png` | B — added | Concept Project | ads | Yes |
| Paper Lantern Studio | `legacy-assets/Graphic Design/Social Media Promo/Event Graphics/paper-lantern-studio.png` | B — added | Creative Portfolio | ads | Yes |
| Blue Harbor Advisory | `legacy-assets/Graphic Design/Social Media Promo/Service Graphics/blue-harbor-bookkeeping.png` | B — added | Concept Project | ads | Yes |
| Hale Street Realty | `legacy-assets/Graphic Design/Social Media Promo/Service Graphics/hale-street-realty.png` | B — added | Concept Project | ads | Yes |
| Stonebridge Web Services | `legacy-assets/Graphic Design/Social Media Promo/Service Graphics/stonebridge-web-services.png` | B — added | Concept Project | ads | Yes |
| Westmere Talent | `legacy-assets/Graphic Design/Social Media Promo/Service Graphics/westmere-talent-resume-building.png` | B — added | Concept Project | ads | Yes |
| Cedar Plate | `legacy-assets/Graphic Design/Social Media Promo/Social Posts/cedar-plate-food.png` | B — added | Concept Project | ads | Yes |
| House of Laurel | `legacy-assets/Graphic Design/Social Media Promo/Social Posts/house-of-laurel-beauty.png` | B — added | Concept Project | ads | Yes |
| Kindred Desk | `legacy-assets/Graphic Design/Social Media Promo/Social Posts/kind-red-desk-equippment.png` | B — added | Concept Project | ads | Yes |
| Marlow Pantry | `legacy-assets/Graphic Design/Social Media Promo/Social Posts/marlow-pastry-bakery.png` | B — added | Concept Project | ads | Yes |
| North Ledger Consulting | `legacy-assets/Graphic Design/Social Media Promo/LinkedIn Banners/linkedin-banner-1.png` | B — added | Concept Project | ads | Yes |
| AI & Productivity Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/ai-tools/study-smarter-with-ai-thumbnail.png` | B — added | Creative Portfolio | ads | Yes |
| Faith & Lifestyle Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/faith-god/god-was-preparing-me-thumbnail.png` | B — added | Creative Portfolio | ads | Yes |
| Finance Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/finance-investing/bitcoin-breakout-thumbnail.png` | B — added | Creative Portfolio | ads | Yes |
| Fitness Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/fitness/best-beginner-gym-plan-thumbnail.png` | B — added | Creative Portfolio | ads | Yes |
| Food Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/food-restaurant/family-secret-recipie-thumbnail.png` | B — added | Creative Portfolio | ads | Yes |
| Real Estate Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/real-estate/dont-buy-until-thumbnail.png` | B — added | Creative Portfolio | ads | Yes |
| Fros Lawncare | Verified relationship; no mapped artwork or specific deliverable | C — excluded / unresolved | Verified Client Work | Unresolved | No — user exclusion |
| TimeDock | Documented macOS time tracking; Electron, React, SQLite; no screenshot/link | C — excluded / unresolved | Personal Project | web-apps | No — user exclusion |
| StillPoint | Personal faith/discipline concept; no mapped screenshot/link | C — excluded / unresolved | Personal / independent; exact type unclear | Unresolved | No — user exclusion |
| Euclid Financial Services | Website rebuild direction only; no mapped image, status or URL | C — excluded / unresolved | Unclear | Potential websites | No — insufficient evidence |
| HealthSync AI | Logo/title image only; no demonstrated app or project description | C — excluded / unresolved | Unclear | Potential branding; software unproven | No — insufficient evidence |

## Newly added project details

All fields in this table are final published values. Technologies are omitted for every new entry because no verified stack was established. Creative pieces have a real local View Artwork destination, never a fabricated brand URL.

| Title | Classification | Categories | Tags | Description | Verified URL / artwork destination | Primary image |
| --- | --- | --- | --- | --- | --- | --- |
| Mula | Portfolio Work | web-apps | Finance, Expense Tracker | An expense-tracking web app presentation with budget summaries, category views, and CSV export controls. | https://mula-expense-tracker-v2.netlify.app/ | `/assets/images/t001-nova/portfolio/mula.webp` |
| Cloud Keep | Portfolio Work | web-apps, websites | SaaS, File Management | A cloud-storage product presentation exploring file organization, collaboration, and access controls. | https://cloud-keep.netlify.app/ | `/assets/images/t001-nova/portfolio/cloud-keep.webp` |
| Birdie Bay | Portfolio Work | websites | Golf, Membership | A golf and events website presentation with membership options, event content, and member navigation. | https://birdie-bay.netlify.app/ | `/assets/images/t001-nova/portfolio/birdie-bay.webp` |
| Frost | Portfolio Work | websites | Fitness, Coaching | A JackFrost Coaching website presentation organizing a coaching offer, training approach, and inquiry flow. | https://frost-fitness.netlify.app/ | `/assets/images/t001-nova/portfolio/frost.webp` |
| Sonoran Comfort Systems | Portfolio Work | websites | Local Business, HVAC | An HVAC website presentation bringing repair, installation, maintenance, and estimate inquiries into a service-focused layout. | https://hvac-portfolio.netlify.app/ | `/assets/images/t001-nova/portfolio/sonoran-comfort-systems.webp` |
| Northline Plumbing | Concept Project | websites | Local Business, Concept Work | A fictional plumbing-service website concept with residential and commercial service routes and an inquiry flow. | https://plumbing-portfolio.netlify.app/ | `/assets/images/t001-nova/portfolio/northline-plumbing.webp` |
| Solartec | Portfolio Work | websites | Solar, Local Business | A solar-service website presentation with service sections, project imagery, and quote prompts. | https://solar-portfolio.netlify.app/ | `/assets/images/t001-nova/portfolio/solartec.webp` |
| Harbor & Steel | Portfolio Work | websites | Local Business, Barber Shop | A barber-shop website presentation organizing service prices, barber profiles, and booking prompts. | https://haircut-portfolio.netlify.app/ | `/assets/images/t001-nova/portfolio/harbor-and-steel.webp` |
| ScholarLink | Portfolio Work | websites | Education, Tutoring | A tutoring website presentation with subject options, tutor introductions, and consultation prompts. | https://scholar-link.netlify.app/ | `/assets/images/t001-nova/portfolio/scholarlink.webp` |
| Ember & Fig | Creative Portfolio | branding | Food & Beverage, Brand Identity | A restaurant identity board combining fire-inspired marks, warm colors, and dining applications. | `/assets/images/t001-nova/portfolio/ember-and-fig@1280.webp` | `/assets/images/t001-nova/portfolio/ember-and-fig.webp` |
| FlowPilot | Creative Portfolio | branding | SaaS, Brand Identity | A workflow software identity board combining a routing-inspired mark, cool accents, and interface mockups. | `/assets/images/t001-nova/portfolio/flowpilot@1280.webp` | `/assets/images/t001-nova/portfolio/flowpilot.webp` |
| Carbon Cue | Creative Portfolio | branding | SaaS, Brand Identity | A climate analytics identity board combining an organic symbol, green palette, and reporting mockups. | `/assets/images/t001-nova/portfolio/carbon-cue@1280.webp` | `/assets/images/t001-nova/portfolio/carbon-cue.webp` |
| Clip Forge | Creative Portfolio | branding | SaaS, Brand Identity | A creator software identity board combining an angular mark, vivid accents, and editing-interface mockups. | `/assets/images/t001-nova/portfolio/clip-forge@1280.webp` | `/assets/images/t001-nova/portfolio/clip-forge.webp` |
| Patchline | Creative Portfolio | branding | SaaS, Brand Identity | A developer software identity board combining a code-inspired symbol, dark palette, and release-interface mockups. | `/assets/images/t001-nova/portfolio/patchline@1280.webp` | `/assets/images/t001-nova/portfolio/patchline.webp` |
| Table Shift | Creative Portfolio | branding | SaaS, Brand Identity | A restaurant operations identity board combining a table-inspired mark, coral accents, and scheduling mockups. | `/assets/images/t001-nova/portfolio/table-shift@1280.webp` | `/assets/images/t001-nova/portfolio/table-shift.webp` |
| Crestline Wealth Partners | Creative Portfolio | branding | Finance, Brand Identity | A financial advisory identity board combining a crest-like symbol, restrained palette, and stationery. | `/assets/images/t001-nova/portfolio/crestline-wealth-partners@1280.webp` | `/assets/images/t001-nova/portfolio/crestline-wealth-partners.webp` |
| Bridgewell Funding | Creative Portfolio | branding | Finance, Brand Identity | A lending identity board combining a bridge-inspired monogram, navy and copper palette, and print applications. | `/assets/images/t001-nova/portfolio/bridgewell-funding@1280.webp` | `/assets/images/t001-nova/portfolio/bridgewell-funding.webp` |
| Meridian Oak | Creative Portfolio | branding | Finance, Brand Identity | A wealth advisory identity board combining an oak-inspired mark, forest tones, and stationery. | `/assets/images/t001-nova/portfolio/meridian-oak@1280.webp` | `/assets/images/t001-nova/portfolio/meridian-oak.webp` |
| Penny Pilot | Creative Portfolio | branding | Finance, Brand Identity | A personal finance identity board combining a friendly monogram, green accents, and budget-interface mockups. | `/assets/images/t001-nova/portfolio/penny-pilot@1280.webp` | `/assets/images/t001-nova/portfolio/penny-pilot.webp` |
| Luma Grove Clinic | Creative Portfolio | branding | Healthcare, Brand Identity | A healthcare identity board combining a botanical mark, muted greens, and clinic applications. | `/assets/images/t001-nova/portfolio/luma-grove-clinic@1280.webp` | `/assets/images/t001-nova/portfolio/luma-grove-clinic.webp` |
| Haven Bloom Health | Creative Portfolio | branding | Healthcare, Brand Identity | A healthcare identity board combining a floral monogram, plum tones, and patient-facing applications. | `/assets/images/t001-nova/portfolio/haven-bloom-health@1280.webp` | `/assets/images/t001-nova/portfolio/haven-bloom-health.webp` |
| Pearl & Pine Dental | Creative Portfolio | branding | Healthcare, Brand Identity | A dental care identity board combining a botanical emblem, soft greens, and printed materials. | `/assets/images/t001-nova/portfolio/pearl-and-pine-dental@1280.webp` | `/assets/images/t001-nova/portfolio/pearl-and-pine-dental.webp` |
| Solenne Dermatology | Creative Portfolio | branding | Healthcare, Brand Identity | A skincare identity board combining a refined monogram, neutral tones, and packaging mockups. | `/assets/images/t001-nova/portfolio/solenne-dermatology@1280.webp` | `/assets/images/t001-nova/portfolio/solenne-dermatology.webp` |
| Stridewell Therapy | Creative Portfolio | branding | Healthcare, Brand Identity | A physical therapy identity board combining a motion-inspired mark, blue accents, and care-interface mockups. | `/assets/images/t001-nova/portfolio/stridewell-therapy@1280.webp` | `/assets/images/t001-nova/portfolio/stridewell-therapy.webp` |
| Glossline Studio | Creative Portfolio | branding | Automotive, Brand Identity | A automotive detailing identity board combining a shield mark, dark surfaces, and reflective imagery. | `/assets/images/t001-nova/portfolio/glossline-studio@1280.webp` | `/assets/images/t001-nova/portfolio/glossline-studio.webp` |
| Gravelhorn Outfitters | Creative Portfolio | branding | Automotive, Brand Identity | A outdoor equipment identity board combining a horned emblem, earthy tones, and rugged packaging. | `/assets/images/t001-nova/portfolio/gravelhorn-outfitters@1280.webp` | `/assets/images/t001-nova/portfolio/gravelhorn-outfitters.webp` |
| MirrorBay Detail | Creative Portfolio | branding | Automotive, Brand Identity | A automotive detailing identity board combining a mirrored monogram, electric-blue accents, and product mockups. | `/assets/images/t001-nova/portfolio/mirrorbay-detail@1280.webp` | `/assets/images/t001-nova/portfolio/mirrorbay-detail.webp` |
| Route Forge | Creative Portfolio | branding | Automotive, Brand Identity | A fleet services identity board combining a road-inspired mark, industrial typography, and fleet applications. | `/assets/images/t001-nova/portfolio/route-forge@1280.webp` | `/assets/images/t001-nova/portfolio/route-forge.webp` |
| Volt Nest | Creative Portfolio | branding | Automotive, Brand Identity | A EV charging identity board combining a geometric symbol, lime accents, and charging-interface mockups. | `/assets/images/t001-nova/portfolio/volt-nest@1280.webp` | `/assets/images/t001-nova/portfolio/volt-nest.webp` |
| Wrench Run | Creative Portfolio | branding | Automotive, Brand Identity | A mobile mechanics identity board combining a wrench-inspired mark, bold colors, and vehicle applications. | `/assets/images/t001-nova/portfolio/wrench-run@1280.webp` | `/assets/images/t001-nova/portfolio/wrench-run.webp` |
| Iron Vale | Creative Portfolio | branding | Fitness, Brand Identity | A fitness equipment identity board combining a metallic emblem, condensed typography, and gear applications. | `/assets/images/t001-nova/portfolio/iron-vale@1280.webp` | `/assets/images/t001-nova/portfolio/iron-vale.webp` |
| Align & Aura | Creative Portfolio | branding | Fitness, Brand Identity | A movement studio identity board combining a delicate monogram, soft neutrals, and studio materials. | `/assets/images/t001-nova/portfolio/align-and-aura@1280.webp` | `/assets/images/t001-nova/portfolio/align-and-aura.webp` |
| ForgeHouse Athletics | Creative Portfolio | branding | Fitness, Brand Identity | A strength training identity board combining a bold monogram, orange accents, and athletic applications. | `/assets/images/t001-nova/portfolio/forgehouse-athletics@1280.webp` | `/assets/images/t001-nova/portfolio/forgehouse-athletics.webp` |
| GloveHouse Boxing | Creative Portfolio | branding | Fitness, Brand Identity | A boxing identity board combining a shield-like mark, red accents, and boxing-gear mockups. | `/assets/images/t001-nova/portfolio/glovehouse-boxing@1280.webp` | `/assets/images/t001-nova/portfolio/glovehouse-boxing.webp` |
| MacroMap | Creative Portfolio | branding | Fitness, Brand Identity | A nutrition identity board combining a map-inspired symbol, bright greens, and meal-planning mockups. | `/assets/images/t001-nova/portfolio/macromap@1280.webp` | `/assets/images/t001-nova/portfolio/macromap.webp` |
| RangeLab Recovery | Creative Portfolio | branding | Fitness, Brand Identity | A recovery identity board combining a curved monogram, blue accents, and recovery-interface mockups. | `/assets/images/t001-nova/portfolio/rangelab-recovery@1280.webp` | `/assets/images/t001-nova/portfolio/rangelab-recovery.webp` |
| Northline Real Estate | Creative Portfolio | branding | Real Estate, Brand Identity | A real estate identity board combining an architectural monogram, navy and gold palette, and property materials. | `/assets/images/t001-nova/portfolio/northline-real-estate@1280.webp` | `/assets/images/t001-nova/portfolio/northline-real-estate.webp` |
| HearthMark Lending | Creative Portfolio | branding | Real Estate, Brand Identity | A home lending identity board combining a house-inspired mark, warm accents, and lending materials. | `/assets/images/t001-nova/portfolio/hearthmark-lending@1280.webp` | `/assets/images/t001-nova/portfolio/hearthmark-lending.webp` |
| KeyHaven Property | Creative Portfolio | branding | Real Estate, Brand Identity | A property management identity board combining a key-inspired monogram, blue palette, and property applications. | `/assets/images/t001-nova/portfolio/keyhaven-property@1280.webp` | `/assets/images/t001-nova/portfolio/keyhaven-property.webp` |
| RoomWright Studio | Creative Portfolio | branding | Real Estate, Brand Identity | A interior staging identity board combining an architectural monogram, warm neutrals, and room imagery. | `/assets/images/t001-nova/portfolio/roomwright-studio@1280.webp` | `/assets/images/t001-nova/portfolio/roomwright-studio.webp` |
| SagePoint Realty | Creative Portfolio | branding | Real Estate, Brand Identity | A real estate identity board combining a serif monogram, sage palette, and property materials. | `/assets/images/t001-nova/portfolio/sagepoint-realty@1280.webp` | `/assets/images/t001-nova/portfolio/sagepoint-realty.webp` |
| Vale & Stone | Creative Portfolio | branding | Real Estate, Brand Identity | A real estate identity board combining a refined monogram, dark neutrals, and architectural imagery. | `/assets/images/t001-nova/portfolio/vale-and-stone@1280.webp` | `/assets/images/t001-nova/portfolio/vale-and-stone.webp` |
| Atlas Drift | Creative Portfolio | branding | Travel, Brand Identity | A travel identity board combining a compass-like mark, forest tones, and route applications. | `/assets/images/t001-nova/portfolio/atlas-drift@1280.webp` | `/assets/images/t001-nova/portfolio/atlas-drift.webp` |
| Benny's Burgers | Creative Portfolio | branding | Food & Beverage, Brand Identity | A burger restaurant identity board combining a burger mascot, bright colors, and food packaging. | `/assets/images/t001-nova/portfolio/benny-s-burgers@1280.webp` | `/assets/images/t001-nova/portfolio/benny-s-burgers.webp` |
| Juniper Hearth | Creative Portfolio | branding | Food & Beverage, Brand Identity | A hospitality identity board combining a botanical crest, warm dark palette, and printed materials. | `/assets/images/t001-nova/portfolio/juniper-hearth@1280.webp` | `/assets/images/t001-nova/portfolio/juniper-hearth.webp` |
| Copper Fork | Creative Portfolio | branding | Food & Beverage, Brand Identity | A restaurant identity board combining a fork emblem, copper tones, and menu applications. | `/assets/images/t001-nova/portfolio/copper-fork@1280.webp` | `/assets/images/t001-nova/portfolio/copper-fork.webp` |
| Fry Bird | Creative Portfolio | branding | Food & Beverage, Brand Identity | A chicken restaurant identity board combining a bird mascot, bold lettering, and food packaging. | `/assets/images/t001-nova/portfolio/fry-bird@1280.webp` | `/assets/images/t001-nova/portfolio/fry-bird.webp` |
| Hollow Cup | Creative Portfolio | branding | Food & Beverage, Brand Identity | A coffee identity board combining a cup symbol, warm neutrals, and café packaging. | `/assets/images/t001-nova/portfolio/hollow-cup@1280.webp` | `/assets/images/t001-nova/portfolio/hollow-cup.webp` |
| TaskNest | Creative Portfolio | branding | SaaS, Brand Identity | A task management identity board combining a geometric mark, blue accents, and task-interface mockups. | `/assets/images/t001-nova/portfolio/tasknest@1280.webp` | `/assets/images/t001-nova/portfolio/tasknest.webp` |
| Harborline Capital | Creative Portfolio | branding | Finance, Brand Identity | A financial advisory identity board combining a restrained monogram, navy and sage tones, and stationery. | `/assets/images/t001-nova/portfolio/harborline-capital@1280.webp` | `/assets/images/t001-nova/portfolio/harborline-capital.webp` |
| Kindwell | Creative Portfolio | branding | Healthcare, Brand Identity | A pediatric care identity board combining a gentle symbol, warm accents, and family-facing applications. | `/assets/images/t001-nova/portfolio/kindwell@1280.webp` | `/assets/images/t001-nova/portfolio/kindwell.webp` |
| Solara Stay | Creative Portfolio | branding | Travel, Brand Identity | A hospitality identity board combining a sun-inspired monogram, warm neutrals, and guest materials. | `/assets/images/t001-nova/portfolio/solara-stay@1280.webp` | `/assets/images/t001-nova/portfolio/solara-stay.webp` |
| Tide & Trail | Creative Portfolio | branding | Travel, Brand Identity | A travel identity board combining an outdoor emblem, warm accents, and route materials. | `/assets/images/t001-nova/portfolio/tide-and-trail@1280.webp` | `/assets/images/t001-nova/portfolio/tide-and-trail.webp` |
| Bloom & Brick | Creative Portfolio | branding | Travel, Brand Identity | A walking tours identity board combining a floral emblem, muted pink tones, and city-tour materials. | `/assets/images/t001-nova/portfolio/bloom-and-brick@1280.webp` | `/assets/images/t001-nova/portfolio/bloom-and-brick.webp` |
| Lantern Lane | Creative Portfolio | branding | Travel, Brand Identity | A walking tours identity board combining a lantern emblem, gold accents, and evening-tour materials. | `/assets/images/t001-nova/portfolio/lantern-lane@1280.webp` | `/assets/images/t001-nova/portfolio/lantern-lane.webp` |
| Old Harbor | Creative Portfolio | branding | Travel, Brand Identity | A local guides identity board combining a lighthouse-inspired mark, navy accents, and guide materials. | `/assets/images/t001-nova/portfolio/old-harbor@1280.webp` | `/assets/images/t001-nova/portfolio/old-harbor.webp` |
| Aura Active | Concept Project | ads | Food & Beverage, Product Advertising, Concept Work | A beverage advertisement concept with a pale can, citrus imagery, and restrained editorial typography. | `/assets/images/t001-nova/portfolio/aura-active@1080.webp` | `/assets/images/t001-nova/portfolio/aura-active.webp` |
| Rift Product Advertising | Concept Project | ads | Food & Beverage, Fitness, Product Advertising, Concept Work | A product advertising concept using dark staging, bold type, and bright accents for energy and supplement packaging. | `/assets/images/t001-nova/portfolio/rift-energy@1080.webp` | `/assets/images/t001-nova/portfolio/rift-energy.webp` |
| Vanta Pulse | Concept Project | ads | Food & Beverage, Product Advertising, Concept Work | An energy-drink advertisement concept combining a dark product shot, colored light trails, and a strong headline. | `/assets/images/t001-nova/portfolio/vanta-pulse@1080.webp` | `/assets/images/t001-nova/portfolio/vanta-pulse.webp` |
| Macro Forge Meals | Concept Project | ads | Fitness, Food & Beverage, Concept Work | A meal-preparation advertisement concept pairing food photography with bold training-focused typography. | `/assets/images/t001-nova/portfolio/macro-forge-meals@1080.webp` | `/assets/images/t001-nova/portfolio/macro-forge-meals.webp` |
| Volt Electrolytes | Concept Project | ads | Fitness, Product Advertising, Concept Work | A hydration-product advertisement concept with electrolyte packaging, citrus accents, and cool-toned staging. | `/assets/images/t001-nova/portfolio/volt-electrolytes@1080.webp` | `/assets/images/t001-nova/portfolio/volt-electrolytes.webp` |
| Brew Core | Concept Project | ads | Food & Beverage, Product Advertising, Concept Work | A coffee-product advertisement concept combining dark cans, warm café imagery, and a condensed headline. | `/assets/images/t001-nova/portfolio/brew-core@1080.webp` | `/assets/images/t001-nova/portfolio/brew-core.webp` |
| Crunch Forge | Concept Project | ads | Food & Beverage, Product Advertising, Concept Work | A snack advertisement concept with dark packaging, peanut imagery, and contrasting orange typography. | `/assets/images/t001-nova/portfolio/crunch-forge@1080.webp` | `/assets/images/t001-nova/portfolio/crunch-forge.webp` |
| Level Up | Concept Project | ads | Fitness, Product Advertising, Concept Work | A supplement advertisement concept using game-interface motifs, neon accents, and a three-product composition. | `/assets/images/t001-nova/portfolio/level-up@1080.webp` | `/assets/images/t001-nova/portfolio/level-up.webp` |
| Vyra Active | Concept Project | ads | Fitness, Product Advertising, Concept Work | A supplement advertisement concept with soft neutral staging and a three-product packaging arrangement. | `/assets/images/t001-nova/portfolio/vyra-active@1080.webp` | `/assets/images/t001-nova/portfolio/vyra-active.webp` |
| Flowstate AI | Concept Project | ads | SaaS, Product Advertising, Concept Work | A digital-product advertisement concept showing workflow interface mockups across a laptop and tablet. | `/assets/images/t001-nova/portfolio/flowstate-ai@1080.webp` | `/assets/images/t001-nova/portfolio/flowstate-ai.webp` |
| Revnue Admin | Concept Project | ads | Dashboard, Product Advertising, Concept Work | A digital-product advertisement concept combining finance dashboard mockups with a bold typographic message. | `/assets/images/t001-nova/portfolio/revnue-admin@1080.webp` | `/assets/images/t001-nova/portfolio/revnue-admin.webp` |
| Vault IQ | Concept Project | ads | Security, Product Advertising, Concept Work | A digital-product advertisement concept with a phone-interface mockup, shield imagery, and blue lighting. | `/assets/images/t001-nova/portfolio/vault-iq@1080.webp` | `/assets/images/t001-nova/portfolio/vault-iq.webp` |
| Harbor Room — Local Table Night | Creative Portfolio | ads | Events, Food & Beverage | A dining-event graphic with atmospheric bar imagery, large type, and a date-and-time hierarchy. | `/assets/images/t001-nova/portfolio/harbor-room@1080.webp` | `/assets/images/t001-nova/portfolio/harbor-room.webp` |
| Ironwood Training Hall | Concept Project | ads | Events, Fitness | A training-event graphic pairing gym equipment imagery with a bold check-in headline. | `/assets/images/t001-nova/portfolio/ironwood-training@1080.webp` | `/assets/images/t001-nova/portfolio/ironwood-training.webp` |
| Juniper House — Author Evening | Concept Project | ads | Events, Books | An author-event graphic combining books, warm lighting, serif typography, and reservation information. | `/assets/images/t001-nova/portfolio/juniper-house@1080.webp` | `/assets/images/t001-nova/portfolio/juniper-house.webp` |
| Paper Lantern Studio | Creative Portfolio | ads | Events, Content Planning | A workshop-promotion graphic combining a content-planning interface mockup with warm desk imagery. | `/assets/images/t001-nova/portfolio/paper-lantern@1080.webp` | `/assets/images/t001-nova/portfolio/paper-lantern.webp` |
| Blue Harbor Advisory | Concept Project | ads | Finance, Service Graphic | A bookkeeping promotion concept with a tablet dashboard mockup, stationery, and a clear service headline. | `/assets/images/t001-nova/portfolio/blue-harbor@1080.webp` | `/assets/images/t001-nova/portfolio/blue-harbor.webp` |
| Hale Street Realty | Concept Project | ads | Real Estate, Service Graphic | A real-estate promotion concept with architectural photography, a navy palette, and a guidance-focused headline. | `/assets/images/t001-nova/portfolio/hale-street@1080.webp` | `/assets/images/t001-nova/portfolio/hale-street.webp` |
| Stonebridge Web Services | Concept Project | ads | Web Services, Service Graphic | A web-services promotion concept presenting laptop and tablet website mockups in a warm workspace. | `/assets/images/t001-nova/portfolio/stonebridge-web@1080.webp` | `/assets/images/t001-nova/portfolio/stonebridge-web.webp` |
| Westmere Talent | Concept Project | ads | Career, Service Graphic | A career-services promotion concept combining résumé mockups, desk imagery, and editorial typography. | `/assets/images/t001-nova/portfolio/westmere-talent@1080.webp` | `/assets/images/t001-nova/portfolio/westmere-talent.webp` |
| Cedar Plate | Concept Project | ads | Food & Beverage, Social Graphic | A restaurant social graphic combining pasta photography with a seasonal menu headline. | `/assets/images/t001-nova/portfolio/cedar-plate@1080.webp` | `/assets/images/t001-nova/portfolio/cedar-plate.webp` |
| House of Laurel | Concept Project | ads | Beauty, Social Graphic | A beauty-service social graphic with salon imagery, soft colors, and appointment-focused typography. | `/assets/images/t001-nova/portfolio/house-of-laurel@1080.webp` | `/assets/images/t001-nova/portfolio/house-of-laurel.webp` |
| Kindred Desk | Concept Project | ads | Workspace, Social Graphic | A workspace-product social graphic with an overhead desk composition and clean product typography. | `/assets/images/t001-nova/portfolio/kindred-desk@1080.webp` | `/assets/images/t001-nova/portfolio/kindred-desk.webp` |
| Marlow Pantry | Concept Project | ads | Food & Beverage, Social Graphic | A bakery social graphic pairing pastry photography, warm café colors, and an editorial headline. | `/assets/images/t001-nova/portfolio/marlow-pantry@1080.webp` | `/assets/images/t001-nova/portfolio/marlow-pantry.webp` |
| North Ledger Consulting | Concept Project | ads | Professional Banner, Operations | A professional profile-banner concept pairing operations-dashboard imagery with a concise consulting headline. | `/assets/images/t001-nova/portfolio/north-ledger@1280.webp` | `/assets/images/t001-nova/portfolio/north-ledger.webp` |
| PVD Photography — Senior Portraits | Verified Client Work | ads | Client Work, Photography, Senior Portraits | A senior-portrait advertising series combining portrait imagery, bold booking typography, and graduation details. | `/assets/images/t001-nova/portfolio/pvd-senior-portraits@1080.webp` | `/assets/images/t001-nova/portfolio/pvd-senior-portraits.webp` |
| AI & Productivity Thumbnail Design | Creative Portfolio | ads | AI Tools, Thumbnail Design | An AI-study thumbnail design using a clear headline, student imagery, and study-interface mockups. | `/assets/images/t001-nova/portfolio/ai-thumbnail-design@1280.webp` | `/assets/images/t001-nova/portfolio/ai-thumbnail-design.webp` |
| Faith & Lifestyle Thumbnail Design | Creative Portfolio | ads | Faith / Lifestyle, Thumbnail Design | A faith-focused thumbnail design combining warm portrait imagery with large, readable editorial type. | `/assets/images/t001-nova/portfolio/faith-thumbnail-design@1280.webp` | `/assets/images/t001-nova/portfolio/faith-thumbnail-design.webp` |
| Finance Thumbnail Design | Creative Portfolio | ads | Finance, Thumbnail Design | A finance thumbnail concept combining a Bitcoin illustration, a presenter, and chart imagery. | `/assets/images/t001-nova/portfolio/finance-thumbnail-design@1280.webp` | `/assets/images/t001-nova/portfolio/finance-thumbnail-design.webp` |
| Fitness Thumbnail Design | Creative Portfolio | ads | Fitness, Thumbnail Design | A fitness thumbnail design with a presenter, bold beginner-training headline, and a weekly-plan visual. | `/assets/images/t001-nova/portfolio/fitness-thumbnail-design@1280.webp` | `/assets/images/t001-nova/portfolio/fitness-thumbnail-design.webp` |
| Food Thumbnail Design | Creative Portfolio | ads | Food & Beverage, Thumbnail Design | A food thumbnail design combining a home-cooking scene, plated food, and a large recipe headline. | `/assets/images/t001-nova/portfolio/food-thumbnail-design@1280.webp` | `/assets/images/t001-nova/portfolio/food-thumbnail-design.webp` |
| Real Estate Thumbnail Design | Creative Portfolio | ads | Real Estate, Thumbnail Design | A real-estate thumbnail design with a presenter, property imagery, and a checklist-based buying headline. | `/assets/images/t001-nova/portfolio/real-estate-thumbnail-design@1280.webp` | `/assets/images/t001-nova/portfolio/real-estate-thumbnail-design.webp` |

## Fros Lawncare and unresolved findings

Searched relevant asset names/folders, project data/docs, current public portfolio and creative metadata for Fros, Fros Lawncare, lawncare, lawn care, landscape and landscaping. No matching project-specific asset, public card or deliverable mapping was identified. `frost-thumbnail.png` and its live destination both identify **JackFrost Coaching**, a fitness website; they are not Fros Lawncare. The user subsequently directed leaving Fros, TimeDock and StillPoint out. Their verified relationship/personal context is preserved above without fabricated entries. Euclid remains unmapped; HealthSync remains logo-only. No unrelated finance board or faith thumbnail substitutes for those projects.

## Reconciliations, variants and exclusions

- Birdie Bay is described as golf/events/membership work, matching both its image and live destination; the old e-commerce/checkout description is not reused.
- Frost retains its historical portfolio title, with the actual JackFrost Coaching identity stated in its description and alt. It is separate from Fros Lawncare.
- Solartec uses the real historical Solartec source artwork and explicitly states that its linked current demo uses Sunward Grid Solar branding. These are a historical presentation and later public version; current site identity is not silently substituted in the image.
- Mula is described as an expense-tracking presentation; its live version is Mula Rebuild. The unverified Custom API badge is omitted.
- Northline Plumbing is explicitly Concept Project because the live destination declares a fictional brand. Northline Strength, Northline Real Estate and Northline Plumbing are separate records.
- The 48 distinct identity boards remain individual creative records because they depict different marks, palettes, typography and applications; none is upgraded to a client or functioning application. Dense small application labels are secondary to the logo/system presentation. View Artwork opens the larger prepared image.
- Iron Vale's gear advertisement supports its single identity record. Rift energy/supplement graphics are treated as one product-advertising family. Hale Street and Westmere LinkedIn banners are alternates of their already-included service graphics, not duplicate cards. North Ledger is a distinct professional-banner concept.
- Forty-two thumbnail files are audited, but only six representative thematic entries are published to avoid many near-identical cards. Additional filenames are recorded for future case studies. Three filenames/folder placements conflict with the visible subject: `ai-tools/ai-thumbnails-side-hustles-thumbnail.png` shows a crypto-crash graphic; `ai-tools/work-10x-faster-thumbnail.png` shows Protect Your Crypto; `finance-investing/protect-your-crypto-thumbnail.png` actually shows Work 10X Faster. The true visual subject governs the mapping, not the filename.
- `portfolio/scrap.png` is a Moody Brewer alternate dominated by unsupported traffic/customer claims. It is not published. The existing claim-free Moody Brewer family is retained.
- The standalone plumber photograph is supporting imagery already used in the plumbing montage; it is not another website or an Anthony portrait.
- Founder photos, Volatile Solutions logo variants, Finder metadata and the brand-kit process Markdown are not additional project entries. They remain unchanged.

## Production asset mappings and families

Only new families were generated. Raw source copies are byte-preserved. WebP quality 80 / AVIF quality 50, effort 6, auto-orientation and no enlargement follow the existing image convention. Base filenames are 800px; named responsive widths are 220/480/640/1080/1280 when the source supports them. Square website sources receive 220/480/640/800 variants; larger creative sources also receive 1080/1280 as supported. Exact widths and SHA-256 raw-source-copy values are recorded below.

Two original exports have prominent unsupported headline stats. Their immutable raw source copies are stored with `-source.png` suffixes. Matching prepared PNG masters contain only an explicitly documented rectangular excerpt: Cloud Keep `(left=0, top=0, width=1024, height=772)` excludes 99.9% / 2M+ / 10,000+; Northline Plumbing `(0, 0, 1024, 665)` excludes the 4.9-star and response-time strips. All derivatives come from these prepared masters, so later standard optimization preserves the crop. No pixels/brands/interface content are invented, repaired or redesigned. Visible concept/illustrative notes avoid converting promotional screen content into delivered-system or business-result claims.

| Family | Source | Byte-preserved raw copy | Production family / widths | Source SHA-256 |
| --- | --- | --- | --- | --- |
| mula | `legacy-assets/portfolio/mula-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/mula.png` | `public/assets/images/t001-nova/portfolio/mula` — WebP/AVIF; 220, 480, 640, 800 | 7c10b2b90f593fbfebd3531889e9db1a79f1aa58b74b87bcd37b826df8d0132e |
| cloud-keep | `legacy-assets/portfolio/cloud-keep-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/cloud-keep-source.png` | `public/assets/images/t001-nova/portfolio/cloud-keep` — WebP/AVIF; 220, 480, 640, 800 | 4d72693d125ca1deec13246deb1facf7f83773dbce991c6f921b0ec504518256 |
| birdie-bay | `legacy-assets/portfolio/birdie-bay-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/birdie-bay.png` | `public/assets/images/t001-nova/portfolio/birdie-bay` — WebP/AVIF; 220, 480, 640, 800 | 4a3c686e32f8a1d531b472e161049400d0529d09aca336ed0f7cd5e990ac7a8b |
| frost | `legacy-assets/portfolio/frost-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/frost.png` | `public/assets/images/t001-nova/portfolio/frost` — WebP/AVIF; 220, 480, 640, 800 | b1ef6e3281944a118ecb0456e3c460f27ba2d89bc43d69b0059bb967f07bbbd2 |
| sonoran-comfort-systems | `legacy-assets/portfolio/sonoran-comfort-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/sonoran-comfort-systems.png` | `public/assets/images/t001-nova/portfolio/sonoran-comfort-systems` — WebP/AVIF; 220, 480, 640, 800 | 1c01161af0c8a6a4c3245b0d4066ed2c42e2c35c3301633d070b1aef42f3cda2 |
| northline-plumbing | `legacy-assets/portfolio/plumbing-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/northline-plumbing-source.png` | `public/assets/images/t001-nova/portfolio/northline-plumbing` — WebP/AVIF; 220, 480, 640, 800 | 205161b372c81686c4b2295c1531819398be972d28b9f40987f24788049dadb0 |
| solartec | `legacy-assets/portfolio/solar-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/solartec.png` | `public/assets/images/t001-nova/portfolio/solartec` — WebP/AVIF; 220, 480, 640, 800, 1080 | 5add7ba3327e37c2838b40d05de9711da75f3678a67b970bb4d46840fc7b90c3 |
| harbor-and-steel | `legacy-assets/portfolio/harbor-steel-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/harbor-and-steel.png` | `public/assets/images/t001-nova/portfolio/harbor-and-steel` — WebP/AVIF; 220, 480, 640, 800 | 9b0b8644f728a7f23ee57c10a0bd9c5bc036ba419a2249e188b9cf3895bbc76a |
| scholarlink | `legacy-assets/portfolio/scholar-link-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/scholarlink.png` | `public/assets/images/t001-nova/portfolio/scholarlink` — WebP/AVIF; 220, 480, 640, 800 | 5929b0b9c3727ddb540ff12c1cf2eb87ff1e5eb4aa2e9168bd0bb25b1d64da91 |
| ember-and-fig | `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Ember_and_Fig.png` | `src/assets/raw/t001-nova/portfolio/ember-and-fig.png` | `public/assets/images/t001-nova/portfolio/ember-and-fig` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 91f8320af00fe32913591b8e45a835aceb0ec81251a1cdd9f602368d279a2e9d |
| flowpilot | `legacy-assets/Graphic Design/Brand Kits/SaaS/Flow-Pilot.png` | `src/assets/raw/t001-nova/portfolio/flowpilot.png` | `public/assets/images/t001-nova/portfolio/flowpilot` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 92244bb3d77fd5fd32280e8b2436c53baf4811f8ee6688238d0e8a5cd4252117 |
| carbon-cue | `legacy-assets/Graphic Design/Brand Kits/SaaS/Carbon-Cue.png` | `src/assets/raw/t001-nova/portfolio/carbon-cue.png` | `public/assets/images/t001-nova/portfolio/carbon-cue` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 894b67a897bf1f16bfd36eb30f39d7cbb1510396193b786477a6689438503d88 |
| clip-forge | `legacy-assets/Graphic Design/Brand Kits/SaaS/Clip-Forge.png` | `src/assets/raw/t001-nova/portfolio/clip-forge.png` | `public/assets/images/t001-nova/portfolio/clip-forge` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 1efc093d4bf08feb5f1cb5b94354639899410204043f7e5524c69ab12173960e |
| patchline | `legacy-assets/Graphic Design/Brand Kits/SaaS/Patchline.png` | `src/assets/raw/t001-nova/portfolio/patchline.png` | `public/assets/images/t001-nova/portfolio/patchline` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | bc12c82a114fff1655f980185bf0b23dbd8e9b3503802cecd1e167f572228c58 |
| table-shift | `legacy-assets/Graphic Design/Brand Kits/SaaS/Table-Shift.png` | `src/assets/raw/t001-nova/portfolio/table-shift.png` | `public/assets/images/t001-nova/portfolio/table-shift` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | fe7f4b25615989587bab538df95c16528bd6f039848f2a021818ed6a9b7e3eae |
| crestline-wealth-partners | `legacy-assets/Graphic Design/Brand Kits/Finance/Crestline-Wealth.png` | `src/assets/raw/t001-nova/portfolio/crestline-wealth-partners.png` | `public/assets/images/t001-nova/portfolio/crestline-wealth-partners` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 418d71361daec5f11a2e615614e2fae069bab29e3c3afc16f2868b018db4a6fe |
| bridgewell-funding | `legacy-assets/Graphic Design/Brand Kits/Finance/Bridgewell-Funding.png` | `src/assets/raw/t001-nova/portfolio/bridgewell-funding.png` | `public/assets/images/t001-nova/portfolio/bridgewell-funding` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | c32aef4633ed0dfe12d0dd81c4e063175e5274cdedeec0d368f372b7c767828a |
| meridian-oak | `legacy-assets/Graphic Design/Brand Kits/Finance/Meridian-Oak.png` | `src/assets/raw/t001-nova/portfolio/meridian-oak.png` | `public/assets/images/t001-nova/portfolio/meridian-oak` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | c30f661f9e3ea71b3dfb3ffd3571eb652442df400d9ebb7149f1ab7a72ad695f |
| penny-pilot | `legacy-assets/Graphic Design/Brand Kits/Finance/Penny-Pilot.png` | `src/assets/raw/t001-nova/portfolio/penny-pilot.png` | `public/assets/images/t001-nova/portfolio/penny-pilot` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 0aae156c94ed2c7cd5dbd6870c02744492c4aa70382eae58552ed27d08fd39a0 |
| luma-grove-clinic | `legacy-assets/Graphic Design/Brand Kits/Medical/Luma-Grove.png` | `src/assets/raw/t001-nova/portfolio/luma-grove-clinic.png` | `public/assets/images/t001-nova/portfolio/luma-grove-clinic` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | e479d3cdbc8f197c4b97cfd7365ae01cc0ef46ff6436c8bac7864bab03cb937c |
| haven-bloom-health | `legacy-assets/Graphic Design/Brand Kits/Medical/Haven-Bloom-Health.png` | `src/assets/raw/t001-nova/portfolio/haven-bloom-health.png` | `public/assets/images/t001-nova/portfolio/haven-bloom-health` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | b75b491d223665ade6c44592aea4598a4200411268cafb25a246e80baf94c8f1 |
| pearl-and-pine-dental | `legacy-assets/Graphic Design/Brand Kits/Medical/Pearl-and-Pine-Dental.png` | `src/assets/raw/t001-nova/portfolio/pearl-and-pine-dental.png` | `public/assets/images/t001-nova/portfolio/pearl-and-pine-dental` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 4c55d5757e4ae4e594e886aa47d7febe20f2b42d237d5896555ca142a17a90e1 |
| solenne-dermatology | `legacy-assets/Graphic Design/Brand Kits/Medical/Solenne-Dermatology.png` | `src/assets/raw/t001-nova/portfolio/solenne-dermatology.png` | `public/assets/images/t001-nova/portfolio/solenne-dermatology` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | f669dcc3dc9b953b79ea015efd2f164ed5bf178d65d8234bf16f95b7d30a4b6e |
| stridewell-therapy | `legacy-assets/Graphic Design/Brand Kits/Medical/Stridewell-Therapy.png` | `src/assets/raw/t001-nova/portfolio/stridewell-therapy.png` | `public/assets/images/t001-nova/portfolio/stridewell-therapy` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 84c9c15048248ab9fbbbd6fcdfb8caf82acd6dd738aeedfa891a5bcfd371b57f |
| glossline-studio | `legacy-assets/Graphic Design/Brand Kits/Auto/Glossline-Studio.png` | `src/assets/raw/t001-nova/portfolio/glossline-studio.png` | `public/assets/images/t001-nova/portfolio/glossline-studio` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | cea40cd7aba3cbc409e2fdfc826e8714bc89f3e38693d3921e9c8b698fb65dd8 |
| gravelhorn-outfitters | `legacy-assets/Graphic Design/Brand Kits/Auto/Gravelhorn-Outfitters.png` | `src/assets/raw/t001-nova/portfolio/gravelhorn-outfitters.png` | `public/assets/images/t001-nova/portfolio/gravelhorn-outfitters` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 61914259f43b952b2f82010d34b624fde4efd3cad577e56816883153d7b6c3c7 |
| mirrorbay-detail | `legacy-assets/Graphic Design/Brand Kits/Auto/MirrorBay-Detail.png` | `src/assets/raw/t001-nova/portfolio/mirrorbay-detail.png` | `public/assets/images/t001-nova/portfolio/mirrorbay-detail` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | c12d1c12e8b71fbef8f4709ca1135737157b9fdc2eb2f6bf1f45250606879cb5 |
| route-forge | `legacy-assets/Graphic Design/Brand Kits/Auto/Route-Forge.png` | `src/assets/raw/t001-nova/portfolio/route-forge.png` | `public/assets/images/t001-nova/portfolio/route-forge` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 5554996c33172d3a84a4e79c6f60fcb943a94b6dc47f29427a27efe69826bd04 |
| volt-nest | `legacy-assets/Graphic Design/Brand Kits/Auto/Volt-Nest.png` | `src/assets/raw/t001-nova/portfolio/volt-nest.png` | `public/assets/images/t001-nova/portfolio/volt-nest` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 271ab116736e9a39cfd606281bdc5b826109d956e92d85f9ee6c783af66117bc |
| wrench-run | `legacy-assets/Graphic Design/Brand Kits/Auto/Wrench-Run.png` | `src/assets/raw/t001-nova/portfolio/wrench-run.png` | `public/assets/images/t001-nova/portfolio/wrench-run` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | bb3282e6bdf8df69ee10a9a2e83b273573483a76951b277e66ab837aa62f5534 |
| iron-vale | `legacy-assets/Graphic Design/Brand Kits/Fitness/Iron-Valve.png` | `src/assets/raw/t001-nova/portfolio/iron-vale.png` | `public/assets/images/t001-nova/portfolio/iron-vale` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 9b6451d02720aa90737057c89c3193326e94f58e681cc654ad1326ed4e5a8664 |
| align-and-aura | `legacy-assets/Graphic Design/Brand Kits/Fitness/Align-and-Aura.png` | `src/assets/raw/t001-nova/portfolio/align-and-aura.png` | `public/assets/images/t001-nova/portfolio/align-and-aura` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 6ad5020b5d646c8b94eb63d7369e42bae6a0a3538de3f09cf94c3aa1c00e3c54 |
| forgehouse-athletics | `legacy-assets/Graphic Design/Brand Kits/Fitness/ForgeHouse-Athletics.png` | `src/assets/raw/t001-nova/portfolio/forgehouse-athletics.png` | `public/assets/images/t001-nova/portfolio/forgehouse-athletics` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | e0b6d1c70803cfe2baaa3129ad6a4c95553775dd4fe5e58c9117b1393ffefbbc |
| glovehouse-boxing | `legacy-assets/Graphic Design/Brand Kits/Fitness/GloveHouse-Boxing.png` | `src/assets/raw/t001-nova/portfolio/glovehouse-boxing.png` | `public/assets/images/t001-nova/portfolio/glovehouse-boxing` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 679f502f36629ddee5a56d1906db1ec103b6cbcbcbfc67745c613a06b78c67e1 |
| macromap | `legacy-assets/Graphic Design/Brand Kits/Fitness/MacroMap.png` | `src/assets/raw/t001-nova/portfolio/macromap.png` | `public/assets/images/t001-nova/portfolio/macromap` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 3f3368bc193507bd3b508ee5aa9dc374f9ec1361de97c3136247a6ff3640e5e1 |
| rangelab-recovery | `legacy-assets/Graphic Design/Brand Kits/Fitness/RangeLab-Recovery.png` | `src/assets/raw/t001-nova/portfolio/rangelab-recovery.png` | `public/assets/images/t001-nova/portfolio/rangelab-recovery` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | d6a51cbddbd6a0601507f1a6da22a92df955a4a8d85aa5a322068be61424c052 |
| northline-real-estate | `legacy-assets/Graphic Design/Brand Kits/Real Estate/Northline-Real-Estate.png` | `src/assets/raw/t001-nova/portfolio/northline-real-estate.png` | `public/assets/images/t001-nova/portfolio/northline-real-estate` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | d8971fd2c05ee67ca9028599e451114570f8c8a0269cd84af31dec1ae868f81a |
| hearthmark-lending | `legacy-assets/Graphic Design/Brand Kits/Real Estate/HearthMark-Lending.png` | `src/assets/raw/t001-nova/portfolio/hearthmark-lending.png` | `public/assets/images/t001-nova/portfolio/hearthmark-lending` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 262beecd1f251734c40bb6f2aa4b38b96f163db0846dbee26a7be7bc6637fb11 |
| keyhaven-property | `legacy-assets/Graphic Design/Brand Kits/Real Estate/KeyHaven-Property.png` | `src/assets/raw/t001-nova/portfolio/keyhaven-property.png` | `public/assets/images/t001-nova/portfolio/keyhaven-property` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 8f124d271a909bbd5288a0b31e6f20cdbc73bad80e2946af56821301507ac454 |
| roomwright-studio | `legacy-assets/Graphic Design/Brand Kits/Real Estate/RoomWright-Studio.png` | `src/assets/raw/t001-nova/portfolio/roomwright-studio.png` | `public/assets/images/t001-nova/portfolio/roomwright-studio` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | bae65a5dacd3680e54bbe85b037a134c1258addf0f1cb7a5e22a81247578e014 |
| sagepoint-realty | `legacy-assets/Graphic Design/Brand Kits/Real Estate/SagePoint-Realty.png` | `src/assets/raw/t001-nova/portfolio/sagepoint-realty.png` | `public/assets/images/t001-nova/portfolio/sagepoint-realty` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 184868a2abd437d3101ff3c0c9423ebd64a8f0ff549e702488c5f865639ecd7a |
| vale-and-stone | `legacy-assets/Graphic Design/Brand Kits/Real Estate/Vale-and-Stone.png` | `src/assets/raw/t001-nova/portfolio/vale-and-stone.png` | `public/assets/images/t001-nova/portfolio/vale-and-stone` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | c21f3b9f8b43082d1b8aa0d9ff22e2c973aa0eed68093ab8a399216161933605 |
| atlas-drift | `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Atlas-Drift.png` | `src/assets/raw/t001-nova/portfolio/atlas-drift.png` | `public/assets/images/t001-nova/portfolio/atlas-drift` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 9290d63743d577d1d9708b6fdd8599971ea1abf4b3e268f31254e94bc6c72f00 |
| benny-s-burgers | `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Bennys-Burgers.png` | `src/assets/raw/t001-nova/portfolio/benny-s-burgers.png` | `public/assets/images/t001-nova/portfolio/benny-s-burgers` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 4c2a5e112212d7554cecf64959473488e3c0bff188763c6a7660703c3400986d |
| juniper-hearth | `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Juniper-Hearth.png` | `src/assets/raw/t001-nova/portfolio/juniper-hearth.png` | `public/assets/images/t001-nova/portfolio/juniper-hearth` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | d0159e425fbb88f1fed85f0a6db90281f6196fc559a15d99e1b5c39caf91f857 |
| copper-fork | `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Copper-Fork.png` | `src/assets/raw/t001-nova/portfolio/copper-fork.png` | `public/assets/images/t001-nova/portfolio/copper-fork` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 02d333ddd0d8744c74994c0ed653e427833e4adcb910e209ab2aaff2e8a60c71 |
| fry-bird | `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Fry-Bird.png` | `src/assets/raw/t001-nova/portfolio/fry-bird.png` | `public/assets/images/t001-nova/portfolio/fry-bird` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 0033247c76d75ca76f9ebc2332bd67eee54b7513263567112eb96604aaded6dc |
| hollow-cup | `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Hollow-Cup.png` | `src/assets/raw/t001-nova/portfolio/hollow-cup.png` | `public/assets/images/t001-nova/portfolio/hollow-cup` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 6db6b982c4f903853ada860609ea08a7da15d03b12e0ce2610e23821003d46c5 |
| tasknest | `legacy-assets/Graphic Design/Brand Kits/SaaS/Task-Nest.png` | `src/assets/raw/t001-nova/portfolio/tasknest.png` | `public/assets/images/t001-nova/portfolio/tasknest` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 4cc48aef9823daaef33b8982147bda7fc03428dfb63c4ad3fbac4d3433fad866 |
| harborline-capital | `legacy-assets/Graphic Design/Brand Kits/Finance/Harborline-Capital.png` | `src/assets/raw/t001-nova/portfolio/harborline-capital.png` | `public/assets/images/t001-nova/portfolio/harborline-capital` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | ac593b33d66895997e511c328ac21a86bf7c347398ce45967b41d4fedcc29c24 |
| kindwell | `legacy-assets/Graphic Design/Brand Kits/Medical/Kindwell.png` | `src/assets/raw/t001-nova/portfolio/kindwell.png` | `public/assets/images/t001-nova/portfolio/kindwell` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 306a082cabc73c0e9e622094804ae753a91a3de3f458568db9f60c0481f4a89a |
| solara-stay | `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Solara-Stay.png` | `src/assets/raw/t001-nova/portfolio/solara-stay.png` | `public/assets/images/t001-nova/portfolio/solara-stay` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 8d0520656164fc295004b68d3b8400ee751dd7a33de68f7424e5b59107f884e8 |
| tide-and-trail | `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Tide-and-Trail.png` | `src/assets/raw/t001-nova/portfolio/tide-and-trail.png` | `public/assets/images/t001-nova/portfolio/tide-and-trail` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 1f130fb66f6025885dc627491433be591af5e1ccb2fc1cb73dcbff9f12df8777 |
| bloom-and-brick | `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Bloom-and-Brick.png` | `src/assets/raw/t001-nova/portfolio/bloom-and-brick.png` | `public/assets/images/t001-nova/portfolio/bloom-and-brick` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 6fc251248b9f2e2bf57cfd6523cacfef2c9a2284fc34efa7ba78a6faa309dc71 |
| lantern-lane | `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Lantern-Lane.png` | `src/assets/raw/t001-nova/portfolio/lantern-lane.png` | `public/assets/images/t001-nova/portfolio/lantern-lane` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 875d745986d5ee5195d495a483cef2c6e2bd9dcf69d6986a338f245d20d3213a |
| old-harbor | `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Old-Harbor.png` | `src/assets/raw/t001-nova/portfolio/old-harbor.png` | `public/assets/images/t001-nova/portfolio/old-harbor` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | a8dfbeb96bb5769cf6493b30654a87995ed38547141bb5c625e15b70fa13ac92 |
| aura-active | `legacy-assets/Graphic Design/Energy Drinks/aura-active.png` | `src/assets/raw/t001-nova/portfolio/aura-active.png` | `public/assets/images/t001-nova/portfolio/aura-active` — WebP/AVIF; 220, 480, 640, 800, 1080 | d821c209bc2d3a3312783263ace92f4e298d73cea331aa5c3ae892e51cc258ca |
| rift-energy | `legacy-assets/Graphic Design/Energy Drinks/rift-energy.png` | `src/assets/raw/t001-nova/portfolio/rift-energy.png` | `public/assets/images/t001-nova/portfolio/rift-energy` — WebP/AVIF; 220, 480, 640, 800, 1080 | 7285d3c942d27ff1dff8121484b27ac69a04f064dec319d9c776969f6de0d67f |
| vanta-pulse | `legacy-assets/Graphic Design/Energy Drinks/vanta-pulse-energy.png` | `src/assets/raw/t001-nova/portfolio/vanta-pulse.png` | `public/assets/images/t001-nova/portfolio/vanta-pulse` — WebP/AVIF; 220, 480, 640, 800, 1080 | 219bde349dd66467829fb77e3e231685eb53aa00fd6ec60ca13c804c565a7246 |
| macro-forge-meals | `legacy-assets/Graphic Design/Fitness/macro-forge-meals.png` | `src/assets/raw/t001-nova/portfolio/macro-forge-meals.png` | `public/assets/images/t001-nova/portfolio/macro-forge-meals` — WebP/AVIF; 220, 480, 640, 800, 1080 | 05e5379a7ac3a6b6eb8585ea234d571ab0a912425cd06f95d7899f5bd6472a30 |
| volt-electrolytes | `legacy-assets/Graphic Design/Fitness/volt-electrolytes.png` | `src/assets/raw/t001-nova/portfolio/volt-electrolytes.png` | `public/assets/images/t001-nova/portfolio/volt-electrolytes` — WebP/AVIF; 220, 480, 640, 800, 1080 | 6167462927236c8be12785bf46ad7532ea5e84987f5c39be57df4b029d8de3f3 |
| brew-core | `legacy-assets/Graphic Design/Food-and-Beverage/brew-core-coffee.png` | `src/assets/raw/t001-nova/portfolio/brew-core.png` | `public/assets/images/t001-nova/portfolio/brew-core` — WebP/AVIF; 220, 480, 640, 800, 1080 | 651fe37bf55f0ceb0b42e6158b9c114ed8a0e60c89ecb19d8294b02e374bd345 |
| crunch-forge | `legacy-assets/Graphic Design/Food-and-Beverage/crunch-forge-snack.png` | `src/assets/raw/t001-nova/portfolio/crunch-forge.png` | `public/assets/images/t001-nova/portfolio/crunch-forge` — WebP/AVIF; 220, 480, 640, 800, 1080 | 1bd6a6e5a27511bb69e6a009d642b83a3aa16a0c81924096770f2ee3abc267fe |
| level-up | `legacy-assets/Graphic Design/Supplements/level-up-pre.png` | `src/assets/raw/t001-nova/portfolio/level-up.png` | `public/assets/images/t001-nova/portfolio/level-up` — WebP/AVIF; 220, 480, 640, 800, 1080 | 84254b05d177f769a461c15f1fb4a083b971bdcba3ce1d7f1e042561a8e77b80 |
| vyra-active | `legacy-assets/Graphic Design/Supplements/vyra-active.png` | `src/assets/raw/t001-nova/portfolio/vyra-active.png` | `public/assets/images/t001-nova/portfolio/vyra-active` — WebP/AVIF; 220, 480, 640, 800, 1080 | 6be3f5a4c7e54274d533f3c0739e07c5d20f6b98409d354c89229bbb1b594fa2 |
| flowstate-ai | `legacy-assets/Graphic Design/Tech/flowstate-ai.png` | `src/assets/raw/t001-nova/portfolio/flowstate-ai.png` | `public/assets/images/t001-nova/portfolio/flowstate-ai` — WebP/AVIF; 220, 480, 640, 800, 1080 | f11c2660470cb929f9c00206d047f44669b3f2590a9501c8eaf4b5bec639941f |
| revnue-admin | `legacy-assets/Graphic Design/Tech/revnue-admin.png` | `src/assets/raw/t001-nova/portfolio/revnue-admin.png` | `public/assets/images/t001-nova/portfolio/revnue-admin` — WebP/AVIF; 220, 480, 640, 800, 1080 | dfa1f62ef750cf3314776a81142b95e730927cbf8cc045e0feed7403e898e842 |
| vault-iq | `legacy-assets/Graphic Design/Tech/vault-iq-security.png` | `src/assets/raw/t001-nova/portfolio/vault-iq.png` | `public/assets/images/t001-nova/portfolio/vault-iq` — WebP/AVIF; 220, 480, 640, 800, 1080 | 469ca808c0e8324e4e2b0d4fb3ffa46d56ead02a544db7b8a0518e6684f482a9 |
| harbor-room | `legacy-assets/Graphic Design/Social Media Promo/Event Graphics/harbor-room-local-table-night.png` | `src/assets/raw/t001-nova/portfolio/harbor-room.png` | `public/assets/images/t001-nova/portfolio/harbor-room` — WebP/AVIF; 220, 480, 640, 800, 1080 | 72cdf0ba7f596c12de9cd9e7945b4ca47cd676eace1d2e7365762d5928e23ede |
| ironwood-training | `legacy-assets/Graphic Design/Social Media Promo/Event Graphics/ironwood-training-event.png` | `src/assets/raw/t001-nova/portfolio/ironwood-training.png` | `public/assets/images/t001-nova/portfolio/ironwood-training` — WebP/AVIF; 220, 480, 640, 800, 1080 | 77781a903678a39ff7ae05f849abf863efbc307c95494ff9467aaef1096f1fb8 |
| juniper-house | `legacy-assets/Graphic Design/Social Media Promo/Event Graphics/juniper-house-author-evening.png` | `src/assets/raw/t001-nova/portfolio/juniper-house.png` | `public/assets/images/t001-nova/portfolio/juniper-house` — WebP/AVIF; 220, 480, 640, 800, 1080 | 5f3fd148a8c2565589ec1da39b20f8c4147db45fd3573adbf064716c3d82fd4f |
| paper-lantern | `legacy-assets/Graphic Design/Social Media Promo/Event Graphics/paper-lantern-studio.png` | `src/assets/raw/t001-nova/portfolio/paper-lantern.png` | `public/assets/images/t001-nova/portfolio/paper-lantern` — WebP/AVIF; 220, 480, 640, 800, 1080 | bdbe6a5d4ee6eb8936f921453e098d4c53f5fa79c7e5238cd2f2949bd50e6ddf |
| blue-harbor | `legacy-assets/Graphic Design/Social Media Promo/Service Graphics/blue-harbor-bookkeeping.png` | `src/assets/raw/t001-nova/portfolio/blue-harbor.png` | `public/assets/images/t001-nova/portfolio/blue-harbor` — WebP/AVIF; 220, 480, 640, 800, 1080 | ecf1ab3035e681102f473cca45c25b8d0d6a22118a153d86b7264ca6c43ec20c |
| hale-street | `legacy-assets/Graphic Design/Social Media Promo/Service Graphics/hale-street-realty.png` | `src/assets/raw/t001-nova/portfolio/hale-street.png` | `public/assets/images/t001-nova/portfolio/hale-street` — WebP/AVIF; 220, 480, 640, 800, 1080 | 4f7c9cbcbd0e67077c342e0e0317b95c5cab90c4a24575b250021721187976f2 |
| stonebridge-web | `legacy-assets/Graphic Design/Social Media Promo/Service Graphics/stonebridge-web-services.png` | `src/assets/raw/t001-nova/portfolio/stonebridge-web.png` | `public/assets/images/t001-nova/portfolio/stonebridge-web` — WebP/AVIF; 220, 480, 640, 800, 1080 | aab32b34668cbd1008921f97231e8606897c0cc4c4e69b134f83f56785de9e80 |
| westmere-talent | `legacy-assets/Graphic Design/Social Media Promo/Service Graphics/westmere-talent-resume-building.png` | `src/assets/raw/t001-nova/portfolio/westmere-talent.png` | `public/assets/images/t001-nova/portfolio/westmere-talent` — WebP/AVIF; 220, 480, 640, 800, 1080 | 78d605cea174c8e45652cafca3ce4744987b2bf62d82a5956c32b53d1e662c96 |
| cedar-plate | `legacy-assets/Graphic Design/Social Media Promo/Social Posts/cedar-plate-food.png` | `src/assets/raw/t001-nova/portfolio/cedar-plate.png` | `public/assets/images/t001-nova/portfolio/cedar-plate` — WebP/AVIF; 220, 480, 640, 800, 1080 | a251e0f118418d0d735e799ac3d422ee7fc65fe76de6288efc0ef6bb4cf84999 |
| house-of-laurel | `legacy-assets/Graphic Design/Social Media Promo/Social Posts/house-of-laurel-beauty.png` | `src/assets/raw/t001-nova/portfolio/house-of-laurel.png` | `public/assets/images/t001-nova/portfolio/house-of-laurel` — WebP/AVIF; 220, 480, 640, 800, 1080 | aa893a3b36b8b91344208140944b9641fd6b487ead5c30ea203e84cd6104ccdf |
| kindred-desk | `legacy-assets/Graphic Design/Social Media Promo/Social Posts/kind-red-desk-equippment.png` | `src/assets/raw/t001-nova/portfolio/kindred-desk.png` | `public/assets/images/t001-nova/portfolio/kindred-desk` — WebP/AVIF; 220, 480, 640, 800, 1080 | f1d6e0c4281c7fe4c3c0235bc2a8649bd92f6c04d02b59797eb2bc9ea409a4c0 |
| marlow-pantry | `legacy-assets/Graphic Design/Social Media Promo/Social Posts/marlow-pastry-bakery.png` | `src/assets/raw/t001-nova/portfolio/marlow-pantry.png` | `public/assets/images/t001-nova/portfolio/marlow-pantry` — WebP/AVIF; 220, 480, 640, 800, 1080 | 81a7116d13faffd889fec24128daf197a1bddc04b4fe2c01a6080939c4d33951 |
| north-ledger | `legacy-assets/Graphic Design/Social Media Promo/LinkedIn Banners/linkedin-banner-1.png` | `src/assets/raw/t001-nova/portfolio/north-ledger.png` | `public/assets/images/t001-nova/portfolio/north-ledger` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 0a865f7a26d1cb35e6b871a3f34a224f72456b65011e8e35ade5563f4c8dde1f |
| pvd-senior-portraits | `legacy-assets/Graphic Design/Real Clients/PVD Photographer/Senior Portraits_ Your Year, Your Story.png` | `src/assets/raw/t001-nova/portfolio/pvd-senior-portraits.png` | `public/assets/images/t001-nova/portfolio/pvd-senior-portraits` — WebP/AVIF; 220, 480, 640, 800, 1080 | 8e4f83b4a025107b7af7375dc3dec08932d0bf39f6b8294df01b491be8a24b5e |
| ai-thumbnail-design | `legacy-assets/Graphic Design/Thumbnails/ai-tools/study-smarter-with-ai-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/ai-thumbnail-design.png` | `public/assets/images/t001-nova/portfolio/ai-thumbnail-design` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | cd3185a0c56ca75cb5b6111628c71e1855359adf0e769659ba0398bae2f32631 |
| faith-thumbnail-design | `legacy-assets/Graphic Design/Thumbnails/faith-god/god-was-preparing-me-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/faith-thumbnail-design.png` | `public/assets/images/t001-nova/portfolio/faith-thumbnail-design` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 84619b802d54909bbc61932ad249183dfe193735dd56481a078c6af55928043d |
| finance-thumbnail-design | `legacy-assets/Graphic Design/Thumbnails/finance-investing/bitcoin-breakout-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/finance-thumbnail-design.png` | `public/assets/images/t001-nova/portfolio/finance-thumbnail-design` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 3986c1c821db686ab8121b484de58509035c8d0da6380264797e02ea1e3a0be8 |
| fitness-thumbnail-design | `legacy-assets/Graphic Design/Thumbnails/fitness/best-beginner-gym-plan-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/fitness-thumbnail-design.png` | `public/assets/images/t001-nova/portfolio/fitness-thumbnail-design` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 1aed798215db8e601476a3ad0f35a5ee3bd61f2466d7e573fad18d9dfbc21acf |
| food-thumbnail-design | `legacy-assets/Graphic Design/Thumbnails/food-restaurant/family-secret-recipie-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/food-thumbnail-design.png` | `public/assets/images/t001-nova/portfolio/food-thumbnail-design` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 02c9fda1b81b0773cba5fdd2d5b27ba47babe7acf8db6bd5d9d9391dd9f44faa |
| real-estate-thumbnail-design | `legacy-assets/Graphic Design/Thumbnails/real-estate/dont-buy-until-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/real-estate-thumbnail-design.png` | `public/assets/images/t001-nova/portfolio/real-estate-thumbnail-design` — WebP/AVIF; 220, 480, 640, 800, 1080, 1280 | 50b8f2b2895454f178a4b2899249904e12fda2e6816e8d88a7159742496acf2a |

## Additional real images available for later case studies

These remain source material, not additional published cards or generated galleries.

| Work / collection | Supporting source |
| --- | --- |
| Iron Vale | `legacy-assets/Graphic Design/Fitness/iron-vale-fitness-gear.png` |
| Rift Product Advertising | `legacy-assets/Graphic Design/Supplements/rift-performance.png` |
| Hale Street Realty | `legacy-assets/Graphic Design/Social Media Promo/LinkedIn Banners/linkedin-banner-2.png` |
| Westmere Talent | `legacy-assets/Graphic Design/Social Media Promo/LinkedIn Banners/linkedin-banner-3.png` |
| PVD Photography — Senior Portraits | `legacy-assets/Graphic Design/Real Clients/PVD Photographer/Senior Portraits_ Capture Your Moment.png` |
| PVD Photography — Senior Portraits | `legacy-assets/Graphic Design/Real Clients/PVD Photographer/Your Year, Your Story.png` |
| AI & Productivity Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/ai-tools/ai-replacing-creativity.png` |
| AI & Productivity Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/ai-tools/ai-side-hustles-that-work-thumbnail.png` |
| AI & Productivity Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/ai-tools/automate-your-business-ai-thumbnail.png` |
| AI & Productivity Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/finance-investing/protect-your-crypto-thumbnail.png` |
| Faith & Lifestyle Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/faith-god/broke-my-plans-thumbnail.png` |
| Faith & Lifestyle Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/faith-god/god-changed-desires-thumbnail.png` |
| Faith & Lifestyle Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/faith-god/god-closed-that-door-thumbnail.png` |
| Faith & Lifestyle Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/faith-god/god-is-rebuilding-me-thumbnail.png` |
| Faith & Lifestyle Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/faith-god/god-removed-distractions-thumbnail.png` |
| Faith & Lifestyle Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/faith-god/got-changed-my-circle-thumbnail.png` |
| Faith & Lifestyle Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/faith-god/i-had-to-let-go-thumbnail.png` |
| Faith & Lifestyle Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/faith-god/i-was-lukewarm-thumbnail.png` |
| Faith & Lifestyle Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/faith-god/season-has-purpose-thumbnail.png` |
| Faith & Lifestyle Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/faith-god/stop-forcing-it-thumbnail.png` |
| Faith & Lifestyle Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/faith-god/stop-running-from-god-thumbnail.png` |
| Faith & Lifestyle Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/faith-god/test-before-blessing-thumbnail.png` |
| Faith & Lifestyle Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/faith-god/the-prayer-almost-quit-thumbnail.png` |
| Faith & Lifestyle Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/faith-god/when-god-feels-silent-thumbnail.png` |
| Finance Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/finance-investing/ChatGPT Image May 23, 2026, 09_10_05 PM.png` |
| Finance Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/finance-investing/alt-coins-running-thumbnail.png` |
| Finance Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/finance-investing/buy-before-the-breakout-thumbnail.png` |
| Finance Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/finance-investing/start-crypto-right-thumbnail.png` |
| Finance Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/ai-tools/ai-thumbnails-side-hustles-thumbnail.png` |
| Finance Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/ai-tools/work-10x-faster-thumbnail.png` |
| Fitness Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/fitness/build-muscle-faster-thumbnail.png` |
| Fitness Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/fitness/home-workouts-thumbnail.png` |
| Fitness Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/fitness/not-losing-fat-thumbnail.png` |
| Fitness Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/fitness/stop-training-glutes-wrong-thumbnail.png` |
| Fitness Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/fitness/stop-training-wrong-thumbnail.png` |
| Food Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/food-restaurant/cheap-meal-prep-thumbnail.png` |
| Food Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/food-restaurant/date-night-dinner-thumbnail.png` |
| Food Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/food-restaurant/food-myth-busted-thumbnail.png` |
| Food Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/food-restaurant/viral-food-worth-it-thumbnail.png` |
| Food Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/food-restaurant/worth-the-hype-thumbnail.png` |
| Real Estate Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/real-estate/real-estate-buy-now-market-update-thumbnail.png` |
| Real Estate Thumbnail Design | `legacy-assets/Graphic Design/Thumbnails/real-estate/worth-moving-here-thumbnail.png` |
| PVD Photography — wedding alternate | `legacy-assets/Graphic Design/Real Clients/PVD Photographer/Beautifully Remembered Wedding Moments.png` |

## Complete current legacy image disposition

Every current raster is accounted for below. Source dimensions are measured from the files in this pass, not copied from the historical inventory. Whole-library SHA-256 comparisons separately cover hidden/non-image files.

| Exact source | Dimensions | Format | Disposition |
| --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Brand Kits/Auto/Glossline-Studio.png` | 1586×992 | PNG | B — new primary: glossline-studio |
| `legacy-assets/Graphic Design/Brand Kits/Auto/Gravelhorn-Outfitters.png` | 1536×1024 | PNG | B — new primary: gravelhorn-outfitters |
| `legacy-assets/Graphic Design/Brand Kits/Auto/MirrorBay-Detail.png` | 1536×1024 | PNG | B — new primary: mirrorbay-detail |
| `legacy-assets/Graphic Design/Brand Kits/Auto/Route-Forge.png` | 1536×1024 | PNG | B — new primary: route-forge |
| `legacy-assets/Graphic Design/Brand Kits/Auto/Volt-Nest.png` | 1586×992 | PNG | B — new primary: volt-nest |
| `legacy-assets/Graphic Design/Brand Kits/Auto/Wrench-Run.png` | 1586×992 | PNG | B — new primary: wrench-run |
| `legacy-assets/Graphic Design/Brand Kits/Finance/Bridgewell-Funding.png` | 1536×1024 | PNG | B — new primary: bridgewell-funding |
| `legacy-assets/Graphic Design/Brand Kits/Finance/Crestline-Wealth.png` | 1586×992 | PNG | B — new primary: crestline-wealth-partners |
| `legacy-assets/Graphic Design/Brand Kits/Finance/Harborline-Capital.png` | 1586×992 | PNG | B — new primary: harborline-capital |
| `legacy-assets/Graphic Design/Brand Kits/Finance/Ledger-and-Loom.png` | 1536×1024 | PNG | A — retained primary: ledger-and-loom |
| `legacy-assets/Graphic Design/Brand Kits/Finance/Meridian-Oak.png` | 1536×1024 | PNG | B — new primary: meridian-oak |
| `legacy-assets/Graphic Design/Brand Kits/Finance/Penny-Pilot.png` | 1536×1024 | PNG | B — new primary: penny-pilot |
| `legacy-assets/Graphic Design/Brand Kits/Fitness/Align-and-Aura.png` | 1536×1024 | PNG | B — new primary: align-and-aura |
| `legacy-assets/Graphic Design/Brand Kits/Fitness/ForgeHouse-Athletics.png` | 1536×1024 | PNG | B — new primary: forgehouse-athletics |
| `legacy-assets/Graphic Design/Brand Kits/Fitness/GloveHouse-Boxing.png` | 1586×992 | PNG | B — new primary: glovehouse-boxing |
| `legacy-assets/Graphic Design/Brand Kits/Fitness/Iron-Valve.png` | 1586×992 | PNG | B — new primary: iron-vale |
| `legacy-assets/Graphic Design/Brand Kits/Fitness/MacroMap.png` | 1536×1024 | PNG | B — new primary: macromap |
| `legacy-assets/Graphic Design/Brand Kits/Fitness/RangeLab-Recovery.png` | 1536×1024 | PNG | B — new primary: rangelab-recovery |
| `legacy-assets/Graphic Design/Brand Kits/Medical/Haven-Bloom-Health.png` | 1536×1024 | PNG | B — new primary: haven-bloom-health |
| `legacy-assets/Graphic Design/Brand Kits/Medical/Kindwell.png` | 1586×992 | PNG | B — new primary: kindwell |
| `legacy-assets/Graphic Design/Brand Kits/Medical/Luma-Grove.png` | 1536×1024 | PNG | B — new primary: luma-grove-clinic |
| `legacy-assets/Graphic Design/Brand Kits/Medical/Pearl-and-Pine-Dental.png` | 1586×992 | PNG | B — new primary: pearl-and-pine-dental |
| `legacy-assets/Graphic Design/Brand Kits/Medical/Solenne-Dermatology.png` | 1586×992 | PNG | B — new primary: solenne-dermatology |
| `legacy-assets/Graphic Design/Brand Kits/Medical/Stridewell-Therapy.png` | 1536×1024 | PNG | B — new primary: stridewell-therapy |
| `legacy-assets/Graphic Design/Brand Kits/Real Estate/HearthMark-Lending.png` | 1536×1024 | PNG | B — new primary: hearthmark-lending |
| `legacy-assets/Graphic Design/Brand Kits/Real Estate/KeyHaven-Property.png` | 1586×992 | PNG | B — new primary: keyhaven-property |
| `legacy-assets/Graphic Design/Brand Kits/Real Estate/Northline-Real-Estate.png` | 1586×992 | PNG | B — new primary: northline-real-estate |
| `legacy-assets/Graphic Design/Brand Kits/Real Estate/RoomWright-Studio.png` | 1586×992 | PNG | B — new primary: roomwright-studio |
| `legacy-assets/Graphic Design/Brand Kits/Real Estate/SagePoint-Realty.png` | 1586×992 | PNG | B — new primary: sagepoint-realty |
| `legacy-assets/Graphic Design/Brand Kits/Real Estate/Vale-and-Stone.png` | 1586×992 | PNG | B — new primary: vale-and-stone |
| `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Bennys-Burgers.png` | 1536×1024 | PNG | B — new primary: benny-s-burgers |
| `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Copper-Fork.png` | 1536×1024 | PNG | B — new primary: copper-fork |
| `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Ember_and_Fig.png` | 1586×992 | PNG | B — new primary: ember-and-fig |
| `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Fry-Bird.png` | 1536×1024 | PNG | B — new primary: fry-bird |
| `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Hollow-Cup.png` | 1536×1024 | PNG | B — new primary: hollow-cup |
| `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Juniper-Hearth.png` | 1586×992 | PNG | B — new primary: juniper-hearth |
| `legacy-assets/Graphic Design/Brand Kits/SaaS/Carbon-Cue.png` | 1536×1024 | PNG | B — new primary: carbon-cue |
| `legacy-assets/Graphic Design/Brand Kits/SaaS/Clip-Forge.png` | 1586×992 | PNG | B — new primary: clip-forge |
| `legacy-assets/Graphic Design/Brand Kits/SaaS/Flow-Pilot.png` | 1586×992 | PNG | B — new primary: flowpilot |
| `legacy-assets/Graphic Design/Brand Kits/SaaS/Patchline.png` | 1586×992 | PNG | B — new primary: patchline |
| `legacy-assets/Graphic Design/Brand Kits/SaaS/Table-Shift.png` | 1586×992 | PNG | B — new primary: table-shift |
| `legacy-assets/Graphic Design/Brand Kits/SaaS/Task-Nest.png` | 1536×1024 | PNG | B — new primary: tasknest |
| `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Atlas-Drift.png` | 1586×992 | PNG | B — new primary: atlas-drift |
| `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Bloom-and-Brick.png` | 1586×992 | PNG | B — new primary: bloom-and-brick |
| `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Lantern-Lane.png` | 1536×1024 | PNG | B — new primary: lantern-lane |
| `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Old-Harbor.png` | 1586×992 | PNG | B — new primary: old-harbor |
| `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Solara-Stay.png` | 1586×992 | PNG | B — new primary: solara-stay |
| `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Tide-and-Trail.png` | 1586×992 | PNG | B — new primary: tide-and-trail |
| `legacy-assets/Graphic Design/Energy Drinks/aura-active.png` | 1254×1254 | PNG | B — new primary: aura-active |
| `legacy-assets/Graphic Design/Energy Drinks/rift-energy.png` | 1254×1254 | PNG | B — new primary: rift-energy |
| `legacy-assets/Graphic Design/Energy Drinks/vanta-pulse-energy.png` | 1254×1254 | PNG | B — new primary: vanta-pulse |
| `legacy-assets/Graphic Design/Fitness/iron-vale-fitness-gear.png` | 1254×1254 | PNG | D — supporting/alternate: iron-vale |
| `legacy-assets/Graphic Design/Fitness/macro-forge-meals.png` | 1254×1254 | PNG | B — new primary: macro-forge-meals |
| `legacy-assets/Graphic Design/Fitness/volt-electrolytes.png` | 1254×1254 | PNG | B — new primary: volt-electrolytes |
| `legacy-assets/Graphic Design/Food-and-Beverage/brew-core-coffee.png` | 1254×1254 | PNG | B — new primary: brew-core |
| `legacy-assets/Graphic Design/Food-and-Beverage/crunch-forge-snack.png` | 1254×1254 | PNG | B — new primary: crunch-forge |
| `legacy-assets/Graphic Design/Food-and-Beverage/luma-spritz-water.png` | 1254×1254 | PNG | A — retained primary: luma-spritz |
| `legacy-assets/Graphic Design/Real Clients/PVD Photographer/Beautifully Remembered Wedding Moments.png` | 1254×1254 | PNG | D — supporting/alternate: pvd-photography |
| `legacy-assets/Graphic Design/Real Clients/PVD Photographer/PVD Wedding Photography Editorial Collage.png` | 1254×1254 | PNG | A — retained primary: pvd-photography |
| `legacy-assets/Graphic Design/Real Clients/PVD Photographer/Senior Portraits_ Capture Your Moment.png` | 1254×1254 | PNG | D — supporting/alternate: pvd-senior-portraits |
| `legacy-assets/Graphic Design/Real Clients/PVD Photographer/Senior Portraits_ Your Year, Your Story.png` | 1254×1254 | PNG | B — new primary: pvd-senior-portraits |
| `legacy-assets/Graphic Design/Real Clients/PVD Photographer/Your Year, Your Story.png` | 1254×1254 | PNG | D — supporting/alternate: pvd-senior-portraits |
| `legacy-assets/Graphic Design/Social Media Promo/Event Graphics/harbor-room-local-table-night.png` | 1254×1254 | PNG | B — new primary: harbor-room |
| `legacy-assets/Graphic Design/Social Media Promo/Event Graphics/ironwood-training-event.png` | 1254×1254 | PNG | B — new primary: ironwood-training |
| `legacy-assets/Graphic Design/Social Media Promo/Event Graphics/juniper-house-author-evening.png` | 1254×1254 | PNG | B — new primary: juniper-house |
| `legacy-assets/Graphic Design/Social Media Promo/Event Graphics/paper-lantern-studio.png` | 1254×1254 | PNG | B — new primary: paper-lantern |
| `legacy-assets/Graphic Design/Social Media Promo/LinkedIn Banners/linkedin-banner-1.png` | 2508×627 | PNG | B — new primary: north-ledger |
| `legacy-assets/Graphic Design/Social Media Promo/LinkedIn Banners/linkedin-banner-2.png` | 2508×627 | PNG | D — supporting/alternate: hale-street |
| `legacy-assets/Graphic Design/Social Media Promo/LinkedIn Banners/linkedin-banner-3.png` | 2508×627 | PNG | D — supporting/alternate: westmere-talent |
| `legacy-assets/Graphic Design/Social Media Promo/Promo Flyers/cleaning-company-promo.png` | 1254×1254 | PNG | A — retained primary: alder-and-finch |
| `legacy-assets/Graphic Design/Social Media Promo/Service Graphics/blue-harbor-bookkeeping.png` | 1254×1254 | PNG | B — new primary: blue-harbor |
| `legacy-assets/Graphic Design/Social Media Promo/Service Graphics/hale-street-realty.png` | 1254×1254 | PNG | B — new primary: hale-street |
| `legacy-assets/Graphic Design/Social Media Promo/Service Graphics/stonebridge-web-services.png` | 1254×1254 | PNG | B — new primary: stonebridge-web |
| `legacy-assets/Graphic Design/Social Media Promo/Service Graphics/westmere-talent-resume-building.png` | 1254×1254 | PNG | B — new primary: westmere-talent |
| `legacy-assets/Graphic Design/Social Media Promo/Social Posts/cedar-plate-food.png` | 1254×1254 | PNG | B — new primary: cedar-plate |
| `legacy-assets/Graphic Design/Social Media Promo/Social Posts/house-of-laurel-beauty.png` | 1254×1254 | PNG | B — new primary: house-of-laurel |
| `legacy-assets/Graphic Design/Social Media Promo/Social Posts/kind-red-desk-equippment.png` | 1254×1254 | PNG | B — new primary: kindred-desk |
| `legacy-assets/Graphic Design/Social Media Promo/Social Posts/marlow-pastry-bakery.png` | 1254×1254 | PNG | B — new primary: marlow-pantry |
| `legacy-assets/Graphic Design/Social Media Promo/Social Posts/sable-row-clothing.png` | 1254×1254 | PNG | A — retained primary: sable-row |
| `legacy-assets/Graphic Design/Supplements/level-up-pre.png` | 1254×1254 | PNG | B — new primary: level-up |
| `legacy-assets/Graphic Design/Supplements/rift-performance.png` | 1254×1254 | PNG | D — supporting/alternate: rift-energy |
| `legacy-assets/Graphic Design/Supplements/vyra-active.png` | 1254×1254 | PNG | B — new primary: vyra-active |
| `legacy-assets/Graphic Design/Tech/flowstate-ai.png` | 1254×1254 | PNG | B — new primary: flowstate-ai |
| `legacy-assets/Graphic Design/Tech/revnue-admin.png` | 1254×1254 | PNG | B — new primary: revnue-admin |
| `legacy-assets/Graphic Design/Tech/vault-iq-security.png` | 1254×1254 | PNG | B — new primary: vault-iq |
| `legacy-assets/Graphic Design/Thumbnails/ai-tools/ai-replacing-creativity.png` | 1672×941 | PNG | D — supporting/alternate: ai-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/ai-tools/ai-side-hustles-that-work-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: ai-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/ai-tools/ai-thumbnails-side-hustles-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: finance-thumbnail-design; actual subject Finance: Crypto Crash Ahead |
| `legacy-assets/Graphic Design/Thumbnails/ai-tools/automate-your-business-ai-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: ai-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/ai-tools/study-smarter-with-ai-thumbnail.png` | 1672×941 | PNG | B — new primary: ai-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/ai-tools/work-10x-faster-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: finance-thumbnail-design; actual subject Finance: Protect Your Crypto |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/broke-my-plans-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: faith-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/god-changed-desires-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: faith-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/god-closed-that-door-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: faith-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/god-is-rebuilding-me-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: faith-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/god-removed-distractions-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: faith-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/god-was-preparing-me-thumbnail.png` | 1672×941 | PNG | B — new primary: faith-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/got-changed-my-circle-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: faith-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/i-had-to-let-go-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: faith-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/i-was-lukewarm-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: faith-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/season-has-purpose-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: faith-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/stop-forcing-it-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: faith-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/stop-running-from-god-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: faith-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/test-before-blessing-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: faith-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/the-prayer-almost-quit-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: faith-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/when-god-feels-silent-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: faith-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/finance-investing/ChatGPT Image May 23, 2026, 09_10_05 PM.png` | 1672×941 | PNG | D — supporting/alternate: finance-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/finance-investing/alt-coins-running-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: finance-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/finance-investing/bitcoin-breakout-thumbnail.png` | 1672×941 | PNG | B — new primary: finance-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/finance-investing/buy-before-the-breakout-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: finance-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/finance-investing/protect-your-crypto-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: ai-thumbnail-design; actual subject AI/Productivity: Work 10X Faster |
| `legacy-assets/Graphic Design/Thumbnails/finance-investing/start-crypto-right-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: finance-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/fitness/best-beginner-gym-plan-thumbnail.png` | 1672×941 | PNG | B — new primary: fitness-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/fitness/build-muscle-faster-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: fitness-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/fitness/home-workouts-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: fitness-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/fitness/not-losing-fat-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: fitness-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/fitness/stop-training-glutes-wrong-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: fitness-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/fitness/stop-training-wrong-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: fitness-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/food-restaurant/cheap-meal-prep-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: food-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/food-restaurant/date-night-dinner-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: food-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/food-restaurant/family-secret-recipie-thumbnail.png` | 1672×941 | PNG | B — new primary: food-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/food-restaurant/food-myth-busted-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: food-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/food-restaurant/viral-food-worth-it-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: food-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/food-restaurant/worth-the-hype-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: food-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/real-estate/dont-buy-until-thumbnail.png` | 1672×941 | PNG | B — new primary: real-estate-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/real-estate/real-estate-buy-now-market-update-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: real-estate-thumbnail-design |
| `legacy-assets/Graphic Design/Thumbnails/real-estate/worth-moving-here-thumbnail.png` | 1672×941 | PNG | D — supporting/alternate: real-estate-thumbnail-design |
| `legacy-assets/Logos/favicon.png` | 1254×1254 | PNG | E — founder/company identity; not a project |
| `legacy-assets/Logos/logo-dark.png` | 1254×1254 | PNG | E — founder/company identity; not a project |
| `legacy-assets/Logos/logo-light.png` | 1254×1254 | PNG | E — founder/company identity; not a project |
| `legacy-assets/Logos/logo-with-text.png` | 1672×941 | PNG | E — founder/company identity; not a project |
| `legacy-assets/aboutme/about-me-photo1.PNG` | 848×876 | PNG | E — founder/company identity; not a project |
| `legacy-assets/aboutme/about-me-photo2.jpg` | 1125×1426 | JPEG | E — founder/company identity; not a project |
| `legacy-assets/aboutme/about-me-photo3.png` | 1072×1080 | PNG | E — founder/company identity; not a project |
| `legacy-assets/aboutme/about-me-photo4.png` | 1254×1254 | PNG | E — founder/company identity; not a project |
| `legacy-assets/portfolio/birdie-bay-thumbnail.png` | 1024×1024 | PNG | B — new primary: birdie-bay |
| `legacy-assets/portfolio/cloud-keep-thumbnail.png` | 1024×1024 | PNG | B — new primary: cloud-keep |
| `legacy-assets/portfolio/frost-thumbnail.png` | 1024×1024 | PNG | B — new primary: frost |
| `legacy-assets/portfolio/glass-dash-thumbnail.png` | 1024×1024 | PNG | A — retained primary: glassdash |
| `legacy-assets/portfolio/harbor-steel-thumbnail.png` | 1024×1024 | PNG | B — new primary: harbor-and-steel |
| `legacy-assets/portfolio/health-sync-thumbnail.png` | 1024×1024 | PNG | C — HealthSync logo only; no app entry |
| `legacy-assets/portfolio/jobly-thumbnail.png` | 1024×1024 | PNG | A — retained primary: jobly |
| `legacy-assets/portfolio/metric-forge-thumbnail.png` | 1024×1024 | PNG | A — retained primary: metricforge |
| `legacy-assets/portfolio/moody-brewer-thumbnail.png` | 1254×1254 | PNG | A — retained primary: the-moody-brewer |
| `legacy-assets/portfolio/mula-thumbnail.png` | 1024×1024 | PNG | B — new primary: mula |
| `legacy-assets/portfolio/northline-plumbing-thumbnail.jpg` | 1920×900 | JPEG | D — supporting/alternate: northline-plumbing |
| `legacy-assets/portfolio/northline-thumbnail.png` | 1024×1024 | PNG | A — retained primary: northline-strength |
| `legacy-assets/portfolio/plumbing-thumbnail.png` | 1024×1024 | PNG | B — new primary: northline-plumbing |
| `legacy-assets/portfolio/scholar-link-thumbnail.png` | 1024×1024 | PNG | B — new primary: scholarlink |
| `legacy-assets/portfolio/scrap.png` | 1024×1024 | PNG | D — unsafe Moody alternate; unsupported stats, not published |
| `legacy-assets/portfolio/solar-thumbnail.png` | 1254×1254 | PNG | B — new primary: solartec |
| `legacy-assets/portfolio/sonoran-comfort-thumbnail.png` | 1024×1024 | PNG | B — new primary: sonoran-comfort-systems |

## Expansion validation

- All 75 src/data JSON files parse. The expanded dataset has 98 unique IDs, titles and primary image paths; every record has a real image, description, alt and supported category.
- Astro check: 399 files, zero errors. Temporary static Astro build: five public pages, successful; no global image/font/favicon regeneration command was run.
- Data contracts: 52 section files and two page configurations pass. Import-path, registry-registration and motion-token checks pass. All 11 focused URL tests pass.
- Browser: All 98, Websites 11, Web Apps 5, Branding 49, Ads 36; creative query union 84. Keyboard activation, aria-pressed state, browser back/forward, invalid query fallback, conflicting anchor recovery, reduced motion, homepage project links and mobile drawer navigation pass.
- Full-category overflow checks at 1440, 768, 390 and 320px show zero horizontal overflow or overflowing card text. Software-filter checks also pass at 1024px. Filter targets remain at least 44px high. All 98 real card images load and use object-fit:contain; final browser runs report no runtime exceptions.
- All 14 published project URLs return HTTP 200. All 84 local View Artwork resources exist with correct file URLs; no invented case-study or brand website destinations.
- All 972 new WebP/AVIF derivatives fully decode, have correct widths/aspect ratios, and avoid enlargement. Total derivative size is approximately 33.83 MiB. All 88 raw source copies match legacy SHA-256 bytes; the two extra prepared crop masters match the exact source-excerpt pixels.
- SHA-256 isolation: all 170 preexisting legacy files remain byte-identical. Only src/data/portfolio.json and the two migration documents changed; 90 raw PNGs and 972 derivative files were added under the authorized portfolio folders. No preexisting file was deleted; no component, CSS, homepage data, existing image, configuration, localization, SEO, dependency or license file changed.
- The existing development preview at http://127.0.0.1:4321/portfolio/ renders all 98 records. Nothing was deployed.

# Current footer follow-up — October 8, 2026

The user explicitly requested removal of the visible ThemeWagon and WebScale footer references. The shared Nova footer now displays only "All rights reserved." in its bottom row; unused footer attribution fields are removed from English content. This supersedes the earlier visible-credit retention decision below. Repository license and author notices in LICENSE.md and README.md remain unchanged.

# Current Portfolio implementation — October 8, 2026

Explicit user authorization adds an English-only `/portfolio/` page using the existing Nova Layout, atoms, tokens, responsive image/motion conventions and footer/header. This supersedes earlier restrictions on portfolio pages, filtering and optional per-project destinations for this pass only. English-only/noindex policy, existing homepage copy/metrics, prepared founder/project imagery, phone/email/social sources, and required WebScale author notice remain.

## Route and data architecture

- Route: `src/pages/portfolio.astro` → `/portfolio/`; build scope adds `/portfolio`.
- Data: `src/data/portfolio.json`; type contract: `src/types/portfolio.ts`; page-specific renderer: `src/components/portfolio/PortfolioCollection.astro`. Existing PageBuilder/section registry and component manifests are unchanged.
- Intro: Portfolio. Client websites, web applications, digital products, branding, and advertising, bringing development and visual design into one collection.
- SEO: Portfolio | Volatile Solutions. Indexing remains disabled. The existing schema/OG architecture is not rewritten.
- Records support id/title/categories/tags/classification/clientStatus/image/alt/shortDescription, optional imageNote/technologies/externalUrl/artworkHref/detailHref/actionLabel. Absent facts stay absent. No technology stack is asserted for the initial entries because project-specific technology evidence is unconfirmed.
- Images display in reserved 4:3 Nova-style rounded frames with object-fit:contain, keeping complete square artwork and identity boards readable without modifying the original work. Only real destinations receive action buttons. Artwork actions open prepared image resources; no fictional brand website or case-study route is invented.
- `formatInternalLink` now preserves known file-resource extensions, fixing artwork links that previously acquired a broken trailing slash. Page routes retain their existing slash convention; focused URL tests cover files/query/fragments.

## Categories and URL state

One primary filter group: All (`all`), Websites (`websites`), Web Apps & Digital Products (`web-apps`), Branding & Visual Design (`branding`), Ads & Social (`ads`). Records can have multiple categories; tags are secondary metadata, not another filter bar.

Native buttons use aria-pressed, visible checkmarks, keyboard activation and 44px minimum targets; a polite live count reports the visible selection. Filtering retains the card DOM and stable image slots, updates query state without a page reload, and supports browser back/forward. A short opacity fade respects prefers-reduced-motion. AbortController cleanup handles Astro view transitions. With JavaScript unavailable, all work remains visible and inactive filter controls stay hidden.

`?category=creative` selects the branding/ads union and visibly marks both corresponding buttons. Individual category URLs work too. Invalid categories fall back to All. If a valid project anchor conflicts with a filter, the selection resets to All so the anchor remains visible. No new scrolling engine is introduced.

## Initial curated records

Commissioning/classification uncertainty is kept explicit. Portfolio Work means the project is supported by the current public portfolio and source evidence, but its client/personal/concept/production relationship is not established. It is not a client claim. Creative Portfolio likewise does not certify a paying-client relationship. Luma Spritz is explicitly called a mock advertisement/campaign concept in the current public gallery data, so Concept Project is supported for that artwork.

| ID / title | Classification / client status | Work categories | Tags | Destination | Image |
| --- | --- | --- | --- | --- | --- |
| the-moody-brewer / The Moody Brewer | Verified Client Work / verified | websites | Client Work, Food & Beverage | https://themoodybrewer.net/ | `/assets/images/t001-nova/t001-nova-project-moody-brewer.webp` |
| pvd-photography / PVD Photography | Verified Client Work / verified | ads | Client Work, Photography | /assets/images/t001-nova/portfolio/pvd-photography@1080.webp | `/assets/images/t001-nova/portfolio/pvd-photography.webp` |
| metricforge / MetricForge | Portfolio Work / unverified | web-apps | Analytics, Dashboard | https://metric-forge.netlify.app/ | `/assets/images/t001-nova/portfolio/metricforge.webp` |
| glassdash / GlassDash | Portfolio Work / unverified | web-apps | Finance, Admin Interface | https://glass-dash-admin.netlify.app/ | `/assets/images/t001-nova/portfolio/glassdash.webp` |
| jobly / Jobly | Portfolio Work / unverified | web-apps, websites | Job Discovery, Web Interface | https://jobly-jobsearch.netlify.app/ | `/assets/images/t001-nova/portfolio/jobly.webp` |
| northline-strength / Northline Strength | Portfolio Work / unverified | websites | Fitness, Local Business | https://fitness-site-portfolio.netlify.app/ | `/assets/images/t001-nova/portfolio/northline-strength.webp` |
| ledger-and-loom / Ledger & Loom | Creative Portfolio / unverified | branding | Finance, Brand Identity | /assets/images/t001-nova/portfolio/ledger-and-loom@1280.webp | `/assets/images/t001-nova/portfolio/ledger-and-loom.webp` |
| luma-spritz / Luma Spritz | Concept Project / unverified | ads, branding | Food & Beverage, Concept Work | /assets/images/t001-nova/portfolio/luma-spritz@1080.webp | `/assets/images/t001-nova/portfolio/luma-spritz.webp` |
| sable-row / Sable Row | Creative Portfolio / unverified | ads | Fashion, Social Graphic | /assets/images/t001-nova/portfolio/sable-row@1080.webp | `/assets/images/t001-nova/portfolio/sable-row.webp` |
| alder-and-finch / Alder & Finch | Creative Portfolio / unverified | ads | Local Business, Promo Graphic | /assets/images/t001-nova/portfolio/alder-and-finch@1080.webp | `/assets/images/t001-nova/portfolio/alder-and-finch.webp` |

Source priority follows the user's brief: approved factual source, explicit user facts, current public Volatile Solutions work, legacy link audit and actual legacy artwork. Current public project metadata/URLs were read at https://volatile-solutions.net/portfolio. The Moody Brewer destination was verified at https://themoodybrewer.net/; MetricForge, Glass Admin, Jobly and Northline Strength destinations returned HTTP 200 in this pass. Public software branding does not prove implemented analytics/replay, authentication, backend security, usage, growth or client relationships. Interface figures are illustrative, with explicit image notes on MetricForge/GlassDash.

Current creative metadata was read from https://volatile-solutions.net/js/graphic-portfolio-data.js?v=20260524packages1. Ledger & Loom is a finance identity board; Luma Spritz is a mock beverage ad concept; Sable Row is a menswear social graphic; Alder & Finch is a cleaning-service promotional graphic. Each selected local image was visually inspected. No work was redesigned, no new brand was generated, and no included brand was upgraded to verified client status.

## User-confirmed client relationships

- **The Moody Brewer:** Verified Client Work; Client Website; included with the already-approved production family and claim-free MacBook image. Exact launch contribution comes from the factual source/user; live coffee-shop destination is https://themoodybrewer.net/. No traffic/customer-growth outcome or inferred technology is used.
- **PVD Photography:** user confirms a real client relationship and Anthony's advertising/creative work. Five real client promotional PNGs appeared during the pass under `legacy-assets/Graphic Design/Real Clients/PVD Photographer/`. The selected `PVD Wedding Photography Editorial Collage.png` was visually inspected and prepared without changing the artwork. Included as Verified Client Work / Ads & Social, with a real View Artwork action. Wedding/senior portrait advertising is supported; photography authorship, a website deliverable, campaign results and a client website URL are not inferred.
- **Fros Lawncare:** user newly confirms a real client relationship. Exact deliverable and asset mapping are not supplied and were not found in the legacy inventory or current public data. Clarification requested. `frost-thumbnail.png` depicts JackFrost fitness coaching and must not be substituted for Fros Lawncare. No invented scope or portfolio artwork is included.

PVD's supplied artwork resolves its asset gap. Fros Lawncare remains a confirmed relationship awaiting real source assets and exact scope; no visual entry has been fabricated. Other historical projects were reviewed but not forced into this initial selection. TimeDock/StillPoint lack identifiable assets/links; Cloud Keep's thumbnail carries unverified security/scale claims; other dense/weak or conflicting previews remain deferred. No guessed live URLs or image substitutes.

## Homepage and navigation wiring

- Projects intro: Explore My Work → `/portfolio/`.
- The Moody Brewer homepage card: `/portfolio/#the-moody-brewer`.
- Creative Work homepage card: `/portfolio/?category=creative`.
- ProjectsBlock adds only optional `href` to its existing category/title/image/alt record contract. A real href restores the existing Nova anchor/arrow treatment; missing href stays informational in English. Homepage images, content/title/category/alt and card geometry remain unchanged.
- Shared header/drawer/footer navigation: About Anthony → `/#zespol`; Services → `/#services`; Portfolio → `/portfolio/`. Header/drawer Start a Project → `/#contact`.
- Footer Explore Services → `/#services`; legal URLs stay `/polityka-prywatnosci/` and `/cookies/`; Get in Touch still derives mailto from company.email; four professional socials and tel:+14015456860 remain.
- Portfolio closing CTA: Have a project in mind? / Start a Project → `/#contact`.

## New asset families

The following raw source copies and only their responsive WebP/AVIF families were prepared. Existing masters/derivatives, all legacy source files and favicon assets remain unchanged. Pipeline convention: auto-orient, no enlargement, base filename at 800px, named widths, WebP quality 80 and AVIF quality 50. No global asset-generation command was run.

| Work | Legacy source | New raw copy | New production family / widths |
| --- | --- | --- | --- |
| metricforge | `legacy-assets/portfolio/metric-forge-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/metricforge.png` | `public/assets/images/t001-nova/portfolio/metricforge` in WebP and AVIF; 220, 480, 640, 800px |
| glassdash | `legacy-assets/portfolio/glass-dash-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/glassdash.png` | `public/assets/images/t001-nova/portfolio/glassdash` in WebP and AVIF; 220, 480, 640, 800px |
| jobly | `legacy-assets/portfolio/jobly-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/jobly.png` | `public/assets/images/t001-nova/portfolio/jobly` in WebP and AVIF; 220, 480, 640, 800px |
| northline-strength | `legacy-assets/portfolio/northline-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/northline-strength.png` | `public/assets/images/t001-nova/portfolio/northline-strength` in WebP and AVIF; 220, 480, 640, 800px |
| ledger-and-loom | `legacy-assets/Graphic Design/Brand Kits/Finance/Ledger-and-Loom.png` | `src/assets/raw/t001-nova/portfolio/ledger-and-loom.png` | `public/assets/images/t001-nova/portfolio/ledger-and-loom` in WebP and AVIF; 220, 480, 640, 800, 1080, 1280px |
| luma-spritz | `legacy-assets/Graphic Design/Food-and-Beverage/luma-spritz-water.png` | `src/assets/raw/t001-nova/portfolio/luma-spritz.png` | `public/assets/images/t001-nova/portfolio/luma-spritz` in WebP and AVIF; 220, 480, 640, 800, 1080px |
| sable-row | `legacy-assets/Graphic Design/Social Media Promo/Social Posts/sable-row-clothing.png` | `src/assets/raw/t001-nova/portfolio/sable-row.png` | `public/assets/images/t001-nova/portfolio/sable-row` in WebP and AVIF; 220, 480, 640, 800, 1080px |
| alder-and-finch | `legacy-assets/Graphic Design/Social Media Promo/Promo Flyers/cleaning-company-promo.png` | `src/assets/raw/t001-nova/portfolio/alder-and-finch.png` | `public/assets/images/t001-nova/portfolio/alder-and-finch` in WebP and AVIF; 220, 480, 640, 800, 1080px |
| pvd-photography | `legacy-assets/Graphic Design/Real Clients/PVD Photographer/PVD Wedding Photography Editorial Collage.png` | `src/assets/raw/t001-nova/portfolio/pvd-photography.png` | `public/assets/images/t001-nova/portfolio/pvd-photography` in WebP and AVIF; 220, 480, 640, 800, 1080px |

## Deferred architecture

Future detailHref values may point to separately approved, real case-study routes, including The Moody Brewer. No detail/case-study pages exist in this pass. Future expansion may add richer project records, additional supported categories and CMS/admin integration. Authentication, admin/private dashboard, inquiry database, Neon, lead pipeline, Netlify functions and deployment are not implemented.

## Final Portfolio validation and change isolation

Ten initial records now render, including verified client advertising for PVD Photography. All five filters and the combined Creative Work view pass browser checks, including keyboard Space, active-state/live-count updates, browser back/forward, invalid-query fallback, conflicting deep-link visibility, reduced motion, 44px targets and zero horizontal overflow at 320/390/768/1024/1440px. Homepage card navigation and mobile navigation between both routes pass; browser reports no runtime exceptions.

82 source JSON files parse; Astro/TypeScript has zero errors; the direct static build to a temporary directory passes with five public pages. The 11 focused URL tests pass. Data/page-registry/import/registration/motion/hardcoded checks pass. The atomic audit still flags the preexisting ChecklistItem layout violation and unrelated HeroSplit advisory; targeted mobile audit introduces no new errors. All image/artwork resource paths exist; file actions retain correct file URLs; external project URLs were checked without asserting unverified feature functionality. Noindex remains.

Nine raw copies match their exact legacy source bytes and only their 84 responsive WebP/AVIF derivatives were generated. Every preexisting production/raw image and original legacy artwork/source image remains unchanged. Two original macOS folder metadata files changed during the session (`legacy-assets/.DS_Store`, `legacy-assets/Graphic Design/.DS_Store`) and were left intact; the other 161 original legacy files match the baseline. Five PVD client PNGs and two new folder metadata files appeared during the pass; the new PVD files were separately snapshotted before preparation and remain unchanged. These supplied source additions are distinguished from generated production derivatives. No dependency/lockfile/design-token/license or admin change.

Fros Lawncare is a verified relationship with exact work scope/source artwork still pending. No Fros entry or fake image has been invented.

# Current English-only cleanup — October 8, 2026

The user explicitly approved retiring the Polish site, restoring the existing Nova metrics panel with non-claim placeholders, and removing only footer credits permitted by the actual local license. This decision supersedes earlier bilingual/English-first preservation rules and the prior metric/attribution treatment for this cleanup. All other approved homepage copy, projects/services/FAQ, founder imagery, capability icons, contact/social actions and prepared assets remain unchanged.

## Localization — English-only

The Volatile Solutions site is now English-only. Polish site/version has been retired.

- Removed source routes: `src/pages/pl/index.astro`, `src/pages/pl/cookies.astro`, `src/pages/pl/polityka-prywatnosci.astro`.
- Removed the parallel `pl` branch from `src/data/i18n/nova.json` and `src/data/global/legal.json`.
- Removed unused `src/content/legal/cookies-pl.json` and `src/content/legal/privacy-policy-pl.json` after confirming only the retired routes imported them.
- Removed LanguageSwitch from both floating headers and the mobile drawer, deleted its unused component and removed the empty drawer language wrapper.
- `site.config.mjs` remains SITE_LOCALE=en and build scope is now `/`, `/cookies`, `/polityka-prywatnosci` (404 always included). Shared homepage configuration now has English metadata and no testimonial entry.
- English legal contact now targets `/#contact`; 404 uses English metadata/hover fallbacks and `#contact`.
- Generic locale signatures and reusable legacy component branches remain internally for compatibility. getNovaCopy returns the sole English source; no public route can render a Polish copy variant. Generic section-preview data and disabled fixtures are not a Polish public site and are outside this cleanup.
- Existing internal section anchors #zespol/#realizacje and the English Privacy Policy URL `/polityka-prywatnosci/` are retained. Their historical naming does not imply Polish-language content.

## Retired URL behavior

Existing netlify.toml now puts permanent, forced 301 redirects for `/pl` and `/pl/*` to `/` before general routing rules. They apply after a Netlify deployment; no deployment was performed. Plain Astro dev/preview does not emulate Netlify redirects: retired PL paths return 404 locally and on hosts without those redirect rules. No redirect framework or dependency was introduced.

## Hero metrics

The original black Nova panel, responsive two/four-column layout, typography, spacing and motion are restored through its existing stats array. Hero metric values intentionally set to placeholders pending verified figures.

| Label | Current value |
| --- | --- |
| Projects | — |
| Experience | — |
| Development Hours | — |
| Creative Pieces | — |

Projects, Experience and Development Hours neutralize the old project/years/product-hours labels. Creative Pieces uses the user-approved neutral example for the documented creative body of work instead of the unsupported client-revenue label. These labels do not assert quantities. Edit `en.sections.nova-hero-wireframe.stats` only when verified figures are supplied. No demo number has returned. The trusted-by strip remains disabled: trustedBy is empty and trustItems is an empty array.

## Attribution decision

Inspected LICENSE.md (Nova Free Release License), README.md, ASSETS-LICENSES.md and template documentation. LICENSE.md section 3 explicitly prohibits removing "copyright and author notices". README identifies WebScale as the design/code author and ThemeWagon as distributor; its generic MIT reference does not supersede the repository's specific LICENSE.md restrictions.

- **WebScale retained:** the existing visible "Design and development by WebScale" author notice remains. Removal is not authorized by the inspected license. The local file describes possible future paid products but states no paid/commercial option allowing notice removal.
- **ThemeWagon removed from visible footer:** its separate distributor credit is not an author/copyright notice, and no inspected license clause requires a visible distributor footer link. The rights grant permits adaptation of finished website content. README distribution information and all license/author files are preserved.
- Removed the associated bullet separator and distributor link; no empty credit wrapper remains. Final bottom footer: All rights reserved. / Design and development by WebScale.

## SEO and preservation

Root canonical remains https://volatile-solutions.net/. All public documents are lang=en; no Polish alternate/hreflang/language control is emitted. No PL route or sitemap entry is generated. Indexing stays disabled (noindex, follow). No broader SEO, schema-geography or asset rewrite occurs.

The existing View My Work → #realizacje, Work With Me / Start a Project / Let’s Work Together / Discuss a Project → #contact, Get in Touch → mailto:volatile-solutions@outlook.com, and phone → tel:+14015456860 remain. Four primary professional socials are unchanged. Portfolio/filtering/case-study URLs, inquiry/admin systems, Netlify deployment and Neon remain future work.

# Previous English homepage completion — October 8, 2026

Historical record of the preceding completion pass; localization, metrics and footer attribution are superseded by Current English-only cleanup above. The user explicitly authorized this controlled homepage implementation and autonomous routine copy, icon, accessibility and interaction choices. This section supersedes earlier unresolved markers and initial data-only restrictions **for this completion pass only**. Earlier approval/audit records remain historical context; they do not override this current state. Polish copy and all prepared/legacy image assets remain unchanged.

## Approved content now implemented

- Hero H1: **Developer, Designer & Digital Product Builder**. Existing split: Developer, Designer & / Digital Product Builder.
- Hero supporting copy, written under the authorized autonomy: I build websites, digital products, and visual experiences that connect thoughtful design with practical development. Explore my work or get in touch about a project or opportunity.
- About heading: **About Anthony**.
- Exact user-approved About paragraph: I’m Anthony, the founder of Volatile Solutions. I combine development, design, and practical business thinking to turn ideas into polished digital experiences. From early concepts through launch and ongoing improvements, I stay hands-on throughout the process.
- Checks: Development + Design; Business-Minded Problem Solving; Hands-On From Concept to Launch.
- Metric: **1 / Founder-led**. About CTA: **Let’s Work Together → #contact**.
- Founder image and alt remain: `/assets/images/t001-nova/t001-nova-about-anthony-volatile.webp`; Anthony Volatile, founder of Volatile Solutions. Hero retains its already-wired Anthony image with the same founder alt.
- Projects remain The Moody Brewer / Client Website / Verified Client Work, then Creative Work / Branding, Ads & Marketing / Creative Portfolio / Body of Work. Existing four fields and approved image/alt records are unchanged.
- Services retain the four exact B3 titles/descriptions and existing number/icon fields. Section description remains the approved Websites, web applications, visual design, and ongoing support built around real business needs.
- English homepage/page metadata now names Anthony and the documented categories; global fallback replaces digital strategy with website support and optimization. Indexing stays disabled; geography/address rendering and OG artwork are untouched.

## Capabilities

Development → `code`; Design → `pen-nib`; Business / Strategy → `compass`. TeamBlock accepts an optional capabilities array of label/icon pairs. The meaningful list is named Capabilities, labels are visible, and icon wrappers are aria-hidden. English has no teammate avatars; the legacy Polish avatar branch remains intact. Existing section ID, founder image, metric row, layout and motion remain.

## Four factual FAQs implemented under guided autonomy

FAQ heading: Frequently asked questions. Intro: Practical answers about projects, working together, and ongoing website support.

- **What kinds of projects do you take on?** I work on custom websites, web applications, branding, advertisements, social graphics, and other visual assets. I also support and improve existing websites.
- **Do you work with clients outside Rhode Island?** Yes. Volatile Solutions serves Rhode Island and remote clients. We can discuss your goals and project needs remotely.
- **Can you improve a website I already have?** Yes. Website Support & Optimization includes updates, troubleshooting, and refinements to an existing site. I start by reviewing what you have and what you want to improve.
- **What happens after I reach out?** Share a brief overview of your project or opportunity and any relevant links. We can discuss your goals, review the scope, and identify sensible next steps.

## Current interaction plan

| Action | Current destination / behavior |
| --- | --- |
| About Anthony navigation / footer | `#zespol` |
| Services navigation / footer / footer Explore Services | `#services` |
| Selected Work navigation / footer / hero View My Work | `#realizacje` |
| Hero Work With Me / navigation Start a Project / About Let’s Work Together | `#contact` |
| Services / Projects Discuss a Project | `#contact`; replaces each section’s redundant self-link |
| Footer Get in Touch | `mailto:volatile-solutions@outlook.com`, rendered from company.email |
| FloatingBar call | `tel:+14015456860`; existing phone behavior retained |
| Service cards | Informational; no pointer cursor, link arrow or click-specific hover |
| Project cards | Informational in English; existing image hover retained, link wrapper and arrow disabled |

Primary socials are stored in company.json and rendered by the existing drawer helper, also reused in the English footer: Instagram, LinkedIn, GitHub, YouTube, in that order. Facebook remains empty. Personal Instagram stays a secondary approved source record and is omitted from this primary row.

- Business Instagram: https://www.instagram.com/volatile.solutions/
- LinkedIn: https://linkedin.com/in/anthony-volatile
- GitHub: https://github.com/AVolatile
- YouTube: https://www.youtube.com/@anthonyvolatile

Footer intro chosen under autonomy: Projects / Collaboration / Opportunities / Let’s create together / Have a project or opportunity in mind? Get in touch to discuss what you’re building and how I can contribute.

## Proof, promotion and compatibility

English hero stats/trust arrays are empty; their wrappers render only when nonempty. No invented replacement metrics or organizations. The English root route filters testimonials from the shared configuration before PageBuilder; the reusable component, stored inactive English demo records and Polish composition/data remain. Reviews links are removed in English. Layout suppresses the English demo banner; Polish keeps its existing banner. WebScale and ThemeWagon footer attribution remain because removal permission/licensing has not been established.

The English fixed header now starts at top: 0 when the banner is absent. Existing Lenis and native section scroll margins remain; no scrolling engine change. English service titles may wrap so the approved fourth title remains readable on small screens. The English Services introduction also wraps within its existing column to prevent overlap with the heading and CTA at 1024px.

## Future work, intentionally not implemented

- Dedicated broader portfolio page and category filtering.
- Creative Work collection destination, preserving body-of-work classification and uncertain individual client status.
- The Moody Brewer project/case-study destination, using verified project evidence only.
- Historical dependency, now resolved by the Portfolio pass: homepage optional hrefs and a dedicated portfolio model are implemented; richer case studies remain future work.
- Legacy contact-form migration, inquiry intake, private authenticated admin dashboard, lead/prospect organization, pipeline/status management and notes/progress tracking.
- Netlify deployment and a Neon database-backed lead/client pipeline.

These are future dependencies, not implemented routes, features, services or deployment changes. No new dependency is introduced. The earlier Explore My Work portfolio intent is retained for that future destination; no fake /portfolio URL is created.

## Source and evidence rules

The facts below come from the user's content-source brief, the later user-approved Priority A and Priority B decisions, and the asset and visual decisions A1–A7 recorded below. Exact approved wording is retained as supplied; it does not authorize additional copy or website implementation. They are recorded as supplied context, not as independently verified public records. Project completion, production status, feature implementation, credentials and outcomes must not be expanded beyond what the brief states.

Repository instructions and `CONTENT_MIGRATION_MAP.md` were read. The initial repository search, before the legacy asset library was introduced, found no older Volatile Solutions material supplying additional personal, employment, education or project evidence. B6 designates the existing root `legacy-assets/` as authoritative source/migration material. The October 8 asset and visual decisions below record approved sources and later preparation directions. `LEGACY_ASSET_INVENTORY.md` and `LEGACY_PROJECT_LINKS.md` remain supporting audit references; their descriptions of the previous Moody Brewer file are historical because Anthony replaced that source in-place. No asset is modified or migrated by this document update. The Nova website's demo copy, placeholder identities, statistics, technologies and images are **not** evidence about Anthony or Volatile Solutions.

Use these markers consistently:

- `[NEEDS CONFIRMATION]`: not supplied or not supported by existing Volatile Solutions evidence.
- `[EXISTING CLAIM — NEEDS CONFIRMATION]`: a statement from older Volatile Solutions material that cannot be verified. No unverified legacy claims are added by this update; the marker remains available for the later audit of legacy material.
- `[NEEDS USER DECISION]`: a choice about public relevance, inclusion or presentation, rather than an unknown fact.
- Longer classification markers preserve the specific unresolved alternatives supplied by the user.

A supplied direction or capability is not proof of skill level, professional tenure, a paid service offering, a completed feature, or production scale. Facts must retain their source and qualification. Records may hold information beyond the current Nova component contract; that does not make those facts renderable in the existing homepage.

# Approved Priority A migration decisions

Recorded from the user's approved-decision brief on October 7, 2026. These decisions are source records, not final website copy or permission to begin implementation. The original factual sections below remain in place; only affected answers are updated.

## A1 — Professional positioning and audience

**Preferred leading professional identity:** Developer, Designer & Digital Product Builder.

**Approved audience strategy:** serve both:

1. Prospective clients / businesses / founders evaluating Volatile Solutions.
2. Employers / recruiters evaluating Anthony Volatile's professional capabilities.

Volatile Solutions should remain commercially credible while the website also functions as a strong professional portfolio. Do not narrow Anthony solely to “web designer.” At A1 approval this was positioning direction, not final copy. B1 later approves this exact wording as the main hero headline; hero supporting copy is now resolved in the Current English homepage completion record.

## A2 — Active service offering

The original A2 service set is retained below as approval history only. **B3 supersedes this set**: Website Support & Optimization replaces Digital Strategy & Solutions as the fourth active service.

1. Web Design & Development.
2. Custom Web Applications.
3. Branding & Visual Design.
4. Digital Strategy & Solutions.

UI/UX remains a capability involved in Anthony's work, **not a standalone service offering**. The current four-service order and exact approved descriptions are recorded in B3; the earlier description gap is resolved.

## A3 — Featured projects

| Homepage slot | Approved item | Classification |
| --- | --- | --- |
| Featured Project 1 | The Moody Brewer | Verified Client Work |
| Featured Project 2 | Creative Work — Branding, Ads & Marketing (A3 working name; B2 approves title Creative Work and category Branding, Ads & Marketing) | Creative Portfolio / Body of Work |

The second item is a curated collection of creative output: branding, advertisements, marketing graphics, social graphics, promotional visuals and related visual-design work. It is not one paying-client project; collection-level classification does not establish the classification or client relationship of any individual piece.

Featured source-image decisions are recorded under **asset A3–A4**. The later October 8 approval in **B2** resolves both prepared production image families and their exact English project-card alt text.

## A4 — Public business contact information

| Field | Approved information |
| --- | --- |
| Professional email | volatile-solutions@outlook.com |
| Public phone | 401-545-6860 |
| LinkedIn | https://linkedin.com/in/anthony-volatile — full approved destination supplied in B9 |
| Public location / service scope | Rhode Island + remote clients |

“Rhode Island + Remote” and “Serving Rhode Island and remote clients” are supplied possible later presentation wording, not selected final website copy.

**Do not publish a street address.** The LinkedIn address is recorded as supplied; rendering support and social-platform display decisions are separate from knowing the address.

## A5 — Hero statistics and trusted organizations

Anthony does **not** currently have a verified, meaningful set of four general hero statistics and five organization/trust names appropriate for production.

The current English-only cleanup restores the Nova metrics panel with four non-claim placeholders; the unverified trust-name strip remains hidden. Do not invent metrics or trust relationships to fill the existing counts. Do not use Fidelity Investments, CCRI, unrelated employers, schools, projects or businesses as endorsements or “trusted by” organizations.

The Moody Brewer's supplied analytics are recorded separately in Section 9 as project-specific evidence. They do not automatically populate general Volatile Solutions hero metrics. The current cleanup uses four dash-valued metric records and an empty trust array; no numerical or organization claims are approved.

## A6 — Testimonials

**Chosen path:** remove or replace the testimonial section later through a separately approved structural change.

The later homepage completion pass now authorizes and implements removal from the English composition only. Demo records/components and Polish content remain stored; they must not be presented as Volatile Solutions endorsements.

## A7 — Localization

**Current approved strategy:** English-only. The Polish site/version is retired by the explicit cleanup approval above. Parallel Polish homepage/legal data, public routes and language controls have been removed. Preserve harmless reusable localization interfaces; do not reintroduce a public Polish variant. Earlier English-first/bilingual approvals are history only.

## Remaining unresolved after Priority A, Priority B and asset/visual approvals

Hero supporting description, founder/About copy and alt text, four English FAQs, capability indicators and professional-social rendering are resolved by the completion record above. The approved prepared hero/About/project/favicons are retained unchanged. Final production horizontal logo file/navbar dimensions and OG/social-preview composition remain separate future asset work. B2 resolves the English Projects copy, prepared project image families and alt text. Individual creative-piece classification remains unconfirmed. Real testimonials, business hours, structured address, legal registration data, exact Fidelity title, business start date and uncertain project technologies also remain unresolved. Hero, About, Moody Brewer and favicon source paths and the logo/capability directions are approved under asset A1–A7 below. Social destinations are approved in B9 and primary professional rendering is implemented by the completion pass. Relevant confirmation markers below are retained.

# Approved Priority B decisions and implementation constraints

Recorded from the user's approved B-decision brief on October 7, 2026. B decisions supersede earlier A-stage decisions where explicitly stated. Only the exact wording approved below may be treated as approved copy; no additional headline, paragraph, CTA, FAQ, asset choice or translation is created here.

## B1 — Hero positioning and actions

| Field | Exact approved wording / decision |
| --- | --- |
| Main hero headline | Developer, Designer & Digital Product Builder |
| Primary CTA | View My Work |
| Secondary CTA | Work With Me |
| Audience | Prospective clients/businesses/founders and employers/recruiters |
| Positioning balance | Approximately 50/50 between the two audiences |
| Hero supporting description | Resolved under guided autonomy; exact current text recorded above |

The completion pass resolves supporting copy and assigns View My Work → #realizacje and Work With Me → #contact, retaining existing hero fields and both audiences.

## B2 — Featured project records

| Homepage slot | Approved title | Approved category | Classification |
| --- | --- | --- | --- |
| Featured Project 1 | The Moody Brewer | Client Website | Verified Client Work |
| Featured Project 2 | Creative Work | Branding, Ads & Marketing | Creative Portfolio / Body of Work |

Creative Work is a curated body of work across branding, advertisements, marketing graphics, social graphics and promotional visuals. It is **not one paying-client project**. Individual pieces must retain truthful classifications.

### Approved English Projects migration — October 8, 2026

The user approved the following exact section values and production records for the active English homepage. This approval supersedes earlier confirmation markers for these two prepared project image families and English project-card alt text.

| Existing section field | Exact approved value |
| --- | --- |
| title | Selected Work |
| description | A selection of client work and creative projects across web development, digital products, branding, advertising, and visual design. |
| linkLabel | Explore My Work |
| linkHref | `#realizacje` — preserve the existing shared destination |

| Homepage record, in order | Approved production image | Exact approved English alt text |
| --- | --- | --- |
| The Moody Brewer | `/assets/images/t001-nova/t001-nova-project-moody-brewer.webp` | The Moody Brewer website shown on a MacBook in a warm café setting |
| Creative Work | `/assets/images/t001-nova/t001-nova-project-creative-work.webp` | Collage of branding, advertising, social media, and digital design work |

Both prepared responsive WebP/AVIF families already exist and must remain unchanged. Creative Work uses the approved 2×2 collection cover spanning Food / Beverage, Small / Local Business, Corporate / Digital / Web App, and Branding / Social / Advertising. This does not verify client status for the pictured brands.

Use only the existing item fields: category, title, image and alt. Category is accepted but not visibly rendered by ProjectsBlock. The later completion pass preserves image geometry/motion and project records but supersedes the shared English self-click behavior with informational cards and Discuss a Project → #contact. Polish retains its existing behavior. Do not add performance claims, per-project URL fields, project pages or filtering. Polish content and unrelated homepage sections remain unchanged.

## B3 — Current four-service offering

The current approved order and descriptions are:

| Order | Service | Exact approved description |
| --- | --- | --- |
| 1 | Web Design & Development | Custom websites built around your brand, goals, and customer experience. |
| 2 | Custom Web Applications | Tailored digital tools, dashboards, and web-based applications built around specific business needs. |
| 3 | Branding & Visual Design | Brand identities, advertisements, social graphics, and visual assets designed for consistency and impact. |
| 4 | Website Support & Optimization | Ongoing updates, improvements, troubleshooting, and refinements to keep an existing site current, reliable, and effective. |

**Digital Strategy & Solutions is no longer part of the active four-service set.** Its historical A2 approval is superseded. UI/UX remains a capability, not a standalone service. Do not rewrite these approved descriptions or infer other offerings.

### Approved English Services migration — October 8, 2026

The user approved these exact section-level values and authorized the four English service records above in their existing order.

| Existing section field | Exact approved value |
| --- | --- |
| title | Services |
| description | Websites, web applications, visual design, and ongoing support built around real business needs. |
| linkLabel | Explore Services |
| linkHref | `#services` — preserve the existing destination |

The English Services heading/description and four-service contract are resolved. The later completion pass supersedes Explore Services → #services with Discuss a Project → #contact and locally removes misleading English card click cues. Existing numbers/icons/images, registry configuration and Polish data remain. Do not introduce standalone UI/UX, superseded services, guarantees, pricing, package tiers, unsupported technologies or additional deliverables.

## B4 — Founder / about direction

| Field | Approved wording / direction |
| --- | --- |
| Section title | About Anthony |
| Founder/about direction | Founder-led, hands-on, multidisciplinary |
| Check 1 | Development + Design |
| Check 2 | Business-Minded Problem Solving |
| Check 3 | Hands-On From Concept to Launch |
| CTA | Let’s Work Together |
| Founder/about paragraph | Exact user-approved paragraph in Current English homepage completion |

Anthony combines development, design, business thinking and customer-facing experience. The section should communicate that he takes ideas from concept through execution. These are supplied direction and exact approved labels/checks, not a newly written paragraph. Do not expand the section into résumé-style content.

## B5 — Founder-led team-section semantics

| Existing slot / role | Approved semantic direction |
| --- | --- |
| Count/value | 1 |
| Label | Founder-led |
| Main image subject | Anthony |
| Supporting capability visual 1 | Development |
| Supporting capability visual 2 | Design |
| Supporting capability visual 3 | Business / Strategy |
| Exact founder image choice | `legacy-assets/aboutme/about-me-photo1.PNG` — prepared About family retained at `/assets/images/t001-nova/t001-nova-about-anthony-volatile.webp`; founder alt recorded in Current English homepage completion |
| Exact supporting capability visual assets | Existing Phosphor code, pen-nib and compass icons; no photo assets |

The three supporting visual slots must **not represent fake teammates**. Asset A7 approves minimally adapting them into clearly associated Development, Design and Business / Strategy capability indicators. Do not duplicate Anthony's portrait three times or use unlabeled circular imagery that still implies people. A later separately scoped minimal structural adjustment is approved in principle if the current component cannot express these semantics honestly; preserve Nova's spacing, layout rhythm, motion and design language.

The completion pass resolves the implementation with a local optional capability-icon branch in TeamBlock, as recorded above. Polish continues using its existing avatar branch.

## B6 — Asset migration source

**Authoritative migration asset library:** `legacy-assets/` at the project root. Approved source paths and visual directions are now recorded under asset A1–A7 below. No asset was changed or migrated by this document update.

Treat this library as **source/migration material only**, not Nova's active production asset structure. Do not copy or merge it into production assets before a later approved asset migration step. Do not generate replacement branding assets unless the legacy library proves insufficient.

Later controlled preparation must validate the approved sources and resolve remaining assets for:

- Hero image.
- Logo/wordmark.
- Favicon.
- OG/social preview image.
- Moody Brewer featured-project image.
- Creative Work featured-project image.
- Main founder/about image.
- Supporting founder-led capability visuals.

All selections must preserve Nova's image geometry, crop behavior, derivative expectations, WebP/AVIF handling and responsive presentation. Asset A1, A2, A3 and A6 approve specific source paths; A4, A5 and A7 approve directions. B2 resolves the prepared homepage project image families, selected Creative Work cover and English project alt text. Final production files, crops, alt text and exact capability visuals for other slots remain **[NEEDS CONFIRMATION]**. The asset-authority rule below governs later migration.

## B7 — FAQ direction

The approved mixed FAQ direction covers:

- Business/services.
- Process.
- Working directly with Anthony.
- Support/revisions/handoff or another practical client concern.

**Final four English FAQ questions and answers are resolved under the user-authorized guided-autonomy completion pass**, with exact current copy recorded above. Polish FAQs are unchanged.

## B8 — Testimonials

Not applicable at this stage: A6 already establishes no fabricated testimonials and later separately approved removal/replacement of Nova's testimonial section.

Do not create testimonial records or inherit demo endorsements. No testimonial content should be created unless real approved testimonials are supplied. Real testimonials remain unresolved; the English homepage no longer renders demo testimonials after the approved completion pass.

## B9 — Approved public social destinations

| Profile | Approved destination | Approved usage intent |
| --- | --- | --- |
| Business Instagram — @volatile.solutions | https://www.instagram.com/volatile.solutions/ | Primary business-facing Instagram |
| Personal Instagram — @a.volatile | https://www.instagram.com/a.volatile/ | Personal / secondary identity |
| LinkedIn | https://linkedin.com/in/anthony-volatile | Public professional link |
| YouTube | https://www.youtube.com/@anthonyvolatile | Public personal/professional content channel |
| GitHub | https://github.com/AVolatile | Public technical portfolio link useful for the employer/recruiter audience |

The completion pass now implements Business Instagram, LinkedIn, GitHub and YouTube in the existing helper/drawer and English footer, with company.json as the shared source. LinkedIn/GitHub rendering is resolved. Personal Instagram remains secondary and omitted from the primary row.

Approval of profile links does not decide integration of personal videos/posts or create a new homepage content section.

# Approved asset and visual decisions — A1–A7

Recorded from Anthony's approved asset/visual brief on **October 8, 2026**. These **asset A1–A7** labels are distinct from the earlier **Priority A1–A7 migration decisions**; they resolve corresponding asset questions without replacing the positioning, service, contact, testimonial or localization decisions above. They supersede earlier advisory asset rankings where they differ. This task records approvals only; no website implementation or production asset migration begins.

## Asset A1 — Hero image

**Approved hero source:** `legacy-assets/aboutme/about-me-photo4.png`.

Use this selected source for the hero. It is square (1254×1254 PNG); a later task must validate its crop against Nova's existing hero/blob treatment. Preserve the subject's face and founder presence as the priority. The laptop and surrounding context do not have to remain fully visible if the existing crop makes that impossible.

Final hero alt text, crop values and derivative filenames remain **[NEEDS CONFIRMATION]**. Do not modify or migrate the source in this task.

## Asset A2 — Founder / About Anthony image

**Approved main About source:** `legacy-assets/aboutme/about-me-photo1.PNG`.

Keep this image visually distinct from the approved hero. Its native resolution is 848×876 PNG; respect that lower resolution, avoid unnecessary upscaling and preserve accurate color handling during later preparation. The source includes an embedded ICC profile.

Final About alt text, crop values and derivative filenames remain **[NEEDS CONFIRMATION]**. Do not modify or migrate the source in this task.

## Asset A3 — The Moody Brewer featured image

**Approved source:** `legacy-assets/portfolio/moody-brewer-thumbnail.png`.

Anthony **manually replaced the file in-place** with a new claim-free MacBook-style portfolio mockup. The current filesystem asset is authoritative. The October 7 audit descriptions, 1024×1024 dimensions, claim-containing appearance and live/local byte-match findings refer to the **previous file**, not this replacement. Do not carry the obsolete traffic/customer-growth claim blocker forward as a description of the current source.

Read-only inspection during this document update found a **1254×1254 PNG** showing a MacBook-style website mockup with clearly visible Moody Brewer identity and no visible unsupported traffic or customer-growth claims. This confirms the replacement's observed identity and dimensions; it does not finalize production crop or quality acceptance.

Before future migration, inspect the **current file at this path again** and verify:

- Unsupported traffic/customer-growth claims are absent.
- It is the new MacBook-style project mockup and clearly represents The Moody Brewer.
- Dimensions and image quality are suitable for the intended display.
- Nova's project-card crop preserves the composition.

Do not rely on the old audit's visual description, and do not recreate this image unless a later crop/quality check identifies a real problem. B2 records the later approval of the prepared production image family and exact English alt text. Preserve those image files during Projects migration.

## Asset A4 — Creative Work featured image

**Approved direction:** create a dedicated Creative Work collection cover later.

Approved homepage item: **Creative Work**. Category: **Branding, Ads & Marketing**. Classification remains **Creative Portfolio / Body of Work**.

A future separately scoped composition task must:

- Use only real existing work from `legacy-assets/`, with approved real pieces from the library.
- Invent no new brands or fake client work.
- Avoid presenting one single brand project as the entire collection.
- Clearly communicate a body of creative work.
- Optimize the composition for Nova's existing project-card crop and preserve Nova's visual direction.

**Later October 8 approval:** the prepared 2×2 Creative Work cover is approved for the English homepage. B2 records its production image path and exact alt text. Preserve its existing master and responsive derivative family; Projects migration does not create or alter the cover. Individual-piece client/concept classification remains unconfirmed.

## Asset A5 — Navigation logo approach

**Approved direction:** use the existing Volatile Solutions graphical horizontal logo system: the mark/logo on the left, followed by the horizontal business name/wordmark on the right. **Nova's plain text-only wordmark is not the approved final navigation identity.**

Inspect the horizontal legacy branding sources during the later production asset-preparation step and use the cleanest matching source. No final production horizontal logo file is selected by this record.

Later preparation must crop excess transparent padding if necessary, preserve transparency, verify contrast against Nova's navigation background, verify navbar-height legibility and preserve the aspect ratio without distortion. Final source/export selection, exact navbar logo dimensions and production filename remain **[NEEDS CONFIRMATION]**. Do not select, prepare or alter branding assets in this task.

## Asset A6 — Favicon

**Approved authoritative favicon source:** `legacy-assets/Logos/favicon.png`.

Use this dedicated asset rather than deriving the favicon from `logo-light.png`. Its existence was checked read-only; source approval does not approve a finished browser/touch icon bundle.

During later preparation, verify actual dimensions, transparency, small-size legibility, Nova's required additional icon sizes/formats and whether browser/touch derivatives are needed. Final derivative filenames, sizes/formats and production references remain **[NEEDS CONFIRMATION]**. Do not convert or copy the source in this task.

## Asset A7 — Founder-led capability visual treatment

**Approved concepts, in order:** Development; Design; Business / Strategy.

Preserve the founder-led section and remove teammate implication. Minimally adapt the three supporting visual slots into capability indicators, clearly associated with those concepts. Do not present fake team members, duplicate Anthony's portrait three times or use unlabeled circular imagery that could still be interpreted as people.

If the current component cannot represent capability indicators honestly, a **later separately scoped minimal structural adjustment is approved in principle**. Change only what is necessary to remove team semantics; preserve Nova's spacing, layout rhythm, animation/motion behavior and design language. Do not redesign the section.

Exact capability indicators are now resolved as existing Phosphor code, pen-nib and compass icons through the authorized local TeamBlock extension; see Current English homepage completion.

## Asset-authority rule and unresolved production details

- `legacy-assets/` remains **source material**. Approved source paths do not authorize automatic copying into `public/`.
- Production asset preparation and migration must happen later through a separate controlled task; existing originals must remain untouched.
- Preserve Nova's image pipeline, naming conventions, geometry and coordinated derivative families. Do not leave stale derivatives from previous imagery behind.
- Do not infer final crop values, alt text, asset derivative filenames, exact navbar dimensions or capability implementation details.
- The final production horizontal logo file, OG/social-preview composition and exact capability visual assets remain unresolved. B2 resolves Creative Work's prepared cover and English project alt text.
- The historical asset/link audits are supporting references. For the replaced Moody Brewer image, inspect the current filesystem source rather than treating an old description or hash match as evidence about the new pixels.

# 1. Identity

| Field | Supplied fact or status |
| --- | --- |
| Name | Anthony Volatile |
| Business / brand | Volatile Solutions |
| Website | volatile-solutions.net |
| Primary business Instagram | @volatile.solutions — https://www.instagram.com/volatile.solutions/ |
| Personal Instagram | @a.volatile — https://www.instagram.com/a.volatile/ |
| Professional email | volatile-solutions@outlook.com — approved public business email |
| Phone | 401-545-6860 — approved public phone |
| LinkedIn URL | https://linkedin.com/in/anthony-volatile — approved public professional link |
| GitHub URL | https://github.com/AVolatile — approved public technical portfolio link |
| YouTube URL | https://www.youtube.com/@anthonyvolatile — approved public personal/professional channel |
| Preferred public location | Rhode Island — approved public scope; do not publish a street address |
| Preferred service area | Rhode Island + remote clients |
| Preferred professional title | Developer, Designer & Digital Product Builder |

The website is recorded exactly as the supplied domain; no canonical protocol, path or redirect policy is selected here. Business and personal Instagram destinations are explicitly supplied in B9; their primary/secondary roles are approved, not inferred. Public location/service scope is now explicitly approved as Rhode Island + remote clients; it is not inferred from employer/client locations. Street-address publication is prohibited.

# 2. Professional direction

Working factual context: Anthony works across technology, design, business and customer experience.

Approved leading professional identity: **Developer, Designer & Digital Product Builder**. The approved audience includes both prospective clients/businesses/founders and employers/recruiters evaluating Anthony's capabilities, with an approximately 50/50 balance approved in B1. The site should be commercially credible and serve as a strong professional portfolio. B1 approves the main hero headline and two CTA labels; supporting description remains unresolved.

His professional direction includes:

- Frontend development.
- Web development.
- Software development.
- UI/UX.
- Digital product building.
- Business-focused digital solutions.
- Branding.
- Graphic design.

His longer-term direction is broader than simply offering website design.

Volatile Solutions should be capable of representing the following supplied areas of direction:

- Websites.
- Frontend development.
- Custom web applications.
- Dashboards.
- Digital tools.
- Branding.
- Graphic design.
- Business-focused digital experiences.

These are direction/context records, not a headline, final service menu or claim that every area has been delivered commercially.

# 3. Technical experience

The following technologies are supplied as known tools/experience. No proficiency level, years of experience, certification or project-wide attribution is assigned.

## Languages / web fundamentals

- HTML.
- CSS.
- JavaScript.

## Frontend

- React.
- Next.js.

## Backend

- Node.js.
- Express.

## Databases

- MongoDB.
- MySQL.
- SQLite.

## Programming

- Python.
- Java.

## Application development

- Electron.

**Additional technologies: [NEEDS CONFIRMATION]**

Nova's Astro, TypeScript, Tailwind and other bundled dependencies must not be added to Anthony's experience merely because this repository uses them. A general experience list also does not establish which technology a particular project used.

# 4. Design / creative capabilities

Supplied capabilities:

- UI/UX.
- Website design.
- Digital interface design.
- Branding.
- Logo / brand-system work.
- Graphic design.
- Social media graphics.
- Advertisement concepts.
- YouTube thumbnails.
- Photography-related creative work.

Formal professional specialization, credentials, client volume and duration of practice: **[NEEDS CONFIRMATION]**.

# 5. Business capabilities

Supplied cross-disciplinary capabilities:

- Client communication.
- Discovery.
- Business-focused problem solving.
- Translating business needs into digital solutions.
- Project scoping.
- Customer experience thinking.
- Website strategy.
- Visual presentation.
- Project delivery from concept to implementation.

These are neutral capability records. They do not establish quantified business outcomes, formal management roles or a delivery guarantee.

# 6. Volatile Solutions

Volatile Solutions is Anthony Volatile's digital business / brand for technology, web, design and related digital work.

Current or demonstrated areas supplied in the brief:

- Websites.
- Web development.
- Frontend development.
- Software/application concepts.
- Dashboards.
- Custom digital tools.
- UI/UX.
- Branding.
- Graphic design.
- Marketing visuals.

**Founder involvement:** Anthony currently operates as the direct person responsible for the work rather than presenting Volatile Solutions as a large agency.

| Business detail | Status |
| --- | --- |
| Official business structure | [NEEDS CONFIRMATION] |
| Formal service area | Approved public scope: Rhode Island + remote clients; any separate formal jurisdiction details [NEEDS CONFIRMATION] |
| Remote-work policy | Remote clients are included in the approved public scope; detailed operating policy [NEEDS CONFIRMATION] |
| Business start date | [NEEDS CONFIRMATION] |
| Number of verified paying clients | [NEEDS CONFIRMATION] |
| Official public business description | [NEEDS CONFIRMATION] |
| Exact services actively offered for sale now | Current B3 order: Web Design & Development; Custom Web Applications; Branding & Visual Design; Website Support & Optimization. Exact approved descriptions are recorded in B3. |
| Preferred audience | Both prospective clients / businesses / founders and employers / recruiters evaluating Anthony's professional capabilities |

One supplied verified client-work record is not proof of the total number of paying clients. Founder involvement does not establish a registered entity type or a formal agency/team size.

UI/UX remains a capability, not a standalone service offering in the approved four-service menu. The current service names and exact descriptions are approved in B3. Digital Strategy & Solutions is no longer in the active set.

# 7. Professional employment

## Fidelity Investments

**Record category:** Professional / Employment Work.

| Field | Supplied fact or status |
| --- | --- |
| Employer | Fidelity Investments |
| Location/context | Smithfield, Rhode Island |
| Industry | Financial services |
| Work context | Customer/client-facing experience |
| Professional environment | Retirement/investment-related |
| Training direction | Securities licensing path |
| Current/most recent exact title | [NEEDS CONFIRMATION] |
| Previous Fidelity titles worth mentioning | [NEEDS CONFIRMATION] |
| Employment dates | [NEEDS CONFIRMATION] |
| Current employment status / date of latest status confirmation | [NEEDS CONFIRMATION] |
| Public-site inclusion | [NEEDS USER DECISION] |

### Completed, as supplied

- **SIE**.

Completion date and supporting credential details: **[NEEDS CONFIRMATION]**.

### In progress / current training context, as supplied

- **Series 7 — in progress / training context; completion is not confirmed.**
- **Series 63 — in progress / training context; completion is not confirmed.**

Do not list Series 7 or Series 63 as completed. The supplied SIE completion does not establish any additional license, registration, exact job title or authority to provide financial advice.

### Relevant transferable areas

- Client communication.
- Financial-services exposure.
- Regulated professional environment.
- Customer experience.
- Business communication.

This employment context is not a claim that Fidelity commissioned a Volatile Solutions project. Exact role responsibilities, internal software work and employer outcomes beyond this supplied context: **[NEEDS CONFIRMATION]**.

# 8. Education

## Community College of Rhode Island

Known context supplied by the user:

- Certificate of Study in Computer Science.
- Python coursework.
- Java coursework.

| Course reference | Supplied subject |
| --- | --- |
| COMI-1150 | Python |
| COMI-1510 | Java |

| Education detail | Status |
| --- | --- |
| Attendance/coursework dates | [NEEDS CONFIRMATION] |
| Certificate completion/award status | [NEEDS CONFIRMATION] |
| Certificate completion date | [NEEDS CONFIRMATION] |
| Graduation year | [NEEDS CONFIRMATION] |
| Additional coursework | [NEEDS CONFIRMATION] |

The brief establishes the certificate/coursework context; it does not supply an award date or graduation year. Do not convert the certificate context into a degree claim.

# 9. Verified client work

## The Moody Brewer

**Classification:** Verified Client Work — verified real client work based on the supplied information.

| Field | Supplied fact or status |
| --- | --- |
| Business | The Moody Brewer |
| Location | West Warwick, Rhode Island |
| Project type | Website / digital presence |
| Approved featured-card title | The Moody Brewer |
| Approved featured-card category | Client Website |
| Known contribution | Anthony took the project from concept through completion |
| Engagement context | Real business engagement |
| Known launch status | A production website was launched |
| Technologies | [NEEDS CONFIRMATION] |
| Exact scope / deliverables | [NEEDS CONFIRMATION] |
| Live URL | [NEEDS CONFIRMATION] |
| Project date | [NEEDS CONFIRMATION] |
| Client outcome | [NEEDS CONFIRMATION] |
| Testimonial | [NEEDS CONFIRMATION] |
| Screenshots/assets | `legacy-assets/portfolio/moody-brewer-thumbnail.png` — approved claim-free source; prepared production image `/assets/images/t001-nova/t001-nova-project-moody-brewer.webp` approved in B2 |
| Project-card alt text | The Moody Brewer website shown on a MacBook in a warm café setting — exact English wording approved in B2 |
| Repository | [NEEDS CONFIRMATION] |
| Permission to use business name/logo/assets publicly | [NEEDS CONFIRMATION] |
| Public-site inclusion | Approved homepage featured-project direction |
| Featured placement | Featured Project 1 |

No revenue, traffic, conversion, percentage-growth or other specific business result is supplied. A production launch is not evidence of such an outcome. The later Portfolio implementation records additional user-confirmed PVD Photography and Fros Lawncare client relationships, using supplied PVD promotional artwork while withholding unmapped Fros Lawncare artwork and unknown deliverables.

## Verified Moody Brewer analytics — project-specific evidence

Source: the user's approved-decision brief reports an observed analytics screenshot for a **30-day period from Sep 7 to Oct 7**.

| Reported measurement | Supplied value |
| --- | --- |
| Total pageviews | 2,623 |
| Total unique visitors | 1,458 |
| Bandwidth used | 3 GB |

The screenshot year, original screenshot asset and analytics-provider details are **[NEEDS CONFIRMATION]**; they are not inferred. These measurements belong to The Moody Brewer project context and are not automatically general Volatile Solutions hero metrics.

Do not claim causation, growth, conversion improvement or a business outcome from these traffic numbers. “3 GB bandwidth” should not be treated as a meaningful marketing statistic unless there is a future specific reason to use it. The existing client-outcome/testimonial fields remain unconfirmed.

# 10. Other client / business work requiring classification

## Euclid Financial Services

Known context: Anthony worked on / explored a website rebuild direction for Euclid Financial Services.

Known design direction included:

- Deep forest green.
- Gold.
- Sage.

These colors describe that project's supplied historical direction, not a palette change for the Nova website.

| Field | Supplied fact or status |
| --- | --- |
| Classification | [NEEDS CONFIRMATION — CLIENT / INTERVIEW PROJECT / CONCEPT / OTHER] |
| Purpose/context | Website rebuild direction |
| Exact relationship with business | [NEEDS CONFIRMATION] |
| Exact scope / contribution | [NEEDS CONFIRMATION] |
| Completion/status | [NEEDS CONFIRMATION] |
| Technologies | [NEEDS CONFIRMATION] |
| Project date | [NEEDS CONFIRMATION] |
| Live URL | [NEEDS CONFIRMATION] |
| Repository | [NEEDS CONFIRMATION] |
| Screenshots/assets | [NEEDS CONFIRMATION] |
| Business outcome / testimonial | [NEEDS CONFIRMATION] |
| Permission to use business name/logo/assets publicly | [NEEDS CONFIRMATION] |
| Public-site inclusion | [NEEDS USER DECISION] |
| Featured placement | [NEEDS USER DECISION] |

Do not classify this as completed client work, a paid engagement or a production launch without confirmation.

# 11. Software / digital product projects

These records remain separate from client engagements. Potential/concept areas below do not establish implemented features, users, production scale or commercial outcomes.

## TimeDock

**Classification:** Personal Software Project — personal / independent software project unless later clarified.

| Field | Supplied fact or status |
| --- | --- |
| Known context | macOS time-tracking application |
| Purpose | Time tracking on macOS |
| Technologies | Electron; React; SQLite |
| Completion/status | [NEEDS CONFIRMATION] |
| Project date | [NEEDS CONFIRMATION] |
| Screenshots/assets | [NEEDS CONFIRMATION] |
| Repository | [NEEDS CONFIRMATION] |
| Live/download link | [NEEDS CONFIRMATION] |
| Public-site inclusion | [NEEDS USER DECISION] |
| Featured placement | [NEEDS USER DECISION] |

No release, download count, user count, client engagement or distribution status is assumed.

## StillPoint

**Supplied working classification:** Personal / independent project.

| Field | Supplied fact or status |
| --- | --- |
| Known context | Application concept/project |
| Known focus | Faith / discipline |
| Exact category under Section 18 | [NEEDS CONFIRMATION] |
| Concise purpose beyond the supplied focus | [NEEDS CONFIRMATION] |
| Technical details / technologies | [NEEDS CONFIRMATION] |
| Completion/status | [NEEDS CONFIRMATION] |
| Project date | [NEEDS CONFIRMATION] |
| Screenshots/assets | [NEEDS CONFIRMATION] |
| Repository | [NEEDS CONFIRMATION] |
| Live/download link | [NEEDS CONFIRMATION] |
| Public-site inclusion | [NEEDS USER DECISION] |
| Featured placement | [NEEDS USER DECISION] |

The supplied personal/independent context is retained. Whether this is an implemented software project, a portfolio concept or an experimental build is not selected without further information.

## MetricForge

Known context: portfolio / digital product project involving analytics concepts.

Potential demonstrated areas supplied in the brief:

- Analytics interface.
- Dashboards.
- Session replay concepts.
- Cohort concepts.
- SaaS/product UX.

| Field | Supplied fact or status |
| --- | --- |
| Classification | [NEEDS CONFIRMATION — PERSONAL BUILD / PORTFOLIO CONCEPT / PRODUCTION PRODUCT] |
| Concise purpose beyond analytics concepts | [NEEDS CONFIRMATION] |
| Implemented features versus interface concepts | [NEEDS CONFIRMATION] |
| Technologies | [NEEDS CONFIRMATION] |
| Completion/status | [NEEDS CONFIRMATION] |
| Project date | [NEEDS CONFIRMATION] |
| Screenshots/assets | [NEEDS CONFIRMATION] |
| Repository | [NEEDS CONFIRMATION] |
| Live/download link | [NEEDS CONFIRMATION] |
| Public-site inclusion | [NEEDS USER DECISION] |
| Featured placement | [NEEDS USER DECISION] |

Do not call this client work or treat session replay/cohort concepts as functioning production systems without confirmation. “Production product” is a status to confirm, not an automatic client-work classification.

## GlassDash

| Field | Supplied fact or status |
| --- | --- |
| Known context | Financial/dashboard-oriented digital product project |
| Classification | [NEEDS CONFIRMATION] |
| Concise purpose | [NEEDS CONFIRMATION] |
| Technologies | [NEEDS CONFIRMATION] |
| Completion/status | [NEEDS CONFIRMATION] |
| Project date | [NEEDS CONFIRMATION] |
| Screenshots/assets | [NEEDS CONFIRMATION] |
| Repository | [NEEDS CONFIRMATION] |
| Live/download link | [NEEDS CONFIRMATION] |
| Public-site inclusion | [NEEDS USER DECISION] |
| Featured placement | [NEEDS USER DECISION] |

Do not call this client work.

## Cloud Keep

Known context: digital application/project involving concepts such as:

- Collaboration.
- Role-based access.
- Search.

| Field | Supplied fact or status |
| --- | --- |
| Classification | [NEEDS CONFIRMATION] |
| Concise purpose | [NEEDS CONFIRMATION] |
| Implemented features versus concepts | [NEEDS CONFIRMATION] |
| Technologies | [NEEDS CONFIRMATION] |
| Completion/status | [NEEDS CONFIRMATION] |
| Project date | [NEEDS CONFIRMATION] |
| Screenshots/assets | [NEEDS CONFIRMATION] |
| Repository | [NEEDS CONFIRMATION] |
| Live/download link | [NEEDS CONFIRMATION] |
| Public-site inclusion | [NEEDS USER DECISION] |
| Featured placement | [NEEDS USER DECISION] |

Do not call this client work or assume the listed concepts are completed production capabilities.

## Jobly

Known context: application/product concept involving:

- Authentication.
- Filtering.
- Application-style UX.

| Field | Supplied fact or status |
| --- | --- |
| Classification | [NEEDS CONFIRMATION] |
| Concise purpose | [NEEDS CONFIRMATION] |
| Implemented features versus concepts | [NEEDS CONFIRMATION] |
| Technologies | [NEEDS CONFIRMATION] |
| Completion/status | [NEEDS CONFIRMATION] |
| Project date | [NEEDS CONFIRMATION] |
| Screenshots/assets | [NEEDS CONFIRMATION] |
| Repository | [NEEDS CONFIRMATION] |
| Live/download link | [NEEDS CONFIRMATION] |
| Public-site inclusion | [NEEDS USER DECISION] |
| Featured placement | [NEEDS USER DECISION] |

Do not infer a paying client, launch or working authentication system.

## Mula

Known context: finance/data-oriented application/project.

Demonstrated areas may include:

- APIs.
- Data visualization.

| Field | Supplied fact or status |
| --- | --- |
| Classification | [NEEDS CONFIRMATION] |
| Concise purpose | [NEEDS CONFIRMATION] |
| Confirmed implemented features/API integrations | [NEEDS CONFIRMATION] |
| Technologies | [NEEDS CONFIRMATION] |
| Completion/status | [NEEDS CONFIRMATION] |
| Project date | [NEEDS CONFIRMATION] |
| Screenshots/assets | [NEEDS CONFIRMATION] |
| Repository | [NEEDS CONFIRMATION] |
| Live/download link | [NEEDS CONFIRMATION] |
| Public-site inclusion | [NEEDS USER DECISION] |
| Featured placement | [NEEDS USER DECISION] |

The tentative areas above are not a confirmed integration list or client engagement.

## ScholarLink

| Field | Supplied fact or status |
| --- | --- |
| Known context | Existing portfolio project |
| Classification | [NEEDS CONFIRMATION] |
| Purpose | [NEEDS CONFIRMATION] |
| Technologies | [NEEDS CONFIRMATION] |
| Completion/status | [NEEDS CONFIRMATION] |
| Project date | [NEEDS CONFIRMATION] |
| Screenshots/assets | [NEEDS CONFIRMATION] |
| Repository | [NEEDS CONFIRMATION] |
| Live/download link | [NEEDS CONFIRMATION] |
| Public-site inclusion | [NEEDS USER DECISION] |
| Featured placement | [NEEDS USER DECISION] |

No purpose or client relationship is inferred from the project name.

## Birdie Bay

| Field | Supplied fact or status |
| --- | --- |
| Known context | Existing portfolio project |
| Classification | [NEEDS CONFIRMATION] |
| Purpose | [NEEDS CONFIRMATION] |
| Technologies | [NEEDS CONFIRMATION] |
| Completion/status | [NEEDS CONFIRMATION] |
| Project date | [NEEDS CONFIRMATION] |
| Screenshots/assets | [NEEDS CONFIRMATION] |
| Repository | [NEEDS CONFIRMATION] |
| Live/download link | [NEEDS CONFIRMATION] |
| Public-site inclusion | [NEEDS USER DECISION] |
| Featured placement | [NEEDS USER DECISION] |

No purpose or client relationship is inferred from the project name.

## Frost

| Field | Supplied fact or status |
| --- | --- |
| Known context | Existing portfolio project |
| Classification | [NEEDS CONFIRMATION] |
| Purpose | [NEEDS CONFIRMATION] |
| Technologies | [NEEDS CONFIRMATION] |
| Completion/status | [NEEDS CONFIRMATION] |
| Project date | [NEEDS CONFIRMATION] |
| Screenshots/assets | [NEEDS CONFIRMATION] |
| Repository | [NEEDS CONFIRMATION] |
| Live/download link | [NEEDS CONFIRMATION] |
| Public-site inclusion | [NEEDS USER DECISION] |
| Featured placement | [NEEDS USER DECISION] |

No purpose or client relationship is inferred from the project name.

## Northline Strength

| Field | Supplied fact or status |
| --- | --- |
| Known context | Existing portfolio project |
| Classification | [NEEDS CONFIRMATION] |
| Purpose | [NEEDS CONFIRMATION] |
| Technologies | [NEEDS CONFIRMATION] |
| Completion/status | [NEEDS CONFIRMATION] |
| Project date | [NEEDS CONFIRMATION] |
| Screenshots/assets | [NEEDS CONFIRMATION] |
| Repository | [NEEDS CONFIRMATION] |
| Live/download link | [NEEDS CONFIRMATION] |
| Public-site inclusion | [NEEDS USER DECISION] |
| Featured placement | [NEEDS USER DECISION] |

No purpose or client relationship is inferred from the project name.

# 12. Additional digital product idea — do not place on website yet

## Shooting Range Companion App

**Classification:** Early Product Idea.

**Status:** Early concept / not an established portfolio project.

Supplied concept: a phone application used at a shooting range with the phone mounted on a small tripod.

Potential concepts:

- Align the live camera view with a paper target.
- Detect/track shots.
- Translate shots to a digital target.
- Grouping analysis.
- Timing between shots.
- Organize sessions by range day.
- Organize sessions by firearm.

Implementation, technical feasibility, technologies, development status beyond early concept and assets: **[NEEDS CONFIRMATION]**.

**Public website placement: excluded unless Anthony explicitly asks later.** These are proposed concepts, not demonstrated features or an established portfolio record.

# 13. Graphic design / creative portfolio

The supplied Volatile Solutions body of work includes categories such as:

- Brand kits.
- YouTube thumbnails.
- Advertisement concepts.
- Social media graphics.
- Promotional graphics.

| Evidence category | Meaning / status |
| --- | --- |
| Creative pieces produced | Individual creative artifacts; quantity and item-level details [NEEDS CONFIRMATION] |
| Verified client engagements | Actual verified business/client relationships, not inferred from artifact count |
| Item-level authorship, client/concept classification, dates and assets | [NEEDS CONFIRMATION] |
| Public usage permissions | [NEEDS CONFIRMATION] |

Do not interpret the quantity of creative pieces as the number of paying clients. Keep creative output separate from verified engagements in future copy.

## Approved featured collection — Creative Work

| Field | Approved decision or remaining status |
| --- | --- |
| Classification | Creative Portfolio / Body of Work |
| Homepage featured direction | Featured Project 2 |
| Approved featured-card title | Creative Work |
| Approved featured-card category | Branding, Ads & Marketing |
| Record type | Curated collection of creative output, not one paying-client project |
| Included output types | Branding; advertisements; marketing graphics; social graphics; promotional visuals; related visual-design work |
| Exact pieces selected for the collection | Approved 2×2 cover: Luma Spritz, Alder & Finch cleaning-service promo, Flowstate AI and Sable Row; inclusion does not verify client status |
| Project image / collection image | `/assets/images/t001-nova/t001-nova-project-creative-work.webp` — prepared 2×2 cover approved in B2; preserve the existing image family |
| Image alt text | Collage of branding, advertising, social media, and digital design work — exact English wording approved in B2 |
| Individual-piece client/concept classification and usage permissions | [NEEDS CONFIRMATION] |

Do not classify the collection as Verified Client Work merely because individual pieces may involve external businesses or concepts. The six individual-project classification rules in Section 18 remain intact; the collection-level record does not add a seventh project category.

# 14. Content creation / personal brand

Anthony is also developing personal content under his own identity.

Supplied platforms/direction include:

- YouTube.
- Instagram.
- Entrepreneurship.
- Building Volatile Solutions.
- Software/development.
- Personal growth.
- Business-building journey.

**Public-site relevance:** B9 approves the public profile destinations and their usage intent. Broader personal-content integration beyond profile links remains **[NEEDS USER DECISION]**.

Do not automatically integrate personal videos/posts into the Volatile Solutions homepage. Business/personal Instagram and YouTube destinations are approved in B9 and Section 1. Channel status, content inventory and audience size remain **[NEEDS CONFIRMATION]**; integration beyond the approved profile links remains **[NEEDS USER DECISION]**.

# 15. Professional differentiators

Supplied factual themes, not slogans:

- Technical + creative skill overlap.
- Development + design capability.
- Business/customer-facing experience.
- Financial-services domain exposure.
- Ability to think about both implementation and customer/business outcomes.
- Hands-on project building.
- Ability to move from concept toward implementation.

No marketing headline, comparative claim, guarantee, quantified result or formal specialization is derived from these themes.

# 16. Website positioning risk

The supplied strategic concern is that the previous Volatile Solutions website **may** position Anthony primarily as a small-business website provider. The old website content is not present in this repository, so this remains a user-supplied concern rather than a repository-verified statement about its wording.

The supplied broader body of work/direction extends into:

- Frontend development.
- Applications.
- Dashboards.
- Digital products.
- UI/UX.
- Creative work.

Future migration should avoid unnecessarily narrowing the brand to only “website design.” At the same time, copy must not overstate software engineering experience, client volume or production scale. This records a scope/accuracy concern; it does not select positioning, services or final messaging.

# 17. Claims requiring verification

## DO NOT PUBLISH WITHOUT CONFIRMATION

Every item below is unverified for publication: **[NEEDS CONFIRMATION]**. Listing a claim here does not establish that it is true or that it appeared in older material.

- Number of paying clients.
- “30+ projects launched” or similar wording.
- Amount of revenue produced for clients.
- Conversion improvements.
- Percentage growth claims.
- Number of users.
- Years of professional software engineering experience.
- Years operating Volatile Solutions.
- Formal agency/team size.
- Specific client outcomes.
- Enterprise software claims.
- Production scale claims.
- Testimonials.
- Awards tied to Volatile Solutions.
- Exact job titles not verified.
- Certifications/licenses not completed.
- Any project classified as client work without verification.

If any such statement is later found in old Volatile Solutions material without supporting verification, mark that specific statement **[EXISTING CLAIM — NEEDS CONFIRMATION]** and record its source. Do not copy it into website data as fact.

Series 7 and Series 63 remain in-progress/training context, not completed credentials. The Moody Brewer's supplied client classification and production launch do not establish business-growth outcomes or a publishable testimonial.

# 18. Project classification rule

All future projects must be explicitly classified as one of:

1. Verified Client Work.
2. Professional / Employment Work.
3. Personal Software Project.
4. Portfolio Concept.
5. Experimental Build.
6. Early Product Idea.

Never blur these categories for stronger marketing. A production status, attractive screenshot, business-like project name or creative-artifact count does not prove client status.

Classification state in this source:

| Record | Classification state |
| --- | --- |
| The Moody Brewer | Verified Client Work; approved Featured Project 1 |
| PVD Photography | Verified Client Work; advertising/creative work confirmed and matched to newly supplied real client artwork |
| Fros Lawncare | Verified client relationship; scope and source artwork mapping pending |
| Creative Work | Creative Portfolio / Body of Work; category Branding, Ads & Marketing; approved Featured Project 2; collection-level record, not a single client project |
| Fidelity Investments context | Professional / Employment Work; no software project inferred |
| TimeDock | Personal Software Project, supplied working classification unless later clarified |
| StillPoint | Personal / independent context supplied; exact category [NEEDS CONFIRMATION] |
| Euclid Financial Services | [NEEDS CONFIRMATION — CLIENT / INTERVIEW PROJECT / CONCEPT / OTHER] |
| MetricForge | [NEEDS CONFIRMATION — PERSONAL BUILD / PORTFOLIO CONCEPT / PRODUCTION PRODUCT] |
| GlassDash | [NEEDS CONFIRMATION] |
| Cloud Keep | [NEEDS CONFIRMATION] |
| Jobly | [NEEDS CONFIRMATION] |
| Mula | [NEEDS CONFIRMATION] |
| ScholarLink | [NEEDS CONFIRMATION] |
| Birdie Bay | [NEEDS CONFIRMATION] |
| Frost | [NEEDS CONFIRMATION] |
| Northline Strength | [NEEDS CONFIRMATION] |
| Shooting Range Companion App | Early Product Idea; excluded from public site unless explicitly requested |

The creative collection is an aggregate body-of-work record, not an addition to the six individual-project categories. Individual pieces still require truthful classification under those existing rules.

Unresolved records must be confirmed before a final category or stronger public claim is assigned. The descriptive alternatives supplied for Euclid/MetricForge must eventually be resolved into the six categories without treating “production product” as synonymous with “client work.”

# 19. Information still needed from Anthony

## Identity

- [x] Preferred professional title: Developer, Designer & Digital Product Builder.
- [x] Preferred public location/service scope: Rhode Island + remote clients; no street-address publication.
- [x] Professional email: volatile-solutions@outlook.com.
- [x] Public phone: 401-545-6860.
- [x] LinkedIn: https://linkedin.com/in/anthony-volatile.
- [x] GitHub: https://github.com/AVolatile.
- [x] YouTube: https://www.youtube.com/@anthonyvolatile.
- [x] Primary business Instagram: https://www.instagram.com/volatile.solutions/.
- [x] Personal/secondary Instagram: https://www.instagram.com/a.volatile/.
- [ ] Later scoped implementation of approved profiles, including unsupported LinkedIn/GitHub UI.

## Volatile Solutions

- [ ] Official public description.
- [ ] Official business structure.
- [x] Current approved service order: Web Design & Development; Custom Web Applications; Branding & Visual Design; Website Support & Optimization.
- [x] Exact descriptions of the four services: approved verbatim in B3.
- [x] Preferred audience: prospective clients/businesses/founders and employers/recruiters, approximately 50/50.
- [x] Public geographic/remote scope: Rhode Island + remote clients.
- [ ] Detailed remote-work policy.
- [ ] Business hours.
- [ ] Structured-address handling and legal registration data; no street-address publication.
- [ ] Business start date.
- [ ] Verified paying-client count, if needed for a later claim.

## Fidelity / employment

- [ ] Exact current/most recent title.
- [ ] Previous Fidelity titles worth mentioning.
- [ ] Employment dates and current-status confirmation.
- [ ] Whether Fidelity should appear on the public site.
- [ ] Dates/evidence for supplied SIE completion and current Series 7/Series 63 training status.

## Education

- [ ] Certificate completion/award status and completion date.
- [ ] Coursework dates.
- [ ] Additional coursework.
- [ ] Graduation year only if applicable and verified.

## Projects

- [x] Homepage featured records: The Moody Brewer / Client Website (1); Creative Work / Branding, Ads & Marketing (2).
- [x] English Projects heading, description, link label and unchanged shared destination: exact values approved in B2.
- [x] Both prepared homepage project image families and exact English alt text: approved in B2.

For every major project:

- [ ] Final classification.
- [ ] Concise purpose.
- [ ] Technologies actually used.
- [ ] Completion/status and project date.
- [ ] Implemented features versus concepts where relevant.
- [ ] URL or download link.
- [ ] Repository.
- [ ] Remaining screenshots/assets and production readiness for other projects; both approved homepage project image families and English alt text are resolved in B2.
- [ ] Public inclusion for other projects; the two approved homepage selections are recorded above.
- [ ] Featured placement for other projects; homepage slots 1 and 2 are decided.

A richer factual project record does not authorize adding descriptions, technologies, individual URLs or detail pages to Nova's current ProjectsBlock; use the migration map to identify its capacity limits.

## Client work

- [ ] Verified client relationships.
- [ ] Actual scope and contribution.
- [ ] Permission to use business names/logos/assets.
- [ ] Measurable outcomes with evidence, if any.
- [x] Testimonial handling: later removal or replacement through a separately approved structural change; no inherited demo or fabricated testimonials.
- [ ] Real testimonials and permission to use them, only if later selected as part of that separately scoped task.
- [x] The Moody Brewer featured-image source: current user-replaced `legacy-assets/portfolio/moody-brewer-thumbnail.png`, asset A3.
- [ ] The Moody Brewer's missing URL, technologies and dates; final project-card alt text, crop/quality acceptance and production derivatives.
- [ ] Euclid's exact relationship/classification before any client claim.

## Services

- [x] Current service offering: the four approved service names in Section 6 / B3, in the specified order; UI/UX remains a capability, not a standalone offering.
- [x] Exact service descriptions: approved verbatim in B3; no further descriptions are written here.
- [x] English Services heading, section description, link label and unchanged `#services` destination: exact approved values recorded in B3.

## Personal brand

- [x] YouTube and primary/secondary Instagram profile usage: approved in B9.
- [ ] Broader personal-content integration beyond approved profile links.
- [ ] Which personal content, if any, should be public on that site.

## Hero and localization decisions

- [x] General hero statistics/trust-name availability: no verified, meaningful four-metric/five-name production set is currently available.
- [x] Metrics panel intentionally retained with four dash placeholders pending verified figures; trust strip disabled.
- [x] Localization strategy: English-only; Polish site/version retired under explicit user approval.
- [x] Polish translation work is no longer a dependency: the public Polish version is retired.
- [x] Main hero headline: Developer, Designer & Digital Product Builder.
- [x] Hero CTA labels: View My Work; Work With Me.
- [ ] Hero supporting description and any additional unapproved hero copy; CTA destinations are not changed by B1.
- [x] About title/checks/CTA: About Anthony; the three B4 checks; Let’s Work Together.
- [ ] Founder/about paragraph.
- [x] Count/label and supporting visual semantics: 1 / Founder-led; Development, Design, Business / Strategy.
- [x] Main About Anthony source: `legacy-assets/aboutme/about-me-photo1.PNG`, asset A2; distinct from the hero.
- [x] Capability-indicator direction: remove teammate implication; minimal later structural adjustment approved in principle under asset A7.
- [ ] Exact capability visual assets and future implementation details; final About alt text, crop and derivatives.
- [x] FAQ direction: mixed business/services, process, working directly with Anthony and practical support/revisions/handoff concerns.
- [ ] Final four FAQ questions/answers.
- [x] Moody Brewer featured-image source approved under asset A3; inspect the current user-replaced file before migration.
- [x] Creative Work cover direction approved under asset A4: dedicated body-of-work composition later from existing real pieces.
- [x] Creative Work prepared 2×2 cover and selected pieces; both homepage production image families and exact English project-card alt text approved in B2.
- [x] Asset source: legacy-assets/ at root, source/migration material only.
- [x] Hero source: `legacy-assets/aboutme/about-me-photo4.png`, asset A1; founder face/presence takes crop priority.
- [x] Navigation branding approach: graphical horizontal Volatile Solutions mark plus wordmark, asset A5; not the final plain text-only identity.
- [x] Dedicated favicon source: `legacy-assets/Logos/favicon.png`, asset A6; do not derive it from logo-light.png.
- [ ] Final hero alt text and crop values; production asset/derivative filenames.
- [ ] Final production horizontal logo file and exact navbar logo dimensions; transparency, contrast and legibility validation.
- [ ] Favicon dimensions/transparency/legibility and required browser/touch derivative sizes/formats during preparation.
- [ ] OG/social-preview composition.
- [ ] Controlled production asset preparation/migration; preserve originals and Nova naming/pipeline, with no stale derivatives.

# 20. Future migration rule

**This file stores factual source material.**

**It is NOT permission for AI agents to invent final website messaging.**

Future website copy must be created from facts in this document, then adapted to the content slots and constraints documented in `CONTENT_MIGRATION_MAP.md`.

When there is a conflict:

1. Explicit user instruction.
2. Verified facts.
3. `VOLATILE_CONTENT_SOURCE.md`.
4. `CONTENT_MIGRATION_MAP.md`.
5. Existing Nova demo content.

**Nova demo information must never override real business facts.**

This is a factual-evidence priority, not permission to alter Nova's structure. `AGENTS.md` remains the operating authority for preserving existing components, styles, section composition, localization and interactions. Unknown facts remain marked for confirmation; unsupported content capacity is reported before separately scoped changes. Creating this document does not begin migration or authorize another task.
