'use client'

import { useAccount } from "wagmi"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { appKitModal } from "@/config"
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

export default function Login() {
  const router = useRouter()
  const { isConnected, address, connector } = useAccount()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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
          
          console.log('Signature generated:', {
            address,
            messagePreview: message.substring(0, 30) + '...',
            signaturePreview: signature.substring(0, 20) + '...'
          });
          
          // Send SIWE verification to backend
          try {
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
            
            console.log('Response status:', response.status);
            
            if (response.ok) {
              const data = await response.json();
              console.log('Auth success:', data);
              
              // Wait a moment for cookies to be set before redirecting
              setTimeout(() => {
                // Force a hard navigation to make sure cookies are processed
                window.location.href = '/dashboard';
              }, 100);
            } else {
              let errorMessage = `Server error (${response.status})`;
              try {
                const errorData = await response.json();
                console.error('Auth error response:', errorData);
                errorMessage = errorData.message || errorMessage;
              } catch (e) {
                console.error('Failed to parse error response:', e);
              }
              setError(errorMessage);
            }
          } catch (fetchError) {
            console.error('Fetch error:', fetchError);
            setError(`Network error: ${fetchError.message}`);
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white shadow-lg rounded-lg border border-gray-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Login to Dashboard</h1>
          <p className="mt-2 text-gray-600">Connect your wallet to continue</p>
        </div>
        
        <div className="mt-8">
          <button
            onClick={handleConnect}
            disabled={isSigningIn}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-70"
          >
            {isSigningIn
              ? 'Signing in...'
              : isConnected
                ? 'Sign Message to Login'
                : 'Connect Wallet'
            }
          </button>
          
          {isSigningIn && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Please sign the message in your wallet...
            </p>
          )}
          
          {error && (
            <p className="mt-2 text-center text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}