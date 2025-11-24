import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Upload, Sparkles, Video, ArrowRight, Play, Wand2, CheckCircle2 } from 'lucide-react';
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
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Video uploaded!');
      const projectId = response.data.id;
      
      toast.info('Analyzing video...');
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
      {/* Navbar */}
      <nav className="navbar">
        <div style={styles.navContent}>
          <img src="/gappy-logo.png" alt="Gappy Descripe" style={styles.logo} />
          <div className="badge">
            <Sparkles size={14} style={{ marginRight: '6px' }} />
            WCAG Compliant
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroContent} className="fade-in">
          <h1 style={styles.title}>
            Add Audio Descriptions
            <br />
            to Your Videos with AI
          </h1>
          
          <p style={styles.subtitle}>
            Automatically generate WCAG 1.2.3 Level A compliant audio descriptions.
            <br />
            Upload, analyze, edit, and export in minutes.
          </p>

          {/* Upload Card */}
          <div className="card" style={styles.uploadCard}>
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
              {selectedFile ? (
                <div style={styles.selectedFile}>
                  <Video size={48} color="#FF6B9D" />
                  <div style={styles.fileInfo}>
                    <p style={styles.fileName}>{selectedFile.name}</p>
                    <p style={styles.fileSize}>
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <Upload size={48} color="#9ca3af" />
                  <p style={styles.dropzoneText}>Drop video here or click to browse</p>
                  <p style={styles.dropzoneSubtext}>Supports MP4, AVI, MOV</p>
                </div>
              )}

              <input
                id="file-upload"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                data-testid="file-input"
              />
              <label htmlFor="file-upload" className="btn-secondary" style={{ marginTop: '16px', cursor: 'pointer' }}>
                {selectedFile ? 'Change File' : 'Choose File'}
              </label>
            </div>

            {selectedFile && (
              <button
                className="btn-primary"
                onClick={handleUpload}
                disabled={uploading}
                style={{ marginTop: '20px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                data-testid="upload-button"
              >
                {uploading ? (
                  <>
                    <img src="/gappy-icon.png" alt="" style={{ width: '20px', height: '20px' }} className="spin-icon" />
                    Processing...
                  </>
                ) : (
                  <>
                    Start Analysis
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section style={styles.howItWorks}>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitle}>How it works</h2>
          
          <div style={styles.steps}>
            <div style={styles.step}>
              <div style={styles.stepIcon}>
                <Upload size={24} color="#FF6B9D" />
              </div>
              <div>
                <h3 style={styles.stepTitle}>1. Upload Video</h3>
                <p style={styles.stepText}>Upload your video. AI detects scene changes automatically.</p>
              </div>
            </div>

            <div style={styles.step}>
              <div style={styles.stepIcon}>
                <Wand2 size={24} color="#4ECDC4" />
              </div>
              <div>
                <h3 style={styles.stepTitle}>2. AI Generates Descriptions</h3>
                <p style={styles.stepText}>GPT-4o analyzes each scene and creates WCAG-compliant descriptions.</p>
              </div>
            </div>

            <div style={styles.step}>
              <div style={styles.stepIcon}>
                <Play size={24} color="#667eea" />
              </div>
              <div>
                <h3 style={styles.stepTitle}>3. Review & Export</h3>
                <p style={styles.stepText}>Edit descriptions if needed, then export in your preferred format.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={styles.features}>
        <div style={styles.sectionContent}>
          <div style={styles.featureGrid}>
            <div style={styles.feature}>
              <CheckCircle2 size={20} color="#4ECDC4" />
              <div>
                <h4 style={styles.featureTitle}>WCAG Level A Compliant</h4>
                <p style={styles.featureText}>Meets accessibility standards</p>
              </div>
            </div>

            <div style={styles.feature}>
              <CheckCircle2 size={20} color="#4ECDC4" />
              <div>
                <h4 style={styles.featureTitle}>AI-Powered Analysis</h4>
                <p style={styles.featureText}>GPT-4o vision for accurate descriptions</p>
              </div>
            </div>

            <div style={styles.feature}>
              <CheckCircle2 size={20} color="#4ECDC4" />
              <div>
                <h4 style={styles.featureTitle}>Multiple Export Formats</h4>
                <p style={styles.featureText}>MP4, AVI, and MOV supported</p>
              </div>
            </div>

            <div style={styles.feature}>
              <CheckCircle2 size={20} color="#4ECDC4" />
              <div>
                <h4 style={styles.featureTitle}>Fast Processing</h4>
                <p style={styles.featureText}>Results in minutes, not hours</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#ffffff',
  },
  navContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    height: '36px',
    width: 'auto',
  },
  hero: {
    padding: '80px 24px',
    textAlign: 'center',
    background: '#ffffff',
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    fontSize: 'clamp(32px, 5vw, 48px)',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '20px',
    lineHeight: '1.2',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '18px',
    color: '#6b7280',
    marginBottom: '48px',
    lineHeight: '1.6',
  },
  uploadCard: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '32px',
  },
  dropzone: {
    border: '2px dashed #e5e7eb',
    borderRadius: '12px',
    padding: '48px 24px',
    textAlign: 'center',
    transition: 'all 0.2s',
    cursor: 'pointer',
    background: '#fafafa',
  },
  dropzoneActive: {
    borderColor: '#FF6B9D',
    background: '#fff5f8',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  selectedFile: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  fileInfo: {
    textAlign: 'left',
  },
  fileName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '4px',
  },
  fileSize: {
    fontSize: '14px',
    color: '#6b7280',
  },
  dropzoneText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
  },
  dropzoneSubtext: {
    fontSize: '14px',
    color: '#9ca3af',
  },
  howItWorks: {
    padding: '80px 24px',
    background: '#f9fafb',
  },
  sectionContent: {
    maxWidth: '1000px',
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: '48px',
    letterSpacing: '-0.01em',
  },
  steps: {
    display: 'grid',
    gap: '32px',
  },
  step: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
  },
  stepIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e5e7eb',
    flexShrink: 0,
  },
  stepTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '8px',
  },
  stepText: {
    fontSize: '15px',
    color: '#6b7280',
    lineHeight: '1.6',
  },
  features: {
    padding: '80px 24px',
    background: '#ffffff',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '32px',
  },
  feature: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  featureTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '4px',
  },
  featureText: {
    fontSize: '14px',
    color: '#6b7280',
  },
};

export default HomePage;
