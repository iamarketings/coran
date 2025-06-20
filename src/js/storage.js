import { AppState } from './state.js';

// Gestionnaire de stockage local
export const Storage = {
    init() {
        const saved = localStorage.getItem('quranAppState');
        if (saved) {
            try {
                const parsedState = JSON.parse(saved);
                Object.assign(AppState, parsedState);
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
            }
        }
    },
    
    save() {
        try {
            localStorage.setItem('quranAppState', JSON.stringify(AppState));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
    },
    
    clear() {
        localStorage.clear();
    }
};