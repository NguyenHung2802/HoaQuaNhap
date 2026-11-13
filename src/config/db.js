/**
 * PrismaClient DÙNG CHUNG cho toàn bộ ứng dụng.
 * Mỗi PrismaClient mở riêng một pool kết nối PostgreSQL (mặc định 2×CPU+1), nên tuyệt đối không tạo
 * `new PrismaClient()` ở từng module — trên VPS 1GB việc đó làm PostgreSQL cạn kết nối và RAM.
 * Giới hạn pool bằng tham số trong DATABASE_URL, ví dụ: ...?schema=public&connection_limit=5
 */
const { PrismaClient } = require('@prisma/client');

const log = ['warn', 'error'];
if (process.env.NODE_ENV === 'development' && process.env.PRISMA_LOG_QUERIES === '1') log.unshift('query');

const prisma = new PrismaClient({ log });

module.exports = prisma;
