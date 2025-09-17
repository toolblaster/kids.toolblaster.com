/**
 * =================================================================
 * COPYRIGHT & CONTENT POLICY
 * =================================================================
 * This website uses nursery rhyme text that is in the public domain.
 *
 * DO NOT ADD any content that may be copyrighted. This includes:
 * - Modern illustrations or images of rhymes from books or artists.
 * - Modern audio recordings or musical arrangements of rhymes.
 * - Any text or lyrics from modern songs or books.
 *
 * Only use classic, traditional versions of rhymes.
 * =================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- GLOBAL VARIABLES & ELEMENTS ---
    let allRhymes = [];
    let favorites = JSON.parse(localStorage.getItem('favoriteRhymes')) || [];
    let playlist = JSON.parse(localStorage.getItem('playlistRhymes')) || [];
    let currentRhyme = null;
    let isPlaylistMode = false;
    let currentPlaylistIndex = -1;

    const rhymeGrid = document.getElementById('rhyme-grid');
    const rhymeGalleryView = document.getElementById('rhyme-gallery');
    const rhymeDetailView = document.getElementById('rhyme-detail');
    const backButton = document.getElementById('back-button');
    const searchBar = document.getElementById('search-bar');
    const categoryFilters = document.getElementById('category-filters');
    const surpriseButton = document.getElementById('surprise-button');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIconLight = document.getElementById('theme-icon-light');
    const themeIconDark = document.getElementById('theme-icon-dark');
    const toastNotification = document.getElementById('toast-notification');
    const loadingIndicator = document.getElementById('loading-indicator');
    const controls = document.getElementById('controls');
    const backToTopBtn = document.getElementById('back-to-top-btn');

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


    // --- INITIALIZATION ---
    function init() {
        // Theme setup
        const isDarkMode = localStorage.getItem('theme') === 'dark';
        document.documentElement.classList.toggle('dark', isDarkMode);
        updateThemeIcon(isDarkMode);

        loadRhymes();
        addEventListeners();
        updatePlaylistCount();
    }

    // --- DATA HANDLING ---
    async function loadRhymes() {
        try {
            // Use Promise.all to fetch both JSON files concurrently
            const [publicResponse, exclusiveResponse] = await Promise.all([
                fetch('public_rhymes.json'),
                fetch('exclusive_rhymes.json')
            ]);

            if (!publicResponse.ok || !exclusiveResponse.ok) {
                throw new Error(`HTTP error! Status: ${publicResponse.status}, ${exclusiveResponse.status}`);
            }

            const publicRhymes = await publicResponse.json();
            const exclusiveRhymes = await exclusiveResponse.json();

            // Combine the two arrays into one master list
            allRhymes = [...publicRhymes, ...exclusiveRhymes];
            
            // Optional: Sort the combined array by ID to maintain order
            allRhymes.sort((a, b) => a.id - b.id);

            setTimeout(() => {
                 displayRhymeOfTheDay();
                 checkForSharedRhyme();
                 loadingIndicator.style.display = 'none';
            }, 500); // Simulate loading time

        } catch (error) {
            console.error("Could not fetch rhymes:", error);
            loadingIndicator.innerHTML = '<p class="text-red-500 text-center">Sorry, could not load the rhymes. Please try refreshing the page.</p>';
        }
    }

    // --- DEEP LINKING (for shared rhymes) ---
    function checkForSharedRhyme() {
        const urlParams = new URLSearchParams(window.location.search);
        const rhymeId = urlParams.get('rhyme');
        if (rhymeId && allRhymes.length > 0) {
            showRhymeDetail(parseInt(rhymeId));
        } else {
            displayRhymeGallery(allRhymes);
            updateActiveCategoryButton('All');
        }
    }

    // --- DISPLAY FUNCTIONS ---

    function displayRhymeGallery(rhymesToDisplay) {
        rhymeGrid.innerHTML = '';
        if (rhymesToDisplay.length === 0) {
            const activeButton = document.querySelector('.category-btn.active');
            let emptyMessage = '<p class="text-gray-500 dark:text-gray-400 col-span-full text-center">No rhymes found.</p>';
            
            // Check if the currently active filter is 'Favorites'
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

            // Check if the rhyme is new (released in the last 30 days)
            let newBadge = '';
            if (rhyme.releaseDate) {
                const releaseDate = new Date(rhyme.releaseDate);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                if (releaseDate > thirtyDaysAgo) {
                    newBadge = `<div class="new-badge">✨ New</div>`;
                }
            }

            card.innerHTML = `
                ${newBadge}
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

    function showRhymeDetail(rhymeId, fromPlaylist = false) {
        currentRhyme = allRhymes.find(r => r.id === rhymeId);
        if (!currentRhyme) return;

        isPlaylistMode = fromPlaylist;
        if(isPlaylistMode) {
            currentPlaylistIndex = playlist.indexOf(rhymeId);
        }

        // Populate details
        document.getElementById('rhyme-title-en').textContent = currentRhyme.title;
        document.getElementById('rhyme-lyrics-en').textContent = currentRhyme.lyrics;
        
        const titleHiEl = document.getElementById('rhyme-title-hi');
        const hindiColumn = document.getElementById('hindi-column');
        if (currentRhyme.title_hi && currentRhyme.lyrics_hi) {
            titleHiEl.textContent = currentRhyme.title_hi;
            document.getElementById('rhyme-lyrics-hi').textContent = currentRhyme.lyrics_hi;
            titleHiEl.classList.remove('hidden');
            hindiColumn.classList.remove('hidden');
        } else {
            titleHiEl.classList.add('hidden');
            hindiColumn.classList.add('hidden');
        }
        
        const favoriteBtn = document.getElementById('favorite-btn');
        favoriteBtn.textContent = isFavorite(rhymeId) ? '❤️' : '🤍';
        favoriteBtn.setAttribute('data-id', rhymeId);

        const funFactContainer = document.getElementById('fun-fact-container');
        const funFactDetails = document.getElementById('fun-fact-details');
        if (currentRhyme.funFact) {
            document.getElementById('fun-fact-text').textContent = currentRhyme.funFact;
            funFactContainer.classList.remove('hidden');
            funFactDetails.setAttribute('open', ''); // Open by default
        } else {
            funFactContainer.classList.add('hidden');
        }
        
        // Handle Copyright Notice based on the isExclusive flag
        const copyrightContainer = document.getElementById('copyright-notice-container');
        const copyrightText = document.getElementById('copyright-text');
        
        if (currentRhyme.isExclusive) {
            const currentYear = new Date().getFullYear();
            copyrightText.textContent = `© ${currentYear} Kids.Toolblaster.com. All Rights Reserved. This is an Original and Exclusive Rhyme 🎵`;
            copyrightContainer.classList.remove('hidden');
        } else {
            copyrightContainer.classList.add('hidden');
            copyrightText.textContent = '';
        }
        
        updateAddToPlaylistButton();
        updatePlaylistNav();
        
        // Switch views
        rhymeGalleryView.classList.add('hidden');
        controls.classList.add('hidden');
        document.getElementById('rhyme-of-the-day').classList.add('hidden');
        rhymeDetailView.classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    function goBackToGallery() {
        isPlaylistMode = false;
        currentPlaylistIndex = -1;
        updatePlaylistNav();

        rhymeDetailView.classList.add('hidden');
        rhymeGalleryView.classList.remove('hidden');
        controls.classList.remove('hidden');
        document.getElementById('rhyme-of-the-day').classList.remove('hidden');
        
        const url = new URL(window.location);
        url.searchParams.delete('rhyme');
        window.history.pushState({}, '', url);

        filterRhymes(); // Re-apply filters
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
            playlistItemsContainer.innerHTML = `<p class="text-center text-gray-500 dark:text-gray-400">Your playlist is empty. Add rhymes to see them here!</p>`;
            clearPlaylistBtn.disabled = true;
            return;
        }

        clearPlaylistBtn.disabled = false;
        const playlistRhymes = playlist.map(id => allRhymes.find(r => r.id === id)).filter(Boolean);

        playlistRhymes.forEach((rhyme) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700';
            itemEl.innerHTML = `
                <div class="flex items-center gap-3 cursor-pointer flex-grow" data-rhyme-id="${rhyme.id}" data-action="play">
                    <span class="text-2xl">${rhyme.icon || '🎶'}</span>
                    <span class="font-semibold text-brand-dark dark:text-white">${rhyme.title}</span>
                </div>
                <button class="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-800 text-red-500" data-rhyme-id="${rhyme.id}" data-action="remove" title="Remove from playlist">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>
                </button>
            `;
            playlistItemsContainer.appendChild(itemEl);
        });
    }

    // --- EVENT HANDLING & LOGIC ---

    function addEventListeners() {
        backButton.addEventListener('click', goBackToGallery);
        searchBar.addEventListener('input', handleSearchInput);
        categoryFilters.addEventListener('click', handleCategoryClick);
        surpriseButton.addEventListener('click', showRandomRhyme);
        themeToggle.addEventListener('click', toggleTheme);
        document.getElementById('favorite-btn').addEventListener('click', handleFavoriteClick);
        document.getElementById('print-btn').addEventListener('click', handlePrint);
        document.getElementById('share-whatsapp').addEventListener('click', () => handleShare('whatsapp'));
        document.getElementById('share-copy').addEventListener('click', () => handleShare('copy'));
        
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
    
    /**
     * Handles user input in the search bar. It resets the category filters to "All"
     * before applying the search query.
     */
    function handleSearchInput() {
        // If the user is searching, it's more intuitive to search through all rhymes.
        // This resets the UI to show that the "All" category is selected.
        updateActiveCategoryButton('All');
        
        // Now, apply the search filter.
        filterRhymes();
    }

    /**
     * Filters the rhymes displayed in the gallery based on the active category filter and the search term.
     * The function is triggered by user input in the search bar or by clicking a category button.
     */
    function filterRhymes() {
        const searchTerm = searchBar.value.toLowerCase();
        const activeButton = document.querySelector('.category-btn.active');
        
        // Start with the full list of rhymes
        let filtered = allRhymes;

        // 1. Apply the active category or tag filter first
        if (activeButton) {
            const category = activeButton.dataset.category;
            const tag = activeButton.dataset.tag;

            if (category) {
                if (category === 'All') {
                    // No filter needed, use all rhymes
                } else if (category === 'Favorites') {
                    // Filter to show only rhymes whose IDs are in the 'favorites' array
                    filtered = allRhymes.filter(rhyme => favorites.includes(rhyme.id));
                } else if (category === 'New') { 
                    // Special case for "New & Exclusive" button
                    filtered = allRhymes.filter(rhyme => rhyme.isExclusive);
                }
                else {
                    // Filter by the specific category (e.g., 'Animal', 'Classic')
                    filtered = allRhymes.filter(rhyme => rhyme.category === category);
                }
            } else if (tag) {
                // Filter by a specific tag (e.g., 'lullaby', 'silly')
                filtered = allRhymes.filter(rhyme => rhyme.tags && rhyme.tags.includes(tag));
            }
        }

        // 2. Apply the search term filter on the already-filtered list
        if (searchTerm) {
            filtered = filtered.filter(rhyme =>
                rhyme.title.toLowerCase().includes(searchTerm) ||
                rhyme.lyrics.toLowerCase().includes(searchTerm) ||
                (rhyme.title_hi && rhyme.title_hi.includes(searchTerm)) ||
                (rhyme.lyrics_hi && rhyme.lyrics_hi.includes(searchTerm))
            );
        }

        // 3. Display the final filtered list of rhymes
        displayRhymeGallery(filtered);
    }

    function handleCategoryClick(e) {
        const clickedButton = e.target.closest('.category-btn');
        if (clickedButton) {
            searchBar.value = '';
            
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            clickedButton.classList.add('active');
            
            filterRhymes();
        }
    }

    function updateActiveCategoryButton(categoryToActivate) {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === categoryToActivate);
        });
    }

    function showRandomRhyme() {
        const randomIndex = Math.floor(Math.random() * allRhymes.length);
        const randomRhyme = allRhymes[randomIndex];
        showRhymeDetail(randomRhyme.id);
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
    
    function updatePlaylistCount() {
        if (playlist.length > 0) {
            playlistCountEl.textContent = playlist.length;
            playlistCountEl.classList.remove('hidden');
        } else {
            playlistCountEl.classList.add('hidden');
        }
    }

    function isInPlaylist(rhymeId) {
        return playlist.includes(rhymeId);
    }

    function updateAddToPlaylistButton() {
        if (!currentRhyme) return;
        if (isInPlaylist(currentRhyme.id)) {
            addToPlaylistBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`;
            addToPlaylistBtn.title = "Added to Playlist";
        } else {
            addToPlaylistBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>`;
            addToPlaylistBtn.title = "Add to Playlist";
        }
    }

    function handleAddToPlaylist() {
        if (!currentRhyme) return;
        const rhymeId = currentRhyme.id;
        const playlistIndex = playlist.indexOf(rhymeId);

        if (playlistIndex > -1) {
            playlist.splice(playlistIndex, 1);
            showToast('Removed from playlist');
        } else {
            playlist.push(rhymeId);
            showToast('Added to playlist!');
        }
        
        localStorage.setItem('playlistRhymes', JSON.stringify(playlist));
        updatePlaylistCount();
        updateAddToPlaylistButton();
    }
    
    function clearPlaylist() {
        playlist = [];
        localStorage.setItem('playlistRhymes', JSON.stringify(playlist));
        updatePlaylistCount();
        displayPlaylist();
    }
    
    function handlePlaylistItemClick(e) {
        const target = e.target.closest('button[data-action="remove"], div[data-action="play"]');
        if (!target) return;
        
        const rhymeId = parseInt(target.dataset.rhymeId);
        const action = target.dataset.action;

        if (action === 'play') {
            togglePlaylistView();
            showRhymeDetail(rhymeId, true);
        } else if (action === 'remove') {
            playlist = playlist.filter(id => id !== rhymeId);
            localStorage.setItem('playlistRhymes', JSON.stringify(playlist));
            updatePlaylistCount();
            displayPlaylist();
        }
    }
    
    /**
     * Shows or hides the playlist navigation buttons (Previous/Next) when viewing a rhyme.
     * This is only active when a rhyme is viewed from the playlist.
     */
    function updatePlaylistNav() {
        // Check if we are in playlist mode and the playlist is not empty
        if (isPlaylistMode && playlist.length > 0) {
            playlistNavButtons.classList.remove('hidden');
            // Display current position, e.g., "1 / 5"
            playlistPositionEl.textContent = `${currentPlaylistIndex + 1} / ${playlist.length}`;
            // Disable 'Previous' button if it's the first rhyme
            prevRhymeBtn.disabled = currentPlaylistIndex === 0;
            // Disable 'Next' button if it's the last rhyme
            nextRhymeBtn.disabled = currentPlaylistIndex === playlist.length - 1;
        } else {
            // Hide navigation if not in playlist mode
            playlistNavButtons.classList.add('hidden');
        }
    }
    
    /**
     * Navigates to and displays the next rhyme in the playlist.
     */
    function playNextRhyme() {
        // Ensure we are in playlist mode and not at the end of the list
        if (isPlaylistMode && currentPlaylistIndex < playlist.length - 1) {
            currentPlaylistIndex++; // Move to the next index
            const nextRhymeId = playlist[currentPlaylistIndex];
            showRhymeDetail(nextRhymeId, true); // Show the rhyme detail view
        }
    }

    /**
     * Navigates to and displays the previous rhyme in the playlist.
     */
    function playPreviousRhyme() {
        // Ensure we are in playlist mode and not at the beginning of the list
        if (isPlaylistMode && currentPlaylistIndex > 0) {
            currentPlaylistIndex--; // Move to the previous index
            const prevRhymeId = playlist[currentPlaylistIndex];
            showRhymeDetail(prevRhymeId, true); // Show the rhyme detail view
        }
    }

    function handleFavoriteClick(e) {
        const rhymeId = parseInt(e.currentTarget.dataset.id);
        const favoriteIndex = favorites.indexOf(rhymeId);
        
        if (favoriteIndex > -1) {
            favorites.splice(favoriteIndex, 1);
            e.currentTarget.textContent = '🤍';
        } else {
            favorites.push(rhymeId);
            e.currentTarget.textContent = '❤️';
        }
        localStorage.setItem('favoriteRhymes', JSON.stringify(favorites));

        const rhymeCard = rhymeGrid.querySelector(`.rhyme-card[data-rhyme-id="${rhymeId}"]`);
        if (rhymeCard) {
            const favIndicator = rhymeCard.querySelector('.favorite-indicator');
            favIndicator.textContent = isFavorite(rhymeId) ? '❤️' : '';
        }
    }

    function isFavorite(rhymeId) {
        return favorites.includes(rhymeId);
    }

    function handlePrint() {
        document.body.classList.add('printing-rhyme');
        window.print();
        document.body.classList.remove('printing-rhyme');
    }

    function handleShare(platform) {
        if (!currentRhyme) return;
        const rhymeId = currentRhyme.id;
        const rhymeTitle = currentRhyme.title;
        const shareUrl = `${window.location.origin}${window.location.pathname}?rhyme=${rhymeId}`;
        const shareText = `Check out this rhyme from kids.toolblaster.com: "${rhymeTitle}"`;

        if (platform === 'whatsapp') {
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`;
            window.open(whatsappUrl, '_blank');
        } else { // 'copy'
            copyToClipboard(shareUrl);
            showToast('Link Copied!');
        }
    }
    
    function copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).catch(err => {
                 console.error('Failed to copy with navigator.clipboard: ', err);
                 fallbackCopyToClipboard(text);
            });
        } else {
           fallbackCopyToClipboard(text);
        }
    }

    function fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Fallback copy failed: ', err);
        }
        document.body.removeChild(textArea);
    }

    function showToast(message) {
        toastNotification.textContent = message;
        toastNotification.classList.add('show');
        setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 2500);
    }

    // --- BACK TO TOP FUNCTIONS ---
    function handleScroll() {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    }

    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // --- START THE APP ---
    init();
});
