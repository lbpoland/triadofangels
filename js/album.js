  // Import albums data and sanitizeTrackId
  import { albums } from './data.js';
  import { sanitizeTrackId } from './utils.js';

  // Function to populate the page with album data
  document.addEventListener('DOMContentLoaded', () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const albumId = urlParams.get('id');
      if (!albumId) throw new Error('No album ID provided in the URL.');

      const album = albums.find(a => a.id === albumId);
      if (!album) throw new Error(`Album with ID "${albumId}" not found.`);

      // Update Dynamic Meta Tags
      document.getElementById('dynamic-title').textContent = `${album.title} | Album Details | ${album.artist}`;
      document.getElementById('dynamic-description').setAttribute('content', `Explore ${album.title} by ${album.artist} - a ${album.genre} masterpiece released on ${album.year}. Stream now with tracks like ${album.tracks.join(', ') || 'TBA'}.`);
      document.getElementById('dynamic-og-title').setAttribute('content', `${album.title} | Album Details | ${album.artist}`);
      document.getElementById('dynamic-og-description').setAttribute('content', `Dive into ${album.title}, a ${album.genre} album by ${album.artist}, released ${album.year}. Discover tracks, streaming links, and more.`);
      document.getElementById('dynamic-og-image').setAttribute('content', album.cover);
      document.getElementById('dynamic-og-url').setAttribute('content', `https://www.triadofangels.com/album.html?id=${album.id}`);
      document.getElementById('dynamic-twitter-title').setAttribute('content', `${album.title} | Album Details | ${album.artist}`);
      document.getElementById('dynamic-twitter-description').setAttribute('content', `Check out ${album.title} by ${album.artist} - ${album.genre} with ${album.artistInfo.split('.')[0]}. Out now!`);
      document.getElementById('dynamic-canonical').setAttribute('href', `https://www.triadofangels.com/album.html?id=${album.id}`);

      // Update Album Background
      const backgroundImg = document.getElementById('album-background');
      backgroundImg.src = album.cover;
      backgroundImg.onerror = () => {
        console.error(`Failed to load background image: ${album.cover}`);
        backgroundImg.src = 'assets/images/placeholder-background.webp';
      };
      document.getElementById('album-title').textContent = album.title;
      document.getElementById('album-subtitle').textContent = `A ${album.genre} Masterpiece by ${album.artist}`;

      // Update Album Details
      const coverImg = document.getElementById('album-cover');
      coverImg.src = album.cover;
      coverImg.alt = `${album.title} album cover`;
      coverImg.onerror = () => {
        console.error(`Failed to load album cover image: ${album.cover}`);
        coverImg.src = 'assets/images/placeholder-album.webp';
      };
      document.getElementById('album-info-title').textContent = album.title;
      document.getElementById('album-artist').innerHTML = `<strong>Artist:</strong> ${album.artist}`;
      document.getElementById('album-tracks').innerHTML = `<strong>Tracks:</strong> ${
        album.tracks.length > 0 && album.tracks[0] !== ""
          ? album.tracks
              .map(
                (track) =>
                  `<a href="/track.html?id=${encodeURIComponent(sanitizeTrackId(track))}&album=${album.id}" aria-label="View details for ${track}">${track}</a>`
              )
              .join(', ')
          : 'Track list unavailable'
      }`;
      document.getElementById('album-genre').innerHTML = `<strong>Genre:</strong> ${album.genre}`;
      document.getElementById('album-year').innerHTML = `<strong>Release Date:</strong> ${album.year}`;
      document.getElementById('album-description').textContent = album.artistInfo || "No description available.";

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

      const validLinks = platforms.filter(platform => album.links[platform.key] && album.links[platform.key] !== '');
      if (validLinks.length > 0) {
        validLinks.forEach(platform => {
          const a = document.createElement('a');
          a.href = album.links[platform.key];
          a.target = '_blank';
          a.rel = 'noopener';
          a.className = 'link-tab';
          a.setAttribute('aria-label', `Stream on ${platform.name}`);
          a.textContent = platform.name;
          linkTabs.appendChild(a);
        });
      } else {
        linkTabs.innerHTML = '<p>No streaming links available for this album.</p>';
      }

      // Update Music Player Embed
      const musicPlayerEmbed = document.getElementById('music-player-embed');
      if (album.boomplayEmbed && album.boomplayEmbed !== '') {
        const iframe = document.createElement('iframe');
        iframe.src = album.boomplayEmbed;
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.frameBorder = '0';
        musicPlayerEmbed.appendChild(iframe);
      } else {
        musicPlayerEmbed.innerHTML = '<p>No music player available for this album.</p>';
      }

      // Add Schema.org JSON-LD
      const schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
      schemaScript.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": ["WebPage", "ItemPage"],
        "url": `https://www.triadofangels.com/album.html?id=${album.id}`,
        "name": `${album.title} | Album Details | ${album.artist}`,
        "description": `Explore ${album.title} by ${album.artist} - a ${album.genre} masterpiece released on ${album.year}. Stream now with tracks like ${album.tracks.join(', ') || 'TBA'}.`,
        "isPartOf": {
          "@type": "WebSite",
          "url": "https://www.triadofangels.com",
          "name": "Triad of Angels"
        },
        "datePublished": "2025-06-18",
        "lastReviewed": "2025-06-18",
        "inLanguage": "en-US",
        "potentialAction": {
          "@type": "ReadAction",
          "target": `https://www.triadofangels.com/album.html?id=${album.id}`
        },
        "mainEntity": {
          "@type": "MusicAlbum",
          "name": album.title,
          "byArtist": {
            "@type": "MusicGroup",
            "name": album.artist
          },
          "genre": album.genre,
          "datePublished": album.year,
          "url": `https://www.triadofangels.com/album.html?id=${album.id}`,
          "image": album.cover,
          "sameAs": Object.values(album.links).filter(link => link !== ''),
          "track": album.tracks.map(track => ({
            "@type": "MusicRecording",
            "name": track,
            "byArtist": {
              "@type": "MusicGroup",
              "name": album.artist
            },
            "inAlbum": {
              "@type": "MusicAlbum",
              "name": album.title,
              "url": `https://www.triadofangels.com/album.html?id=${album.id}`
            },
            "genre": album.genre,
            "url": `https://www.triadofangels.com/track.html?id=${encodeURIComponent(sanitizeTrackId(track))}&album=${album.id}`,
            "duration": "PT4M30S",
            "offers": {
              "@type": "Offer",
              "price": "1.29",
              "priceCurrency": "USD",
              "url": `https://www.triadofangels.com/store/${album.id}/${encodeURIComponent(sanitizeTrackId(track))}`,
              "availability": "https://schema.org/InStock"
            }
          })) || [],
          "offers": {
            "@type": "Offer",
            "price": "9.99",
            "priceCurrency": "USD",
            "url": `https://www.triadofangels.com/store/${album.id}`,
            "availability": "https://schema.org/InStock"
          }
        }
      }, null, 2);
      document.head.appendChild(schemaScript);

      const breadcrumbScript = document.createElement('script');
      breadcrumbScript.type = 'application/ld+json';
      breadcrumbScript.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://www.triadofangels.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Music",
            "item": "https://www.triadofangels.com/music.html"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": album.title,
            "item": `https://www.triadofangels.com/album.html?id=${album.id}`
          }
        ]
      }, null, 2);
      document.head.appendChild(breadcrumbScript);

    } catch (error) {
      console.error('Error loading album data:', error.message);
      displayError(
        "Error Loading Album",
        `We couldn’t load this album. Please try again later or <a href='music.html'>go back to the Music page</a>. Error: ${error.message}`
      );
    }

    function displayError(title, subtitle) {
      document.getElementById('album-title').innerHTML = title;
      document.getElementById('album-subtitle').innerHTML = subtitle;
      document.getElementById('album-background').style.display = 'none';
      document.querySelector('.album-details').style.display = 'none';
      document.querySelector('.streaming-links').style.display = 'none';
      document.querySelector('.music-player').style.display = 'none';
      const main = document.querySelector('.album-main');
      const errorContainer = document.createElement('section');
      errorContainer.className = 'error-section';
      errorContainer.innerHTML = `<h2>${title}</h2><p>${subtitle}</p>`;
      main.innerHTML = '';
      main.appendChild(errorContainer);
    }
  });