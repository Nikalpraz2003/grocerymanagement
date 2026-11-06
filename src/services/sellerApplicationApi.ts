
import { api } from "./authServices";

export interface SellerDocument {
  id: number;
  type: string;
  label: string;
  fileName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

export interface MySellerApplication {
  id: number;
  applicationNumber: string;
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  category: string;
  city: string;
  address: string;
  status: "Pending" | "Approved" | "Rejected";
  adminNote: string;
  rejectionReason?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  documents: SellerDocument[];
}

export interface SellerApplicationEditDocument {
  id: number;
  type: string;
  label: string;
  fileName: string;
}

export interface SellerApplicationEdit {
  id: number;
  applicationNumber: string;
  status: string;

  storeName: string;
  description: string;
  ownerName: string;
  email: string;
  phone: string;
  category: string;
  city: string;
  address: string;

  hasPanVat: boolean;
  dailyCapacity: string;

  idType: string;
  idNumber: string;
  panNumber: string;
  businessRegNumber: string;

  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranch: string;

  adminNote: string;
  rejectionReason?: string | null;

  documents: SellerApplicationEditDocument[];
}

export const sellerApplicationApi = {
  getMyApplication: async (): Promise<MySellerApplication> =>
    (await api.get(
      "/api/vendors/my-application"
    )) as unknown as MySellerApplication,

  getMyApplicationForEdit: async (): Promise<SellerApplicationEdit> =>
    (await api.get(
      "/api/vendors/my-application/edit"
    )) as unknown as SellerApplicationEdit,

  resubmitApplication: async (formData: FormData) =>
    await api.put(
      "/api/vendors/my-application/resubmit",
      formData
    ),
};
