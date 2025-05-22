// src/shared/utils/crypto.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class CryptoUtils {
    /**
     * Hash password using bcrypt
     */
    static async hashPassword(password, saltRounds = 12) {
        return await bcrypt.hash(password, saltRounds);
    }

    /**
     * Compare password with hash
     */
    static async comparePassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    /**
     * Generate secure random token
     */
    static generateToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Generate UUID v4
     */
    static generateUUID() {
        return crypto.randomUUID();
    }

    /**
     * Hash string using SHA256
     */
    static hashSHA256(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Encrypt data using AES-256-GCM
     */
    static encrypt(text, key) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-gcm', key);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    /**
     * Decrypt data using AES-256-GCM
     */
    static decrypt(encryptedData, key) {
        const decipher = crypto.createDecipher('aes-256-gcm', key);

        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}

module.exports = CryptoUtils;