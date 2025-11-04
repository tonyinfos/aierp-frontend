// ai-erp-frontend/src/pages/ActivateEmailPage.tsx
// (V5.2 - 終極修正版：使用 AbortController 處理 React 18 嚴格模式)

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout, Spin, Alert, App, Button } from 'antd';
import apiClient from '../api/apiClient';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

const ActivateEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const setToken = useAuthStore((state) => state.setToken);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // (已移除) useRef 旗標

  useEffect(() => {
    // (關鍵 1) 建立一個「中止控制器」
    const controller = new AbortController();

    const verifyEmailToken = async (token: string, signal: AbortSignal) => {
      try {
        // (關鍵 2) 將 signal 傳遞給 apiClient
        const response = await apiClient.post(
          '/auth/email/verify', 
          { token },
          { signal: signal } // <-- 傳遞 signal
        );

        // (成功！)
        message.success('Email 驗證成功！帳號已啟用。');
        await setToken(response.data.access_token);

      } catch (err: unknown) { 
        // (關鍵 3) 檢查錯誤是否為「手動中止」
        if (axios.isCancel(err)) {
          console.log('React 18 Strict Mode: 第一次 API 呼叫被正常中止。');
          return; // (安靜地失敗，這是預期行為)
        }

        // (處理「真正」的錯誤)
        if (axios.isAxiosError(err)) { 
          if (err.response && err.response.data && err.response.data.detail) {
            setError(err.response.data.detail); // (例如："帳號先前已啟用")
          } else {
            setError(err.message); 
          }
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Email 驗證失敗，連結可能已過期或無效。');
        }
        setLoading(false); // (只有失敗時才停止載入)
      }
    };

    const token = searchParams.get('token');
    if (!token) {
      setError('驗證連結無效：缺少 Token。');
      setLoading(false);
    } else {
      // (關鍵 4) 呼叫 API 並傳入 signal
      verifyEmailToken(token, controller.signal);
    }

    // (關鍵 5) 
    // 這是 useEffect 的「清理函式」
    // 當 React 18 嚴格模式「卸載」元件時，此函式會被呼叫
    return () => {
      controller.abort(); // <-- 中止「第一次」的 API 請求
    };

  }, [searchParams, navigate, setToken, message]); // (依賴項保持不變)

  // ... (return JSX 保持 100% 不變) ...
  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Spin spinning={loading} tip="正在驗證您的 Email...">
        {error && (
          <Alert
            message="驗證失敗"
            description={error}
            type="error"
            showIcon
            action={
              <Button type="primary" onClick={() => navigate('/')}>
                返回首頁
              </Button>
            }
          />
        )}
      </Spin>
    </Layout>
  );
};

// (匯出 Wrapper - 保持不變)
const WrappedActivateEmailPage: React.FC = () => (
  <App>
    <ActivateEmailPage />
  </App>
);

export default WrappedActivateEmailPage;