import { useEffect } from "react";
import { useWalletStore, selectWallet, selectWalletActions } from "@/modules/wallet/store";

export const useWallet = () => useWalletStore(selectWallet);
export const useWalletActions = () => useWalletStore(selectWalletActions);

export const useEnsureDid = () => {
  const { did } = useWallet();
  const { generateDid } = useWalletActions();

  useEffect(() => {
    if (!did) {
      generateDid();
    }
  }, [did, generateDid]);
};

