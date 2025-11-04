import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';
// (新) 匯入 Input (OTP)
import { Layout, Card, Typography, Button, Spin, Alert, App, Divider, Input } from 'antd'; 
import { MailOutlined, WechatOutlined, MessageOutlined } from '@ant-design/icons';
import apiClient from '../api/apiClient';
import axios from 'axios';
//import { useTranslation } from 'react-i18next';

const { Title, Paragraph, Text } = Typography;
const { Content } = Layout;

interface LineBotInfo {
  bot_id: string;
  add_url: string;
  qr_code_url: string;
}

interface LineBindingInfo {
  is_active: boolean;
  binding_code?: string;
  expires_at?: string;
  message: string;
}

const ActivateAccountPage: React.FC = () => {
  const { user, fetchCurrentUser, setToken } = useAuthStore(); // (新) 取得 setToken
  const { message } = App.useApp();
  //const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [lineLoading, setLineLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lineBotInfo, setLineBotInfo] = useState<LineBotInfo | null>(null);

  // (新) 用於 Google OTP
  const [emailOtp, setEmailOtp] = useState(''); 
  const [isSendingCode, setIsSendingCode] = useState(false);

  // (新) 用於 LINE 綁定
  const [lineBindingInfo, setLineBindingInfo] = useState<LineBindingInfo | null>(null);

  // --- (V5.1 邏輯) 判斷使用者類型 ---
  const isGoogleUser = user?.provider === 'google';
  const isLineUser = user?.provider === 'line';

  // --- 獲取 LINE Bot 資訊 (僅在 LINE 用戶需要時) ---
  useEffect(() => {
    const getLineBotInfo = async () => {
      if (isLineUser && !user?.is_active) {
        try {
          setLineLoading(true);
          const response = await apiClient.get('/auth/line/bot-info');
          setLineBotInfo(response.data);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          setError("無法獲取 LINE Bot 資訊，請稍後再試。");
        } finally {
          setLineLoading(false);
        }
      }
    };
    getLineBotInfo();
  }, [isLineUser, user?.is_active]);

  // --- (新) 獲取 LINE 綁定狀態 ---
  useEffect(() => {
    const getLineBindingStatus = async () => {
      if (isLineUser && !user?.is_active) {
        try {
          const response = await apiClient.post('/auth/line/check-binding');
          setLineBindingInfo(response.data);
        } catch (error) {
          console.error('獲取 LINE 綁定狀態失敗:', error);
        }
      }
    };
    getLineBindingStatus();
  }, [isLineUser, user?.is_active]);

// --- (新) 定期檢查 LINE 綁定狀態 ---
useEffect(() => {
  let interval: number | undefined;  // 🔧 修正類型定義
  
  if (isLineUser && !user?.is_active && lineBindingInfo?.binding_code) {
    interval = window.setInterval(async () => {  // 🔧 使用 window.setInterval
      try {
        const response = await apiClient.post('/auth/line/check-binding');
        setLineBindingInfo(response.data);
        
        if (response.data.is_active) {
          message.success('LINE 綁定成功！帳號已啟用');
          await fetchCurrentUser(); // 重新取得用戶資訊
        }
      } catch (error) {
        console.error('檢查 LINE 綁定狀態失敗:', error);
      }
    }, 5000); // 每5秒檢查一次
  }

  return () => {
    if (interval) {
      window.clearInterval(interval);  // 🔧 使用 window.clearInterval
    }
  };
}, [isLineUser, user?.is_active, lineBindingInfo?.binding_code, fetchCurrentUser, message]);

  // --- (保持不變) 處理 Email 驗證 (發送 OTP) ---
  const handleSendEmailVerification = async () => {
    setIsSendingCode(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/email/send-verification');
      message.success(response.data.message || '驗證碼已發送');
    } catch (err: unknown) { 
      if (axios.isAxiosError(err)) { 
        setError(err.response?.data?.detail || '發送失敗');
      } else {
        setError('發送時發生未知錯誤');
      }
    }
    setIsSendingCode(false);
  };

  // --- (保持不變) 處理 Email 驗證 (提交 OTP) ---
  const handleVerifyEmailOTP = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/email/verify', { code: emailOtp });
      message.success(response.data.message || 'Email 驗證成功！');
      await setToken(response.data.access_token);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) { 
        if (err.response && err.response.data && err.response.data.detail) {
          setError(err.response.data.detail);
        } else {
          setError(err.message); 
        }
      } else {
        setError('Email 驗證失敗');
      }
      setLoading(false);
    }
  };

  // --- (新) 手動檢查 LINE 綁定狀態 ---
  const handleCheckLineBindingStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/line/check-binding');
      setLineBindingInfo(response.data);
      
      if (response.data.is_active) {
        message.success('LINE 綁定成功！帳號已啟用');
        await fetchCurrentUser();
      } else {
        message.info('尚未完成綁定，請在 LINE Bot 中發送綁定碼');
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || '檢查綁定狀態失敗');
      } else {
        setError('檢查綁定狀態時發生未知錯誤');
      }
    }
    setLoading(false);
  };

  // --- 渲染邏輯 ---
  if (!user) return <Navigate to="/" replace />;
  if (user.is_active) return <Navigate to="/dashboard" replace />;

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Content style={{ padding: '24px' }}>
        <Card style={{ width: 500, maxWidth: '90%' }}>
          <Spin spinning={loading} tip="處理中...">
            <Title level={2} style={{ textAlign: 'center' }}>啟用您的帳號</Title>
            <Paragraph style={{ textAlign: 'center', fontSize: '16px' }}>
              歡迎您，{user.display_name}！
            </Paragraph>
            <Paragraph style={{ textAlign: 'center' }}>
              您的帳號尚未啟用。請完成您登入方式對應的驗證程序。
            </Paragraph>

            {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: '16px' }} />}

            <Divider />

            {/* --- 1. (V5.1) Google 啟用流程 --- */}
            {isGoogleUser && (
              <Card.Meta
                avatar={<MailOutlined />}
                title={'Email (待驗證)'}
                description={
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', paddingTop: '16px', gap: '16px' }}>
                    <Text type="secondary">
                      請點擊下方按鈕，系統將會發送一組 6 位數驗證碼至您的信箱：
                    </Text>
                    <Text strong>{user.email}</Text>
                    <Button
                      type="primary"
                      onClick={handleSendEmailVerification}
                      loading={isSendingCode}
                      style={{ width: '100%' }}
                    >
                      發送驗證碼
                    </Button>

                    <Divider />

                    <Text type="secondary">請輸入您收到的 6 位數驗證碼：</Text>
                    <Input 
                      placeholder="123456" 
                      maxLength={6} 
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      style={{ width: '150px', textAlign: 'center' }}
                    />
                    <Button
                      type="primary"
                      onClick={handleVerifyEmailOTP}
                      disabled={emailOtp.length !== 6 || loading}
                      style={{ width: '100%', background: '#06C755', borderColor: '#06C755' }}
                    >
                      驗證並啟用帳號
                    </Button>
                  </div>
                }
                style={{ marginBottom: '24px' }}
              />
            )}

            {/* --- 2. (新) LINE 綁定流程 --- */}
            {isLineUser && (
              <div style={{ marginBottom: '24px' }}>
                {/* 步驟1：加入好友 */}
                <Card size="small" style={{ marginBottom: '16px' }}>
                  <Card.Meta
                    avatar={<WechatOutlined style={{ color: '#06C755' }} />}
                    title="步驟 1：加入 LINE Bot 好友"
                    description={
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', paddingTop: '16px' }}>
                        {lineLoading ? (
                          <Spin tip="QR Code 載入中..." />
                        ) : lineBotInfo ? (
                          <img 
                            src={lineBotInfo.qr_code_url} 
                            alt="LINE QR Code" 
                            style={{ width: 180, height: 180, border: '1px solid #f0f0f0' }} 
                          />
                        ) : (
                          <Alert message="無法載入 LINE QR Code" type="error" />
                        )}
                        
                        <Text type="secondary" style={{ textAlign: 'center' }}>
                          請使用手機 LINE 掃描 QR Code 或搜尋 ID <Text strong>{lineBotInfo?.bot_id}</Text> 加入好友
                        </Text>
                        
                        {lineBotInfo?.add_url && (
                          <Button 
                            type="default" 
                            onClick={() => window.open(lineBotInfo.add_url)}
                            style={{ width: '100%' }}
                          >
                            開啟 LINE 加入好友
                          </Button>
                        )}
                      </div>
                    }
                  />
                </Card>

                {/* 步驟2：發送綁定碼 */}
                <Card size="small" style={{ marginBottom: '16px' }}>
                  <Card.Meta
                    avatar={<MessageOutlined style={{ color: '#1890ff' }} />}
                    title="步驟 2：發送綁定碼"
                    description={
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', paddingTop: '16px' }}>
                        <Text type="secondary" style={{ textAlign: 'center' }}>
                          加入好友後，請在 LINE Bot 聊天室中發送以下綁定碼：
                        </Text>
                        
                        {lineBindingInfo?.binding_code ? (
                          <div style={{
                            padding: '16px',
                            backgroundColor: '#333435ff',
                            borderRadius: '8px',
                            textAlign: 'center'
                          }}>
                            <Text 
                              copyable 
                              style={{ 
                                fontSize: '24px', 
                                fontWeight: 'bold', 
                                letterSpacing: '4px',
                                fontFamily: 'monospace'
                              }}
                            >
                              {lineBindingInfo.binding_code}
                            </Text>
                          </div>
                        ) : (
                          <Spin />
                        )}
                        
                        {lineBindingInfo?.expires_at && (
                          <Text type="warning" style={{ fontSize: '12px' }}>
                            ⚠️ 此綁定碼將於 {new Date(lineBindingInfo.expires_at).toLocaleString()} 過期
                          </Text>
                        )}
                        
                        <Alert 
                          message="系統會自動檢測綁定狀態" 
                          description="完成綁定後，頁面會自動跳轉，無需手動重新整理"
                          type="info" 
                          showIcon 
                          style={{ width: '100%' }}
                        />
                      </div>
                    }
                  />
                </Card>

                {/* 手動檢查按鈕 */}
                <Button
                  type="primary"
                  onClick={handleCheckLineBindingStatus}
                  disabled={loading}
                  style={{ 
                    background: '#06C755', 
                    borderColor: '#06C755', 
                    width: '100%',
                    height: '40px'
                  }}
                >
                  {loading ? '檢查中...' : '手動檢查綁定狀態'}
                </Button>
              </div>
            )}

          </Spin>
        </Card>
      </Content>
    </Layout>
  );
};

// (匯出 Wrapper - 保持不變)
const WrappedActivateAccountPage: React.FC = () => (
  <App>
    <ActivateAccountPage />
  </App>
);

export default WrappedActivateAccountPage;