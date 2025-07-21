import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import "./verification.css";

const VerificationRequests = () => {
  const { isAuthenticated, actor } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [isVerifier, setIsVerifier] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      checkVerifierStatus();
      loadRequests();
    }
  }, [isAuthenticated]);

  const checkVerifierStatus = async () => {
    try {
      const verifierStatus = await actor.isCurrentUserVerifier();
      const reviewerStatus = await actor.isCurrentUserReviewer();
      const adminStatus = await actor.isCurrentUserAdmin();
      setIsVerifier(verifierStatus || reviewerStatus || adminStatus);
    } catch (err) {
      console.error("Failed to check verifier status:", err);
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      const requestsList = await actor.getVerificationPool();
      setRequests(requestsList);
      setError("");
    } catch (err) {
      console.error("Failed to load verification pool:", err);
      setError("Failed to load verification pool. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (requestId) => {
    try {
      setLoading(true);
      setError("");
      const success = await actor.claimVerificationRequest(requestId);
      
      if (success) {
        setSuccess("Request claimed successfully!");
        await loadRequests();
      } else {
        setError("Failed to claim request. It may have been claimed by someone else.");
      }
    } catch (err) {
      console.error("Failed to claim request:", err);
      setError("Failed to claim request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setLoading(true);
      setError("");
      const message = responseMessage || "Verification approved.";
      const success = await actor.processVerificationRequest(requestId, true, message);
      
      if (success) {
        setSuccess("Request approved successfully!");
        await loadRequests();
        setResponseMessage("");
        setActiveRequestId(null);
      } else {
        setError("Failed to approve request. Please make sure you have claimed it first.");
      }
    } catch (err) {
      console.error("Failed to approve request:", err);
      setError("Failed to approve request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setLoading(true);
      setError("");
      const message = responseMessage || "Verification rejected.";
      const success = await actor.processVerificationRequest(requestId, false, message);
      
      if (success) {
        setSuccess("Request rejected successfully!");
        await loadRequests();
        setResponseMessage("");
        setActiveRequestId(null);
      } else {
        setError("Failed to reject request. Please make sure you have claimed it first.");
      }
    } catch (err) {
      console.error("Failed to reject request:", err);
      setError("Failed to reject request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusString = (status) => {
    if (status.unverified !== undefined) return 'unverified';
    if (status.claimed !== undefined) return 'claimed';
    if (status.verified !== undefined) return 'verified';
    if (status.rejected !== undefined) return 'rejected';
    return 'unknown';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <div className="verification-container">
        <div className="request-card">
          <div className="empty-state">
            <p>Please sign in to view verification requests.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isVerifier) {
    return (
      <div className="verification-container">
        <div className="verification-header">
          <h1>Verification Pool</h1>
          <p>Access restricted to verifiers, reviewers, and administrators.</p>
        </div>
        <div className="request-card">
          <div className="empty-state">
            <p>You need verifier, reviewer, or admin privileges to access the verification pool.</p>
            <p>Contact an administrator to get the required permissions.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="verification-container">
      <div className="verification-header">
        <h1>Verification Pool</h1>
        <p>
          Review and process credential verification requests from users.
        </p>
      </div>

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

      {loading && (
        <div className="empty-state">
          <p>Loading verification pool...</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {requests.length === 0 ? (
          <div className="empty-state">
            <p>No verification requests in the pool.</p>
            <p>Requests will appear here when users submit credentials for verification.</p>
          </div>
        ) : (
          requests.map((request) => {
            const statusString = getStatusString(request.status);
            
            return (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <div className="request-info">
                    <h3>Credential: {request.credentialName}</h3>
                    <p>From: {typeof request.submitter === 'string' ? request.submitter.slice(0, 12) : request.submitter.toText().slice(0, 12)}...</p>
                    <p>Submitted: {formatTimestamp(request.submittedAt)}</p>
                    {request.claimedBy && request.claimedBy.length > 0 && (
                      <p>Claimed by: {typeof request.claimedBy === 'string' ? request.claimedBy.slice(0, 12) : (request.claimedBy.toText ? request.claimedBy.toText().slice(0, 12) : String(request.claimedBy).slice(0, 12))}...</p>
                    )}
                  </div>
                  <span className={`status-badge status-${statusString}`}>
                    {statusString.charAt(0).toUpperCase() + statusString.slice(1)}
                  </span>
                </div>

                <div className="request-message">
                  <span className="request-message-label">Request Message:</span>
                  <div className="request-message-content">
                    {request.requestMessage}
                  </div>
                </div>

                {/* Show claim button for unverified requests */}
                {statusString === 'unverified' && (
                  <div className="button-group">
                    <button
                      onClick={() => handleClaim(request.id)}
                      disabled={loading}
                      className="btn btn-respond"
                    >
                      {loading ? "Claiming..." : "Claim Request"}
                    </button>
                  </div>
                )}

                {/* Show approve/reject buttons for claimed requests by this verifier */}
                {statusString === 'claimed' && (
                  <div className="response-section">
                    {activeRequestId === request.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
                            Response Message:
                          </label>
                          <textarea
                            value={responseMessage}
                            onChange={(e) => setResponseMessage(e.target.value)}
                            className="response-textarea"
                            rows="3"
                            placeholder="Provide your verification decision and any comments..."
                          />
                        </div>
                        <div className="button-group">
                          <button
                            onClick={() => handleApprove(request.id)}
                            disabled={loading}
                            className="btn btn-approve"
                          >
                            {loading ? "Processing..." : "Approve"}
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={loading}
                            className="btn btn-reject"
                          >
                            {loading ? "Processing..." : "Reject"}
                          </button>
                          <button
                            onClick={() => {
                              setActiveRequestId(null);
                              setResponseMessage("");
                              setSuccess("");
                            }}
                            className="btn btn-cancel"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="button-group">
                        <button
                          onClick={() => setActiveRequestId(request.id)}
                          className="btn btn-respond"
                        >
                          Process Request
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Show response for processed requests */}
                {(statusString === 'verified' || statusString === 'rejected') && request.verifierResponse && (
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
          })
        )}
      </div>
    </div>
  );
};

export default VerificationRequests;