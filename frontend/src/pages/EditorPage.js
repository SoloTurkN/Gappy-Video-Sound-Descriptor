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

  useEffect(() => {
    loadProject();
  }, [projectId]);

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
    const fileName = audioPath.split('/').pop();
    const audioUrl = `${API}/audio/${projectId}/${fileName}`;
    const audio = new Audio(audioUrl);
    audio.play();
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
          onClick={handleExport}
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
};

export default EditorPage;
