// ai-erp-frontend/src/components/ActivationGuard.tsx
// (V5.0 - 修正 AppLayout 匯入)

import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Navigate, Outlet } from 'react-router-dom';

// (關鍵修正！) 
// AppLayout.tsx 現在預設匯出 WrappedAppLayout
import AppLayout from './AppLayout'; 

/**
 * V5.0 啟用守衛
 * 檢查使用者是否 `is_active`
 */
const ActivationGuard: React.FC = () => {
  const { user, isInitializing } = useAuthStore(); // (isInitializing 在 V5.0 authStore 中已定義)

  if (isInitializing) {
    return null; // App.tsx 正在處理 Spinner
  }

  if (!user) {
    // (理論上不會發生，因為 App.tsx 會擋住)
    return <Navigate to="/" replace />;
  }

  if (!user.is_active) {
    // (關鍵！)
    // 使用者已登入 (有 Token)，但帳號「未啟用」
    // 強制導向到「啟用頁面」
    return <Navigate to="/activate-account" replace />;
  }

  // (成功！)
  // 使用者已登入 (有 Token) **且** 帳號已啟用
  // 渲染 App 佈局，並在 <Outlet> 中渲染子路由 (例如 /dashboard)
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
};

export default ActivationGuard;