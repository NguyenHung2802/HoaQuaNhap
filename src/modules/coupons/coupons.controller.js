const couponsService = require('./coupons.service');
const db = require('../../config/db');

/**
 * [GET] /admin/coupons
 * Render coupon list
 */
const renderList = async (req, res, next) => {
    try {
        const { search, is_active, page = 1 } = req.query;
        
        const { coupons, total, totalPages } = await couponsService.getAllCoupons({
            search,
            is_active,
            page: parseInt(page),
            limit: 10
        });

        res.render('admin/coupons/index', {
            title: 'Quản lý mã giảm giá',
            coupons,
            total,
            totalPages,
            currentPage: parseInt(page),
            filters: {
                search: search || '',
                is_active: is_active || ''
            },
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [GET] /admin/coupons/create
 */
const renderCreateForm = async (req, res, next) => {
    try {
        res.render('admin/coupons/create', {
            title: 'Thêm mã giảm giá mới',
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [POST] /admin/coupons/create
 */
const create = async (req, res, next) => {
    try {
        const coupon = await couponsService.createCoupon(req.body);
        req.flash('success_msg', 'Tạo mã giảm giá thành công!');
        res.redirect('/admin/coupons');
    } catch (error) {
        req.flash('error_msg', 'Lỗi khi tạo mã giảm giá: ' + error.message);
        res.redirect('/admin/coupons/create');
    }
};

/**
 * [GET] /admin/coupons/edit/:id
 */
const renderEditForm = async (req, res, next) => {
    try {
        const { id } = req.params;
        const coupon = await couponsService.getCouponById(id);
        if (!coupon) {
            req.flash('error_msg', 'Không tìm thấy mã giảm giá!');
            return res.redirect('/admin/coupons');
        }

        // Format dates for HTML input
        const formatDate = (date) => {
          if (!date) return '';
          return new Date(date).toISOString().split('T')[0];
        };

        res.render('admin/coupons/edit', {
            title: 'Sửa mã giảm giá: ' + coupon.code,
            coupon,
            formattedDates: {
              start_at: formatDate(coupon.start_at),
              end_at: formatDate(coupon.end_at)
            },
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [POST] /admin/coupons/edit/:id
 */
const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        await couponsService.updateCoupon(id, req.body);
        req.flash('success_msg', 'Cập nhật mã giảm giá thành công!');
        res.redirect('/admin/coupons');
    } catch (error) {
        req.flash('error_msg', 'Lỗi khi cập nhật mã giảm giá: ' + error.message);
        res.redirect('/admin/coupons/edit/' + req.params.id);
    }
};

/**
 * [DELETE] /admin/coupons/:id
 */
const deleteCoupon = async (req, res, next) => {
    try {
        const { id } = req.params;
        await couponsService.deleteCoupon(id);
        res.json({ success: true, message: 'Xóa mã giảm giá thành công' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * [POST] /api/coupons/apply
 * API to validate and calculate discount from coupon code
 */
const applyCoupon = async (req, res) => {
    try {
        const { code, totalAmount } = req.body;
        if (!code) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập mã giảm giá' });
        }

        let coupon = await couponsService.getCouponByCode(code.toUpperCase());
        
        let manualPromo = null;
        if (!coupon) {
            // Fallback: Try to find a manual PromotionCampaign with a name that slugifies to this code
            const campaigns = await db.promotionCampaign.findMany({
                where: { is_active: true, apply_type: 'manual' },
            });
            
            const slugify = (text) => {
                return text.toString().toLowerCase()
                    .replace(/á|à|ả|ã|ạ|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/g, 'a')
                    .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/g, 'e')
                    .replace(/i|í|ì|ỉ|ĩ|ị/g, 'i')
                    .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/g, 'o')
                    .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/g, 'u')
                    .replace(/ý|ỳ|ỷ|ỹ|ỵ/g, 'y')
                    .replace(/đ/g, 'd')
                    .replace(/\s+/g, '') // No spaces for code matching
                    .replace(/[^\w-]+/g, '');
            };

            const searchCode = slugify(code);
            manualPromo = campaigns.find(p => slugify(p.name) === searchCode);
        }

        if (!coupon && !manualPromo) {
            return res.status(404).json({ success: false, message: 'Mã giảm giá không chính xác hoặc đã hết hạn.' });
        }

        // If it's a promotion campaign instead of a coupon
        if (manualPromo) {
            // Calculate discount for promotion campaign manually here or reuse logic
            // To keep it simple, we'll convert it to a pseudo-coupon object for the response
            coupon = {
                id: manualPromo.id,
                code: manualPromo.name,
                type: manualPromo.type,
                value: manualPromo.value,
                min_order_value: manualPromo.min_order_value,
                max_discount_value: manualPromo.max_discount_value,
                is_promo_campaign: true // Mark for frontend differentiate
            };
        } else {
            if (!coupon.is_active) {
                return res.status(400).json({ success: false, message: 'Mã giảm giá này hiện không khả dụng.' });
            }
        }

        // Check date
        const now = new Date();
        if (coupon.start_at && new Date(coupon.start_at) > now) {
            return res.status(400).json({ success: false, message: 'Chương trình chưa bắt đầu' });
        }
        if (coupon.end_at && new Date(coupon.end_at) < now) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn' });
        }

        // Check usage limit
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng' });
        }

        // Check min order value
        const minVal = coupon.min_order_value ? parseFloat(coupon.min_order_value) : 0;
        const currentTotal = parseFloat(totalAmount);
        
        if (minVal > 0 && currentTotal < minVal) {
            return res.status(400).json({ 
                success: false, 
                message: `Đơn hàng tối thiểu để dùng mã này là ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(minVal)} (Hiện tại: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentTotal)})` 
            });
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.type === 'percent') {
            discountAmount = (parseFloat(totalAmount) * parseFloat(coupon.value)) / 100;
            if (coupon.max_discount_value && discountAmount > parseFloat(coupon.max_discount_value)) {
                discountAmount = parseFloat(coupon.max_discount_value);
            }
        } else {
            discountAmount = parseFloat(coupon.value);
        }

        // Discount cannot exceed total amount
        if (discountAmount > parseFloat(totalAmount)) {
            discountAmount = parseFloat(totalAmount);
        }

        res.json({
            success: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discountAmount: Math.round(discountAmount),
                isPromotion: coupon.is_promo_campaign || false
            },
            message: coupon.is_promo_campaign ? 'Đã áp dụng ưu đãi!' : 'Áp dụng mã giảm giá thành công'
        });

    } catch (error) {
        console.error('Apply Coupon Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi áp dụng mã' });
    }
};

module.exports = {
    renderList,
    renderCreateForm,
    create,
    renderEditForm,
    update,
    deleteCoupon,
    applyCoupon
};
