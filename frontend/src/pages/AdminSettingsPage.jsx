import React, { useState, useEffect } from 'react';
import {
  Settings, Plus, Edit2, Trash2, CheckCircle2,
  Database, ShieldCheck, Tag, Sparkles
} from 'lucide-react';
import api from '../api';

export default function AdminSettingsPage({ user, notify }) {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Field Form State
  const [label, setLabel] = useState('');
  const [fieldType, setFieldType] = useState('select');
  const [optionsStr, setOptionsStr] = useState('');
  const [required, setRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFields();
  }, []);

  async function loadFields() {
    setLoading(true);
    try {
      const res = await api.get('/metadata/fields');
      setFields(res.data.fields || []);
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to load metadata fields.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddField(e) {
    e.preventDefault();
    if (!label.trim()) {
      notify('Field label is required.');
      return;
    }

    setSubmitting(true);
    try {
      const options = fieldType === 'select'
        ? optionsStr.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      if (fieldType === 'select' && options.length === 0) {
        notify('Please enter at least one option for select fields.');
        setSubmitting(false);
        return;
      }

      await api.post('/metadata/fields', {
        label: label.trim(),
        type: fieldType,
        options,
        required
      });

      notify(`Metadata field "${label}" created successfully!`);
      setLabel('');
      setOptionsStr('');
      loadFields();
    } catch (err) {
      notify(err.response?.data?.message || err.response?.data?.error || 'Failed to create field.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteField(fieldId, fieldLabel) {
    if (!window.confirm(`Are you sure you want to remove the field "${fieldLabel}"?`)) {
      return;
    }

    try {
      await api.delete(`/metadata/fields/${fieldId}`);
      notify(`Field "${fieldLabel}" removed.`);
      loadFields();
    } catch (err) {
      notify(err.response?.data?.message || err.response?.data?.error || 'Failed to delete field.');
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '6px' }}>
          Dynamic Metadata & Settings
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '14px' }}>
          Configure, extend, and edit customizable document metadata fields without code modifications.
        </p>
      </div>

      {/* System Status Indicators */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
            <Database size={24} />
          </div>
          <div>
            <div className="stat-label">Database & Storage</div>
            <div className="stat-val" style={{ fontSize: '17px', color: '#6EE7B7' }}>
              MongoDB + GridFS Active
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818CF8' }}>
            <Sparkles size={24} />
          </div>
          <div>
            <div className="stat-label">OCR Engine Pipeline</div>
            <div className="stat-val" style={{ fontSize: '17px', color: '#A5B4FC' }}>
              PyMuPDF + Tesseract Dual
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
            <Tag size={24} />
          </div>
          <div>
            <div className="stat-label">Active Custom Fields</div>
            <div className="stat-val" style={{ fontSize: '22px' }}>
              {fields.length}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '28px' }}>
        {/* Create Field Form */}
        <div style={{
          backgroundColor: '#1E293B',
          border: '1px solid #334155',
          borderRadius: '16px',
          padding: '24px',
          height: 'fit-content'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} color="#818CF8" /> Add Customizable Field
          </h3>
          <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '20px' }}>
            Newly created fields immediately appear in document upload forms and filter bars.
          </p>

          <form onSubmit={handleAddField} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Field Display Label</label>
              <input
                required
                type="text"
                className="form-input"
                placeholder="e.g. Report Type, Project Code, Audit Fiscal Year"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Field Data Type</label>
              <select
                className="form-select"
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value)}
              >
                <option value="select">Dropdown Select (Predefined Options)</option>
                <option value="text">Freeform Text</option>
                <option value="number">Numeric Value</option>
                <option value="date">Calendar Date</option>
              </select>
            </div>

            {fieldType === 'select' && (
              <div className="form-group">
                <label>Dropdown Options (Comma-Separated)</label>
                <textarea
                  required
                  rows={3}
                  className="form-input"
                  placeholder="e.g. Financial, Technical, Operational, Legal, Compliance"
                  value={optionsStr}
                  onChange={(e) => setOptionsStr(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
                <small>Separate choices with commas.</small>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <input
                type="checkbox"
                id="reqCheck"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="reqCheck" style={{ fontSize: '13px', color: '#CBD5E1', cursor: 'pointer', margin: 0, textTransform: 'none' }}>
                Mark field as mandatory during upload
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ marginTop: '8px' }}
            >
              {submitting ? 'Creating Field...' : 'Add Metadata Field'}
            </button>
          </form>
        </div>

        {/* Existing Dynamic Fields List */}
        <div className="table-card">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #334155' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Configured Dynamic Metadata Fields</h3>
            <p style={{ fontSize: '12px', color: '#94A3B8' }}>
              Fields stored in MongoDB `metadata_fields` collection.
            </p>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
              Loading metadata fields...
            </div>
          ) : fields.length === 0 ? (
            <div className="empty-state">
              <p>No custom metadata fields configured.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {fields.map((f) => (
                <div
                  key={f._id}
                  style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #1E293B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '14px', color: '#F8FAFC' }}>{f.label}</strong>
                      <span className="badge badge-info" style={{ fontSize: '10px' }}>{f.type}</span>
                      {f.required && (
                        <span className="badge badge-warning" style={{ fontSize: '10px' }}>Required</span>
                      )}
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                      Key: {f.key}
                    </div>

                    {f.type === 'select' && Array.isArray(f.options) && f.options.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {f.options.map((opt) => (
                          <span
                            key={opt}
                            style={{
                              fontSize: '11px',
                              background: 'rgba(15, 23, 42, 0.6)',
                              border: '1px solid #334155',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              color: '#CBD5E1'
                            }}
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDeleteField(f._id, f.label)}
                      title="Deactivate field"
                      style={{ color: '#EF4444' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
