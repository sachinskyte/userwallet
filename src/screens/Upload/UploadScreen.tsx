import { useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { UploadArea } from "@/modules/wallet/components/UploadArea";
import { useWallet, useWalletActions } from "@/modules/wallet/hooks";
import { formatBytes, delay, fileToBase64 } from "@/lib/utils";
import {
  BadgeCheck,
  CheckCircle,
  CircleDot,
  CloudUpload,
  Copy,
  Loader,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

type UploadStage = "idle" | "encrypting" | "uploading" | "finalizing" | "complete";

type UploadJob = {
  id: string;
  fileName: string;
  size: number;
  stage: UploadStage;
  progress: number;
  cid?: string;
};

const stageMessages: Record<UploadStage, string> = {
  idle: "Queued locally. Preparing encryption context.",
  encrypting: "Encrypting payload with vault key material…",
  uploading: "Uploading sealed artifact to mock IPFS relay…",
  finalizing: "Finalizing manifest and verifying checksum…",
  complete: "Document staged successfully. Review below.",
};

export const UploadScreen = () => {
  const { documents } = useWallet();
  const { addDocument, updateDocumentStatus } = useWalletActions();
  const [currentJob, setCurrentJob] = useState<UploadJob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const runPipeline = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      const jobId = uuidv4();
      setCurrentJob({
        id: jobId,
        fileName: file.name,
        size: file.size,
        stage: "encrypting",
        progress: 15,
      });

      const stored = addDocument({
        id: jobId,
        name: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        status: "pending",
      });

      try {
        await delay(600);
        const encryptedPayload = await fileToBase64(file);
        updateDocumentStatus(stored.id, "encrypted", { encryptedPayload });
        setCurrentJob((job) =>
          job
            ? {
                ...job,
                stage: "encrypting",
                progress: 55,
              }
            : job
        );

        await delay(700);
        setCurrentJob((job) =>
          job
            ? {
                ...job,
                stage: "uploading",
                progress: 76,
              }
            : job
        );

        await delay(800);
        const cid = `bafy${uuidv4().replace(/-/g, "").slice(0, 40)}`;
        updateDocumentStatus(stored.id, "uploaded", {
          cid,
          encryptedPayload,
        });
        setCurrentJob((job) =>
          job
            ? {
                ...job,
                stage: "finalizing",
                progress: 90,
                cid,
              }
            : job
        );

        await delay(400);
        setCurrentJob((job) =>
          job
            ? {
                ...job,
                stage: "complete",
                progress: 100,
              }
            : job
        );

        toast({
          title: "Upload staged",
          description: `${file.name} encrypted and assigned CID ${cid.slice(0, 8)}…`,
          variant: "success",
        });
      } catch (error) {
        console.error(error);
        updateDocumentStatus(stored.id, "failed");
        toast({
          title: "Upload failed",
          description: "Something interrupted the mock encryption flow. Try again.",
          variant: "destructive",
        });
      } finally {
        await delay(600);
        setCurrentJob(null);
        setIsProcessing(false);
      }
    },
    [addDocument, updateDocumentStatus]
  );

  const handleFilesSelected = useCallback(
    async (files: FileList | File[]) => {
      const filesArray = Array.from(files).slice(0, 5);
      for (const file of filesArray) {
        await runPipeline(file);
      }
    },
    [runPipeline]
  );

  const handleCopyCid = useCallback(async (cid: string) => {
    await navigator.clipboard.writeText(cid);
    toast({
      title: "CID copied",
      description: "Ready to publish to your decentralized storage orchestration.",
      variant: "info",
    });
  }, []);

  return (
    <div className="space-y-8">
      <Card className="border-primary/20 bg-card/70">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-xl">Encrypt &amp; stage documents</CardTitle>
            <CardDescription>
              Everything happens locally: encryption, CID derivation, and manifest generation. No
              external relays are contacted yet.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="w-fit gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Vault sealed
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <UploadArea onFilesSelected={handleFilesSelected} disabled={isProcessing} />
          {currentJob && (
            <Card className="border-dashed bg-muted/30">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base font-medium">
                  Processing {currentJob.fileName}
                </CardTitle>
                <CardDescription>{stageMessages[currentJob.stage]}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatBytes(currentJob.size)}</span>
                  <span>{currentJob.progress}%</span>
                </div>
                <Progress value={currentJob.progress} />
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 rounded-full border bg-background px-2 py-1">
                    <CircleDot className="h-3 w-3 text-primary" />
                    Encrypting
                  </span>
                  <span className="flex items-center gap-1 rounded-full border bg-background px-2 py-1">
                    <Loader className="h-3 w-3 animate-spin text-primary" />
                    Uploading
                  </span>
                  <span className="flex items-center gap-1 rounded-full border bg-background px-2 py-1">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    Manifest
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Pandora&apos;s Vault uses deterministic salts to simulate encryption fingerprints and CID
            derivation for demonstration.
          </p>
          <div className="flex items-center gap-2 text-[11px]">
            <RefreshCcw className="h-3 w-3" /> Upload jobs process sequentially to guarantee local
            sealing.
          </div>
        </CardFooter>
      </Card>

      <Card className="bg-card/60">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Staged artifacts</CardTitle>
            <CardDescription>
              Review the mock IPFS payloads stored in Pandora&apos;s Vault. This list is persisted in
              your local storage.
            </CardDescription>
          </div>
          <Badge variant="outline">
            {documents.length} document{documents.length === 1 ? "" : "s"}
          </Badge>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ScrollArea className="h-[420px]">
            <div className="divide-y">
              {isProcessing && documents.length === 0 ? (
                <div className="grid gap-4 p-6">
                  <Skeleton className="h-24 rounded-xl bg-muted/40" />
                  <Skeleton className="h-24 rounded-xl bg-muted/40" />
                  <Skeleton className="h-24 rounded-xl bg-muted/40" />
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                  <CloudUpload className="h-8 w-8 text-muted-foreground/70" />
                  <p>No encrypted documents staged yet.</p>
                </div>
              ) : (
                documents.map((document) => (
                  <div key={document.id} className="grid gap-3 px-6 py-5 sm:grid-cols-[2fr,1fr]">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold leading-none text-foreground">
                        {document.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {document.mimeType} · {formatBytes(document.size)} ·{" "}
                        {new Date(document.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Badge variant={document.status === "uploaded" ? "secondary" : "outline"}>
                        {document.status}
                      </Badge>
                      {document.cid && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 font-mono text-[11px]"
                          onClick={() => handleCopyCid(document.cid!)}
                        >
                          <Copy className="h-3 w-3" />
                          {document.cid.slice(0, 6)}…{document.cid.slice(-4)}
                        </Button>
                      )}
                      {document.status === "uploaded" && (
                        <Badge variant="outline" className="gap-1">
                          <BadgeCheck className="h-3 w-3 text-emerald-500" />
                          Sealed
                        </Badge>
                      )}
                    </div>
                    {document.encryptedPayload && (
                      <div className="sm:col-span-2">
                        <div className="rounded-md border bg-muted/40 p-3">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            Encryption fingerprint
                          </p>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            {document.encryptedPayload.slice(0, 96)}…
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadScreen;

