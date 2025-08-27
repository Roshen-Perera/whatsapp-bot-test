import { ProductCategory, ProductItem } from '../types';

export const products: ProductItem[] = [
    {
        id: 'CEM-TS-50',
        name: 'Tokyo Super Cement 50kg',
        price: 2200,
        description: 'High-strength Portland cement',
        category: ProductCategory.CEMENT,
        available: true,
        unit: 'bag'
    },
    {
        id: 'CEM-HOL-50',
        name: 'Holcim Cement 50kg',
        price: 2150,
        description: 'General purpose cement',
        category: ProductCategory.CEMENT,
        available: true,
        unit: 'bag'
    },
    {
        id: 'PAI-NIP-4L',
        name: 'Nippon Weatherbond 4L',
        price: 6500,
        description: 'Exterior emulsion paint',
        category: ProductCategory.PAINT,
        available: true,
        unit: 'L'
    },
    {
        id: 'TOO-BOS-DRL',
        name: 'Bosch Impact Drill 13mm',
        price: 18990,
        description: '650W impact drill with case',
        category: ProductCategory.TOOLS,
        available: true,
        unit: 'pcs'
    },
    {
        id: 'PLU-PVC-1',
        name: 'PVC Pipe 1" (10ft)',
        price: 1150,
        description: 'Class M PVC pipe',
        category: ProductCategory.PLUMBING,
        available: true,
        unit: 'pcs'
    },
    {
        id: 'ELE-LED-12W',
        name: 'LED Bulb 12W',
        price: 520,
        description: 'Cool white, E27',
        category: ProductCategory.ELECTRICAL,
        available: true,
        unit: 'pcs'
    }
];
