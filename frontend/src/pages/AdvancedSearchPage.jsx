import React, { useState } from 'react';
import {
  Search, FileText, ChevronRight, Download, Lock,
  Sparkles, CheckCircle2, Clock, Filter
} from 'lucide-react';
import api from '../api';

export default function AdvancedSearchPage({ user, onSelectDoc, notify }) {
  const [query, setQuery] = useState('');
  const [divisionScope, setDivisionScope] = useState('');
  const [searchScope, setSearchScope] = useState('all'); // 'all' or 'my_division'
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const divisionsList = [
    'Division A',
    'Division B',
    'Division C',
    'Division Finance',
    'Division Operations'
  ];

  async function handleSearch(e) {
    if (e) e.preventDefault();
    if (!query.trim()) {
      notify('Please enter a search phrase.');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const params = {
        q: query.trim(),
        scope: searchScope
      };
      if (divisionScope) {
        params.division = divisionScope;
      }

      const res = await api.get('/search', { params });
      setResults(res.data.results || []);
    } catch (err) {
      notify(err.response?.data?.message || 'Search execution failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '6px' }}>
          Advanced Search Engine
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '14px' }}>
          Deep optical full-text search across titles, dynamic metadata, and OCR-extracted document contents.
        </p>
      </div>

      {/* Search Query & Filters Box */}
      <div style={{
        backgroundColor: '#1E293B',
        border: '1px solid #334155',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '28px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
      }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ position: 'relative', flexGrow: 1 }}>
              <Search size={20} style={{ position: 'absolute', left: '16px', top: '14px', color: '#818CF8' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search across OCR extracted text, metadata fields, and document titles..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '13px 18px 13px 48px',
                  fontSize: '15px',
                  backgroundColor: '#0F172A'
                }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ padding: '0 28px', fontSize: '15px' }}
            >
              {loading ? 'Searching...' : (
                <>
                  <Sparkles size={16} /> Search Engine
                </>
              )}
            </button>
          </div>

          {/* Scope Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94A3B8' }}>
              <Filter size={14} /> Search Scope:
            </div>

            <select
              className="filter-select"
              value={searchScope}
              onChange={(e) => setSearchScope(e.target.value)}
            >
              <option value="all">Global (All Divisions Catalog)</option>
              <option value="my_division">Restricted to {user?.division}</option>
            </select>

            <select
              className="filter-select"
              value={divisionScope}
              onChange={(e) => setDivisionScope(e.target.value)}
            >
              <option value="">Any Division</option>
              {divisionsList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {query && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => { setQuery(''); setResults([]); setHasSearched(false); }}
              >
                Clear Query
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Results Header */}
      {hasSearched && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
            Found {results.length} {results.length === 1 ? 'match' : 'matches'} for "{query}"
          </div>
        </div>
      )}

      {/* Results Cards */}
      <div className="table-card">
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#94A3B8' }}>
            Analyzing OCR contents and metadata database...
          </div>
        ) : !hasSearched ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Sparkles size={28} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Search Across Everything</h3>
            <p style={{ fontSize: '13px', color: '#94A3B8', maxWidth: '380px' }}>
              Type any keyword, invoice number, financial term, or custom metadata value to find documents matching OCR text.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Search size={28} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>No matching documents found</h3>
            <p style={{ fontSize: '13px', color: '#94A3B8', maxWidth: '360px' }}>
              Try broader search terms, or verify that the requested phrase exists in uploaded files.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {results.map((doc) => {
              const matchedFields = doc.matched_fields || [];
              const canDown = doc.can_download || doc.division === user?.division || user?.role === 'admin';

              return (
                <div
                  key={doc._id}
                  style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #1E293B',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '20px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', flexGrow: 1, maxWidth: '750px' }}>
                    <div className="doc-icon-box" style={{ marginTop: '2px' }}>
                      <FileText size={22} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div
                        style={{ fontWeight: 800, fontSize: '16px', color: '#F8FAFC', cursor: 'pointer' }}
                        onClick={() => onSelectDoc(doc._id)}
                      >
                        {doc.title}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#94A3B8', flexWrap: 'wrap' }}>
                        <span>{doc.filename}</span>
                        <span>·</span>
                        <span className="badge badge-division">{doc.division}</span>
                        <span>·</span>
                        <span style={{ color: '#A5B4FC' }}>
                          Report Type: {doc.metadata?.['Report Type'] || doc.metadata?.report_type || '—'}
                        </span>
                      </div>

                      {/* Matched Fields Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>Matched In:</span>
                        {matchedFields.map((f) => (
                          <span key={f} className="badge badge-info" style={{ fontSize: '10px', padding: '2px 8px' }}>
                            {f === 'ocr_text' ? 'OCR Text Body' : f.toUpperCase()}
                          </span>
                        ))}
                      </div>

                      {/* Matched Snippet */}
                      {doc.search_snippet && (
                        <div style={{
                          fontSize: '12px',
                          color: '#CBD5E1',
                          background: 'rgba(15, 23, 42, 0.6)',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #334155',
                          marginTop: '4px',
                          fontFamily: matchedFields.includes('ocr_text') ? 'monospace' : 'inherit'
                        }}>
                          {doc.search_snippet}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onSelectDoc(doc._id)}
                    >
                      {canDown ? (
                        <>View Details <ChevronRight size={14} /></>
                      ) : (
                        <>
                          <Lock size={12} color="#F59E0B" /> Request Access
                        </>
                      )}
                    </button>
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
