declare module "react-qr-scanner" {
  import * as React from "react";

  export interface QrScannerProps {
    delay?: number | false;
    onError?: (error: unknown) => void;
    onScan?: (data: string | null) => void;
    facingMode?: "environment" | "user";
    style?: React.CSSProperties;
    className?: string;
  }

  export default class QrScanner extends React.Component<QrScannerProps> {}
}

