// Kiểm thử S43 (không cần DB/Cloudinary thật). Chạy: node tests/s43-content-media.test.js (sau khi npm install)
const assert = require('assert');
const root = require('path').join(__dirname, '..') + '/';
const c = require(root + 'src/modules/posts/content.service.js');
let pass = 0;
const t = (name, fn) => { try { fn(); pass++; console.log('ok  ', name); } catch (e) { console.log('FAIL', name, '\n   ', e.message); process.exitCode = 1; } };

// Slug
t('slug tiếng Việt', () => assert.strictEqual(c.toSlug('tin dự án đất vùng ven'), 'tin-du-an-dat-vung-ven'));
t('slug chữ hoa, đ hoa, ký tự đặc biệt', () => assert.strictEqual(c.toSlug('  ĐẤT Nền!! Giá "Rẻ" 2026  '), 'dat-nen-gia-re-2026'));
t('slug dạng tổ hợp NFD', () => assert.strictEqual(c.toSlug('Tiếng Việt'.normalize('NFD')), 'tieng-viet'));
t('slug rỗng', () => assert.strictEqual(c.toSlug('!!!'), ''));

// uniqueSlug với prisma giả
(async () => {
  const taken = new Set(['abc', 'abc-2']);
  const fake = { blogPost: { findUnique: async ({ where }) => (taken.has(where.slug) ? { id: 1 } : null) } };
  assert.strictEqual(await c.uniqueSlug(fake, 'ABC'), 'abc-3'); pass++; console.log('ok   uniqueSlug hậu tố');
  assert.strictEqual(await c.uniqueSlug(fake, '???'), 'bai-viet'); pass++; console.log('ok   uniqueSlug rỗng');
})();

// Sanitize
t('xóa script', () => assert(!/script/i.test(c.sanitizeContent('<p>a</p><script>alert(1)</script>'))));
t('xóa onerror', () => assert(!/onerror/i.test(c.sanitizeContent('<img src="https://x.com/a.jpg" onerror="alert(1)">'))));
t('xóa javascript: href', () => assert(!/javascript:/i.test(c.sanitizeContent('<a href="javascript:alert(1)">x</a>'))));
t('xóa style', () => assert(!/style=/i.test(c.sanitizeContent('<p style="position:fixed">x</p>'))));
t('giữ iframe youtube', () => assert(/youtube-nocookie\.com\/embed\/abc/.test(c.sanitizeContent('<iframe src="https://www.youtube-nocookie.com/embed/abcdefg"></iframe>'))));
t('bỏ iframe lạ', () => assert(!/iframe/.test(c.sanitizeContent('<iframe src="https://evil.com/x"></iframe>'))));
t('link có rel nofollow sponsored', () => { const o = c.sanitizeContent('<a href="https://shopee.vn/x">x</a>'); assert(/rel="noopener noreferrer nofollow sponsored"/.test(o) && /target="_blank"/.test(o)); });
t('ảnh lazy', () => assert(/loading="lazy"/.test(c.sanitizeContent('<img src="https://x.com/a.jpg">'))));
t('ảnh data: bị bỏ', () => assert(!/data:/.test(c.sanitizeContent('<img src="data:text/html;base64,AAAA">'))));
t('sanitizeText bỏ thẻ', () => assert.strictEqual(c.sanitizeText('<b>Xin</b>  chào<script>x</script>'), 'Xin chào'));
t('thời gian đọc', () => assert.strictEqual(c.estimateReadMinutes('<p>' + 'từ '.repeat(450) + '</p>'), 3));

// Affiliate
t('affiliate hợp lệ shopee', () => assert(c.validateAffiliateUrl('https://shopee.vn/product/1', '').startsWith('https://shopee.vn/')));
t('affiliate subdomain', () => assert(c.validateAffiliateUrl('https://vt.tiktok.com/ZSabc/', '')));
t('affiliate rỗng -> null', () => assert.strictEqual(c.validateAffiliateUrl('  ', ''), null));
t('affiliate http bị chặn', () => assert.throws(() => c.validateAffiliateUrl('http://shopee.vn/x', ''), { code: 'invalid_affiliate_url' }));
t('affiliate host lạ bị chặn', () => assert.throws(() => c.validateAffiliateUrl('https://evil.com/x', ''), { code: 'affiliate_host_not_allowed' }));
t('affiliate giả mạo host (shopee.vn.evil.com)', () => assert.throws(() => c.validateAffiliateUrl('https://shopee.vn.evil.com/x', ''), { code: 'affiliate_host_not_allowed' }));
t('affiliate có user:pass bị chặn', () => assert.throws(() => c.validateAffiliateUrl('https://shopee.vn@evil.com/x', ''), { code: 'invalid_affiliate_url' }));
t('affiliate theo danh sách tùy chỉnh', () => assert(c.validateAffiliateUrl('https://lazada.vn/x', 'lazada.vn')));

// Video
t('youtube watch', () => assert.deepStrictEqual(c.normalizeVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), { type: 'embed', url: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ' }));
t('youtu.be', () => assert.strictEqual(c.normalizeVideoUrl('https://youtu.be/dQw4w9WgXcQ').url, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'));
t('youtube shorts', () => assert(/embed\/abcdefghijk/.test(c.normalizeVideoUrl('https://www.youtube.com/shorts/abcdefghijk').url)));
t('tiktok', () => assert.strictEqual(c.normalizeVideoUrl('https://www.tiktok.com/@abc/video/7300000000000000000').url, 'https://www.tiktok.com/embed/v2/7300000000000000000'));
t('facebook', () => assert(/facebook\.com\/plugins\/video\.php\?href=/.test(c.normalizeVideoUrl('https://www.facebook.com/abc/videos/123').url)));
t('cloudinary file', () => assert.strictEqual(c.normalizeVideoUrl('https://res.cloudinary.com/x/video/upload/v1/a.mp4').type, 'file'));
t('video host lạ bị chặn', () => assert.throws(() => c.normalizeVideoUrl('https://evil.com/a.mp4'), { code: 'unsupported_video_host' }));
t('video http bị chặn', () => assert.throws(() => c.normalizeVideoUrl('http://youtu.be/abc'), { code: 'invalid_video_url' }));

// Token + ngày
t('token 22 ký tự base64url', () => { const k = c.generateAccessToken(); assert(c.isValidAccessToken(k)); assert.notStrictEqual(k, c.generateAccessToken()); });
t('token sai bị từ chối', () => { assert(!c.isValidAccessToken('abc')); assert(!c.isValidAccessToken('a'.repeat(21) + '+')); });
t('ngày theo giờ VN (cuối ngày UTC sang ngày sau)', () => assert.strictEqual(c.formatUrlDate(new Date('2026-11-12T20:00:00Z')), '13-11-2026'));
t('định dạng ngày', () => { assert(c.isValidUrlDate('12-11-2026')); assert(!c.isValidUrlDate('2026-11-12')); });

// Media: magic bytes, URL từ xa, tối ưu URL, giới hạn đồng thời (giả lập Cloudinary)
const cloud = require(root + 'src/config/cloudinary.js');
let active = 0, peak = 0;
cloud.uploader.upload_stream = (opts, cb) => {
  const { Writable } = require('stream');
  return new Writable({
    write(_c, _e, n) { n(); },
    final(done) { active++; peak = Math.max(peak, active); setTimeout(() => { active--; cb(null, { secure_url: 'https://res.cloudinary.com/x/image/upload/v1/a.jpg', public_id: 'a', width: 1, height: 1 }); done(); }, 120); }
  });
};
const m = require(root + 'src/modules/media/media.service.js');
const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);
t('nhận diện jpeg/mp4', () => { assert.strictEqual(m.detectKind(jpeg), 'image'); assert.strictEqual(m.detectKind(Buffer.concat([Buffer.alloc(4), Buffer.from('ftypisom'), Buffer.alloc(8)])), 'video'); assert.strictEqual(m.detectKind(Buffer.from('<html>aaaaaaaaaaaaa')), null); });
t('URL ảnh từ xa: chặn localhost/IP/http', () => { for (const u of ['http://a.com/x.jpg', 'https://127.0.0.1/x.jpg', 'https://localhost/x.jpg', 'https://10.0.0.1/x', 'https://[::1]/x']) assert.throws(() => m.assertRemoteImageUrl(u), { code: 'invalid_url' }); assert(m.assertRemoteImageUrl('https://cdn.example.com/a.jpg')); });
t('tối ưu URL cloudinary', () => assert.strictEqual(m.optimizeImageUrl('https://res.cloudinary.com/x/image/upload/v1/a.jpg', 800), 'https://res.cloudinary.com/x/image/upload/f_auto,q_auto,w_800/v1/a.jpg'));
t('không tối ưu 2 lần', () => { const u = 'https://res.cloudinary.com/x/image/upload/f_auto,q_auto/v1/a.jpg'; assert.strictEqual(m.optimizeImageUrl(u), u); });

(async () => {
  try {
    await assert.rejects(m.uploadImageBuffer(Buffer.from('not an image at all')), { code: 'unsupported_media' }); pass++; console.log('ok   từ chối file giả ảnh');
    await assert.rejects(m.uploadImageBuffer(Buffer.concat([jpeg, Buffer.alloc(9 * 1024 * 1024)])), { code: 'file_too_large' }); pass++; console.log('ok   từ chối ảnh > 8MB');
    await assert.rejects(m.uploadVideoBuffer(jpeg), { code: 'unsupported_media' }); pass++; console.log('ok   từ chối video sai định dạng');
    const rs = await Promise.all([1, 2, 3, 4, 5].map(() => m.uploadImageBuffer(jpeg)));
    assert.strictEqual(rs.length, 5); assert(peak <= 2, 'peak=' + peak); pass++; console.log('ok   giới hạn đồng thời (đỉnh =', peak + ')');
  } catch (e) { console.log('FAIL media async', e.message); process.exitCode = 1; }
  console.log('\nTổng ok:', pass);
})();
