/**
 * Middleware kiểm tra login của admin
 */
exports.isAdmin = (req, res, next) => {
    // Nếu có session và có user là admin
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    
    // Nếu chưa login hoặc không phải admin -> đá về trang login
    req.flash('error_msg', 'Hãy đăng nhập bằng tài khoản quản trị để tiếp tục.');
    res.redirect('/admin/login');
};

/**
 * Middleware cho phép truyền thông tin user hiện tại vào res.locals để dùng trong view EJS
 */
exports.loadUser = (req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
};

/**
 * Middleware kiểm tra login của người dùng (Customer)
 */
exports.ensureAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        // Đã đăng nhập (admin hay customer đều được)
        return next();
    }
    
    // Chưa đăng nhập thì đá về trang đăng nhập
    req.flash('error_msg', 'Vui lòng đăng nhập để tiếp tục.');
    // Lưu lại URL muốn vào để redirect sau khi login thành công (nếu cần xử lý phức tạp sau này)
    res.redirect(`/auth/login?redirect=${encodeURIComponent(req.originalUrl)}`);
};
