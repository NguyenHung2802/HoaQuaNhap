const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all customers with pagination & search
 */
const getAllCustomers = async ({ page = 1, limit = 15, search = '' }) => {
    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
        where.OR = [
            { full_name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
        ];
    }

    const [customers, total] = await Promise.all([
        prisma.customer.findMany({
            where,
            orderBy: { created_at: 'desc' },
            skip,
            take: limit,
            include: {
                user: { select: { id: true, email: true, status: true } },
                _count: { select: { orders: true } }
            }
        }),
        prisma.customer.count({ where })
    ]);

    return {
        customers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

/**
 * Get customer by ID with full details
 */
const getCustomerById = async (id) => {
    return await prisma.customer.findUnique({
        where: { id: parseInt(id) },
        include: {
            user: { select: { id: true, email: true, status: true, role: true, last_login_at: true } },
            addresses: { orderBy: { is_default: 'desc' } },
            orders: {
                orderBy: { created_at: 'desc' },
                take: 20,
                select: {
                    id: true,
                    order_code: true,
                    subtotal_amount: true,
                    discount_amount: true,
                    total_amount: true,
                    order_status: true,
                    payment_status: true,
                    created_at: true
                }
            }
        }
    });
};

/**
 * Update customer info (admin editable fields)
 */
const updateCustomer = async (id, data) => {
    const updateData = {};

    if (data.full_name !== undefined) updateData.full_name = data.full_name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.gender !== undefined) updateData.gender = data.gender || null;
    if (data.birthday !== undefined) updateData.birthday = data.birthday ? new Date(data.birthday) : null;
    if (data.note !== undefined) updateData.note = data.note || null;

    return await prisma.customer.update({
        where: { id: parseInt(id) },
        data: updateData
    });
};

/**
 * Delete customer
 */
const deleteCustomer = async (id) => {
    // Check if has orders
    const customer = await prisma.customer.findUnique({
        where: { id: parseInt(id) },
        include: { _count: { select: { orders: true } } }
    });

    if (!customer) throw new Error('Khách hàng không tồn tại.');

    if (customer._count.orders > 0) {
        throw new Error(`Không thể xóa khách hàng này vì đã có ${customer._count.orders} đơn hàng liên kết.`);
    }

    // Delete addresses first, then customer
    await prisma.customerAddress.deleteMany({ where: { customer_id: parseInt(id) } });
    return await prisma.customer.delete({ where: { id: parseInt(id) } });
};

/**
 * Get customer stats for dashboard card
 */
const getCustomerStats = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalCustomers, newThisMonth, topSpenders] = await Promise.all([
        prisma.customer.count(),
        prisma.customer.count({ where: { created_at: { gte: startOfMonth } } }),
        prisma.customer.findMany({
            orderBy: { total_spent: 'desc' },
            take: 5,
            select: {
                id: true,
                full_name: true,
                phone: true,
                total_orders: true,
                total_spent: true
            }
        })
    ]);

    return { totalCustomers, newThisMonth, topSpenders };
};

module.exports = {
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    getCustomerStats
};
