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
        is_featured, is_best_seller, is_flash_sale, flash_sale_price, flash_sale_end, nutritional_info, images 
    } = data;

    return await prisma.$transaction(async (tx) => {
        // Safety: Ensure slug and sku are unique if they were passed but already exist
        // This is a backup for when the frontend doesn't catch it
        let finalSlug = slug;
        let slugExists = await tx.product.findUnique({ where: { slug: finalSlug } });
        let slugCounter = 1;
        while (slugExists) {
            finalSlug = `${slug}-${slugCounter}`;
            slugExists = await tx.product.findUnique({ where: { slug: finalSlug } });
            slugCounter++;
        }

        let finalSku = sku;
        let skuExists = await tx.product.findUnique({ where: { sku: finalSku } });
        let skuCounter = 1;
        while (skuExists) {
            finalSku = `${sku}-${skuCounter}`;
            skuExists = await tx.product.findUnique({ where: { sku: finalSku } });
            skuCounter++;
        }

        // 1. Create Product
        const product = await tx.product.create({
            data: {
                name, 
                slug: finalSlug, 
                sku: finalSku, 
                short_description, description,
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
                is_flash_sale: is_flash_sale === 'true' || is_flash_sale === true,
                flash_sale_price: flash_sale_price && (is_flash_sale === 'true' || is_flash_sale === true) ? parseFloat(flash_sale_price) : null,
                flash_sale_end: flash_sale_end && (is_flash_sale === 'true' || is_flash_sale === true) ? new Date(flash_sale_end) : null,
                nutritional_info: nutritional_info || null,
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
        is_featured, is_best_seller, is_flash_sale, flash_sale_price, flash_sale_end, nutritional_info, new_images, delete_image_ids 
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
                is_flash_sale: is_flash_sale === 'true' || is_flash_sale === true,
                flash_sale_price: flash_sale_price && (is_flash_sale === 'true' || is_flash_sale === true) ? parseFloat(flash_sale_price) : null,
                flash_sale_end: flash_sale_end && (is_flash_sale === 'true' || is_flash_sale === true) ? new Date(flash_sale_end) : null,
                nutritional_info: nutritional_info,
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

/**
 * Duplicate product
 */
const duplicateProduct = async (id) => {
    const original = await prisma.product.findUnique({
        where: { id: parseInt(id) },
        include: { images: true }
    });

    if (!original) throw new Error('Không tìm thấy sản phẩm gốc');

    const suffix = '-' + Math.random().toString(36).substring(2, 5).toUpperCase();
    
    return await prisma.$transaction(async (tx) => {
        // 1. Create New Product
        const { id: _, created_at, updated_at, images, ...productData } = original;
        
        const duplicated = await tx.product.create({
            data: {
                ...productData,
                name: `${productData.name} (Copy)`,
                sku: `${productData.sku}${suffix}`,
                slug: `${productData.slug}${suffix.toLowerCase()}`,
                status: 'draft', // Set to draft for review
                stock_quantity: 0, // Reset stock for duplicate
            }
        });

        // 2. Copy Images
        if (images && images.length > 0) {
            await tx.productImage.createMany({
                data: images.map(img => ({
                    product_id: duplicated.id,
                    image_url: img.image_url,
                    public_id: img.public_id,
                    is_thumbnail: img.is_thumbnail,
                    sort_order: img.sort_order
                }))
            });
        }

        return duplicated;
    });
};

/**
 * Generate a unique SKU based on a name/base SKU
 */
const getUniqueSkuSuggest = async (name) => {
  // Convert name to slug as base SKU
  const slugify = (text) => {
      return text.toString().toLowerCase()
          .replace(/á|à|ả|ã|ạ|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/g, 'a')
          .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/g, 'e')
          .replace(/i|í|ì|ỉ|ĩ|ị/g, 'i')
          .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/g, 'o')
          .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/g, 'u')
          .replace(/ý|ỳ|ỷ|ỹ|ỵ/g, 'y')
          .replace(/đ/g, 'd')
          .replace(/\s+/g, '-')
          .replace(/[^\w-]+/g, '')
          .replace(/--+/g, '-')
          .replace(/^-+/, '')
          .replace(/-+$/, '');
  };

  const baseSku = slugify(name);
  let suggestSku = baseSku;
  let counter = 1;

  // Check if SKU exists
  let existing = await prisma.product.findUnique({ where: { sku: suggestSku } });
  
  while (existing) {
      suggestSku = `${baseSku}-${counter}`;
      existing = await prisma.product.findUnique({ where: { sku: suggestSku } });
      counter++;
  }

  return suggestSku;
};

/**
 * Generate a unique Slug
 */
const getUniqueSlugSuggest = async (name) => {
    const slugify = (text) => {
        return text.toString().toLowerCase()
            .replace(/á|à|ả|ã|ạ|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/g, 'a')
            .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/g, 'e')
            .replace(/i|í|ì|ỉ|ĩ|ị/g, 'i')
            .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/g, 'o')
            .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/g, 'u')
            .replace(/ý|ỳ|ỷ|ỹ|ỵ/g, 'y')
            .replace(/đ/g, 'd')
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    };

    const baseSlug = slugify(name);
    let suggestSlug = baseSlug;
    let counter = 1;

    let existing = await prisma.product.findUnique({ where: { slug: suggestSlug } });
    while (existing) {
        suggestSlug = `${baseSlug}-${counter}`;
        existing = await prisma.product.findUnique({ where: { slug: suggestSlug } });
        counter++;
    }

    return suggestSlug;
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  getUniqueSkuSuggest,
  getUniqueSlugSuggest
};
