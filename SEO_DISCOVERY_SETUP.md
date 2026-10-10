# Organic search and AI discovery

## Scope and strategy

The user confirms https://volatile-solutions.net is live and production verification passed. This pass prepares five distinct, static service pages and enables intentional public indexing. Changes are local until deployed; no accounts, DNS, search submissions or deployment are performed.

| Page | Primary intent | Distinction |
| --- | --- | --- |
| /web-design-rhode-island/ | Small-business web design; Rhode Island/Providence-area design help | Brand, content, responsive customer experience and the path to launch |
| /web-development-rhode-island/ | Custom website/front-end development | Functionality, implementation, data and proportionate technical choices |
| /custom-web-applications/ | Custom business tools and digital products | Workflow discovery, dashboards, prototypes/MVPs and custom versus off-the-shelf decisions |
| /branding-visual-design/ | Brand identities, graphic and social design | Identity consistency and the specific formats a business needs |
| /website-support/ | Existing-site maintenance, troubleshooting and updates | Review, prioritization, targeted fixes and explicit ongoing scope |

Rhode Island, Providence-area and remote service language uses the approved public location/service scope. There is no published storefront/address. Anthony remains a Developer, Designer & Digital Product Builder; the approved four service families and homepage metrics remain intact. Practical budgets and flexible scopes describe a founder-led working model, without price guarantees or claims of being cheapest/best. Portfolio references preserve their classifications; project-specific technologies, maintenance contracts and client outcomes are not inferred.

Content lives in src/data/service-pages.json. Five explicit Astro routes reuse ServiceLanding, Layout, Nova typography/buttons/containers/SmartImage and the existing native FAQ accordion. Explicit route files also survive the existing production page-scoping script; no new route engine or dependencies are introduced. Each page has unique title/description/H1, scope, audience/problems, capabilities, process, real portfolio references, FAQs, related services and project CTA. Its substantial content is in static HTML, including closed FAQ answers. Homepage service-title links provide entry points; related links connect design/development/apps/support and the portfolio/about/intake routes.

## Indexing, sitemap and URL architecture

src/data/global/seo.json now sets index=true, follow=true for intentional production public pages. PUBLIC_PAGE_PATHS in site.config.mjs is the explicit sitemap allowlist: homepage, portfolio, inquiry, privacy, cookies and five services. It excludes admin, token documents, booking, API/Functions, tools, 404 and retired redirects. Sitemap URLs derive from SITE_URL in site.config.mjs.

Layout continues using PUBLIC_SITE_URL (Builds scope) when explicitly provided, otherwise Astro.site/site.config.mjs/company.siteUrl. Production must use https://volatile-solutions.net and no STAGING=true override. Deploy-preview, branch-deploy and .netlify.app metadata origins remain noindex. Do not keep a staging PUBLIC_SITE_URL override on a production build. Canonical, og:url, OG/Twitter image and schema share that origin/base-path. Approved artwork is reused unchanged.

AdminLayout, ProposalLayout and BookingLayout retain their independent noindex/nofollow; invoice uses ProposalLayout. Existing Netlify X-Robots-Tag/no-store/referrer headers and admin role redirects are untouched. No token sharing, public DTO, API authorization, private-record or database changes are made.

Robots allows normal public crawling with User-agent: * / Allow: /. This includes Googlebot, Bingbot and OAI-SearchBot without a more-specific group that accidentally drops private exclusions. Admin/proposal/invoice/book prefixes and API/Netlify/tool paths are disallowed. GPTBot has no new dedicated policy; it continues inheriting the existing wildcard policy. OAI-SearchBot is for ChatGPT Search, independently of GPTBot’s model-training role. CDN/bot-protection settings must also permit verified search crawlers; no firewall setting is changed here. [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots).

Robots controls crawling, not authorization or guaranteed removal from search. A blocked crawler cannot read a page’s noindex directive; preserve token secrecy/admin authentication and existing noindex headers, omit private links from public discovery files, and use Search Console removal tools if an actual previously indexed private URL is discovered. [Google noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

Organization/WebSite schema uses approved identity/contact/assets/socials and the verified founder. Service pages add Service with provider reference, page URL, description and Rhode Island/remote areaServed; no address, coordinates, ratings, prices or invented offers. FAQs are ordinary user-facing HTML, with no rich-result guarantee or special AI markup. Google says its normal SEO fundamentals also apply to AI features; no special AI text file or schema is required. llms.txt is a concise factual public directory, not a guaranteed ranking signal. [Google AI feature guidance](https://developers.google.com/search/docs/appearance/ai-features), [Schema.org Service](https://schema.org/Service).

## After deployment: Google Search Console

1. In an owned account, add/verify the volatile-solutions.net Domain property using the verification Google provides. A Domain property uses DNS verification; a URL-prefix property is an alternative with different verification options. No account or DNS changes are performed by this pass. [Google property setup](https://support.google.com/webmasters/answer/34592).
2. Confirm the deployed homepage and five services return 200, production canonical URLs and index, follow, without a site-protection interstitial. Check the approved OG image and robots.txt.
3. Submit https://volatile-solutions.net/sitemap-index.xml. Inspect the homepage and each service URL; request indexing after the live content is correct. Never submit token/client/admin URLs.
4. Review Page Indexing, Search Performance queries/pages and Core Web Vitals. Investigate actual crawl/indexing problems rather than assuming a sitemap submission guarantees indexing or ranking.

## After deployment: Bing and Copilot

1. Add the production site to an owned Bing Webmaster Tools account and complete its current verification flow, or import an eligible verified Search Console property. Submit the same sitemap and inspect the public URLs. [Bing setup guide](https://blogs.bing.com/webmaster/2025/6/Start-Using-Bing-Webmaster-Tools-to-Improve-Your-Site-Visibility/).
2. Review Search Performance, Site Explorer/URL Inspection and crawl diagnostics. Use AI Performance, where available, to review citations and grounding queries; current preview tooling also includes intent/topic comparisons. Citation activity is not proof of ranking or business results. [Bing AI Performance update](https://blogs.bing.com/search/2026/6/New-AI-Visibility-Insights-in-Bing-Webmaster-Tools-Intents-Topics-Citation-Share-Compare/).
3. Consider IndexNow using the manual process below. No external API is called by the website, visitor requests or current build.

## IndexNow: manual setup, not automatic implementation

Manual setup is the proportionate choice for this small static site. No key/file/submission is created in this pass and no automatic deploy hook is added. Follow the [IndexNow protocol](https://www.indexnow.org/documentation) when ready:

1. Generate a valid public key, for example a 32-character hexadecimal string, and keep it stable. It is a website verification value, not a server credential.
2. Create a UTF-8 public root file named <your-key>.txt containing exactly that key. Deploy it, then verify https://volatile-solutions.net/<your-key>.txt returns that content. Do not add it to a secrets manager or hide the file behind login.
3. Prepare a manual POST to the official IndexNow endpoint with host=volatile-solutions.net, that key, its absolute keyLocation and an explicit urlList. The initial candidate list is the ten public paths in PUBLIC_PAGE_PATHS whose content/schema changed in this pass; submit only after those changes are live. Never include query tokens, admin, proposal, invoice, book or API/Function paths.
4. For subsequent submissions include only actually added/updated/deleted public pages. A deleted URL must be a formerly public page, never a client link. Keep a simple dated record of the URLs submitted; do not resubmit every URL on every build or any visitor request.
5. Check the protocol response; acceptance is not a promise of indexing. A 202 can mean key validation is pending. Fix key/URL errors before retrying and respect rate limits. Continue using the sitemap.

## Monthly evidence-led review

Record the date, public query, service page, impression/click trend and any cited URL. Compare Search Console queries with Bing search/AI grounding queries. Review representative searches such as “web designer Rhode Island,” “small business web designer near Providence,” “affordable web designer Rhode Island” and “custom web app developer Rhode Island.” Test a small set of equivalent ChatGPT/Copilot questions and note whether a citation actually points to this site. Results vary by system/context and should be treated as observations, not proof of authority.

Improve the relevant page when real questions reveal missing scope/process information. Keep content, classifications and contact facts current. Do not fabricate reviews, backlinks, mentions or citations; do not add analytics scripts merely to complete this check.

## Legitimate local discovery

Keep existing professional/social profiles consistent with the public name, founder, website and service descriptions. Consider legitimate local directories only when their membership/eligibility rules are met. Do not create a storefront address. Google Business Profile eligibility depends on actual in-person customer contact, not merely having a Rhode Island location; assess eligibility before creating a profile, and use a truthful service-area model only if eligible. [Google business guidelines](https://support.google.com/business/answer/3038177).

## Useful next content

Prioritize original, evidence-backed material rather than a large generated blog:

1. The Moody Brewer case study with Anthony’s actual contribution, approved screenshots and verified launch details.
2. A Rhode Island small-business website cost guide explaining scope tradeoffs without fabricated prices.
3. A website redesign decision guide: targeted improvements versus a rebuild.
4. A custom web app versus SaaS guide with a practical workflow comparison.
5. A small-business website content/launch checklist.
6. A branding-to-website guide using accurately classified portfolio work.
7. A maintenance planning guide covering access, updates and responsibilities.
8. Rhode Island website examples with client permission and accurate classifications, avoiding location doorway pages.

## Validation recorded for this pass

- Astro/TypeScript: zero errors. Direct static build: 21 pages; no asset generation runs.
- Focused regression: 386 tests across 14 CRM/proposal/invoice/communication/booking/integration/URL/metadata files pass. Separate metadata/URL run: 22 pass. The added metadata test verifies production public indexing and factual Service/provider/founder schema; existing preview/private overrides remain covered.
- Generated HTML inspection: ten indexable public pages, eleven noindex utility/private shells, 27 parsed Organization/WebSite/Service objects, unique public titles/descriptions, production canonical/OG/Twitter/schema origins, and 448 internal page/anchor links checked without missing targets. The sitemap contains exactly PUBLIC_PAGE_PATHS, on the production origin. All five explicit service routes are in the normal build scope. No server-secret identifiers/connection strings appear in browser output.
- The wildcard robots policy allows all ten public paths, including for OAI-SearchBot, and excludes private/API prefixes by longest matching directive. Robots is not used as an authorization control.
- Local Chrome: all five services at 320/375/430/768/1024/1440px (30 checks), no page/content overflow, duplicate IDs or runtime exceptions. Native FAQ keyboard activation, focus retention and static content with page JavaScript disabled pass. Hero/process/work/FAQ captures inspected; approved image fitting/focal position is reused. Additional homepage checks at all six widths confirm approved H1/metrics and four service links; the already reported 22px homepage overflow at 320px remains unchanged and is not introduced by the service pages.
- Portfolio remains 134 entries and all existing portfolio records/assets are unchanged. No original artwork/legacy file, migration, backend Function, admin/document/booking logic, dependency or global design stylesheet changes are made. Polish content and approved metrics are unchanged.
- Anonymous production inspection confirms live canonical/OG/Twitter use volatile-solutions.net and the live OG PNG matches the approved local bytes. **The live homepage still returns noindex, follow at validation time**: this pass changes the repository/build, and public indexing/new pages require deployment. Nothing is deployed and no crawler/indexing/IndexNow request is submitted.
