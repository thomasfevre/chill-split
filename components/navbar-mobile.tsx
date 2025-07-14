"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreateGroupModal } from "@/components/create-group-modal";
import { JoinGroupModal } from "@/components/join-group-modal";
import { Wallet, LogOut, User } from "lucide-react";
import { useWallet } from "@/context/wallet-context";
import { useDynamicContext, DynamicUserProfile } from "@dynamic-labs/sdk-react-core";
import React, { useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useLoading } from "@/context/loading-context";

export function NavbarMobile() {
    const { walletAddress, username, disconnectWallet } = useWallet();
    const [menuOpen, setMenuOpen] = React.useState(false);
    const { setShowDynamicUserProfile } = useDynamicContext();
    const { isLoading, setLoading } = useLoading();

    useEffect(() => {
        setMenuOpen(false);
    }, [isLoading])

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-4">
                <div className="flex items-center justify-between w-full gap-2">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-red-500 bg-clip-text text-transparent">
                            Chill&apos;Split
                        </span>
                    </Link>
                    <Button variant="outline" size="sm" asChild>
                        {typeof window !== "undefined" && window.location.pathname.includes("/group") ? (
                            <Link href="/dashboard">Dashboard</Link>
                        ) : null}
                    </Button>
                    <CreateGroupModal />
                </div>
                <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
                    <Dialog.Trigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Open menu" className="ml-3 rounded-xl">
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </Button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                        <Dialog.Overlay style={{ animationDuration: "500ms" }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-500 data-[state=open]:opacity-100 data-[state=closed]:opacity-0" />
                        <Dialog.Title>
                           
                        </Dialog.Title>
                        <Dialog.Content style={{ animationDuration: "500ms" }} className="fixed right-0 top-0 h-full w-3/4 max-w-xs
                         bg-white z-50 p-6 flex flex-col gap-4 shadow-lg transition-all duration-1000 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-10 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-right-8 data-[state=closed]:slide-out-to-right-8"
                         aria-description="Menu content">
                             <div className="flex items-center justify-between mb-4" >
                                <div className="flex items-center gap-2 px-2 py-1 text-gray-700">
                                    <User className="h-4 w-4" /> {username || "N/A"}
                                </div>
                                <Dialog.Close asChild>
                                    <Button variant="ghost" size="icon" aria-label="Close menu">
                                        ✕
                                    </Button>
                                </Dialog.Close>
                            </div>


                            <JoinGroupModal />

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-fit justify-start mt-3"
                                onClick={() => setShowDynamicUserProfile(true)}
                            >
                                <Wallet className="h-4 w-4 mr-2" />
                                Manage Your Account
                            </Button>

                            <DynamicUserProfile />

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-fit justify-start"
                                onClick={disconnectWallet}
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>
            </div>
        </header>
    );
}