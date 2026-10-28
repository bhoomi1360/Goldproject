import React from 'react';
import { Coins, LayoutDashboard, FileSpreadsheet, Sun, Moon, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  currentTab: 'portal' | 'admin';
  onSelectTab: (tab: 'portal' | 'admin') => void;
  goldRate: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  goldRate,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="app-header">
      <div className="header-content">
        {/* Brand */}
        <div className="brand">
          <div className="brand-icon">
            <Coins size={22} />
          </div>
          <div>
            <div className="brand-title">
              <span>AurumFlow</span>
              <span className="brand-badge">24K Bullion</span>
            </div>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-dim)', fontWeight: 500 }}>
              Partnered with RBI-Regulated NBFCs
            </div>
          </div>
        </div>

        {/* Live Bullion Ticker */}
        <div className="bullion-ticker">
          <span className="ticker-dot" />
          <span style={{ fontWeight: 600, color: 'var(--gold)', fontSize: '0.75rem' }}>
            24K LIVE:
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-main)' }}>
            ₹{goldRate.toLocaleString('en-IN')}/g
          </span>
        </div>

        {/* Right Section: Navigation & Theme Toggle */}
        <div className="header-right">
          <nav className="header-nav">
            <button
              type="button"
              id="nav-portal-btn"
              className={`nav-tab-btn ${currentTab === 'portal' ? 'active' : ''}`}
              onClick={() => onSelectTab('portal')}
            >
              <LayoutDashboard size={15} />
              <span>Intake Portal</span>
            </button>

            <button
              type="button"
              id="nav-admin-btn"
              className={`nav-tab-btn ${currentTab === 'admin' ? 'active' : ''}`}
              onClick={() => onSelectTab('admin')}
            >
              <FileSpreadsheet size={15} />
              <span>Admin Queue</span>
            </button>
          </nav>

          {/* Dark / Light Mode Switcher */}
          <button
            type="button"
            id="theme-toggle-btn"
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
};
