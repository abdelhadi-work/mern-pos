import { useCallback, useEffect, useState } from "react";
import { settingsAPI } from "../api";

export const DEFAULT_PROFILE = {
  ownerName: "",
  contactEmail: "",
  contactPhone: "",
  brand: {
    primaryColor: "#0F172A",
    secondaryColor: "#F7EDE2",
    typography: "merriweather-inter",
  },
  business: {
    name: "Aurora Retail Holdings",
    licenseNumber: "",
    category: "electronics",
    signatureBlock: "Aurora Retail Holdings\nPO Box 12245, Doha, Qatar\nCRN 009812",
  },
  workspace: {
    name: "Aurora Retail Holdings",
    region: "Qatar · Doha HQ",
    dataResidency: "eu-central-1",
    compliance: "PCI DSS · ISO 27001",
  },
  receipt: {
    footerMessage: "Thank you for shopping with Aurora. Returns accepted within 14 days.",
    showQr: true,
    showSignature: true,
  },
  pendingApprovals: 0,
  status: "Draft",
  lastUpdated: null,
  role: "",
  updatedBy: "",
};

const useProfileSettings = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await settingsAPI.getProfile();
      setData(response.data);
      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to load profile settings";
      setError({ message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (payload) => {
    setSaving(true);
    try {
      const response = await settingsAPI.updateProfile(payload);
      setData(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update profile settings";
      setError({ message });
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    data: data ?? DEFAULT_PROFILE,
    loading,
    saving,
    error,
    updateProfile,
    refetch: fetchProfile,
  };
};

export default useProfileSettings;


