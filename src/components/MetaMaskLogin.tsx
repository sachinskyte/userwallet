import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  deriveAesKeyFromSignature,
  exportKeyToBase64,
  aesEncrypt,
  aesDecrypt,
  importKeyFromBase64,
} from "@/lib/cryptoUtils";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      isMetaMask?: boolean;
    };
  }
}

export default function MetaMaskLogin() {
  const [address, setAddress] = useState<string | null>(null);
  const [did, setDid] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [vaultInfo, setVaultInfo] = useState<string | null>(null);

  async function login() {
    try {
      if (!window.ethereum) {
        setStatus("MetaMask not found");
        return;
      }

      // Dynamic import to avoid SSR issues
      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      setAddress(addr);

      const network = await provider.getNetwork();
      const chain = network.chainId.toString();
      const DID = `did:pkh:eip155:${chain}:${addr}`;
      setDid(DID);

      const message = `PandoraVault Login\nTimestamp: ${Date.now()}`;
      const sig = await signer.signMessage(message);

      const recovered = ethers.verifyMessage(message, sig);
      if (recovered.toLowerCase() !== addr.toLowerCase()) {
        throw new Error("Signature mismatch");
      }

      const key = await deriveAesKeyFromSignature(sig);
      const keyB64 = await exportKeyToBase64(key);

      const exampleSecret = JSON.stringify({ example: "vault encrypted item", ts: Date.now() });
      const encrypted = await aesEncrypt(key, exampleSecret);

      localStorage.setItem("pv_did", DID);
      localStorage.setItem("pv_addr", addr);
      localStorage.setItem("pv_key", keyB64);
      localStorage.setItem("pv_vault", JSON.stringify(encrypted));

      setVaultInfo(JSON.stringify(encrypted, null, 2));
      setStatus("done");
    } catch (err) {
      console.error(err);
      setStatus(`error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function openVault() {
    try {
      const encStr = localStorage.getItem("pv_vault");
      const keyB64 = localStorage.getItem("pv_key");
      if (!encStr || !keyB64) {
        alert("No vault data found");
        return;
      }
      const enc = JSON.parse(encStr);
      const key = await importKeyFromBase64(keyB64);
      const decrypted = await aesDecrypt(key, enc.iv, enc.ct);
      alert("Vault decrypted: " + decrypted);
    } catch (err) {
      alert("Failed: " + (err instanceof Error ? err.message : String(err)));
    }
  }

  function logout() {
    localStorage.removeItem("pv_did");
    localStorage.removeItem("pv_addr");
    localStorage.removeItem("pv_key");
    localStorage.removeItem("pv_vault");
    setAddress(null);
    setDid(null);
    setVaultInfo(null);
    setStatus("logged_out");
  }

  useEffect(() => {
    const d = localStorage.getItem("pv_did");
    const a = localStorage.getItem("pv_addr");
    if (d && a) {
      setDid(d);
      setAddress(a);
    }
  }, []);

  return (
    <Card className="bg-card/80">
      <CardHeader>
        <CardTitle className="text-2xl">MetaMask DID Login</CardTitle>
        <CardDescription>
          Connect your MetaMask wallet to create a decentralized identity and encrypt your vault locally.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={status === "done" ? "secondary" : "outline"}>Status: {status}</Badge>
        </div>

        {!address ? (
          <Button className="w-full" onClick={login}>
            Login with MetaMask
          </Button>
        ) : (
          <>
            <div className="space-y-2 rounded-lg border bg-muted/20 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Address:</span>
                <span className="font-mono text-xs text-foreground">{address}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">DID:</span>
                <span className="font-mono text-xs text-foreground break-all">{did}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="flex-1" variant="outline" onClick={openVault}>
                Open Encrypted Vault
              </Button>
              <Button className="flex-1" variant="destructive" onClick={logout}>
                Logout
              </Button>
            </div>

            {vaultInfo && (
              <div className="rounded-lg border bg-background p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Encrypted Vault Data
                </p>
                <pre className="max-h-48 overflow-auto rounded bg-muted/40 p-2 text-xs font-mono text-muted-foreground">
                  {vaultInfo}
                </pre>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}



