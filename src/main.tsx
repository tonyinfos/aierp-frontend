import ReactDOM from 'react-dom/client';
import './index.css';
import 'antd/dist/reset.css';

import ThemedApp from './ThemedApp.tsx'; 

import './i18n';

// 5. 渲染 ThemedApp 而不是直接渲染 App
ReactDOM.createRoot(document.getElementById('root')!).render(
    <ThemedApp />
);