import React, { useState, useEffect } from 'react';
import {
  FileText, Upload, Filter, Building2, Shield, Clock,
  ChevronRight, Download, Lock, CheckCircle, Search
} from 'lucide-react';
import api from '../api';
import UploadModal from '../components/UploadModal';

export default function DashboardPage({ user, onSelectDoc, notify }) {
  const [docs, setDocs] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  // Filters
  const [scope, setScope] = useState('division'); // 'division' | 'all' | 'approved'
  const [divisionFilter, setDivisionFilter] = useState('');
  const [reportTypeFilter, setReportTypeFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const divisionsList = [
    'Division A',
    'Division B',
    'Division C',
    'Division Finance',
    'Division Operations'
  ];

  useEffect(() => {
    loadFields();
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [scope, divisionFilter, reportTypeFilter]);

  async function loadFields() {
    try {
      const res = await api.get('/metadata/fields');
      setFields(res.data.fields || []);
    } catch (e) {
      console.error('Failed to load metadata fields:', e);
    }
  }

  async function loadDocuments() {
    setLoading(true);
    try {
      const params = { scope };

      if (divisionFilter) {
        params.division = divisionFilter;
      }

      if (reportTypeFilter) {
        params['Report Type'] = reportTypeFilter;
      }

      const res = await api.get('/documents', { params });
      setDocs(res.data.documents || []);
    } catch (err) {
      notify(err.response?.data?.message || 'Error loading documents.');
    } finally {
      setLoading(false);
    }
  }

  // Find Report Type options from dynamic metadata fields
  const reportTypeField = fields.find(f => (f.key || '').toLowerCase().includes('report_type'));
  const reportTypeOptions = reportTypeField?.options || ['Financial', 'Technical', 'Operational', 'Audit', 'Strategic'];

  // Client-side quick filter on title/filename
  const displayedDocs = docs.filter(d => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      (d.title || '').toLowerCase().includes(term) ||
      (d.filename || '').toLowerCase().includes(term)
    );
  });

  return (
    <div>
      {/* Top Welcome Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '6px' }}>
            Document Hub
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '14px' }}>
            Browse, manage, and filter documents with RBAC division isolation.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowUpload(true)}
          style={{ padding: '12px 20px', fontSize: '14px' }}
        >
          <Upload size={17} /> Upload Document
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FileText size={24} />
          </div>
          <div>
            <div className="stat-label">Accessible Documents</div>
            <div className="stat-val">{docs.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
            <Building2 size={24} />
          </div>
          <div>
            <div className="stat-label">Your Division</div>
            <div className="stat-val" style={{ fontSize: '18px', color: '#6EE7B7' }}>
              {user?.division}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
            <Shield size={24} />
          </div>
          <div>
            <div className="stat-label">Role Authorization</div>
            <div className="stat-val" style={{ fontSize: '18px', color: '#FCD34D' }}>
              {user?.role === 'admin' ? 'System Administrator' : 'Division Member'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Scope Control Bar */}
      <div className="filter-bar">
        <div className="filter-left">
          {/* Scope Selector Tabs */}
          <div className="scope-tabs">
            <button
              className={`scope-tab ${scope === 'division' ? 'active' : ''}`}
              onClick={() => { setScope('division'); setDivisionFilter(''); }}
            >
              My Division
            </button>
            <button
              className={`scope-tab ${scope === 'all' ? 'active' : ''}`}
              onClick={() => setScope('all')}
            >
              All Divisions (Catalog)
            </button>
            <button
              className={`scope-tab ${scope === 'approved' ? 'active' : ''}`}
              onClick={() => { setScope('approved'); setDivisionFilter(''); }}
            >
              Approved Cross-Division
            </button>
          </div>

          {/* Division Filter */}
          <select
            className="filter-select"
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
          >
            <option value="">All Divisions</option>
            {divisionsList.map((div) => (
              <option key={div} value={div}>{div}</option>
            ))}
          </select>

          {/* Dynamic Report Type Filter */}
          <select
            className="filter-select"
            value={reportTypeFilter}
            onChange={(e) => setReportTypeFilter(e.target.value)}
          >
            <option value="">All Report Types</option>
            {reportTypeOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          {/* Clear Filter Button */}
          {(divisionFilter || reportTypeFilter) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setDivisionFilter(''); setReportTypeFilter(''); }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Quick Filter Search Input */}
        <div style={{ position: 'relative', width: '220px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748B' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Filter list..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{ width: '100%', paddingLeft: '32px', paddingRight: '12px' }}
          />
        </div>
      </div>

      {/* Documents Table */}
      <div className="table-card">
        <div className="table-header">
          <span>Document</span>
          <span>Division</span>
          <span>Report Type</span>
          <span>OCR Status</span>
          <span>Date Added</span>
          <span style={{ textAlign: 'right' }}>Action</span>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#94A3B8' }}>
            Loading document library...
          </div>
        ) : displayedDocs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FileText size={28} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>No documents found</h3>
            <p style={{ fontSize: '13px', color: '#94A3B8', maxWidth: '360px' }}>
              {scope === 'approved'
                ? 'You have no approved cross-division documents yet. Request access from other divisions to view them here.'
                : 'Upload your first document or adjust your division/report filters.'}
            </p>
            {scope !== 'approved' && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowUpload(true)}>
                <Upload size={14} /> Upload Document
              </button>
            )}
          </div>
        ) : (
          displayedDocs.map((doc) => {
            const isSameDiv = doc.division === user?.division;
            const canDown = doc.can_download || isSameDiv || user?.role === 'admin';
            const reportTypeVal = doc.metadata?.['Report Type'] || doc.metadata?.report_type || '—';

            return (
              <div key={doc._id} className="table-row">
                {/* Document Info */}
                <div className="doc-info-cell" onClick={() => onSelectDoc(doc._id)}>
                  <div className="doc-icon-box">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="doc-name">{doc.title}</div>
                    <div className="doc-meta-sub">
                      {doc.filename} · {(doc.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>

                {/* Division */}
                <div>
                  <span className="badge badge-division">{doc.division}</span>
                </div>

                {/* Report Type */}
                <div style={{ color: '#CBD5E1', fontWeight: 600 }}>
                  {reportTypeVal}
                </div>

                {/* OCR Status */}
                <div>
                  <span className={`badge ${doc.ocr_status === 'completed' ? 'badge-success' : 'badge-info'}`}>
                    {doc.ocr_status || 'completed'}
                  </span>
                </div>

                {/* Date */}
                <div style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={13} />
                  {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'}
                </div>

                {/* Actions */}
                <div style={{ textAlign: 'right' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSelectDoc(doc._id)}
                  >
                    {canDown ? (
                      <>Details <ChevronRight size={14} /></>
                    ) : (
                      <>
                        <Lock size={12} color="#F59E0B" />
                        {doc.access_request_status === 'pending' ? 'Pending' : 'Request Access'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload Modal Dialog */}
      {showUpload && (
        <UploadModal
          user={user}
          fields={fields}
          onClose={() => setShowUpload(false)}
          onSuccess={(newDoc) => {
            setShowUpload(false);
            loadDocuments();
          }}
          notify={notify}
        />
      )}
    </div>
  );
}
