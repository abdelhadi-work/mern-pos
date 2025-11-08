import { randomUUID } from 'crypto';
import User from '../models/User.js';

const DEFAULT_BRAND = {
  primaryColor: '#0F172A',
  secondaryColor: '#F7EDE2',
  typography: 'merriweather-inter',
};

const DEFAULT_BUSINESS = {
  name: 'Aurora Retail Holdings',
  licenseNumber: '',
  category: 'electronics',
  signatureBlock: 'Aurora Retail Holdings\nPO Box 12245, Doha, Qatar\nCRN 009812',
};

const DEFAULT_WORKSPACE = {
  name: 'Aurora Retail Holdings',
  region: 'Qatar · Doha HQ',
  dataResidency: 'eu-central-1',
  compliance: 'PCI DSS · ISO 27001',
};

const DEFAULT_RECEIPT = {
  footerMessage: 'Thank you for shopping with Aurora. Returns accepted within 14 days.',
  showQr: true,
  showSignature: true,
};

const DEFAULT_MFA = {
  enabled: false,
  method: 'totp',
  primaryDevice: '',
  addedAt: null,
  backupCodesRemaining: 10,
};

const DEFAULT_POLICIES = {
  idleLockDays: 30,
  geoFenceRegion: 'Qatar',
  requireApprovalOutsideRegion: true,
  notifyOnNewDevice: true,
};

const DEFAULT_CHANNELS = [
  { label: 'Sales', key: 'sales', email: true, sms: true, push: true },
  { label: 'Inventory', key: 'inventory', email: true, sms: false, push: true },
  { label: 'Finance', key: 'finance', email: true, sms: false, push: false },
  { label: 'Refunds', key: 'refunds', email: true, sms: true, push: true },
  { label: 'System Health', key: 'systemHealth', email: true, sms: true, push: true },
];

const DEFAULT_CUSTOM_ALERT = {
  trigger: 'low-stock',
  cadence: 'hourly',
  preview: 'Heads up — stock has dropped below threshold. Scheduled replenishment not yet shipped.',
  recipients: [],
};

const DEFAULT_RECEIPT_TEMPLATE = {
  variant: 'classic',
  footerMessage: 'Thank you for shopping with Aurora. Returns accepted within 14 days.',
  showQr: true,
  showSignature: true,
};

const DEFAULT_TAX = {
  defaultTax: 'VAT · 7%',
  currencyFormat: 'qar',
  roundingRule: 'nearest-five',
};

const DEFAULT_BUSINESS_HOURS = {
  weekdays: 'Sat – Thu · 09:00 – 22:00',
  friday: 'Fri · 13:00 – 22:00',
  holidays: 'Auto import from Ministry Calendar',
};

const DEFAULT_PLAN = {
  name: 'Aurora Professional',
  renewalDate: new Date(),
  seatsUsed: 25,
  seatsTotal: 30,
  locations: 5,
  features: ['Advanced analytics', 'Audit trail'],
};

const DEFAULT_PAYMENT_METHODS = [
  {
    id: 'card-4432',
    type: 'card',
    label: 'Visa ending ••4432',
    details: 'Expires 03 / 27',
    isPrimary: true,
  },
  {
    id: 'bank-transfer',
    type: 'bank',
    label: 'Bank transfer',
    details: 'IBAN QA56 0001 1234 5678',
    isPrimary: false,
  },
];

const DEFAULT_INVOICES = [
  { invoiceId: 'INV-0921', date: new Date('2024-09-21T00:00:00Z'), total: 289, status: 'Paid' },
  { invoiceId: 'INV-0820', date: new Date('2024-08-20T00:00:00Z'), total: 289, status: 'Paid' },
  { invoiceId: 'INV-0722', date: new Date('2024-07-22T00:00:00Z'), total: 289, status: 'Paid' },
];

const DEFAULT_CONNECTORS = [
  {
    id: 'quickbooks',
    name: 'QuickBooks Online',
    description: 'Sync invoices, products, and payouts',
    status: 'Connected',
    actionLabel: 'Manage',
    connectedAt: new Date('2024-08-10T10:00:00Z'),
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send real-time alerts to finance channels',
    status: 'Connected',
    actionLabel: 'Configure',
    connectedAt: new Date('2024-09-02T11:15:00Z'),
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automate custom workflows and handoffs',
    status: 'Available',
    actionLabel: 'Connect',
    connectedAt: null,
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Receive outbound events in external systems',
    status: 'Active',
    actionLabel: 'View',
    connectedAt: new Date('2024-07-18T08:45:00Z'),
  },
];

const formatSessionRecord = (session) => ({
  id: session.id,
  device: session.device,
  location: session.location,
  lastActive: session.lastActive ? session.lastActive.toISOString() : null,
  createdAt: session.createdAt ? session.createdAt.toISOString() : null,
});

const formatTrustedDevice = (device) => ({
  id: device.id,
  name: device.name,
  location: device.location,
  addedAt: device.addedAt ? device.addedAt.toISOString() : null,
  lastSeenAt: device.lastSeenAt ? device.lastSeenAt.toISOString() : null,
});

const formatProfileResponse = (user) => {
  const profile = user.settings?.profile || {};

  return {
    ownerName: profile.ownerName || user.fullName || '',
    contactEmail: profile.contactEmail || user.email || '',
    contactPhone: profile.contactPhone || user.phone || '',
    brand: {
      ...DEFAULT_BRAND,
      ...(profile.brand || {}),
    },
    business: {
      ...DEFAULT_BUSINESS,
      ...(profile.business || {}),
    },
    workspace: {
      ...DEFAULT_WORKSPACE,
      ...(profile.workspace || {}),
    },
    receipt: {
      ...DEFAULT_RECEIPT,
      ...(profile.receipt || {}),
    },
    pendingApprovals: profile.pendingApprovals ?? 0,
    status: profile.status || 'Draft',
    lastUpdated: profile.lastUpdated || user.updatedAt,
    role: user.role,
    updatedBy: user.fullName || user.username,
  };
};

export const getProfileSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(formatProfileResponse(user));
  } catch (error) {
    console.error('Failed to load profile settings', error);
    return res.status(500).json({ message: 'Failed to load profile settings' });
  }
};

export const updateProfileSettings = async (req, res) => {
  try {
    const {
      ownerName,
      contactEmail,
      contactPhone,
      brand,
      business,
      workspace,
      receipt,
      pendingApprovals,
      status,
    } = req.body || {};

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.settings) user.settings = {};
    if (!user.settings.profile) user.settings.profile = {};

    const profile = user.settings.profile;

    if (typeof ownerName === 'string') {
      profile.ownerName = ownerName.trim();
    }

    if (typeof contactEmail === 'string') {
      profile.contactEmail = contactEmail.trim();
    }

    if (typeof contactPhone === 'string') {
      profile.contactPhone = contactPhone.trim();
    }

    if (brand && typeof brand === 'object') {
      profile.brand = {
        ...DEFAULT_BRAND,
        ...(profile.brand || {}),
        primaryColor: brand.primaryColor ?? (profile.brand?.primaryColor ?? DEFAULT_BRAND.primaryColor),
        secondaryColor: brand.secondaryColor ?? (profile.brand?.secondaryColor ?? DEFAULT_BRAND.secondaryColor),
        typography: brand.typography ?? (profile.brand?.typography ?? DEFAULT_BRAND.typography),
      };
    }

    if (business && typeof business === 'object') {
      profile.business = {
        ...DEFAULT_BUSINESS,
        ...(profile.business || {}),
        name: business.name ?? (profile.business?.name ?? DEFAULT_BUSINESS.name),
        licenseNumber: business.licenseNumber ?? (profile.business?.licenseNumber ?? DEFAULT_BUSINESS.licenseNumber),
        category: business.category ?? (profile.business?.category ?? DEFAULT_BUSINESS.category),
        signatureBlock: business.signatureBlock ?? (profile.business?.signatureBlock ?? DEFAULT_BUSINESS.signatureBlock),
      };
    }

    if (workspace && typeof workspace === 'object') {
      profile.workspace = {
        ...DEFAULT_WORKSPACE,
        ...(profile.workspace || {}),
        name: workspace.name ?? (profile.workspace?.name ?? DEFAULT_WORKSPACE.name),
        region: workspace.region ?? (profile.workspace?.region ?? DEFAULT_WORKSPACE.region),
        dataResidency: workspace.dataResidency ?? (profile.workspace?.dataResidency ?? DEFAULT_WORKSPACE.dataResidency),
        compliance: workspace.compliance ?? (profile.workspace?.compliance ?? DEFAULT_WORKSPACE.compliance),
      };
    }

    if (receipt && typeof receipt === 'object') {
      profile.receipt = {
        ...DEFAULT_RECEIPT,
        ...(profile.receipt || {}),
        footerMessage: receipt.footerMessage ?? (profile.receipt?.footerMessage ?? DEFAULT_RECEIPT.footerMessage),
        showQr: typeof receipt.showQr === 'boolean' ? receipt.showQr : (profile.receipt?.showQr ?? DEFAULT_RECEIPT.showQr),
        showSignature:
          typeof receipt.showSignature === 'boolean'
            ? receipt.showSignature
            : (profile.receipt?.showSignature ?? DEFAULT_RECEIPT.showSignature),
      };
    }

    if (pendingApprovals !== undefined) {
      profile.pendingApprovals = Number.isFinite(pendingApprovals)
        ? pendingApprovals
        : profile.pendingApprovals ?? 0;
    }

    if (status) {
      profile.status = status;
    }

    profile.lastUpdated = new Date();

    user.markModified('settings');
    await user.save();

    return res.json(formatProfileResponse(user));
  } catch (error) {
    console.error('Failed to update profile settings', error);
    return res.status(500).json({ message: 'Failed to update profile settings' });
  }
};

const formatSecurityResponse = (user) => {
  const security = user.settings?.security || {};

  return {
    mfa: {
      ...DEFAULT_MFA,
      ...(security.mfa || {}),
      addedAt: security.mfa?.addedAt ? security.mfa.addedAt.toISOString() : null,
    },
    sessions: Array.isArray(security.sessions) ? security.sessions.map(formatSessionRecord) : [],
    trustedDevices: Array.isArray(security.trustedDevices)
      ? security.trustedDevices.map(formatTrustedDevice)
      : [],
    policies: {
      ...DEFAULT_POLICIES,
      ...(security.policies || {}),
    },
    lastUpdated: security.lastUpdated ? security.lastUpdated.toISOString() : user.updatedAt,
  };
};

export const getSecuritySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.settings) user.settings = {};
    if (!user.settings.security) {
      user.settings.security = {
        mfa: { ...DEFAULT_MFA },
        sessions: [],
        trustedDevices: [],
        policies: { ...DEFAULT_POLICIES },
        lastUpdated: new Date(),
      };
      user.markModified('settings');
      await user.save();
    }

    return res.json(formatSecurityResponse(user));
  } catch (error) {
    console.error('Failed to load security settings', error);
    return res.status(500).json({ message: 'Failed to load security settings' });
  }
};

export const updateSecuritySettings = async (req, res) => {
  try {
    const { mfa, policies, trustedDevices } = req.body || {};

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.settings) user.settings = {};
    if (!user.settings.security) user.settings.security = {};

    const security = user.settings.security;

    if (mfa && typeof mfa === 'object') {
      security.mfa = {
        ...DEFAULT_MFA,
        ...(security.mfa || {}),
        enabled: typeof mfa.enabled === 'boolean' ? mfa.enabled : (security.mfa?.enabled ?? DEFAULT_MFA.enabled),
        method: mfa.method ?? (security.mfa?.method ?? DEFAULT_MFA.method),
        primaryDevice: mfa.primaryDevice ?? (security.mfa?.primaryDevice ?? DEFAULT_MFA.primaryDevice),
        addedAt: mfa.addedAt
          ? new Date(mfa.addedAt)
          : security.mfa?.addedAt ?? (mfa.enabled ? new Date() : null),
        backupCodesRemaining:
          typeof mfa.backupCodesRemaining === 'number'
            ? mfa.backupCodesRemaining
            : (security.mfa?.backupCodesRemaining ?? DEFAULT_MFA.backupCodesRemaining),
      };
    }

    if (policies && typeof policies === 'object') {
      security.policies = {
        ...DEFAULT_POLICIES,
        ...(security.policies || {}),
        idleLockDays: Number.isFinite(policies.idleLockDays)
          ? policies.idleLockDays
          : (security.policies?.idleLockDays ?? DEFAULT_POLICIES.idleLockDays),
        geoFenceRegion: policies.geoFenceRegion ?? (security.policies?.geoFenceRegion ?? DEFAULT_POLICIES.geoFenceRegion),
        requireApprovalOutsideRegion:
          typeof policies.requireApprovalOutsideRegion === 'boolean'
            ? policies.requireApprovalOutsideRegion
            : (security.policies?.requireApprovalOutsideRegion ?? DEFAULT_POLICIES.requireApprovalOutsideRegion),
        notifyOnNewDevice:
          typeof policies.notifyOnNewDevice === 'boolean'
            ? policies.notifyOnNewDevice
            : (security.policies?.notifyOnNewDevice ?? DEFAULT_POLICIES.notifyOnNewDevice),
      };
    }

    if (Array.isArray(trustedDevices)) {
      security.trustedDevices = trustedDevices.map((device) => ({
        id: device.id || randomUUID(),
        name: device.name,
        location: device.location || '',
        addedAt: device.addedAt ? new Date(device.addedAt) : new Date(),
        lastSeenAt: device.lastSeenAt ? new Date(device.lastSeenAt) : new Date(),
      }));
    }

    security.lastUpdated = new Date();

    user.markModified('settings');
    await user.save();

    return res.json(formatSecurityResponse(user));
  } catch (error) {
    console.error('Failed to update security settings', error);
    return res.status(500).json({ message: 'Failed to update security settings' });
  }
};

export const revokeSecuritySession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.settings?.security?.sessions) {
      return res.status(400).json({ message: 'No sessions to revoke' });
    }

    const originalLength = user.settings.security.sessions.length;

    user.settings.security.sessions = user.settings.security.sessions.filter((session) => session.id !== sessionId);

    if (user.settings.security.sessions.length === originalLength) {
      return res.status(404).json({ message: 'Session not found' });
    }

    user.settings.security.lastUpdated = new Date();
    user.markModified('settings');
    await user.save();

    return res.json(formatSecurityResponse(user));
  } catch (error) {
    console.error('Failed to revoke session', error);
    return res.status(500).json({ message: 'Failed to revoke session' });
  }
};

export const signOutAllSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.settings) user.settings = {};
    if (!user.settings.security) user.settings.security = {};

    user.settings.security.sessions = [];
    user.settings.security.lastUpdated = new Date();

    user.markModified('settings');
    await user.save();

    return res.json(formatSecurityResponse(user));
  } catch (error) {
    console.error('Failed to sign out all sessions', error);
    return res.status(500).json({ message: 'Failed to sign out all sessions' });
  }
};

const formatNotificationResponse = (user) => {
  const notifications = user.settings?.notifications || {};

  const channels = Array.isArray(notifications.channels) && notifications.channels.length
    ? notifications.channels
    : DEFAULT_CHANNELS;

  const customAlert = notifications.customAlert || {};

  return {
    channels: channels.map((channel) => ({
      label: channel.label,
      key: channel.key,
      email: !!channel.email,
      sms: !!channel.sms,
      push: !!channel.push,
    })),
    customAlert: {
      trigger: customAlert.trigger || DEFAULT_CUSTOM_ALERT.trigger,
      cadence: customAlert.cadence || DEFAULT_CUSTOM_ALERT.cadence,
      preview: customAlert.preview || DEFAULT_CUSTOM_ALERT.preview,
      recipients:
        Array.isArray(customAlert.recipients) && customAlert.recipients.length
          ? customAlert.recipients
          : user.email
          ? [user.email]
          : [],
    },
    lastUpdated: notifications.lastUpdated ? notifications.lastUpdated.toISOString() : user.updatedAt,
  };
};

export const getNotificationSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.settings) user.settings = {};
    if (!user.settings.notifications) {
      user.settings.notifications = {
        channels: DEFAULT_CHANNELS,
        customAlert: {
          ...DEFAULT_CUSTOM_ALERT,
          recipients: user.email ? [user.email] : [],
        },
        lastUpdated: new Date(),
      };
      user.markModified('settings');
      await user.save();
    }

    return res.json(formatNotificationResponse(user));
  } catch (error) {
    console.error('Failed to load notification settings', error);
    return res.status(500).json({ message: 'Failed to load notification settings' });
  }
};

export const updateNotificationSettings = async (req, res) => {
  try {
    const { channels, customAlert } = req.body || {};

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.settings) user.settings = {};
    if (!user.settings.notifications) user.settings.notifications = {};

    const notifications = user.settings.notifications;

    if (Array.isArray(channels) && channels.length) {
      notifications.channels = channels.map((channel) => ({
        label: channel.label || channel.key || 'Channel',
        key: channel.key || channel.label?.toLowerCase().replace(/\s+/g, ''),
        email: !!channel.email,
        sms: !!channel.sms,
        push: !!channel.push,
      }));
    }

    if (customAlert && typeof customAlert === 'object') {
      notifications.customAlert = {
        trigger: customAlert.trigger || DEFAULT_CUSTOM_ALERT.trigger,
        cadence: customAlert.cadence || DEFAULT_CUSTOM_ALERT.cadence,
        preview: customAlert.preview || DEFAULT_CUSTOM_ALERT.preview,
        recipients: Array.isArray(customAlert.recipients) && customAlert.recipients.length
          ? customAlert.recipients
          : notifications.customAlert?.recipients?.length
          ? notifications.customAlert.recipients
          : user.email
          ? [user.email]
          : [],
      };
    }

    notifications.lastUpdated = new Date();

    user.markModified('settings');
    await user.save();

    return res.json(formatNotificationResponse(user));
  } catch (error) {
    console.error('Failed to update notification settings', error);
    return res.status(500).json({ message: 'Failed to update notification settings' });
  }
};

const formatStorefrontResponse = (user) => {
  const storefront = user.settings?.storefront || {};

  return {
    receipt: {
      ...DEFAULT_RECEIPT_TEMPLATE,
      ...(storefront.receipt || {}),
    },
    tax: {
      ...DEFAULT_TAX,
      ...(storefront.tax || {}),
    },
    businessHours: {
      ...DEFAULT_BUSINESS_HOURS,
      ...(storefront.businessHours || {}),
    },
    lastUpdated: storefront.lastUpdated ? storefront.lastUpdated.toISOString() : user.updatedAt,
  };
};

export const getStorefrontSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.settings) user.settings = {};
    if (!user.settings.storefront) {
      user.settings.storefront = {
        receipt: { ...DEFAULT_RECEIPT_TEMPLATE },
        tax: { ...DEFAULT_TAX },
        businessHours: { ...DEFAULT_BUSINESS_HOURS },
        lastUpdated: new Date(),
      };
      user.markModified('settings');
      await user.save();
    }

    return res.json(formatStorefrontResponse(user));
  } catch (error) {
    console.error('Failed to load storefront settings', error);
    return res.status(500).json({ message: 'Failed to load storefront settings' });
  }
};

export const updateStorefrontSettings = async (req, res) => {
  try {
    const { receipt, tax, businessHours } = req.body || {};

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.settings) user.settings = {};
    if (!user.settings.storefront) user.settings.storefront = {};

    const storefront = user.settings.storefront;

    if (receipt && typeof receipt === 'object') {
      storefront.receipt = {
        ...DEFAULT_RECEIPT_TEMPLATE,
        ...(storefront.receipt || {}),
        variant: receipt.variant || receipt.template || storefront.receipt?.variant || DEFAULT_RECEIPT_TEMPLATE.variant,
        footerMessage:
          receipt.footerMessage ?? storefront.receipt?.footerMessage ?? DEFAULT_RECEIPT_TEMPLATE.footerMessage,
        showQr:
          typeof receipt.showQr === 'boolean'
            ? receipt.showQr
            : storefront.receipt?.showQr ?? DEFAULT_RECEIPT_TEMPLATE.showQr,
        showSignature:
          typeof receipt.showSignature === 'boolean'
            ? receipt.showSignature
            : storefront.receipt?.showSignature ?? DEFAULT_RECEIPT_TEMPLATE.showSignature,
      };
    }

    if (tax && typeof tax === 'object') {
      storefront.tax = {
        ...DEFAULT_TAX,
        ...(storefront.tax || {}),
        defaultTax: tax.defaultTax ?? storefront.tax?.defaultTax ?? DEFAULT_TAX.defaultTax,
        currencyFormat: tax.currencyFormat ?? storefront.tax?.currencyFormat ?? DEFAULT_TAX.currencyFormat,
        roundingRule: tax.roundingRule ?? storefront.tax?.roundingRule ?? DEFAULT_TAX.roundingRule,
      };
    }

    if (businessHours && typeof businessHours === 'object') {
      storefront.businessHours = {
        ...DEFAULT_BUSINESS_HOURS,
        ...(storefront.businessHours || {}),
        weekdays: businessHours.weekdays ?? storefront.businessHours?.weekdays ?? DEFAULT_BUSINESS_HOURS.weekdays,
        friday: businessHours.friday ?? storefront.businessHours?.friday ?? DEFAULT_BUSINESS_HOURS.friday,
        holidays: businessHours.holidays ?? storefront.businessHours?.holidays ?? DEFAULT_BUSINESS_HOURS.holidays,
      };
    }

    storefront.lastUpdated = new Date();

    user.markModified('settings');
    await user.save();

    return res.json(formatStorefrontResponse(user));
  } catch (error) {
    console.error('Failed to update storefront settings', error);
    return res.status(500).json({ message: 'Failed to update storefront settings' });
  }
};

const formatBillingResponse = (user) => {
  const billing = user.settings?.billing || {};

  return {
    plan: {
      ...DEFAULT_PLAN,
      ...(billing.plan || {}),
      renewalDate: billing.plan?.renewalDate ? billing.plan.renewalDate.toISOString() : new Date().toISOString(),
    },
    paymentMethods: Array.isArray(billing.paymentMethods) && billing.paymentMethods.length
      ? billing.paymentMethods
      : DEFAULT_PAYMENT_METHODS,
    invoices: Array.isArray(billing.invoices) && billing.invoices.length
      ? billing.invoices.map((invoice) => ({
          ...invoice,
          date: invoice.date ? invoice.date.toISOString() : new Date().toISOString(),
        }))
      : DEFAULT_INVOICES.map((invoice) => ({
          ...invoice,
          date: invoice.date.toISOString(),
        })),
    lastUpdated: billing.lastUpdated ? billing.lastUpdated.toISOString() : user.updatedAt,
  };
};

export const getBillingSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.settings) user.settings = {};
    if (!user.settings.billing) {
      user.settings.billing = {
        plan: { ...DEFAULT_PLAN },
        paymentMethods: DEFAULT_PAYMENT_METHODS,
        invoices: DEFAULT_INVOICES,
        lastUpdated: new Date(),
      };
      user.markModified('settings');
      await user.save();
    }

    return res.json(formatBillingResponse(user));
  } catch (error) {
    console.error('Failed to load billing settings', error);
    return res.status(500).json({ message: 'Failed to load billing settings' });
  }
};

export const updateBillingSettings = async (req, res) => {
  try {
    const { plan, paymentMethods, invoices } = req.body || {};

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.settings) user.settings = {};
    if (!user.settings.billing) user.settings.billing = {};

    const billing = user.settings.billing;

    if (plan && typeof plan === 'object') {
      billing.plan = {
        ...DEFAULT_PLAN,
        ...(billing.plan || {}),
        name: plan.name ?? billing.plan?.name ?? DEFAULT_PLAN.name,
        renewalDate: plan.renewalDate ? new Date(plan.renewalDate) : billing.plan?.renewalDate ?? DEFAULT_PLAN.renewalDate,
        seatsUsed: Number.isFinite(plan.seatsUsed) ? plan.seatsUsed : billing.plan?.seatsUsed ?? DEFAULT_PLAN.seatsUsed,
        seatsTotal: Number.isFinite(plan.seatsTotal) ? plan.seatsTotal : billing.plan?.seatsTotal ?? DEFAULT_PLAN.seatsTotal,
        locations: Number.isFinite(plan.locations) ? plan.locations : billing.plan?.locations ?? DEFAULT_PLAN.locations,
        features: Array.isArray(plan.features) && plan.features.length ? plan.features : billing.plan?.features ?? DEFAULT_PLAN.features,
      };
    }

    if (Array.isArray(paymentMethods)) {
      billing.paymentMethods = paymentMethods.map((method) => ({
        id: method.id || method.label || `method-${Date.now()}`,
        type: method.type || 'card',
        label: method.label || 'Payment method',
        details: method.details || '',
        isPrimary: !!method.isPrimary,
      }));
    }

    if (Array.isArray(invoices)) {
      billing.invoices = invoices.map((invoice) => ({
        invoiceId: invoice.invoiceId || invoice.id || `INV-${Date.now()}`,
        date: invoice.date ? new Date(invoice.date) : new Date(),
        total: typeof invoice.total === 'number' ? invoice.total : 0,
        status: invoice.status || 'Paid',
      }));
    }

    billing.lastUpdated = new Date();

    user.markModified('settings');
    await user.save();

    return res.json(formatBillingResponse(user));
  } catch (error) {
    console.error('Failed to update billing settings', error);
    return res.status(500).json({ message: 'Failed to update billing settings' });
  }
};

const formatIntegrationsResponse = (user) => {
  const integrations = user.settings?.integrations || {};

  const connectors = Array.isArray(integrations.connectors) && integrations.connectors.length
    ? integrations.connectors
    : DEFAULT_CONNECTORS;

  return {
    connectors: connectors.map((connector) => ({
      id: connector.id,
      name: connector.name,
      description: connector.description,
      status: connector.status || 'Available',
      actionLabel: connector.actionLabel || 'Connect',
      connectedAt: connector.connectedAt ? connector.connectedAt.toISOString() : null,
    })),
    lastUpdated: integrations.lastUpdated ? integrations.lastUpdated.toISOString() : user.updatedAt,
  };
};

export const getIntegrationSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.settings) user.settings = {};
    if (!user.settings.integrations) {
      user.settings.integrations = {
        connectors: DEFAULT_CONNECTORS,
        lastUpdated: new Date(),
      };
      user.markModified('settings');
      await user.save();
    }

    return res.json(formatIntegrationsResponse(user));
  } catch (error) {
    console.error('Failed to load integrations settings', error);
    return res.status(500).json({ message: 'Failed to load integrations settings' });
  }
};

export const updateIntegrationSettings = async (req, res) => {
  try {
    const { connectors } = req.body || {};

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.settings) user.settings = {};
    if (!user.settings.integrations) user.settings.integrations = {};

    const integrations = user.settings.integrations;

    if (Array.isArray(connectors)) {
      integrations.connectors = connectors.map((connector) => ({
        id: connector.id || connector.name || `integration-${Date.now()}`,
        name: connector.name || 'Integration',
        description: connector.description || '',
        status: connector.status || 'Available',
        actionLabel: connector.actionLabel || 'Connect',
        connectedAt: connector.connectedAt ? new Date(connector.connectedAt) : null,
      }));
    }

    integrations.lastUpdated = new Date();

    user.markModified('settings');
    await user.save();

    return res.json(formatIntegrationsResponse(user));
  } catch (error) {
    console.error('Failed to update integrations settings', error);
    return res.status(500).json({ message: 'Failed to update integrations settings' });
  }
};

const formatAuditResponse = (user) => {
  const audit = user.settings?.audit || {};

  const entries = Array.isArray(audit.entries) && audit.entries.length
    ? audit.entries
    : [];

  return {
    entries: entries
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((entry) => ({
        id: entry.id,
        title: entry.title,
        description: entry.description,
        performedBy: entry.performedBy || 'System',
        section: entry.section || 'general',
        createdAt: entry.createdAt ? entry.createdAt.toISOString() : new Date().toISOString(),
      })),
    lastUpdated: audit.lastUpdated ? audit.lastUpdated.toISOString() : user.updatedAt,
  };
};

export const getAuditLog = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.settings) user.settings = {};
    if (!user.settings.audit) {
      user.settings.audit = {
        entries: [],
        lastUpdated: new Date(),
      };
      user.markModified('settings');
      await user.save();
    }

    return res.json(formatAuditResponse(user));
  } catch (error) {
    console.error('Failed to load audit log', error);
    return res.status(500).json({ message: 'Failed to load audit log' });
  }
};

export const appendAuditEntry = async (req, res) => {
  try {
    const { title, description, performedBy, section } = req.body || {};

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.settings) user.settings = {};
    if (!user.settings.audit) user.settings.audit = {};
    if (!Array.isArray(user.settings.audit.entries)) user.settings.audit.entries = [];

    const entry = {
      id: `audit-${Date.now()}`,
      title,
      description: description || '',
      performedBy: performedBy || (user.fullName || user.username || 'System'),
      section: section || 'general',
      createdAt: new Date(),
    };

    user.settings.audit.entries.unshift(entry);
    user.settings.audit.entries = user.settings.audit.entries.slice(0, 100);
    user.settings.audit.lastUpdated = new Date();

    user.markModified('settings');
    await user.save();

    return res.status(201).json(formatAuditResponse(user));
  } catch (error) {
    console.error('Failed to append audit entry', error);
    return res.status(500).json({ message: 'Failed to append audit entry' });
  }
};








