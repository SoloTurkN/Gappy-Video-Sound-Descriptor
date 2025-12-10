import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Upload, Video, Clock, CheckCircle, Settings, LogOut, User, Trash2,
  Folder, Search, MoreVertical, Edit2, Archive, RefreshCw, Download,
  X, Check, AlertCircle, Play, Pause
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [draggedProject, setDraggedProject] = useState(null);
  const [hoveredVideo, setHoveredVideo] = useState(null);
  const videoRefs = useRef({});
  
  const [usage, setUsage] = useState({
    videosThisMonth: 0,
    videosLimit: 3,
    plan: 'Free',
    allowedFormats: ['mp4']
  });

  useEffect(() => {
    loadProjects();
    loadFolders();
    loadUsage();
  }, [currentFolder, searchQuery]);

  // Cleanup function for video elements
  useEffect(() => {
    return () => {
      Object.values(videoRefs.current).forEach(video => {
        if (video) {
          video.pause();
          video.src = '';
        }
      });
    };
  }, []);

  const loadUsage = async () => {
    try {
      const response = await axios.get(`${API}/usage`, { withCredentials: true });
      setUsage({
        videosThisMonth: response.data.videos_uploaded,
        videosLimit: response.data.max_videos || 'Unlimited',
        plan: response.data.tier_name,
        allowedFormats: response.data.allowed_formats
      });
    } catch (error) {
      console.error('Usage load error:', error);
    }
  };

  const loadFolders = async () => {
    try {
      const response = await axios.get(`${API}/folders`, { withCredentials: true });
      setFolders(response.data.folders || []);
    } catch (error) {
      console.error('Folders load error:', error);
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currentFolder) params.append('folder', currentFolder);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await axios.get(`${API}/projects?${params}`, { withCredentials: true });
      setProjects(response.data);
      setSelectedProjects([]);
    } catch (error) {
      console.error('Projects load error:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId, permanent = false) => {
    try {
      if (permanent) {
        if (!window.confirm('Permanently delete this project? This cannot be undone.')) return;
        
        await axios.post(`${API}/projects/bulk-action`, {
          project_ids: [projectId],
          action: 'delete_permanent'
        }, { withCredentials: true });
        
        toast.success('Project permanently deleted');
      } else {
        await axios.post(`${API}/projects/bulk-action`, {
          project_ids: [projectId],
          action: 'move_to_trash'
        }, { withCredentials: true });
        
        toast.success('Project moved to trash');
      }
      
      loadProjects();
      loadFolders();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleRestoreProject = async (projectId) => {
    try {
      await axios.post(`${API}/projects/bulk-action`, {
        project_ids: [projectId],
        action: 'restore'
      }, { withCredentials: true });
      
      toast.success('Project restored');
      loadProjects();
      loadFolders();
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore project');
    }
  };

  const handleBulkAction = async (action, folder = null) => {
    if (selectedProjects.length === 0) {
      toast.error('No projects selected');
      return;
    }

    try {
      const payload = {
        project_ids: selectedProjects,
        action: action
      };
      
      if (folder) payload.folder = folder;

      await axios.post(`${API}/projects/bulk-action`, payload, { withCredentials: true });
      
      toast.success(`Bulk action completed for ${selectedProjects.length} project(s)`);
      setSelectedProjects([]);
      loadProjects();
      loadFolders();
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error('Failed to complete bulk action');
    }
  };

  const handleDragStart = (e, projectId) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedProject(projectId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetFolder) => {
    e.preventDefault();
    
    if (!draggedProject) return;

    try {
      await axios.put(`${API}/projects/${draggedProject}/move`, {
        folder: targetFolder
      }, { withCredentials: true });
      
      toast.success(`Project moved to ${targetFolder}`);
      setDraggedProject(null);
      loadProjects();
      loadFolders();
    } catch (error) {
      console.error('Move error:', error);
      toast.error('Failed to move project');
    }
  };

  const toggleSelectProject = (projectId) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const selectAllProjects = () => {
    if (selectedProjects.length === projects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(projects.map(p => p.id));
    }
  };

  const handleVideoHover = (projectId, isHovering) => {
    if (isHovering) {
      setHoveredVideo(projectId);
      const video = videoRefs.current[projectId];
      if (video) {
        video.currentTime = 0;
        video.play().catch(err => console.log('Play error:', err));
      }
    } else {
      setHoveredVideo(null);
      const video = videoRefs.current[projectId];
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'analyzed': return '#3b82f6';
      case 'processing': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={{...styles.logoContainer, cursor: 'pointer'}} onClick={() => navigate('/')}>
            <img src="/gappy-logo1.png" alt="Gappy Describe" style={styles.logo} />
          </div>
          
          <div style={styles.headerRight}>
            <div style={styles.usageBadge}>
              <span style={styles.planName}>{usage.plan}</span>
              <span style={styles.usageText}>
                {usage.videosThisMonth}/{usage.videosLimit === 'Unlimited' ? '∞' : usage.videosLimit} videos
              </span>
            </div>
            
            <button
              onClick={() => navigate('/upload')}
              className="btn-primary"
              style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
              aria-label="Upload new video"
            >
              <Upload size={18} />
              Upload Video
            </button>
            
            <button
              onClick={logout}
              style={styles.logoutBtn}
              aria-label="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div style={styles.mainContent}>
        {/* Sidebar with Folders */}
        <aside style={styles.sidebar} role="navigation" aria-label="Project folders">
          <h2 style={styles.sidebarTitle}>Folders</h2>
          <nav style={styles.folderList}>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setCurrentFolder(folder.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, folder.id)}
                style={{
                  ...styles.folderItem,
                  ...(currentFolder === folder.id ? styles.folderItemActive : {})
                }}
                aria-label={`${folder.name} folder, ${folder.count} items`}
                aria-current={currentFolder === folder.id ? 'page' : undefined}
              >
                <div style={styles.folderIcon}>
                  {folder.icon === 'folder' && <Folder size={20} />}
                  {folder.icon === 'clock' && <Clock size={20} />}
                  {folder.icon === 'trash' && <Trash2 size={20} />}
                </div>
                <span style={styles.folderName}>{folder.name}</span>
                <span style={styles.folderCount}>{folder.count}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main style={styles.contentArea} role="main">
          {/* Search and Actions Bar */}
          <div style={styles.actionBar}>
            <div style={styles.searchContainer}>
              <Search size={20} style={styles.searchIcon} />
              <input
                type="search"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
                aria-label="Search projects"
              />
            </div>

            {selectedProjects.length > 0 && (
              <div style={styles.bulkActions}>
                <span style={styles.selectedCount}>
                  {selectedProjects.length} selected
                </span>
                
                {currentFolder === 'trash' ? (
                  <>
                    <button
                      onClick={() => handleBulkAction('restore')}
                      style={styles.bulkActionBtn}
                      aria-label="Restore selected projects"
                    >
                      <RefreshCw size={16} />
                      Restore
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Permanently delete selected projects? This cannot be undone.')) {
                          handleBulkAction('delete_permanent');
                        }
                      }}
                      style={{...styles.bulkActionBtn, ...styles.bulkActionDanger}}
                      aria-label="Permanently delete selected projects"
                    >
                      <Trash2 size={16} />
                      Delete Forever
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleBulkAction('move_to_trash')}
                      style={styles.bulkActionBtn}
                      aria-label="Move selected projects to trash"
                    >
                      <Trash2 size={16} />
                      Move to Trash
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Projects List */}
          {loading ? (
            <div style={styles.loadingContainer}>
              <img src="/gappy-icon1.png" alt="Loading" style={{ width: '60px', height: '60px' }} className="spin-icon" />
              <p style={styles.loadingText}>Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div style={styles.emptyState}>
              <Video size={64} color="#cbd5e1" />
              <h3 style={styles.emptyTitle}>
                {searchQuery ? 'No projects found' : 
                 currentFolder === 'trash' ? 'Trash is empty' :
                 'No projects yet'}
              </h3>
              <p style={styles.emptyText}>
                {searchQuery ? 'Try a different search term' :
                 currentFolder === 'trash' ? 'Deleted projects will appear here' :
                 'Upload your first video to get started'}
              </p>
              {currentFolder !== 'trash' && !searchQuery && (
                <button
                  onClick={() => navigate('/upload')}
                  className="btn-primary"
                  style={{ marginTop: '24px', padding: '12px 24px' }}
                >
                  <Upload size={18} style={{ marginRight: '8px' }} />
                  Upload Video
                </button>
              )}
            </div>
          ) : (
            <div style={styles.projectsList}>
              {/* Select All Header */}
              <div style={styles.listHeader}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedProjects.length === projects.length}
                    onChange={selectAllProjects}
                    style={styles.checkbox}
                    aria-label="Select all projects"
                  />
                  <span style={styles.headerText}>Video</span>
                </label>
                <span style={styles.headerText}>Duration</span>
                <span style={styles.headerText}>Status</span>
                <span style={styles.headerText}>Created</span>
                <span style={styles.headerText}>Actions</span>
              </div>

              {/* Project Items */}
              {projects.map((project) => (
                <div
                  key={project.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, project.id)}
                  style={{
                    ...styles.projectItem,
                    ...(selectedProjects.includes(project.id) ? styles.projectItemSelected : {})
                  }}
                  role="article"
                  aria-label={`Project: ${project.original_filename}`}
                >
                  <div style={styles.projectMain}>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedProjects.includes(project.id)}
                        onChange={() => toggleSelectProject(project.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={styles.checkbox}
                        aria-label={`Select ${project.original_filename}`}
                      />
                    </label>

                    <div
                      style={styles.thumbnailContainer}
                      onMouseEnter={() => handleVideoHover(project.id, true)}
                      onMouseLeave={() => handleVideoHover(project.id, false)}
                    >
                      {hoveredVideo === project.id ? (
                        <video
                          ref={el => videoRefs.current[project.id] = el}
                          style={styles.videoPreview}
                          src={`${BACKEND_URL}${project.video_path}`}
                          muted
                          loop
                          playsInline
                          aria-label={`Video preview for ${project.original_filename}`}
                        />
                      ) : (
                        <div style={styles.thumbnailPlaceholder}>
                          <Video size={24} color="#94a3b8" />
                        </div>
                      )}
                    </div>

                    <div style={styles.projectInfo}>
                      <h3 style={styles.projectTitle}>{project.original_filename}</h3>
                      <p style={styles.projectMeta}>
                        {project.total_scenes || 0} scenes
                      </p>
                    </div>
                  </div>

                  <span style={styles.projectDuration}>
                    {formatDuration(project.duration)}
                  </span>

                  <div style={styles.projectStatus}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: `${getStatusColor(project.status)}20`,
                        color: getStatusColor(project.status)
                      }}
                    >
                      {getStatusText(project.status)}
                    </span>
                  </div>

                  <span style={styles.projectDate}>
                    {formatDate(project.created_at)}
                  </span>

                  <div style={styles.projectActions}>
                    {currentFolder === 'trash' ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestoreProject(project.id);
                          }}
                          style={styles.actionBtn}
                          aria-label="Restore project"
                          title="Restore"
                        >
                          <RefreshCw size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id, true);
                          }}
                          style={{...styles.actionBtn, color: '#ef4444'}}
                          aria-label="Delete permanently"
                          title="Delete Forever"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/editor/${project.id}`);
                          }}
                          style={styles.actionBtn}
                          aria-label="Edit project"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          style={{...styles.actionBtn, color: '#ef4444'}}
                          aria-label="Move to trash"
                          title="Move to Trash"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f9fafb',
  },
  header: {
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
    padding: '16px 0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    height: '32px',
    width: 'auto',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  usageBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    padding: '8px 16px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  planName: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#667eea',
    textTransform: 'uppercase',
  },
  usageText: {
    fontSize: '14px',
    color: '#4a5568',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    padding: '8px',
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  mainContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px',
    display: 'flex',
    gap: '24px',
    minHeight: 'calc(100vh - 80px)',
  },
  sidebar: {
    width: '240px',
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
    height: 'fit-content',
    position: 'sticky',
    top: '100px',
  },
  sidebarTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '16px',
  },
  folderList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  folderItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: '#4a5568',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'left',
    width: '100%',
  },
  folderItemActive: {
    background: '#667eea',
    color: 'white',
  },
  folderIcon: {
    display: 'flex',
    alignItems: 'center',
  },
  folderName: {
    flex: 1,
  },
  folderCount: {
    fontSize: '12px',
    opacity: 0.7,
  },
  contentArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  searchContainer: {
    position: 'relative',
    flex: 1,
    maxWidth: '400px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px 10px 40px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
  },
  bulkActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 16px',
    background: '#f0f4ff',
    borderRadius: '8px',
    border: '1px solid #667eea',
  },
  selectedCount: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#667eea',
  },
  bulkActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    color: '#4a5568',
    transition: 'all 0.2s',
  },
  bulkActionDanger: {
    color: '#ef4444',
    borderColor: '#ef4444',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
  },
  loadingText: {
    marginTop: '16px',
    fontSize: '16px',
    color: '#6b7280',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1a202c',
    marginTop: '24px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#6b7280',
    marginTop: '8px',
  },
  projectsList: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  },
  listHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 120px 120px 120px 120px',
    gap: '16px',
    padding: '12px 20px',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#667eea',
  },
  headerText: {
    display: 'flex',
    alignItems: 'center',
  },
  projectItem: {
    display: 'grid',
    gridTemplateColumns: '2fr 120px 120px 120px 120px',
    gap: '16px',
    padding: '16px 20px',
    borderBottom: '1px solid #f3f4f6',
    transition: 'all 0.2s',
    cursor: 'move',
  },
  projectItemSelected: {
    background: '#f0f4ff',
  },
  projectMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  thumbnailContainer: {
    width: '80px',
    height: '45px',
    borderRadius: '6px',
    overflow: 'hidden',
    background: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  videoPreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  thumbnailPlaceholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectInfo: {
    flex: 1,
    minWidth: 0,
  },
  projectTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a202c',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginBottom: '4px',
  },
  projectMeta: {
    fontSize: '12px',
    color: '#6b7280',
  },
  projectDuration: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#4a5568',
  },
  projectStatus: {
    display: 'flex',
    alignItems: 'center',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  projectDate: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#6b7280',
  },
  projectActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    padding: '8px',
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
};

export default Dashboard;
