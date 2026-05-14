import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Download, Edit2, Play, X, Trash2, Merge, CheckSquare, Square, FileText } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';

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
  const [editingName, setEditingName] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [abortController, setAbortController] = useState(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedScenes, setSelectedScenes] = useState(new Set());
  const [merging, setMerging] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptData, setTranscriptData] = useState(null);
  const [generatingTranscript, setGeneratingTranscript] = useState(false);

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

  const handleRenameProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('Project name cannot be empty');
      return;
    }
    
    try {
      await axios.put(`${API}/projects/${projectId}`, {
        original_filename: newProjectName
      }, { withCredentials: true });
      
      setProject({ ...project, original_filename: newProjectName });
      setEditingName(false);
      toast.success('Project renamed successfully');
    } catch (error) {
      console.error('Rename error:', error);
      toast.error('Failed to rename project');
    }
  };

  const handleSaveScene = async (sceneId) => {
    setSaving(true);
    try {
      await axios.put(`${API}/scenes/${sceneId}`, {
        description: editText
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

  const handleDeleteScene = async (sceneId) => {
    if (!window.confirm('Are you sure you want to delete this scene? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${API}/scenes/${sceneId}`, { withCredentials: true });
      toast.success('Scene deleted successfully');
      
      const response = await axios.get(`${API}/projects/${projectId}/scenes`, { withCredentials: true });
      setScenes(response.data);
      
      setProject(prev => ({
        ...prev,
        total_scenes: response.data.length
      }));
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete scene');
    }
  };

  const toggleSceneSelection = (sceneId) => {
    setSelectedScenes(prev => {
      const next = new Set(prev);
      if (next.has(sceneId)) {
        next.delete(sceneId);
      } else {
        next.add(sceneId);
      }
      return next;
    });
  };

  const handleMergeScenes = async () => {
    if (selectedScenes.size < 2) {
      toast.error('Select at least 2 scenes to merge');
      return;
    }

    const count = selectedScenes.size;
    if (!window.confirm(`Merge ${count} scenes? The earliest scene's description will be kept. This cannot be undone.`)) {
      return;
    }

    setMerging(true);
    try {
      await axios.post(`${API}/scenes/merge`, {
        scene_ids: Array.from(selectedScenes)
      }, { withCredentials: true });

      toast.success(`${count} scenes merged successfully`);

      const response = await axios.get(`${API}/projects/${projectId}/scenes`, { withCredentials: true });
      setScenes(response.data);
      setProject(prev => ({ ...prev, total_scenes: response.data.length }));
      setSelectedScenes(new Set());
      setMergeMode(false);
    } catch (error) {
      console.error('Merge error:', error);
      toast.error(error.response?.data?.detail || 'Failed to merge scenes');
    } finally {
      setMerging(false);
    }
  };

  const exitMergeMode = () => {
    setMergeMode(false);
    setSelectedScenes(new Set());
  };

  const loadTranscript = async () => {
    try {
      const res = await axios.get(`${API}/transcript/${projectId}`, { withCredentials: true });
      setTranscriptData(res.data);
      setShowTranscript(true);
    } catch (error) {
      console.error('Transcript load error:', error);
      toast.error('No transcript available. Was transcription enabled during upload?');
    }
  };

  const downloadCaption = async (format) => {
    try {
      const res = await axios.get(`${API}/captions/${projectId}/${format}`, {
        withCredentials: true,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.original_filename || 'captions'}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`No ${format.toUpperCase()} captions available`);
    }
  };

  const triggerTranscription = async () => {
    setGeneratingTranscript(true);
    toast.info('Generating transcript... This may take a minute.');
    try {
      await axios.post(`${API}/transcribe/${projectId}`, {}, {
        withCredentials: true,
        timeout: 300000
      });
      toast.success('Transcript generated successfully!');
      const res = await axios.get(`${API}/transcript/${projectId}`, { withCredentials: true });
      setTranscriptData(res.data);
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error(error.response?.data?.detail || 'Transcription failed');
    } finally {
      setGeneratingTranscript(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setExportProgress(0);
    
    // Create new AbortController for this export
    const controller = new AbortController();
    setAbortController(controller);
    
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
      }, { 
        withCredentials: true,
        signal: controller.signal,
        timeout: 600000  // 10 minutes
      });
      
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
      
      // Check if the error was due to cancellation
      if (axios.isCancel(error) || error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        toast.info('Export cancelled');
        setExportProgress(0);
        setEstimatedTime(0);
        return;
      }
      
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
      setAbortController(null);
    }
  };

  const handleCancelExport = () => {
    if (abortController) {
      abortController.abort();
      toast.info('Cancelling export...');
    }
    setShowExportDialog(false);
    setExporting(false);
    setExportProgress(0);
    setEstimatedTime(0);
    setDownloadUrl(null);
  };

  const playAudio = (audioPath) => {
    // Stop current audio if playing
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      } catch (e) {
        console.error('Error stopping current audio:', e);
      }
    }
    
    if (!audioPath) {
      toast.error('No audio available for this scene');
      return;
    }
    
    // Extract filename from path
    const fileName = audioPath.split('/').pop();
    const audioUrl = `${API}/audio/${projectId}/${fileName}`;
    
    // Fetch and play audio with authentication
    axios.get(audioUrl, {
      responseType: 'blob',
      withCredentials: true
    })
    .then(response => {
      // Create blob URL
      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const blobUrl = URL.createObjectURL(blob);
      
      const audio = new Audio(blobUrl);
      
      audio.onended = () => {
        setCurrentAudio(null);
        URL.revokeObjectURL(blobUrl);
      };
      
      audio.onerror = () => {
        toast.error('Failed to play audio');
        setCurrentAudio(null);
        URL.revokeObjectURL(blobUrl);
      };
      
      setCurrentAudio(audio);
      audio.play().catch(() => {
        toast.error('Unable to play audio');
        setCurrentAudio(null);
        URL.revokeObjectURL(blobUrl);
      });
    })
    .catch(err => {
      console.error('Audio fetch error:', err);
      if (err.response?.status === 404) {
        toast.error('Audio file not found. Please re-analyze the video.');
      } else {
        toast.error('Failed to load audio');
      }
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
      <Navbar />

      {/* Editor Toolbar */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-secondary"
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: 13 }}
          data-testid="back-button"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {mergeMode ? (
            <>
              <button
                onClick={handleMergeScenes}
                disabled={selectedScenes.size < 2 || merging}
                className="btn-primary"
                style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: 13, opacity: selectedScenes.size < 2 ? 0.5 : 1 }}
                data-testid="merge-confirm-button"
              >
                {merging ? (
                  <div className="spinner" style={{ width: 14, height: 14, borderTopColor: 'white' }} />
                ) : (
                  <Merge size={16} />
                )}
                Merge {selectedScenes.size > 0 ? `(${selectedScenes.size})` : ''}
              </button>
              <button
                onClick={exitMergeMode}
                className="btn-secondary"
                style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: 13 }}
                data-testid="merge-cancel-button"
              >
                <X size={16} />
                Cancel
              </button>
            </>
          ) : (
            <>
              {scenes.length >= 2 && (
                <button
                  onClick={() => setMergeMode(true)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: 13 }}
                  data-testid="merge-mode-button"
                >
                  <Merge size={16} />
                  Merge Scenes
                </button>
              )}
              <button
                onClick={loadTranscript}
                className="btn-secondary"
                style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: 13 }}
                data-testid="transcript-button"
              >
                <FileText size={16} />
                Transcript & CC
              </button>
              <button
                onClick={() => setShowExportDialog(true)}
                className="btn-primary"
                style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: 13 }}
                data-testid="export-button"
              >
                <Download size={16} />
                Export
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            {editingName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  style={styles.renameInput}
                  placeholder="Project name"
                  autoFocus
                />
                <button onClick={handleRenameProject} className="btn-primary" style={{ padding: '8px 16px' }}>
                  Save
                </button>
                <button onClick={() => setEditingName(false)} className="btn-secondary" style={{ padding: '8px 16px' }}>
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h1 style={styles.title}>{project?.original_filename}</h1>
                <button
                  onClick={() => {
                    setNewProjectName(project?.original_filename || '');
                    setEditingName(true);
                  }}
                  className="btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '14px' }}
                >
                  <Edit2 size={14} style={{ marginRight: '4px' }} />
                  Rename
                </button>
              </div>
            )}
            <p style={styles.subtitle}>{scenes.length} scenes detected</p>
          </div>
        </div>

        {mergeMode && (
          <div style={styles.mergeBanner} data-testid="merge-banner">
            <Merge size={16} />
            <span>Select scenes to merge. The earliest scene's description and thumbnail will be kept.</span>
          </div>
        )}

        <div style={styles.scenesGrid}>
          {scenes.map((scene, index) => {
            const thumbnailFileName = scene.thumbnail_path.split('/').pop();
            const thumbnailUrl = `${API}/thumbnail/${projectId}/${thumbnailFileName}`;
            const isSelected = selectedScenes.has(scene.id);
            
            return (
              <div
                key={scene.id}
                className="card fade-in"
                style={{
                  ...styles.sceneCard,
                  ...(mergeMode && isSelected ? styles.sceneCardSelected : {}),
                  ...(mergeMode ? { cursor: 'pointer' } : {})
                }}
                onClick={mergeMode ? () => toggleSceneSelection(scene.id) : undefined}
                data-testid={`scene-card-${index}`}
              >
                {mergeMode && (
                  <div style={styles.checkboxWrap} data-testid={`scene-checkbox-${index}`}>
                    {isSelected ? (
                      <CheckSquare size={22} color="#6A39F5" />
                    ) : (
                      <Square size={22} color="#d1d5db" />
                    )}
                  </div>
                )}
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
                          onClick={() => handleDeleteScene(scene.id)}
                          style={{ 
                            padding: '10px 16px',
                            background: '#fee',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                          data-testid={`delete-button-${index}`}
                        >
                          <Trash2 size={16} />
                          Delete
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

      {/* Transcript & CC Panel */}
      {showTranscript && (
        <div style={styles.modalOverlay} onClick={() => setShowTranscript(false)}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 32, width: '90%', maxWidth: 600, position: 'relative' }} onClick={(e) => e.stopPropagation()} data-testid="transcript-panel">
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Transcript & Closed Captions</h3>
              <button onClick={() => setShowTranscript(false)} style={styles.closeButton} data-testid="transcript-close">
                <X size={20} />
              </button>
            </div>

            {transcriptData?.transcript_text ? (
              <>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
                    Transcript
                  </label>
                  <div style={{
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: 14,
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: '#1f2937',
                    maxHeight: 250,
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap'
                  }} data-testid="transcript-text">
                    {transcriptData.transcript_text}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => downloadCaption('txt')}
                    className="btn-secondary"
                    style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                    data-testid="download-txt"
                  >
                    <Download size={14} />
                    Download TXT
                  </button>
                  {transcriptData.has_srt && (
                    <button
                      onClick={() => downloadCaption('srt')}
                      className="btn-secondary"
                      style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                      data-testid="download-srt"
                    >
                      <Download size={14} />
                      Download SRT
                    </button>
                  )}
                  {transcriptData.has_vtt && (
                    <button
                      onClick={() => downloadCaption('vtt')}
                      className="btn-secondary"
                      style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                      data-testid="download-vtt"
                    >
                      <Download size={14} />
                      Download VTT
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
                  No transcript available yet.
                </p>
                <button
                  onClick={triggerTranscription}
                  disabled={generatingTranscript}
                  className="btn-primary"
                  style={{ padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}
                  data-testid="generate-transcript-btn"
                >
                  {generatingTranscript ? (
                    <>
                      <div className="spinner" style={{ width: 14, height: 14, borderTopColor: 'white' }} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText size={16} />
                      Generate Transcript Now
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
                    onClick={handleCancelExport}
                    className="btn-secondary"
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
  renameInput: {
    fontSize: '32px',
    fontWeight: '700',
    padding: '8px 12px',
    border: '2px solid #FF6B9D',
    borderRadius: '8px',
    outline: 'none',
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
    position: 'relative',
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
  mergeBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#EAE8FF',
    color: '#6A39F5',
    padding: '12px 16px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 24,
  },
  sceneCardSelected: {
    outline: '2px solid #6A39F5',
    outlineOffset: -2,
    background: '#f9f8fe',
  },
  checkboxWrap: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    background: '#fff',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default EditorPage;
