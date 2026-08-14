import { useState, useEffect, useRef } from 'react';
import { searchSongs, autocompleteSearch, TRENDING_CATEGORIES } from './jiosaavnService';
import './JioSaavnExplorer.css';

export default function JioSaavnExplorer({ isOpen, onClose, onPlayTrack, onAddToQueue, currentTrack }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(TRENDING_CATEGORIES[0].query);
  const [songs, setSongs] = useState([]);
  const [autocompleteResults, setAutocompleteResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (!searchTerm) {
      loadCategory(selectedCategory);
    }
  }, [selectedCategory]);

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

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat.query);
    setSearchTerm('');
    setAutocompleteResults(null);
  };

  const handleSuggestionClick = (query) => {
    setSearchTerm(query);
    setAutocompleteResults(null);
    setIsLoading(true);
    searchSongs(query, 1, 25).then(results => {
      setSongs(results);
      setIsLoading(false);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="jio-modal-backdrop" onClick={onClose}>
      <div className="jio-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="jio-modal-header">
          <div className="jio-brand">
            <div className="jio-badge-pulse"></div>
            <h3>Online Music Library</h3>
            <span className="jio-tag">320 Kbps HD</span>
          </div>
          <button className="jio-close-btn" onClick={onClose} title="Close Explorer">
            &times;
          </button>
        </div>

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

          {/* Live Autocomplete Suggestions dropdown nested cleanly inside search wrapper */}
          {autocompleteResults && (
            <div className="jio-autocomplete-dropdown">
              {autocompleteResults.topquery?.data?.length > 0 && (
                <div className="jio-auto-section">
                  <div className="jio-auto-label">Top Result</div>
                  {autocompleteResults.topquery.data.map((item, i) => (
                    <div key={i} className="jio-auto-item" onClick={() => handleSuggestionClick(item.title)}>
                      <img src={item.image} alt="" className="jio-auto-img" />
                      <div>
                        <div className="jio-auto-title">{item.title}</div>
                        <div className="jio-auto-sub">{item.type} {item.description ? `• ${item.description}` : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {autocompleteResults.songs?.data?.length > 0 && (
                <div className="jio-auto-section">
                  <div className="jio-auto-label">Songs</div>
                  {autocompleteResults.songs.data.slice(0, 4).map((s, i) => (
                    <div key={i} className="jio-auto-item" onClick={() => handleSuggestionClick(s.title)}>
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
              onClick={() => handleCategoryClick(cat)}
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
              <p>No songs found for "{searchTerm || selectedCategory}". Try searching another title or artist!</p>
            </div>
          ) : (
            <div className="jio-song-list">
              {songs.map((song, index) => {
                const isCurrentlyPlaying = currentTrack?.id === song.id;
                return (
                  <div
                    key={song.id || index}
                    className={`jio-song-card ${isCurrentlyPlaying ? 'playing' : ''}`}
                  >
                    <div className="jio-song-cover-wrap">
                      <img src={song.cover} alt={song.title} className="jio-song-cover" />
                      <button
                        className="jio-overlay-play-btn"
                        onClick={() => onPlayTrack(song)}
                        title="Play Now"
                      >
                        {isCurrentlyPlaying ? (
                          <span className="jio-playing-bars">
                            <span></span><span></span><span></span>
                          </span>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="jio-song-meta">
                      <div className="jio-song-title-row">
                        <span className="jio-song-title">{song.title}</span>
                        {song.hasLyrics && <span className="jio-badge-lyrics" title="Lyrics Available">LYRICS</span>}
                      </div>
                      <div className="jio-song-artist">{song.artist}</div>
                      <div className="jio-song-sub">
                        <span>{song.album}</span>
                        {song.year && <span> • {song.year}</span>}
                        {song.genre && <span> • {song.genre}</span>}
                      </div>
                    </div>

                    <div className="jio-song-actions">
                      <button
                        className="jio-action-btn play"
                        onClick={() => onPlayTrack(song)}
                        title="Play Track"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Play
                      </button>

                      {onAddToQueue && (
                        <button
                          className="jio-action-btn queue"
                          onClick={() => onAddToQueue(song)}
                          title="Add to Playlist Queue"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="jio-modal-footer">
          <span>High Fidelity Streaming Engine</span>
          <span>High Quality Audio Streams (AAC / 320 Kbps)</span>
        </div>

      </div>
    </div>
  );
}
