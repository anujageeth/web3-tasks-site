import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { headers } from 'next/headers'
import ContextProvider from '@/context'
import { AppNav } from '@/components/app-nav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Web3 Tasks Platform',
  description: 'Complete tasks, earn rewards, and connect with web3 communities'
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
      <body className={`${inter.className} bg-background`}>
        {/* Enhanced background effect */}
        <div className="enhanced-bg fixed inset-0 z-[-2]" />
        
        <ContextProvider cookies={cookies}>
          {children}
          <AppNav />
        </ContextProvider>
      </body>
    </html>
  )
}