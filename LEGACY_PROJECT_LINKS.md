# Legacy Project Links

Current public project/link reference for a later, separately authorized migration. **No migration is performed or authorized by this document.**

Verified on **2026-10-07, America/New_York** (report completed 2026-10-08 UTC). Links and content are a dated snapshot; recheck them before publication.

## 1. Evidence, scope and source priority

Read and followed [AGENTS.md](AGENTS.md), [CONTENT_MIGRATION_MAP.md](CONTENT_MIGRATION_MAP.md), [VOLATILE_CONTENT_SOURCE.md](VOLATILE_CONTENT_SOURCE.md) and [LEGACY_ASSET_INVENTORY.md](LEGACY_ASSET_INVENTORY.md).

Resolve conflicts in this order:

1. Explicit user-approved facts and classifications in `VOLATILE_CONTENT_SOURCE.md`.
2. The current live Volatile Solutions site for currently published URLs and descriptions.
3. `LEGACY_ASSET_INVENTORY.md` for local asset identity, quality and preparation requirements.
4. Legacy filenames/folders as supporting clues only.
5. Unrelated template/demo content carries no business-fact authority.

Public pages inspected: [homepage](https://volatile-solutions.net/), [portfolio](https://volatile-solutions.net/portfolio), and [creative collection](https://volatile-solutions.net/graphic-design). Each responded HTTP 200 without an HTTP redirect. The portfolio has **14 distinct project cards**; its additional Moody Brewer spotlight repeats the same project and destination. Creative Work is a separate collection-level record.

Verification used read-only HTTPS GET requests with TLS verification, followed redirects, and inspected returned HTML and directly page-loaded gallery resources. All project destinations were extracted from actual current page links, then requested independently. No search snippets, inferred domains, login attempts, form submissions or application interactions were used. No remote code was executed.

**Status meaning:** Live means the public entry page returned HTTP 200 with readable project content. Redirects but valid means a successful destination after HTTP redirects. Broken means an observed failed public destination, such as HTTP 404. Restricted means access is blocked or requires authentication to reach the public entry content. Unclear means insufficient evidence. HTTP success does not certify complete JavaScript rendering, every subpage, functional authentication, bookings, payments, APIs, backend behavior, security or production scale. No browser interaction or visual runtime QA was performed.

Thirteen current portfolio records remain **Needs Classification**. The Moody Brewer alone is **Verified Client Work** under the approved source. Strong public wording and working deployments do not override that distinction.

## 2. Complete current public portfolio inventory

Descriptions below are concise paraphrases of the [current portfolio](https://volatile-solutions.net/portfolio). Category and deliverable labels record public metadata, not independently verified delivery. Exact destination URLs and link status are in Section 5. All 14 project URLs are **external** to volatile-solutions.net.

| Public project name | Current public category/type | Current public description, paraphrased | Public deliverables/features listed |
| --- | --- | --- | --- |
| MetricForge | Analytics SaaS • Dashboard | Analytics presentation for product and growth teams, combining dashboard, replay and cohort concepts without SQL-heavy reporting. | Product Positioning; Dashboard UX; SaaS Marketing Site. Description also claims session replay and cohort reporting. |
| GlassDash | Finance Dashboard • Admin UI | Administrative overview of revenue, account growth and rollout progress. | Dashboard UX; Data Visualization; Admin Interface. |
| Cloud Keep | SaaS • Web App | Team file-management concept emphasizing collaboration, access roles and search. | Strategy; UX/UI Design; Full-Stack Build. |
| Jobly | Web App • Landing Page | Job discovery experience presented with account access, filtering and saved positions. | UX Design; React Build; Auth Flow. |
| Birdie Bay | E-commerce • Branding | Public card describes a branded shop concept with product presentation and checkout. | Brand Identity; UI/UX Design; Storefront. **Destination is a golf/membership site, not the described shop.** |
| Frost | Marketing Site • Branding | Fitness coaching offer presented to encourage inquiries. | Strategy; Visual Brand; Web Build. |
| Northline Strength Club | Fitness Studio • Branding | Brooklyn coaching presentation with class options, instructors, schedules and introductory booking intent. | Offer Positioning; Membership Funnel; Local Brand Presence. |
| Sonoran Comfort Systems | Local Service • HVAC | Phoenix HVAC service presentation covering repair, installation, maintenance and air-quality inquiries. | Service Positioning; Quote Funnel; Local Trust Signals. |
| Northline Plumbing | Local Service • Plumbing | Plumbing service presentation emphasizing urgent response and clear residential/commercial service routes. | Emergency Service CTA; Local Trust Signals; Lead Capture Flow. |
| Solartec | Energy Services • Solar | Solar-service presentation with quote prompts, service information and project examples. | Service Clarity; Quote CTA; Local Trust Signals. **Destination currently uses Sunward Grid Solar branding.** |
| Harbor & Steel | Barber Shop • Branding | Brooklyn barber presentation with prices, staff and repeat-visit booking intent. | Brand Presentation; Service Menu; Booking CTA. |
| Moody Brewer Coffee Shop | Coffee Shop • Branding | Warm café website presentation associated with a real client launch. | Brand Identity; Custom Website; Live Launch. Approved record name is **The Moody Brewer**; approved homepage category is **Client Website**. Exact delivery scope remains unconfirmed in the factual source. |
| Mula | Web App • Finance | Expense-tracking interface presented with charts, search/filtering, categories and CSV export. | UX Testing; Data Visualization; Custom API. **Current destination explicitly describes localStorage and operation without a backend; Custom API is not verified for this version.** |
| ScholarLink | Marketing Site • Education | Tutoring presentation described as connecting learners with teachers through subjects and profiles. | Content Strategy; Site Design; Webflow Sync. Actual matching or Webflow synchronization is unverified. |

### Destination observations and access

Each destination below returned **HTTP 200, zero HTTP redirects**, with public content available without login. Optional login controls do not make the entry page Restricted. Site identity observations come from normal page loads of the destinations in Section 5.

| Portfolio record | Observed page identity and presentation | Classification boundary / obvious limitation |
| --- | --- | --- |
| MetricForge | MetricForge product/revenue analytics marketing page; dashboards, pricing and trial/demo prompts. | Static marketing/interface presentation is observable; live analytics services, replay, SDK operation and paying teams are not established. Needs Classification: personal build / portfolio concept / production product unresolved. |
| GlassDash | Page title and visible branding use **Glass Admin**; public command-center dashboard with revenue/accounts/transactions. | Dashboard preview is publicly accessible. Whether data or account controls are real is unverified. Preserve the unresolved GlassDash source record and note this name correspondence. |
| Cloud Keep | **CloudKeep** storage marketing page, feature sections, pricing calculator inputs and contact/trial prompts. | Page access does not establish a deployed storage backend, secure file handling, role access or compliance. Needs Classification. |
| Jobly | **Jobly – Online Job Portal**; listings, category/search controls, and Register/Login links; visible Bootstrap 5 attribution. | Public entry is accessible. Authentication and saved-role behavior were not exercised. React Build claim is not substantiated by this normal page load. Needs Classification. |
| Birdie Bay | **Birdie Bay — Golf & Events**; memberships, event information, newsletter/contact forms and optional member-login fields. | The destination and asset agree on golf; portfolio e-commerce/checkout wording conflicts. No login attempted. Needs Classification despite the public card's concept wording. |
| Frost | **JackFrost Coaching**; coaching offer, process and application form. | Service marketing site is observable; submitted coaching inquiries and business/client authenticity are not verified. Needs Classification. |
| Northline Strength Club | **Northline Strength Club**; coaching tracks, classes, staff and schedule/intro calls to action. | Matches the source's Northline Strength identity at the naming level. Bookings/membership conversion and client relationship are unverified. Needs Classification. |
| Sonoran Comfort Systems | Phoenix HVAC marketing site with service, quote and trust/review sections. | Business-like presentation, testimonials and trust marks do not verify a client engagement or operational service business. Needs Classification; no approved project classification supplied. |
| Northline Plumbing | Northline Plumbing public service page **explicitly identifies its brand as fictional** and explains the conversion-design concept. | Strong evidence of a portfolio concept presentation; retain Needs Classification until the user resolves the record. Do not recast mock service statistics as actual outcomes. |
| Solartec | Current destination title is **Sunward Grid Solar \| Phoenix Solar Installation & Battery Backup**; Arizona solar-service site. | Live URL is valid, but portfolio name/thumbnail are not aligned with the current destination identity. Needs Classification and name/version confirmation. |
| Harbor & Steel | Brooklyn barber marketing site with services, prices, staff and booking prompts. | Template-style service presentation, including placeholder-like contact details. No actual client or booking functionality established. Needs Classification. |
| The Moody Brewer | **Moody Brewer** café site with menu, story, visit/directions content in the West Warwick context. | Production client website classification is user-approved, not inferred from HTTP status. Public site access works; menu data, review provenance and all subpages were not functionally audited. |
| Mula | **Mula Rebuild \| Expense Tracker**; expense, budget, filtering, insights and CSV controls; page explicitly states localStorage and no backend. | Publicly deployed local-first app preview. Features were visible but not exercised. Do not claim a custom API or verified UX testing from the portfolio badge. Needs Classification. |
| ScholarLink | **ScholarLink Tutors**; tutor profiles, subjects, reviews and consultation/contact prompts. | Public tutoring marketing site, not evidence of a live tutor-matching platform or Webflow integration. Needs Classification. |

Moody's exact published link is `https://themoodybrewer.net`; the request's effective URL was `https://themoodybrewer.net/`. This is trailing-slash normalization, **not an observed HTTP redirect**. None of the 14 current portfolio destinations qualified as Broken, Restricted or Redirects but valid in this check.

### Conflicting homepage links

The [homepage](https://volatile-solutions.net/) still publishes these alternate links. They were checked independently; the working portfolio destinations take precedence for the project reference.

| Homepage project label | Exact homepage URL | Observed result | Current valid portfolio URL / discrepancy |
| --- | --- | --- | --- |
| The Moody Brewer | https://moody-brewer.netlify.app/ | **Broken — HTTP 404**, zero redirects | https://themoodybrewer.net — homepage brewery/beer/event wording also conflicts with the coffee-shop portfolio/client record. |
| Solartec | https://solartec.netlify.app/ | **Broken — HTTP 404**, zero redirects | https://solar-portfolio.netlify.app/ — current destination is Sunward Grid Solar; name/version still requires review. |

The homepage also links MetricForge and Northline Strength to the same valid destinations as the portfolio, and links Creative Work to `/graphic-design` and its advertisement collection fragment. No site link or text was changed.

## 3. Known-project reconciliation

This table accounts for all 13 requested known records. Presence is based on the inspected current homepage, portfolio and creative collection, not a claim that all possible unlinked site routes were crawled.

| Approved/source record | Current public presence | Preserved classification / unresolved fact |
| --- | --- | --- |
| The Moody Brewer | Portfolio card under Moody Brewer Coffee Shop, repeated spotlight and homepage placement; valid production destination found. | **Verified Client Work**; approved Featured Project 1, title The Moody Brewer, category Client Website. |
| MetricForge | Listed on portfolio and homepage. | **Needs Classification** — personal build / portfolio concept / production product unresolved. |
| GlassDash | Listed on portfolio; destination displays Glass Admin. | **Needs Classification**; name correspondence noted, not silently renamed. |
| Cloud Keep | Listed on portfolio; destination displays CloudKeep. | **Needs Classification**. |
| Jobly | Listed on portfolio. | **Needs Classification**. |
| Birdie Bay | Listed on portfolio; destination/asset show golf rather than the public e-commerce description. | **Needs Classification**. |
| Frost | Listed on portfolio; destination displays JackFrost Coaching. | **Needs Classification**; exact record/version correspondence needs confirmation. |
| Northline Strength | Listed as Northline Strength Club on portfolio and homepage. | **Needs Classification**; distinct from Northline Plumbing and Northline Realty. |
| Mula | Listed on portfolio; current destination is Mula Rebuild. | **Needs Classification**; API wording conflicts with local-first destination. |
| ScholarLink | Listed on portfolio. | **Needs Classification**. |
| TimeDock | **Not publicly listed on current site**. No public URL established. | **Personal Software Project**, supplied working classification; macOS time tracking with Electron, React and SQLite supplied in the source. Release/completion/distribution unconfirmed. |
| StillPoint | **Not publicly listed on current site**. No public URL established. | Personal / independent context retained; exact category **Needs Classification**, focus faith/discipline. No functioning app inferred. |
| Euclid Financial Services | **Not publicly listed on current site**. No public URL established. | **Needs Classification** — client / interview project / concept / other unresolved; rebuild direction supplied, not a confirmed launch. |

Additional current portfolio records are Sonoran Comfort Systems, Northline Plumbing, Solartec and Harbor & Steel. Their assets exist, but approved factual classification records are absent; all remain **Needs Classification**. The creative collection has its own approved aggregate classification.

**HealthSync AI:** `legacy-assets/portfolio/health-sync-thumbnail.png` exists as a logo/title image; **Not publicly listed on current site** in the inspected project inventory. No URL, completed software project, client status or project classification is established. Treat as an asset-only record needing review, not a fifteenth public portfolio project. FLOWSTATE AI, REVNUE, VAULTIQ and other product-themed creative graphics likewise do not establish separate completed applications.

## 4. Creative Work collection

Approved featured record: **Creative Work**. Approved category: **Branding, Ads & Marketing**. Approved classification: **Creative Portfolio / Body of Work**, a curated aggregate rather than one paying-client engagement.

The suitable public collection URL is **https://volatile-solutions.net/graphic-design**. It is **internal**, Live, HTTP 200, with no HTTP redirect. It is already linked from the public homepage.

### Current galleries and category coverage

The page directly loads [gallery data](https://volatile-solutions.net/js/graphic-portfolio-data.js?v=20260524packages1) and [its renderer](https://volatile-solutions.net/js/custom.js?v=20260524packages1); both resources loaded successfully. Parsed data contains **120 configured entries**, not 120 verified clients or proven delivered campaigns.

| Gallery | Configured entries | Major filters / categories | Existing page fragment |
| --- | --- | --- | --- |
| Brand Kits | 48 | Finance, Medical, Auto, Fitness, Real Estate, SaaS, Restaurant & Food, Travel & Leisure | `#brand-kits` |
| YouTube Thumbnails | 42 | AI Tools, Faith & God, Finance & Investing, Fitness, Food & Restaurant, Real Estate | `#content-thumbnails` |
| Advertisement Image Concepts | 15 | Energy Drinks, Fitness Lifestyle, Food & Beverage, Supplements & Pre-Workout, Tech & Digital Products | `#advertisement-image-concepts` |
| Social Media & Promo Graphics | 15 | Event Graphics, LinkedIn Banners, Promo Flyers, Service Graphics, Social Posts | `#social-media-promo-graphics` |

The site's ten creative-category tiles additionally advertise Social Campaigns, Print Marketing and Presentations through `contact.html`; Web Concepts and UI/Product through `portfolio.html`; Creator Systems shares the thumbnail gallery. These are contact/navigation destinations, not additional independently evidenced collections or project links. The Social Media & Promo tile is labeled Future collection even though the current data includes 15 entries; preserve this mismatch as evidence rather than treating the gallery as empty.

### Items, links and lightbox behavior

All 120 configured items contain title/category/description/image metadata; **none contains an individual project URL, href or external destination field**. The current renderer's `initGraphicPortfolioGroups()` / `renderCardItem()` emits image buttons with `graphic-lightbox-trigger`. `openGraphicLightbox()` takes the same image source, title and category into the shared modal; it does not navigate to a project page. Collection tiles and featured cards scroll to gallery sections.

There are public image-resource URLs, but those are source artwork, **not individual client/project pages**. Do not invent case-study URLs from item IDs or filenames. Static HTML includes empty/filter messages and gallery mounts; the gallery data and renderer explain why text-only HTML extraction can misleadingly look empty. Browser execution and all 120 individual image loads were not audited; the representative Ledger & Loom image was separately verified.

The collection URL is appropriate as a reference destination for the approved Creative Work item. A collection entry, invented brand name, campaign concept, promotional statistic or artifact count does not prove a real client relationship. Individual authorship, dates, tools, rights and client/concept status remain unconfirmed.

## 5. Authoritative current URL table

Each linked destination below was extracted from the live site, then checked. All 14 project entries returned HTTP 200 with zero redirects. Asset names in this concise table refer to full paths and preparation findings in Section 6.

| Project | Classification | Current public URL | Link status | Legacy asset match | Notes |
| --- | --- | --- | --- | --- | --- |
| The Moody Brewer | Verified Client Work | https://themoodybrewer.net | Live | moody-brewer-thumbnail.png | Production café client site; homepage alternative is broken; thumbnail claims blocked. |
| Creative Work | Creative Portfolio / Body of Work | https://volatile-solutions.net/graphic-design | Live | Ledger-and-Loom.png; wider creative library | Internal collection, not one client; representative image is one identity only. |
| MetricForge | Needs Classification | https://metric-forge.netlify.app/ | Live | metric-forge-thumbnail.png | Analytics marketing preview; implementation/scale unconfirmed. |
| GlassDash | Needs Classification | https://glass-dash-admin.netlify.app/ | Live | glass-dash-thumbnail.png | Visible name Glass Admin; public dashboard preview. |
| Cloud Keep | Needs Classification | https://cloud-keep.netlify.app/ | Live | cloud-keep-thumbnail.png | Storage marketing preview; backend/compliance unverified. |
| Jobly | Needs Classification | https://jobly-jobsearch.netlify.app/ | Live | jobly-thumbnail.png | Job-portal preview; React/auth claims unverified. |
| Birdie Bay | Needs Classification | https://birdie-bay.netlify.app/ | Live | birdie-bay-thumbnail.png | Golf/membership destination conflicts with e-commerce card. |
| Frost | Needs Classification | https://frost-fitness.netlify.app/ | Live | frost-thumbnail.png | JackFrost Coaching identity; correspondence needs confirmation. |
| Northline Strength | Needs Classification | https://fitness-site-portfolio.netlify.app/ | Live | northline-thumbnail.png | Public name Northline Strength Club; no verified membership outcome. |
| Sonoran Comfort Systems | Needs Classification | https://hvac-portfolio.netlify.app/ | Live | sonoran-comfort-thumbnail.png | HVAC service presentation; no approved client classification. |
| Northline Plumbing | Needs Classification | https://plumbing-portfolio.netlify.app/ | Live | plumbing-thumbnail.png; supporting JPEG | Destination identifies fictional brand; user classification still pending. |
| Solartec | Needs Classification | https://solar-portfolio.netlify.app/ | Live | solar-thumbnail.png | Destination now Sunward Grid Solar; old homepage URL broken. |
| Harbor & Steel | Needs Classification | https://haircut-portfolio.netlify.app/ | Live | harbor-steel-thumbnail.png | Barber presentation; engagement and bookings unverified. |
| Mula | Needs Classification | https://mula-expense-tracker-v2.netlify.app/ | Live | mula-thumbnail.png | Local-first expense app preview; Custom API mismatch. |
| ScholarLink | Needs Classification | https://scholar-link.netlify.app/ | Live | scholar-link-thumbnail.png | Tutoring marketing preview; Webflow Sync unverified. |
| TimeDock | Personal Software Project | Not publicly listed on current site | Unclear — no URL supplied/found | No identifiable asset | No guessed deployment/download link. |
| StillPoint | Needs Classification; personal / independent context | Not publicly listed on current site | Unclear — no URL supplied/found | No identifiable asset | Exact category, implementation and release unresolved. |
| Euclid Financial Services | Needs Classification | Not publicly listed on current site | Unclear — no URL supplied/found | No identifiable asset | No inferred link from business name. |
| HealthSync AI, asset-only record | Needs Classification | Not publicly listed on current site | Unclear — no URL supplied/found | health-sync-thumbnail.png | Logo/title export only; not counted among public projects. |

For absent records, Unclear describes missing link evidence, **not a tested failed endpoint**.

## 6. Project-to-asset mapping and currentness

Asset assessment comes from [LEGACY_ASSET_INVENTORY.md](LEGACY_ASSET_INVENTORY.md). During this audit, all **14 images actually referenced by portfolio cards** were fetched read-only from the live site and SHA-256 compared in memory with their local counterparts: **14/14 exact byte matches**, all HTTP 200. Ledger & Loom was also an exact byte match to the gallery-listed image. No images were downloaded into the workspace.

Thus the local thumbnails match **current public presentation exports**. This does not prove they accurately capture the current destination, contain supported claims, or are ready for Nova. Solartec is the clearest current-public-export versus current-destination mismatch.

The path in each row is the strongest identifiable project-specific candidate unless otherwise stated. Every square project montage contains embedded branding/interface text. Embedded UI values, stock-like portraits, trust marks and testimonial copy are not approved project outcomes. Standard future preparation means verify fidelity and rights, audit/remove unsupported text only in a separately authorized derivative, test Nova's center-cover crop/overlay, provide truthful alt text, and prepare the existing WebP/AVIF derivative family. No preparation was performed here.

| Project | Related legacy asset path / strongest candidate | Currentness, embedded text/claims and future preparation |
| --- | --- | --- |
| The Moody Brewer | `legacy-assets/portfolio/moody-brewer-thumbnail.png` | Exact current public export, 1024×1024. Embedded +52% traffic / +70 new customers are unsupported; fine screen text is soft/distorted. **Not production-safe as-is**; clean verified capture/source or separately approved claim-free derivative needed. |
| MetricForge | `legacy-assets/portfolio/metric-forge-thumbnail.png` | Exact public export, 1024×1024. Usage, revenue and performance figures unverified; labels overlap. Verify real UI/features; clean source and crop/type review needed. |
| GlassDash | `legacy-assets/portfolio/glass-dash-thumbnail.png` | Exact public export, 1024×1024; visible Glass Admin naming aligns with destination. Embedded dashboard metrics and distorted small type; confirm approved naming, data and clean UI source. |
| Cloud Keep | `legacy-assets/portfolio/cloud-keep-thumbnail.png` | Exact public export, 1024×1024. Embedded 99.9%, 2M+ and 10,000+ figures unverified; crowded type. Verify actual product scope; remove unsupported claims in a later approved source/derivative. |
| Jobly | `legacy-assets/portfolio/jobly-thumbnail.png` | Exact public export, 1024×1024; job-portal presentation aligns broadly. Embedded page text/photo branding is not proof of React, authentication or filtering. Verify rights/functionality; standard crop and derivative preparation required. |
| Birdie Bay | `legacy-assets/portfolio/birdie-bay-thumbnail.png` | Exact public export, 1024×1024; golf presentation matches destination, conflicts with portfolio shop description. Embedded figures unverified, low-contrast overlapping text. Confirm correct project story and obtain readable faithful source. |
| Frost | `legacy-assets/portfolio/frost-thumbnail.png` | Exact public export, 1024×1024; JackFrost Coaching agrees with current destination name. Embedded case-study/site text is dense and overlaps. Exact source-record correspondence and faithful capture require confirmation. |
| Northline Strength | `legacy-assets/portfolio/northline-thumbnail.png` | Exact public export, 1024×1024; Strength Club identity agrees. Embedded malformed schedules/coach labels and lorem-ipsum-like copy need review. Obtain accurate current UI source; do not merge other Northline brands. |
| Sonoran Comfort Systems | `legacy-assets/portfolio/sonoran-comfort-thumbnail.png` | Exact public export, 1024×1024; HVAC identity agrees. Embedded testimonial, TRANE/BBB/LENNOX marks and 555 phone are unverified. Confirm concept/client status and rights/trust claims; clean presentation required. |
| Northline Plumbing | `legacy-assets/portfolio/plumbing-thumbnail.png`; supporting `legacy-assets/portfolio/northline-plumbing-thumbnail.jpg` | Montage is exact public export, 1024×1024. 4.9-star/response/service claims are mock or unverified. Supporting 1920×900 plumber photograph is not a founder image; provenance/license unresolved. Preserve fictional-concept context; verify crop and remove misleading outcome implications later. |
| Solartec | `legacy-assets/portfolio/solar-thumbnail.png` | Exact public export, 1254×1254, but Solartec naming conflicts with current Sunward Grid Solar destination. Embedded 25+ years, 10,000+ installations and analytics unverified. Name/version decision and faithful new source are needed before use. |
| Harbor & Steel | `legacy-assets/portfolio/harbor-steel-thumbnail.png` | Exact public export, 1024×1024; barber identity agrees. Embedded prices/testimonial/portraits/555 phone and malformed footer text require confirmation. Verify concept/client status, rights and source fidelity. |
| Mula | `legacy-assets/portfolio/mula-thumbnail.png` | Exact public export, 1024×1024; current site calls itself Mula Rebuild, precise screen-version fidelity unconfirmed. Embedded dashboard values are illustrative, labels overlap. Verify current local-first UI and use a cleaner accurate source. |
| ScholarLink | `legacy-assets/portfolio/scholar-link-thumbnail.png` | Exact public export, 1024×1024; tutoring identity agrees. Dense text, embedded contact details and claim of real-site imagery do not establish authenticity or rights. Verify source fidelity; prepare readable crop/derivatives. |
| TimeDock | No identifiable local asset | Cannot assess currentness or embedded claims; authentic project-specific imagery must be supplied later. |
| StillPoint | No identifiable local asset | Cannot assess currentness or embedded claims; faith thumbnails cannot stand in for an application screenshot. |
| Euclid Financial Services | No identifiable local asset | No confirmed project screenshot or brand asset mapped; unrelated finance boards are not substitutes. |
| HealthSync AI | `legacy-assets/portfolio/health-sync-thumbnail.png` | 1024×1024 logo/title graphic, not a UI screenshot; no live item to compare. Embedded HealthSync AI branding does not prove an implemented app. Review provenance and relevance before any future use. |

### Creative Work source mapping

Main library: `legacy-assets/Graphic Design/`, including `Brand Kits/`, `Thumbnails/`, product-ad folders and `Social Media Promo/`. Map those as creative source material rather than invented standalone client projects.

| Candidate | Role / currentness | Embedded text and preparation |
| --- | --- | --- |
| `legacy-assets/Graphic Design/Brand Kits/Finance/Ledger-and-Loom.png` | **Strongest existing representative shortlist**, 1536×1024; present in current Brand Kits gallery, exact live/local byte match. Nine-panel system for one identity. | Branding, palette/type, print and digital applications; small lettering needs review. Authorship/rights/classification unresolved. Narrow desktop crop can remove panels; prepare truthful sample-focused crop/alt and derivatives in a future task. |
| `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Copper-Fork.png` | Existing 1536×1024 identity montage alternative, per inventory. It represents one identity, not multiple projects; not separately byte-compared here. | Embedded branding/application text; similar hospitality treatment may echo Moody's card. Confirm provenance, crop and readability. |
| `legacy-assets/Graphic Design/Energy Drinks/aura-active.png` | Existing 1254×1254 advertisement alternative; the current gallery data lists Aura Active. Not separately byte-compared here. | Product/campaign text and CTA are concept artwork, not a proven delivered campaign. Confirm rights and square-to-card crop. |

No existing cross-project collage/contact sheet was identified in the inventory. A future composed cover may be useful if the card must communicate branding, advertising and social work together. No asset was copied, edited, resized, converted or generated.

## 7. Approved featured-project readiness

### The Moody Brewer

| Field | Readiness |
| --- | --- |
| Classification | **Verified Client Work**, confirmed by the approved source; only verified client project in that source. |
| Card title/category | **The Moody Brewer / Client Website**, approved Featured Project 1. |
| Current live URL | **https://themoodybrewer.net**, sourced from portfolio card and spotlight; Live, HTTP 200. |
| Strongest source candidate | `legacy-assets/portfolio/moody-brewer-thumbnail.png`, 1024×1024; exact current public export. |
| Production-safe image? | **No, as-is.** Unsupported baked-in +52% website traffic / +70 new customers; fine UI/domain/contact lettering and delivered-site fidelity need confirmation. |
| Image and alt | Both unresolved for Nova production use. No clean screenshot/alternate project-specific source found in the inventory. |
| Card data ready except image/alt? | **Yes for the current four-field contract:** approved title and stored category are known; image/alt remain blockers. Current live URL is now documented here, but Nova cannot render per-item URLs. Exact technologies/delivery scope/dates remain unconfirmed. |

The supplied 30-day Sep 7–Oct 7 measurements of 2,623 pageviews, 1,458 unique visitors and 3 GB bandwidth remain source-record evidence with screenshot/year/provider unresolved. They do not validate the thumbnail's growth/customer claims, causation or conversion outcomes. No analytics screenshot was found locally. Neither the client site nor a portfolio mockup supplies an approved testimonial about Anthony's work.

### Creative Work

| Field | Readiness |
| --- | --- |
| Classification | **Creative Portfolio / Body of Work**, approved aggregate. |
| Card title/category | **Creative Work / Branding, Ads & Marketing**, approved Featured Project 2. |
| Current public collection URL | **https://volatile-solutions.net/graphic-design**, internal, Live, HTTP 200. |
| Strongest source candidate | `legacy-assets/Graphic Design/Brand Kits/Finance/Ledger-and-Loom.png`, 1536×1024; current public gallery item and exact byte match. |
| Does one representative asset exist? | **Yes, as source material:** one identity-board montage. It communicates a system but does not represent multiple projects or the full collection by itself. |
| Production readiness | Conditional on provenance/rights, accurate framing and alt, small-text/crop review and derivative preparation. No final image approved. |
| Future composed/collage asset | May still be needed to show cross-project branding/ad/social breadth. None exists in the mapped inventory; none created here. |

Nova's narrower second desktop card makes a multi-panel montage particularly crop-sensitive. Existing mobile ratio, desktop cover crop, title overlay and hover behavior remain authoritative. Selection here is advisory and does not migrate either card.

## 8. Useful information Nova cannot currently render

Cross-checked [ProjectsBlock.astro](src/components/registry/portfolio/ProjectsBlock.astro) and migration-map Section 4. The active item contract is only `category`, `title`, `image`, `alt`. Category is stored but not visibly rendered. Every card and the introduction share section `linkHref`, currently `#realizacje`; the block does not consume per-project destinations.

| Information preserved for later consideration | Current evidence / limitation |
| --- | --- |
| Project descriptions | Available as public portfolio summaries, recorded here with discrepancies. No item-description output. |
| Technologies | Public badges/attributions exist but can conflict: Jobly React versus visible Bootstrap attribution, ScholarLink Webflow Sync, Mula Custom API. Verified project stack is not established by these labels. No technology-list output. |
| Per-project live/repository URLs | Live destinations recovered here; repository links not established by this audit. No individual-URL field or routing behavior. |
| Deliverables / case-study detail | Portfolio badges and marketing context exist; exact verified contribution, dates and delivery evidence remain incomplete. No case-study renderer, slug or detail route. |
| Project status | Public access observations recorded here; deployment availability differs from approved completion/release status. No status output. |
| Metrics / outcomes | Public/mock numbers and supplied Moody traffic measurements must remain separate. No project-metric output and no invented outcomes. |
| Linked galleries | Creative collection and image-lightbox behavior exist on the old site; the active Nova card has no per-item gallery trigger or gallery contract. |

Adding unsupported JSON keys or replacing the shared section URL would not safely create independent project navigation. No architecture, rendering, content data or routes were changed.

## 9. Keep / Review / Archive recommendations

Recommendations only. These are not final inclusion decisions, classification upgrades, removal instructions or authorization to alter the live site. Every current portfolio project, the collection and additional reconciled records is accounted for.

### Keep

| Record | One-line reason |
| --- | --- |
| The Moody Brewer | Approved verified client feature with a working production URL; retain the record and resolve its image/claim blockers. |
| Creative Work | Approved aggregate feature with a working collection URL and substantial source material; curate truthful representation and rights. |

### Review

| Record | One-line reason |
| --- | --- |
| MetricForge | Useful analytics/product presentation, but working-system scope, scale and classification remain unresolved. |
| GlassDash | Useful dashboard preview; confirm Glass Admin naming, data/demo status and contribution. |
| Cloud Keep | Potential SaaS/interface evidence, but full-stack, security and compliance claims need factual resolution. |
| Jobly | Accessible job-portal preview; React/auth claims, template contribution and project classification need review. |
| Birdie Bay | Resolve golf-versus-e-commerce description before deciding how this work fits the new portfolio. |
| Frost | Coaching presentation may be useful; confirm JackFrost identity, contribution, rights and classification. |
| Northline Strength | Strongly relevant local-business presentation, but club authenticity, scope and mock text need review. |
| Sonoran Comfort Systems | Useful service-site presentation; client/concept status, testimonials and trust marks remain unverified. |
| Northline Plumbing | Clearly described fictional-brand design can be useful when truthfully classified and stripped of outcome implications. |
| Solartec | Valid destination remains useful, but Sunward Grid branding conflicts with the current card and legacy mockup. |
| Harbor & Steel | Relevant booking-oriented service presentation; concept/client status and template trust details need confirmation. |
| Mula | Accessible expense-app preview offers software evidence; verify contribution/features and resolve Custom API mismatch. |
| ScholarLink | Tutoring-site presentation may fit selected work, but classification, integration and results claims are unresolved. |
| TimeDock | Approved personal-project context is promising, but no public release link or identifiable screenshot is established. |
| StillPoint | Preserve personal/independent context pending evidence of implementation, category and portfolio relevance. |
| Euclid Financial Services | Relationship, completion and permission must be clarified before public business/client framing. |
| HealthSync AI, asset-only | A logo alone is insufficient software evidence; ask for a real project record before considering inclusion. |

### Archive

**No project is recommended for automatic archival in this pass.** Every currently listed portfolio destination is live, and unresolved classification is a reason to review rather than presume obsolescence. The two broken homepage aliases should be retained as historical discrepancy evidence, not reused as current project destinations. Any future removal/replacement requires explicit user direction.

## 10. Claims and classification risks

The [homepage](https://volatile-solutions.net/) and [portfolio](https://volatile-solutions.net/portfolio) contain promotional framing that exceeds the stricter approved factual source. Keep this as a risk record; no copy was rewritten.

| Risk | Observed evidence and migration boundary |
| --- | --- |
| Launch/client count | Homepage states **30+ projects launched** and frames work as delivery for real businesses. The factual source explicitly leaves project/client totals unconfirmed. Fourteen public cards and 120 configured creative entries are not verified launch or client counts. |
| Universal client framing | Only Moody Brewer is approved Verified Client Work. Strong business presentation, deployed URLs, polished designs and public deliverable badges do not classify the remaining records as clients. |
| Moody identity/link | Homepage describes a brewery/beer/event context and links a 404 destination; portfolio and approved source establish a coffee-shop client. Preserve the valid portfolio URL and report the inconsistent wording. |
| Moody outcomes | Current public thumbnail embeds +52% traffic / +70 new customers without source evidence. Approved visitor/pageview measurements do not establish growth, bookings, conversions or causation. |
| Product usage/performance | MetricForge presents team counts, revenue/dashboard examples and product/service performance language; Glass Admin presents accounts/revenue/transactions. Treat such values as unverified interface/marketing content, not Volatile outcomes. |
| Storage security/scale | CloudKeep advertises compliance including SOC 2/GDPR/HIPAA, encryption and user/team scale. Neither public page access nor the montage verifies those claims, implemented storage or Full-Stack Build. |
| Claimed technology/delivery | Jobly React Build/Auth Flow, ScholarLink Webflow Sync and Mula Custom API require confirmation. Mula's current page expressly describes a backend-free localStorage app. No stack or integration is approved through a badge. |
| Business trust and impact | Plumbing identifies a fictional business while showing satisfaction, annual-service and response targets; solar, HVAC and barber pages/exports contain experience counts, installations, testimonials or trust marks. Do not turn mock business content into verified client outcomes. |
| Name/version mismatch | Solartec card/export versus Sunward Grid Solar destination, Birdie Bay shop description versus golf destination, GlassDash versus Glass Admin, and Frost versus JackFrost require explicit reconciliation. Live status does not settle name/version authority. |
| Creative claims | Campaign concept packaging, thumbnail hooks, promo dates, brand boards and named businesses do not prove client engagement, sales/results or commercial use rights. Preserve aggregate classification and confirm item provenance. |
| Third-party testimonials | Reviews shown on client/demo sites concern those businesses or example services; they are not approved testimonials about Anthony/Volatile Solutions. No endorsement is transferred. |

Performance, business impact, user counts, client counts and attribution remain subject to the factual source. Normal entry-page loading cannot validate these claims.

## 11. Current links to preserve for future migration

Preserve the **complete valid URL table in Section 5**, unless explicitly replaced or removed by the user. In particular:

- **Client destination:** https://themoodybrewer.net.
- **Creative collection:** https://volatile-solutions.net/graphic-design; its existing advertisement collection fragment is already used by the homepage.
- **Working software/product previews:** https://metric-forge.netlify.app/, https://glass-dash-admin.netlify.app/, https://cloud-keep.netlify.app/, https://jobly-jobsearch.netlify.app/, https://mula-expense-tracker-v2.netlify.app/.
- **Other valid current portfolio previews:** Birdie Bay, Frost, Northline Strength, Sonoran Comfort Systems, Northline Plumbing, Solartec/Sunward Grid Solar, Harbor & Steel and ScholarLink, with their exact destinations in Section 5 and review conditions intact.

These links preserve public continuity without asserting functional backend services or final project inclusion. Use the working portfolio links rather than the two known broken homepage aliases. No decisions about how Nova will render individual links have been made.

## 12. Future migration authority and rules

- **volatile-solutions.net is the authoritative current public source for existing project URLs and current public descriptions.** Recheck links and document conflicts; never derive a domain from a filename.
- **legacy-assets/ is the authoritative local source-material library for imagery/assets.** Publicly used exports can still contain unsupported claims, poor lettering or outdated site identities.
- **VOLATILE_CONTENT_SOURCE.md is authoritative for classifications and approved business facts.** This reference fills current-link evidence without editing that source or overriding unresolved facts.
- Future migration must not infer client status from public portfolio language, deployment availability, business-like names, creative-item counts or filenames.
- Existing live links should be preserved unless the user explicitly replaces or removes them. Missing public listings do not authorize guessed URLs.
- Keep personal software, concepts, experiments, verified client work and the creative aggregate distinct. Review recommendations do not finalize categories or inclusion.
- Preserve Nova's two-card architecture and existing visual/interaction contract. Richer records or individual navigation require a separate explicit task.
- No source assets, content records, localization, configuration, SEO, navigation or page composition are changed by this audit.

## 13. Validation and change isolation

The workspace is not a Git repository. Before any write, SHA-256 hashes and paths were recorded for **899 preexisting repository files**, including **161 legacy-library files** (artwork, guide and metadata). A comparison immediately before creating this document found zero changed, missing or added files.

Validation for this task:

- All **14 distinct public portfolio cards** extracted and their exact published destination URLs checked independently: **14 Live / HTTP 200**, no HTTP redirects or entry-page authentication requirement observed.
- Three source pages checked successfully; homepage alternate project URLs checked: **two HTTP 404s**, preserved as discrepancies.
- Every destination is sourced from actual live page links. Missing TimeDock, StillPoint, Euclid and HealthSync records have no invented links.
- Classifications reconciled against the approved factual source; no record upgraded to Verified Client Work. All 13 requested known records accounted for.
- Creative data and renderer inspected; four groups, 120 configured entries and image-lightbox behavior distinguished from individual project links.
- All 14 public project thumbnails plus the selected creative-board sample compared against local source bytes: **15/15 identical SHA-256 hashes**, HTTP 200. Currentness is limited to public exports, not endorsement of their claims.
- Post-write path/hash comparison verified **all 899 preexisting files unchanged**, including every legacy file and production asset. No deleted paths.
- **Only LEGACY_PROJECT_LINKS.md is new.** No project migration, image preparation, card-data changes, runtime changes or other migration step started.

Browser-rendered visual quality and application functionality remain outside this read-only reference pass. Future status checks should use the actual current destinations and preserve the evidentiary limits above.

