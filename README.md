# Online Property Rental and Listing Management System
### Explainable Multimodal Machine Learning for Real Estate Rental Intelligence

---

## Project Overview
This project is an **Online Property Rental and Listing Management System** created for the MCA Mini Project curriculum. It integrates an existing research-grade Multimodal Machine Learning pipeline (**Sentence-Transformers text embeddings**, **EfficientNetB0 deep visual features**, **Random Forest Regressor**, **MAPIE Conformal Prediction 95% confidence intervals**, and **SHAP explainability**) with a modern full-stack web application.

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
                                          Multimodal AI Engine
                                    (all-MiniLM-L6-v2 + EfficientNetB0)
                                                  │
                                                  ▼
                                      Trained Research Models
                                   ├── rental_price_model.pkl
                                   ├── conformal_model.pkl (95% CI)
                                   └── shap_explainer.pkl (SHAP)
```

---

## Key Modules & Features

1. **Authentication & Role-Based Access Control**:
   - Roles: **Tenant / Buyer**, **Property Owner / Landlord**, **System Administrator**.
   - Stateless JWT tokens with bcrypt password hashing.

2. **Property Listing & Management (Owners)**:
   - Create, edit, and delete property listings.
   - Multi-image uploads (up to 8 photos).
   - Interactive **OpenStreetMap / Leaflet.js** map pin selection.
   - **Embedded Real-Time AI Rent Estimator**: Automatically predicts monthly rent, computes a 95% confidence interval, displays top feature impacts (SHAP), and allows 1-click price application.

3. **Explore, Filter & Search (Tenants & Visitors)**:
   - Search by keyword, locality, city (Mumbai, Bangalore, Delhi, Hyderabad, Chennai, Kolkata).
   - Filter by BHK, price range, property type, furnishing, and amenities.
   - Toggle between **Grid View** and **Interactive Split Map View**.

4. **Site Visit Booking & Inquiry Workflow**:
   - Tenants can request property visits with preferred dates and time slots.
   - Owners can **Accept** or **Reject** booking requests from their dashboard.
   - Live notification alerts on status changes.

5. **Dashboards**:
   - **Owner Dashboard**: Manage listings, review visit requests, track metrics.
   - **Tenant Dashboard**: Track booked visits, saved wishlist properties, profile settings.
   - **Admin Dashboard**: Moderation (approve/reject listings), registered user directory, city-level analytics.

6. **Explainable Multimodal ML Rental Valuation**:
   - Dedicated standalone AI valuation tool.
   - Computes statistical uncertainty bounds `[Lower ₹ – Upper ₹]` using MAPIE.

---

## Directory Structure

```
Rental_price_prediction/
├── frontend/             # React.js + Vite Single Page Application
├── backend/              # Node.js + Express.js + Mongoose REST API
├── ml_service/           # Python Flask ML Microservice (uses existing models)
├── datasets/             # [PROTECTED] Original research models, datasets & Streamlit app
│   ├── House_Rent_Dataset.csv
│   ├── training_dataset.csv
│   ├── models/           # rental_price_model.pkl, conformal_model.pkl, shap_explainer.pkl
│   ├── scripts/          # prediction_pipeline.py, train_models.py, ablation_study.py
│   └── app/              # streamlit_app.py
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
node seedData.js   # Seeds demo users, properties and reviews
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
| **Owner** | `owner@rental.com` | `ownerpassword123` |
| **Tenant** | `tenant@rental.com` | `tenantpassword123` |

*(Also available via 1-Click Fill buttons on the Login page)*
