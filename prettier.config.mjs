/** @type {import('prettier').Config} */
const config = {
  endOfLine: 'auto',
  semi: false,
  trailingComma: 'none',
  singleQuote: true,
  jsxSingleQuote: true,
  arrowParens: 'always',
  bracketSameLine: false,
  tabWidth: 2,
  useTabs: false,
  singleAttributePerLine: true,
  printWidth: 120,
  plugins: ['prettier-plugin-organize-imports']
}

export default config
