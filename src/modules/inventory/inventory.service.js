const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get inventory history
 */
const getLogs = async (query = {}) => {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
        prisma.inventoryLog.findMany({
            include: {
                product: {
                    select: { name: true, sku: true }
                }
            },
            orderBy: { created_at: 'desc' },
            skip: parseInt(skip),
            take: parseInt(limit)
        }),
        prisma.inventoryLog.count()
    ]);

    return {
        logs,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
    };
};

module.exports = {
    getLogs
};
