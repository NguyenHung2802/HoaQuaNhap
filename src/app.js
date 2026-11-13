const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');

// Load environment variables
dotenv.config();

const app = express();

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.set('trust proxy', 1); // Trust first proxy (Nginx) for HTTPS cookies
}

// Safety and utility middlewares
app.use(helmet({
    contentSecurityPolicy: false, // Disable for EJS if needed for simpler setup, or configure properly
}));
// Host tin tức ẩn (vd tin.haianhfruit.com): xử lý riêng và kết thúc tại đây, trước session/cookie/danh mục.
app.use(require('./middlewares/news-host.middleware').newsHost);
// Kiểm tra sức khỏe (cho giám sát/uptime): không DB mặc định; thêm ?db=1 để kiểm tra cả kết nối DB.
app.get('/healthz', async (req, res) => {
    const body = { status: 'ok', uptimeSec: Math.round(process.uptime()), rssMb: Math.round(process.memoryUsage().rss / 1048576) };
    if (req.query.db === '1') {
        try {
            await _prisma.$queryRaw`SELECT 1`;
            body.db = 'ok';
        } catch (e) {
            body.status = 'degraded';
            body.db = 'error';
            res.status(503);
        }
    }
    res.set('Cache-Control', 'no-store').json(body);
});
app.use(cors());
// API đăng bài cần nhận nội dung HTML lớn hơn giới hạn mặc định 100kb
app.use('/api/v1', express.json({ limit: '2mb' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
// Thư viện bên thứ ba tự lưu (public/vendor) là tệp ghim phiên bản, không đổi: cho trình duyệt giữ 30 ngày
app.use('/vendor', express.static(path.join(__dirname, '../public/vendor'), { maxAge: '30d', immutable: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Prisma setup
const _prisma = require('./config/db');
const categoryCache = require('./utils/category-cache');

// Session configuration
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true, // JS phía trình duyệt không đọc được cookie phiên (chặn đánh cắp qua XSS)
        sameSite: 'lax', // Không gửi cookie phiên khi bị dẫn từ trang khác (giảm rủi ro CSRF)
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
};

// Only use PrismaSessionStore if the model is generated and available
if (_prisma.session) {
    sessionConfig.store = new PrismaSessionStore(
        _prisma,
        {
            checkPeriod: 2 * 60 * 1000,
            dbRecordIdIsSessionId: true,
            dbRecordIdFunction: undefined,
            modelName: 'session',
        }
    );
} else {
    console.warn('WARNING: Prisma session model not found. Falling back to MemoryStore.');
}

app.use(session(sessionConfig));

// Flash messages
app.use(flash());

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main'); // Default layout for public site

// Global variables for views
app.use(async (req, res, next) => {
    // API JSON không cần biến cho view (tiết kiệm truy vấn DB)
    if (req.originalUrl.startsWith('/api/v1')) return next();

    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.session.user || null;
    res.locals.req = req;
    // Giao diện: 'v2' (mặc định, nền trắng + hiệu ứng mới) hoặc 'classic' (bản cũ). Đổi bằng UI_THEME trong .env rồi reload.
    res.locals.uiTheme = process.env.UI_THEME === 'classic' ? 'classic' : 'v2';

    // Global Cart Item Count
    const sessionCart = req.session.cart || [];
    res.locals.cartItemsCount = sessionCart.reduce((total, item) => total + parseInt(item.quantity), 0);

    try {
        // Menu danh mục lấy từ cache trong bộ nhớ (xóa khi admin sửa danh mục) thay vì truy vấn DB mỗi request
        res.locals.globalCategories = await categoryCache.getTree();
    } catch (e) {
        res.locals.globalCategories = [];
    }
    next();
});

// Import routes
const webRoutes = require('./routes/web.route');
const adminRoutes = require('./routes/admin.route');
const apiRoutes = require('./routes/api.route');

// Use routes
app.use('/', webRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

// 404 Error handling
app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api/v1')) {
        return res.status(404).json({ error: { code: 'not_found', message: 'Endpoint không tồn tại.' } });
    }
    res.status(404).render('public/pages/404', {
        title: 'Trang không tìm thấy',
        layout: 'layouts/main'
    });
});

// Global error handling
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err); // Log the full error object
    if (req.originalUrl.startsWith('/api/v1')) {
        const status = err.status || err.statusCode || 500;
        const code = status === 413 ? 'payload_too_large' : (status === 400 ? 'invalid_request' : 'server_error');
        return res.status(status).json({ error: { code, message: status >= 500 ? 'Lỗi máy chủ.' : (err.message || 'Yêu cầu không hợp lệ.') } });
    }
    res.status(500).render('public/pages/500', {
        title: 'Lỗi hệ thống',
        error: err,
        layout: 'layouts/main'
    });
});

module.exports = app;
