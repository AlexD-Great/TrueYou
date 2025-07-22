import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import "../verification/verification.css";

const MyNFTs = () => {
  const { isAuthenticated, actor } = useAuth();
  const [userNFTs, setUserNFTs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      loadUserNFTs();
    }
  }, [isAuthenticated]);

  const loadUserNFTs = async () => {
    try {
      setLoading(true);
      const nfts = await actor.getUserNFTs();
      setUserNFTs(nfts);
      setError("");
    } catch (err) {
      console.error("Failed to load user NFTs:", err);
      setError("Failed to load your NFTs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <div className="verification-container">
        <div className="request-card">
          <div className="empty-state">
            <p>Please sign in to view your NFTs.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="verification-container">
      <div className="verification-header">
        <h1>My Generated NFTs</h1>
        <p>
          View and manage your credential NFTs. These serve as permanent proof of your verified credentials.
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

      {loading ? (
        <div className="request-card">
          <div className="empty-state">
            <p>Loading your NFTs...</p>
          </div>
        </div>
      ) : userNFTs.length === 0 ? (
        <div className="request-card">
          <div className="empty-state">
            <h3>No NFTs Generated Yet</h3>
            <p>You haven't generated any NFTs yet.</p>
            <p>To create NFTs:</p>
            <ol style={{ textAlign: 'left', marginTop: '16px' }}>
              <li>Upload your credentials</li>
              <li>Submit them for verification</li>
              <li>Once verified, generate NFTs from the verification page</li>
            </ol>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {userNFTs.map((nft, index) => (
            <div key={index} className="request-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '2px solid var(--border-color)'
                }}>
                  {nft.metadata.image ? (
                    <img 
                      src={nft.metadata.image} 
                      alt={`NFT ${nft.id}`}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }}
                      onError={(e) => {
                        // Fallback to emoji if image fails to load
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'var(--accent-color)',
                    display: nft.metadata.image ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    🎨
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '600' }}>
                    NFT #{nft.id}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {nft.metadata.name}
                  </p>
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                  {nft.metadata.description}
                </p>
              </div>
              
              {/* NFT Attributes */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Attributes:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                  {nft.metadata.attributes.map(([key, value], attrIndex) => (
                    <div key={attrIndex} style={{
                      backgroundColor: 'var(--bg-secondary)',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '2px' }}>
                        {key}
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* NFT Details */}
              <div style={{ 
                paddingTop: '1rem', 
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem',
                color: 'var(--text-tertiary)'
              }}>
                <span>Minted: {formatTimestamp(nft.minted_at)}</span>
                <span>Owner: You</span>
              </div>
              
              {/* View/Share Actions */}
              <div style={{ marginTop: '1rem', display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                  onClick={() => {
                    // Open image in new tab for full view
                    if (nft.metadata.image) {
                      const newWindow = window.open('', '_blank');
                      newWindow.document.write(`
                        <html>
                          <head><title>NFT #${nft.id} - ${nft.metadata.name}</title></head>
                          <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#000;">
                            <img src="${nft.metadata.image}" alt="NFT #${nft.id}" style="max-width:100%;max-height:100%;object-fit:contain;" />
                          </body>
                        </html>
                      `);
                    }
                  }}
                >
                  🖼️ View Full Size
                </button>
                <button
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                  onClick={() => {
                    // Copy NFT details to clipboard
                    const nftDetails = `NFT #${nft.id}\n${nft.metadata.name}\n${nft.metadata.description}\nMinted: ${formatTimestamp(nft.minted_at)}`;
                    navigator.clipboard.writeText(nftDetails);
                    setSuccess('NFT details copied to clipboard!');
                    setTimeout(() => setSuccess(''), 3000);
                  }}
                >
                  📋 Copy Details
                </button>
                <button
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                  onClick={() => {
                    // Show signature verification
                    alert(`NFT Signature: ${nft.signature.slice(0, 20)}...\n\nThis signature cryptographically proves the authenticity of your NFT.`);
                  }}
                >
                  🔐 Verify
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button
          onClick={loadUserNFTs}
          disabled={loading}
          className="btn btn-secondary"
          style={{
            padding: '12px 24px',
            fontSize: '0.9rem',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Loading...' : '🔄 Refresh NFTs'}
        </button>
      </div>
    </div>
  );
};

export default MyNFTs;
