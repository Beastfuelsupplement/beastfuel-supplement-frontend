# BEASTFUEL Supplements — Frontend

> Modern React storefront for BEASTFUEL Supplements with admin dashboard, cart, checkout, and product reviews.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite 5** | Build tool & dev server |
| **Tailwind CSS 3** | Utility-first styling |
| **TanStack Query** | Server state / data fetching |
| **Zustand** | Client state (cart) |
| **React Router 6** | Routing |
| **Framer Motion** | Animations & transitions |
| **Zod** | Form validation |
| **shadcn/ui** | Component library |
| **Recharts** | Admin dashboard charts |

---

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) v18+
- Backend API running (see [`backend/README.md`](./backend/README.md))

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start the dev server

```bash
npm run dev
```

Opens at `http://localhost:5173`

---

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/              # Navbar, Footer, Layout wrapper
│   ├── products/             # ProductCard
│   ├── reviews/              # ReviewForm, ReviewList, StarRating
│   ├── admin/                # Modals for products, orders, customers
│   ├── backgrounds/          # Animated background effects
│   ├── security/             # 2FA, activity log components
│   └── ui/                   # shadcn/ui primitives
├── pages/
│   ├── Index.tsx             # Landing page (hero, categories, testimonials)
│   ├── Products.tsx          # Product listing with category filters
│   ├── ProductDetails.tsx    # Single product + reviews
│   ├── Cart.tsx              # Shopping cart
│   ├── Checkout.tsx          # Checkout flow
│   ├── Login.tsx             # Login form
│   ├── Dashboard.tsx         # User profile & settings
│   ├── OrderHistory.tsx      # User's past orders
│   ├── admin/
│   │   ├── AdminDashboard.tsx    # Stats, charts, overview
│   │   ├── AdminProducts.tsx     # Manage products
│   │   ├── AdminOrders.tsx       # Manage orders
│   │   ├── AdminCustomers.tsx    # Manage customers
│   │   └── AdminSettings.tsx     # Store settings
│   └── ...                   # About, Contact, FAQ, Privacy, Terms
├── hooks/
│   ├── useAuth.tsx           # Auth context & JWT management
│   ├── useProducts.ts        # Product data hooks
│   └── useReviews.ts         # Review data hooks
├── lib/
│   ├── api.ts                # Centralized API service layer
│   ├── currency.ts           # Currency formatting
│   └── validations.ts        # Zod schemas
├── store/
│   ├── cartStore.ts          # Zustand cart state
│   └── adminStore.ts         # Admin data state
├── data/
│   └── products.ts           # Static product seed data
└── index.css                 # Tailwind + design tokens
```

---

## ✨ Features

### 🛒 Storefront
- Responsive product catalog with category filtering
- Product details with image, description, reviews
- Shopping cart with quantity management
- Checkout flow with order creation

### 👤 User
- JWT-based authentication (signup / login)
- Profile management & password change
- Order history tracking
- Product reviews with star ratings

### 🔧 Admin Dashboard
- Revenue & order statistics with charts
- Full CRUD for products, orders, and customers
- Stock management & low-stock alerts
- Image upload for products

### 🎨 UI/UX
- Dark/light theme toggle
- Smooth page transition animations (Framer Motion)
- Mobile-responsive with animated hamburger menu
- Animated hero, categories, and testimonials sections

---

## 🏗 Build for Production

```bash
npm run build
```

Output goes to `dist/` — deploy to any static host.

---

## 🌐 Deployment

### Vercel (recommended)
1. Push to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Set **Framework:** Vite
4. Add environment variable: `VITE_API_URL=https://your-backend-url.com/api`
5. Deploy

### Netlify
1. Push to GitHub
2. Create site on [netlify.com](https://netlify.com)
3. Set **Build Command:** `npm run build`
4. Set **Publish Directory:** `dist`
5. Add environment variable: `VITE_API_URL`

---

## 🔗 Related

- **Backend API:** [`backend/README.md`](./backend/README.md)

---

## 📄 License

MIT
