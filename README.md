# Chill'Split 🧾💸

### A Web3-powered group expense tracker – built to feel Web2.

Chill'Split lets friends and groups split expenses in a transparent, trustless, and automated way — powered by smart contracts, but **designed for everyday users**. It abstracts away blockchain complexity using modern wallet tech, gas sponsorship, and automatic reimbursements.  

- Live on Base Sepolia: [Try it](https://chill-split.vercel.app)
- Or watch the video demo : [Watch the video](https://1drv.ms/v/s!AtdUrFtj-JzFi_hO_W5SLLgNc1KF_Q)
  
<br>

## 🧭 Overview

### ❓ What Is Chill'Split?

Chill'Split is the next evolution of group expense apps (like Tricount or Splitwise), fully decentralized. Users can:

- Create or join a group via code
- Add expenses 
- Validate or reject expenses on-chain
- Settle balances automatically, using USDC (only USDC for now)
- Reimburse transparently — without needing to "trust" anyone

Despite being on-chain, Chill'Split is designed to feel like a regular web app — no confusing wallet popups or crypto jargon (except for the on-ramp process unfortunately).

---

## 🧪 Key Features

- 🏗 **Group-specific smart contracts**: Each group gets its own deployed contract to track members, expenses, validations, and balances.
- 🔐 **Fully on-chain logic**: Every validation, approval, and settlement happens on the blockchain.
- 🚫 **No manual signatures**: Using [Dynamic.xyz](https://www.dynamic.xyz/), all wallet interactions are abstracted (Gasless txs, EIP-7702, EIP-2612).
- 🔄 **Gas sponsored**: No user has to pay transaction fees — even for on-chain calls ( txs are sponsored in server actions).
- 💸 **On-ramping support**: Wallets can be funded with fiat using [Transak](https://transak.com/), built into the UI (on top of the current dynamic on-ramp providers)*
- 📱 **Mobile-first experience**: Tailored UI and authentication for users unfamiliar with Web3.

<br>
*Transak was added on top of dynamic embedded on-ramp service, because I wanted to have the quickest on-ramp workflow possible for the end user
<br>

## ⚙️ Tech Stack

### 🧱 Frameworks & Libraries

- **[Next.js 15 App Router](https://nextjs.org/)** – React framework with SSR & API routes
- **[TypeScript](https://www.typescriptlang.org/)** – End-to-end type safety
- **[Tailwind CSS](https://tailwindcss.com/)** – Utility-first styling
- **[Radix UI](https://www.radix-ui.com/)** – Accessible primitives for components
- **[Lucide-react](https://lucide.dev/guide/packages/lucide-react)** – Styled icons and symbols
- **[viem](https://viem.sh/)** – Modern Ethereum-compatible client for smart contract interaction

### 🔐 Wallet & Auth

- **[Dynamic.xyz](https://www.dynamic.xyz/)** – Wallet abstraction and authentication (supports social login, signature hiding)
- **EIP-7702** - Enable gasless transactions sponsored in server actions
- **EIP-2612** & **Permit** – For signature-free USDC approvals

### 🧾 Payments & Onramping

- **[Transak](https://transak.com/)** – Fiat-to-crypto on-ramp integrated into the onboarding flow
- For the off-ramp process, users can always use the embedded Dynamic workflow (a nice future update would be to add a simpler workflow here)

<br><br>

## 🔗 Smart Contract Architecture

- **Factory Contract** – Deploys and tracks individual group contracts.
- **Group Contract** – Manages:
  - Participants & pseudonyms
  - Expenses and validator logic
  - Settlement and balance updates
  - Reimbursements and payout flow

Every group action (add expense, validate, close, reimburse) is **executed on-chain**. Users can verify everything on block explorers — no hidden balances or calculations.

<br><br>

## 🚀 Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/your-username/chillsplit.git

# 2. Install dependencies
npm install

# 3. Set up environment variables (.env.local)
# Include Dynamic.xyz keys, Transak API, RPCs, etc.

# 4. Run the dev server
npm run dev
```

## 📦 Build & Deploy
<br>
For production:

```bash
npm run build
npm run start
```

<br><br>

## 📸 Screenshots  
Coming soon... UI mockups and flow diagrams

<br><br>

## 💬 Contact    
Built with ❤️ by [Thomas FEVRE ](https://github.com/thomasfevre)  
Feel free to open issues or suggestions!


## TODO

- Show user USDC balance (even if embedded wallet has it)
- Simulate contract before actually write in server actions to avoid gas waste
- handle the off-ramp with transak if simpler & quicker than embedded wallet options
