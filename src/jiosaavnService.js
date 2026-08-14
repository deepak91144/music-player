import CryptoJS from 'crypto-js';

// Decryption key for JioSaavn encrypted_media_url (API Disabled as per request)
const DES_KEY = '38346591';

/**
 * LOCAL AUDIO TRACKS COLLECTION
 * 20 High-Quality Local Audio Tracks stored in public/audio/
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
 * Decrypts encrypted_media_url (Disabled - API muted)
 */
export function decryptMediaUrl(encryptedUrl) {
  /* API DISABLED - Using Local MP3 Audio Files */
  return null;
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
 * Upgrades image URL
 */
export function getHighResImage(imageUrl) {
  if (!imageUrl) return '/album_midnight.png';
  return imageUrl;
}

/**
 * Formats raw song object into Track object
 */
export function formatJioSaavnTrack(rawSong) {
  return rawSong;
}

/**
 * Search local songs collection
 */
export async function searchSongs(query, page = 1, limit = 20) {
  if (!query || !query.trim()) return LOCAL_TRACKS;

  const q = query.toLowerCase().trim();

  // If searching for KK specifically, return KK songs
  if (q.includes('kk')) {
    return LOCAL_TRACKS.filter(t => t.artist.toLowerCase().includes('kk'));
  }

  const results = LOCAL_TRACKS.filter(t => 
    t.title.toLowerCase().includes(q) ||
    t.artist.toLowerCase().includes(q) ||
    t.album.toLowerCase().includes(q) ||
    t.genre.toLowerCase().includes(q)
  );

  return results.length > 0 ? results : LOCAL_TRACKS;
}

/**
 * Autocomplete search for local songs
 */
export async function autocompleteSearch(query) {
  if (!query || !query.trim()) return null;

  const q = query.toLowerCase().trim();
  const matches = LOCAL_TRACKS.filter(t => 
    t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
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
  return LOCAL_TRACKS.find(t => t.id === songId) || LOCAL_TRACKS[0];
}

/**
 * Get song lyrics
 */
export async function getLyrics(songId) {
  return null;
}

/**
 * Curated song categories
 */
export const TRENDING_CATEGORIES = [
  { name: '💖 KK Best Romantic Songs', query: 'KK' },
  { name: '✨ All Local Audio Tracks', query: 'All' },
  { name: '🌹 Classic Hindi Romance', query: 'Romance' },
  { name: '🎧 Lofi & Chill Beats', query: 'Lofi' },
];
