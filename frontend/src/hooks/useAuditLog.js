import { useCallback, useEffect, useState } from "react";
import { settingsAPI } from "../api";

export const DEFAULT_AUDIT = {
  entries: [],
  lastUpdated: null,
};

const useAuditLog = () => {
  const [data, setData] = useState(DEFAULT_AUDIT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    try {
      const response = await settingsAPI.getAuditLog();
      setData(response.data);
      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to load audit log";
      setError({ message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  const appendAuditEntry = useCallback(async (payload) => {
    setSaving(true);
    try {
      const response = await settingsAPI.appendAuditEntry(payload);
      setData(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to append audit entry";
      setError({ message });
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    data: data ?? DEFAULT_AUDIT,
    loading,
    saving,
    error,
    appendAuditEntry,
    refetch: fetchAudit,
  };
};

export default useAuditLog;


