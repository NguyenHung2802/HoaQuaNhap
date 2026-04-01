const bcrypt = require('bcryptjs');
const db = require('../../../config/db');

/**
 * Hiển thị trang đăng nhập admin
 */
exports.renderLogin = (req, res) => {
    // Nếu đã login rồi thì vào thẳng dashboard
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return res.redirect('/admin');
    }
    res.render('admin/auth/login', {
        title: 'Đăng nhập hệ thống',
        layout: false // Không dùng layout chung cho trang login
    });
};

/**
 * Xử lý đăng nhập admin
 */
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await db.user.findUnique({
            where: { email }
        });

        if (!user || user.status !== 'active') {
            req.flash('error_msg', 'Tài khoản không tồn tại hoặc đã bị khóa.');
            return res.redirect('/admin/login');
        }

        // Kiểm tra role (Chỉ cho phép admin login vào trang này)
        if (user.role !== 'admin') {
            req.flash('error_msg', 'Bạn không có quyền truy cập vào khu vực này.');
            return res.redirect('/admin/login');
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            req.flash('error_msg', 'Mật khẩu không chính xác.');
            return res.redirect('/admin/login');
        }

        // Lưu thông tin vào session
        req.session.user = {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role
        };

        // Cập nhật thời gian đăng nhập cuối
        await db.user.update({
            where: { id: user.id },
            data: { last_login_at: new Date() }
        });

        req.flash('success_msg', 'Đăng nhập thành công!');
        res.redirect('/admin');
    } catch (error) {
        console.error('Login Error:', error);
        req.flash('error_msg', 'Đã có lỗi xảy ra, vui lòng thử lại sau.');
        res.redirect('/admin/login');
    }
};

/**
 * Đăng xuất admin
 */
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/admin/login');
    });
};
