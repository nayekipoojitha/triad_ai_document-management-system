import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Lock, Mail, User, Building } from 'lucide-react';
import api from '../api';

export default function AuthPage({ onAuthSuccess, notify }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [division, setDivision] = useState('Division A');
  const [role, setRole] = useState('user');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const divisionsList = [
    'Division A',
    'Division B',
    'Division C',
    'Division Finance',
    'Division Operations'
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setBusy(true);

    try {
      if (mode === 'login') {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('triad_token', res.data.token);
        localStorage.setItem('triad_user', JSON.stringify(res.data.user));
        notify(`Welcome back, ${res.data.user.name}!`);
        onAuthSuccess(res.data.user, res.data.token);
      } else {
        const res = await api.post('/auth/register', {
          name,
          email,
          password,
          division,
          role
        });
        localStorage.setItem('triad_token', res.data.token);
        localStorage.setItem('triad_user', JSON.stringify(res.data.user));
        notify(`Registration successful! You are assigned to ${res.data.user.division}`);
        onAuthSuccess(res.data.user, res.data.token);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Authentication failed. Please verify credentials.';
      setErrorMsg(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: '#090E1A',
      color: '#F8FAFC'
    }}>
      {/* Left Hero Panel */}
      <div style={{
        flex: 1.1,
        background: 'linear-gradient(145deg, #0F172A 0%, #1E1B4B 50%, #090E1A 100%)',
        borderRight: '1px solid #1E293B',
        padding: '60px 80px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow Effects */}
        <div style={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '60px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '22px',
              color: '#fff',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)'
            }}>
              T
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>triad.ai</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#818CF8', letterSpacing: '1px' }}>DOCUMENT MANAGEMENT SYSTEM</div>
            </div>
          </div>

          <div style={{ maxWidth: '520px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '20px',
              color: '#A5B4FC',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '24px'
            }}>
              <ShieldCheck size={16} /> Enterprise Division Isolation & RBAC
            </div>

            <h1 style={{
              fontSize: '44px',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-1.5px',
              marginBottom: '20px'
            }}>
              Dynamic Metadata, <br />
              <span style={{
                background: 'linear-gradient(135deg, #818CF8, #C084FC)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                OCR Intelligence & RBAC
              </span>
            </h1>

            <p style={{ fontSize: '16px', color: '#94A3B8', lineHeight: 1.6, marginBottom: '36px' }}>
              Securely store documents in MongoDB GridFS with customizable metadata tags, automated OCR optical extraction, and strict cross-division approval workflows.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#F8FAFC', marginBottom: '4px' }}>Division Isolation</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Users from Division A can only upload and view Division A files by default.</div>
              </div>

              <div style={{
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#F8FAFC', marginBottom: '4px' }}>OCR-Powered Search</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Full text extracted from PDF and images is automatically indexed and searchable.</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>TRIAD AI Intern Take-Home Assessment</span> · <span>Flask REST API + MongoDB GridFS</span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div style={{
        flex: 0.9,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#1E293B',
          border: '1px solid #334155',
          borderRadius: '20px',
          padding: '36px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          {/* Mode Switcher */}
          <div style={{
            display: 'flex',
            backgroundColor: '#0F172A',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '28px',
            border: '1px solid #334155'
          }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                backgroundColor: mode === 'login' ? '#6366F1' : 'transparent',
                color: mode === 'login' ? '#fff' : '#94A3B8',
                transition: 'all 0.15s'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                backgroundColor: mode === 'register' ? '#6366F1' : 'transparent',
                color: mode === 'register' ? '#fff' : '#94A3B8',
                transition: 'all 0.15s'
              }}
            >
              Create Account
            </button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>
              {mode === 'login' ? 'Welcome back' : 'Join Your Division'}
            </h2>
            <p style={{ fontSize: '13px', color: '#94A3B8' }}>
              {mode === 'login'
                ? 'Enter your credentials to access your division document hub.'
                : 'Select your assigned division to configure your workspace.'}
            </p>
          </div>

          {errorMsg && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#F87171',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '20px'
            }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'register' && (
              <div className="form-group">
                <label>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748B' }} />
                  <input
                    required
                    type="text"
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '38px' }}
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Work Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748B' }} />
                <input
                  required
                  type="email"
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '38px' }}
                  placeholder="name@division.triad.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748B' }} />
                <input
                  required
                  type="password"
                  minLength={8}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '38px' }}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label>Assign to Division</label>
                  <div style={{ position: 'relative' }}>
                    <Building size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748B' }} />
                    <select
                      className="form-select"
                      style={{ width: '100%', paddingLeft: '38px' }}
                      value={division}
                      onChange={(e) => setDivision(e.target.value)}
                    >
                      {divisionsList.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <small>Your uploads and default access will be isolated to this division.</small>
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <select
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="user">Division Staff Member</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy}
              style={{ width: '100%', marginTop: '8px', padding: '12px' }}
            >
              {busy ? 'Processing...' : (
                <>
                  {mode === 'login' ? 'Sign In to Workspace' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            color: '#64748B',
            gap: '6px'
          }}>
            <ShieldCheck size={14} color="#10B981" />
            <span>End-to-End JWT Session & GridFS Encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}
