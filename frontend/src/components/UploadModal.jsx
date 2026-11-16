import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import api from '../api';

export default function UploadModal({ user, fields, onClose, onSuccess, notify }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [dynamicMeta, setDynamicMeta] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Handle file input
  function handleFileChange(e) {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  }

  // Handle dynamic metadata change
  function handleMetaChange(key, value) {
    setDynamicMeta((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) {
      setErr('Please select a PDF or image file to upload.');
      return;
    }

    setBusy(true);
    setErr('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim() || file.name);

      // Merge dynamic custom metadata
      // Division is locked to user's division
      const metadataPayload = {
        ...dynamicMeta,
        Division: user.division
      };
      formData.append('metadata', JSON.stringify(metadataPayload));

      const res = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      notify('Document uploaded and indexed successfully!');
      onSuccess(res.data.document);
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to upload document.';
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Upload New Document</h3>
            <p style={{ fontSize: '12px', color: '#94A3B8' }}>
              Files are stored in GridFS and processed with OCR text extraction.
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleUpload}>
          <div className="modal-body">
            {err && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#F87171',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} /> {err}
              </div>
            )}

            {/* Division Lock Notice */}
            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12px',
              color: '#A5B4FC'
            }}>
              <Lock size={15} />
              <div>
                Target Division: <strong>{user?.division}</strong> (RBAC isolated to your division)
              </div>
            </div>

            {/* File Dropzone */}
            <label className={`dropzone ${file ? 'dropzone-file-selected' : ''}`}>
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/tiff,image/bmp,image/webp"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {file ? (
                <>
                  <CheckCircle2 size={32} color="#10B981" />
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#F8FAFC' }}>{file.name}</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                    {(file.size / 1024).toFixed(1)} KB · Ready for OCR processing
                  </div>
                </>
              ) : (
                <>
                  <Upload size={32} color="#818CF8" />
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#F8FAFC' }}>
                    Click or drag file to upload
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                    Supports PDF, PNG, JPG, TIFF, BMP (Max 50MB)
                  </div>
                </>
              )}
            </label>

            {/* Document Title */}
            <div className="form-group">
              <label>Document Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Q3 Financial Statement & Audit"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Dynamic Custom Metadata Section */}
            <div style={{ marginTop: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px'
              }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#A5B4FC', textTransform: 'uppercase' }}>
                  Dynamic Custom Metadata
                </label>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Configured fields from database
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {fields && fields.map((f) => {
                  const fieldKey = f.key || f.label;
                  if (fieldKey.toLowerCase() === 'division') return null;

                  return (
                    <div key={f._id || fieldKey} className="form-group">
                      <label>{f.label}</label>
                      {f.type === 'select' && Array.isArray(f.options) && f.options.length > 0 ? (
                        <select
                          className="form-select"
                          value={dynamicMeta[fieldKey] || ''}
                          onChange={(e) => handleMetaChange(fieldKey, e.target.value)}
                        >
                          <option value="">-- Choose {f.label} --</option>
                          {f.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                          className="form-input"
                          placeholder={`Enter ${f.label.toLowerCase()}...`}
                          value={dynamicMeta[fieldKey] || ''}
                          onChange={(e) => handleMetaChange(fieldKey, e.target.value)}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Default Fallback for Report Type if not loaded yet */}
                {(!fields || !fields.some(f => (f.key || '').toLowerCase().includes('report_type'))) && (
                  <div className="form-group">
                    <label>Report Type</label>
                    <select
                      className="form-select"
                      value={dynamicMeta['Report Type'] || 'Financial'}
                      onChange={(e) => handleMetaChange('Report Type', e.target.value)}
                    >
                      <option value="Financial">Financial</option>
                      <option value="Technical">Technical</option>
                      <option value="Operational">Operational</option>
                      <option value="Audit">Audit</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy || !file}>
              {busy ? 'Processing OCR & Uploading...' : 'Upload & Index'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
