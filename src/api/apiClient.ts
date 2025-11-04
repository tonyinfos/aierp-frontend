// ai-erp-frontend/src/api/apiClient.ts
// (V4.0 - 修正了攔截器)

import axios, { AxiosError } from 'axios';
// (新！) 直接匯入 useAuthStore (大腦)
import { useAuthStore } from '../store/authStore'; 

const baseURL = import.meta.env.VITE_API_BASE_URL;
if (!baseURL) { 
  console.error("錯誤：VITE_API_BASE_URL 未在 .env.development 中設定！"); 
}

const apiClient = axios.create({
  baseURL: baseURL, 
  timeout: 10000,
});

// --- (關鍵修正！) 請求攔截器 ---
apiClient.interceptors.request.use(
  (config) => {
    // (修正！) 不再讀取 localStorage
    // 而是「直接」從 Zustand store 的「記憶體」中獲取當前狀態
    const token = useAuthStore.getState().token; 

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// -----------------------------

// (回應攔截器 - 保持 V4.0)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      // 偵測到 401 (Token 失效或未授權) 時，呼叫 logout
      useAuthStore.getState().logout(); 
      console.error("Token 過期或無效，已自動登出");
    }
    return Promise.reject(error);
  }
);

export default apiClient;