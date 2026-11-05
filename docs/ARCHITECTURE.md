# EstateIQ Architecture & Design Specification

## 1. System Vision
EstateIQ is an intelligent, full-stack real estate platform that combines high-fidelity property browsing with behavioral lead intelligence. It bridges the gap between passive property browsing and actionable real estate sales intelligence by classifying buyer leads into **HOT**, **WARM**, or **COLD** tiers and providing content-based property recommendations.

---

## 2. High-Level Architecture

```
                    +-----------------------------+
                    |    Frontend (React + Vite)  |
                    |   Tailwind CSS & Recharts   |
                    +--------------+--------------+
                                   |
                             HTTP / JSON
                                   |
                    +--------------v--------------+
                    |  Backend API (Node/Express) |
                    |      JWT Auth & RBAC        |
                    +-------+-------------+-------+
                            |             |
                 SQL Queries|             | Internal HTTP
                            |             v
            +---------------v---+     +---+-------------------+
            | PostgreSQL 14+    |     | AI/ML Service         |
            | (Relational +     |     | (FastAPI + Scikit)    |
            |  Behavioural Log) |     | - Lead Scoring Model  |
            +-------------------+     | - Property Recommender|
                                      +-----------------------+
```

---

## 3. Component Responsibilities

### Frontend (`frontend/`)
- **Framework:** React 18+ with Vite
- **Styling:** Tailwind CSS (Dark cinematic hero, warm off-white content, warm gold accents)
- **Role Interfaces:**
  - *Buyer:* Property discovery, filtering, interactive details, favourites, enquiry submission, personalized recommendations.
  - *Agent:* Property listing management, lead intelligence dashboard, lead classification badges (Hot/Warm/Cold), behavioural engagement analytics via Recharts.
  - *Admin:* User and agent governance, listing status audits, platform-wide metrics.

### Backend API (`backend/`)
- **Runtime:** Node.js & Express
- **Authentication:** Stateless JWT access tokens + rotating refresh tokens with bcrypt password hashing.
- **Role-Based Access Control (RBAC):** Middleware verifying `BUYER`, `AGENT`, and `ADMIN` privileges.
- **Event Telemetry Pipeline:** Captures and ingests user browsing telemetry (`PROPERTY_VIEW`, dwell times, search parameters) without blocking UI responses.
- **Database Access:** Direct parameterized SQL queries via `pg` connection pooling for maximum speed, type fidelity, and auditability.

### AI/ML Microservice (`ml-service/`)
- **Framework:** FastAPI with Pydantic validation
- **Lead Scoring Engine:**
  - Ingests behavioural signals: view counts, repeat views, dwell time, favourites, enquiries, recency.
  - Computes a composite score from 0 to 100.
  - Classifies leads into:
    - **HOT:** High intent (enquiries submitted, high dwell times, repeated high-value views).
    - **WARM:** Moderate engagement (multiple views, favourites saved, recent active sessions).
    - **COLD:** Low intent (isolated views, low dwell time, long periods of inactivity).
- **Property Recommendation Engine:**
  - Content-based filtering using property attributes (price bracket, type, square footage, amenities, city).
  - Matches user preferences inferred from recent interaction history.

---

## 4. User Interaction & Telemetry Lifecycle

```
[Buyer Browses Property]
          |
          v
[Frontend dispatches event] ---> POST /api/analytics/events
                                       |
                                       v
                             [Backend logs to PostgreSQL: user_interactions]
                                       |
                                       v
                    [ML Service Lead Scoring Trigger / Batch]
                                       |
                                       v
                    [Updates lead_profiles & lead_score_history]
                                       |
                                       v
            [Agent views Lead Dashboard: Sees Real-time Hot/Warm/Cold]
```
