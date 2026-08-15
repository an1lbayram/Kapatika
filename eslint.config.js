import js from '@eslint/js'
import globals from 'globals'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import security from 'eslint-plugin-security'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dist-electron', 'dist-renderer', 'release']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
      security.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // electron/main.ts spawns the OS "shutdown" binary via execFile with an
      // argv array (never a shell string), which is the safe pattern this
      // rule can't distinguish from exec()/spawn(shell:true) misuse.
      'security/detect-child-process': 'off',
      // Flags virtually every array/object index access (values[i], obj[key])
      // regardless of provenance; too noisy to carry signal in this codebase.
      'security/detect-object-injection': 'off',
      // Flags fs calls whose path isn't a string literal; both current uses
      // (test helpers reading repo-relative files via path.join) are safe.
      'security/detect-non-literal-fs-filename': 'off',
    },
  },
])
