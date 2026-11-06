// src/pages/RecommendationsPage.jsx
import React, { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import PropertyCard from "../components/PropertyCard";

const RecommendationsPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [limit, setLimit] = useState(10);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("/recommendations/me");
      if (response.ok && response.data?.data?.items) {
        setItems(response.data.message.data.items);
      } else {
        setError(response.data?.error?.message || "Failed to load recommendations");
      }
    } catch (e) {
      setError("Network error while loading recommendations");
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    setGenerating(true);
    try {
      const response = await apiRequest("/recommendations/generate", {
        method: "POST",
        body: JSON.stringify({ limit }),
      });
      if (!response.ok) {
        setError(response.data?.error?.message || "Failed to generate recommendations");
        return;
      }
      // After generation, refresh list
      await fetchRecommendations();
    } catch (e) {
      setError("Network error while generating recommendations");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <section className="page-section">
        <div className="container" style={{ textAlign: "center", padding: "2rem" }}>
          <p>Loading recommendations…</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-section">
        <div className="container">
          <p className="error">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="container">
        <h2 className="section-title">Property Recommendations</h2>
        <div className="recommendation-controls" style={{ marginBottom: "1rem" }}>
          <label>
            Limit:{" "}
            <input
              type="number"
              min={1}
              max={50}
              value={limit}
              onChange={(e) => setLimit(Math.min(50, Math.max(1, Number(e.target.value))))}
              style={{ width: "4rem", marginLeft: "0.5rem" }}
            />
          </label>
          <button onClick={generateRecommendations} disabled={generating} style={{ marginLeft: "1rem" }}>
            {generating ? "Generating…" : "Generate Recommendations"}
          </button>
        </div>
        {items.length === 0 ? (
          <p>No recommendations available.</p>
        ) : (
          <div className="property-grid">
            {items.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RecommendationsPage;

