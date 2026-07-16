import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the build works both at a domain root and from a GitHub
// Pages project sub-path (username.github.io/<repo>/) without further config.
export default defineConfig({
  base: './',
  plugins: [react()],
})
