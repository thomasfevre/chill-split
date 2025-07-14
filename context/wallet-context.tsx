"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { useDynamicContext, UserProfile, Wallet, WalletConnector } from "@dynamic-labs/sdk-react-core"

interface WalletContextType {
  isConnected: Promise<boolean>
  walletAddress: string
  userId: `0x${string}`
  user?: UserProfile
  username: string
  primaryWallet: Wallet | null
  connectWallet: () => void
  disconnectWallet: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user, primaryWallet , setShowAuthFlow, handleLogOut } = useDynamicContext()

  const connectWallet = () => {
    setShowAuthFlow(true) // Opens the Dynamic authentication flow
  }

  const disconnectWallet = () => {
    handleLogOut() // Logs the user out
    window.location.href = "/" // Redirects to the home page
  }
 
  const isConnected = primaryWallet?.isConnected() || Promise.resolve(false)
  const walletAddress = primaryWallet?.address || ""
  const userId = walletAddress ? (walletAddress as `0x${string}`) : "0x0"
  const username = user?.username || ""

  return (
    <WalletContext.Provider value={{ isConnected, walletAddress, userId, user, username, primaryWallet,  connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
