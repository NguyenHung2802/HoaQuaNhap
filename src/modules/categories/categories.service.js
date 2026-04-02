const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all categories with parent info
 */
const getAllCategories = async () => {
    return await prisma.category.findMany({
        orderBy: [
            { sort_order: 'asc' },
            { name: 'asc' }
        ]
    });
};

/**
 * Create new category
 * @param {Object} data 
 */
const createCategory = async (data) => {
    return await prisma.category.create({
        data: {
            name: data.name,
            slug: data.slug,
            description: data.description,
            image_url: data.image_url,
            parent_id: data.parent_id ? parseInt(data.parent_id) : null,
            sort_order: parseInt(data.sort_order) || 0,
            is_active: data.is_active === 'true' || data.is_active === true
        }
    });
};

/**
 * Get category by ID
 * @param {number} id 
 */
const getCategoryById = async (id) => {
    return await prisma.category.findUnique({
        where: { id: parseInt(id) }
    });
};

/**
 * Update category
 * @param {number} id 
 * @param {Object} data 
 */
const updateCategory = async (id, data) => {
    const updateData = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        sort_order: parseInt(data.sort_order) || 0,
        is_active: data.is_active === 'true' || data.is_active === true
    };
    
    if (data.image_url) updateData.image_url = data.image_url;
    if (data.parent_id !== undefined) updateData.parent_id = data.parent_id ? parseInt(data.parent_id) : null;
    
    return await prisma.category.update({
        where: { id: parseInt(id) },
        data: updateData
    });
};

/**
 * Delete category (need to check if it has products)
 * @param {number} id 
 */
const deleteCategory = async (id) => {
    // Check if category has products
    const productCount = await prisma.product.count({
        where: { category_id: parseInt(id) }
    });
    
    if (productCount > 0) {
        throw new Error('Không thể xóa danh mục đang chứa sản phẩm.');
    }
    
    return await prisma.category.delete({
        where: { id: parseInt(id) }
    });
};

module.exports = {
    getAllCategories,
    createCategory,
    getCategoryById,
    updateCategory,
    deleteCategory
};
