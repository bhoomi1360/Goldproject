import React, { useState, useEffect } from 'react';
import { fetchLeads, updateLeadStatus, LeadItem } from '../services/api';
import { RefreshCw, Filter, ShieldCheck, CheckCircle2, Clock, XCircle, FileSpreadsheet, Scale, IndianRupee } from 'lucide-react';

export const AdminView: React.FC = () => {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLeads({
        planId: planFilter || undefined,
        status: statusFilter || undefined,
      });
      setLeads(data.leads);
    } catch (err) {
      console.error('Failed to load leads', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [planFilter, statusFilter]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await updateLeadStatus(id, newStatus);
      await loadLeads();
    } catch (err) {
      console.error('Status update failed', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const totalCollateral = leads.reduce((acc, l) => acc + (l.netWeightGrams || 0), 0);
  const totalLoanVolume = leads.reduce((acc, l) => acc + (l.eligibleLoanRupees || 0), 0);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div className="card-title">
            <FileSpreadsheet className="text-primary" size={24} />
            <span>Field Agent & Underwriter Queue</span>
          </div>
          <p className="card-desc" style={{ marginBottom: 0 }}>
            Real-time pipeline of borrower intakes. Mobile numbers are securely masked (9876XXXX10).
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={loadLeads}
          disabled={isLoading}
          style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Total Pipeline Leads
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
            {leads.length}
          </div>
        </div>

        <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Collateral Appraised
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {totalCollateral.toFixed(2)} g
          </div>
        </div>

        <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Total Eligible Value
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            ₹{totalLoanVolume.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          marginBottom: '1.25rem',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Filter size={15} />
          <span>Filters:</span>
        </div>

        <select
          id="admin-plan-filter"
          className="form-input"
          style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
        >
          <option value="">All Schemes</option>
          <option value="PLAN_EMI_01">Monthly EMI</option>
          <option value="PLAN_BULLET_01">Bullet Repayment</option>
        </select>

        <select
          id="admin-status-filter"
          className="form-input"
          style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="UNDER_REVIEW">UNDER REVIEW</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </div>

      {/* Leads Table */}
      <div className="table-container">
        <table className="leads-table">
          <thead>
            <tr>
              <th>App ID</th>
              <th>Applicant</th>
              <th>Masked Contact</th>
              <th>Weight</th>
              <th>Purity</th>
              <th>Plan</th>
              <th>Loan Offer</th>
              <th>Status</th>
              <th>Workflow Update</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  {isLoading ? 'Fetching pipeline leads...' : 'No applications match the current filter criteria.'}
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} id={`lead-row-${lead.id}`}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--primary)' }}>
                    {lead.id}
                  </td>
                  <td style={{ fontWeight: 700 }}>{lead.fullName}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{lead.mobileNumber}</td>
                  <td>{lead.netWeightGrams}g</td>
                  <td>{lead.karat}K</td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {lead.planName || lead.planId}
                    </span>
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                    ₹{lead.eligibleLoanRupees.toLocaleString('en-IN')}
                  </td>
                  <td>
                    <span className={`status-pill status-${lead.status}`}>{lead.status}</span>
                  </td>
                  <td>
                    <select
                      className="form-input"
                      style={{ padding: '3px 8px', fontSize: '0.75rem', width: 'auto' }}
                      value={lead.status}
                      disabled={updatingId === lead.id}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                    >
                      <option value="SUBMITTED">SUBMITTED</option>
                      <option value="UNDER_REVIEW">UNDER REVIEW</option>
                      <option value="APPROVED">APPROVE</option>
                      <option value="REJECTED">REJECT</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
