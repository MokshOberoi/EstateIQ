import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard';
import BrandTagline from '../components/BrandTagline';
import { properties as fallbackProperties } from '../data/properties';
import { apiRequest } from '../services/api';

const HomePage = () => {
  const [featured, setFeatured] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;

    const loadFeatured = async () => {
      try {
        const response = await apiRequest('/properties?limit=6');
        if (cancelled) return;

        const rows = response.data?.data?.data;
        if (!response.ok || !response.data?.success || !Array.isArray(rows)) {
          setFeatured(fallbackProperties);
          setStatus('fallback');
          return;
        }

        if (rows.length === 0) {
          setFeatured([]);
          setStatus('empty');
          return;
        }

        setFeatured(rows.slice(0, 6));
        setStatus('live');
      } catch (_) {
        if (!cancelled) {
          setFeatured(fallbackProperties);
          setStatus('fallback');
        }
      }
    };

    loadFeatured();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-overlay" />
        <div className="container hero-content">
          <BrandTagline />
          <h1>Residences chosen with intention.</h1>
          <p className="subtitle">
            Discover considered homes, follow recommendations shaped by what you love, and reach the agents who know them.
          </p>
          <div className="hero-cta">
            <Link to="/properties" className="btn-primary">Browse Listings</Link>
            <Link to="/register" className="btn-secondary">Get Started</Link>
          </div>
        </div>
      </section>

      <section id="properties" className="section">
        <div className="container">
          <div className="home-heading">
            <p className="eyebrow">The collection</p>
            <h2 className="section-title">Featured Properties</h2>
            <p className="home-lead">
              A quiet edit of homes currently on PropIntent.
            </p>
          </div>

          {status === 'loading' && (
            <p className="home-status">Gathering residences…</p>
          )}

          {status === 'empty' && (
            <div className="home-empty">
              <p>No residences are listed yet.</p>
              <Link to="/properties" className="btn-primary">View all properties</Link>
            </div>
          )}

          {status === 'fallback' && (
            <p className="home-note">
              Live listings are unavailable right now. These sample residences show the collection until the catalogue returns.
            </p>
          )}

          {featured.length > 0 && (
            <div className="property-grid home-featured">
              {featured.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}

          {status === 'live' && (
            <div className="home-more">
              <Link to="/properties" className="btn-secondary">View all properties</Link>
            </div>
          )}
        </div>
      </section>

      <section id="how-it-works" className="section bg-light">
        <div className="container">
          <div className="home-heading">
            <p className="eyebrow">A calmer search</p>
            <h2 className="section-title">How PropIntent Works</h2>
          </div>
          <div className="steps">
            <article className="step">
              <span className="step-number">01</span>
              <h3>Browse with care</h3>
              <p>Move through residences chosen for light, proportion, and a sense of place.</p>
            </article>
            <article className="step">
              <span className="step-number">02</span>
              <h3>Let preference lead</h3>
              <p>Recommendations learn from the homes you linger on, save, and enquire about.</p>
            </article>
            <article className="step">
              <span className="step-number">03</span>
              <h3>Speak with an agent</h3>
              <p>When a home feels right, send an enquiry and arrange a private viewing.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="ai" className="section">
        <div className="container ai-content">
          <div className="ai-text">
            <p className="eyebrow">Intelligent personalisation</p>
            <h2 className="section-title">Homes that feel hand-picked.</h2>
            <p>
              PropIntent notices the details you return to — property type, price, and neighbourhood — and brings forward residences that fit that pattern.
            </p>
            <Link to="/properties" className="btn-primary">Start Exploring</Link>
          </div>
          <div
            className="ai-visual"
            role="img"
            aria-label="Warm, sunlit luxury residence with stone, glass, and a quiet garden"
          />
        </div>
      </section>

      <section className="section home-closing">
        <div className="container home-closing-inner">
          <p className="eyebrow">Begin</p>
          <h2 className="section-title">Ready to find a home with purpose?</h2>
          <p>Browse the collection, or create an account to save favourites and receive recommendations.</p>
          <div className="hero-cta">
            <Link to="/properties" className="btn-primary">Browse Listings</Link>
            <Link to="/register" className="btn-secondary">Create Your Account</Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
