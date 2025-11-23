import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Upload, Sparkles, Wand2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
      } else {
        toast.error('Please upload a video file');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
      } else {
        toast.error('Please upload a video file');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a video file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(`${API}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Video uploaded successfully!');
      const projectId = response.data.id;
      
      toast.info('Analyzing video for scene cuts...');
      await axios.post(`${API}/analyze/${projectId}`);
      
      toast.success('Analysis complete!');
      navigate(`/editor/${projectId}`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Decorative Background Blobs */}
      <div className="decorative-blob" style={{ top: '10%', left: '10%', width: '400px', height: '400px', background: '#FF6B9D' }}></div>
      <div className="decorative-blob" style={{ bottom: '15%', right: '15%', width: '500px', height: '500px', background: '#4ECDC4', animationDelay: '5s' }}></div>
      <div className="decorative-blob" style={{ top: '50%', right: '20%', width: '300px', height: '300px', background: '#FFE66D', animationDelay: '10s' }}></div>

      <div style={styles.content}>
        {/* Header with Logo */}
        <div style={styles.header} className="fade-in">
          <img src="/gappy-logo.png" alt="Gappy Descripe" style={styles.logo} />
          <div className="badge" style={{ marginTop: '20px' }}>
            <Sparkles size={18} style={{ marginRight: '8px' }} />
            WCAG 1.2.3 Level A Compliant
          </div>
        </div>

        {/* Hero Section */}
        <div style={styles.hero} className="slide-in-up">
          <h1 style={styles.title}>
            Make Your Videos Accessible<br />
            <span style={{ color: '#FF6B9D' }}>in Minutes</span>
          </h1>
          
          <p style={styles.subtitle}>
            AI-powered audio descriptions that meet accessibility standards.
            Upload your video, and we'll add professional voice descriptions automatically.
          </p>

          {/* Features Grid */}
          <div style={styles.features}>
            <div style={styles.featureCard} className="glass-card">
              <div style={styles.featureIcon}>
                <Upload size={28} color="#FF6B9D" />
              </div>
              <h3 style={styles.featureTitle}>Upload & Detect</h3>
              <p style={styles.featureText}>AI detects scene changes automatically</p>
            </div>

            <div style={styles.featureCard} className="glass-card">
              <div style={styles.featureIcon}>
                <Wand2 size={28} color="#4ECDC4" />
              </div>
              <h3 style={styles.featureTitle}>Smart Descriptions</h3>
              <p style={styles.featureText}>GPT-4o generates WCAG-compliant text</p>
            </div>

            <div style={styles.featureCard} className="glass-card">
              <div style={styles.featureIcon}>
                <CheckCircle size={28} color="#FFE66D" />
              </div>
              <h3 style={styles.featureTitle}>Export Ready</h3>
              <p style={styles.featureText}>Download in MP4, AVI, or MOV</p>
            </div>
          </div>

          {/* Upload Area */}
          <div className="glass-card" style={styles.uploadCard}>
            <div
              style={{
                ...styles.dropzone,
                ...(dragActive ? styles.dropzoneActive : {}),
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              data-testid="upload-dropzone"
            >
              <div style={styles.uploadIcon}>
                <Upload size={64} color="#FF6B9D" />
              </div>
              <h3 style={styles.dropzoneTitle}>
                {selectedFile ? selectedFile.name : 'Drop your video here'}
              </h3>
              <p style={styles.dropzoneSubtext}>or click to browse</p>
              <label htmlFor="file-upload" className="btn-secondary" style={{ marginTop: '20px', display: 'inline-block' }}>
                Choose File
              </label>
              <input
                id="file-upload"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                data-testid="file-input"
              />
            </div>

            {selectedFile && (
              <button
                className="btn-primary"
                onClick={handleUpload}
                disabled={uploading}
                style={{ marginTop: '24px', width: '100%', fontSize: '18px', padding: '16px' }}
                data-testid="upload-button"
              >
                {uploading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 10px 0 0', borderTopColor: 'white' }}></div>
                    Processing Magic...
                  </div>
                ) : (
                  <>
                    <Sparkles size={20} style={{ marginRight: '10px' }} />
                    Start Making It Accessible
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    padding: '40px 20px',
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 1,
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  logo: {
    height: '120px',
    width: 'auto',
    filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.2))',
  },
  hero: {
    textAlign: 'center',
  },
  title: {
    fontSize: 'clamp(36px, 6vw, 64px)',
    fontWeight: '800',
    color: 'white',
    marginBottom: '24px',
    lineHeight: '1.2',
    textShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  },
  subtitle: {
    fontSize: '20px',
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: '60px',
    lineHeight: '1.6',
    maxWidth: '700px',
    margin: '0 auto 60px',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '60px',
  },
  featureCard: {
    padding: '32px 24px',
    textAlign: 'center',
    transition: 'transform 0.3s, box-shadow 0.3s',
    cursor: 'pointer',
  },
  featureIcon: {
    width: '80px',
    height: '80px',
    margin: '0 auto 20px',
    background: 'white',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  },
  featureTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: '12px',
  },
  featureText: {
    fontSize: '16px',
    color: '#4a5568',
    lineHeight: '1.6',
  },
  uploadCard: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '48px 32px',
  },
  dropzone: {
    border: '3px dashed rgba(255, 107, 157, 0.3)',
    borderRadius: '24px',
    padding: '60px 20px',
    textAlign: 'center',
    transition: 'all 0.3s',
    cursor: 'pointer',
    background: 'rgba(255, 255, 255, 0.5)',
  },
  dropzoneActive: {
    borderColor: '#FF6B9D',
    background: 'rgba(255, 107, 157, 0.1)',
    transform: 'scale(1.02)',
  },
  uploadIcon: {
    marginBottom: '20px',
  },
  dropzoneTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: '8px',
  },
  dropzoneSubtext: {
    fontSize: '16px',
    color: '#718096',
  },
};

export default HomePage;
