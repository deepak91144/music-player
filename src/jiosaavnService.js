import CryptoJS from 'crypto-js';

// Decryption key for JioSaavn encrypted_media_url
const DES_KEY = '38346591';

/**
 * Decrypts JioSaavn encrypted_media_url to a streamable audio URL
 */
export function decryptMediaUrl(encryptedUrl) {
  if (!encryptedUrl) return null;
  try {
    const key = CryptoJS.enc.Utf8.parse(DES_KEY);
    const decrypted = CryptoJS.DES.decrypt(
      { ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl) },
      key,
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
    );
    let url = decrypted.toString(CryptoJS.enc.Utf8);
    if (!url) return null;

    // Convert http to https
    url = url.replace('http://', 'https://');

    // Upgrade quality to 320kbps if available, otherwise keep default
    if (url.includes('_96.mp4')) {
      url = url.replace('_96.mp4', '_320.mp4');
    } else if (url.includes('_160.mp4')) {
      url = url.replace('_160.mp4', '_320.mp4');
    } else if (url.includes('_96.mp3')) {
      url = url.replace('_96.mp3', '_320.mp3');
    }

    return url;
  } catch (err) {
    console.error('Failed to decrypt JioSaavn media URL:', err);
    return null;
  }
}

/**
 * Unescapes HTML entities in string
 */
export function sanitizeText(text) {
  if (!text) return '';
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/**
 * Upgrades JioSaavn image URL to 500x500
 */
export function getHighResImage(imageUrl) {
  if (!imageUrl) return '/album_midnight.png';
  return imageUrl
    .replace('150x150', '500x500')
    .replace('50x50', '500x500')
    .replace('http://', 'https://');
}

/**
 * Formats raw JioSaavn song object into standardized Track object
 */
export function formatJioSaavnTrack(rawSong) {
  const moreInfo = rawSong.more_info || {};
  
  // Extract primary artists
  let artistName = 'Unknown Artist';
  if (moreInfo.artistMap && moreInfo.artistMap.primary_artists && moreInfo.artistMap.primary_artists.length > 0) {
    artistName = moreInfo.artistMap.primary_artists.map(a => sanitizeText(a.name)).join(', ');
  } else if (rawSong.primary_artists) {
    artistName = sanitizeText(rawSong.primary_artists);
  } else if (moreInfo.music) {
    artistName = sanitizeText(moreInfo.music);
  } else if (rawSong.singers) {
    artistName = sanitizeText(rawSong.singers);
  }

  // Get streamable media URL
  let mediaUrl = null;
  if (moreInfo.encrypted_media_url) {
    mediaUrl = decryptMediaUrl(moreInfo.encrypted_media_url);
  } else if (rawSong.encrypted_media_url) {
    mediaUrl = decryptMediaUrl(rawSong.encrypted_media_url);
  } else if (moreInfo.vlink) {
    mediaUrl = moreInfo.vlink;
  }

  const durationSec = parseInt(moreInfo.duration || rawSong.duration || 0, 10);

  return {
    id: rawSong.id || `saavn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title: sanitizeText(rawSong.title),
    artist: artistName,
    album: sanitizeText(moreInfo.album || rawSong.album || 'JioSaavn Single'),
    genre: rawSong.language ? (rawSong.language.charAt(0).toUpperCase() + rawSong.language.slice(1)) : 'Bollywood',
    cover: getHighResImage(rawSong.image),
    src: mediaUrl,
    duration: durationSec,
    year: rawSong.year || moreInfo.year || '',
    language: rawSong.language || 'Hindi',
    hasLyrics: moreInfo.has_lyrics === 'true' || rawSong.has_lyrics === 'true',
    isJioSaavn: true,
    raw: rawSong
  };
}

/**
 * Base fetcher with proxy & CORS fallback
 */
async function fetchJioSaavnApi(params) {
  const queryStr = new URLSearchParams(params).toString();

  // Try 1: Local Vite proxy
  try {
    const res = await fetch(`/saavn-api/api.php?${queryStr}`);
    if (res.ok) {
      const data = await res.json();
      if (data) return data;
    }
  } catch (_) {
    // Proxy failed or not running, try fallback
  }

  // Try 2: Direct call
  try {
    const res = await fetch(`https://www.jiosaavn.com/api.php?${queryStr}`);
    if (res.ok) {
      const data = await res.json();
      if (data) return data;
    }
  } catch (_) {
    // Direct call failed
  }

  // Try 3: CORS proxy fallback (allorigins)
  try {
    const targetUrl = encodeURIComponent(`https://www.jiosaavn.com/api.php?${queryStr}`);
    const res = await fetch(`https://api.allorigins.win/raw?url=${targetUrl}`);
    if (res.ok) {
      const data = await res.json();
      if (data) return data;
    }
  } catch (err) {
    console.error('All JioSaavn API fetch attempts failed:', err);
  }

  return null;
}

/**
 * Search songs on JioSaavn
 */
export async function searchSongs(query, page = 1, limit = 20) {
  if (!query || !query.trim()) return [];

  const data = await fetchJioSaavnApi({
    __call: 'search.getResults',
    q: query.trim(),
    n: limit,
    p: page,
    _format: 'json',
    _marker: '0',
    api_version: '4',
    ctx: 'web'
  });

  if (!data || !data.results) return [];

  return data.results
    .map(formatJioSaavnTrack)
    .filter(track => track.src !== null);
}

/**
 * Autocomplete search for live search bar suggestions
 */
export async function autocompleteSearch(query) {
  if (!query || !query.trim()) return null;

  const data = await fetchJioSaavnApi({
    __call: 'autocomplete.get',
    query: query.trim(),
    _format: 'json',
    _marker: '0',
    ctx: 'web'
  });

  return data;
}

/**
 * Get song details including lyrics availability
 */
export async function getSongDetails(songId) {
  if (!songId) return null;

  const data = await fetchJioSaavnApi({
    __call: 'song.getDetails',
    pids: songId,
    _format: 'json',
    _marker: '0',
    api_version: '4',
    ctx: 'web'
  });

  if (!data) return null;
  const rawSong = data[songId];
  if (!rawSong) return null;

  return formatJioSaavnTrack(rawSong);
}

/**
 * Get song lyrics
 */
export async function getLyrics(songId) {
  if (!songId) return null;

  const data = await fetchJioSaavnApi({
    __call: 'lyrics.getLyrics',
    lyrics_id: songId,
    _format: 'json',
    _marker: '0',
    api_version: '4',
    ctx: 'web'
  });

  if (data && data.lyrics) {
    return sanitizeText(data.lyrics).replace(/<br\s*\/?>/gi, '\n');
  }

  return null;
}

/**
 * Get curated trending song categories for instant discovery
 */
export const TRENDING_CATEGORIES = [
  { name: '💖 KK Best Romantic Songs', query: 'KK Romantic Songs' },
  { name: '✨ KK Hits & Classics', query: 'KK Best Love Songs' },
  { name: '🎧 KK Lofi & Acoustic', query: 'KK Lofi Romantic Songs' },
  { name: '🌹 KK 2000s Romance', query: 'KK Hits 2000s Romance' },
  { name: '💑 KK Romantic Duets', query: 'KK Romantic Duets' },
  { name: '🌙 KK Midnight Melodies', query: 'KK Soulful Love Songs' },
  { name: '✨ Arijit Singh Romantic', query: 'Arijit Singh Romantic Hits' },
  { name: '🎸 Acoustic Love Hits', query: 'Unplugged Hindi Love Songs' },
];
