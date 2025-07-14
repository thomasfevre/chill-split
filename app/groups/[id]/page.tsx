"use client";

import { useCallback, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  getGroupById,
  type Expense,
  type Participant,
  type Group,
} from "@/lib/mock-data";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Wallet,
  RefreshCw,
  UsersRound,
  DollarSign,
  Italic,
  Check,
  Slash,
} from "lucide-react";
import { useWallet } from "@/context/wallet-context";
import { useEffect } from "react";
import { AddExpenseModal } from "@/components/add-expense-modal";
import { ExpenseValidationActions } from "@/components/expense-validation-actions";
import { ExpenseSummaryCharts } from "@/components/expense-summary-charts";
import { SettlementSummary } from "@/components/settlement-summary";
import React from "react";
import {
  getCachedBlockchainGroup,
  refreshBlockchainCache,
} from "@/services/cache/blockchainCache";
import { useRefresh } from "@/context/refresh-context";
import { useLoading } from "@/context/loading-context";
import { useToast } from "@/hooks/use-toast";
import { idchain } from "viem/chains";
import { getGroupCode } from "@/services/smart-contract-fetch/groupFetch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { areExpensesAllValidated, getRealExpenseCount } from "@/lib/utils";
import { baseSepolia } from "viem/chains";
import { USDC_ADDRESS } from "@/constants/constant";
import { signUSDCPermit } from "@/lib/web3-permit";
import { useDynamicContext, useOpenFundingOptions } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnector } from "@dynamic-labs/ethereum";
import { NavbarMobile } from "@/components/navbar-mobile";
import { clearGroupsCache } from "@/services/cache/sessionStorage";
import { TransakConfig, Transak } from "@transak/transak-sdk";
import { useTokenBalances } from "@dynamic-labs/sdk-react-core";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createPublicClient, http } from "viem";
import { erc20Abi } from "viem";
import { factoryAbi } from "@/constants/factory-abi";
import { deepBigIntToString, signSponsoredCall } from "@/lib/web3-delegate-sign";
import { groupAbi } from "@/constants/group-abi";

export default function GroupDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { isConnected, connectWallet, userId, username, walletAddress, user } =
    useWallet();
  const router = useRouter();
  const resolvedParams = React.use(params);
  const [isSettling, setIsSettling] = useState(false);
  const [group, setGroup] = useState<Group | undefined>(undefined);
  const [allExpensesValidated, setAllExpensesValidated] = React.useState<boolean>(false);
  const [refreshLocked, setRefreshLocked] = React.useState<boolean>(false);
  const { isLoading, setLoading } = useLoading();
  const { toast } = useToast();
  const { primaryWallet } = useDynamicContext();
  const { openFundingOptions } = useOpenFundingOptions()
  const { tokenBalances, fetchAccountBalances } = useTokenBalances();
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [repayError, setRepayError] = useState<string | null>(null);
  const { triggerRefresh, setTriggerRefresh } = useRefresh();

  const [showRemoveUserBtn, setShowRemoveUserBtn] = useState({
    id: "",
    show: false,
  });
  const reimbursementProgress = group?.participants.reduce((acc, participant) => {
    if (participant.balance && participant.balance >= 0) {
      return acc + 1;
    }
    return acc;
  }, 0) || 0;

  const transakConfig: TransakConfig = {
    apiKey: process.env.NEXT_PUBLIC_TRANSAK_API_KEY!, // (Required)
    environment: Transak.ENVIRONMENTS.STAGING, // (Required)
    defaultNetwork: "base",
    network: "base",
    defaultPaymentMethod: "credit_debit_card",
    defaultCryptoAmount: 30,
    cryptoAmount: 30,
    defaultCryptoCurrency: "USDC",
    cryptoCurrencyCode: "USDC",
    isFeeCalculationHidden: true,
    walletAddress: walletAddress,
    // email: user?.email, // if social auth, maybe the user wants to use a different email
    hideMenu: true,
  };
  const transak = new Transak(transakConfig);

  const fetchGroup = async () => {
    if (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    setLoading(true);
    if (walletAddress && resolvedParams.id) {
      const fetchedGroup = await getCachedBlockchainGroup(
        resolvedParams.id as `0x${string}`,
        username
      );
      if (fetchedGroup) {
        setGroup(fetchedGroup);
        if (fetchedGroup.status === "Live") {
          setAllExpensesValidated(areExpensesAllValidated(fetchedGroup.expenses));
        }
      }
    }
    setLoading(false);
  };
  useEffect(() => {
    if (!isConnected) return;
    fetchGroup();
  }, []);

  useEffect(() => {
    fetchGroup();
  }, [resolvedParams.id, walletAddress, triggerRefresh]);

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
    return;
  }, [isConnected, router]);

  // Handle the refresh button to force refresh from the blockchain,
  // but avoiding too many requests to the blockchain
  const refreshGroups = async () => {
    if (refreshLocked) {
      setTriggerRefresh(!triggerRefresh);
      return;
    }
    
    setLoading(true); // Start loading
    setRefreshLocked(true);

    const userWallet = walletAddress as `0x{string}`;
    await refreshBlockchainCache(userWallet, username);
    setTriggerRefresh(!triggerRefresh);


    const lockDuration = 5 * 1000; // 5 sec lock
    // await 10 sec before allowing another refresh
    setTimeout(async () => {
      setRefreshLocked(false);
      setLoading(false);
    }, lockDuration);
  };

  const handleAddExpense = async (
    expenseData: Omit<Expense, "id" | "validations">
  ) => {
    if (!walletAddress || !group || !primaryWallet) return;
    setLoading(true);

    // Prepare the sponsored call signature 
    const { calls, signature: callSignature, delegateSignature } = await signSponsoredCall({
      primaryWallet: primaryWallet as unknown as EthereumWalletConnector,
      userWalletAddress: walletAddress as `0x${string}`,
      contractAddress: group.id as `0x${string}`,
      abi: groupAbi,
      functionName: "addExpense",
      args: [
        expenseData.label,
        Math.round(expenseData.amount * 100), // Convert to smallest unit if needed
        expenseData.paidBy,
        group.participants.map((p: Participant) => p.walletAddress) || [],
      ],
    });

    const payload = deepBigIntToString({
      delegateSignature,
      userWallet: walletAddress,
      calls,
      callSignature,
    });

    // Send a POST request to the server component
    const response = await fetch("/api/sponsor-tx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    })

    if (response.ok) {
      refreshGroups();

      toast({
        title: "Expense added",
        description: "Your expense has been added successfully.",
        variant: "success",
      });
    } else {
      const errorData = await response.json();
      toast({
        title: "Error creating group",
        description:
          errorData.error || "An error occurred while adding expense.",
        variant: "error",
      });
    }
    setLoading(false);
  };

  const handleValidateExpense = async (
    expenseId: string,
    status: "Validated" | "Rejected"
  ) => {
    if (!walletAddress || !group || !primaryWallet) return;
    setLoading(true);

    // Prepare the sponsored call signature 
    const { calls, signature: callSignature, delegateSignature } = await signSponsoredCall({
      primaryWallet: primaryWallet as unknown as EthereumWalletConnector,
      userWalletAddress: walletAddress as `0x${string}`,
      contractAddress: group.id as `0x${string}`,
      abi: groupAbi,
      functionName: "validateExpense",
      args: [
        parseInt(expenseId.split("-")[1]),
      ],
    });

    const payload = deepBigIntToString({
      delegateSignature,
      userWallet: walletAddress,
      calls,
      callSignature,
    });

    // Send a POST request to the server component
    const response = await fetch("/api/sponsor-tx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    })

    if (response.ok) {
      refreshGroups();

      toast({
        title:
          status === "Validated" ? "Expense Validated" : "Expense Rejected",
        description: "",
        variant: "success",
      });
    } else {
      const errorData = await response.json();
      toast({
        title: "Error validating/refusing expense",
        description:
          errorData.error ||
          "An error occurred while validating/refusing the expense.",
        variant: "error",
      });
    }

    setLoading(false);
  };


  const handleRemoveParticipant = async (participantId: string) => {
    if (!walletAddress || !group || !primaryWallet) return;
    setLoading(true);

    // Prepare the sponsored call signature 
    const { calls, signature: callSignature, delegateSignature } = await signSponsoredCall({
      primaryWallet: primaryWallet as unknown as EthereumWalletConnector,
      userWalletAddress: walletAddress as `0x${string}`,
      contractAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
      abi: factoryAbi,
      functionName: "removeParticipant",
      args: [
        group.id,
        participantId,
      ],
    });

    const payload = deepBigIntToString({
      delegateSignature,
      userWallet: walletAddress,
      calls,
      callSignature,
    });

    // Send a POST request to the server component
    const response = await fetch("/api/sponsor-tx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    })


    if (response.ok) {
      refreshGroups();

      toast({
        title: "Participant removed",
        description: "",
        variant: "success",
      });
    } else {
      const errorData = await response.json();
      toast({
        title: "Error removing participant",
        description:
          errorData.error ||
          "An error occurred while removing the participant.",
        variant: "error",
      });
    }
    setLoading(false);
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!walletAddress || !group || !primaryWallet) return;
    setLoading(true);
    try {
      const code = await getGroupCode(groupId as `0x${string}`, walletAddress as `0x${string}`);
      if (!code) {
        toast({
          title: "Error fetching group code",
          description: "Unable to fetch group code.",
          variant: "error",
        });
        setLoading(false);
        return;
      }

      // Prepare the sponsored call signature 
      const { calls, signature: callSignature, delegateSignature } = await signSponsoredCall({
        primaryWallet: primaryWallet as unknown as EthereumWalletConnector,
        userWalletAddress: walletAddress as `0x${string}`,
        contractAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
        abi: factoryAbi,
        functionName: "deleteGroup",
        args: [
          code,
        ],
      });

      const payload = deepBigIntToString({
        delegateSignature,
        userWallet: walletAddress,
        calls,
        callSignature,
      });

      // Send a POST request to the server component
      const response = await fetch("/api/sponsor-tx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast({
          title: "Group deleted",
          description: "",
          variant: "success",
        });
        clearGroupsCache();
        router.push("/dashboard");
      } else {
        const errorData = await response.json();
        toast({
          title: "Error deleting group",
          description:
            errorData.error || "An error occurred while deleting the group.",
          variant: "error",
        });
      }

      setLoading(false);
    } catch (error) {
      console.error("Error deleting group:", error);
      toast({
        title: "Error deleting group",
        description: String(error),
        variant: "error",
      });
      setLoading(false);
      return;
    } finally {
      setLoading(false);
    }


  };

  const handleLeaveGroup = async () => {
    if (!walletAddress || !group || !primaryWallet) return;
    setLoading(true);

    // Prepare the sponsored call signature 
    const { calls, signature: callSignature, delegateSignature } = await signSponsoredCall({
      primaryWallet: primaryWallet as unknown as EthereumWalletConnector,
      userWalletAddress: walletAddress as `0x${string}`,
      contractAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
      abi: factoryAbi,
      functionName: "removeParticipant",
      args: [
        group.id,
        walletAddress
      ],
    });

    const payload = deepBigIntToString({
      delegateSignature,
      userWallet: walletAddress,
      calls,
      callSignature,
    });

    // Send a POST request to the server component
    const response = await fetch("/api/sponsor-tx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    })

    if (response.ok) {
      toast({
        title: "You left the group",
        description: "",
        variant: "success",
      });
      clearGroupsCache();
      // redirect to dashboard
      router.push("/dashboard");
    } else {
      const errorData = await response.json();
      toast({
        title: "Error leaving group",
        description:
          errorData.error || "An error occurred while leaving the group.",
        variant: "error",
      });
    }

    setLoading(false);
  };

  const handleRemoveExpense = async (expenseId: string) => {
    if (!walletAddress || !group || !primaryWallet) return;
    setLoading(true);

    // Prepare the sponsored call signature 
    const { calls, signature: callSignature, delegateSignature } = await signSponsoredCall({
      primaryWallet: primaryWallet as unknown as EthereumWalletConnector,
      userWalletAddress: walletAddress as `0x${string}`,
      contractAddress: group.id as `0x${string}`,
      abi: groupAbi,
      functionName: "removeExpense",
      args: [
        parseInt(expenseId.split("-")[1])
      ],
    });

    const payload = deepBigIntToString({
      delegateSignature,
      userWallet: walletAddress,
      calls,
      callSignature,
    });

    // Send a POST request to the server component
    const response = await fetch("/api/sponsor-tx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    })

    if (response.ok) {
      refreshGroups();

      toast({
        title: "Expense removed",
        description: "",
        variant: "success",
      });
    } else {
      const errorData = await response.json();
      toast({
        title: "Error removing expense",
        description:
          errorData.error || "An error occurred while removing the expense.",
        variant: "error",
      });
    }

    setLoading(false);
  };

  const handleSettleGroup = async () => {
    setLoading(true);
    try {
      if (!walletAddress || !group || !primaryWallet) return;

      // Prepare the sponsored call signature 
      const { calls, signature: callSignature, delegateSignature } = await signSponsoredCall({
        primaryWallet: primaryWallet as unknown as EthereumWalletConnector,
        userWalletAddress: walletAddress as `0x${string}`,
        contractAddress: group.id as `0x${string}`,
        abi: groupAbi,
        functionName: "closeGroup",
        args: [],
      });

      const payload = deepBigIntToString({
        delegateSignature,
        userWallet: walletAddress,
        calls,
        callSignature,
      });

      // Send a POST request to the server component
      const response = await fetch("/api/sponsor-tx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        refreshGroups();

        toast({
          title: "Group Settled",
          description: "",
          variant: "success",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error settling group",
          description:
            errorData.error || "An error occurred while settling the group.",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error settling group:", error);
    } finally {
      setLoading(false);
    }
  };

  const beforeUSDCPermit = async () => {
    if (!walletAddress || !group) return;

    if (!primaryWallet) {
      console.error("Primary wallet not found");
      return;
    }

    const participant = group.participants.find(
      (p) => p.id === walletAddress
    );
    if (!participant || !participant.balance) {
      console.error("Participant not found or balance is undefined");
      return;
    }

    // Fetch USDC balance using viem
    const client = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });
    let usdcBalance = 0;
    try {
      const usdcBalanceBigInt = await client.readContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [walletAddress as `0x${string}`],
      });
      // Convert from BigInt to number (USDC has 6 decimals but 18 in testnet for my own USDC) //FIXME
      usdcBalance = Number(usdcBalanceBigInt) / 1e18;
      console.log("USDC Balance (viem):", usdcBalance);
    } catch (err) {
      console.error("Error fetching USDC balance with viem:", err);
    }

    if (!usdcBalance || usdcBalance <= 0) {
      transak.init();
      setRepayError("You need to fund your wallet with USDC.");
      // setShowRepayModal(true);
      return;
    } else if (usdcBalance < participant.balance) {
      setRepayError("You need to fund your wallet with more USDC.");
      setShowRepayModal(true);
      return;
    }

    setRepayError(null);
    setShowRepayModal(true);
  };


  const handleUSDCPermit = async () => {
    if (!walletAddress || !group) return;

    console.log("Handling USDC permit...");
    // TODO: Implement the USDC permit logic
    if (!primaryWallet) {
      console.error("Primary wallet not found");
      return;
    }

    const participant = group.participants.find(
      (p) => p.id === walletAddress
    );
    if (!participant || !participant.balance) {
      console.error("Participant not found or balance is undefined");
      return;
    }
    // first check the user USDC balance 
    console.log("Checking USDC balance...");

   // Fetch USDC balance using viem
    const client = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });
    let usdcBalance = 0;
    try {
      const usdcBalanceBigInt = await client.readContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [walletAddress as `0x${string}`],
      });
      // Convert from BigInt to number (USDC has 6 decimals but 18 in testnet for my own USDC) //FIXME
      usdcBalance = Number(usdcBalanceBigInt) / 1e18;
      console.log("USDC Balance (viem):", usdcBalance);
    } catch (err) {
      console.error("Error fetching USDC balance with viem:", err);
    }
    if (!usdcBalance || usdcBalance <= 0) {
      console.log("USDC balance is 0");
      toast({
        title: "No USDC balance",
        description: "You need to fund your wallet with USDC.",
        variant: "error",
      });
      transak.init();
      return;
    } else if (usdcBalance < participant.balance) {
      console.log("USDC balance is too low");
      toast({
        title: "Low USDC balance",
        description: "You need to fund your wallet with more USDC.",
        variant: "error",
      });
      transak.init();
      return;
    }

    const permit = await signUSDCPermit({
      primaryWallet: primaryWallet as unknown as EthereumWalletConnector,
      owner: userId,
      spender: group?.id as `0x${string}`,
      amount: Math.abs(participant.balance).toFixed(2),
      usdcAddress: USDC_ADDRESS,
      chainId: baseSepolia.id,
      deadline: BigInt(Math.floor(Date.now() / 1000) + 300).toString(), // 5 min from now
    });

    // Convert any BigInt fields in permit to string
    const permitForApi = JSON.parse(
      JSON.stringify(permit, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    console.log("Permit:", permitForApi);

    setLoading(true);
    try {
      const response = await fetch("/api/refund/make-refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupAddress: group.id,
          participant: walletAddress,
          permit: permitForApi,
        }),
      });
      if (response.ok) {
        refreshGroups();

        toast({
          title: "Refund successful",
          description: "",
          variant: "success",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error refunding",
          description:
            errorData.error || "An error occurred while refunding.",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error settling group:", error);
    } finally {
      setLoading(false);
    }
  }

  // Handle Transak events
  const handleTransakEvent = async (event: any) => {
    console.log("Transak order data:", event);
    if (event.eventName === "TRANSAK_WIDGET_CLOSE") {
      transak.close();
      transak.cleanup();
    } else if (event.eventName === "TRANSAK_ORDER_SUCCESSFUL") {
      const response = await fetch("/api/dev/mint-usdc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant: walletAddress,
        }),
      });
      console.log(response);
    } else {
      console.log("Transak event:", event);
    }

  };

  // Register Transak event listener only once using useEffect
  React.useEffect(() => {
    Transak.on("*", handleTransakEvent);
    return () => {
      transak.cleanup();
    };
  }, []);


  if (!isConnected) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6">
              Connect your wallet to view group details
            </h2>
            <Button onClick={connectWallet} size="lg" className="gap-2">
              <Wallet className="h-5 w-5" />
              <span>Connect Wallet</span>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6">Group not found</h2>
            <Button
              onClick={() => router.push("/dashboard")}
              size="lg"
              className="gap-2"
            >
              <Wallet className="h-5 w-5" />
              <span>Go to Dashboard</span>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const allValidated = group.expenses
    ? group.expenses.every((expense) =>
      expense.validations.every((v) => v.status === "Validated")
    )
    : false;

  const closingTimeMs = 0;
  const nowMs = Date.now();
  const timeRemainingMs = closingTimeMs - nowMs;
  const timeRemainingHours = Math.max(
    0,
    Math.floor(timeRemainingMs / (1000 * 60 * 60))
  );
  const progressValue = Math.max(
    0,
    Math.min(100, (24 - timeRemainingHours) * (100 / 24))
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* Show NavbarMobile on mobile, Navbar on desktop */}
      <div className="block md:hidden">
        <NavbarMobile />
      </div>
      <div className="hidden md:block">
        <Navbar />
      </div>
      <main className="flex-1 container py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <Badge
              className={
                group.status === "Live"
                  ? "bg-green-500"
                  : group.status === "To Be Closed"
                    ? "bg-purple-500"
                    : "bg-muted text-muted-foreground"
              }
            >
              {group.status}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="ml-8"
              onClick={refreshGroups}
              disabled={refreshLocked}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {group.status === "To Be Closed" && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="space-y-2">
                {group.participants.map((participant) => {
                  if (participant.id === walletAddress && participant.balance && participant.balance < 0) {
                    return (
                      <div key={participant.id}>
                        <div className="mt-2 text-center">
                          <span>
                            The group is ready for settlement. You can now pay your part.
                          </span>
                          <br />
                          <span>
                            Amount you owe: <strong>${Math.abs(participant.balance).toFixed(2)}</strong>
                          </span>
                        </div>
                        <div className="mt-4 flex justify-center">

                          <Button onClick={beforeUSDCPermit} disabled={isSettling}>
                            {isSettling ? "Processing..." : "Pay Your Part"}
                          </Button>

                        </div>
                      </div>
                    );
                  } else if (participant.id === walletAddress && participant.balance && participant.balance > 0) {
                    return (
                      <div key={participant.id} className="mt-2 text-center">
                        <span>
                          Once all participants have reimbursed their part, you will receive a refund of:
                          <strong>${participant.balance.toFixed(2)}</strong>
                        </span>
                      </div>
                    );
                  }
                })}

                <div className="mt-4">
                  <div className="text-center">
                    <span>
                      Total Reimbursement Progress: <strong>{reimbursementProgress.toFixed(2)}%</strong>
                    </span>
                  </div>
                  <div className="mt-2">
                    <Progress value={reimbursementProgress} />
                  </div>
                </div>


              </div>
            </CardContent>
          </Card>
        )}

        {group.status === "Closed" && (
          <Card className="mt-6 border-purple-200 bg-purple-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-purple-800">
                    Group is now closed. Everyone has been reimbursed.
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="border-purple-300 text-purple-700"
                >
                  View Settlement
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settlement Summary for Closed or To Be Closed groups */}
        {(group.status === "Closed" ||
          (group.status === "To Be Closed" && allValidated)) && (
            <div className="my-6">
              <SettlementSummary group={group} />
            </div>
          )}

        <div className="grid gap-6 md:grid-cols-3 grid-cols-1">
          <Card className="md:col-span-1 col-span-1">
            <CardHeader>
              <div className="flex flex-row items-center">
                <UsersRound className="h-6 w-6 mr-3" />
                <CardTitle className="text-lg">Participants</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pr-2">
              <ul className="space-y-2">
                {group.participants.map((participant) => (
                  <li
                    key={participant.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                    onMouseEnter={() =>
                      setShowRemoveUserBtn({ id: participant.id, show: true })
                    }
                    onMouseLeave={() =>
                      setShowRemoveUserBtn({ id: "", show: false })
                    }
                  >
                    <div className="flex items-center gap-2">
                      {participant.id !== walletAddress &&
                        group.participants[0].id == walletAddress && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`text-red-500 hover:text-red-700 ${!showRemoveUserBtn.show ||
                              showRemoveUserBtn.id !== participant.id
                              ? "hidden"
                              : ""
                              }`}
                            onClick={() =>
                              handleRemoveParticipant(participant.id)
                            }
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      <span
                        className={`font-mono text-sm ${participant.id === walletAddress ? "font-bold" : ""
                          }`}
                      >
                        {participant.shortName}
                        {participant.id === walletAddress
                          ? " (You)"
                          : ` (${participant.pseudo})`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ParticipantStatus
                        participant={participant}
                        expenses={group.expenses}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="grid grid-cols-2 md:flex md:flex-row items-center wrap justify-between pt-2">
              <div className="flex flex-row items-center">
                <DollarSign className="h-6 w-6 md:mr-3" />
                <CardTitle className="text-lg">Expenses</CardTitle>
              </div>
              {/*  "Settle and Close Group" button/modal */}
              {group.status === "Live" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant={group.realExpensesCount > 0 && allExpensesValidated ? "default" : "outline"}
                      size="sm"
                      disabled={group.realExpensesCount == 0 || !allExpensesValidated}
                      className={group.realExpensesCount > 0 && allExpensesValidated ? "" : "hidden md:block"}
                    >
                      <span className="">Settle Expenses</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Settle Expenses</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to settle this group? This action will finalize all expenses and settle the group.
                        Once the group is settled, no further expense additions or updates will be allowed. Participants will be able to proceed with payment, if they owe something.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleSettleGroup()} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {group.status === "Live" && group.realExpensesCount > 0 && (
                <AddExpenseModal
                  group={group}
                  walletAddress={userId}
                  onAddExpense={handleAddExpense}
                />
              )}

            </CardHeader>
            <CardContent>
              {group.realExpensesCount === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No expenses yet</p>
                  {group.status === "Live" && (
                    <AddExpenseModal
                      group={group}
                      walletAddress={userId}
                      onAddExpense={handleAddExpense}
                    />
                  )}
                </div>
              ) : (
                <ul className="space-y-4">
                  {group.expenses.map((expense) => {
                    const paidBy = group.participants.find(
                      (p) => p.id === expense.paidBy
                    );
                    if (expense.amount > 0) {
                      return (
                        <li key={expense.id}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium">{expense.label}</h3>
                              <p className="text-sm text-muted-foreground">
                                Paid by{" "}
                                {paidBy?.id === userId ? "you" : paidBy?.pseudo}{" "}
                                • {new Date(expense.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">
                                ${expense.amount.toFixed(2)}
                              </p>
                              {expense.validations.some(
                                (validation) => validation.participantId === userId && validation.status === "Validated"
                              ) && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className={`h-8 p-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 ${group.status !== 'Live' || expense.paidBy !== userId ? 'hidden' : ''}`}
                                      >
                                        <span className="">Remove</span>
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remove Expense</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to remove this expense? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleRemoveExpense(expense.id)} className="bg-red-600 hover:bg-red-700">
                                          Remove
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                            </div>
                          </div>

                          {/* Validation actions */}
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex flex-wrap gap-2">
                              {expense.validations.map((validation) => {
                                const participant = group.participants.find(
                                  (p) => p.id === validation.participantId
                                );
                                const isCurrentUser =
                                  participant?.id === userId;
                                return (
                                  <Badge
                                    key={validation.participantId}
                                    variant="outline"
                                    className={`text-xs ${validation.status === "Validated"
                                      ? "border-green-500 text-green-600"
                                      : validation.status === "Rejected"
                                        ? "border-red-500 text-red-600"
                                        : "border-yellow-500 text-yellow-600"
                                      } ${isCurrentUser ? "font-bold" : ""}`}
                                  >
                                    {validation.status === "Validated" ? (
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                    ) : validation.status === "Rejected" ? (
                                      <XCircle className="h-3 w-3 mr-1" />
                                    ) : (
                                      <Clock className="h-3 w-3 mr-1" />
                                    )}
                                    {isCurrentUser
                                      ? "You"
                                      : participant?.pseudo}
                                  </Badge>
                                );
                              })}
                            </div>
                            {group.status !== "Closed" && (
                              <ExpenseValidationActions
                                expense={expense}
                                onValidate={handleValidateExpense}
                              />
                            )}
                          </div>
                          <Separator className="mt-4" />
                        </li>
                      );
                    }
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>



        {/* Expense Summary Charts */}
        {group.realExpensesCount > 0 && group.status !== "Closed" && (
          <div className="mt-6">
            <ExpenseSummaryCharts group={group} />
          </div>
        )}
        {walletAddress === group.participants[0].id ? (
          <div className="mt-6 flex justify-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  Delete Group
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Group</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this group? This action cannot be undone and all data will be lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => handleDeleteGroup(group.id)}
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <div className="mt-6 flex justify-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  Leave Group
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave Group</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to leave this group? You will lose access to its expenses and settlements.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleLeaveGroup}
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </main>
      <Dialog open={showRepayModal} onOpenChange={setShowRepayModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Repayment</DialogTitle>
            <DialogDescription>
              {repayError
                ? repayError
                : "Are you sure you want to repay your part? This will use your USDC balance."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {repayError ? (
              <div className="flex flex-col gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRepayModal(false);
                    openFundingOptions(); // Dynamic fund with crypto
                  }}
                >
                  Fund with Crypto
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    // Transak buy with card
                    setShowRepayModal(false);
                  }}
                >
                  Buy with Card
                </Button>
              </div>
            ) : (
              <Button
                onClick={async () => {
                  setShowRepayModal(false);
                  await handleUSDCPermit(); // Call your actual repayment logic here
                }}
              >
                Confirm Repayment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ParticipantStatus({
  participant,
  expenses,
}: {
  participant: Participant;
  expenses: Expense[];
}) {
  if (!expenses || getRealExpenseCount(expenses) === 0) {
    return (
      <Badge
        variant="outline"
        className="text-xs flex items-center gap-1 border-gray-400 text-gray-600"
      >
        <Slash className="h-3 w-3" />
        No expenses to validate
      </Badge>
    );
  }

  const pendingValidations = expenses.some((expense) =>
    expense.validations.some(
      (v) => v.participantId === participant.id && v.status === "Pending"
    )
  );

  if (pendingValidations) {
    return (
      <Badge
        variant="outline"
        className="text-xs flex items-center gap-1 border-yellow-400 text-yellow-600"
      >
        <AlertCircle className="h-3 w-3" />
        Expense Validation Pending
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="text-xs flex items-center gap-1 border-green-400 text-green-600"
    >
      <CheckCircle2 className="h-3 w-3" />
      Expense Validated
    </Badge>
  );
}
