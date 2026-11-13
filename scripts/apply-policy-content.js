#!/usr/bin/env node
/**
 * Nạp nội dung Chính sách bảo mật + Chính sách đổi trả (prisma/policy-content.js) vào bảng Setting.
 *
 *   node scripts/apply-policy-content.js          chỉ ghi đè khi nội dung hiện tại còn là bản nháp ngắn (< 400 ký tự)
 *   node scripts/apply-policy-content.js --force  ghi đè luôn (MẤT các chỉnh sửa tay trong admin)
 *
 * An toàn: mặc định KHÔNG đụng vào trang mà admin đã tự viết dài hơn bản nháp.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');
const policies = require('../prisma/policy-content');

const PAGES = [
    { key: 'privacy_policy', description: 'Chính sách bảo mật' },
    { key: 'return_policy', description: 'Chính sách đổi trả' }
];

async function main() {
    const force = process.argv.includes('--force');
    const prisma = new PrismaClient();
    try {
        for (const p of PAGES) {
            const html = policies[p.key];
            const current = await prisma.setting.findUnique({ where: { key: p.key } });
            if (!current) {
                await prisma.setting.create({ data: { key: p.key, description: p.description, group_key: 'static_page', value: html } });
                console.log(`+ ${p.key}: đã tạo mới`);
            } else if (force || String(current.value || '').length < 400) {
                await prisma.setting.update({ where: { key: p.key }, data: { value: html, group_key: 'static_page' } });
                console.log(`~ ${p.key}: đã cập nhật (${String(current.value || '').length} -> ${html.length} ký tự)`);
            } else {
                console.log(`= ${p.key}: giữ nguyên (đã có nội dung dài ${current.value.length} ký tự; dùng --force để ghi đè)`);
            }
        }
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((e) => { console.error('Lỗi:', e.message); process.exit(1); });
