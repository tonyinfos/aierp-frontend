import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Spin, App } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/apiClient';
import axios from 'axios';
import Paragraph from 'antd/es/typography/Paragraph';

const { Title } = Typography;

// 後端 API (根據 V2.0 架構)
const REQUEST_RESET_URL = "/auth/request-password-reset"; 

// 表單的型別
interface ForgotPasswordFormValues {
  email: string;
}

const ForgotPasswordPage: React.FC = () => {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  // (新！) 使用 success 狀態來切換 UI
  const [success, setSuccess] = useState(false); 
  const [error, setError] = useState<string | null>(null);

  // 表單提交處理
  const onFinish = async (values: ForgotPasswordFormValues) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 呼叫後端 API
      await apiClient.post(REQUEST_RESET_URL, {
        email: values.email
      });

      // 成功！
      setLoading(false);
      setSuccess(true); // 顯示成功訊息
      message.success(t('passwordResetEmailSent', '已發送重設郵件'));
      form.resetFields();

    } catch (err: unknown) {
      setLoading(false);
      if (axios.isAxiosError(err)) {
        // (我們假設後端在 Email 不存在時也會回傳 200 OK，所以這裡的錯誤主要是網路或伺服器 500)
        setError(t('connectionError', { message: err.message }));
      } else {
        setError(t('unknownError', '發生未知錯誤'));
      }
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Card style={{ width: 450, maxWidth: '90%' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2}>{t('forgotPasswordTitle', '忘記密碼')}</Title>
        </div>

        <Spin spinning={loading} tip={t('processing', '處理中...')}>
          {/* 根據是否成功，顯示不同內容 */}
          {success ? (
            <Alert
              message={t('checkYourEmail', '請檢查您的 Email')}
              description={t('passwordResetSentInfo', '如果該 Email 已註冊，您將會收到一封包含重設密碼指示的郵件。')}
              type="success"
              showIcon
              action={
                <Button type="primary" onClick={() => window.location.href = '/'}> {/* 強制跳回首頁 */}
                  {t('backToIndex', '返回首頁')}
                </Button>
              }
            />
          ) : (
            // 忘記密碼表單
            <Form
              form={form}
              name="forgot_password"
              onFinish={onFinish}
              layout="vertical"
            >
              <Paragraph>
                {t('forgotPasswordInstruction', '請輸入您註冊時使用的電子郵件地址。我們將會發送一封郵件給您，內含重設密碼的連結。')}
              </Paragraph>

              {error && (
                <Form.Item>
                  <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} />
                </Form.Item>
              )}

              <Form.Item
                name="email"
                label={t('email', '電子郵件')}
                rules={[
                  { required: true, message: t('emailRequired', '請輸入您的電子郵件!') },
                  { type: 'email', message: t('emailInvalid', '請輸入有效的電子郵件格式!') }
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder={t('email')} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                  {t('sendResetLink', '發送重設連結')}
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center' }}>
                <Link to="/">{t('backToLogin', '返回登入')}</Link> {/* 連結回首頁觸發登入 Modal */}
              </div>
            </Form>
          )}
        </Spin>
      </Card>
    </div>
  );
};

// 為了讓 App.useApp() 能運作，匯出包裝過的元件
const WrappedForgotPasswordPage: React.FC = () => (
  <App> {/* 用 Antd 的 App 包裹 */}
    <ForgotPasswordPage />
  </App>
);

export default WrappedForgotPasswordPage;