// src/components/PropertyForm.jsx
import React, { useState } from "react";

/**
 * Reusable property form for create / edit.
 * Props:
 *   - initialValues: object with field values (optional)
 *   - onSubmit: async function that receives the payload and returns { ok, data }
 *   - mode: "create" | "edit" (used for button label)
 */
const PropertyForm = ({ initialValues = {}, onSubmit, mode = "create" }) => {
  const [form, setForm] = useState({
    title: initialValues.title || "",
    description: initialValues.description || "",
    price: initialValues.price || "",
    property_type: initialValues.property_type || "",
    status: initialValues.status || "",
    bedrooms: initialValues.bedrooms || "",
    bathrooms: initialValues.bathrooms || "",
    square_feet: initialValues.square_feet || "",
    address: initialValues.address || "",
    city: initialValues.city || "",
    state: initialValues.state || "",
    zip_code: initialValues.zip_code || "",
    year_built: initialValues.year_built ?? "",
    latitude: initialValues.latitude ?? "",
    longitude: initialValues.longitude ?? "",
    amenities: initialValues.amenities ? initialValues.amenities.join(",") : "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setApiError(null);
    // Build payload converting numeric fields
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      property_type: form.property_type,
      status: form.status,
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      square_feet: Number(form.square_feet),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      zip_code: form.zip_code.trim(),
    };
    // optional fields
    if (form.year_built) payload.year_built = Number(form.year_built);
    if (form.latitude) payload.latitude = Number(form.latitude);
    if (form.longitude) payload.longitude = Number(form.longitude);
    if (form.amenities) {
      // split by comma, filter empty, keep as array of strings
      const arr = form.amenities.split(",").map((s) => s.trim()).filter(Boolean);
      if (arr.length) payload.amenities = arr;
    }
    try {
      const response = await onSubmit(payload);
      if (!response.ok) {
        const msg = response.data?.error?.message || "Submission failed";
        setApiError(msg);
      }
    } catch (err) {
      setApiError(err.message || "Unexpected error");
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="property-form">
      {apiError && <p className="error">{apiError}</p>}
      {/* Required fields */}
      <label>
        Title*:
        <input type="text" name="title" value={form.title} onChange={handleChange} required />
      </label>
      <label>
        Description*:
        <textarea name="description" value={form.description} onChange={handleChange} required />
      </label>
      <label>
        Price*:
        <input type="number" name="price" value={form.price} onChange={handleChange} required min="0" step="0.01" />
      </label>
      <label>
        Property Type*:
        <select name="property_type" value={form.property_type} onChange={handleChange} required>
          <option value="">Select type</option>
          <option value="SINGLE_FAMILY">Single Family</option>
          <option value="APARTMENT">Apartment</option>
          <option value="CONDO">Condo</option>
          <option value="TOWNHOUSE">Townhouse</option>
          <option value="VILLA">Villa</option>
          <option value="PENTHOUSE">Penthouse</option>
          <option value="ESTATE">Estate</option>
        </select>
      </label>
      <label>
        Status*:
        <select name="status" value={form.status} onChange={handleChange} required>
          <option value="">Select status</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="SOLD">Sold</option>
        </select>
      </label>
      <label>
        Bedrooms*:
        <input type="number" name="bedrooms" value={form.bedrooms} onChange={handleChange} required min="0" />
      </label>
      <label>
        Bathrooms*:
        <input type="number" name="bathrooms" value={form.bathrooms} onChange={handleChange} required min="0" step="0.5" />
      </label>
      <label>
        Square Feet*:
        <input type="number" name="square_feet" value={form.square_feet} onChange={handleChange} required min="0" />
      </label>
      <label>
        Address*:
        <input type="text" name="address" value={form.address} onChange={handleChange} required />
      </label>
      <label>
        City*:
        <input type="text" name="city" value={form.city} onChange={handleChange} required />
      </label>
      <label>
        State*:
        <input type="text" name="state" value={form.state} onChange={handleChange} required />
      </label>
      <label>
        Zip Code*:
        <input type="text" name="zip_code" value={form.zip_code} onChange={handleChange} required />
      </label>
      {/* Optional fields */}
      <label>
        Year Built:
        <input type="number" name="year_built" value={form.year_built} onChange={handleChange} min="1800" max="2100" />
      </label>
      <label>
        Latitude:
        <input type="number" name="latitude" value={form.latitude} onChange={handleChange} step="0.000001" min="-90" max="90" />
      </label>
      <label>
        Longitude:
        <input type="number" name="longitude" value={form.longitude} onChange={handleChange} step="0.000001" min="-180" max="180" />
      </label>
      <label>
        Amenities (comma‑separated UUIDs):
        <input type="text" name="amenities" value={form.amenities} onChange={handleChange} placeholder="e.g. a1b2c3…, d4e5f6…" />
      </label>
      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? "Submitting…" : mode === "edit" ? "Update Property" : "Create Property"}
      </button>
    </form>
  );
};

export default PropertyForm;

