const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAll = async () => {
    return await prisma.shippingCampaign.findMany({
        orderBy: { id: 'desc' }
    });
};

const getById = async (id) => {
    return await prisma.shippingCampaign.findUnique({
        where: { id: parseInt(id) }
    });
};

const create = async (data) => {
    return await prisma.shippingCampaign.create({
        data: {
            name: data.name,
            description: data.description,
            type: data.type,
            value: parseFloat(data.value),
            min_order_value: data.min_order_value ? parseFloat(data.min_order_value) : null,
            max_discount_value: data.max_discount_value ? parseFloat(data.max_discount_value) : null,
            is_active: data.is_active === 'true' || data.is_active === true || data.is_active === undefined,
            start_at: data.start_at ? new Date(data.start_at) : null,
            end_at: data.end_at ? new Date(data.end_at) : null
        }
    });
};

const update = async (id, data) => {
    return await prisma.shippingCampaign.update({
        where: { id: parseInt(id) },
        data: {
            name: data.name,
            description: data.description,
            type: data.type,
            value: parseFloat(data.value),
            min_order_value: data.min_order_value ? parseFloat(data.min_order_value) : null,
            max_discount_value: data.max_discount_value ? parseFloat(data.max_discount_value) : null,
            is_active: data.is_active === 'true' || data.is_active === true,
            start_at: data.start_at ? new Date(data.start_at) : null,
            end_at: data.end_at ? new Date(data.end_at) : null
        }
    });
};

const remove = async (id) => {
    return await prisma.shippingCampaign.delete({
        where: { id: parseInt(id) }
    });
};

module.exports = { getAll, getById, create, update, remove };
