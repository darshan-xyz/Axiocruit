/**
 * Enterprise SIEM Management Controller
 * Author: Axiocruit Enterprise Integration Platform
 */

const siemService = require('../services/siemService');
const { logAuditEvent } = require('../utils/auditLogger');

/**
 * GET /api/admin/siem
 * Retrieve current SIEM configuration & stream health
 */
const getSiemConfig = (req, res) => {
  return res.status(200).json({
    success: true,
    config: siemService.getConfig(),
  });
};

/**
 * PUT /api/admin/siem
 * Update SIEM streaming configuration
 */
const updateSiemConfig = async (req, res) => {
  try {
    const updated = siemService.updateConfig(req.body);

    await logAuditEvent({
      req,
      action: 'SIEM_CONFIG_UPDATED',
      resource: { type: 'SIEM', id: 'stream-config' },
      details: {
        enabled: updated.enabled,
        format: updated.format,
        transport: updated.transport,
        endpointUrl: updated.endpointUrl ? 'configured' : 'empty',
      },
    });

    return res.status(200).json({
      success: true,
      message: 'SIEM streaming configuration updated',
      config: updated,
    });
  } catch (err) {
    console.error('[SIEM] updateSiemConfig error:', err);
    return res.status(500).json({ message: 'Failed to update SIEM configuration' });
  }
};

/**
 * POST /api/admin/siem/test
 * Test target SIEM endpoint connectivity with probe event
 */
const testSiemConnection = async (req, res) => {
  try {
    const { endpointUrl, authToken, format } = req.body;
    const target = endpointUrl || siemService.config.endpointUrl;

    if (!target) {
      return res.status(400).json({ message: 'Target SIEM endpointUrl is required' });
    }

    const token = authToken !== undefined ? authToken : siemService.config.authToken;
    const probeFormat = format || siemService.config.format || 'ecs';

    const result = await siemService.testConnection(target, token, probeFormat);

    return res.status(200).json({
      success: result.success,
      statusCode: result.statusCode,
      message: result.success
        ? 'Successfully delivered test security probe event to SIEM'
        : `SIEM probe delivery failed: ${result.error}`,
      error: result.error || null,
    });
  } catch (err) {
    console.error('[SIEM] testSiemConnection error:', err);
    return res.status(500).json({ message: 'Failed to execute SIEM probe connection test' });
  }
};

module.exports = {
  getSiemConfig,
  updateSiemConfig,
  testSiemConnection,
};
