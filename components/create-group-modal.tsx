"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Copy, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { keccak256, toHex } from 'viem/utils';
import { useWallet } from "@/context/wallet-context"
import { refreshBlockchainCache } from "@/services/cache/blockchainCache"
import { useRefresh } from "@/context/refresh-context"
import { useLoading } from "@/context/loading-context";
import { useToast } from "@/hooks/use-toast";
import { deepBigIntToString, signSponsoredCall } from "@/lib/web3-delegate-sign";
import { factoryAbi } from "@/constants/factory-abi";
import { EthereumWalletConnector } from "@dynamic-labs/ethereum"


export function CreateGroupModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [groupCode, setGroupCode] = useState("123-456-789")
  const [copied, setCopied] = useState(false)
  const [inviteWallet, setInviteWallet] = useState("")
  const { walletAddress, username, primaryWallet } = useWallet()
  const { triggerRefresh, setTriggerRefresh } = useRefresh()
  const { isLoading, setLoading } = useLoading();
  const { toast } = useToast();

  const generateCode = () => {
    // Mock code generation
    const part1 = Math.floor(Math.random() * 900 + 100)
    const part2 = Math.floor(Math.random() * 900 + 100)
    const part3 = Math.floor(Math.random() * 900 + 100)
    setGroupCode(`${part1}-${part2}-${part3}`)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(groupCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const createGroup = async () => {
    try {
      if (!walletAddress || !primaryWallet) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to join a group.",
          variant: "error",
        });
        return
      }
      setOpen(false);
      setLoading(true); // Start loading
      // first SHA-256 the code
      const hashHex = keccak256(toHex(groupCode));
      let wallets = [walletAddress]; // TODO: handle the optionnal field here

      // Prepare the sponsored call signature for createGroup
      const { calls, signature: callSignature, delegateSignature } = await signSponsoredCall({
        primaryWallet: primaryWallet as unknown as EthereumWalletConnector,
        userWalletAddress: walletAddress as `0x${string}`,
        contractAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
        abi: factoryAbi,
        functionName: "createGroup",
        args: [
          groupName,
          hashHex,
          wallets,
          [username],
          process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x0000000000000000000000000000000000000000",
          18,
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
        const errorData = await response.json()
        toast({
          title: "Error creating group",
          description: errorData.error || "An error occurred while creating the group.",
          variant: "error",
        })
        setLoading(false); // Stop loading
        return
      }
  
      toast({
        title: "Group created",
        description: "Your group has been created successfully.",
        variant: "success",
      })

      const userWallet = walletAddress as `0x{string}`
      await refreshBlockchainCache(userWallet, username);
      setTriggerRefresh(!triggerRefresh);
      setLoading(false); 

      router.push("/dashboard")
    } catch (error) {
      console.error("Error creating group:", error)
      toast({
        title: "Error creating group",
        description: "An error occurred while creating the group. Please try again.",
        variant: "error",
      })
      setLoading(false); // Stop loading
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span>New Group</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new expense group</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="e.g. Barcelona Trip"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="group-code">Group Code</Label>
              <Button variant="ghost" size="sm" onClick={generateCode} className="h-6 text-xs">
                Generate New
              </Button>
            </div>
            <div className="flex gap-2">
              <Input id="group-code" value={groupCode} readOnly className="font-mono" />
              <Button variant="outline" size="icon" onClick={copyCode} className="shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* <div className="grid gap-2">
            <Label htmlFor="invite-wallet">Participants Wallet (Optional)</Label>
            <Input
              id="invite-wallet"
              placeholder='["0x...", "0x..."]'
              value={inviteWallet}
              onChange={(e) => setInviteWallet(e.target.value)}
            />
          </div> */}
        </div>
        <div className="flex justify-end">
          <Button onClick={createGroup}  disabled={isLoading}>Create Group</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
