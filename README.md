# 🥩 MeatMart — Full-Stack Fresh Meat & Masalas E-Commerce Platform

A modern, production-grade, full-stack e-commerce platform built for **MeatMart**, a fresh meat and spices delivery business operating in **Kanjikovil, Erode District, Tamil Nadu, India**.

MeatMart delivers farm-fresh country chicken (*Nattu Kozhi*), broiler cuts, boneless fillets, and authentic **Sakthi Masalas** directly to customer doorsteps in 30–45 minutes with live GPS order tracking.

---

## 🌟 Key Platform Highlights

- **Three Dedicated Portals**:
  1. **Customer Portal (`/`)**: Browse 10 product categories, live search autocomplete, custom weight selectors, coupon engine, multi-step checkout, and real-time live map tracking (`/tracking/:id`).
  2. **Delivery Partner Portal (`/delivery`)**: Mobile-first driver dashboard, today's earnings, pickup checklist, turn-by-turn navigation ("Open in Google Maps"), live GPS sharing via Socket.IO, and Proof-of-Delivery OTP verification.
  3. **Admin Control Hub (`/admin`)**: Operations analytics, live driver radar map, product & inventory management with low-stock alerts, order workflow dispatch, delivery zones, and distance pricing configuration.
- **Kanjikovil & Erode Geographic Engine**: Configurable delivery zones for Kanjikovil (`638116`), Perundurai (`638052`), and Chithode (`638102`) with automated road distance calculation and dynamic pricing tiers:
  - 0–3 km: ₹20
  - 3–5 km: ₹30
  - 5–10 km: ₹50
  - Free delivery threshold (e.g., ₹500) and out-of-service-area protection.
- **Real-Time GPS Tracking Architecture**: Powered by authenticated room-based **Socket.IO** events (`join:order-tracking`, `delivery:update-location`, `tracking:location-updated`).
- **Google Maps JavaScript API Integration**: Dynamic map rendering with smooth marker interpolation and automatic fallback to an interactive route simulation if an API key is not configured.
- **Payment Verification**: Server-side HMAC SHA256 signature verification for Razorpay and Cashfree, along with full support for Cash on Delivery (COD).
- **PostgreSQL & Prisma ORM Schema**: 26+ production-ready normalized database models with dual-mode fallback (PostgreSQL when connected, In-Memory repository for zero-setup local evaluation).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, React Router 6, Canvas Confetti |
| **Backend** | Node.js (v20+), Express.js, TypeScript, Socket.IO, JWT, Bcrypt, Zod |
| **Database** | PostgreSQL, Prisma ORM, In-Memory Resilient Adapter |
| **Payments** | Razorpay / Cashfree (server-side verification), Cash on Delivery (COD) |
| **Maps & GPS** | Google Maps JavaScript API, Haversine Distance Engine, HTML5 Geolocation API |
| **Testing** | Jest, Supertest, ts-jest (18 automated integration tests) |

---

## 📁 Repository Structure

```
project/
├── package.json                 # Monorepo root scripts (concurrent dev runner)
├── .env.example                 # Environment variables specification
├── server/                      # Node.js + Express + Prisma + Socket.IO Backend
│   ├── prisma/
│   │   ├── schema.prisma        # 26+ normalized PostgreSQL tables
│   │   └── seed.ts              # Seed script with authentic Kanjikovil meats & Sakthi masalas
│   ├── src/
│   │   ├── config/              # Database connection & initial memory seed
│   │   ├── controllers/         # Auth, Product, Order, Delivery, Admin, Payment controllers
│   │   ├── middleware/          # JWT authentication, role guards (Customer, Delivery, Admin)
│   │   ├── routes/              # REST API endpoints
│   │   ├── services/            # Pricing & distance calculation, payment HMAC verification
│   │   ├── sockets/             # Socket.IO live GPS tracking handlers
│   │   ├── tests/               # 18 automated integration tests
│   │   ├── app.ts               # Express application setup
│   │   └── index.ts             # Server entry point with Socket.IO HTTP server
│   ├── tsconfig.json
│   └── package.json
└── client/                      # React + TypeScript + Tailwind CSS Frontend
    ├── public/
    │   └── logo.svg             # MeatMart logo (meat cut & shopping bag concept)
    ├── src/
    │   ├── components/          # Navbar, ProductCard, CartDrawer, LiveMap, OrderTimeline, Footer
    │   ├── context/             # AuthContext, CartContext
    │   ├── pages/               # HomePage, CatalogPage, ProductDetailPage, CheckoutPage, OrderTrackingPage
    │   ├── pages/delivery/      # DeliveryLoginPage, DeliveryDashboardPage
    │   ├── pages/admin/         # AdminLayout, AdminDashboard, Orders, DeliveriesMap, Products, Settings, Reports
    │   ├── services/            # Fetch API client, Socket.IO client
    │   ├── types/               # TypeScript interfaces
    │   ├── App.tsx              # React Router setup for all 3 portals
    │   └── main.tsx
    ├── tailwind.config.js       # MeatMart brand colors (#C62828 deep red, #2E7D32 fresh green)
    └── package.json
```

---

## 🚀 Quick Start Guide (Local Development)

### 1. Prerequisites
- **Node.js** v20 or v24+
- **npm** v10+

### 2. Install Dependencies
Run the installation command in the root workspace:
```bash
# In project root
npm install

# In server
cd server && npm install

# In client
cd ../client && npm install
```

### 3. Environment Setup
Copy the `.env.example` file to create `.env` in `server/`:
```bash
cp .env.example server/.env
```

### 4. Run the Full-Stack Application
Start both the backend server (port 5000) and frontend client (port 5173) concurrently:
```bash
# From project root:
npm run dev
```

Or run them in separate terminals:
- **Terminal 1 (Backend)**: `cd server && npm run dev`
- **Terminal 2 (Frontend)**: `cd client && npm run dev`

Open your browser at:
👉 **Customer Portal**: [http://localhost:5173](http://localhost:5173)  
👉 **Delivery Partner Portal**: [http://localhost:5173/delivery](http://localhost:5173/delivery)  
👉 **Admin Control Hub**: [http://localhost:5173/admin](http://localhost:5173/admin)  

---

## 🔑 Pre-Configured Test Accounts

The platform includes seed credentials for rapid testing of all three portals (one-click prefill buttons are also available in the login modal):

| Portal | Role | Phone Number | Password | Name |
|---|---|---|---|---|
| **Customer Portal** | `CUSTOMER` | `9876543210` | `Password@123` | Karthik Ramasamy |
| **Delivery Portal** | `DELIVERY_PARTNER` | `9876543211` | `Delivery@123` | Muthu Vel |
| **Admin Portal** | `ADMIN` | `9876543212` | `Admin@123` | Senthil Kumar (Store Manager) |

---

## 🧪 Automated Testing

Run the full integration test suite covering RBAC, stock validation, delivery fee algorithms, order placement, payments, and live GPS authorization:

```bash
cd server
npm test
```

**Results**: 18/18 tests passing:
- ✅ Accurate road distance calculation with Kanjikovil coordinates
- ✅ Distance-based delivery fee calculations (₹20, ₹30, ₹50 tiers)
- ✅ Free delivery threshold validation
- ✅ Out-of-service-area rejection
- ✅ JWT Authentication & Role-Based Access Control
- ✅ Product catalog & Sakthi Masala listing
- ✅ Stock validation and price snapshotting
- ✅ Gateway payment creation and signature verification
- ✅ Delivery partner assignment and pickup workflow
- ✅ Proof-of-Delivery OTP verification and delivery completion

---

## 🗄️ PostgreSQL Database & Prisma Migration

When running against a live PostgreSQL instance:
1. Set your PostgreSQL connection string in `server/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/meatmart_db?schema=public"
   ```
2. Generate Prisma Client:
   ```bash
   cd server
   npm run prisma:generate
   ```
3. Push schema migrations:
   ```bash
   npm run prisma:push
   ```
4. Seed database:
   ```bash
   npm run db:seed
   ```

*Note: If PostgreSQL is not running, MeatMart automatically uses its built-in in-memory repository initialized with the same authentic data.*

---

## 🌐 Production Deployment

### Backend (Node.js/Express)
1. Build TypeScript:
   ```bash
   cd server && npm run build
   ```
2. Start in production mode:
   ```bash
   NODE_ENV=production npm start
   ```

### Frontend (Vite/React)
1. Build static production assets:
   ```bash
   cd client && npm run build
   ```
2. Serve the `client/dist` directory using Nginx, Cloudflare Pages, Vercel, or serve it directly from the Express backend via `express.static`.

---

## 📍 Business Location

- **Store**: MeatMart Fresh Meats & Spices
- **Address**: Main Road, Near Bus Stand, Kanjikovil, Erode District, Tamil Nadu — 638116
- **Phone**: +91 98427 12345
- **Operating Hours**: 06:30 AM – 09:30 PM (7 days a week)
