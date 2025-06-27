import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { headers } from 'next/headers'
import ContextProvider from '@/context'
import { AppNav } from '@/components/app-nav'
import { CursorGlow } from "@/components/ui/cursor-glow";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Web3 Tasks Platform',
  description: 'Complete tasks, earn rewards, and connect with web3 communities',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/Logo2025trans.png', type: 'image/png' },
    ],
    apple: [
      { url: '/Logo2025trans.png' },
    ],
  },
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get('cookie')

  return (
    <html lang="en" className="dark">
      <head>
        {/* Preload critical assets */}
        <link rel="preload" href="/Logo2025trans.png" as="image" />
        
        {/* Add preconnect for external domains */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        
        {/* Set cache control headers */}
        <meta httpEquiv="Cache-Control" content="public, max-age=3600" />
        
        {/* DNS prefetching for critical external resources */}
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className={`${inter.className} bg-background`}>
        {/* Enhanced background effect */}
        <div className="enhanced-bg fixed inset-0 z-[-2]" />
        
        <ContextProvider cookies={cookies}>
          {children}
          <AppNav />
        </ContextProvider>
        <CursorGlow />
      </body>
    </html>
  )
}