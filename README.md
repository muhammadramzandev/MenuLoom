# MenuLoom – QR Menu SaaS
Site + payments webhook: Cloudflare Pages (free). Login, sign-up and ALL restaurant data: Firebase (free Spark plan). Photos: Cloudinary (optional).

## Folder layout
- `public/` = the whole website (this is what Cloudflare publishes). `config.js`, all html, `_redirects`, `_headers` live here.
- `functions/api/paddle.js` = the payment webhook (Cloudflare Pages Function, URL: `/api/paddle`). No npm packages needed.
- `docs/` = SEO notes (not published). `firestore.rules` = Firebase rules (not published).

## 1. Firebase (data only)
- Authentication: enable Email/Password and Google. Authentication > Settings > Authorized domains: add your Cloudflare domain (`yourproject.pages.dev` AND your custom domain, e.g. `menuloom.online` and `www.menuloom.online`).
- Firestore > Rules: paste firestore.rules and Publish (or `firebase deploy --only firestore`). Publish again after every update of this folder.
- Project settings > Service accounts > Generate new private key (needed for payments, step 3).

## 2. Cloudflare Pages deploy (GitHub recommended, or CLI)
GitHub: push this folder > Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git. Framework: None. Build command: empty. **Build output directory: `public`**.
CLI: `npm install && npx wrangler login && npx wrangler pages deploy --project-name menuloom` (wrangler.toml already points to `public`).
Plain drag-and-drop of the `public` folder works for the static site only; payments need the `functions` folder, so use GitHub or CLI.

## 3. Cloudflare secrets (Workers & Pages > your project > Settings > Variables and Secrets)
Add as type **Secret**: `FIREBASE_SERVICE_ACCOUNT` (whole .json content) and `PADDLE_WEBHOOK_SECRET` (from Paddle, step 4). Add them for Production (and Preview if you test there). Then Deployments > Retry deployment / push a new commit, because secrets apply only to new deployments.

## 4. Payments: Paddle only (card form is embedded in the dashboard)
Plans (USD, auto-renewing, edit amounts in public/config.js `PLANS` and in Paddle): 1 month $10, 6 months $51 (save 15%), 12 months $90 (save 25%).
1. Create a Paddle account. Start in **Sandbox** (sandbox-vendors.paddle.com), go live later.
2. Catalogue > Products: create product "MenuLoom Pro" with 3 **recurring** prices in USD: every 1 month ($10), every 6 months ($51), every 1 year ($90). Copy the 3 price ids (pri_...).
3. Developer tools > Authentication > **Client-side token** (test_... in sandbox, live_... in production). Copy it.
4. Developer tools > Notifications > New destination: URL `https://YOURSITE/api/paddle`, events: `transaction.completed`, `subscription.created`, `subscription.activated`, `subscription.updated`, `subscription.resumed`, `subscription.paused`, `subscription.canceled`, `subscription.past_due`. Copy its **Secret key** into the Cloudflare secret `PADDLE_WEBHOOK_SECRET`.
5. Checkout > Checkout settings > Default payment link: `https://YOURSITE/dashboard` (also add your domain under approved domains before going live).
6. In `public/config.js` set `PADDLE_ON=true`, `PADDLE_ENV`, `PADDLE_TOKEN` and the 3 `price` ids, then redeploy. Test in sandbox with card 4242 4242 4242 4242 (any future date, any CVC).
7. Going live: switch Paddle to live, create the 3 prices + token + webhook again in live, set `PADDLE_ENV="production"`, new token/ids in config.js, new secret in Cloudflare.
How it works: owner picks a plan in Billing, the Paddle card form opens inside the page, the owner enters card details and confirms; Paddle calls /api/paddle, the Cloudflare function verifies the signature and sets plan=pro until the paid period ends (+2 days grace). Renewals extend it automatically. Owner can cancel from the "Manage or cancel subscription" link.
Publish the new firestore.rules (adds the private `subscriptions` collection).
## 5. Before you go live: replace these placeholders (search & replace in all files inside `public/`)
- `config.js`: CONTACT_EMAIL, CONTACT_WA, CONTACT_WAN (shown in the dashboard Contact page)
- `www.menuloom.online` -> your real domain (html files, robots.txt, sitemap.xml)
- `support@YOURDOMAIN.com` -> your support email (contact.html, terms.html, privacy.html)
- `+92 300 0000000` and `923000000000` -> your WhatsApp number (contact.html)
- Terms & Privacy are templates: add your company details and have a lawyer review them.
- Photos: Cloudinary unsigned preset -> CLOUD_NAME / PRESET in config.js (otherwise small photos are stored in Firestore).

## What owners get
- Sign-in / sign-up page with benefits panel, show-password button, terms checkbox, 7 languages.
- Step-by-step onboarding: business type (restaurant, cafe, bar, hotel, bakery, fast food, food truck, resort, other), name, country, menu language, link name, WhatsApp, Google review link (optional), where orders go (Dashboard / WhatsApp / Both), currency.
- Dashboard: on phones the menu is a hamburger button that opens the menu list (all items the same size); on desktop a side menu. Pages: Overview, Dishes, Orders, Table QR, Analytics (line chart, orders by hour, sales per day, top dishes), Reviews, Profile, Billing, Feedback, Contact us. Free accounts see a lock on Orders, Table QR, Analytics, Reviews; Pro accounts have no locks.
- Returning owners are sent straight to their dashboard; only Log out brings back the sign-in page.
- Owners can rate MenuLoom (Feedback): shown on the home page with business name, type and country; nothing is shown when there is no feedback. Admin can delete any feedback in /admin.

## Menu page (guests)
- Phone-language menu (7 languages), dish/description/restaurant name translations, search, categories, cart, table QR (?t=5).
- Free: view only, 10 dishes, MenuLoom branding. Pro: ordering, themes, reviews, Google badge + "Review us on Google" button.
- Orders go where the owner chose: Dashboard only (thank-you message for the guest), WhatsApp (text in the menu language) or both. On Pro, EVERY order is also saved in the dashboard Orders box (sound alert, order list, analytics), even when it is sent to WhatsApp.
- Google rating: Google does not allow reading ratings without a paid Places API key, so the owner types the rating and review count in Profile; the review link comes from Google Business Profile > Ask for reviews. Guests who leave 4-5 stars are invited to review on Google too.

## Site
- Landing pages in 7 languages (/, /ur, /ar, /zh, /hi, /es, /fr) with instant QR generator, demo menu in the page language, features, pricing, FAQ, testimonials (only when feedback exists), hreflang, sitemap, structured data, Open Graph image.
- /terms, /privacy, /contact (messages arrive in /admin). A Terms & Privacy notice is shown to every new visitor (7 languages) and accepted with one click.
- Admin (/admin, your admin email only): restaurants, payments, revenue, feedback, contact messages, sitemap download.

## Local testing
Static: `npx serve public` (menu links use menu.html?r=name on localhost). With payments: copy `.dev.vars.example` to `.dev.vars`, fill it, then `npm install && npm run dev` (http://localhost:8788).

## Language switch
Changing the language inside the dashboard translates it instantly (no reload, no sign-in page). The sign-in page shows Terms, Privacy and Contact links.

## Dashboard details
- Cards in every row have the same height (overview, dishes, profile, analytics, billing, feedback, contact). Nothing is wider than the phone screen (tested at 360px).
- Dishes: search box finds a dish by name, category or translation, then Edit/Sold out/Delete work from the result.
- Orders (Pro): tabs New / All / Done with counts, a red NEW badge on every new order, a number badge on the Orders menu item, a highlight animation for orders that arrive while the page is open, plus sound and browser notification.
- The + signs in the landing-page demo menu are only decoration.


## SEO launch
See `SEO-LAUNCH-CHECKLIST.md` for the implemented multilingual hreflang setup, sitemap coverage, canonical/domain replacement, Search Console submission, and ongoing SEO actions. Search ranking cannot be guaranteed; publish useful localized content and earn relevant links over time.

## Brand name: MenuLoom
The product is called **MenuLoom**. Before launch: check that the domain (menuloom.com / .app / .io) and the trademark are free in your country, then buy the domain. If you ever rename again, search & replace "MenuLoom" in all files and rebuild og-image.png and the icons.

## Languages (how they are organised)
- **7 full languages** (landing pages, dashboard, guest menu, contact, notice): English, Urdu, Arabic, Chinese, Hindi, Spanish, French.
- **17 more languages for guests and countries**: German, Italian, Japanese, Korean, Dutch, Polish, Portuguese, Swedish, Norwegian, Danish, Finnish, Czech, Greek, Hebrew, Estonian, Icelandic, Traditional Chinese. They cover the guest menu (all texts, WhatsApp order text, reviews, "Review us on Google"), the Terms/Privacy notice and a local-language page for the main countries that speak them: `/qr-menu-germany-de`, `-austria-de`, `-switzerland-de`, `-italy-it`, `-japan-ja`, `-south-korea-ko`, `-netherlands-nl`, `-belgium-nl`, `-poland-pl`, `-portugal-pt`, `-brazil-pt`, `-sweden-sv`, `-norway-no`, `-denmark-da`, `-finland-fi`, `-czechia-cs`, `-greece-el`, `-cyprus-el`, `-israel-he`, `-estonia-et`, `-iceland-is`, `-taiwan-zt`, `-hong-kong-zt` (each has hreflang to the English country page and back).
- Owners choose their menu language from all 24, and can type dish/restaurant name translations for the other 23. The dashboard itself stays in the 7 full languages (a German owner sees it in English).
- Phone language is detected automatically (including zh-TW/zh-HK -> Traditional Chinese, nb/nn -> Norwegian).
- **To add another language:** (1) i18n.js: add an entry to `T` with the 14 guest keys (search, order, table, sold, empty, nomatch, nf, ua, tp, c_txt, c_btn, terms, privacy, n_contact), add its value to the 12 guest rows of `D` (place, order_ok, rev_title, rev_name, rev_text, rev_send, rev_thanks, g_btn, g_thanks, wa_new, wa_total, scan) and add it to `ML`; (2) site.js: add the 4 notice texts; (3) optional: copy one local country page and translate it, add it to sitemap.xml and _redirects.

## Announcements (admin -> owners)
/admin > "Announcements to owners": title, message, type (info / offer / important), who sees it (all / Free / Pro), owner language (all or one) and an expiry in days. It shows at the top of every owner's dashboard (they can close it) and in their Announcements page, with a count badge. Turn off or delete any time. Publish the new firestore.rules first.

## Footer
One footer on every public page: brand + description, Product, Solutions, Company, Languages, all 47 countries, local-language pages, copyright. It is full width and responsive.

## Update log (MenuLoom rebrand)
- Brand renamed to **MenuLoom** everywhere; new 🍽️ plate logo (header, footer, dashboard, favicon, app icons, og-image).
- Header is responsive down to 320px.
- Footer rebuilt on all pages (logo, feature pills, link groups, country chips, language chips, legal row).
- "Log in" opens the Sign in view and "Start free / Create ..." opens the Create account view (`/dashboard?m=in` / `?m=up`); the heading and form change when the tabs are clicked.
- Guest menu page: "Welcome to <name>", **Menu** / **Reviews** buttons under the name (Menu is default; reviews no longer sit below the dishes). Pro plan only, because reviews are a Pro feature.

## Update log (round 2)
- Orders 🔒 in the free-plan sidebar now sits at the end of the row like the other locked items.
- Business logo: asked in the setup wizard (step 2) and editable in Restaurant profile. Shown on the guest menu page and in the dashboard (sidebar, mobile bar, overview). It is printed in the middle of QR codes only on the Pro plan.
- Sign in / Create account / Google buttons show a spinner + "Signing in…" / "Creating account…" while working.
- Owner feedback is no longer shown on the home page automatically. In Admin → "Feedback from owners" press **Approve** to publish it (or **Hide**). Editing a feedback by the owner makes it pending again. Old feedback without approval stays hidden until approved.
- **IMPORTANT:** publish the new `firestore.rules` (Firebase console → Firestore → Rules, or `firebase deploy --only firestore:rules`), otherwise the approval rule is not active.
