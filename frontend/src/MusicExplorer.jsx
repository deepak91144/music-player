import { useState, useEffect, useRef } from 'react';
import { searchSongs, autocompleteSearch, TRENDING_CATEGORIES } from './jiosaavnService';
import { addSongToFirestore } from './musicService';
import './JioSaavnExplorer.css';

export default function MusicExplorer({ isOpen, onClose, onPlayTrack, onAddToQueue, currentTrack }) {
  const [activeTab, setActiveTab] = useState('online'); // 'online' | 'upload'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(TRENDING_CATEGORIES[0].query);
  const [songs, setSongs] = useState([]);
  const [autocompleteResults, setAutocompleteResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Upload state
  const [customFile, setCustomFile] = useState(null);
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [customCover, setCustomCover] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const searchTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'online' && !searchTerm) {
      loadCategory(selectedCategory);
    }
  }, [selectedCategory, activeTab]);

  const loadCategory = async (categoryQuery) => {
    setIsLoading(true);
    try {
      const results = await searchSongs(categoryQuery, 1, 25);
      setSongs(results);
    } catch (err) {
      console.error('Failed to load category:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!val.trim()) {
      setAutocompleteResults(null);
      loadCategory(selectedCategory);
      return;
    }

    setIsLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const [fullResults, autoData] = await Promise.all([
          searchSongs(val, 1, 20),
          autocompleteSearch(val)
        ]);
        setSongs(fullResults);
        setAutocompleteResults(autoData);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 350);
  };

  const extractYtId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const convertGoogleDriveUrl = (url) => {
    if (!url) return url;
    const match = url.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
    return url;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomFile(file);
      if (!customTitle) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        setCustomTitle(cleanName);
      }
    }
  };

  /**
   * Primary Cloud Upload Pipeline:
   * 1. Tries AWS S3 Presigned PUT URL via Express Backend (/api/upload/presigned-url)
   * 2. Fallback to Tmpfiles CDN proxy (/api/upload/fallback)
   */
  const uploadToCloudPipeline = async (file) => {
    // Strategy 1: AWS S3 Presigned URL (Direct S3 Upload)
    try {
      const presignedRes = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'audio/mpeg'
        })
      });

      if (presignedRes.ok) {
        const { uploadUrl, publicStreamUrl } = await presignedRes.json();
        if (uploadUrl && publicStreamUrl) {
          // Direct PUT upload to AWS S3 bucket
          const s3PutRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type || 'audio/mpeg' },
            body: file
          });

          if (s3PutRes.ok) {
            console.log('✅ Directly uploaded file to AWS S3 Bucket:', publicStreamUrl);
            return publicStreamUrl;
          }
        }
      }
    } catch (err) {
      console.warn('S3 Presigned Upload notice:', err);
    }

    // Strategy 2: Express Backend Fallback Proxy
    try {
      const formData = new FormData();
      formData.append('file', file);
      const fallbackRes = await fetch('/api/upload/fallback', {
        method: 'POST',
        body: formData
      });

      if (fallbackRes.ok) {
        const json = await fallbackRes.json();
        if (json?.url) {
          console.log('✅ Uploaded file via Cloud Fallback:', json.url);
          return json.url;
        }
      }
    } catch (err) {
      console.warn('Backend upload proxy notice:', err);
    }

    // Strategy 3: Object URL local preview fallback
    return URL.createObjectURL(file);
  };

  const handleCreateCustomTrack = async (actionType) => {
    let audioSrc = convertGoogleDriveUrl(customUrl.trim());
    let ytId = extractYtId(audioSrc);

    if (!customFile && !audioSrc) {
      alert('Please upload an audio file or paste a song/Google Drive/YouTube link!');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Preparing audio track...');

    let finalSrc = audioSrc;

    if (customFile && !audioSrc) {
      setUploadStatus('Uploading audio to Cloud Storage...');
      setUploadProgress(50);
      finalSrc = await uploadToCloudPipeline(customFile);
      setUploadProgress(100);
    }

    const songPayload = {
      title: customTitle.trim() || customFile?.name?.replace(/\.[^/.]+$/, "") || 'Custom Track',
      artist: customArtist.trim() || 'Uploaded Track',
      cover: customCover.trim() || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop',
      album: 'Cloud Upload',
      src: ytId ? null : finalSrc,
      ytId: ytId || null,
      hasLyrics: false
    };

    const newSong = await addSongToFirestore(songPayload);

    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatus('');

    // Reset fields
    setCustomFile(null);
    setCustomUrl('');
    setCustomTitle('');
    setCustomArtist('');
    setCustomCover('');

    if (actionType === 'play') {
      onPlayTrack(newSong);
    } else if (onAddToQueue) {
      onAddToQueue(newSong);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="jio-modal-backdrop" onClick={onClose}>
      <div className="jio-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="jio-modal-header">
          <div className="jio-brand">
            <div className="jio-badge-pulse"></div>
            <h3>Cloud & Online Music Library</h3>
            <span className="jio-tag">320 Kbps HD & S3 Upload</span>
          </div>
          <button className="jio-close-btn" onClick={onClose} title="Close Explorer">
            &times;
          </button>
        </div>

        {/* Modal Main Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '0 20px', gap: '15px' }}>
          <button
            style={{
              padding: '12px 18px',
              background: activeTab === 'online' ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: '#fff',
              border: 'none',
              borderBottom: activeTab === 'online' ? '2px solid #ff4b72' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}
            onClick={() => setActiveTab('online')}
          >
            🎵 Online Music Search
          </button>
          <button
            style={{
              padding: '12px 18px',
              background: activeTab === 'upload' ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: '#fff',
              border: 'none',
              borderBottom: activeTab === 'upload' ? '2px solid #ff4b72' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}
            onClick={() => setActiveTab('upload')}
          >
            📤 Upload & Stream Links
          </button>
        </div>

        {activeTab === 'online' ? (
          <>
            {/* Search Bar Wrapper */}
            <div className="jio-search-box">
              <svg className="jio-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="jio-search-input"
                placeholder="Search millions of songs, artists, or albums..."
                value={searchTerm}
                onChange={handleSearchChange}
                autoFocus
              />
              {searchTerm && (
                <button className="jio-clear-btn" onClick={() => { setSearchTerm(''); setAutocompleteResults(null); loadCategory(selectedCategory); }}>
                  &times;
                </button>
              )}

              {autocompleteResults && (
                <div className="jio-autocomplete-dropdown">
                  {autocompleteResults.songs?.data?.length > 0 && (
                    <div className="jio-auto-section">
                      <div className="jio-auto-label">Songs</div>
                      {autocompleteResults.songs.data.slice(0, 5).map((s, i) => (
                        <div key={i} className="jio-auto-item" onClick={() => { setSearchTerm(s.title); setAutocompleteResults(null); searchSongs(s.title, 1, 25).then(setSongs); }}>
                          <img src={s.image} alt="" className="jio-auto-img" />
                          <div>
                            <div className="jio-auto-title">{s.title}</div>
                            <div className="jio-auto-sub">{s.more_info?.singers || s.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Category Pills */}
            <div className="jio-categories-scroll">
              {TRENDING_CATEGORIES.map((cat, idx) => (
                <button
                  key={idx}
                  className={`jio-cat-pill ${selectedCategory === cat.query && !searchTerm ? 'active' : ''}`}
                  onClick={() => { setSelectedCategory(cat.query); setSearchTerm(''); setAutocompleteResults(null); }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Content Body */}
            <div className="jio-modal-body">
              {isLoading ? (
                <div className="jio-loading-state">
                  <div className="jio-spinner"></div>
                  <p>Fetching 320kbps HD audio streams...</p>
                </div>
              ) : songs.length === 0 ? (
                <div className="jio-empty-state">
                  <div className="jio-empty-icon">🎵</div>
                  <p>No songs found for "{searchTerm || selectedCategory}". Try searching another title!</p>
                </div>
              ) : (
                <div className="jio-song-list">
                  {songs.map((song, index) => {
                    const isCurrentlyPlaying = currentTrack?.id === song.id;
                    return (
                      <div key={song.id || index} className={`jio-song-card ${isCurrentlyPlaying ? 'playing' : ''}`}>
                        <div className="jio-song-cover-wrap">
                          <img src={song.cover} alt={song.title} className="jio-song-cover" />
                          <button className="jio-overlay-play-btn" onClick={() => onPlayTrack(song)} title="Play Now">
                            {isCurrentlyPlaying ? (
                              <span className="jio-playing-bars"><span></span><span></span><span></span></span>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                            )}
                          </button>
                        </div>
                        <div className="jio-song-meta">
                          <div className="jio-song-title-row"><span className="jio-song-title">{song.title}</span></div>
                          <div className="jio-song-artist">{song.artist}</div>
                          <div className="jio-song-sub"><span>{song.album}</span>{song.year && <span> • {song.year}</span>}</div>
                        </div>
                        <div className="jio-song-actions">
                          <button className="jio-action-btn play" onClick={() => onPlayTrack(song)} title="Play Track">Play</button>
                          {onAddToQueue && (
                            <button className="jio-action-btn queue" onClick={() => onAddToQueue(song)} title="Add to Queue">+</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Upload & Custom Stream Tab */
          <div className="jio-modal-body" style={{ padding: '24px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ color: '#fff', margin: 0 }}>📤 Add Audio Track to Cloud</h4>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0, fontSize: '0.88rem' }}>
                Upload an audio file (.mp3, .wav, .m4a) to AWS S3 Cloud Storage OR stream directly from Google Drive / YouTube links.
              </p>

              <div>
                <label style={{ color: '#ff4b72', fontWeight: 600, display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
                  Option A: Select Audio File (AWS S3 Direct Upload)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="audio/*,.mp3,.wav,.m4a,.flac,.aac"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <button
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: customFile ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    border: '2px dashed rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {customFile ? `🎵 Selected: ${customFile.name} (${(customFile.size / (1024 * 1024)).toFixed(2)} MB)` : '📁 Click to Choose Audio File'}
                </button>
              </div>

              <div>
                <label style={{ color: '#ff4b72', fontWeight: 600, display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
                  Option B: Stream from Web Link / Google Drive / YouTube
                </label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                  placeholder="e.g. Google Drive link, https://.../song.mp3 or YouTube link"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ color: '#ccc', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Song Title</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                    placeholder="Title"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ color: '#ccc', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Artist Name</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                    placeholder="Artist"
                    value={customArtist}
                    onChange={(e) => setCustomArtist(e.target.value)}
                  />
                </div>
              </div>

              {isUploading && (
                <div style={{ color: '#00d2d3', fontSize: '0.88rem', marginTop: '8px' }}>
                  ⏳ {uploadStatus} {uploadProgress > 0 && `${uploadProgress}%`}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  style={{ flex: 1, padding: '12px', background: '#ff4b72', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                  onClick={() => handleCreateCustomTrack('play')}
                  disabled={isUploading}
                >
                  ▶ Play Song Now
                </button>
                <button
                  style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                  onClick={() => handleCreateCustomTrack('queue')}
                  disabled={isUploading}
                >
                  ➕ Add to Queue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="jio-modal-footer">
          <span>High Fidelity Streaming Engine</span>
          <span>Powered by Node.js Backend & AWS S3 Storage</span>
        </div>

      </div>
    </div>
  );
}
