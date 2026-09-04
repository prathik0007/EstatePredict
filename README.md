# Online Property Rental and Listing Management System
### Explainable Multimodal Machine Learning for Real Estate Rental Intelligence

---

## Project Overview
This project is an **Online Property Rental and Listing Management System** created for the MCA Mini Project curriculum. It integrates our finalized research-grade **Multimodal V3 Machine Learning pipeline** (**all-MiniLM-L6-v2 text representations**, **EfficientNet-B0 deep visual representations**, **HistGradientBoostingRegressor with log1p target transformation**, **Calibrated 95% Conformal Prediction Intervals**, and **SHAP feature explainability**) with a modern full-stack web application.

Benchmark Context:
- **Market**: Asheville, North Carolina, USA (Inside Airbnb snapshot, Dec 18, 2023)
- **Cohort**: 1,800 verified multimodal listings with authentic images and property descriptions
- **Target**: Nightly rental price in USD ($)
- **Best Model**: Tabular-Only HistGradientBoosting (MAE = $74.07, RMSE = $158.64, R² = 0.5318, MAPE = 33.66%, MedAE = $34.88)
- **Conformal Prediction**: Nominal target = 95.00%, Empirical coverage = 93.70%, Mean interval width = $342.69

---

## System Architecture

```
                    REACT.JS FRONTEND (Vite / Leaflet.js)
                                  │
                                  ▼ (Port 5173 / Proxy)
                    NODE.JS + EXPRESS BACKEND API (Port 5001)
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
          MongoDB Database               Python Flask ML Service (Port 5000)
     (Properties, Bookings, Users,                │
         Wishlist, Reviews)                       ▼
                                          Multimodal V3 AI Engine
                                    (all-MiniLM-L6-v2 + EfficientNet-B0)
                                                  │
                                                  ▼
                                      Trained Research Pipeline
                                   ├── v3_tabular_pipeline.pkl (HistGradientBoosting log1p)
                                   ├── conformal cutoff (q_hat = 0.8606, 93.70% coverage)
                                   └── TreeSHAP Explainer (Factor Attribution)
```

---

## Key Modules & Features

1. **Authentication & Role-Based Access Control**:
   - Roles: **Tenant / Guest**, **Property Host / Owner**, **System Administrator**.
   - Stateless JWT tokens with bcrypt password hashing.

2. **Property Listing & Management (Hosts)**:
   - Create, edit, and delete property listings in Asheville, NC.
   - Property photos and description text.
   - Interactive **OpenStreetMap / Leaflet.js** map pin selection.
   - **Embedded Real-Time AI Price Estimator**: Automatically predicts nightly rate in USD, computes a calibrated 95% prediction interval (93.70% coverage), displays top feature impacts (SHAP), and allows 1-click price application.

3. **Explore, Filter & Search (Guests & Visitors)**:
   - Search by keyword, neighborhood (Downtown, Montford, West Asheville, Biltmore Village, Grove Park, River Arts District).
   - Filter by bedrooms, capacity (guests), room type, price range, and amenities.
   - Toggle between **Grid View** and **Interactive Split Map View**.

4. **Site Visit / Stay Booking & Inquiry Workflow**:
   - Guests can request property visits or bookings with preferred dates and time slots.
   - Hosts can **Accept** or **Reject** booking requests from their dashboard.
   - Live notification alerts on status changes.

5. **Dashboards**:
   - **Host Dashboard**: Manage listings, review inquiries, track active listings.
   - **Guest Dashboard**: Track requested bookings, saved wishlist properties, profile settings.
   - **Admin Dashboard**: Moderation (approve/reject listings), registered user directory, neighborhood-level analytics.

6. **Explainable Multimodal ML Rental Valuation**:
   - Dedicated standalone AI valuation tool for Asheville nightly prices.
   - Computes calibrated 95% prediction intervals `[$Lower – $Upper]` using nonconformity scores derived from the calibration partition.

---

## Benchmark Performance Summary (Multimodal V3)

| Metric | Tabular Only (Best) | Tabular + Text | Tabular + Image | Early Fusion (All) |
| :--- | :---: | :---: | :---: | :---: |
| **MAE** | **$74.07** | $74.56 | $74.45 | $75.05 |
| **RMSE** | **$158.64** | $159.27 | $159.61 | $159.45 |
| **R²** | **0.5318** | 0.5281 | 0.5260 | 0.5270 |
| **MAPE** | **33.66%** | 33.72% | 33.91% | 34.02% |
| **MedAE** | **$34.88** | $35.48 | $35.21 | $35.78 |

---

## Directory Structure

```
Rental_price_prediction/
├── frontend/             # React.js + Vite Single Page Application
├── backend/              # Node.js + Express.js + Mongoose REST API
├── ml_service/           # Python Flask ML Microservice (Multimodal V3 pipeline)
├── datasets/multimodal_v3/ # Multimodal V3 dataset, feature embeddings & models
│   ├── processed/        # multimodal_cohort.csv (N = 1,800), splits, image/text features
│   ├── models/           # v3_tabular_pipeline.pkl
│   └── results/          # ablation, shap, conformal reports & audit
└── README.md
```

---

## Quick Start & Execution Guide

### 1. Start MongoDB
Ensure MongoDB is running locally on port `27017` (or configured via `backend/.env`).

### 2. Start the Python Flask ML Service
```bash
cd ml_service
python app.py
```
*Runs on `http://127.0.0.1:5000`*

### 3. Seed Database & Start Node.js Backend
```bash
cd backend
npm install
node seedData.js   # Seeds demo users, Asheville properties and reviews
npm start
```
*Runs on `http://127.0.0.1:5001`*

### 4. Start React Frontend
```bash
cd frontend
npm install
npm run dev
```
*Access UI in browser at `http://localhost:5173`*

---

## Demo Credentials (Pre-seeded)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@rental.com` | `adminpassword123` |
| **Owner / Host** | `owner@rental.com` | `ownerpassword123` |
| **Tenant / Guest** | `tenant@rental.com` | `tenantpassword123` |

*(Also available via 1-Click Fill buttons on the Login page)*
