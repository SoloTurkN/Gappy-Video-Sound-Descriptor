import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Upload, Video, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
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
          <img src="/gappy-logo1.png" alt="Gappy Descripe" style={styles.navLogo} />
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent} className="fade-in">
          <div className="badge" style={{ marginBottom: '24px' }}>
            <Sparkles size={14} style={{ marginRight: '6px' }} />
            WCAG 1.2.3 Level A Compliant
          </div>
          
          <h1 style={styles.heroTitle}>
            Make Videos Accessible
            <br />
            with AI-Powered Descriptions
          </h1>
          
          <p style={styles.heroSubtitle}>
            Automatically add professional audio descriptions to your videos.
            <br />
            Meet accessibility standards in minutes, not hours.
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
              <div style={styles.uploadIconWrapper}>
                {selectedFile ? (
                  <Video size={40} color="#FF6B9D" />
                ) : (
                  <Upload size={40} color="#999999" />
                )}
              </div>
              
              {selectedFile ? (
                <div>
                  <p style={styles.fileName}>{selectedFile.name}</p>
                  <p style={styles.fileSize}>
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p style={styles.dropzoneText}>Drop your video here</p>
                  <p style={styles.dropzoneSubtext}>Supports MP4, AVI, MOV</p>
                </div>
              )}

              <label htmlFor="file-upload" className="btn-secondary" style={{ marginTop: '20px' }}>
                {selectedFile ? 'Change File' : 'Choose File'}
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
                style={{ marginTop: '24px', width: '100%', padding: '16px', fontSize: '16px' }}
                data-testid="upload-button"
              >
                {uploading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <div className="spinner"></div>
                    Processing...
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    Start Processing
                    <ArrowRight size={20} />
                  </div>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.features}>
        <div style={styles.featuresContent}>
          <h2 style={styles.sectionTitle}>How it works</h2>
          
          <div style={styles.stepsGrid}>
            <div style={styles.step}>
              <div style={styles.stepNumber}>1</div>
              <h3 style={styles.stepTitle}>Upload Video</h3>
              <p style={styles.stepText}>
                Upload your video file. Our AI automatically detects scene changes.
              </p>
            </div>

            <div style={styles.step}>
              <div style={styles.stepNumber}>2</div>
              <h3 style={styles.stepTitle}>AI Analysis</h3>
              <p style={styles.stepText}>
                Gappy AI generates concise, WCAG-compliant audio descriptions for each scene.
              </p>
            </div>

            <div style={styles.step}>
              <div style={styles.stepNumber}>3</div>
              <h3 style={styles.stepTitle}>Review & Export</h3>
              <p style={styles.stepText}>
                Edit descriptions if needed, then export in MP4, AVI, or MOV format.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={styles.benefits}>
        <div style={styles.benefitsContent}>
          <h2 style={styles.sectionTitle}>Why Gappy?</h2>
          
          <div style={styles.benefitsGrid}>
            <div style={styles.benefit}>
              <CheckCircle2 size={24} color="#4ECDC4" />
              <div>
                <h4 style={styles.benefitTitle}>WCAG Compliant</h4>
                <p style={styles.benefitText}>Meets Level A accessibility standards</p>
              </div>
            </div>

            <div style={styles.benefit}>
              <CheckCircle2 size={24} color="#4ECDC4" />
              <div>
                <h4 style={styles.benefitTitle}>AI-Powered</h4>
                <p style={styles.benefitText}>Uses Gappy AI for accurate descriptions</p>
              </div>
            </div>

            <div style={styles.benefit}>
              <CheckCircle2 size={24} color="#4ECDC4" />
              <div>
                <h4 style={styles.benefitTitle}>Fast Processing</h4>
                <p style={styles.benefitText}>Get results in minutes, not hours</p>
              </div>
            </div>

            <div style={styles.benefit}>
              <CheckCircle2 size={24} color="#4ECDC4" />
              <div>
                <h4 style={styles.benefitTitle}>Multiple Formats</h4>
                <p style={styles.benefitText}>Export in MP4, AVI, or MOV</p>
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
    alignItems: 'center',
  },
  navLogo: {
    height: '40px',
    width: 'auto',
  },
  hero: {
    padding: '80px 24px 100px',
    textAlign: 'center',
    background: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)',
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  heroTitle: {
    fontSize: 'clamp(36px, 5vw, 56px)',
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: '24px',
    lineHeight: '1.2',
    letterSpacing: '-0.02em',
  },
  heroSubtitle: {
    fontSize: '20px',
    color: '#666666',
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
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    background: '#fafafa',
  },
  dropzoneActive: {
    borderColor: '#FF6B9D',
    background: '#fff5f8',
  },
  uploadIconWrapper: {
    marginBottom: '16px',
  },
  dropzoneText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '4px',
  },
  dropzoneSubtext: {
    fontSize: '14px',
    color: '#999999',
  },
  fileName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '4px',
  },
  fileSize: {
    fontSize: '14px',
    color: '#999999',
  },
  features: {
    padding: '100px 24px',
    background: '#ffffff',
  },
  featuresContent: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: '60px',
    letterSpacing: '-0.01em',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '48px',
  },
  step: {
    textAlign: 'center',
  },
  stepNumber: {
    width: '56px',
    height: '56px',
    background: '#FF6B9D',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 auto 20px',
  },
  stepTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '12px',
  },
  stepText: {
    fontSize: '16px',
    color: '#666666',
    lineHeight: '1.6',
  },
  benefits: {
    padding: '100px 24px',
    background: '#f9fafb',
  },
  benefitsContent: {
    maxWidth: '1000px',
    margin: '0 auto',
  },
  benefitsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '32px',
  },
  benefit: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  benefitTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '4px',
  },
  benefitText: {
    fontSize: '15px',
    color: '#666666',
    lineHeight: '1.5',
  },
};

export default HomePage;
