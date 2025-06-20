// État global de l'application
export const AppState = {
    currentStep: 1,
    config: {
        location: null,
        method: 'MWL',
        packages: ['essential'],
        language: 'fr'
    },
    data: {
        surahs: [],
        prayerTimes: {},
        favorites: [],
        downloads: {},
        lastSync: null
    },
    ui: {
        currentSection: 'home',
        darkMode: false,
        offline: false
    }
};