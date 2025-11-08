import React, { useEffect, useState } from "react";
import {
  UserRound,
  ShieldCheck,
  Bell,
  Store,
  CreditCard,
  PlugZap,
  ClipboardList,
  LifeBuoy,
  Upload,
  Camera,
  Lock,
  Smartphone,
  AlarmClockCheck,
  FileText,
  ExternalLink,
  Download,
  History,
  MessageCircle,
} from "lucide-react";
import "../styles/dashboard.css";
import "../styles/settings.css";
import useProfileSettings, { DEFAULT_PROFILE } from "../hooks/useProfileSettings";
import useSecuritySettings, { DEFAULT_SECURITY } from "../hooks/useSecuritySettings";
import useNotificationSettings, {
  DEFAULT_NOTIFICATIONS,
  DEFAULT_CHANNELS,
  DEFAULT_ALERT,
} from "../hooks/useNotificationSettings";
import useStorefrontSettings, {
  DEFAULT_STOREFRONT,
  DEFAULT_RECEIPT,
  DEFAULT_TAX,
  DEFAULT_BUSINESS_HOURS,
} from "../hooks/useStorefrontSettings";
import useBillingSettings, {
  DEFAULT_BILLING,
  DEFAULT_PLAN,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_INVOICES,
} from "../hooks/useBillingSettings";
import useIntegrationSettings, {
  DEFAULT_INTEGRATIONS,
  DEFAULT_CONNECTORS,
} from "../hooks/useIntegrationSettings";
import useAuditLog, { DEFAULT_AUDIT } from "../hooks/useAuditLog";

const NAV_SECTIONS = [
  { id: "profile", label: "Profile", icon: UserRound, count: 3 },
  { id: "security", label: "Security", icon: ShieldCheck, count: 4 },
  { id: "notifications", label: "Notifications", icon: Bell, count: 8 },
  { id: "storefront", label: "Storefront & POS", icon: Store, count: 5 },
  { id: "billing", label: "Billing", icon: CreditCard, count: 6 },
  { id: "integrations", label: "Integrations", icon: PlugZap, count: 5 },
  { id: "audit", label: "Audit Log", icon: ClipboardList, count: 24 },
  { id: "support", label: "Support", icon: LifeBuoy },
];

const invoices = [
  { id: "INV-0921", date: "Sep 21", total: "$289.00", status: "Paid" },
  { id: "INV-0820", date: "Aug 20", total: "$289.00", status: "Paid" },
  { id: "INV-0722", date: "Jul 22", total: "$289.00", status: "Paid" },
];

const integrations = [
  { name: "QuickBooks Online", description: "Sync invoices, products, and payouts", status: "Connected", action: "Manage" },
  { name: "Slack", description: "Send real-time alerts to finance channels", status: "Connected", action: "Configure" },
  { name: "Zapier", description: "Automate custom workflows and handoffs", status: "Available", action: "Connect" },
  { name: "Webhooks", description: "Receive outbound events in external systems", status: "Active", action: "View" },
];

const auditTimeline = [
  {
    title: "Tax rule updated",
    meta: "Yesterday · Fatima Sayed",
    description: "VAT increased from 5% to 7% for Qatar store",
  },
  {
    title: "Slack integration connected",
    meta: "Oct 20 · Ali Hariri",
    description: "Finance alerts routed to #ops-finance",
  },
  {
    title: "New payment method added",
    meta: "Oct 18 · Jane Doe",
    description: "Visa ending •• 4432",
  },
];

const Settings = () => {
  const [activeSection, setActiveSection] = useState(NAV_SECTIONS[0].id);
  const {
    data: profileData,
    loading: profileLoading,
    saving: profileSaving,
    error: profileError,
    updateProfile,
  } = useProfileSettings();
  const [profileForm, setProfileForm] = useState(DEFAULT_PROFILE);
  const [profileFeedback, setProfileFeedback] = useState(null);
  const {
    data: securityData,
    loading: securityLoading,
    saving: securitySaving,
    error: securityError,
    updateSecurity,
    revokeSession,
    signOutAllSessions,
  } = useSecuritySettings();
  const [securityForm, setSecurityForm] = useState(DEFAULT_SECURITY);
  const [securityFeedback, setSecurityFeedback] = useState(null);
  const {
    data: notificationsData,
    loading: notificationsLoading,
    saving: notificationsSaving,
    error: notificationsError,
    updateNotifications,
  } = useNotificationSettings();
  const [notificationsForm, setNotificationsForm] = useState(DEFAULT_NOTIFICATIONS);
  const [notificationsFeedback, setNotificationsFeedback] = useState(null);
  const {
    data: storefrontData,
    loading: storefrontLoading,
    saving: storefrontSaving,
    error: storefrontError,
    updateStorefront,
  } = useStorefrontSettings();
  const [storefrontForm, setStorefrontForm] = useState(DEFAULT_STOREFRONT);
  const [storefrontFeedback, setStorefrontFeedback] = useState(null);
  const {
    data: billingData,
    loading: billingLoading,
    saving: billingSaving,
    error: billingError,
    updateBilling,
  } = useBillingSettings();
  const [billingForm, setBillingForm] = useState(DEFAULT_BILLING);
  const [billingFeedback, setBillingFeedback] = useState(null);
  const {
    data: integrationsData,
    loading: integrationsLoading,
    saving: integrationsSaving,
    error: integrationsError,
    updateIntegrations,
  } = useIntegrationSettings();
  const [integrationsForm, setIntegrationsForm] = useState(DEFAULT_INTEGRATIONS);
  const [integrationsFeedback, setIntegrationsFeedback] = useState(null);
  const {
    data: auditData,
    loading: auditLoading,
    saving: auditSaving,
    error: auditError,
    appendAuditEntry,
    refetch: refetchAudit,
  } = useAuditLog();
  const [auditForm, setAuditForm] = useState(DEFAULT_AUDIT);
  const [auditFeedback, setAuditFeedback] = useState(null);

  useEffect(() => {
    const nextProfile = JSON.parse(JSON.stringify(profileData || DEFAULT_PROFILE));
    setProfileForm(nextProfile);
  }, [profileData]);

  useEffect(() => {
    const nextSecurity = JSON.parse(JSON.stringify(securityData || DEFAULT_SECURITY));
    setSecurityForm(nextSecurity);
  }, [securityData]);

  useEffect(() => {
    if (!profileFeedback) return undefined;
    const timer = setTimeout(() => setProfileFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [profileFeedback]);

  useEffect(() => {
    if (!securityFeedback) return undefined;
    const timer = setTimeout(() => setSecurityFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [securityFeedback]);

  useEffect(() => {
    const nextNotifications = JSON.parse(JSON.stringify(notificationsData || DEFAULT_NOTIFICATIONS));
    if (!nextNotifications.customAlert?.recipients?.length && profileForm.contactEmail) {
      nextNotifications.customAlert.recipients = [profileForm.contactEmail];
    }
    setNotificationsForm(nextNotifications);
  }, [notificationsData, profileForm.contactEmail]);

  useEffect(() => {
    if (!notificationsFeedback) return undefined;
    const timer = setTimeout(() => setNotificationsFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [notificationsFeedback]);

  useEffect(() => {
    const nextStorefront = JSON.parse(JSON.stringify(storefrontData || DEFAULT_STOREFRONT));
    setStorefrontForm({
      receipt: { ...DEFAULT_RECEIPT, ...(nextStorefront.receipt || {}) },
      tax: { ...DEFAULT_TAX, ...(nextStorefront.tax || {}) },
      businessHours: { ...DEFAULT_BUSINESS_HOURS, ...(nextStorefront.businessHours || {}) },
      lastUpdated: nextStorefront.lastUpdated || null,
    });
  }, [storefrontData]);

  useEffect(() => {
    if (!storefrontFeedback) return undefined;
    const timer = setTimeout(() => setStorefrontFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [storefrontFeedback]);

  const updateProfileSection = (section, updates) => {
    setProfileForm((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        ...updates,
      },
    }));
  };

  const updateProfileField = (field, value) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateSecuritySection = (section, updates) => {
    setSecurityForm((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        ...updates,
      },
    }));
  };

  const buildProfilePayload = (overrides = {}) => ({
    ownerName: overrides.ownerName ?? profileForm.ownerName,
    contactEmail: overrides.contactEmail ?? profileForm.contactEmail,
    contactPhone: overrides.contactPhone ?? profileForm.contactPhone,
    brand: overrides.brand ?? profileForm.brand,
    business: overrides.business ?? profileForm.business,
    workspace: overrides.workspace ?? profileForm.workspace,
    receipt: overrides.receipt ?? profileForm.receipt,
    pendingApprovals: overrides.pendingApprovals ?? profileForm.pendingApprovals,
    status: overrides.status ?? profileForm.status,
  });

  const buildSecurityPayload = (overrides = {}) => ({
    mfa: overrides.mfa ?? securityForm.mfa,
    policies: overrides.policies ?? securityForm.policies,
    trustedDevices: overrides.trustedDevices ?? securityForm.trustedDevices,
  });

  const buildNotificationsPayload = (overrides = {}) => ({
    channels: overrides.channels ?? notificationsForm.channels,
    customAlert: overrides.customAlert ?? notificationsForm.customAlert,
  });

  const buildStorefrontPayload = (overrides = {}) => ({
    receipt: overrides.receipt ?? storefrontForm.receipt,
    tax: overrides.tax ?? storefrontForm.tax,
    businessHours: overrides.businessHours ?? storefrontForm.businessHours,
  });

  const buildBillingPayload = (overrides = {}) => ({
    plan: overrides.plan ?? billingForm.plan,
    paymentMethods: overrides.paymentMethods ?? billingForm.paymentMethods,
    invoices: overrides.invoices ?? billingForm.invoices,
  });

  const handleSaveProfile = async () => {
    try {
      await updateProfile(buildProfilePayload());
      setProfileFeedback({ type: "success", text: "Profile settings saved" });
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update profile settings";
      setProfileFeedback({ type: "error", text: message });
    }
  };

  const handleStatusUpdate = async (nextStatus) => {
    setProfileForm((prev) => ({ ...prev, status: nextStatus }));
    try {
      await updateProfile(buildProfilePayload({ status: nextStatus }));
      setProfileFeedback({ type: "success", text: `Status updated to ${nextStatus}` });
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update status";
      setProfileFeedback({ type: "error", text: message });
    }
  };

  const handleSaveSecurity = async () => {
    try {
      await updateSecurity(buildSecurityPayload());
      setSecurityFeedback({ type: "success", text: "Security preferences saved" });
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update security settings";
      setSecurityFeedback({ type: "error", text: message });
    }
  };

  const handleToggleMfa = async () => {
    const nextEnabled = !securityForm.mfa.enabled;
    const previousMfa = { ...securityForm.mfa };
    const updatedMfa = {
      ...securityForm.mfa,
      enabled: nextEnabled,
      addedAt: nextEnabled ? new Date().toISOString() : null,
    };

    updateSecuritySection("mfa", updatedMfa);
    try {
      await updateSecurity(buildSecurityPayload({ mfa: updatedMfa }));
      setSecurityFeedback({
        type: "success",
        text: nextEnabled ? "Multi-factor authentication enabled" : "Multi-factor authentication disabled",
      });
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update MFA settings";
      updateSecuritySection("mfa", previousMfa);
      setSecurityFeedback({ type: "error", text: message });
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await revokeSession(sessionId);
      setSecurityFeedback({ type: "success", text: "Session revoked" });
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to revoke session";
      setSecurityFeedback({ type: "error", text: message });
    }
  };

  const handleSignOutAllSessions = async () => {
    try {
      await signOutAllSessions();
      setSecurityFeedback({ type: "success", text: "All sessions signed out" });
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to sign out sessions";
      setSecurityFeedback({ type: "error", text: message });
    }
  };

  const handleStorefrontChange = (section, field, value) => {
    setStorefrontForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleStorefrontToggle = (field, nextValue) => {
    setStorefrontForm((prev) => ({
      ...prev,
      receipt: {
        ...prev.receipt,
        [field]: nextValue,
      },
    }));
  };

  const handleSaveStorefront = async () => {
    try {
      await updateStorefront(buildStorefrontPayload());
      setStorefrontFeedback({ type: "success", text: "Storefront preferences saved" });
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update storefront settings";
      setStorefrontFeedback({ type: "error", text: message });
    }
  };

  useEffect(() => {
    const nextBilling = JSON.parse(JSON.stringify(billingData || DEFAULT_BILLING));
    setBillingForm({
      plan: { ...DEFAULT_PLAN, ...(nextBilling.plan || {}) },
      paymentMethods: Array.isArray(nextBilling.paymentMethods) && nextBilling.paymentMethods.length
        ? nextBilling.paymentMethods
        : DEFAULT_PAYMENT_METHODS,
      invoices: Array.isArray(nextBilling.invoices) && nextBilling.invoices.length
        ? nextBilling.invoices
        : DEFAULT_INVOICES,
      lastUpdated: nextBilling.lastUpdated || null,
    });
  }, [billingData]);

  useEffect(() => {
    if (!billingFeedback) return undefined;
    const timer = setTimeout(() => setBillingFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [billingFeedback]);

  const handlePlanChange = (field, value) => {
    setBillingForm((prev) => ({
      ...prev,
      plan: {
        ...prev.plan,
        [field]: value,
      },
    }));
  };

  const handlePaymentPrimary = (id) => {
    setBillingForm((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map((method) => ({
        ...method,
        isPrimary: method.id === id,
      })),
    }));
  };

  const handleSaveBilling = async () => {
    try {
      await updateBilling(buildBillingPayload());
      setBillingFeedback({ type: "success", text: "Billing preferences saved" });
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update billing settings";
      setBillingFeedback({ type: "error", text: message });
    }
  };

  useEffect(() => {
    const nextIntegrations = JSON.parse(JSON.stringify(integrationsData || DEFAULT_INTEGRATIONS));
    setIntegrationsForm({
      connectors: Array.isArray(nextIntegrations.connectors) && nextIntegrations.connectors.length
        ? nextIntegrations.connectors
        : DEFAULT_CONNECTORS,
      lastUpdated: nextIntegrations.lastUpdated || null,
    });
  }, [integrationsData]);

  useEffect(() => {
    if (!integrationsFeedback) return undefined;
    const timer = setTimeout(() => setIntegrationsFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [integrationsFeedback]);

  const handleIntegrationAction = (id, nextStatus, nextAction) => {
    setIntegrationsForm((prev) => ({
      ...prev,
      connectors: prev.connectors.map((connector) =>
        connector.id === id
          ? {
              ...connector,
              status: nextStatus ?? connector.status,
              actionLabel: nextAction ?? connector.actionLabel,
              connectedAt: nextStatus === "Connected" || nextStatus === "Active"
                ? new Date().toISOString()
                : connector.connectedAt,
            }
          : connector
      ),
    }));
  };

  const handleSaveIntegrations = async () => {
    try {
      await updateIntegrations({ connectors: integrationsForm.connectors });
      setIntegrationsFeedback({ type: "success", text: "Integrations updated" });
      await appendAuditEntry({
        title: "Integrations updated",
        description: "Connectors status or configuration changed",
        section: "integrations",
      });
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update integrations";
      setIntegrationsFeedback({ type: "error", text: message });
    }
  };

  useEffect(() => {
    const nextAudit = JSON.parse(JSON.stringify(auditData || DEFAULT_AUDIT));
    setAuditForm(nextAudit);
  }, [auditData]);

  useEffect(() => {
    if (!auditFeedback) return undefined;
    const timer = setTimeout(() => setAuditFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [auditFeedback]);

  const handleRefreshAudit = async () => {
    try {
      await refetchAudit();
      setAuditFeedback({ type: "success", text: "Audit log refreshed" });
    } catch (err) {
      setAuditFeedback({ type: "error", text: err.message });
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return `${d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })} ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
  };

  const formattedUpdatedAt = profileForm.lastUpdated
    ? new Date(profileForm.lastUpdated).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not yet published";

  const ownerInitials =
    profileForm.ownerName
      ?.split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "—";

  const formatRole = (role) =>
    role
      ? role
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
      : "—";

  const renderProfile = () => (
    <div className="settings-section" id="profile">
      <div className="settings-section__header">
        <div>
          <h2 className="settings-section__title">Profile & Identity</h2>
          <p className="settings-section__subtitle">Account fundamentals</p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button type="button" className="btn-secondary">
            <History size={16} />
            View history
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSaveProfile}
            disabled={profileSaving || profileLoading}
          >
            {profileSaving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </div>

      {profileFeedback && (
        <div className={`alert ${profileFeedback.type === "error" ? "alert-error" : "alert-success"}`}>
          {profileFeedback.text}
        </div>
      )}
      {profileError && !profileFeedback && (
        <div className="alert alert-error">{profileError.message}</div>
      )}

      <div className="settings-section__body">
        <div className="settings-card">
          <div className="settings-card__header">
            <span className="settings-card__title">Brand identity</span>
            <button type="button" className="btn-secondary">
              <Upload size={16} />
              Upload logo
            </button>
          </div>
          <p className="settings-card__description">
            Control how your brand appears across POS, receipts, and reporting assets.
          </p>
          <div className="settings-avatar-upload">
            <div className="avatar-preview">{ownerInitials}</div>
            <div className="settings-notes">Logo · 120 × 120 PNG · Transparent background recommended</div>
          </div>
          <div className="settings-form-grid">
            <div className="settings-field">
              <label>Primary color</label>
              <input
                type="text"
                value={profileForm.brand.primaryColor}
                onChange={(e) => updateProfileSection("brand", { primaryColor: e.target.value })}
              />
            </div>
            <div className="settings-field">
              <label>Secondary color</label>
              <input
                type="text"
                value={profileForm.brand.secondaryColor}
                onChange={(e) => updateProfileSection("brand", { secondaryColor: e.target.value })}
              />
            </div>
            <div className="settings-field">
              <label>Typography pairing</label>
              <select
                value={profileForm.brand.typography}
                aria-label="Typography pairing"
                onChange={(e) => updateProfileSection("brand", { typography: e.target.value })}
              >
                <option value="merriweather-inter">Merriweather / Inter</option>
                <option value="lora-work">Lora / Work Sans</option>
                <option value="playfair-source">Playfair / Source Sans</option>
              </select>
            </div>
          </div>
        </div>

        <div className="settings-card-grid">
          <div className="settings-card">
            <div className="settings-card__header">
              <span className="settings-card__title">Contact details</span>
              <button type="button" className="btn-secondary">
                <Camera size={16} />
                Update photo
              </button>
            </div>
            <div className="settings-form-grid">
              <div className="settings-field">
                <label>Full name</label>
                <input
                  type="text"
                  value={profileForm.ownerName}
                  onChange={(e) => updateProfileField("ownerName", e.target.value)}
                />
              </div>
              <div className="settings-field">
                <label>Email</label>
                <input
                  type="email"
                  value={profileForm.contactEmail}
                  onChange={(e) => updateProfileField("contactEmail", e.target.value)}
                />
              </div>
              <div className="settings-field">
                <label>Phone</label>
                <input
                  type="tel"
                  value={profileForm.contactPhone}
                  onChange={(e) => updateProfileField("contactPhone", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-card__header">
              <span className="settings-card__title">Business entity</span>
            </div>
            <div className="settings-form-grid">
              <div className="settings-field">
                <label>Registered name</label>
                <input
                  type="text"
                  value={profileForm.business.name}
                  onChange={(e) => updateProfileSection("business", { name: e.target.value })}
                />
              </div>
              <div className="settings-field">
                <label>License #</label>
                <input
                  type="text"
                  value={profileForm.business.licenseNumber}
                  onChange={(e) => updateProfileSection("business", { licenseNumber: e.target.value })}
                />
              </div>
              <div className="settings-field">
                <label>Category</label>
                <select
                  value={profileForm.business.category}
                  onChange={(e) => updateProfileSection("business", { category: e.target.value })}
                >
                  <option value="electronics">Electronics</option>
                  <option value="fashion">Fashion</option>
                  <option value="grocery">Grocery</option>
                </select>
              </div>
            </div>
            <div className="settings-field">
              <label>Signature block</label>
              <textarea
                rows={3}
                value={profileForm.business.signatureBlock}
                onChange={(e) => updateProfileSection("business", { signatureBlock: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="settings-section" id="security">
      <div className="settings-section__header">
        <div>
          <h2 className="settings-section__title">Security Controls</h2>
          <p className="settings-section__subtitle">Access hygiene</p>
        </div>
        <div className="settings-toolbar">
          <button type="button" className="btn-secondary" disabled={securitySaving}>
            <Lock size={16} />
            Force password reset
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSaveSecurity}
            disabled={securitySaving}
          >
            {securitySaving ? "Saving…" : "Save security"}
          </button>
        </div>
      </div>

      {securityFeedback && (
        <div className={`alert ${securityFeedback.type === "error" ? "alert-error" : "alert-success"}`}>
          {securityFeedback.text}
        </div>
      )}
      {securityError && !securityFeedback && (
        <div className="alert alert-error">{securityError.message}</div>
      )}

      <div className="settings-section__body">
        {securityLoading ? (
          <div className="settings-card">
            <div className="settings-notes">Loading security overview…</div>
          </div>
        ) : null}

        <div className="settings-card-grid">
          <div className="settings-card">
            <div className="settings-card__header">
              <span className="settings-card__title">Multi-factor authentication</span>
              <span className={`settings-pill-toggle${securityForm.mfa.enabled ? " is-active" : ""}`}>
                {securityForm.mfa.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <p className="settings-card__description">
              Scan the QR code with Aurora Authenticator and store recovery codes securely.
            </p>
            <div className="settings-list">
              {securityForm.mfa.primaryDevice ? (
                <div className="settings-list__item">
                  <div className="settings-list__meta">
                    <span className="settings-list__title">{securityForm.mfa.primaryDevice}</span>
                    <span className="settings-list__subtitle">
                      Added {formatDateTime(securityForm.mfa.addedAt)}
                    </span>
                  </div>
                  <div className="settings-list__actions">
                    <span className="settings-notes">
                      Backup codes left: {securityForm.mfa.backupCodesRemaining}
                    </span>
                    <button type="button" className="btn-secondary" onClick={handleToggleMfa} disabled={securitySaving}>
                      {securityForm.mfa.enabled ? "Disable MFA" : "Enable MFA"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="settings-list__item">
                  <div className="settings-list__meta">
                    <span className="settings-list__title">No primary device</span>
                    <span className="settings-list__subtitle">MFA not yet configured</span>
                  </div>
                  <div className="settings-list__actions">
                    <button type="button" className="btn-primary" onClick={handleToggleMfa} disabled={securitySaving}>
                      Enable MFA
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-card__header">
              <span className="settings-card__title">Session management</span>
              <button type="button" className="btn-secondary" onClick={handleSignOutAllSessions} disabled={securitySaving}>
                <Smartphone size={16} />
                Sign out all
              </button>
            </div>
            <div className="settings-list">
              {securityForm.sessions.length ? (
                securityForm.sessions.map((session) => (
                  <div key={session.id} className="settings-list__item">
                    <div className="settings-list__meta">
                      <span className="settings-list__title">{session.device}</span>
                      <span className="settings-list__subtitle">{session.location || "Unknown location"}</span>
                    </div>
                    <div className="settings-list__actions">
                      <span className="settings-notes">
                        Last active {formatDateTime(session.lastActive || session.createdAt)}
                      </span>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={securitySaving}
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="settings-list__item">
                  <div className="settings-list__meta">
                    <span className="settings-list__title">No active sessions</span>
                    <span className="settings-list__subtitle">All devices are signed out</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card__header">
            <span className="settings-card__title">Trusted devices</span>
            <button type="button" className="btn-secondary" disabled={securitySaving}>
              <AlarmClockCheck size={16} />
              Set thresholds
            </button>
          </div>
          <p className="settings-card__description">
            Approvals are required for any device that has been inactive for {securityForm.policies.idleLockDays} days or
            originates outside {securityForm.policies.geoFenceRegion}.
          </p>
          <div className="settings-list">
            {securityForm.trustedDevices.length ? (
              securityForm.trustedDevices.map((device) => (
                <div key={device.id} className="settings-list__item">
                  <div className="settings-list__meta">
                    <span className="settings-list__title">{device.name}</span>
                    <span className="settings-list__subtitle">{device.location || "No location data"}</span>
                  </div>
                  <div className="settings-list__actions">
                    <span className="settings-notes">
                      Last seen {formatDateTime(device.lastSeenAt || device.addedAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="settings-list__item">
                <div className="settings-list__meta">
                  <span className="settings-list__title">No trusted devices</span>
                  <span className="settings-list__subtitle">Devices will require approval on first login</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const handleToggleChannel = (key, field) => {
    setNotificationsForm((prev) => ({
      ...prev,
      channels: prev.channels.map((channel) =>
        channel.key === key ? { ...channel, [field]: !channel[field] } : channel
      ),
    }));
  };

  const handleAlertChange = (field, value) => {
    setNotificationsForm((prev) => ({
      ...prev,
      customAlert: {
        ...prev.customAlert,
        [field]: value,
      },
    }));
  };

  const handleSaveNotifications = async () => {
    try {
      await updateNotifications(buildNotificationsPayload());
      setNotificationsFeedback({ type: "success", text: "Notification preferences saved" });
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update notification settings";
      setNotificationsFeedback({ type: "error", text: message });
    }
  };

  const renderNotifications = () => (
    <div className="settings-section" id="notifications">
      <div className="settings-section__header">
        <div>
          <h2 className="settings-section__title">Notification Rules</h2>
          <p className="settings-section__subtitle">Channels & cadence</p>
        </div>
        <div className="settings-toolbar">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleAlertChange("recipients", profileForm.contactEmail ? [profileForm.contactEmail] : [])}
            disabled={notificationsSaving}
          >
            <ExternalLink size={16} />
            Reset recipients
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSaveNotifications}
            disabled={notificationsSaving}
          >
            {notificationsSaving ? "Saving…" : "Save notifications"}
          </button>
        </div>
      </div>

      {notificationsFeedback && (
        <div className={`alert ${notificationsFeedback.type === "error" ? "alert-error" : "alert-success"}`}>
          {notificationsFeedback.text}
        </div>
      )}
      {notificationsError && !notificationsFeedback && (
        <div className="alert alert-error">{notificationsError.message}</div>
      )}

      <div className="settings-section__body">
        {notificationsLoading ? (
          <div className="settings-card">
            <div className="settings-notes">Loading notification matrix…</div>
          </div>
        ) : null}

        <div className="settings-matrix">
          <table>
            <thead>
              <tr>
                <th>Event type</th>
                <th>Email</th>
                <th>SMS</th>
                <th>Push</th>
              </tr>
            </thead>
            <tbody>
              {(notificationsForm.channels || DEFAULT_CHANNELS).map((row) => (
                <tr key={row.key}>
                  <td>{row.label}</td>
                  <td>
                    <button
                      type="button"
                      className={`settings-toggle${row.email ? " is-on" : ""}`}
                      onClick={() => handleToggleChannel(row.key, "email")}
                      aria-label={`Toggle email for ${row.label}`}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`settings-toggle${row.sms ? " is-on" : ""}`}
                      onClick={() => handleToggleChannel(row.key, "sms")}
                      aria-label={`Toggle SMS for ${row.label}`}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`settings-toggle${row.push ? " is-on" : ""}`}
                      onClick={() => handleToggleChannel(row.key, "push")}
                      aria-label={`Toggle push for ${row.label}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="settings-card-grid">
          <div className="settings-card">
            <div className="settings-card__header">
              <span className="settings-card__title">Custom alert</span>
              <button type="button" className="btn-secondary">
                <Bell size={16} />
                New trigger
              </button>
            </div>
            <div className="settings-form-grid">
              <div className="settings-field">
                <label>Trigger</label>
                <select
                  value={notificationsForm.customAlert.trigger}
                  onChange={(e) => handleAlertChange("trigger", e.target.value)}
                >
                  <option value="low-stock">Inventory below threshold</option>
                  <option value="payment-failure">Payment failure</option>
                  <option value="large-order">Large order placed</option>
                </select>
              </div>
              <div className="settings-field">
                <label>Cadence</label>
                <select
                  value={notificationsForm.customAlert.cadence}
                  onChange={(e) => handleAlertChange("cadence", e.target.value)}
                >
                  <option value="immediate">Send immediately</option>
                  <option value="hourly">Hourly digest</option>
                  <option value="daily">Daily at 09:00</option>
                </select>
              </div>
            </div>
            <div className="settings-field">
              <label>Recipients</label>
              <input
                type="text"
                value={(notificationsForm.customAlert.recipients || []).join(", ")}
                onChange={(e) =>
                  handleAlertChange(
                    "recipients",
                    e.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="name@example.com, team@example.com"
              />
            </div>
            <div className="settings-field">
              <label>Preview</label>
              <textarea
                rows={3}
                value={notificationsForm.customAlert.preview}
                onChange={(e) => handleAlertChange("preview", e.target.value)}
              />
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-card__header">
              <span className="settings-card__title">Escalation workflow</span>
            </div>
            <p className="settings-card__description">
              High-priority incidents notify duty manager, then escalate to operations director after 15 minutes without
              acknowledgement.
            </p>
            <p className="settings-notes">
              Last updated {notificationsForm.lastUpdated ? formatDateTime(notificationsForm.lastUpdated) : "Recently"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStorefront = () => (
    <div className="settings-section" id="storefront">
      <div className="settings-section__header">
        <div>
          <h2 className="settings-section__title">Storefront & POS Preferences</h2>
          <p className="settings-section__subtitle">Receipts, taxes, hours</p>
        </div>
        <div className="settings-toolbar">
          <button type="button" className="btn-secondary" disabled={storefrontSaving}>
            <FileText size={16} />
            View receipt preview
          </button>
          <button type="button" className="btn-primary" onClick={handleSaveStorefront} disabled={storefrontSaving}>
            {storefrontSaving ? "Saving…" : "Save storefront"}
          </button>
        </div>
      </div>

      {storefrontFeedback && (
        <div className={`alert ${storefrontFeedback.type === "error" ? "alert-error" : "alert-success"}`}>
          {storefrontFeedback.text}
        </div>
      )}
      {storefrontError && !storefrontFeedback && <div className="alert alert-error">{storefrontError.message}</div>}

      <div className="settings-section__body">
        {storefrontLoading ? (
          <div className="settings-card">
            <div className="settings-notes">Loading storefront configuration…</div>
          </div>
        ) : null}

        <div className="settings-card-grid">
          <div className="settings-card">
            <div className="settings-card__header">
              <span className="settings-card__title">Receipt template</span>
              <span className={`settings-pill-toggle${storefrontForm.receipt.variant === "classic" ? " is-active" : ""}`}>
                {storefrontForm.receipt.variant === "classic" ? "Classic" : storefrontForm.receipt.variant}
              </span>
            </div>
            <div className="settings-field">
              <label>Footer message</label>
              <textarea
                rows={3}
                value={storefrontForm.receipt.footerMessage}
                onChange={(e) => handleStorefrontChange("receipt", "footerMessage", e.target.value)}
              />
            </div>
            <div className="settings-form-grid">
              <div className="settings-field">
                <label>Show QR feedback</label>
                <select
                  value={storefrontForm.receipt.showQr ? "enabled" : "disabled"}
                  onChange={(e) => handleStorefrontToggle("showQr", e.target.value === "enabled")}
                >
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
              <div className="settings-field">
                <label>Signature block</label>
                <select
                  value={storefrontForm.receipt.showSignature ? "enabled" : "disabled"}
                  onChange={(e) => handleStorefrontToggle("showSignature", e.target.value === "enabled")}
                >
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-card__header">
              <span className="settings-card__title">Tax & currency</span>
            </div>
            <div className="settings-form-grid">
              <div className="settings-field">
                <label>Default tax</label>
                <input
                  type="text"
                  value={storefrontForm.tax.defaultTax}
                  onChange={(e) => handleStorefrontChange("tax", "defaultTax", e.target.value)}
                />
              </div>
              <div className="settings-field">
                <label>Currency format</label>
                <select
                  value={storefrontForm.tax.currencyFormat}
                  onChange={(e) => handleStorefrontChange("tax", "currencyFormat", e.target.value)}
                >
                  <option value="qar">Qatar Riyal (QAR)</option>
                  <option value="aed">UAE Dirham (AED)</option>
                  <option value="usd">US Dollar (USD)</option>
                </select>
              </div>
              <div className="settings-field">
                <label>Rounding rule</label>
                <select
                  value={storefrontForm.tax.roundingRule}
                  onChange={(e) => handleStorefrontChange("tax", "roundingRule", e.target.value)}
                >
                  <option value="nearest-five">Nearest 0.05</option>
                  <option value="nearest-ten">Nearest 0.10</option>
                  <option value="none">No rounding</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card__header">
            <span className="settings-card__title">Business hours</span>
            <button type="button" className="btn-secondary" disabled={storefrontSaving}>
              Copy to all locations
            </button>
          </div>
          <div className="settings-form-grid">
            <div className="settings-field">
              <label>Weekdays</label>
              <input
                type="text"
                value={storefrontForm.businessHours.weekdays}
                onChange={(e) => handleStorefrontChange("businessHours", "weekdays", e.target.value)}
              />
            </div>
            <div className="settings-field">
              <label>Friday</label>
              <input
                type="text"
                value={storefrontForm.businessHours.friday}
                onChange={(e) => handleStorefrontChange("businessHours", "friday", e.target.value)}
              />
            </div>
            <div className="settings-field">
              <label>Holidays</label>
              <input
                type="text"
                value={storefrontForm.businessHours.holidays}
                onChange={(e) => handleStorefrontChange("businessHours", "holidays", e.target.value)}
              />
            </div>
          </div>
          <p className="settings-notes">
            Last updated {storefrontForm.lastUpdated ? formatDateTime(storefrontForm.lastUpdated) : "Recently"}
          </p>
        </div>
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="settings-section" id="billing">
      <div className="settings-section__header">
        <div>
          <h2 className="settings-section__title">Billing & Usage</h2>
          <p className="settings-section__subtitle">Plan and invoices</p>
        </div>
        <div className="settings-toolbar">
          <button type="button" className="btn-secondary" disabled={billingSaving}>
            <Download size={16} />
            Export statements
          </button>
          <button type="button" className="btn-primary" onClick={handleSaveBilling} disabled={billingSaving}>
            {billingSaving ? "Saving…" : "Save billing"}
          </button>
        </div>
      </div>

      {billingFeedback && (
        <div className={`alert ${billingFeedback.type === "error" ? "alert-error" : "alert-success"}`}>
          {billingFeedback.text}
        </div>
      )}
      {billingError && !billingFeedback && <div className="alert alert-error">{billingError.message}</div>}

      <div className="settings-section__body">
        {billingLoading ? (
          <div className="settings-card">
            <div className="settings-notes">Loading billing summary…</div>
          </div>
        ) : null}

        <div className="settings-card-grid">
          <div className="settings-card">
            <div className="settings-card__header">
              <span className="settings-card__title">Current plan</span>
              <button type="button" className="btn-primary" disabled={billingSaving}>Upgrade</button>
            </div>
            <p className="settings-card__description">
              {billingForm.plan.name} · Next renewal{" "}
              {formatDateTime(billingForm.plan.renewalDate).split(" ").slice(0, 3).join(" ")}
            </p>
            <div className="settings-form-grid">
              <div className="settings-field">
                <label>Seats</label>
                <input
                  type="text"
                  value={`${billingForm.plan.seatsUsed} used of ${billingForm.plan.seatsTotal}`}
                  readOnly
                />
              </div>
              <div className="settings-field">
                <label>Locations</label>
                <input type="text" value={`${billingForm.plan.locations} active`} readOnly />
              </div>
              <div className="settings-field">
                <label>Included features</label>
                <input type="text" value={billingForm.plan.features.join(", ")} readOnly />
              </div>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-card__header">
              <span className="settings-card__title">Payment methods</span>
              <button type="button" className="btn-secondary" disabled={billingSaving}>Add method</button>
            </div>
            <div className="settings-list">
              {billingForm.paymentMethods.map((method) => (
                <div key={method.id} className="settings-list__item">
                  <div className="settings-list__meta">
                    <span className="settings-list__title">{method.label}</span>
                    <span className="settings-list__subtitle">
                      {method.details}
                      {method.isPrimary ? " · Primary" : ""}
                    </span>
                  </div>
                  <div className="settings-list__actions">
                    {!method.isPrimary && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handlePaymentPrimary(method.id)}
                        disabled={billingSaving}
                      >
                        Make primary
                      </button>
                    )}
                    <button type="button" className="btn-secondary" disabled={billingSaving}>Edit</button>
                    <button type="button" className="btn-secondary" disabled={billingSaving}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card__header">
            <span className="settings-card__title">Invoice history</span>
          </div>
          <div className="settings-list">
            {(billingForm.invoices || []).map((invoice) => (
              <div key={invoice.invoiceId} className="settings-list__item">
                <div className="settings-list__meta">
                  <span className="settings-list__title">{invoice.invoiceId}</span>
                  <span className="settings-list__subtitle">
                    {formatDateTime(invoice.date).split(" ").slice(0, 3).join(" ")}
                  </span>
                </div>
                <div className="settings-list__actions">
                  <span className="settings-notes">${(invoice.total ?? 0).toFixed(2)}</span>
                  <button type="button" className="btn-secondary" disabled={billingSaving}>Download</button>
                  <span className={`settings-pill-toggle${invoice.status === "Paid" ? " is-active" : ""}`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="settings-notes">
            Last updated {billingForm.lastUpdated ? formatDateTime(billingForm.lastUpdated) : "Recently"}
          </p>
        </div>
      </div>
    </div>
  );

  const renderIntegrations = () => (
    <div className="settings-section" id="integrations">
      <div className="settings-section__header">
        <div>
          <h2 className="settings-section__title">Integrations</h2>
          <p className="settings-section__subtitle">Connect trusted tools</p>
        </div>
        <div className="settings-toolbar">
          <button type="button" className="btn-secondary" disabled={integrationsSaving}>
            <PlugZap size={16} />
            Test webhooks
          </button>
          <button type="button" className="btn-primary" onClick={handleSaveIntegrations} disabled={integrationsSaving}>
            {integrationsSaving ? "Saving…" : "Save integrations"}
          </button>
        </div>
      </div>

      {integrationsFeedback && (
        <div className={`alert ${integrationsFeedback.type === "error" ? "alert-error" : "alert-success"}`}>
          {integrationsFeedback.text}
        </div>
      )}
      {integrationsError && !integrationsFeedback && (
        <div className="alert alert-error">{integrationsError.message}</div>
      )}

      <div className="settings-section__body">
        {integrationsLoading ? (
          <div className="settings-card">
            <div className="settings-notes">Loading integrations…</div>
          </div>
        ) : null}

        <div className="settings-card-grid">
          {(integrationsForm.connectors || DEFAULT_CONNECTORS).map((integration) => (
            <div key={integration.id} className="settings-card">
              <div className="settings-card__header">
                <span className="settings-card__title">{integration.name}</span>
                <span className={`settings-pill-toggle${integration.status === "Connected" || integration.status === "Active" ? " is-active" : ""}`}>
                  {integration.status}
                </span>
              </div>
              <p className="settings-card__description">{integration.description}</p>
              <div className="settings-list__actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    handleIntegrationAction(
                      integration.id,
                      integration.status === "Connected" || integration.status === "Active"
                        ? "Available"
                        : "Connected",
                      integration.status === "Connected" || integration.status === "Active" ? "Connect" : "Manage"
                    )
                  }
                  disabled={integrationsSaving}
                >
                  {integration.actionLabel || integration.action || "Configure"}
                </button>
              </div>
              <p className="settings-notes">
                {integration.connectedAt
                  ? `Connected ${formatDateTime(integration.connectedAt)}`
                  : "Not yet connected"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAudit = () => (
    <div className="settings-section" id="audit">
      <div className="settings-section__header">
        <div>
          <h2 className="settings-section__title">Audit Trail</h2>
          <p className="settings-section__subtitle">Change history</p>
        </div>
        <div className="settings-toolbar">
          <button type="button" className="btn-secondary" onClick={handleRefreshAudit} disabled={auditLoading}>
            <History size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="settings-section__body">
        {auditFeedback && (
          <div className={`alert ${auditFeedback.type === "error" ? "alert-error" : "alert-success"}`}>
            {auditFeedback.text}
          </div>
        )}
        {auditError && !auditFeedback && <div className="alert alert-error">{auditError.message}</div>}

        {auditLoading ? (
          <div className="settings-card">
            <div className="settings-notes">Loading audit entries…</div>
          </div>
        ) : null}

        <div className="settings-audit-timeline">
          {(auditForm.entries || []).map((entry) => (
            <div key={entry.id} className="settings-audit-entry">
              <div className="settings-audit-entry__title">{entry.title}</div>
              <div className="settings-audit-entry__meta">
                {`${entry.performedBy} · ${formatDateTime(entry.createdAt)}`}
              </div>
              <p className="settings-card__description">{entry.description}</p>
            </div>
          ))}
        </div>
        <p className="settings-notes">
          Last updated {auditForm.lastUpdated ? formatDateTime(auditForm.lastUpdated) : "Recently"}
        </p>
      </div>
    </div>
  );

  const renderSupport = () => (
    <div className="settings-section" id="support" style={{ background: "transparent", boxShadow: "none", padding: 0, border: "none" }}>
      <div className="settings-support-card">
        <h3>Need a hand?</h3>
        <div className="settings-support-card__meta">
          <span>Finance SLA · 2h response time</span>
          <span>Escalation path: Duty manager → Finance director</span>
          <span>Support window: Sun – Thu · 08:00 – 22:00 GMT+3</span>
        </div>
        <div className="settings-support-actions">
          <button type="button" className="btn-primary">
            <MessageCircle size={16} />
            Start live chat
          </button>
          <button type="button" className="btn-secondary">
            <FileText size={16} />
            Open a ticket
          </button>
          <button type="button" className="btn-secondary">
            <ExternalLink size={16} />
            View knowledge base
          </button>
        </div>
      </div>
    </div>
  );

  const sectionRenderers = {
    profile: renderProfile,
    security: renderSecurity,
    notifications: renderNotifications,
    storefront: renderStorefront,
    billing: renderBilling,
    integrations: renderIntegrations,
    audit: renderAudit,
    support: renderSupport,
  };

  return (
    <div className="settings-page">
      <section className="settings-hero">
        <div className="settings-hero__content">
          <div>
            <h1 className="settings-hero__title">Settings Console</h1>
            <p className="settings-hero__subtitle">
              Orchestrate your account identity, policies, and integrations with a ledger-inspired surface designed for dependable operations.
            </p>
            {profileLoading && (
              <div className="settings-notes" aria-live="polite">
                Syncing latest settings…
              </div>
            )}
            <div className="settings-summary">
              <span className="settings-summary__pill">Owner · {profileForm.ownerName || "—"}</span>
              <span className="settings-summary__pill">Role · {formatRole(profileForm.role)}</span>
              <span className="settings-summary__pill">
                Pending approvals · {profileForm.pendingApprovals ?? 0}
              </span>
            </div>
            <div className="settings-hero__actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleStatusUpdate("Published")}
                disabled={profileSaving || profileLoading}
              >
                Publish changes
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleStatusUpdate("In Review")}
                disabled={profileSaving || profileLoading}
              >
                Request review
              </button>
              <span className="settings-status">
                {formatRole(profileForm.status || "Draft")} · {formattedUpdatedAt}
              </span>
            </div>
          </div>
          <aside className="settings-owner-card" aria-label="Account details">
            <dl>
              <dt>Workspace</dt>
              <dd>{profileForm.workspace.name || "—"}</dd>
              <dt>Region</dt>
              <dd>{profileForm.workspace.region || "—"}</dd>
              <dt>Data residency</dt>
              <dd>{profileForm.workspace.dataResidency || "—"}</dd>
              <dt>Compliance</dt>
              <dd>{profileForm.workspace.compliance || "—"}</dd>
            </dl>
            <button type="button" className="btn-secondary" style={{ justifyContent: "flex-start" }}>
              <ClipboardList size={16} />
              View governance policy
            </button>
          </aside>
        </div>
      </section>

      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings navigation">
          <span className="settings-nav__title">Configuration</span>
          {NAV_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                type="button"
                key={section.id}
                className={`settings-nav__item${isActive ? " is-active" : ""}`}
                onClick={() => setActiveSection(section.id)}
              >
                <Icon />
                {section.label}
                {section.count ? <span className="settings-nav__item-count">{section.count}</span> : null}
              </button>
            );
          })}
        </nav>

        <div className="settings-content">
          {NAV_SECTIONS.map((section) => {
            if (section.id !== activeSection) return null;
            const render = sectionRenderers[section.id];
            return <React.Fragment key={section.id}>{render?.()}</React.Fragment>;
          })}
        </div>
      </div>
    </div>
  );
};

export default Settings;



