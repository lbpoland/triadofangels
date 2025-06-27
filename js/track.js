  // Import albums data and sanitizeTrackId
  import { albums } from './data.js';
  import { sanitizeTrackId } from './utils.js';

  document.addEventListener('DOMContentLoaded', () => {
    try {
      // Extract track and album IDs from URL query parameters
      const urlParams = new URLSearchParams(window.location.search);
      let trackId = urlParams.get('id');
      const albumId = urlParams.get('album');
      if (!trackId || !albumId) throw new Error('Missing track or album ID in URL.');

      // Decode and sanitize trackId
      trackId = decodeURIComponent(trackId.trim()); // Decode URL-encoded characters
      const sanitizedTrackId = sanitizeTrackId(trackId);

      // Debug: Log raw and processed trackId
      console.log('Raw trackId from URL:', trackId);
      console.log('Sanitized trackId:', sanitizedTrackId);

      // Find the album
      const album = albums.find(a => a.id === albumId);
      if (!album) throw new Error(`Album with ID "${albumId}" not found.`);

      // Debug: Log available tracks
      console.log('Available tracks:', album.tracks.map(t => ({
        original: t,
        sanitized: sanitizeTrackId(t)
      })));

      // Find the track
      const track = album.tracks.find(t => sanitizeTrackId(t) === sanitizedTrackId);
      if (!track) throw new Error(`Track with ID "${trackId}" (sanitized: "${sanitizedTrackId}") not found in album "${album.title}".`);

      // Track-specific data
      const trackData = album.lyrics[sanitizedTrackId];
      if (!trackData) throw new Error(`Track data for ID "${sanitizedTrackId}" not found in lyrics.`);

      const duration = trackData.duration || '';
      const lyricsFile = trackData.file || null;
      const story = trackData.story || 'No song story available.';
      const videoEmbed = trackData.video || null;
      const behindTheScenes = trackData.behindTheScenes || 'No behind-the-scenes content available.';
      const musicPlayerId = trackData.musicPlayerId || null;
      const trackLinks = trackData.links || album.links;

      // Update Meta Tags for SEO
      document.getElementById('dynamic-title').textContent = `${track} | Lyrics & Details | ${album.artist}`;
      document.querySelector('meta[name="description"]').setAttribute('content', `Explore ${track} from ${album.title} by ${album.artist}, a ${album.genre} track. View lyrics, stream now, and discover more.`);
      document.querySelector('meta[name="keywords"]').setAttribute('content', `${track}, ${album.title}, ${album.artist}, lyrics, ${album.genre}, Triad of Angels, ToA Studios, music, country, ballad`);
      document.querySelector('meta[property="og:title"]').setAttribute('content', `${track} | Lyrics & Details | ${album.artist}`);
      document.querySelector('meta[property="og:description"]').setAttribute('content', `Discover ${track} from ${album.title} by ${album.artist}. View lyrics, stream the track, and explore more.`);
      document.querySelector('meta[property="og:image"]').setAttribute('content', album.cover);
      document.querySelector('meta[property="og:url"]').setAttribute('content', `https://www.triadofangels.com/track.html?id=${encodeURIComponent(sanitizedTrackId)}&album=${albumId}`);
      document.querySelector('meta[name="twitter:title"]').setAttribute('content', `${track} | Lyrics & Details | ${album.artist}`);
      document.querySelector('meta[name="twitter:description"]').setAttribute('content', `Check out ${track} from ${album.title} by ${album.artist}. Lyrics and streaming available now.`);
      document.querySelector('meta[name="twitter:image"]').setAttribute('content', album.cover);
      document.querySelector('link[rel="canonical"]').setAttribute('href', `https://www.triadofangels.com/track.html?id=${encodeURIComponent(sanitizedTrackId)}&album=${albumId}`);

      // Update Album Background and Cover
      const backgroundImg = document.getElementById('album-background');
      backgroundImg.src = album.cover;
      backgroundImg.alt = `${album.title} album cover background`;
      backgroundImg.onerror = () => {
        console.error(`Failed to load background image: ${album.cover}`);
        backgroundImg.src = '/assets/images/placeholder-background.webp';
      };
      const coverImg = document.getElementById('album-cover');
      coverImg.src = album.cover;
      coverImg.alt = `${album.title} album cover`;
      coverImg.onerror = () => {
        console.error(`Failed to load album cover: ${album.cover}`);
        coverImg.src = '/assets/images/placeholder-album.webp';
      };

      // Update Track Details
      document.getElementById('track-title').textContent = track;
      document.getElementById('track-subtitle').textContent = `From ${album.title} by ${album.artist}`;
      document.getElementById('track-info-title').textContent = track;
      document.getElementById('track-artist').innerHTML = `<strong>Artist:</strong> ${album.artist}`;
      document.getElementById('track-album').innerHTML = `<strong>Album:</strong> <a href="/album.html?id=${albumId}" aria-label="View ${album.title} album">${album.title}</a>`;
      document.getElementById('track-genre').innerHTML = `<strong>Genre:</strong> ${album.genre}`;
      document.getElementById('track-duration').innerHTML = `<strong>Duration:</strong> ${duration.replace('PT', '').replace('M', ':').replace('S', '')}`;
      document.getElementById('track-story').innerHTML = `<strong>Song Story:</strong> ${story}`;

      // Load and Update Lyrics from File
      const lyricsElement = document.getElementById('track-lyrics');
      if (lyricsFile) {
        fetch(lyricsFile)
          .then(response => {
            if (!response.ok) throw new Error(`Failed to load lyrics file: ${lyricsFile}`);
            return response.text();
          })
          .then(lyrics => {
            lyricsElement.innerHTML = lyrics;
          })
          .catch(error => {
            console.error('Error fetching lyrics:', error.message);
            lyricsElement.innerHTML = 'Lyrics unavailable. Please try again later.';
          });
      } else {
        lyricsElement.innerHTML = 'No lyrics available for this track.';
      }

      // Update Streaming Links
      const linkTabs = document.getElementById('link-tabs');
      const platforms = [
        { name: 'Spotify', key: 'spotify' },
        { name: 'Apple Music', key: 'appleMusic' },
        { name: 'Amazon Music', key: 'amazonMusic' },
        { name: 'Tidal', key: 'tidal' },
        { name: 'iHeartRadio', key: 'iHeartRadio' },
        { name: 'Boomplay', key: 'boomplay' },
        { name: 'Deezer', key: 'deezer' },
        { name: 'YouTube Music', key: 'youTubeMusic' },
        { name: 'iTunes', key: 'iTunes' }
      ];
      const validLinks = platforms.filter(p => trackLinks[p.key] && trackLinks[p.key] !== '');
      if (validLinks.length > 0) {
        validLinks.forEach(p => {
          const a = document.createElement('a');
          a.href = trackLinks[p.key];
          a.target = '_blank';
          a.rel = 'noopener';
          a.className = 'link-tab';
          a.setAttribute('aria-label', `Stream ${track} on ${p.name}`);
          a.textContent = p.name;
          linkTabs.appendChild(a);
        });
      } else {
        linkTabs.innerHTML = '<p>No streaming links available for this track.</p>';
      }

      // Update Music Video
      const musicVideoEmbed = document.getElementById('music-video-embed');
      if (videoEmbed) {
        const iframe = document.createElement('iframe');
        iframe.src = videoEmbed;
        iframe.width = '100%';
        iframe.height = '315';
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.setAttribute('aria-label', `Music video for ${track}`);
        musicVideoEmbed.appendChild(iframe);
      } else {
        musicVideoEmbed.innerHTML = '<p>No music video available for this track.</p>';
      }

      // Update Behind-the-Scenes
      document.getElementById('behind-the-scenes-content').innerHTML = behindTheScenes;

      // Update Related Tracks
      const relatedTracksList = document.getElementById('related-tracks-list');
      const otherTracks = album.tracks.filter(t => t !== track);
      if (otherTracks.length > 0) {
        otherTracks.forEach(t => {
          const li = document.createElement('li');
          li.innerHTML = `<a href="/track.html?id=${encodeURIComponent(sanitizeTrackId(t))}&album=${albumId}" aria-label="View ${t}">${t}</a>`;
          relatedTracksList.appendChild(li);
        });
      } else {
        relatedTracksList.innerHTML = '<p>No other tracks available for this album.</p>';
      }

      // Update Social Sharing Links
      const trackUrl = encodeURIComponent(`https://www.triadofangels.com/track.html?id=${sanitizedTrackId}&album=${albumId}`);
      const shareText = encodeURIComponent(`Check out ${track} from ${album.title} by ${album.artist} on Triad of Angels!`);
      const shareX = document.getElementById('share-x');
      const shareFacebook = document.getElementById('share-facebook');

      if (shareX) {
        shareX.href = `https://x.com/intent/tweet?url=${trackUrl}&text=${shareText}&via=triadofangels`;
        shareX.addEventListener('click', (e) => {
          e.preventDefault();
          window.open(shareX.href, 'shareWindow', 'width=550,height=420');
          console.log('X Share URL:', shareX.href);
          console.log('Intended Share:', {
            url: `https://www.triadofangels.com/track.html?id=${sanitizedTrackId}&album=${albumId}`,
            text: `Check out ${track} from ${album.title} by ${album.artist} on Triad of Angels!`,
            image: album.cover
          });
        });
      }
      if (shareFacebook) {
        shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${trackUrl}`;
        shareFacebook.addEventListener('click', (e) => {
          e.preventDefault();
          window.open(shareFacebook.href, 'shareWindow', 'width=600,height=400');
          console.log('Facebook Share URL:', shareFacebook.href);
          console.log('Intended Share:', {
            url: `https://www.triadofangels.com/track.html?id=${sanitizedTrackId}&album=${albumId}`,
            title: `${track} | Lyrics & Details | ${album.artist}`,
            description: `Discover ${track} from ${album.title} by ${album.artist}. View lyrics, stream the track, and explore more.`,
            image: album.cover
          });
        });
      }

      // Update Schema.org JSON-LD
      const schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
      schemaScript.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "MusicRecording",
        "name": track,
        "byArtist": {
          "@type": "MusicGroup",
          "name": album.artist
        },
        "inAlbum": {
          "@type": "MusicAlbum",
          "name": album.title,
          "url": `https://www.triadofangels.com/album.html?id=${albumId}`
        },
        "genre": album.genre,
        "url": `https://www.triadofangels.com/track.html?id=${encodeURIComponent(sanitizedTrackId)}&album=${albumId}`,
        "image": album.cover,
        "datePublished": album.year,
        "duration": duration,
        "description": `Listen to ${track} from ${album.title} by ${album.artist}, a ${album.genre} track. Explore lyrics, streaming links, and more.`,
        "sameAs": Object.values(trackLinks).filter(link => link !== ''),
        "offers": {
          "@type": "Offer",
          "price": "1.29",
          "priceCurrency": "USD",
          "url": `https://www.triadofangels.com/store/${albumId}/${encodeURIComponent(sanitizedTrackId)}`,
          "availability": "https://schema.org/InStock"
        }
      }, null, 2);
      document.head.appendChild(schemaScript);

      // Initialize Boomplay Player
      const musicPlayerEmbed = document.getElementById('yt-player');
      if (musicPlayerId && musicPlayerId !== '') {
        const iframe = document.createElement('iframe');
        iframe.src = musicPlayerId;
        iframe.width = '100%';
        iframe.height = '80';
        iframe.frameBorder = '0';
        musicPlayerEmbed.parentNode.replaceChild(iframe, musicPlayerEmbed);
      } else {
        document.querySelector('.to-a-player').innerHTML = '<p>No music player available for this track.</p>';
      }

    } catch (error) {
      console.error('Error loading track data:', error.message);
      document.getElementById('track-title').textContent = 'Error Loading Track';
      document.getElementById('track-subtitle').innerHTML = `We couldn’t load this track. Please try again later or <a href="/music.html" aria-label="Go to Music page">go back to the Music page</a>. Error: ${error.message}`;
      document.getElementById('album-background').style.display = 'none';
      document.querySelector('.track-details').style.display = 'none';
      document.querySelector('.to-a-player').style.display = 'none';
      document.querySelector('.track-lyrics').style.display = 'none';
      document.querySelector('.streaming-links').style.display = 'none';
      document.querySelector('.music-video').style.display = 'none';
      document.querySelector('.behind-the-scenes').style.display = 'none';
      document.querySelector('.related-tracks').style.display = 'none';
      document.querySelector('.social-share').style.display = 'none';
      const main = document.querySelector('.track-main');
      const errorContainer = document.createElement('section');
      errorContainer.className = 'error-section';
      errorContainer.innerHTML = `<h2>Error Loading Track</h2><p>We couldn’t load this track. Please try again later or <a href="/music.html" aria-label="Go to Music page">go back to the Music page</a>. Error: ${error.message}</p>`;
      main.innerHTML = '';
      main.appendChild(errorContainer);
    }
  });