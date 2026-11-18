import React from 'react';
import { X, Server, Database, ShieldCheck, KeyRound } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  dbStatus: string;
}

export const SetupGuideModal: React.FC<Props> = ({ open, onClose, dbStatus }) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Deployment & Stack Guide">
      <div className="modal-card">
        <div className="modal-head">
          <h2>Free Stack Setup Guide (MERN + Atlas + Firebase + Render)</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="status-pill-row">
            <span className="tag-pill">Server Storage: {dbStatus}</span>
            <span className="tag-pill">Auth: Firebase Google Sign-In</span>
            <span className="tag-pill">Host: Render Free Web Service</span>
          </div>

          <section className="guide-section">
            <h3><Database size={16} /> 1. MongoDB Atlas (Free M0 Cluster)</h3>
            <ol>
              <li>Create a free account at MongoDB Atlas and deploy a <strong>Shared M0</strong> cluster.</li>
              <li>Under <strong>Database Access</strong>, create a database user with Read/Write permissions.</li>
              <li>Under <strong>Network Access</strong>, allow access from anywhere (<code>0.0.0.0/0</code>) so Render can connect.</li>
              <li>Click <strong>Connect → Drivers</strong> and copy your <code>mongodb+srv://...</code> URI.</li>
            </ol>
          </section>

          <section className="guide-section">
            <h3><ShieldCheck size={16} /> 2. Firebase Auth (Free Spark Plan)</h3>
            <ol>
              <li>Open Firebase Console → <strong>Authentication → Sign-in method</strong> → enable <strong>Google</strong>.</li>
              <li>Under <strong>Authentication → Settings → Authorized domains</strong>, add your Render domain (e.g. <code>your-app.onrender.com</code>).</li>
            </ol>
          </section>

          <section className="guide-section">
            <h3><Server size={16} /> 3. Render Web Service (Free Tier)</h3>
            <ol>
              <li>Push this repository to GitHub and create a <strong>New Web Service</strong> on Render.</li>
              <li>Build Command: <code>npm install && npm run build</code></li>
              <li>Start Command: <code>npm start</code></li>
              <li>Select the <strong>Free</strong> instance plan (runs on <code>PORT=3000</code> / <code>0.0.0.0</code>).</li>
            </ol>
          </section>

          <section className="guide-section">
            <h3><KeyRound size={16} /> 4. Render Environment Variables</h3>
            <div className="env-table">
              <div><code>NODE_ENV</code><span>production</span></div>
              <div><code>PORT</code><span>3000</span></div>
              <div><code>MONGODB_URI</code><span>Your MongoDB Atlas SRV connection string</span></div>
              <div><code>COOKIE_SECRET</code><span>Long random secret string for signed session cookies</span></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
