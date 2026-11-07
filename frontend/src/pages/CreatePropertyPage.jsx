// src/pages/CreatePropertyPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PropertyImageUpload from "../components/PropertyImageUpload";
import PropertyForm from "../components/PropertyForm";
import { apiRequest } from "../services/api";

/**
 * Page for agents/admins to create a new property.
 */
const CreatePropertyPage = () => {
  const navigate = useNavigate();
  const [createdId, setCreatedId] = useState(null);

  const handleSubmit = async (payload) => {
    const response = await apiRequest("/properties", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      const id = response.data?.data?.data?.id || response.data?.data?.id;
      if (id) setCreatedId(id);
    }
    return response;
  };

  const onSuccess = async (response) => {
    if (response.ok) {
      // stay on page to allow image upload; navigation optional
    }
  };

  const submitWrapper = async (payload) => {
    const res = await handleSubmit(payload);
    await onSuccess(res);
    return res;
  };

  return (
    <section className="page-section">
      <div className="container">
        <h2 className="section-title">Add Property</h2>
        <PropertyForm mode="create" onSubmit={submitWrapper} />
        {createdId && (
          <div style={{ marginTop: "2rem" }}>
            <h3>Upload Images</h3>
            <PropertyImageUpload propertyId={createdId} />
            <button
              className="btn-primary"
              style={{ marginTop: "1rem" }}
              onClick={() => navigate("/my-listings")}
            >
              Done / Go to My Listings
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CreatePropertyPage;
