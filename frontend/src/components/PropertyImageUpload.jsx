// frontend/src/components/PropertyImageUpload.jsx
// Component for uploading, previewing, and managing property images.
// Uses apiRequest utility; expects backend API under /api/v1.
import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

const MAX_FILES = 10;
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const PropertyImageUpload = ({ propertyId }) => {
  const [existing, setExisting] = useState([]);
  const [selected, setSelected] = useState([]); // File objects with preview URLs
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Load existing images
  useEffect(() => {
    if (!propertyId) return;
    const fetchImages = async () => {
      setLoading(true);
      try {
        const resp = await apiRequest(`/properties/${propertyId}/images`);
        if (resp.ok) {
          setExisting(resp.data?.data?.data || []);
        } else {
          setError(resp.data?.error?.message || 'Failed to load images');
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, [propertyId]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    // Validation
    if (files.length + existing.length + selected.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} images allowed per property.`);
      return;
    }
    const newSelected = [];
    for (const file of files) {
      if (file.size > MAX_SIZE) {
        setError('Each image must be ≤ 5 MB');
        return;
      }
      const preview = URL.createObjectURL(file);
      newSelected.push({ file, preview });
    }
    setSelected((prev) => [...prev, ...newSelected]);
    setError(null);
  };

  const removeSelected = (idx) => {
    const toRemove = selected[idx];
    URL.revokeObjectURL(toRemove.preview);
    setSelected((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    if (!selected.length) return;
    setUploading(true);
    const form = new FormData();
    selected.forEach((s) => form.append('images', s.file));
    try {
      const resp = await apiRequest(`/properties/${propertyId}/images`, {
        method: 'POST',
        body: form,
        // apiRequest sets JSON header by default; we need to omit it for FormData
        headers: {},
      });
      if (resp.ok) {
        // Refresh list
        const refreshed = await apiRequest(`/properties/${propertyId}/images`);
        if (refreshed.ok) setExisting(refreshed.data?.data?.data || []);
        // Cleanup selected
        selected.forEach((s) => URL.revokeObjectURL(s.preview));
        setSelected([]);
      } else {
        setError(resp.data?.error?.message || 'Upload failed');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageId) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      const resp = await apiRequest(`/properties/${propertyId}/images/${imageId}`, { method: 'DELETE' });
      if (resp.ok) {
        setExisting((prev) => prev.filter((img) => img.id !== imageId));
      } else {
        setError(resp.data?.error?.message || 'Delete failed');
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const setPrimary = async (imageId) => {
    try {
      const resp = await apiRequest(`/properties/${propertyId}/images/${imageId}/primary`, { method: 'PATCH' });
      if (resp.ok) {
        // Update state to reflect new primary
        setExisting((prev) =>
          prev.map((img) => ({ ...img, is_primary: img.id === imageId }))
        );
      } else {
        setError(resp.data?.error?.message || 'Failed to set primary');
      }
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="property-image-upload">
      <h3>Property Images</h3>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading images…</p>
      ) : (
        <div className="image-gallery" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {existing.map((img) => (
            <div key={img.id} style={{ position: 'relative' }}>
              <img src={img.image_url} alt="" style={{ width: '120px', height: '80px', objectFit: 'cover' }} />
              {img.is_primary && <span style={{ position: 'absolute', top: 2, left: 2, background: 'gold', padding: '2px 4px', fontSize: '0.7rem' }}>Primary</span>}
              <button className="btn-secondary" style={{ fontSize: '0.7rem' }} onClick={() => deleteImage(img.id)}>Del</button>
              {!img.is_primary && (
                <button className="btn-primary" style={{ fontSize: '0.7rem' }} onClick={() => setPrimary(img.id)}>Make Primary</button>
              )}
            </div>
          ))}
          {selected.map((s, i) => (
            <div key={`new-${i}`} style={{ position: 'relative' }}>
              <img src={s.preview} alt="" style={{ width: '120px', height: '80px', objectFit: 'cover' }} />
              <button className="btn-secondary" style={{ fontSize: '0.7rem' }} onClick={() => removeSelected(i)}>Remove</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: '1rem' }}>
        <input type="file" multiple accept="image/*" onChange={handleFileChange} disabled={uploading} />
        <button className="btn-primary" onClick={handleUpload} disabled={uploading || !selected.length}>
          {uploading ? 'Uploading…' : 'Upload Selected'}
        </button>
      </div>
    </div>
  );
};

export default PropertyImageUpload;

