/**
 * Quản lý API key cho tích hợp (n8n...). Key chỉ hiển thị một lần khi tạo, DB lưu hash SHA-256.
 */
const crypto = require('crypto');
const prisma = require('../../config/db');

const KEY_REGEX = /^hq_[A-Za-z0-9_-]{43}$/;
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;
const lastTouch = new Map();

const hashKey = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

async function createKey(name, scopes = 'posts:write') {
    const cleanName = String(name || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (!cleanName) throw new Error('Tên API key không được để trống.');
    const raw = 'hq_' + crypto.randomBytes(32).toString('base64url');
    const record = await prisma.apiKey.create({
        data: { name: cleanName, key_prefix: raw.slice(0, 10), key_hash: hashKey(raw), scopes }
    });
    return { record, raw };
}

async function listKeys() {
    return prisma.apiKey.findMany({ orderBy: { created_at: 'desc' } });
}

async function revokeKey(id) {
    return prisma.apiKey.update({
        where: { id },
        data: { is_active: false, revoked_at: new Date() }
    });
}

/** @returns {Promise<object|null>} bản ghi ApiKey nếu hợp lệ và đang hoạt động */
async function verifyKey(raw) {
    if (typeof raw !== 'string' || !KEY_REGEX.test(raw)) return null;
    const record = await prisma.apiKey.findUnique({ where: { key_hash: hashKey(raw) } });
    if (!record || !record.is_active || record.revoked_at) return null;
    const now = Date.now();
    if (now - (lastTouch.get(record.id) || 0) > TOUCH_INTERVAL_MS) {
        lastTouch.set(record.id, now);
        prisma.apiKey.update({ where: { id: record.id }, data: { last_used_at: new Date() } }).catch(() => {});
    }
    return record;
}

function hasScope(record, scope) {
    return String(record.scopes || '').split(',').map((s) => s.trim()).includes(scope);
}

module.exports = { createKey, listKeys, revokeKey, verifyKey, hasScope, hashKey, KEY_REGEX };
