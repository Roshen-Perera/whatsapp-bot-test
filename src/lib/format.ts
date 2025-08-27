import { ProductCategory, ProductItem } from '../types';

export const categoryLabels: Record<ProductCategory, string> = {
    cement: 'Cement & Building Materials',
    paint: 'Paints & Finishing',
    tools: 'Tools & Hardware',
    plumbing: 'Plumbing & Fittings',
    electrical: 'Electrical',
    other: 'Other'
};

export function formatProduct(p: ProductItem): string {
    const avail = p.available ? '✅ In stock' : '❌ Out of stock';
    return `• ${p.name} [${p.id}] - Rs. ${p.price.toLocaleString()} / ${p.unit}\n  ${avail} — ${p.description}`;
}

export function formatProductList(items: ProductItem[], title: string): string {
    if (!items.length) return `No items found in ${title}.`;
    return `🛠️ ${title}\n\n` + items.map(formatProduct).join('\n\n') + `\n\n➡️ Use: add <ID> <qty>\n➡️ Example: add CEM-TS-50 3`;
}
