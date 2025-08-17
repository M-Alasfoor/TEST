import React, { createContext, useContext, useState, useEffect } from 'react';

type Lang = 'en' | 'ar';

interface Ctx {
  lang: Lang;
  toggle: () => void;
}

const I18nCtx = createContext<Ctx>({ lang: 'en', toggle: () => {} });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);
  const toggle = () => setLang(l => (l === 'en' ? 'ar' : 'en'));
  return <I18nCtx.Provider value={{ lang, toggle }}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);
