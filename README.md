# OmniRide — 100% Zero-Emission Mobility Platform

> An AI-powered, full-stack ride-hailing & logistics dashboard aggregating electric-only mobility providers (RoamAir, Spiro, BasiGo, Ampersand, Kiri EV, SolarTaxis & more) with blockchain carbon tracking, DeFi wallet, IoT telemetry and Gemini AI integration.

---

## 📁 Project Structure

```
omniride/
├── src/                          # Frontend source (React + TypeScript + Vite)
│   ├── components/               # All UI React components (36 files)
│   │   ├── AdminInterface.tsx    # Super-admin control panel (RBAC, fleet, finance)
│   │   ├── App.tsx               # Root application component
│   │   ├── AuthScreen.tsx        # Login / registration / KYC flow
│   │   ├── BookingCheckout.tsx   # Ride booking confirmation & payment
│   │   ├── BusinessPortal.tsx    # Corporate fleet & employee management
│   │   ├── CarbonWallet.tsx      # Carbon credit token wallet
│   │   ├── ChargingStationHub.tsx# EV battery swap & charging stations
│   │   ├── ChatInterface.tsx     # AI-powered chat interface
│   │   ├── DeliveryDashboard.tsx # Parcel delivery booking
│   │   ├── DeliveryTracking.tsx  # Real-time delivery tracking
│   │   ├── EnergyPortal.tsx      # Rider energy management & swap stations
│   │   ├── ErrandPortal.tsx      # Dedicated errand rider booking
│   │   ├── FoodDashboard.tsx     # Restaurant discovery & food ordering
│   │   ├── InsuranceCenter.tsx   # Rider insurance & asset loan management
│   │   ├── MapView.tsx           # Leaflet interactive map
│   │   ├── MechanicDashboard.tsx # Nearby EV mechanic finder
│   │   ├── NotificationOverlay.tsx# Toast notifications
│   │   ├── NotificationTray.tsx  # Notification history tray
│   │   ├── OrderHistory.tsx      # Unified order/ride/errand history
│   │   ├── OrderTracking.tsx     # Live order status tracker
│   │   ├── PaymentGateways.tsx   # M-Pesa, Stripe, PayPal, OmniWallet
│   │   ├── ProfileEditor.tsx     # User profile & settings editor
│   │   ├── PromoCenter.tsx       # Coupons & promotional offers
│   │   ├── ReportingCenter.tsx   # Analytics & report generation
│   │   ├── RestaurantMenu.tsx    # Menu browsing & cart management
│   │   ├── RideComparison.tsx    # Side-by-side EV provider comparison
│   │   ├── RiderDashboardAnalytics.tsx # Rider performance analytics
│   │   ├── RiderJobTasks.tsx     # Rider job queue & task management
│   │   ├── RiderPortal.tsx       # Rider mission control dashboard
│   │   ├── RiderWalletHub.tsx    # Rider earnings & wallet
│   │   ├── RideSelector.tsx      # EV ride option selector with coupons
│   │   ├── SupportCenter.tsx     # Customer support portal
│   │   ├── SupportChat.tsx       # AI-powered live support chat
│   │   ├── UserWallet.tsx        # User OmniWallet & top-up
│   │   ├── VendorPortal.tsx      # Restaurant/vendor management dashboard
│   │   └── VendorSecurity.tsx    # Vendor MFA & security settings
│   │
│   ├── services/                 # Business logic & API services (12 files)
│   │   ├── api.ts                # Core localStorage data store & OmniAPI
│   │   ├── auditService.ts       # Audit trail & compliance logging
│   │   ├── blockchainService.ts  # Carbon token blockchain simulation
│   │   ├── carbonRegistryService.ts # Carbon credit registry
│   │   ├── defiService.ts        # DeFi trading & liquidity pools
│   │   ├── geminiService.ts      # Google Gemini AI integrations
│   │   ├── i18n.ts               # Multi-language support (EN/ES/FR/ZH)
│   │   ├── iotService.ts         # IoT vehicle telemetry service
│   │   ├── paymentService.ts     # Payment gateway integrations
│   │   ├── rbacService.ts        # Role-based access control
│   │   ├── reportingService.ts   # Analytics & report generation
│   │   └── vendorService.ts      # Vendor operations service
│   │
│   ├── App.tsx                   # (copied — see components/App.tsx)
│   ├── index.tsx                 # React entry point
│   ├── index.html                # HTML shell with Tailwind CDN
│   ├── types.ts                  # Full TypeScript type definitions
│   ├── constants.tsx             # Mock data & constants
│   ├── tsconfig.json             # TypeScript config (src scope)
│   └── vite.config.ts            # (root vite.config.ts is used)
│
├── server/                       # Node.js Express proxy server
│   ├── server.js                 # Gemini API proxy + WebSocket relay
│   ├── package.json              # Server dependencies
│   └── public/
│       ├── service-worker.js     # PWA service worker
│       └── websocket-interceptor.js # WS interceptor for proxy routing
│
├── public/                       # Static assets served at root
├── dist/                         # Production build output (auto-generated)
│
├── package.json                  # Frontend dependencies & scripts
├── vite.config.ts                # Vite build configuration
├── tsconfig.json                 # Root TypeScript configuration
├── .env.local                    # Environment variables (API keys)
├── .gitignore                    # Git ignore rules
├── Dockerfile                    # Docker multi-stage build
└── README.md                     # This file
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ ([download](https://nodejs.org))
- **Gemini API Key** ([get one free](https://aistudio.google.com/app/apikey))

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..
```

### 2. Configure Environment

Edit `.env.local` and replace the placeholder with your real API key:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Run Development Server

```bash
npm run dev
```
App opens at **http://localhost:3000**

### 4. Build for Production

```bash
npm run build
```
Output goes to `dist/`. Then serve via the proxy server:

```bash
npm run server
```

---

## 🧪 Demo Accounts

On the Auth screen you can register or use any email. For specific roles, register with these patterns and the admin can promote roles:

| Role      | How to Access                             |
|-----------|-------------------------------------------|
| **User**  | Register with any email                   |
| **Rider** | Register, then admin promotes to `rider`  |
| **Vendor**| Register, then admin promotes to `vendor` |
| **Business**| Register, then admin promotes to `business` |
| **Admin** | Register with email containing `admin`    |

---

## 🌍 Features

| Module | Description |
|--------|-------------|
| 🚗 **Ride Booking** | Book EV rides from 10 providers (Uber Electric, Bolt Green, RoamAir, Spiro, BasiGo, Ampersand, Kiri EV, SolarTaxis, Grab EV, YnaV1) |
| 🤖 **AI Routing** | Gemini AI calculates real road distances, suggests routes, and matches riders |
| 🗺️ **Live Map** | Leaflet.js interactive map with pickup/destination markers |
| 🍔 **Food Delivery** | Browse restaurants, manage cart, place & track food orders |
| 📦 **Parcel Delivery** | Send/receive parcels with KYC-verified contacts |
| 🛒 **Errand Service** | Hire dedicated riders for hourly/half-day/full-day errands |
| 🔋 **Energy Hub** | Battery swap station discovery, booking & payment (90/10 revenue split) |
| 🏍️ **Rider Dashboard** | Mission feed, job tasks, telemetry analytics, earnings wallet |
| 🏢 **Business Portal** | Corporate fleet management, employee accounts, dedicated riders |
| 🛒 **Vendor Portal** | Restaurant menu management, order fulfilment, revenue tracking |
| 🛡️ **Admin Interface** | Full RBAC, fleet config, pricing control, audit logs, finance reserve |
| 💰 **OmniWallet** | Multi-currency wallet with M-Pesa, Stripe, PayPal, Visa/MC top-up |
| 🌱 **Carbon Wallet** | Blockchain carbon credit tracking, DeFi trading |
| 📊 **Analytics** | Rider performance, business KPIs, reporting centre |
| 🌐 **i18n** | English, Spanish, French, Chinese |

---

## 🐳 Docker Deployment

```bash
docker build -t omniride .
docker run -p 3000:3000 -e GEMINI_API_KEY=your_key omniride
```

Or with Docker Compose:

```yaml
version: '3'
services:
  omniride:
    build: .
    ports:
      - "3000:3000"
    environment:
      - GEMINI_API_KEY=your_key_here
```

---

## ☁️ Google Cloud Run Deployment

```bash
# Create secret for API key
echo -n "${GEMINI_API_KEY}" | gcloud secrets create gemini_api_key --data-file=-

# Deploy to Cloud Run
gcloud run deploy omniride \
  --source=. \
  --update-secrets=GEMINI_API_KEY=gemini_api_key:latest \
  --region=us-central1
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5.8, Vite 6 |
| Styling | Tailwind CSS (CDN), Custom CSS |
| Maps | Leaflet.js 1.9.4 |
| Icons | Lucide React |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| State | React useState/useEffect (localStorage persistence) |
| Server | Node.js, Express 4, WebSocket (`ws`) |
| Deployment | Docker, Google Cloud Run |

---

## 📄 License

Private — OmniRide Platform © 2025
