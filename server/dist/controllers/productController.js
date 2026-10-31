"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProducts = getProducts;
exports.getProductByIdOrSlug = getProductByIdOrSlug;
exports.getCategories = getCategories;
exports.getBrands = getBrands;
exports.searchSuggestions = searchSuggestions;
const db_1 = require("../config/db");
async function getProducts(req, res) {
    try {
        const { category, brand, search, featured, bestseller, meatType, sort } = req.query;
        let products = [];
        if (db_1.isPostgresConnected) {
            const where = { isAvailable: true };
            if (category) {
                where.category = { slug: String(category) };
            }
            if (brand) {
                where.brand = { slug: String(brand) };
            }
            if (featured === 'true') {
                where.isFeatured = true;
            }
            if (bestseller === 'true') {
                where.isBestSeller = true;
            }
            if (meatType) {
                where.meatType = String(meatType);
            }
            if (search) {
                where.OR = [
                    { name: { contains: String(search), mode: 'insensitive' } },
                    { description: { contains: String(search), mode: 'insensitive' } },
                ];
            }
            let orderBy = { createdAt: 'desc' };
            if (sort === 'price-low')
                orderBy = { price: 'asc' };
            if (sort === 'price-high')
                orderBy = { price: 'desc' };
            if (sort === 'rating')
                orderBy = { averageRating: 'desc' };
            products = await db_1.prisma.product.findMany({
                where,
                include: {
                    category: true,
                    brand: true,
                    images: true,
                    inventory: true,
                },
                orderBy,
            });
        }
        else {
            products = [...db_1.memDb.products].filter(p => p.isAvailable);
            if (category) {
                const cat = db_1.memDb.categories.find(c => c.slug === category || c.id === category);
                if (cat) {
                    products = products.filter(p => p.categoryId === cat.id);
                }
            }
            if (brand) {
                const br = db_1.memDb.brands.find(b => b.slug === brand || b.id === brand);
                if (br) {
                    products = products.filter(p => p.brandId === br.id);
                }
            }
            if (featured === 'true') {
                products = products.filter(p => p.isFeatured);
            }
            if (bestseller === 'true') {
                products = products.filter(p => p.isBestSeller);
            }
            if (meatType) {
                products = products.filter(p => p.meatType === meatType);
            }
            if (search) {
                const query = String(search).toLowerCase();
                products = products.filter(p => p.name.toLowerCase().includes(query) ||
                    p.description.toLowerCase().includes(query) ||
                    (p.ingredients && p.ingredients.toLowerCase().includes(query)));
            }
            // Attach full category & brand objects
            products = products.map(p => ({
                ...p,
                category: db_1.memDb.categories.find(c => c.id === p.categoryId),
                brand: db_1.memDb.brands.find(b => b.id === p.brandId),
            }));
            if (sort === 'price-low') {
                products.sort((a, b) => a.price - b.price);
            }
            else if (sort === 'price-high') {
                products.sort((a, b) => b.price - a.price);
            }
            else if (sort === 'rating') {
                products.sort((a, b) => b.averageRating - a.averageRating);
            }
        }
        res.json({
            success: true,
            count: products.length,
            products,
        });
    }
    catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ message: 'Error retrieving products' });
    }
}
async function getProductByIdOrSlug(req, res) {
    try {
        const { id } = req.params;
        let product = null;
        if (db_1.isPostgresConnected) {
            product = await db_1.prisma.product.findFirst({
                where: { OR: [{ id }, { slug: id }] },
                include: {
                    category: true,
                    brand: true,
                    images: true,
                    inventory: true,
                    reviews: { include: { user: { select: { fullName: true } } } },
                },
            });
        }
        else {
            product = db_1.memDb.products.find(p => p.id === id || p.slug === id);
            if (product) {
                product = {
                    ...product,
                    category: db_1.memDb.categories.find(c => c.id === product.categoryId),
                    brand: db_1.memDb.brands.find(b => b.id === product.brandId),
                    reviews: db_1.memDb.reviews.filter(r => r.productId === product.id),
                };
            }
        }
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        // Related products in the same category
        let related = [];
        if (!db_1.isPostgresConnected) {
            related = db_1.memDb.products
                .filter(p => p.categoryId === product.categoryId && p.id !== product.id)
                .slice(0, 4)
                .map(p => ({
                ...p,
                category: db_1.memDb.categories.find(c => c.id === p.categoryId),
                brand: db_1.memDb.brands.find(b => b.id === p.brandId),
            }));
        }
        res.json({
            product,
            related,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function getCategories(req, res) {
    try {
        let categories = [];
        if (db_1.isPostgresConnected) {
            categories = await db_1.prisma.productCategory.findMany({
                where: { isActive: true },
                orderBy: { displayOrder: 'asc' },
            });
        }
        else {
            categories = db_1.memDb.categories.filter(c => c.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
        }
        res.json(categories);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function getBrands(req, res) {
    try {
        let brands = [];
        if (db_1.isPostgresConnected) {
            brands = await db_1.prisma.brand.findMany({ where: { isActive: true } });
        }
        else {
            brands = db_1.memDb.brands;
        }
        res.json(brands);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function searchSuggestions(req, res) {
    try {
        const q = String(req.query.q || '').trim().toLowerCase();
        if (!q)
            return res.json([]);
        const results = db_1.memDb.products
            .filter(p => p.name.toLowerCase().includes(q) || (p.ingredients && p.ingredients.toLowerCase().includes(q)))
            .slice(0, 6)
            .map(p => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            unit: p.unit,
            imageUrl: p.images[0]?.imageUrl,
            isPackaged: p.isPackaged,
        }));
        res.json(results);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
