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
  const [credentialsWithNFTs, setCredentialsWithNFTs] = useState(new Set());

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
      
      // Check which verified credentials already have NFTs
      const nftChecks = await Promise.all(
        requests
          .filter(req => getStatusString(req.status) === 'verified')
          .map(async (req) => {
            const hasNFT = await actor.credentialHasNFT(req.credentialName);
            return { credentialName: req.credentialName, hasNFT };
          })
      );
      
      const credentialsWithNFTsSet = new Set(
        nftChecks.filter(check => check.hasNFT).map(check => check.credentialName)
      );
      setCredentialsWithNFTs(credentialsWithNFTsSet);
    } catch (err) {
      console.error("Failed to load submitted requests:", err);
    }
  };

  const getStatusString = (status) => {
    if (status.unverified !== undefined) return 'unverified';
    if (status.claimed !== undefined) return 'claimed';
    if (status.verified !== undefined) return 'verified';
    if (status.rejected !== undefined) return 'rejected';
    return 'unknown';
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

  // Function to generate NFT certificate using Canvas
  const generateNFTImageUrl = (credentialName) => {
    // Create canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    
    // Choose color based on credential name
    const colors = ['#4F46E5', '#059669', '#DC2626', '#D97706', '#7C3AED', '#DB2777'];
    const colorIndex = credentialName.length % colors.length;
    const primaryColor = colors[colorIndex];
    
    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, '#1F2937');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw border
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    
    // Draw inner border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
    
    // Draw title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px serif';
    ctx.textAlign = 'center';
    ctx.fillText('VERIFIED CERTIFICATE', canvas.width / 2, 120);
    
    // Draw credential name
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#FBBF24';
    ctx.fillText(credentialName, canvas.width / 2, 200);
    
    // Draw verification text
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#E5E7EB';
    ctx.fillText('This credential has been verified by', canvas.width / 2, 280);
    ctx.fillText('certified verifiers on the Internet Computer', canvas.width / 2, 310);
    
    // Draw date
    const date = new Date().toLocaleDateString();
    ctx.font = '20px monospace';
    ctx.fillStyle = '#9CA3AF';
    ctx.fillText(`Verified on: ${date}`, canvas.width / 2, 380);
    
    // Draw decorative elements
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 450, 30, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw checkmark in circle
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 10, 450);
    ctx.lineTo(canvas.width / 2 - 5, 455);
    ctx.lineTo(canvas.width / 2 + 10, 440);
    ctx.stroke();
    
    // Draw "AUTHENTIC" stamp
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#DC2626';
    ctx.textAlign = 'center';
    ctx.fillText('AUTHENTIC', canvas.width / 2, 520);
    
    // Convert canvas to data URL (base64 image)
    return canvas.toDataURL('image/png', 0.9);
  };

  const handleGenerateNFT = async (request) => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      // Prepare NFT metadata
      const description = `Verified credential certificate for ${request.credentialName}. This NFT serves as proof of successful verification by certified verifiers.`;
      const imageUrl = generateNFTImageUrl(request.credentialName);
      const attributes = [
        ["Credential Name", request.credentialName],
        ["Verification Status", "Verified"],
        ["Verification Date", new Date().toISOString().split('T')[0]],
        ["Request ID", request.id || "N/A"]
      ];
      
      // Call the backend to generate NFT for the verified credential
      const result = await actor.generateCredentialNFT(
        request.credentialName,
        description,
        imageUrl,
        attributes
      );
      
      // Check if result is null (credential not found) or handle error
      if (result === null || result === undefined) {
        setError(`Failed to generate NFT: Credential '${request.credentialName}' not found or access denied.`);
        return;
      }
      
      setSuccess(`NFT generated successfully for ${request.credentialName}! NFT ID: ${result}`);
      
      // Reload submitted requests to update the UI
      await loadSubmittedRequests();
    } catch (err) {
      console.error("Failed to generate NFT:", err);
      setError("Failed to generate NFT. Please try again.");
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
              
              return (
                <div key={index} className="request-card">
                  <div className="request-header">
                    <div className="request-info">
                      <h3>{request.credentialName}</h3>
                      <p>Status: {statusString.charAt(0).toUpperCase() + statusString.slice(1)}</p>
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
                  
                  {/* NFT Generation Button for Verified Credentials */}
                  {statusString === 'verified' && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                      {credentialsWithNFTs.has(request.credentialName) ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.2rem' }}>✅</span>
                          <div>
                            <p style={{ 
                              fontSize: '0.9rem', 
                              color: 'var(--success-color)', 
                              fontWeight: '500',
                              margin: '0'
                            }}>
                              NFT Already Generated
                            </p>
                            <p style={{ 
                              fontSize: '0.8rem', 
                              color: 'var(--text-secondary)', 
                              margin: '4px 0 0 0',
                              fontStyle: 'italic'
                            }}>
                              View your NFT in the "My NFTs" section
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleGenerateNFT(request)}
                            disabled={loading}
                            className="btn btn-primary"
                            style={{
                              backgroundColor: 'var(--accent-color)',
                              color: 'white',
                              border: 'none',
                              padding: '10px 20px',
                              borderRadius: '6px',
                              fontSize: '0.9rem',
                              fontWeight: '500',
                              cursor: loading ? 'not-allowed' : 'pointer',
                              opacity: loading ? 0.7 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!loading) {
                                e.target.style.backgroundColor = 'var(--accent-hover)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!loading) {
                                e.target.style.backgroundColor = 'var(--accent-color)';
                              }
                            }}
                          >
                            <span>🎨</span>
                            {loading ? 'Generating NFT...' : 'Generate NFT'}
                          </button>
                          <p style={{ 
                            fontSize: '0.8rem', 
                            color: 'var(--text-secondary)', 
                            marginTop: '8px',
                            fontStyle: 'italic'
                          }}>
                            Generate an NFT certificate for your verified credential
                          </p>
                        </>
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