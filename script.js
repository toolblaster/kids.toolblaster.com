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
    let allExclusiveRhymes = [];
    const authors = {
        "Vikas Rana": {
            bio: "Vikas Rana is a passionate storyteller and creator based in the beautiful hills of Dharamshala. He loves crafting imaginative tales and catchy rhymes that spark curiosity and joy in young readers. He believes in the power of simple words to create magical worlds for children. When he's not writing, he enjoys exploring nature and sipping on a warm cup of chai.",
            image: "https://placehold.co/150x150/E34037/FFFFFF?text=VR", // Placeholder image
            x_profile: "https://x.com/Vikasrana03"
        }
    };

    let currentRhymeList = [];
    let favorites = JSON.parse(localStorage.getItem('favoriteRhymes')) || [];
    let favoriteStories = JSON.parse(localStorage.getItem('favoriteStories')) || [];
    let playlist = JSON.parse(localStorage.getItem('playlist')) || [];
    
    let currentRhyme = null;
    let currentStory = null;

    let isPlaylistMode = false;
    let currentPlaylistIndex = -1;
    const originalTitle = document.title;
    let utterance = null;
    let isReading = false;
    let englishVoice = null;
    let hindiVoice = null;

    // --- ELEMENT SELECTORS ---
    const loadingIndicator = document.getElementById('loading-indicator');
    const homeButton = document.getElementById('home-button');
    
    // Main Views
    const rhymeGalleryView = document.getElementById('rhyme-gallery');
    const storyGalleryView = document.getElementById('story-gallery');
    const rhymeDetailView = document.getElementById('rhyme-detail');
    const storyDetailView = document.getElementById('story-detail');
    const legalView = document.getElementById('legal-view');
    const comingSoonView = document.getElementById('coming-soon-view');
    const authorDetailView = document.getElementById('author-detail');
    const rhymeOfTheDaySection = document.getElementById('rhyme-of-the-day');

    // Grids & Content Holders
    const rhymeGrid = document.getElementById('rhyme-grid');
    const storyGrid = document.getElementById('story-grid');
    const comingSoonRhymesList = document.getElementById('coming-soon-rhymes-list');
    const comingSoonStoriesList = document.getElementById('coming-soon-stories-list');
    const authorStoriesGrid = document.getElementById('author-stories-grid');


    // Controls
    const controlsSection = document.getElementById('controls-section');
    const rhymeControls = document.getElementById('rhyme-controls');
    const storyControls = document.getElementById('story-controls');
    const searchBar = document.getElementById('search-bar');
    const storySearchBar = document.getElementById('story-search-bar');
    const categoryFilters = document.getElementById('category-filters');
    const storyCategoryFilters = document.getElementById('story-category-filters');
    const surpriseButton = document.getElementById('surprise-button');
    const storySurpriseButton = document.getElementById('story-surprise-button');
    const backToTopBtn = document.getElementById('back-to-top-btn');

    // Rhyme Detail Elements
    const backButton = document.getElementById('back-button');
    const favoriteBtn = document.getElementById('favorite-btn');
    const previousDetailRhymeBtn = document.getElementById('previous-detail-rhyme-btn');
    const nextDetailRhymeBtn = document.getElementById('next-detail-rhyme-btn');
    const readAloudRhymeBtn = document.getElementById('read-aloud-btn-rhyme');
    const shareRhymeBtn = document.getElementById('share-rhyme-btn');
    const printRhymeBtn = document.getElementById('print-rhyme-btn');

    // Story Detail Elements
    const storyBackButton = document.getElementById('story-back-button');
    const storyFavoriteBtn = document.getElementById('story-favorite-btn');
    const addToStoryPlaylistBtn = document.getElementById('add-to-story-playlist-btn');
    const previousDetailStoryBtn = document.getElementById('previous-detail-story-btn');
    const nextDetailStoryBtn = document.getElementById('next-detail-story-btn');
    const readAloudStoryBtn = document.getElementById('read-aloud-btn-story');
    const shareStoryBtn = document.getElementById('share-story-btn');
    const printStoryBtn = document.getElementById('print-story-btn');
    const storyAuthorContainer = document.getElementById('story-author-container');
    
    // Legal & Coming Soon Page Elements
    const legalLink = document.getElementById('legal-link');
    const legalBackButton = document.getElementById('legal-back-button');
    const comingSoonLink = document.getElementById('coming-soon-link');
    const comingSoonBackButton = document.getElementById('coming-soon-back-button');
    
    // Author Page Elements
    const authorBackButton = document.getElementById('author-back-button');


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
    
    const storyPlaylistNavButtons = document.getElementById('story-playlist-nav-buttons');
    const prevStoryBtn = document.getElementById('prev-story-btn');
    const nextStoryBtn = document.getElementById('next-story-btn');
    const storyPlaylistPositionEl = document.getElementById('story-playlist-position');

    // Toast Notification
    const toastNotification = document.getElementById('toast-notification');
    
    // Footer Share
    const footerShareLink = document.getElementById('footer-share-link');

    // --- SEO HELPER FUNCTIONS ---
    // Store original meta information
    const originalDefaultTitle = document.title;
    const originalDefaultDescription = document.querySelector('meta[name="description"]').getAttribute('content');
    const originalDefaultCanonical = document.querySelector('link[rel="canonical"]').getAttribute('href');

    /**
     * Updates the page's meta tags for SEO.
     * @param {string} title - The new title for the page.
     * @param {string} description - The new meta description.
     * @param {string} canonicalUrl - The new canonical URL.
     */
    function updateMetaTags(title, description, canonicalUrl) {
        document.title = title;
        
        let metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', description);
        } else {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            metaDesc.setAttribute('content', description);
            document.head.appendChild(metaDesc);
        }

        // REMOVED: Canonical link setting is now handled by updateUrl()
        /*
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (canonicalLink) {
            canonicalLink.setAttribute('href', canonicalUrl);
        } else {
            canonicalLink = document.createElement('link');
            canonicalLink.setAttribute('rel', 'canonical');
            canonicalLink.setAttribute('href', canonicalUrl);
            document.head.appendChild(canonicalLink);
        }
        */

        // Update Open Graph (Facebook) tags
        document.querySelector('meta[property="og:title"]').setAttribute('content', title);
        document.querySelector('meta[property="og:description"]').setAttribute('content', description);
        document.querySelector('meta[property="og:url"]').setAttribute('content', canonicalUrl);
        
        // Update Twitter tags
        document.querySelector('meta[property="twitter:title"]').setAttribute('content', title);
        document.querySelector('meta[property="twitter:description"]').setAttribute('content', description);
        document.querySelector('meta[property="twitter:url"]').setAttribute('content', canonicalUrl);
    }

    /**
     * Resets the meta tags to the homepage defaults.
     */
    function resetMetaTags() {
        updateMetaTags(originalDefaultTitle, originalDefaultDescription, originalDefaultCanonical);
        updateJsonLd(null); // Clear item-specific schema
    }


    // --- INITIALIZATION ---
    function init() {
        loadAllData();
        addEventListeners();
        updatePlaylistCount();
    }

    // --- DATA HANDLING ---
    async function fetchWithRetry(url, retries = 3, delay = 500) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.warn(`Attempt ${i + 1} failed for ${url}. Retrying in ${delay}ms...`, error);
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff
                } else {
                    throw error; // Rethrow the last error
                }
            }
        }
    }

    async function loadAllData() {
        try {
            const [rhymesPublic, rhymesExclusive, stories] = await Promise.all([
                fetchWithRetry('public_rhymes.json'),
                fetchWithRetry('exclusive_rhymes.json'),
                fetchWithRetry('short_stories.json')
            ]);

            allExclusiveRhymes = rhymesExclusive;
            allStories = stories;

            const currentDate = new Date();
            const filteredExclusiveRhymes = allExclusiveRhymes.filter(rhyme => {
                if (rhyme.releaseDate) {
                    const releaseDate = new Date(rhyme.releaseDate);
                    return releaseDate <= currentDate;
                }
                return true;
            });

            allRhymes = [...rhymesPublic, ...filteredExclusiveRhymes].sort((a, b) => a.id - b.id);
            
            handleUrlParams();
            loadingIndicator.style.display = 'none';

        } catch (error) {
            console.error("Could not fetch data after multiple retries:", error);
            loadingIndicator.innerHTML = '<p class="text-red-500 text-center font-body">Sorry, could not load content. Please check your internet connection and try refreshing the page.</p>';
        }
    }

    // --- URL & NAVIGATION HANDLING ---
    function handleUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const rhymeId = urlParams.get('rhyme');
        const storyId = urlParams.get('story');
        const authorName = urlParams.get('author');
        const category = urlParams.get('category');
        const page = urlParams.get('page');

        if (rhymeId) {
            showRhymeDetail(parseInt(rhymeId));
        } else if (storyId) {
            showStoryDetail(parseInt(storyId));
        } else if (authorName) {
            showAuthorDetail(authorName);
        } else if (page === 'legal') {
            showLegalView();
        } else if (page === 'coming-soon') {
            showComingSoonView();
        } else if (category) {
            updateActiveCategoryButton(category);
            showMainView(category);
        } else {
            resetMetaTags(); // Ensure homepage tags are set on initial load
            showMainView('Rhymes');
        }
    }
    
    /**
     * =================================================================
     * UPDATED FUNCTION: updateUrl
     * =================================================================
     * This function now correctly sets the canonical tag.
     * 1. It checks if the new URL is for a specific, unique page
     * (like a single rhyme, story, or the legal page).
     * 2. If it IS a unique page, it sets the canonical URL to that
     * page's specific URL (e.g., /?rhyme=1).
     * 3. If it is NOT a unique page (e.g., it's a category filter like
     * ?category=Animal), it correctly sets the canonical URL
     * to point back to the homepage (https://kids.toolblaster.com/).
     * * This resolves the "Alternate page with proper canonical tag" error.
     * =================================================================
     */
    function updateUrl(params) {
        const url = new URL(window.location);
        url.search = ''; // Clear existing params
        let isDetailPage = false; // Flag to check if it's a detail page
    
        // Build the URL and check if it's a detail page
        for (const key in params) {
            if (params[key]) {
                url.searchParams.set(key, params[key]);
                // These keys indicate a specific, canonical page
                if (key === 'rhyme' || key === 'story' || key === 'page' || key === 'author') {
                    isDetailPage = true;
                }
            }
        }
    
        // Update the browser history
        window.history.pushState({}, '', url);
    
        // NEW LOGIC: Set canonical URL based on page type
        // If it's a detail page, the canonical URL is its own URL.
        // If it's NOT (i.e., it's a category/gallery page), the canonical URL is the homepage.
        const canonicalUrl = isDetailPage ? url.href : 'https://kids.toolblaster.com/';
        updateCanonicalUrl(canonicalUrl);
    }

    function updateCanonicalUrl(url) {
        // This function is now called by updateUrl()
        let link = document.querySelector("link[rel='canonical']");
        if (link) {
            link.setAttribute('href', url);
        }
    }
    
    function updateJsonLd(item, type) {
        const existingSchema = document.getElementById('item-schema');
        if (existingSchema) {
            existingSchema.remove();
        }

        if (!item) return;

        const schema = {
            "@context": "https://schema.org",
            "mainEntityOfPage": { "@type": "WebPage", "@id": window.location.href },
            "headline": item.title,
            "publisher": { "@type": "Organization", "name": "kids.toolblaster.com" }
        };

        if (type === 'rhyme') {
            schema["@type"] = "CreativeWork";
            schema["text"] = item.lyrics;
            schema["author"] = { "@type": "Person", "name": "Traditional" };
            if (!item.isExclusive) {
                schema["license"] = "https://creativecommons.org/publicdomain/mark/1.0/";
                schema["citation"] = "Based on a traditional public domain nursery rhyme.";
            } else {
                 schema["copyrightHolder"] = { "@type": "Organization", "name": "kids.toolblaster.com" };
                 schema["copyrightYear"] = new Date().getFullYear();
            }
        } else if (type === 'story') {
            schema["@type"] = "ShortStory";
            schema["text"] = item.content.join("\n\n");
            schema["author"] = { "@type": "Person", "name": item.author };
            schema["copyrightHolder"] = { "@type": "Organization", "name": "kids.toolblaster.com" };
            schema["copyrightYear"] = new Date().getFullYear();
        } else if (type === 'author') {
            schema["@type"] = "ProfilePage";
            schema["about"] = {
                "@type": "Person",
                "name": item.name,
                "description": item.bio
            };
        }

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'item-schema';
        script.text = JSON.stringify(schema, null, 2);
        document.head.appendChild(script);
    }

    // --- VIEW MANAGEMENT ---
    function hideAllViews() {
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
        stopReading();
    }

    function showMainView(viewName) {
        hideAllViews();
        controlsSection.classList.remove('hidden');
        resetMetaTags(); // Reset tags to homepage defaults
 
        if (viewName === 'Stories' || viewName === 'StoryFavorites') {
            storyGalleryView.classList.remove('hidden');
            storyControls.classList.remove('hidden');
            
            let storiesToDisplay;
            if (viewName === 'StoryFavorites') {
                storiesToDisplay = allStories.filter(s => isFavoriteStory(s.id));
            } else { // 'Stories'
                storiesToDisplay = allStories.filter(story => !story.releaseDate || new Date(story.releaseDate) <= new Date());
            }
            displayStoryGallery(storiesToDisplay);
        } else { // Rhymes and all its categories
            rhymeGalleryView.classList.remove('hidden');
            rhymeControls.classList.remove('hidden');
            rhymeOfTheDaySection.classList.remove('hidden');
            
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

    function showLegalView() {
        hideAllViews();
        legalView.classList.remove('hidden');
        const legalUrl = 'https://kids.toolblaster.com/?page=legal';
        updateMetaTags(
            "Contact & Legal - Kids Rhymes & Stories",
            "Contact information and legal disclaimers for kids.toolblaster.com.",
            legalUrl
        );
        updateUrl({ page: 'legal' }); // This updates the browser history
        window.scrollTo(0, 0);
    }

    function showComingSoonView() {
        hideAllViews();
        comingSoonView.classList.remove('hidden');
        const comingSoonUrl = 'https://kids.toolblaster.com/?page=coming-soon';
        updateMetaTags(
            "Coming Soon! - Kids Rhymes & Stories",
            "See what new rhymes and stories are coming soon to kids.toolblaster.com.",
            comingSoonUrl
        );
        updateUrl({ page: 'coming-soon' }); // This updates the browser history
        window.scrollTo(0, 0);
    
        const currentDate = new Date();
    
        const upcomingRhymes = allExclusiveRhymes
            .filter(rhyme => rhyme.releaseDate && new Date(rhyme.releaseDate) > currentDate)
            .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
    
        const upcomingStories = allStories
            .filter(story => story.releaseDate && new Date(story.releaseDate) > currentDate)
            .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
    
        comingSoonRhymesList.innerHTML = '';
        comingSoonStoriesList.innerHTML = '';
    
        const createItemElement = (item, type) => {
            const releaseDate = new Date(item.releaseDate);
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            const formattedDate = releaseDate.toLocaleDateString('en-US', options);
            const itemEl = document.createElement('div');
            const borderColorClass = type === 'Story' ? 'border-blue-500' : 'border-green-500';
            itemEl.className = `flex items-center p-4 bg-gray-50 rounded-lg shadow-sm border-l-4 ${borderColorClass}`;
            itemEl.innerHTML = `
                <div class="text-4xl mr-4">${item.icon || (type === 'Rhyme' ? '🎵' : '📚')}</div>
                <div class="flex-grow">
                    <h3 class="text-base font-bold text-brand-dark">${item.title}</h3>
                    <p class="text-sm text-gray-600 font-body">Coming on: <span class="font-semibold">${formattedDate}</span></p>
                </div>
            `;
            return itemEl;
        };
    
        if (upcomingRhymes.length > 0) {
            upcomingRhymes.forEach(rhyme => {
                comingSoonRhymesList.appendChild(createItemElement(rhyme, 'Rhyme'));
            });
        } else {
            comingSoonRhymesList.innerHTML = `<p class="text-center text-gray-600 font-body p-4 bg-gray-50 rounded-lg">No new rhymes scheduled right now.</p>`;
        }
    
        if (upcomingStories.length > 0) {
            upcomingStories.forEach(story => {
                comingSoonStoriesList.appendChild(createItemElement(story, 'Story'));
            });
        } else {
            comingSoonStoriesList.innerHTML = `<p class="text-center text-gray-600 font-body p-4 bg-gray-50 rounded-lg">No new stories scheduled right now.</p>`;
        }
    }

    function goHome() {
        searchBar.value = '';
        storySearchBar.value = '';
        isPlaylistMode = false;
        currentPlaylistIndex = -1;
        updateActiveCategoryButton('Rhymes');
        resetMetaTags();
        showMainView('Rhymes');
        updateUrl({ category: 'Rhymes' });
    }

    function goBackToGallery() {
        isPlaylistMode = false;
        currentPlaylistIndex = -1;
        const activeCategory = document.querySelector('.main-nav-btn.active').dataset.category || 'Rhymes';
        resetMetaTags();
        showMainView(activeCategory);
        updateUrl({ category: activeCategory });
    }

    function goBackToStoryGalleryFromAuthor() {
        resetMetaTags();
        showMainView('Stories');
        updateUrl({ category: 'Stories' });
    }

    // --- DISPLAY FUNCTIONS (RHYMES) ---
    function displayRhymeGallery(rhymesToDisplay) {
        currentRhymeList = rhymesToDisplay;
        rhymeGrid.innerHTML = '';
        if (rhymesToDisplay.length === 0) {
            const activeButton = document.querySelector('#category-filters .category-btn.active');
            let emptyMessage = '<p class="text-gray-500 col-span-full text-center font-body">No rhymes found for your search.</p>';
            
            if (activeButton && activeButton.dataset.category === 'Favorites') {
                emptyMessage = `
                    <div class="col-span-full text-center p-6 bg-gray-50 rounded-lg">
                        <div class="text-4xl mb-2">❤️</div>
                        <h3 class="text-lg font-bold text-brand-dark">Your Favorites is Empty</h3>
                        <p class="text-gray-500 mt-1 font-body">Click the white heart on any rhyme to add it here!</p>
                    </div>
                `;
            }
            rhymeGrid.innerHTML = emptyMessage;
            return;
        }
        rhymesToDisplay.forEach(rhyme => {
            const card = document.createElement('div');
            card.className = 'rhyme-card bg-white rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300 flex flex-col p-4 text-center relative';
            card.dataset.rhymeId = rhyme.id;
            
            const isNew = rhyme.isExclusive;
            const newBadge = isNew ? '<div class="absolute top-1 left-1 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">NEW</div>' : '';
            const favoriteIndicator = isFavorite(rhyme.id) ? '❤️' : '';
            
            card.innerHTML = `
                ${newBadge}
                <div class="flex-grow flex flex-col items-center justify-center">
                    <div class="text-5xl mb-2">${rhyme.icon || '🎵'}</div>
                    <h3 class="text-sm font-bold text-brand-dark">${rhyme.title}</h3>
                </div>
                <div class="absolute top-2 right-2 text-xl favorite-indicator">${favoriteIndicator}</div>
            `;
            card.addEventListener('click', () => showRhymeDetail(rhyme.id));
            rhymeGrid.appendChild(card);
        });
    }

    function showRhymeDetail(rhymeId, fromPlaylist = false, playlistIndex = -1) {
        currentRhyme = allRhymes.find(r => r.id === rhymeId);
        if (!currentRhyme) return;

        currentStory = null; 
        
        hideAllViews();
        rhymeDetailView.classList.remove('hidden');

        // --- DYNAMIC SEO UPDATE ---
        const rhymeUrl = `https://kids.toolblaster.com/?rhyme=${rhymeId}`;
        const rhymeDescription = `Read the ${currentRhyme.title} nursery rhyme in English ${currentRhyme.lyrics_hi ? 'and Hindi' : ''}. ${currentRhyme.funFact || ''}`.substring(0, 160);
        updateMetaTags(
            `${currentRhyme.title} - Kids Rhymes`,
            rhymeDescription,
            rhymeUrl
        );
        updateUrl({ rhyme: rhymeId }); // This updates the browser history
        updateJsonLd(currentRhyme, 'rhyme');
        
        stopReading();
        updateReadAloudButton(readAloudRhymeBtn);

        isPlaylistMode = fromPlaylist;
        currentPlaylistIndex = fromPlaylist ? playlistIndex : -1;

        document.getElementById('rhyme-title-en').textContent = currentRhyme.title;
        document.getElementById('rhyme-lyrics-en').textContent = currentRhyme.lyrics;
        
        const titleHiEl = document.getElementById('rhyme-title-hi');
        const hindiColumn = document.getElementById('hindi-column');
        if (currentRhyme.title_hi && currentRhyme.lyrics_hi) {
            titleHiEl.textContent = currentRhyme.title_hi;
            document.getElementById('rhyme-lyrics-hi').textContent = currentRhyme.lyrics_hi;
            hindiColumn.classList.remove('hidden');
        } else {
            titleHiEl.textContent = '';
            document.getElementById('rhyme-lyrics-hi').textContent = '';
            hindiColumn.classList.add('hidden');
        }
        
        const learningFocusContainer = document.getElementById('learning-focus-badge-container');
        if (currentRhyme.learningFocus) {
            document.getElementById('learning-focus-badge').textContent = `Focus: ${currentRhyme.learningFocus}`;
            learningFocusContainer.classList.remove('hidden');
        } else {
            learningFocusContainer.classList.add('hidden');
        }

        favoriteBtn.innerHTML = isFavorite(rhymeId) ? '❤️' : '🤍';
        favoriteBtn.setAttribute('data-id', rhymeId);

        const funFactContainer = document.getElementById('fun-fact-container');
        const funFactDetails = document.getElementById('fun-fact-details');
        if (currentRhyme.funFact) {
            document.getElementById('fun-fact-text').textContent = currentRhyme.funFact;
            funFactContainer.classList.remove('hidden');
            funFactDetails.removeAttribute('open');
        } else {
            funFactContainer.classList.add('hidden');
        }
        
        const copyrightContainer = document.getElementById('copyright-notice-container');
        const copyrightText = document.getElementById('copyright-text');
        copyrightContainer.classList.remove('hidden');
        
        if (currentRhyme.isExclusive) {
             copyrightText.textContent = `Copyright © ${new Date().getFullYear()} kids.toolblaster.com. This is an Original and Exclusive Rhyme 🎵`;
        } else {
            copyrightText.textContent = `This content is in the public domain.`;
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
            let emptyMessage = '<p class="text-gray-500 col-span-full text-center font-body">No stories found for your search.</p>';

            if (activeButton && activeButton.dataset.category === 'StoryFavorites') {
                 emptyMessage = `
                    <div class="col-span-full text-center p-6 bg-gray-50 rounded-lg">
                        <div class="text-4xl mb-2">❤️</div>
                        <h3 class="text-lg font-bold text-brand-dark">Your Favorite Stories is Empty</h3>
                        <p class="text-gray-500 mt-1 font-body">Click the white heart on any story to add it here!</p>
                    </div>
                `;
            }
             storyGrid.innerHTML = emptyMessage;
            return;
        }
        storiesToDisplay.forEach(story => {
            const card = document.createElement('div');
            card.className = 'story-card bg-white rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300 flex flex-col p-4 text-center relative';
            card.dataset.storyId = story.id;
            
            const newBadge = '<div class="absolute top-1 left-1 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">NEW</div>';
            const favoriteIndicator = isFavoriteStory(story.id) ? '❤️' : '';

            card.innerHTML = `
                ${newBadge}
                <div class="flex-grow flex flex-col items-center justify-center">
                    <div class="text-5xl mb-2">${story.icon || '📚'}</div>
                    <h3 class="text-sm font-bold text-brand-dark">${story.title}</h3>
                    <p class="text-sm text-gray-500 mt-1 font-body">by ${story.author}</p>
                </div>
                <div class="absolute top-2 right-2 text-xl favorite-indicator">${favoriteIndicator}</div>
            `;
            card.addEventListener('click', () => showStoryDetail(story.id));
            storyGrid.appendChild(card);
        });
    }

    function showStoryDetail(storyId, fromPlaylist = false, playlistIndex = -1) {
        currentStory = allStories.find(s => s.id === storyId);
        if (!currentStory) return;
        
        currentRhyme = null;

        hideAllViews();
        storyDetailView.classList.remove('hidden');

        // --- DYNAMIC SEO UPDATE ---
        const storyUrl = `https://kids.toolblaster.com/?story=${storyId}`;
        // Use the story summary for the description, truncate to 160 chars
        const storyDescription = currentStory.summary ? currentStory.summary.substring(0, 160) : `Read the short story "${currentStory.title}" by ${currentStory.author}.`;
        updateMetaTags(
            `${currentStory.title} - Kids Stories`,
            storyDescription,
            storyUrl
        );
        updateUrl({ story: storyId }); // This updates the browser history
        updateJsonLd(currentStory, 'story');
        
        stopReading();
        updateReadAloudButton(readAloudStoryBtn);
        
        isPlaylistMode = fromPlaylist;
        currentPlaylistIndex = fromPlaylist ? playlistIndex : -1;

        document.getElementById('story-title').textContent = currentStory.title;
        const storyAuthorLink = document.getElementById('story-author-link');
        storyAuthorLink.textContent = currentStory.author;
        storyAuthorLink.dataset.author = currentStory.author;
        document.getElementById('story-read-time').textContent = currentStory.readTime;
        
        const storyContentEl = document.getElementById('story-content');
        storyContentEl.innerHTML = '';
        currentStory.content.forEach(paragraph => {
            const p = document.createElement('p');
            p.textContent = paragraph.trim();
            storyContentEl.appendChild(p);
        });

        const storyTitleHiEl = document.getElementById('story-title-hi');
        const storyContentHiContainer = document.getElementById('story-content-hi-container');
        const storyContentHiEl = document.getElementById('story-content-hi');
        
        if (currentStory.title_hi && currentStory.content_hi) {
            storyTitleHiEl.textContent = currentStory.title_hi;
            storyContentHiEl.innerHTML = '';
            currentStory.content_hi.forEach(paragraph => {
                const p = document.createElement('p');
                p.textContent = paragraph.trim();
                storyContentHiEl.appendChild(p);
            });
            storyContentHiContainer.classList.remove('hidden');
        } else {
            storyTitleHiEl.textContent = '';
            storyContentHiContainer.classList.add('hidden');
        }

        const moralContainer = document.getElementById('story-moral-container');
        const moralHiContainer = document.getElementById('story-moral-hi').parentElement;
        if (currentStory.moral) {
            document.getElementById('story-moral').textContent = currentStory.moral;
            if (currentStory.moral_hi) {
                document.getElementById('story-moral-hi').textContent = currentStory.moral_hi;
                moralHiContainer.classList.remove('hidden');
            } else {
                moralHiContainer.classList.add('hidden');
            }
            moralContainer.classList.remove('hidden');
        } else {
            moralContainer.classList.add('hidden');
        }

        const storyCopyrightContainer = document.getElementById('story-copyright-notice-container');
        const storyCopyrightText = document.getElementById('story-copyright-text');
        storyCopyrightText.textContent = `Copyright © ${new Date().getFullYear()} kids.toolblaster.com. This is an Original and Exclusive Story 📚`;
        storyCopyrightContainer.classList.remove('hidden');
        
        const availableStories = allStories.filter(story => !story.releaseDate || new Date(story.releaseDate) <= new Date());
        const currentIndex = availableStories.findIndex(s => s.id === currentStory.id);
        previousDetailStoryBtn.disabled = currentIndex <= 0;
        nextDetailStoryBtn.disabled = currentIndex >= availableStories.length - 1;

        storyFavoriteBtn.innerHTML = isFavoriteStory(storyId) ? '❤️' : '🤍';
        updateAddToStoryPlaylistButton();
        
        updatePlaylistNav();
        window.scrollTo(0, 0);
    }
    
    // --- DISPLAY FUNCTIONS (AUTHOR) ---
    function showAuthorDetail(authorName) {
        const authorData = authors[authorName];
        if (!authorData) {
            goBackToStoryGalleryFromAuthor(); // Or show a 'not found' message
            return;
        }

        hideAllViews();
        authorDetailView.classList.remove('hidden');
        
        // --- DYNAMIC SEO UPDATE ---
        const authorUrl = `https://kids.toolblaster.com/?author=${encodeURIComponent(authorName)}`;
        const authorDescription = `Read original stories by ${authorName}. ${authorData.bio}`.substring(0, 160);
        updateMetaTags(
            `${authorName} - Author Profile`,
            authorDescription,
            authorUrl
        );
        updateUrl({ author: authorName }); // This updates the browser history
        updateJsonLd({ name: authorName, ...authorData }, 'author');

        document.getElementById('author-name').textContent = authorName;
        document.getElementById('author-bio').textContent = authorData.bio;
        document.getElementById('author-image').src = authorData.image;
        document.getElementById('author-image').alt = `A photo of ${authorName}`;

        const authorSocialLink = document.getElementById('author-social-link');
        if (authorData.x_profile) {
            authorSocialLink.href = authorData.x_profile;
            authorSocialLink.classList.remove('hidden');
        } else {
            authorSocialLink.classList.add('hidden');
        }

        window.scrollTo(0, 0);
    }


    function displayRhymeOfTheDay() {
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const rhyme = allRhymes[dayOfYear % allRhymes.length];
        if (!rhyme) return;

        document.getElementById('rotd-icon').textContent = rhyme.icon || '🎵';
        document.getElementById('rotd-title').textContent = rhyme.title;
        document.getElementById('rotd-card').addEventListener('click', () => showRhymeDetail(rhyme.id));
    }
    
    // --- EVENT HANDLING & LOGIC ---
    function addEventListeners() {
        homeButton.addEventListener('click', goHome);
        backButton.addEventListener('click', goBackToGallery);
        storyBackButton.addEventListener('click', goBackToGallery);
        legalBackButton.addEventListener('click', goHome);
        authorBackButton.addEventListener('click', goBackToStoryGalleryFromAuthor);
        
        legalLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLegalView();
        });
        comingSoonLink.addEventListener('click', (e) => {
            e.preventDefault();
            showComingSoonView();
        });
        comingSoonBackButton.addEventListener('click', goHome);

        searchBar.addEventListener('input', handleSearchInput);
        storySearchBar.addEventListener('input', handleStorySearchInput);
        document.getElementById('main-navigation').addEventListener('click', handleCategoryClick);
        categoryFilters.addEventListener('click', handleCategoryClick);
        storyCategoryFilters.addEventListener('click', handleCategoryClick);
        surpriseButton.addEventListener('click', showRandomRhyme);
        storySurpriseButton.addEventListener('click', showRandomStory);
        previousDetailRhymeBtn.addEventListener('click', showPreviousRhyme);
        nextDetailRhymeBtn.addEventListener('click', showNextRhyme);
        previousDetailStoryBtn.addEventListener('click', showPreviousStory);
        nextDetailStoryBtn.addEventListener('click', showNextStory);
        favoriteBtn.addEventListener('click', handleFavoriteClick);
        
        storyFavoriteBtn.addEventListener('click', handleFavoriteStoryClick);
        addToStoryPlaylistBtn.addEventListener('click', handleAddToStoryPlaylist);
        storyAuthorContainer.addEventListener('click', (e) => {
            if (e.target.id === 'story-author-link') {
                e.preventDefault();
                const authorName = e.target.dataset.author;
                if (authorName) {
                    showAuthorDetail(authorName);
                }
            }
        });

        readAloudRhymeBtn.addEventListener('click', () => toggleReadAloud('rhyme'));
        readAloudStoryBtn.addEventListener('click', () => toggleReadAloud('story'));

        playlistToggleBtn.addEventListener('click', togglePlaylistView);
        closePlaylistBtn.addEventListener('click', togglePlaylistView);
        addToPlaylistBtn.addEventListener('click', handleAddToPlaylist);
        clearPlaylistBtn.addEventListener('click', clearPlaylist);
        playlistItemsContainer.addEventListener('click', handlePlaylistItemClick);
        
        prevRhymeBtn.addEventListener('click', playPreviousPlaylistItem);
        nextRhymeBtn.addEventListener('click', playNextPlaylistItem);
        prevStoryBtn.addEventListener('click', playPreviousPlaylistItem);
        nextStoryBtn.addEventListener('click', playNextPlaylistItem);
        
        window.addEventListener('scroll', handleScroll);
        backToTopBtn.addEventListener('click', scrollToTop);
        
        shareRhymeBtn.addEventListener('click', () => shareContent('rhyme'));
        printRhymeBtn.addEventListener('click', () => printContent('rhyme'));
        shareStoryBtn.addEventListener('click', () => shareContent('story'));
        printStoryBtn.addEventListener('click', () => printContent('story'));
        
        footerShareLink.addEventListener('click', (e) => {
            e.preventDefault();
            shareContent('website');
        });
        
        // REMOVED: Footer author link listener
    }
    
    function handleSearchInput() {
        let filtered = allRhymes.filter(rhyme =>
            rhyme.title.toLowerCase().includes(searchBar.value.toLowerCase()) ||
            rhyme.lyrics.toLowerCase().includes(searchBar.value.toLowerCase())
        );
        displayRhymeGallery(filtered);
    }

    function handleStorySearchInput() {
        let filtered = allStories.filter(story =>
            (!story.releaseDate || new Date(story.releaseDate) <= new Date()) &&
            (story.title.toLowerCase().includes(storySearchBar.value.toLowerCase()) ||
            story.content.join(' ').toLowerCase().includes(storySearchBar.value.toLowerCase()))
        );
        displayStoryGallery(filtered);
    }

    function handleCategoryClick(e) {
        const clickedButton = e.target.closest('.category-btn');
        if (clickedButton) {
            searchBar.value = '';
            storySearchBar.value = '';
            const category = clickedButton.dataset.category;
            updateActiveCategoryButton(category);
            showMainView(category);
            updateUrl({ category: category });
        }
    }

    function updateActiveCategoryButton(categoryToActivate) {
        document.querySelectorAll('#category-filters .category-btn, #story-category-filters .category-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeButton = document.querySelector(`.category-btn[data-category="${categoryToActivate}"]`);
        if (activeButton && !activeButton.closest('#main-navigation')) {
            activeButton.classList.add('active');
        }

        const isStoryFilter = ['Stories', 'StoryFavorites'].includes(categoryToActivate);
        document.querySelector('.main-nav-btn[data-category="Stories"]').classList.toggle('active', isStoryFilter);
        document.querySelector('.main-nav-btn[data-category="Rhymes"]').classList.toggle('active', !isStoryFilter);
    }

    function showRandomRhyme() {
        const randomIndex = Math.floor(Math.random() * allRhymes.length);
        showRhymeDetail(allRhymes[randomIndex].id);
    }

    function showRandomStory() {
        const availableStories = allStories.filter(story => !story.releaseDate || new Date(story.releaseDate) <= new Date());
        const randomIndex = Math.floor(Math.random() * availableStories.length);
        showStoryDetail(availableStories[randomIndex].id);
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
        const availableStories = allStories.filter(story => !story.releaseDate || new Date(story.releaseDate) <= new Date());
        const currentIndex = availableStories.findIndex(s => s.id === currentStory.id);
        if (currentIndex > 0) {
            showStoryDetail(availableStories[currentIndex - 1].id);
        }
    }

    function showNextStory() {
        if (!currentStory) return;
        const availableStories = allStories.filter(story => !story.releaseDate || new Date(story.releaseDate) <= new Date());
        const currentIndex = availableStories.findIndex(s => s.id === currentStory.id);
        if (currentIndex < availableStories.length - 1) {
            showStoryDetail(availableStories[currentIndex + 1].id);
        }
    }
    
    function showToast(message) {
        toastNotification.textContent = message;
        toastNotification.classList.add('show');
        setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 2500);
    }
    
    // --- TEXT-TO-SPEECH, SHARE, PRINT ---
    function shareContent(type) {
        let url = window.location.href;
        let title = document.title;
        let text = `Check out this fun website for kids!`;

        if (type === 'rhyme' && currentRhyme) {
            title = `${currentRhyme.title} - Kids Rhymes & Stories`;
            text = `Check out the rhyme "${currentRhyme.title}"!`;
        } else if (type === 'story' && currentStory) {
            title = `${currentStory.title} - Kids Rhymes & Stories`;
            text = `Check out the story "${currentStory.title}"!`;
        } else { // 'website' or general case
             url = 'https://kids.toolblaster.com/';
        }
        
        if (navigator.share) {
            navigator.share({
                title: title,
                text: text,
                url: url,
            }).catch(console.error);
        } else {
            // Fallback for browsers that don't support navigator.share
            navigator.clipboard.writeText(url).then(() => {
                showToast('Link copied to clipboard!');
            }, () => {
                showToast('Could not copy link.');
            });
        }
    }

    function printContent(type) {
        document.body.classList.add(type === 'rhyme' ? 'printing-rhyme' : 'printing-story');
        window.print();
        document.body.classList.remove('printing-rhyme', 'printing-story');
    }

    function getVoiceForLanguage(lang) {
        const allVoices = window.speechSynthesis.getVoices();
        let preferredVoice = null; let fallbackVoice = null;
        const voicePriorities = {
            'en-US': ['Google US English Female', 'Microsoft Zira - English (United States)', 'Google UK English Female', 'Samantha'],
            'hi-IN': ['Google हिन्दी']
        };
        if (voicePriorities[lang]) {
            preferredVoice = allVoices.find(voice => voicePriorities[lang].includes(voice.name));
        }
        if (!preferredVoice) {
            fallbackVoice = allVoices.find(voice => voice.lang.startsWith(lang) && (voice.name.includes('Female') || voice.name.includes('Google')));
        }
        if (!preferredVoice && !fallbackVoice) {
            fallbackVoice = allVoices.find(voice => voice.lang.startsWith(lang));
        }
        return preferredVoice || fallbackVoice || null;
    }

    window.speechSynthesis.onvoiceschanged = () => {
        englishVoice = getVoiceForLanguage('en-US');
        hindiVoice = getVoiceForLanguage('hi-IN');
    };

    function toggleReadAloud(contentType) {
        if (!('speechSynthesis'in window)) {
            showToast("Sorry, your browser doesn't support text-to-speech.");
            return;
        }

        if (isReading) {
            stopReading();
            return;
        }
        
        let content, btn, hasHindi;
        if (contentType === 'rhyme' && currentRhyme) {
            content = { en: currentRhyme.lyrics, hi: currentRhyme.lyrics_hi };
            btn = readAloudRhymeBtn;
            hasHindi = !!currentRhyme.lyrics_hi;
        } else if (contentType === 'story' && currentStory) {
            content = { en: currentStory.content.join(' '), hi: currentStory.content_hi ? currentStory.content_hi.join(' ') : '' };
            btn = readAloudStoryBtn;
            hasHindi = !!currentStory.content_hi;
        } else {
            return;
        }

        const utteranceEn = new SpeechSynthesisUtterance(content.en);
        utteranceEn.lang = 'en-US';
        if (englishVoice) utteranceEn.voice = englishVoice;

        utteranceEn.onstart = () => { isReading = true; updateReadAloudButton(btn); };
        
        if (hasHindi && content.hi) {
            const utteranceHi = new SpeechSynthesisUtterance(content.hi);
            utteranceHi.lang = 'hi-IN';
            if (hindiVoice) utteranceHi.voice = hindiVoice;
            
            utteranceEn.onend = () => {
                if(isReading) window.speechSynthesis.speak(utteranceHi);
            };
            utteranceHi.onend = () => stopReading(btn);
        } else {
            utteranceEn.onend = () => stopReading(btn);
        }
        
        window.speechSynthesis.speak(utteranceEn);
    }

    function stopReading(btnToUpdate) {
        isReading = false;
        window.speechSynthesis.cancel();
        if (btnToUpdate) updateReadAloudButton(btnToUpdate);
        else { // If called from view change, update both
            updateReadAloudButton(readAloudRhymeBtn);
            updateReadAloudButton(readAloudStoryBtn);
        }
    }

    function updateReadAloudButton(btn) {
        if(btn){
            btn.innerHTML = isReading ? '🤫' : '📢';
            btn.title = isReading ? 'Stop Reading' : 'Read Aloud';
        }
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
            playlistItemsContainer.innerHTML = `<p class="text-center text-gray-500">Your playlist is empty.</p>`;
            clearPlaylistBtn.disabled = true;
            return;
        }

        clearPlaylistBtn.disabled = false;

        playlist.forEach((item, index) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'playlist-item flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors';

            let details; let icon;
            if (item.type === 'rhyme') {
                details = allRhymes.find(r => r.id === item.id);
                icon = details ? details.icon || '🎵' : '🎵';
            } else {
                details = allStories.find(s => s.id === item.id);
                icon = details ? details.icon || '📚' : '📚';
            }

            if (!details) return;
            
            const playingIcon = `<span class="text-2xl text-yellow-500">🔊</span>`;
            const defaultIcon = `<span class="text-2xl">${icon}</span>`;

            itemEl.innerHTML = `
                <div class="flex items-center gap-3 cursor-pointer flex-grow" data-item-id="${details.id}" data-item-type="${item.type}" data-action="play">
                    ${(isPlaylistMode && index === currentPlaylistIndex) ? playingIcon : defaultIcon}
                    <span class="font-semibold text-brand-dark">${details.title}</span>
                </div>
                <button class="p-2 rounded-full hover:bg-red-100 text-red-500 button-pop" data-item-id="${details.id}" data-item-type="${item.type}" data-action="remove" aria-label="Remove ${details.title} from playlist" title="Remove from playlist">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>
                </button>
            `;

            if (isPlaylistMode && index === currentPlaylistIndex) {
                itemEl.classList.add('playing');
            }

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

    function updateAddToPlaylistButton() {
        if (!currentRhyme) return;
        const inPlaylist = isInPlaylist(currentRhyme.id, 'rhyme');
        addToPlaylistBtn.innerHTML = inPlaylist 
            ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>`;
        addToPlaylistBtn.title = inPlaylist ? "Added to Playlist" : "Add to Playlist";
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
                showStoryDetail(itemId, true, playlistIndex);
            }
        } else if (action === 'remove') {
            playlist = playlist.filter(item => !(item.id === itemId && item.type === itemType));
            localStorage.setItem('playlist', JSON.stringify(playlist));
            updatePlaylistCount();
            displayPlaylist();
            if (currentRhyme && currentRhyme.id === itemId && itemType === 'rhyme') {
                updateAddToPlaylistButton();
            }
            if (currentStory && currentStory.id === itemId && itemType === 'story') {
                updateAddToStoryPlaylistButton();
            }
        }
    }
    
    function updatePlaylistNav() {
        playlistNavButtons.classList.add('hidden');
        storyPlaylistNavButtons.classList.add('hidden');

        if (isPlaylistMode && playlist.length > 0 && currentPlaylistIndex !== -1) {
            const currentItem = playlist[currentPlaylistIndex];
            if (!currentItem) return;

            let navContainer, positionEl, prevBtn, nextBtn;

            if (currentItem.type === 'rhyme') {
                navContainer = playlistNavButtons;
                positionEl = playlistPositionEl;
                prevBtn = prevRhymeBtn;
                nextBtn = nextRhymeBtn;
            } else if (currentItem.type === 'story') {
                navContainer = storyPlaylistNavButtons;
                positionEl = storyPlaylistPositionEl;
                prevBtn = prevStoryBtn;
                nextBtn = nextStoryBtn;
            }

            if (navContainer) {
                navContainer.classList.remove('hidden');
                positionEl.textContent = `${currentPlaylistIndex + 1} / ${playlist.length}`;
                prevBtn.disabled = currentPlaylistIndex <= 0;
                nextBtn.disabled = currentPlaylistIndex >= playlist.length - 1;
            }
        }
    }
    
    function playNextPlaylistItem() {
        if (isPlaylistMode && currentPlaylistIndex < playlist.length - 1) {
            const nextIndex = currentPlaylistIndex + 1;
            const nextItem = playlist[nextIndex];
            if (nextItem.type === 'rhyme') {
                showRhymeDetail(nextItem.id, true, nextIndex);
            } else if (nextItem.type === 'story') {
                showStoryDetail(nextItem.id, true, nextIndex);
            }
        }
    }

    function playPreviousPlaylistItem() {
        if (isPlaylistMode && currentPlaylistIndex > 0) {
            const prevIndex = currentPlaylistIndex - 1;
            const prevItem = playlist[prevIndex];
            if (prevItem.type === 'rhyme') {
                showRhymeDetail(prevItem.id, true, prevIndex);
            } else if (prevItem.type === 'story') {
                showStoryDetail(prevItem.id, true, prevIndex);
            }
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

        e.currentTarget.innerHTML = isFavorite(rhymeId) ? '❤️' : '🤍';
        
        const rhymeCardIndicator = rhymeGrid.querySelector(`.rhyme-card[data-rhyme-id="${rhymeId}"] .favorite-indicator`);
        if (rhymeCardIndicator) {
            rhymeCardIndicator.textContent = isFavorite(rhymeId) ? '❤️' : '';
        }
    }

    function isFavorite(rhymeId) {
        return favorites.includes(rhymeId);
    }

    function handleFavoriteStoryClick(e) {
        if (!currentStory) return;
        triggerButtonAnimation(e.currentTarget);
        const storyId = currentStory.id;
        const favoriteIndex = favoriteStories.indexOf(storyId);
        
        if (favoriteIndex > -1) {
            favoriteStories.splice(favoriteIndex, 1);
        } else {
            favoriteStories.push(storyId);
        }
        localStorage.setItem('favoriteStories', JSON.stringify(favoriteStories));

        e.currentTarget.innerHTML = isFavoriteStory(storyId) ? '❤️' : '🤍';
        
        const storyCardIndicator = storyGrid.querySelector(`.story-card[data-story-id="${storyId}"] .favorite-indicator`);
        if (storyCardIndicator) {
            storyCardIndicator.textContent = isFavoriteStory(storyId) ? '❤️' : '';
        }
    }

    function isFavoriteStory(storyId) {
        return favoriteStories.includes(storyId);
    }

    // --- UTILITY FUNCTIONS ---
    function handleScroll() {
        backToTopBtn.classList.toggle('show', window.scrollY > 300);
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function triggerButtonAnimation(btn) {
        btn.classList.add('animate-pop');
        btn.addEventListener('animationend', () => {
            btn.classList.remove('animate-pop');
        }, { once: true });
    }

    // --- START THE APP ---
    init();

    // --- FOOTER YEAR ---
    const footerYear = document.getElementById('footer-year');
    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }
});
