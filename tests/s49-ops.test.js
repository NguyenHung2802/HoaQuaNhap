// Kiểm thử S49 (vận hành VPS 1GB): một PrismaClient duy nhất, cache menu danh mục, /healthz,
// cấu hình PM2 và script không đụng n8n. DB giả lập trong bộ nhớ.
// Chạy: node tests/s49-ops.test.js (sau khi npm install).
const path = require('path');
const fs = require('fs');
const http = require('http');
const assert = require('assert');
const Module = require('module');

const root = path.join(__dirname, '..');
process.env.NODE_ENV = 'test';

const db = { catQueries: 0, failCats: false, failRaw: false, cats: [
    { id: 1, name: 'Trái cây Mỹ', slug: 'my', is_active: true, parent_id: null, sort_order: 1 },
    { id: 2, name: 'Nho', slug: 'nho', is_active: true, parent_id: 1, sort_order: 1 },
    { id: 3, name: 'Ẩn', slug: 'an', is_active: false, parent_id: null, sort_order: 2 }
] };
let clients = 0;
function FakePrisma() {
    clients++;
    return {
        category: {
            findMany: async ({ where }) => { db.catQueries++; if (db.failCats) throw new Error('DB down'); return db.cats.filter((c) => !where || where.is_active === undefined || c.is_active === where.is_active).map((c) => ({ ...c })); },
            create: async ({ data }) => { const r = { id: db.cats.length + 1, is_active: true, parent_id: null, sort_order: 9, ...data }; db.cats.push(r); return r; },
            update: async ({ where, data }) => { const r = db.cats.find((c) => c.id === where.id); Object.assign(r, data); return r; },
            delete: async ({ where }) => { db.cats = db.cats.filter((c) => c.id !== where.id); }
        },
        product: { count: async () => 0 },
        setting: { findMany: async () => [] },
        $queryRaw: async () => { if (db.failRaw) throw new Error('no db'); return [{ '?column?': 1 }]; }
    };
}
const origLoad = Module._load;
Module._load = function (request) {
    if (request === '@prisma/client') return { PrismaClient: FakePrisma };
    return origLoad.apply(this, arguments);
};

const app = require(path.join(root, 'src/app.js'));
const cache = require(path.join(root, 'src/utils/category-cache.js'));
const categoriesService = require(path.join(root, 'src/modules/categories/categories.service.js'));

let pass = 0, failN = 0;
const t = async (name, fn) => { try { await fn(); pass++; console.log('ok  ', name); } catch (e) { failN++; console.log('FAIL', name, '\n    ', e.message); } };

(async () => {
    const server = app.listen(0);
    const port = server.address().port;
    const get = (p, host = 'haianhfruit.com') => new Promise((resolve, reject) => {
        http.get({ host: '127.0.0.1', port, path: p, headers: { Host: host } }, (res) => { let b = ''; res.setEncoding('utf8'); res.on('data', (c) => { b += c; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: b })); }).on('error', reject);
    });

    await t('toàn bộ ứng dụng (kể cả mọi route/controller/service) chỉ tạo ĐÚNG MỘT PrismaClient', async () => {
        assert.strictEqual(clients, 1, 'clients=' + clients);
    });
    await t('mã nguồn không còn `new PrismaClient(` ngoài config/db.js', async () => {
        const offenders = [];
        const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
            const p = path.join(d, e.name);
            if (e.isDirectory()) return walk(p);
            if (e.name.endsWith('.js') && /new PrismaClient\(/.test(fs.readFileSync(p, 'utf8')) && !p.replace(/\\/g, '/').endsWith('src/config/db.js')) offenders.push(p);
        });
        walk(path.join(root, 'src'));
        assert.deepStrictEqual(offenders, []);
    });

    await t('cache menu: nhiều request chỉ truy vấn danh mục 1 lần', async () => {
        cache.invalidate(); db.catQueries = 0;
        for (let i = 0; i < 6; i++) { const r = await get('/khong-ton-tai'); assert.strictEqual(r.status, 404); }
        assert.strictEqual(db.catQueries, 1, 'queries=' + db.catQueries);
    });
    await t('menu hiển thị đúng cây (danh mục cha có con, bỏ danh mục ẩn)', async () => {
        cache.invalidate(); const tree = await cache.getTree();
        assert.strictEqual(tree.length, 1); assert.strictEqual(tree[0].name, 'Trái cây Mỹ'); assert.deepStrictEqual(tree[0].children.map((c) => c.name), ['Nho']);
        const html = (await get('/khong-ton-tai')).body; assert(html.includes('Trái cây Mỹ'));
    });
    await t('truy vấn đồng thời chỉ dựng cây một lần', async () => {
        cache.invalidate(); db.catQueries = 0; await Promise.all(Array.from({ length: 10 }, () => cache.getTree())); assert.strictEqual(db.catQueries, 1);
    });
    await t('admin tạo danh mục -> cache bị xóa, menu cập nhật ngay', async () => {
        await cache.getTree(); const before = db.catQueries;
        await categoriesService.createCategory({ name: 'Danh mục mới', slug: 'moi', description: '', is_active: 'true' });
        const html = (await get('/khong-ton-tai')).body;
        assert(db.catQueries > before, 'phải truy vấn lại'); assert(html.includes('Danh mục mới'));
    });
    await t('sửa/xóa danh mục cũng xóa cache', async () => {
        await cache.getTree(); let q = db.catQueries;
        await categoriesService.updateCategory(1, { name: 'Trái cây Mỹ (đổi tên)', slug: 'my', description: '', is_active: true }); await cache.getTree(); assert(db.catQueries > q); q = db.catQueries;
        await categoriesService.deleteCategory(4); await cache.getTree(); assert(db.catQueries > q);
    });
    await t('hết hạn sau 5 phút thì dựng lại', async () => {
        await cache.getTree(); const q = db.catQueries; const realNow = Date.now;
        Date.now = () => realNow() + cache.TTL_MS + 1000; try { await cache.getTree(); } finally { Date.now = realNow; }
        assert.strictEqual(db.catQueries, q + 1);
    });
    await t('DB lỗi tạm thời: giữ menu cũ; chưa có cache mà lỗi: trang vẫn hiển thị (menu rỗng)', async () => {
        await cache.getTree(); const realNow = Date.now; Date.now = () => realNow() + cache.TTL_MS + 1000; db.failCats = true;
        try { const tree = await cache.getTree(); assert(tree.length >= 1, 'phải dùng bản cũ'); } finally { Date.now = realNow; }
        cache.invalidate(); const r = await get('/khong-ton-tai'); db.failCats = false;
        assert.strictEqual(r.status, 404); assert(r.body.length > 500, 'trang vẫn render');
    });

    await t('/healthz: 200 JSON nhẹ, không cache, không cookie', async () => {
        const r = await get('/healthz'); assert.strictEqual(r.status, 200); const j = JSON.parse(r.body);
        assert.strictEqual(j.status, 'ok'); assert(Number.isInteger(j.rssMb) && j.rssMb > 0); assert(j.uptimeSec >= 0); assert.strictEqual(r.headers['cache-control'], 'no-store'); assert(!r.headers['set-cookie']); assert(!('db' in j));
    });
    await t('/healthz?db=1: kiểm tra DB; lỗi DB -> 503 degraded', async () => {
        assert.strictEqual(JSON.parse((await get('/healthz?db=1')).body).db, 'ok');
        db.failRaw = true; const r = await get('/healthz?db=1'); db.failRaw = false;
        assert.strictEqual(r.status, 503); assert.strictEqual(JSON.parse(r.body).status, 'degraded');
    });

    await t('PM2 prod: 1 tiến trình fork, giới hạn heap + RAM, đủ thời gian flush khi dừng', async () => {
        const eco = require(path.join(root, 'ecosystem.config.js')); const prod = eco.apps.find((a) => a.name === 'WebHoaQua-Prod');
        assert.strictEqual(prod.instances, 1); assert.strictEqual(prod.exec_mode, 'fork'); assert(/--max-old-space-size=\d+/.test(prod.node_args));
        const mb = parseInt(prod.max_memory_restart, 10); assert(mb <= 300 && mb >= 200, 'max_memory_restart=' + prod.max_memory_restart);
        assert(prod.kill_timeout >= 3000); assert(prod.autorestart === true && prod.watch === false); assert(!eco.apps.some((a) => /n8n/i.test(a.name)));
    });
    await t('script npm pm2:* chỉ nhắm đúng app của web, không dùng "all" (không ảnh hưởng n8n)', async () => {
        const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
        Object.entries(pkg.scripts).filter(([k]) => /^pm2:/.test(k) && !/^pm2:(dev|prod)$/.test(k)).forEach(([k, v]) => {
            assert(!/\ball\b/.test(v), `${k}: ${v}`); assert(/WebHoaQua-(Prod|Dev)/.test(v), `${k}: ${v}`);
        });
        assert(pkg.scripts['prisma:deploy'] === 'prisma migrate deploy');
    });
    await t('script sao lưu: đọc DATABASE_URL an toàn (mật khẩu mã hóa %), chỉ xóa đúng file sao lưu cũ', async () => {
        const b = require(path.join(root, 'scripts/backup-db.js'));
        assert.deepStrictEqual(b.parseDatabaseUrl('postgresql://u:p%40ss%3Aw@db.local:6543/Hoa-Qua?schema=public'), { PGHOST: 'db.local', PGPORT: '6543', PGUSER: 'u', PGPASSWORD: 'p@ss:w', PGDATABASE: 'Hoa-Qua' });
        assert.throws(() => b.parseDatabaseUrl('mysql://u:p@h/db'));
        const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'bk-'));
        const mk = (name, ageDays) => { const f = path.join(dir, name); fs.writeFileSync(f, 'x'); const t2 = (Date.now() - ageDays * 86400000) / 1000; fs.utimesSync(f, t2, t2); };
        mk('db-20260101-030000.sql.gz', 30); mk('db-20261110-030000.sql.gz', 2); mk('khac.txt', 99); mk('db-20260102-030000.sql.gz.tmp', 99);
        const removed = b.pruneOldBackups(dir, 7);
        assert.deepStrictEqual(removed, ['db-20260101-030000.sql.gz']);
        assert.deepStrictEqual(fs.readdirSync(dir).sort(), ['db-20261110-030000.sql.gz', 'db-20260102-030000.sql.gz.tmp', 'khac.txt'].sort());
        fs.rmSync(dir, { recursive: true, force: true });
    });
    await t('tài liệu n8n không còn khóa mã hóa cứng', async () => {
        const doc = fs.readFileSync(path.join(root, 'docs/10-self-host-n8n.md'), 'utf8');
        assert(!/N8N_ENCRYPTION_KEY=\S{40,}/.test(doc), 'vẫn có khóa dài cứng trong tài liệu');
    });

    console.log(`\nTổng ok: ${pass}, lỗi: ${failN}`);
    server.close(); process.exit(failN ? 1 : 0);
})();
