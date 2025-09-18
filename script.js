/**
 * =================================================================
 * COPYRIGHT & CONTENT POLICY
 * =================================================================
 * This website uses nursery rhyme text that is in the public domain.
 * Original stories are exclusive content.
 *
 * DO NOT ADD any content that may be copyrighted.
 * =================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- GLOBAL VARIABLES & STATE ---
    let allRhymes = [];
    let allStories = [];
    let currentRhymeList = [];
    let favorites = JSON.parse(localStorage.getItem('favoriteRhymes')) || [];
    let favoriteStories = JSON.parse(localStorage.getItem('favoriteStories')) || [];
    let playlist = JSON.parse(localStorage.getItem('playlist')) || [];
    
    let currentRhyme = null;
    let currentStory = null;

    let isPlaylistMode = false;
    let currentPlaylistIndex = -1;
    const originalTitle = document.title;

    // --- ELEMENT SELECTORS ---
    const loadingIndicator = document.getElementById('loading-indicator');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIconLight = document.getElementById('theme-icon-light');
    const themeIconDark = document.getElementById('theme-icon-dark');
    const homeButton = document.getElementById('home-button');
    
    // Main Views
    const rhymeGalleryView = document.getElementById('rhyme-gallery');
    const storyGalleryView = document.getElementById('story-gallery');
    const rhymeDetailView = document.getElementById('rhyme-detail');
    const storyDetailView = document.getElementById('story-detail');

    // Grids & Content Holders
    const rhymeGrid = document.getElementById('rhyme-grid');
    const storyGrid = document.getElementById('story-grid');

    // Controls
    const controlsSection = document.getElementById('controls-section');
    const rhymeControls = document.getElementById('rhyme-controls');
    const storyControls = document.getElementById('story-controls');
    const searchBar = document.getElementById('search-bar');
    const categoryFilters = document.getElementById('category-filters');
    const storyCategoryFilters = document.getElementById('story-category-filters');
    const surpriseButton = document.getElementById('surprise-button');
    const backToTopBtn = document.getElementById('back-to-top-btn');

    // Rhyme Detail Elements
    const backButton = document.getElementById('back-button');
    const favoriteBtn = document.getElementById('favorite-btn');
    const printBtn = document.getElementById('print-btn');
    const shareWhatsappBtn = document.getElementById('share-whatsapp');
    const previousDetailRhymeBtn = document.getElementById('previous-detail-rhyme-btn');
    const nextDetailRhymeBtn = document.getElementById('next-detail-rhyme-btn');

    // Story Detail Elements
    const storyBackButton = document.getElementById('story-back-button');
    const storyFavoriteBtn = document.getElementById('story-favorite-btn');
    const addToStoryPlaylistBtn = document.getElementById('add-to-story-playlist-btn');
    const previousDetailStoryBtn = document.getElementById('previous-detail-story-btn');
    const nextDetailStoryBtn = document.getElementById('next-detail-story-btn');

    // Playlist Elements
    const playlistToggleBtn = document.getElementById('playlist-toggle-btn');
    const playlistView = document.getElementById('playlist-view');
    const closePlaylistBtn = document.getElementById('close-playlist-btn');
    const playlistItemsContainer = document.getElementById('playlist-items');
    const clearPlaylistBtn = document.getElementById('clear-playlist-btn');
    const playlistCountEl = document.getElementById('playlist-count');
    const addToPlaylistBtn = document.getElementById('add-to-playlist-btn');
    const playlistNavButtons = document.getElementById('playlist-nav-buttons');
    const prevRhymeBtn = document.getElementById('prev-rhyme-btn');
    const nextRhymeBtn = document.getElementById('next-rhyme-btn');
    const playlistPositionEl = document.getElementById('playlist-position');
    
    // Toast Notification
    const toastNotification = document.getElementById('toast-notification');


    // --- INITIALIZATION ---
    function init() {
        setupTheme();
        loadAllData();
        addEventListeners();
        updatePlaylistCount();
    }

    function setupTheme() {
        const isDarkMode = localStorage.getItem('theme') === 'dark';
        document.documentElement.classList.toggle('dark', isDarkMode);
        updateThemeIcon(isDarkMode);
    }

    // --- DATA HANDLING ---
    async function loadAllData() {
        try {
            const [rhymesPublic, rhymesExclusive, stories] = await Promise.all([
                fetch('public_rhymes.json').then(res => res.json()),
                fetch('exclusive_rhymes.json').then(res => res.json()),
                fetch('short_stories.json').then(res => res.json())
            ]);

            allRhymes = [...rhymesPublic, ...rhymesExclusive].sort((a, b) => a.id - b.id);
            allStories = stories;
            
            setTimeout(() => {
                loadingIndicator.style.display = 'none';
                handleUrlParams();
            }, 500);

        } catch (error) {
            console.error("Could not fetch data:", error);
            loadingIndicator.innerHTML = '<p class="text-red-500 text-center">Sorry, could not load content. Please try refreshing the page.</p>';
        }
    }

    // --- URL & NAVIGATION HANDLING ---
    function handleUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const rhymeId = urlParams.get('rhyme');
        const storyId = urlParams.get('story');
        const category = urlParams.get('category');

        if (rhymeId) {
            showRhymeDetail(parseInt(rhymeId));
        } else if (storyId) {
            showStoryDetail(parseInt(storyId));
        } else if (category) {
            updateActiveCategoryButton(category);
            showMainView(category);
        } else {
            // Default view
            showMainView('Rhymes');
            displayRhymeOfTheDay();
        }
    }
    
    function updateUrl(params) {
        const url = new URL(window.location);
        url.search = ''; // Clear existing params
        for (const key in params) {
            if (params[key]) {
                url.searchParams.set(key, params[key]);
            }
        }
        window.history.pushState({}, '', url);
    }

    // --- VIEW MANAGEMENT ---
    function hideAllViews() {
        rhymeGalleryView.classList.add('hidden');
        storyGalleryView.classList.add('hidden');
        rhymeDetailView.classList.add('hidden');
        storyDetailView.classList.add('hidden');
        document.getElementById('rhyme-of-the-day').classList.add('hidden');
        controlsSection.classList.add('hidden');
        rhymeControls.classList.add('hidden');
        storyControls.classList.add('hidden');
    }

    function showMainView(viewName) {
        hideAllViews();
        controlsSection.classList.remove('hidden');

        if (viewName === 'Stories' || viewName === 'StoryFavorites') {
            storyGalleryView.classList.remove('hidden');
            storyControls.classList.remove('hidden');
            
            let storiesToDisplay;
            if (viewName === 'StoryFavorites') {
                storiesToDisplay = allStories.filter(s => isFavoriteStory(s.id));
            } else { // 'Stories'
                storiesToDisplay = allStories;
            }
            displayStoryGallery(storiesToDisplay);
        } else { // Rhymes and all its categories
            rhymeGalleryView.classList.remove('hidden');
            rhymeControls.classList.remove('hidden');
            document.getElementById('rhyme-of-the-day').classList.remove('hidden');
            
            let rhymesToDisplay;
            if (viewName === 'Favorites') {
                rhymesToDisplay = allRhymes.filter(r => isFavorite(r.id));
            } else if (viewName === 'New') {
                rhymesToDisplay = allRhymes.filter(r => r.isExclusive);
            } else if (viewName === 'Lullaby') { // Tag-based filter
                rhymesToDisplay = allRhymes.filter(r => r.tags && r.tags.includes('lullaby'));
            } else if (['Animal', 'Learning', 'Classic', 'Indian'].includes(viewName)) { // Category-based filters
                rhymesToDisplay = allRhymes.filter(r => r.category === viewName);
            } else { // Default to 'Rhymes' (which means all)
                rhymesToDisplay = allRhymes;
            }
            
            displayRhymeGallery(rhymesToDisplay);
            displayRhymeOfTheDay();
        }
    }

    function goHome() {
        searchBar.value = '';
        updateActiveCategoryButton('Rhymes');
        showMainView('Rhymes');
        updateUrl({ category: 'Rhymes' });
    }

    function goBackToGallery() {
        document.title = originalTitle;
        const activeCategory = document.querySelector('.main-nav-btn.active').dataset.category || 'Rhymes';
        showMainView(activeCategory);
        updateUrl({ category: activeCategory });
    }

    // --- DISPLAY FUNCTIONS (RHYMES) ---
    function displayRhymeGallery(rhymesToDisplay) {
        currentRhymeList = rhymesToDisplay;
        rhymeGrid.innerHTML = '';
        if (rhymesToDisplay.length === 0) {
            const activeButton = document.querySelector('#category-filters .category-btn.active');
            let emptyMessage = '<p class="text-gray-500 dark:text-gray-400 col-span-full text-center">No rhymes found.</p>';
            
            if (activeButton && activeButton.dataset.category === 'Favorites') {
                emptyMessage = `
                    <div class="col-span-full text-center p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div class="text-4xl mb-2">❤️</div>
                        <h4 class="text-lg font-bold text-brand-dark dark:text-white">Your Favorites is Empty</h4>
                        <p class="text-gray-500 dark:text-gray-400 mt-1">Click the white heart on any rhyme to add it here!</p>
                    </div>
                `;
            }
            rhymeGrid.innerHTML = emptyMessage;
            return;
        }
        rhymesToDisplay.forEach(rhyme => {
            const card = document.createElement('div');
            card.className = 'rhyme-card bg-white dark:bg-gray-800 rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300 flex flex-col p-4 text-center relative';
            card.dataset.rhymeId = rhyme.id;
            card.innerHTML = `
                <div class="flex-grow flex flex-col items-center justify-center">
                    <div class="text-5xl mb-2">${rhyme.icon || '🎶'}</div>
                    <h3 class="text-lg font-bold text-brand-dark dark:text-white">${rhyme.title}</h3>
                </div>
                <div class="absolute top-2 right-2 text-xl favorite-indicator">${isFavorite(rhyme.id) ? '❤️' : ''}</div>
            `;
            card.addEventListener('click', () => showRhymeDetail(rhyme.id));
            rhymeGrid.appendChild(card);
        });
    }

    function showRhymeDetail(rhymeId, fromPlaylist = false, playlistIndex = -1) {
        currentRhyme = allRhymes.find(r => r.id === rhymeId);
        if (!currentRhyme) return;

        hideAllViews();
        rhymeDetailView.classList.remove('hidden');
        document.title = `${currentRhyme.title} - Kids Rhymes`;
        updateUrl({ rhyme: rhymeId });

        isPlaylistMode = fromPlaylist;
        if (isPlaylistMode) {
            currentPlaylistIndex = playlistIndex;
        }

        document.getElementById('rhyme-title-en').textContent = currentRhyme.title;
        document.getElementById('rhyme-lyrics-en').textContent = currentRhyme.lyrics;
        
        const titleHiEl = document.getElementById('rhyme-title-hi');
        const hindiColumn = document.getElementById('hindi-column');
        if (currentRhyme.title_hi && currentRhyme.lyrics_hi) {
            titleHiEl.textContent = currentRhyme.title_hi;
            document.getElementById('rhyme-lyrics-hi').textContent = currentRhyme.lyrics_hi;
            hindiColumn.classList.remove('hidden');
        } else {
            titleHiEl.textContent = ''; // Clear the Hindi title if it doesn't exist
            hindiColumn.classList.add('hidden');
        }
        
        const learningFocusContainer = document.getElementById('learning-focus-badge-container');
        if (currentRhyme.learningFocus) {
            document.getElementById('learning-focus-badge').textContent = `Focus: ${currentRhyme.learningFocus}`;
            learningFocusContainer.classList.remove('hidden');
        } else {
            learningFocusContainer.classList.add('hidden');
        }

        favoriteBtn.textContent = isFavorite(rhymeId) ? '❤️' : '🤍';
        favoriteBtn.setAttribute('data-id', rhymeId);

        const funFactContainer = document.getElementById('fun-fact-container');
        if (currentRhyme.funFact) {
            document.getElementById('fun-fact-text').textContent = currentRhyme.funFact;
            funFactContainer.classList.remove('hidden');
        } else {
            funFactContainer.classList.add('hidden');
        }
        
        const copyrightContainer = document.getElementById('copyright-notice-container');
        if (currentRhyme.isExclusive) {
            document.getElementById('copyright-text').textContent = `© ${new Date().getFullYear()} Kids.Toolblaster.com. All Rights Reserved. This is an Original and Exclusive Rhyme.`;
            copyrightContainer.classList.remove('hidden');
        } else {
            copyrightContainer.classList.add('hidden');
        }
        
        const listToUse = currentRhymeList.find(r => r.id === rhymeId) ? currentRhymeList : allRhymes;
        const currentIndex = listToUse.findIndex(r => r.id === rhymeId);
        previousDetailRhymeBtn.disabled = currentIndex <= 0;
        nextDetailRhymeBtn.disabled = currentIndex >= listToUse.length - 1;

        updateAddToPlaylistButton();
        updatePlaylistNav();
        window.scrollTo(0, 0);
    }
    
    // --- DISPLAY FUNCTIONS (STORIES) ---
    function displayStoryGallery(storiesToDisplay) {
        storyGrid.innerHTML = '';
        if (storiesToDisplay.length === 0) {
            const activeButton = document.querySelector('#story-category-filters .category-btn.active');
            let emptyMessage = '<p class="text-gray-500 dark:text-gray-400 col-span-full text-center">No stories found.</p>';

            if (activeButton && activeButton.dataset.category === 'StoryFavorites') {
                 emptyMessage = `
                    <div class="col-span-full text-center p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div class="text-4xl mb-2">❤️</div>
                        <h4 class="text-lg font-bold text-brand-dark dark:text-white">Your Favorite Stories is Empty</h4>
                        <p class="text-gray-500 dark:text-gray-400 mt-1">Click the white heart on any story to add it here!</p>
                    </div>
                `;
            }
             storyGrid.innerHTML = emptyMessage;
            return;
        }
        storiesToDisplay.forEach(story => {
            const card = document.createElement('div');
            card.className = 'rhyme-card bg-white dark:bg-gray-800 rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300 flex flex-col p-4 text-center relative';
            card.dataset.storyId = story.id;
            card.innerHTML = `
                <div class="flex-grow flex flex-col items-center justify-center">
                    <div class="text-5xl mb-2">${story.icon || '📚'}</div>
                    <h3 class="text-lg font-bold text-brand-dark dark:text-white">${story.title}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">by ${story.author}</p>
                </div>
                <div class="absolute top-2 right-2 text-xl favorite-indicator">${isFavoriteStory(story.id) ? '❤️' : ''}</div>
            `;
            card.addEventListener('click', () => showStoryDetail(story.id));
            storyGrid.appendChild(card);
        });
    }

    function showStoryDetail(storyId) {
        currentStory = allStories.find(s => s.id === storyId);
        if (!currentStory) return;

        hideAllViews();
        storyDetailView.classList.remove('hidden');
        document.title = `${currentStory.title} - Kids Stories`;
        updateUrl({ story: storyId });

        document.getElementById('story-title').textContent = currentStory.title;
        document.getElementById('story-author').textContent = `by ${currentStory.author}`;
        document.getElementById('story-read-time').textContent = currentStory.readTime;
        
        const storyContentEl = document.getElementById('story-content');
        storyContentEl.innerHTML = '';
        currentStory.content.forEach(paragraph => {
            // This regex splits the paragraph into sentences, keeping the punctuation.
            const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
            sentences.forEach(sentence => {
                const p = document.createElement('p');
                p.textContent = sentence.trim();
                storyContentEl.appendChild(p);
            });
        });

        const moralContainer = document.getElementById('story-moral-container');
        if (currentStory.moral) {
            document.getElementById('story-moral').textContent = currentStory.moral;
            moralContainer.classList.remove('hidden');
        } else {
            moralContainer.classList.add('hidden');
        }

        const storyCopyrightContainer = document.getElementById('story-copyright-notice-container');
        const storyCopyrightText = document.getElementById('story-copyright-text');
        storyCopyrightText.textContent = `© ${new Date().getFullYear()} Kids.Toolblaster.com. All Rights Reserved. This is an Original and Exclusive Story.`;
        storyCopyrightContainer.classList.remove('hidden');
        
        const currentIndex = allStories.findIndex(s => s.id === storyId);
        previousDetailStoryBtn.disabled = currentIndex <= 0;
        nextDetailStoryBtn.disabled = currentIndex >= allStories.length - 1;

        storyFavoriteBtn.textContent = isFavoriteStory(storyId) ? '❤️' : '🤍';
        updateAddToStoryPlaylistButton();
        window.scrollTo(0, 0);
    }

    function displayRhymeOfTheDay() {
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const rhyme = allRhymes[dayOfYear % allRhymes.length];
        if (!rhyme) return;

        document.getElementById('rotd-icon').textContent = rhyme.icon || '🎶';
        document.getElementById('rotd-title').textContent = rhyme.title;
        document.getElementById('rotd-snippet').textContent = rhyme.lyrics.split('\n')[0];
        document.getElementById('rotd-card').addEventListener('click', () => showRhymeDetail(rhyme.id));
    }
    
    // --- EVENT HANDLING & LOGIC ---
    function addEventListeners() {
        homeButton.addEventListener('click', goHome);
        backButton.addEventListener('click', goBackToGallery);
        storyBackButton.addEventListener('click', goBackToGallery);
        searchBar.addEventListener('input', handleSearchInput);
        document.getElementById('main-navigation').addEventListener('click', handleCategoryClick);
        categoryFilters.addEventListener('click', handleCategoryClick);
        storyCategoryFilters.addEventListener('click', handleCategoryClick);
        surpriseButton.addEventListener('click', showRandomRhyme);
        previousDetailRhymeBtn.addEventListener('click', showPreviousRhyme);
        nextDetailRhymeBtn.addEventListener('click', showNextRhyme);
        previousDetailStoryBtn.addEventListener('click', showPreviousStory);
        nextDetailStoryBtn.addEventListener('click', showNextStory);
        themeToggle.addEventListener('click', toggleTheme);
        favoriteBtn.addEventListener('click', handleFavoriteClick);
        printBtn.addEventListener('click', handlePrint);
        shareWhatsappBtn.addEventListener('click', handleShare);
        
        // Story buttons
        storyFavoriteBtn.addEventListener('click', handleFavoriteStoryClick);
        addToStoryPlaylistBtn.addEventListener('click', handleAddToStoryPlaylist);

        // Playlist listeners
        playlistToggleBtn.addEventListener('click', togglePlaylistView);
        closePlaylistBtn.addEventListener('click', togglePlaylistView);
        addToPlaylistBtn.addEventListener('click', handleAddToPlaylist);
        clearPlaylistBtn.addEventListener('click', clearPlaylist);
        playlistItemsContainer.addEventListener('click', handlePlaylistItemClick);
        prevRhymeBtn.addEventListener('click', playPreviousRhyme);
        nextRhymeBtn.addEventListener('click', playNextRhyme);
        
        // Back to Top Listeners
        window.addEventListener('scroll', handleScroll);
        backToTopBtn.addEventListener('click', scrollToTop);
    }
    
    function handleSearchInput() {
        let filtered = allRhymes.filter(rhyme =>
            rhyme.title.toLowerCase().includes(searchBar.value.toLowerCase()) ||
            rhyme.lyrics.toLowerCase().includes(searchBar.value.toLowerCase())
        );
        displayRhymeGallery(filtered);
    }

    function handleCategoryClick(e) {
        const clickedButton = e.target.closest('.category-btn');
        if (clickedButton) {
            searchBar.value = '';
            const category = clickedButton.dataset.category;
            updateActiveCategoryButton(category);
            showMainView(category);
            updateUrl({ category: category });
        }
    }

    function updateActiveCategoryButton(categoryToActivate) {
        // Deactivate all sub-filters first
        document.querySelectorAll('#category-filters .category-btn, #story-category-filters .category-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Activate the clicked sub-filter
        const activeButton = document.querySelector(`.category-btn[data-category="${categoryToActivate}"]`);
        if (activeButton && !activeButton.closest('#main-navigation')) {
            activeButton.classList.add('active');
        }

        // Handle main navigation buttons
        const isStoryFilter = ['Stories', 'StoryFavorites'].includes(categoryToActivate);
        document.querySelector('.main-nav-btn[data-category="Stories"]').classList.toggle('active', isStoryFilter);
        document.querySelector('.main-nav-btn[data-category="Rhymes"]').classList.toggle('active', !isStoryFilter);
    }

    function showRandomRhyme() {
        const randomIndex = Math.floor(Math.random() * allRhymes.length);
        showRhymeDetail(allRhymes[randomIndex].id);
    }

    function showRandomStory() {
        const randomIndex = Math.floor(Math.random() * allStories.length);
        showStoryDetail(allStories[randomIndex].id);
    }

    function showPreviousRhyme() {
        if (!currentRhyme) return;
        const listToUse = currentRhymeList.find(r => r.id === currentRhyme.id) ? currentRhymeList : allRhymes;
        const currentIndex = listToUse.findIndex(r => r.id === currentRhyme.id);
        if (currentIndex > 0) {
            showRhymeDetail(listToUse[currentIndex - 1].id);
        }
    }

    function showNextRhyme() {
        if (!currentRhyme) return;
        const listToUse = currentRhymeList.find(r => r.id === currentRhyme.id) ? currentRhymeList : allRhymes;
        const currentIndex = listToUse.findIndex(r => r.id === currentRhyme.id);
        if (currentIndex < listToUse.length - 1) {
            showRhymeDetail(listToUse[currentIndex + 1].id);
        }
    }

    function showPreviousStory() {
        if (!currentStory) return;
        const currentIndex = allStories.findIndex(s => s.id === currentStory.id);
        if (currentIndex > 0) {
            showStoryDetail(allStories[currentIndex - 1].id);
        }
    }

    function showNextStory() {
        if (!currentStory) return;
        const currentIndex = allStories.findIndex(s => s.id === currentStory.id);
        if (currentIndex < allStories.length - 1) {
            showStoryDetail(allStories[currentIndex + 1].id);
        }
    }

    function toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateThemeIcon(isDark);
    }
    
    function updateThemeIcon(isDark) {
        themeIconLight.classList.toggle('hidden', isDark);
        themeIconDark.classList.toggle('hidden', !isDark);
    }
    
    // --- TOAST NOTIFICATION ---
    function showToast(message) {
        toastNotification.textContent = message;
        toastNotification.classList.add('show');
        setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 2500);
    }

    // --- PLAYLIST FUNCTIONS ---
    function togglePlaylistView() {
        if (playlistView.classList.contains('hidden')) {
            displayPlaylist();
            playlistView.classList.remove('hidden');
        } else {
            playlistView.classList.add('hidden');
        }
    }
    
    function displayPlaylist() {
        playlistItemsContainer.innerHTML = '';
        if (playlist.length === 0) {
            playlistItemsContainer.innerHTML = `<p class="text-center text-gray-500 dark:text-gray-400">Your playlist is empty.</p>`;
            clearPlaylistBtn.disabled = true;
            return;
        }

        clearPlaylistBtn.disabled = false;

        playlist.forEach((item) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700';

            let details;
            let icon;
            if (item.type === 'rhyme') {
                details = allRhymes.find(r => r.id === item.id);
                icon = details ? details.icon || '🎶' : '🎶';
            } else { // story
                details = allStories.find(s => s.id === item.id);
                icon = details ? details.icon || '📚' : '📚';
            }

            if (!details) return; // Skip if item from a previous session is no longer available

            itemEl.innerHTML = `
                <div class="flex items-center gap-3 cursor-pointer flex-grow" data-item-id="${details.id}" data-item-type="${item.type}" data-action="play">
                    <span class="text-2xl">${icon}</span>
                    <span class="font-semibold text-brand-dark dark:text-white">${details.title}</span>
                </div>
                <button class="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-800 text-red-500" data-item-id="${details.id}" data-item-type="${item.type}" data-action="remove" aria-label="Remove ${details.title} from playlist" title="Remove from playlist">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>
                </button>
            `;
            playlistItemsContainer.appendChild(itemEl);
        });
    }
    
    function updatePlaylistCount() {
        playlistCountEl.textContent = playlist.length;
        playlistCountEl.classList.toggle('hidden', playlist.length === 0);
    }

    function isInPlaylist(id, type) {
        return playlist.some(item => item.id === id && item.type === type);
    }

    function updateAddToPlaylistButton() {
        if (!currentRhyme) return;
        const inPlaylist = isInPlaylist(currentRhyme.id, 'rhyme');
        addToPlaylistBtn.innerHTML = inPlaylist 
            ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>`;
        addToPlaylistBtn.title = inPlaylist ? "Added to Playlist" : "Add to Playlist";
        addToPlaylistBtn.setAttribute('aria-label', inPlaylist ? "Remove from Playlist" : "Add to Playlist");
    }
    
    function triggerButtonAnimation(btn) {
        btn.classList.add('animate-pop');
        btn.addEventListener('animationend', () => {
            btn.classList.remove('animate-pop');
        }, { once: true });
    }

    function handleAddToPlaylist(e) {
        if (!currentRhyme) return;
        triggerButtonAnimation(e.currentTarget);
        const rhymeId = currentRhyme.id;
        const inPlaylist = isInPlaylist(rhymeId, 'rhyme');

        if (inPlaylist) {
            playlist = playlist.filter(item => !(item.id === rhymeId && item.type === 'rhyme'));
            showToast('Removed from playlist');
        } else {
            playlist.push({ type: 'rhyme', id: rhymeId });
            showToast('Added to playlist!');
        }
        
        localStorage.setItem('playlist', JSON.stringify(playlist));
        updatePlaylistCount();
        updateAddToPlaylistButton();
    }
    
    function handleAddToStoryPlaylist(e) {
        if (!currentStory) return;
        triggerButtonAnimation(e.currentTarget);
        const storyId = currentStory.id;
        const inPlaylist = isInPlaylist(storyId, 'story');

        if (inPlaylist) {
            playlist = playlist.filter(item => !(item.id === storyId && item.type === 'story'));
            showToast('Removed from playlist');
        } else {
            playlist.push({ type: 'story', id: storyId });
            showToast('Added to playlist!');
        }
        
        localStorage.setItem('playlist', JSON.stringify(playlist));
        updatePlaylistCount();
        updateAddToStoryPlaylistButton();
    }

    function updateAddToStoryPlaylistButton() {
        if (!currentStory) return;
        const inPlaylist = isInPlaylist(currentStory.id, 'story');
        addToStoryPlaylistBtn.innerHTML = inPlaylist 
            ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>`;
        addToStoryPlaylistBtn.title = inPlaylist ? "Added to Playlist" : "Add to Playlist";
        addToStoryPlaylistBtn.setAttribute('aria-label', inPlaylist ? "Remove from Playlist" : "Add to Playlist");
    }

    function clearPlaylist() {
        playlist = [];
        localStorage.setItem('playlist', JSON.stringify(playlist));
        updatePlaylistCount();
        displayPlaylist();
    }
    
    function handlePlaylistItemClick(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        
        const itemId = parseInt(target.dataset.itemId);
        const itemType = target.dataset.itemType;
        const action = target.dataset.action;

        if (action === 'play') {
            togglePlaylistView();
            const playlistIndex = playlist.findIndex(item => item.id === itemId && item.type === itemType);
            
            if (itemType === 'rhyme') {
                showRhymeDetail(itemId, true, playlistIndex);
            } else {
                showStoryDetail(itemId); // Playlist navigation doesn't apply to stories
            }
        } else if (action === 'remove') {
            playlist = playlist.filter(item => !(item.id === itemId && item.type === itemType));
            localStorage.setItem('playlist', JSON.stringify(playlist));
            updatePlaylistCount();
            displayPlaylist();
            // Also update the button on the detail page if it's currently viewed
            if (currentRhyme && currentRhyme.id === itemId && itemType === 'rhyme') {
                updateAddToPlaylistButton();
            }
            if (currentStory && currentStory.id === itemId && itemType === 'story') {
                updateAddToStoryPlaylistButton();
            }
        }
    }
    
    function updatePlaylistNav() {
        const rhymePlaylistItems = playlist.map((item, index) => ({...item, originalIndex: index}))
                                         .filter(item => item.type === 'rhyme');

        if (isPlaylistMode && rhymePlaylistItems.length > 0) {
            playlistNavButtons.classList.remove('hidden');
            
            const currentItemInRhymeList = rhymePlaylistItems.find(item => item.originalIndex === currentPlaylistIndex);
            const currentRhymeListIndex = currentItemInRhymeList ? rhymePlaylistItems.indexOf(currentItemInRhymeList) : -1;

            playlistPositionEl.textContent = `${currentRhymeListIndex + 1} / ${rhymePlaylistItems.length}`;
            prevRhymeBtn.disabled = currentRhymeListIndex <= 0;
            nextRhymeBtn.disabled = currentRhymeListIndex >= rhymePlaylistItems.length - 1;
        } else {
            playlistNavButtons.classList.add('hidden');
        }
    }
    
    function playNextRhyme() {
        const rhymePlaylistItems = playlist.map((item, index) => ({...item, originalIndex: index}))
                                         .filter(item => item.type === 'rhyme');
        const currentItemInRhymeList = rhymePlaylistItems.find(item => item.originalIndex === currentPlaylistIndex);
        const currentRhymeListIndex = rhymePlaylistItems.indexOf(currentItemInRhymeList);

        if (isPlaylistMode && currentRhymeListIndex < rhymePlaylistItems.length - 1) {
            const nextRhymeItem = rhymePlaylistItems[currentRhymeListIndex + 1];
            showRhymeDetail(nextRhymeItem.id, true, nextRhymeItem.originalIndex);
        }
    }

    function playPreviousRhyme() {
        const rhymePlaylistItems = playlist.map((item, index) => ({...item, originalIndex: index}))
                                         .filter(item => item.type === 'rhyme');
        const currentItemInRhymeList = rhymePlaylistItems.find(item => item.originalIndex === currentPlaylistIndex);
        const currentRhymeListIndex = rhymePlaylistItems.indexOf(currentItemInRhymeList);

        if (isPlaylistMode && currentRhymeListIndex > 0) {
            const prevRhymeItem = rhymePlaylistItems[currentRhymeListIndex - 1];
            showRhymeDetail(prevRhymeItem.id, true, prevRhymeItem.originalIndex);
        }
    }

    // --- FAVORITES FUNCTIONS ---
    function handleFavoriteClick(e) {
        if (!currentRhyme) return;
        triggerButtonAnimation(e.currentTarget);
        const rhymeId = currentRhyme.id;
        const favoriteIndex = favorites.indexOf(rhymeId);
        
        if (favoriteIndex > -1) {
            favorites.splice(favoriteIndex, 1);
        } else {
            favorites.push(rhymeId);
        }
        localStorage.setItem('favoriteRhymes', JSON.stringify(favorites));

        // Update button in detail view
        e.currentTarget.textContent = isFavorite(rhymeId) ? '❤️' : '🤍';
        
        // Update indicator in gallery view if it exists
        const rhymeCard = rhymeGrid.querySelector(`.rhyme-card[data-rhyme-id="${rhymeId}"] .favorite-indicator`);
        if (rhymeCard) {
            rhymeCard.textContent = isFavorite(rhymeId) ? '❤️' : '';
        }
    }

    function isFavorite(rhymeId) {
        return favorites.includes(rhymeId);
    }

    function handleFavoriteStoryClick() {
        if (!currentStory) return;
        triggerButtonAnimation(storyFavoriteBtn);
        const storyId = currentStory.id;
        const favoriteIndex = favoriteStories.indexOf(storyId);
        
        if (favoriteIndex > -1) {
            favoriteStories.splice(favoriteIndex, 1);
        } else {
            favoriteStories.push(storyId);
        }
        localStorage.setItem('favoriteStories', JSON.stringify(favoriteStories));

        // Update button in detail view
        storyFavoriteBtn.textContent = isFavoriteStory(storyId) ? '❤️' : '🤍';
        
        // Update indicator in gallery view if it exists
        const storyCard = storyGrid.querySelector(`.rhyme-card[data-story-id="${storyId}"] .favorite-indicator`);
        if (storyCard) {
            storyCard.textContent = isFavoriteStory(storyId) ? '❤️' : '';
        }
    }

    function isFavoriteStory(storyId) {
        return favoriteStories.includes(storyId);
    }

    // --- UTILITY FUNCTIONS ---
    function handlePrint() {
        document.body.classList.add('printing-rhyme');
        window.print();
        document.body.classList.remove('printing-rhyme');
    }

    function handleShare() {
        if (!currentRhyme) return;
        const shareUrl = `${window.location.origin}${window.location.pathname}?rhyme=${currentRhyme.id}`;
        const shareText = `Check out this rhyme: "${currentRhyme.title}"`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`;
        window.open(whatsappUrl, '_blank');
    }
    
    function handleScroll() {
        backToTopBtn.classList.toggle('show', window.scrollY > 300);
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- START THE APP ---
    init();

    // --- FOOTER YEAR ---
    const footerYear = document.getElementById('footer-year');
    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }
});
