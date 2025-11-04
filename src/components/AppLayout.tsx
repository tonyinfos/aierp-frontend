// ai-erp-frontend/src/components/AppLayout.tsx
// (V5.0 - 移除 FormTemplate)

import React, { useState, type PropsWithChildren } from 'react'; 
import {
  HomeOutlined,
  TeamOutlined,
  SolutionOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { App, Layout, Menu, Button, Avatar, Typography, Grid, Drawer } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore'; 

const { Header, Content, Sider } = Layout;
const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return { key, icon, children, label } as MenuItem;
}

// (V5.0 菜單 - 已移除 FormTemplate)
const menuItems: MenuItem[] = [
  getItem('主控台', '/dashboard', <HomeOutlined />),
  getItem('使用者管理', '/users', <TeamOutlined />),
  getItem('公司管理', '/companies', <SolutionOutlined />),
];

const AppLayout: React.FC<PropsWithChildren> = ({ children }) => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const { user, logout } = useAuthStore();
  useThemeStore(); 

  const handleLogout = () => {
    logout();
    message.success('您已成功登出');
    navigate('/', { replace: true });
  };

  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key);
    if (isMobile) { setDrawerVisible(false); }
  };

  const toggleDrawer = () => { setDrawerVisible(!drawerVisible); };
  const toggleSider = () => { setCollapsed(!collapsed); };

  const menuDOM = (
    <Menu 
      theme="dark" 
      selectedKeys={[location.pathname]}
      mode="inline" 
      items={menuItems}
      onClick={handleMenuClick}
      style={{ height: '100%', borderRight: 0 }}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider collapsible collapsed={collapsed} trigger={null} width={250}>
          <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', color: 'white', lineHeight: '32px' }}>
            {collapsed ? 'ERP' : 'AI-ERP 系統'}
          </div>
          {menuDOM}
        </Sider>
      )}

      <Layout>
        <Header style={{ padding: '0 24px', display: 'flex', alignItems: 'center' }}>
          <Button
            type="text"
            icon={isMobile ? <MenuUnfoldOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
            onClick={isMobile ? toggleDrawer : toggleSider}
            style={{ fontSize: '16px', width: 64, height: 64, marginLeft: -16, color: '#fff' }}
          />
          <Title level={4} style={{ margin: 0, flexGrow: 1, color: '#fff' }} />

          <Avatar src={user?.avatar_url} style={{ marginRight: 8 }}>
            {user?.display_name ? user.display_name[0] : 'U'}
          </Avatar>
          <Text style={{ marginRight: 16, color: '#fff' }}>
            歡迎您，{user?.display_name || '使用者'}
          </Text>
          <Button type="primary" icon={<LogoutOutlined />} onClick={handleLogout} danger>
            登出
          </Button>
        </Header>

        <Content style={{ margin: '16px' }}>
          <div style={{ padding: 24, minHeight: 'calc(100vh - 100px)', background: '#fff', borderRadius: 8 }}>
            {children} 
          </div>
        </Content>
      </Layout>

      {isMobile && (
        <Drawer
          title="AI-ERP 系統選單"
          placement="left"
          closable={true}
          onClose={toggleDrawer}
          open={drawerVisible}
          styles={{ body: { padding: 0 } }}
          width={250}
        >
          {menuDOM}
        </Drawer>
      )}
    </Layout>
  );
};

const WrappedAppLayout: React.FC<PropsWithChildren> = ({ children }) => (
  <App>
    <AppLayout>{children}</AppLayout>
  </App>
);

export default WrappedAppLayout;