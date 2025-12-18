/**
 * =================================================================
 * SCRIPT.JS - CRITICAL PATH ONLY
 * =================================================================
 * Handles: Data Fetching, Routing, Core Rendering, Navigation.
 * Defers: TTS, Playlists, Sharing, Fancy interactions (loaded in secondary.js)
 */

// Initialize Global Namespace to share state with secondary.js
window.TB = {
    allRhymes: [],
    allStories: [],
    allExclusiveRhymes: [],
    authors: {
        "Vikas Rana": {
            bio: "Vikas Rana is a passionate storyteller and creator based in the beautiful hills of Dharamshala. He loves crafting imaginative tales and catchy rhymes that spark curiosity and joy in young readers. He believes in the power of simple words to create magical worlds for children. When he's not writing, he enjoys exploring nature and sipping on a warm cup of chai.",
            image: "https://placehold.co/150x150/E34037/FFFFFF?text=VR",
            x_profile: "https://x.com/Vikasrana03"
        }
    },
    currentRhymeList: [],
    favorites: JSON.parse(localStorage.getItem('favoriteRhymes')) || [],
    favoriteStories: JSON.parse(localStorage.getItem('favoriteStories')) || [],
    playlist: JSON.parse(localStorage.getItem('playlist')) || [],
    currentRhyme: null,
    currentStory: null,
    isPlaylistMode: false,
    currentPlaylistIndex: -1
};

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTORS (Critical) ---
    const loadingIndicator = document.getElementById('loading-indicator');
    const rhymeGalleryView = document.getElementById('rhyme-gallery');
    const storyGalleryView = document.getElementById('story-gallery');
    const rhymeDetailView = document.getElementById('rhyme-detail');
    const storyDetailView = document.getElementById('story-detail');
    const legalView = document.getElementById('legal-view');
    const comingSoonView = document.getElementById('coming-soon-view');
    const authorDetailView = document.getElementById('author-detail');
    const rhymeOfTheDaySection = document.getElementById('rhyme-of-the-day');
    const rhymeGrid = document.getElementById('rhyme-grid');
    const storyGrid = document.getElementById('story-grid');
    const controlsSection = document.getElementById('controls-section');
    const rhymeControls = document.getElementById('rhyme-controls');
    const storyControls = document.getElementById('story-controls');
    const searchBar = document.getElementById('search-bar');
    const storySearchBar = document.getElementById('story-search-bar');
    const footerYear = document.getElementById('footer-year');

    // --- INITIALIZATION ---
    function init() {
        if (footerYear) footerYear.textContent = new Date().getFullYear();
        loadAllData();
        addBasicEventListeners();
    }

    // --- DATA HANDLING ---
    async function fetchWithRetry(url, retries = 3, delay = 500) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; 
                } else {
                    throw error; 
                }
            }
        }
    }

    async function loadAllData() {
        try {
            // UPDATED PATHS: Pointing to the new 'data/' folder
            const [rhymesPublic, rhymesExclusive, stories] = await Promise.all([
                fetchWithRetry('data/public_rhymes.json'),
                fetchWithRetry('data/exclusive_rhymes.json'),
                fetchWithRetry('data/short_stories.json')
            ]);

            window.TB.allExclusiveRhymes = rhymesExclusive;
            window.TB.allStories = stories;

            const currentDate = new Date();
            const filteredExclusiveRhymes = window.TB.allExclusiveRhymes.filter(rhyme => {
                if (rhyme.releaseDate) return new Date(rhyme.releaseDate) <= currentDate;
                return true;
            });

            window.TB.allRhymes = [...rhymesPublic, ...filteredExclusiveRhymes].sort((a, b) => a.id - b.id);
            
            handleUrlParams();
            loadingIndicator.style.display = 'none';

            // --- CRITICAL STEP: Load Secondary Script Now ---
            loadSecondaryScript();

        } catch (error) {
            console.error("Could not fetch data:", error);
            loadingIndicator.innerHTML = '<p class="text-red-500 text-center font-body">Sorry, could not load content. Refresh?</p>';
        }
    }

    function loadSecondaryScript() {
        const script = document.createElement('script');
        script.src = 'js/secondary.js';
        script.defer = true;
        document.body.appendChild(script);
    }

    // --- VIEW MANAGEMENT ---
    window.TB.hideAllViews = function() {
        rhymeGalleryView.classList.add('hidden');
        storyGalleryView.classList.add('hidden');
        rhymeDetailView.classList.add('hidden');
        storyDetailView.classList.add('hidden');
        legalView.classList.add('hidden');
        comingSoonView.classList.add('hidden');
        authorDetailView.classList.add('hidden');
        rhymeOfTheDaySection.classList.add('hidden');
        controlsSection.classList.add('hidden');
        rhymeControls.classList.add('hidden');
        storyControls.classList.add('hidden');
        // Stop reading if TTS is active (will be handled by secondary if loaded)
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    }

    window.TB.showMainView = function(viewName) {
        window.TB.hideAllViews();
        controlsSection.classList.remove('hidden');
        resetMetaTags();
 
        if (viewName === 'Stories' || viewName === 'StoryFavorites') {
            storyGalleryView.classList.remove('hidden');
            storyControls.classList.remove('hidden');
            
            let storiesToDisplay;
            if (viewName === 'StoryFavorites') {
                storiesToDisplay = window.TB.allStories.filter(s => window.TB.favoriteStories.includes(s.id));
            } else { 
                storiesToDisplay = window.TB.allStories.filter(story => !story.releaseDate || new Date(story.releaseDate) <= new Date());
            }
            window.TB.displayStoryGallery(storiesToDisplay);
        } else { // Rhymes
            rhymeGalleryView.classList.remove('hidden');
            rhymeControls.classList.remove('hidden');
            rhymeOfTheDaySection.classList.remove('hidden');
            
            let rhymesToDisplay;
            if (viewName === 'Favorites') {
                rhymesToDisplay = window.TB.allRhymes.filter(r => window.TB.favorites.includes(r.id));
            } else if (viewName === 'Lullaby') {
                rhymesToDisplay = window.TB.allRhymes.filter(r => r.tags && r.tags.includes('lullaby'));
            } else if (['Animal', 'Learning', 'Classic', 'Indian'].includes(viewName)) {
                rhymesToDisplay = window.TB.allRhymes.filter(r => r.category === viewName);
            } else {
                rhymesToDisplay = window.TB.allRhymes;
            }
            
            window.TB.displayRhymeGallery(rhymesToDisplay);
            displayRhymeOfTheDay();
        }
    }

    function showLegalView() {
        window.TB.hideAllViews();
        legalView.classList.remove('hidden');
        updateMetaTags("Contact & Legal - Kids Rhymes", "Contact info and legal disclaimers.", 'https://kids.toolblaster.com/?page=legal');
        updateUrl({ page: 'legal' });
        window.scrollTo(0, 0);
    }

    function showComingSoonView() {
        window.TB.hideAllViews();
        comingSoonView.classList.remove('hidden');
        updateMetaTags("Coming Soon! - Kids Rhymes", "See what is coming soon.", 'https://kids.toolblaster.com/?page=coming-soon');
        updateUrl({ page: 'coming-soon' });
        window.scrollTo(0, 0);
        
        // Populate lists (Logic kept here as it's simple rendering)
        const comingSoonRhymesList = document.getElementById('coming-soon-rhymes-list');
        const comingSoonStoriesList = document.getElementById('coming-soon-stories-list');
        const currentDate = new Date();
        const upcomingRhymes = window.TB.allExclusiveRhymes.filter(r => r.releaseDate && new Date(r.releaseDate) > currentDate).sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
        const upcomingStories = window.TB.allStories.filter(s => s.releaseDate && new Date(s.releaseDate) > currentDate).sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
        
        const createItem = (item, type) => {
            const date = new Date(item.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            return `<div class="flex items-center p-4 bg-gray-50 rounded-lg shadow-sm border-l-4 ${type === 'Story' ? 'border-blue-500' : 'border-green-500'}">
                <div class="text-4xl mr-4">${item.icon || (type === 'Rhyme' ? '🎵' : '📚')}</div>
                <div class="flex-grow"><h3 class="text-base font-bold text-brand-dark">${item.title}</h3><p class="text-sm text-gray-600 font-body">Coming on: <span class="font-semibold">${date}</span></p></div>
            </div>`;
        };
        comingSoonRhymesList.innerHTML = upcomingRhymes.length ? upcomingRhymes.map(r => createItem(r, 'Rhyme')).join('') : '<p class="text-gray-500">No new rhymes scheduled.</p>';
        comingSoonStoriesList.innerHTML = upcomingStories.length ? upcomingStories.map(s => createItem(s, 'Story')).join('') : '<p class="text-gray-500">No new stories scheduled.</p>';
    }

    function goHome() {
        searchBar.value = '';
        storySearchBar.value = '';
        window.TB.isPlaylistMode = false;
        window.TB.currentPlaylistIndex = -1;
        updateActiveCategoryButton('Rhymes');
        resetMetaTags();
        window.TB.showMainView('Rhymes');
        updateUrl({ category: 'Rhymes' });
    }

    function goBackToGallery() {
        window.TB.isPlaylistMode = false;
        const activeCategory = document.querySelector('.main-nav-btn.active')?.dataset.category || 'Rhymes';
        resetMetaTags();
        window.TB.showMainView(activeCategory);
        updateUrl({ category: activeCategory });
    }

    // --- DISPLAY LOGIC (RHYMES) ---
    window.TB.displayRhymeGallery = function(rhymes) {
        window.TB.currentRhymeList = rhymes;
        rhymeGrid.innerHTML = '';
        if (rhymes.length === 0) {
            rhymeGrid.innerHTML = '<p class="text-gray-500 col-span-full text-center font-body">No rhymes found.</p>';
            return;
        }
        rhymes.forEach(rhyme => {
            const card = document.createElement('div');
            card.className = 'rhyme-card bg-white rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300 flex flex-col p-4 text-center relative';
            card.innerHTML = `
                <div class="flex-grow flex flex-col items-center justify-center">
                    <div class="text-5xl mb-2">${rhyme.icon || '🎵'}</div>
                    <h3 class="text-sm font-bold text-brand-dark">${rhyme.title}</h3>
                </div>
                <div class="absolute top-2 right-2 text-xl favorite-indicator">${window.TB.favorites.includes(rhyme.id) ? '❤️' : ''}</div>
            `;
            card.addEventListener('click', () => window.TB.showRhymeDetail(rhyme.id));
            rhymeGrid.appendChild(card);
        });
    }

    window.TB.showRhymeDetail = function(rhymeId, fromPlaylist = false, playlistIndex = -1) {
        window.TB.currentRhyme = window.TB.allRhymes.find(r => r.id === rhymeId);
        if (!window.TB.currentRhyme) return;
        window.TB.currentStory = null;
        window.TB.hideAllViews();
        rhymeDetailView.classList.remove('hidden');

        // SEO
        const rhymeUrl = `https://kids.toolblaster.com/?rhyme=${rhymeId}`;
        updateMetaTags(`${window.TB.currentRhyme.title} - Kids Rhymes`, `Read ${window.TB.currentRhyme.title} nursery rhyme.`, rhymeUrl);
        updateUrl({ rhyme: rhymeId });
        
        // Reset Interactive State
        window.TB.isPlaylistMode = fromPlaylist;
        window.TB.currentPlaylistIndex = fromPlaylist ? playlistIndex : -1;
        
        // Render Text
        document.getElementById('rhyme-title-en').textContent = window.TB.currentRhyme.title;
        document.getElementById('rhyme-lyrics-en').textContent = window.TB.currentRhyme.lyrics;
        const titleHi = document.getElementById('rhyme-title-hi');
        const hindiCol = document.getElementById('hindi-column');
        if (window.TB.currentRhyme.title_hi) {
            titleHi.textContent = window.TB.currentRhyme.title_hi;
            document.getElementById('rhyme-lyrics-hi').textContent = window.TB.currentRhyme.lyrics_hi;
            hindiCol.classList.remove('hidden');
        } else {
            titleHi.textContent = '';
            hindiCol.classList.add('hidden');
        }

        // Render Badges/Facts
        const learning = document.getElementById('learning-focus-badge-container');
        if (window.TB.currentRhyme.learningFocus) {
            document.getElementById('learning-focus-badge').textContent = `Focus: ${window.TB.currentRhyme.learningFocus}`;
            learning.classList.remove('hidden');
        } else { learning.classList.add('hidden'); }

        const funFact = document.getElementById('fun-fact-container');
        if (window.TB.currentRhyme.funFact) {
            document.getElementById('fun-fact-text').textContent = window.TB.currentRhyme.funFact;
            funFact.classList.remove('hidden');
        } else { funFact.classList.add('hidden'); }

        const copyText = document.getElementById('copyright-text');
        copyText.textContent = window.TB.currentRhyme.isExclusive ? `Copyright © ${new Date().getFullYear()} kids.toolblaster.com. Original Rhyme 🎵` : `Public Domain Content`;
        document.getElementById('copyright-notice-container').classList.remove('hidden');

        // Heart Icon (Use loaded state)
        const favBtn = document.getElementById('favorite-btn');
        favBtn.innerHTML = window.TB.favorites.includes(rhymeId) ? '❤️' : '🤍';
        
        // Navigation buttons state
        const listToUse = window.TB.currentRhymeList.find(r => r.id === rhymeId) ? window.TB.currentRhymeList : window.TB.allRhymes;
        const idx = listToUse.findIndex(r => r.id === rhymeId);
        document.getElementById('previous-detail-rhyme-btn').disabled = idx <= 0;
        document.getElementById('next-detail-rhyme-btn').disabled = idx >= listToUse.length - 1;

        // Reset TTS Button if secondary is loaded
        if (window.TB.updateReadAloudButton) window.TB.updateReadAloudButton(document.getElementById('read-aloud-btn-rhyme'), false);
        // Update Playlist UI if secondary is loaded
        if (window.TB.updateAddToPlaylistButton) window.TB.updateAddToPlaylistButton();
        if (window.TB.updatePlaylistNav) window.TB.updatePlaylistNav();

        window.scrollTo(0, 0);
    }

    // --- DISPLAY LOGIC (STORIES) ---
    window.TB.displayStoryGallery = function(stories) {
        storyGrid.innerHTML = '';
        if (stories.length === 0) {
            storyGrid.innerHTML = '<p class="text-gray-500 col-span-full text-center font-body">No stories found.</p>';
            return;
        }
        stories.forEach(story => {
            const card = document.createElement('div');
            card.className = 'story-card bg-white rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300 flex flex-col p-4 text-center relative';
            card.innerHTML = `
                <div class="flex-grow flex flex-col items-center justify-center">
                    <div class="text-5xl mb-2">${story.icon || '📚'}</div>
                    <h3 class="text-sm font-bold text-brand-dark">${story.title}</h3>
                    <p class="text-sm text-gray-500 mt-1 font-body">by ${story.author}</p>
                </div>
                <div class="absolute top-2 right-2 text-xl favorite-indicator">${window.TB.favoriteStories.includes(story.id) ? '❤️' : ''}</div>
            `;
            card.addEventListener('click', () => window.TB.showStoryDetail(story.id));
            storyGrid.appendChild(card);
        });
    }

    window.TB.showStoryDetail = function(storyId, fromPlaylist = false, playlistIndex = -1) {
        window.TB.currentStory = window.TB.allStories.find(s => s.id === storyId);
        if (!window.TB.currentStory) return;
        window.TB.currentRhyme = null;
        window.TB.hideAllViews();
        storyDetailView.classList.remove('hidden');

        // SEO
        const url = `https://kids.toolblaster.com/?story=${storyId}`;
        updateMetaTags(`${window.TB.currentStory.title}`, `Read ${window.TB.currentStory.title}.`, url);
        updateUrl({ story: storyId });

        window.TB.isPlaylistMode = fromPlaylist;
        window.TB.currentPlaylistIndex = fromPlaylist ? playlistIndex : -1;

        // Render
        document.getElementById('story-title').textContent = window.TB.currentStory.title;
        const authorLink = document.getElementById('story-author-link');
        authorLink.textContent = window.TB.currentStory.author;
        authorLink.dataset.author = window.TB.currentStory.author;
        document.getElementById('story-read-time').textContent = window.TB.currentStory.readTime;
        
        // English Content
        const contentEl = document.getElementById('story-content');
        contentEl.innerHTML = window.TB.currentStory.content.map(p => `<p>${p}</p>`).join('');

        // Hindi Content
        const titleHi = document.getElementById('story-title-hi');
        const hiContainer = document.getElementById('story-content-hi-container');
        if (window.TB.currentStory.title_hi) {
            titleHi.textContent = window.TB.currentStory.title_hi;
            document.getElementById('story-content-hi').innerHTML = window.TB.currentStory.content_hi.map(p => `<p>${p}</p>`).join('');
            hiContainer.classList.remove('hidden');
        } else {
            titleHi.textContent = '';
            hiContainer.classList.add('hidden');
        }

        // Moral
        const moralDiv = document.getElementById('story-moral-container');
        if (window.TB.currentStory.moral) {
            document.getElementById('story-moral').textContent = window.TB.currentStory.moral;
            if(window.TB.currentStory.moral_hi) document.getElementById('story-moral-hi').textContent = window.TB.currentStory.moral_hi;
            moralDiv.classList.remove('hidden');
        } else { moralDiv.classList.add('hidden'); }

        document.getElementById('story-copyright-text').textContent = `Copyright © ${new Date().getFullYear()} kids.toolblaster.com. Original Story 📚`;
        document.getElementById('story-copyright-notice-container').classList.remove('hidden');

        // Nav Buttons
        const availStories = window.TB.allStories.filter(s => !s.releaseDate || new Date(s.releaseDate) <= new Date());
        const idx = availStories.findIndex(s => s.id === storyId);
        document.getElementById('previous-detail-story-btn').disabled = idx <= 0;
        document.getElementById('next-detail-story-btn').disabled = idx >= availStories.length - 1;

        // Heart Icon
        document.getElementById('story-favorite-btn').innerHTML = window.TB.favoriteStories.includes(storyId) ? '❤️' : '🤍';

        // Secondary UI updates
        if (window.TB.updateReadAloudButton) window.TB.updateReadAloudButton(document.getElementById('read-aloud-btn-story'), false);
        if (window.TB.updateAddToStoryPlaylistButton) window.TB.updateAddToStoryPlaylistButton();
        if (window.TB.updatePlaylistNav) window.TB.updatePlaylistNav();

        window.scrollTo(0, 0);
    }

    function showAuthorDetail(authorName) {
        const author = window.TB.authors[authorName];
        if (!author) return window.TB.showMainView('Stories');
        window.TB.hideAllViews();
        authorDetailView.classList.remove('hidden');
        
        document.getElementById('author-name').textContent = authorName;
        document.getElementById('author-bio').textContent = author.bio;
        document.getElementById('author-image').src = author.image;
        if (author.x_profile) {
             const link = document.getElementById('author-social-link');
             link.href = author.x_profile;
             link.classList.remove('hidden');
        }
        updateUrl({ author: authorName });
    }

    function displayRhymeOfTheDay() {
        // Simple algo: Day of year % number of rhymes
        const day = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        const rhyme = window.TB.allRhymes[day % window.TB.allRhymes.length];
        if (!rhyme) return;
        document.getElementById('rotd-icon').textContent = rhyme.icon || '🎵';
        document.getElementById('rotd-title').textContent = rhyme.title;
        document.getElementById('rotd-card').onclick = () => window.TB.showRhymeDetail(rhyme.id);
    }

    // --- BASIC EVENT LISTENERS (Navigation Only) ---
    function addBasicEventListeners() {
        document.getElementById('home-button').addEventListener('click', goHome);
        document.getElementById('back-button').addEventListener('click', goBackToGallery);
        document.getElementById('story-back-button').addEventListener('click', goBackToGallery);
        document.getElementById('legal-back-button').addEventListener('click', goHome);
        document.getElementById('author-back-button').addEventListener('click', () => {window.TB.showMainView('Stories'); updateUrl({category:'Stories'});});
        
        document.getElementById('legal-link').addEventListener('click', (e) => { e.preventDefault(); showLegalView(); });
        document.getElementById('coming-soon-link').addEventListener('click', (e) => { e.preventDefault(); showComingSoonView(); });
        document.getElementById('coming-soon-back-button').addEventListener('click', goHome);

        // Search logic can live here
        searchBar.addEventListener('input', () => {
             const val = searchBar.value.toLowerCase();
             window.TB.displayRhymeGallery(window.TB.allRhymes.filter(r => r.title.toLowerCase().includes(val) || r.lyrics.toLowerCase().includes(val)));
        });
        storySearchBar.addEventListener('input', () => {
             const val = storySearchBar.value.toLowerCase();
             const stories = window.TB.allStories.filter(s => !s.releaseDate || new Date(s.releaseDate) <= new Date());
             window.TB.displayStoryGallery(stories.filter(s => s.title.toLowerCase().includes(val) || s.content.join(' ').toLowerCase().includes(val)));
        });

        // Category clicks
        const handleCat = (e) => {
            const btn = e.target.closest('.category-btn');
            if (btn) {
                const cat = btn.dataset.category;
                updateActiveCategoryButton(cat);
                window.TB.showMainView(cat);
                updateUrl({ category: cat });
            }
        };
        document.getElementById('main-navigation').addEventListener('click', handleCat);
        document.getElementById('category-filters').addEventListener('click', handleCat);
        document.getElementById('story-category-filters').addEventListener('click', handleCat);

        // Detail Nav
        document.getElementById('previous-detail-rhyme-btn').addEventListener('click', () => navigateDetail('rhyme', -1));
        document.getElementById('next-detail-rhyme-btn').addEventListener('click', () => navigateDetail('rhyme', 1));
        document.getElementById('previous-detail-story-btn').addEventListener('click', () => navigateDetail('story', -1));
        document.getElementById('next-detail-story-btn').addEventListener('click', () => navigateDetail('story', 1));

        document.getElementById('story-author-link').addEventListener('click', (e) => {
            e.preventDefault(); showAuthorDetail(e.target.dataset.author);
        });
    }

    function navigateDetail(type, dir) {
        if (type === 'rhyme') {
            const list = window.TB.currentRhymeList.length ? window.TB.currentRhymeList : window.TB.allRhymes;
            const idx = list.findIndex(r => r.id === window.TB.currentRhyme.id) + dir;
            if(idx >= 0 && idx < list.length) window.TB.showRhymeDetail(list[idx].id);
        } else {
            const list = window.TB.allStories.filter(s => !s.releaseDate || new Date(s.releaseDate) <= new Date());
            const idx = list.findIndex(s => s.id === window.TB.currentStory.id) + dir;
            if(idx >= 0 && idx < list.length) window.TB.showStoryDetail(list[idx].id);
        }
    }

    // --- HELPERS ---
    function updateActiveCategoryButton(cat) {
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.category-btn[data-category="${cat}"]`);
        if (activeBtn && !activeBtn.closest('#main-navigation')) activeBtn.classList.add('active');
        const isStory = ['Stories', 'StoryFavorites'].includes(cat);
        document.querySelector('.main-nav-btn[data-category="Stories"]').classList.toggle('active', isStory);
        document.querySelector('.main-nav-btn[data-category="Rhymes"]').classList.toggle('active', !isStory);
    }

    // SEO Helper
    const origTitle = document.title;
    const origDesc = document.querySelector('meta[name="description"]').getAttribute('content');
    
    // Updated robust meta tag updater
    function updateMetaTags(t, d, url) {
        document.title = t;
        const descMeta = document.querySelector('meta[name="description"]');
        if (descMeta) descMeta.setAttribute('content', d);
        
        const ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl) ogUrl.setAttribute('content', url);
        
        // Critical fix for Canonical Tag robustness
        let link = document.querySelector('link[rel="canonical"]');
        if (!link) {
            link = document.createElement('link');
            link.rel = 'canonical';
            document.head.appendChild(link);
        }
        link.setAttribute('href', url);
    }
    
    function resetMetaTags() { updateMetaTags(origTitle, origDesc, 'https://kids.toolblaster.com/'); }
    
    function updateUrl(params) {
        const url = new URL(window.location);
        url.search = '';
        let isDetail = false;
        for (const k in params) { if(params[k]) { url.searchParams.set(k, params[k]); if(['rhyme','story','page','author'].includes(k)) isDetail=true; } }
        window.history.pushState({}, '', url);
        // Explicitly update canonical here as well for good measure
        const canonicalUrl = isDetail ? url.href : 'https://kids.toolblaster.com/';
        updateMetaTags(isDetail ? document.title : origTitle, isDetail ? document.querySelector('meta[name="description"]').getAttribute('content') : origDesc, canonicalUrl);
    }

    function handleUrlParams() {
        const p = new URLSearchParams(window.location.search);
        if (p.get('rhyme')) window.TB.showRhymeDetail(parseInt(p.get('rhyme')));
        else if (p.get('story')) window.TB.showStoryDetail(parseInt(p.get('story')));
        else if (p.get('author')) showAuthorDetail(p.get('author'));
        else if (p.get('page') === 'legal') showLegalView();
        else if (p.get('page') === 'coming-soon') showComingSoonView();
        else if (p.get('category')) { updateActiveCategoryButton(p.get('category')); window.TB.showMainView(p.get('category')); }
        else { resetMetaTags(); window.TB.showMainView('Rhymes'); }
    }
    
    // Helper to be used by Secondary JS
    window.TB.showToast = function(msg) {
        const t = document.getElementById('toast-notification');
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 2500);
    };

    // Initialize Main Script
    init();
});
