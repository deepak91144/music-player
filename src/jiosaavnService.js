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
    year: '2008',
    duration: 308
  },
  {
    id: 'local_2',
    title: 'Dil Ibaadat',
    artist: 'KK, Pritam',
    album: 'Tum Mile',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Dil Ibaadat Tum Mile 320 Kbps.mp3',
    year: '2009',
    duration: 329
  },
  {
    id: 'local_3',
    title: 'Labon Ko',
    artist: 'KK, Pritam',
    album: 'Bhool Bhulaiyaa',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Labon Ko Bhool Bhulaiyaa 320 Kbps.mp3',
    year: '2007',
    duration: 345
  },
  {
    id: 'local_4',
    title: 'Beete Lamhein',
    artist: 'KK, Mithoon',
    album: 'The Train',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Beete Lamhein The Train 320 Kbps.mp3',
    year: '2007',
    duration: 312
  },
  {
    id: 'local_5',
    title: 'Haan Tu Hain',
    artist: 'KK, Pritam',
    album: 'Jannat',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Haan Tu Hain Jannat 320 Kbps.mp3',
    year: '2008',
    duration: 325
  },
  {
    id: 'local_6',
    title: 'Khuda Jaane',
    artist: 'KK, Shilpa Rao, Vishal-Shekhar',
    album: 'Bachna Ae Haseeno',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Khuda Jaane Bachna Ae Haseeno 320 Kbps.mp3',
    year: '2008',
    duration: 333
  },
  {
    id: 'local_7',
    title: 'Aankhon Mein Teri',
    artist: 'KK, Vishal-Shekhar',
    album: 'Om Shanti Om',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Aankhon Mein Teri Om Shanti Om 320 Kbps.mp3',
    year: '2007',
    duration: 278
  },
  {
    id: 'local_8',
    title: 'Tu Hi Meri Shab Hai',
    artist: 'KK, Pritam',
    album: 'Gangster',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Tu Hi Meri Shab Hai Gangster 320 Kbps.mp3',
    year: '2006',
    duration: 388
  },
  {
    id: 'local_9',
    title: 'Kya Mujhe Pyar Hai',
    artist: 'KK, Pritam',
    album: 'Woh Lamhe',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Kya Mujhe Pyar Hai Woh Lamhe 320 Kbps.mp3',
    year: '2006',
    duration: 268
  },
  {
    id: 'local_10',
    title: 'Sajde',
    artist: 'KK, Sunidhi Chauhan, Pritam',
    album: 'Khatta Meetha',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Sajde Khatta Meetha 320 Kbps.mp3',
    year: '2010',
    duration: 305
  },
  {
    id: 'local_11',
    title: 'O Meri Jaan',
    artist: 'KK, Pritam',
    album: 'Life In A Metro',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/O Meri Jaan Life In A Metro 320 Kbps.mp3',
    year: '2007',
    duration: 298
  },
  {
    id: 'local_12',
    title: 'Alvida',
    artist: 'KK, Pritam',
    album: 'Life In A Metro',
    genre: 'Bollywood Rock',
    cover: '/album_midnight.png',
    src: '/audio/Alvida Life In A Metro 320 Kbps.mp3',
    year: '2007',
    duration: 342
  },
  {
    id: 'local_13',
    title: 'Tujhe Sochta Hoon',
    artist: 'KK, Pritam',
    album: 'Jannat 2',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Tujhe Sochta Hoon Jannat 2 320 Kbps.mp3',
    year: '2012',
    duration: 315
  },
  {
    id: 'local_14',
    title: 'Piya Aaye Na',
    artist: 'KK, Tulsi Kumar, Jeet Gannguli',
    album: 'Aashiqui 2',
    genre: 'Bollywood Sad Romance',
    cover: '/album_midnight.png',
    src: '/audio/Piya Aaye Na Aashiqui 2 320 Kbps.mp3',
    year: '2013',
    duration: 286
  },
  {
    id: 'local_15',
    title: 'Dil Kyun Yeh Mera',
    artist: 'KK, Rajesh Roshan',
    album: 'Kites',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Dil Kyun Yeh Mera Kites 320 Kbps.mp3',
    year: '2010',
    duration: 334
  },
  {
    id: 'local_16',
    title: 'Zindagi Do Pal Ki',
    artist: 'KK, Rajesh Roshan',
    album: 'Kites',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Zindagi Do Pal Ki Kites 320 Kbps.mp3',
    year: '2010',
    duration: 295
  },
  {
    id: 'local_17',
    title: 'Make Some Noise For The Desi Boyz',
    artist: 'KK, Bob, Pritam',
    album: 'Desi Boyz',
    genre: 'Bollywood Dance',
    cover: '/album_midnight.png',
    src: '/audio/Make Some Noise For The Desi Boyz Desi Boyz 320 Kbps.mp3',
    year: '2011',
    duration: 245
  },
  {
    id: 'local_18',
    title: 'Mat Aazma Re',
    artist: 'KK, Pritam',
    album: 'Murder 3',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Mat Aazma Re Murder 3 320 Kbps.mp3',
    year: '2013',
    duration: 260
  },
  {
    id: 'local_19',
    title: 'Abhi Abhi',
    artist: 'KK, Shreya Ghoshal',
    album: 'Jism 2',
    genre: 'Bollywood Romance',
    cover: '/album_midnight.png',
    src: '/audio/Abhi Abhi Jism 2 320 Kbps.mp3',
    year: '2012',
    duration: 342
  },
  {
    id: 'local_20',
    title: 'Yun Hi Re',
    artist: 'Anirudh Ravichander',
    album: 'David',
    genre: 'Bollywood',
    cover: '/album_midnight.png',
    src: '/audio/Yun Hi Re David 320 Kbps.mp3',
    year: '2013',
    duration: 280
  }
];

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

export function getHighResImage(imageUrl) {
  if (!imageUrl) return '/album_midnight.png';
  if (Array.isArray(imageUrl)) {
    const high = imageUrl.find(i => i.quality === '500x500') || imageUrl[imageUrl.length - 1];
    return high ? high.link.replace('http://', 'https://') : '/album_midnight.png';
  }
  return imageUrl
    .replace('150x150', '500x500')
    .replace('50x50', '500x500')
    .replace('100x100bb', '600x600bb')
    .replace('http://', 'https://');
}

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
    url = url.replace('http://', 'https://');
    if (url.includes('_96.mp4')) url = url.replace('_96.mp4', '_320.mp4');
    else if (url.includes('_160.mp4')) url = url.replace('_160.mp4', '_320.mp4');
    else if (url.includes('_96.mp3')) url = url.replace('_96.mp3', '_320.mp3');
    else if (url.includes('_160.mp3')) url = url.replace('_160.mp3', '_320.mp3');
    return url;
  } catch (err) {
    return null;
  }
}

export function formatJioSaavnTrack(rawSong) {
  if (!rawSong) return null;

  const moreInfo = rawSong.more_info || {};

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

  let mediaUrl = null;
  const encryptedUrl = moreInfo.encrypted_media_url || rawSong.encrypted_media_url;
  if (encryptedUrl) {
    mediaUrl = decryptMediaUrl(encryptedUrl);
  }
  if (!mediaUrl && (moreInfo.vlink || rawSong.vlink)) {
    mediaUrl = (moreInfo.vlink || rawSong.vlink).replace('http://', 'https://');
  }

  const titleStr = rawSong.title || rawSong.name || '';
  const titleLower = titleStr.toLowerCase();

  const localMatch = LOCAL_TRACKS.find(t => 
    titleLower.includes(t.title.toLowerCase()) || t.title.toLowerCase().includes(titleLower)
  );

  if (!mediaUrl && localMatch) {
    mediaUrl = localMatch.src;
  }

  if (!mediaUrl) return null;

  const durationSec = parseInt(moreInfo.duration || rawSong.duration || (localMatch ? localMatch.duration : 240), 10);

  return {
    id: rawSong.id || `saavn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title: sanitizeText(titleStr),
    artist: artistName,
    album: sanitizeText(moreInfo.album || rawSong.album?.name || rawSong.album || 'Single'),
    genre: rawSong.language ? (rawSong.language.charAt(0).toUpperCase() + rawSong.language.slice(1)) : 'Bollywood',
    cover: getHighResImage(rawSong.image),
    src: localMatch ? localMatch.src : mediaUrl,
    duration: localMatch ? localMatch.duration : durationSec,
    year: rawSong.year || moreInfo.year || '',
    language: rawSong.language || 'Hindi',
    hasLyrics: moreInfo.has_lyrics === 'true' || rawSong.has_lyrics === 'true' || rawSong.hasLyrics === true,
    isOnline: true,
    raw: rawSong
  };
}

export function formatItunesTrack(item) {
  if (!item || !item.previewUrl) return null;

  const title = sanitizeText(item.trackName || item.collectionName);
  const artist = sanitizeText(item.artistName);
  const titleLower = title.toLowerCase();

  const localMatch = LOCAL_TRACKS.find(t => 
    titleLower.includes(t.title.toLowerCase()) || t.title.toLowerCase().includes(titleLower)
  );

  const coverUrl = item.artworkUrl100
    ? item.artworkUrl100.replace('100x100bb', '600x600bb')
    : (localMatch ? localMatch.cover : '/album_midnight.png');

  return {
    id: `itunes_${item.trackId}`,
    title: title,
    artist: artist,
    album: sanitizeText(item.collectionName || 'Single'),
    genre: item.primaryGenreName || 'Bollywood',
    cover: coverUrl,
    src: localMatch ? localMatch.src : item.previewUrl,
    duration: localMatch ? localMatch.duration : Math.round((item.trackTimeMillis || 240000) / 1000),
    year: item.releaseDate ? item.releaseDate.substring(0, 4) : '2023',
    language: 'Hindi',
    hasLyrics: false,
    isOnline: true,
    raw: item
  };
}

/**
 * Universal Free Music Search Engine
 * Guaranteed to return search results for ANY query in the world (100% CORS-unrestricted on Render.com & all domains)
 */
export async function searchSongs(query, page = 1, limit = 25) {
  if (!query || !query.trim()) return LOCAL_TRACKS;

  const q = query.trim();

  // STEP 1: iTunes Search Engine (Instant response, 100% CORS-free on Render.com, HD 600x600 artwork)
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&country=in&media=music&entity=song&limit=${limit}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.results) && data.results.length > 0) {
        const formatted = data.results.map(formatItunesTrack).filter(t => t !== null && t.src);
        if (formatted.length > 0) {
          return formatted;
        }
      }
    }
  } catch (err) {
    console.warn('iTunes search error:', err);
  }

  // STEP 2: Invidious Open Source Audio Search Engine (Full 3 to 6 minute songs)
  try {
    const invidiousInstances = [
      'https://invidious.flokinet.to',
      'https://inv.nadeko.net'
    ];

    for (const inst of invidiousInstances) {
      try {
        const searchRes = await fetch(`${inst}/api/v1/search?q=${encodeURIComponent(q + ' song')}&type=video`);
        if (searchRes.ok) {
          const items = await searchRes.json();
          if (Array.isArray(items) && items.length > 0) {
            const validTracks = items.slice(0, 10).map(item => ({
              id: `yt_${item.videoId}`,
              title: sanitizeText(item.title),
              artist: sanitizeText(item.author),
              album: 'Online Track',
              genre: 'Music',
              cover: item.videoThumbnails?.[0]?.url || '/album_midnight.png',
              src: `${inst}/latest_version?id=${item.videoId}&itag=140`,
              duration: item.lengthSeconds || 240,
              year: '2023',
              language: 'Hindi',
              hasLyrics: false,
              isOnline: true
            }));
            if (validTracks.length > 0) return validTracks;
          }
        }
      } catch (_) {}
    }
  } catch (_) {}

  // STEP 3: Local HD Library Search Fallback
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
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&country=in&media=music&entity=song&limit=5`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.results) && data.results.length > 0) {
        return {
          songs: {
            data: data.results.map(item => ({
              title: item.trackName,
              image: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : '/album_midnight.png',
              description: `${item.artistName} • ${item.collectionName || 'Single'}`
            }))
          }
        };
      }
    }
  } catch (_) {}

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

  return LOCAL_TRACKS.find(t => t.id === songId) || LOCAL_TRACKS[0];
}

export async function getLyrics(songId) {
  return null;
}

export const TRENDING_CATEGORIES = [
  { name: '💖 KK Best Romantic Songs', query: 'KK Romantic Songs' },
  { name: '✨ Arijit Singh Hits', query: 'Arijit Singh Best Songs' },
  { name: '🌹 Pritam Classic Love', query: 'Pritam Love Songs' },
  { name: '🎧 Diljit Dosanjh Hits', query: 'Diljit Dosanjh' },
  { name: '🔥 AR Rahman Classics', query: 'AR Rahman Tamil Hindi' },
  { name: '🎶 Shreya Ghoshal Melodies', query: 'Shreya Ghoshal Romantic' },
  { name: '🎸 Acoustic & Lofi Beats', query: 'Bollywood Lofi Acoustic' }
];
