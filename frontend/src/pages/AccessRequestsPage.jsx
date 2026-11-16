import React, { useState, useEffect } from 'react';
import {
  Inbox, CheckCircle2, XCircle, Clock, ShieldCheck,
  Building, User, FileText, ArrowRight, Check, X
} from 'lucide-react';
import api from '../api';

export default function AccessRequestsPage({ user, onSelectDoc, notify }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('incoming'); // 'incoming' | 'outgoing'
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [tab]);

  async function fetchRequests() {
    setLoading(true);
    try {
      const res = await api.get('/access/requests', {
        params: { scope: tab }
      });
      setRequests(res.data.requests || []);
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to load access requests.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDecision(requestId, decision) {
    setProcessingId(requestId);
    try {
      if (decision === 'approved') {
        await api.post('/access/approve', { request_id: requestId, decision: 'approved' });
        notify('Access request approved! User can now download the document.');
      } else {
        await api.post('/access/reject', { request_id: requestId, decision: 'rejected' });
        notify('Access request rejected.');
      }
      fetchRequests();
    } catch (err) {
      notify(err.response?.data?.message || err.response?.data?.error || `Failed to ${decision} request.`);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '6px' }}>
          Access Requests Inbox
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '14px' }}>
          Manage cross-division authorization requests for your division's files.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          className={`btn ${tab === 'incoming' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('incoming')}
          style={{ fontSize: '13px' }}
        >
          <Inbox size={16} /> Incoming Requests (For {user?.division})
        </button>

        <button
          className={`btn ${tab === 'outgoing' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('outgoing')}
          style={{ fontSize: '13px' }}
        >
          <ArrowRight size={16} /> My Outgoing Requests
        </button>
      </div>

      {/* Requests Card List */}
      <div className="table-card">
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#94A3B8' }}>
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Inbox size={28} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
              {tab === 'incoming' ? 'No incoming access requests' : 'No outgoing access requests'}
            </h3>
            <p style={{ fontSize: '13px', color: '#94A3B8', maxWidth: '380px' }}>
              {tab === 'incoming'
                ? `When users from other divisions request access to ${user?.division} documents, they will appear here for your review.`
                : 'Any cross-division access requests you submit will be tracked here.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {requests.map((req) => {
              const isPending = req.status === 'pending';
              const isApproved = req.status === 'approved';
              const isBusy = processingId === req._id;

              return (
                <div
                  key={req._id}
                  style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #1E293B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '20px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div className="doc-icon-box" style={{ marginTop: '2px' }}>
                      <FileText size={20} />
                    </div>

                    <div>
                      <div
                        style={{ fontWeight: 700, fontSize: '15px', color: '#F8FAFC', cursor: 'pointer', marginBottom: '4px' }}
                        onClick={() => onSelectDoc(req.document_id)}
                      >
                        {req.document_title || 'Document Access Request'}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>
                        <span>
                          Requester: <strong style={{ color: '#CBD5E1' }}>{req.requester_name}</strong> ({req.requester_email})
                        </span>
                        <span>·</span>
                        <span className="badge badge-division" style={{ fontSize: '10px', padding: '2px 8px' }}>
                          From: {req.requester_division}
                        </span>
                        <span>·</span>
                        <span className="badge badge-division" style={{ fontSize: '10px', padding: '2px 8px' }}>
                          Target: {req.document_division}
                        </span>
                      </div>

                      {req.reason && (
                        <div style={{ fontSize: '12px', color: '#CBD5E1', background: 'rgba(15, 23, 42, 0.4)', padding: '6px 10px', borderRadius: '6px', width: 'fit-content' }}>
                          Reason: <em>"{req.reason}"</em>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions / Status Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isPending ? (
                      tab === 'incoming' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-success btn-sm"
                            disabled={isBusy}
                            onClick={() => handleDecision(req._id, 'approved')}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Check size={14} /> Approve Access
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={isBusy}
                            onClick={() => handleDecision(req._id, 'rejected')}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="badge badge-warning">
                          <Clock size={12} /> Pending Division Approval
                        </span>
                      )
                    ) : isApproved ? (
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} /> Approved
                      </span>
                    ) : (
                      <span className="badge badge-danger">
                        <XCircle size={12} /> Rejected
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
