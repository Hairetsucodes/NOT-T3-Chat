import localFont from 'next/font/local'

export const proximaVara = localFont({
  src: [
    {
      path: '../public/fonts/ProximaVara-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/ProximaVara-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/ProximaVara-Semibold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/ProximaVara-Bold.woff2',
      weight: '700',
      style: 'normal',
    }
  ],
  variable: '--font-proxima-vara',
  display: 'swap',
}) 