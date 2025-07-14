import { DynamicConnectButton } from "@dynamic-labs/sdk-react-core";
import * as Dialog from "@radix-ui/react-dialog"
import { ArrowRight } from "lucide-react";

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
    return (
        <Dialog.Root open={open} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-500 data-[state=open]:opacity-100 data-[state=closed]:opacity-0"
                />
                <Dialog.Title>
                                           
                </Dialog.Title>
                <Dialog.Content
                    className="fixed inset-0 ml-[30%] z-50 bg-black/60 p-6 text-white flex flex-col space-y-6 transition-all duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-right-8 data-[state=closed]:slide-out-to-right-8"
                    style={{ animationDuration: "500ms" }}
                >
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xl font-bold">Chill'Split</span>
                        <Dialog.Close asChild>
                            <button onClick={onClose} aria-label="Close menu">
                                ✕
                            </button>
                        </Dialog.Close>
                    </div>
                    <nav className="flex flex-col space-y-4 text-lg">
                        <a href="#features" onClick={onClose}>Features</a>
                        <a href="#how-it-works" onClick={onClose}>How It Works</a>
                        <a href="#faq" onClick={onClose}>FAQ</a>

                        <div className="flex gap-4 pt-8">
                            <a
                                href="https://www.linkedin.com/in/thomas-fevre-6853b51a1/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="LinkedIn"
                                className="hover:text-blue-400 transition-colors"
                            >
                                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.968v5.699h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.838-1.563 3.036 0 3.6 2 3.6 4.594v5.602z" />
                                </svg>
                            </a>
                            <a
                                href="https://github.com/thomasfevre"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="GitHub"
                                className="hover:text-gray-400 transition-colors"
                            >
                                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.627 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.011-1.04-.017-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.332-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.553 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.371.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                            </a>
                        </div>

                        <DynamicConnectButton buttonClassName="h-12 px-6 mt-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium shadow-lg shadow-indigo-500/20 transition-all duration-300">
                            <div className="flex items-center gap-2">
                                Get Started
                                <ArrowRight size={16} />
                            </div>
                        </DynamicConnectButton>
                    </nav>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
