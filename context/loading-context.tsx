"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import RingLoader from "react-spinners/RingLoader";

const LoadingContext = createContext<{
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}>({
  isLoading: false,
  setLoading: () => {},
});

export const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const pathname = usePathname();

  // Automatically trigger loading on route change
  useEffect(() => {
    if (!manualLoading) {
      setIsLoading(true);
      const timeout = setTimeout(() => setIsLoading(false), 300); // short fade effect
      return () => clearTimeout(timeout);
    }
    return;
  }, [pathname]);

  // Lock scroll and pointer events on body when loading
  useEffect(() => {
    const body = document.body;
    if (isLoading) {
      body.classList.add("overflow-hidden", "pointer-events-none");
    } else {
      body.classList.remove("overflow-hidden", "pointer-events-none");
    }
    return;
  }, [isLoading]);

  return (
    <LoadingContext.Provider
      value={{
      isLoading,
      setLoading: (loading: boolean) => {
        setManualLoading(loading);
        setIsLoading(loading);
      },
      }}
    >
      {children}
      {isLoading && (
      <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" , zIndex: 9999 }}>
        <RingLoader color="#911cf0" size={60} />
        <span className="mt-4 text-white font-medium text-center" style={{ padding: "2rem" }}>
          Waiting Blockchain response... This may take a few seconds.
        </span>
      </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
