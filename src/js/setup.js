import { AppState } from './state.js';
import { App } from './app.js';

// Gestionnaire de configuration initiale
export const Setup = {
    init() {
        const setupScreen = document.getElementById('setupScreen');
        const appContainer = document.getElementById('appContainer');
        
        if (localStorage.getItem('setupComplete')) {
            setupScreen.style.display = 'none';
            appContainer.style.display = 'block';
            App.init();
        } else {
            this.start();
        }
    },
    
    start() {
        AppState.currentStep = 1;
        this.updateProgress();
    },
    
    updateProgress() {
        const dots = document.querySelectorAll('.progress-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index < AppState.currentStep);
        });
    }
};