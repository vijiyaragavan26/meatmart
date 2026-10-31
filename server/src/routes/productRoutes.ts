import { Router } from 'express';
import {
  getProducts,
  getProductByIdOrSlug,
  getCategories,
  getBrands,
  searchSuggestions,
} from '../controllers/productController';

const router = Router();

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/brands', getBrands);
router.get('/search', searchSuggestions);
router.get('/:id', getProductByIdOrSlug);

export default router;
