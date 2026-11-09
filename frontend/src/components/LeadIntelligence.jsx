// src/components/LeadIntelligence.jsx
import React from "react";
import PropTypes from "prop-types";

// Helper to format numbers (currency not needed here)
const formatNumber = (n) => (Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

const LeadIntelligence = ({ profile, mlPrediction }) => {
  if (!profile) {
    return (
      <section className="lead-intelligence">
        <h3 className="section-title">AI / Lead Intelligence</h3>
        <p>No lead profile available.</p>
      </section>
    );
  }

  const {
    classification,
    current_score,
    total_views,
    total_favourites,
    total_enquiries,
    total_dwell_time,
    engagement_score,
    recency_score,
    intent_score,
  } = profile;

  return (
    <section className="lead-intelligence">
      <h3 className="section-title">AI / Lead Intelligence</h3>
      <div className="lead-section">
        <h4>Rule‑Based Profile</h4>
        <ul className="lead-list">
          <li><strong>Classification:</strong> {classification || "N/A"}</li>
          <li><strong>Lead Score:</strong> {formatNumber(current_score)}/100</li>
          <li><strong>Total Views:</strong> {formatNumber(total_views)}</li>
          <li><strong>Total Favourites:</strong> {formatNumber(total_favourites)}</li>
          <li><strong>Total Enquiries:</strong> {formatNumber(total_enquiries)}</li>
          <li><strong>Total Dwell Time:</strong> {formatNumber(total_dwell_time)}s</li>
          <li><strong>Engagement Score:</strong> {formatNumber(engagement_score)}</li>
          <li><strong>Recency Score:</strong> {formatNumber(recency_score)}</li>
          <li><strong>Intent Score:</strong> {formatNumber(intent_score)}</li>
        </ul>
      </div>

      {mlPrediction && (
        <div className="lead-section mt-3">
          <h4>ML Prediction</h4>
          <ul className="lead-list">
            <li><strong>Classification:</strong> {mlPrediction.classification}</li>
            <li><strong>Confidence:</strong> {(mlPrediction.confidence * 100).toFixed(1)}%</li>
            <li><strong>Probabilities:</strong></li>
            <ul className="probabilities-list">
              <li>COLD: {(mlPrediction.probabilities.COLD * 100).toFixed(1)}%</li>
              <li>WARM: {(mlPrediction.probabilities.WARM * 100).toFixed(1)}%</li>
              <li>HOT: {(mlPrediction.probabilities.HOT * 100).toFixed(1)}%</li>
            </ul>
          </ul>
        </div>
      )}
    </section>
  );
};

LeadIntelligence.propTypes = {
  profile: PropTypes.object,
  mlPrediction: PropTypes.object,
};

export default LeadIntelligence;

