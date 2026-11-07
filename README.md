# Chillos Ice Cream

Static storefront with menu search, custom portions, a saved basket, and a WhatsApp order request. No dependencies or build step are required.

Run `node preview.cjs`, then open http://127.0.0.1:4173. Run `node check.cjs` for functional regression checks.

Edit `index.html`, `styles.css`, `catalog.js`, and `script.js`. Keep the long-named HTML copy identical to `index.html`; the checks enforce this.

GitHub Pages deployment runs checks before uploading only the public HTML, styles, scripts, logo, and JPG assets. Changes deploy when pushed to `main`.

Checkout prepares a WhatsApp message; customers must send it and confirm price and availability with Chillos. There is no payment or order-management backend.

Customer tools in `customer-tools.js` provide a final review before WhatsApp, opt-in browser storage for contact details, and sharing of basket selections without contact details or notes. Clipboard access has a manual-copy fallback; device sharing appears only when supported. Forget saved details removes the saved customer record without erasing current form entries.

Update `menuHighlights` in `customer-tools.js` to change featured products: use IDs from `catalog.js`, a short label, and optional `starts`/`ends` dates in `YYYY-MM-DD` format. Dates are inclusive in Kigali time. Blank dates mean regular menu picks; expired or unknown products are hidden automatically. The current picks use the owner's confirmation that the regular menu is always available. This is source configuration, not an admin dashboard.

Before release, test on actual iOS and Android phones at narrow widths: browse and filter, customize a mix, edit and clear/undo the basket, choose pickup or delivery, review without sending, share/copy, opt in and reload, then forget saved details and reload. Check the keyboard, dialog scrolling, and a slow network. Connected browser/device testing was unavailable during implementation; automated checks do not replace this visual/device check.
