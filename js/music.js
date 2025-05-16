// music.js - Triad of Angels Music Page Interactivity
document.addEventListener('DOMContentLoaded', () => {
  console.log("Music script loaded at", new Date().toISOString());

  // Load album data
  let albumsData = {};
  fetch('data/albums.json')
    .then(response => response.json())
    .then(data => {
      albumsData = data.albums.reduce((acc, album) => {
        acc[album.id] = album;
        return acc;
      }, {});
    })
    .catch(error => console.error("Error loading album data:", error));

  // Genre Filter
  const genres = ["All", "Cinematic Pop", "Orchestral", "Country", "Electronic", "Soundtrack", "Rock"];
  const genreButtons = document.getElementById('genre-buttons');
  const defaultSection = document.getElementById('default-music');
  const filteredSection = document.getElementById('filtered-results');
  const filteredContainer = document.getElementById('filtered-container');
  const allAlbums = Array.from(document.querySelectorAll('.album-block'));

  // Populate genre buttons
  genres.forEach((genre, index) => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = genre;
    btn.dataset.genre = genre.toLowerCase().replace(/\s+/g, '-');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    btn.setAttribute('aria-label', `Show ${genre} genre`);
    btn.addEventListener('click', () => {
      console.log("Filtering by genre:", genre);

      // Update active button
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Filter albums
      if (genre === "All") {
        defaultSection.style.display = 'block';
        filteredSection.classList.remove('active');
      } else {
        defaultSection.style.display = 'none';
        filteredSection.classList.add('active');
        filteredContainer.innerHTML = '';
        allAlbums.forEach(album => {
          if (album.getAttribute('data-genre') === genre) {
            filteredContainer.appendChild(album.cloneNode(true));
          }
        });
      }
    });
    genreButtons.appendChild(btn);
  });

  // Keyboard navigation for genre buttons
  genreButtons.addEventListener('keydown', (e) => {
    const buttons = Array.from(genreButtons.querySelectorAll('.filter-btn'));
    const currentIndex = buttons.indexOf(document.activeElement);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % buttons.length;
      buttons[nextIndex].focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      buttons[prevIndex].focus();
    }
  });
});