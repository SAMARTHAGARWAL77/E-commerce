// E-commerce Schema for Keystone.js
//   This schema defines the core entities for an e-commerce application:
//   Users, Products, Orders, and OrderItems
//
// Based on the ER diagram in ER_Diagram.md, this implements:
// - User management with authentication
// - Product catalog with pricing
// - Order management with status tracking
// - Order items with product snapshots for historical accuracy

import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'

// Import Keystone field types
import {
  text,
  relationship,
  password,
  timestamp,
  select,
  integer,
  checkbox,
} from '@keystone-6/core/fields'

// Import generated types for TypeScript support
import { type Lists } from '.keystone/types'

export const lists = {
  // User entity - handles authentication and customer data
  User: list({
    // WARNING: Currently using allowAll for development
    // Replace with proper access control for production
    access: allowAll,

    fields: {
      // Full name for display and shipping
      name: text({ 
        validation: { isRequired: true },
        label: 'Full Name'
      }),

      // Email for authentication and communication
      email: text({
        validation: { isRequired: true },
        isIndexed: 'unique',
        label: 'Email Address'
      }),

      // Password for authentication
      password: password({ 
        validation: { isRequired: true },
        label: 'Password'
      }),

      // Relationship to orders placed by this user
      orders: relationship({ 
        ref: 'Order.user', 
        many: true,
        ui: {
          displayMode: 'count',
        }
      }),

      // Timestamps for user management
      createdAt: timestamp({
        defaultValue: { kind: 'now' },
        label: 'Created At'
      }),

      updatedAt: timestamp({
        defaultValue: { kind: 'now' },
        db: { updatedAt: true },
        label: 'Updated At'
      }),
    },
  }),

  // Product entity - catalog items available for purchase
  Product: list({
    access: allowAll,

    fields: {
      // Product name
      name: text({ 
        validation: { isRequired: true },
        label: 'Product Name'
      }),

      // Product description
      description: text({ 
        ui: { displayMode: 'textarea' },
        label: 'Description'
      }),

      // Price stored in cents to avoid floating point issues
      priceCents: integer({ 
        validation: { isRequired: true, min: 0 },
        label: 'Price (cents)',
        ui: {
          description: 'Price in cents (e.g., 2999 for $29.99)'
        }
      }),

      // Currency code (ISO 4217)
      currencyCode: text({ 
        validation: { isRequired: true },
        defaultValue: 'USD',
        label: 'Currency Code',
        ui: {
          description: 'ISO 4217 currency code (e.g., USD, EUR, GBP)'
        }
      }),

      // Whether product is available for purchase
      isActive: checkbox({ 
        defaultValue: true,
        label: 'Is Active',
        ui: {
          description: 'Uncheck to hide product from catalog'
        }
      }),

      // Relationship to order items
      orderItems: relationship({ 
        ref: 'OrderItem.product', 
        many: true,
        ui: {
          displayMode: 'count',
        }
      }),

      // Timestamps
      createdAt: timestamp({
        defaultValue: { kind: 'now' },
        label: 'Created At'
      }),

      updatedAt: timestamp({
        defaultValue: { kind: 'now' },
        db: { updatedAt: true },
        label: 'Updated At'
      }),
    },

    // UI configuration
    ui: {
      listView: {
        initialColumns: ['name', 'priceCents', 'currencyCode', 'isActive'],
        initialSort: { field: 'createdAt', direction: 'DESC' },
        pageSize: 50,
      },
    },
  }),

  // Order entity - customer orders with status tracking
  Order: list({
    access: allowAll,

    fields: {
      // Customer who placed the order
      user: relationship({ 
        ref: 'User.orders',
        ui: {
          displayMode: 'cards',
          cardFields: ['name', 'email'],
          linkToItem: true,
          inlineConnect: true,
        }
      }),

      // Order status
      status: select({
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Paid', value: 'paid' },
          { label: 'Cancelled', value: 'cancelled' },
        ],
        defaultValue: 'pending',
        validation: { isRequired: true },
        label: 'Order Status'
      }),

      // Currency for this order
      currencyCode: text({ 
        validation: { isRequired: true },
        defaultValue: 'USD',
        label: 'Currency Code'
      }),

      // Total order amount in cents
      totalCents: integer({ 
        validation: { isRequired: true, min: 0 },
        label: 'Total (cents)',
        ui: {
          description: 'Total order amount in cents'
        }
      }),

      // Order items in this order
      orderItems: relationship({ 
        ref: 'OrderItem.order', 
        many: true,
        ui: {
          displayMode: 'cards',
          cardFields: ['productNameSnapshot', 'quantity', 'unitPriceCents'],
          linkToItem: true,
          inlineCreate: { fields: ['product', 'quantity'] },
          inlineEdit: { fields: ['quantity'] },
        }
      }),

      // Timestamps
      createdAt: timestamp({
        defaultValue: { kind: 'now' },
        label: 'Created At'
      }),

      updatedAt: timestamp({
        defaultValue: { kind: 'now' },
        db: { updatedAt: true },
        label: 'Updated At'
      }),
    },

    // UI configuration
    ui: {
      listView: {
        initialColumns: ['user', 'status', 'totalCents', 'createdAt'],
        initialSort: { field: 'createdAt', direction: 'DESC' },
        pageSize: 50,
      },
    },
  }),

  // OrderItem entity - individual line items within orders
  // Snapshots product data at time of purchase for historical accuracy
  OrderItem: list({
    access: allowAll,

    fields: {
      // Parent order
      order: relationship({ 
        ref: 'Order.orderItems',
        ui: {
          displayMode: 'cards',
          cardFields: ['user', 'status', 'createdAt'],
          linkToItem: true,
          inlineConnect: true,
        }
      }),

      // Product reference (for analytics, not display)
      product: relationship({ 
        ref: 'Product.orderItems',
        ui: {
          displayMode: 'cards',
          cardFields: ['name', 'priceCents'],
          linkToItem: true,
          inlineConnect: true,
        }
      }),

      // Snapshot of product name at time of purchase
      productNameSnapshot: text({ 
        validation: { isRequired: true },
        label: 'Product Name (at time of purchase)',
        ui: {
          description: 'Product name captured when order was placed'
        }
      }),

      // Unit price at time of purchase
      unitPriceCents: integer({ 
        validation: { isRequired: true, min: 0 },
        label: 'Unit Price (cents)',
        ui: {
          description: 'Price per unit at time of purchase'
        }
      }),

      // Quantity ordered
      quantity: integer({ 
        validation: { isRequired: true, min: 1 },
        defaultValue: 1,
        label: 'Quantity'
      }),

      // Line total (quantity × unit price)
      // Note: Keystone doesn't have computed fields, so this needs to be calculated in hooks
      lineTotalCents: integer({ 
        validation: { isRequired: true, min: 0 },
        label: 'Line Total (cents)',
        ui: {
          description: 'Total for this line item (quantity × unit price)'
        }
      }),
    },

    // Hooks to calculate line total and populate snapshots
    hooks: {
      // Populate snapshot fields and compute line total before writing
      // Keystone hook docs: https://keystonejs.com/docs/config/hooks
      resolveInput: async (args) => {
        const { operation, resolvedData, item, context } = args;
        const data: any = { ...resolvedData };

        // Helper: resolve current or new quantity
        const resolveQuantity = (): number => {
          if (typeof data.quantity === 'number') {
            return data.quantity;
          }
          return item?.quantity ?? 1;
        };

        // Helper: resolve productId considering operation and relation input
        const resolveProductId = (): string | undefined => {
          if (data.product?.connect?.id) {
            return data.product.connect.id;
          }
          if (operation === 'update' && !data.product && item?.productId) {
            return item.productId;
          }
          return undefined;
        };

        const productId = resolveProductId();

        // Populate snapshot fields only if missing
        console.log('OrderItem resolveInput:', { operation, data, item });
        const needName = data.productNameSnapshot === undefined || data.productNameSnapshot === null || data.productNameSnapshot === '';
        console.log('Need name:', needName, 'Need price:', data.unitPriceCents === undefined);
        const needPrice = data.unitPriceCents === undefined;
        if (productId && (needName || needPrice)) {
          try {
            const product = await context.db.Product.findOne({ where: { id: productId } });
            if (product) {
              console.log('Fetched product for snapshot:', product);
              if (needName) data.productNameSnapshot = product.name;
              if (needPrice) data.unitPriceCents = product.priceCents;
            }
          } catch (e) {
            console.warn('Failed to fetch product for snapshot', e);
          }
        }

        const quantity = resolveQuantity();
        const unitPrice: number = typeof data.unitPriceCents === 'number' ? data.unitPriceCents : (item?.unitPriceCents ?? 0);
        data.lineTotalCents = quantity * unitPrice;
        return data;
      },
      // After any change to OrderItem, recalculate parent Order total
      afterOperation: async ({ operation, item, originalItem, context }) => {
        // For delete, item is undefined; use originalItem
        const effectiveItem: any = item || originalItem;
        if (!effectiveItem?.orderId) return;
        const orderId = effectiveItem.orderId as string;
        try {
          // Fetch all order items for this order
            const orderItems = await context.db.OrderItem.findMany({
            where: { order: { id: { equals: orderId } } },
          });
          const total = orderItems.reduce((sum: number, oi: any) => sum + (oi.lineTotalCents || 0), 0);
          await context.db.Order.updateOne({ where: { id: orderId }, data: { totalCents: total } });
        } catch (e) {
          console.error('Failed to recalc order total', e);
        }
      }
    },

    // UI configuration
    ui: {
      listView: {
        initialColumns: ['order', 'productNameSnapshot', 'quantity', 'unitPriceCents', 'lineTotalCents'],
        initialSort: { field: 'order', direction: 'DESC' },
        pageSize: 50,
      },
      // Hide from main navigation (access via orders)
      isHidden: true,
    },
  }),
} satisfies Lists