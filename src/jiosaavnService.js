import CryptoJS from 'crypto-js';

// Decryption key for JioSaavn encrypted_media_url
const DES_KEY = '38346591';

// Hosted CORS-enabled JioSaavn API endpoints
const HOSTED_API_PRIMARY = 'https://jiosaavn-api-beta.vercel.app';
const HOSTED_API_SECONDARY = 'https://saavn.me';

/**
 * LOCAL AUDIO TRACKS COLLECTION
 * High-Quality Local Audio Tracks stored in public/audio/
 */
export const LOCAL_TRACKS = [
  {
    id: 'local_1',
    title: 'Zara Sa',
    artist: 'KK',
    album: 'Jannat',
    genre: 'Bollywood',
    cover: '/album_midnight.png',
    src: '/audio/Zara Sa Jannat 320 Kbps.mp3',
    year: '2008'
  },
  {
    id: 'local_2',
    title: 'Dil Ibaadat',
    artist: 'KK',
    album: 'Tum Mile',
    genre: 'Bollywood',
    cover: '/album_midnight.png',
    src: '/audio/Dil Ibaadat Tum Mile Original Motion Picturetrack 320 Kbps.mp3',
    year: '2009'
  },
  {
    id: 'local_3',
    title: 'Labon Ko',
    artist: 'KK',
    album: 'Bhool Bhulaiyaa',
    genre: 'Bollywood',
    cover: '/album_midnight.png',
    src: '/audio/Labon Ko Bhool Bhulaiyaa 320 Kbps.mp3',
    year: '2007'
  },
  {
    id: 'local_4',
    title: 'Tu Hi Meri Shab Hai',
    artist: 'KK',
    album: 'Gangster',
    genre: 'Bollywood',
    cover: '/album_midnight.png',
    src: '/audio/Tu Hi Meri Shab Hai Gangster 320 Kbps.mp3',
    year: '2006'
  },
  {
    id: 'local_5',
    title: 'Haan Tu Hain',
    artist: 'KK',
    album: 'Jannat',
    genre: 'Bollywood',
    cover: '/album_midnight.png',
    src: '/audio/Haan Tu Hain Jannat 320 Kbps.mp3',
    year: '2008'
  },
  {
    id: 'local_6',
    title: 'Ajab Si',
    artist: 'KK',
    album: 'Om Shanti Om',
    genre: 'Bollywood',
    cover: '/album_midnight.png',
    src: '/audio/Ajab Si Om Shanti Om 320 Kbps.mp3',
    year: '2007'
  },
  {
    id: 'local_7',
    title: 'I Am In Love',
    artist: 'KK & Dominique Cerejo',
    album: 'Once Upon A Time In Mumbaai',
    genre: 'Bollywood',
    cover: '/album_midnight.png',
    src: '/audio/I Am In Love Once Upon A Time In Mumbaai 320 Kbps.mp3',
    year: '2010'
  },
  {
    id: 'local_8',
    title: 'Mujhe De De Har Gham Tera',
    artist: 'KK',
    album: 'Haunted 3D',
    genre: 'Bollywood',
    cover: '/album_midnight.png',
    src: '/audio/Mujhe De De Har Gham Tera Haunted 320 Kbps.mp3',
    year: '2011'
  },
  {
    id: 'local_9',
    title: 'Soniye',
    artist: 'KK',
    album: 'Heartless',
    genre: 'Bollywood',
    cover: '/album_midnight.png',
    src: '/audio/Soniye Heartless 320 Kbps.mp3',
    year: '2014'
  },
  {
    id: 'local_10',
    title: 'Agar Tum Saath Ho',
    artist: 'Arijit Singh & Alka Yagnik',
    album: 'Tamasha',
    genre: 'Bollywood',
    cover: '/album_midnight.png',
    src: '/audio/Agar Tum Saath Ho Tamasha 320 Kbps.mp3',
    year: '2015'
  },
  {
    id: 'local_11',
    title: 'Bol Do Na Zara',
    artist: 'Armaan Malik',
    album: 'Azhar',
    genre: 'Bollywood',
    cover: '/album_midnight.png',
    src: '/audio/Bol Do Na Zara Azhar 320 Kbps.mp3',
    year: '2016'
  },
  {
    id: 'local_12',
    title: 'Hey Shona',
    artist: 'Shaan & Sunidhi Chauhan',
    album: 'Ta Ra Rum Pum',
    genre: 'Bollywood',
    cover: '/album_midnight.png',
    src: '/audio/Hey Shona Ta Ra Rum Pum 320 Kbps.mp3',
    year: '2007'
  },
  {
    id: 'local_13',
    title: 'Jab Tak',
    artist: 'Armaan Malik',
    album: 'M.S. Dhoni The Untold Story',
    genre: 'Bollywood',
    cover: '/album_midnight.png',
    src: '/audio/Jab Tak M.s. Dhoni The Untold Story 320 Kbps.mp3',
    year: '2016'
  },
  {
    id: 'local_14',
    title: 'Kaise Hua',
    artist: 'Vishal Mishra',
    album: 'Kabir Singh',
    genre: 'Bollywood',
    cover: '/album_midnight.png',
    src: '/audio/Kaise Hua Kabir Singh 320 Kbps.mp3',
    year: '2019'
  },
  {
    id: 'local_15',
    title: 'Kaun Tujhe',
    artist: 'Palak Muchhal',
    album: 'M.S. Dhoni The Untold Story',
    genre: 'Bollywood',
    cover: '/album_midnight.png',
    src: '/audio/Kaun Tujhe M.s. Dhoni The Untold Story 320 Kbps.mp3',
    year: '2016'
  },
  {
    id: 'local_16',
    title: 'Pehla Pyaar',
    artist: 'Armaan Malik',
    album: 'Kabir Singh',
    genre: 'Bollywood',
    cover: '/album_midnight.png',
    src: '/audio/Pehla Pyaar (PenduJatt.Com.Se).mp3',
    year: '2019'
  },
  {
    id: 'local_17',
    title: 'Tu Hi Haqeeqat',
    artist: 'Javed Ali',
    album: 'Tum Mile',
    genre: 'Bollywood',
    cover: '/album_midnight.png',
    src: '/audio/Tu Hi Haqeeqat Tum Mile Original Motion Picturetrack 320 Kbps.mp3',
    year: '2009'
  },
  {
    id: 'local_18',
    title: 'Tum Hi Ho',
    artist: 'Arijit Singh',
    album: 'Aashiqui 2',
    genre: 'Bollywood',
    cover: '/album_midnight.png',
    src: '/audio/Tum Hi Ho Aashiqui 2 320 Kbps.mp3',
    year: '2013'
  },
  {
    id: 'local_19',
    title: 'Tum Se Hi',
    artist: 'Mohit Chauhan',
    album: 'Jab We Met',
    genre: 'Bollywood',
    cover: '/album_midnight.png',
    src: '/audio/Tum Se Hi Jab We Met 320 Kbps (1).mp3',
    year: '2007'
  },
  {
    id: 'local_20',
    title: 'Yun Hi Re',
    artist: 'Anirudh Ravichander',
    album: 'David',
    genre: 'Bollywood',
    cover: '/album_midnight.png',
    src: '/audio/Yun Hi Re David 320 Kbps.mp3',
    year: '2013'
  }
];

/**
 * Decrypts encrypted_media_url to a streamable audio URL
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

    // Convert http to https to prevent Mixed Content errors on hosted sites
    url = url.replace('http://', 'https://');

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
 * Upgrades image URL to high resolution
 */
export function getHighResImage(imageUrl) {
  if (!imageUrl) return '/album_midnight.png';
  if (Array.isArray(imageUrl)) {
    const high = imageUrl.find(i => i.quality === '500x500') || imageUrl[imageUrl.length - 1];
    return high ? high.link.replace('http://', 'https://') : '/album_midnight.png';
  }
  return imageUrl
    .replace('150x150', '500x500')
    .replace('50x50', '500x500')
    .replace('http://', 'https://');
}

/**
 * Standardize track response from Hosted Saavn API or Official API
 */
export function formatJioSaavnTrack(song) {
  if (!song) return null;

  // Check if hosted API format (has downloadUrl or name property)
  if (song.downloadUrl || song.name) {
    let streamUrl = null;
    if (Array.isArray(song.downloadUrl) && song.downloadUrl.length > 0) {
      const high = song.downloadUrl.find(d => d.quality === '320kbps') ||
                   song.downloadUrl.find(d => d.quality === '160kbps') ||
                   song.downloadUrl[song.downloadUrl.length - 1];
      streamUrl = high ? high.link.replace('http://', 'https://') : null;
    }

    let coverUrl = getHighResImage(song.image);

    let artistName = song.primaryArtists || 
                     (song.artists?.primary?.map(a => a.name).join(', ')) || 
                     song.singers || 
                     'Unknown Artist';

    return {
      id: song.id || `saavn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: sanitizeText(song.name || song.title),
      artist: sanitizeText(artistName),
      album: sanitizeText(song.album?.name || song.album || 'JioSaavn Single'),
      genre: song.language ? (song.language.charAt(0).toUpperCase() + song.language.slice(1)) : 'Bollywood',
      cover: coverUrl,
      src: streamUrl,
      duration: parseInt(song.duration || 0, 10),
      year: song.year || '',
      language: song.language || 'Hindi',
      hasLyrics: song.hasLyrics === 'true' || song.hasLyrics === true || song.has_lyrics === 'true',
      isJioSaavn: true,
      raw: song
    };
  }

  // Official raw API response format
  const moreInfo = song.more_info || {};
  let artistName = 'Unknown Artist';
  if (moreInfo.artistMap && moreInfo.artistMap.primary_artists && moreInfo.artistMap.primary_artists.length > 0) {
    artistName = moreInfo.artistMap.primary_artists.map(a => sanitizeText(a.name)).join(', ');
  } else if (song.primary_artists) {
    artistName = sanitizeText(song.primary_artists);
  } else if (moreInfo.music) {
    artistName = sanitizeText(moreInfo.music);
  } else if (song.singers) {
    artistName = sanitizeText(song.singers);
  }

  let mediaUrl = null;
  if (moreInfo.encrypted_media_url) {
    mediaUrl = decryptMediaUrl(moreInfo.encrypted_media_url);
  } else if (song.encrypted_media_url) {
    mediaUrl = decryptMediaUrl(song.encrypted_media_url);
  } else if (moreInfo.vlink) {
    mediaUrl = moreInfo.vlink;
  }

  return {
    id: song.id || `saavn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title: sanitizeText(song.title),
    artist: artistName,
    album: sanitizeText(moreInfo.album || song.album || 'JioSaavn Single'),
    genre: song.language ? (song.language.charAt(0).toUpperCase() + song.language.slice(1)) : 'Bollywood',
    cover: getHighResImage(song.image),
    src: mediaUrl,
    duration: parseInt(moreInfo.duration || song.duration || 0, 10),
    year: song.year || moreInfo.year || '',
    language: song.language || 'Hindi',
    hasLyrics: moreInfo.has_lyrics === 'true' || song.has_lyrics === 'true',
    isJioSaavn: true,
    raw: song
  };
}

/**
 * Search songs across hosted CORS endpoints and fallbacks
 */
export async function searchSongs(query, page = 1, limit = 20) {
  if (!query || !query.trim()) return LOCAL_TRACKS;

  const q = query.trim();

  // Try 1: Primary CORS-enabled Hosted Saavn API
  try {
    const url = `${HOSTED_API_PRIMARY}/search/songs?query=${encodeURIComponent(q)}&page=${page}&limit=${limit}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const results = data.data?.results || data.results;
      if (Array.isArray(results) && results.length > 0) {
        return results.map(formatJioSaavnTrack).filter(t => t && t.src);
      }
    }
  } catch (err) {
    console.warn('Hosted Saavn API (Primary) failed, trying secondary fallback...', err);
  }

  // Try 2: Secondary CORS-enabled Hosted Saavn API
  try {
    const url = `${HOSTED_API_SECONDARY}/search/songs?query=${encodeURIComponent(q)}&page=${page}&limit=${limit}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const results = data.data?.results || data.results;
      if (Array.isArray(results) && results.length > 0) {
        return results.map(formatJioSaavnTrack).filter(t => t && t.src);
      }
    }
  } catch (err) {
    console.warn('Hosted Saavn API (Secondary) failed, trying local proxy...', err);
  }

  // Try 3: Local Vite Proxy (works in local dev mode)
  try {
    const queryParams = new URLSearchParams({
      __call: 'search.getResults',
      q: q,
      n: limit,
      p: page,
      _format: 'json',
      _marker: '0',
      api_version: '4',
      ctx: 'web'
    });
    const res = await fetch(`/saavn-api/api.php?${queryParams.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.results)) {
        return data.results.map(formatJioSaavnTrack).filter(t => t && t.src);
      }
    }
  } catch (_) {
    // Proxy not active (e.g. hosted static deployment)
  }

  // Fallback to searching local tracks
  const qLower = q.toLowerCase();
  const filteredLocal = LOCAL_TRACKS.filter(t => 
    t.title.toLowerCase().includes(qLower) ||
    t.artist.toLowerCase().includes(qLower) ||
    t.album.toLowerCase().includes(qLower) ||
    t.genre.toLowerCase().includes(qLower)
  );

  return filteredLocal.length > 0 ? filteredLocal : LOCAL_TRACKS;
}

/**
 * Autocomplete search for live search bar suggestions
 */
export async function autocompleteSearch(query) {
  if (!query || !query.trim()) return null;

  const q = query.trim();

  try {
    const res = await fetch(`${HOSTED_API_PRIMARY}/search/all?query=${encodeURIComponent(q)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        return {
          topquery: {
            data: json.data.topQuery?.results?.map(item => ({
              title: item.title,
              image: getHighResImage(item.image),
              type: item.type,
              description: item.description
            })) || []
          },
          songs: {
            data: json.data.songs?.results?.map(s => ({
              title: s.title,
              image: getHighResImage(s.image),
              description: s.description || s.singers || s.primaryArtists
            })) || []
          }
        };
      }
    }
  } catch (_) {
    // Hosted autocomplete failed
  }

  // Local autocomplete fallback
  const matches = LOCAL_TRACKS.filter(t => 
    t.title.toLowerCase().includes(q.toLowerCase()) || 
    t.artist.toLowerCase().includes(q.toLowerCase())
  );

  if (matches.length === 0) return null;

  return {
    songs: {
      data: matches.slice(0, 4).map(m => ({
        title: m.title,
        image: m.cover,
        description: `${m.artist} • ${m.album}`
      }))
    }
  };
}

/**
 * Get song details by ID
 */
export async function getSongDetails(songId) {
  if (!songId) return null;

  try {
    const res = await fetch(`${HOSTED_API_PRIMARY}/songs?id=${encodeURIComponent(songId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data[0]) {
        return formatJioSaavnTrack(json.data[0]);
      }
    }
  } catch (_) {}

  return LOCAL_TRACKS.find(t => t.id === songId) || LOCAL_TRACKS[0];
}

/**
 * Get song lyrics
 */
export async function getLyrics(songId) {
  if (!songId) return null;

  try {
    const res = await fetch(`${HOSTED_API_PRIMARY}/lyrics?id=${encodeURIComponent(songId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.lyrics) {
        return sanitizeText(json.data.lyrics).replace(/<br\s*\/?>/gi, '\n');
      }
    }
  } catch (_) {}

  return null;
}

/**
 * Curated song categories for instant discovery
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

