/**
 * =================================================================
 * SECONDARY.JS - DEFERRED INTERACTIONS
 * =================================================================
 * Handles: TTS, Playlists, Favorites, Share, Print, Surprise Me.
 * Loaded dynamically after script.js finishes fetching data.
 */

(function() {
    // Check if TB is ready, if not, wait (safety check)
    if (!window.TB) { console.warn("Main script not ready yet."); return; }

    const TB = window.TB;
    let isReading = false;
    let readingQueue = []; // Queue to hold speech segments
    let englishVoice = null;
    let hindiVoice = null;

    // --- TEXT TO SPEECH ---
    function initVoices() {
        const voices = window.speechSynthesis.getVoices();
        // Try to find Google/Microsoft voices
        englishVoice = voices.find(v => v.lang === 'en-US' && (v.name.includes('Google') || v.name.includes('Zira'))) || voices.find(v => v.lang === 'en-US');
        hindiVoice = voices.find(v => v.lang === 'hi-IN' && v.name.includes('Google')) || voices.find(v => v.lang === 'hi-IN');
    }
    if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = initVoices;
        initVoices();
    }

    TB.toggleReadAloud = function(type) {
        if (!('speechSynthesis' in window)) { TB.showToast("TTS not supported."); return; }
        
        // STOP READING
        if (isReading) { 
            window.speechSynthesis.cancel(); 
            isReading = false; 
            readingQueue = [];
            // Reset both buttons just in case
            updateReadAloudBtn(document.getElementById('read-aloud-btn-rhyme'), false);
            updateReadAloudBtn(document.getElementById('read-aloud-btn-story'), false);
            return; 
        }

        // PREPARE CONTENT
        let enParts = [];
        let hiParts = [];
        let btn;

        if (type === 'rhyme' && TB.currentRhyme) {
            // Rhymes are usually short, but we treat them as an array of 1 item
            enParts = [TB.currentRhyme.lyrics]; 
            if (TB.currentRhyme.lyrics_hi) hiParts = [TB.currentRhyme.lyrics_hi];
            btn = document.getElementById('read-aloud-btn-rhyme');
        } else if (type === 'story' && TB.currentStory) {
            // Stories are Arrays of paragraphs. We use the array directly to "chunk" the audio.
            // This prevents the "speech stops halfway" bug on long texts.
            enParts = TB.currentStory.content; 
            if (TB.currentStory.content_hi) hiParts = TB.currentStory.content_hi;
            btn = document.getElementById('read-aloud-btn-story');
        } else return;

        // BUILD QUEUE
        readingQueue = [];

        const addToQueue = (textArray, lang, voice) => {
            if (!textArray) return;
            textArray.forEach(text => {
                if (!text || !text.trim()) return;
                const u = new SpeechSynthesisUtterance(text);
                u.lang = lang;
                if (voice) u.voice = voice;
                readingQueue.push(u);
            });
        };

        addToQueue(enParts, 'en-US', englishVoice);
        addToQueue(hiParts, 'hi-IN', hindiVoice);

        if (readingQueue.length === 0) return;

        // START READING CHAIN
        isReading = true;
        updateReadAloudBtn(btn, true);
        
        let currentIdx = 0;

        const playNext = () => {
            if (!isReading) return; // Stopped by user
            
            if (currentIdx >= readingQueue.length) {
                // Finished
                isReading = false;
                updateReadAloudBtn(btn, false);
                return;
            }

            const utterance = readingQueue[currentIdx];
            
            utterance.onend = () => {
                currentIdx++;
                playNext();
            };
            
            utterance.onerror = (e) => {
                console.error("TTS Error", e);
                // Try skipping to next chunk on error
                currentIdx++;
                playNext();
            };

            window.speechSynthesis.speak(utterance);
        };

        playNext();
    };

    function updateReadAloudBtn(btn, active) {
        if(btn) {
            btn.innerHTML = active ? '🤫' : '📢';
            btn.title = active ? 'Stop' : 'Read Aloud';
        }
    }
    // Expose for main script to reset UI
    TB.updateReadAloudButton = updateReadAloudBtn;

    // --- FAVORITES ---
    function toggleFavorite(id, type, btn) {
        animateBtn(btn);
        let list = type === 'rhyme' ? TB.favorites : TB.favoriteStories;
        const idx = list.indexOf(id);
        if (idx > -1) list.splice(idx, 1);
        else list.push(id);
        
        localStorage.setItem(type === 'rhyme' ? 'favoriteRhymes' : 'favoriteStories', JSON.stringify(list));
        btn.innerHTML = idx > -1 ? '🤍' : '❤️'; // Toggle visual
        
        // Update gallery card icon if visible
        const gridId = type === 'rhyme' ? 'rhyme-grid' : 'story-grid';
        const card = document.querySelector(`#${gridId} .${type}-card[data-${type}-id="${id}"] .favorite-indicator`);
        if(card) card.textContent = idx > -1 ? '' : '❤️';
    }

    // --- PLAYLISTS ---
    function togglePlaylistView() {
        const view = document.getElementById('playlist-view');
        if (view.classList.contains('hidden')) {
            renderPlaylist();
            view.classList.remove('hidden');
        } else {
            view.classList.add('hidden');
        }
    }

    function renderPlaylist() {
        // FIX: Update counter at the very start so it reflects 0 immediately when empty
        const countEl = document.getElementById('playlist-count');
        if (countEl) {
            countEl.textContent = TB.playlist.length;
            countEl.classList.toggle('hidden', TB.playlist.length === 0);
        }

        const container = document.getElementById('playlist-items');
        container.innerHTML = '';
        
        document.getElementById('clear-playlist-btn').disabled = TB.playlist.length === 0;

        if (TB.playlist.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500">Empty playlist.</p>';
            return;
        }

        TB.playlist.forEach((item, idx) => {
            let details = item.type === 'rhyme' ? TB.allRhymes.find(r => r.id === item.id) : TB.allStories.find(s => s.id === item.id);
            if (!details) return;
            
            const div = document.createElement('div');
            div.className = `flex justify-between p-2 rounded bg-gray-50 hover:bg-gray-100 ${TB.isPlaylistMode && idx === TB.currentPlaylistIndex ? 'bg-yellow-100 border-l-4 border-yellow-400' : ''}`;
            div.innerHTML = `
                <div class="cursor-pointer flex-grow" onclick="window.TB.playFromPlaylist(${idx})">
                    ${TB.isPlaylistMode && idx === TB.currentPlaylistIndex ? '🔊' : (details.icon || '🎵')} 
                    <span class="font-bold ml-2">${details.title}</span>
                </div>
                <button class="text-red-500" onclick="window.TB.removeFromPlaylist(${item.id}, '${item.type}')">✖</button>
            `;
            container.appendChild(div);
        });
    }

    TB.playFromPlaylist = function(idx) {
        togglePlaylistView();
        const item = TB.playlist[idx];
        if (item.type === 'rhyme') TB.showRhymeDetail(item.id, true, idx);
        else TB.showStoryDetail(item.id, true, idx);
    };

    TB.removeFromPlaylist = function(id, type) {
        TB.playlist = TB.playlist.filter(i => !(i.id === id && i.type === type));
        localStorage.setItem('playlist', JSON.stringify(TB.playlist));
        renderPlaylist();
        if (TB.currentRhyme && TB.currentRhyme.id === id) TB.updateAddToPlaylistButton();
        if (TB.currentStory && TB.currentStory.id === id) TB.updateAddToStoryPlaylistButton();
    };

    TB.addToPlaylist = function(id, type, btn) {
        animateBtn(btn);
        const exists = TB.playlist.some(i => i.id === id && i.type === type);
        if (exists) {
            TB.playlist = TB.playlist.filter(i => !(i.id === id && i.type === type));
            TB.showToast("Removed from playlist");
        } else {
            TB.playlist.push({ id, type });
            TB.showToast("Added to playlist!");
        }
        localStorage.setItem('playlist', JSON.stringify(TB.playlist));
        renderPlaylist(); // Update count
        updatePlaylistBtns();
    };

    function updatePlaylistBtns() {
        if(TB.currentRhyme) {
            const inList = TB.playlist.some(i => i.id === TB.currentRhyme.id && i.type === 'rhyme');
            const btn = document.getElementById('add-to-playlist-btn');
            btn.innerHTML = inList ? '✔️' : `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>`;
        }
        if(TB.currentStory) {
            const inList = TB.playlist.some(i => i.id === TB.currentStory.id && i.type === 'story');
            const btn = document.getElementById('add-to-story-playlist-btn');
            btn.innerHTML = inList ? '✔️' : `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>`;
        }
    }
    TB.updateAddToPlaylistButton = updatePlaylistBtns;
    TB.updateAddToStoryPlaylistButton = updatePlaylistBtns;

    TB.updatePlaylistNav = function() {
        const rNav = document.getElementById('playlist-nav-buttons');
        const sNav = document.getElementById('story-playlist-nav-buttons');
        rNav.classList.add('hidden'); sNav.classList.add('hidden');
        
        if (TB.isPlaylistMode && TB.playlist.length > 0) {
            const item = TB.playlist[TB.currentPlaylistIndex];
            const nav = item.type === 'rhyme' ? rNav : sNav;
            const pos = item.type === 'rhyme' ? document.getElementById('playlist-position') : document.getElementById('story-playlist-position');
            const prev = item.type === 'rhyme' ? document.getElementById('prev-rhyme-btn') : document.getElementById('prev-story-btn');
            const next = item.type === 'rhyme' ? document.getElementById('next-rhyme-btn') : document.getElementById('next-story-btn');
            
            nav.classList.remove('hidden');
            pos.textContent = `${TB.currentPlaylistIndex + 1} / ${TB.playlist.length}`;
            
            // Remove old listeners to prevent stacking (simple cloning trick)
            const newPrev = prev.cloneNode(true); prev.parentNode.replaceChild(newPrev, prev);
            const newNext = next.cloneNode(true); next.parentNode.replaceChild(newNext, next);
            
            newPrev.onclick = () => { if(TB.currentPlaylistIndex > 0) TB.playFromPlaylist(TB.currentPlaylistIndex - 1); };
            newNext.onclick = () => { if(TB.currentPlaylistIndex < TB.playlist.length - 1) TB.playFromPlaylist(TB.currentPlaylistIndex + 1); };
            
            newPrev.disabled = TB.currentPlaylistIndex <= 0;
            newNext.disabled = TB.currentPlaylistIndex >= TB.playlist.length - 1;
        }
    }

    // --- UTILS ---
    function animateBtn(btn) {
        btn.classList.add('animate-pop');
        setTimeout(() => btn.classList.remove('animate-pop'), 300);
    }
    
    function shareContent() {
        if (navigator.share) {
            navigator.share({ title: document.title, url: window.location.href }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href);
            TB.showToast('Link copied!');
        }
    }

    function surpriseMe(type) {
        const list = type === 'rhyme' ? TB.allRhymes : TB.allStories.filter(s => !s.releaseDate || new Date(s.releaseDate) <= new Date());
        const item = list[Math.floor(Math.random() * list.length)];
        if (type === 'rhyme') TB.showRhymeDetail(item.id);
        else TB.showStoryDetail(item.id);
    }

    // --- ATTACH LISTENERS ---
    // Now that Secondary is loaded, we wake up the buttons
    document.getElementById('read-aloud-btn-rhyme').addEventListener('click', () => TB.toggleReadAloud('rhyme'));
    document.getElementById('read-aloud-btn-story').addEventListener('click', () => TB.toggleReadAloud('story'));
    
    document.getElementById('favorite-btn').addEventListener('click', (e) => toggleFavorite(TB.currentRhyme.id, 'rhyme', e.currentTarget));
    document.getElementById('story-favorite-btn').addEventListener('click', (e) => toggleFavorite(TB.currentStory.id, 'story', e.currentTarget));
    
    document.getElementById('add-to-playlist-btn').addEventListener('click', (e) => TB.addToPlaylist(TB.currentRhyme.id, 'rhyme', e.currentTarget));
    document.getElementById('add-to-story-playlist-btn').addEventListener('click', (e) => TB.addToPlaylist(TB.currentStory.id, 'story', e.currentTarget));
    
    document.getElementById('playlist-toggle-btn').addEventListener('click', togglePlaylistView);
    document.getElementById('close-playlist-btn').addEventListener('click', togglePlaylistView);
    document.getElementById('clear-playlist-btn').addEventListener('click', () => { TB.playlist = []; localStorage.setItem('playlist', '[]'); renderPlaylist(); });

    document.getElementById('share-rhyme-btn').addEventListener('click', shareContent);
    document.getElementById('share-story-btn').addEventListener('click', shareContent);
    document.getElementById('footer-share-link').addEventListener('click', (e) => { e.preventDefault(); shareContent(); });
    
    document.getElementById('print-rhyme-btn').addEventListener('click', () => { document.body.classList.add('printing-rhyme'); window.print(); document.body.classList.remove('printing-rhyme'); });
    document.getElementById('print-story-btn').addEventListener('click', () => { document.body.classList.add('printing-story'); window.print(); document.body.classList.remove('printing-story'); });

    document.getElementById('surprise-button').addEventListener('click', () => surpriseMe('rhyme'));
    document.getElementById('story-surprise-button').addEventListener('click', () => surpriseMe('story'));
    
    document.getElementById('back-to-top-btn').addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
    window.addEventListener('scroll', () => document.getElementById('back-to-top-btn').classList.toggle('show', window.scrollY > 300));

    // Initial render of playlist count since we just loaded logic
    renderPlaylist();
    
    console.log("Secondary interactions loaded.");

})();