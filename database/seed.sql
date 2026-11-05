-- ============================================================================
-- EstateIQ Database Seed Data
-- Version: 1.0.0
-- Description: Realistic initial data for testing, development, and ML scoring
-- Default mock password for all seed accounts: Password123!
-- (Bcrypt hash: $2a$12$K1r6fN2Q9zK9j3YJ5z5ZMeT0q1wX8b3v9.H7m9yW1x3v5ZMeT0q1w)
-- ============================================================================

-- Clean up existing data in reverse dependency order
TRUNCATE TABLE recommendations, lead_score_history, lead_profiles,
               user_interactions, user_sessions, enquiries, favourites,
               property_amenities, amenities, property_images, properties,
               refresh_tokens, users CASCADE;

-- ============================================================================
-- 1. SEED AMENITIES
-- ============================================================================

INSERT INTO amenities (id, name, category, icon_name) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Infinity Swimming Pool', 'OUTDOOR', 'pool'),
    ('a0000000-0000-0000-0000-000000000002', 'Private Gym & Wellness Center', 'INTERIOR', 'fitness_center'),
    ('a0000000-0000-0000-0000-000000000003', 'Temperature-Controlled Wine Cellar', 'INTERIOR', 'wine_bar'),
    ('a0000000-0000-0000-0000-000000000004', 'Smart Home Automation (Lutron/Crestron)', 'TECHNOLOGY', 'home_iot'),
    ('a0000000-0000-0000-0000-000000000005', 'Panoramic Ocean / Skyline Views', 'VIEWS', 'panorama'),
    ('a0000000-0000-0000-0000-000000000006', 'Landscaped Private Garden', 'OUTDOOR', 'yard'),
    ('a0000000-0000-0000-0000-000000000007', 'Private Rooftop Terrace', 'OUTDOOR', 'deck'),
    ('a0000000-0000-0000-0000-000000000008', 'Level 2 EV Charging Station', 'ECO', 'ev_station'),
    ('a0000000-0000-0000-0000-000000000009', '24/7 Security & Concierge', 'SECURITY', 'security'),
    ('a0000000-0000-0000-0000-000000000010', 'Private Spa & Sauna', 'WELLNESS', 'spa'),
    ('a0000000-0000-0000-0000-000000000011', 'Custom Chef Kitchen with Sub-Zero Appliances', 'INTERIOR', 'kitchen'),
    ('a0000000-0000-0000-0000-000000000012', 'Grand Fireplace', 'INTERIOR', 'fireplace');

-- ============================================================================
-- 2. SEED USERS
-- ============================================================================

INSERT INTO users (id, email, password_hash, full_name, phone, role, avatar_url) VALUES
    -- Admin
    ('u0000000-0000-0000-0000-000000000001', 'admin@estateiq.com', '$2a$12$4L3u3K.kQ02Pz0uJ3gJk.u6fVvYk2lJk.u6fVvYk2lJk.u6fVvYk2', 'Arthur Pendelton', '+1 (555) 010-0001', 'ADMIN', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'),
    
    -- Agents
    ('u0000000-0000-0000-0000-000000000002', 'sarah.jenkins@estateiq.com', '$2a$12$4L3u3K.kQ02Pz0uJ3gJk.u6fVvYk2lJk.u6fVvYk2lJk.u6fVvYk2', 'Sarah Jenkins', '+1 (555) 012-3456', 'AGENT', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400'),
    ('u0000000-0000-0000-0000-000000000003', 'marcus.vance@estateiq.com', '$2a$12$4L3u3K.kQ02Pz0uJ3gJk.u6fVvYk2lJk.u6fVvYk2lJk.u6fVvYk2', 'Marcus Vance', '+1 (555) 012-7890', 'AGENT', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400'),
    
    -- Buyers (representing varied engagement profiles)
    ('u0000000-0000-0000-0000-000000000004', 'alexander.wright@gmail.com', '$2a$12$4L3u3K.kQ02Pz0uJ3gJk.u6fVvYk2lJk.u6fVvYk2lJk.u6fVvYk2', 'Alexander Wright', '+1 (555) 432-1098', 'BUYER', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'),
    ('u0000000-0000-0000-0000-000000000005', 'elena.rostova@gmail.com', '$2a$12$4L3u3K.kQ02Pz0uJ3gJk.u6fVvYk2lJk.u6fVvYk2lJk.u6fVvYk2', 'Elena Rostova', '+1 (555) 654-3210', 'BUYER', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'),
    ('u0000000-0000-0000-0000-000000000006', 'jordan.bell@outlook.com', '$2a$12$4L3u3K.kQ02Pz0uJ3gJk.u6fVvYk2lJk.u6fVvYk2lJk.u6fVvYk2', 'Jordan Bell', '+1 (555) 789-0123', 'BUYER', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'),
    ('u0000000-0000-0000-0000-000000000007', 'david.kim@gmail.com', '$2a$12$4L3u3K.kQ02Pz0uJ3gJk.u6fVvYk2lJk.u6fVvYk2lJk.u6fVvYk2', 'David Kim', '+1 (555) 890-1234', 'BUYER', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400');

-- ============================================================================
-- 3. SEED PROPERTIES
-- ============================================================================

INSERT INTO properties (id, agent_id, title, description, price, property_type, status, bedrooms, bathrooms, square_feet, address, city, state, zip_code, latitude, longitude, year_built) VALUES
    ('p0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000002',
     'The Glass Pavilion at Bel Air Crest',
     'A masterwork of modernist architecture with seamless indoor-outdoor transitions, cantilevered infinity pool, and sweeping city-to-ocean views.',
     12850000.00, 'VILLA', 'ACTIVE', 5, 6.5, 7800,
     '10420 Bellagio Road', 'Los Angeles', 'CA', '90077', 34.08370000, -118.44870000, 2022),

    ('p0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000002',
     'Tribeca Sky Penthouse with Private Terrace',
     'Duplex penthouse crown jewel featuring 24-foot vaulted ceilings, limestone fireplace, private wrap-around terrace, and key-locked elevator access.',
     8900000.00, 'PENTHOUSE', 'ACTIVE', 4, 4.5, 5200,
     '72 Franklin Street, Penthouse A', 'New York', 'NY', '10013', 40.71830000, -74.00490000, 2020),

    ('p0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000003',
     'Whispering Pines Coastal Sanctuary',
     'Private coastal estate surrounded by mature cypress trees, featuring direct private beach access, guesthouse, and curated artisan stonework.',
     6450000.00, 'ESTATE', 'ACTIVE', 6, 7.0, 6800,
     '318 Ocean Boulevard', 'Carmel-by-the-Sea', 'CA', '93921', 36.55520000, -121.92330000, 2019),

    ('p0000000-0000-0000-0000-000000000004', 'u0000000-0000-0000-0000-000000000003',
     'The Brickell Bay Residence',
     'Ultra-luxury high-rise corner unit offering panoramic Biscayne Bay views, imported Italian cabinetry, and exclusive deep-water yacht slip rights.',
     3750000.00, 'CONDO', 'ACTIVE', 3, 3.5, 3100,
     '1421 Brickell Avenue, Unit 38B', 'Miami', 'FL', '33131', 25.76020000, -80.19140000, 2023),

    ('p0000000-0000-0000-0000-000000000005', 'u0000000-0000-0000-0000-000000000002',
     'Hill Country Modern Equestrian Haven',
     'Architectural farmhouse on 12 pristine acres with state-of-the-art equestrian stables, resort pool, outdoor kitchen, and solar microgrid.',
     4200000.00, 'SINGLE_FAMILY', 'ACTIVE', 4, 4.5, 4900,
     '4500 Spicewood Springs Road', 'Austin', 'TX', '78759', 30.38090000, -97.77120000, 2021),

    ('p0000000-0000-0000-0000-000000000006', 'u0000000-0000-0000-0000-000000000003',
     'Historic Georgetown Federal Townhome',
     'Impeccably restored 19th-century brick residence blending historic crown molding, private courtyard, heated brick terrace, and discreet smart home systems.',
     2950000.00, 'TOWNHOUSE', 'PENDING', 3, 3.5, 3400,
     '3220 N Street NW', 'Washington', 'DC', '20007', 38.90660000, -77.06380000, 1910);

-- ============================================================================
-- 4. SEED PROPERTY IMAGES
-- ============================================================================

INSERT INTO property_images (property_id, image_url, caption, display_order, is_primary) VALUES
    -- Property 1 (Bel Air Villa)
    ('p0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200', 'Front elevation with illuminated reflection pool', 1, TRUE),
    ('p0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200', 'Expansive living room with floor-to-ceiling glass', 2, FALSE),
    ('p0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200', 'Primary bedroom suite overlooking ocean', 3, FALSE),

    -- Property 2 (Tribeca Penthouse)
    ('p0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200', 'Soaring double-height Great Room', 1, TRUE),
    ('p0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200', 'Chef kitchen with statuary marble island', 2, FALSE),
    ('p0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200', 'Private terrace overlooking skyline', 3, FALSE),

    -- Property 3 (Carmel Estate)
    ('p0000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200', 'Coastal estate amidst cypress trees', 1, TRUE),
    ('p0000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200', 'Wine cellar and tasting lounge', 2, FALSE),

    -- Property 4 (Miami Brickell Condo)
    ('p0000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200', 'Towering skyline and bay vistas', 1, TRUE),
    ('p0000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=1200', 'Sunlit balcony over Biscayne Bay', 2, FALSE),

    -- Property 5 (Austin Hill Country)
    ('p0000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1200', 'Modern farmhouse grounds and lap pool', 1, TRUE),

    -- Property 6 (Georgetown Townhome)
    ('p0000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=1200', 'Restored brick facade and wrought iron gate', 1, TRUE);

-- ============================================================================
-- 5. SEED PROPERTY AMENITIES
-- ============================================================================

INSERT INTO property_amenities (property_id, amenity_id) VALUES
    -- Bel Air Villa (P1)
    ('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'), -- Pool
    ('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002'), -- Gym
    ('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003'), -- Wine
    ('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004'), -- Smart
    ('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005'), -- Views
    ('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000008'), -- EV
    ('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010'), -- Spa

    -- Tribeca Penthouse (P2)
    ('p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004'),
    ('p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005'),
    ('p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000007'),
    ('p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000009'),
    ('p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000011'),
    ('p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000012'),

    -- Carmel Estate (P3)
    ('p0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003'),
    ('p0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000005'),
    ('p0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000006'),
    ('p0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000012');

-- ============================================================================
-- 6. SEED FAVOURITES
-- ============================================================================

INSERT INTO favourites (user_id, property_id) VALUES
    ('u0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000001'), -- Alexander loves Bel Air
    ('u0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000002'), -- Alexander loves Tribeca
    ('u0000000-0000-0000-0000-000000000005', 'p0000000-0000-0000-0000-000000000003'), -- Elena loves Carmel
    ('u0000000-0000-0000-0000-000000000007', 'p0000000-0000-0000-0000-000000000005'); -- David loves Austin

-- ============================================================================
-- 7. SEED ENQUIRIES
-- ============================================================================

INSERT INTO enquiries (id, property_id, buyer_id, agent_id, message, phone, status, agent_notes) VALUES
    ('e0000000-0000-0000-0000-000000000001',
     'p0000000-0000-0000-0000-000000000001',
     'u0000000-0000-0000-0000-000000000004',
     'u0000000-0000-0000-0000-000000000002',
     'I am interested in scheduling a private evening viewing of the Bel Air Pavilion this Thursday. Are proof-of-funds documents required in advance?',
     '+1 (555) 432-1098',
     'PENDING',
     'Lead viewed property 6 times with high dwell time. Priority follow-up required.'),

    ('e0000000-0000-0000-0000-000000000002',
     'p0000000-0000-0000-0000-000000000003',
     'u0000000-0000-0000-0000-000000000005',
     'u0000000-0000-0000-0000-000000000003',
     'Does the Carmel coastal estate have deeded beach access rights, and what are the HOA/coastal commission restrictions?',
     '+1 (555) 654-3210',
     'CONTACTED',
     'Sent coastal commission disclosures. Buyer reviewing with counsel.');

-- ============================================================================
-- 8. SEED USER SESSIONS & BEHAVIOURAL TELEMETRY
-- ============================================================================

INSERT INTO user_sessions (id, user_id, session_token, ip_address, device_type, started_at) VALUES
    ('s0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000004', 'sess_alex_001', '192.168.1.101', 'DESKTOP', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('s0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000004', 'sess_alex_002', '192.168.1.101', 'DESKTOP', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
    ('s0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000005', 'sess_elena_001', '192.168.1.102', 'MOBILE', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('s0000000-0000-0000-0000-000000000004', 'u0000000-0000-0000-0000-000000000006', 'sess_jordan_001', '192.168.1.103', 'DESKTOP', CURRENT_TIMESTAMP - INTERVAL '7 days');

INSERT INTO user_interactions (session_id, user_id, property_id, event_type, dwell_time_seconds, metadata, created_at) VALUES
    -- Alexander Wright (High engagement -> HOT Lead)
    ('s0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000001', 'PROPERTY_VIEW', 240, '{"source": "direct"}', CURRENT_TIMESTAMP - INTERVAL '24 hours'),
    ('s0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000001', 'IMAGE_GALLERY_EXPAND', 95, '{"images_viewed": 3}', CURRENT_TIMESTAMP - INTERVAL '24 hours'),
    ('s0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000001', 'FAVOURITE_ADD', 0, '{}', CURRENT_TIMESTAMP - INTERVAL '24 hours'),
    ('s0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000001', 'PROPERTY_VIEW', 180, '{"repeat_view": true}', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
    ('s0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000001', 'ENQUIRY_SUBMIT', 0, '{"enquiry_id": "e0000000-0000-0000-0000-000000000001"}', CURRENT_TIMESTAMP - INTERVAL '3 hours'),

    -- Elena Rostova (Moderate engagement -> WARM Lead)
    ('s0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000005', 'p0000000-0000-0000-0000-000000000003', 'PROPERTY_VIEW', 140, '{}', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('s0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000005', 'p0000000-0000-0000-0000-000000000003', 'FAVOURITE_ADD', 0, '{}', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('s0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000005', 'p0000000-0000-0000-0000-000000000003', 'ENQUIRY_SUBMIT', 0, '{"enquiry_id": "e0000000-0000-0000-0000-000000000002"}', CURRENT_TIMESTAMP - INTERVAL '2 days'),

    -- Jordan Bell (Low engagement -> COLD Lead)
    ('s0000000-0000-0000-0000-000000000004', 'u0000000-0000-0000-0000-000000000006', 'p0000000-0000-0000-0000-000000000004', 'PROPERTY_VIEW', 25, '{}', CURRENT_TIMESTAMP - INTERVAL '7 days');

-- ============================================================================
-- 9. SEED LEAD PROFILES & SCORE HISTORY
-- ============================================================================

INSERT INTO lead_profiles (user_id, current_score, classification, engagement_score, recency_score, intent_score, total_views, total_favourites, total_enquiries, total_dwell_time, preferred_property_type, preferred_min_price, preferred_max_price, preferred_city, last_active_at) VALUES
    ('u0000000-0000-0000-0000-000000000004', 92, 'HOT', 94.50, 98.00, 90.00, 8, 2, 1, 515, 'VILLA', 8000000.00, 15000000.00, 'Los Angeles', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
    ('u0000000-0000-0000-0000-000000000005', 68, 'WARM', 65.00, 72.00, 68.00, 4, 1, 1, 260, 'ESTATE', 5000000.00, 9000000.00, 'Carmel-by-the-Sea', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('u0000000-0000-0000-0000-000000000006', 18, 'COLD', 20.00, 15.00, 18.00, 1, 0, 0, 25, 'CONDO', 2000000.00, 4000000.00, 'Miami', CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('u0000000-0000-0000-0000-000000000007', 54, 'WARM', 52.00, 60.00, 50.00, 3, 1, 0, 180, 'SINGLE_FAMILY', 3000000.00, 5000000.00, 'Austin', CURRENT_TIMESTAMP - INTERVAL '1 day');

INSERT INTO lead_score_history (user_id, score, classification, reason, feature_contributions) VALUES
    ('u0000000-0000-0000-0000-000000000004', 74, 'WARM', 'Frequent property views and favourites added', '{"views": 0.35, "favourites": 0.25, "recency": 0.14}'),
    ('u0000000-0000-0000-0000-000000000004', 92, 'HOT', 'Submitted high-intent enquiry with repeated luxury views', '{"enquiry": 0.40, "dwell_time": 0.28, "recency": 0.24}'),
    ('u0000000-0000-0000-0000-000000000005', 68, 'WARM', 'Enquiry submitted for Carmel coastal estate', '{"enquiry": 0.45, "views": 0.23}');

-- ============================================================================
-- 10. SEED RECOMMENDATIONS
-- ============================================================================

INSERT INTO recommendations (user_id, property_id, score, algorithm, explanation, rank) VALUES
    ('u0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000002', 0.9420, 'CONTENT_BASED', 'Matches high-end luxury preferences, skyline views, and premium architectural style.', 1),
    ('u0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000003', 0.8870, 'CONTENT_BASED', 'Comparable price tier, private wellness amenities, and secluded grounds.', 2),
    ('u0000000-0000-0000-0000-000000000005', 'p0000000-0000-0000-0000-000000000005', 0.8650, 'CONTENT_BASED', 'Similar acreage and coastal/nature sanctuary ambiance.', 1);
