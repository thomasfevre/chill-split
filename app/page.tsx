"use client";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "@/components/ui/mobile-menu";
import { useWallet } from "@/context/wallet-context";
import { DynamicConnectButton } from "@dynamic-labs/sdk-react-core";
import {
  ArrowRight,
  Wallet,
  Users,
  Shield,
  PieChart,
  Menu,
} from "lucide-react";
import React, { useEffect, useState } from "react";

export default function Home() {
  const { isConnected: isConnectedPromise } = useWallet();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle mouse movement for background animation
  const handleMouseMove = (e: { clientX: number; clientY: number }) => {
    setMousePosition({
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    });
  };

  // Handle scroll for navbar transformation
  const handleScroll = () => {
    const offset = window.scrollY;
    const isMobile = window.innerWidth < 768;
    if (!isMobile && offset > 60) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  };

  useEffect(() => {
    // If is connected is true, redirect to /dashboard
    isConnectedPromise.then((isConnected) => {
      if (isConnected) {
        window.location.href = "/dashboard";
      }
    });

    // Add event listeners
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    // Call once to set initial state
    handleScroll();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isConnectedPromise]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-black to-blue-500 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden hidden md:block">
        <div
          className="absolute w-96 h-96 rounded-full bg-purple-600/40 blur-3xl"
          style={{
            top: `${mousePosition.y * 30}%`,
            left: `${mousePosition.x * 30}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
        <div
          className="absolute w-96 h-96 rounded-full bg-blue-600/40 blur-3xl"
          style={{
            bottom: `${mousePosition.x * 25}%`,
            right: `${mousePosition.y * 25}%`,
            transform: "translate(20%, 20%)",
          }}
        />
        <div
          className="absolute w-96 h-96 rounded-full bg-purple-600/40 blur-3xl"
          style={{
            bottom: `${mousePosition.y * 30}%`,
            left: `${mousePosition.x * 30}%`,
            transform: "translate(20%, 20%)",
          }}
        />
        <div
          className="absolute w-96 h-96 rounded-full bg-blue-600/40 blur-3xl"
          style={{
            bottom: `${mousePosition.x * 5}%`,
            right: `${mousePosition.y * 5}%`,
            transform: "translate(-20%, -20%)",
          }}
        />
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-radial from-indigo-500/10 to-transparent blur-2xl" />
      </div>

      {/* Grid pattern overlay */}
      {/* <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" /> */}

      {/* Custom Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? "py-3 m-3 xl:mx-48 rounded-3xl bg-black/80 md:bg-black/60 backdrop-blur-md  shadow-lg"
          : "md:py-6 m-0 mx-0 rounded-none bg-transparent"
          }`}
      >
        <div className="bg-transparent px-4 md:px-6 backdrop-blur-sm md:backdrop-blur-none py-2">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a href="/" className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600"></div>
              <span className="ml-2 text-xl font-bold">Chill&apos;Split</span>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex flex-1 justify-center items-center space-x-6 ml-[-2em]">
              <a
                href="#features"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                How It Works
              </a>
              <a
                href="#faq"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                FAQ
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              <DynamicConnectButton
                buttonClassName={`h-10 px-4 rounded-full py-2 ${scrolled
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                  : "bg-white/10 backdrop-blur-sm hover:bg-white/20"
                  } text-white font-medium transition-all duration-300`}
              >
                <div className="flex items-center gap-2">Get Started</div>
              </DynamicConnectButton>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden rounded-full p-2 bg-gray-800/50 text-gray-300 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>

              {/* Mobile Navigation Drawer */}

              <MobileMenu
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
              />

            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 pt-20">
        {/* Hero Section */}
        <section className="w-full py-10 md:py-32">
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            <div className="flex flex-col items-center justify-center space-y-8 text-center">
              <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-sm font-medium">
                Blockchain-Powered Expense Splitting
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                  Split Expenses with Friends
                  <br />
                 
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-300 text-lg md:text-xl">
                  Chill&apos;Split makes it easy to track, validate, and settle
                  group expenses using secure decentralized technology.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
                <DynamicConnectButton buttonClassName="h-12 px-6 rounded-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium shadow-lg shadow-indigo-500/20 transition-all duration-300">
                  <div className="flex items-center gap-2">
                    Get Started
                    <ArrowRight size={16} />
                  </div>
                </DynamicConnectButton>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 px-6 rounded-full border-gray-700 hover:bg-gray-300/30 text-gray-500 font-medium transition-all duration-300"
                >
                  <a href="#features">Learn More</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="w-full pt-5 md:pt-20 pb-20 backdrop-blur-sm border-t border-b border-gray-800"
        >
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold my-4">
                Why Use Chill&apos;Split?
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Our blockchain-based expense splitting solution offers
                transparency, security, and ease of use
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="flex flex-col items-center p-6 bg-black/80 backdrop-blur-md rounded-2xl border border-gray-800 hover:border-purple-500/50 transition-all duration-300">
                <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
                  <Wallet className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Secure Transactions</h3>
                <p className="text-gray-400 text-center">
                  All expenses and settlements are secured by blockchain
                  technology
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-center p-6 bg-black/80 backdrop-blur-md rounded-2xl border border-gray-800 hover:border-purple-500/50 transition-all duration-300">
                <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Group Management</h3>
                <p className="text-gray-400 text-center">
                  Create and manage expense groups with friends and roommates
                </p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-center p-6 bg-black/80 backdrop-blur-md rounded-2xl border border-gray-800 hover:border-purple-500/50 transition-all duration-300">
                <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Transparent History</h3>
                <p className="text-gray-400 text-center">
                  Complete transaction history that's immutable and verifiable
                </p>
              </div>

              {/* Feature 4 */}
              <div className="flex flex-col items-center p-6 bg-black/80 backdrop-blur-md rounded-2xl border border-gray-800 hover:border-purple-500/50 transition-all duration-300">
                <div className="w-14 h-14 rounded-full bg-pink-500/20 flex items-center justify-center mb-4">
                  <PieChart className="h-6 w-6 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Smart Splitting</h3>
                <p className="text-gray-400 text-center">
                  Automatically calculate who owes what with intelligent
                  algorithms
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="w-full py-20 backdrop-blur-sm border-b border-gray-800"
          style={{
            background: "linear-gradient(180deg, #0f172a 0%, #18181b 50%, #0d1d368a  100%)"
          }}
        >
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold my-4">
                How Chill&apos;Split Works
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Experience a new way to manage shared expenses with blockchain
                technology
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative">
                <div className="absolute -left-2 md:-left-4 top-0 w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div className="pl-8">
                  <h3 className="text-xl font-bold mb-2">Connect Wallet</h3>
                  <p className="text-gray-400">
                    Link your crypto wallet to get started with secure,
                    decentralized expense tracking
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="absolute -left-2 md:-left-4 top-0 w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div className="pl-8">
                  <h3 className="text-xl font-bold mb-2">
                    Create or Join Groups
                  </h3>
                  <p className="text-gray-400">
                    Set up expense groups with friends, roommates, or travel
                    buddies
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="absolute -left-2 md:-left-4 top-0 w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div className="pl-8">
                  <h3 className="text-xl font-bold mb-2">Track & Settle</h3>
                  <p className="text-gray-400">
                    Add expenses, see who owes what, and settle debts with
                    cryptocurrency
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="w-full py-20 bg-black/30">
          <div className="container px-4 md:px-6 max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold my-4">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Everything you need to know about Chill&apos;Split
              </p>
            </div>

            <div className="space-y-6">
              {/* FAQ Item 1 */}
              <div className="p-6 bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-800">
                <h3 className="text-xl font-bold mb-2">
                  What cryptocurrencies can I use?
                </h3>
                <p className="text-gray-400">
                  Chill&apos;Split currently supports only USDC on Base Sepolia (using the "Permit" solidity feature).
                </p>
              </div>

              {/* FAQ Item 2 */}
              <div className="p-6 bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-800">
                <h3 className="text-xl font-bold mb-2">
                  Do I need cryptocurrency to use Chill&apos;Split?
                </h3>
                <p className="text-gray-400">
                  No, you can use Chill&apos;Split to track expenses without holding any cryptocurrency. However, to pay your debts, you will need to use USDC on Base Sepolia. Note that the gas fees are handled by the app, so if you want to pay your debts, you will only need to get USDC in your wallet.
                </p>
              </div>

              {/* FAQ Item 3 */}
              <div className="p-6 bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-800">
                <h3 className="text-xl font-bold mb-2">
                  Is my data secure on the blockchain?
                </h3>
                <p className="text-gray-400">
                  Absolutely. All transaction data is secured by blockchain
                  technology, making it immutable and transparent.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full pt-20 pb-4 bg-black/30">
          <div className="container px-4 md:px-6 max-w-4xl mx-auto">
            <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-r from-indigo-900/50 to-purple-900/50 backdrop-blur-lg border border-gray-800 overflow-hidden">
              {/* Background glow effect */}
              <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-purple-500/30 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-indigo-500/30 blur-3xl" />

              <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Ready to Split Expenses on the Blockchain?
                </h2>
                <p className="text-xl text-gray-300 max-w-2xl">
                  Join Chill&apos;Split today and experience the future of
                  expense management with your friends.
                </p>
                <DynamicConnectButton buttonClassName="h-14 px-8 rounded-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium shadow-lg shadow-indigo-500/20 transition-all duration-300">
                  <div className="flex items-center gap-2 text-lg">
                    Get Started Now
                    <ArrowRight size={20} />
                  </div>
                </DynamicConnectButton>
              </div>
            </div>
          </div>
          {/* Footer */}
          <footer className="mt-20 mx-4 md:mx-20 xl:mx-40 py-8 border-t bg-black border-gray-800 rounded-3xl">
            <div className="container px-4 md:px-6 max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                  <p className="text-gray-400">
                    © 2025 Chill&apos;Split. All rights reserved.
                  </p>
                </div>
                <div className="block md:flex space-x-6 items-center">
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Terms
                  </a>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Privacy
                  </a>
                  <div className="flex gap-4 mt-4 md:mt-0">
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
                </div>
              </div>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
