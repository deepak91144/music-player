import { useState } from 'react';
import './MusicExplorer.css'; // Reuse the modal styles

export default function SearchModal({ isOpen, onClose, tracks, onPlayTrack, currentTrackIndex }) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredTracks = tracks.filter(t => 
    (t.title && t.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (t.artist && t.artist.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="jio-modal-backdrop" onClick={onClose}>
      <div className="jio-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="jio-modal-header">
          <div className="jio-brand">
            <h3>Library Search</h3>
          </div>
          <button className="jio-close-btn" onClick={onClose} title="Close">
            &times;
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <input
            type="text"
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
            placeholder="Search your playlist by song or artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="jio-modal-body" style={{ padding: '0', maxHeight: '60vh', overflowY: 'auto' }}>
          {filteredTracks.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              No tracks found.
            </div>
          ) : (
            filteredTracks.map((track) => {
              const originalIndex = tracks.indexOf(track);
              const isPlaying = originalIndex === currentTrackIndex;
              
              return (
                <div 
                  key={track.id || originalIndex} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '12px 20px', 
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: isPlaying ? 'rgba(255, 75, 114, 0.1)' : 'transparent',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    onPlayTrack(originalIndex);
                    onClose();
                  }}
                >
                  <img 
                    src={track.cover || '/album_midnight.png'} 
                    alt="cover" 
                    style={{ width: '40px', height: '40px', borderRadius: '4px', marginRight: '15px', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: isPlaying ? '#ff4b72' : '#fff', fontWeight: 600, fontSize: '0.95rem' }}>
                      {track.title}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                      {track.artist || 'Unknown Artist'}
                    </div>
                  </div>
                  {isPlaying && (
                    <div style={{ color: '#ff4b72', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      PLAYING
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
