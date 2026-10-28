import React, { useState, useEffect } from 'react';
import { fetchLeads, updateLeadStatus, LeadItem } from '../services/api';
import { RefreshCw, Filter, ShieldCheck, CheckCircle2, Clock, XCircle } from 'lucide-react';

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

  return (
    <div className="card">
      <div className="admin-header">
        <div>
          <div className="card-title">
            <ShieldCheck className="text-primary" size={24} />
            <span>Field Agent & Underwriter Leads Portal</span>
          </div>
          <p className="card-desc" style={{ marginBottom: 0 }}>
            All submitted applications. Sensitive mobile numbers are masked (9876XXXX10).
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={loadLeads}
          disabled={isLoading}
          style={{ fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1.25rem',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Filters:</span>
        </div>

        <select
          id="admin-plan-filter"
          className="form-input"
          style={{ width: 'auto', padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}
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
          style={{ width: 'auto', padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Leads Table */}
      <div className="table-responsive">
        <table className="leads-table">
          <thead>
            <tr>
              <th>App ID</th>
              <th>Borrower</th>
              <th>Masked Mobile</th>
              <th>Net Weight</th>
              <th>Purity</th>
              <th>Scheme</th>
              <th>Loan Offer</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  {isLoading ? 'Loading leads...' : 'No applications found matching the selected filters.'}
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} id={`lead-row-${lead.id}`}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                    {lead.id}
                  </td>
                  <td style={{ fontWeight: 600 }}>{lead.fullName}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{lead.mobileNumber}</td>
                  <td>{lead.netWeightGrams} g</td>
                  <td>{lead.karat}K</td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {lead.planName || lead.planId}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                    ₹{lead.eligibleLoanRupees.toLocaleString('en-IN')}
                  </td>
                  <td>
                    <span className={`status-badge status-${lead.status}`}>{lead.status}</span>
                  </td>
                  <td>
                    <select
                      className="form-input"
                      style={{ padding: '2px 6px', fontSize: '0.75rem', width: 'auto' }}
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
