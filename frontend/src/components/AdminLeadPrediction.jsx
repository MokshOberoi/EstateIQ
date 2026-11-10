// src/components/AdminLeadPrediction.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import LeadIntelligence from "./LeadIntelligence";

/**
 * AdminLeadPrediction – renders a button that triggers the ML prediction
 * endpoint for a given lead (admin only). After fetching, it shows a compact
 * result with classification badge, confidence, and a "View Details" button.
 * The full LeadIntelligence view is displayed in a modal.
 */
const AdminLeadPrediction = ({ lead }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mlPrediction, setMlPrediction] = useState(null);
  const [fetched, setFetched] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Redirect unauthenticated users to login
  if (!user) {
    navigate("/login");
    return null;
  }

  const handlePredict = async () => {
    if (loading || fetched) return;
    setLoading(true);
    setError(null);
    const userId = lead.user_id || lead.id;
    try {
      const response = await apiRequest(`/leads/${userId}/predict`, {
        method: "POST",
      });
      if (response.ok) {
        const payload = response.data?.data || {};
        setMlPrediction(payload.mlPrediction);
        setFetched(true);
      } else {
        const status = response.status;
        if (status === 502) {
          setError("AI prediction service is currently unavailable. Please try again later.");
        } else if (status === 401 || status === 403) {
          setError("You do not have permission to request an AI prediction.");
        } else {
          setError(response.data?.error?.message || "Failed to retrieve AI prediction.");
        }
      }
    } catch (e) {
      setError(e.message || "Unexpected error while fetching prediction.");
    } finally {
      setLoading(false);
    }
  };

  const renderBadge = (cls) => {
    const lower = (cls || "").toLowerCase();
    const colorMap = { hot: "#d32f2f", warm: "#f57c00", cold: "#0288d1" };
    const bg = colorMap[lower] || "#777";
    return (
      <span
        className="status-badge"
        style={{
          backgroundColor: bg,
          color: "white",
          padding: "0.2rem 0.5rem",
          borderRadius: "4px",
          fontSize: "0.85rem",
          marginRight: "0.5rem",
        }}
      >
        {cls?.toUpperCase() || "N/A"}
      </span>
    );
  };

  return (
    <div>
      {/* Button before prediction */}
      {!fetched && (
        <button
          className="btn-primary"
          onClick={handlePredict}
          disabled={loading}
          style={{ padding: "0.3rem 0.6rem", fontSize: "0.85rem" }}
        >
          {loading ? "Loading…" : "Get AI Prediction"}
        </button>
      )}

      {error && (
        <p className="error" style={{ color: "red", marginTop: "0.5rem" }}>
          {error}
        </p>
      )}

      {/* Compact result after prediction */}
      {mlPrediction && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {renderBadge(mlPrediction.classification)}
          <span style={{ fontSize: "0.85rem" }}>
            {Math.round((mlPrediction.confidence ?? 0) * 100)}% confidence
          </span>
          <button
            className="btn-secondary"
            onClick={() => setShowDetails(true)}
            style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem" }}
          >
            View Details
          </button>
        </div>
      )}

      {/* Modal with full LeadIntelligence */}
      {showDetails && mlPrediction && (
        <div
          className="modal-overlay"
          onClick={() => setShowDetails(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              padding: "1.5rem",
              borderRadius: "8px",
              maxWidth: "90%",
              maxHeight: "90%",
              overflowY: "auto",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowDetails(false)}
              style={{
                position: "absolute",
                top: "0.5rem",
                right: "0.5rem",
                background: "transparent",
                border: "none",
                fontSize: "1.2rem",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
            <LeadIntelligence profile={lead} mlPrediction={mlPrediction} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeadPrediction;
