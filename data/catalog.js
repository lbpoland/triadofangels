/*
 * data/catalog.js
 * Purpose: Provide a centralized, single source of truth for all metadata used across the Triad of Angels / ToA Studios website.
 * Dependencies:
 *   - Imports existing album definitions from ../js/data.js as a temporary data provider until all data is fully migrated.
 *   - Uses an internal `sanitizeSlug()` helper to generate track slugs.
 * Edit guidance:
 *   - When adding or updating albums or tracks, prefer editing this file rather than scattering data across multiple pages or scripts.
 *   - Artists and videos arrays are currently placeholders; fill these out with actual bios, images, and platform links.
 *   - After completing migration, remove the import from ../js/data.js and define albums directly here.
 */

// Import existing album data from the legacy data module.
// This keeps existing album definitions intact while centralizing the data layer.
import { albums as legacyAlbums } from '../js/data.js';

/**
 * Helper to create URL-safe slugs from track titles.
 * Converts to lowercase, replaces non-alphanumeric characters with hyphens,
 * and trims leading/trailing hyphens.
 * @param {string} title - Original track title.
 * @returns {string} A slugified version of the title.
 */
function sanitizeSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Derive a flat array of track objects from the legacy album list.
 * Each track object contains its slug, original title, parent album ID,
 * track number (1-based), duration (if provided), release date, and YouTube ID (video).
 */
export const tracks = legacyAlbums.flatMap((album) =>
  album.tracks.map((title, index) => {
    const slug = sanitizeSlug(title);
    const trackData = album.lyrics && album.lyrics[slug] ? album.lyrics[slug] : {};
    return {
      slug,
      title,
      album: album.id,
      trackNo: index + 1,
      duration: trackData.duration || '',
      releaseDate: album.year,
      youtubeId: trackData.video || null,
      // Spread any additional fields from trackData.links if provided.
      links: trackData.links || album.links || {},
    };
  })
);

/**
 * Artists metadata.
 * Populate each artist with an id, name, biography, images, and platform links.
 * These entries act as canonical references for UI components and schema generation.
 */
export const artists = [
  {
    id: 'triad-of-angels',
    name: 'Triad of Angels',
    bio: 'Triad of Angels is a female trio blending cinematic pop, orchestral ballads, and modern spiritual music. They write, perform, and produce music with a message of hope, strength, and faith.',
    images: {
      profile: 'assets/images/artists/triad-of-angels.webp',
    },
    links: {
      website: 'https://www.triadofangels.com',
      youtube: 'https://www.youtube.com/@triadofangels',
      instagram: 'https://www.instagram.com/triadofangels/',
      facebook: 'https://www.facebook.com/triadofangels',
      twitter: 'https://x.com/triadofangels',
      tiktok: 'https://www.tiktok.com/@triadofangels',
      spotify: 'https://open.spotify.com/artist/6YtOCPtmM0bNoPw9rvmA3o?si=7704bcc4873047bc', // placeholder; replace with actual artist Spotify URL.
      appleMusic: 'https://music.apple.com/artist/triad-of-angels/0', // placeholder.
    },
  },
  {
    id: 'toa-studios',
    name: 'ToA Studios',
    bio: 'ToA Studios is the creative hub behind the Triad of Angels, producing music across all genres with innovative workflows and cutting-edge technologies.',
    images: {
      profile: 'assets/images/artists/toa-studios.webp',
    },
    links: {
      website: 'https://www.triadofangels.com',
      youtube: 'https://www.youtube.com/@toastudios', // placeholder; update with actual URL.
      instagram: 'https://www.instagram.com/triadofangels/', // reuse until specific account exists.
      facebook: 'https://www.facebook.com/triadofangels',
      twitter: 'https://x.com/triadofangels',
      tiktok: 'https://www.tiktok.com/@triadofangels',
      spotify: 'https://open.spotify.com/user/31yvfrj8r8mjsxopde3ja3mdesfu?si=77caba22ed8d4c61', // placeholder.
      appleMusic: 'https://music.apple.com/profile/triadofangels', // placeholder.
    },
  },
];

/**
 * Video metadata.
 * Each entry describes a YouTube-hosted video, with its ID, title, description, and category.
 * Populate this array as you release official music videos, lyric videos, or behind‑the‑scenes content.
 */
export const videos = [
  // Example:
  // {
  //   id: 'dQw4w9WgXcQ',
  //   title: 'Wings of Fire (Official Lyric Video)',
  //   description: 'Official lyric video for the track "Wings of Fire" by Triad of Angels.',
  //   category: 'Music',
  // },
];

/**
 * Albums metadata.
 * Export the legacy album list directly. When adding new albums or editing existing ones,
 * update this file rather than js/data.js.
 */
export const albums = legacyAlbums;

/*
 * End of data/catalog.js
 */
