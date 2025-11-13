import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Copy,
  Link2,
  Lock,
  QrCode,
  Send,
  Shield,
  Timer,
} from "lucide-react";

export const ShareScreen = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <CardTitle>Share credentials securely</CardTitle>
            <Badge variant="secondary">Ephemeral</Badge>
          </div>
          <CardDescription>
            Generate invitation QR codes and deep links with configurable
            expiration policies.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[280px,1fr]">
          <div className="flex flex-col items-center gap-4 rounded-xl border bg-card/70 p-6">
            <div className="relative flex h-48 w-48 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/60">
              <div className="absolute inset-3 rounded-lg bg-gradient-to-br from-primary/20 via-background to-primary/40" />
              <QrCode className="relative h-24 w-24 text-primary" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium">Scan to initiate proof flow</p>
              <p className="text-xs text-muted-foreground">
                DIDComm v2 • Encrypted channel negotiation
              </p>
            </div>
            <Button variant="outline" className="w-full gap-2 text-sm">
              <Copy className="h-4 w-4" />
              Copy invitation URL
            </Button>
          </div>
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-card/60 p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-10 w-10 rounded-md bg-primary/10 p-2 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Selective disclosure</p>
                    <p className="text-xs text-muted-foreground">
                      Limit attributes exposed per presentation request.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-card/60 p-4">
                <div className="flex items-center gap-3">
                  <Timer className="h-10 w-10 rounded-md bg-primary/10 p-2 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Expiry controls</p>
                    <p className="text-xs text-muted-foreground">
                      Configure TTL and max verification attempts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase text-muted-foreground">
                  Audience restriction
                </label>
                <Input placeholder="did:example:trusted-verifier" />
                <p className="text-xs text-muted-foreground">
                  Restrict handshake to a specific verifier DID.
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase text-muted-foreground">
                  Credential templates
                </label>
                <Input placeholder="Employment proof vNext" />
                <p className="text-xs text-muted-foreground">
                  Select from reusable proof templates or drafts.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-4 w-4" />
            End-to-end encrypted using DIDComm authenticated channels.
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="gap-2">
              <Link2 className="h-4 w-4" />
              Copy deep link
            </Button>
            <Button className="gap-2">
              <Send className="h-4 w-4" />
              Dispatch request
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ShareScreen;

