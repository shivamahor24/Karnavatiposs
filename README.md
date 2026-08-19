# Anndevta — Thali Billing Counter POS

Anndevta is a highly dense, rapid-billing counter Point of Sale (POS) system designed specifically for busy restaurants serving daily-changing Thali and à-la-carte menus. Unlike complex enterprise SaaS systems, Anndevta focuses purely on speed, simplicity, and accuracy for a single cashier on-site.

---

## 🏗️ Architecture Stack

- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI (Dialogs, Cards, Inputs, Tables) + Recharts + Sonner (toasts) + Lucide Icons.
- **Backend**: FastAPI + Motor (Asynchronous MongoDB driver) + PyJWT (JWT Auth) + bcrypt (Hashing) + openpyxl (Excel Exports).
- **Database**: MongoDB (Local or Atlas) storing collections for users, settings, categories, menu items, templates, orders, and atomic receipt counters.

---

## 🌟 Core Features

### 1. Fast Billing Counter
*   **Categories & Items Grid**: Responsive panel displaying categories (Thali, Sabjis, Dals, Breads, Drinks) and quick-tap item tiles.
*   **Dense Cart Layout**: Compact design optimized for quick additions, quantity adjustments, and rapid checkouts.
*   **GST Calculation**: Automated GST calculation using the rate specified in Settings (defaults to 5%).
*   **Auto-Print KOT/Receipt**: Generates standard 80mm thermal CSS/HTML receipts containing header info, cashier details, itemized breakdown, and customized Thali picks.

### 2. Interactive Thali Builder
*   **Rule-Based Assembly**: Dynamically opens an overlay dialog when a Thali item is tapped.
*   **Group Limits**: Guides cashiers to pick the exact number of options allowed under the Thali definition (e.g. choose exactly 2 Sabjis and 1 Dal).
*   **Order-Line Integration**: Captures custom Thali selections on the order document for transparency and printing.

### 3. Daily Menu Templates
*   **Availability Toggle**: One-tap item toggles to mark items as available or out-of-stock for the day.
*   **Named Snapshots**: Save the current menu layout (active/inactive items) as a reusable snapshot (e.g., "Sunday Lunch").
*   **One-Click Load**: Instantly load any saved menu layout with a single click.

### 4. Admin Analytics Dashboard
*   **Key Metrics**: Today, Weekly, and Monthly KPIs for Revenue, Order Count, and Average Order Value.
*   **7-Day Trend Line**: Clean interactive charts showing daily sales patterns.
*   **Top Products & Thalis**: Insights on which items and Thalis are selling best.
*   **Payment Breakdown**: Distribution across Cash, Card, and UPI.

### 5. Sales & Product Reports
*   **Custom Filtering**: Query transactions by Date Range or search for specific receipt numbers.
*   **Format Exports**: One-click downloads of Sales summaries, product counts, and popular Thali selection selections in CSV or Excel (`.xlsx`) formats.

### 6. Role-Based Access Control (RBAC)
*   **Cashier**: Access restricted to **Billing Counter** and **Order History** (reprinting receipts).
*   **Admin**: Full access including Dashboard, daily menu editing, menu database CRUD, reports, settings, and templates.

---

## 🗃️ Database Collections

1.  **`users`**: User records containing role permissions (`admin` or `cashier`), email, name, and hashed passwords.
2.  **`settings`**: Restaurant profiles (name, address, phone, GSTIN, GST rate, receipt footer).
3.  **`categories`**: Menu categories with custom sort orders.
4.  **`menu`**: Active menu items, à-la-carte pricing, and Thali rules.
5.  **`templates`**: Named daily menu configurations.
6.  **`orders`**: Historical records of all placed transactions.
7.  **`counters`**: Atomic receipt numbering sequencer.
