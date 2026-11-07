// src/pages/EditPropertyPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropertyImageUpload from "../components/PropertyImageUpload";
import PropertyForm from "../components/PropertyForm";
import { apiRequest } from "../services/api";

/**
 * Page for agents/admins to edit an existing property.
 * Loads the property data, pre‑fills the form, and submits updates.
 */
const EditPropertyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load property on mount
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await apiRequest(`/properties/${id}`);
        if (response.ok) {
          // Backend envelope: response.data?.data?.data
          const data = response.data?.data?.data || {};
          setProperty(data);
        } else {
          const msg = response.data?.error?.message || "Failed to load property";
          setError(msg);
        }
      } catch (e) {
        setError(e.message || "Error loading property");
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  const handleSubmit = async (payload) => {
    const response = await apiRequest(`/properties/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return response;
  };

  const onSuccess = async (response) => {
    if (response.ok) {
      navigate("/my-listings");
    }
  };

  const submitWrapper = async (payload) => {
    const res = await handleSubmit(payload);
    await onSuccess(res);
    return res;
  };

  // UI states
  if (loading) {
    return (
      <section className="page-section">
        <div className="container" style={{ textAlign: "center", padding: "2rem" }}>
          <p>Loading property…</p>
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
        <h2 className="section-title">Edit Property</h2>
        <PropertyForm mode="edit" initialValues={property} onSubmit={submitWrapper} />
        {property && (
          <div style={{ marginTop: '2rem' }}>
            <h3>Manage Images</h3>
            <PropertyImageUpload propertyId={id} />
          </div>
        )}
      </div>
    </section>
  );
};

export default EditPropertyPage;

