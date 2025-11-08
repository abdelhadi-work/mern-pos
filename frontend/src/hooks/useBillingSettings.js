import { useCallback, useEffect, useState } from "react";
import { settingsAPI } from "../api";

export const DEFAULT_PLAN = {
  name: "Aurora Professional",
  renewalDate: new Date().toISOString(),
  seatsUsed: 25,
  seatsTotal: 30,
  locations: 5,
  features: ["Advanced analytics", "Audit trail"],
};

export const DEFAULT_PAYMENT_METHODS = [
  {
    id: "card-4432",
    type: "card",
    label: "Visa ending ••4432",
    details: "Expires 03 / 27",
    isPrimary: true,
  },
  {
    id: "bank-transfer",
    type: "bank",
    label: "Bank transfer",
    details: "IBAN QA56 0001 1234 5678",
    isPrimary: false,
  },
];

export const DEFAULT_INVOICES = [
  { invoiceId: "INV-0921", date: new Date("2024-09-21T00:00:00Z").toISOString(), total: 289, status: "Paid" },
  { invoiceId: "INV-0820", date: new Date("2024-08-20T00:00:00Z").toISOString(), total: 289, status: "Paid" },
  { invoiceId: "INV-0722", date: new Date("2024-07-22T00:00:00Z").toISOString(), total: 289, status: "Paid" },
];

export const DEFAULT_BILLING = {
  plan: DEFAULT_PLAN,
  paymentMethods: DEFAULT_PAYMENT_METHODS,
  invoices: DEFAULT_INVOICES,
  lastUpdated: null,
};

const useBillingSettings = () => {
  const [data, setData] = useState(DEFAULT_BILLING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchBilling = useCallback(async () => {
    setLoading(true);
    try {
      const response = await settingsAPI.getBilling();
      setData(response.data);
      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to load billing settings";
      setError({ message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  const updateBilling = useCallback(async (payload) => {
    setSaving(true);
    try {
      const response = await settingsAPI.updateBilling(payload);
      setData(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update billing settings";
      setError({ message });
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    data: data ?? DEFAULT_BILLING,
    loading,
    saving,
    error,
    updateBilling,
    refetch: fetchBilling,
  };
};

export default useBillingSettings;


