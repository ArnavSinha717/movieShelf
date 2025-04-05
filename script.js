let movies = JSON.parse(localStorage.getItem('movies')) || [];

// DOM Elements
const addMovieBtn = document.getElementById('addMovieBtn');
const movieModal = document.getElementById('movieModal');
const closeModal = document.getElementById('closeModal');
const cancelMovie = document.getElementById('cancelMovie');
const saveMovie = document.getElementById('saveMovie');
const movieGrid = document.getElementById('movieGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('search');
const sortSelect = document.getElementById('sortSelect');
const categoryFilter = document.getElementById('categoryFilter');
const watchedFilter = document.getElementById('watchedFilter');
const favoritesFilter = document.getElementById('favoritesFilter');
const statsBtn = document.getElementById('statsBtn');
const statsModal = document.getElementById('statsModal');
const closeStatsModal = document.getElementById('closeStatsModal');
const detailedStats = document.getElementById('detailedStats');
const statsDiv = document.getElementById('stats');
const detailsModal = document.getElementById('detailsModal');
const closeDetailsModal = document.getElementById('closeDetailsModal');
const shareMovieBtn = document.getElementById('shareMovieBtn');

// Inputs
const titleInput = document.getElementById('movieTitle');
const genreInput = document.getElementById('movieGenre');
const ratingInput = document.getElementById('movieRating');
const watchedInput = document.getElementById('movieWatched');
const watchedDateInput = document.getElementById('watchedDate');
const posterInput = document.getElementById('moviePoster');
const categoryInput = document.getElementById('movieCategory');
const favoriteInput = document.getElementById('movieFavorite');

// Details Modal Elements
const detailsPoster = document.getElementById('detailsPoster');
const detailsTitle = document.getElementById('detailsTitle');
const detailsGenre = document.getElementById('detailsGenre');
const detailsRating = document.getElementById('detailsRating');
const detailsWatched = document.getElementById('detailsWatched');
const detailsAdded = document.getElementById('detailsAdded');
const detailsCategory = document.getElementById('detailsCategory');

let editingMovieId = null;
let categories = new Set();

// Modal Handling
addMovieBtn.addEventListener('click', () => {
  resetModal();
  editingMovieId = null;
  document.getElementById('modalTitle').innerText = 'Add Movie';
  movieModal.style.display = 'flex';
});

closeModal.addEventListener('click', () => {
  movieModal.style.display = 'none';
});

cancelMovie.addEventListener('click', () => {
  movieModal.style.display = 'none';
});

closeDetailsModal.addEventListener('click', () => {
  detailsModal.style.display = 'none';
});

closeStatsModal.addEventListener('click', () => {
  statsModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === movieModal) movieModal.style.display = 'none';
  if (e.target === detailsModal) detailsModal.style.display = 'none';
  if (e.target === statsModal) statsModal.style.display = 'none';
});

function resetModal() {
  titleInput.value = '';
  genreInput.value = '';
  ratingInput.value = '';
  watchedInput.checked = false;
  watchedDateInput.value = '';
  posterInput.value = '';
  categoryInput.value = '';
  favoriteInput.checked = false;
  toggleWatchedDate(false);
}

function toggleWatchedDate(show) {
  document.getElementById('watchedDateLabel').style.display = show ? 'block' : 'none';
  watchedDateInput.style.display = show ? 'block' : 'none';
}

watchedInput.addEventListener('change', () => {
  toggleWatchedDate(watchedInput.checked);
});

// Validation
function validateInputs() {
  const title = titleInput.value.trim();
  const genre = genreInput.value.trim();
  const rating = parseInt(ratingInput.value);
  
  if (!title || title.length < 2) return 'Title must be at least 2 characters';
  if (!genre) return 'Please select a genre';
  if (isNaN(rating) || rating < 1 || rating > 5) return 'Rating must be between 1 and 5';
  if (watchedInput.checked && !watchedDateInput.value) return 'Please select a watched date';
  return null;
}

// Add/Edit Movie
saveMovie.addEventListener('click', async () => {
  const error = validateInputs();
  if (error) {
    alert(error);
    return;
  }

  let posterData = null;
  if (posterInput.files && posterInput.files[0]) {
    posterData = await readFileAsDataURL(posterInput.files[0]);
  }

  const category = categoryInput.value.trim();
  if (category) categories.add(category);

  const movieData = {
    title: titleInput.value.trim(),
    genre: genreInput.value,
    rating: parseInt(ratingInput.value),
    watched: watchedInput.checked,
    watchedDate: watchedInput.checked ? watchedDateInput.value : null,
    poster: posterData || (editingMovieId ? movies.find(m => m.id === editingMovieId)?.poster : null),
    addedDate: editingMovieId ? movies.find(m => m.id === editingMovieId)?.addedDate : new Date().toISOString(),
    category: category,
    favorite: favoriteInput.checked
  };

  if (editingMovieId) {
    movies = movies.map(movie => 
      movie.id === editingMovieId ? { ...movie, ...movieData, id: editingMovieId } : movie
    );
  } else {
    movieData.id = Date.now();
    movies.push(movieData);
  }

  localStorage.setItem('movies', JSON.stringify(movies));
  updateCategoryFilter();
  renderMovies();
  movieModal.style.display = 'none';
});

// File Reader Helper
function readFileAsDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

// Render Movies
function renderMovies(list = movies) {
  movieGrid.innerHTML = '';

  if (list.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  list.forEach((movie) => {
    const card = document.createElement('div');
    card.classList.add('snippet-card');
    if (movie.favorite) card.classList.add('favorite');

    card.innerHTML = `
      ${movie.favorite ? '<i class="fas fa-heart favorite-icon"></i>' : ''}
      ${movie.poster ? `<img src="${movie.poster}" alt="${movie.title}" class="poster-img">` : ''}
      <div class="card-header">
        <h3 contenteditable="false">${movie.title}</h3>
        <span class="tag">${movie.genre}</span>
      </div>
      <div class="card-body">
        <p>${movie.watched ? '🎬 Watched' : '⏳ To Watch'}${movie.watched && movie.watchedDate ? ` on ${new Date(movie.watchedDate).toLocaleDateString()}` : ''}</p>
        <p>⭐ ${movie.rating}/5</p>
        <button class="edit-btn" data-id="${movie.id}">✏️ Edit</button>
        <button class="delete-btn" data-id="${movie.id}">🗑️ Delete</button>
      </div>
    `;

    const titleElement = card.querySelector('h3');
    titleElement.addEventListener('dblclick', () => {
      titleElement.contentEditable = true;
      titleElement.focus();
    });

    titleElement.addEventListener('blur', () => {
      titleElement.contentEditable = false;
      const newTitle = titleElement.textContent.trim();
      if (newTitle && newTitle !== movie.title) {
        movies = movies.map(m => 
          m.id === movie.id ? { ...m, title: newTitle } : m
        );
        localStorage.setItem('movies', JSON.stringify(movies));
        renderMovies();
      }
    });

    titleElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        titleElement.blur();
      }
    });

    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('edit-btn') && !e.target.classList.contains('delete-btn') && e.target !== titleElement) {
        showDetails(movie);
      }
    });

    card.querySelector('.edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(movie);
    });

    card.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this movie?')) {
        movies = movies.filter(m => m.id !== movie.id);
        localStorage.setItem('movies', JSON.stringify(movies));
        updateCategoryFilter();
        renderMovies();
      }
    });

    movieGrid.appendChild(card);
  });

  updateStats();
}

// Edit Modal
function openEditModal(movie) {
  if (confirm('Edit this movie?')) {
    editingMovieId = movie.id;
    titleInput.value = movie.title;
    genreInput.value = movie.genre;
    ratingInput.value = movie.rating;
    watchedInput.checked = movie.watched;
    watchedDateInput.value = movie.watchedDate || '';
    categoryInput.value = movie.category || '';
    favoriteInput.checked = movie.favorite || false;
    toggleWatchedDate(movie.watched);
    document.getElementById('modalTitle').innerText = 'Edit Movie';
    movieModal.style.display = 'flex';
  }
}

// Show Details
function showDetails(movie) {
  detailsPoster.src = movie.poster || '';
  detailsPoster.style.display = movie.poster ? 'block' : 'none';
  detailsTitle.textContent = movie.title;
  detailsGenre.textContent = `Genre: ${movie.genre}`;
  detailsRating.textContent = `Rating: ${movie.rating}/5`;
  detailsWatched.textContent = movie.watched 
    ? `Watched: Yes${movie.watchedDate ? ` on ${new Date(movie.watchedDate).toLocaleDateString()}` : ''}` 
    : 'Watched: No';
  detailsAdded.textContent = `Added: ${new Date(movie.addedDate).toLocaleDateString()}`;
  detailsCategory.textContent = movie.category ? `Category: ${movie.category}` : '';
  shareMovieBtn.onclick = () => shareMovie(movie);
  detailsModal.style.display = 'flex';
}

// Share Movie
function shareMovie(movie) {
  const text = `${movie.title} (${movie.genre})\nRating: ${movie.rating}/5\n${movie.watched ? `Watched on ${new Date(movie.watchedDate).toLocaleDateString()}` : 'Not Watched'}\n${movie.category ? `Category: ${movie.category}` : ''}`;
  navigator.clipboard.writeText(text).then(() => {
    alert('Movie details copied to clipboard!');
  });
}

// Search and Filter
function filterMovies() {
  const query = searchInput.value.trim().toLowerCase();
  const showWatchedOnly = watchedFilter.checked;
  const showFavoritesOnly = favoritesFilter.checked;
  const selectedCategory = categoryFilter.value;

  let filtered = movies.filter(movie => {
    const matchesSearch = 
      movie.title.toLowerCase().includes(query) || 
      movie.genre.toLowerCase().includes(query);
    const matchesWatched = showWatchedOnly ? movie.watched : true;
    const matchesFavorites = showFavoritesOnly ? movie.favorite : true;
    const matchesCategory = selectedCategory === 'favorites' ? movie.favorite : (selectedCategory ? movie.category === selectedCategory : true);
    return matchesSearch && matchesWatched && matchesFavorites && matchesCategory;
  });

  sortMovies(filtered);
}

searchInput.addEventListener('input', filterMovies);
watchedFilter.addEventListener('change', filterMovies);
favoritesFilter.addEventListener('change', filterMovies);
categoryFilter.addEventListener('change', filterMovies);

// Sort Movies
function sortMovies(list) {
  const criteria = sortSelect.value;
  const sorted = [...list].sort((a, b) => {
    if (criteria === 'title') return a.title.localeCompare(b.title);
    if (criteria === 'rating') return b.rating - a.rating;
    if (criteria === 'date') return new Date(b.addedDate) - new Date(a.addedDate);
    return 0;
  });
  renderMovies(sorted);
}

sortSelect.addEventListener('change', () => filterMovies());

// Update Category Filter
function updateCategoryFilter() {
  categories = new Set(movies.map(movie => movie.category).filter(cat => cat));
  categoryFilter.innerHTML = `
    <option value="">All Categories</option>
    <option value="favorites">Favorites</option>
    ${Array.from(categories).map(cat => `<option value="${cat}">${cat}</option>`).join('')}
  `;
}

// Statistics
function updateStats() {
  const total = movies.length;
  const watched = movies.filter(m => m.watched).length;
  const favorites = movies.filter(m => m.favorite).length;
  statsDiv.innerHTML = `Total: ${total} | Watched: ${watched} | Favorites: ${favorites}`;
}

statsBtn.addEventListener('click', () => {
  const genreBreakdown = movies.reduce((acc, movie) => {
    acc[movie.genre] = (acc[movie.genre] || 0) + 1;
    return acc;
  }, {});

  const ratingDistribution = movies.reduce((acc, movie) => {
    acc[movie.rating] = (acc[movie.rating] || 0) + 1;
    return acc;
  }, {});

  const watchTrend = movies.filter(m => m.watched && m.watchedDate).reduce((acc, movie) => {
    const month = new Date(movie.watchedDate).toLocaleString('default', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  detailedStats.innerHTML = `
    <h3>Genre Breakdown</h3>
    <ul>${Object.entries(genreBreakdown).map(([genre, count]) => `<li>${genre}: ${count}</li>`).join('')}</ul>
    <h3>Rating Distribution</h3>
    <ul>${Object.entries(ratingDistribution).map(([rating, count]) => `<li>${rating}/5: ${count}</li>`).join('')}</ul>
    <h3>Watch History</h3>
    <ul>${Object.entries(watchTrend).map(([month, count]) => `<li>${month}: ${count} movies</li>`).join('')}</ul>
  `;
  statsModal.style.display = 'flex';
});

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') document.body.classList.add('dark-mode');
  updateCategoryFilter();
  renderMovies();
});

document.getElementById('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});