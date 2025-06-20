import './styles/main.css';
import { AppState } from './js/state.js';
import { Storage } from './js/storage.js';
import { Setup } from './js/setup.js';
import { App } from './js/app.js';
import { setupGlobalFunctions } from './js/global-functions.js';

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    Storage.init();
    setupGlobalFunctions();
    Setup.init();
});

// Enregistrement du Service Worker (seulement en production)
if ('serviceWorker' in navigator && 
    window.location.hostname !== 'localhost' && 
    !window.location.hostname.includes('webcontainer') &&
    !window.location.hostname.includes('stackblitz')) {
    
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
} else {
    console.log('Service Worker skipped (development environment)');
}