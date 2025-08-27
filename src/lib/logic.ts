import { products } from '../data/products';
import { ProductCategory, ProductItem } from '../types';

export function listByCategory(cat: ProductCategory): ProductItem[] {
    return products.filter(p => p.category === cat);
}

export function searchProducts(keyword: string): ProductItem[] {
    const k = keyword.toLowerCase();
    return products.filter(p =>
        p.name.toLowerCase().includes(k) || p.id.toLowerCase().includes(k)
    );
}

export function findById(id: string): ProductItem | undefined {
    return products.find(p => p.id.toLowerCase() === id.toLowerCase());
}

export function calcTotal(items: { product: ProductItem; quantity: number }[]): number {
    return items.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
}
