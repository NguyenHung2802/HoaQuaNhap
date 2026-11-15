#!/usr/bin/env node
/**
 * Nạp sản phẩm hàng loạt từ data/import/products.json (xuất từ Excel bằng scripts/xlsx-to-json.py).
 *
 *   node scripts/import-products.js              CHẠY THỬ: kiểm tra, không ghi DB, không upload ảnh
 *   node scripts/import-products.js --apply      nạp thật: tạo danh mục, upload ảnh lên Cloudinary, tạo sản phẩm
 *
 * - Sản phẩm trùng slug hoặc SKU với dữ liệu đang có: BỎ QUA (không ghi đè, không tạo bản trùng).
 * - Chạy lại được: ảnh đã upload lưu trong data/import/upload-cache.json nên không upload lần hai.
 * - Mỗi sản phẩm tạo trong một giao dịch (sản phẩm + danh mục + ảnh + nhật ký kho).
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');
const DIR = path.join(__dirname, '..', 'data', 'import');
const DATA = JSON.parse(fs.readFileSync(path.join(DIR, 'products.json'), 'utf8'));
const CACHE_FILE = path.join(DIR, 'upload-cache.json');
const cache = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) : {};
const saveCache = () => fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 1));

const STATUS = new Set(['published', 'draft', 'out_of_stock']);
const num = (v) => (v === '' || v === null || v === undefined ? null : Number(String(v).replace(/[^\d.\-]/g, '')));
const flag = (v) => String(v || '').trim().toLowerCase() === 'x';
const split = (v) => String(v || '').split('|').map((s) => s.trim()).filter(Boolean);

function validate(rows, catBySlugOrName) {
    const errors = [];
    const seenSlug = new Set();
    const seenSku = new Set();
    rows.forEach((r) => {
        const e = (m) => errors.push(`Dòng ${r._row} (${r.ten_san_pham || '?'}): ${m}`);
        if (!String(r.ten_san_pham).trim()) e('thiếu tên');
        if (!String(r.slug).trim()) e('thiếu slug');
        if (!String(r.ma_sku).trim()) e('thiếu SKU');
        if (seenSlug.has(r.slug)) e('slug trùng trong file'); seenSlug.add(r.slug);
        if (seenSku.has(r.ma_sku)) e('SKU trùng trong file'); seenSku.add(r.ma_sku);
        if (!catBySlugOrName.has(String(r.danh_muc_chinh).trim())) e(`danh mục "${r.danh_muc_chinh}" không có trong sheet DanhMuc hoặc DB`);
        split(r.danh_muc_phu).forEach((c) => { if (!catBySlugOrName.has(c)) e(`danh mục phụ "${c}" không tồn tại`); });
        const price = num(r.gia_ban);
        if (!(price > 0)) e('gia_ban không hợp lệ');
        const sale = num(r.gia_khuyen_mai);
        if (sale !== null && !(sale > 0 && sale < price)) e('gia_khuyen_mai phải nhỏ hơn gia_ban');
        if (!(Number.isInteger(num(r.ton_kho)) && num(r.ton_kho) >= 0)) e('ton_kho phải là số nguyên >= 0');
        if (!STATUS.has(String(r.trang_thai || 'draft'))) e('trang_thai không hợp lệ');
        if (!String(r.anh_chinh).trim()) e('thiếu ảnh chính');
        [r.anh_chinh, ...split(r.anh_phu)].filter(Boolean).forEach((p) => {
            if (cache[p]) return; // đã có link Cloudinary từ lần chạy trước, không cần file ảnh trên đĩa nữa
            if (!fs.existsSync(path.join(DIR, p))) e(`không thấy file ảnh ${p}`);
        });
    });
    return errors;
}

async function main() {
    const prisma = require('../src/config/db');
    const { createProduct } = require('../src/modules/products/products.service');
    const media = require('../src/modules/media/media.service');

    // 1) Danh mục
    const dbCats = await prisma.category.findMany();
    const byKey = new Map();
    dbCats.forEach((c) => { byKey.set(c.name, c); byKey.set(c.slug, c); });
    const toCreate = DATA.categories.filter((c) => !byKey.has(c.ten_danh_muc) && !byKey.has(c.slug));
    // trong chạy thử, coi như danh mục sắp tạo đã có để kiểm tra tên
    const checkMap = new Map(byKey);
    DATA.categories.forEach((c) => { checkMap.set(c.ten_danh_muc, c); checkMap.set(c.slug, c); });

    // 2) Trùng với DB — xác định TRƯỚC khi kiểm tra dữ liệu, vì sản phẩm đã có rồi thì không cần
    // đòi hỏi file ảnh của nó phải có mặt (ảnh đó không được dùng tới nữa).
    const slugs = DATA.products.map((p) => p.slug);
    const skus = DATA.products.map((p) => p.ma_sku);
    const existing = await prisma.product.findMany({ where: { OR: [{ slug: { in: slugs } }, { sku: { in: skus } }] }, select: { id: true, slug: true, sku: true, name: true } });
    const existSlug = new Map(existing.map((p) => [p.slug, p]));
    const existSku = new Map(existing.map((p) => [p.sku, p]));
    const skipped = [];
    const todo = DATA.products.filter((p) => {
        const hit = existSlug.get(p.slug) || existSku.get(p.ma_sku);
        if (hit) { skipped.push(`${p.ten_san_pham} (đã có: #${hit.id} ${hit.name})`); return false; }
        return true;
    });
    const errors = validate(todo, checkMap);

    console.log(`Sản phẩm trong file: ${DATA.products.length} | sẽ tạo: ${todo.length} | bỏ qua vì đã tồn tại: ${skipped.length}`);
    console.log(`Danh mục mới sẽ tạo: ${toCreate.length} (${toCreate.map((c) => c.ten_danh_muc).join('; ') || 'không'})`);
    const imgCount = new Set(todo.flatMap((p) => [p.anh_chinh, ...split(p.anh_phu)])).size;
    const cached = [...new Set(todo.flatMap((p) => [p.anh_chinh, ...split(p.anh_phu)]))].filter((x) => cache[x]).length;
    console.log(`Ảnh cần upload: ${imgCount - cached} (đã upload trước đó: ${cached})`);
    skipped.forEach((s) => console.log('  - bỏ qua:', s));
    if (errors.length) {
        console.log(`\nCÓ ${errors.length} LỖI DỮ LIỆU:`);
        errors.forEach((x) => console.log('  ✗', x));
        process.exitCode = 1;
        return;
    }
    if (!APPLY) {
        console.log('\nChạy thử xong, dữ liệu hợp lệ. Thêm --apply để nạp thật.');
        return;
    }

    // 3) Tạo danh mục
    for (const c of toCreate) {
        const created = await prisma.category.create({ data: { name: c.ten_danh_muc, slug: c.slug, description: c.mo_ta || null, sort_order: Number(c.thu_tu) || 0, is_active: true } });
        byKey.set(created.name, created); byKey.set(created.slug, created);
        console.log('+ danh mục:', created.name);
    }

    // 4) Từng sản phẩm
    let ok = 0, fail = 0;
    for (const [i, r] of todo.entries()) {
        try {
            const files = [r.anh_chinh, ...split(r.anh_phu)];
            const images = [];
            for (const rel of files) {
                if (!cache[rel]) {
                    const buf = fs.readFileSync(path.join(DIR, rel));
                    const up = await media.uploadImageBuffer(buf, 'products');
                    cache[rel] = { url: up.url, public_id: up.public_id };
                    saveCache();
                }
                images.push(cache[rel]);
            }
            const main = byKey.get(String(r.danh_muc_chinh).trim());
            const extra = split(r.danh_muc_phu).map((n) => byKey.get(n).id);
            const flash = flag(r.flash_sale);
            await createProduct({
                name: String(r.ten_san_pham).trim(), slug: r.slug, sku: r.ma_sku,
                short_description: r.mo_ta_ngan || null, description: r.mo_ta_chi_tiet || null,
                category_id: main.id, category_ids: extra,
                origin_country: r.xuat_xu || null, unit: r.don_vi_tinh || 'kg', weight_value: num(r.khoi_luong_kg),
                packing_type: r.quy_cach_dong_goi || null,
                price: num(r.gia_ban), sale_price: num(r.gia_khuyen_mai), cost_price: num(r.gia_von),
                stock_quantity: num(r.ton_kho), min_stock_alert: num(r.canh_bao_ton_kho) || 5,
                status: r.trang_thai || 'draft',
                is_featured: flag(r.noi_bat), is_best_seller: flag(r.ban_chay), is_flash_sale: flash,
                flash_sale_price: flash ? num(r.gia_flash_sale) : null, flash_sale_end: flash ? r.flash_sale_ket_thuc || null : null,
                nutritional_info: r.thong_tin_dinh_duong || null, images
            });
            ok++;
            console.log(`[${i + 1}/${todo.length}] ✓ ${r.ten_san_pham}`);
        } catch (err) {
            fail++;
            console.log(`[${i + 1}/${todo.length}] ✗ ${r.ten_san_pham}: ${err.message}`);
        }
    }
    console.log(`\nXong: tạo ${ok}, lỗi ${fail}, bỏ qua ${skipped.length}.`);
    if (fail) process.exitCode = 1;
}

main().catch((e) => { console.error('Lỗi:', e.message); process.exit(1); }).finally(async () => {
    try { await require('../src/config/db').$disconnect(); } catch (e) { /* bỏ qua */ }
});
