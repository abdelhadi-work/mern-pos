import { useCallback, useEffect, useState } from "react";
import { settingsAPI } from "../api";

export const DEFAULT_CHANNELS = [
  { label: "Sales", key: "sales", email: true, sms: true, push: true },
  { label: "Inventory", key: "inventory", email: true, sms: false, push: true },
  { label: "Finance", key: "finance", email: true, sms: false, push: false },
  { label: "Refunds", key: "refunds", email: true, sms: true, push: true },
  { label: "System Health", key: "systemHealth", email: true, sms: true, push: true },
];

export const DEFAULT_ALERT = {
  trigger: "low-stock",
  cadence: "hourly",
  preview: "Heads up — stock has dropped below threshold. Scheduled replenishment not yet shipped.",
  recipients: [],
};

export const DEFAULT_NOTIFICATIONS = {
  channels: DEFAULT_CHANNELS,
  customAlert: DEFAULT_ALERT,
  lastUpdated: null,
};

const useNotificationSettings = () => {
  const [data, setData] = useState(DEFAULT_NOTIFICATIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await settingsAPI.getNotifications();
      setData(response.data);
      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to load notification settings";
      setError({ message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const updateNotifications = useCallback(async (payload) => {
    setSaving(true);
    try {
      const response = await settingsAPI.updateNotifications(payload);
      setData(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update notification settings";
      setError({ message });
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    data: data ?? DEFAULT_NOTIFICATIONS,
    loading,
    saving,
    error,
    updateNotifications,
    refetch: fetchNotifications,
  };
};

export default useNotificationSettings;


