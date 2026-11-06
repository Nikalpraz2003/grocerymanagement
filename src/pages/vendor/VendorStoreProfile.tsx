import { useEffect, useState, type FormEvent } from "react";
import { toast } from "react-hot-toast";
import { Store, Save, Image } from "lucide-react";
import {
  vendorStoreApi,
  type VendorStoreProfile as StoreProfileType,
} from "../../services/vendorStoreApi";

const emptyProfile: StoreProfileType = {
  id: 0,
  storeName: "",
  description: "",
  category: "",
  email: "",
  phone: "",
  city: "",
  address: "",
  logoUrl: "",
  bannerUrl: "",
};

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100";

const VendorStoreProfile = () => {
  const [profile, setProfile] =
    useState<StoreProfileType>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const data = await vendorStoreApi.getProfile();
        if (active) setProfile(data);
      } catch {
        if (active) toast.error("Unable to load store profile.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const updateField = (
    field: keyof StoreProfileType,
    value: string
  ) => {
    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!profile.storeName.trim()) {
      toast.error("Please enter your store name.");
      return;
    }

    setSaving(true);

    try {
      const { id, ...data } = profile;
      const updated = await vendorStoreApi.updateProfile(data);

      setProfile(updated);
      toast.success("Store profile saved successfully.");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Could not save store profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading store profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">

        <div>
          <div className="flex items-center gap-3">
            <Store className="text-green-600" size={28} />
            <h1 className="text-2xl font-bold text-gray-900">
              Store Profile
            </h1>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Manage your store information and business details.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Basic Information
            </h2>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Store Name *
              </label>
              <input
                required
                maxLength={150}
                className={inputClass}
                value={profile.storeName}
                onChange={(e) =>
                  updateField("storeName", e.target.value)
                }
                placeholder="Enter your store name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Store Description
              </label>
              <textarea
                maxLength={1000}
                rows={4}
                className={inputClass}
                value={profile.description}
                onChange={(e) =>
                  updateField("description", e.target.value)
                }
                placeholder="Tell customers about your store..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Business Category
              </label>
              <input
                className={inputClass}
                value={profile.category}
                onChange={(e) =>
                  updateField("category", e.target.value)
                }
                placeholder="Example: Grocery, Fruits, Dairy"
              />
            </div>
          </section>

          <hr />

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Contact Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Business Email
                </label>
                <input
                  type="email"
                  className={inputClass}
                  value={profile.email}
                  onChange={(e) =>
                    updateField("email", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Business Phone
                </label>
                <input
                  className={inputClass}
                  value={profile.phone}
                  onChange={(e) =>
                    updateField("phone", e.target.value)
                  }
                />
              </div>
            </div>
          </section>

          <hr />

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Store Address
            </h2>

            <div>
              <label className="mb-2 block text-sm font-medium">
                City
              </label>
              <input
                className={inputClass}
                value={profile.city}
                onChange={(e) =>
                  updateField("city", e.target.value)
                }
                placeholder="Enter your city"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Full Address
              </label>
              <textarea
                rows={3}
                className={inputClass}
                value={profile.address}
                onChange={(e) =>
                  updateField("address", e.target.value)
                }
                placeholder="Enter your store address"
              />
            </div>
          </section>

          <hr />

          <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Image size={19} />
              Store Images
            </h2>

            <p className="text-xs text-gray-500">
              Enter image URLs for now. File upload will need a separate
              endpoint using your existing file-storage service.
            </p>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Store Logo URL
              </label>
              <input
                type="url"
                className={inputClass}
                value={profile.logoUrl}
                onChange={(e) =>
                  updateField("logoUrl", e.target.value)
                }
                placeholder="https://example.com/logo.jpg"
              />
              {profile.logoUrl && (
                <img
                  src={profile.logoUrl}
                  alt="Store logo preview"
                  className="mt-3 size-20 rounded-xl border object-cover"
                />
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Store Banner URL
              </label>
              <input
                type="url"
                className={inputClass}
                value={profile.bannerUrl}
                onChange={(e) =>
                  updateField("bannerUrl", e.target.value)
                }
                placeholder="https://example.com/banner.jpg"
              />
              {profile.bannerUrl && (
                <img
                  src={profile.bannerUrl}
                  alt="Store banner preview"
                  className="mt-3 h-32 w-full rounded-xl border object-cover"
                />
              )}
            </div>
          </section>

          <div className="flex justify-end border-t pt-5">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
            >
              <Save size={17} />
              {saving ? "Saving..." : "Save Store Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorStoreProfile;
