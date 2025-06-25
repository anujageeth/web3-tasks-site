'use client'

import { useAccount } from "wagmi"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PageWrapper } from "@/components/ui/page-wrapper"
import { motion } from "framer-motion"
import { FiArrowRight } from "react-icons/fi"

export default function Home() {
  const { isConnected } = useAccount()
  const router = useRouter()
  
  useEffect(() => {
    if (isConnected) {
      router.push('/dashboard')
    }
  }, [isConnected, router])

  return (
    <PageWrapper className="flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full text-center">
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
          <Link 
            href="/login" 
            className="glass-button inline-flex items-center px-8 py-4 text-lg"
          >
            Get Started <FiArrowRight className="ml-2" />
          </Link>
        </motion.div>
      </div>
    </PageWrapper>
  )
}