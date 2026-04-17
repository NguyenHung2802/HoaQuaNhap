const bcrypt = require('bcryptjs');
const db = require('../../config/db');
const loyaltyService = require('../loyalty/loyalty.service');

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

        if (!user || user.status !== 'active') {
            req.flash('error_msg', 'Tài khoản không tồn tại hoặc bị khóa.');
            return res.redirect('/auth/login');
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            req.flash('error_msg', 'Mật khẩu không chính xác.');
            return res.redirect('/auth/login');
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
