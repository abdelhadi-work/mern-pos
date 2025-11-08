import { useCallback, useEffect, useState } from "react";
import { settingsAPI } from "../api";

export const DEFAULT_CONNECTORS = [
  {
    id: "quickbooks",
    name: "QuickBooks Online",
    description: "Sync invoices, products, and payouts",
    status: "Connected",
    actionLabel: "Manage",
    connectedAt: new Date("2024-08-10T10:00:00Z").toISOString(),
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send real-time alerts to finance channels",
    status: "Connected",
    actionLabel: "Configure",
    connectedAt: new Date("2024-09-02T11:15:00Z").toISOString(),
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Automate custom workflows and handoffs",
    status: "Available",
    actionLabel: "Connect",
    connectedAt: null,
  },
  {
    id: "webhooks",
    name: "Webhooks",
    description: "Receive outbound events in external systems",
    status: "Active",
    actionLabel: "View",
    connectedAt: new Date("2024-07-18T08:45:00Z").toISOString(),
  },
];

export const DEFAULT_INTEGRATIONS = {
  connectors: DEFAULT_CONNECTORS,
  lastUpdated: null,
};

const useIntegrationSettings = () => {
  const [data, setData] = useState(DEFAULT_INTEGRATIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchIntegrations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await settingsAPI.getIntegrations();
      setData(response.data);
      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to load integrations";
      setError({ message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const updateIntegrations = useCallback(async (payload) => {
    setSaving(true);
    try {
      const response = await settingsAPI.updateIntegrations(payload);
      setData(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update integrations";
      setError({ message });
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    data: data ?? DEFAULT_INTEGRATIONS,
    loading,
    saving,
    error,
    updateIntegrations,
    refetch: fetchIntegrations,
  };
};

export default useIntegrationSettings;


