# Legacy Asset Inventory — Volatile Solutions / Anthony Volatile

Audit date: October 7, 2026.

**`legacy-assets/` is SOURCE MATERIAL ONLY.** This is an inventory and suitability audit. Candidate rankings are advisory, not final asset selection or permission to migrate. No originals were changed; no asset was copied to `public/`; no collage, retouch, conversion, compression or production derivative was created.

## Scope, evidence and method

Read and followed `AGENTS.md`, `CONTENT_MIGRATION_MAP.md` and `VOLATILE_CONTENT_SOURCE.md`. Nova's active image presentation remains authoritative. B2 approves The Moody Brewer / Client Website and Creative Work / Branding, Ads & Marketing; B5 approves one founder with three capability concepts, not additional teammates. Asset availability does not resolve permissions, authorship, client relationships, delivered features, testimonials or outcomes.

Recursively enumerated every file, including hidden files. Measured byte sizes and raster dimensions using Pillow, fully decoded all 145 images and visually inspected each existing image. Checked mode/alpha, EXIF orientation and embedded ICC-profile presence. Compared SHA-256 file hashes, decoded RGBA pixel hashes and a 64-bit difference-hash scan (Hamming distance ≤6), then noted visually related variants. The perceptual scan is a heuristic, not proof that no loosely similar compositions exist.

Read-only inspection outside the legacy library was limited to the required governing documents and Nova slot/SmartImage/logo consumers for comparison. Whole-repository file reads for hashes were used solely to verify isolation. No website build, dependency install or generation script was run. The legacy `brandkit_SKILL.md` was inspected as source material, not invoked as an image-generation skill.

Quality and crop judgments below come from source inspection and active code, not an implemented responsive preview. Exact mobile/desktop crop acceptance still needs later validation.

## Inventory summary and folder structure

- **161 files, 272,842,024 bytes (approximately 260.20 MiB).**
- **145 images:** 143 PNG and 2 JPEG.
- **16 non-images:** 15 `.DS_Store` files and one Markdown process/reference file.
- **122 creative images:** 48 brand boards, 29 square ads/social graphics, 3 LinkedIn banners and 42 thumbnails.
- **16 portfolio images**, **4 founder photographs** and **3 Volatile Solutions branding PNGs**.
- No SVG, ICO, WebP, AVIF, PDF, video, RAW camera file, layered PSD/AI or other editable artwork is present. PNG/JPEG files are existing flattened exports or photographic rasters, not established original masters.
- Standalone Volatile Solutions mark/wordmark PNGs were added during the audit and incorporated below; all need export-quality preparation. No dedicated favicon bundle or ready-made Volatile Solutions OG image was found.
- No Moody Brewer analytics screenshot was found. No identifiable TimeDock or StillPoint image was found.

**Library change during audit:** after the initial 155-file library scan, `legacy-assets/Logos/` appeared with three logo PNGs and `.DS_Store`; `legacy-assets/.DS_Store` and repository-root `.DS_Store` also appeared. These six files were not created by this audit's tools. The initial five new legacy entries, plus the later fourth founder photo, are included in the final 161-file inventory; the root metadata file is outside the library and tracked only for isolation. A fourth founder photo, `legacy-assets/aboutme/about-me-photo4.png`, appeared at the next final check and was likewise inspected and hashed. The seven externally appearing files comprise six legacy entries and root metadata. New files received a separate hash baseline on discovery. No existing baseline file changed.

The tree below shows image counts; hidden metadata and the Markdown reference are listed individually in the file inventory.

```text
legacy-assets/
├── .DS_Store                       Finder metadata
├── Logos/                          3 PNGs + 1 .DS_Store
├── aboutme/                         4 photos + 1 .DS_Store
├── portfolio/                      16 images + 1 .DS_Store
└── Graphic Design/                 122 images + 11 .DS_Store + brandkit_SKILL.md
    ├── Brand Kits/                 48 boards
    │   ├── Auto/                    6
    │   ├── Finance/                 6
    │   ├── Fitness/                 6
    │   ├── Medical/                 6
    │   ├── Real Estate/             6
    │   ├── Restaraunt and Food/     6
    │   ├── SaaS/                    6
    │   └── Travel and Leisure/      6
    ├── Energy Drinks/              3
    ├── Fitness/                    3
    ├── Food-and-Beverage/           3
    ├── Supplements/                3
    ├── Tech/                       3
    ├── Social Media Promo/        17
    │   ├── Event Graphics/         4
    │   ├── LinkedIn Banners/       3
    │   ├── Promo Flyers/           1
    │   ├── Service Graphics/       4
    │   └── Social Posts/           5
    └── Thumbnails/                42
        ├── ai-tools/               6
        ├── faith-god/             15
        ├── finance-investing/      6
        ├── fitness/                6
        ├── food-restaurant/        6
        └── real-estate/            3
```

Original names, spaces, capitalization and spelling are retained, including `Restaraunt and Food`, `about-me-photo1.PNG`, `Iron-Valve.png`, `kind-red-desk-equippment.png`, `revnue-admin.png` and the dated ChatGPT filename. Do not rename originals during this audit.

## Asset classifications

### Branding

The 48 `Graphic Design/Brand Kits/` images contain other identities' logos, wordmarks, icon examples, palettes and mockups. They are creative-portfolio material, **not Volatile Solutions branding replacements**. Their vector-looking marks are baked into opaque raster boards and cannot scale indefinitely as SVG artwork.

The desk portrait `legacy-assets/aboutme/about-me-photo3.png` shows a small historical Volatile Solutions mark/wordmark on the monitor and a mark on clothing. Those photographed marks differ visually from the newly added hexagonal VS exports; confirm which identity version is current. The monitor also shows older website messaging. Do not extract or trace photographed marks as final branding.

Three standalone transparent PNG exports now exist in `legacy-assets/Logos/`:

| Candidate | Type / dimensions / transparency | Scaling and quality | Current identity assessment |
| --- | --- | --- | --- |
| `legacy-assets/Logos/logo-with-text.png` | PNG / RGBA, 1672×941 (1.777:1); alpha 0–255 | Horizontal hexagonal VS + VOLATILE / SOLUTIONS wordmark, but large canvas padding; main alpha≥128 bounds 81,316–1610,611 (~1529×295). Visible stray colored pixels and partial-alpha edges require preparation. Raster only, not vector scalability. | Visible business name matches approved identity. Style/version approval remains [NEEDS CONFIRMATION]; not automatically a final logo. |
| `legacy-assets/Logos/logo-light.png` | PNG / RGBA, 1254×1254 (1:1); alpha 0–255 | Copper hexagonal VS with dark letter portions, intended light-background candidate. Speckled stray pixels and very broad partial-opacity regions; raster detail must survive actual size. | Mark plausibly matches newly supplied wordmark family; confirm current approved variant. |
| `legacy-assets/Logos/logo-dark.png` | PNG / RGBA, 1254×1254 (1:1); alpha 0–255 | Copper hexagonal VS with light letter portions, intended dark-background candidate. Visible holes/distressing and colored residue are stronger; confirm whether intentional. | Same family candidate; cannot assume final approval or clean small-size readability. |

All three decode successfully and have no embedded ICC profile. Alpha metadata shows only 3,284–4,262 fully opaque pixels per file, with 79,972–339,544 partial-alpha pixels; transparent backgrounds are real, but source opacity/edge quality is a material review issue. These values do not establish how the graphics were authored. Background contrast was assessed from existing previews/metadata, not by producing composited exports.

**Strongest branding source candidate:** logo-with-text for the wordmark; logo-light/logo-dark for marks on their intended surfaces. **Recommendation status: Needs preparation** for each. A future task should obtain a cleaner original/vector if available, confirm version and inspect transparency, residue, padding and contrast before creating any production copies. No logo was repaired or extracted.

The three LinkedIn banners belong to North Ledger Consulting, Hale Street Realty and Westmere Talent. No SVG/ICO or dedicated favicon/social-preview export is present.

### Anthony / Founder

The four `aboutme/` photos are founder-photo candidates in this audit. Their assignment to Anthony follows the supplied library context and approved main-image subject; do not identify any person in creative thumbnails, mock websites, résumés or stock-like images as Anthony or a teammate.

| File | Visual assessment | Resolution / flexibility |
| --- | --- | --- |
| `legacy-assets/aboutme/about-me-photo1.PNG` | Professional suit/tie headshot, neutral gray backdrop, clear face; more formal than Nova's working-photo treatment. Tight headroom and shoulders limit aggressive crop. | 848×876, 0.968:1; adequate modest display, weakest high-density source. Embedded ICC named/described “Display”; confirm intended color space later. |
| `legacy-assets/aboutme/about-me-photo2.jpg` | Authentic-looking café work photo with phone/tripod drink setup, light warm interior and approachable expression. Background is busy; face is right of center. Specific venue/client relationship is not inferred. | 1125×1426, 0.789:1; closest to hero's nominal 4:5 source. Better vertical than landscape flexibility. |
| `legacy-assets/aboutme/about-me-photo3.png` | Hands-on desk context with visible code/laptop, notebook and older Volatile Solutions website on monitor. Warm desk/lamp accents; dark shadows and green backdrop differ from Nova's lighter editorial photograph. | 1072×1080, 0.993:1; useful near-square founder source; landscape crop can remove desk/code/context. |
| `legacy-assets/aboutme/about-me-photo4.png` | Warm styled suit/laptop portrait with centered face, room/plants and softer background; more light/editorial than photo3. Supplied as founder material; capture/editing provenance remains [NEEDS CONFIRMATION]. | 1254×1254, 1.000:1; highest-width founder source, usable crop headroom; landscape can remove laptop/hand/context. Opaque RGB, no embedded ICC. |

A promising distinct pairing is photo2 for hero and the later-added photo4 for founder/about, subject to crop acceptance and provenance confirmation. This is a shortlist, not a final choice; there is no assumption the same image should appear twice. Photo3 retains stronger visible code/desk context; photo1 remains an alternative if formal headshot intent takes priority. No photo was retouched.

### The Moody Brewer

Only `legacy-assets/portfolio/moody-brewer-thumbnail.png` is specifically identifiable as a Moody Brewer project image: **1024×1024 PNG, 1:1, 1,881,248 bytes**. It presents a laptop/site mockup and drinks in a warm brown/copper scene, with promotional headings and a bottom outcome/contact strip.

It is the strongest available **project-specific source**, because no clean site screenshot, separate client logo or alternate mockup exists in this library. The central screen suggests the project, but fine UI lettering appears distorted/soft; visual fidelity to the real delivered production site is **[NEEDS CONFIRMATION]**. It is a composed presentation, not a verified unaltered browser capture.

**Publication blocker:** the pixels embed **“+52% Website Traffic”** and **“+70 New Customers Booked”**. Both are **[EXISTING CLAIM — NEEDS CONFIRMATION]** and unsupported by the factual source. Its baked-in domain/social/contact lettering also requires confirmation; do not treat it as approval of the live URL. Do not publish this export as-is or rely on one responsive CSS crop to hide the claims across all viewports.

Recommended status: **Needs preparation**. A future approved task could use a verified clean source/capture or a separately approved derivative focused on the central project imagery with every unverified claim excluded. No crop, removal, recreation or new capture was performed here. Cropping may leave only a relatively small/soft screen region; obtaining an authentic higher-resolution capture could be preferable.

**Supporting analytics evidence:** no analytics screenshot was found in any of the 145 visually inspected images. `VOLATILE_CONTENT_SOURCE.md` records user-supplied 30-day Sep 7–Oct 7 measurements of 2,623 pageviews, 1,458 unique visitors and 3 GB bandwidth, with original screenshot/year/provider unresolved. Those facts are recorded there, not verified by an asset found here. The promotional thumbnail is not that analytics evidence. Do not use an analytics screenshot as the primary project image if it is supplied later.

### Creative Work

Creative Work is a curated collection, not a single paying-client project. The library offers many individual ads and existing **single-identity** brand-board montages, but no found image presents a cross-project collection of branding, ads, marketing and social pieces together.

Evaluate three approaches:

| Approach | Existing evidence | Suitability / limitation |
| --- | --- | --- |
| One standout creative piece | `legacy-assets/Graphic Design/Energy Drinks/aura-active.png` | Clear cream/gold product ad, warm editorial fit; only one sample and square text/CTA crop risk. |
| Existing identity montage | `legacy-assets/Graphic Design/Brand Kits/Finance/Ledger-and-Loom.png` | 3×3 board combines mark, palette/type, digital application and print mockups. Strong breadth within one identity; still not multiple clients/projects. |
| Existing identity montage alternative | `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Copper-Fork.png` | Warm copper/cream system with logo, website, packaging and imagery; matches Nova's tone, but represents one identity only and could visually echo the coffeehouse card too closely. |
| Existing cross-project collage/contact sheet | None found | A future composed asset may be necessary if the card must communicate multiple distinct pieces. No collage was generated. |

Authorship, AI/tool contribution, individual-piece client/concept classification and public usage permissions remain **[NEEDS CONFIRMATION]**. The generation-style filename and legacy brand-kit generation guide are provenance clues, not proof that every image was AI-generated or manually created. Describe work truthfully after confirmation. None of the pictured businesses becomes a verified client through this inventory.

### Software / Application Projects

| Source record / visible identity | Existing asset | Later-use boundary |
| --- | --- | --- |
| MetricForge | `legacy-assets/portfolio/metric-forge-thumbnail.png` | Analytics-site/interface montage; no proof of implemented replay/cohorts or real usage metrics. |
| GlassDash / visible Glass Admin | `legacy-assets/portfolio/glass-dash-thumbnail.png` | Confirm name correspondence; dashboard/login montage, not implementation evidence. |
| Cloud Keep / visible CloudKeep | `legacy-assets/portfolio/cloud-keep-thumbnail.png` | Storage-site presentation; security, uptime and usage claims unverified. |
| Jobly | `legacy-assets/portfolio/jobly-thumbnail.png` | Job-portal hero presentation, not proof of working authentication/filtering. |
| Mula | `legacy-assets/portfolio/mula-thumbnail.png` | Expense-interface montage; figures illustrative/unverified, type overlaps. |
| TimeDock | No identifiable asset found | No substitution with similarly named SaaS boards. |
| StillPoint | No identifiable asset found | Faith thumbnails do not establish a StillPoint application asset. |
| ScholarLink | `legacy-assets/portfolio/scholar-link-thumbnail.png` | Tutoring website presentation; classification remains unconfirmed. |
| Other application-themed graphics | HealthSync AI portfolio logo; FLOWSTATE AI, REVNUE and VAULTIQ ads; SaaS brand boards | These are identifiable graphics, not automatically new completed software projects. |

Other site presentations include Birdie Bay, JackFrost Coaching, Northline Strength Club, Northline Plumbing, Harbor & Steel, Solartec and Sonoran Comfort Systems. Names, mock metrics, screenshots, stock-like photos and logos do not establish client status. Northline Realty brand board is a third distinct Northline identity; do not merge the records.

### Miscellaneous

The plumber JPEG is a potential supporting photograph for its own unconfirmed project only, never a founder/team image. The 15 Finder metadata files inside the legacy library have no content role. `Graphic Design/brandkit_SKILL.md` is a legacy process reference, not artwork, production code or authorization to generate new assets.

## Nova slot requirements and candidate suitability

Requirements are based on migration-map Sections 4, 5, 7 and 12, cross-checked against `NovaHeroResponsiveBlock.astro`, `ProjectsBlock.astro`, `TeamBlock.astro`, `SmartImage.astro` and `Logo.astro`.

### Shared SmartImage / derivative expectations

Hero, both project cards and founder main photo use SmartImage. Their current public families live in `public/assets/images/t001-nova/`. For optimized public image paths, SmartImage discovers **existing** WebP/AVIF derivatives on disk; it does not create missing derivatives just because a JSON path changes. AVIF is a picture source; WebP supplies fallback/srcset. Supported widths are 220, 480, 640, 800, 1080, 1280, 1600 and 1920. **800 has no suffix**; others use `@width`. Explicit `@220.webp` avatar references bypass this discovery.

All legacy raster candidates lack Nova derivative families. Every approved SmartImage candidate would need coordinated future derivative preparation using a suitable source, without upscaling to invent detail. Widths above a source's native width are not automatically appropriate. Preserve coherent fallback/AVIF/WebP/width content and actual `sizes` behavior; the inspected hero/projects/team calls do not provide custom sizes, so SmartImage uses its display-width fallback. No pipeline command was run.

### Target slot: Hero image

**Nova presentation requirements:** nominal source 4:5 (existing 800×1000), width/height attributes 900×1125. Actual box ratio changes with viewport; `object-cover` and the existing blob clip crop all candidates. Mobile stacks beneath text, image wrapper height `clamp(22rem,92vw,31rem)`; md height `clamp(30rem,62vw,38rem)`; lg `clamp(36rem,45vw,48rem)`. Image is centered below md and `center 35%` from md; blob clipping applies to the figure on mobile and desktop. SmartImage, eager loading, WebP/AVIF family required.

| Candidate | Dimensions / ratio | Why it fits | Crop risk / source quality | Future derivatives |
| --- | --- | --- | --- | --- |
| `legacy-assets/aboutme/about-me-photo2.jpg` | 1125×1426; 0.789:1 (~4:5) | Strongest work-oriented vertical founder option, warm natural setting. | Face sits to right; blob edge may clip hair/shoulder, left production setup may be lost. Native resolution adequate for ordinary display, limited for very large/high-density box. | Yes; approved crop and coherent WebP/AVIF widths within available resolution. |
| `legacy-assets/aboutme/about-me-photo3.png` | 1072×1080; 0.993:1 | Desk/code/notebook gives multidisciplinary work context. | Square-to-portrait crop loses monitor/notebook; face must survive blob. Dark image may lose fine detail. Native resolution usable at moderate widths. | Yes; no high-resolution detail beyond source. |
| `legacy-assets/aboutme/about-me-photo4.png` | 1254×1254; 1.000:1 | Warm polished suit/laptop portrait; more relaxed editorial framing than photo1. | Square-to-portrait/blob crop may remove laptop/hand and jacket edges; centered face and headroom help. Best founder native width, but capture/editing provenance needs confirmation. | Yes; approved crop and coherent family, no invented detail. |

**Recommendation status: Strong candidate** for photo2, contingent on responsive crop review. Photo3/photo4 are alternatives, not a direction to reuse the founder asset twice.

### Target slot: Main founder/about image

**Nova presentation requirements:** existing source 800×600 (4:3), attributes 1280×900 (~1.422:1). Main figure has no fixed CSS aspect ratio; minimum height 20rem with `object-cover`. It stacks on mobile and sits in one of two equal columns from md. Cropping depends on actual column/figure dimensions. SmartImage, eager loading, coordinated WebP/AVIF derivatives required.

| Candidate | Dimensions / ratio | Why it fits | Crop risk / source quality | Future derivatives |
| --- | --- | --- | --- | --- |
| `legacy-assets/aboutme/about-me-photo4.png` | 1254×1254; 1.000:1 | Strongest warm editorial founder shortlist; formal attire plus laptop, distinct from café hero candidate. | Square-to-landscape can trim laptop and forearm; preserve face/hand, avoid bottom overlay assumptions. Native width sufficient for normal column size; capture/editing provenance remains unresolved. | Yes; approved crop and coherent WebP/AVIF family. |
| `legacy-assets/aboutme/about-me-photo3.png` | 1072×1080; 0.993:1 | Strongest visible code/desk context; differs from shortlisted hero scene. | Landscape treatment can remove notebook/laptop and lower arms. Dark background and older website text need contextual review; enough detail for moderate display, not a 1920px master. | Yes; approve focal crop and derivative family. |
| `legacy-assets/aboutme/about-me-photo1.PNG` | 848×876; 0.968:1 | Strong professional headshot alternative. | Tight crop and lower native width; background simple but shoulders/headroom constrained. Embedded Display ICC requires handling review. | Yes; retain accurate color and avoid unnecessary enlargement. |

**Recommendation status: Strong candidate** for photo4, contingent on provenance and responsive crop review. Photo3 remains **Usable with crop** for stronger hands-on code/desk context; its darker finish is less close to Nova's warm/light photo direction. No retouch or crop performed.

### Target slot: The Moody Brewer featured-project image

**Nova presentation requirements:** ProjectsBlock item 0 uses SmartImage, lazy loading, attributes 1280×800. Mobile single column, 3:2 figure, 2rem gap, center-cover crop. From 48rem, wider `1.38fr` column beside `1fr`, 1.5rem gap; both figures use height `clamp(22rem,34vw,32rem)` and automatic ratio. Desktop ratios vary, so the 1280×800 attributes are not a fixed crop target. Hover scales image 1.02; bottom title/arrow overlay can obscure baked-in text. WebP/AVIF derivatives required.

| Candidate | Dimensions / ratio | Why it fits | Crop risk / source quality | Future derivatives |
| --- | --- | --- | --- | --- |
| `legacy-assets/portfolio/moody-brewer-thumbnail.png` | 1024×1024; 1:1 | Only identifiable project-specific laptop/mockup source; warm styling and large central device. | Square-to-mobile 3:2 loses top/bottom; variable desktop crop can break heading/device. Unverified outcomes are a blocker. 1024px source is modest; cropped screen detail is softer/smaller and requires delivered-site confirmation. | Yes, only after approved clean source/preparation and fidelity review. |

**Recommendation status: Needs preparation.** No publish-ready clean legacy screenshot found; do not substitute the nonexistent analytics screenshot.

### Target slot: Creative Work featured-project image

**Nova presentation requirements:** same SmartImage/card/hover/overlay behavior as Moody Brewer, but item 1 occupies the **narrower 1fr desktop column**. Mobile 3:2; desktop automatic ratio with the same clamped height can produce a tall crop. Small type and multi-panel layouts are especially vulnerable. Lazy loading and coherent WebP/AVIF derivatives required.

| Candidate | Dimensions / ratio | Why it fits | Crop risk / source quality | Future derivatives |
| --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Brand Kits/Finance/Ledger-and-Loom.png` | 1536×1024; 1.500:1 (3:2) | Best existing broad brand-system sample with warm copper/cream, logo, UI, stationery and palette. | Mobile ratio fits; narrow desktop crop removes left/right board panels. Small text is unreadable at card size. Good source resolution, but only one identity, classification/authorship unresolved. | Yes; validate montage crop, meaningful larger forms and fine-label quality. |
| `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Copper-Fork.png` | 1536×1024; 1.500:1 | Existing warm copper montage with identity/website/packaging examples. | Same desktop panel loss; similar subject tone to Moody Brewer could narrow perceived creative range. Fine text not reliable at small size. Good moderate-resolution export. | Yes; crop/overlay acceptance and provenance review. |
| `legacy-assets/Graphic Design/Energy Drinks/aura-active.png` | 1254×1254; 1:1 | Standout simple product ad, lighter editorial palette, large recognizable can. | 3:2 removes top/bottom, may cut headline/CTA; tall desktop crop may lose left copy or right product. Sufficient ordinary card resolution, single sample only. | Yes; approve crop without broken typography. |

**Recommendation status: Usable with crop** for Ledger-and-Loom as a representative single-identity sample, contingent on desktop crop and truthful attribution. If breadth across distinct work is required, **Needs preparation**: a future separately approved composed cover may be necessary. None of these is selected as final.

### Target slot: Logo / wordmark

**Nova presentation requirements:** `company.branding.logoImage` enables the existing raw-img branch; no SmartImage, source/srcset or AVIF/WebP discovery. Navbar compact treatment uses `h-11`, `lg:h-14`, `w-auto`, `object-contain`; default Logo treatment uses `h-10 lg:h-12`. A clean compact horizontal wordmark is useful; a photographic board is unsuitable. Existing image attributes are 512×512, not proof the new artwork must be square. An empty image path retains the current text wordmark.

**Best candidate assets (up to three):**

| Candidate | Dimensions / ratio | Why it fits | Crop / quality risk | Future preparation |
| --- | --- | --- | --- | --- |
| `legacy-assets/Logos/logo-with-text.png` | 1672×941; 1.777:1 canvas, main opaque-ish content ~5.18:1 | Only standalone business-name wordmark; horizontal lettering fits navbar intent. | Raw h-11/h-14 display would shrink the heavily padded canvas and make actual lettering too small. Stray pixels/partial opacity and dark letters require surface review; sufficient native raster width once a clean source is approved, no unlimited scaling. | No SmartImage family. Later approved clean/tightly framed export or better vector master; preserve original. |
| `legacy-assets/Logos/logo-light.png` | 1254×1254; 1:1 | Compact standalone mark with dark letter portions, plausible for Nova's light navbar. | Mark-only omits visible business name in the image branch; padded canvas, residue and partial opacity need review. Identity version unconfirmed. | Clean approved mark export if mark-only intent approved; no AVIF/WebP family required by Logo. |
| `legacy-assets/Logos/logo-dark.png` | 1254×1254; 1:1 | Light letter portions for a dark surface, alternative mark family. | Light portions can vanish on light surfaces; holes/distressing/residue more visible. Not a direct light-navbar choice. | Only approved appropriate-surface export after quality/version confirmation. |

**Recommendation status: Needs preparation.** Standalone sources now exist; do not publish these current exports automatically. No cleanup, bounding-box crop or format conversion performed.

### Target slot: Favicon / icon

**Nova presentation requirements:** small square browser-tab icon, no page crop, no SmartImage; current configured SVG and separate PNG/ICO/apple-touch fallback assets. Need recognizable small-size identity and coordinated future format bundle. No mobile/desktop body-image treatment or WebP/AVIF family.

**Best candidate assets:** `legacy-assets/Logos/logo-light.png` and `legacy-assets/Logos/logo-dark.png`, each PNG RGBA, 1254×1254, 1:1. These are genuine standalone mark candidates, preferable to photographed or unrelated marks. Native resolution is ample for favicon downsampling, but thin details, holes, colored residue and partial opacity must be checked at 16/32px on intended light/dark browser surfaces. Circular/square favicon framing and padding need a later approved review; a simple mark is preferable to the full wordmark.

**Recommendation status: Needs preparation.** No dedicated favicon/ICO/SVG/touch bundle exists. A later approved task can prepare a clean approved mark in appropriate formats; no SmartImage/AVIF/WebP derivatives are required by the favicon slot. No icon was created or converted.

### Target slot: Open Graph / social-preview image

**Nova presentation requirements:** approximately **1200×630 (1.905:1)**, single static preview, no SmartImage/derivatives, rendered by external social clients with their own crop behavior. Migration map records Layout's 1200/630 metadata constants and schema's fixed `/og-image.png`; future asset naming must coordinate these existing contracts. This has no local mobile/desktop img layout.

**Best candidate assets:** none suitable as a complete Volatile Solutions preview. **Recommendation status: No suitable asset found.** The new 1672×941 logo-with-text PNG has a compatible landscape canvas but is transparent, heavily padded, not a complete preview composition and has export artifacts; it is branding source only, not an OG-ready asset. The three 2508×627 LinkedIn banners are 4:1 and carry unrelated brands; cropping to 1.905:1 would retain only ~47.6% of width and damage their copy/layout. The 1672×941 thumbnails are close in ratio but have topic headlines/other identities/unverified people, not the approved site identity. Photos are portrait/square and uncomposed for OG. No 1200×630 image was found. A future approved branded composition or missing legacy export may be necessary; none generated.

### Target slots: Development, Design and Business / Strategy capability visuals

**Shared Nova presentation requirements:** TeamBlock renders three overlapping **raw img** circles, 40×40px mobile and 48×48px from sm, square 1:1 cover crop, border and negative spacing. Existing explicit `@220.webp` files are referenced directly: **no SmartImage, AVIF selection or srcset**. Current markup has editable group aria-label and image alt, but no visible label per visual; founder count/label sits beside the whole stack. These slots resemble team avatars. Large dashboard/board detail will collapse into indistinct texture at this size.

Do not fill them with people from ads/thumbnails/mock projects, or crop Anthony into three “teammates.” Candidate source imagery below has relevant subject matter but is **not a ready-made, clear capability visual**.

| Target | Potential source (not selected) | Dimensions / ratio | Honest fit / crop and quality risks | Future preparation / status |
| --- | --- | --- | --- | --- |
| Development | `legacy-assets/portfolio/glass-dash-thumbnail.png` | 1024×1024; 1:1 | Interface imagery without large people, but dashboard metrics/logo are unverified, distorted type; cannot imply working/delivered software. Circle and 40px reduction lose UI meaning. | Needs preparation: confirm provenance, choose a simple meaningful non-person detail, evaluate at actual size, prepare approved @220 WebP. |
| Development | `legacy-assets/Graphic Design/Brand Kits/SaaS/Patchline.png` | 1586×992; 1.599:1 | Code-bracket/release-system visual language, not actual code execution evidence; whole board unreadable in circle. | Needs preparation: later approved isolated detail/source export and classification review; no board extraction now. |
| Design | `legacy-assets/Graphic Design/Brand Kits/Finance/Ledger-and-Loom.png` | 1536×1024; 1.500:1 | Palette/type/layout clearly relate to design at full size; 1:1 circle clips board and small text disappears. | Needs preparation: meaningful detail/export and approved @220 WebP; avoid using another brand's mark as Volatile identity. |
| Design | `legacy-assets/Graphic Design/Energy Drinks/aura-active.png` | 1254×1254; 1:1 | Creative ad as sample, not person; fine label/large copy is broken or illegible when reduced. | Needs preparation: validate whether a non-person detail reads as design, rather than a beverage icon. |
| Business / Strategy | `legacy-assets/Graphic Design/Social Media Promo/LinkedIn Banners/linkedin-banner-1.png` | 2508×627; 4:1 | Operations roadmap/checklist imagery on laptop is relevant conceptually; belongs to North Ledger Consulting, not documented Anthony work. Square crop removes much of scene, 40px loses diagram. | Needs preparation: only a clearly framed illustrative/detail use after approval/provenance check; @220 WebP and semantics validation. |
| Business / Strategy | `legacy-assets/Graphic Design/Social Media Promo/Event Graphics/paper-lantern-studio.png` | 1254×1254; 1:1 | Planning notebook/laptop imagery, but a workshop advertisement with another brand, tiny UI and embedded people. Do not crop a person into an avatar. | Needs preparation: non-person detail only if it communicates planning honestly; otherwise reject. |

**Recommendation status for all three: Needs preparation.** No suitable ready-to-use capability trio found for the current circles. Do not force these tentative mappings. If prepared imagery still reads as avatars or meaningless thumbnails, the B5 small structural adjustment may be required in a later explicitly scoped task. Reuse unchanged Nova presentation only if it communicates capabilities truthfully; no component adjustment is performed or newly authorized here.

## Duplicates, variants, outdated content and quality risks

### Duplicate findings

- No identical file hashes among the 161 legacy files.
- No identical decoded RGBA pixels among the 145 images.
- No image pair within difference-hash Hamming distance ≤6. This cannot rule out all near-duplicates.
- Visually related but different exports: logo-light / logo-dark / logo-with-text share the same VS family; Hale Street Realty square service graphic / LinkedIn banner 2; Westmere Talent square service graphic / LinkedIn banner 3; the plumber JPEG / the photo embedded in Northline Plumbing montage; IRON VALE board / IRONVALE gear ad. Preserve all originals pending later choice.
- RIFT Energy / RIFT Performance are related names but different depicted product identities; MacroForge meals / MetricForge software are different assets. Do not deduplicate based on name similarity.

### Filename/content mismatch and incomplete exports

| File | Observed issue |
| --- | --- |
| `legacy-assets/Graphic Design/Thumbnails/ai-tools/ai-thumbnails-side-hustles-thumbnail.png` | Actual Crypto Crash Ahead? thumbnail; filename/folder do not describe pixels. |
| `legacy-assets/Graphic Design/Thumbnails/ai-tools/work-10x-faster-thumbnail.png` | Actual Protect Your Crypto thumbnail. |
| `legacy-assets/Graphic Design/Thumbnails/finance-investing/protect-your-crypto-thumbnail.png` | Actual Work 10X Faster / PromptFlow Studio thumbnail. Not a duplicate of the preceding file. |
| `legacy-assets/Graphic Design/Brand Kits/Fitness/Iron-Valve.png` | Board says IRON VALE; filename contains Valve. |
| `legacy-assets/portfolio/glass-dash-thumbnail.png` | Visible Glass Admin naming; source-record mapping needs confirmation. |
| `legacy-assets/portfolio/frost-thumbnail.png` | Visible JackFrost Coaching naming; source-record mapping needs confirmation. |
| `legacy-assets/Graphic Design/Thumbnails/real-estate/worth-moving-here-thumbnail.png` | Empty location/name panel makes this an incomplete template-like export. |
| `legacy-assets/Graphic Design/Thumbnails/finance-investing/ChatGPT Image May 23, 2026, 09_10_05 PM.png` | Generic filename obscures Fix Your Paycheck content; filename alone is not provenance proof. |

### Publication and visual risks

1. **Baked-in claims:** Moody Brewer +52%/+70 is blocked pending evidence/preparation. CloudKeep, MetricForge, Glass Admin, Solartec, plumbing/site concepts and dashboard ads contain unverified usage, revenue, security, rating or outcome figures. They must not become Volatile Solutions achievements. Mock testimonials/trust marks inside Harbor & Steel, Sonoran Comfort, Stonebridge/Riverstone and other boards are not approved endorsements.
2. **Outdated/versioned content:** photo3 monitor shows older Volatile Solutions messaging. Event ads bake in Aug 16, September 1 or weekday/time details; mock interfaces/brand boards include 2024/2025 dates and thumbnail/market graphics contain time-sensitive numbers. Treat as historical/design samples until confirmed, not active events or current financial data. Actual delivered-site currency cannot be established from these exports.
3. **Small or malformed lettering:** Northline Strength Club schedule/lorem-ipsum-like text, Mula overlaps, Glass Admin distorted UI type, MetricForge/CloudKeep overlapping small labels and Moody mock-screen text need review. PNG is lossless, but it may preserve already soft or distorted source pixels. Pixel dimensions alone do not certify visual accuracy.
4. **Aspect/crop mismatch:** square project promos lose ~33.3% of height in a full-width 3:2 crop; 16:9 thumbnails lose ~15.6% of width when height-fitted to 3:2. Desktop card ratios vary further. Brand boards can fit mobile ratio but lose outer panels in narrower/taller desktop cards. Headline/CTA lettering at the edges can be sliced; Nova's overlay may collide with embedded copy.
5. **Resolution:** all project/app square thumbnails except Solartec are 1024px wide. Founder photo1 is 848px, photo3 1072px, photo2 1125px and photo4 1254px. Large/high-density rendering and aggressive crop may need a larger original. The 1280×800 / 1280×900 HTML attributes do not create real source detail.
6. **File weight:** many PNGs are approximately 1.3–2.6 MB; the full library is ~257 MiB. These are not Nova-ready derivative families. Future optimization requires separate scope; no optimization performed here. The 34,451-byte HealthSync flat graphic is not automatically inferior or heavily compressed.
7. **Transparency:** three newly added Logos PNGs have effective transparency (alpha 0–255) with extensive partial opacity, stray pixels and padding. Their residue and contrast need review before any future export. The other six RGBA PNGs (photo1, photo3, CloudKeep, Frost, MetricForge and ScholarLink) are fully opaque; RGBA mode alone is not transparency. See metadata note below for the exact groups.
8. **Color/orientation:** only photo1 has an embedded ICC profile (4,064 bytes, name/description “Display”); intended display gamut is not established. Other images lack embedded ICC profiles, so absent metadata is not proof of a precise color space. Photo2 EXIF orientation is 1, already upright. No CMYK image found.
9. **Names/formats/provenance:** spaces, commas, uppercase .PNG, underscores and misspellings need deliberate production-copy naming later. No original is renamed. No unsupported vector/design source to convert was found; there are no layered masters for correcting baked-in type. Do not infer manual logo construction or completed products from the appearance of the boards. Confirm author/tool contribution and usage rights before choosing.
10. **Capability semantics:** small overlapping circles do not provide visible Development/Design/Business labels and can imply teammates. Prefer reporting the gap to weak or misleading mapping.

**Exact RGBA sets:** `aboutme/about-me-photo1.PNG`, `aboutme/about-me-photo3.png`, `portfolio/cloud-keep-thumbnail.png`, `portfolio/frost-thumbnail.png`, `portfolio/metric-forge-thumbnail.png`, `portfolio/scholar-link-thumbnail.png` each have alpha extrema 255–255 (fully opaque). `Logos/logo-dark.png`, `Logos/logo-light.png` and `Logos/logo-with-text.png` have alpha extrema 0–255 (transparent/partly opaque). All paths in this note are relative to `legacy-assets/`. RGB images have no alpha channel.

## Migration candidate table

These recommendations do not approve final assets or edits. “Needs preparation” includes unresolved fidelity/provenance and semantics, not just format conversion.

| Target | Recommended candidate | Status | Preparation needed |
| --- | --- | --- | --- |
| Hero | `legacy-assets/aboutme/about-me-photo2.jpg` | Strong candidate | Confirm responsive blob crop/right-positioned face; coherent WebP/AVIF family without excessive upscaling. |
| Founder/About | `legacy-assets/aboutme/about-me-photo4.png` (photo3 for code/desk context) | Strong candidate | Confirm capture/editing provenance and face/laptop crop; coherent SmartImage family. |
| Moody Brewer | `legacy-assets/portfolio/moody-brewer-thumbnail.png` — source only, blocked as-is | Needs preparation | Confirm delivered-site fidelity; obtain clean capture/source or separately approved claim-free derivative; then crop/derivatives. |
| Creative Work | `legacy-assets/Graphic Design/Brand Kits/Finance/Ledger-and-Loom.png` — representative sample only | Usable with crop | Confirm authorship/classification, narrower desktop crop and overlay. Future composed cover may be needed for cross-project breadth. |
| Logo/wordmark | `legacy-assets/Logos/logo-with-text.png` | Needs preparation | Confirm identity version; clean source/vector if available, padding/transparency/residue review and approved navbar export. |
| Favicon | `legacy-assets/Logos/logo-light.png` (logo-dark alternative on dark surfaces) | Needs preparation | Confirm mark, inspect 16/32px legibility and opacity, prepare approved favicon/touch bundle later. |
| OG image | No suitable legacy asset found | No suitable asset found | Approved 1200×630 identity composition or missing legacy export; coordinate existing metadata/schema references. |
| Development visual | `legacy-assets/Graphic Design/Brand Kits/SaaS/Patchline.png` — tentative source only | Needs preparation | Confirm illustrative use; simple non-person detail/export, 40–48px meaning, approved @220 WebP; evaluate B5 structural gap. |
| Design visual | `legacy-assets/Graphic Design/Brand Kits/Finance/Ledger-and-Loom.png` — tentative source only | Needs preparation | Simple design detail with truthful attribution; 40–48px/circular-crop review; approved @220 WebP. |
| Business/Strategy visual | `legacy-assets/Graphic Design/Social Media Promo/LinkedIn Banners/linkedin-banner-1.png` — tentative source only | Needs preparation | Confirm illustrative planning use, no implied client outcome; isolate meaningful non-person detail only later; @220 WebP and semantic review. |

## Future asset migration rule

**`legacy-assets/` is SOURCE MATERIAL ONLY.**

A later explicitly approved implementation must:

- Copy only approved assets into Nova's production structure; preserve every legacy original.
- Never move the legacy library itself.
- Follow Nova naming conventions for production copies; do not silently rename originals.
- Preserve current image geometry, crops, responsive treatment, SmartImage selection and explicit raw-img references.
- Prepare coherent derivative families from approved sources; avoid stale AVIF/WebP/width variants showing earlier content.
- Do not generate widths that merely upscale insufficient sources without a justified decision.
- Never overwrite unrelated Nova assets; inspect the affected family before any replacement.
- Confirm truthful asset classification, provenance and any baked-in claims; use approved accurate alt text and obtain Polish approval separately.
- Keep logo/favicon/OG references synchronized within their existing contracts in a separately scoped task.
- Treat B5 structural adjustment as conditional and separately scoped; do not redesign or fabricate teammates.

This inventory does not begin asset migration, homepage migration, social implementation or any next task.

## Change-isolation validation

The initial SHA-256 baseline covers **891 existing repository files**, including the original **155 legacy files** and every file under `public/`. At the first post-write check, all 891 matched exactly, but six later files had appeared outside this audit's tool writes: three logo PNGs, two legacy `.DS_Store` files and root `.DS_Store`. The new legacy entries were inspected and incorporated; their hashes were captured separately on discovery.

A subsequent check found one additional founder photo; it was incorporated without changing it. Final isolation compares the original 891-file baseline plus all seven later-file hashes: **898 existing/observed files** total, including all **161 current legacy files**. The only file created or edited by this audit is `LEGACY_ASSET_INVENTORY.md`. Do not conflate externally appearing source files with this audit's changes. No JSON, Astro component, CSS, config, source document or asset was modified by this task, and no asset was copied into `public/`.

Validation is read-only: re-enumerate paths, compare each baseline/discovery hash, confirm all 161 legacy paths have inventory rows, and read back this document. No build is applicable to this inventory-only change. Any additional concurrent additions or changes must be reported rather than silently claimed unchanged.

**Validation result:** all 898 baseline/discovery files matched SHA-256, including all 161 legacy files and 216 files under `public/`; the only additional path after accounting for the seven externally appearing files was `LEGACY_ASSET_INVENTORY.md`. All 161 legacy paths are covered once in the inventory table. No assets were copied, converted or compressed; no implementation or homepage migration started.

## Complete file inventory

Every path below is relative to the repository root. Dimensions are decoded raster pixels; ratio is width ÷ height. Sizes include exact bytes and approximate KiB. “Export” describes the file's flattened raster form, not a verified original authoring source. Unless specifically noted, PNG/JPEG images are opaque, have no embedded ICC profile and have no Nova WebP/AVIF/width derivatives. The three Logos PNGs have real transparency as detailed above. All 145 images decoded successfully. The non-image entries are intentionally retained.


### legacy-assets/Graphic Design

2 files; 0 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/.DS_Store` | Finder metadata | N/A | N/A | 6,148 B (~6.0 KiB) | macOS Finder metadata; not a content asset. Preserved unchanged. |
| `legacy-assets/Graphic Design/brandkit_SKILL.md` | Markdown / process reference | N/A | N/A | 15,992 B (~15.6 KiB) | Legacy brand-kit image-generation instructions; process reference, not image/original artwork and not governing instructions for this audit. |

### legacy-assets/Graphic Design/Brand Kits/Auto

6 files; 6 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Brand Kits/Auto/Glossline-Studio.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 1,653,989 B (~1615.2 KiB) | Glossline Studio detailing identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Auto/Gravelhorn-Outfitters.png` | PNG / RGB raster export | 1536×1024 | 1.500:1 | 2,475,923 B (~2417.9 KiB) | Gravelhorn Outfitters off-road identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Auto/MirrorBay-Detail.png` | PNG / RGB raster export | 1536×1024 | 1.500:1 | 1,959,996 B (~1914.1 KiB) | MirrorBay Detail Co. identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Auto/Route-Forge.png` | PNG / RGB raster export | 1536×1024 | 1.500:1 | 2,074,572 B (~2025.9 KiB) | RouteForge Fleetworks identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Auto/Volt-Nest.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 1,472,797 B (~1438.3 KiB) | VoltNest EV charging identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Auto/Wrench-Run.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 1,814,559 B (~1772.0 KiB) | WrenchRun mobile mechanic identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |

### legacy-assets/Graphic Design/Brand Kits/Finance

6 files; 6 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Brand Kits/Finance/Bridgewell-Funding.png` | PNG / RGB raster export | 1536×1024 | 1.500:1 | 1,753,919 B (~1712.8 KiB) | Bridgewell Funding identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Finance/Crestline-Wealth.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 1,920,943 B (~1875.9 KiB) | Crestline Wealth Partners identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Finance/Harborline-Capital.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 2,034,108 B (~1986.4 KiB) | Harborline Capital identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Finance/Ledger-and-Loom.png` | PNG / RGB raster export | 1536×1024 | 1.500:1 | 2,350,955 B (~2295.9 KiB) | Ledger & Loom bookkeeping identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Finance/Meridian-Oak.png` | PNG / RGB raster export | 1536×1024 | 1.500:1 | 2,100,915 B (~2051.7 KiB) | Meridian Oak Partners identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Finance/Penny-Pilot.png` | PNG / RGB raster export | 1536×1024 | 1.500:1 | 1,534,581 B (~1498.6 KiB) | PennyPilot budgeting identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |

### legacy-assets/Graphic Design/Brand Kits/Fitness

6 files; 6 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Brand Kits/Fitness/Align-and-Aura.png` | PNG / RGB raster export | 1536×1024 | 1.500:1 | 2,028,409 B (~1980.9 KiB) | Align & Aura movement studio identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Fitness/ForgeHouse-Athletics.png` | PNG / RGB raster export | 1536×1024 | 1.500:1 | 2,146,706 B (~2096.4 KiB) | Forge House Athletics identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Fitness/GloveHouse-Boxing.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 1,736,776 B (~1696.1 KiB) | GloveHouse boxing identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Fitness/Iron-Valve.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 2,032,241 B (~1984.6 KiB) | IRON VALE strength (filename Iron-Valve mismatch) identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Fitness/MacroMap.png` | PNG / RGB raster export | 1536×1024 | 1.500:1 | 1,622,757 B (~1584.7 KiB) | MacroMap nutrition identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Fitness/RangeLab-Recovery.png` | PNG / RGB raster export | 1536×1024 | 1.500:1 | 1,717,308 B (~1677.1 KiB) | RangeLab Recovery identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |

### legacy-assets/Graphic Design/Brand Kits/Medical

6 files; 6 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Brand Kits/Medical/Haven-Bloom-Health.png` | PNG / RGB raster export | 1536×1024 | 1.500:1 | 1,916,833 B (~1871.9 KiB) | Haven Bloom Health identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Medical/Kindwell.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 1,827,576 B (~1784.7 KiB) | Kindwell Pediatrics identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Medical/Luma-Grove.png` | PNG / RGB raster export | 1536×1024 | 1.500:1 | 1,950,021 B (~1904.3 KiB) | Luma Grove Clinic identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Medical/Pearl-and-Pine-Dental.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 1,909,934 B (~1865.2 KiB) | Pearl & Pine Dental identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Medical/Solenne-Dermatology.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 1,830,517 B (~1787.6 KiB) | Solenne Dermatology identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Medical/Stridewell-Therapy.png` | PNG / RGB raster export | 1536×1024 | 1.500:1 | 1,606,329 B (~1568.7 KiB) | Stridewell Therapy identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |

### legacy-assets/Graphic Design/Brand Kits/Real Estate

6 files; 6 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Brand Kits/Real Estate/HearthMark-Lending.png` | PNG / RGB raster export | 1536×1024 | 1.500:1 | 2,044,784 B (~1996.9 KiB) | Hearthmark Lending identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Real Estate/KeyHaven-Property.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 1,383,676 B (~1351.2 KiB) | KeyHaven Property Co. identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Real Estate/Northline-Real-Estate.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 2,117,651 B (~2068.0 KiB) | Northline Realty identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Real Estate/RoomWright-Studio.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 2,061,677 B (~2013.4 KiB) | RoomWright Studio staging identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Real Estate/SagePoint-Realty.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 2,047,919 B (~1999.9 KiB) | SagePoint Realty Group identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Real Estate/Vale-and-Stone.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 2,268,543 B (~2215.4 KiB) | Vale & Stone Estates identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |

### legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food

6 files; 6 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Bennys-Burgers.png` | PNG / RGB raster export | 1536×1024 | 1.500:1 | 2,377,854 B (~2322.1 KiB) | Benny's Burger Box identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Copper-Fork.png` | PNG / RGB raster export | 1536×1024 | 1.500:1 | 2,549,406 B (~2489.7 KiB) | Copper Fork Tavern identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Ember_and_Fig.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 1,813,945 B (~1771.4 KiB) | Ember & Fig identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Fry-Bird.png` | PNG / RGB raster export | 1536×1024 | 1.500:1 | 2,423,146 B (~2366.4 KiB) | Frybird identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Hollow-Cup.png` | PNG / RGB raster export | 1536×1024 | 1.500:1 | 2,224,309 B (~2172.2 KiB) | Hollow Cup Coffee identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Restaraunt and Food/Juniper-Hearth.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 2,082,158 B (~2033.4 KiB) | Juniper Hearth identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |

### legacy-assets/Graphic Design/Brand Kits/SaaS

6 files; 6 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Brand Kits/SaaS/Carbon-Cue.png` | PNG / RGB raster export | 1536×1024 | 1.500:1 | 1,792,993 B (~1751.0 KiB) | CarbonCue sustainability identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/SaaS/Clip-Forge.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 1,456,281 B (~1422.1 KiB) | ClipForge video tool identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/SaaS/Flow-Pilot.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 1,390,144 B (~1357.6 KiB) | FlowPilot workflow identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/SaaS/Patchline.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 1,397,024 B (~1364.3 KiB) | Patchline release/deployment identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/SaaS/Table-Shift.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 1,773,976 B (~1732.4 KiB) | TableShift restaurant scheduling identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/SaaS/Task-Nest.png` | PNG / RGB raster export | 1536×1024 | 1.500:1 | 1,406,843 B (~1373.9 KiB) | TaskNest task/project tool identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |

### legacy-assets/Graphic Design/Brand Kits/Travel and Leisure

6 files; 6 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Atlas-Drift.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 1,875,566 B (~1831.6 KiB) | Atlas Drift travel identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Bloom-and-Brick.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 2,480,688 B (~2422.5 KiB) | Bloom & Brick Walks identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Lantern-Lane.png` | PNG / RGB raster export | 1536×1024 | 1.500:1 | 2,331,097 B (~2276.5 KiB) | Lantern Lane Tours identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Old-Harbor.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 2,167,826 B (~2117.0 KiB) | Old Harbor Guides identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Solara-Stay.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 2,008,884 B (~1961.8 KiB) | Solara Stay Club identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |
| `legacy-assets/Graphic Design/Brand Kits/Travel and Leisure/Tide-and-Trail.png` | PNG / RGB raster export | 1586×992 | 1.599:1 | 2,391,661 B (~2335.6 KiB) | Tide & Trail Co. identity board; existing 3×3 montage of logo, applications, palette/type and imagery. Flattened opaque raster, not editable/vector logo; fine labels need review. |

### legacy-assets/Graphic Design/Energy Drinks

3 files; 3 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Energy Drinks/aura-active.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 1,951,896 B (~1906.1 KiB) | AURA ACTIVE white can advertisement; light cream/gold editorial finish, good large forms; single creative piece, not collection. |
| `legacy-assets/Graphic Design/Energy Drinks/rift-energy.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 2,026,291 B (~1978.8 KiB) | RIFT Energy dark/neon can advertisement; clear product but fine label text; different RIFT identity from supplement variant. |
| `legacy-assets/Graphic Design/Energy Drinks/vanta-pulse-energy.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 2,205,532 B (~2153.8 KiB) | VANTA PULSE can advertisement, dark blue/red, runner silhouette; embedded marketing/product claims. |

### legacy-assets/Graphic Design/Fitness

4 files; 3 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Fitness/.DS_Store` | Finder metadata | N/A | N/A | 6,148 B (~6.0 KiB) | macOS Finder metadata; not a content asset. Preserved unchanged. |
| `legacy-assets/Graphic Design/Fitness/iron-vale-fitness-gear.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 2,345,743 B (~2290.8 KiB) | IRONVALE fitness bag/gear advertisement; dark warm product layout; related identity to Iron-Valve.png board but spelling differs. |
| `legacy-assets/Graphic Design/Fitness/macro-forge-meals.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 2,532,005 B (~2472.7 KiB) | MacroForge meal-prep packaging/food advertisement; strong orange/dark layout; not MetricForge software. |
| `legacy-assets/Graphic Design/Fitness/volt-electrolytes.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 2,244,363 B (~2191.8 KiB) | VOLT MINERAL hydration-product advertisement; cool blue packaging; embedded nutrition/product claims. |

### legacy-assets/Graphic Design/Food-and-Beverage

4 files; 3 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Food-and-Beverage/.DS_Store` | Finder metadata | N/A | N/A | 6,148 B (~6.0 KiB) | macOS Finder metadata; not a content asset. Preserved unchanged. |
| `legacy-assets/Graphic Design/Food-and-Beverage/brew-core-coffee.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 2,122,708 B (~2073.0 KiB) | BREWCORE canned-coffee advertisement, warm brown/copper scene; single piece with embedded nutrition claims. |
| `legacy-assets/Graphic Design/Food-and-Beverage/crunch-forge-snack.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 2,254,461 B (~2201.6 KiB) | CRUNCHFORGE snack-package advertisement, black/orange; nutrition claims baked in. |
| `legacy-assets/Graphic Design/Food-and-Beverage/luma-spritz-water.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 2,179,418 B (~2128.3 KiB) | LUMA SPRITZ three-can sparkling-water advertisement; bright product layout, single campaign. |

### legacy-assets/Graphic Design/Social Media Promo

1 files; 0 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Social Media Promo/.DS_Store` | Finder metadata | N/A | N/A | 12,292 B (~12.0 KiB) | macOS Finder metadata; not a content asset. Preserved unchanged. |

### legacy-assets/Graphic Design/Social Media Promo/Event Graphics

5 files; 4 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Social Media Promo/Event Graphics/.DS_Store` | Finder metadata | N/A | N/A | 6,148 B (~6.0 KiB) | macOS Finder metadata; not a content asset. Preserved unchanged. |
| `legacy-assets/Graphic Design/Social Media Promo/Event Graphics/harbor-room-local-table-night.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 1,665,338 B (~1626.3 KiB) | Harbor Room event promo; warm venue photo, Friday Aug 16 / 7 PM date baked in; historical/unverified event, not current announcement. |
| `legacy-assets/Graphic Design/Social Media Promo/Event Graphics/ironwood-training-event.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 2,355,321 B (~2300.1 KiB) | Ironwood Training Hall strength-event promo; September 1 start baked in; current relevance unconfirmed. |
| `legacy-assets/Graphic Design/Social Media Promo/Event Graphics/juniper-house-author-evening.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 2,184,119 B (~2132.9 KiB) | Juniper House Books author-evening promo; Thursday / 6:30 PM baked in; not Juniper Hearth restaurant identity. |
| `legacy-assets/Graphic Design/Social Media Promo/Event Graphics/paper-lantern-studio.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 1,785,987 B (~1744.1 KiB) | Paper Lantern Studio content-planning workshop ad; laptop, notebook and planning-board imagery; small mock interface text/date artifacts. |

### legacy-assets/Graphic Design/Social Media Promo/LinkedIn Banners

4 files; 3 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Social Media Promo/LinkedIn Banners/.DS_Store` | Finder metadata | N/A | N/A | 6,148 B (~6.0 KiB) | macOS Finder metadata; not a content asset. Preserved unchanged. |
| `legacy-assets/Graphic Design/Social Media Promo/LinkedIn Banners/linkedin-banner-1.png` | PNG / RGB raster export | 2508×627 | 4.000:1 | 1,462,615 B (~1428.3 KiB) | North Ledger Consulting operations-roadmap laptop banner; 4:1, not Volatile Solutions branding; related planning imagery may inform later capability crop. |
| `legacy-assets/Graphic Design/Social Media Promo/LinkedIn Banners/linkedin-banner-2.png` | PNG / RGB raster export | 2508×627 | 4.000:1 | 1,918,969 B (~1874.0 KiB) | Hale Street Realty house/banner; 4:1 variant related to hale-street-realty.png, not same pixels. |
| `legacy-assets/Graphic Design/Social Media Promo/LinkedIn Banners/linkedin-banner-3.png` | PNG / RGB raster export | 2508×627 | 4.000:1 | 1,700,485 B (~1660.6 KiB) | Westmere Talent résumé/career banner; 4:1 variant related to westmere-talent-resume-building.png; other-person profile imagery. |

### legacy-assets/Graphic Design/Social Media Promo/Promo Flyers

2 files; 1 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Social Media Promo/Promo Flyers/.DS_Store` | Finder metadata | N/A | N/A | 6,148 B (~6.0 KiB) | macOS Finder metadata; not a content asset. Preserved unchanged. |
| `legacy-assets/Graphic Design/Social Media Promo/Promo Flyers/cleaning-company-promo.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 1,994,112 B (~1947.4 KiB) | Alder & Finch residential-cleaning flyer; warm/light interior with bottles and embedded CTA. |

### legacy-assets/Graphic Design/Social Media Promo/Service Graphics

5 files; 4 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Social Media Promo/Service Graphics/.DS_Store` | Finder metadata | N/A | N/A | 6,148 B (~6.0 KiB) | macOS Finder metadata; not a content asset. Preserved unchanged. |
| `legacy-assets/Graphic Design/Social Media Promo/Service Graphics/blue-harbor-bookkeeping.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 1,974,242 B (~1928.0 KiB) | Blue Harbor Advisory bookkeeping promo; tablet dashboard, notebook and calculator; figures unverified; not business-performance evidence. |
| `legacy-assets/Graphic Design/Social Media Promo/Service Graphics/hale-street-realty.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 2,137,538 B (~2087.4 KiB) | Hale Street Realty square service promo, house photo and advisory headline; related 4:1 banner exists. |
| `legacy-assets/Graphic Design/Social Media Promo/Service Graphics/stonebridge-web-services.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 2,051,771 B (~2003.7 KiB) | Stonebridge Web promo with Riverstone Landscapes laptop/tablet mockups and wireframe notebook; embedded testimonial, years/project counts/ratings unverified. |
| `legacy-assets/Graphic Design/Social Media Promo/Service Graphics/westmere-talent-resume-building.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 1,979,205 B (~1932.8 KiB) | Westmere Talent career promo with résumé and another-person social profile; related 4:1 banner; does not describe Anthony's employment. |

### legacy-assets/Graphic Design/Social Media Promo/Social Posts

6 files; 5 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Social Media Promo/Social Posts/.DS_Store` | Finder metadata | N/A | N/A | 6,148 B (~6.0 KiB) | macOS Finder metadata; not a content asset. Preserved unchanged. |
| `legacy-assets/Graphic Design/Social Media Promo/Social Posts/cedar-plate-food.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 2,228,927 B (~2176.7 KiB) | Cedar Plate pasta social ad, warm food/restaurant imagery and reservation CTA. |
| `legacy-assets/Graphic Design/Social Media Promo/Social Posts/house-of-laurel-beauty.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 1,931,317 B (~1886.1 KiB) | House of Laurel beauty appointment social ad, warm cream/floral product imagery. |
| `legacy-assets/Graphic Design/Social Media Promo/Social Posts/kind-red-desk-equippment.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 2,515,108 B (~2456.2 KiB) | KINDRED DESK workspace-product ad with notebook/pen; filename misspelling retained. Stylized promo, not proof of Anthony's planning process. |
| `legacy-assets/Graphic Design/Social Media Promo/Social Posts/marlow-pastry-bakery.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 2,238,473 B (~2186.0 KiB) | MARLOW PANTRY bakery social ad with croissant/coffee; visible branding differs from filename wording. |
| `legacy-assets/Graphic Design/Social Media Promo/Social Posts/sable-row-clothing.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 2,460,451 B (~2402.8 KiB) | Sable Row menswear social ad; warm editorial jacket scene and seasonal Fall copy. |

### legacy-assets/Graphic Design/Supplements

4 files; 3 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Supplements/.DS_Store` | Finder metadata | N/A | N/A | 6,148 B (~6.0 KiB) | macOS Finder metadata; not a content asset. Preserved unchanged. |
| `legacy-assets/Graphic Design/Supplements/level-up-pre.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 1,918,080 B (~1873.1 KiB) | Level Up Labs supplement advertisement; neon/game UI and three jars; product claims baked in. |
| `legacy-assets/Graphic Design/Supplements/rift-performance.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 1,964,052 B (~1918.0 KiB) | RIFT Performance supplement advertisement; black/blue jars, distinct from RIFT Energy can. |
| `legacy-assets/Graphic Design/Supplements/vyra-active.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 1,945,499 B (~1899.9 KiB) | VYRA ACTIVE supplement advertisement; muted cream/plum packaging and fine text. |

### legacy-assets/Graphic Design/Tech

4 files; 3 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Tech/.DS_Store` | Finder metadata | N/A | N/A | 6,148 B (~6.0 KiB) | macOS Finder metadata; not a content asset. Preserved unchanged. |
| `legacy-assets/Graphic Design/Tech/flowstate-ai.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 1,846,417 B (~1803.1 KiB) | FLOWSTATE AI planning-tool promo; laptop/tablet UI, not proof of a working app. |
| `legacy-assets/Graphic Design/Tech/revnue-admin.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 1,780,070 B (~1738.3 KiB) | REVNUE revenue-dashboard advertisement; file/name intentionally recorded as found. Embedded dollars/user/growth figures unverified. |
| `legacy-assets/Graphic Design/Tech/vault-iq-security.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 1,574,192 B (~1537.3 KiB) | VAULTIQ phone-security promo; privacy score/protected-account claims not verified functionality. |

### legacy-assets/Graphic Design/Thumbnails/ai-tools

6 files; 6 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Thumbnails/ai-tools/ai-replacing-creativity.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,148,108 B (~2097.8 KiB) | AI-versus-human-creativity thumbnail; person centered, dense neon graphics. |
| `legacy-assets/Graphic Design/Thumbnails/ai-tools/ai-side-hustles-that-work-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 1,737,332 B (~1696.6 KiB) | FutureIncome Lab AI-side-hustles thumbnail; revenue figures unverified. |
| `legacy-assets/Graphic Design/Thumbnails/ai-tools/ai-thumbnails-side-hustles-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,132,008 B (~2082.0 KiB) | FILENAME/CONTENT MISMATCH: visible headline Crypto Crash Ahead? and woman/crypto imagery; finance theme in ai-tools folder. |
| `legacy-assets/Graphic Design/Thumbnails/ai-tools/automate-your-business-ai-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 1,853,384 B (~1809.9 KiB) | OpsPilot AI business-automation thumbnail; woman and illustrated workflow, not capability implementation evidence. |
| `legacy-assets/Graphic Design/Thumbnails/ai-tools/study-smarter-with-ai-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 1,874,692 B (~1830.8 KiB) | StudyStack AI study-tool thumbnail with woman/laptop and illustrated planning UI. |
| `legacy-assets/Graphic Design/Thumbnails/ai-tools/work-10x-faster-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,256,275 B (~2203.4 KiB) | FILENAME/CONTENT MISMATCH: visible Protect Your Crypto headline; crypto security theme in ai-tools folder. |

### legacy-assets/Graphic Design/Thumbnails/faith-god

15 files; 15 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/broke-my-plans-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,355,128 B (~2299.9 KiB) | broke my plans thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/god-changed-desires-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,171,513 B (~2120.6 KiB) | god changed desires thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/god-closed-that-door-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,237,781 B (~2185.3 KiB) | god closed that door thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/god-is-rebuilding-me-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,334,310 B (~2279.6 KiB) | god is rebuilding me thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/god-removed-distractions-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 1,744,803 B (~1703.9 KiB) | god removed distractions thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/god-was-preparing-me-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,161,137 B (~2110.5 KiB) | god was preparing me thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/got-changed-my-circle-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 1,945,852 B (~1900.2 KiB) | God Changed My Circle faith thumbnail; filename says got, visible headline says God. |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/i-had-to-let-go-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 1,860,360 B (~1816.8 KiB) | i had to let go thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/i-was-lukewarm-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,108,702 B (~2059.3 KiB) | i was lukewarm thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/season-has-purpose-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,136,346 B (~2086.3 KiB) | season has purpose thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/stop-forcing-it-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,020,560 B (~1973.2 KiB) | stop forcing it thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/stop-running-from-god-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 1,934,661 B (~1889.3 KiB) | stop running from god thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/test-before-blessing-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,478,919 B (~2420.8 KiB) | test before blessing thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/the-prayer-almost-quit-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,252,109 B (~2199.3 KiB) | the prayer almost quit thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/faith-god/when-god-feels-silent-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 1,887,353 B (~1843.1 KiB) | when god feels silent thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |

### legacy-assets/Graphic Design/Thumbnails/finance-investing

6 files; 6 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Thumbnails/finance-investing/ChatGPT Image May 23, 2026, 09_10_05 PM.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,038,463 B (~1990.7 KiB) | Generic generation-style filename; visible Fix Your Paycheck / MoneyMap Method budget thumbnail; provenance requires confirmation. |
| `legacy-assets/Graphic Design/Thumbnails/finance-investing/alt-coins-running-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 1,876,521 B (~1832.5 KiB) | alt coins running thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/finance-investing/bitcoin-breakout-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 1,827,971 B (~1785.1 KiB) | bitcoin breakout thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/finance-investing/buy-before-the-breakout-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,048,587 B (~2000.6 KiB) | buy before the breakout thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/finance-investing/protect-your-crypto-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 1,864,308 B (~1820.6 KiB) | FILENAME/CONTENT MISMATCH: visible Work 10X Faster / PromptFlow Studio productivity theme in finance-investing folder. |
| `legacy-assets/Graphic Design/Thumbnails/finance-investing/start-crypto-right-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 1,914,708 B (~1869.8 KiB) | start crypto right thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |

### legacy-assets/Graphic Design/Thumbnails/fitness

6 files; 6 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Thumbnails/fitness/best-beginner-gym-plan-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 1,878,225 B (~1834.2 KiB) | best beginner gym plan thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/fitness/build-muscle-faster-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,008,166 B (~1961.1 KiB) | build muscle faster thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/fitness/home-workouts-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,037,168 B (~1989.4 KiB) | home workouts thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/fitness/not-losing-fat-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,230,046 B (~2177.8 KiB) | not losing fat thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/fitness/stop-training-glutes-wrong-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 1,917,951 B (~1873.0 KiB) | stop training glutes wrong thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/fitness/stop-training-wrong-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 1,883,874 B (~1839.7 KiB) | stop training wrong thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |

### legacy-assets/Graphic Design/Thumbnails/food-restaurant

6 files; 6 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Thumbnails/food-restaurant/cheap-meal-prep-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,194,896 B (~2143.5 KiB) | Meal-prep thumbnail with $25 headline / $25.14 breakdown; illustrative prices, not current factual pricing. |
| `legacy-assets/Graphic Design/Thumbnails/food-restaurant/date-night-dinner-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,159,068 B (~2108.5 KiB) | date night dinner thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/food-restaurant/family-secret-recipie-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,459,713 B (~2402.1 KiB) | My Family's Secret Recipe food thumbnail; filename spelling retained. |
| `legacy-assets/Graphic Design/Thumbnails/food-restaurant/food-myth-busted-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,321,378 B (~2267.0 KiB) | food myth busted thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/food-restaurant/viral-food-worth-it-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,603,918 B (~2542.9 KiB) | viral food worth it thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/food-restaurant/worth-the-hype-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,334,743 B (~2280.0 KiB) | worth the hype thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |

### legacy-assets/Graphic Design/Thumbnails/real-estate

3 files; 3 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Graphic Design/Thumbnails/real-estate/dont-buy-until-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 1,975,867 B (~1929.6 KiB) | dont buy until thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/real-estate/real-estate-buy-now-market-update-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,348,128 B (~2293.1 KiB) | real estate buy now market update thumbnail; people, embedded headline and topic illustrations. Flattened promotional export; depicted people are not founder/team evidence. |
| `legacy-assets/Graphic Design/Thumbnails/real-estate/worth-moving-here-thumbnail.png` | PNG / RGB raster export | 1672×941 | 1.777:1 | 2,083,631 B (~2034.8 KiB) | Real-estate thumbnail with person, ratings and visibly empty location/name panel; incomplete export for later review. |

### legacy-assets/aboutme

5 files; 4 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/aboutme/.DS_Store` | Finder metadata | N/A | N/A | 6,148 B (~6.0 KiB) | macOS Finder metadata; not a content asset. Preserved unchanged. |
| `legacy-assets/aboutme/about-me-photo1.PNG` | PNG / RGBA raster export | 848×876 | 0.968:1 | 1,316,337 B (~1285.5 KiB) | Formal suit/tie headshot, neutral gray backdrop; clear face, tight headroom; opaque RGBA, embedded Display ICC. Existing raster export; original capture not established. |
| `legacy-assets/aboutme/about-me-photo2.jpg` | JPEG / RGB raster export | 1125×1426 | 0.789:1 | 1,477,796 B (~1443.2 KiB) | Café work/lifestyle photo with Anthony and phone/tripod drink setup; bright natural interior; near 4:5, face right of center. Strong hero shortlist; activity/location not independently verified. |
| `legacy-assets/aboutme/about-me-photo3.png` | PNG / RGBA raster export | 1072×1080 | 0.993:1 | 1,715,908 B (~1675.7 KiB) | Anthony at dark desk with laptop code, monitor displaying older Volatile Solutions site, notebook, lamps and green backdrop; useful founder context, dark shadows. Opaque RGBA; original capture not established. |
| `legacy-assets/aboutme/about-me-photo4.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 2,055,802 B (~2007.6 KiB) | Later-added warm styled founder suit/laptop portrait, centered face and lighter room/plants; strong about candidate, crop/provenance confirmation needed; opaque RGB, no embedded ICC. |

### legacy-assets/portfolio

17 files; 16 images. Full paths are retained for unambiguous later selection.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/portfolio/.DS_Store` | Finder metadata | N/A | N/A | 6,148 B (~6.0 KiB) | macOS Finder metadata; not a content asset. Preserved unchanged. |
| `legacy-assets/portfolio/birdie-bay-thumbnail.png` | PNG / RGB raster export | 1024×1024 | 1.000:1 | 480,826 B (~469.6 KiB) | Birdie Bay golf website presentation; low-contrast white text and densely overlapping panels. Client status and embedded figures unconfirmed. |
| `legacy-assets/portfolio/cloud-keep-thumbnail.png` | PNG / RGBA raster export | 1024×1024 | 1.000:1 | 1,163,287 B (~1136.0 KiB) | CloudKeep storage-site montage; embedded 99.9%, 2M+ and 10,000+ claims [EXISTING CLAIM — NEEDS CONFIRMATION]; crowded/overlapping text. Not implementation evidence. |
| `legacy-assets/portfolio/frost-thumbnail.png` | PNG / RGBA raster export | 1024×1024 | 1.000:1 | 1,282,638 B (~1252.6 KiB) | JackFrost Coaching website/case-study cover; exact correspondence to Frost needs confirmation. Text-heavy square; small text overlaps. |
| `legacy-assets/portfolio/glass-dash-thumbnail.png` | PNG / RGB raster export | 1024×1024 | 1.000:1 | 923,549 B (~901.9 KiB) | Glass Admin dashboard/login montage; filename suggests GlassDash but visible name differs. Metrics are illustrative/unverified; rendered text distortions. |
| `legacy-assets/portfolio/harbor-steel-thumbnail.png` | PNG / RGB raster export | 1024×1024 | 1.000:1 | 1,683,864 B (~1644.4 KiB) | Harbor & Steel barber website presentation with pricing, testimonial and three portraits; 555 phone and malformed footer text. Unverified concept/client status. |
| `legacy-assets/portfolio/health-sync-thumbnail.png` | PNG / RGB raster export | 1024×1024 | 1.000:1 | 34,451 B (~33.6 KiB) | HealthSync AI logo/title graphic on opaque white; simple export, not a UI capture. Small byte size reflects flat content, not automatically poor quality. |
| `legacy-assets/portfolio/jobly-thumbnail.png` | PNG / RGB raster export | 1024×1024 | 1.000:1 | 555,045 B (~542.0 KiB) | Jobly job-portal hero presentation with people/photo and purple overlay; no evidence authentication/filtering is implemented. |
| `legacy-assets/portfolio/metric-forge-thumbnail.png` | PNG / RGBA raster export | 1024×1024 | 1.000:1 | 793,615 B (~775.0 KiB) | MetricForge analytics-site and dashboard montage; embedded usage/performance/revenue-oriented figures unverified; text collisions and soft small type. |
| `legacy-assets/portfolio/moody-brewer-thumbnail.png` | PNG / RGB raster export | 1024×1024 | 1.000:1 | 1,881,248 B (~1837.2 KiB) | Moody Brewer laptop/site mockup with drinks; embedded +52% traffic and +70 new-customers claims unverified. Needs preparation and delivered-site fidelity confirmation. |
| `legacy-assets/portfolio/mula-thumbnail.png` | PNG / RGB raster export | 1024×1024 | 1.000:1 | 360,163 B (~351.7 KiB) | Mula expense dashboard/phone montage; interface labels overlap and some type appears distorted. UI numbers are not project outcomes. |
| `legacy-assets/portfolio/northline-plumbing-thumbnail.jpg` | JPEG / RGB raster export | 1920×900 | 2.133:1 | 1,444,630 B (~1410.8 KiB) | Landscape plumber photograph; related photograph appears inside plumbing-thumbnail.png. Not Anthony; photo origin/license and client status unconfirmed. |
| `legacy-assets/portfolio/northline-thumbnail.png` | PNG / RGB raster export | 1024×1024 | 1.000:1 | 1,713,099 B (~1672.9 KiB) | Northline Strength Club website presentation; lorem-ipsum-like copy, malformed schedule labels and coach text. Different entity from Northline Plumbing and Northline Realty. |
| `legacy-assets/portfolio/plumbing-thumbnail.png` | PNG / RGB raster export | 1024×1024 | 1.000:1 | 1,205,015 B (~1176.8 KiB) | Northline Plumbing service-site montage; embedded 4.9-star, response-time and service claims unverified; reused plumber photo. |
| `legacy-assets/portfolio/scholar-link-thumbnail.png` | PNG / RGBA raster export | 1024×1024 | 1.000:1 | 1,054,690 B (~1030.0 KiB) | ScholarLink tutoring website/case-study presentation; embedded contact data and claim of real site imagery do not verify project status; dense small type. |
| `legacy-assets/portfolio/solar-thumbnail.png` | PNG / RGB raster export | 1254×1254 | 1.000:1 | 2,264,912 B (~2211.8 KiB) | Solartec solar-service website montage; 25+ years, 10,000+ installations and analytics figures unverified. Not proof of delivered/client work. |
| `legacy-assets/portfolio/sonoran-comfort-thumbnail.png` | PNG / RGB raster export | 1024×1024 | 1.000:1 | 1,724,140 B (~1683.7 KiB) | Sonoran Comfort Systems desktop/mobile HVAC montage; embedded testimonial, TRANE/BBB/LENNOX trust logos and 555 phone are unverified; do not inherit endorsements. |

### legacy-assets/ (root metadata)

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/.DS_Store` | Finder metadata | N/A | N/A | 8,196 B (~8.0 KiB) | Later-appearing macOS Finder metadata; not a content asset. Preserved unchanged. |

### legacy-assets/Logos

4 files; 3 images. These assets appeared during the audit; inspected and hashed separately without changing them.

| Path | Type / form | Dimensions | Approx. ratio | Size | Observed content / suitability notes |
| --- | --- | --- | --- | --- | --- |
| `legacy-assets/Logos/.DS_Store` | Finder metadata | N/A | N/A | 6,148 B (~6.0 KiB) | Later-appearing Finder metadata, no content role; preserved unchanged. |
| `legacy-assets/Logos/logo-dark.png` | PNG / RGBA raster export | 1254×1254 | 1.000:1 | 465,038 B (~454.1 KiB) | Copper hexagonal VS with light letter portions; dark-surface candidate with visible holes/distressing and residue; extensive partial opacity; needs preparation. |
| `legacy-assets/Logos/logo-light.png` | PNG / RGBA raster export | 1254×1254 | 1.000:1 | 469,790 B (~458.8 KiB) | Copper hexagonal VS with dark letter portions; light-surface candidate, stray pixels and extensive partial opacity; needs preparation. |
| `legacy-assets/Logos/logo-with-text.png` | PNG / RGBA raster export | 1672×941 | 1.777:1 | 205,694 B (~200.9 KiB) | Volatile Solutions horizontal wordmark/hexagonal VS; effective transparent background, excessive padding and stray color/partial-alpha artifacts; needs preparation. |

End of inventory. All candidate selections and implementation remain pending a later scoped task.
