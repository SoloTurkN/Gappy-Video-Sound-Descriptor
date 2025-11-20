import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Upload, Video, FileText } from 'lucide-react';
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
      
      // Start analysis
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
      <div style={styles.hero}>
        <div style={styles.badge}>
          <Video size={20} style={{ marginRight: '8px' }} />
          WCAG 1.2.3 Level A Compliant
        </div>
        
        <h1 style={styles.title} data-testid="main-title">
          Video Voice Description Generator
        </h1>
        
        <p style={styles.subtitle}>
          Automatically add audio descriptions to your videos for accessibility compliance.
          AI-powered scene detection and WCAG-compliant voice descriptions.
        </p>

        <div style={styles.features}>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>
              <Upload size={24} />
            </div>
            <div>
              <h3 style={styles.featureTitle}>Upload Video</h3>
              <p style={styles.featureText}>Support for MP4, AVI, MOV formats</p>
            </div>
          </div>
          
          <div style={styles.feature}>
            <div style={styles.featureIcon}>
              <Video size={24} />
            </div>
            <div>
              <h3 style={styles.featureTitle}>AI Scene Detection</h3>
              <p style={styles.featureText}>Automatic detection of scene cuts</p>
            </div>
          </div>
          
          <div style={styles.feature}>
            <div style={styles.featureIcon}>
              <FileText size={24} />
            </div>
            <div>
              <h3 style={styles.featureTitle}>Voice Descriptions</h3>
              <p style={styles.featureText}>AI-generated WCAG compliant audio</p>
            </div>
          </div>
        </div>

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
            <Upload size={48} style={{ color: '#667eea', marginBottom: '16px' }} />
            <p style={styles.dropzoneText}>
              {selectedFile ? selectedFile.name : 'Drag and drop your video here'}
            </p>
            <p style={styles.dropzoneSubtext}>or</p>
            <label htmlFor="file-upload" className="btn-secondary" style={{ display: 'inline-block', cursor: 'pointer' }}>
              Browse Files
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
              style={{ marginTop: '24px', width: '100%' }}
              data-testid="upload-button"
            >
              {uploading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 10px 0 0' }}></div>
                  Processing...
                </div>
              ) : (
                'Upload and Analyze'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    padding: '40px 20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hero: {
    maxWidth: '900px',
    width: '100%',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(102, 126, 234, 0.1)',
    color: '#667eea',
    padding: '8px 20px',
    borderRadius: '50px',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '24px',
  },
  title: {
    fontSize: 'clamp(32px, 5vw, 56px)',
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: '20px',
    lineHeight: '1.2',
  },
  subtitle: {
    fontSize: '18px',
    color: '#4a5568',
    marginBottom: '48px',
    lineHeight: '1.6',
    maxWidth: '700px',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    marginBottom: '48px',
  },
  feature: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  featureIcon: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '12px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: '4px',
  },
  featureText: {
    fontSize: '14px',
    color: '#718096',
  },
  uploadCard: {
    marginTop: '32px',
  },
  dropzone: {
    border: '3px dashed #cbd5e0',
    borderRadius: '16px',
    padding: '60px 20px',
    textAlign: 'center',
    transition: 'all 0.3s',
    cursor: 'pointer',
  },
  dropzoneActive: {
    borderColor: '#667eea',
    background: 'rgba(102, 126, 234, 0.05)',
  },
  dropzoneText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '8px',
  },
  dropzoneSubtext: {
    fontSize: '14px',
    color: '#718096',
    margin: '16px 0',
  },
};

export default HomePage;
