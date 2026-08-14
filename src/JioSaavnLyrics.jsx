import { useState, useEffect } from 'react';
import { getLyrics } from './jiosaavnService';
import './JioSaavnLyrics.css';

export default function JioSaavnLyrics({ song, isOpen, onClose }) {
  const [lyrics, setLyrics] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && song) {
      setIsLoading(true);
      setError(null);
      
      const songId = song.id || song.raw?.id;
      getLyrics(songId)
        .then(res => {
          if (res) {
            setLyrics(res);
          } else {
            setError('Lyrics are not available for this track.');
          }
        })
        .catch(err => {
          console.error('Failed to fetch lyrics:', err);
          setError('Could not load lyrics. Please try again later.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, song]);

  if (!isOpen || !song) return null;

  return (
    <div className="lyrics-modal-backdrop" onClick={onClose}>
      <div className="lyrics-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Background Album Blur */}
        <div
          className="lyrics-bg-blur"
          style={{ backgroundImage: `url(${song.cover})` }}
        />

        <div className="lyrics-modal-header">
          <div className="lyrics-song-info">
            <img src={song.cover} alt={song.title} className="lyrics-cover" />
            <div>
              <h4 className="lyrics-song-title">{song.title}</h4>
              <p className="lyrics-song-artist">{song.artist}</p>
            </div>
          </div>
          <button className="lyrics-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="lyrics-modal-body">
          {isLoading ? (
            <div className="lyrics-loading">
              <div className="lyrics-spinner"></div>
              <p>Fetching lyrics from JioSaavn...</p>
            </div>
          ) : error ? (
            <div className="lyrics-error">
              <div className="lyrics-icon">🎤</div>
              <p>{error}</p>
            </div>
          ) : (
            <div className="lyrics-text">
              {lyrics.split('\n').map((line, i) => (
                <p key={i} className="lyrics-line">{line || '\u00A0'}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
