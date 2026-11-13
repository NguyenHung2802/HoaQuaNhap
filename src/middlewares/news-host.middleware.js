/**
 * Định tuyến theo host: nếu request đến host tin ẩn (Setting news.host, ví dụ tin.haianhfruit.com)
 * thì CHỈ router tin ẩn xử lý và kết thúc tại đó — không session, không cookie, không truy vấn danh mục,
 * không chạy bất kỳ route nào của web bán hàng. Host khác đi tiếp như bình thường.
 */
const newsSettings = require('../modules/settings/news-settings.service');
const newsRouter = require('../modules/public/news/news.public.route');

function isNewsHost(req, configured) {
    if (!configured) return false;
    const header = String(req.headers.host || '').toLowerCase();
    const hostname = String(req.hostname || '').toLowerCase();
    return header === configured || hostname === configured;
}

async function newsHost(req, res, next) {
    let settings;
    try {
        settings = await newsSettings.get();
    } catch (e) {
        // Không đọc được cấu hình: tuyệt đối không để web bán hàng lộ ra ở host tin ẩn.
        if (/^tin\./i.test(String(req.headers.host || ''))) {
            return res.status(503).type('text/plain').send('Service unavailable');
        }
        return next();
    }
    if (!isNewsHost(req, settings.host)) return next();

    // Công tắc khẩn cấp: tắt là mọi đường dẫn đều như không tồn tại.
    req.newsSettings = settings;
    return newsRouter(req, res, next);
}

module.exports = { newsHost, isNewsHost };
