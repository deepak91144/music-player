import CryptoJS from 'crypto-js';

// Decryption key for JioSaavn encrypted_media_url
const DES_KEY = '38346591';

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
 * Decrypts encrypted_media_url into a streamable high quality 320kbps audio URL
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
 * Upgrades image URL to 500x500
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
 * Formats raw JioSaavn song object into standardized Track object
 */
export function formatJioSaavnTrack(rawSong) {
  if (!rawSong) return null;

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
  } else if (rawSong.primaryArtists) {
    artistName = sanitizeText(rawSong.primaryArtists);
  }

  // Decrypt media URL or get vlink preview
  let mediaUrl = null;
  const encryptedUrl = moreInfo.encrypted_media_url || rawSong.encrypted_media_url;
  if (encryptedUrl) {
    mediaUrl = decryptMediaUrl(encryptedUrl);
  }
  if (!mediaUrl && moreInfo.vlink) {
    mediaUrl = moreInfo.vlink;
  }
  if (!mediaUrl && rawSong.vlink) {
    mediaUrl = rawSong.vlink;
  }

  // Fallback to local track audio src matching title if stream is unavailable
  if (!mediaUrl) {
    const songTitleLower = (rawSong.title || rawSong.name || '').toLowerCase();
    const localMatch = LOCAL_TRACKS.find(t => songTitleLower.includes(t.title.toLowerCase()) || t.title.toLowerCase().includes(songTitleLower));
    mediaUrl = localMatch ? localMatch.src : LOCAL_TRACKS[0].src;
  }

  const durationSec = parseInt(moreInfo.duration || rawSong.duration || 0, 10);

  return {
    id: rawSong.id || `saavn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title: sanitizeText(rawSong.title || rawSong.name),
    artist: artistName,
    album: sanitizeText(moreInfo.album || rawSong.album?.name || rawSong.album || 'JioSaavn Single'),
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
  const targetUrl = `https://www.jiosaavn.com/api.php?${queryStr}`;

  // Try 1: Local Vite proxy (works during `npm run dev`)
  try {
    const res = await fetch(`/saavn-api/api.php?${queryStr}`);
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().startsWith('{')) {
        return JSON.parse(text);
      }
    }
  } catch (_) {}

  // Try 2: Direct call
  try {
    const res = await fetch(targetUrl);
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().startsWith('{')) {
        return JSON.parse(text);
      }
    }
  } catch (_) {}

  // Try 3: Public CORS proxies in order
  const corsProxies = [
    url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    url => `https://corsproxy.org/?${encodeURIComponent(url)}`,
    url => `https://api.cors.lol/?url=${encodeURIComponent(url)}`
  ];

  for (const getProxyUrl of corsProxies) {
    try {
      const proxyUrl = getProxyUrl(targetUrl);
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().startsWith('{')) {
          const data = JSON.parse(text);
          if (data && (data.results || data.songs || data.topquery || Array.isArray(data))) {
            return data;
          }
        }
      }
    } catch (_) {}
  }

  return null;
}

/**
 * Search songs on JioSaavn
 */
export async function searchSongs(query, page = 1, limit = 20) {
  if (!query || !query.trim()) return LOCAL_TRACKS;

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

  if (data && Array.isArray(data.results) && data.results.length > 0) {
    return data.results.map(formatJioSaavnTrack).filter(t => t !== null && t.src);
  }

  // Fallback to searching local tracks
  const qLower = query.toLowerCase().trim();
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

  const data = await fetchJioSaavnApi({
    __call: 'autocomplete.get',
    query: query.trim(),
    _format: 'json',
    _marker: '0',
    ctx: 'web'
  });

  if (data) return data;

  // Local autocomplete fallback
  const matches = LOCAL_TRACKS.filter(t => 
    t.title.toLowerCase().includes(query.toLowerCase()) || 
    t.artist.toLowerCase().includes(query.toLowerCase())
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
];


