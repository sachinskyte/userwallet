import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowUpRight,
  GitBranch,
  Layers3,
  QrCode,
  Shield,
  UploadCloud,
} from "lucide-react";

const roadmap = [
  {
    title: "Multi-device sync",
    description: "Link hardware wallets and companion mobile apps.",
    status: "Design",
  },
  {
    title: "Ledger export",
    description: "Audit trails and verifiable event receipts.",
    status: "Planned",
  },
  {
    title: "Delegated recovery",
    description: "Empower trusted peers with granular recovery powers.",
    status: "Research",
  },
];

export const HomeScreen = () => {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="relative overflow-hidden">
          <div className="absolute right-8 top-8 hidden h-24 w-24 rounded-full bg-primary/10 lg:block" />
          <CardHeader className="gap-4">
            <Badge className="w-fit">Preview Build</Badge>
            <div className="space-y-2">
              <CardTitle className="text-2xl sm:text-3xl">
                Your decentralized identity control center
              </CardTitle>
              <CardDescription className="text-base">
                Assemble, verify, and share credentials while maintaining full
                control over your DIDs across ecosystems.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            <Button size="lg" className="gap-2">
              Launch onboarding
              <ArrowUpRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              View architecture
              <Layers3 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              Security posture
            </CardTitle>
            <CardDescription>
              Snapshot of wallet resilience and verification coverage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Recovery shards</span>
              <Badge variant="secondary">3 / 5 Ready</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Credential proofs</span>
              <Badge variant="secondary">12 active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">DID anchors</span>
              <Badge variant="secondary">Layer 2 &amp; IPFS</Badge>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              Connect to the recovery module to verify guardian availability and
              unlock advanced multi-party approvals.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UploadCloud className="h-4 w-4 text-primary" />
              Quick import
            </CardTitle>
            <CardDescription>
              Upload credential batches or DID documents to reconcile holdings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border border-dashed bg-muted/50 p-4 text-xs text-muted-foreground">
              Drop JSON-LD or AnonCreds packages to validate schema alignment
              and integrity proofs.
            </div>
            <Button variant="outline" className="w-full">
              Import dataset
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <QrCode className="h-4 w-4 text-primary" />
              Share presence
            </CardTitle>
            <CardDescription>
              Generate QR negotiation flows for wallet-to-wallet handshakes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Default connection profile
                </span>
                <p className="text-sm">
                  DIDComm v2 • 15 minute expiry • Trusted issuers only
                </p>
              </div>
              <div className="flex items-center justify-center rounded-md border bg-gradient-to-br from-primary/10 to-primary/30 text-primary">
                <QrCode className="h-8 w-8" />
              </div>
            </div>
            <Button className="w-full">Prepare share kit</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="h-4 w-4 text-primary" />
              Roadmap
            </CardTitle>
            <CardDescription>
              Upcoming enhancements to automate verification pipelines.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {roadmap.map((item) => (
              <div key={item.title} className="space-y-1">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>{item.title}</span>
                  <Badge variant="outline">{item.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default HomeScreen;

