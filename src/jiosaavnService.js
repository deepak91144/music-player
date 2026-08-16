import CryptoJS from 'crypto-js';

const DES_KEY = '38346591';

export const LOCAL_TRACKS = [
  {
    id: 'local_1',
    title: 'Zara Sa',
    artist: 'KK, Pritam',
    album: 'Jannat',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Zara Sa Jannat 320 Kbps.mp3',
    year: '2008'
  },
  {
    id: 'local_2',
    title: 'Dil Ibaadat',
    artist: 'KK, Pritam',
    album: 'Tum Mile',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Dil Ibaadat Tum Mile 320 Kbps.mp3',
    year: '2009'
  },
  {
    id: 'local_3',
    title: 'Labon Ko',
    artist: 'KK, Pritam',
    album: 'Bhool Bhulaiyaa',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Labon Ko Bhool Bhulaiyaa 320 Kbps.mp3',
    year: '2007'
  },
  {
    id: 'local_4',
    title: 'Beete Lamhein',
    artist: 'KK, Mithoon',
    album: 'The Train',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Beete Lamhein The Train 320 Kbps.mp3',
    year: '2007'
  },
  {
    id: 'local_5',
    title: 'Haan Tu Hain',
    artist: 'KK, Pritam',
    album: 'Jannat',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Haan Tu Hain Jannat 320 Kbps.mp3',
    year: '2008'
  },
  {
    id: 'local_6',
    title: 'Khuda Jaane',
    artist: 'KK, Shilpa Rao, Vishal-Shekhar',
    album: 'Bachna Ae Haseeno',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Khuda Jaane Bachna Ae Haseeno 320 Kbps.mp3',
    year: '2008'
  },
  {
    id: 'local_7',
    title: 'Aankhon Mein Teri',
    artist: 'KK, Vishal-Shekhar',
    album: 'Om Shanti Om',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Aankhon Mein Teri Om Shanti Om 320 Kbps.mp3',
    year: '2007'
  },
  {
    id: 'local_8',
    title: 'Tu Hi Meri Shab Hai',
    artist: 'KK, Pritam',
    album: 'Gangster',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Tu Hi Meri Shab Hai Gangster 320 Kbps.mp3',
    year: '2006'
  },
  {
    id: 'local_9',
    title: 'Kya Mujhe Pyar Hai',
    artist: 'KK, Pritam',
    album: 'Woh Lamhe',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Kya Mujhe Pyar Hai Woh Lamhe 320 Kbps.mp3',
    year: '2006'
  },
  {
    id: 'local_10',
    title: 'Sajde',
    artist: 'KK, Sunidhi Chauhan, Pritam',
    album: 'Khatta Meetha',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Sajde Khatta Meetha 320 Kbps.mp3',
    year: '2010'
  },
  {
    id: 'local_11',
    title: 'O Meri Jaan',
    artist: 'KK, Pritam',
    album: 'Life In A Metro',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/O Meri Jaan Life In A Metro 320 Kbps.mp3',
    year: '2007'
  },
  {
    id: 'local_12',
    title: 'Alvida',
    artist: 'KK, Pritam',
    album: 'Life In A Metro',
    genre: 'Bollywood Rock',
    cover: '/album_midnight.png',
    src: '/audio/Alvida Life In A Metro 320 Kbps.mp3',
    year: '2007'
  },
  {
    id: 'local_13',
    title: 'Tujhe Sochta Hoon',
    artist: 'KK, Pritam',
    album: 'Jannat 2',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Tujhe Sochta Hoon Jannat 2 320 Kbps.mp3',
    year: '2012'
  },
  {
    id: 'local_14',
    title: 'Piya Aaye Na',
    artist: 'KK, Tulsi Kumar, Jeet Gannguli',
    album: 'Aashiqui 2',
    genre: 'Bollywood Sad Romance',
    cover: '/album_midnight.png',
    src: '/audio/Piya Aaye Na Aashiqui 2 320 Kbps.mp3',
    year: '2013'
  },
  {
    id: 'local_15',
    title: 'Dil Kyun Yeh Mera',
    artist: 'KK, Rajesh Roshan',
    album: 'Kites',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Dil Kyun Yeh Mera Kites 320 Kbps.mp3',
    year: '2010'
  },
  {
    id: 'local_16',
    title: 'Zindagi Do Pal Ki',
    artist: 'KK, Rajesh Roshan',
    album: 'Kites',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Zindagi Do Pal Ki Kites 320 Kbps.mp3',
    year: '2010'
  },
  {
    id: 'local_17',
    title: 'Make Some Noise For The Desi Boyz',
    artist: 'KK, Bob, Pritam',
    album: 'Desi Boyz',
    genre: 'Bollywood Dance',
    cover: '/album_midnight.png',
    src: '/audio/Make Some Noise For The Desi Boyz Desi Boyz 320 Kbps.mp3',
    year: '2011'
  },
  {
    id: 'local_18',
    title: 'Mat Aazma Re',
    artist: 'KK, Pritam',
    album: 'Murder 3',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Mat Aazma Re Murder 3 320 Kbps.mp3',
    year: '2013'
  },
  {
    id: 'local_19',
    title: 'Abhi Abhi',
    artist: 'KK, Shreya Ghoshal',
    album: 'Jism 2',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Abhi Abhi Jism 2 320 Kbps.mp3',
    year: '2012'
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
 * Decrypts JioSaavn encrypted_media_url into a streamable high quality 320kbps audio URL
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

    // Convert http to https to prevent Mixed Content errors
    url = url.replace('http://', 'https://');

    // Upgrade quality to 320kbps if available
    if (url.includes('_96.mp4')) {
      url = url.replace('_96.mp4', '_320.mp4');
    } else if (url.includes('_160.mp4')) {
      url = url.replace('_160.mp4', '_320.mp4');
    } else if (url.includes('_96.mp3')) {
      url = url.replace('_96.mp3', '_320.mp3');
    } else if (url.includes('_160.mp3')) {
      url = url.replace('_160.mp3', '_320.mp3');
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
 * Upgrades image URL to high resolution 500x500
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
 * Formats iTunes item into standardized Track object
 */
export function formatItunesTrack(item) {
  if (!item || !item.previewUrl) return null;

  const coverUrl = item.artworkUrl100
    ? item.artworkUrl100.replace('100x100bb', '600x600bb')
    : '/album_midnight.png';

  const year = item.releaseDate ? item.releaseDate.substring(0, 4) : '';
  const durationSec = item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 180;

  return {
    id: `itunes_${item.trackId}`,
    title: sanitizeText(item.trackName),
    artist: sanitizeText(item.artistName),
    album: sanitizeText(item.collectionName || 'Single'),
    genre: item.primaryGenreName || 'Bollywood',
    cover: coverUrl,
    src: item.previewUrl,
    duration: durationSec,
    year: year,
    language: 'Hindi',
    hasLyrics: false,
    isOnline: true,
    raw: item
  };
}

/**
 * Formats raw JioSaavn song object into standardized Track object
 */
export function formatJioSaavnTrack(rawSong) {
  if (!rawSong) return null;

  const moreInfo = rawSong.more_info || {};

  // Extract primary artists
  let artistName = 'Unknown Artist';
  if (moreInfo.artistMap && moreInfo.artistMap.primary_artists && moreInfo.artistMap.primary_artists.length > 0) {
    artistName = moreInfo.artistMap.primary_artists.map(a => sanitizeText(a.name)).join(', ');
  } else if (rawSong.primaryArtists) {
    if (typeof rawSong.primaryArtists === 'string') {
      artistName = sanitizeText(rawSong.primaryArtists);
    } else if (Array.isArray(rawSong.primaryArtists)) {
      artistName = rawSong.primaryArtists.map(a => sanitizeText(typeof a === 'string' ? a : a.name)).join(', ');
    }
  } else if (rawSong.primary_artists) {
    artistName = sanitizeText(rawSong.primary_artists);
  } else if (moreInfo.music) {
    artistName = sanitizeText(moreInfo.music);
  } else if (rawSong.singers) {
    artistName = sanitizeText(rawSong.singers);
  }

  // Extract media URL
  let mediaUrl = null;

  // 1. From downloadUrl array (Saavn API format)
  if (Array.isArray(rawSong.downloadUrl) && rawSong.downloadUrl.length > 0) {
    const high = rawSong.downloadUrl.find(d => d.quality === '320kbps') ||
                 rawSong.downloadUrl.find(d => d.quality === '160kbps') ||
                 rawSong.downloadUrl[rawSong.downloadUrl.length - 1];
    if (high && high.link) {
      mediaUrl = high.link.replace('http://', 'https://');
    }
  }

  // 2. From DES encrypted_media_url
  if (!mediaUrl) {
    const encryptedUrl = moreInfo.encrypted_media_url || rawSong.encrypted_media_url;
    if (encryptedUrl) {
      mediaUrl = decryptMediaUrl(encryptedUrl);
    }
  }

  // 3. From vlink / media_url
  if (!mediaUrl && (moreInfo.vlink || rawSong.vlink || rawSong.media_url)) {
    mediaUrl = (moreInfo.vlink || rawSong.vlink || rawSong.media_url).replace('http://', 'https://');
  }

  // Ensure valid mediaUrl exists
  if (!mediaUrl) {
    return null;
  }

  const titleStr = rawSong.title || rawSong.name || 'Music Track';
  const albumStr = moreInfo.album || (typeof rawSong.album === 'object' ? rawSong.album?.name : rawSong.album) || 'JioSaavn Single';
  const durationSec = parseInt(moreInfo.duration || rawSong.duration || 0, 10);

  return {
    id: rawSong.id || `saavn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title: sanitizeText(titleStr),
    artist: artistName,
    album: sanitizeText(albumStr),
    genre: rawSong.language ? (rawSong.language.charAt(0).toUpperCase() + rawSong.language.slice(1)) : 'Bollywood',
    cover: getHighResImage(rawSong.image),
    src: mediaUrl,
    duration: durationSec,
    year: rawSong.year || moreInfo.year || '',
    language: rawSong.language || 'Hindi',
    hasLyrics: moreInfo.has_lyrics === 'true' || rawSong.has_lyrics === 'true' || rawSong.hasLyrics === true,
    isJioSaavn: true,
    raw: rawSong
  };
}

/**
 * Base fetcher querying official JioSaavn api.php with CORS proxy fallback
 */
async function fetchJioSaavnApi(params) {
  const queryStr = new URLSearchParams(params).toString();
  const query = params.q || params.query || '';

  const parseJsonSafe = (raw) => {
    if (!raw) return null;
    if (typeof raw === 'object') return raw;
    try {
      const trimmed = String(raw).trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        return JSON.parse(trimmed);
      }
    } catch (_) {}
    return null;
  };

  // Try 1: Local Vite / Production Proxy (/saavn-api/api.php)
  try {
    const res = await fetch(`/saavn-api/api.php?${queryStr}`);
    if (res.ok) {
      const text = await res.text();
      const data = parseJsonSafe(text);
      if (data && (data.results || data.songs)) return data;
    }
  } catch (_) {}

  // Try 2: Official JioSaavn via AllOrigins GET Wrapper (returns fresh 200 OK DES streams)
  try {
    const targetUrl = `https://www.jiosaavn.com/api.php?${queryStr}`;
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
    if (res.ok) {
      const wrapper = await res.json();
      if (wrapper && wrapper.contents) {
        const data = parseJsonSafe(wrapper.contents);
        if (data && (data.results || data.songs || data.topquery || Array.isArray(data))) {
          return data;
        }
      }
    }
  } catch (_) {}

  // Try 3: Direct Call
  try {
    const targetUrl = `https://www.jiosaavn.com/api.php?${queryStr}`;
    const res = await fetch(targetUrl);
    if (res.ok) {
      const text = await res.text();
      const data = parseJsonSafe(text);
      if (data && (data.results || data.songs)) return data;
    }
  } catch (_) {}

  // Try 4: Dedicated Public Saavn API Engine fallback
  if (query) {
    try {
      const res = await fetch(`https://jiosaavn-api-beta.vercel.app/search/songs?query=${encodeURIComponent(query)}&limit=25`);
      if (res.ok) {
        const json = await res.json();
        const results = json.data?.results || json.results || [];
        if (results.length > 0) {
          return { results };
        }
      }
    } catch (_) {}
  }

  return null;
}

/**
 * Search songs across JioSaavn (Full Length), iTunes, and Local Tracks
 */
export async function searchSongs(query, page = 1, limit = 25) {
  if (!query || !query.trim()) return LOCAL_TRACKS;

  const q = query.trim();

  // STEP 1: Query JioSaavn API for FULL-LENGTH 320kbps HD Audio Streams (4-6 minutes!)
  const saavnData = await fetchJioSaavnApi({
    __call: 'search.getResults',
    q: q,
    n: limit,
    p: page,
    _format: 'json',
    _marker: '0',
    api_version: '4',
    ctx: 'web'
  });

  if (saavnData && Array.isArray(saavnData.results) && saavnData.results.length > 0) {
    const saavnTracks = saavnData.results
      .map(formatJioSaavnTrack)
      .filter(t => t !== null && t.src);

    if (saavnTracks.length > 0) {
      return saavnTracks;
    }
  }

  // STEP 2: iTunes India API fallback
  const itunesResults = await searchItunesApi(q, limit);
  if (itunesResults.length > 0) {
    return itunesResults;
  }

  // STEP 3: Fallback to searching local tracks
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
 * Primary iTunes India Music Search
 */
async function searchItunesApi(query, limit = 25) {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=in&media=music&entity=song&limit=${limit}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.results) && data.results.length > 0) {
        return data.results.map(formatItunesTrack).filter(t => t !== null && t.src);
      }
    }
  } catch (err) {
    console.warn('iTunes Music Search failed:', err);
  }
  return [];
}

/**
 * Autocomplete search for live search bar suggestions
 */
export async function autocompleteSearch(query) {
  if (!query || !query.trim()) return null;

  const q = query.trim();

  const saavnData = await fetchJioSaavnApi({
    __call: 'autocomplete.get',
    query: q,
    _format: 'json',
    _marker: '0',
    ctx: 'web'
  });

  if (saavnData) return saavnData;

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
 * Get song details
 */
export async function getSongDetails(songId) {
  if (!songId) return null;

  if (songId.startsWith('itunes_')) {
    const rawId = songId.replace('itunes_', '');
    try {
      const res = await fetch(`https://itunes.apple.com/lookup?id=${rawId}&country=in`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results[0]) {
          return formatItunesTrack(data.results[0]);
        }
      }
    } catch (_) {}
  }

  const data = await fetchJioSaavnApi({
    __call: 'song.getDetails',
    pids: songId,
    _format: 'json',
    _marker: '0',
    api_version: '4',
    ctx: 'web'
  });

  if (data && data[songId]) {
    return formatJioSaavnTrack(data[songId]);
  }

  return LOCAL_TRACKS.find(t => t.id === songId) || LOCAL_TRACKS[0];
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
  { name: '🌹 Pritam Classic Love', query: 'Pritam Love Songs' },
  { name: '🎧 Diljit Dosanjh Hits', query: 'Diljit Dosanjh' },
  { name: '🔥 AR Rahman Classics', query: 'AR Rahman Tamil Hindi' },
  { name: '🎶 Shreya Ghoshal Melodies', query: 'Shreya Ghoshal Romantic' },
  { name: '🎸 Acoustic & Lofi Beats', query: 'Bollywood Lofi Acoustic' }
];
