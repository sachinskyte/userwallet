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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowUpRightSquare,
  Database,
  Fingerprint,
  Network,
} from "lucide-react";

const credentialSummaries = [
  {
    id: "cred-1",
    title: "Government ID",
    issuer: "Ministry of Identity",
    status: "Active",
    lastUpdated: "2 days ago",
    type: "ISO mDL v1.1",
  },
  {
    id: "cred-2",
    title: "Employment Verification",
    issuer: "Acme Labs",
    status: "Expiring",
    lastUpdated: "5 days ago",
    type: "W3C VC JSON-LD",
  },
  {
    id: "cred-3",
    title: "University Diploma",
    issuer: "Open State University",
    status: "Active",
    lastUpdated: "3 months ago",
    type: "AnonCreds 1.0",
  },
];

export const CredentialsScreen = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Credential inventory</CardTitle>
            <CardDescription>
              Review stored verifiable credentials, their issuers, and status.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Filter
            </Button>
            <Button size="sm" className="gap-2">
              Export summary
              <ArrowUpRightSquare className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <ScrollArea className="h-[420px] rounded-lg border bg-card/60">
            <div className="divide-y">
              {credentialSummaries.map((credential) => (
                <div key={credential.id} className="flex flex-col gap-3 p-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        {credential.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {credential.type}
                      </p>
                    </div>
                    <Badge
                      variant={
                        credential.status === "Active" ? "secondary" : "destructive"
                      }
                    >
                      {credential.status}
                    </Badge>
                  </div>
                  <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <div>
                      <span className="font-medium text-foreground">Issuer</span>
                      <p>{credential.issuer}</p>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Updated</span>
                      <p>{credential.lastUpdated}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Integrity verified</Badge>
                    <Badge variant="outline">Revocation clean</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      View details
                    </Button>
                    <Button variant="ghost" size="sm">
                      Share proof
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="space-y-4">
            <Card className="bg-card/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="h-4 w-4 text-primary" />
                  Storage layers
                </CardTitle>
                <CardDescription>
                  Credential materialized views and replication status.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span>Secure enclave</span>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cloud mirror</span>
                  <Badge variant="secondary">Paused</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cold storage</span>
                  <Badge variant="secondary">Scheduled</Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Fingerprint className="h-4 w-4 text-primary" />
                  Verification rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground">
                <p>
                  Define issuer allow lists, credential expiry policies, and
                  automated revalidation cadence.
                </p>
                <Button variant="outline" size="sm">
                  Configure policies
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-card/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Network className="h-4 w-4 text-primary" />
                  Connections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Manage DID connections and trusted relays for live proof
                  sessions.
                </p>
                <Button variant="outline" size="sm">
                  View trusted peers
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CredentialsScreen;

