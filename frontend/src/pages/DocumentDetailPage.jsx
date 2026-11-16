import React, { useState, useEffect } from 'react';
import {
  FileText, Download, ShieldCheck, Lock, ArrowLeft,
  Clock, CheckCircle, AlertTriangle, Send, Copy, Check
} from 'lucide-react';
import api from '../api';

export default function DocumentDetailPage({ docId, user, onBack, notify }) {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestBusy, setRequestBusy] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [reason, setReason] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchDocDetails();
  }, [docId]);

  async function fetchDocDetails() {
    setLoading(true);
    try {
      const res = await api.get(`/documents/${docId}`);
      setDoc(res.data.document);
    } catch (err) {
      notify(err.response?.data?.message || 'Could not load document details.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    setDownloadBusy(true);
    try {
      const res = await api.get(`/documents/${docId}/download`, {
        responseType: 'blob'
      });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', doc.filename || `${doc.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      notify('File download completed successfully.');
    } catch (err) {
      notify(err.response?.data?.message || err.response?.data?.error || 'Download failed or access denied.');
    } finally {
      setDownloadBusy(false);
    }
  }

  async function handleRequestAccess(e) {
    e.preventDefault();
    setRequestBusy(true);
    try {
      const res = await api.post('/access/request', {
        doc_id: docId,
        reason: reason.trim() || 'Cross-division document access request'
      });
      notify('Access request submitted! Awaiting division approval.');
      fetchDocDetails();
    } catch (err) {
      notify(err.response?.data?.message || err.response?.data?.error || 'Failed to submit access request.');
    } finally {
      setRequestBusy(false);
    }
  }

  function copyOcrText() {
    if (doc?.ocr_text) {
      navigator.clipboard.writeText(doc.ocr_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      notify('OCR text copied to clipboard!');
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: '#94A3B8' }}>
        Loading document details...
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="empty-state">
        <FileText size={48} color="#64748B" />
        <h3>Document Not Found</h3>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Return to Document Hub
        </button>
      </div>
    );
  }

  const isSameDivision = user?.division === doc.division;
  const canDownload = doc.can_download || isSameDivision || user?.role === 'admin';
  const isPending = doc.access_request_status === 'pending';
  const isRejected = doc.access_request_status === 'rejected';

  return (
    <div className="detail-container">
      {/* Top Breadcrumb & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={15} /> Back to Document Hub
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="badge badge-division">{doc.division}</span>
          {canDownload ? (
            <span className="badge badge-success">
              <CheckCircle size={12} /> Access Granted
            </span>
          ) : isPending ? (
            <span className="badge badge-warning">
              <Clock size={12} /> Request Pending
            </span>
          ) : isRejected ? (
            <span className="badge badge-danger">
              <AlertTriangle size={12} /> Access Rejected
            </span>
          ) : (
            <span className="badge badge-danger">
              <Lock size={12} /> Access Restricted
            </span>
          )}
        </div>
      </div>

      {/* Main Document Details Card */}
      <div className="detail-card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '18px' }}>
            <div className="doc-icon-box" style={{ width: '56px', height: '56px' }}>
              <FileText size={32} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>
                {doc.title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#94A3B8' }}>
                <span>Filename: <strong style={{ color: '#CBD5E1' }}>{doc.filename}</strong></span>
                <span>·</span>
                <span>Size: <strong style={{ color: '#CBD5E1' }}>{(doc.size / 1024).toFixed(1)} KB</strong></span>
                <span>·</span>
                <span>Added: <strong style={{ color: '#CBD5E1' }}>{new Date(doc.created_at).toLocaleDateString()}</strong></span>
              </div>
            </div>
          </div>

          {/* Action CTA Box */}
          <div>
            {canDownload ? (
              <button
                className="btn btn-primary"
                onClick={handleDownload}
                disabled={downloadBusy}
                style={{ padding: '12px 24px', fontSize: '15px' }}
              >
                <Download size={18} />
                {downloadBusy ? 'Downloading...' : 'Download Document'}
              </button>
            ) : isPending ? (
              <div style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '10px 18px',
                borderRadius: '8px',
                color: '#FBBF24',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Clock size={16} /> Request Pending Division Approval
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                <form onSubmit={handleRequestAccess} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Reason for access request..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{ width: '220px' }}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={requestBusy}
                  >
                    <Send size={15} />
                    {requestBusy ? 'Sending...' : 'Request Access'}
                  </button>
                </form>
                <small style={{ fontSize: '11px', color: '#64748B' }}>
                  Document belongs to {doc.division}. Approval required.
                </small>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Custom Metadata Display */}
        <div style={{ marginTop: '36px', paddingTop: '28px', borderTop: '1px solid #334155' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#818CF8', marginBottom: '16px' }}>
            Custom Dynamic Metadata
          </h3>

          <div className="metadata-grid">
            <div className="meta-item">
              <label>Division</label>
              <span>{doc.division}</span>
            </div>

            {doc.metadata && Object.entries(doc.metadata).map(([k, v]) => {
              if (k.toLowerCase() === 'division') return null;
              return (
                <div key={k} className="meta-item">
                  <label>{k}</label>
                  <span>{String(v)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* OCR Extracted Text Section */}
        <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#818CF8' }}>
                OCR-Extracted Document Contents
              </h3>
              <span className="badge badge-info" style={{ fontSize: '10px' }}>
                {doc.ocr_status || 'completed'}
              </span>
            </div>

            {doc.ocr_text && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={copyOcrText}
                style={{ fontSize: '12px', padding: '4px 10px' }}
              >
                {copied ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>
            )}
          </div>

          {canDownload ? (
            doc.ocr_text ? (
              <div className="ocr-box">
                {doc.ocr_text}
              </div>
            ) : (
              <div style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', fontSize: '13px', color: '#64748B', textAlign: 'center' }}>
                No textual contents extracted or file contains purely graphics.
              </div>
            )
          ) : (
            <div style={{
              padding: '24px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px dashed #334155',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#94A3B8',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Lock size={20} color="#64748B" />
              <div>OCR contents and payload preview are locked.</div>
              <small style={{ color: '#64748B' }}>Request cross-division access from {doc.division} to inspect full text.</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
