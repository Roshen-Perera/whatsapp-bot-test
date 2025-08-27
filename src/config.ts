import { BotConfig } from './types';

export const config: BotConfig = {
    store: {
        name: 'Jayabima Hardware',
        phone: '037-1234567',
        email: 'jayabimahardware@gmail.com',
        address: '123 Main Street, Kurunegala, Sri Lanka',
        hours: {
            monday: { open: '08:00', close: '18:00' },
            tuesday: { open: '08:00', close: '18:00' },
            wednesday: { open: '08:00', close: '18:00' },
            thursday: { open: '08:00', close: '18:00' },
            friday: { open: '08:00', close: '18:00' },
            saturday: { open: '08:00', close: '18:00' },
            sunday: { open: '08:00', close: '13:00' }
        }
    },
    features: {
        enableOrdering: true,
        enableDelivery: true,
        enableStockCheck: true
    }
};
