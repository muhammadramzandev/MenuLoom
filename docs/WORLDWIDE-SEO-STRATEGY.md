# MenuLoom — Worldwide Country SEO & Keyword Position Plan

Prepared: 30 October 2026. Scope: 47 country-targeted English landing pages (7 existing markets plus 40 additional markets). Existing app functionality and `app.css` were not modified.

## Market selection

The expansion prioritizes markets classified as high-income by the World Bank and commercially relevant hospitality markets: United States, United Kingdom, Canada, Australia, Germany, France, Switzerland, Netherlands, Singapore, Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, Oman, Ireland, New Zealand, Japan, South Korea, Nordics, Benelux, selected EU markets, Hong Kong, Taiwan, Israel, South Africa and selected Latin American markets. The World Bank's current income-group classification is the authoritative basis for the high-income label; this plan does not claim these markets have the highest QR-menu search demand.

Source: World Bank country and lending groups: https://datahelpdesk.worldbank.org/knowledgebase/articles/906519-world-bank-country-and-lending-groups

## Keyword clusters and page intent

| Cluster | Search intent | Example keywords | Destination |
|---|---|---|---|
| Core product | Create / compare | qr menu, qr code menu, qr menu generator, digital menu maker | Homepage + free generator |
| Restaurant software | Commercial | restaurant QR menu, digital menu for restaurants, QR menu software | /qr-menu-for-restaurants |
| Country modifiers | Commercial/local | QR menu [country], restaurant QR menu [country], digital menu [country] | Country page |
| Cafe / hospitality | Commercial | cafe QR menu, digital menu for cafes, hotel QR menu | Cafe page + future hotel page |
| Informational | Learn | how to create a QR menu, how to update a restaurant menu online, QR menu vs printed menu | Blog guides to publish |

## Country-specific keyword map

Each country's page includes a unique primary keyword and secondary phrase set. Open `COUNTRY-KEYWORD-RANK-TRACKER.csv` for the complete country-by-country mapping. Search volumes and current positions are deliberately blank because they must be collected from Google Keyword Planner and Search Console for the selected country. Target positions are goals, not measured rankings or promises.

## Position tracking method

1. Verify production domain and deploy all pages.
2. Add the domain property in Google Search Console and submit `/sitemap.xml`.
3. In Search Console Performance, filter by country and page; record query, impressions, clicks, CTR and average position.
4. Use Google Keyword Planner with each target country selected to validate local wording, volume and competition.
5. Update `COUNTRY-KEYWORD-RANK-TRACKER.csv` monthly. Track current position separately from target position.
6. Improve pages with impressions but low CTR, or average position 5–20; avoid creating near-identical pages solely to multiply URLs.

## Competitor set and gap themes

- MENU TIGER — https://www.menutiger.com/
- Menubly — https://menubly.com/
- FineDine — https://www.finedine.co/
- UpMenu — https://www.upmenu.com/
- GloriaFood — https://www.gloriafood.com/
- QR TIGER — https://www.qrcode-tiger.com/
- Uniqode — https://www.uniqode.com/
- NordQR — https://nordqr.com/

Opportunity themes for MenuLoom: simple menu publishing, no-app browser access, menu edits without reprinting QR artwork, cafe/restaurant-specific education, honest feature comparisons, and clear explanation of what a menu publisher does not replace (POS, payments, delivery marketplace). Do not claim feature superiority without a verified product comparison.

## Important SEO quality safeguards

- Country pages are English-language pages targeting English queries in those markets; they are not translations. Add real local-language versions only after professional translation and QA.
- Local examples are geographic context, not claims of local offices or customers.
- No fake search volumes, CPC, backlinks, testimonials or live rankings are included.
- `hreflang` helps search engines choose a relevant language/region URL; it does not boost a page to position #1.
- Country pages need unique local proof and usefulness over time (examples, FAQs, screenshots, pricing/currency only if supported, customer case studies). Thin pages can be ignored or treated as doorway-like content.
- Replace the Firebase Hosting URL in canonical tags, hreflang, sitemap, Open Graph and structured data when the final custom domain is configured.

## Technical work included in this ZIP

- Added 40 additional country landing pages using the existing visual design system and shared `/app.css`.
- Added reciprocal country hreflang links to all country pages, plus `x-default`.
- Added clean routes in Cloudflare Pages `_redirects`.
- Added country pages to XML sitemap with reciprocal XHTML hreflang alternates.
- Expanded the homepage country directory without changing the application's CSS or JavaScript.
- Added `COUNTRY-KEYWORD-RANK-TRACKER.csv` and this research/implementation note.

## Ranking expectation

No developer can guarantee #1 positions in every country. Rankings depend on query demand, competition, domain authority, content quality, user experience, backlinks, indexing and ongoing improvements. Treat the target positions as planning goals only.
