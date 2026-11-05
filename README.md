# EstateIQ — AI-Powered Real Estate Lead Intelligence & Recommendation Platform

EstateIQ is a full-stack real estate platform designed to empower buyers with luxury property discovery and provide real estate agents with AI-driven behavioural lead scoring and intelligent property recommendations.

---

## 🏛️ Project Architecture

EstateIQ consists of three standalone services:
- **`frontend/`**: Modern React application built with Vite, Tailwind CSS, React Router, and Recharts.
- **`backend/`**: Node.js & Express RESTful API with PostgreSQL, JWT authentication, and behavioral tracking pipelines.
- **`ml-service/`**: Python FastAPI microservice utilizing Scikit-learn, Pandas, and NumPy for lead scoring (Hot/Warm/Cold) and content-based property recommendations.
- **`database/`**: Complete PostgreSQL schema (`schema.sql`) and development seed data (`seed.sql`).
- **`docs/`**: Architecture diagrams, data flow specifications, and API documentation.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- PostgreSQL (14+)

### Quick Setup Steps
1. **Database:**
   ```bash
   # Connect to PostgreSQL and create the database
   psql -U postgres -c "CREATE DATABASE estateiq;"
   psql -U postgres -d estateiq -f database/schema.sql
   psql -U postgres -d estateiq -f database/seed.sql
   ```

2. **Backend:**
   ```bash
   cd backend
   cp .env.example .env
   # Fill in your DB credentials
   npm install
   npm run dev
   ```

3. **AI/ML Service:**
   ```bash
   cd ml-service
   cp .env.example .env
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

4. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 📄 License
ISC
