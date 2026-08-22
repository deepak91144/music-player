import { useState, useRef } from 'react';
import { addSongToFirestore } from './musicService';
import './MusicExplorer.css';

export default function MusicExplorer({ isOpen, onClose, onPlayTrack, onAddToQueue, onSyncS3, currentTrack }) {
  // Upload state
  const [customFile, setCustomFile] = useState(null);
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [customCover, setCustomCover] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const fileInputRef = useRef(null);

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
    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';
    
    // Strategy 1: AWS S3 Presigned URL (Direct S3 Upload)
    try {
      const presignedRes = await fetch(`${API_BASE_URL}/api/upload/presigned-url`, {
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
            console.log('✅ Directly uploaded file to AWS S3 Bucket');
            const finalUrl = publicStreamUrl.startsWith('/') 
              ? `${API_BASE_URL || 'http://localhost:10000'}${publicStreamUrl}` 
              : publicStreamUrl;
            return finalUrl;
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
      const fallbackRes = await fetch(`${API_BASE_URL}/api/upload/fallback`, {
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

    if (!customFile && !audioSrc) {
      alert('Please upload an audio file or paste a song/Google Drive link!');
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

    const isBlob = finalSrc && finalSrc.startsWith('blob:');

    const songPayload = {
      title: customTitle.trim() || customFile?.name?.replace(/\.[^/.]+$/, "") || 'Custom Track',
      artist: customArtist.trim() || 'Uploaded Track',
      cover: customCover.trim() || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop',
      album: 'Cloud Upload',
      src: finalSrc,
      ytId: null,
      hasLyrics: false
    };

    // Only save to Firestore if it's a real persistent URL (not a temporary blob:)
    let newSong = songPayload;
    if (!isBlob) {
      newSong = await addSongToFirestore(songPayload);
    } else {
      newSong = { id: `local_${Date.now()}`, ...songPayload };
    }

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
            <h3>Upload Your Song</h3>
          </div>
          <button className="jio-close-btn" onClick={onClose} title="Close Explorer">
            &times;
          </button>
        </div>

       

        {/* Upload & Custom Stream Tab */}
        <div className="jio-modal-body" style={{ padding: '24px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
           

            <div>
             
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
                 Upload Track
              </button>
              {onSyncS3 && (
                <button
                  style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                  onClick={() => {
                    onSyncS3();
                    onClose();
                  }}
                  title="Wipe broken links and sync all real songs from AWS S3"
                >
                  🔄 Sync S3 Bucket
                </button>
              )}
            </div>
          </div>
        </div>

      

      </div>
    </div>
  );
}
