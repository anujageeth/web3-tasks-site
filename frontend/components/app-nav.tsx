"use client";
import React, { useEffect, useState } from "react";
import { FloatingNav } from "./ui/floating-navbar";
import { useRouter } from "next/navigation";
import { FiHome, FiCompass, FiPlus, FiUser, FiLogOut } from "react-icons/fi";
import { useAccount, useDisconnect } from "wagmi";

export function AppNav() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [showNav, setShowNav] = useState(false);

  // Only show nav on client and when connected
  useEffect(() => {
    setShowNav(isConnected);
  }, [isConnected]);

  const handleLogout = () => {
    // Disconnect web3 wallet
    disconnect();

    // Clear authentication tokens/cookies
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // Redirect to login page
    router.push("/login");
  };

  const navItems = [
    {
      name: "Dashboard",
      link: "/dashboard",
      icon: <FiHome className="h-5 w-5 text-white" />,
    },
    {
      name: "Explore",
      link: "/events",
      icon: <FiCompass className="h-5 w-5 text-white" />,
    },
    {
      name: "Create",
      link: "/events/create",
      icon: <FiPlus className="h-5 w-5 text-white" />,
    },
    {
      name: "Profile",
      link: "/profile",
      icon: <FiUser className="h-5 w-5 text-white" />,
    },
    {
      name: "Logout",
      link: "#",
      icon: <FiLogOut className="h-5 w-5 text-white" />,
      onClick: handleLogout,
    },
  ];

  if (!showNav) return null;

  return <FloatingNav navItems={navItems} />;
}