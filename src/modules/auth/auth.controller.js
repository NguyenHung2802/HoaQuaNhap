const bcrypt = require('bcryptjs');
const db = require('../../config/db');
const loyaltyService = require('../loyalty/loyalty.service');
const cartService = require('../public/cart/cart.service');
const { recordFailedAttempt, clearAttempts } = require('../../middlewares/login-throttle.middleware');

/**
 * Render trang Đăng nhập (Unified)
 */
exports.renderLogin = (req, res) => {
    if (req.session && req.session.user) {
        if (req.session.user.role === 'admin') return res.redirect('/admin');
        return res.redirect('/');
    }
    res.render('public/auth/login', {
        title: 'Đăng nhập hệ thống',
        layout: 'layouts/main'
    });
};

/**
 * Render trang Đăng ký Customer
 */
exports.renderRegister = (req, res) => {
    if (req.session && req.session.user) {
        if (req.session.user.role === 'admin') return res.redirect('/admin');
        return res.redirect('/');
    }
    res.render('public/auth/register', {
        title: 'Đăng ký tài khoản',
        layout: 'layouts/main'
    });
};

/**
 * Xử lý Đăng ký
 */
exports.register = async (req, res) => {
    const { full_name, email, phone, password, confirm_password } = req.body;

    try {
        // 1. Validation cơ bản
        if (!full_name || !email || !phone || !password) {
            req.flash('error_msg', 'Vui lòng điền đầy đủ tất cả các trường.');
            return res.redirect('/auth/register');
        }

        if (confirm_password && password !== confirm_password) {
            req.flash('error_msg', 'Mật khẩu xác nhận không khớp.');
            return res.redirect('/auth/register');
        }

        // 2. Kiểm tra email đã tồn tại chưa
        const existingUser = await db.user.findUnique({ where: { email } });
        if (existingUser) {
            req.flash('error_msg', 'Email này đã được sử dụng.');
            return res.redirect('/auth/register');
        }

        // 3. Hash mật khẩu
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 4. Tạo User và Customer profile trong 1 transaction
        await db.$transaction(async (prisma) => {
            const user = await prisma.user.create({
                data: {
                    full_name,
                    email,
                    phone,
                    password_hash,
                    role: 'customer',
                    status: 'active'
                }
            });

            // Tìm hoặc tạo profile Customer theo SĐT
            await prisma.customer.upsert({
                where: { phone },
                update: { 
                    user_id: user.id,
                    full_name,
                    email
                },
                create: {
                    full_name,
                    phone,
                    email,
                    user_id: user.id
                }
            });
        });

        req.flash('success_msg', 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
        res.redirect('/auth/login');
    } catch (error) {
        console.error('Register Error:', error);
        // Trả về chi tiết lỗi để dễ debug
        req.flash('error_msg', 'Lỗi hệ thống khi đăng ký: ' + (error.meta?.target || error.message));
        res.redirect('/auth/register');
    }
};

/**
 * Xử lý Đăng nhập
 */
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            req.flash('error_msg', 'Vui lòng nhập đầy đủ email và mật khẩu.');
            return res.redirect('/auth/login');
        }

        const user = await db.user.findUnique({ where: { email } });

        // Thông báo chung cho mọi trường hợp sai (không nói rõ "email không tồn tại" hay "sai mật khẩu")
        // để người ngoài không dò được email nào có tài khoản admin trong hệ thống.
        const genericFail = () => {
            recordFailedAttempt(req, res);
            console.warn(`[auth] đăng nhập thất bại ip=${req.ip} email=${email}`);
            req.flash('error_msg', 'Email hoặc mật khẩu không đúng.');
            return res.redirect('/auth/login');
        };

        // So sánh mật khẩu với hash giả khi không có tài khoản, để thời gian phản hồi giống hệt
        // trường hợp sai mật khẩu — tránh lộ "email này có tồn tại hay không" qua tốc độ trả lời.
        const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8q4mP2u2TJZ5oJ5L9NIOO6o7R1VP6e';
        const isMatch = await bcrypt.compare(password, (user && user.password_hash) || DUMMY_HASH);

        if (!user || user.status !== 'active' || !isMatch) {
            return genericFail();
        }

        clearAttempts(req, res);
        if (user.role === 'admin') {
            console.info(`[auth] admin đăng nhập ip=${req.ip} email=${user.email} lúc ${new Date().toISOString()}`);
        }

        // 4. Lưu session
        const rewardPoints = await loyaltyService.getUserRewardPoints(user.id, db);

        req.session.user = {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            reward_points: rewardPoints
        };

        await db.user.update({
            where: { id: user.id },
            data: { last_login_at: new Date() }
        });

        // 5. Sync Shopping Cart
        try {
            const sessionCart = req.session.cart || [];
            if (sessionCart.length > 0) {
                // User was shopping as guest, save this to DB
                await cartService.syncSessionCartToDb(user.id, sessionCart);
            } else {
                // User has no guest items, load their previous DB cart
                const dbCart = await cartService.getDbCart(user.id);
                if (dbCart.length > 0) {
                    req.session.cart = dbCart;
                }
            }
        } catch (cartError) {
            console.error('Cart sync error on login:', cartError);
            // Non-blocking error
        }

        // 5. Điều hướng dựa trên vai trò
        if (user.role === 'admin') {
            req.flash('success_msg', 'Chào mừng Admin quay trở lại!');
            return res.redirect('/admin');
        }

        const redirectUrl = req.session.returnTo || '/';
        delete req.session.returnTo;

        req.flash('success_msg', 'Chào mừng bạn quay trở lại!');
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Login Error:', error);
        req.flash('error_msg', 'Lỗi hệ thống: ' + error.message);
        res.redirect('/auth/login');
    }
};

/**
 * Xử lý Đăng xuất
 */
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Logout error:', err);
        res.redirect('/');
    });
};
