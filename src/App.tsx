// ai-erp-frontend/src/App.tsx
// (V5.0 - 移除 FormTemplate)

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Spin } from 'antd';

// --- 狀態管理 ---
import { useAuthStore } from './store/authStore';

// --- (新！) 守衛 ---
import ActivationGuard from './components/ActivationGuard';

// --- 公開頁面 ---
import WrappedIndexPage from './pages/IndexPage';
import LineCallbackPage from './pages/LineCallbackPage';

// --- (新！) 啟用頁面 ---
import WrappedActivateAccountPage from './pages/ActivateAccountPage';
// (新！) Email 啟用回調頁面
import ActivateEmailPage from './pages/ActivateEmailPage'; 

// --- 私有 (內部) 頁面 ---
import DashboardPage from './pages/DashboardPage';
import CompanyPage from './pages/CompanyPage';
import WrappedUserPage from './pages/UserPage';

/**
 * (V5.0) 
 * 我們不再需要 PrivateRoutes，
 * 我們將「初始化 Spinner」和「Token 檢查」
 * 全部移到 App() 元件中，邏輯更清晰
 */

function App() {
  const { token, fetchCurrentUser, isInitializing, _setIsInitializing } = useAuthStore();

  // --- (關鍵) 初始化邏輯 ---
  useEffect(() => {
    const initializeApp = async () => {
      if (token) {
        try {
          await fetchCurrentUser();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          // (authStore.ts 會自動登出)
        }
      } else {
        _setIsInitializing(false);
      }
    };
    initializeApp();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // 1. 在「路由層級」處理「初始化」
  if (isInitializing) {
    return (
      <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="應用程式載入中..." />
      </Layout>
    );
  }

  // (新) V5.0 路由結構
  return (
    <BrowserRouter>
      <Routes>

        {/* --- A. 公開路由 (所有人可見) --- */}
        <Route 
          path="/" 
          element={token ? <Navigate to="/dashboard" replace /> : <WrappedIndexPage />} 
        />
        <Route 
          path="/auth/line/callback" 
          element={<LineCallbackPage />} 
        />
        {/* (新) Email 啟用連結點擊後到達的頁面 */}
        <Route
          path="/activate-email"
          element={<ActivateEmailPage />}
        />

        {/* --- B. 啟用路由 (已登入、未啟用) --- */}
        <Route 
          path="/activate-account"
          element={!token ? <Navigate to="/" replace /> : <WrappedActivateAccountPage />}
        />

        {/* --- C. 受保護路由 (已登入、已啟用) --- */}
        {/* (ActivationGuard 會檢查 Token 和 is_active) */}
        <Route element={<ActivationGuard />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/companies" element={<CompanyPage />} />
          <Route path="/users" element={<WrappedUserPage />} />
          {/* (已移除 form-templates) */}
        </Route>

        {/* D. 404 頁面 */}
        {/* ( ... 您的 404 路由 ... ) */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;