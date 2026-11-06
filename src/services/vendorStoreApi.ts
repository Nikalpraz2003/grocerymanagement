
import { api } from "./authServices";

export interface VendorStoreProfile {
  id: number;
  storeName: string;
  description: string;
  category: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  logoUrl: string;
  bannerUrl: string;
}

export interface VendorStorePreferences {
  isStoreOpen: boolean;
  acceptingOrders: boolean;
  openingTime: string;
  closingTime: string;

  sundayOpen: boolean;
  mondayOpen: boolean;
  tuesdayOpen: boolean;
  wednesdayOpen: boolean;
  thursdayOpen: boolean;
  fridayOpen: boolean;
  saturdayOpen: boolean;

  deliveryEnabled: boolean;
  pickupEnabled: boolean;

  orderNotifications: boolean;
  lowStockNotifications: boolean;
}

const ROOT = "/api/vendor/store";

export const vendorStoreApi = {
  getProfile: async (): Promise<VendorStoreProfile> => {
    return (await api.get(`${ROOT}/profile`)) as unknown as VendorStoreProfile;
  },

  updateProfile: async (
    data: Omit<VendorStoreProfile, "id">
  ): Promise<VendorStoreProfile> => {
    return (await api.put(
      `${ROOT}/profile`,
      data
    )) as unknown as VendorStoreProfile;
  },

  getPreferences: async (): Promise<VendorStorePreferences> => {
    return (await api.get(
      `${ROOT}/preferences`
    )) as unknown as VendorStorePreferences;
  },

  updatePreferences: async (
    data: VendorStorePreferences
  ): Promise<VendorStorePreferences> => {
    return (await api.put(
      `${ROOT}/preferences`,
      data
    )) as unknown as VendorStorePreferences;
  },
};
