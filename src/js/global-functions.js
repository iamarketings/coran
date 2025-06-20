import { AppState } from './state.js';
import { Storage } from './storage.js';
import { API } from './api.js';
import { App } from './app.js';
import { Setup } from './setup.js';

// Fonctions globales accessibles depuis le HTML
export function setupGlobalFunctions() {
    // Rendre App accessible globalement
    window.App = App;
    
    // Fonctions de configuration
    window.nextStep = function() {
        const currentStepEl = document.getElementById(`step${AppState.currentStep}`);
        if (currentStepEl) {
            currentStepEl.classList.remove('active');
        }
        
        AppState.currentStep++;
        Setup.updateProgress();
        
        const nextStepEl = document.getElementById(`step${AppState.currentStep}`);
        if (nextStepEl) {
            setTimeout(() => {
                nextStepEl.classList.add('active');
            }, 100);
        }
    };

    window.requestLocation = function() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    AppState.config.location = { lat: latitude, lon: longitude };
                    
                    // Obtenir le nom de la ville
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                        const data = await response.json();
                        const city = data.address.city || data.address.town || data.address.village;
                        const country = data.address.country;
                        
                        AppState.config.location.name = `${city}, ${country}`;
                        const step2 = document.getElementById('step2');
                        if (step2) {
                            step2.innerHTML = `
                                <h2>📍 Localisation</h2>
                                <p style="color: var(--primary); font-size: 1.2rem; margin: 2rem 0;">
                                    ✓ ${city}, ${country}
                                </p>
                                <button class="setup-button" onclick="nextStep()">Continuer</button>
                            `;
                        }
                    } catch (error) {
                        console.error('Erreur géocodage:', error);
                        window.nextStep();
                    }
                },
                (error) => {
                    alert('Impossible d\'obtenir votre position. Veuillez entrer votre ville.');
                }
            );
        } else {
            alert('La géolocalisation n\'est pas supportée par votre navigateur.');
        }
    };

    window.searchCity = async function() {
        const cityInput = document.getElementById('cityInput');
        if (!cityInput || !cityInput.value) return;
        
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityInput.value)}&format=json&limit=1`);
            const data = await response.json();
            
            if (data.length > 0) {
                const location = data[0];
                AppState.config.location = {
                    lat: parseFloat(location.lat),
                    lon: parseFloat(location.lon),
                    name: location.display_name.split(',')[0] + ', ' + location.display_name.split(',').pop().trim()
                };
                window.nextStep();
            } else {
                alert('Ville non trouvée. Veuillez réessayer.');
            }
        } catch (error) {
            console.error('Erreur recherche ville:', error);
            alert('Erreur lors de la recherche. Veuillez réessayer.');
        }
    };

    window.finishSetup = async function() {
        const button = event.target;
        button.disabled = true;
        button.textContent = 'Téléchargement en cours...';
        
        // Récupérer la méthode sélectionnée
        const selectedMethod = document.querySelector('input[name="method"]:checked');
        if (selectedMethod) {
            AppState.config.method = selectedMethod.value;
        }
        
        // Récupérer les packages sélectionnés
        const checkboxes = document.querySelectorAll('#step4 input[type="checkbox"]:checked');
        AppState.config.packages = Array.from(checkboxes).map((cb, index) => {
            const labels = ['essential', 'daily', 'weekly'];
            return labels[index] || 'essential';
        });
        
        // Sauvegarder la configuration
        Storage.save();
        
        // Télécharger les données essentielles
        try {
            // Charger les sourates
            AppState.data.surahs = await API.fetchSurahs();
            
            // Charger les horaires de prière
            if (AppState.config.location) {
                const prayerData = await API.fetchPrayerTimes(
                    AppState.config.location.lat,
                    AppState.config.location.lon,
                    AppState.config.method
                );
                AppState.data.prayerTimes = prayerData;
            }
            
            // Marquer la configuration comme terminée
            localStorage.setItem('setupComplete', 'true');
            AppState.data.lastSync = Date.now();
            Storage.save();
            
            // Lancer l'application
            const setupScreen = document.getElementById('setupScreen');
            const appContainer = document.getElementById('appContainer');
            if (setupScreen) setupScreen.style.display = 'none';
            if (appContainer) appContainer.style.display = 'block';
            App.init();
            
        } catch (error) {
            console.error('Erreur téléchargement initial:', error);
            button.disabled = false;
            button.textContent = 'Réessayer';
            alert('Erreur lors du téléchargement. Veuillez vérifier votre connexion.');
        }
    };

    // Fonctions de navigation
    window.showSection = function(sectionName) {
        App.showSection(sectionName);
    };

    window.toggleDarkMode = function() {
        document.body.classList.toggle('dark-mode');
        AppState.ui.darkMode = !AppState.ui.darkMode;
        Storage.save();
    };

    window.toggleSearch = function() {
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.classList.toggle('active');
            const searchInput = searchContainer.querySelector('input');
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
                // Réafficher toutes les sourates lorsque la recherche s'ouvre
                App.renderSearchResults(AppState.data.surahs);
            }

            // Fermer avec Échap
            const handler = (e) => {
                if (e.key === 'Escape') {
                    searchContainer.classList.remove('active');
                    document.removeEventListener('keydown', handler);
                }
            };
            document.addEventListener('keydown', handler);
        }
    };

    window.showSettings = function() {
        App.showSection('settings');
    };
}