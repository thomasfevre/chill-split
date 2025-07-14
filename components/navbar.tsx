"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, User, Wallet, Wallet2Icon } from "lucide-react"
import { CreateGroupModal } from "@/components/create-group-modal"
import { JoinGroupModal } from "@/components/join-group-modal"
import { useWallet } from "@/context/wallet-context"
import { DynamicConnectButton } from "@dynamic-labs/sdk-react-core"
import React from "react"
import { Separator } from "@/components/ui/separator"
import { DynamicUserProfile, useDynamicContext} from '@dynamic-labs/sdk-react-core';
import { clearGroupsCache } from "@/services/cache/sessionStorage"


export function Navbar() {
  const { isConnected: isConnectedPromise, walletAddress, username, disconnectWallet } = useWallet()
  const [isConnected, setIsConnected] = React.useState(false)
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const { setShowDynamicUserProfile } = useDynamicContext();

  React.useEffect(() => {
    isConnectedPromise.then(setIsConnected)
    return;
  }, [isConnectedPromise])

  React.useEffect(() => {
    const handleCloseProfile = (event: MouseEvent) => {
      const profileDropdown = document.getElementById("profileDropdown");

      if (profileDropdown && !profileDropdown.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleCloseProfile);
    return () => {
      document.removeEventListener("mousedown", handleCloseProfile);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">

          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-red-500 bg-clip-text text-transparent">
              Chill&apos;Split
            </span>
          </Link>
          <Separator orientation="vertical" className="w-10" />
          <Button variant="outline" size="sm" asChild>
            {typeof window !== "undefined" && window.location.pathname.includes("/group") ? <Link href="/dashboard">Dashboard</Link> : null}
          </Button>
        </div>


        <div className="flex items-center gap-4">
          {isConnected ? (
            <>
              <CreateGroupModal />
              <JoinGroupModal />

              <Separator orientation="vertical" className="h-10" />

              <div className="relative group">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={() => setIsProfileOpen(true)}
                >
                  <Wallet className="h-4 w-4" />
                  <span>Profile</span>
                </Button>
                <div id="profileDropdown" className={`absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg ${isProfileOpen ? "block" : "hidden"}`}>
                  <div className="p-2">
                    <div className="px-4 py-2 text-sm text-gray-700 flex flex-row">
                      <User className="h-4 w-4 mr-4" /> {username || "N/A"}
                    </div>
                    <Separator orientation="horizontal" className="mt-1 h-[1px]" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 justify-start"
                      onClick={() => setShowDynamicUserProfile(true)}
                    >      
                      <Wallet className="h-4 w-4 mr-2" />
                      Manage Account
                    </Button>
                    <DynamicUserProfile />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 justify-start"
                      onClick={disconnectWallet}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </div>
                <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={() => {
                  if (typeof clearGroupsCache === "function") {
                    clearGroupsCache();
                  }
                  if (typeof disconnectWallet === "function") {
                    disconnectWallet();
                  }
                }}
                >
                <LogOut className="h-4 w-4" />
                </Button>

            </>
          ) : (

            <DynamicConnectButton buttonClassName="h-10 px-4 rounded-xl py-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </div>

            </DynamicConnectButton>

          )}
        </div>
      </div>
    </header>
  )
}
