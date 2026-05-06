import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import es from './es.json';
import en from './en.json';
import fr from './fr.json';
import pt from './pt.json';
import de from './de.json';

const resources = {
    en: {
        translation: en
    },
    es: {
        translation: es
    },
    fr: {
        translation: fr
    },
    pt: {
        translation: pt
    },
    de: {
        translation: de
    }
}

const deviceLanguage = Localization.getLocales()[0].languageCode ?? 'es';

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: deviceLanguage,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        compatibilityJSON: 'v4',
    });

export default i18n;