'use client'

import { createCss, createHslaColorCss, createSizeCss, getThemeProvider } from '@rybr/styled-modules'

export const theme = createCss(
  {
    ...createHslaColorCss({
      prefix: 'sm-color-red',
      steps: 1,
      hue: 0,
      saturation: 100,
    }),
    ...createSizeCss({ prefix: 'sm-size', steps: 5 }),
    ...createSizeCss({ prefix: 'sm-fontSize', steps: 3, incrementBy: 0.1 }),
    ...createHslaColorCss({
      prefix: 'sm-color-red',
      steps: 2,
      hue: 0,
      saturation: 100,
    }),
  },
  {
    light: {
      ...createHslaColorCss({
        prefix: 'sm-color-brand',
        steps: 3,
        hue: 0,
        saturation: 100,
      }),
    },
    dark: {
      ...createHslaColorCss({
        prefix: 'sm-color-brand',
        steps: 3,
        hue: 100,
        saturation: 100,
      }),
    },
  }
)

export const { RenderThemeStylesheet, ThemeProvider, themeContext, useTheme } = getThemeProvider(theme, 'light')
