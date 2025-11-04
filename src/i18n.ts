import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
// (新！) 匯入 HttpBackend 來載入 public/locales 下的檔案
import HttpBackend from 'i18next-http-backend'; 

i18n
  // 使用 HttpBackend 從伺服器 (public 資料夾) 載入翻譯檔
  .use(HttpBackend) 
  // 使用 LanguageDetector 自動偵測瀏覽器語言
  .use(LanguageDetector) 
  // 將 i18n 實例傳遞給 react-i18next
  .use(initReactI18next) 
  // 初始化 i18next
  .init({
    // 預設語言 (如果偵測不到或翻譯不存在時使用)
    fallbackLng: 'zh-TW', 
    debug: true, // 開發時開啟 debug 模式，方便看 log

    // 偵測語言的選項
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'], // 偵測順序：先看 localStorage -> 瀏覽器 -> html 標籤
      caches: ['localStorage'], // 將偵測到的語言緩存在 localStorage
    },

    // HttpBackend 的選項 (告訴它去哪裡載入 json)
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // {{lng}} 會被替換成語言代碼 (en, zh-TW), {{ns}} 是 namespace (預設 translation)
    },

    interpolation: {
      escapeValue: false, // React 已經會處理 XSS，不需要 i18next 再次 escape
    },

    // React-i18next 的選項 (可選)
    // react: {
    //   useSuspense: false // 如果您不想用 React Suspense
    // }
  });

export default i18n;