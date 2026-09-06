export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  css: ['~/assets/styles/main.scss'],
  devtools: { enabled: false },
  modules: ['@nuxt/eslint'],
  typescript: {
    strict: true,
    typeCheck: true,
  },
  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      meta: [
        { name: 'theme-color', content: '#FAFAF8' },
        { name: 'color-scheme', content: 'light' },
      ],
    },
  },
})
