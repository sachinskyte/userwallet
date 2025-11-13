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
import {
  CheckCircle,
  KeyRound,
  ShieldCheck,
  Users2,
  Workflow,
} from "lucide-react";

const guardians = [
  {
    name: "Alicia (Hardware token)",
    status: "Available",
    responseTime: "12m avg",
  },
  {
    name: "Nova DAO multisig",
    status: "Pending",
    responseTime: "—",
  },
  {
    name: "Emergency storage vault",
    status: "Offline",
    responseTime: "Last check 3d ago",
  },
];

export const RecoveryScreen = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>Recovery orchestration</CardTitle>
            <Badge variant="secondary">Shamir (3 of 5)</Badge>
            <Badge variant="outline">MPC Ready</Badge>
          </div>
          <CardDescription>
            Coordinate key restoration ceremonies, guardian approvals, and
            fallback recovery flows.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-[1.4fr,1fr]">
          <div className="space-y-4">
            <Card className="bg-card/60">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Workflow className="h-4 w-4 text-primary" />
                  Ceremony progress
                </CardTitle>
                <CardDescription>
                  Outline of current recovery attempt with guardian checkpoints.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg border border-dashed bg-muted/40 p-4">
                  <CheckCircle className="mt-1 h-5 w-5 text-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Step 1 · Guardian handshake
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Initiate MPC handshake with nominated guardians to confirm
                      availability.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-dashed border-muted-foreground/40 p-4">
                  <KeyRound className="mt-1 h-5 w-5 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Step 2 · Share recombination
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Request encrypted shares, verify integrity, and assemble
                      threshold quorum.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-dashed border-muted-foreground/20 p-4">
                  <ShieldCheck className="mt-1 h-5 w-5 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Step 3 · Wallet unlock</p>
                    <p className="text-xs text-muted-foreground">
                      Rehydrate key material and re-issue device bindings.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Automations support notifications, video verification, and
                  programmable delays.
                </p>
                <Button variant="outline" size="sm">
                  Draft recovery plan
                </Button>
              </CardFooter>
            </Card>
            <Card className="bg-card/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users2 className="h-4 w-4 text-primary" />
                  Guardian roster
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {guardians.map((guardian) => (
                  <div
                    key={guardian.name}
                    className="rounded-lg border bg-background/80 p-4 text-sm"
                  >
                    <p className="font-medium">{guardian.name}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">{guardian.status}</Badge>
                      <span>{guardian.responseTime}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">
                  Manage guardians
                </Button>
              </CardFooter>
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="bg-card/60">
              <CardHeader>
                <CardTitle className="text-base">Recovery checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground">
                <ul className="space-y-2">
                  <li>• Verify device fingerprint and biometric binding.</li>
                  <li>• Confirm backup passphrase or hardware token presence.</li>
                  <li>• Ensure guardian quorum meets policy thresholds.</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-card/60">
              <CardHeader>
                <CardTitle className="text-base">Communication log</CardTitle>
                <CardDescription>
                  Track guardian responses and cryptographic receipts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>Awaiting Nova DAO acknowledgement.</p>
                <p>Guardian Alicia approved share release (12 minutes ago).</p>
                <p>Cold storage vault unreachable. Schedule follow-up.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">
                  Export transcript
                </Button>
              </CardFooter>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecoveryScreen;

