# EstateIQ Database Architecture

This directory houses the schema definitions, migrations, and seed scripts for the **EstateIQ** PostgreSQL database.

---

## 1. Database Principles

- **Dialect:** PostgreSQL 14+
- **Primary Keys:** UUID v4 via `pgcrypto` (`gen_random_uuid()`)
- **Timestamps:** `TIMESTAMPTZ` with timezone awareness across all tables
- **Automatic Audit Columns:** `updated_at` timestamps driven by PostgreSQL triggers
- **Integrity:** Strict `FOREIGN KEY` constraints with appropriate `ON DELETE CASCADE` or `RESTRICT` rules
- **Performance:** B-Tree and partial unique indexes tailored for high-volume search and ML telemetry lookups

---

## 2. Table Catalog

| Table | Description | Primary Key | Key Relationships / Constraints |
|---|---|---|---|
| `users` | Buyer, Agent, and Admin user accounts | UUID | Unique `email`, CHECK regex on email |
| `refresh_tokens` | Secure JWT rotation tokens | UUID | `users(id)` ON DELETE CASCADE |
| `properties` | Real estate listings | UUID | `agent_id -> users(id)` ON DELETE RESTRICT |
| `property_images` | High-res listing gallery images | UUID | `properties(id)` ON DELETE CASCADE, partial unique index for single primary image |
| `amenities` | Standardized property features | UUID | Unique `name` |
| `property_amenities` | Many-to-many junction table | (property_id, amenity_id) | Composite Primary Key |
| `favourites` | Buyer saved listings | UUID | `UNIQUE(user_id, property_id)` |
| `enquiries` | Buyer inquiries to listing agents | UUID | `property_id`, `buyer_id`, `agent_id` |
| `user_sessions` | Client browsing sessions | UUID | Unique `session_token` |
| `user_interactions` | Behavioural event telemetry for ML lead scoring | UUID | `session_id`, `user_id`, `property_id` |
| `lead_profiles` | Pre-calculated lead intelligence for agents | UUID | Unique `user_id`, score 0–100, classification ENUM |
| `lead_score_history` | Audit log of lead scoring iterations | UUID | `user_id` ON DELETE CASCADE |
| `recommendations` | Property recommendations for buyers | UUID | `UNIQUE(user_id, property_id, algorithm)` |

---

## 3. Database Initialization & Setup

### A. Environment Configuration
Ensure your database parameters in `backend/.env` match your local PostgreSQL server:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=estateiq
DB_USER=postgres
DB_PASSWORD=your_secure_password
```

### B. Creating the Database
Using `psql` or standard PostgreSQL client:

```sql
CREATE DATABASE estateiq;
```

### C. Applying the Schema
Apply `schema.sql` to generate all tables, enums, triggers, and indexes:

```bash
# Windows PowerShell / CMD:
psql -h localhost -p 5432 -U postgres -d estateiq -f database/schema.sql
```

### D. Applying Seed Data (Optional for Development)
Load realistic luxury properties, agent accounts, and user interactions:

```bash
psql -h localhost -p 5432 -U postgres -d estateiq -f database/seed.sql
```

---

## 4. Verification Queries

Run the following queries to verify table creation and health:

```sql
-- 1. List all created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Verify pgcrypto extension is active
SELECT extname, extversion FROM pg_extension WHERE extname = 'pgcrypto';

-- 3. Verify enum types
SELECT typname FROM pg_type WHERE typname IN (
    'user_role', 'property_status', 'property_type', 
    'enquiry_status', 'lead_classification', 'interaction_type'
);

-- 4. Check seed record count
SELECT 'users' AS tbl, count(*) FROM users
UNION ALL SELECT 'properties', count(*) FROM properties
UNION ALL SELECT 'property_images', count(*) FROM property_images
UNION ALL SELECT 'amenities', count(*) FROM amenities
UNION ALL SELECT 'enquiries', count(*) FROM enquiries
UNION ALL SELECT 'user_interactions', count(*) FROM user_interactions
UNION ALL SELECT 'lead_profiles', count(*) FROM lead_profiles
UNION ALL SELECT 'recommendations', count(*) FROM recommendations;
```

