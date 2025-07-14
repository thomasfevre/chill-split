

import { ThemeProvider } from "@/components/theme-provider";
import { WalletProvider } from "@/context/wallet-context";
import { RefreshProvider } from "@/context/refresh-context";
import { LoadingProvider } from "@/context/loading-context";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { Toaster } from "@/components/ui/toaster";


export function Providers({ children }: { children: React.ReactNode }) {



  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <RefreshProvider>
        <LoadingProvider>
          <DynamicContextProvider
            settings={{
              environmentId: "ff463648-d154-43f8-bef9-692100930199",
              walletConnectors: [EthereumWalletConnectors],
              mobileExperience: 'redirect' 
            }}
          >
            <WalletProvider>
              {children}
              <Toaster />
            </WalletProvider>
          </DynamicContextProvider>
        </LoadingProvider>
      </RefreshProvider>
    </ThemeProvider>
  );
}
