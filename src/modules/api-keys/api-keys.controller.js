const keysService = require('./api-keys.service');

const siteUrl = () => (process.env.SITE_URL || 'https://haianhfruit.com').replace(/\/+$/, '');

const render = async (res, extra = {}) => {
    const keys = await keysService.listKeys();
    res.render('admin/api-keys/index', {
        title: 'API Keys',
        keys,
        siteUrl: siteUrl(),
        newKey: null,
        layout: 'layouts/admin',
        ...extra
    });
};

/** [GET] /admin/api-keys */
exports.renderList = async (req, res, next) => {
    try {
        await render(res);
    } catch (e) {
        next(e);
    }
};

/**
 * [POST] /admin/api-keys
 * Hiển thị key thô ngay trong phản hồi (không redirect, không lưu vào session/flash) vì chỉ xem được một lần.
 */
exports.createKey = async (req, res, next) => {
    try {
        const name = String(req.body.name || '').trim();
        if (!name) {
            req.flash('error_msg', 'Vui lòng nhập tên cho API key (ví dụ: n8n).');
            return res.redirect('/admin/api-keys');
        }
        const { raw } = await keysService.createKey(name);
        res.set('Cache-Control', 'no-store');
        await render(res, { newKey: raw, newKeyName: name });
    } catch (e) {
        next(e);
    }
};

/** [POST] /admin/api-keys/:id/revoke */
exports.revokeKey = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id)) return res.redirect('/admin/api-keys');
        await keysService.revokeKey(id);
        req.flash('success_msg', 'Đã thu hồi API key. Các lần gọi bằng key này sẽ bị từ chối.');
        res.redirect('/admin/api-keys');
    } catch (e) {
        req.flash('error_msg', 'Không thu hồi được key: ' + e.message);
        res.redirect('/admin/api-keys');
    }
};
