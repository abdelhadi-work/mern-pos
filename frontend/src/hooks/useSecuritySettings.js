import { useCallback, useEffect, useState } from "react";
import { settingsAPI } from "../api";

export const DEFAULT_SECURITY = {
  mfa: {
    enabled: false,
    method: "totp",
    primaryDevice: "",
    addedAt: null,
    backupCodesRemaining: 10,
  },
  sessions: [],
  trustedDevices: [],
  policies: {
    idleLockDays: 30,
    geoFenceRegion: "Qatar",
    requireApprovalOutsideRegion: true,
    notifyOnNewDevice: true,
  },
  lastUpdated: null,
};

const useSecuritySettings = () => {
  const [data, setData] = useState(DEFAULT_SECURITY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchSecurity = useCallback(async () => {
    setLoading(true);
    try {
      const response = await settingsAPI.getSecurity();
      setData(response.data);
      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to load security settings";
      setError({ message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurity();
  }, [fetchSecurity]);

  const updateSecurity = useCallback(async (payload) => {
    setSaving(true);
    try {
      const response = await settingsAPI.updateSecurity(payload);
      setData(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update security settings";
      setError({ message });
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const revokeSession = useCallback(async (sessionId) => {
    try {
      const response = await settingsAPI.revokeSecuritySession(sessionId);
      setData(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to revoke session";
      setError({ message });
      throw err;
    }
  }, []);

  const signOutAllSessions = useCallback(async () => {
    try {
      const response = await settingsAPI.signOutAllSessions();
      setData(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to sign out sessions";
      setError({ message });
      throw err;
    }
  }, []);

  return {
    data: data ?? DEFAULT_SECURITY,
    loading,
    saving,
    error,
    updateSecurity,
    revokeSession,
    signOutAllSessions,
    refetch: fetchSecurity,
  };
};

export default useSecuritySettings;


