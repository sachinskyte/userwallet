import axios from "axios";

// Backend base URL (use VITE_BACKEND_URL in .env)
const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export interface AadhaarApplicationPayload {
  did: string;
  name: string;
  dob: string;
  address: string;
  photo?: string | null;
  type: string;
}

export interface ApplicationResponse {
  success: boolean;
  txHash?: string;
  message?: string;
  error?: string;
}

export interface ApplicationStatus {
  confirmed: boolean;
  blockNumber?: number;
  receipts?: unknown;
}

export interface BackendApplication {
  id?: string;
  type: string;
  name: string;
  status?: string;
  txHash?: string;
  cid?: string;
  did?: string;
  submittedAt?: number;
}

/**
 * Submit an Aadhaar application to the backend
 */
export async function submitAadhaarApplication(
  payload: AadhaarApplicationPayload
): Promise<ApplicationResponse> {
  const res = await axios.post(`${BASE}/api/apply`, payload, { timeout: 30000 });
  return res.data;
}

/**
 * Get all applications for a given DID
 */
export async function getApplicationsForDid(did: string): Promise<BackendApplication[]> {
  const res = await axios.get(`${BASE}/api/applications?did=${encodeURIComponent(did)}`, {
    timeout: 15000,
  });
  return res.data || [];
}

/**
 * Get the status of an application by transaction hash
 */
export async function getApplicationStatus(txHash: string): Promise<ApplicationStatus> {
  const res = await axios.get(`${BASE}/api/status?tx=${encodeURIComponent(txHash)}`, {
    timeout: 15000,
  });
  return res.data;
}

