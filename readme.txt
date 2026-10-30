FLIPPED DOUGH DIGITAL MENU — QUICK START

FILES
- index.html: responsive menu and WhatsApp ordering app.
- menu.json: the menu items, prices, exchange rate and maximum delivery time. Edit prices here — both the menu page and the AI waiter read from this file.
- netlify/functions/waiter.mts: the AI waiter that answers customer questions about prices, delivery time and food items.

HOW IT WORKS
1. Open the published site (or run `netlify dev`) to preview the menu. The menu now loads from menu.json, so opening index.html directly as a local file will not show items.
2. Customers add menu items, enter name, phone and delivery address, then tap Send order to WhatsApp.
3. WhatsApp opens with a prepared message to 96170321545. The customer must press Send in WhatsApp to confirm.

PRICING RULES CURRENTLY CONFIGURED
- USD items: menu price × 90,000 LBP.
- Manakish and drinks: listed number × 1,000 LBP.
- Mini 12-piece items are configured as USD because the menu image shows prices 4–8 without a currency symbol but in the same style as the dollar-priced menu. Please verify this assumption before publishing.
- Exchange rate: $1 = 90,000 LBP.
- WhatsApp destination: 96170321545 (Lebanon country code +961).

IMPORTANT
This is a static web app; it does not store orders in a database and does not send silently in the background. It opens WhatsApp with a pre-filled order so the customer can review and press Send. QR generation requires internet access and a publicly hosted URL.
