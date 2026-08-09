/**
 * Utility to construct a standard verification URL or payload for QR codes
 */
const generateQRVerificationPayload = (batchId, baseUrl = 'https://verify.ayuverify.org') => {
  return {
    batchId,
    verificationUrl: `${baseUrl}/verify/${batchId}`,
    issuedAt: new Date().toISOString()
  };
};

module.exports = { generateQRVerificationPayload };