import React from 'react';
import { Typography } from 'antd';
import { useAuthStore } from '../store/authStore';

const { Title } = Typography;

const DashboardPage: React.FC = () => {
  // (新！) 我們不再需要 logout，因為它已經在 AppLayout 裡了
  // 我們改成讀取 "user"
  const user = useAuthStore((state) => state.user);

  return (
    // (新) 我們不再需要外層的 <Layout>，因為 AppLayout 已經提供了
    <div>
      {/* (新！) 顯示動態的歡迎詞 */}
      <Title level={2}>
        歡迎，{user ? user.username : '使用者'}！
      </Title>
      <p>您已成功登入 AI-ERP 系統主控台。</p>
    </div>
  );
};

export default DashboardPage;