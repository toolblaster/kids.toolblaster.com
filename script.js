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
    let currentRhyme = null;

    const rhymeGrid = document.getElementById('rhyme-grid');
    const rhymeGalleryView = document.getElementById('rhyme-gallery');
    const rhymeDetailView = document.getElementById('rhyme-detail');
    const backButton = document.getElementById('back-button');
    const searchBar = document.getElementById('search-bar');
    const categoryFilters = document.getElementById('category-filters');
    const collectionFilters = document.getElementById('collection-filters');
    const surpriseButton = document.getElementById('surprise-button');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIconLight = document.getElementById('theme-icon-light');
    const themeIconDark = document.getElementById('theme-icon-dark');
    const toastNotification = document.getElementById('toast-notification');
    const loadingIndicator = document.getElementById('loading-indicator');
    const rhymeOfTheDaySection = document.getElementById('rhyme-of-the-day');
    const controlsSection = document.getElementById('controls');
    const themedCollectionsSection = document.getElementById('themed-collections');

    // Printable Activity Elements
    const printableModal = document.getElementById('printable-modal');
    const printableContent = document.getElementById('printable-content');
    const closePrintableBtn = document.getElementById('close-printable-btn');
    const printableImage = document.getElementById('printable-image');
    const printActivityBtn = document.getElementById('print-activity-btn');
    const backToTopBtn = document.getElementById('back-to-top-btn');


    // --- INITIALIZATION ---
    function init() {
        // Theme setup
        const isDarkMode = localStorage.getItem('theme') === 'dark';
        document.documentElement.classList.toggle('dark', isDarkMode);
        updateThemeIcon(isDarkMode);

        loadRhymes();
        addEventListeners();
    }

    // --- DATA HANDLING ---
    async function loadRhymes() {
        try {
            const response = await fetch('rhymes.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            allRhymes = await response.json();
            
            // Hide loading indicator and show content
            loadingIndicator.classList.add('hidden');
            rhymeOfTheDaySection.classList.remove('hidden');
            themedCollectionsSection.classList.remove('hidden');
            controlsSection.classList.remove('hidden');
            rhymeGalleryView.classList.remove('hidden');

            displayRhymeOfTheDay();
            checkForSharedRhyme();
        } catch (error) {
            console.error("Could not fetch rhymes:", error);
            loadingIndicator.innerHTML = '<p class="text-red-500 col-span-full">Sorry, could not load the rhymes. Please try again later.</p>';
        }
    }

    // --- DEEP LINKING (for shared rhymes) ---
    function checkForSharedRhyme() {
        const urlParams = new URLSearchParams(window.location.search);
        const rhymeId = urlParams.get('rhyme');
        if (rhymeId && allRhymes.length > 0) {
            const rhymeExists = allRhymes.some(r => r.id === parseInt(rhymeId));
            if (rhymeExists) {
                showRhymeDetail(parseInt(rhymeId));
            } else {
                displayRhymeGallery(allRhymes);
                updateActiveCategoryButton('All');
            }
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
            card.className = 'bg-white dark:bg-gray-800 rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center p-4 min-h-[160px] text-center relative';
            card.dataset.rhymeId = rhyme.id; // Add data attribute for easy selection
            card.innerHTML = `
                <div class="text-5xl mb-2">${rhyme.icon || '🎶'}</div>
                <h3 class="text-lg font-bold text-brand-dark dark:text-white">${rhyme.title}</h3>
                <div class="favorite-icon absolute top-2 right-2 text-xl">${isFavorite(rhyme.id) ? '❤️' : ''}</div>
            `;
            card.addEventListener('click', () => showRhymeDetail(rhyme.id));
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
        if (currentRhyme.funFact) {
            document.getElementById('fun-fact-text').textContent = currentRhyme.funFact;
            funFactContainer.classList.remove('hidden');
        } else {
            funFactContainer.classList.add('hidden');
        }
        
        // Handle Printable Activity Button
        const printableBtn = document.getElementById('printable-btn');
        if (currentRhyme.printable_url) {
            printableBtn.classList.remove('hidden');
        } else {
            printableBtn.classList.add('hidden');
        }

        // Switch views
        rhymeGalleryView.classList.add('hidden');
        controlsSection.classList.add('hidden');
        themedCollectionsSection.classList.add('hidden');
        rhymeOfTheDaySection.classList.add('hidden');
        rhymeDetailView.classList.remove('hidden');
        window.scrollTo(0, 0);

        // Update URL for deep linking
        const url = new URL(window.location);
        url.searchParams.set('rhyme', rhymeId);
        window.history.pushState({}, '', url);
    }

    function goBackToGallery() {
        rhymeDetailView.classList.add('hidden');
        rhymeGalleryView.classList.remove('hidden');
        controlsSection.classList.remove('hidden');
        themedCollectionsSection.classList.remove('hidden');
        rhymeOfTheDaySection.classList.remove('hidden');
        
        const url = new URL(window.location);
        url.searchParams.delete('rhyme');
        window.history.pushState({}, '', url);

        // Refresh the gallery to reflect any favorite changes
        filterRhymes();
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
        backButton.addEventListener('click', goBackToGallery);
        searchBar.addEventListener('input', filterRhymes);
        categoryFilters.addEventListener('click', handleCategoryClick);
        collectionFilters.addEventListener('click', handleCollectionClick);
        surpriseButton.addEventListener('click', showRandomRhyme);
        themeToggle.addEventListener('click', toggleTheme);
        document.getElementById('favorite-btn').addEventListener('click', handleFavoriteClick);
        document.getElementById('print-btn').addEventListener('click', handlePrint);
        document.getElementById('share-whatsapp').addEventListener('click', () => handleShare('whatsapp'));
        document.getElementById('share-instagram').addEventListener('click', () => handleShare('instagram'));
        document.getElementById('share-copy').addEventListener('click', () => handleShare('copy'));
        
        // Printable Activity Listeners
        document.getElementById('printable-btn').addEventListener('click', openPrintableModal);
        closePrintableBtn.addEventListener('click', closePrintableModal);
        printableModal.addEventListener('click', (e) => {
            if (e.target === printableModal) closePrintableModal();
        });
        printActivityBtn.addEventListener('click', () => {
            document.body.classList.add('printing-activity');
            window.print();
        });
        window.onafterprint = () => {
            document.body.classList.remove('printing-activity');
        };

        // Back to Top Listeners
        window.addEventListener('scroll', handleScroll);
        backToTopBtn.addEventListener('click', scrollToTop);
    }
    
    function filterRhymes() {
        const searchTerm = searchBar.value.toLowerCase();
        const activeCategory = document.querySelector('.category-btn.active')?.dataset.category || 'All';
        const activeCollection = document.querySelector('.collection-btn.active')?.dataset.collection;

        let filtered = allRhymes;

        if (activeCollection) {
            filtered = allRhymes.filter(rhyme => rhyme.tags && rhyme.tags.includes(activeCollection));
        } else if (activeCategory !== 'All') {
            if (activeCategory === 'Favorites') {
                filtered = allRhymes.filter(rhyme => favorites.includes(rhyme.id));
            } else {
                filtered = allRhymes.filter(rhyme => rhyme.category === activeCategory);
            }
        }

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
        const button = e.target.closest('.category-btn');
        if (button) {
            const category = button.dataset.category;
            searchBar.value = '';
            updateActiveCategoryButton(category);
            updateActiveCollectionButton(null); // Deselect collections
            filterRhymes();
        }
    }

    function handleCollectionClick(e) {
        const button = e.target.closest('.collection-btn');
        if (button) {
            const collection = button.dataset.collection;
            searchBar.value = '';
            updateActiveCollectionButton(collection);
            updateActiveCategoryButton(null); // Deselect categories
            filterRhymes();
        }
    }

    function updateActiveCategoryButton(category) {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
    }

    function updateActiveCollectionButton(collection) {
        document.querySelectorAll('.collection-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.collection === collection);
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

        // Dynamically update the favorite icon in the gallery view without a full refresh
        const rhymeCard = rhymeGrid.querySelector(`[data-rhyme-id="${rhymeId}"]`);
        if (rhymeCard) {
            const favoriteIcon = rhymeCard.querySelector('.favorite-icon');
            if (favoriteIcon) {
                favoriteIcon.textContent = isFavorite(rhymeId) ? '❤️' : '';
            }
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
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Failed to copy text: ', err);
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

    // --- PRINTABLE ACTIVITY MODAL FUNCTIONS ---
    function openPrintableModal() {
        if (currentRhyme && currentRhyme.printable_url) {
            printableImage.src = currentRhyme.printable_url;
            printableModal.classList.remove('hidden');
            setTimeout(() => {
                printableModal.classList.add('opacity-100');
                printableContent.classList.add('scale-100');
            }, 10);
        }
    }

    function closePrintableModal() {
        printableModal.classList.remove('opacity-100');
        printableContent.classList.remove('scale-100');
        setTimeout(() => {
            printableModal.classList.add('hidden');
        }, 300); // Match CSS transition duration
    }

    // --- START THE APP ---
    init();
});
