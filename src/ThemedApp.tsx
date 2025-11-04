import { ConfigProvider, theme, App as AntApp } from 'antd';
import { useThemeStore } from './store/themeStore';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx'; // 匯入主 App

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// --- (關鍵！) 定義亮色與暗色主題的 Token ---
// 1. 亮色主題設定 (Light Theme) - 溫暖商務風
const lightThemeTokens = {
  // --- 基礎顏色 (溫暖的棕橙色系) ---
  colorPrimary: '#d47a47',     // 主色調 (溫暖橙棕色)
  colorSuccess: '#52c41a',     // 成功色 (保持綠色)
  colorWarning: '#faad14',     // 警告色 (保持黃色)
  colorError: '#ff4d4f',       // 錯誤色 (稍微溫暖的紅)
  colorInfo: '#d4a574',        // 資訊色 (配合主色的暖色調)

  // --- 背景顏色 ---
  colorBgLayout: '#f5f3f0',     // 整體佈局背景 (柔和的暖灰米色)
  colorBgContainer: '#faf9f7', // 容器背景 (很淺的暖灰白)
  colorBgElevated: '#ffffff',   // 浮動容器背景 (純白，保持層次)

  // --- 文字顏色 ---
  colorTextBase: '#2c1810',       // 基礎文字顏色 (深棕色)
  colorText: 'rgba(44, 24, 16, 0.88)', // 主要文字 (深棕色帶透明)
  colorTextSecondary: 'rgba(44, 24, 16, 0.65)', // 次要文字
  colorTextTertiary: 'rgba(44, 24, 16, 0.45)', // 更次要文字

  // --- 邊框/分割線 ---
  colorBorder: '#e6d7c8',       // 主要邊框色 (暖灰色)
  colorSplit: 'rgba(44, 24, 16, 0.08)', // 分割線顏色

  // --- 其他樣式 ---
  borderRadius: 6,               // 稍微圓潤的圓角
};

// 2. 暗色主題設定 (Dark Theme) - 優雅的深色專業風
const darkThemeTokens = {
  // --- 基礎顏色 (優雅的藍紫色系) ---
  colorPrimary: '#6b73ff',     // 主色調 (優雅的藍紫色)
  colorSuccess: '#73d13d',     // 成功色 (清新綠色)
  colorWarning: '#ffec3d',     // 警告色 (明亮黃色)
  colorError: '#ff7875',       // 錯誤色 (柔和紅色)
  colorInfo: '#85a5ff',        // 資訊色 (配合主色的淺藍)

  // --- 背景顏色 ---
  colorBgLayout: '#0a0e13',     // 整體佈局背景 (更深的背景)
  colorBgContainer: '#141920', // 容器背景 (稍亮於底色的深色)
  colorBgElevated: '#1e2329',   // 浮動容器背景 (中等深色)

  // --- 文字顏色 ---
  colorTextBase: '#ffffff',       // 基礎文字顏色 (純白色，最高對比度)
  colorText: 'rgba(255, 255, 255, 0.95)', // 主要文字 (高對比度純白)
  colorTextSecondary: 'rgba(255, 255, 255, 0.85)', // 次要文字 (增加對比度)
  colorTextTertiary: 'rgba(255, 255, 255, 0.65)', // 更次要文字 (提高可讀性)

  // --- 邊框/分割線 ---
  colorBorder: '#30363d',       // 主要邊框色 (深灰邊框)
  colorSplit: 'rgba(240, 246, 252, 0.13)', // 分割線顏色

  // --- 其他樣式 ---
  borderRadius: 6,               // 稍微圓潤的圓角
};
// ---------------------------------------------

const ThemedApp = () => {
  // 從 Store 取得目前模式
  const themeMode = useThemeStore((state) => state.themeMode);

  // 根據模式選擇基礎演算法和顏色 Token
  const currentAlgorithm = themeMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm;
  const currentTokens = themeMode === 'dark' ? darkThemeTokens : lightThemeTokens;

  // --- (關鍵！) 組合最終的 themeConfig ---
  const themeConfig = {
    algorithm: currentAlgorithm, // 基礎演算法 (亮/暗)

    // (核心！) 套用我們定義的顏色 Token
    token: currentTokens,

    // (元件覆蓋) 在這裡統一設定不受 Token 直接影響或需要微調的元件樣式
    components: {
      Layout: {
        // 側邊欄背景：暗色用深色，亮色用柔和灰調
        siderBg: themeMode === 'dark' ? '#0a0e13' : '#f0ede8',
        // Header 背景：配合主題色調
        headerBg: themeMode === 'dark' ? '#b57135ff' : '#b04507ff',
        headerColor: themeMode === 'dark' ? '#ffffff' : '#ffffff',
        // Content 背景：使用柔和的灰白色
        bodyBg: themeMode === 'dark' ? '#141920' : '#faf9f7',
      },
      Menu: {
        // 選單顏色配置
        itemBg: 'transparent',
        itemColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(44, 24, 16, 0.88)',
        itemSelectedBg: themeMode === 'dark' ? 'rgba(107, 115, 255, 0.20)' : 'rgba(212, 122, 71, 0.15)',
        itemSelectedColor: themeMode === 'dark' ? '#ffffff' : '#d47a47',
        itemHoverBg: themeMode === 'dark' ? 'rgba(107, 115, 255, 0.12)' : 'rgba(212, 122, 71, 0.08)',
      },
      Button: {
        // 按鈕顏色配置
        colorText: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.90)' : 'rgba(44, 24, 16, 0.88)',
        colorLink: themeMode === 'dark' ? '#8ab4f8' : '#d47a47',
        colorLinkHover: themeMode === 'dark' ? '#adc6ff' : '#b8623e',
      },
      Card: {
        // 卡片配色
        colorBorderSecondary: themeMode === 'dark' ? '#30363d' : '#e6d7c8',
        colorBgContainer: themeMode === 'dark' ? '#141920' : '#f7f5f2',
      },
      Input: {
        // 輸入框配色
        colorBorder: themeMode === 'dark' ? '#30363d' : '#e6d7c8',
        colorBorderHover: themeMode === 'dark' ? '#6b73ff' : '#d47a47',
      },
      Table: {
        // 表格配色
        colorBorderSecondary: themeMode === 'dark' ? '#30363d' : '#e6d7c8',
        colorFillAlter: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(212, 122, 71, 0.02)',
        colorText: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.90)' : undefined,
      },
      Typography: {
        // 文字組件配色
        colorText: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.95)' : undefined,
        colorTextHeading: themeMode === 'dark' ? '#ffffff' : undefined,
        colorTextDescription: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.75)' : undefined,
      },
      Form: {
        // 表單配色
        labelColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.90)' : undefined,
      },
      Modal: {
        // 模態框配色
        contentBg: themeMode === 'dark' ? '#141920' : '#ffffff',
        headerBg: themeMode === 'dark' ? '#141920' : '#f7f5f2',
      },
      Drawer: {
        // 抽屜配色
        colorBgElevated: themeMode === 'dark' ? '#141920' : '#f7f5f2',
      },
      Dropdown: {
        // 下拉選單配色
        colorBgElevated: themeMode === 'dark' ? '#1e2329' : '#ffffff',
      }
    }
  };
  // ------------------------------------

  return (
    <GoogleOAuthProvider clientId={googleClientId || ""}> 
      <ConfigProvider theme={themeConfig}>
        <AntApp> {/* AntApp 確保 message 等能吃到主題 */}
          <App />
        </AntApp>
      </ConfigProvider>
    </GoogleOAuthProvider>
  );
};

export default ThemedApp; // 如果是獨立檔案