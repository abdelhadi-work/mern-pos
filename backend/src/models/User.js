import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const brandSchema = new mongoose.Schema(
  {
    primaryColor: { type: String, default: '#0F172A' },
    secondaryColor: { type: String, default: '#F7EDE2' },
    typography: { type: String, default: 'merriweather-inter' },
  },
  { _id: false }
);

const businessSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Aurora Retail Holdings' },
    licenseNumber: { type: String, default: '' },
    category: { type: String, default: 'electronics' },
    signatureBlock: { type: String, default: '' },
  },
  { _id: false }
);

const receiptSchema = new mongoose.Schema(
  {
    footerMessage: {
      type: String,
      default: 'Thank you for shopping with Aurora. Returns accepted within 14 days.',
    },
    showQr: { type: Boolean, default: true },
    showSignature: { type: Boolean, default: true },
  },
  { _id: false }
);

const mfaSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    method: { type: String, default: 'totp' },
    primaryDevice: { type: String, default: '' },
    addedAt: { type: Date, default: null },
    backupCodesRemaining: { type: Number, default: 10 },
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    device: { type: String, required: true },
    location: { type: String, default: '' },
    lastActive: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const trustedDeviceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    addedAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    location: { type: String, default: '' },
  },
  { _id: false }
);

const securityPoliciesSchema = new mongoose.Schema(
  {
    idleLockDays: { type: Number, default: 30 },
    geoFenceRegion: { type: String, default: 'Qatar' },
    requireApprovalOutsideRegion: { type: Boolean, default: true },
    notifyOnNewDevice: { type: Boolean, default: true },
  },
  { _id: false }
);

const securitySettingsSchema = new mongoose.Schema(
  {
    mfa: { type: mfaSchema, default: () => ({}) },
    sessions: { type: [sessionSchema], default: () => [] },
    trustedDevices: { type: [trustedDeviceSchema], default: () => [] },
    policies: { type: securityPoliciesSchema, default: () => ({}) },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

const channelMatrixSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    key: { type: String, required: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
  },
  { _id: false }
);

const customAlertSchema = new mongoose.Schema(
  {
    trigger: { type: String, default: 'low-stock' },
    cadence: { type: String, default: 'hourly' },
    preview: {
      type: String,
      default: 'Heads up — stock has dropped below threshold. Scheduled replenishment not yet shipped.',
    },
    recipients: {
      type: [String],
      default: () => [],
    },
  },
  { _id: false }
);

const notificationSettingsSchema = new mongoose.Schema(
  {
    channels: { type: [channelMatrixSchema], default: () => [] },
    customAlert: { type: customAlertSchema, default: () => ({}) },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

const receiptTemplateSchema = new mongoose.Schema(
  {
    variant: { type: String, default: 'classic' },
    footerMessage: {
      type: String,
      default: 'Thank you for shopping with Aurora. Returns accepted within 14 days.',
    },
    showQr: { type: Boolean, default: true },
    showSignature: { type: Boolean, default: true },
  },
  { _id: false }
);

const taxSettingsSchema = new mongoose.Schema(
  {
    defaultTax: { type: String, default: 'VAT · 7%' },
    currencyFormat: { type: String, default: 'qar' },
    roundingRule: { type: String, default: 'nearest-five' },
  },
  { _id: false }
);

const businessHoursSchema = new mongoose.Schema(
  {
    weekdays: { type: String, default: 'Sat – Thu · 09:00 – 22:00' },
    friday: { type: String, default: 'Fri · 13:00 – 22:00' },
    holidays: { type: String, default: 'Auto import from Ministry Calendar' },
  },
  { _id: false }
);

const storefrontSettingsSchema = new mongoose.Schema(
  {
    receipt: { type: receiptTemplateSchema, default: () => ({}) },
    tax: { type: taxSettingsSchema, default: () => ({}) },
    businessHours: { type: businessHoursSchema, default: () => ({}) },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

const paymentMethodSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, default: 'card' },
    label: { type: String, required: true },
    details: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

const invoiceRecordSchema = new mongoose.Schema(
  {
    invoiceId: { type: String, required: true },
    date: { type: Date, required: true },
    total: { type: Number, required: true },
    status: { type: String, default: 'Paid' },
  },
  { _id: false }
);

const billingSettingsSchema = new mongoose.Schema(
  {
    plan: {
      name: { type: String, default: 'Aurora Professional' },
      renewalDate: { type: Date, default: () => new Date() },
      seatsUsed: { type: Number, default: 0 },
      seatsTotal: { type: Number, default: 0 },
      locations: { type: Number, default: 0 },
      features: { type: [String], default: () => [] },
    },
    paymentMethods: { type: [paymentMethodSchema], default: () => [] },
    invoices: { type: [invoiceRecordSchema], default: () => [] },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

const integrationRecordSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, default: 'Available' },
    actionLabel: { type: String, default: 'Connect' },
    connectedAt: { type: Date, default: null },
  },
  { _id: false }
);

const integrationsSettingsSchema = new mongoose.Schema(
  {
    connectors: { type: [integrationRecordSchema], default: () => [] },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

const auditEntrySchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    performedBy: { type: String, default: '' },
    section: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const auditSettingsSchema = new mongoose.Schema(
  {
    entries: { type: [auditEntrySchema], default: () => [] },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Aurora Retail Holdings' },
    region: { type: String, default: 'Qatar · Doha HQ' },
    dataResidency: { type: String, default: 'eu-central-1' },
    compliance: { type: String, default: 'PCI DSS · ISO 27001' },
  },
  { _id: false }
);

const profileSettingsSchema = new mongoose.Schema(
  {
    ownerName: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    brand: { type: brandSchema, default: () => ({}) },
    business: { type: businessSchema, default: () => ({}) },
    workspace: { type: workspaceSchema, default: () => ({}) },
    receipt: { type: receiptSchema, default: () => ({}) },
    pendingApprovals: { type: Number, default: 0 },
    status: { type: String, default: 'Draft' },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  fullName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['main_admin', 'finance_admin', 'accounting_admin', 'cashier', 'delivery'],
    default: 'cashier',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  settings: {
    profile: {
      type: profileSettingsSchema,
      default: () => ({}),
    },
    security: {
      type: securitySettingsSchema,
      default: () => ({}),
    },
    notifications: {
      type: notificationSettingsSchema,
      default: () => ({}),
    },
    storefront: {
      type: storefrontSettingsSchema,
      default: () => ({}),
    },
    billing: {
      type: billingSettingsSchema,
      default: () => ({}),
    },
    integrations: {
      type: integrationsSettingsSchema,
      default: () => ({}),
    },
    audit: {
      type: auditSettingsSchema,
      default: () => ({}),
    },
  },
}, {
  timestamps: true,
});

// Hash password before saving to the database
userSchema.pre('save', async function (next) {
  if (!this.settings) {
    this.settings = {};
  }

  if (!this.settings.profile) {
    this.settings.profile = {};
  }

  const profile = this.settings.profile;

  if (!profile.ownerName) {
    profile.ownerName = this.fullName;
  }

  if (!profile.contactEmail) {
    profile.contactEmail = this.email;
  }

  if (!profile.contactPhone && this.phone) {
    profile.contactPhone = this.phone;
  }

  if (!profile.lastUpdated) {
    profile.lastUpdated = new Date();
  }

  if (!this.settings.security) {
    this.settings.security = {};
  }

  const security = this.settings.security;

  if (!security.mfa) security.mfa = {};
  if (security.mfa.enabled && !security.mfa.addedAt) {
    security.mfa.addedAt = new Date();
  }
  if (security.mfa.backupCodesRemaining == null) {
    security.mfa.backupCodesRemaining = 10;
  }

  if (!Array.isArray(security.sessions)) {
    security.sessions = [];
  }

  if (!Array.isArray(security.trustedDevices)) {
    security.trustedDevices = [];
  }

  if (!security.policies) {
    security.policies = {};
  }

  if (!security.lastUpdated) {
    security.lastUpdated = new Date();
  }

  if (!this.settings.notifications) {
    this.settings.notifications = {};
  }

  const notifications = this.settings.notifications;

  if (!Array.isArray(notifications.channels) || notifications.channels.length === 0) {
    notifications.channels = [
      { label: 'Sales', key: 'sales', email: true, sms: true, push: true },
      { label: 'Inventory', key: 'inventory', email: true, sms: false, push: true },
      { label: 'Finance', key: 'finance', email: true, sms: false, push: false },
      { label: 'Refunds', key: 'refunds', email: true, sms: true, push: true },
      { label: 'System Health', key: 'systemHealth', email: true, sms: true, push: true },
    ];
  }

  if (!notifications.customAlert) {
    notifications.customAlert = {
      trigger: 'low-stock',
      cadence: 'hourly',
      preview: 'Heads up — stock has dropped below threshold. Scheduled replenishment not yet shipped.',
      recipients: this.email ? [this.email] : [],
    };
  }

  if (!Array.isArray(notifications.customAlert.recipients) || notifications.customAlert.recipients.length === 0) {
    notifications.customAlert.recipients = this.email ? [this.email] : [];
  }

  if (!notifications.lastUpdated) {
    notifications.lastUpdated = new Date();
  }

  if (!this.settings.storefront) {
    this.settings.storefront = {};
  }

  const storefront = this.settings.storefront;

  if (!storefront.receipt) {
    storefront.receipt = {};
  }
  if (!storefront.receipt.variant) storefront.receipt.variant = 'classic';
  if (storefront.receipt.showQr == null) storefront.receipt.showQr = true;
  if (storefront.receipt.showSignature == null) storefront.receipt.showSignature = true;
  if (!storefront.receipt.footerMessage) {
    storefront.receipt.footerMessage = 'Thank you for shopping with Aurora. Returns accepted within 14 days.';
  }

  if (!storefront.tax) {
    storefront.tax = {};
  }
  if (!storefront.tax.defaultTax) storefront.tax.defaultTax = 'VAT · 7%';
  if (!storefront.tax.currencyFormat) storefront.tax.currencyFormat = 'qar';
  if (!storefront.tax.roundingRule) storefront.tax.roundingRule = 'nearest-five';

  if (!storefront.businessHours) {
    storefront.businessHours = {};
  }
  if (!storefront.businessHours.weekdays) storefront.businessHours.weekdays = 'Sat – Thu · 09:00 – 22:00';
  if (!storefront.businessHours.friday) storefront.businessHours.friday = 'Fri · 13:00 – 22:00';
  if (!storefront.businessHours.holidays) storefront.businessHours.holidays = 'Auto import from Ministry Calendar';

  if (!storefront.lastUpdated) {
    storefront.lastUpdated = new Date();
  }

  if (!this.settings.billing) {
    this.settings.billing = {};
  }

  const billing = this.settings.billing;

  if (!billing.plan) {
    billing.plan = {
      name: 'Aurora Professional',
      renewalDate: new Date(),
      seatsUsed: 25,
      seatsTotal: 30,
      locations: 5,
      features: ['Advanced analytics', 'Audit trail'],
    };
  }

  if (!Array.isArray(billing.paymentMethods) || billing.paymentMethods.length === 0) {
    billing.paymentMethods = [
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
  }

  if (!Array.isArray(billing.invoices) || billing.invoices.length === 0) {
    billing.invoices = [
      { invoiceId: 'INV-0921', date: new Date('2024-09-21T00:00:00Z'), total: 289, status: 'Paid' },
      { invoiceId: 'INV-0820', date: new Date('2024-08-20T00:00:00Z'), total: 289, status: 'Paid' },
      { invoiceId: 'INV-0722', date: new Date('2024-07-22T00:00:00Z'), total: 289, status: 'Paid' },
    ];
  }

  if (!billing.lastUpdated) {
    billing.lastUpdated = new Date();
  }

  if (!this.settings.integrations) {
    this.settings.integrations = {};
  }

  const integrations = this.settings.integrations;

  if (!Array.isArray(integrations.connectors) || integrations.connectors.length === 0) {
    integrations.connectors = [
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
  }

  if (!integrations.lastUpdated) {
    integrations.lastUpdated = new Date();
  }

  if (!this.settings.audit) {
    this.settings.audit = {};
  }

  const audit = this.settings.audit;

  if (!Array.isArray(audit.entries) || audit.entries.length === 0) {
    audit.entries = [
      {
        id: 'audit-1',
        title: 'Tax rule updated',
        description: 'VAT increased from 5% to 7% for Qatar store',
        performedBy: 'Fatima Sayed',
        section: 'storefront',
        createdAt: new Date('2024-10-22T09:15:00Z'),
      },
      {
        id: 'audit-2',
        title: 'Slack integration connected',
        description: 'Finance alerts routed to #ops-finance',
        performedBy: 'Ali Hariri',
        section: 'integrations',
        createdAt: new Date('2024-10-20T14:52:00Z'),
      },
      {
        id: 'audit-3',
        title: 'New payment method added',
        description: 'Visa ending •• 4432',
        performedBy: 'Jane Doe',
        section: 'billing',
        createdAt: new Date('2024-10-18T16:32:00Z'),
      },
    ];
  }

  if (!audit.lastUpdated) {
    audit.lastUpdated = new Date();
  }

  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
