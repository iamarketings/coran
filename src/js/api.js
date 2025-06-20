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
        // Quelques sourates courtes disponibles hors ligne
        return [
            { number: 1, englishName: "Al-Fatiha", name: "الفاتحة", englishNameTranslation: "The Opening", numberOfAyahs: 7, revelationType: "Meccan" },
            { number: 112, englishName: "Al-Ikhlas", name: "الإخلاص", englishNameTranslation: "Sincerity", numberOfAyahs: 4, revelationType: "Meccan" },
            { number: 113, englishName: "Al-Falaq", name: "الفلق", englishNameTranslation: "Daybreak", numberOfAyahs: 5, revelationType: "Meccan" },
            { number: 114, englishName: "An-Nas", name: "الناس", englishNameTranslation: "Mankind", numberOfAyahs: 6, revelationType: "Meccan" }
        ];
    },

    getOfflineSurah(number) {
        const surahs = {
            1: {
                arabic: {
                    number: 1,
                    englishName: "Al-Fatiha",
                    englishNameTranslation: "The Opening",
                    name: "الفاتحة",
                    numberOfAyahs: 7,
                    ayahs: [
                        { numberInSurah: 1, text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" },
                        { numberInSurah: 2, text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ" },
                        { numberInSurah: 3, text: "الرَّحْمَٰنِ الرَّحِيمِ" },
                        { numberInSurah: 4, text: "مَالِكِ يَوْمِ الدِّينِ" },
                        { numberInSurah: 5, text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ" },
                        { numberInSurah: 6, text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ" },
                        { numberInSurah: 7, text: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ" }
                    ]
                },
                french: {
                    number: 1,
                    englishName: "Al-Fatiha",
                    englishNameTranslation: "L'Ouverture",
                    name: "Al-Fatiha",
                    numberOfAyahs: 7,
                    ayahs: [
                        { numberInSurah: 1, text: "Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux" },
                        { numberInSurah: 2, text: "Louange à Allah, Seigneur de l'univers" },
                        { numberInSurah: 3, text: "Le Tout Miséricordieux, le Très Miséricordieux" },
                        { numberInSurah: 4, text: "Maître du Jour de la rétribution" },
                        { numberInSurah: 5, text: "C'est Toi que nous adorons et c'est Toi dont nous implorons le secours" },
                        { numberInSurah: 6, text: "Guide-nous dans le droit chemin" },
                        { numberInSurah: 7, text: "le chemin de ceux que Tu as comblés de faveurs, non pas de ceux qui ont encouru Ta colère, ni des égarés" }
                    ]
                }
            },
            112: {
                arabic: {
                    number: 112,
                    englishName: "Al-Ikhlas",
                    englishNameTranslation: "Sincerity",
                    name: "الإخلاص",
                    numberOfAyahs: 4,
                    ayahs: [
                        { numberInSurah: 1, text: "قُلْ هُوَ اللَّهُ أَحَدٌ" },
                        { numberInSurah: 2, text: "اللَّهُ الصَّمَدُ" },
                        { numberInSurah: 3, text: "لَمْ يَلِدْ وَلَمْ يُولَدْ" },
                        { numberInSurah: 4, text: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ" }
                    ]
                },
                french: {
                    number: 112,
                    englishName: "Al-Ikhlas",
                    englishNameTranslation: "Le Monothéisme Pur",
                    name: "Al-Ikhlas",
                    numberOfAyahs: 4,
                    ayahs: [
                        { numberInSurah: 1, text: "Dis: Lui, Allah, est Unique" },
                        { numberInSurah: 2, text: "Allah, Le Seul à être imploré pour ce que nous désirons" },
                        { numberInSurah: 3, text: "Il n'a jamais engendré, n'a pas été engendré non plus" },
                        { numberInSurah: 4, text: "Et nul n'est égal à Lui" }
                    ]
                }
            },
            113: {
                arabic: {
                    number: 113,
                    englishName: "Al-Falaq",
                    englishNameTranslation: "Daybreak",
                    name: "الفلق",
                    numberOfAyahs: 5,
                    ayahs: [
                        { numberInSurah: 1, text: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ" },
                        { numberInSurah: 2, text: "مِن شَرِّ مَا خَلَقَ" },
                        { numberInSurah: 3, text: "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ" },
                        { numberInSurah: 4, text: "وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ" },
                        { numberInSurah: 5, text: "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ" }
                    ]
                },
                french: {
                    number: 113,
                    englishName: "Al-Falaq",
                    englishNameTranslation: "L'Aube Naissante",
                    name: "Al-Falaq",
                    numberOfAyahs: 5,
                    ayahs: [
                        { numberInSurah: 1, text: "Dis: Je me réfugie auprès du Seigneur de l'aube naissante" },
                        { numberInSurah: 2, text: "contre le mal des êtres qu'Il a créés" },
                        { numberInSurah: 3, text: "contre le mal de l'obscurité quand elle s'approfondit" },
                        { numberInSurah: 4, text: "contre le mal de celles qui soufflent sur les nœuds" },
                        { numberInSurah: 5, text: "contre le mal de l'envieux quand il envie" }
                    ]
                }
            },
            114: {
                arabic: {
                    number: 114,
                    englishName: "An-Nas",
                    englishNameTranslation: "Mankind",
                    name: "الناس",
                    numberOfAyahs: 6,
                    ayahs: [
                        { numberInSurah: 1, text: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ" },
                        { numberInSurah: 2, text: "مَلِكِ النَّاسِ" },
                        { numberInSurah: 3, text: "إِلَٰهِ النَّاسِ" },
                        { numberInSurah: 4, text: "مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ" },
                        { numberInSurah: 5, text: "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ" },
                        { numberInSurah: 6, text: "مِنَ الْجِنَّةِ وَالنَّاسِ" }
                    ]
                },
                french: {
                    number: 114,
                    englishName: "An-Nas",
                    englishNameTranslation: "Les Hommes",
                    name: "An-Nas",
                    numberOfAyahs: 6,
                    ayahs: [
                        { numberInSurah: 1, text: "Dis: Je me réfugie auprès du Seigneur des hommes" },
                        { numberInSurah: 2, text: "Le Souverain des hommes" },
                        { numberInSurah: 3, text: "Dieu des hommes" },
                        { numberInSurah: 4, text: "contre le mal du mauvais conseiller furtif" },
                        { numberInSurah: 5, text: "qui souffle le mal dans les poitrines des hommes" },
                        { numberInSurah: 6, text: "qu'il soit un djinn ou un être humain" }
                    ]
                }
            }
        };
        return surahs[number] || null;
    },
    
    getOfflinePrayerTimes() {
        return {};
    }
};