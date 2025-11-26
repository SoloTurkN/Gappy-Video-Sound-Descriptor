import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, Video, Clock, CheckCircle, Settings, LogOut, CreditCard, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState({
    videosThisMonth: 0,
    videosLimit: 3,
    plan: 'Free',
    allowedFormats: ['mp4']
  });

  useEffect(() => {
    loadProjects();
    loadUsage();
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

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`, { withCredentials: true });
      setProjects(response.data);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'uploaded': '#9ca3af',
      'processing': '#667eea',
      'analyzed': '#4ECDC4',
      'completed': '#10b981',
      'error': '#ef4444'
    };
    return colors[status] || '#9ca3af';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <nav className="navbar">
        <div style={styles.navContent}>
          <img src="/gappy-logo.png" alt="Gappy" style={styles.logo} onClick={() => navigate('/dashboard')} />
          <div style={styles.navRight}>
            <button onClick={() => navigate('/dashboard')} style={styles.navButton}>
              <Video size={18} style={{ marginRight: '6px' }} />
              Projects
            </button>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: '12px' }}>
                {user.picture ? (
                  <img src={user.picture} alt={user.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                ) : (
                  <User size={18} />
                )}
                <span style={{ fontSize: '14px', color: '#4a5568' }}>{user.name}</span>
              </div>
            )}
            <button onClick={async () => { 
              await logout(); 
              toast.success('Logged out successfully');
              navigate('/'); 
            }} style={styles.navButton}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <div style={styles.content}>
        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div className="card" style={styles.statCard}>
            <div style={styles.statIcon}>
              <Video size={24} color="#FF6B9D" />
            </div>
            <div>
              <p style={styles.statLabel}>Videos This Month</p>
              <p style={styles.statValue}>{stats.videosThisMonth} / {stats.videosLimit}</p>
            </div>
          </div>

          <div className="card" style={styles.statCard}>
            <div style={styles.statIcon}>
              <CreditCard size={24} color="#4ECDC4" />
            </div>
            <div>
              <p style={styles.statLabel}>Current Plan</p>
              <p style={styles.statValue}>{stats.plan}</p>
            </div>
          </div>

          <div className="card" style={styles.statCard}>
            <div style={styles.statIcon}>
              <Clock size={24} color="#667eea" />
            </div>
            <div>
              <p style={styles.statLabel}>Renewal</p>
              <p style={styles.statValue}>{stats.daysLeft} days</p>
            </div>
          </div>
        </div>

        {/* Upgrade Banner */}
        {stats.plan === 'Free' && (
          <div style={styles.upgradeBanner}>
            <div>
              <h3 style={styles.bannerTitle}>You're on the Free plan</h3>
              <p style={styles.bannerText}>Upgrade to Pro for unlimited videos and advanced features</p>
            </div>
            <button onClick={() => navigate('/pricing')} className="btn-primary">
              Upgrade to Pro
            </button>
          </div>
        )}

        {/* Projects Section */}
        <div style={styles.projectsHeader}>
          <div>
            <h2 style={styles.projectsTitle}>Your Projects</h2>
            <p style={styles.projectsSubtitle}>{projects.length} total projects</p>
          </div>
          <button onClick={() => navigate('/upload')} className="btn-primary">
            <Upload size={18} style={{ marginRight: '8px' }} />
            New Project
          </button>
        </div>

        {loading ? (
          <div style={styles.loading}>
            <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="card" style={styles.emptyState}>
            <Video size={48} color="#9ca3af" />
            <h3 style={styles.emptyTitle}>No projects yet</h3>
            <p style={styles.emptyText}>Upload your first video to get started</p>
            <button onClick={() => navigate('/upload')} className="btn-primary" style={{ marginTop: '20px' }}>
              <Upload size={18} style={{ marginRight: '8px' }} />
              Upload Video
            </button>
          </div>
        ) : (
          <div style={styles.projectsGrid}>
            {projects.map((project) => (
              <div 
                key={project.id} 
                className="card" 
                style={styles.projectCard}
                onClick={() => navigate(`/editor/${project.id}`)}
              >
                <div style={styles.projectHeader}>
                  <Video size={20} color="#FF6B9D" />
                  <div 
                    style={{
                      ...styles.statusBadge,
                      background: `${getStatusColor(project.status)}20`,
                      color: getStatusColor(project.status)
                    }}
                  >
                    {project.status}
                  </div>
                </div>
                <h3 style={styles.projectName}>{project.original_filename}</h3>
                <div style={styles.projectMeta}>
                  <span style={styles.metaItem}>
                    <Clock size={14} style={{ marginRight: '4px' }} />
                    {formatDate(project.created_at)}
                  </span>
                  {project.total_scenes > 0 && (
                    <span style={styles.metaItem}>
                      <CheckCircle size={14} style={{ marginRight: '4px' }} />
                      {project.total_scenes} scenes
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
  logo: {
    height: '32px',
    cursor: 'pointer',
  },
  navRight: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  navButton: {
    background: 'none',
    border: 'none',
    padding: '10px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px 24px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    padding: '24px',
  },
  statIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: '#f9fafb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
  },
  upgradeBanner: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '24px',
    borderRadius: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  bannerTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    marginBottom: '4px',
  },
  bannerText: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  projectsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  projectsTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
  },
  projectsSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
  },
  emptyState: {
    padding: '60px 20px',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    marginTop: '16px',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '15px',
    color: '#6b7280',
  },
  projectsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  projectCard: {
    padding: '24px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  projectHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  projectName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '12px',
  },
  projectMeta: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    color: '#6b7280',
  },
};

export default Dashboard;
