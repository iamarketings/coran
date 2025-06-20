import { AppState } from './state.js';
import { Storage } from './storage.js';
import { API } from './api.js';

// Application principale
export const App = {
    init() {
        this.loadData();
        this.setupEventListeners();
        this.checkOnlineStatus();
        this.startSyncTimer();
        this.updateUI();
    },
    
    async loadData() {
        // Charger les sourates si pas déjà en cache
        if (AppState.data.surahs.length === 0) {
            AppState.data.surahs = await API.fetchSurahs();
        }
        
        // Afficher les sourates
        this.displaySurahs();
        
        // Charger les horaires de prière
        if (AppState.config.location) {
            this.updatePrayerTimes();
        }
        
        // Mettre à jour le calendrier
        this.updateCalendar();
    },
    
    setupEventListeners() {
        // Gestion du mode hors ligne
        window.addEventListener('online', () => this.setOnlineStatus(true));
        window.addEventListener('offline', () =>  this.setOnlineStatus(false));

        // Gestion tactile pour mobile
        this.setupTouchEvents();

        // Navigation depuis la barre inférieure
        this.setupNavEvents();

        // Barre de recherche
        this.setupSearchEvents();
    },

    setupNavEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                if (section) {
                    this.showSection(section);
                }
            });
        });
    },

    setupSearchEvents() {
        const searchInput = document.getElementById('searchInput');
        const resultsContainer = document.getElementById('searchResults');
        if (!searchInput || !resultsContainer) return;

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            const results = this.searchSurahs(query);
            this.renderSearchResults(results);
        });

        resultsContainer.addEventListener('click', (e) => {
            const item = e.target.closest('.search-item');
            if (item) {
                const surah = parseInt(item.dataset.surah);
                this.loadSurah(surah);
                document.getElementById('searchContainer').classList.remove('active');
            }
        });

        // Afficher toutes les sourates par défaut
        this.renderSearchResults(AppState.data.surahs);
    },
    
    setupTouchEvents() {
        // Améliorer l'expérience tactile
        document.addEventListener('touchstart', function() {}, { passive: true });
        
        // Empêcher le zoom sur double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function (event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Gestion du swipe pour navigation
        let startX, startY;
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;
            
            const diffX = startX - e.touches[0].clientX;
            const diffY = startY - e.touches[0].clientY;
            
            // Swipe horizontal pour navigation entre sections
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // Swipe gauche - section suivante
                    this.navigateToNextSection();
                } else {
                    // Swipe droite - section précédente
                    this.navigateToPrevSection();
                }
                startX = null;
                startY = null;
            }
        }, { passive: true });
    },
    
    navigateToNextSection() {
        const sections = ['home', 'quran', 'audio', 'calendar', 'bookmarks'];
        const currentIndex = sections.indexOf(AppState.ui.currentSection);
        if (currentIndex === -1) return;
        const nextIndex = (currentIndex + 1) % sections.length;
        this.showSection(sections[nextIndex]);
    },

    navigateToPrevSection() {
        const sections = ['home', 'quran', 'audio', 'calendar', 'bookmarks'];
        const currentIndex = sections.indexOf(AppState.ui.currentSection);
        if (currentIndex === -1) return;
        const prevIndex = currentIndex === 0 ? sections.length - 1 : currentIndex - 1;
        this.showSection(sections[prevIndex]);
    },
    
    checkOnlineStatus() {
        this.setOnlineStatus(navigator.onLine);
    },
    
    setOnlineStatus(online) {
        AppState.ui.offline = !online;
        const banner = document.getElementById('offlineBanner');
        if (banner) {
            banner.style.display = online ? 'none' : 'block';
        }
        
        if (online && this.shouldSync()) {
            this.syncData();
        }
    },
    
    shouldSync() {
        const lastSync = AppState.data.lastSync;
        const twelveHours = 12 * 60 * 60 * 1000;
        return !lastSync || (Date.now() - lastSync > twelveHours);
    },
    
    startSyncTimer() {
        // Synchronisation toutes les 12 heures
        setInterval(() => {
            if (navigator.onLine && this.shouldSync()) {
                this.syncData();
            }
        }, 12 * 60 * 60 * 1000);
    },
    
    async syncData() {
        const indicator = document.getElementById('syncIndicator');
        if (indicator) {
            indicator.style.display = 'block';
        }
        
        try {
            // Synchroniser les horaires de prière
            if (AppState.config.location) {
                const prayerData = await API.fetchPrayerTimes(
                    AppState.config.location.lat,
                    AppState.config.location.lon,
                    AppState.config.method
                );
                AppState.data.prayerTimes = prayerData;
            }
            
            // Mettre à jour la dernière synchronisation
            AppState.data.lastSync = Date.now();
            Storage.save();
            
            // Rafraîchir l'interface
            this.updatePrayerTimes();
            
        } catch (error) {
            console.error('Erreur synchronisation:', error);
        } finally {
            if (indicator) {
                setTimeout(() => {
                    indicator.style.display = 'none';
                }, 2000);
            }
        }
    },
    
    updateUI() {
        // Afficher la localisation
        if (AppState.config.location) {
            const locationDisplay = document.getElementById('locationDisplay');
            if (locationDisplay) {
                locationDisplay.textContent = AppState.config.location.name;
            }
        }
        
        // Appliquer le mode sombre si activé
        if (AppState.ui.darkMode) {
            document.body.classList.add('dark-mode');
        }
    },
    
    displaySurahs() {
        const surahList = document.getElementById('surahList');
        if (!surahList) return;
        
        surahList.innerHTML = '';
        
        AppState.data.surahs.forEach(surah => {
            const item = document.createElement('div');
            item.className = 'surah-item';
            
            // Événement de clic corrigé
            item.addEventListener('click', () => {
                this.loadSurah(surah.number);
            });
            
            // Événement tactile pour mobile
            item.addEventListener('touchstart', () => {
                item.classList.add('touched');
            });
            
            item.addEventListener('touchend', () => {
                setTimeout(() => {
                    item.classList.remove('touched');
                }, 150);
            });
            
            item.innerHTML = `
                <div class="surah-number">${surah.number}</div>
                <div class="surah-info">
                    <div class="surah-name">${surah.englishName}</div>
                    <div class="surah-meta">
                        ${surah.englishNameTranslation} • ${surah.numberOfAyahs} versets
                    </div>
                </div>
                <div class="surah-arabic">${surah.name}</div>
            `;
            
            surahList.appendChild(item);
        });
    },
    
    async loadSurah(number) {
        console.log('Chargement sourate:', number);

        const readingSection = document.getElementById('readingSection');
        if (!readingSection) return;

        readingSection.innerHTML = '<div class="loading"><div class="spinner"></div><p>Chargement de la sourate...</p></div>';
        
        try {
            // Vérifier le cache
            const cacheKey = `surah-${number}`;
            let surahData = AppState.data.cache?.[cacheKey];
            
            if (!surahData) {
                // Charger depuis l'API
                const [arabicResponse, frenchResponse] = await Promise.all([
                    fetch(`https://api.alquran.cloud/v1/surah/${number}`),
                    fetch(`https://api.alquran.cloud/v1/surah/${number}/fr.hamidullah`)
                ]);

                const arabicData = await arabicResponse.json();
                const frenchData = await frenchResponse.json();

                surahData = {
                    arabic: arabicData.data,
                    french: frenchData.data
                };

                // Mettre en cache
                if (!AppState.data.cache) AppState.data.cache = {};
                AppState.data.cache[cacheKey] = surahData;
                Storage.save();
            }
            
            AppState.ui.currentSurah = number;
            this.displaySurah(surahData);
            this.showSection('reading');
            
            // Sauvegarder la dernière lecture
            AppState.data.lastRead = {
                surah: number,
                timestamp: Date.now()
            };
            Storage.save();
            
        } catch (error) {
            console.error('Erreur chargement sourate:', error);
            if (readingSection) {
                readingSection.innerHTML = `
                    <div class="error-message">
                        <div class="error-icon">⚠️</div>
                        <h3>Erreur de chargement</h3>
                        <p>Impossible de charger la sourate. Vérifiez votre connexion.</p>
                        <button class="retry-button" id="retrySurah">Réessayer</button>
                    </div>
                `;

                const retryButton = document.getElementById('retrySurah');
                if (retryButton) {
                    retryButton.addEventListener('click', () => {
                        this.loadSurah(number);
                    });
                }
            }
        }
    },

    displaySurah(surahData) {
        const readingSection = document.getElementById('readingSection');
        if (!readingSection) return;
        
        const { arabic, french } = surahData;
        
        let html = `
            <div class="surah-header">
                <button class="back-button" id="backToQuran">
                    <span class="back-icon">←</span> Retour
                </button>
                <div class="surah-title">
                    <h2>${arabic.englishName}</h2>
                    <div class="surah-title-arabic">${arabic.name}</div>
                    <div class="surah-info-meta">${arabic.englishNameTranslation} • ${arabic.numberOfAyahs} versets</div>
                </div>
                <button class="favorite-button" id="favoriteBtn">
                    ${AppState.data.favorites.includes(arabic.number) ? '❤️' : '🤍'}
                </button>
            </div>
            <div class="ayahs-container">
        `;

        arabic.ayahs.forEach((ayah, index) => {
            html += `
                <div class="ayah-container" data-ayah="${ayah.numberInSurah}">
                    <div class="ayah-arabic">
                        ${ayah.text}
                    </div>
                    <div class="ayah-translation">
                        <span class="ayah-number">${ayah.numberInSurah}</span>
                        ${french.ayahs[index]?.text || ''}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        readingSection.innerHTML = html;
        
        // Ajouter les événements après création du DOM
        const backButton = document.getElementById('backToQuran');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.showSection('quran');
            });
        }
        
        const favoriteBtn = document.getElementById('favoriteBtn');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => {
                this.toggleFavorite(arabic.number);
            });
        }
        
        // Scroll vers le haut
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Changer de section vers la lecture
        AppState.ui.currentSection = 'reading';
    },
    
    showSection(sectionName) {
        console.log('Changement de section vers:', sectionName);
        
        // Si on quitte la lecture, nettoyer la section
        if (AppState.ui.currentSection === 'reading') {
            const readingSection = document.getElementById('readingSection');
            if (readingSection) {
                readingSection.innerHTML = '';
            }

            if (sectionName === 'quran') {
                this.displaySurahs();
            }
        }
        
        // Masquer toutes les sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Afficher la section demandée
        const targetSection = document.getElementById(`${sectionName}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Mettre à jour la navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
        
        // Charger le contenu spécifique de la section
        switch(sectionName) {
            case 'home':
                this.loadHomeSection();
                break;
            case 'quran':
                this.loadQuranSection();
                break;
            case 'audio':
                this.loadAudioSection();
                break;
            case 'calendar':
                this.loadCalendarSection();
                break;
            case 'bookmarks':
                this.loadBookmarksSection();
                break;
            case 'settings':
                this.loadSettingsSection();
                break;
        }
        
        // Mettre à jour l'état
        AppState.ui.currentSection = sectionName;
        Storage.save();
    },
    
    loadHomeSection() {
        // La section home est déjà chargée dans le HTML
        this.updatePrayerTimes();
        this.updateCalendar();
    },
    
    loadQuranSection() {
        this.displaySurahs();
    },
    
    loadAudioSection() {
        const audioSection = document.getElementById('audioSection');
        if (!audioSection) return;
        
        audioSection.innerHTML = `
            <div class="audio-container">
                <div class="audio-header">
                    <h2>🎧 Récitations Audio</h2>
                    <p>Sélectionnez un récitateur et une sourate</p>
                </div>
                
                <div class="reciter-selection">
                    <h3>Récitateurs</h3>
                    <div class="reciter-grid">
                        <div class="reciter-card active" data-reciter="ar.alafasy">
                            <div class="reciter-name">Mishary Al-Afasy</div>
                            <div class="reciter-info">Koweït</div>
                        </div>
                        <div class="reciter-card" data-reciter="ar.abdurrahmaansudais">
                            <div class="reciter-name">Abdul Rahman Al-Sudais</div>
                            <div class="reciter-info">Arabie Saoudite</div>
                        </div>
                        <div class="reciter-card" data-reciter="ar.mahermuaiqly">
                            <div class="reciter-name">Maher Al Muaiqly</div>
                            <div class="reciter-info">Arabie Saoudite</div>
                        </div>
                        <div class="reciter-card" data-reciter="ar.saoodshuraym">
                            <div class="reciter-name">Saood Al-Shuraym</div>
                            <div class="reciter-info">Arabie Saoudite</div>
                        </div>
                    </div>
                </div>
                
                <div class="audio-surah-list" id="audioSurahList">
                    <h3>Sourates</h3>
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Chargement des sourates...</p>
                    </div>
                </div>
                
                <div class="audio-player" id="audioPlayer" style="display: none;">
                    <div class="player-info">
                        <div class="player-surah-name" id="playerSurahName"></div>
                        <div class="player-reciter" id="playerReciter"></div>
                    </div>
                    <audio controls id="audioElement" style="width: 100%;">
                        Votre navigateur ne supporte pas l'audio HTML5.
                    </audio>
                </div>
            </div>
        `;
        
        // Charger la liste des sourates pour l'audio
        this.loadAudioSurahs();
        
        // Gérer la sélection des récitateurs
        this.setupReciterSelection();
    },
    
    async loadAudioSurahs() {
        const audioSurahList = document.getElementById('audioSurahList');
        if (!audioSurahList) return;
        
        try {
            const surahs = AppState.data.surahs.length > 0 ? AppState.data.surahs : await API.fetchSurahs();
            
            let html = '<h3>Sourates</h3><div class="audio-surah-grid">';
            
            surahs.forEach(surah => {
                html += `
                    <div class="audio-surah-item" data-surah="${surah.number}">
                        <div class="audio-surah-number">${surah.number}</div>
                        <div class="audio-surah-info">
                            <div class="audio-surah-name">${surah.englishName}</div>
                            <div class="audio-surah-arabic">${surah.name}</div>
                        </div>
                        <button class="play-button" data-surah="${surah.number}">▶️</button>
                    </div>
                `;
            });
            
            html += '</div>';
            audioSurahList.innerHTML = html;
            
            // Ajouter les événements de lecture
            this.setupAudioPlayback();
            
        } catch (error) {
            console.error('Erreur chargement sourates audio:', error);
            audioSurahList.innerHTML = `
                <div class="error-message">
                    <p>Erreur de chargement des sourates</p>
                </div>
            `;
        }
    },
    
    setupReciterSelection() {
        document.querySelectorAll('.reciter-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.reciter-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                AppState.ui.selectedReciter = card.dataset.reciter;
            });
        });
    },
    
    setupAudioPlayback() {
        document.querySelectorAll('.play-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const surahNumber = button.dataset.surah;
                this.playAudio(surahNumber);
            });
        });
        
        document.querySelectorAll('.audio-surah-item').forEach(item => {
            item.addEventListener('click', () => {
                const surahNumber = item.dataset.surah;
                this.playAudio(surahNumber);
            });
        });
    },
    
    async playAudio(surahNumber) {
        const reciter = AppState.ui.selectedReciter || 'ar.alafasy';
        const audioPlayer = document.getElementById('audioPlayer');
        const audioElement = document.getElementById('audioElement');
        const playerSurahName = document.getElementById('playerSurahName');
        const playerReciter = document.getElementById('playerReciter');
        
        if (!audioPlayer || !audioElement) return;
        
        try {
            // Trouver les infos de la sourate
            const surah = AppState.data.surahs.find(s => s.number == surahNumber);
            if (!surah) return;
            
            // URL de l'audio
            const audioUrl = `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${surahNumber}.mp3`;
            
            // Mettre à jour l'interface
            playerSurahName.textContent = `${surah.englishName} - ${surah.name}`;
            const activeReciter = document.querySelector('.reciter-card.active');
            if (activeReciter) {
                playerReciter.textContent = activeReciter.querySelector('.reciter-name').textContent;
            }
            
            // Charger l'audio
            audioElement.src = audioUrl;
            audioPlayer.style.display = 'block';
            
            // Scroll vers le lecteur
            audioPlayer.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Erreur lecture audio:', error);
            alert('Erreur lors de la lecture audio. Vérifiez votre connexion.');
        }
    },
    
    loadCalendarSection() {
        this.updateCalendar();
        
        const calendarSection = document.getElementById('calendarSection');
        if (!calendarSection) return;
        
        const today = new Date();
        const hijriDate = this.getHijriDate(today);
        
        calendarSection.innerHTML = `
            <div class="calendar-container">
                <div class="calendar-header">
                    <h2>📅 Calendrier Hijri</h2>
                </div>
                
                <div class="date-display">
                    <div class="hijri-date" id="hijriDate">${hijriDate}</div>
                    <div class="gregorian-date" id="gregorianDate">
                        ${today.toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                </div>
                
                <div class="islamic-events">
                    <h3>Événements islamiques</h3>
                    <div class="events-list">
                        <div class="event-item">
                            <div class="event-date">15 Ramadan</div>
                            <div class="event-name">Nuit du Destin (Laylat al-Qadr)</div>
                        </div>
                        <div class="event-item">
                            <div class="event-date">1 Shawwal</div>
                            <div class="event-name">Aïd al-Fitr</div>
                        </div>
                        <div class="event-item">
                            <div class="event-date">10 Dhu al-Hijjah</div>
                            <div class="event-name">Aïd al-Adha</div>
                        </div>
                        <div class="event-item">
                            <div class="event-date">10 Muharram</div>
                            <div class="event-name">Jour d'Achoura</div>
                        </div>
                    </div>
                </div>
                
                <div class="month-navigation">
                    <button class="nav-month-btn" id="prevMonthBtn">← Mois précédent</button>
                    <button class="nav-month-btn" id="nextMonthBtn">Mois suivant →</button>
                </div>
            </div>
        `;
        
        // Ajouter les événements de navigation
        const prevMonthBtn = document.getElementById('prevMonthBtn');
        const nextMonthBtn = document.getElementById('nextMonthBtn');
        
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => this.changeMonth(-1));
        }
        
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => this.changeMonth(1));
        }
    },
    
    loadBookmarksSection() {
        const bookmarksSection = document.getElementById('bookmarksSection');
        if (!bookmarksSection) return;
        
        if (!AppState.data.favorites || AppState.data.favorites.length === 0) {
            bookmarksSection.innerHTML = `
                <div class="bookmarks-empty">
                    <div class="empty-icon">⭐</div>
                    <h2>Mes Favoris</h2>
                    <p>Aucun favori pour le moment</p>
                    <p class="empty-subtitle">Ajoutez des sourates à vos favoris pour les retrouver facilement</p>
                    <button class="browse-button" id="browseSurahsBtn">
                        Parcourir les sourates
                    </button>
                </div>
            `;
            
            const browseSurahsBtn = document.getElementById('browseSurahsBtn');
            if (browseSurahsBtn) {
                browseSurahsBtn.addEventListener('click', () => this.showSection('quran'));
            }
            
            return;
        }
        
        const favoriteSurahs = AppState.data.surahs.filter(s => AppState.data.favorites.includes(s.number));
        
        let html = `
            <div class="bookmarks-container">
                <div class="bookmarks-header">
                    <h2>⭐ Mes Favoris</h2>
                    <p>${favoriteSurahs.length} sourate(s) favorite(s)</p>
                </div>
                <div class="favorites-list">
        `;
        
        favoriteSurahs.forEach(surah => {
            html += `
                <div class="favorite-item" data-surah="${surah.number}">
                    <div class="favorite-number">${surah.number}</div>
                    <div class="favorite-info">
                        <div class="favorite-name">${surah.englishName}</div>
                        <div class="favorite-arabic">${surah.name}</div>
                        <div class="favorite-meta">${surah.englishNameTranslation} • ${surah.numberOfAyahs} versets</div>
                    </div>
                    <button class="remove-favorite" data-surah="${surah.number}">❌</button>
                </div>
            `;
        });
        
        html += '</div></div>';
        bookmarksSection.innerHTML = html;
        
        // Ajouter les événements
        this.setupBookmarksEvents();
    },

    setupBookmarksEvents() {
        // Clic sur une sourate favorite
        document.querySelectorAll('.favorite-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-favorite')) return;
                const surahNumber = parseInt(item.dataset.surah);
                this.loadSurah(surahNumber);
            });
        });
        
        // Supprimer des favoris
        document.querySelectorAll('.remove-favorite').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const surahNumber = parseInt(button.dataset.surah);
                this.toggleFavorite(surahNumber);
                this.loadBookmarksSection(); // Recharger la section
            });
        });
    },

    loadSettingsSection() {
        const settingsSection = document.getElementById('settingsSection');
        if (!settingsSection) return;

        settingsSection.innerHTML = `
            <div class="settings-container">
                <button class="back-button" id="backToHome">← Accueil</button>
                <h2 style="margin-top:1rem;">⚙️ Paramètres</h2>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" id="darkModeToggle" ${AppState.ui.darkMode ? 'checked' : ''}>
                        Mode sombre
                    </label>
                </div>
            </div>
        `;

        const backBtn = document.getElementById('backToHome');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showSection('home'));
        }

        const darkToggle = document.getElementById('darkModeToggle');
        if (darkToggle) {
            darkToggle.addEventListener('change', () => {
                document.body.classList.toggle('dark-mode', darkToggle.checked);
                AppState.ui.darkMode = darkToggle.checked;
                Storage.save();
            });
        }
    },
    
    toggleFavorite(surahNumber) {
        if (!AppState.data.favorites) AppState.data.favorites = [];
        
        const index = AppState.data.favorites.indexOf(surahNumber);
        if (index === -1) {
            AppState.data.favorites.push(surahNumber);
        } else {
            AppState.data.favorites.splice(index, 1);
        }
        
        Storage.save();
        
        // Mettre à jour l'icône si on est dans la lecture
        const favoriteButton = document.getElementById('favoriteBtn');
        if (favoriteButton) {
            favoriteButton.innerHTML = AppState.data.favorites.includes(surahNumber) ? '❤️' : '🤍';
        }
    },

    searchSurahs(query) {
        if (!query) return AppState.data.surahs;
        return AppState.data.surahs.filter(s =>
            s.englishName.toLowerCase().includes(query) ||
            s.englishNameTranslation.toLowerCase().includes(query) ||
            s.name.includes(query)
        );
    },

    renderSearchResults(results) {
        const container = document.getElementById('searchResults');
        if (!container) return;
        container.innerHTML = '';

        results.forEach(surah => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.dataset.surah = surah.number;
            div.innerHTML = `<strong>${surah.number}</strong> ${surah.englishName}`;
            container.appendChild(div);
        });
    },
    
    updatePrayerTimes() {
        const container = document.getElementById('prayerTimes');
        if (!container) return;
        
        const data = AppState.data.prayerTimes;
        
        if (!data || !data.timings) {
            container.innerHTML = '<p class="no-prayer-times">Horaires non disponibles</p>';
            return;
        }
        
        const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        const now = new Date();
        let nextPrayer = null;
        let nextPrayerTime = null;
        
        container.innerHTML = '';
        
        prayers.forEach(prayer => {
            const time = data.timings[prayer];
            if (!time) return;
            
            const [hours, minutes] = time.split(':');
            const prayerDate = new Date();
            prayerDate.setHours(parseInt(hours), parseInt(minutes), 0);
            
            const isPassed = prayerDate < now;
            const isNext = !isPassed && !nextPrayer;
            
            if (isNext) {
                nextPrayer = prayer;
                nextPrayerTime = prayerDate;
            }
            
            const div = document.createElement('div');
            div.className = `prayer-time ${isNext ? 'active' : ''}`;
            div.innerHTML = `
                <div class="prayer-name">${this.translatePrayer(prayer)}</div>
                <div class="prayer-hour">${time}</div>
            `;
            
            container.appendChild(div);
        });
        
        // Afficher la prochaine prière
        if (nextPrayer && nextPrayerTime) {
            this.updateNextPrayer(nextPrayer, nextPrayerTime);
        }
    },
    
    translatePrayer(prayer) {
        const translations = {
            'Fajr': 'Fajr',
            'Dhuhr': 'Dhuhr', 
            'Asr': 'Asr',
            'Maghrib': 'Maghrib',
            'Isha': 'Isha'
        };
        return translations[prayer] || prayer;
    },
    
    updateNextPrayer(name, time) {
        const container = document.getElementById('nextPrayer');
        const nameEl = document.getElementById('nextPrayerName');
        const timeEl = document.getElementById('nextPrayerTime');
        
        if (!container || !nameEl || !timeEl) return;
        
        container.style.display = 'block';
        nameEl.textContent = this.translatePrayer(name);
        
        // Calculer le temps restant
        const updateTime = () => {
            const now = new Date();
            const diff = time - now;
            
            if (diff < 0) {
                this.updatePrayerTimes();
                return;
            }
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            timeEl.textContent = hours > 0 ? `${hours}h ${minutes}min` : `${minutes} min`;
        };
        
        updateTime();
        
        // Mettre à jour chaque minute
        if (this.prayerTimer) clearInterval(this.prayerTimer);
        this.prayerTimer = setInterval(updateTime, 60000);
    },
    
    updateCalendar() {
        const hijriDateEl = document.getElementById('hijriDate');
        const gregorianDateEl = document.getElementById('gregorianDate');
        
        if (!hijriDateEl || !gregorianDateEl) return;
        
        const today = new Date();
        const hijriDate = this.getHijriDate(today);
        
        hijriDateEl.textContent = hijriDate;
        gregorianDateEl.textContent = today.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    getHijriDate(date) {
        // Calcul simplifié - dans une vraie app, utiliser une bibliothèque
        const hijriMonths = [
            'Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani',
            'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban',
            'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
        ];
        
        // Approximation simple
        const hijriYear = 1446;
        const monthIndex = date.getMonth();
        const day = date.getDate();
        
        return `${day} ${hijriMonths[monthIndex]} ${hijriYear}`;
    },
    
    changeMonth(direction) {
        // Fonction pour naviguer dans le calendrier
        console.log('Navigation calendrier:', direction);
        // Implémentation simplifiée - dans une vraie app, mettre à jour le calendrier
        alert('Fonctionnalité de navigation dans le calendrier à implémenter');
    }
};