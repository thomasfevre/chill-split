"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/wallet-context";
import { refreshBlockchainCache } from "@/services/cache/blockchainCache";
import { useRefresh } from "@/context/refresh-context";
import { useLoading } from "@/context/loading-context";
import { useToast } from "@/hooks/use-toast";
import { deepBigIntToString, signSponsoredCall } from "@/lib/web3-delegate-sign";
import { EthereumWalletConnector } from "@dynamic-labs/ethereum";
import { factoryAbi } from "@/constants/factory-abi";



export function JoinGroupModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [codeDigits, setCodeDigits] = useState(Array(9).fill(""));
  const inputsRef = useRef<HTMLInputElement[]>([]);
  const { walletAddress, username, primaryWallet } = useWallet();
  const { triggerRefresh, setTriggerRefresh } = useRefresh()
  const { isLoading, setLoading } = useLoading();
  const { toast } = useToast();

  const focusNext = (index: number) => {
    if (index < 8) inputsRef.current[index + 1]?.focus();
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...codeDigits];
    newDigits[index] = value;
    setCodeDigits(newDigits);
    if (value) focusNext(index);
  };

  const joinGroup = async () => {
    const groupCode = codeDigits.slice(0, 3).join("") + "-" + codeDigits.slice(3, 6).join("") + "-" + codeDigits.slice(6).join("");
    if (groupCode.length !== 11 || codeDigits.includes("")) {
      toast({
        title: "Invalid group code",
        description: "Please enter a valid group code.",
        variant: "error",
      });
      return;
    }

    try {
      if (!walletAddress || !primaryWallet) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to join a group.",
          variant: "error",
        });
        return;
      }
      setOpen(false);
      setLoading(true);

      // Prepare the sponsored call signature 
      const { calls, signature: callSignature, delegateSignature } = await signSponsoredCall({
        primaryWallet: primaryWallet as unknown as EthereumWalletConnector,
        userWalletAddress: walletAddress as `0x${string}`,
        contractAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
        abi: factoryAbi,
        functionName: "joinGroup",
        args: [
          [walletAddress],
          [username],
          groupCode,
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

      if (!response.ok) {
        const data = await response.json();
        toast({
          title: "Error joining group",
          description: data.error,
          variant: "error",
        });
        setLoading(false);
        return;
      }


    
      toast({
        title: "Group joined",
        description: "You have successfully joined the group.",
        variant: "success",
      });

      const userWallet = walletAddress as `0x{string}`
      await refreshBlockchainCache(userWallet, username);
      setTriggerRefresh(!triggerRefresh);
      setLoading(false);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error joining group:", error);
      toast({
        title: "Error joining group",
        description: String(error),
        variant: "error",
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
      <Button
        variant="secondary"
        size="sm"
        className="gap-2 justify-start md:justify-center w-fit"
      >
        <UsersRound className="h-4 w-4" />
        <span>Join a Group</span>
      </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-xs sm:max-w-md md:max-w-lg">
      <DialogHeader>
        <DialogTitle>Join an expense group</DialogTitle>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <Label>Group Code</Label>
        <div className="flex gap-1 justify-center flex-wrap sm:flex-nowrap">
        {codeDigits.map((digit, i) =>
          i === 3 || i === 6 ? (
          <div
            key={`group-${i}`}
            className="flex items-center justify-center"
          >
            <span className="text-xl font-bold text-gray-500 mr-1">-</span>
            <Input
            key={`input-${i}`}
            placeholder={`${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            className="w-10 h-12 sm:h-14 text-center font-mono text-xl"
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            ref={(el) => {
              if (el) inputsRef.current[i] = el;
            }}
            />
          </div>
          ) : (
          <Input
            key={`input-${i}`}
            placeholder={`${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            className="w-10 h-12 sm:h-14 text-center font-mono text-xl"
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            ref={(el) => {
            if (el) inputsRef.current[i] = el;
            }}
          />
          )
        )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={joinGroup} disabled={isLoading}>
        Join Group
        </Button>
      </div>
      </DialogContent>
    </Dialog>
  );
}
