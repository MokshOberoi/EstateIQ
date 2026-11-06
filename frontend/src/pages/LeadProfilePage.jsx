// src/pages/LeadProfilePage.jsx
import React, { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";

const LeadProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiRequest("/leads/me");
        if (response.ok && response.data?.data) {
          setProfile(response.data.message.data);
        } else {
          setError(response.data?.error?.message || "Failed to load lead profile");
        }
      } catch (e) {
        setError("Network error while loading lead profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <section className="page-section">
        <div className="container" style={{ textAlign: "center", padding: "2rem" }}>
          <p>Loading lead profile…</p>
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

  if (!profile) {
    return (
      <section className="page-section">
        <div className="container">
          <p>No lead profile available.</p>
        </div>
      </section>
    );
  }

  // Render profile fields – adjust to actual shape if needed
  return (
    <section className="page-section">
      <div className="container">
        <h2 className="section-title">Lead Profile</h2>
        <div className="lead-profile">
          {Object.entries(profile).map(([key, value]) => (
            <p key={key}>
              <strong>{key.replace(/_/g, " ")}: </strong>
              {String(value)}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LeadProfilePage;

