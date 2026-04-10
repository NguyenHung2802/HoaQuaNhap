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

// Load environment variables
dotenv.config();

const app = express();

// Set up logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Safety and utility middlewares
app.use(helmet({
    contentSecurityPolicy: false, // Disable for EJS if needed for simpler setup, or configure properly
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Prisma setup
const { PrismaClient } = require('@prisma/client');
const _prisma = new PrismaClient();

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));

// Flash messages
app.use(flash());

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main'); // Default layout for public site

// Global variables for views
app.use(async (req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.session.user || null;
    res.locals.req = req;

    // Global Cart Item Count
    const sessionCart = req.session.cart || [];
    res.locals.cartItemsCount = sessionCart.reduce((total, item) => total + parseInt(item.quantity), 0);

    try {
        res.locals.globalCategories = await _prisma.category.findMany({
            where: { is_active: true },
            orderBy: { name: 'asc' },
            take: 8
        });
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
    res.status(404).render('public/pages/404', {
        title: 'Trang không tìm thấy',
        layout: 'layouts/main'
    });
});

// Global error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('public/pages/500', {
        title: 'Lỗi hệ thống',
        error: err,
        layout: 'layouts/main'
    });
});

module.exports = app;
