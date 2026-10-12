# Ecotex Inc. - Enterprise Node.js Backend API

Production-grade, high-performance Node.js / Express backend powering the Ecotex Inc. sustainable packaging manufacturing platform.

---

## 🏛 Architecture Overview

Built following enterprise modular architecture with separation of concerns:

```
ecotex-inc-backend/
├── src/
│   ├── config/              # Centralized environment & path configurations
│   │   └── index.js
│   ├── controllers/         # Business logic and request handlers
│   │   ├── authController.js
│   │   ├── categoriesController.js
│   │   ├── healthController.js
│   │   ├── ordersController.js
│   │   ├── productsController.js
│   │   ├── quotesController.js
│   │   ├── settingsController.js
│   │   ├── statsController.js
│   │   ├── testimonialsController.js
│   │   └── uploadController.js
│   ├── database/            # High-performance async persistence engine
│   │   ├── db.js            # Atomic writes, in-memory cache, mutex write queue
│   │   └── defaultData.js   # Fallback initial seeds
│   ├── middleware/          # Security, validation, and error handling
│   │   ├── authMiddleware.js    # JWT & session token verification
│   │   ├── errorMiddleware.js   # Unified 404 and exception handler
│   │   └── rateLimiter.js       # DDoS & brute-force mitigation
│   ├── routes/              # Modular Express routing
│   │   ├── index.js             # Root /api aggregator
│   │   ├── authRoutes.js
│   │   ├── categoriesRoutes.js
│   │   ├── healthRoutes.js
│   │   ├── ordersRoutes.js
│   │   ├── productsRoutes.js
│   │   ├── quotesRoutes.js
│   │   ├── resetRoutes.js
│   │   ├── settingsRoutes.js
│   │   ├── statsRoutes.js
│   │   ├── testimonialsRoutes.js
│   │   └── uploadRoutes.js
│   ├── utils/               # Reusable utilities
│   │   ├── jwt.js           # Cryptographic token signing & verification
│   │   └── logger.js        # Timestamped structured logger
│   └── app.js               # Express application configuration & security
├── uploads/                 # Static media and product image assets
├── db.json                  # Persistent JSON storage
├── db.backup.json           # Automated startup backup
├── index.js                 # Production server bootstrap & graceful shutdown
├── test.js                  # Automated integration test suite
├── .env.example             # Configuration blueprint
└── package.json
```

---

## 🚀 Key Features & Enterprise Standards

1. **High-Performance Persistence Engine:**
   - Asynchronous, non-blocking I/O with in-memory read cache providing sub-millisecond response times (<2ms).
   - Atomic file writes using temporary file swap to eliminate race conditions and avoid data corruption.
   - Automatic database backup created on server startup and factory resets.

2. **Security & Authentication:**
   - **Bcrypt Password Hashing:** Automatically upgrades plaintext passwords to salted bcrypt hashes.
   - **JSON Web Tokens (JWT):** Signed Bearer tokens with configurable expiration (`JWT_EXPIRES_IN=7d`).
   - **Backward Compatibility:** Seamlessly recognizes existing active sessions.
   - **Helmet:** Production HTTP security headers.
   - **Rate Limiting:** Granular rate limits for general requests, authentication (brute-force defense), and RFQ submissions (spam prevention).

3. **Dual File Upload System:**
   - Supports both `multipart/form-data` uploads via `multer` and Base64 encoded JSON payloads.
   - Automatic MIME type validation (PNG, JPG, WEBP, SVG, PDF) and file size safety limits.

4. **Production Telemetry:**
   - `/api/health` diagnostics endpoint tracking server uptime, heap memory usage, Node.js version, and database record statistics.

---

## 🛠 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy the configuration template:
```bash
cp .env.example .env
```

### 3. Run Automated Integration Test Suite
```bash
npm test
```

### 4. Start Development Server (with Auto-Reload)
```bash
npm run dev
```

### 5. Start Production Server
```bash
npm start
```

---

## 📡 API Endpoints Reference

### System & Telemetry
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server uptime, memory telemetry & DB status |
| `GET` | `/api/ping` | Liveness health probe (`pong`) |

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticates admin credentials, returns JWT & user profile |
| `GET` | `/api/auth/me` | Bearer Token | Retrieves authenticated administrator profile |
| `PUT` | `/api/auth/credentials` | Admin | Updates corporate email, password (hashed), and display name |

### Analytics & Dashboard
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/stats` | Executive KPI metrics (revenue, orders, products, displaced plastic) |

### Products Catalog
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Lists products (supports `?category=...`, `?search=...`, `?inStock=...`) |
| `GET` | `/api/products/:id` | Single product details |
| `POST` | `/api/products` | Creates a new packaging product |
| `PUT` | `/api/products/:id` | Updates product specifications and pricing tiers |
| `PATCH` | `/api/products/:id/toggle-stock` | Toggles inStock availability |
| `DELETE` | `/api/products/:id` | Deletes product |

### Categories
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/categories` | Complete categories list |
| `GET` | `/api/categories/:id` | Single category details |
| `POST` | `/api/categories` | Creates a new category |
| `PUT` | `/api/categories/:id` | Updates category metadata |
| `DELETE` | `/api/categories/:id` | Deletes category |

### Commercial Orders
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/orders` | Retrieves all orders (sorted latest first) |
| `GET` | `/api/orders/:id` | Single order details |
| `POST` | `/api/orders` | Places a new purchase order |
| `PATCH` | `/api/orders/:id/status` | Updates lifecycle status (`Pending`, `In Production`, `Dispatched`, `Completed`, `Cancelled`) |
| `DELETE` | `/api/orders/:id` | Deletes order record |

### Wholesale RFQ / Quotes
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/quotes` | Retrieves all customer RFQs |
| `GET` | `/api/quotes/:id` | Single RFQ details |
| `POST` | `/api/quotes` | Submits a custom quote inquiry |
| `PATCH` | `/api/quotes/:id/status` | Updates RFQ status (`New`, `Reviewed`, `Quotation Sent`, `Closed`) |
| `DELETE` | `/api/quotes/:id` | Deletes RFQ record |

### Site Settings & CMS
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/settings` | Retrieves global site settings, ESG metrics & branding |
| `PUT` | `/api/settings` | Updates site settings |

### Testimonials
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/testimonials` | Lists customer reviews |
| `POST` | `/api/testimonials` | Creates customer testimonial |
| `PUT` | `/api/testimonials/:id` | Updates testimonial |
| `DELETE` | `/api/testimonials/:id` | Deletes testimonial |

### Uploads & Static Assets
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Uploads image (Multipart `file` field or JSON base64 `data`) |
| `GET` | `/uploads/:filename` | Serves uploaded image or document statically |

### Factory Reset
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/reset` | Resets database to factory state with automatic backup |
