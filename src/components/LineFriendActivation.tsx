import React, { useState, useEffect, useCallback } from 'react';
import { 
    Card, Button, Typography, Steps, Space,
    Alert, Spin, message, Result 
} from 'antd';
import { 
    UserAddOutlined, CheckCircleOutlined, 
    WechatOutlined, ReloadOutlined 
} from '@ant-design/icons';
import apiClient from '../api/apiClient';

const { Title, Paragraph } = Typography;

interface ApiError {
    response?: {
        data?: {
            detail?: string;
        };
    };
}

interface LineFriendActivationProps {
    userLineId?: string;
    onActivationComplete?: () => void;
    onCancel?: () => void;
    onVerificationSuccess?: (token: string) => void;
}

const LineFriendActivation: React.FC<LineFriendActivationProps> = ({ 
    userLineId,
    onActivationComplete, 
    onCancel,
    onVerificationSuccess
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [checking, setChecking] = useState(false);
    const [activated, setActivated] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [qrCodeData, setQrCodeData] = useState<string | null>(null);
    const [loadingQR, setLoadingQR] = useState(true);
    
    const lineBotId = "@429xmgec";
    const lineAddUrl = `https://line.me/R/ti/p/${lineBotId}`;

    // 檢查好友狀態
    const checkFriendStatus = useCallback(async () => {
        setChecking(true);
        setError(null);
        
        try {
            const requestData = userLineId ? { user_line_id: userLineId } : {};
            const response = await apiClient.post('/auth/line/check-friend-status', requestData);
            const { status, message: serverMessage } = response.data;
            
            if (status === 'activated' || status === 'already_confirmed') {
                setActivated(true);
                setCurrentStep(2);
                message.success(serverMessage);
                
                // 延遲後完成激活
                setTimeout(() => {
                    // 使用新的 token 或呼叫完成回調
                    if (onVerificationSuccess && response.data.access_token) {
                        onVerificationSuccess(response.data.access_token);
                    } else if (onActivationComplete) {
                        onActivationComplete();
                    }
                }, 2000);
                
            } else if (status === 'pending') {
                setCurrentStep(0);
                setError('尚未檢測到好友關係，請確認已加入 Bot 為好友後再試');
            }
            
        } catch (err: unknown) {
            const errorMessage = (err as ApiError)?.response?.data?.detail || '檢查狀態時發生錯誤';
            setError(errorMessage);
        } finally {
            setChecking(false);
        }
    }, [onActivationComplete, onVerificationSuccess, userLineId]);

    // 載入動態 QR Code
    const loadQRCode = useCallback(async () => {
        try {
            setLoadingQR(true);
            const response = await apiClient.get('/api/auth/line/qrcode?size=280');
            if (response.data && response.data.qr_code) {
                setQrCodeData(response.data.qr_code);
            } else {
                console.error('QR Code 載入失敗');
                setQrCodeData(null);
            }
        } catch (error) {
            console.error('QR Code API 錯誤:', error);
            setQrCodeData(null);
        } finally {
            setLoadingQR(false);
        }
    }, []);

    // 初始化時載入 QR Code
    useEffect(() => {
        loadQRCode();
    }, [loadQRCode]);

    // 自動檢查（當用戶可能已完成加好友）
    useEffect(() => {
        const autoCheckInterval = setInterval(() => {
            if (!checking && !activated && currentStep === 1) {
                checkFriendStatus();
            }
        }, 5000); // 每 5 秒檢查一次

        return () => clearInterval(autoCheckInterval);
    }, [checking, activated, currentStep, checkFriendStatus]);

    const steps = [
        {
            title: '加入 LINE Bot',
            description: '掃描 QR Code 或搜尋 Bot ID',
            icon: <UserAddOutlined />
        },
        {
            title: '等待驗證',
            description: '系統正在驗證好友狀態',
            icon: <WechatOutlined />
        },
        {
            title: '啟用完成',
            description: '帳號已成功啟用',
            icon: <CheckCircleOutlined />
        }
    ];

    const handleAddFriend = () => {
        setCurrentStep(1);
        // 開啟 LINE 加好友連結
        window.open(lineAddUrl, '_blank');
        
        // 10 秒後自動檢查
        setTimeout(() => {
            checkFriendStatus();
        }, 10000);
    };

    if (activated) {
        return (
            <Card style={{ maxWidth: 600, margin: '0 auto' }}>
                <Result
                    status="success"
                    title="帳號啟用成功！"
                    subTitle="歡迎加入 AI-ERP 系統，您現在可以開始使用所有功能。"
                    extra={[
                        <Button type="primary" onClick={onActivationComplete} key="continue">
                            開始使用
                        </Button>
                    ]}
                />
            </Card>
        );
    }

    return (
        <Card style={{ maxWidth: 600, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Title level={3}>🤖 完成帳號啟用</Title>
                <Paragraph>
                    為了發送系統通知，請先加入我們的 LINE Bot 為好友
                </Paragraph>
            </div>

            <Steps current={currentStep} items={steps} style={{ marginBottom: 32 }} />

            {error && (
                <Alert
                    message={error}
                    type="warning"
                    showIcon
                    closable
                    onClose={() => setError(null)}
                    style={{ marginBottom: 24 }}
                />
            )}

            <div style={{ textAlign: 'center' }}>
                {currentStep === 0 && (
                    <Space direction="vertical" size="large">
                        <div>
                            <Title level={4}>方法一：掃描 QR Code</Title>
                            {loadingQR ? (
                                <div style={{ margin: '16px 0', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Spin size="large" tip="載入 QR Code..." />
                                </div>
                            ) : qrCodeData ? (
                                <div style={{ margin: '16px 0' }}>
                                    <img 
                                        src={`data:image/png;base64,${qrCodeData}`} 
                                        alt="LINE Bot QR Code" 
                                        style={{ maxWidth: '280px', height: 'auto' }}
                                    />
                                    <div style={{ marginTop: '8px' }}>
                                        <Button 
                                            icon={<ReloadOutlined />}
                                            onClick={loadQRCode}
                                            size="small"
                                        >
                                            重新載入 QR Code
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ margin: '16px 0', height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ marginBottom: '16px' }}>QR Code 載入失敗</div>
                                    <Button 
                                        icon={<ReloadOutlined />}
                                        onClick={loadQRCode}
                                        type="primary"
                                    >
                                        重新載入
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div>
                            <Title level={4}>方法二：搜尋 Bot ID</Title>
                            <Paragraph copyable={{ text: lineBotId }}>
                                <strong style={{ fontSize: '18px', color: '#1890ff' }}>
                                    {lineBotId}
                                </strong>
                            </Paragraph>
                        </div>

                        <Space size="middle">
                            <Button 
                                type="primary" 
                                size="large"
                                icon={<UserAddOutlined />}
                                onClick={handleAddFriend}
                                style={{ 
                                    background: '#06C755', 
                                    borderColor: '#06C755' 
                                }}
                            >
                                開啟 LINE 加好友
                            </Button>
                            {onCancel && (
                                <Button onClick={onCancel}>
                                    稍後再說
                                </Button>
                            )}
                        </Space>
                    </Space>
                )}

                {currentStep === 1 && (
                    <Space direction="vertical" size="large">
                        <Spin size="large" />
                        <Title level={4}>正在檢查好友狀態...</Title>
                        <Paragraph>
                            請確認已在 LINE 中加入 <strong>{lineBotId}</strong> 為好友
                        </Paragraph>
                        
                        <Space size="middle">
                            <Button 
                                icon={<ReloadOutlined />}
                                onClick={checkFriendStatus}
                                loading={checking}
                            >
                                手動檢查
                            </Button>
                            <Button 
                                icon={<UserAddOutlined />}
                                onClick={() => window.open(lineAddUrl, '_blank')}
                                style={{ 
                                    background: '#06C755', 
                                    borderColor: '#06C755',
                                    color: 'white'
                                }}
                            >
                                重新加好友
                            </Button>
                            <Button onClick={onCancel}>
                                取消
                            </Button>
                        </Space>
                    </Space>
                )}
            </div>
        </Card>
    );
};

export default LineFriendActivation;