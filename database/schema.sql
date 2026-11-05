-- ============================================================================
-- EstateIQ Database Schema
-- Version: 1.0.0
-- Dialect: PostgreSQL (14+)
-- Description: AI-Powered Real Estate Lead Intelligence & Recommendation Platform
-- ============================================================================

-- Enable pgcrypto for cryptographic functions and UUID generation (gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('BUYER', 'AGENT', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE property_status AS ENUM ('ACTIVE', 'PENDING', 'SOLD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE property_type AS ENUM (
        'SINGLE_FAMILY',
        'APARTMENT',
        'CONDO',
        'TOWNHOUSE',
        'VILLA',
        'PENTHOUSE',
        'ESTATE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE enquiry_status AS ENUM ('PENDING', 'CONTACTED', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_classification AS ENUM ('HOT', 'WARM', 'COLD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE interaction_type AS ENUM (
        'PAGE_VIEW',
        'PROPERTY_VIEW',
        'FAVOURITE_ADD',
        'FAVOURITE_REMOVE',
        'ENQUIRY_SUBMIT',
        'SEARCH_FILTER',
        'IMAGE_GALLERY_EXPAND',
        'CONTACT_AGENT_CLICK'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TRIGGER FUNCTION: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    role user_role NOT NULL DEFAULT 'BUYER',
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. REFRESH TOKENS TABLE (For persistent and secure JWT rotation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    device_info VARCHAR(255),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. PROPERTIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(14, 2) NOT NULL CHECK (price > 0),
    property_type property_type NOT NULL,
    status property_status NOT NULL DEFAULT 'ACTIVE',
    bedrooms INT NOT NULL CHECK (bedrooms >= 0),
    bathrooms NUMERIC(3, 1) NOT NULL CHECK (bathrooms >= 0),
    square_feet INT NOT NULL CHECK (square_feet > 0),
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    year_built INT CHECK (year_built BETWEEN 1800 AND 2100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. PROPERTY IMAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS property_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption VARCHAR(255),
    display_order INT NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Partial Unique Index: Exactly one primary image per property
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_images_one_primary 
    ON property_images (property_id) 
    WHERE is_primary = TRUE;

-- ============================================================================
-- 5. AMENITIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    icon_name VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. PROPERTY AMENITIES (Many-to-Many Join Table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS property_amenities (
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    amenity_id UUID NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (property_id, amenity_id)
);

-- ============================================================================
-- 7. FAVOURITES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS favourites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_property_favourite UNIQUE (user_id, property_id)
);

-- ============================================================================
-- 8. ENQUIRIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    phone VARCHAR(50),
    status enquiry_status NOT NULL DEFAULT 'PENDING',
    agent_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_enquiries_updated_at
    BEFORE UPDATE ON enquiries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. USER SESSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(50),
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMPTZ
);

-- ============================================================================
-- 10. USER INTERACTIONS TABLE (Behavioural Telemetry for Lead ML Engine)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    event_type interaction_type NOT NULL,
    dwell_time_seconds INT NOT NULL DEFAULT 0 CHECK (dwell_time_seconds >= 0),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 11. LEAD PROFILES TABLE (Aggregated Intelligence for Agents & ML Scoring)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    current_score INT NOT NULL DEFAULT 0 CHECK (current_score BETWEEN 0 AND 100),
    classification lead_classification NOT NULL DEFAULT 'COLD',
    engagement_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (engagement_score >= 0),
    recency_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (recency_score >= 0),
    intent_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (intent_score >= 0),
    total_views INT NOT NULL DEFAULT 0 CHECK (total_views >= 0),
    total_favourites INT NOT NULL DEFAULT 0 CHECK (total_favourites >= 0),
    total_enquiries INT NOT NULL DEFAULT 0 CHECK (total_enquiries >= 0),
    total_dwell_time INT NOT NULL DEFAULT 0 CHECK (total_dwell_time >= 0),
    preferred_property_type property_type,
    preferred_min_price NUMERIC(14, 2) CHECK (preferred_min_price >= 0),
    preferred_max_price NUMERIC(14, 2) CHECK (preferred_max_price >= 0),
    preferred_city VARCHAR(100),
    last_active_at TIMESTAMPTZ,
    last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_lead_profiles_updated_at
    BEFORE UPDATE ON lead_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 12. LEAD SCORE HISTORY TABLE (Audit Trail of ML Scoring Iterations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
    classification lead_classification NOT NULL,
    reason VARCHAR(255),
    feature_contributions JSONB DEFAULT '{}',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 13. RECOMMENDATIONS TABLE (Personalized Property Recommendations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    score NUMERIC(5, 4) NOT NULL CHECK (score >= 0.0 AND score <= 1.0),
    algorithm VARCHAR(50) NOT NULL DEFAULT 'CONTENT_BASED',
    explanation TEXT,
    rank INT NOT NULL DEFAULT 1 CHECK (rank >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_property_algo UNIQUE (user_id, property_id, algorithm)
);

-- ============================================================================
-- INDEXES FOR FREQUENTLY QUERIED FIELDS
-- ============================================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Refresh Tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);

-- Properties
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON properties (agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties (status);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties (property_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties (price);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties (city);
CREATE INDEX IF NOT EXISTS idx_properties_search_composite ON properties (status, city, property_type, price);

-- Property Images
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images (property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_display_order ON property_images (property_id, display_order);

-- Property Amenities
CREATE INDEX IF NOT EXISTS idx_property_amenities_amenity_id ON property_amenities (amenity_id);

-- Favourites
CREATE INDEX IF NOT EXISTS idx_favourites_user_id ON favourites (user_id);
CREATE INDEX IF NOT EXISTS idx_favourites_property_id ON favourites (property_id);

-- Enquiries
CREATE INDEX IF NOT EXISTS idx_enquiries_buyer_id ON enquiries (buyer_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_agent_id ON enquiries (agent_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_property_id ON enquiries (property_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries (status);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries (created_at DESC);

-- User Sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions (session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions (started_at DESC);

-- User Interactions
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_session_id ON user_interactions (session_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_property_id ON user_interactions (property_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_event_type ON user_interactions (event_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_interactions_lead_scoring ON user_interactions (user_id, event_type, created_at DESC);

-- Lead Profiles
CREATE INDEX IF NOT EXISTS idx_lead_profiles_score ON lead_profiles (current_score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_profiles_classification ON lead_profiles (classification);
CREATE INDEX IF NOT EXISTS idx_lead_profiles_last_active ON lead_profiles (last_active_at DESC);

-- Lead Score History
CREATE INDEX IF NOT EXISTS idx_lead_score_history_user_id ON lead_score_history (user_id);
CREATE INDEX IF NOT EXISTS idx_lead_score_history_calculated_at ON lead_score_history (calculated_at DESC);

-- Recommendations
CREATE INDEX IF NOT EXISTS idx_recommendations_user_rank ON recommendations (user_id, rank ASC);
CREATE INDEX IF NOT EXISTS idx_recommendations_property_id ON recommendations (property_id);
