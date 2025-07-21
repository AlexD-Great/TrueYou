import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import "./verification.css";

const RequestVerification = () => {
  const { isAuthenticated, actor } = useAuth();
  const [selectedCredential, setSelectedCredential] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userCredentials, setUserCredentials] = useState([]);
  const [submittedRequests, setSubmittedRequests] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserCredentials();
      loadSubmittedRequests();
    }
  }, [isAuthenticated]);

  const loadUserCredentials = async () => {
    try {
      const files = await actor.getFiles();
      setUserCredentials(files);
    } catch (err) {
      console.error("Failed to load user credentials:", err);
      setError("Failed to load your credentials.");
    }
  };

  const loadSubmittedRequests = async () => {
    try {
      const requests = await actor.getUserSubmittedRequests();
      setSubmittedRequests(requests);
    } catch (err) {
      console.error("Failed to load submitted requests:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!selectedCredential || !requestMessage) {
      setError("Please select a credential and provide a request message.");
      return;
    }

    try {
      setLoading(true);
      
      // Find the selected credential details
      const credential = userCredentials.find(cred => cred.name === selectedCredential);
      if (!credential) {
        setError("Selected credential not found.");
        return;
      }
      
      // Submit verification request to the pool
      const requestId = await actor.submitVerificationRequest(selectedCredential, requestMessage);
      
      if (requestId.startsWith("ERROR:")) {
        setError(requestId);
        return;
      }
      
      setSuccess(`Verification request submitted successfully! Request ID: ${requestId}`);
      setSelectedCredential("");
      setRequestMessage("");
      
      // Reload submitted requests
      await loadSubmittedRequests();
    } catch (err) {
      console.error("Failed to submit verification request:", err);
      setError("Failed to submit verification request. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  if (!isAuthenticated) {
    return (
      <div className="verification-container">
        <div className="request-card">
          <div className="empty-state">
            <p>Please sign in to submit credentials for verification.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="verification-container">
      <div className="verification-header">
        <h1>Submit Credential for Verification</h1>
        <p>
          Submit your credentials to the verification pool for review by certified verifiers.
        </p>
      </div>

      {/* Request Form */}
      <div className="request-card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>Submit Verification Request</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-color)', color: 'var(--success-color)', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Select Credential *
            </label>
            <select
              value={selectedCredential}
              onChange={(e) => setSelectedCredential(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid var(--border-color)', 
                borderRadius: '6px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
              required
            >
              <option value="">Select a credential to verify</option>
              {userCredentials.map((credential, index) => (
                <option key={index} value={credential.name}>
                  {credential.name} ({credential.fileType || 'Unknown type'})
                </option>
              ))}
            </select>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Choose one of your uploaded credentials to submit for verification.
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Request Message *
            </label>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="response-textarea"
              rows="4"
              placeholder="Explain why you need this credential verified (e.g., job application, academic admission, etc.)..."
              required
              style={{ 
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)'
              }}
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Provide context about why you need this credential verified. This will help verifiers prioritize and understand your request.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || userCredentials.length === 0}
            className="btn btn-respond"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
          >
            {loading ? "Submitting Request..." : "Submit for Verification"}
          </button>
        </form>
      </div>

      {/* Show message if no credentials */}
      {userCredentials.length === 0 && (
        <div className="request-card" style={{ marginTop: '20px' }}>
          <div className="empty-state">
            <p>You haven't uploaded any credentials yet.</p>
            <p>Upload credentials first to submit them for verification.</p>
          </div>
        </div>
      )}

      {/* Submitted Requests */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>Submitted Verification Requests</h2>
        
        {submittedRequests.length === 0 ? (
          <div className="empty-state">
            <p>No verification requests submitted yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {submittedRequests.map((request, index) => {
              // Convert the backend status to a readable string
              const getStatusString = (status) => {
                if (status.unverified !== undefined) return 'unverified';
                if (status.claimed !== undefined) return 'claimed';
                if (status.verified !== undefined) return 'verified';
                if (status.rejected !== undefined) return 'rejected';
                return 'unknown';
              };
              
              const statusString = getStatusString(request.status);
              const formatTimestamp = (timestamp) => {
                return new Date(Number(timestamp) / 1000000).toLocaleDateString();
              };
              console.log('request', request)
              
              return (
                <div key={index} className="request-card">
                  <div className="request-header">
                    <div className="request-info">
                      <h3>{request.credentialName}</h3>
                      <p>Status: {statusString.charAt(0).toUpperCase() + statusString.slice(1)}</p>
                      <p>Submitted: {formatTimestamp(request.submittedAt)}</p>
                      {request.claimedBy && request.claimedBy.length > 0 && (
                        <p>Claimed by: {typeof request.claimedBy === 'string' ? request.claimedBy.slice(0, 12) : request.claimedBy.toText().slice(0, 12)}...</p>
                      )}
                    </div>
                    <span className={`status-badge status-${statusString}`}>
                      {statusString.charAt(0).toUpperCase() + statusString.slice(1)}
                    </span>
                  </div>

                  <div className="request-message">
                    <span className="request-message-label">Your Message:</span>
                    <div className="request-message-content">
                      {request.requestMessage}
                    </div>
                  </div>

                  {request.verifierResponse && (
                    <div className="response-section">
                      <span className="request-message-label">
                        Verifier Response:
                      </span>
                      <div className="request-message-content">
                        {request.verifierResponse}
                      </div>
                      {request.processedAt && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                          Processed: {formatTimestamp(request.processedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestVerification;