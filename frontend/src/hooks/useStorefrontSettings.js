import { useCallback, useEffect, useState } from "react";
import { settingsAPI } from "../api";

export const DEFAULT_RECEIPT = {
  variant: "classic",
  footerMessage: "Thank you for shopping with Aurora. Returns accepted within 14 days.",
  showQr: true,
  showSignature: true,
};

export const DEFAULT_TAX = {
  defaultTax: "VAT · 7%",
  currencyFormat: "qar",
  roundingRule: "nearest-five",
};

export const DEFAULT_BUSINESS_HOURS = {
  weekdays: "Sat – Thu · 09:00 – 22:00",
  friday: "Fri · 13:00 – 22:00",
  holidays: "Auto import from Ministry Calendar",
};

export const DEFAULT_STOREFRONT = {
  receipt: DEFAULT_RECEIPT,
  tax: DEFAULT_TAX,
  businessHours: DEFAULT_BUSINESS_HOURS,
  lastUpdated: null,
};

const useStorefrontSettings = () => {
  const [data, setData] = useState(DEFAULT_STOREFRONT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchStorefront = useCallback(async () => {
    setLoading(true);
    try {
      const response = await settingsAPI.getStorefront();
      setData(response.data);
      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to load storefront settings";
      setError({ message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStorefront();
  }, [fetchStorefront]);

  const updateStorefront = useCallback(async (payload) => {
    setSaving(true);
    try {
      const response = await settingsAPI.updateStorefront(payload);
      setData(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update storefront settings";
      setError({ message });
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    data: data ?? DEFAULT_STOREFRONT,
    loading,
    saving,
    error,
    updateStorefront,
    refetch: fetchStorefront,
  };
};

export default useStorefrontSettings;


