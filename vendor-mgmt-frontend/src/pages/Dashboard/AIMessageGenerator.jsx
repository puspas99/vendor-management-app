import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import procurementService from '../../services/procurementService';

export default function AIMessageGenerator({ vendorId, vendorName, followUpType, onGenerated }) {
  const [loading, setLoading] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [editedMessage, setEditedMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [validationIssues, setValidationIssues] = useState([]);

  useEffect(() => {
    fetchTemplates();
    if (vendorId) {
      fetchValidationIssues();
    }
  }, [followUpType, vendorId]);

  const fetchTemplates = async () => {
    try {
      const response = await procurementService.getFollowUpTemplates(followUpType);
      if (response.success) {
        setTemplates(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchValidationIssues = async () => {
    try {
      const response = await procurementService.getValidationIssues(vendorId);
      if (response.success) {
        setValidationIssues(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template first');
      return;
    }

    setLoading(true);
    try {
      const response = await procurementService.generateAIMessage({
        vendorId,
        templateId: selectedTemplate,
        followUpType,
        validationIssues: validationIssues.filter(i => i.status === 'OPEN')
      });

      if (response.success) {
        setGeneratedMessage(response.data.message);
        setEditedMessage(response.data.message);
        toast.success('AI message generated successfully');
      }
    } catch (error) {
      console.error('Error generating AI message:', error);
      toast.error('Failed to generate AI message');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template first');
      return;
    }

    setLoading(true);
    try {
      const response = await procurementService.renderTemplate({
        templateId: selectedTemplate,
        vendorId,
        validationIssues: validationIssues.filter(i => i.status === 'OPEN')
      });

      if (response.success) {
        setGeneratedMessage(response.data.message);
        setEditedMessage(response.data.message);
        toast.success('Template applied successfully');
      }
    } catch (error) {
      console.error('Error rendering template:', error);
      toast.error('Failed to render template');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!editedMessage.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    if (onGenerated) {
      onGenerated({
        message: editedMessage,
        aiGenerated: generatedMessage === editedMessage,
        edited: generatedMessage !== editedMessage,
        templateId: selectedTemplate
      });
    }
    
    toast.success('Message saved');
    setIsEditing(false);
  };

  const handleReset = () => {
    setGeneratedMessage('');
    setEditedMessage('');
    setIsEditing(false);
    setSelectedTemplate('');
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '24px'
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: '20px'
      }}>
        🤖 AI Message Generator
      </h3>

      {/* Template Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151',
          display: 'block',
          marginBottom: '8px'
        }}>
          Select Template
        </label>
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            fontSize: '14px',
            background: 'white'
          }}
        >
          <option value="">Choose a template...</option>
          {templates.map(template => (
            <option key={template.id} value={template.id}>
              {template.name} {template.escalationLevel > 0 ? `(Level ${template.escalationLevel})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Generation Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <button
          onClick={handleGenerateWithAI}
          disabled={loading || !selectedTemplate}
          style={{
            flex: 1,
            padding: '12px 20px',
            background: loading ? '#9ca3af' : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading || !selectedTemplate ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {loading ? '⏳ Generating...' : '🤖 Generate with AI'}
        </button>

        <button
          onClick={handleUseTemplate}
          disabled={loading || !selectedTemplate}
          style={{
            flex: 1,
            padding: '12px 20px',
            background: loading || !selectedTemplate ? '#f3f4f6' : 'white',
            color: loading || !selectedTemplate ? '#9ca3af' : '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading || !selectedTemplate ? 'not-allowed' : 'pointer'
          }}
        >
          📝 Use Template Only
        </button>
      </div>

      {/* Validation Issues Preview */}
      {validationIssues.filter(i => i.status === 'OPEN').length > 0 && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#92400e',
            marginBottom: '8px'
          }}>
            ⚠️ Open Issues ({validationIssues.filter(i => i.status === 'OPEN').length})
          </div>
          <ul style={{
            fontSize: '12px',
            color: '#78350f',
            margin: 0,
            paddingLeft: '20px'
          }}>
            {validationIssues.filter(i => i.status === 'OPEN').slice(0, 3).map(issue => (
              <li key={issue.id} style={{ marginBottom: '4px' }}>
                <strong>{issue.fieldName}:</strong> {issue.issueDescription}
              </li>
            ))}
            {validationIssues.filter(i => i.status === 'OPEN').length > 3 && (
              <li style={{ fontStyle: 'italic' }}>
                +{validationIssues.filter(i => i.status === 'OPEN').length - 3} more issues
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Generated Message */}
      {generatedMessage && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151'
            }}>
              {isEditing ? 'Edit Message' : 'Generated Message'}
            </label>
            <button
              onClick={() => setIsEditing(!isEditing)}
              style={{
                padding: '6px 12px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                color: '#374151'
              }}
            >
              {isEditing ? '👁️ Preview' : '✏️ Edit'}
            </button>
          </div>

          {isEditing ? (
            <textarea
              value={editedMessage}
              onChange={(e) => setEditedMessage(e.target.value)}
              rows={12}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          ) : (
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '14px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              color: '#1f2937'
            }}>
              {editedMessage}
            </div>
          )}

          {/* Message Stats */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginTop: '12px',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            <span>📝 {editedMessage.length} characters</span>
            <span>📄 {editedMessage.split(/\n/).length} lines</span>
            {generatedMessage !== editedMessage && (
              <span style={{ color: '#f59e0b' }}>✏️ Edited</span>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '20px'
          }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: '10px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ✓ Use This Message
            </button>

            <button
              onClick={handleReset}
              style={{
                padding: '10px 20px',
                background: 'white',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🔄 Reset
            </button>
          </div>
        </div>
      )}

      {/* Info Box */}
      {!generatedMessage && (
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '16px',
          fontSize: '13px',
          color: '#1e40af'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>
            💡 How it works
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Select a template that matches your follow-up scenario</li>
            <li><strong>Generate with AI:</strong> Uses GPT-4 to create a personalized, context-aware message</li>
            <li><strong>Use Template Only:</strong> Uses the base template with variable substitution</li>
            <li>Edit the generated message as needed before sending</li>
          </ul>
        </div>
      )}
    </div>
  );
}
