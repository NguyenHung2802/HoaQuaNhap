// Kiểm thử S44: API key + /api/v1/posts qua HTTP thật, với DB và Cloudinary giả lập trong bộ nhớ.
// Chạy: node tests/s44-api-posts.test.js (sau khi npm install). Không cần Postgres hay khóa Cloudinary.
const path = require('path');
const assert = require('assert');
const Module = require('module');

const root = path.join(__dirname, '..');
process.env.NODE_ENV = 'test';

/* ---------- DB giả ---------- */
const db = { apiKeys: [], settings: [], posts: [], users: [{ id: 1, role: 'admin' }], seq: { key: 1, post: 1 } };
const p2002 = (target) => Object.assign(new Error('Unique'), { code: 'P2002', meta: { target } });
const fakePrisma = {
    apiKey: {
        create: async ({ data }) => { const r = { id: db.seq.key++, is_active: true, last_used_at: null, created_at: new Date(), revoked_at: null, ...data }; db.apiKeys.push(r); return r; },
        findUnique: async ({ where }) => db.apiKeys.find((k) => k.key_hash === where.key_hash) || null,
        findMany: async () => db.apiKeys,
        update: async ({ where, data }) => { const r = db.apiKeys.find((k) => k.id === where.id); Object.assign(r, data); return r; }
    },
    setting: { findMany: async () => db.settings },
    user: { findFirst: async () => db.users[0] },
    blogPost: {
        findUnique: async ({ where }) => {
            if (where.slug) return db.posts.find((p) => p.slug === where.slug) || null;
            if (where.id) return db.posts.find((p) => p.id === where.id) || null;
            if (where.source_external_id) return db.posts.find((p) => p.source === where.source_external_id.source && p.external_id === where.source_external_id.external_id) || null;
            return null;
        },
        create: async ({ data }) => {
            if (db.posts.some((p) => p.slug === data.slug)) throw p2002(['slug']);
            if (data.external_id && db.posts.some((p) => p.source === data.source && p.external_id === data.external_id)) throw p2002(['source', 'external_id']);
            const r = { id: db.seq.post++, gallery: null, created_at: new Date(), updated_at: new Date(), ...data };
            db.posts.push(r); return r;
        },
        update: async ({ where, data }) => { const r = db.posts.find((p) => p.id === where.id); Object.assign(r, data); return r; },
        delete: async ({ where }) => { db.posts = db.posts.filter((p) => p.id !== where.id); }
    },
    category: { findMany: async () => [] }
};
const stubs = {};
stubs[path.join(root, 'src/config/db.js')] = fakePrisma;

/* ---------- Cloudinary giả ---------- */
let uploads = 0; const destroyed = [];
const { Writable } = require('stream');
stubs[path.join(root, 'src/config/cloudinary.js')] = {
    uploader: {
        upload_stream: (opts, cb) => new Writable({ write(_c, _e, n) { n(); }, final(done) { uploads++; const id = `x/${opts.resource_type}${uploads}`; cb(null, { secure_url: `https://res.cloudinary.com/demo/${opts.resource_type}/upload/v1/${id}.${opts.resource_type === 'video' ? 'mp4' : 'jpg'}`, public_id: id, width: 10, height: 10, bytes: 5, duration: 1 }); done(); } }),
        upload: async (url, opts) => { uploads++; return { secure_url: `https://res.cloudinary.com/demo/image/upload/v1/remote${uploads}.jpg`, public_id: 'remote' + uploads, width: 1, height: 1 }; },
        destroy: async (id) => { destroyed.push(id); }
    }
};
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
    if (parent) {
        try {
            const resolved = Module._resolveFilename(request, parent, isMain);
            if (stubs[resolved]) return stubs[resolved];
        } catch (e) { /* bỏ qua */ }
    }
    return origLoad.apply(this, arguments);
};

const app = require(path.join(root, 'src/app.js'));
const keysService = require(path.join(root, 'src/modules/api-keys/api-keys.service.js'));
const newsSettings = require(path.join(root, 'src/modules/settings/news-settings.service.js'));

let pass = 0, failN = 0;
const t = async (name, fn) => { try { await fn(); pass++; console.log('ok  ', name); } catch (e) { failN++; console.log('FAIL', name, '\n    ', e.message); } };

(async () => {
    const server = app.listen(0);
    const base = `http://127.0.0.1:${server.address().port}/api/v1/posts`;
    const { raw, record } = await keysService.createKey('n8n test');
    const auth = { Authorization: `Bearer ${raw}` };
    const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200)]);
    const mp4 = (n) => Buffer.concat([Buffer.alloc(4), Buffer.from('ftypisom'), Buffer.alloc(n)]);
    const post = (body, headers = auth) => fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
    const json = async (r) => ({ status: r.status, body: r.status === 204 ? null : await r.json().catch(() => null) });

    await t('không có key -> 401 JSON', async () => { const r = await json(await fetch(base, { method: 'POST' })); assert.strictEqual(r.status, 401); assert.strictEqual(r.body.error.code, 'invalid_api_key'); });
    await t('key sai định dạng -> 401', async () => assert.strictEqual((await post({ title: 'a' }, { Authorization: 'Bearer abc' })).status, 401));
    await t('hash trong DB, không lưu key thô', async () => { assert(!JSON.stringify(db.apiKeys).includes(raw)); assert(record.key_hash.length === 64); });

    let created;
    await t('tạo blog nháp (JSON) -> 201', async () => {
        const r = await json(await post({ title: 'Tin dự án đất vùng ven', content: '<p>Nội dung <script>alert(1)</script><b>đậm</b></p>' }));
        assert.strictEqual(r.status, 201); created = r.body;
        assert.strictEqual(r.body.status, 'draft'); assert.strictEqual(r.body.type, 'blog');
        assert.strictEqual(r.body.slug, 'tin-du-an-dat-vung-ven');
        assert(r.body.url.endsWith('/blog/tin-du-an-dat-vung-ven'));
        assert(!db.posts[0].content.includes('script'));
    });
    await t('trùng tiêu đề -> slug -2', async () => { const r = await json(await post({ title: 'Tin dự án đất vùng ven', content: '<p>x</p>' })); assert.strictEqual(r.body.slug, 'tin-du-an-dat-vung-ven-2'); });

    let news;
    await t('tạo tin ẩn đã đăng, có affiliate -> URL có token', async () => {
        const r = await json(await post({ title: 'Ưu đãi hôm nay', content: '<p>Hot</p>', type: 'news', status: 'published', external_id: 'wf-1', source: 'n8n', affiliate_url: 'https://s.shopee.vn/abc', tags: 'khuyen mai, shopee', video_embed_url: 'https://youtu.be/dQw4w9WgXcQ' }));
        assert.strictEqual(r.status, 201); news = r.body;
        assert.strictEqual(r.body.status, 'published');
        assert(/\/tin-tuc\/\d{2}-\d{2}-\d{4}\/uu-dai-hom-nay\/[A-Za-z0-9_-]{22}$/.test(r.body.url), r.body.url);
        assert(r.body.url.includes('tin.haianhfruit.com'));
        assert.strictEqual(r.body.video_url, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
        const row = db.posts.find((p) => p.id === r.body.id); assert.strictEqual(row.tags, 'khuyen mai,shopee'); assert(row.access_token);
    });
    await t('cùng external_id -> 200, không tạo trùng, không upload lại', async () => {
        const before = db.posts.length, up = uploads;
        const r = await json(await post({ title: 'Khác tiêu đề', content: '<p>x</p>', type: 'news', external_id: 'wf-1', source: 'n8n', cover_url: 'https://cdn.example.com/a.jpg' }));
        assert.strictEqual(r.status, 200); assert.strictEqual(r.body.id, news.id); assert.strictEqual(r.body.created, false);
        assert.strictEqual(db.posts.length, before); assert.strictEqual(uploads, up);
    });
    await t('affiliate host lạ -> 400', async () => { const r = await json(await post({ title: 'a', content: '<p>x</p>', affiliate_url: 'https://evil.com/x' })); assert.strictEqual(r.status, 400); assert.strictEqual(r.body.error.code, 'affiliate_host_not_allowed'); });
    await t('type sai -> 400', async () => assert.strictEqual((await json(await post({ title: 'a', content: 'x', type: 'foo' }))).body.error.code, 'invalid_type'));
    await t('thiếu tiêu đề / nội dung -> 400', async () => { assert.strictEqual((await json(await post({ content: 'x' }))).body.error.code, 'missing_title'); assert.strictEqual((await json(await post({ title: 'a' }))).body.error.code, 'missing_content'); });
    await t('video host lạ -> 400', async () => assert.strictEqual((await json(await post({ title: 'a', content: 'x', video_embed_url: 'https://evil.com/v.mp4' }))).body.error.code, 'unsupported_video_host'));
    await t('JSON hỏng -> 400 JSON', async () => { const r = await json(await fetch(base, { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: '{bad' })); assert.strictEqual(r.status, 400); assert(r.body.error); });
    await t('nội dung 300KB được nhận (giới hạn 2MB)', async () => assert.strictEqual((await post({ title: 'Dài', content: '<p>' + 'a'.repeat(300000) + '</p>' })).status, 201));
    await t('nội dung > 2MB -> 413', async () => assert.strictEqual((await post({ title: 'Quá dài', content: 'a'.repeat(2.2 * 1024 * 1024) })).status, 413));

    await t('multipart: cover + images + video -> 201', async () => {
        const fd = new FormData();
        fd.append('title', 'Bài có ảnh'); fd.append('content', '<p>Ảnh</p>'); fd.append('status', 'published');
        fd.append('cover', new Blob([jpeg], { type: 'image/jpeg' }), 'c.jpg');
        fd.append('images', new Blob([jpeg]), 'a.jpg'); fd.append('images', new Blob([jpeg]), 'b.jpg');
        fd.append('video', new Blob([mp4(100)], { type: 'video/mp4' }), 'v.mp4');
        fd.append('image_urls', JSON.stringify(['https://cdn.example.com/x.jpg']));
        const r = await json(await fetch(base, { method: 'POST', headers: auth, body: fd }));
        assert.strictEqual(r.status, 201, JSON.stringify(r.body));
        assert(r.body.thumbnail_url.includes('/image/upload/')); assert.strictEqual(r.body.gallery.length, 3);
        assert(r.body.video_url.includes('/video/upload/'));
    });
    await t('multipart: file giả ảnh -> 415 và dọn media đã upload', async () => {
        const d0 = destroyed.length;
        const fd = new FormData();
        fd.append('title', 'Ảnh giả'); fd.append('content', '<p>x</p>');
        fd.append('cover', new Blob([jpeg]), 'c.jpg'); fd.append('images', new Blob([Buffer.from('<html>not image at all</html>')]), 'x.jpg');
        const r = await json(await fetch(base, { method: 'POST', headers: auth, body: fd }));
        assert.strictEqual(r.status, 415); assert.strictEqual(r.body.error.code, 'unsupported_media');
        assert(destroyed.length > d0, 'phải xóa cover đã upload');
    });
    await t('multipart: video > 20MB -> 413', async () => {
        const fd = new FormData(); fd.append('title', 'V'); fd.append('content', 'x'); fd.append('video', new Blob([mp4(21 * 1024 * 1024)]), 'v.mp4');
        assert.strictEqual((await json(await fetch(base, { method: 'POST', headers: auth, body: fd }))).status, 413);
    });
    await t('multipart: tên trường file lạ -> 400', async () => {
        const fd = new FormData(); fd.append('title', 'V'); fd.append('content', 'x'); fd.append('hack', new Blob([jpeg]), 'a.jpg');
        assert.strictEqual((await json(await fetch(base, { method: 'POST', headers: auth, body: fd }))).body.error.code, 'unexpected_file');
    });

    await t('GET /:id', async () => { const r = await json(await fetch(`${base}/${created.id}`, { headers: auth })); assert.strictEqual(r.status, 200); assert.strictEqual(r.body.id, created.id); });
    await t('GET id không tồn tại -> 404; id sai -> 400', async () => { assert.strictEqual((await fetch(`${base}/9999`, { headers: auth })).status, 404); assert.strictEqual((await fetch(`${base}/abc`, { headers: auth })).status, 400); });
    await t('PUT đăng bài (draft -> published) giữ nguyên slug', async () => {
        const r = await json(await fetch(`${base}/${created.id}`, { method: 'PUT', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'published', slug: 'doi-slug', title: 'Tiêu đề mới' }) }));
        assert.strictEqual(r.status, 200); assert.strictEqual(r.body.status, 'published'); assert(r.body.published_at); assert.strictEqual(r.body.slug, 'tin-du-an-dat-vung-ven'); assert.strictEqual(r.body.title, 'Tiêu đề mới');
    });
    await t('PUT gỡ affiliate bằng chuỗi rỗng', async () => {
        const r = await json(await fetch(`${base}/${news.id}`, { method: 'PUT', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ affiliate_url: '' }) }));
        assert.strictEqual(r.body.affiliate_url, null);
    });
    await t('PUT không có trường -> 400', async () => assert.strictEqual((await fetch(`${base}/${created.id}`, { method: 'PUT', headers: { ...auth, 'Content-Type': 'application/json' }, body: '{}' })).status, 400));
    await t('DELETE -> 204 rồi GET -> 404', async () => { assert.strictEqual((await fetch(`${base}/${created.id}`, { method: 'DELETE', headers: auth })).status, 204); assert.strictEqual((await fetch(`${base}/${created.id}`, { headers: auth })).status, 404); });
    await t('endpoint lạ dưới /api/v1 -> 404 JSON', async () => { const r = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/khong-co`); assert.strictEqual(r.status, 404); assert((await r.json()).error); });

    await t('kill switch news.enabled=false -> 503', async () => {
        db.settings.push({ key: 'news.enabled', value: 'false' }); newsSettings.invalidate();
        assert.strictEqual((await post({ title: 'a', content: 'x' })).status, 503);
        db.settings.length = 0; newsSettings.invalidate();
    });
    await t('thu hồi key -> 401', async () => {
        const k = await keysService.createKey('tạm'); await keysService.revokeKey(k.record.id);
        assert.strictEqual((await post({ title: 'a', content: 'x' }, { Authorization: `Bearer ${k.raw}` })).status, 401);
    });
    await t('rate limit mỗi key: vượt 60/phút -> 429', async () => {
        const k = await keysService.createKey('limit'); const h = { Authorization: `Bearer ${k.raw}` };
        let last; for (let i = 0; i < 62; i++) last = await fetch(`${base}/1`, { headers: h });
        assert.strictEqual(last.status, 429); assert(last.headers.get('retry-after'));
    });
    await t('sai key 10 lần -> 429 cho IP (kể cả key đúng)', async () => {
        for (let i = 0; i < 11; i++) await post({ title: 'a' }, { Authorization: 'Bearer hq_' + 'x'.repeat(43) });
        assert.strictEqual((await post({ title: 'a', content: 'x' })).status, 429);
    });

    console.log(`\nTổng ok: ${pass}, lỗi: ${failN}`);
    server.close(); process.exit(failN ? 1 : 0);
})();
