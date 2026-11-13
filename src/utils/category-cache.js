/**
 * Cache cây danh mục cho menu (res.locals.globalCategories) trong bộ nhớ.
 * Trước đây mỗi request đều truy vấn DB để dựng menu; trên VPS 1 vCPU việc này là tải thừa.
 * Cache sống tối đa 5 phút và bị xóa ngay khi admin tạo/sửa/xóa danh mục (categories.service).
 */
const prisma = require('../config/db');

const TTL_MS = 5 * 60 * 1000;

let tree = null;
let builtAt = 0;
let inflight = null;

async function build() {
    const all = await prisma.category.findMany({
        where: { is_active: true },
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }]
    });
    const parents = all.filter((c) => !c.parent_id);
    const children = all.filter((c) => c.parent_id);
    parents.forEach((p) => { p.children = children.filter((c) => c.parent_id === p.id); });
    return parents;
}

/** Trả về cây danh mục (chỉ đọc, không sửa trực tiếp kết quả). Lỗi DB thì dùng bản cũ nếu có. */
async function getTree() {
    if (tree && Date.now() - builtAt < TTL_MS) return tree;
    if (!inflight) {
        inflight = build()
            .then((t) => { tree = t; builtAt = Date.now(); return t; })
            .finally(() => { inflight = null; });
    }
    try {
        return await inflight;
    } catch (e) {
        if (tree) return tree; // DB lỗi tạm thời: giữ menu cũ
        throw e;
    }
}

function invalidate() {
    tree = null;
    builtAt = 0;
}

module.exports = { getTree, invalidate, TTL_MS };
