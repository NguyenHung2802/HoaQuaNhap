#!/usr/bin/env node
/**
 * Sao lưu PostgreSQL: pg_dump -> gzip -> /var/backups/hoaqua (mặc định), giữ N ngày gần nhất.
 *
 * Chạy tay:   node scripts/backup-db.js
 * Cron 3h sáng: 0 3 * * * cd /đường/dẫn/WebHoaQua && node scripts/backup-db.js >> logs/backup.log 2>&1
 *
 * Biến môi trường (tùy chọn):
 *   BACKUP_DIR      thư mục lưu (mặc định /var/backups/hoaqua)
 *   BACKUP_KEEP_DAYS số ngày giữ (mặc định 7)
 *   BACKUP_MIN_FREE_MB dung lượng trống tối thiểu để chạy (mặc định 1024)
 *   RCLONE_REMOTE   nếu đặt (vd gdrive:hoaqua-backup) thì sao chép bản mới ra ngoài VPS bằng rclone
 *
 * Mật khẩu DB lấy từ DATABASE_URL trong .env và truyền cho pg_dump qua biến môi trường PGPASSWORD
 * (không xuất hiện trên dòng lệnh nên không lộ trong `ps`). Cần cài postgresql-client (pg_dump).
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { spawn, spawnSync } = require('child_process');
const { pipeline } = require('stream');

const ROOT = path.join(__dirname, '..');

/** Đọc DATABASE_URL từ .env (không in ra màn hình). */
function readDatabaseUrl(envPath = path.join(ROOT, '.env')) {
    if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
    const text = fs.readFileSync(envPath, 'utf8');
    const m = text.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m);
    if (!m) throw new Error('Không tìm thấy DATABASE_URL trong .env');
    return m[1].trim().replace(/^["']|["']$/g, '');
}

/** postgresql://user:pass@host:5432/db?schema=public -> biến môi trường libpq. */
function parseDatabaseUrl(url) {
    const u = new URL(url);
    if (!/^postgres(ql)?:$/.test(u.protocol)) throw new Error('DATABASE_URL không phải PostgreSQL.');
    return {
        PGHOST: u.hostname || 'localhost',
        PGPORT: u.port || '5432',
        PGUSER: decodeURIComponent(u.username),
        PGPASSWORD: decodeURIComponent(u.password),
        PGDATABASE: decodeURIComponent(u.pathname.replace(/^\//, ''))
    };
}

/** Xóa file db-*.sql.gz cũ hơn keepDays ngày. Trả về danh sách đã xóa. */
function pruneOldBackups(dir, keepDays, now = Date.now()) {
    const removed = [];
    const cutoff = now - keepDays * 86400000;
    for (const name of fs.readdirSync(dir)) {
        if (!/^db-\d{8}-\d{6}\.sql\.gz$/.test(name)) continue; // chỉ đụng file do script này tạo
        const full = path.join(dir, name);
        if (fs.statSync(full).mtimeMs < cutoff) {
            fs.unlinkSync(full);
            removed.push(name);
        }
    }
    return removed;
}

function freeMb(dir) {
    try {
        const s = fs.statfsSync(dir);
        return Math.floor((s.bavail * s.bsize) / 1048576);
    } catch (e) {
        return Infinity; // không đọc được thì không chặn
    }
}

const stamp = (d = new Date()) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

async function main() {
    const dir = process.env.BACKUP_DIR || '/var/backups/hoaqua';
    const keepDays = parseInt(process.env.BACKUP_KEEP_DAYS || '7', 10);
    const minFree = parseInt(process.env.BACKUP_MIN_FREE_MB || '1024', 10);

    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const free = freeMb(dir);
    if (free < minFree) throw new Error(`Ổ đĩa chỉ còn ${free}MB trống (< ${minFree}MB), bỏ qua sao lưu để không làm đầy VPS.`);

    const env = { ...process.env, ...parseDatabaseUrl(readDatabaseUrl()) };
    const out = path.join(dir, `db-${stamp()}.sql.gz`);
    const tmp = out + '.tmp';

    await new Promise((resolve, reject) => {
        const dump = spawn('pg_dump', ['--no-owner', '--no-privileges'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
        let err = '';
        dump.stderr.on('data', (c) => { err += c; });
        dump.on('error', (e) => reject(new Error(e.code === 'ENOENT' ? 'Không tìm thấy pg_dump (cài: sudo apt install postgresql-client).' : e.message)));
        const file = fs.createWriteStream(tmp, { mode: 0o600 });
        pipeline(dump.stdout, zlib.createGzip({ level: 9 }), file, (e) => {
            if (e) return reject(e);
            dump.on('close', (code) => (code === 0 ? resolve() : reject(new Error('pg_dump lỗi: ' + err.trim()))));
            if (dump.exitCode !== null) dump.emit('close', dump.exitCode);
        });
    }).catch((e) => { try { fs.unlinkSync(tmp); } catch (x) { /* không có file tạm */ } throw e; });

    fs.renameSync(tmp, out);
    const sizeMb = (fs.statSync(out).size / 1048576).toFixed(2);
    console.log(`[${new Date().toISOString()}] Đã sao lưu: ${out} (${sizeMb}MB)`);

    const removed = pruneOldBackups(dir, keepDays);
    if (removed.length) console.log(`Đã xóa ${removed.length} bản cũ hơn ${keepDays} ngày.`);

    if (process.env.RCLONE_REMOTE) {
        const r = spawnSync('rclone', ['copy', out, process.env.RCLONE_REMOTE], { stdio: 'inherit' });
        if (r.status !== 0) throw new Error('rclone copy thất bại (bản sao lưu cục bộ vẫn còn).');
        console.log('Đã sao chép ra ngoài VPS:', process.env.RCLONE_REMOTE);
    } else {
        console.log('Lưu ý: chưa đặt RCLONE_REMOTE, bản sao lưu chỉ nằm trên chính VPS này.');
    }
}

if (require.main === module) {
    main().catch((e) => {
        console.error(`[${new Date().toISOString()}] SAO LƯU THẤT BẠI: ${e.message}`);
        process.exit(1);
    });
}

module.exports = { parseDatabaseUrl, pruneOldBackups, readDatabaseUrl, stamp };
