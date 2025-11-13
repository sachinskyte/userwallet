import { useEffect } from "react";
import { useWalletActions } from "@/modules/wallet/hooks";

export const AppInitializer = () => {
  const { setDid } = useWalletActions();

  useEffect(() => {
    // Sync localStorage DID with Zustand store on app load
    const storedDid = localStorage.getItem("pv_did");
    if (storedDid) {
      setDid(storedDid);
    }
  }, [setDid]);

  return null;
};


