import React, { useState } from 'react';

/**
 * AiSummary Component
 * Fetches and displays AI-generated news summaries from the backend.
 */
const AiSummary = () => {
    const [newsData, setNewsData] = useState(null);
    const [loading, setLoading] = useState(false);

    /**
     * Handles the API request to fetch an AI-generated summary.
     * Targeted Endpoint: http://localhost:5000/api/news/generate
     */
    const fetchSummary = async () => {
        setLoading(true);
        try {
            // Fetching data from the local development server
            const response = await fetch('http://localhost:5000/api/news/generate');
            const data = await response.json();

            if (data.success) {
                setNewsData(data);
            } else {
                console.error("API Response Error:", data.message);
                alert("Failed to retrieve data from the server.");
            }
        } catch (error) {
            console.error("Network/Fetch Error:", error);
            alert("Unable to connect to the backend server. Please ensure the Node.js server is running on port 5000.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
            <h2 style={{ fontWeight: '800', color: '#1a202c', letterSpacing: '-0.025em' }}>
                AI News Summarizer
            </h2>
            
            <button 
                onClick={fetchSummary} 
                disabled={loading}
                style={{ 
                    padding: '12px 28px', 
                    fontSize: '15px', 
                    cursor: loading ? 'not-allowed' : 'pointer', 
                    backgroundColor: loading ? '#cbd5e0' : '#0f172a', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '10px', 
                    fontWeight: '700',
                    transition: 'background-color 0.2s ease'
                }}
            >
                {loading ? 'Processing Summary...' : 'Generate AI Summary'}
            </button>

            {newsData && (
                <div style={{ 
                    marginTop: '30px', 
                    border: '1px solid #e2e8f0', 
                    padding: '24px', 
                    borderRadius: '16px', 
                    textAlign: 'left', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    backgroundColor: '#fff'
                }}>
                    <h3 style={{ marginTop: '0', color: '#1a202c', fontSize: '1.25rem', lineHeight: '1.6' }}>
                        {newsData.originalTitle}
                    </h3>
                    
                    <div style={{ 
                        backgroundColor: '#f8fafc', 
                        padding: '18px', 
                        borderRadius: '12px', 
                        borderLeft: '4px solid #3b82f6', 
                        marginBottom: '20px' 
                    }}>
                        <p style={{ margin: 0, fontSize: '16px', lineHeight: '1.6', color: '#334155', fontWeight: '500' }}>
                            {newsData.aiSummary}
                        </p>
                    </div>

                    {newsData.imageUrl && (
                        <img 
                            src={newsData.imageUrl} 
                            alt="Article Visual" 
                            style={{ width: '100%', borderRadius: '12px', marginBottom: '15px', objectFit: 'cover' }} 
                        />
                    )}

                    <div style={{ textAlign: 'right' }}>
                        <a 
                            href={newsData.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}
                        >
                            View Full Source →
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiSummary;