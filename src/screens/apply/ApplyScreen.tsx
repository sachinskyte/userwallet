import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { useWallet, useWalletActions } from "@/modules/wallet/hooks";
import type { WalletApplication } from "@/modules/wallet/store";
import {
  Fingerprint,
  IdCard,
  FileSignature,
  Camera,
  BadgeCheck,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  submitAadhaarApplication,
  getApplicationsForDid,
  getApplicationStatus,
  type BackendApplication,
} from "@/lib/api";

type FieldDefinition =
  | {
      name: string;
      label: string;
      type: "text" | "date" | "tel";
      placeholder?: string;
      helper?: string;
    }
  | {
      name: string;
      label: string;
      type: "select";
      options: Array<{ value: string; label: string }>;
      helper?: string;
    }
  | {
      name: string;
      label: string;
      type: "placeholder";
      description: string;
      helper?: string;
      placeholderValue?: string;
      capture?: boolean;
    };

type ApplicationConfig = {
  key: string;
  title: string;
  description: string;
  badge?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  fields: FieldDefinition[];
};

const applicationConfigs: ApplicationConfig[] = [
  {
    key: "aadhaar",
    title: "Apply for Aadhaar",
    description:
      "Biometric citizen identity seeded against proof-of-address and demographic data.",
    badge: "Biometric ID",
    icon: Fingerprint,
    fields: [
      {
        name: "fullName",
        label: "Full name",
        type: "text",
        placeholder: "Avery Quinn",
      },
      { name: "dateOfBirth", label: "Date of birth", type: "date" },
      {
        name: "address",
        label: "Residential address",
        type: "text",
        placeholder: "Orbital Habitat 3, Sector 12",
      },
      {
        name: "phone",
        label: "Phone number",
        type: "tel",
        placeholder: "+91-00000-00000",
      },
      {
        name: "photoPlaceholder",
        label: "Photo capture",
        type: "placeholder",
        description:
          "Offline biometric capture scheduled · Upload support coming soon.",
        placeholderValue: "Offline capture pending",
        capture: true,
      },
    ],
  },
  {
    key: "pan",
    title: "Apply for PAN",
    description:
      "Permanent Account Number credential used for taxation and financial KYC.",
    badge: "Finance",
    icon: FileSignature,
    fields: [
      {
        name: "fullName",
        label: "Full name",
        type: "text",
        placeholder: "Avery Quinn",
      },
      { name: "dateOfBirth", label: "Date of birth", type: "date" },
      {
        name: "fatherName",
        label: "Father's name",
        type: "text",
        placeholder: "Jericho Quinn",
      },
      {
        name: "proofPlaceholder",
        label: "ID + Address proof",
        type: "placeholder",
        description: "Upload PDF / Scan · Offline KYC coming soon.",
        placeholderValue: "Proof document pending offline submission",
      },
    ],
  },
  {
    key: "driving",
    title: "Apply for Driving License",
    description:
      "State-issued driving permit tied to biometric verification and address validation.",
    badge: "Mobility",
    icon: Camera,
    fields: [
      {
        name: "fullName",
        label: "Full name",
        type: "text",
        placeholder: "Avery Quinn",
      },
      {
        name: "bloodGroup",
        label: "Blood group",
        type: "text",
        placeholder: "O+",
      },
      {
        name: "address",
        label: "Address",
        type: "text",
        placeholder: "Sector 14, Rapid District",
      },
      {
        name: "selfiePlaceholder",
        label: "Selfie verification",
        type: "placeholder",
        description: "Capture selfie using kiosk · Pending offline match.",
        placeholderValue: "Selfie capture pending verification",
        capture: true,
      },
    ],
  },
  {
    key: "residency",
    title: "Apply for Residency Proof",
    description:
      "Establish residency via landlord attestation and utility footprint.",
    badge: "Civic",
    icon: IdCard,
    fields: [
      {
        name: "address",
        label: "Residence address",
        type: "text",
        placeholder: "Hab Complex, Tower B",
      },
      {
        name: "landlordName",
        label: "Landlord / owner",
        type: "text",
        placeholder: "Nova Habitat Coop.",
      },
      {
        name: "utilityPlaceholder",
        label: "Utility bill snapshot",
        type: "placeholder",
        description: "Upload PDF of last bill · Offline scan pending.",
        placeholderValue: "Utility bill pending offline upload",
      },
    ],
  },
  {
    key: "college",
    title: "Apply for College ID",
    description:
      "Academic identity credential linking student roll number, department, and issuer.",
    badge: "Academic",
    icon: IdCard,
    fields: [
      {
        name: "fullName",
        label: "Full name",
        type: "text",
        placeholder: "Avery Quinn",
      },
      {
        name: "rollNumber",
        label: "USN / Roll number",
        type: "text",
        placeholder: "PV-23-IT-041",
      },
      {
        name: "department",
        label: "Department",
        type: "select",
        options: [
          { label: "Computer Science", value: "Computer Science" },
          { label: "Information Technology", value: "Information Technology" },
          { label: "Electronics", value: "Electronics" },
          { label: "Mechanical", value: "Mechanical" },
        ],
      },
      {
        name: "year",
        label: "Year of study",
        type: "select",
        options: [
          { label: "First Year", value: "Year 1" },
          { label: "Second Year", value: "Year 2" },
          { label: "Third Year", value: "Year 3" },
          { label: "Fourth Year", value: "Year 4" },
        ],
      },
      {
        name: "certificatePlaceholder",
        label: "College certificate attachment",
        type: "placeholder",
        description: "Upload attested certificate offline.",
        placeholderValue: "College certificate pending validation",
      },
    ],
  },
];

type FormState = Record<string, string>;

const statusVariant: Record<
  WalletApplication["status"],
  "secondary" | "outline" | "default"
> = {
  Submitted: "outline",
  PendingVerification: "default",
  Approved: "secondary",
};

const statusLabels: Record<WalletApplication["status"], string> = {
  Submitted: "Submitted to issuer",
  PendingVerification: "Offline verification pending…",
  Approved: "VC Issued",
};

const randomHex = (length: number) => {
  const chars = "abcdef0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

const randomString = (length: number) => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const ApplyScreen = () => {
  const { did, applications } = useWallet();
  const { addApplication, updateApplication } = useWalletActions();
  const [activeForm, setActiveForm] = useState<ApplicationConfig | null>(null);
  const [formState, setFormState] = useState<FormState>({});
  const [isVerifyingId, setIsVerifyingId] = useState<string | null>(null);
  const [reviewApplication, setReviewApplication] =
    useState<WalletApplication | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCapturingForField, setIsCapturingForField] = useState<string | null>(
    null
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Backend integration state
  const [isSubmittingToBackend, setIsSubmittingToBackend] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [backendApplications, setBackendApplications] = useState<
    BackendApplication[]
  >([]);
  const [isLoadingBackendApps, setIsLoadingBackendApps] = useState(false);
  const [lastTransactionHash, setLastTransactionHash] = useState<string | null>(
    null
  );

  const sortedApplications = useMemo(() => {
    const apps = Array.isArray(applications) ? applications : [];
    return [...apps].sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }, [applications]);

  // Fetch applications from backend when DID is available
  useEffect(() => {
    const fetchBackendApplications = async () => {
      if (!did) return;

      setIsLoadingBackendApps(true);
      try {
        const apps = await getApplicationsForDid(did);
        setBackendApplications(apps);
      } catch (error) {
        console.warn("Could not fetch applications from backend:", error);
        // Silently fail - backend might not be running
      } finally {
        setIsLoadingBackendApps(false);
      }
    };

    fetchBackendApplications();
  }, [did]);

  const handleOpenForm = (config: ApplicationConfig) => {
    const defaults: FormState = {};
    config.fields.forEach((field) => {
      if (field.type === "select" && field.options.length > 0) {
        defaults[field.name] = field.options[0].value;
      } else if (field.type !== "placeholder") {
        defaults[field.name] = "";
      }
    });
    setFormState(defaults);
    setCapturedPhoto(null);
    setIsCapturingForField(null);
    setActiveForm(config);
  };

  const handleFormChange = (name: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeForm) return;
    if (!did) {
      toast({
        title: "Wallet not connected",
        description: "Please login with MetaMask first to submit applications.",
        variant: "destructive",
      });
      return;
    }

    const fields: Record<string, string> = {};
    activeForm.fields.forEach((field) => {
      if (field.type === "placeholder") {
        fields[field.name] =
          field.placeholderValue ?? "Offline capture scheduled";
      } else {
        const value = formState[field.name]?.trim();
        if (!value) {
          return;
        }
        fields[field.name] = value;
      }
    });

    // Check if this is an Aadhaar application (backend integration)
    const isAadhaarApp = activeForm.key === "aadhaar";

    if (isAadhaarApp) {
      // Generate keys for blockchain access (for govweb)
      const privateKey = randomHex(64);
      const publicKey = randomHex(64);
      const generatedDid = `did:vault:0x${publicKey.slice(0, 16)}`;

      // Submit to backend
      setIsSubmittingToBackend(true);
      setSubmissionStatus("Submitting application to Aadhaar Vault backend...");

      try {
        const payload = {
          did,
          name: fields.fullName || "",
          dob: fields.dateOfBirth || "",
          address: fields.address || "",
          photo: capturedPhoto || null,
          type: "AADHAAR_APPLICATION",
          privateKey: privateKey,
          publicKey: publicKey,
        };

        const response = await submitAadhaarApplication(payload);

        if (response.success && response.txHash) {
          setLastTransactionHash(response.txHash);
          setSubmissionStatus(`Submitted. Transaction: ${response.txHash}`);

          // Poll for transaction confirmation
          let attempts = 0;
          const maxAttempts = 20;
          while (attempts < maxAttempts) {
            attempts++;
            setSubmissionStatus(
              `Waiting for chain confirmation... (attempt ${attempts}/${maxAttempts})`
            );

            try {
              const status = await getApplicationStatus(response.txHash);
              if (status.confirmed) {
                setSubmissionStatus(
                  `Confirmed on chain at block ${
                    status.blockNumber || "N/A"
                  }. Application stored. Transaction: ${response.txHash}`
                );
                break;
              }
            } catch (err) {
              console.warn("Status check failed:", err);
            }

            await new Promise((resolve) => setTimeout(resolve, 3000));
          }

          // Refresh backend applications list
          const apps = await getApplicationsForDid(did);
          setBackendApplications(apps);

          toast({
            title: "Application submitted successfully",
            description: `Transaction: ${response.txHash.slice(0, 10)}…`,
          });
        } else {
          throw new Error(response.error || "Submission failed");
        }
      } catch (error: any) {
        console.error("Backend submission error:", error);
        const errorMessage =
          error.response?.data?.error || error.message || "Unknown error";
        setSubmissionStatus(`Error: ${errorMessage}`);
        toast({
          title: "Submission failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsSubmittingToBackend(false);
        // Keep status message visible for a few seconds
        setTimeout(() => setSubmissionStatus(null), 5000);
      }
    } else {
      // For non-Aadhaar applications, use local/fake chain
      const privateKey = randomHex(64);
      const publicKey = randomHex(64);
      const generatedDid = `did:vault:0x${publicKey.slice(0, 16)}`;
      const cid = `cid-${randomString(32)}`;
      const tx = `0x${randomHex(64)}`;
      const block = randomInt(1000, 9999);

      const submittedAt = Date.now();
      const record = addApplication({
        type: activeForm.title,
        subjectDid: did ?? null,
        fields,
        photo: capturedPhoto,
        privateKey,
        publicKey,
        did: generatedDid,
        cid,
        tx,
        block,
        submittedAt,
      });

      updateApplication(record.id, { status: "PendingVerification" });

      toast({
        title: "Application submitted to issuer node",
        description: `Tracking hash ${tx.slice(
          0,
          10
        )}… anchored on simulated chain.`,
      });
    }

    setActiveForm(null);
  };

  const handleVerifyOffline = (application: WalletApplication) => {
    setIsVerifyingId(application.id);
    toast({
      title: "Capturing selfie…",
      description: "Launching trusted capture workflow.",
    });

    window.setTimeout(() => {
      toast({
        title: "Matching biometric template…",
        description: "Local match score 92% (simulated).",
      });
    }, 800);

    window.setTimeout(() => {
      toast({
        title: "Generating zero-knowledge proof…",
        description: "Proof ready for issuer validation.",
      });
      updateApplication(application.id, { status: "PendingVerification" });
      setIsVerifyingId(null);
    }, 1600);
  };

  useEffect(() => {
    if (!isCameraOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
      } catch (error) {
        console.error("Camera access denied", error);
        toast({
          title: "Camera permission needed",
          description:
            "Unable to access camera. Please allow camera access and try again.",
          variant: "destructive",
        });
        setIsCameraOpen(false);
      }
    };

    setupCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isCameraOpen, toast]);

  useEffect(() => {
    if (!isCameraOpen) {
      return;
    }

    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [isCameraOpen]);

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    setCapturedPhoto(dataUrl);
    setIsCameraOpen(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  return (
    <div className="space-y-8">
      <Card className="bg-card/80">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">
            Apply for verified identities
          </CardTitle>
          <CardDescription>
            Submit application packets for high-trust credentials. Everything
            runs locally and anchors to the simulated chain for demo purposes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {applicationConfigs.map((config) => {
              const Icon = config.icon;
              return (
                <Card
                  key={config.key}
                  className="bg-background/60 transition hover:border-primary/40 hover:shadow-lg"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-base">
                          {config.title}
                        </CardTitle>
                        <CardDescription>{config.description}</CardDescription>
                      </div>
                    </div>
                    {config.badge && (
                      <Badge variant="outline">{config.badge}</Badge>
                    )}
                  </CardHeader>
                  <CardFooter className="pt-0">
                    <Button
                      className="w-full"
                      onClick={() => handleOpenForm(config)}
                    >
                      Begin application
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Backend submission status with blockchain transaction hash */}
      {submissionStatus && (
        <Card className="bg-card/80 border-primary/20">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              {isSubmittingToBackend && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <p className="text-sm text-muted-foreground">
                {submissionStatus}
              </p>
            </div>
            {/* Display transaction hash if available */}
            {lastTransactionHash && (
              <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Blockchain Transaction Hash
                  </p>
                  <p className="font-mono text-sm break-all text-foreground bg-background/60 p-3 rounded border">
                    {lastTransactionHash}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    <strong>What happened:</strong> Your application data (name,
                    DOB, address, photo) has been hashed using Keccak256 and the
                    hash has been permanently stored on the blockchain.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Privacy:</strong> Only the hash is stored on-chain,
                    not your actual data. This transaction hash is your
                    immutable proof of submission.
                  </p>
                </div>
              </div>
            )}
            {submissionStatus.includes("Confirmed on chain") && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                    Application Stored on Blockchain
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your application hash has been permanently recorded on the
                  blockchain. The transaction is immutable and verifiable.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Backend applications (Aadhaar) */}
      {backendApplications.length > 0 && (
        <Card className="bg-card/80 border-primary/40">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">
                Backend Applications (Aadhaar)
              </CardTitle>
              <CardDescription>
                Applications stored on-chain via Aadhaar Vault backend.
              </CardDescription>
            </div>
            <Badge variant="outline">{backendApplications.length} stored</Badge>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4 pt-4">
            {backendApplications.map((app) => (
              <div
                key={app.id || app.txHash}
                className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{app.type}</p>
                    <Badge variant="outline">{app.status || "Submitted"}</Badge>
                  </div>
                  <p className="text-sm font-medium">{app.name}</p>
                  {app.txHash && (
                    <p className="text-xs font-mono text-muted-foreground">
                      Tx: {app.txHash.slice(0, 16)}…
                    </p>
                  )}
                  {app.cid && (
                    <p className="text-xs font-mono text-muted-foreground">
                      CID: {app.cid.slice(0, 16)}…
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/80">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">Your applications</CardTitle>
            <CardDescription>
              Track the lifecycle of submissions and issuer approvals.
            </CardDescription>
          </div>
          <Badge variant="outline">{sortedApplications.length} active</Badge>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-4">
          {sortedApplications.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              No applications submitted yet. Choose a credential above to get
              started.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">
                        {application.type}
                      </p>
                      <Badge variant={statusVariant[application.status]}>
                        {statusLabels[application.status] ?? application.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Submitted{" "}
                      {new Date(application.submittedAt).toLocaleString()}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground/80">
                      {application.cid && (
                        <span className="font-mono">
                          CID {application.cid.slice(0, 8)}…
                        </span>
                      )}
                      {application.tx && (
                        <span className="font-mono">
                          Tx {application.tx.slice(0, 10)}…
                        </span>
                      )}
                      {typeof application.block === "number" && (
                        <span className="font-mono">
                          Block #{application.block}
                        </span>
                      )}
                    </div>
                    {application.photo && (
                      <div className="mt-2 flex items-center gap-3">
                        <img
                          src={application.photo}
                          alt={`${application.type} capture`}
                          className="h-12 w-12 rounded-md border object-cover"
                        />
                        <span className="text-xs text-muted-foreground">
                          Capture stored locally
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerifyOffline(application)}
                      disabled={isVerifyingId !== null}
                    >
                      {isVerifyingId === application.id ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Verifying…
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <BadgeCheck className="h-4 w-4" />
                          Verify offline
                        </span>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReviewApplication(application)}
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Review application
                      </span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(activeForm)}
        onOpenChange={(open) => !open && setActiveForm(null)}
      >
        <DialogContent className="max-h-[90vh] w-full max-w-xl overflow-hidden flex flex-col touch-pan-y">
          {activeForm && (
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
              <div className="max-h-[80vh] overflow-y-auto p-4 space-y-4 touch-pan-y">
                <DialogHeader className="space-y-2">
                  <DialogTitle>{activeForm.title}</DialogTitle>
                  <DialogDescription>
                    Fill in the required demographic fields. Supporting evidence
                    uploads are represented as offline placeholders in this
                    demo.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {activeForm.fields.map((field) => {
                    if (field.type === "placeholder") {
                      const showCapturePreview =
                        field.capture &&
                        capturedPhoto &&
                        isCapturingForField === field.name;
                      return (
                        <div
                          key={field.name}
                          className="rounded-lg border border-dashed border-muted bg-muted/20 p-4 text-sm text-muted-foreground"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-medium text-foreground">
                                {field.label}
                              </p>
                              <p className="text-xs text-muted-foreground/80">
                                {field.description}
                              </p>
                            </div>
                            {field.capture && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setIsCapturingForField(field.name);
                                  setIsCameraOpen(true);
                                }}
                              >
                                {capturedPhoto &&
                                isCapturingForField === field.name
                                  ? "Retake"
                                  : "Open camera"}
                              </Button>
                            )}
                          </div>
                          {showCapturePreview && (
                            <div className="mt-3 overflow-hidden rounded-md border bg-background/80">
                              <img
                                src={capturedPhoto}
                                alt="Captured preview"
                                className="w-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (field.type === "select") {
                      return (
                        <div key={field.name} className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            {field.label}
                          </label>
                          <Select
                            value={formState[field.name]}
                            onValueChange={(value) =>
                              handleFormChange(field.name, value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {field.helper && (
                            <p className="text-xs text-muted-foreground">
                              {field.helper}
                            </p>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={field.name} className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          {field.label}
                        </label>
                        <Input
                          type={
                            field.type === "date"
                              ? "date"
                              : field.type === "tel"
                              ? "tel"
                              : "text"
                          }
                          placeholder={field.placeholder}
                          value={formState[field.name] ?? ""}
                          onChange={(event) =>
                            handleFormChange(field.name, event.target.value)
                          }
                          required
                        />
                        {field.helper && (
                          <p className="text-xs text-muted-foreground">
                            {field.helper}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="sticky bottom-0 bg-background p-3 border-t flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setActiveForm(null);
                      setCapturedPhoto(null);
                      setIsCapturingForField(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmittingToBackend}
                  >
                    {isSubmittingToBackend ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      "Submit application"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(reviewApplication)}
        onOpenChange={(open) => !open && setReviewApplication(null)}
      >
        <DialogContent className="max-h-[90vh] w-full max-w-xl overflow-hidden flex flex-col touch-pan-y">
          {reviewApplication && (
            <div className="flex flex-1 flex-col">
              <div className="max-h-[80vh] overflow-y-auto p-4 space-y-4 touch-pan-y">
                <DialogHeader>
                  <DialogTitle>{reviewApplication.type}</DialogTitle>
                  <DialogDescription>
                    Application metadata anchored to the simulated chain.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 rounded-lg border bg-muted/20 p-4 text-xs text-muted-foreground">
                  <p>
                    <span className="font-semibold text-foreground">
                      Status:
                    </span>{" "}
                    {statusLabels[reviewApplication.status] ??
                      reviewApplication.status}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">
                      Submitted:
                    </span>{" "}
                    {new Date(reviewApplication.submittedAt).toLocaleString()}
                  </p>
                  {reviewApplication.cid && (
                    <p className="font-mono">CID {reviewApplication.cid}</p>
                  )}
                  {reviewApplication.tx && (
                    <p className="font-mono">Tx {reviewApplication.tx}</p>
                  )}
                  {typeof reviewApplication.block === "number" && (
                    <p className="font-mono">
                      Block #{reviewApplication.block}
                    </p>
                  )}
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">
                    Submitted fields
                  </p>
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    {Object.entries(reviewApplication.fields).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="rounded-md border bg-background/80 px-3 py-2"
                        >
                          <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                            {key}
                          </p>
                          <p
                            className={cn(
                              "font-mono text-sm text-foreground",
                              value.length > 48 && "break-all"
                            )}
                          >
                            {value}
                          </p>
                        </div>
                      )
                    )}
                    {reviewApplication.photo && (
                      <div className="rounded-md border bg-background/80 px-3 py-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                          photo
                        </p>
                        <img
                          src={reviewApplication.photo}
                          alt="Captured preview"
                          className="mt-2 h-32 w-full rounded-md object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="grid gap-2 text-xs text-muted-foreground">
                  {reviewApplication.did && (
                    <p>
                      <span className="font-semibold text-foreground">
                        DID:
                      </span>{" "}
                      <span className="font-mono">{reviewApplication.did}</span>
                    </p>
                  )}
                  {reviewApplication.publicKey && (
                    <p>
                      <span className="font-semibold text-foreground">
                        Public key:
                      </span>{" "}
                      <span className="font-mono break-all">
                        {reviewApplication.publicKey}
                      </span>
                    </p>
                  )}
                  {reviewApplication.privateKey && (
                    <p>
                      <span className="font-semibold text-foreground">
                        Private key:
                      </span>{" "}
                      <span className="font-mono break-all text-muted-foreground/80">
                        {reviewApplication.privateKey}
                      </span>
                    </p>
                  )}
                  {reviewApplication.vc && (
                    <>
                      <p>
                        <span className="font-semibold text-foreground">
                          VC Issued At:
                        </span>{" "}
                        <span className="font-mono">
                          {reviewApplication.vc.issuedAt}
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">
                          VC ID:
                        </span>{" "}
                        <span className="font-mono break-all">
                          {reviewApplication.vc.vcId}
                        </span>
                      </p>
                    </>
                  )}
                </div>
                <div className="sticky bottom-0 bg-background p-3 border-t flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setReviewApplication(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCameraOpen}
        onOpenChange={(open) => setIsCameraOpen(open)}
      >
        <DialogContent className="max-h-[90vh] w-full max-w-lg overflow-hidden flex flex-col touch-pan-y">
          <div className="flex flex-1 flex-col">
            <div className="max-h-[80vh] overflow-y-auto p-4 space-y-4 touch-pan-y">
              <DialogHeader>
                <DialogTitle>Capture photo</DialogTitle>
                <DialogDescription>
                  Use your device camera to capture an image for offline
                  verification.
                </DialogDescription>
              </DialogHeader>
              <div className="w-full rounded-lg overflow-hidden bg-black">
                <video
                  id="camera-preview"
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-auto"
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-background p-3 border-t flex gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsCameraOpen(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleCapturePhoto}
              >
                Capture
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplyScreen;
