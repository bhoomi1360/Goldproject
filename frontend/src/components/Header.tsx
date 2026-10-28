import React from 'react';
import { Coins, LayoutDashboard, FileSpreadsheet, Bot } from 'lucide-react';

interface HeaderProps {
  currentTab: 'portal' | 'admin';
  onSelectTab: (tab: 'portal' | 'admin') => void;
  goldRate: number;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab, goldRate }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        {/* Brand */}
        <div className="brand">
          <div className="brand-icon">
            <Coins size={22} />
          </div>
          <div className="brand-text">
            <h1>
              <span>AurumFlow</span>
              <span className="brand-badge">24K Bullion Loan</span>
            </h1>
          </div>
        </div>

        {/* Live Bullion Ticker */}
        <div
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
          }}
          className="d-md-flex"
        >
          <span style={{ color: 'var(--gold)', fontWeight: 700 }}>● 24K Benchmark:</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            ₹{goldRate.toLocaleString('en-IN')} / gram
          </span>
        </div>

        {/* Navigation */}
        <nav className="header-nav">
          <button
            type="button"
            id="nav-portal-btn"
            className={`nav-btn ${currentTab === 'portal' ? 'active' : ''}`}
            onClick={() => onSelectTab('portal')}
          >
            <LayoutDashboard size={16} />
            <span>Apply Portal</span>
          </button>

          <button
            type="button"
            id="nav-admin-btn"
            className={`nav-btn ${currentTab === 'admin' ? 'active' : ''}`}
            onClick={() => onSelectTab('admin')}
          >
            <FileSpreadsheet size={16} />
            <span>Admin Leads</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
