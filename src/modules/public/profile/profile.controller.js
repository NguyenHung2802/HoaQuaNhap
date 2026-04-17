const db = require('../../../config/db');
const cloudinary = require('../../../config/cloudinary');
const loyaltyService = require('../../loyalty/loyalty.service');

/**
 * Render trang Hồ sơ cá nhân
 */
exports.renderProfile = async (req, res) => {
    try {
        const userId = req.session.user.id;
        
        // Lấy thông tin User kèm Customer và Các địa chỉ
        const user = await db.user.findUnique({
            where: { id: userId },
            include: {
                customer: {
                    include: {
                        addresses: {
                            orderBy: { is_default: 'desc' }
                        }
                    }
                }
            }
        });

        if (!user) {
            req.flash('error_msg', 'Không tìm thấy thông tin tài khoản.');
            return res.redirect('/');
        }

        user.reward_points = await loyaltyService.getUserRewardPoints(userId, db);

        res.render('public/profile/index', {
            title: 'Hồ sơ cá nhân',
            layout: 'layouts/main',
            profile: user,
            customer: user.customer
        });
    } catch (error) {
        console.error('Profile Render Error:', error);
        req.flash('error_msg', 'Lỗi hệ thống: ' + error.message);
        res.redirect('/');
    }
};

/**
 * Cập nhật thông tin cơ bản
 */
exports.updateProfile = async (req, res) => {
    const userId = req.session.user.id;
    const { full_name, email, phone, gender, birthday } = req.body;

    try {
        // Check if phone unique
        if (phone) {
            const existingUser = await db.user.findFirst({
                where: { phone, NOT: { id: userId } }
            });
            if (existingUser) {
                req.flash('error_msg', 'Số điện thoại này đã được sử dụng bởi tài khoản khác.');
                return res.redirect('/profile');
            }
        }

        await db.$transaction(async (prisma) => {
            // 1. Cập nhật User (Tên, Email, Phone)
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { full_name, email, phone }
            });

            // 2. Cập nhật Customer (Tên, Email, Phone, Giới tính, Ngày sinh)
            await prisma.customer.update({
                where: { user_id: userId },
                data: {
                    full_name,
                    email,
                    phone: phone || updatedUser.phone,
                    gender,
                    birthday: birthday ? new Date(birthday) : null
                }
            });

            // Cập nhật lại session
            req.session.user.full_name = updatedUser.full_name;
            req.session.user.email = updatedUser.email;
            req.session.user.phone = updatedUser.phone;
        });

        req.flash('success_msg', 'Cập nhật hồ sơ thành công!');
        res.redirect('/profile');
    } catch (error) {
        console.error('Update Profile Error:', error);
        req.flash('error_msg', 'Lỗi khi cập nhật hồ sơ: ' + error.message);
        res.redirect('/profile');
    }
};

/**
 * API Upload Avatar
 */
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh để tải lên.' });
        }

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'avatars', public_id: `avatar_user_${req.session.user.id}` },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });

        // Cập nhật User avatar_url
        await db.user.update({
            where: { id: req.session.user.id },
            data: { avatar_url: result.secure_url }
        });

        res.json({ success: true, url: result.secure_url });
    } catch (error) {
        console.error('Avatar Upload Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi tải ảnh lên.' });
    }
};

/**
 * Quản lý địa chỉ
 */
exports.saveAddress = async (req, res) => {
    const { id, receiver_name, receiver_phone, province, district, ward, address_line, is_default } = req.body;
    const userId = req.session.user.id;

    try {
        const customer = await db.customer.findUnique({ where: { user_id: userId } });
        if (!customer) throw new Error('Customer profile not found.');

        const data = {
            receiver_name,
            receiver_phone,
            province,
            district,
            ward,
            address_line,
            is_default: is_default === 'true'
        };

        if (id) {
            // Update
            if (data.is_default) {
                await db.customerAddress.updateMany({
                    where: { customer_id: customer.id },
                    data: { is_default: false }
                });
            }
            await db.customerAddress.update({ where: { id: parseInt(id) }, data });
        } else {
            // Create
            if (data.is_default) {
                await db.customerAddress.updateMany({
                    where: { customer_id: customer.id },
                    data: { is_default: false }
                });
            } else {
                // If this is the FIRST address, make it default
                const count = await db.customerAddress.count({ where: { customer_id: customer.id } });
                if (count === 0) data.is_default = true;
            }
            await db.customerAddress.create({
                data: { ...data, customer_id: customer.id }
            });
        }

        req.flash('success_msg', 'Đã lưu địa chỉ.');
        res.redirect('/profile#address-book'); // Chuyển về tab Sổ địa chỉ
    } catch (error) {
        console.error('Save Address Error:', error);
        req.flash('error_msg', 'Lỗi khi lưu địa chỉ: ' + error.message);
        res.redirect('/profile');
    }
};

exports.deleteAddress = async (req, res) => {
    const { id } = req.params;
    try {
        await db.customerAddress.delete({ where: { id: parseInt(id) } });
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

exports.setDefaultAddress = async (req, res) => {
    const { id } = req.params;
    const userId = req.session.user.id;
    try {
        const customer = await db.customer.findUnique({ where: { user_id: userId } });
        await db.$transaction([
            db.customerAddress.updateMany({
                where: { customer_id: customer.id },
                data: { is_default: false }
            }),
            db.customerAddress.update({
                where: { id: parseInt(id) },
                data: { is_default: true }
            })
        ]);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
