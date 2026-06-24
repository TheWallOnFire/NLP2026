import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useSettingsStore } from '../../features/settings/store/useSettingsStore';

import en from './locales/en';
import vi from './locales/vi';

const resources = {
  en,
  vi
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: useSettingsStore.getState().language || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// Sync language changes from Zustand store
useSettingsStore.subscribe((state, prevState) => {
  if (state.language !== prevState?.language) {
    i18n.changeLanguage(state.language);
  }
});

export default i18n;
