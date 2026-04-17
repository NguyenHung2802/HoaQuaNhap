const express = require('express');
const router = express.Router();

const homeController = require('../modules/public/home/home.controller');
const authRoutes = require('../modules/auth/auth.route');
const ordersController = require('../modules/orders/orders.controller');
const publicProductsController = require('../modules/public/products/products.controller');
const cartRoutes = require('../modules/public/cart/cart.route');
const checkoutRoutes = require('../modules/public/checkout/checkout.route');
const blogsRoute = require('../modules/public/blogs/blogs.route');
const pagesController = require('../modules/public/pages/pages.controller');
const profileRoutes = require('../modules/public/profile/profile.route');

router.get('/', homeController.renderHome);
router.use('/auth', authRoutes);

// SEO
router.get('/sitemap.xml', pagesController.renderSitemap);
router.get('/robots.txt', pagesController.renderRobots);

// Shop Pages
router.get('/products', publicProductsController.renderShop);
router.get('/product/:slug', publicProductsController.renderDetail);

// Blog Pages
router.use('/blog', blogsRoute);
router.use('/blogs', blogsRoute);

// Static Pages
router.get('/contact', (req, res) => res.render('public/pages/contact', { title: 'Liên hệ', layout: 'layouts/main' }));
const { PrismaClient } = require('@prisma/client');
const prismaClient = new PrismaClient();
const contactsController = require('../modules/contacts/contacts.controller');

router.post('/contact/submit', async (req, res) => {
    try {
        const { name, phone, email, content } = req.body;
        const newContact = await prismaClient.contactRequest.create({
            data: { 
                name, 
                phone, 
                email: email || null, 
                note: content || '',
                need: 'Liên hệ qua trang /contact',
                status: 'new',
                source_url: '/contact'
            }
        });

        // Trigger notifications asynchronously
        Promise.allSettled([
            contactsController.sendContactNotificationEmail(newContact),
            contactsController.sendTelegramNotification(newContact)
        ]);
        
        res.json({ success: true, message: 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra, vui lòng thử lại sau.' });
    }
});
router.get('/about', (req, res) => res.render('public/pages/about', { title: 'Về chúng tôi — Hải Anh Fruit', layout: 'layouts/main' }));
router.get('/faq', (req, res, next) => { req.params.key = 'faq'; pagesController.renderPage(req, res, next); });
router.get('/policy', (req, res, next) => { req.params.key = 'policy'; pagesController.renderPage(req, res, next); });
router.get('/privacy', (req, res, next) => { req.params.key = 'policy'; pagesController.renderPage(req, res, next); });
router.get('/shipping', (req, res) => res.render('public/pages/policy-shipping', { title: 'Chính sách vận chuyển — Hải Anh Fruit', layout: 'layouts/main' }));
router.get('/return', (req, res, next) => { req.params.key = 'return_policy'; pagesController.renderPage(req, res, next); });
router.get('/page/:key', pagesController.renderPage);

// Product Reviews
router.post('/product/:id/review', publicProductsController.submitReview);

// Cart & Checkout Pages
router.use('/cart', cartRoutes);
router.use('/checkout', checkoutRoutes);

// Track Order
router.get('/track-order', ordersController.renderTrackOrder);
router.post('/track-order', ordersController.processTrackOrder);

// Checkout Success
router.get('/checkout/success/:orderCode', ordersController.renderSuccess);

// Customer Pages
const { ensureAuthenticated } = require('../middlewares/auth.middleware');
router.use('/profile', profileRoutes);
const wishlistRoutes = require('../modules/wishlist/wishlist.route');
router.use('/wishlist', ensureAuthenticated, wishlistRoutes);
router.get('/orders', ensureAuthenticated, ordersController.renderMyOrders);

module.exports = router;
