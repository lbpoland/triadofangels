document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const trackId = urlParams.get("id");

  if (!trackId || !trackData[trackId]) {
    document.querySelector(".track-main").innerHTML = "<p>Track not found.</p>";
    return;
  }

  const track = trackData[trackId];

  // Inject Title + Description
  document.title = `${track.title} | ${track.artist} | Triad of Angels`;
  document.querySelector("#track-title").textContent = track.title;
  document.querySelector("#track-artist").textContent = track.artist;
  document.querySelector("meta[property='og:title']")?.setAttribute("content", `${track.title} | ${track.artist}`);
  document.querySelector("meta[property='og:description']")?.setAttribute("content", track.description || "Listen to music by Triad of Angels.");
  document.querySelector("meta[property='og:image']")?.setAttribute("content", track.cover);

  // Album cover
  const albumCover = document.querySelector(".album-cover img");
  if (albumCover) {
    albumCover.src = track.cover;
    albumCover.alt = `${track.title} album cover`;
  }

  // Track Info
  const trackInfo = document.querySelector(".track-info");
  if (trackInfo) {
    trackInfo.innerHTML = `
      <h2>${track.title}</h2>
      <p><strong>Artist:</strong> ${track.artist}</p>
      <p><strong>Album:</strong> ${track.album}</p>
      <p><strong>Genre:</strong> ${track.genre}</p>
      <p><strong>Release Date:</strong> ${track.releaseDate}</p>
      <div id="track-story">${track.story || ""}</div>
    `;
  }

  // Music Player
  const player = document.querySelector(".music-player iframe");
  if (player && track.youtubeId) {
    player.src = `https://www.youtube-nocookie.com/embed/${track.youtubeId}?autoplay=1&loop=1&playlist=${track.youtubeId}&modestbranding=1&showinfo=0&controls=1`;
    player.title = `${track.title} - YouTube Player`;
  }

  // Lyrics
  const lyrics = document.getElementById("track-lyrics");
  if (lyrics) lyrics.textContent = track.lyrics || "Lyrics not available.";

  // Streaming links
  const linksContainer = document.querySelector(".link-tabs");
  if (linksContainer && track.streamingLinks) {
    linksContainer.innerHTML = "";
    Object.entries(track.streamingLinks).forEach(([platform, url]) => {
      const link = document.createElement("a");
      link.className = "link-tab";
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = platform;
      linksContainer.appendChild(link);
    });
  }

  // Related Tracks
  const relatedList = document.getElementById("related-tracks-list");
  if (relatedList && track.related && track.related.length > 0) {
    relatedList.innerHTML = "";
    track.related.forEach(relatedId => {
      const relTrack = trackData[relatedId];
      if (relTrack) {
        const li = document.createElement("li");
        li.innerHTML = `<a href="track.html?id=${relatedId}">${relTrack.title}</a>`;
        relatedList.appendChild(li);
      }
    });
  }

  // Social Sharing Links
  const socialLinks = document.querySelector(".social-share-links");
  if (socialLinks) {
    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(`${track.title} by ${track.artist}`);
    socialLinks.innerHTML = `
      <a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank"><img src="/assets/icons/facebook-icon.webp" alt="Facebook"> Facebook</a>
      <a href="https://x.com/intent/tweet?url=${shareUrl}&text=${shareText}" target="_blank"><img src="/assets/icons/x-icon.webp" alt="X"> X</a>
      <a href="https://www.reddit.com/submit?url=${shareUrl}&title=${shareText}" target="_blank"><img src="/assets/icons/reddit-icon.webp" alt="Reddit"> Reddit</a>
    `;
  }
});

// ✅ TRACK DATA OBJECT
const trackData = {
  "firestorm": {
    title: "Firestorm",
    artist: "Triad of Angels",
    album: "American Firestorm Songs of Freedom",
    genre: "Country Rock",
    releaseDate: "2025-06-20",
    youtubeId: "abc12345678",
    cover: "/assets/images/albums/firestorm-cover.webp",
    lyrics: `Verse 1...\nChorus...\nVerse 2...`,
    story: "This track tells the story of resilience through chaos and rising through trials.",
    streamingLinks: {
      Spotify: "https://open.spotify.com/track/firestorm123",
      AppleMusic: "https://music.apple.com/track/firestorm123",
      YouTubeMusic: "https://music.youtube.com/watch?v=abc12345678"
    },
    related: ["ascend", "wings-of-fire"]
  },
  "ascend": {
    title: "Ascend",
    artist: "Triad of Angels",
    album: "Ascend",
    genre: "Cinematic Pop",
    releaseDate: "2025-01-15",
    youtubeId: "xyz987654321",
    cover: "/assets/images/albums/ascend-album.webp",
    lyrics: `Verse 1...\nChorus...\nBridge...`,
    story: "A journey of rising above darkness to light.",
    streamingLinks: {
      Spotify: "https://open.spotify.com/track/ascend",
      AppleMusic: "https://music.apple.com/track/ascend"
    },
    related: ["firestorm", "wings-of-fire"]
  }
  // ➕ Add more tracks here
};
