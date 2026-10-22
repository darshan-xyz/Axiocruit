/**
 * Enterprise Multi-Factor Authentication (MFA / 2FA) Service
 * RFC 6238 TOTP (Time-Based One-Time Password) & Cryptographic Recovery Codes
 * Author: Axiocruit Enterprise Integration Platform
 */

const crypto = require('crypto');

// RFC 4648 Base32 Alphabet
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

class MfaService {
  /**
   * Encode a Buffer into an RFC 4648 Base32 string
   */
  base32Encode(buffer) {
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
    }

    return output;
  }

  /**
   * Decode an RFC 4648 Base32 string into a Buffer
   */
  base32Decode(input) {
    const cleanInput = input.toUpperCase().replace(/[\s=-]/g, '');
    let bits = 0;
    let value = 0;
    const bytes = [];

    for (let i = 0; i < cleanInput.length; i++) {
      const idx = BASE32_ALPHABET.indexOf(cleanInput[i]);
      if (idx === -1) {
        throw new Error(`Invalid Base32 character: ${cleanInput[i]}`);
      }

      value = (value << 5) | idx;
      bits += 5;

      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(bytes);
  }

  /**
   * Generate a random 20-byte (160-bit) Base32 secret for TOTP
   */
  generateSecret(byteLength = 20) {
    const randomBytes = crypto.randomBytes(byteLength);
    return this.base32Encode(randomBytes);
  }

  /**
   * Generate an RFC 6238 TOTP token for a given secret and time offset
   */
  generateTotp(secret, timeStepOffset = 0, stepSec = 30, digits = 6) {
    const key = this.base32Decode(secret);
    const epochSec = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epochSec / stepSec) + timeStepOffset;

    // 8-byte big-endian counter buffer
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigInt64BE(BigInt(counter));

    // HMAC-SHA1
    const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();

    // Dynamic truncation per RFC 4226 Section 5.3
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, digits);
    return otp.toString().padStart(digits, '0');
  }

  /**
   * Verify an RFC 6238 TOTP token with time drift window tolerance
   */
  verifyTotp(secret, token, window = 1, stepSec = 30, digits = 6) {
    if (!secret || !token) return false;

    const normalizedToken = String(token).trim();
    if (normalizedToken.length !== digits || !/^\d+$/.test(normalizedToken)) {
      return false;
    }

    for (let offset = -window; offset <= window; offset++) {
      const generated = this.generateTotp(secret, offset, stepSec, digits);
      if (crypto.timingSafeEqual(Buffer.from(generated), Buffer.from(normalizedToken))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Format standard otpauth:// URI for QR code generation
   */
  generateOtpAuthUri({ secret, email, issuer = 'Axiocruit' }) {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedEmail = encodeURIComponent(email);
    return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
  }

  /**
   * Hash a plaintext backup recovery code using SHA-256
   */
  hashCode(code) {
    const normalized = String(code).trim().replace(/[\s-]/g, '').toUpperCase();
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Generate 10 cryptographically secure backup recovery codes
   */
  generateRecoveryCodes(count = 10) {
    const plainCodes = [];
    const hashedCodes = [];

    for (let i = 0; i < count; i++) {
      const raw = crypto.randomBytes(6).toString('hex').toUpperCase(); // 12 chars
      const formatted = `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
      plainCodes.push(formatted);
      hashedCodes.push({
        codeHash: this.hashCode(formatted),
        used: false,
        usedAt: null,
      });
    }

    return {
      plainCodes,
      hashedCodes,
    };
  }

  /**
   * Verify an unused recovery code and return its index
   */
  verifyRecoveryCode(plainCode, userRecoveryCodes = []) {
    if (!plainCode || !Array.isArray(userRecoveryCodes)) {
      return { valid: false, codeIndex: -1 };
    }

    const targetHash = this.hashCode(plainCode);

    for (let i = 0; i < userRecoveryCodes.length; i++) {
      const codeRecord = userRecoveryCodes[i];
      if (!codeRecord.used && codeRecord.codeHash === targetHash) {
        return { valid: true, codeIndex: i };
      }
    }

    return { valid: false, codeIndex: -1 };
  }
}

const mfaService = new MfaService();

module.exports = mfaService;
