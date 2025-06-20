// Gestionnaire d'API
export const API = {
    baseUrls: {
        quran: 'https://api.alquran.cloud/v1',
        prayer: 'https://api.aladhan.com/v1'
    },
    
    async fetchSurahs() {
        try {
            const response = await fetch(`${this.baseUrls.quran}/surah`);
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Erreur chargement sourates:', error);
            return this.getOfflineSurahs();
        }
    },
    
    async fetchSurah(number, edition = 'quran-simple') {
        try {
            const response = await fetch(`${this.baseUrls.quran}/surah/${number}/${edition}`);
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Erreur chargement sourate:', error);
            return this.getOfflineSurah(number);
        }
    },
    
    async fetchPrayerTimes(lat, lon, method = 'MWL') {
        const date = new Date();
        const timestamp = Math.floor(date.getTime() / 1000);
        
        try {
            const response = await fetch(
                `${this.baseUrls.prayer}/timings/${timestamp}?latitude=${lat}&longitude=${lon}&method=${this.getMethodNumber(method)}`
            );
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Erreur horaires prière:', error);
            return this.getOfflinePrayerTimes();
        }
    },
    
    getMethodNumber(method) {
        const methods = {
            'MWL': 3,
            'ISNA': 2,
            'Egypt': 5,
            'UOIF': 12
        };
        return methods[method] || 3;
    },
    
    getOfflineSurahs() {
        // Données de base pour fonctionnement hors ligne
        return [
            { number: 1, englishName: "Al-Fatiha", name: "الفاتحة", englishNameTranslation: "The Opening", numberOfAyahs: 7, revelationType: "Meccan" },
            { number: 2, englishName: "Al-Baqarah", name: "البقرة", englishNameTranslation: "The Cow", numberOfAyahs: 286, revelationType: "Medinan" },
            { number: 3, englishName: "Ali 'Imran", name: "آل عمران", englishNameTranslation: "Family of Imran", numberOfAyahs: 200, revelationType: "Medinan" }
        ];
    },
    
    getOfflineSurah(number) {
        return null;
    },
    
    getOfflinePrayerTimes() {
        return {};
    }
};