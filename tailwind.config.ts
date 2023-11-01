import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    colors: {
      white: '#ffffff',
      black: '#000000',
      branding: '#0e90f2',
      background: '#f5f5f5',
      border: '#efefef',
      gray: '#767676',
      primary: '#f4f4f4',
    },
    screens: {
      sm: '550px',
      lg: '1200px',
    },
  },
  corePlugins: {
    preflight: true,
  },
  plugins: [
    require('@tailwindcss/typography')({
      className: 'md',
    }),
  ],
} satisfies Config
