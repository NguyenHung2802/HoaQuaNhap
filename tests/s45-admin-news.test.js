// Kiểm thử S45: admin Tin tức ẩn (danh sách, tạo/sửa, xem trước, bật/tắt, cài đặt) qua HTTP thật,
// render đủ layout admin. DB và Cloudinary giả lập; đăng nhập admin được giả lập.
// Chạy: node tests/s45-admin-news.test.js (sau khi npm install).
const path = require('path');
const assert = require('assert');
const Module = require('module');
const { Writable } = require('stream');

const root = path.join(__dirname, '..');
process.env.NODE_ENV = 'test';

/* ---------- DB giả (thay cả @prisma/client để mọi module dùng chung) ---------- */
const db = { posts: [], settings: [], stats: [], users: [{ id: 1, role: 'admin' }], pid: 1 };
const p2002 = (target) => Object.assign(new Error('Unique'), { code: 'P2002', meta: { target } });
const match = (p, where = {}) => Object.entries(where).every(([k, v]) => p[k] === v);
const fakePrisma = {
    user: { findFirst: async () => db.users[0] },
    category: { findMany: async () => [] },
    setting: {
        findMany: async ({ where } = {}) => db.settings.filter((s) => !where || !where.key || s.key.startsWith(where.key.startsWith)),
        upsert: async ({ where, update, create }) => {
            const r = db.settings.find((s) => s.key === where.key);
            if (r) Object.assign(r, update); else db.settings.push({ ...create });
        }
    },
    newsStatDaily: {
        groupBy: async ({ where }) => {
            const out = {};
            db.stats.filter((s) => where.post_id.in.includes(s.post_id)).forEach((s) => {
                const k = s.post_id + '|' + s.event; out[k] = out[k] || { post_id: s.post_id, event: s.event, _sum: { count: 0 } }; out[k]._sum.count += s.count;
            });
            return Object.values(out);
        }
    },
    blogPost: {
        findUnique: async ({ where }) => db.posts.find((p) => (where.id && p.id === where.id) || (where.slug && p.slug === where.slug) || (where.source_external_id && p.source === where.source_external_id.source && p.external_id === where.source_external_id.external_id)) || null,
        findMany: async ({ where, skip = 0, take = 100 }) => db.posts.filter((p) => match(p, where)).sort((a, b) => b.id - a.id).slice(skip, skip + take).map((p) => ({ ...p, author: { full_name: 'Admin' } })),
        count: async ({ where } = {}) => db.posts.filter((p) => match(p, where)).length,
        create: async ({ data }) => {
            if (db.posts.some((p) => p.slug === data.slug)) throw p2002(['slug']);
            const r = { id: db.pid++, gallery: null, created_at: new Date(), updated_at: new Date(), ...data }; db.posts.push(r); return r;
        },
        update: async ({ where, data }) => { const r = db.posts.find((p) => p.id === where.id); Object.assign(r, data); return r; },
        delete: async ({ where }) => { db.posts = db.posts.filter((p) => p.id !== where.id); }
    }
};

/* ---------- Cloudinary giả ---------- */
let uploads = 0;
const fakeCloud = {
    uploader: {
        upload_stream: (opts, cb) => new Writable({ write(_c, _e, n) { n(); }, final(done) { uploads++; cb(null, { secure_url: `https://res.cloudinary.com/demo/image/upload/v1/n${uploads}.jpg`, public_id: 'n' + uploads }); done(); } }),
        upload: async () => { uploads++; return { secure_url: `https://res.cloudinary.com/demo/image/upload/v1/r${uploads}.jpg`, public_id: 'r' + uploads }; },
        destroy: async () => {}
    }
};
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
    if (request === '@prisma/client') return { PrismaClient: function () { return fakePrisma; } };
    if (parent) {
        try { if (Module._resolveFilename(request, parent, isMain) === path.join(root, 'src/config/cloudinary.js')) return fakeCloud; } catch (e) { /* bỏ qua */ }
    }
    return origLoad.apply(this, arguments);
};

// Giả lập đã đăng nhập admin (isAdmin được destructure khi nạp admin.route nên phải thay trước khi nạp app).
const auth = require(path.join(root, 'src/middlewares/auth.middleware.js'));
auth.isAdmin = (req, res, next) => { req.session.user = { id: 1, role: 'admin', full_name: 'Admin Test' }; next(); };

const app = require(path.join(root, 'src/app.js'));
const newsSettings = require(path.join(root, 'src/modules/settings/news-settings.service.js'));

let pass = 0, failN = 0;
const t = async (name, fn) => { try { await fn(); pass++; console.log('ok  ', name); } catch (e) { failN++; console.log('FAIL', name, '\n    ', e.message); } };

(async () => {
    const server = app.listen(0);
    const origin = `http://127.0.0.1:${server.address().port}`;
    let cookie = '';
    const call = async (url, opts = {}) => {
        const r = await fetch(origin + url, { redirect: 'manual', ...opts, headers: { ...(opts.headers || {}), Cookie: cookie } });
        const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
        if (sc.length) cookie = sc.map((c) => c.split(';')[0]).join('; ');
        return r;
    };
    const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200)]);
    const form = (fields, files = {}) => {
        const fd = new FormData();
        Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
        Object.entries(files).forEach(([k, v]) => fd.append(k, new Blob([v]), k + '.jpg'));
        return fd;
    };
    const text = async (r) => r.text();

    await t('GET /admin/news (rỗng) render đủ layout + sidebar', async () => {
        const r = await call('/admin/news'); const h = await text(r);
        assert.strictEqual(r.status, 200); assert(h.includes('Chưa có tin ẩn nào')); assert(h.includes('href="/admin/news"') && h.includes('Tin tức ẩn')); assert(h.includes('API Keys'));
    });
    await t('GET /admin/news/create render form', async () => { const r = await call('/admin/news/create'); const h = await text(r); assert.strictEqual(r.status, 200); assert(h.includes('name="affiliate_url"') && h.includes('name="ad_image"')); });

    await t('tạo nháp có ảnh bìa -> 302 sang trang sửa; DB đúng', async () => {
        const r = await call('/admin/news', { method: 'POST', body: form({ title: 'Tin dự án đất vùng ven', content: '<p>Nội dung <script>x()</script>ok</p>', status: 'draft' }, { cover: jpeg }) });
        assert.strictEqual(r.status, 302); assert.strictEqual(r.headers.get('location'), '/admin/news/edit/1');
        const p = db.posts[0];
        assert.strictEqual(p.post_type, 'news'); assert.strictEqual(p.is_published, false); assert.strictEqual(p.slug, 'tin-du-an-dat-vung-ven');
        assert(/^[A-Za-z0-9_-]{22}$/.test(p.access_token)); assert(/^\d{2}-\d{2}-\d{4}$/.test(p.url_date)); assert(p.thumbnail_url.includes('/image/upload/'));
        assert(!p.content.includes('script'));
    });
    await t('trang sửa hiện link đầy đủ (flash thành công) và nút xem trước', async () => {
        const r = await call('/admin/news/edit/1'); const h = await text(r);
        assert.strictEqual(r.status, 200); assert(h.includes('/tin-tuc/') && h.includes(db.posts[0].access_token)); assert(h.includes('Đã lưu bản nháp')); assert(h.includes('/admin/news/preview/1'));
        assert(h.includes('value="Tin dự án đất vùng ven"'));
    });
    await t('xem trước bản nháp (admin) -> 200, cảnh báo chưa có link affiliate', async () => {
        const r = await call('/admin/news/preview/1'); const h = await text(r);
        assert.strictEqual(r.status, 200); assert(h.includes('bản nháp')); assert(h.includes('Chưa có link affiliate')); assert(!h.includes('<script>x()'));
    });
    await t('đăng + gắn affiliate riêng -> link mặc định không dùng', async () => {
        const r = await call('/admin/news/edit/1', { method: 'POST', body: form({ title: 'Tin dự án đất vùng ven', content: '<p>Nội dung</p>', status: 'published', affiliate_url: 'https://s.shopee.vn/abc', ad_headline: 'Giảm 50%', ad_cta_text: 'Mua ngay' }) });
        assert.strictEqual(r.status, 302);
        const p = db.posts[0]; assert.strictEqual(p.is_published, true); assert(p.published_at); assert.strictEqual(p.affiliate_url, 'https://s.shopee.vn/abc'); assert.strictEqual(p.ad_headline, 'Giảm 50%');
        assert.strictEqual(p.slug, 'tin-du-an-dat-vung-ven');
    });
    await t('affiliate host lạ -> 400, giữ dữ liệu đã nhập, content bị làm sạch', async () => {
        const r = await call('/admin/news', { method: 'POST', body: form({ title: 'Bài lỗi', content: '<p>giữ</p><script>alert(1)</script>', status: 'draft', affiliate_url: 'https://evil.com/x' }) });
        const h = await text(r);
        assert.strictEqual(r.status, 400); assert(h.includes('không nằm trong danh sách affiliate')); assert(h.includes('value="Bài lỗi"')); assert(h.includes('giữ')); assert(!h.includes('alert(1)'));
        assert.strictEqual(db.posts.length, 1);
    });
    await t('thiếu nội dung -> 400', async () => { const r = await call('/admin/news', { method: 'POST', body: form({ title: 'Không nội dung', content: '', status: 'draft' }) }); assert.strictEqual(r.status, 400); assert((await text(r)).includes('Thiếu nội dung')); });
    await t('ảnh quá 5MB -> báo flash, không lỗi 500', async () => {
        const big = Buffer.concat([jpeg, Buffer.alloc(6 * 1024 * 1024)]);
        const r = await call('/admin/news', { method: 'POST', body: form({ title: 'Ảnh to', content: '<p>x</p>' }, { cover: big }) });
        assert.strictEqual(r.status, 302); assert.strictEqual(r.headers.get('location'), '/admin/news/create');
        assert((await text(await call('/admin/news/create'))).includes('vượt quá 5MB'));
    });

    await t('danh sách: bài đã đăng có nút sao chép + thống kê cộng dồn', async () => {
        db.stats.push({ post_id: 1, event: 'view', count: 120 }, { post_id: 1, event: 'view', count: 30 }, { post_id: 1, event: 'popup_show', count: 100 }, { post_id: 1, event: 'cta_popup', count: 7 }, { post_id: 1, event: 'cta_banner', count: 3 });
        const h = await text(await call('/admin/news'));
        assert(h.includes('copy-link') && h.includes('data-link="http')); assert(h.includes('>150<')); assert(h.includes('>100<')); assert(h.includes('>10<')); assert(h.includes('Link riêng'));
    });
    await t('lọc theo trạng thái', async () => { assert((await text(await call('/admin/news?status=draft'))).includes('Chưa có tin ẩn nào trong mục này')); assert((await text(await call('/admin/news?status=published'))).includes('Tin dự án đất vùng ven')); });
    await t('bật/tắt: gỡ về nháp rồi đăng lại', async () => {
        assert.strictEqual((await call('/admin/news/1/toggle', { method: 'POST' })).status, 302); assert.strictEqual(db.posts[0].is_published, false);
        await call('/admin/news/1/toggle', { method: 'POST' }); assert.strictEqual(db.posts[0].is_published, true);
    });
    await t('id không tồn tại -> chuyển về danh sách', async () => { for (const u of ['/admin/news/edit/999', '/admin/news/preview/999', '/admin/news/edit/abc']) { const r = await call(u); assert.strictEqual(r.status, 302); assert.strictEqual(r.headers.get('location'), '/admin/news'); } });

    await t('admin blog không sửa/xóa nhầm tin ẩn', async () => {
        const u = await call('/admin/blogs/edit/1', { method: 'POST', body: form({ title: 'Hack', content: 'x' }) });
        assert.strictEqual(u.status, 302); assert.strictEqual(u.headers.get('location'), '/admin/blogs'); assert.strictEqual(db.posts[0].title, 'Tin dự án đất vùng ven');
        const d = await (await call('/admin/blogs/1', { method: 'DELETE' })).json(); assert.strictEqual(d.success, false); assert.strictEqual(db.posts.length, 1);
        assert.strictEqual((await call('/admin/blogs/edit/1')).status, 302);
    });

    await t('cài đặt: xem', async () => { const r = await call('/admin/news/settings'); const h = await text(r); assert.strictEqual(r.status, 200); assert(h.includes('name="host"') && h.includes('shopee.vn')); });
    await t('cài đặt: lưu hợp lệ -> upsert + xóa cache', async () => {
        const r = await call('/admin/news/settings', { method: 'POST', body: new URLSearchParams({ enabled: 'on', host: 'tin.example.com', default_affiliate_url: 'https://vt.tiktok.com/ZS123/', affiliate_hosts: 'tiktok.com\nshopee.vn', popup_delay_ms: '2000' }), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        assert.strictEqual(r.status, 302);
        const s = await newsSettings.get(); assert.strictEqual(s.host, 'tin.example.com'); assert.strictEqual(s.defaultAffiliateUrl, 'https://vt.tiktok.com/ZS123/'); assert.strictEqual(s.popupDelayMs, 2000); assert.deepStrictEqual(s.affiliateHosts, ['tiktok.com', 'shopee.vn']); assert.strictEqual(s.enabled, true);
    });
    await t('cài đặt: link mặc định host lạ / host sai / delay sai bị từ chối', async () => {
        const post = (o) => call('/admin/news/settings', { method: 'POST', body: new URLSearchParams({ enabled: 'on', host: 'tin.example.com', default_affiliate_url: '', affiliate_hosts: 'shopee.vn', popup_delay_ms: '1500', ...o }), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        for (const bad of [{ default_affiliate_url: 'https://evil.com/x' }, { host: 'bad host!' }, { host: 'localhost' }, { popup_delay_ms: '-5' }, { affiliate_hosts: 'a b$' }]) {
            const r = await post(bad); assert.strictEqual(r.headers.get('location'), '/admin/news/settings');
            assert.strictEqual((await newsSettings.get(true)).host, 'tin.example.com', JSON.stringify(bad));
        }
    });
    await t('tắt khu tin ẩn từ cài đặt -> hiển thị cảnh báo ở danh sách', async () => {
        await call('/admin/news/settings', { method: 'POST', body: new URLSearchParams({ host: 'tin.example.com', affiliate_hosts: '', popup_delay_ms: '1500' }), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        assert((await text(await call('/admin/news'))).includes('đang TẮT'));
    });
    await t('xóa: JSON thành công; id lạ thất bại', async () => {
        assert.strictEqual((await (await call('/admin/news/1', { method: 'DELETE' })).json()).success, true); assert.strictEqual(db.posts.length, 0);
        assert.strictEqual((await (await call('/admin/news/1', { method: 'DELETE' })).json()).success, false);
    });

    console.log(`\nTổng ok: ${pass}, lỗi: ${failN}`);
    server.close(); process.exit(failN ? 1 : 0);
})();
