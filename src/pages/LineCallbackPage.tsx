import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout, Spin, Alert, App, Button } from 'antd';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/apiClient';
import axios from 'axios';

const LineCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const setToken = useAuthStore((state) => state.setToken);

  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  // 防重複請求
  const effectRan = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 使用 useCallback 包裝主要處理函數
  const handleLineCallback = useCallback(async () => {
    // 如果已經處理過，直接返回
    if (effectRan.current) {
      return;
    }

    // 立即標記為已處理
    effectRan.current = true;

    try {
      abortControllerRef.current = new AbortController();

      const code = searchParams.get('code');
      const error_param = searchParams.get('error');
      
      if (error_param) {
        setError(`LINE 授權失敗: ${error_param}`);
        setProcessing(false);
        return;
      }

      if (!code) {
        setError('無效的 LINE 登入請求：缺少授權碼。');
        setProcessing(false);
        return;
      }

      console.log('🔄 開始處理 LINE 授權碼');

      const response = await apiClient.post('/auth/line/callback', 
        { code }, 
        { signal: abortControllerRef.current.signal }
      );

      const { 
        access_token, 
        message: serverMessage, 
        is_new_user,
        needs_line_verification,
        binding_code,
        line_bot_id,
        line_qr_code_url
      } = response.data;
      
      console.log('✅ LINE 登入成功，回應:', response.data);
      
      await setToken(access_token);
      navigate('/auth/line/callback', { replace: true });
      
      if (needs_line_verification) {
        console.log('📱 需要 LINE 綁定驗證，綁定碼:', binding_code);
        message.info(serverMessage || '請完成 LINE 綁定驗證');
        
        navigate('/activate-account', { 
          state: { 
            fromLineCallback: true,
            message: serverMessage,
            bindingCode: binding_code,
            lineBotId: line_bot_id,
            qrCodeUrl: line_qr_code_url
          }
        });
      } else {
        console.log('🎉 LINE 登入完成，帳號已啟用');
        message.success(serverMessage || 'LINE 登入成功！');
        
        navigate('/', { 
          state: { 
            loginSuccess: true,
            message: serverMessage,
            isNewUser: is_new_user
          }
        });
      }

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('🚫 重複請求已取消');
        return;
      }

      console.error('❌ LINE 登入錯誤:', err);
      
      if (axios.isAxiosError(err)) { 
        if (err.response && err.response.data && err.response.data.detail) {
          setError(`登入失敗: ${err.response.data.detail}`);
        } else {
          setError(`網路錯誤: ${err.message}`); 
        }
      } else if (err instanceof Error) {
        setError(`錯誤: ${err.message}`);
      } else {
        setError('LINE 登入時發生未知錯誤');
      }
      setProcessing(false);
    }
  }, [searchParams, navigate, setToken, message, setError, setProcessing]);

  useEffect(() => {
    // 延遲執行以確保 DOM 已準備好
    const timeoutId = setTimeout(() => {
      handleLineCallback();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [handleLineCallback]);

  return (
    <Layout style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      {error ? (
        <Alert
          message="LINE 登入失敗"
          description={error}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={() => navigate('/')}>
              返回首頁
            </Button>
          }
        />
      ) : (
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" tip="正在處理 LINE 登入，請稍候..." />
          {processing && (
            <div style={{ marginTop: '16px', color: '#666' }}>
              <p>正在驗證您的 LINE 帳號...</p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

// (匯出 Wrapper - 保持不變)
const WrappedLineCallbackPage: React.FC = () => (
  <App>
    <LineCallbackPage />
  </App>
);

export default WrappedLineCallbackPage;