import React from 'react';
import aiImage from '../assets/ai-personalization.jpg';
import { Link } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard';
import { properties } from '../data/properties';

const HomePage = () => (
  <>
    {/* Hero */}
    <section className="hero">
      <div className="hero-overlay" />
      <div className="container hero-content">
        <h1>Premium Real‑Estate, Intelligently Personalized</h1>
        <p className="subtitle">
          Discover luxury homes, get AI‑driven recommendations, and connect with trusted agents.
        </p>
        <div className="hero-cta">
          <Link to="/properties" className="btn-primary">Browse Listings</Link>
          <Link to="/register" className="btn-secondary">Get Started</Link>
        </div>
      </div>
    </section>

    {/* Featured Properties */}
    <section id="properties" className="section">
      <div className="container">
        <h2 className="section-title">Featured Properties</h2>
        <div className="grid">
          {properties.map(p => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </div>
    </section>

    {/* How it works */}
    <section id="how-it-works" className="section bg-light">
      <div className="container">
        <h2 className="section-title">How EstateIQ Works</h2>
        <div className="steps">
          <div className="step">
            <span className="step-number">1</span>
            <h3>Browse Luxury Listings</h3>
            <p>Explore curated, high‑end properties worldwide.</p>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <h3>Get AI Recommendations</h3>
            <p>Our engine analyses your preferences and behaviour.</p>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <h3>Connect with Agents</h3>
            <p>Directly contact verified agents to arrange viewings.</p>
          </div>
        </div>
      </div>
    </section>

    {/* AI section */}
    <section id="ai" className="section">
      <div className="container ai-content">
        <div className="ai-text">
          <h2 className="section-title">Intelligent Personalisation</h2>
          <p>
            EstateIQ’s subtle AI layer learns what you love – from property type to neighbourhood vibes – and surfaces homes that feel hand‑picked just for you.
          </p>
          <Link to="/properties" className="btn-primary">Start Exploring</Link>
        </div>
        <div className="ai-image">
          <img
            src={aiImage}
            alt="AI personalisation illustration"
          />
        </div>
      </div>
    </section>

    {/* Final CTA */}
    <section className="section bg-light">
      <div className="container" style={{textAlign:'center'}}>
        <h2 className="section-title">Ready to Find Your Dream Home?</h2>
        <Link to="/register" className="btn-primary">Create Your Account</Link>
      </div>
    </section>
  </>
);

export default HomePage;

