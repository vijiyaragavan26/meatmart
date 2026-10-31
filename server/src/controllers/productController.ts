import { Request, Response } from 'express';
import { memDb, prisma, isPostgresConnected } from '../config/db';

export async function getProducts(req: Request, res: Response) {
  try {
    const { category, brand, search, featured, bestseller, meatType, sort } = req.query;

    let products: any[] = [];
    if (isPostgresConnected) {
      const where: any = { isAvailable: true };
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

      let orderBy: any = { createdAt: 'desc' };
      if (sort === 'price-low') orderBy = { price: 'asc' };
      if (sort === 'price-high') orderBy = { price: 'desc' };
      if (sort === 'rating') orderBy = { averageRating: 'desc' };

      products = await prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          images: true,
          inventory: true,
        },
        orderBy,
      });
    } else {
      products = [...memDb.products].filter(p => p.isAvailable);

      if (category) {
        const cat = memDb.categories.find(c => c.slug === category || c.id === category);
        if (cat) {
          products = products.filter(p => p.categoryId === cat.id);
        }
      }

      if (brand) {
        const br = memDb.brands.find(b => b.slug === brand || b.id === brand);
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
        products = products.filter(
          p =>
            p.name.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query) ||
            (p.ingredients && p.ingredients.toLowerCase().includes(query))
        );
      }

      // Attach full category & brand objects
      products = products.map(p => ({
        ...p,
        category: memDb.categories.find(c => c.id === p.categoryId),
        brand: memDb.brands.find(b => b.id === p.brandId),
      }));

      if (sort === 'price-low') {
        products.sort((a, b) => a.price - b.price);
      } else if (sort === 'price-high') {
        products.sort((a, b) => b.price - a.price);
      } else if (sort === 'rating') {
        products.sort((a, b) => b.averageRating - a.averageRating);
      }
    }

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (err: any) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Error retrieving products' });
  }
}

export async function getProductByIdOrSlug(req: Request, res: Response) {
  try {
    const { id } = req.params;

    let product: any = null;
    if (isPostgresConnected) {
      product = await prisma.product.findFirst({
        where: { OR: [{ id }, { slug: id }] },
        include: {
          category: true,
          brand: true,
          images: true,
          inventory: true,
          reviews: { include: { user: { select: { fullName: true } } } },
        },
      });
    } else {
      product = memDb.products.find(p => p.id === id || p.slug === id);
      if (product) {
        product = {
          ...product,
          category: memDb.categories.find(c => c.id === product.categoryId),
          brand: memDb.brands.find(b => b.id === product.brandId),
          reviews: memDb.reviews.filter(r => r.productId === product.id),
        };
      }
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Related products in the same category
    let related: any[] = [];
    if (!isPostgresConnected) {
      related = memDb.products
        .filter(p => p.categoryId === product.categoryId && p.id !== product.id)
        .slice(0, 4)
        .map(p => ({
          ...p,
          category: memDb.categories.find(c => c.id === p.categoryId),
          brand: memDb.brands.find(b => b.id === p.brandId),
        }));
    }

    res.json({
      product,
      related,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function getCategories(req: Request, res: Response) {
  try {
    let categories: any[] = [];
    if (isPostgresConnected) {
      categories = await prisma.productCategory.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      });
    } else {
      categories = memDb.categories.filter(c => c.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
    }
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function getBrands(req: Request, res: Response) {
  try {
    let brands: any[] = [];
    if (isPostgresConnected) {
      brands = await prisma.brand.findMany({ where: { isActive: true } });
    } else {
      brands = memDb.brands;
    }
    res.json(brands);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function searchSuggestions(req: Request, res: Response) {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    if (!q) return res.json([]);

    const results = memDb.products
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
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}
