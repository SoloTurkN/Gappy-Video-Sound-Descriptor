import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Download, Edit2, Play, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EditorPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingScene, setEditingScene] = useState(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('mp4');
  const [currentAudio, setCurrentAudio] = useState(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);

  useEffect(() => {
    loadProject();
    
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    };
  }, [projectId]);
  
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
      }
    };
  }, [currentAudio]);

  const loadProject = async () => {
    try {
      const [projectRes, scenesRes] = await Promise.all([
        axios.get(`${API}/projects/${projectId}`, { withCredentials: true }),
        axios.get(`${API}/projects/${projectId}/scenes`, { withCredentials: true }),
      ]);
      
      setProject(projectRes.data);
      setScenes(scenesRes.data);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleEditScene = (scene) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    
    setEditingScene(scene.id);
    setEditText(scene.description);
  };

  const handleSaveScene = async (sceneId) => {
    setSaving(true);
    try {
      await axios.put(`${API}/scenes/${sceneId}`, {
        description: editText,
      }, { withCredentials: true });
      
      setScenes(scenes.map(s => 
        s.id === sceneId ? { ...s, description: editText } : s
      ));
      
      setEditingScene(null);
      toast.success('Scene updated successfully!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save scene');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setExportProgress(0);
    
    const estimatedSeconds = Math.max(5, (scenes.length * 2) + 3);
    setEstimatedTime(estimatedSeconds);
    
    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 85) {
          return Math.min(prev + 1, 95);
        }
        return prev + (85 / (estimatedSeconds * 2));
      });
    }, 500);
    
    try {
      toast.info(`Exporting video as ${exportFormat.toUpperCase()}...`);
      
      const response = await axios.post(`${API}/export/${projectId}`, {
        format: exportFormat
      }, { withCredentials: true });
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const fullDownloadUrl = `${BACKEND_URL}${response.data.download_url}`;
      setDownloadUrl(fullDownloadUrl);
      
      // Try automatic download
      try {
        const link = document.createElement('a');
        link.href = fullDownloadUrl;
        link.download = `exported_${project?.original_filename || 'video'}.${exportFormat}`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);
        
        toast.success('Export complete! Download should start automatically. If not, click the Download button below.');
      } catch (downloadError) {
        console.error('Auto-download error:', downloadError);
        toast.success('Export complete! Click the Download button below to get your video.');
      }
      
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Export error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to export video';
      const displayMessage = typeof errorMessage === 'string' && errorMessage.length > 100 
        ? 'Video export failed. Please check if all scenes have valid audio.'
        : errorMessage;
      toast.error(displayMessage);
      setExportProgress(0);
      setEstimatedTime(0);
    } finally {
      setExporting(false);
    }
  };

  const playAudio = (audioPath) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    
    const fileName = audioPath.split('/').pop();
    const audioUrl = `${API}/audio/${projectId}/${fileName}`;
    const audio = new Audio(audioUrl);
    
    audio.onended = () => {
      setCurrentAudio(null);
    };
    
    audio.onerror = () => {
      toast.error('Failed to play audio');
      setCurrentAudio(null);
    };
    
    setCurrentAudio(audio);
    audio.play().catch(err => {
      console.error('Audio play error:', err);
      toast.error('Failed to play audio');
      setCurrentAudio(null);
    });
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
        <p style={{ marginTop: '16px', color: '#666' }}>Loading project...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <nav className="navbar">
        <div style={styles.navContent}>
          <button
            onClick={() => navigate('/')}
            className="btn-secondary"
            style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
            data-testid="back-button"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          
          <img src="/gappy-logo.png" alt="Gappy" style={styles.navLogo} />
          
          <button
            onClick={() => setShowExportDialog(true)}
            className="btn-primary"
            style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
            data-testid="export-button"
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </nav>

      {/* Content */}
      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>{project?.original_filename}</h1>
            <p style={styles.subtitle}>{scenes.length} scenes detected</p>
          </div>
        </div>

        <div style={styles.scenesGrid}>
          {scenes.map((scene, index) => {
            const thumbnailFileName = scene.thumbnail_path.split('/').pop();
            const thumbnailUrl = `${API}/thumbnail/${projectId}/${thumbnailFileName}`;
            
            return (
              <div key={scene.id} className="card fade-in" style={styles.sceneCard} data-testid={`scene-card-${index}`}>
                <div style={styles.sceneHeader}>
                  <span style={styles.sceneNumber}>Scene {index + 1}</span>
                  <span style={styles.timestamp}>{scene.timestamp.toFixed(2)}s</span>
                </div>
                
                <img
                  src={thumbnailUrl}
                  alt={`Scene ${index + 1}`}
                  style={styles.thumbnail}
                  data-testid={`scene-thumbnail-${index}`}
                />
                
                <div style={styles.sceneContent}>
                  {editingScene === scene.id ? (
                    <div>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        style={{ marginBottom: '12px' }}
                        data-testid={`edit-textarea-${index}`}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleSaveScene(scene.id)}
                          className="btn-primary"
                          disabled={saving}
                          style={{ padding: '10px 16px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          data-testid={`save-button-${index}`}
                        >
                          {saving ? (
                            <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                          ) : (
                            <><Save size={16} /> Save</>
                          )}
                        </button>
                        <button
                          onClick={() => setEditingScene(null)}
                          className="btn-secondary"
                          style={{ padding: '10px 16px' }}
                          data-testid={`cancel-button-${index}`}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p style={styles.description} data-testid={`scene-description-${index}`}>{scene.description}</p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button
                          onClick={() => handleEditScene(scene)}
                          className="btn-secondary"
                          disabled={saving || editingScene !== null}
                          style={{ padding: '10px 16px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          data-testid={`edit-button-${index}`}
                        >
                          <Edit2 size={16} />
                          {saving && editingScene === scene.id ? 'Saving...' : 'Edit'}
                        </button>
                        <button
                          onClick={() => playAudio(scene.audio_path)}
                          className="btn-primary"
                          style={{ 
                            padding: '10px 16px', 
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            opacity: currentAudio && currentAudio.src.includes(scene.audio_path.split('/').pop()) ? 0.7 : 1
                          }}
                          data-testid={`play-button-${index}`}
                        >
                          <Play size={16} />
                          {currentAudio && currentAudio.src.includes(scene.audio_path.split('/').pop()) ? 'Playing...' : 'Play'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <div style={styles.modalOverlay} onClick={() => !exporting && setShowExportDialog(false)} data-testid="export-modal-overlay">
          <div className="card" style={styles.modal} onClick={(e) => e.stopPropagation()} data-testid="export-dialog">
            <h2 style={styles.modalTitle}>Export Video</h2>
            <p style={styles.modalText}>Choose the output format for your video:</p>
            
            <div style={styles.formatOptions}>
              <label style={{...styles.formatLabel, opacity: exporting ? 0.5 : 1, cursor: exporting ? 'not-allowed' : 'pointer'}}>
                <input
                  type="radio"
                  name="format"
                  value="mp4"
                  checked={exportFormat === 'mp4'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  disabled={exporting}
                  data-testid="format-mp4"
                />
                <span>
                  <strong>MP4</strong> - Best compatibility
                </span>
              </label>
              
              <label style={{...styles.formatLabel, opacity: exporting ? 0.5 : 1, cursor: exporting ? 'not-allowed' : 'pointer'}}>
                <input
                  type="radio"
                  name="format"
                  value="avi"
                  checked={exportFormat === 'avi'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  disabled={exporting}
                  data-testid="format-avi"
                />
                <span>
                  <strong>AVI</strong> - High quality
                </span>
              </label>
              
              <label style={{...styles.formatLabel, opacity: exporting ? 0.5 : 1, cursor: exporting ? 'not-allowed' : 'pointer'}}>
                <input
                  type="radio"
                  name="format"
                  value="mov"
                  checked={exportFormat === 'mov'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  disabled={exporting}
                  data-testid="format-mov"
                />
                <span>
                  <strong>MOV</strong> - Best for Apple
                </span>
              </label>
            </div>
            
            {exporting && (
              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    {exportProgress >= 95 ? 'Finalizing...' : 'Processing...'}
                  </span>
                  <span style={{ fontSize: '14px', color: '#FF6B9D', fontWeight: '600' }}>
                    {Math.round(exportProgress)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${exportProgress}%` }}></div>
                </div>
                {estimatedTime > 0 && exportProgress < 95 && (
                  <p style={{ fontSize: '13px', color: '#999', marginTop: '8px' }}>
                    ~{Math.max(1, Math.round(estimatedTime * (1 - exportProgress / 85)))}s remaining
                  </p>
                )}
              </div>
            )}
            
            <div style={styles.modalActions}>
              {downloadUrl ? (
                <>
                  <a
                    href={downloadUrl}
                    download
                    className="btn-primary"
                    style={{ padding: '14px 32px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    data-testid="download-button"
                  >
                    <Download size={18} />
                    Download Video
                  </a>
                  <button
                    onClick={() => {
                      setShowExportDialog(false);
                      setDownloadUrl(null);
                      setExportProgress(0);
                    }}
                    className="btn-secondary"
                    style={{ padding: '14px 24px' }}
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleExport}
                    className="btn-primary"
                    disabled={exporting}
                    style={{ padding: '14px 32px' }}
                    data-testid="start-export-button"
                  >
                    {exporting ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: 'white' }}></div>
                        Exporting...
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Download size={18} />
                        Export
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => setShowExportDialog(false)}
                    className="btn-secondary"
                    disabled={exporting}
                    style={{ padding: '14px 24px' }}
                    data-testid="cancel-export-button"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f9fafb',
  },
  navContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navLogo: {
    height: '32px',
    width: 'auto',
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px 24px',
  },
  header: {
    marginBottom: '40px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666666',
  },
  scenesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '24px',
  },
  sceneCard: {
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  sceneHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sceneNumber: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  timestamp: {
    fontSize: '13px',
    color: '#999999',
    background: '#f3f4f6',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  thumbnail: {
    width: '100%',
    height: '220px',
    objectFit: 'cover',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  sceneContent: {
    marginTop: '16px',
  },
  description: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#1a1a1a',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    maxWidth: '500px',
    width: '90%',
    padding: '32px',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '8px',
  },
  modalText: {
    fontSize: '15px',
    color: '#666666',
    marginBottom: '24px',
  },
  formatOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formatLabel: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: 'white',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
};

export default EditorPage;
