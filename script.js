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
    const surpriseButton = document.getElementById('surprise-button');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIconLight = document.getElementById('theme-icon-light');
    const themeIconDark = document.getElementById('theme-icon-dark');
    const toastNotification = document.getElementById('toast-notification');
    
    // Game/Quiz Elements
    const playGameBtn = document.getElementById('play-game-btn');
    const quizModal = document.getElementById('quiz-modal');
    const quizContent = document.getElementById('quiz-content');
    const quizQuestion = document.getElementById('quiz-question');
    const quizOptions = document.getElementById('quiz-options');
    const quizFeedback = document.getElementById('quiz-feedback');
    const closeQuizBtn = document.getElementById('close-quiz-btn');


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
            
            displayRhymeOfTheDay();
            checkForSharedRhyme();
        } catch (error) {
            console.error("Could not fetch rhymes:", error);
            rhymeGrid.innerHTML = '<p class="text-red-500 col-span-full">Sorry, could not load the rhymes.</p>';
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
            card.className = 'bg-white dark:bg-gray-800 rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center p-4 min-h-[160px] text-center relative';
            card.innerHTML = `
                <div class="text-5xl mb-2">${rhyme.icon || '🎶'}</div>
                <h3 class="text-lg font-bold text-brand-dark dark:text-white">${rhyme.title}</h3>
                <div class="absolute top-2 right-2 text-xl">${isFavorite(rhyme.id) ? '❤️' : ''}</div>
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
        const funFactDetails = document.getElementById('fun-fact-details');
        if (currentRhyme.funFact) {
            document.getElementById('fun-fact-text').textContent = currentRhyme.funFact;
            funFactContainer.classList.remove('hidden');
            funFactDetails.setAttribute('open', ''); // Open by default
        } else {
            funFactContainer.classList.add('hidden');
        }

        // Handle Quiz/Game button
        const playGameContainer = document.getElementById('play-game-container');
        if (currentRhyme.quiz) {
            playGameContainer.classList.remove('hidden');
        } else {
            playGameContainer.classList.add('hidden');
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
        
        const url = new URL(window.location);
        url.searchParams.delete('rhyme');
        window.history.pushState({}, '', url);

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
        surpriseButton.addEventListener('click', showRandomRhyme);
        themeToggle.addEventListener('click', toggleTheme);
        document.getElementById('favorite-btn').addEventListener('click', handleFavoriteClick);
        document.getElementById('print-btn').addEventListener('click', handlePrint);
        document.getElementById('share-whatsapp').addEventListener('click', () => handleShare('whatsapp'));
        document.getElementById('share-instagram').addEventListener('click', () => handleShare('instagram'));
        document.getElementById('share-copy').addEventListener('click', () => handleShare('copy'));
        
        // Quiz Listeners
        playGameBtn.addEventListener('click', handlePlayGameClick);
        closeQuizBtn.addEventListener('click', closeQuiz);
        quizModal.addEventListener('click', (e) => { // Close on overlay click
            if (e.target === quizModal) {
                closeQuiz();
            }
        });
    }
    
    function filterRhymes() {
        const searchTerm = searchBar.value.toLowerCase();
        const activeCategory = document.querySelector('.category-btn.active')?.dataset.category || 'All';

        let filtered = allRhymes;

        if (activeCategory !== 'All') {
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
        if (e.target.closest('.category-btn')) {
            const category = e.target.closest('.category-btn').dataset.category;
            searchBar.value = '';
            updateActiveCategoryButton(category);
            filterRhymes();
        }
    }

    function updateActiveCategoryButton(category) {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
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
    }

    function isFavorite(rhymeId) {
        return favorites.includes(rhymeId);
    }

    function handlePrint() {
        window.print();
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
    
    // --- QUIZ FUNCTIONS ---
    function handlePlayGameClick() {
        if (currentRhyme && currentRhyme.quiz) {
            populateQuiz(currentRhyme.quiz);
            quizModal.classList.remove('hidden');
            setTimeout(() => {
                quizModal.classList.add('opacity-100');
                quizContent.classList.add('scale-100');
            }, 10);
        }
    }

    function populateQuiz(quizData) {
        quizQuestion.textContent = quizData.question;
        quizOptions.innerHTML = '';
        quizFeedback.innerHTML = '';

        quizData.options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'quiz-option-btn';
            button.textContent = option;
            button.dataset.answer = option;
            button.addEventListener('click', handleOptionClick);
            quizOptions.appendChild(button);
        });
    }

    function handleOptionClick(e) {
        const selectedAnswer = e.target.dataset.answer;
        const correctAnswer = currentRhyme.quiz.correctAnswer;

        // Disable all buttons
        quizOptions.querySelectorAll('button').forEach(btn => {
            btn.disabled = true;
            // Highlight the correct answer
            if (btn.dataset.answer === correctAnswer) {
                btn.classList.add('correct');
            }
        });

        if (selectedAnswer === correctAnswer) {
            quizFeedback.textContent = 'Correct! 🎉';
            quizFeedback.className = 'mt-4 h-6 text-lg font-bold text-green-500';
        } else {
            e.target.classList.add('incorrect');
            quizFeedback.textContent = 'Try again next time!';
            quizFeedback.className = 'mt-4 h-6 text-lg font-bold text-red-500';
        }
    }

    function closeQuiz() {
        quizModal.classList.remove('opacity-100');
        quizContent.classList.remove('scale-100');
        setTimeout(() => {
            quizModal.classList.add('hidden');
        }, 300); // Match CSS transition duration
    }

    // --- START THE APP ---
    init();
});
