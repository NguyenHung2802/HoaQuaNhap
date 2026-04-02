const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all products with filters and search
 */
const getAllProducts = async (query = {}) => {
    const { 
        search, 
        category_id, 
        status, 
        page = 1, 
        limit = 10 
    } = query;

    const skip = (page - 1) * limit;

    const where = {};
    
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } }
        ];
    }
    
    if (category_id) {
        where.category_id = parseInt(category_id);
    }
    
    if (status) {
        where.status = status;
    }

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            include: {
                category: {
                    select: { name: true }
                },
                images: {
                    where: { is_thumbnail: true },
                    take: 1
                }
            },
            orderBy: { created_at: 'desc' },
            skip: parseInt(skip),
            take: parseInt(limit)
        }),
        prisma.product.count({ where })
    ]);

    return {
        products,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
    };
};

/**
 * Get one product by ID
 */
const getProductById = async (id) => {
    return await prisma.product.findUnique({
        where: { id: parseInt(id) },
        include: {
            images: {
              orderBy: { sort_order: 'asc' }
            },
            category: true
        }
    });
};

/**
 * Create product
 */
const createProduct = async (data) => {
    const { 
        name, slug, sku, short_description, description, 
        category_id, origin_country, unit, weight_value, 
        packing_type, price, sale_price, cost_price, 
        stock_quantity, min_stock_alert, status, 
        is_featured, is_best_seller, images 
    } = data;

    return await prisma.$transaction(async (tx) => {
        // 1. Create Product
        const product = await tx.product.create({
            data: {
                name, slug, sku, short_description, description,
                category_id: parseInt(category_id),
                origin_country, unit,
                weight_value: weight_value ? parseFloat(weight_value) : null,
                packing_type,
                price: parseFloat(price),
                sale_price: sale_price ? parseFloat(sale_price) : null,
                cost_price: cost_price ? parseFloat(cost_price) : null,
                stock_quantity: parseInt(stock_quantity) || 0,
                min_stock_alert: parseInt(min_stock_alert) || 5,
                status: status || 'published',
                is_featured: is_featured === 'true' || is_featured === true,
                is_best_seller: is_best_seller === 'true' || is_best_seller === true,
            }
        });

        // 2. Create images if any
        if (images && images.length > 0) {
            await tx.productImage.createMany({
                data: images.map((img, index) => ({
                    product_id: product.id,
                    image_url: img.url,
                    public_id: img.public_id,
                    is_thumbnail: index === 0, // Assume first is thumbnail
                    sort_order: index
                }))
            });
        }

        // 3. Create initial inventory log (optional but good)
        if (parseInt(stock_quantity) > 0) {
          await tx.inventoryLog.create({
            data: {
              product_id: product.id,
              type: 'import',
              quantity: parseInt(stock_quantity),
              before_quantity: 0,
              after_quantity: parseInt(stock_quantity),
              note: 'Nhập kho ban đầu khi tạo sản phẩm'
            }
          });
        }

        return product;
    });
};

/**
 * Update product
 */
const updateProduct = async (id, data) => {
    const { 
        name, slug, sku, short_description, description, 
        category_id, origin_country, unit, weight_value, 
        packing_type, price, sale_price, cost_price, 
        stock_quantity, min_stock_alert, status, 
        is_featured, is_best_seller, new_images, delete_image_ids 
    } = data;

    return await prisma.$transaction(async (tx) => {
        // 0. Get current product to check stock
        const currentProduct = await tx.product.findUnique({
            where: { id: parseInt(id) },
            select: { stock_quantity: true }
        });

        // 1. Update Product
        const product = await tx.product.update({
            where: { id: parseInt(id) },
            data: {
                name, slug, sku, short_description, description,
                category_id: parseInt(category_id),
                origin_country, unit,
                weight_value: weight_value ? parseFloat(weight_value) : null,
                packing_type,
                price: parseFloat(price),
                sale_price: sale_price ? parseFloat(sale_price) : null,
                cost_price: cost_price ? parseFloat(cost_price) : null,
                stock_quantity: parseInt(stock_quantity) || 0,
                min_stock_alert: parseInt(min_stock_alert) || 5,
                status: status || 'published',
                is_featured: is_featured === 'true' || is_featured === true,
                is_best_seller: is_best_seller === 'true' || is_best_seller === true,
            }
        });

        // 1.1 Log stock change if any
        if (currentProduct && currentProduct.stock_quantity !== parseInt(stock_quantity)) {
            const diff = parseInt(stock_quantity) - currentProduct.stock_quantity;
            await tx.inventoryLog.create({
                data: {
                    product_id: product.id,
                    type: 'adjust',
                    quantity: diff,
                    before_quantity: currentProduct.stock_quantity,
                    after_quantity: parseInt(stock_quantity),
                    note: 'Admin điều chỉnh kho thủ công'
                }
            });
        }

        // 2. Delete images
        if (delete_image_ids && delete_image_ids.length > 0) {
          await tx.productImage.deleteMany({
            where: { id: { in: delete_image_ids.map(id => parseInt(id)) } }
          });
        }

        // 3. Add new images
        if (new_images && new_images.length > 0) {
          // Get current highest sort_order
          const currentMax = await tx.productImage.findFirst({
            where: { product_id: parseInt(id) },
            orderBy: { sort_order: 'desc' }
          });
          const startOrder = currentMax ? currentMax.sort_order + 1 : 0;

          await tx.productImage.createMany({
            data: new_images.map((img, index) => ({
              product_id: parseInt(id),
              image_url: img.url,
              public_id: img.public_id,
              is_thumbnail: startOrder === 0 && index === 0, 
              sort_order: startOrder + index
            }))
          });
        }

        return product;
    });
};

/**
 * Delete product
 */
const deleteProduct = async (id) => {
  return await prisma.product.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
