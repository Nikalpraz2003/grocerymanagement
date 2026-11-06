
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "react-hot-toast";
import { Clock, Settings, Save } from "lucide-react";
import {
  vendorStoreApi,
  type VendorStorePreferences,
} from "../../services/vendorStoreApi";

const defaultSettings: VendorStorePreferences = {
  isStoreOpen: true,
  acceptingOrders: true,
  openingTime: "09:00",
  closingTime: "21:00",

  sundayOpen: true,
  mondayOpen: true,
  tuesdayOpen: true,
  wednesdayOpen: true,
  thursdayOpen: true,
  fridayOpen: true,
  saturdayOpen: true,

  deliveryEnabled: true,
  pickupEnabled: false,

  orderNotifications: true,
  lowStockNotifications: true,
};

type DayKey =
  | "sundayOpen"
  | "mondayOpen"
  | "tuesdayOpen"
  | "wednesdayOpen"
  | "thursdayOpen"
  | "fridayOpen"
  | "saturdayOpen";

const days: { label: string; key: DayKey }[] = [
  { label: "Sunday", key: "sundayOpen" },
  { label: "Monday", key: "mondayOpen" },
  { label: "Tuesday", key: "tuesdayOpen" },
  { label: "Wednesday", key: "wednesdayOpen" },
  { label: "Thursday", key: "thursdayOpen" },
  { label: "Friday", key: "fridayOpen" },
  { label: "Saturday", key: "saturdayOpen" },
];

const Toggle = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
    <span>
      <span className="block text-sm font-medium text-gray-800">
        {label}
      </span>
      {description && (
        <span className="mt-1 block text-xs text-gray-500">
          {description}
        </span>
      )}
    </span>

    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="size-5 accent-green-600"
    />
  </label>
);

const inputClass =
  "rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100";

const VendorStoreSettings = () => {
  const [settings, setSettings] =
    useState<VendorStorePreferences>(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      try {
        const data = await vendorStoreApi.getPreferences();

        if (active) setSettings(data);
      } catch {
        if (active) toast.error("Unable to load store settings.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const update = (
    field: keyof VendorStorePreferences,
    value: boolean | string
  ) => {
    setSettings((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (
      !settings.openingTime ||
      !settings.closingTime
    ) {
      toast.error("Please set opening and closing times.");
      return;
    }

    setSaving(true);

    try {
      const updated =
        await vendorStoreApi.updatePreferences(settings);

      setSettings(updated);
      toast.success("Store settings saved successfully.");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Could not save store settings."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading store settings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">

        <div>
          <div className="flex items-center gap-3">
            <Settings className="text-green-600" size={28} />
            <h1 className="text-2xl font-bold text-gray-900">
              Store Settings
            </h1>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Manage your business hours, orders and store preferences.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <section>
            <h2 className="mb-2 text-lg font-semibold">
              Store Availability
            </h2>

            <Toggle
              label="Store Open"
              description="Control whether your store is marked as open."
              checked={settings.isStoreOpen}
              onChange={(v) => update("isStoreOpen", v)}
            />

            <hr />

            <Toggle
              label="Accepting Orders"
              description="Control whether customers can place new orders."
              checked={settings.acceptingOrders}
              onChange={(v) => update("acceptingOrders", v)}
            />
          </section>

          <hr />

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Clock size={20} />
              Business Hours
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Opening Time
                </span>
                <input
                  type="time"
                  required
                  className={inputClass}
                  value={settings.openingTime}
                  onChange={(e) =>
                    update("openingTime", e.target.value)
                  }
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Closing Time
                </span>
                <input
                  type="time"
                  required
                  className={inputClass}
                  value={settings.closingTime}
                  onChange={(e) =>
                    update("closingTime", e.target.value)
                  }
                />
              </label>
            </div>

            <h3 className="mb-2 mt-5 text-sm font-semibold">
              Weekly Opening Days
            </h3>

            <div className="divide-y rounded-xl border border-gray-100 px-4">
              {days.map((day) => (
                <Toggle
                  key={day.key}
                  label={day.label}
                  checked={settings[day.key]}
                  onChange={(v) => update(day.key, v)}
                />
              ))}
            </div>
          </section>

          <hr />

          <section>
            <h2 className="mb-2 text-lg font-semibold">
              Delivery & Pickup
            </h2>

            <Toggle
              label="Enable Delivery"
              description="Allow customers to receive orders through delivery."
              checked={settings.deliveryEnabled}
              onChange={(v) => update("deliveryEnabled", v)}
            />

            <hr />

            <Toggle
              label="Enable Store Pickup"
              description="Allow customers to collect orders from the store."
              checked={settings.pickupEnabled}
              onChange={(v) => update("pickupEnabled", v)}
            />
          </section>

          <hr />

          <section>
            <h2 className="mb-2 text-lg font-semibold">
              Notifications
            </h2>

            <Toggle
              label="Order Notifications"
              description="Receive notifications about new orders."
              checked={settings.orderNotifications}
              onChange={(v) => update("orderNotifications", v)}
            />

            <hr />

            <Toggle
              label="Low Stock Notifications"
              description="Receive alerts when products have low stock."
              checked={settings.lowStockNotifications}
              onChange={(v) =>
                update("lowStockNotifications", v)
              }
            />
          </section>

          <div className="flex justify-end border-t pt-5">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
            >
              <Save size={17} />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorStoreSettings;
