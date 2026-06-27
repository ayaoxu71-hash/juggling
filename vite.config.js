// 引入 Vite 的設定工具
import { defineConfig } from 'vite'
// 引入 React 支援
import react from '@vitejs/plugin-react'
// 引入 Tailwind CSS 插件
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),        // 讓 Vite 看得懂 React 語法
    tailwindcss(),  // 讓 Vite 處理 Tailwind 樣式
  ],
})