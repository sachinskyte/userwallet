import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import { CredentialCard } from "@/modules/credentials/components/CredentialCard";
import { useWallet, useWalletActions } from "@/modules/wallet/hooks";
import type { WalletCredential } from "@/modules/wallet/store";
import { PlusCircle, RefreshCw } from "lucide-react";

const credentialArchetypes: Array<Omit<WalletCredential, "id" | "issuanceDate">> = [
  {
    title: "Orbital Dock Access",
    issuer: "Atlas Station Authority",
    type: "W3C VC JSON-LD",
    status: "active",
    description: "Proof of docking clearance for Pandora's Vault logistics pods.",
    attributes: [
      { label: "Dock ID", value: "AT-9941", disclosed: true },
      { label: "Window", value: "08:00 - 12:00 UTC", disclosed: true },
      { label: "Security Tier", value: "Gamma", disclosed: false },
    ],
    proofHash: "",
  },
  {
    title: "Research Residency",
    issuer: "Helios Research Cooperative",
    type: "AnonCreds 1.0",
    status: "active",
    description: "Credential proving temporary residence within the Helios lab cluster.",
    attributes: [
      { label: "Resident", value: "Avery Quinn", disclosed: true },
      { label: "Wing", value: "Nova-7", disclosed: true },
      { label: "Lab clearance", value: "BioSec-3", disclosed: false },
    ],
    proofHash: "",
  },
  {
    title: "Vault Guardian Oath",
    issuer: "Guild of Guardians",
    type: "DIDComm attestation",
    status: "expiring",
    description: "Annual oath credential ensuring guardian compliance with vault governance.",
    attributes: [
      { label: "Rank", value: "Sentinel", disclosed: true },
      { label: "Cycle", value: "2245-Q4", disclosed: true },
      { label: "Oath token", value: "OATH-99AL", disclosed: false },
    ],
    proofHash: "",
  },
];

export const CredentialList = () => {
  const { credentials } = useWallet();
  const { addCredential, removeCredential } = useWalletActions();

  const sortedCredentials = useMemo(
    () =>
      [...credentials].sort(
        (a, b) => new Date(b.issuanceDate).getTime() - new Date(a.issuanceDate).getTime()
      ),
    [credentials]
  );

  const handleInjectCredential = () => {
    const template = credentialArchetypes[Math.floor(Math.random() * credentialArchetypes.length)];
    const record = addCredential({
      ...template,
      status: template.status,
      proofHash: crypto.randomUUID().replace(/-/g, "").slice(0, 24),
    });
    toast({
      title: "Mock credential added",
      description: `${record.title} imported for sandbox testing.`,
      variant: "success",
    });
  };

  return (
    <Card className="bg-card/70">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">Credential inventory</CardTitle>
          <CardDescription>
            Manage verifiable credentials staged within Pandora&apos;s Vault. Everything here remains
            device-local.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleInjectCredential}>
            <PlusCircle className="h-4 w-4" />
            Add mock credential
          </Button>
          <Badge variant="secondary">{sortedCredentials.length} loaded</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <ScrollArea className="h-[480px] rounded-xl border bg-card/50 p-4">
          <div className="grid gap-4">
            {sortedCredentials.map((credential) => (
              <CredentialCard key={credential.id} credential={credential} onRemove={removeCredential} />
            ))}
            {sortedCredentials.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20 py-16 text-center">
                <RefreshCw className="h-7 w-7 text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">
                  No credentials stored yet. Inject mock data or import via DID handshake.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
        <aside className="space-y-4 rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Disclosure playbook</h3>
            <p>
              Pandora&apos;s Vault supports selective disclosure. Fields marked hidden will remain
              redacted until toggled during the Share flow.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Quick tips
            </h4>
            <ul className="grid gap-2 text-xs leading-relaxed">
              <li>• Rotate proof hashes whenever regenerating selective disclosure packages.</li>
              <li>• Archive revoked credentials to reduce payload size during identity sync.</li>
              <li>• Align attribute labels with the verifier schema to reduce negotiation friction.</li>
            </ul>
          </div>
        </aside>
      </CardContent>
    </Card>
  );
};

