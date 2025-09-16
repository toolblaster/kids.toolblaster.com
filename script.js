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
    let playlist = JSON.parse(localStorage.getItem('playlist')) || [];
    let currentRhyme = null;
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

    // Playlist elements
    const playlistToggleBtn = document.getElementById('playlist-toggle-btn');
    const playlistView = document.getElementById('playlist-view');
    const closePlaylistBtn = document.getElementById('close-playlist-btn');
    const playlistItems = document.getElementById('playlist-items');
    const clearPlaylistBtn = document.getElementById('clear-playlist-btn');
    const addToPlaylistBtn = document.getElementById('add-to-playlist-btn');
    const playlistCount = document.getElementById('playlist-count');
    const playlistNavButtons = document.getElementById('playlist-nav-buttons');
    const prevRhymeBtn = document.getElementById('prev-rhyme-btn');
    const nextRhymeBtn = document.getElementById('next-rhyme-btn');
    const playlistPosition = document.getElementById('playlist-position');


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
            const response = await fetch('updated_rhymes.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            allRhymes = await response.json();
            
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
            rhymeGrid.innerHTML = '<p class="text-gray-500 dark:text-gray-400 col-span-full text-center">No rhymes found.</p>';
            return;
        }
        rhymesToDisplay.forEach(rhyme => {
            const card = document.createElement('div');
            card.className = 'rhyme-card bg-white dark:bg-gray-800 rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300 flex flex-col p-4 text-center relative';
            card.dataset.rhymeId = rhyme.id;

            let learningTag = '';
            if (rhyme.category === 'Learning' && rhyme.learningFocus) {
                learningTag = `<div class="learning-focus-tag">Focus: ${rhyme.learningFocus}</div>`;
            }

            card.innerHTML = `
                <div class="flex-grow flex flex-col items-center justify-center">
                    <div class="text-5xl mb-2">${rhyme.icon || '🎶'}</div>
                    <h3 class="text-lg font-bold text-brand-dark dark:text-white">${rhyme.title}</h3>
                </div>
                ${learningTag}
                <div class="absolute top-2 right-2 text-xl favorite-indicator">${isFavorite(rhyme.id) ? '❤️' : ''}</div>
            `;
            card.addEventListener('click', () => {
                hidePlaylistNav();
                showRhymeDetail(rhyme.id);
            });
            rhymeGrid.appendChild(card);
        });
    }

    function showRhymeDetail(rhymeId) {
        currentRhyme = allRhymes.find(r => r.id === rhymeId);
        if (!currentRhyme) return;

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
        
        // Switch views
        rhymeGalleryView.classList.add('hidden');
        controls.classList.add('hidden');
        document.getElementById('rhyme-of-the-day').classList.add('hidden');
        rhymeDetailView.classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    function goBackToGallery() {
        rhymeDetailView.classList.add('hidden');
        rhymeGalleryView.classList.remove('hidden');
        controls.classList.remove('hidden');
        document.getElementById('rhyme-of-the-day').classList.remove('hidden');
        hidePlaylistNav();
        
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
        document.getElementById('rotd-card').addEventListener('click', () => {
            hidePlaylistNav();
            showRhymeDetail(rhyme.id);
        });
    }


    // --- EVENT HANDLING & LOGIC ---

    function addEventListeners() {
        backButton.addEventListener('click', goBackToGallery);
        searchBar.addEventListener('input', filterRhymes);
        categoryFilters.addEventListener('click', handleCategoryClick);
        surpriseButton.addEventListener('click', showRandomRhyme);
        themeToggle.addEventListener('click', toggleTheme);
        document.getElementById('favorite-btn').addEventListener('click', handleFavoriteClick);
        document.getElementById('print-btn').addEventListener('click', handlePrint);
        document.getElementById('share-whatsapp').addEventListener('click', () => handleShare('whatsapp'));
        document.getElementById('share-instagram').addEventListener('click', () => handleShare('instagram'));
        document.getElementById('share-copy').addEventListener('click', () => handleShare('copy'));
        
        // Playlist Listeners
        playlistToggleBtn.addEventListener('click', togglePlaylistView);
        closePlaylistBtn.addEventListener('click', togglePlaylistView);
        clearPlaylistBtn.addEventListener('click', clearPlaylist);
        addToPlaylistBtn.addEventListener('click', handleAddToPlaylist);
        playlistItems.addEventListener('click', handlePlaylistItemClick);
        prevRhymeBtn.addEventListener('click', playPreviousFromPlaylist);
        nextRhymeBtn.addEventListener('click', playNextFromPlaylist);

        // Back to Top Listeners
        window.addEventListener('scroll', handleScroll);
        backToTopBtn.addEventListener('click', scrollToTop);
    }
    
    function filterRhymes() {
        const searchTerm = searchBar.value.toLowerCase();
        const activeButton = document.querySelector('.category-btn.active');
        
        let filtered = allRhymes;

        if (activeButton) {
            const category = activeButton.dataset.category;
            const tag = activeButton.dataset.tag;

            if (category) {
                if (category === 'All') {
                    // No filter needed
                } else if (category === 'Favorites') {
                    filtered = allRhymes.filter(rhyme => favorites.includes(rhyme.id));
                } else {
                    filtered = allRhymes.filter(rhyme => rhyme.category === category);
                }
            } else if (tag) {
                filtered = allRhymes.filter(rhyme => rhyme.tags && rhyme.tags.includes(tag));
            }
        }

        // Filter by Search Term
        if (searchTerm) {
            filtered = filtered.filter(rhyme =>
                rhyme.title.toLowerCase().includes(searchTerm) ||
                rhyme.lyrics.toLowerCase().includes(searchTerm) ||
                (rhyme.title_hi && rhyme.title_hi.includes(searchTerm)) ||
                (rhyme.lyrics_hi && rhyme.lyrics_hi.includes(searchTerm))
            );
        }

        displayRhymeGallery(filtered);
    }

    function handleCategoryClick(e) {
        const clickedButton = e.target.closest('.category-btn');
        if (clickedButton) {
            searchBar.value = '';
            
            // Deactivate all buttons first
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Activate the clicked one
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
        hidePlaylistNav();
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
        } else if (platform === 'instagram') {
            copyToClipboard(shareUrl);
            showToast('Link copied! Paste it in your Instagram story.');
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
    
    // --- PLAYLIST FUNCTIONS ---
    
    function togglePlaylistView() {
        playlistView.classList.toggle('hidden');
        if (!playlistView.classList.contains('hidden')) {
            displayPlaylist();
        }
    }
    
    function updatePlaylistCount() {
        if (playlist.length > 0) {
            playlistCount.textContent = playlist.length;
            playlistCount.classList.remove('hidden');
        } else {
            playlistCount.classList.add('hidden');
        }
        clearPlaylistBtn.disabled = playlist.length === 0;
    }
    
    function handleAddToPlaylist() {
        if (!currentRhyme) return;
        const rhymeId = currentRhyme.id;
        if (playlist.includes(rhymeId)) {
            showToast('Already in your playlist!');
        } else {
            playlist.push(rhymeId);
            localStorage.setItem('playlist', JSON.stringify(playlist));
            updatePlaylistCount();
            showToast('Added to playlist!');
        }
    }
    
    function displayPlaylist() {
        playlistItems.innerHTML = '';
        if (playlist.length === 0) {
            playlistItems.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center">Your playlist is empty.</p>';
            return;
        }
        
        playlist.forEach(rhymeId => {
            const rhyme = allRhymes.find(r => r.id === rhymeId);
            if (rhyme) {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700';
                item.innerHTML = `
                    <div class="flex items-center gap-3 cursor-pointer play-rhyme-from-playlist" data-id="${rhyme.id}">
                        <span class="text-2xl">${rhyme.icon || '🎶'}</span>
                        <span class="font-semibold text-brand-dark dark:text-white">${rhyme.title}</span>
                    </div>
                    <button class="remove-from-playlist-btn text-red-500 hover:text-red-700 p-1" data-id="${rhyme.id}" title="Remove">
                        &times;
                    </button>
                `;
                playlistItems.appendChild(item);
            }
        });
    }
    
    function handlePlaylistItemClick(e) {
        const playBtn = e.target.closest('.play-rhyme-from-playlist');
        const removeBtn = e.target.closest('.remove-from-playlist-btn');
        
        if (playBtn) {
            const rhymeId = parseInt(playBtn.dataset.id);
            currentPlaylistIndex = playlist.indexOf(rhymeId);
            showRhymeDetail(rhymeId);
            showPlaylistNav();
            togglePlaylistView();
        }
        
        if (removeBtn) {
            const rhymeId = parseInt(removeBtn.dataset.id);
            const indexToRemove = playlist.indexOf(rhymeId);
            if (indexToRemove > -1) {
                playlist.splice(indexToRemove, 1);
                localStorage.setItem('playlist', JSON.stringify(playlist));
                updatePlaylistCount();
                displayPlaylist(); // Re-render the list
            }
        }
    }
    
    function clearPlaylist() {
        playlist = [];
        localStorage.removeItem('playlist');
        updatePlaylistCount();
        displayPlaylist();
    }
    
    function showPlaylistNav() {
        playlistNavButtons.classList.remove('hidden');
        playlistPosition.textContent = `${currentPlaylistIndex + 1} / ${playlist.length}`;
        prevRhymeBtn.disabled = currentPlaylistIndex === 0;
        nextRhymeBtn.disabled = currentPlaylistIndex === playlist.length - 1;
    }
    
    function hidePlaylistNav() {
        playlistNavButtons.classList.add('hidden');
        currentPlaylistIndex = -1;
    }
    
    function playNextFromPlaylist() {
        if (currentPlaylistIndex < playlist.length - 1) {
            currentPlaylistIndex++;
            showRhymeDetail(playlist[currentPlaylistIndex]);
            showPlaylistNav();
        }
    }
    
    function playPreviousFromPlaylist() {
         if (currentPlaylistIndex > 0) {
            currentPlaylistIndex--;
            showRhymeDetail(playlist[currentPlaylistIndex]);
            showPlaylistNav();
        }
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
