import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Spin, App } from 'antd';
import { LockOutlined } from '@ant-design/icons';
// (新！) 匯入 Link, useNavigate, useSearchParams
import { useNavigate, useSearchParams } from 'react-router-dom'; 
import { useTranslation } from 'react-i18next';
import apiClient from '../api/apiClient';
import axios from 'axios';

const { Title } = Typography;

// 後端 API
const RESET_PASSWORD_URL = "/auth/reset-password"; 

// 表單型別
interface ResetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

const ResetPasswordPage: React.FC = () => {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // (新！) 用於讀取 URL 參數
  const [searchParams] = useSearchParams();
  // (新！) 儲存從 URL 拿到的 token
  const [token, setToken] = useState<string | null>(null); 

  // (新！) 元件載入時，從 URL 讀取 token
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    } else {
      setError(t('resetTokenMissing', '密碼重設連結無效或已過期。'));
    }
  }, [searchParams, t]);

  // 表單提交處理
  const onFinish = async (values: ResetPasswordFormValues) => {
    if (!token) {
      setError(t('resetTokenMissing', '密碼重設連結無效或已過期。'));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 呼叫後端 API
      await apiClient.post(RESET_PASSWORD_URL, {
        token: token, // 傳送從 URL 拿到的 token
        new_password: values.newPassword // 傳送新密碼
      });

      setLoading(false);
      setSuccess(true); // 顯示成功訊息
      message.success(t('passwordResetSuccess', '密碼已成功重設！'));
      form.resetFields();

    } catch (err: unknown) {
      setLoading(false);
      if (axios.isAxiosError(err)) {
        if (err.response && err.response.data && err.response.data.detail) {
          setError(err.response.data.detail); // (例如："密碼重設 Token 無效或已過期")
        } else {
          setError(t('connectionError', { message: err.message }));
        }
      } else {
        setError(t('unknownError', '發生未知錯誤'));
      }
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Card style={{ width: 450, maxWidth: '90%' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2}>{t('resetPasswordTitle', '重設您的密碼')}</Title>
        </div>

        <Spin spinning={loading} tip={t('processing', '處理中...')}>
          {/* 根據成功/失敗/正常狀態顯示不同內容 */}
          {success ? (
            // 成功
            <Alert
              message={t('passwordResetSuccessTitle', '密碼已重設')}
              description={t('passwordResetSuccessInfo', '您現在可以使用新密碼登入。')}
              type="success"
              showIcon
              action={
                <Button type="primary" onClick={() => navigate('/')}> {/* 跳回首頁 (會觸發 Modal) */}
                  {t('backToLogin', '返回登入')}
                </Button>
              }
            />
          ) : error && !token ? (
            // 嚴重錯誤 (沒有 Token)
            <Alert
              message={t('invalidLinkTitle', '連結無效')}
              description={error}
              type="error"
              showIcon
              action={
                <Button type="primary" onClick={() => navigate('/')}>
                  {t('backToIndex', '返回首頁')}
                </Button>
              }
            />
          ) : (
            // 正常表單
            <Form
              form={form}
              name="reset_password"
              onFinish={onFinish}
              layout="vertical"
            >
              {error && ( // 顯示提交時的錯誤 (例如 Token 過期)
                <Form.Item>
                  <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} />
                </Form.Item>
              )}

              <Form.Item
                name="newPassword"
                label={t('newPassword', '新密碼')}
                rules={[
                  { required: true, message: t('passwordRequired', '請輸入新密碼!') },
                  { min: 8, message: t('passwordTooShort', '密碼長度至少需要 8 個字元') },
                ]}
                hasFeedback
              >
                <Input.Password prefix={<LockOutlined />} placeholder={t('newPassword')} />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label={t('confirmNewPassword', '確認新密碼')}
                dependencies={['newPassword']} // 依賴 newPassword 欄位
                hasFeedback
                rules={[
                  { required: true, message: t('confirmPasswordRequired', '請再次輸入您的新密碼!') },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(t('passwordMismatch', '兩次輸入的密碼不一致!')));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder={t('confirmNewPassword')} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                  {t('setNewPassword', '設定新密碼')}
                </Button>
              </Form.Item>
            </Form>
          )}
        </Spin>
      </Card>
    </div>
  );
};

// 為了讓 App.useApp() 能運作，匯出包裝過的元件
const WrappedResetPasswordPage: React.FC = () => (
  <App> {/* 用 Antd 的 App 包裹 */}
    <ResetPasswordPage />
  </App>
);

export default WrappedResetPasswordPage;