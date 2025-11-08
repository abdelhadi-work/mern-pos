import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getProfileSettings,
  updateProfileSettings,
  getSecuritySettings,
  updateSecuritySettings,
  revokeSecuritySession,
  signOutAllSessions,
  getNotificationSettings,
  updateNotificationSettings,
  getStorefrontSettings,
  updateStorefrontSettings,
  getBillingSettings,
  updateBillingSettings,
  getIntegrationSettings,
  updateIntegrationSettings,
  getAuditLog,
  appendAuditEntry,
} from '../controllers/settingsController.js';

const router = express.Router();

router.use(protect);

router.get('/profile', getProfileSettings);
router.put('/profile', updateProfileSettings);
router.get('/security', getSecuritySettings);
router.put('/security', updateSecuritySettings);
router.delete('/security/sessions/:sessionId', revokeSecuritySession);
router.post('/security/sessions/signout-all', signOutAllSessions);
router.get('/notifications', getNotificationSettings);
router.put('/notifications', updateNotificationSettings);
router.get('/storefront', getStorefrontSettings);
router.put('/storefront', updateStorefrontSettings);
router.get('/billing', getBillingSettings);
router.put('/billing', updateBillingSettings);
router.get('/integrations', getIntegrationSettings);
router.put('/integrations', updateIntegrationSettings);
router.get('/audit', getAuditLog);
router.post('/audit', appendAuditEntry);

export default router;


