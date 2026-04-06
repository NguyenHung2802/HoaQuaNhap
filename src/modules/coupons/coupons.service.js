const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all coupons with filters
 */
const getAllCoupons = async (query = {}) => {
    const { 
        search, 
        is_active, 
        page = 1, 
        limit = 10 
    } = query;

    const skip = (page - 1) * limit;

    const where = {};
    
    if (search) {
        where.code = { contains: search, mode: 'insensitive' };
    }
    
    if (is_active !== undefined && is_active !== '') {
        where.is_active = is_active === 'true' || is_active === true;
    }

    const [coupons, total] = await Promise.all([
        prisma.coupon.findMany({
            where,
            orderBy: { id: 'desc' },
            skip: parseInt(skip),
            take: parseInt(limit)
        }),
        prisma.coupon.count({ where })
    ]);

    return {
        coupons,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
    };
};

/**
 * Get one coupon by ID
 */
const getCouponById = async (id) => {
    return await prisma.coupon.findUnique({
        where: { id: parseInt(id) }
    });
};

/**
 * Get coupon by code
 */
const getCouponByCode = async (code) => {
    return await prisma.coupon.findUnique({
        where: { code }
    });
};

/**
 * Create coupon
 */
const createCoupon = async (data) => {
    const { 
        code, type, value, min_order_value, max_discount_value, 
        usage_limit, start_at, end_at, is_active 
    } = data;

    return await prisma.coupon.create({
        data: {
            code: code.toUpperCase(),
            type,
            value: parseFloat(value),
            min_order_value: min_order_value ? parseFloat(min_order_value) : null,
            max_discount_value: max_discount_value ? parseFloat(max_discount_value) : null,
            usage_limit: usage_limit ? parseInt(usage_limit) : null,
            start_at: start_at ? new Date(start_at) : null,
            end_at: end_at ? new Date(end_at) : null,
            is_active: is_active === 'true' || is_active === true || is_active === undefined,
        }
    });
};

/**
 * Update coupon
 */
const updateCoupon = async (id, data) => {
    const { 
        code, type, value, min_order_value, max_discount_value, 
        usage_limit, start_at, end_at, is_active 
    } = data;

    return await prisma.coupon.update({
        where: { id: parseInt(id) },
        data: {
            code: code.toUpperCase(),
            type,
            value: parseFloat(value),
            min_order_value: min_order_value ? parseFloat(min_order_value) : null,
            max_discount_value: max_discount_value ? parseFloat(max_discount_value) : null,
            usage_limit: usage_limit ? parseInt(usage_limit) : null,
            start_at: start_at ? new Date(start_at) : null,
            end_at: end_at ? new Date(end_at) : null,
            is_active: is_active === 'true' || is_active === true,
        }
    });
};

/**
 * Delete coupon
 */
const deleteCoupon = async (id) => {
    return await prisma.coupon.delete({
        where: { id: parseInt(id) }
    });
};

module.exports = {
    getAllCoupons,
    getCouponById,
    getCouponByCode,
    createCoupon,
    updateCoupon,
    deleteCoupon
};
