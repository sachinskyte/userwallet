import { useEffect } from "react";
import {
  useWalletStore,
  selectWallet,
  selectWalletActions,
  selectHasDid,
} from "@/modules/wallet/store";

export const useWallet = () => useWalletStore(selectWallet);
export const useWalletActions = () => useWalletStore(selectWalletActions);
export const useHasDid = () => useWalletStore(selectHasDid);

