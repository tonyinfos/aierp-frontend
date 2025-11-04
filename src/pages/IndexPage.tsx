import React, { useState, useEffect, useCallback } from 'react'; // 匯入 useEffect, useCallback
import { useTranslation } from 'react-i18next';
import {
    Layout, Button, Typography, Modal, Alert, Spin, App,
    Dropdown, Space, Divider
} from 'antd';
import type { MenuProps } from 'antd';
import {
    SunOutlined, MoonOutlined, GlobalOutlined, GoogleOutlined,
    WechatOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
// 匯入 Google Login Hook
import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import apiClient from '../api/apiClient';

const { Header, Content } = Layout;
// (修正！) 確保 AntLink (Typography.Link) 被正確匯出
const { Title, Paragraph } = Typography;

const GOOGLE_CALLBACK_URL = "/auth/google/callback"; // Google 回調

const IndexPage: React.FC = () => {
    // --- Hooks ---
    const { message } = App.useApp();
    const { t, i18n } = useTranslation();
    const location = useLocation(); // 用於接收 "立即登入" 訊號
    const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const setToken = useAuthStore((state) => state.setToken);
    const { themeMode, toggleTheme } = useThemeStore();

    // --- 語言切換 ---
    const changeLanguage = (lng: string) => { i18n.changeLanguage(lng); };
    const languageMenuItems: MenuProps['items'] = [
        { key: 'zh-TW', label: '繁體中文' },
        { key: 'en', label: 'English' },
    ];
    // ---------------

    // --- Modal 控制 ---
    const showLoginModal = useCallback(() => {
        setError(null);
        setIsLoginModalVisible(true);
    }, []); // 無依賴
    
    const handleLoginCancel = () => { setIsLoginModalVisible(false); };

    // (還原！) 監聽路由 state，用於「立即登入」跳轉
    useEffect(() => {
        if (location.state?.openLoginModal) {
            showLoginModal();
        }
    }, [location.state, showLoginModal]);
    // -----------------

    // --- Google 登入邏輯 ---
    const handleGoogleLoginSuccess = async (code: string) => {
        setLoading(true); setError(null);
        try {
            const response = await apiClient.post(GOOGLE_CALLBACK_URL, { code: code });
            const { 
                access_token, 
                message: serverMessage, 
                is_new_user, 
                notifications_sent,
                email_sent,
                system_notification_created 
            } = response.data;
            
            await setToken(access_token);
            setLoading(false);
            
            // 顯示服務器返回的個人化訊息
            if (serverMessage) {
                if (is_new_user) {
                    message.success(serverMessage, 4); // 新用戶訊息顯示稍長
                    
                    // 顯示通知發送狀態
                    if (notifications_sent) {
                        setTimeout(() => {
                            let notificationMessage = '📬 通知已發送！';
                            if (email_sent) {
                                notificationMessage += '\n✅ 歡迎郵件已發送至您的信箱';
                            }
                            if (system_notification_created) {
                                notificationMessage += '\n🔔 系統通知已建立';
                            }
                            
                            message.info({
                                content: notificationMessage,
                                duration: 3,
                            });
                        }, 1500);
                    }
                } else {
                    message.success(serverMessage, 2); // 回歸用戶訊息正常顯示
                }
            } else {
                message.success(t('loginSuccess'));
            }
            
            setIsLoginModalVisible(false);
        } catch (err: unknown) {
            setLoading(false);
            if (axios.isAxiosError(err)) {
                 if (err.response && err.response.data && err.response.data.detail) { setError(err.response.data.detail); }
                 else { setError(t('connectionError', { message: err.message })); }
            } else { setError(t('googleLoginFailed', 'Google 登入失敗')); }
        }
    };
    const googleLogin = useGoogleLogin({
        flow: 'auth-code',
        onSuccess: (credentialResponse) => { handleGoogleLoginSuccess(credentialResponse.code); },
        onError: (errorResponse) => { console.error("Google 登入失敗:", errorResponse); setError(t('googleLoginFailed', 'Google 登入失敗')); },
    });
    // -----------------------

    // (修改！) 處理 LINE 登入的函式
  const handleLineLogin = () => {
    // 1. 讀取 .env 中的設定
    const channelId = import.meta.env.VITE_LINE_CHANNEL_ID;
    const redirectUri = import.meta.env.VITE_LINE_REDIRECT_URI;

    if (!channelId || !redirectUri) {
      setError("LINE 登入設定缺失，請聯繫管理員。");
      return;
    }

    // 2. 產生一個 state (用於 CSRF 防護)
    const state = Math.random().toString(36).substring(2);
    // (可選) 將 state 存到 localStorage 以便稍後在 callback 頁面驗證
    localStorage.setItem('line_oauth_state', state);

    // 3. 組合 LINE 授權 URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: channelId,
      redirect_uri: redirectUri,
      state: state,
      scope: 'profile openid email', // 請求 Email (需要申請) 和 profile
    });

    const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;

    // 4. (關鍵！) 重定向到 LINE
    window.location.href = lineAuthUrl;
  };



    // --- JSX 渲染 ---
    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* 頂部 Header */}
            <Header style={{ padding: '0 24px', display: 'flex', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0, flexGrow: 1, color: '#fff' }}>
                    {t('appName')} - {t('publicPortal', '入口網')}
                </Title>
                <Space>
                    {/* (還原！) 語言切換 (包含文字) */}
                    <Dropdown menu={{ items: languageMenuItems, onClick: (e) => changeLanguage(e.key) }} placement="bottomRight">
                        <Button type="text" icon={<GlobalOutlined />} style={{ color: '#fff' }}>
                            {i18n.language.startsWith('zh') ? '繁中' : 'EN'}
                        </Button>
                    </Dropdown>
                    {/* 主題切換 */}
                    <Button type="text" icon={themeMode === 'dark' ? <SunOutlined /> : <MoonOutlined />} onClick={toggleTheme} style={{ color: '#fff' }}/>
                    {/* 登入按鈕 */}
                    <Button type="link" size="middle" onClick={showLoginModal} style={{ color: '#fff' }}>
                        {t('login')}
                    </Button>
                </Space>
            </Header>

            {/* (還原！) 主要內容區 (包含歡迎詞) */}
            <Content style={{ padding: '48px', margin: '24px', borderRadius: '8px' }}> {/* 移除 background，繼承主題 */}
                <Title level={2}>{t('welcome')}</Title>
                <Paragraph style={{ fontSize: '16px' }}>{t('indexDescription1')}</Paragraph>
                <Paragraph style={{ fontSize: '16px' }}>{t('indexDescription2')}</Paragraph>
            </Content>

            {/* 統一第三方登入 Modal */}
            <Modal
                title={t('loginModalTitle', '選擇登入方式')}
                open={isLoginModalVisible}
                onCancel={handleLoginCancel}
                footer={null}
                destroyOnClose={true}
                width={400}
            >
                <Spin spinning={loading} tip={t('authenticating', '認證中...')}>
                    <div style={{ padding: '20px 0' }}>
                        <Title level={4} style={{ textAlign: 'center', marginBottom: '24px' }}>
                            {t('chooseLoginMethod', '選擇您偏好的登入方式')}
                        </Title>
                        
                        {error && (
                            <Alert 
                                message={error} 
                                type="error" 
                                showIcon 
                                closable 
                                onClose={() => setError(null)}
                                style={{ marginBottom: '16px' }}
                            />
                        )}

                        {/* 第三方登入按鈕組 */}
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            {/* Google 登入 */}
                            <Button 
                                icon={<GoogleOutlined />} 
                                size="large"
                                style={{ 
                                    width: '100%', 
                                    height: '48px',
                                    background: '#4285f4', 
                                    borderColor: '#4285f4',
                                    color: 'white',
                                    fontSize: '16px'
                                }} 
                                onClick={() => googleLogin()}
                            >
                                {t('loginWithGoogle', '使用 Google 登入')}
                            </Button>

                            {/* LINE 登入 */}
                            <Button 
                                icon={<WechatOutlined />} // 暫用，之後可改成 LINE 圖示
                                size="large"
                                style={{ 
                                    width: '100%', 
                                    height: '48px',
                                    background: '#06C755', 
                                    borderColor: '#06C755',
                                    color: 'white',
                                    fontSize: '16px'
                                }}
                                onClick={() => handleLineLogin()}
                            >
                                {t('loginWithLine', '使用 LINE 登入')}
                            </Button>

                            {/* 未來的第三方登入選項 */}
                            <Divider>{t('comingSoon', '即將推出')}</Divider>
                            
                            {/* Apple 登入 (即將推出) */}
                            <Button 
                                disabled
                                size="large"
                                style={{ 
                                    width: '100%', 
                                    height: '48px',
                                    fontSize: '16px'
                                }}
                            >
                                🍎 {t('loginWithApple', '使用 Apple ID 登入')} ({t('comingSoon', '即將推出')})
                            </Button>

                            {/* 手機簡訊登入 (即將推出) */}
                            <Button 
                                disabled
                                size="large"
                                style={{ 
                                    width: '100%', 
                                    height: '48px',
                                    fontSize: '16px'
                                }}
                            >
                                📱 {t('loginWithSMS', '使用手機簡訊登入')} ({t('comingSoon', '即將推出')})
                            </Button>
                        </Space>

                        <div style={{ marginTop: '24px', textAlign: 'center', color: '#666' }}>
                            <Paragraph style={{ fontSize: '14px', margin: 0 }}>
                                {t('secureLoginNotice', '我們採用第三方安全認證，無需記住密碼')}
                            </Paragraph>
                        </div>
                    </div>
                </Spin>
            </Modal>
        </Layout>
    );
};

// 匯出包裝過的元件 (為了 App.useApp)
const WrappedIndexPage: React.FC = () => ( <App> <IndexPage /> </App> );
export default WrappedIndexPage;