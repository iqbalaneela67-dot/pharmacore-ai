# PharmaCore AI — Pro Pharmacy Management System v2.0

A complete, production-ready pharmacy management system built with React.

## 🚀 Features

| Module | Features |
|--------|---------|
| **Dashboard** | Live metrics, Sales/Purchase trend chart, Category stock chart, Stock alerts, Recent transactions |
| **Inventory** | Add/Edit/Delete medicines, Search & filter, Low stock highlights, Expiry tracking, CSV & PDF export |
| **Sales** | Sales list with search/filter, Print invoice, **Sale Return** (increases stock) |
| **Purchases** | Purchase list, **Purchase Return** (decreases stock) |
| **Billing** | Full billing screen, Barcode scanner integration, Discount, Payment modes, Print invoice, History |
| **Returns** | Unified returns log with stock effect tracking, Export CSV |
| **Reports** | Revenue/Purchase charts, Top sellers, Expiry report, Export |
| **Scanner** | Barcode lookup, Simulate scan, Add directly to bill |

## 📦 Installation

```bash
# 1. Extract the zip file
unzip pharmacore-ai.zip
cd pharmacore-ai

# 2. Install dependencies
npm install

# 3. Start development server
npm start
# Opens at http://localhost:3000
```

## 🏗️ Build for Production (Vercel)

```bash
npm run build
```

Then deploy the `build/` folder to Vercel.

### Deploy to Vercel (one command)
```bash
npm install -g vercel
vercel --prod
```

## 🗄️ Connecting a Real Database (Supabase)

To replace dummy data with a real database:

1. Create a free project at [supabase.com](https://supabase.com)
2. Install: `npm install @supabase/supabase-js`
3. Create a `src/lib/supabase.js`:

```js
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
)
```

4. Replace `useState(initialDB)` in `App.jsx` with Supabase queries.

### Suggested tables:
- `medicines` — inventory
- `sales` — sale transactions
- `purchases` — purchase orders
- `bills` — billing records
- `sale_returns` — sale return log
- `purchase_returns` — purchase return log

## 📱 Barcode Scanner (Hardware)

The app is ready for real barcode scanners. USB/Bluetooth barcode scanners work as keyboard input — they type the barcode and press Enter. The scanner input field handles this automatically.

For camera-based scanning, install:
```bash
npm install @ericblade/quagga2
```

## 📁 Project Structure

```
src/
├── App.jsx              # Main app, routing, global state
├── index.js             # React entry point
├── index.css            # Global styles
├── data/
│   └── db.js            # Data store, helpers, constants
├── components/
│   ├── Sidebar.jsx      # Navigation sidebar
│   ├── Topbar.jsx       # Top bar with actions
│   ├── MedicineModal.jsx # Add/Edit medicine
│   ├── SaleModal.jsx    # Quick new sale
│   ├── PurchaseModal.jsx # Quick new purchase
│   ├── ScannerModal.jsx # Barcode scanner
│   ├── PrintModal.jsx   # Invoice print
│   └── ui.jsx           # Shared: badges, export, Empty
└── pages/
    ├── Dashboard.jsx
    ├── Inventory.jsx
    ├── Sales.jsx
    ├── Purchases.jsx
    ├── Billing.jsx
    ├── Returns.jsx
    └── Reports.jsx
```

## 🛠️ Tech Stack

- **React 18** — UI framework
- **Chart.js 4** — Dashboard & report charts
- **jsPDF + autoTable** — PDF export
- **Inter font** — Typography
- **Tabler Icons** — Icon set
- **CSS Variables** — Theming (dark mode ready)

## 🌙 Dark Mode

Dark mode is automatic via `prefers-color-scheme` CSS media query.

---

Made with ❤️ — PharmaCore AI v2.0 Pro
