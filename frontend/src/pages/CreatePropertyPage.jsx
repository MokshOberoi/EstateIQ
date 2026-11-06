// src/pages/CreatePropertyPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import PropertyForm from "../components/PropertyForm";
import { apiRequest } from "../services/api";

/**
 * Page for agents/admins to create a new property.
 */
const CreatePropertyPage = () => {
  const navigate = useNavigate();

  const handleSubmit = async (payload) => {
    // Call backend create endpoint
    const response = await apiRequest("/properties", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response; // PropertyForm will handle error display based on .ok
  };

  const onSuccess = async (response) => {
    if (response.ok) {
      // Successful creation – navigate to My Listings
      navigate("/my-listings");
    }
  };

  // Wrap submit to handle navigation after success
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
      </div>
    </section>
  );
};

export default CreatePropertyPage;

