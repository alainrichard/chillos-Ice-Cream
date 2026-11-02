# Chillos Ice Cream

Static storefront with menu search, custom portions, a saved basket, and a WhatsApp order request. No dependencies or build step are required.

Run `node preview.cjs`, then open http://127.0.0.1:4173. Run `node check.cjs` for functional regression checks.

Edit `index.html`, `styles.css`, `catalog.js`, and `script.js`. Keep the long-named HTML copy identical to `index.html`; the checks enforce this.

GitHub Pages deployment runs checks before uploading only the public HTML, styles, scripts, logo, and JPG assets. Changes deploy when pushed to `main`.

Checkout prepares a WhatsApp message; customers must send it and confirm price and availability with Chillos. There is no payment or order-management backend.
