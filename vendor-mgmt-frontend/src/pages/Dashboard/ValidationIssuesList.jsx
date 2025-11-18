import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import procurementService from '../../services/procurementService';

export default function ValidationIssuesList({ vendorId }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssues, setSelectedIssues] = useState([]);

  useEffect(() => {
    fetchIssues();
  }, [vendorId]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const response = await procurementService.getValidationIssues(vendorId);
      if (response.success) {
        setIssues(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching validation issues:', error);
      toast.error('Failed to load validation issues');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (issueId, notes) => {
    try {
      await procurementService.resolveValidationIssue(issueId, notes);
      toast.success('Issue marked as resolved');
      fetchIssues();
    } catch (error) {
      toast.error('Failed to resolve issue');
    }
  };

  const handleBulkResolve = async () => {
    if (selectedIssues.length === 0) {
      toast.error('No issues selected');
      return;
    }

    const notes = 'Bulk resolution';
    try {
      await Promise.all(
        selectedIssues.map(issueId =>
          procurementService.resolveValidationIssue(issueId, notes)
        )
      );
      toast.success(`${selectedIssues.length} issues resolved`);
      setSelectedIssues([]);
      fetchIssues();
    } catch (error) {
      toast.error('Failed to resolve some issues');
    }
  };

  const toggleSelection = (issueId) => {
    setSelectedIssues(prev =>
      prev.includes(issueId)
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };

  const getSeverityColor = (severity) => {
    const colors = {
      LOW: '#10b981',
      MEDIUM: '#f59e0b',
      HIGH: '#f97316',
      CRITICAL: '#ef4444'
    };
    return colors[severity] || '#6b7280';
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Loading validation issues...
      </div>
    );
  }

  const openIssues = issues.filter(i => i.status === 'OPEN');

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '24px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
          Validation Issues ({openIssues.length})
        </h3>
        {selectedIssues.length > 0 && (
          <button
            onClick={handleBulkResolve}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Resolve Selected ({selectedIssues.length})
          </button>
        )}
      </div>

      {openIssues.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#6b7280',
          background: '#f9fafb',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✓</div>
          <div style={{ fontSize: '16px', fontWeight: '600' }}>No Open Issues</div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>All validation checks passed</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {openIssues.map(issue => (
            <div
              key={issue.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                borderLeftWidth: '4px',
                borderLeftColor: getSeverityColor(issue.severity)
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <input
                  type="checkbox"
                  checked={selectedIssues.includes(issue.id)}
                  onChange={() => toggleSelection(issue.id)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    marginTop: '2px'
                  }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        backgroundColor: getSeverityColor(issue.severity) + '20',
                        color: getSeverityColor(issue.severity)
                      }}>
                        {issue.severity}
                      </span>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        {issue.fieldName}
                      </span>
                    </div>
                    <button
                      onClick={() => handleResolve(issue.id, 'Quick resolve from list')}
                      style={{
                        padding: '4px 12px',
                        background: '#f3f4f6',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        color: '#374151'
                      }}
                    >
                      Resolve
                    </button>
                  </div>

                  <div style={{ fontSize: '14px', color: '#1f2937', marginBottom: '8px' }}>
                    {issue.issueDescription}
                  </div>

                  {issue.suggestion && (
                    <div style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      background: '#f9fafb',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      marginTop: '8px'
                    }}>
                      💡 <strong>Suggestion:</strong> {issue.suggestion}
                    </div>
                  )}

                  {issue.currentValue && (
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginTop: '8px',
                      fontFamily: 'monospace',
                      background: '#fef2f2',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      Current: {issue.currentValue}
                    </div>
                  )}

                  <div style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    marginTop: '8px'
                  }}>
                    Detected {new Date(issue.detectedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {issues.filter(i => i.status === 'RESOLVED').length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#6b7280',
            marginBottom: '12px'
          }}>
            Recently Resolved ({issues.filter(i => i.status === 'RESOLVED').length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {issues.filter(i => i.status === 'RESOLVED').slice(0, 3).map(issue => (
              <div
                key={issue.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '12px',
                  background: '#f9fafb',
                  opacity: 0.7
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#374151' }}>
                    <span style={{ fontWeight: '600' }}>{issue.fieldName}</span> - {issue.issueDescription}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: '#10b981',
                    fontWeight: '600'
                  }}>
                    ✓ Resolved
                  </span>
                </div>
                {issue.resolutionNotes && (
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    {issue.resolutionNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
