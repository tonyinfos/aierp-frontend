import React, { useState } from 'react';
import { Layout, Button, Space } from 'antd';
import LineFriendActivation from '../components/LineFriendActivation';

const TestLineFriendPage: React.FC = () => {
  const [showActivation, setShowActivation] = useState(false);
  const [userLineId] = useState("test_user_123");

  const handleVerificationSuccess = (token: string) => {
    console.log("驗證成功，收到 token:", token);
    alert("好友驗證成功！Token: " + token);
    setShowActivation(false);
  };

  return (
    <Layout style={{ minHeight: '100vh', padding: '24px' }}>
      <div style={{ textAlign: 'center' }}>
        <h1>LINE 好友驗證組件測試頁面</h1>
        
        <Space direction="vertical" size="large">
          <Button 
            type="primary" 
            onClick={() => setShowActivation(true)}
            disabled={showActivation}
          >
            觸發 LINE 好友驗證流程
          </Button>
          
          {showActivation && (
            <div style={{ marginTop: '24px' }}>
              <LineFriendActivation
                userLineId={userLineId}
                onVerificationSuccess={handleVerificationSuccess}
              />
            </div>
          )}
        </Space>
      </div>
    </Layout>
  );
};

export default TestLineFriendPage;