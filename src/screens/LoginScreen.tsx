import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  deriveAesKeyFromSignature,
  exportKeyToBase64,
  encryptAES as aesEncrypt,
} from "@/lib/cryptoUtils";
import { useWalletActions } from "@/modules/wallet/hooks";

declare global {
  interface Window {
    ethereum?: {
      request: (args: {
        method: string;
        params?: unknown[];
      }) => Promise<unknown>;
      isMetaMask?: boolean;
    };
  }
}

export default function LoginScreen() {
  const navigate = useNavigate();
  const { setDid } = useWalletActions();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login() {
    setIsLoading(true);
    setError(null);

    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        setError(
          "MetaMask is not installed. Please install MetaMask extension to continue."
        );
        setIsLoading(false);
        return;
      }

      // Check if MetaMask is the provider
      if (!window.ethereum.isMetaMask) {
        setError("Please use MetaMask wallet to login.");
        setIsLoading(false);
        return;
      }

      // Dynamic import to avoid SSR issues
      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Request account access
      let accounts: string[];
      try {
        accounts = (await provider.send("eth_requestAccounts", [])) as string[];
        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts found. Please unlock MetaMask.");
        }
      } catch (err: any) {
        if (err.code === 4001) {
          throw new Error(
            "MetaMask connection rejected. Please approve the connection to continue."
          );
        }
        throw err;
      }

      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      const network = await provider.getNetwork();
      const chain = network.chainId.toString();
      const did = `did:pkh:eip155:${chain}:${addr}`;

      // Create signing message
      const timestamp = Date.now();
      const message = `Sign in to PandoraVault\n\nAddress: ${addr}\nChain ID: ${chain}\nTimestamp: ${timestamp}\n\nBy signing this message, you prove control over your decentralized identity.\n\nThis signature will be used to derive your encryption key locally.`;

      // Request signature
      let signature: string;
      try {
        signature = await signer.signMessage(message);
      } catch (err: any) {
        if (err.code === 4001 || err.code === "ACTION_REJECTED") {
          throw new Error(
            "Signature rejected. You must sign the message to login."
          );
        }
        throw err;
      }

      // Verify signature
      const recovered = ethers.verifyMessage(message, signature);
      if (recovered.toLowerCase() !== addr.toLowerCase()) {
        throw new Error("Signature verification failed. Please try again.");
      }

      // Derive encryption key from signature
      const key = await deriveAesKeyFromSignature(signature);
      const keyB64 = await exportKeyToBase64(key);

      // Create initial vault data
      const encrypted = await aesEncrypt(
        key,
        JSON.stringify({
          vault: "initialized",
          created: timestamp,
          version: "1.0.0",
        })
      );

      // Store credentials
      localStorage.setItem("pv_did", did);
      localStorage.setItem("pv_addr", addr);
      localStorage.setItem("pv_key", keyB64);
      localStorage.setItem("pv_vault", JSON.stringify(encrypted));
      localStorage.setItem("pv_chain", chain);

      // Sync with Zustand store
      setDid(did);

      // Small delay to ensure state updates
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Redirect to home
      navigate("/", { replace: true });
    } catch (e: any) {
      console.error("Login error (AES export failed?) →", e);
      let errorMessage = "Login failed. Please try again.";

      if (e instanceof Error) {
        errorMessage = e.message;
      } else if (e?.message) {
        errorMessage = e.message;
      } else if (e?.code === -32002) {
        errorMessage =
          "MetaMask is already processing a request. Please check your MetaMask extension.";
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-8 w-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">
            PandoraVault Login
          </CardTitle>
          <CardDescription>
            Connect your wallet to access your decentralized identity vault
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={login}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Connecting...
              </>
            ) : (
              "Login with MetaMask"
            )}
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            <p>
              By connecting, you agree to PandoraVault&apos;s terms of service.
            </p>
            <p className="mt-1">
              Your wallet signature is used to derive encryption keys locally.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
