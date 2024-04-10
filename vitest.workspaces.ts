import { defineWorkspace } from 'vitest/config'

// defineWorkspace provides a nice type hinting DX
export default defineWorkspace([
  {
    // add "extends" to merge two configs together
    extends: './vite.config.js',
    test: {
      include: ['netlify/**/*.spec.ts'],
      // it is recommended to define a name when using inline configs
      name: 'netlify',
      environment: 'node'
    }
  }
])
