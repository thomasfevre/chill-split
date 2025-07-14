"use client";

import { Navbar } from "@/components/navbar";
import { NavbarMobile } from "@/components/navbar-mobile";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Group } from "@/lib/mock-data";
import Link from "next/link";
import {
  Clock,
  AlertCircle,
  RefreshCw,
  UsersRound,
  DollarSign,
} from "lucide-react";
import { useWallet } from "@/context/wallet-context";
import React, { useEffect } from "react";
import {
  getCachedBlockchainGroups,
  refreshBlockchainCache,
} from "@/services/cache/blockchainCache";
import { Button } from "@/components/ui/button";
import { useRefresh } from "@/context/refresh-context";
import { useLoading } from "@/context/loading-context";
import { getRealExpenseCount } from "@/lib/utils";


export default function Dashboard() {
  const { walletAddress, username } = useWallet();
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [refreshLocked, setRefreshLocked] = React.useState<boolean>(false);
  const { triggerRefresh } = useRefresh();
  const { setLoading } = useLoading();

  // Fetch groups after walletAddress is set
  React.useEffect(() => {
    if (!walletAddress) return;

    const fetchData = async () => {
      const userWallet = walletAddress as `0x{string}`;
      const groups = await getCachedBlockchainGroups(userWallet, username);
      setGroups(groups);
      console.log("Groups:", groups);
    };

    return () => {
      fetchData();
    };
  }, [walletAddress, triggerRefresh, setLoading]);


  // Handle the refresh button to force refresh from the blockchain,
  // but avoiding too many requests to the blockchain
  const refreshGroups = async () => {
    if (refreshLocked) return;
    setRefreshLocked(true);

    setLoading(true); // Start loading
    const userWallet = walletAddress as `0x{string}`;
    await refreshBlockchainCache(userWallet, username);
    setLoading(false);

    const lockDuration = 5 * 1000; // 10 sec lock
    // await 10 sec before allowing another refresh
    setTimeout(() => {
      setRefreshLocked(false);
    }, lockDuration);
  };

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
        <div className="flex items-center mb-6">
          <h1 className="text-2xl font-bold">My Groups</h1>
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Link href={`/groups/${group.id}`} key={group.id}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{group.name}</CardTitle>
                    <StatusBadge status={group.status} />
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-lg text-gray-800 mb-2">
                    <p className="flex flex-row items-center">
                      <UsersRound className="h-6 w-6 mr-3" />
                      {group.participants.length} Participants
                    </p>
                    <p className="flex flex-row items-center">
                      <DollarSign className="h-6 w-6 mr-3" />
                      {getRealExpenseCount(group.expenses)} Expenses
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  {group.pendingAction && (
                    <Badge
                      variant="outline"
                      className="gap-1 text-xs border-yellow-500 text-yellow-600"
                    >
                      <AlertCircle className="h-3 w-3 border-yellow-500 text-yellow-600" />
                      Action Required
                    </Badge>
                  )}
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "Live":
      return <Badge className="bg-green-500">Live</Badge>;
    case "To Be Closed":
      return <Badge className="bg-purple-500">To Be Closed</Badge>;
    case "Closed":
      return <Badge variant="secondary">Closed</Badge>;
    default:
      return null;
  }
}

function getTimeRemaining(dateString: string): string {
  const closing = new Date(dateString).getTime();
  const now = new Date().getTime();
  const diff = closing - now;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}
