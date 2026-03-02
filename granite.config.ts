import { defineConfig } from '@apps-in-toss/web-framework/config'

export default defineConfig({
  appName: 'sling-god',
  brand: {
    displayName: '새총의 신',
    primaryColor: '#3182F6',
    icon: 'https://static.toss.im/appsintoss/0000/granite.png',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'vite build',
    },
  },
  permissions: [],
})
