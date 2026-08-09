const sodium = require('libsodium-wrappers');

const initCrypto = async () => {
  await sodium.ready;
};

/**
 * Recursively sort object keys for deterministic canonical stringification
 */
const canonicalize = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(canonicalize);
  }
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = canonicalize(obj[key]);
      return acc;
    }, {});
};

/**
 * Generate asymmetric key pair for a stakeholder
 */
const generateKeyPair = async () => {
  await initCrypto();
  const keyPair = sodium.crypto_sign_keypair();
  return {
    publicKey: sodium.to_base64(keyPair.publicKey, sodium.base64_variants.ORIGINAL),
    privateKey: sodium.to_base64(keyPair.privateKey, sodium.base64_variants.ORIGINAL)
  };
};

/**
 * Create a deterministic canonical string from payload and compute hash
 */
const hashPayload = async (payload) => {
  await initCrypto();
  const canonicalString = JSON.stringify(canonicalize(payload));
  const hash = sodium.crypto_generichash(32, canonicalString);
  return sodium.to_base64(hash, sodium.base64_variants.ORIGINAL);
};

/**
 * Sign a payload hash using stakeholder's private key
 */
const signHash = async (hashBase64, privateKeyBase64) => {
  await initCrypto();
  const hash = sodium.from_base64(hashBase64, sodium.base64_variants.ORIGINAL);
  const privateKey = sodium.from_base64(privateKeyBase64, sodium.base64_variants.ORIGINAL);
  
  const signature = sodium.crypto_sign_detached(hash, privateKey);
  return sodium.to_base64(signature, sodium.base64_variants.ORIGINAL);
};

/**
 * Verify a digital signature against a payload hash and public key
 */
const verifySignature = async (hashBase64, signatureBase64, publicKeyBase64) => {
  await initCrypto();
  try {
    const hash = sodium.from_base64(hashBase64, sodium.base64_variants.ORIGINAL);
    const signature = sodium.from_base64(signatureBase64, sodium.base64_variants.ORIGINAL);
    const publicKey = sodium.from_base64(publicKeyBase64, sodium.base64_variants.ORIGINAL);

    return sodium.crypto_sign_verify_detached(signature, hash, publicKey);
  } catch (err) {
    return false;
  }
};

module.exports = {
  initCrypto,
  generateKeyPair,
  hashPayload,
  signHash,
  verifySignature
};