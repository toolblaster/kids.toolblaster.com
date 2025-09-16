/**
 * IMPORTANT: CONTENT POLICY
 * This website must only use poems, rhymes, or other text content that is verifiably in the public domain.
 * - DO NOT use modern songs, copyrighted poems, or lyrics from contemporary artists.
 * - DO NOT use modern illustrations, copyrighted images, or artwork from publishers.
 * - DO NOT use copyrighted audio recordings or music.
 * The goal is to create a safe, free, and legal resource for children everywhere.
 * All content should be timeless and free of any copyright restrictions.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTS ---
    const rhymeGrid = document.getElementById('rhyme-grid');
    const rhymeGalleryView = document.getElementById('rhyme-gallery');
    const rhymeDetailView = document.getElementById('rhyme-detail');
    const backButton = document.getElementById('back-button');
    const searchBar = document.getElementById('search-bar');
    const categoryFilters = document.getElementById('category-filters');
    const surpriseButton = document.getElementById('surprise-button');
    const themeToggle = document.getElementById('theme-toggle');
    const favoriteBtn = document.getElementById('favorite-btn');
    const printBtn = document.getElementById('print-btn');
    const rotdCard = document.getElementById('rotd-card');
    
    // --- STATE ---
    let rhymes = [];
    let favorites = [];
    const cardColors = ['bg-red-200 dark:bg-red-900/50', 'bg-blue-200 dark:bg-blue-900/50', 'bg-green-200 dark:bg-green-900/50', 'bg-yellow-200 dark:bg-yellow-900/50', 'bg-purple-200 dark:bg-purple-900/50', 'bg-pink-200 dark:bg-pink-900/50'];

    // --- INITIALIZATION ---
    function initialize() {
        loadFavorites();
        initializeTheme();
        loadRhymes();
        // Set 'All' button as active by default
        document.querySelector('.category-btn[data-category="All"]').classList.add('active');
    }

    // --- DATA HANDLING ---
    async function loadRhymes() {
        try {
            const response = await fetch('rhymes.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            rhymes = await response.json();
            displayRhymeGallery(rhymes);
            displayRhymeOfTheDay(); // Display the rhyme of the day after loading
        } catch (error) {
            console.error("Could not fetch rhymes:", error);
            rhymeGrid.innerHTML = '<p class="text-red-500 col-span-full text-center">Sorry, could not load the rhymes.</p>';
        }
    }

    function loadFavorites() {
        favorites = JSON.parse(localStorage.getItem('rhymeFavorites')) || [];
    }

    function saveFavorites() {
        localStorage.setItem('rhymeFavorites', JSON.stringify(favorites));
    }

    function toggleFavorite(id) {
        const rhymeId = parseInt(id);
        if (favorites.includes(rhymeId)) {
            favorites = favorites.filter(favId => favId !== rhymeId);
        } else {
            favorites.push(rhymeId);
        }
        saveFavorites();
    }

    // --- THEME HANDLING ---
    function initializeTheme() {
        if (localStorage.theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.getElementById('theme-icon-light').classList.add('hidden');
            document.getElementById('theme-icon-dark').classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            document.getElementById('theme-icon-light').classList.remove('hidden');
            document.getElementById('theme-icon-dark').classList.add('hidden');
        }
    }
    
    function toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        document.getElementById('theme-icon-light').classList.toggle('hidden', isDark);
        document.getElementById('theme-icon-dark').classList.toggle('hidden', !isDark);
    }

    // --- UI RENDERING ---
    function displayRhymeOfTheDay() {
        if (rhymes.length === 0) return;

        const date = new Date();
        const dayOfYear = (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
        const rhymeIndex = Math.floor(dayOfYear) % rhymes.length;
        const rhyme = rhymes[rhymeIndex];

        document.getElementById('rotd-icon').textContent = rhyme.icon;
        document.getElementById('rotd-title').textContent = rhyme.title;
        document.getElementById('rotd-snippet').textContent = rhyme.lyrics.split('\n')[0]; // Show first line
        rotdCard.dataset.id = rhyme.id;
    }

    function displayRhymeGallery(rhymesToDisplay) {
        rhymeGrid.innerHTML = '';
        if (rhymesToDisplay.length === 0) {
            rhymeGrid.innerHTML = '<p class="text-gray-500 dark:text-gray-400 col-span-full text-center">No rhymes found. Try a different search or category!</p>';
            return;
        }

        rhymesToDisplay.forEach((rhyme, index) => {
            const card = document.createElement('div');
            const colorClass = cardColors[index % cardColors.length];
            const isFavorited = favorites.includes(rhyme.id);
            card.className = `${colorClass} rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-transform duration-300 flex flex-col items-center justify-center p-4 min-h-[160px] text-center relative`;
            card.innerHTML = `
                ${isFavorited ? '<div class="absolute top-2 right-2 text-xl text-brand-red" title="Favorited">❤️</div>' : ''}
                <div class="text-4xl mb-2">${rhyme.icon}</div>
                <h3 class="text-lg font-bold text-brand-dark dark:text-white">${rhyme.title}</h3>
            `;
            card.addEventListener('click', () => showRhymeDetail(rhyme.id));
            rhymeGrid.appendChild(card);
        });
    }

    function showRhymeDetail(rhymeId) {
        // Ensure rhymeId is an integer
        const id = parseInt(rhymeId);
        const rhyme = rhymes.find(r => r.id === id);
        if (!rhyme) return;

        document.getElementById('rhyme-title').textContent = rhyme.title;
        document.getElementById('rhyme-lyrics').textContent = rhyme.lyrics;
        
        favoriteBtn.dataset.id = rhyme.id;
        updateFavoriteButtonState(rhyme.id);

        document.getElementById('rhyme-of-the-day').classList.add('hidden');
        rhymeGalleryView.classList.add('hidden');
        document.getElementById('controls').classList.add('hidden');
        rhymeDetailView.classList.remove('hidden');
        window.scrollTo(0, 0);
    }
    
    function updateFavoriteButtonState(rhymeId) {
        if (favorites.includes(parseInt(rhymeId))) {
            favoriteBtn.classList.add('favorited');
        } else {
            favoriteBtn.classList.remove('favorited');
        }
    }

    function goBackToGallery() {
        rhymeDetailView.classList.add('hidden');
        document.getElementById('rhyme-of-the-day').classList.remove('hidden');
        rhymeGalleryView.classList.remove('hidden');
        document.getElementById('controls').classList.remove('hidden');
        
        // Refresh gallery to show correct favorite status
        const activeCategory = document.querySelector('.category-btn.active').dataset.category;
        handleCategoryFilter(activeCategory);
    }
    
    function handleCategoryFilter(category) {
        let filteredRhymes = rhymes;
        if (category === 'Favorites') {
            filteredRhymes = rhymes.filter(rhyme => favorites.includes(rhyme.id));
        } else if (category !== 'All') {
            filteredRhymes = rhymes.filter(rhyme => rhyme.category === category);
        }
        displayRhymeGallery(filteredRhymes);
    }

    // --- EVENT LISTENERS ---
    backButton.addEventListener('click', goBackToGallery);
    themeToggle.addEventListener('click', toggleTheme);
    printBtn.addEventListener('click', () => window.print());
    rotdCard.addEventListener('click', (e) => showRhymeDetail(e.currentTarget.dataset.id));

    favoriteBtn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        toggleFavorite(id);
        updateFavoriteButtonState(id);
    });

    searchBar.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredRhymes = rhymes.filter(rhyme => 
            rhyme.title.toLowerCase().includes(searchTerm) || 
            rhyme.lyrics.toLowerCase().includes(searchTerm)
        );
        displayRhymeGallery(filteredRhymes);
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.category-btn[data-category="All"]').classList.add('active');
    });

    categoryFilters.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            const category = e.target.dataset.category;
            searchBar.value = '';
            handleCategoryFilter(category);
        }
    });
    
    surpriseButton.addEventListener('click', () => {
        if (rhymes.length > 0) {
            const randomIndex = Math.floor(Math.random() * rhymes.length);
            showRhymeDetail(rhymes[randomIndex].id);
        }
    });

    // --- START THE APP ---
    initialize();
});
