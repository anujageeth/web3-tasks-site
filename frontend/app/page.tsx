'use client'

import { useAccount } from "wagmi"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PageWrapper } from "@/components/ui/page-wrapper"
import { motion } from "framer-motion"
import { FiArrowRight } from "react-icons/fi"
import { GlobeDemo } from "@/components/sections/globe-demo"
import { appKitModal } from "@/config"
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

export default function Home() {
  const { isConnected, address, connector } = useAccount()
  const router = useRouter()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Disable scrolling on home page
  useEffect(() => {
    // Save original styles
    const originalStyle = window.getComputedStyle(document.body).overflow;
    
    // Disable scroll
    document.body.style.overflow = 'hidden';
    
    // Restore original styles when component unmounts
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);
  
  // Redirect if already connected
  useEffect(() => {
    if (isConnected) {
      router.push('/dashboard')
    }
  }, [isConnected, router])
  
  // Handle connection and signing
  const handleConnect = async () => {
    try {
      if (!isConnected) {
        // Open modal to connect wallet
        await appKitModal.open()
      } else {
        setIsSigningIn(true)
        setError(null)
        
        try {
          // Create a message for the user to sign
          const message = `Sign this message to authenticate with Web3 Tasks.\n\nAddress: ${address}\nTimestamp: ${new Date().toISOString()}`;
          
          // Get the provider from the connector
          const provider = await connector?.getProvider()
          
          if (!provider) {
            throw new Error('Provider not available');
          }
          
          // Create a wallet client using viem
          const walletClient = createWalletClient({
            account: address,
            chain: mainnet,
            transport: custom(provider)
          })
          
          // Sign the message
          const signature = await walletClient.signMessage({
            message
          })
          
          if (!signature) {
            throw new Error('Signature rejected');
          }
          
          // Send SIWE verification to backend
          const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              address,
              message,
              signature,
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Wait a moment for cookies to be set before redirecting
            setTimeout(() => {
              // Force a hard navigation to make sure cookies are processed
              window.location.href = '/dashboard';
            }, 100);
          } else {
            let errorMessage = `Server error (${response.status})`;
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
            } catch (e) {
              console.error('Failed to parse error response:', e);
            }
            setError(errorMessage);
          }
        } catch (err) {
          console.error('Signing error:', err);
          setError(`Signature error: ${err.message}`);
        }
      }
    } catch (err) {
      console.error('Authentication error:', err)
      setError(`Authentication error: ${err.message}`)
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <PageWrapper className="flex flex-col items-center justify-center p-0 overflow-hidden h-screen">
      <div className="max-w-4xl w-full text-center pt-10">
        <motion.h1 
          className="text-5xl md:text-7xl font-bold mb-6 gradient-text"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Web3 Tasks Platform
        </motion.h1>
        
        <motion.p 
          className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Complete tasks, earn rewards, and connect with web3 communities in one place
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <button 
            onClick={handleConnect}
            disabled={isSigningIn}
            className="glass-button inline-flex items-center px-8 py-4 text-lg"
          >
            {isSigningIn
              ? 'Signing in...'
              : isConnected
                ? 'Sign Message to Login'
                : 'Connect Wallet'
            } 
            <FiArrowRight className="ml-2" />
          </button>
          
          {isSigningIn && (
            <p className="mt-4 text-center text-sm text-gray-300">
              Please sign the message in your wallet...
            </p>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl max-w-md mx-auto">
              {error}
            </div>
          )}
        </motion.div>
      </div>
      <div className="w-full">
        <GlobeDemo />
      </div>
    </PageWrapper>
  )
}