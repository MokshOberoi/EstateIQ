// src/pages/MyListingsPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropertyCard from "../components/PropertyCard";
import { apiRequest } from "../services/api";

/**
 * Page that lists the authenticated agent/admin's own property listings.
 * Provides edit and delete actions for each property.
 */
const MyListingsPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const fetchListings = async () => {
    try {
      const response = await apiRequest("/properties/my/listings");
      if (response.ok) {
        const data = response.data?.data?.data || [];
        setListings(data);
      } else {
        setError(response.data?.error?.message || "Failed to load listings");
      }
    } catch (e) {
      setError(e.message || "Error loading listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleEdit = (id) => {
    navigate(`/properties/${id}/edit`);
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setShowConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setShowConfirm(false);
    setLoading(true);
    try {
      const response = await apiRequest(`/properties/${deletingId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        // Remove from local state
        setListings((prev) => prev.filter((p) => p.id !== deletingId));
      } else {
        setError(response.data?.error?.message || "Failed to delete property");
      }
    } catch (e) {
      setError(e.message || "Error deleting property");
    } finally {
      setDeletingId(null);
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowConfirm(false);
    setDeletingId(null);
  };

  // UI states
  if (loading) {
    return (
      <section className="page-section">
        <div className="container" style={{ textAlign: "center", padding: "2rem" }}>
          <p>Loading listings…</p>
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

  if (listings.length === 0) {
    return (
      <section className="page-section">
        <div className="container">
          <h2 className="section-title">My Listings</h2>
          <p>You have no property listings yet.</p>
          <button className="btn-primary" onClick={() => navigate("/properties/create")}>Add Property</button>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="container">
        <h2 className="section-title">My Listings</h2>
        <div className="property-grid">
          {listings.map((property) => (
            <div key={property.id} className="property-card-wrapper">
              <PropertyCard property={property} />
              <div className="card-actions" style={{ marginTop: "0.5rem" }}>
                <button className="btn-primary" onClick={() => handleEdit(property.id)} style={{ marginRight: "0.5rem" }}>
                  Edit
                </button>
                <button className="btn-secondary" onClick={() => handleDeleteClick(property.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Confirmation modal */}
      {showConfirm && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-content" style={{ background: "#fff", padding: "1rem", maxWidth: "400px", margin: "10% auto", borderRadius: "4px" }}>
            <p>Are you sure you want to delete this property?</p>
            <button className="btn-primary" onClick={handleDeleteConfirm} style={{ marginRight: "0.5rem" }}>Yes</button>
            <button className="btn-secondary" onClick={handleDeleteCancel}>No</button>
          </div>
        </div>
      )}
    </section>
  );
};

export default MyListingsPage;

