import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CloudUpload, FileJson, GitCommit } from "lucide-react";

export const UploadScreen = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="sm:flex sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Upload credential bundles</CardTitle>
            <CardDescription>
              Import signed credential payloads, DID documents, or encrypted
              backup archives.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="w-fit">
            Offline verification ready
          </Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-4 rounded-xl border border-dashed bg-muted/40 p-6 text-center">
            <CloudUpload className="mx-auto h-10 w-10 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Drag &amp; drop files here, or browse directories.
              </p>
              <p className="text-xs text-muted-foreground">
                Supports JSON-LD, AnonCreds, DIDComm messages, and encrypted
                ZIP archives up to 50MB.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
              <Button size="sm">Choose files</Button>
              <span className="text-xs text-muted-foreground">
                Decoding happens locally. No data leaves your device.
              </span>
            </div>
          </div>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-card/60 p-4">
              <div className="flex items-center gap-3">
                <FileJson className="h-8 w-8 rounded-md bg-primary/10 p-1 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Schema validation</p>
                  <p className="text-xs text-muted-foreground">
                    Auto-detect credential schemas and VC formats.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card/60 p-4">
              <div className="flex items-center gap-3">
                <GitCommit className="h-8 w-8 rounded-md bg-primary/10 p-1 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Chain anchoring</p>
                  <p className="text-xs text-muted-foreground">
                    Check for revocation registries and ledger anchors.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Pending uploads will appear in the credentials queue.</p>
            <p>Network calls will only execute with explicit approval.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Input placeholder="Optional label (e.g. Onboarding set)" />
            <Button variant="outline">Queue job</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default UploadScreen;

