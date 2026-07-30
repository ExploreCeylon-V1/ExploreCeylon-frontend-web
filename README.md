# 🏝️ ExploreCeylon — Traveler Frontend

**React + Vite Web App for Sri Lanka's AI-Powered Tourism Platform**

Group 4 · COM3b33 · University of Ruhuna · 2026

<p>
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind%20CSS-4-38BDF8?logo=tailwindcss&logoColor=white">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript&logoColor=black">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-yellow.svg">
</p>

> ℹ️ `package.json` currently pins **React 19.2.6** (`react` / `react-dom` `^19.2.6`), not React 18 — the badge above reflects the real installed version.

---

## 📑 Table of Contents

- [Project Overview](#-project-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Pages & Routes](#-pages--routes)
- [Context / State Management](#-context--state-management)
- [Payment Flow](#-payment-flow)
- [Design System](#-design-system)
- [License](#-license)

---

## 📖 Project Overview

This is the traveler-facing web app for ExploreCeylon — a React 19 + Vite single-page app that lets visitors discover Sri Lanka, plan trips, and book local vehicles and tour guides, backed by the [ExploreCeylon Spring Boot API](../ExploreCeylon-backend).

**Key user-facing features:**

- 🔐 Email/password + Google OAuth login, registration, forgot-password/OTP reset flow
- 🗺️ Browse destinations and AI-curated **hidden gems**, with reviews and a "submit your own gem" flow
- 🧳 Create and manage multi-day **trips**, including AI-generated itineraries and a shareable trip map
- 💰 Per-trip **budget tracker**
- 🚙 Browse and book **local vehicles** (tuk-tuks, cars, vans) with a global cart
- 🧭 Browse and book **tour guides**, with reviews and availability checks
- 📅 Cultural/seasonal **events** calendar synced to trip dates
- 🏨 **Hotel search** panel
- 💳 4-step booking flow with **PayHere** advance-payment checkout
- 💬 Real-time **live chat** widget with admin support (STOMP over SockJS)
- 🔔 In-app notifications and a persistent profile/session management page

---

## 🛠️ Tech Stack

| Category | Package | Version |
|---|---|---|
| UI Library | `react` / `react-dom` | ^19.2.6 |
| Routing | `react-router-dom` | ^7.17.0 |
| Build Tool | `vite` | ^8.0.12 |
| React Plugin | `@vitejs/plugin-react` | ^6.0.1 |
| Styling | `tailwindcss` + `@tailwindcss/vite` | ^4.3.1 |
| CSS Processing | `postcss`, `autoprefixer` | ^8.5.15 / ^10.5.0 |
| HTTP Client | `axios` | ^1.18.0 |
| Google Sign-In | `@react-oauth/google` | ^0.13.5 |
| Live Chat (STOMP) | `@stomp/stompjs` | ^7.3.0 |
| Live Chat (WebSocket fallback) | `sockjs-client` | ^1.6.1 |
| PDF Export | `jspdf` | ^4.2.1 |
| Icons | `lucide-react` | ^1.21.0 |
| Linting | `eslint`, `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` | ^10.3.0 / ^10.0.1 / ^7.1.1 / ^0.5.2 |
| E2E Testing | `playwright` (`npm run test:e2e`) | ^1.61.1 |
| Type Hints (JS + JSDoc) | `@types/react`, `@types/react-dom` | ^19.2.14 / ^19.2.3 |

---

## 📂 Project Structure

```
src/
├── main.jsx                       # App entry — mounts React, wraps in GoogleOAuthProvider
├── App.jsx                        # Router, context providers, all route definitions
├── App.css / index.css            # Global styles + Tailwind entry
│
├── pages/
│   ├── Home.jsx
│   ├── LoginPage.jsx / RegisterPage.jsx / ForgotPasswordPage.jsx
│   ├── Destinations.jsx / DestinationDetail.jsx
│   ├── Hiddengems.jsx / Gemdetail.jsx / Submitgem.jsx
│   ├── Guides.jsx / Guidedetail.jsx
│   ├── vehicles/VehicleListing.jsx
│   ├── EventsPage.jsx / Eventdetailpage.jsx
│   ├── HotelsPage.jsx
│   ├── Mytripspage.jsx / CreateTripPage.jsx / Tripdetailpage.jsx
│   ├── Bookingpage.jsx             # 4-step guide/vehicle booking + PayHere checkout
│   ├── Paymentsuccesspage.jsx / Paymentcancelpage.jsx
│   ├── ProfilePage.jsx
│   ├── Aboutpage.jsx
│   └── NotFound.jsx
│
├── components/
│   ├── Navbar.jsx / Footer.jsx
│   ├── ProtectedRoute.jsx          # auth gate for private routes
│   ├── ChatWidget.jsx              # floating live-chat widget
│   ├── DestinationCard.jsx / Destinationreviews.jsx
│   ├── GemCard.jsx / Gemreviews.jsx / NearbyGems.jsx / SubmitGemCta.jsx
│   ├── GuideMiniCard.jsx / GuideReviews.jsx
│   ├── vehicles/VehicleCard.jsx / Vehicledetaildrawer.jsx / Vehiclebookingdrawer.jsx / VehicleReviews.jsx
│   ├── EventCard.jsx / EventCalendar.jsx
│   ├── Hoteldetailspanel.jsx
│   ├── AddToTripCard.jsx / Tripmappanel.jsx / TripGenerationLoader.jsx / BudgetTracker.jsx
│   ├── OtpInput.jsx / SignOutModal.jsx / SuccessModal.jsx
│   ├── FeaturedCarousel.jsx
│   └── destinationCategories.js / gemCategories.js / Srilankadistricts.js
│
├── context/
│   ├── AuthContext.jsx              # user, token, login/logout, isAuthenticated
│   ├── AuthPromptContext.jsx        # global "please sign in" prompt modal
│   ├── CartContext.jsx              # vehicle/guide booking cart (localStorage-backed)
│   └── ChatContext.jsx              # live-chat conversation/socket state
│
├── services/                        # one file per backend resource, all axios-based
│   ├── api.js                       # shared axios instance + JWT refresh interceptor
│   ├── authService.js
│   ├── userService.js
│   ├── destinationsService.js / Destinationreviewsservice.js
│   ├── Hiddengemsservice.js / Reviewsservice.js
│   ├── guidesService.js
│   ├── vehicleService.js
│   ├── tripService.js / Mytripsservice.js
│   ├── budgetService.js
│   ├── eventService.js
│   ├── Hotelservice.js
│   ├── notificationService.js
│   ├── chatService.js / chatSocket.js
│   ├── Uploadservice.js
│   └── Paymentservice.js            # PayHere init / confirm / helpers
│
├── hooks/
│   └── useCountUp.js
│
├── utils/
│   ├── authStorage.js               # localStorage/sessionStorage token+user persistence
│   ├── authError.js
│   ├── destinationParsers.js
│   ├── eventCategoryMeta.js
│   ├── formatMonths.js
│   ├── geo.js
│   └── tripPdf.js                   # jsPDF trip export
│
└── assets/                          # images, logos, hero art, team photos
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- The [ExploreCeylon backend](../ExploreCeylon-backend) running (default `http://localhost:8080`) — Vite's dev server also proxies `/api` there (see `vite.config.js`)

### 1. Install dependencies

```bash
npm install
```

### 2. Create your `.env`

```bash
cp .env.example .env   # or create .env manually — see below
```

### 3. Run the dev server

```bash
npm run dev
```

The app starts on Vite's default port (**`http://localhost:5173`**).

### Other scripts

```bash
npm run build      # production build
npm run preview    # preview the production build locally
npm run lint       # ESLint
npm run test:e2e   # Playwright end-to-end tests
```

---

## ⚙️ Environment Variables

All variables are read via `import.meta.env.VITE_*` and fall back to sane localhost defaults if unset, so the app still runs without a `.env` — but Google sign-in and maps will be disabled.

`.env.example`:

```bash
# Base URL of the ExploreCeylon Spring Boot backend
VITE_API_BASE_URL=http://localhost:8080

# Google OAuth client ID (Google sign-in button in main.jsx)
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com

# Google Maps API key (trip map panel)
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

| Variable | Used in | Required | Fallback |
|---|---|:---:|---|
| `VITE_API_BASE_URL` | `services/api.js`, `chatSocket.js`, `tripService.js`, `eventService.js`, `Mytripsservice.js`, `Paymentservice.js`, `pages/Bookingpage.jsx`, `ProfilePage.jsx`, `Tripdetailpage.jsx`, `Aboutpage.jsx` | ⬜ | `http://localhost:8080` |
| `VITE_GOOGLE_CLIENT_ID` | `main.jsx` (`GoogleOAuthProvider`) | ⬜ | `""` (Google login disabled) |
| `VITE_GOOGLE_MAPS_API_KEY` | `components/Tripmappanel.jsx` | ⬜ | `""` (map disabled) |

> ⚠️ The `.env` currently checked into this repo contains a **live** Google OAuth client ID and Maps API key. Treat these as development-only credentials and rotate them before any public deployment.

---

## 🧭 Pages & Routes

All routes are declared in `src/App.jsx`. Routes inside `MainLayout` render with the shared `Navbar`/`Footer`; auth pages and the booking/payment pages render standalone.

| Route | Page Component | Auth Required? |
|---|---|:---:|
| `/` | `Home` | 🔓 No |
| `/hotels` | `HotelsPage` | 🔓 No |
| `/login` | `LoginPage` | 🔓 No |
| `/register` | `RegisterPage` | 🔓 No |
| `/forgot-password` | `ForgotPasswordPage` | 🔓 No |
| `/hidden-gems` | `HiddenGems` | 🔓 No |
| `/hidden-gems/:id` | `GemDetail` | 🔓 No |
| `/destinations` | `DestinationsPage` | 🔓 No |
| `/destinations/:id` | `DestinationDetail` | 🔓 No |
| `/vehicles` | `VehicleListing` | 🔓 No |
| `/guides` | `Guides` | 🔓 No |
| `/guides/:id` | `GuideDetail` | 🔓 No |
| `/events` | `EventsPage` | 🔓 No |
| `/events/:id` | `EventDetailPage` | 🔓 No |
| `/about` | `AboutPage` | 🔓 No |
| `/my-trips` | `MyTrips` | 🔒 **Yes** (`ProtectedRoute`) |
| `/hidden-gems/submit` | `SubmitGem` | 🔒 **Yes** (`ProtectedRoute`) |
| `/trips/new` | `CreateTripPage` | 🔒 **Yes** (`ProtectedRoute`) |
| `/trips/:id` | `TripDetailPage` | 🔒 **Yes** (`ProtectedRoute`) |
| `/profile` | `ProfilePage` | 🔒 **Yes** (`ProtectedRoute`) |
| `/booking/:type/:id` | `BookingPage` | 🔒 Yes (checked in-page — redirects to `/login` if no user) |
| `/payment/success` | `PaymentSuccessPage` | 🔓 No |
| `/payment/cancel` | `PaymentCancelPage` | 🔓 No |
| `*` | `NotFound` | 🔓 No |

`ProtectedRoute` shows a spinner while `AuthContext` is rehydrating from storage, then either renders `children` or redirects to `/login` (remembering the original location so login can send the user back).

---

## 🧩 Context / State Management

### `AuthContext` (`src/context/AuthContext.jsx`)

Provides:

| Value | Description |
|---|---|
| `user` | Current user object (or `null`) |
| `token` | Current access JWT (or `null`) |
| `isAuthenticated` | `!!token` |
| `loading` | `true` while rehydrating from storage on first mount |
| `login(newToken, newUser, remember = true, refreshToken = null)` | Sets state and persists via `authStorage` — `remember: true` uses `localStorage` (survives restarts), `false` uses session-only storage |
| `logout(redirectTo = "/login")` | Clears storage, resets state, navigates away |
| `updateUser(partial)` | Shallow-merges fields into the current user and persists them |

```jsx
import { useAuth } from "../context/AuthContext";

function Example() {
  const { user, isAuthenticated, login, logout } = useAuth();
  if (!isAuthenticated) return <button onClick={() => navigate("/login")}>Sign in</button>;
  return <button onClick={() => logout()}>Log out {user.name}</button>;
}
```

### `CartContext` (`src/context/CartContext.jsx`)

A global cart for vehicle and guide bookings, persisted to `localStorage` under the key **`ec_cart`**.

Item shape:

```js
{
  type: "vehicle" | "guide",
  id,
  name,
  price,
  image,
  meta: {},
  // added automatically by addToCart():
  cartId: "${type}-${id}",
  startDate: "",
  endDate: "",
  addedAt: "<ISO timestamp>",
}
```

Provides: `cartItems`, `cartCount`, `addToCart(item)`, `removeFromCart(cartId)`, `updateDates(cartId, startDate, endDate)`, `clearCart()`, `isInCart(type, id)`.

```jsx
import { useCart } from "../context/CartContext";

const { addToCart, cartCount } = useCart();
addToCart({ type: "vehicle", id: 12, name: "Toyota Hiace", price: 45, image: vehicle.imageUrl });
```

### `AuthPromptContext` (`src/context/AuthPromptContext.jsx`)

Drives a global "please sign in to continue" modal that other components (e.g. review forms, gem submission CTAs) can trigger without owning their own modal state.

### `ChatContext` (`src/context/ChatContext.jsx`)

Wraps `chatService`/`chatSocket` to expose the traveler's live conversation state to `ChatWidget`, connecting over STOMP/SockJS to the backend's `/ws-chat` endpoint.

---

## 💳 Payment Flow

`BookingPage` (`src/pages/Bookingpage.jsx`) drives a **4-step** flow for booking a guide or vehicle (`/booking/:type/:id`, where `type` is `"guide"` or `"vehicle"`):

| Step | Name | What happens |
|---|---|---|
| **1** | **Availability** | Traveler picks start/end (or pickup/dropoff) dates; the page calls `GET /api/v1/guides/{id}/availability` or `GET /api/v1/vehicles/local/{id}/check-availability`. If the endpoint errors, availability is optimistically assumed `true`. |
| **2** | **Inquiry** *(optional)* | Shows a "Chat on WhatsApp" deep link (`wa.me/<number>?text=...`) built from the guide/driver's phone, plus an optional in-app message box. Travelers can skip straight to booking. |
| **3** | **Confirm** | Collects booking details (vehicle pickup/dropoff time & location, special requests) and shows the payment schedule (20% now / 80% after service). Submitting calls `POST /api/v1/guide-bookings` or `POST /api/v1/vehicle-bookings` to create the booking. |
| **4** | **Pay 20% Advance** | Auto-triggers `payGuide()`/`payVehicle()` from `paymentService.js`, which calls the backend's PayHere `/initiate` endpoint and auto-submits a hidden form redirecting the browser to PayHere's sandbox/live checkout. The cart item is removed once payment is initiated. |

After checkout, PayHere returns the traveler to `/payment/success` or `/payment/cancel`, which read the `order` query param and can call `paymentService`'s `confirm*Payment(orderId)` as a fallback when the backend's IPN webhook can't reach `notify_url` (e.g. local dev without a public tunnel).

### `paymentService.js` (`src/services/Paymentservice.js`)

| Function | Purpose |
|---|---|
| `initiateGuidePayment(bookingId, paymentPhase, userInfo)` / `initiateVehiclePayment(...)` | `POST /api/v1/payments/{guide\|vehicle}/initiate` — returns PayHere hidden-form fields |
| `payGuide(bookingId, phase, user)` / `payVehicle(bookingId, phase, user)` | Combined helper: builds user info, initiates, and auto-submits the PayHere form |
| `submitToPayHere(formData)` | Builds and submits a hidden `<form>` POST to PayHere's checkout URL |
| `getGuidePaymentsForBooking(bookingId)` / `getVehiclePaymentsForBooking(bookingId)` | `GET .../payments/{type}/booking/{bookingId}` |
| `getMyGuidePayments()` / `getMyVehiclePayments()` | `GET .../payments/{type}/my` |
| `confirmGuidePayment(orderId)` / `confirmVehiclePayment(orderId)` | `POST .../payments/{type}/confirm/{orderId}` — idempotent fallback confirmation |
| `calcAdvanceAmount(totalCost)` / `calcFinalAmount(totalCost)` | 20% / 80% of total cost |
| `calcCommission(amount)` / `calcPayout(amount)` | 15% platform commission / 85% provider payout (mirrors backend `PayHereService`) |
| `parseOrderId(searchParams)` | Extracts `order` from the return URL query string |
| `getBookingTypeFromOrderId(orderId)` | `GBK-…` → `"GUIDE"`, `VBK-…` → `"VEHICLE"` |
| `getPhaseFromOrderId(orderId)` | `-ADV-` → `"ADVANCE"`, `-FIN-` → `"FINAL"` |

All authenticated API calls go through `services/api.js`, a shared axios instance that attaches the JWT `Authorization` header on every request and transparently retries once with a refreshed access token on a `401`.

---

## 🎨 Design System

**Primary color:** `#1a5c2a` (deep forest green)

Tailwind utility patterns used consistently across the app (see `Bookingpage.jsx`, `ProtectedRoute.jsx`, etc.):

**Primary button:**
```html
<button class="py-3 bg-[#1a5c2a] hover:bg-[#14471f] text-white
               rounded-xl text-sm font-semibold transition-colors
               disabled:opacity-50">
  Continue →
</button>
```

**Secondary / outline button:**
```html
<button class="py-3 border border-gray-200 rounded-xl text-sm
               text-gray-600 hover:bg-gray-50 transition-colors">
  ← Back
</button>
```

**Card:**
```html
<div class="bg-white rounded-2xl border border-gray-200 p-6">
  <!-- card content -->
</div>
```

**Text input:**
```html
<input class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
              outline-none focus:border-[#1a5c2a] focus:ring-2 focus:ring-green-100" />
```

**Status banners:** success uses `bg-green-50 border-green-200 text-green-700/800`, errors use `bg-red-50 border-red-200 text-red-700`.

Styling is powered by **Tailwind CSS v4** via the `@tailwindcss/vite` plugin — configuration lives in CSS (no populated `tailwind.config.js`; the file is present but empty, consistent with Tailwind v4's CSS-first config).

---

## 📄 License

Distributed under the **MIT License**.
