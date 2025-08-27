// Message types
export enum MessageType {
    GREETING = 'greeting',
    PRODUCTS = 'products',
    ORDER = 'order',
    INFO = 'info',
    HELP = 'help',
    UNKNOWN = 'unknown'
}

// Hardware store data types
export interface ProductItem {
    id: string;
    name: string;
    price: number;
    description: string;
    category: ProductCategory;
    available: boolean;
    unit: string; // e.g. "bag", "L", "pcs"
}

export enum ProductCategory {
    CEMENT = 'cement',
    PAINT = 'paint',
    TOOLS = 'tools',
    PLUMBING = 'plumbing',
    ELECTRICAL = 'electrical',
    OTHER = 'other'
}

export interface OrderItem {
    product: ProductItem;
    quantity: number;
    notes?: string;
}

export enum OrderStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    PREPARING = 'preparing',
    READY = 'ready',
    DELIVERED = 'delivered'
}

export interface Order {
    id: string;
    userId: string;
    items: OrderItem[];
    total: number;
    status: OrderStatus;
    createdAt: Date;
}

export interface BusinessHours {
    monday: TimeSlot; tuesday: TimeSlot; wednesday: TimeSlot;
    thursday: TimeSlot; friday: TimeSlot; saturday: TimeSlot; sunday: TimeSlot;
}

export interface TimeSlot {
    open: string;  // "08:00"
    close: string; // "18:00"
    closed?: boolean;
}

// Bot configuration
export interface BotConfig {
    store: {
        name: string;
        phone: string;
        email: string;
        address: string;
        hours: BusinessHours;
    };
    features: {
        enableOrdering: boolean;
        enableDelivery: boolean;
        enableStockCheck: boolean;
    };
}
