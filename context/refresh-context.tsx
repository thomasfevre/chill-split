"use client"

import React, { createContext, useContext, useState } from "react"

type RefreshContextType = {
  triggerRefresh: boolean
  setTriggerRefresh: React.Dispatch<React.SetStateAction<boolean>>
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined)

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [triggerRefresh, setTriggerRefresh] = useState(false)

  return (
    <RefreshContext.Provider value={{ triggerRefresh, setTriggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  )
}

export const useRefresh = () => {
  const context = useContext(RefreshContext)
  if (!context) {
    throw new Error("useRefresh must be used within a RefreshProvider")
  }
  return context
}