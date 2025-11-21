import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Download, Edit2, Play } from 'lucide-react';
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

  useEffect(() => {
    loadProject();
    
    // Cleanup function to stop audio when component unmounts
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    };
  }, [projectId]);
  
  // Cleanup audio on unmount
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
        axios.get(`${API}/projects/${projectId}`),
        axios.get(`${API}/projects/${projectId}/scenes`),
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
    // Stop any playing audio
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
      });
      
      // Update local state
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
    try {
      toast.info(`Exporting video as ${exportFormat.toUpperCase()}...`);
      const response = await axios.post(`${API}/export/${projectId}`, {
        format: exportFormat
      });
      
      toast.success('Video exported successfully!');
      
      // Download the exported video
      const downloadUrl = `${BACKEND_URL}${response.data.download_url}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `exported_${project?.original_filename || 'video'}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setShowExportDialog(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.detail || 'Failed to export video');
    } finally {
      setExporting(false);
    }
  };

  const playAudio = (audioPath) => {
    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    
    const fileName = audioPath.split('/').pop();
    const audioUrl = `${API}/audio/${projectId}/${fileName}`;
    const audio = new Audio(audioUrl);
    
    // Set up event listeners
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
        <div className="spinner"></div>
        <p>Loading project...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button
          onClick={() => navigate('/')}
          className="btn-secondary"
          style={{ padding: '10px 20px' }}
          data-testid="back-button"
        >
          <ArrowLeft size={20} style={{ marginRight: '8px' }} />
          Back
        </button>
        
        <div>
          <h1 style={styles.title}>{project?.original_filename}</h1>
          <p style={styles.subtitle}>{scenes.length} scenes detected</p>
        </div>
        
        <button
          onClick={() => setShowExportDialog(true)}
          className="btn-primary"
          style={{ padding: '10px 20px' }}
          data-testid="export-button"
        >
          <Download size={20} style={{ marginRight: '8px' }} />
          Export Video
        </button>
      </div>

      <div style={styles.scenesGrid}>
        {scenes.map((scene, index) => {
          const thumbnailFileName = scene.thumbnail_path.split('/').pop();
          const thumbnailUrl = `${API}/thumbnail/${projectId}/${thumbnailFileName}`;
          
          return (
            <div key={scene.id} className="glass-card fade-in" style={styles.sceneCard} data-testid={`scene-card-${index}`}>
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
                      style={{ ...styles.textarea, marginBottom: '12px' }}
                      data-testid={`edit-textarea-${index}`}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleSaveScene(scene.id)}
                        className="btn-primary"
                        disabled={saving}
                        style={{ padding: '8px 16px', flex: 1 }}
                        data-testid={`save-button-${index}`}
                      >
                        <Save size={16} style={{ marginRight: '4px' }} />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingScene(null)}
                        className="btn-secondary"
                        style={{ padding: '8px 16px' }}
                        data-testid={`cancel-button-${index}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={styles.description} data-testid={`scene-description-${index}`}>{scene.description}</p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        onClick={() => handleEditScene(scene)}
                        className="btn-secondary"
                        style={{ padding: '8px 16px', flex: 1 }}
                        data-testid={`edit-button-${index}`}
                      >
                        <Edit2 size={16} style={{ marginRight: '4px' }} />
                        Edit
                      </button>
                      <button
                        onClick={() => playAudio(scene.audio_path)}
                        className="btn-primary"
                        style={{ padding: '8px 16px', flex: 1 }}
                        data-testid={`play-button-${index}`}
                      >
                        <Play size={16} style={{ marginRight: '4px' }} />
                        Play Audio
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <div style={styles.modalOverlay} onClick={() => !exporting && setShowExportDialog(false)}>
          <div className="glass-card" style={styles.modal} onClick={(e) => e.stopPropagation()} data-testid="export-dialog">
            <h2 style={styles.modalTitle}>Export Video</h2>
            <p style={styles.modalText}>Choose the output format for your video with audio descriptions:</p>
            
            <div style={styles.formatOptions}>
              <label style={styles.formatLabel}>
                <input
                  type="radio"
                  name="format"
                  value="mp4"
                  checked={exportFormat === 'mp4'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  style={styles.radio}
                  data-testid="format-mp4"
                />
                <span style={styles.formatText}>
                  <strong>MP4</strong> (H.264) - Best compatibility
                </span>
              </label>
              
              <label style={styles.formatLabel}>
                <input
                  type="radio"
                  name="format"
                  value="avi"
                  checked={exportFormat === 'avi'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  style={styles.radio}
                  data-testid="format-avi"
                />
                <span style={styles.formatText}>
                  <strong>AVI</strong> - High quality, larger file size
                </span>
              </label>
              
              <label style={styles.formatLabel}>
                <input
                  type="radio"
                  name="format"
                  value="mov"
                  checked={exportFormat === 'mov'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  style={styles.radio}
                  data-testid="format-mov"
                />
                <span style={styles.formatText}>
                  <strong>MOV</strong> (QuickTime) - Best for Apple devices
                </span>
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={handleExport}
                className="btn-primary"
                disabled={exporting}
                style={{ flex: 1, padding: '12px' }}
                data-testid="confirm-export-button"
              >
                {exporting ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner" style={{ width: '16px', height: '16px', margin: '0 8px 0 0' }}></div>
                    Exporting...
                  </div>
                ) : (
                  <>
                    <Download size={18} style={{ marginRight: '8px' }} />
                    Export as {exportFormat.toUpperCase()}
                  </>
                )}
              </button>
              <button
                onClick={() => setShowExportDialog(false)}
                className="btn-secondary"
                disabled={exporting}
                style={{ padding: '12px 24px' }}
                data-testid="cancel-export-button"
              >
                Cancel
              </button>
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
    padding: '40px 20px',
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '40px',
    gap: '20px',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a202c',
  },
  subtitle: {
    fontSize: '16px',
    color: '#718096',
    marginTop: '4px',
  },
  scenesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px',
  },
  sceneCard: {
    overflow: 'hidden',
  },
  sceneHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sceneNumber: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a202c',
  },
  timestamp: {
    fontSize: '14px',
    color: '#718096',
    background: '#e0e7ff',
    padding: '4px 12px',
    borderRadius: '12px',
  },
  thumbnail: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    borderRadius: '12px',
    marginBottom: '16px',
  },
  sceneContent: {
    marginTop: '16px',
  },
  description: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#2d3748',
  },
  textarea: {
    width: '100%',
    minHeight: '100px',
    padding: '12px',
    border: '2px solid #e0e7ff',
    borderRadius: '12px',
    fontSize: '15px',
    fontFamily: 'Inter, sans-serif',
    resize: 'vertical',
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
    color: '#1a202c',
    marginBottom: '12px',
  },
  modalText: {
    fontSize: '15px',
    color: '#4a5568',
    marginBottom: '24px',
    lineHeight: '1.6',
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
    border: '2px solid #e0e7ff',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: 'white',
  },
  radio: {
    width: '20px',
    height: '20px',
    marginRight: '12px',
    cursor: 'pointer',
  },
  formatText: {
    fontSize: '15px',
    color: '#2d3748',
  },
};

export default EditorPage;
