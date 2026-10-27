export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "36" | "37" | "38" | "39" | "40" | "41" | "42" | "43" | "44" | "FREE";

export type Category = "shirt" | "tshirt" | "pants" | "jacket" | "dress" | "shoes" | "bag" | "accessory";

export interface ColorOption {
  name: string;
  hex: string;
}

export type ProductStatus = "active" | "draft" | "archived";

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: Category;
  description: string;
  price: number;
  salePrice?: number;
  cost: number;
  colors: ColorOption[];
  /** stock per size */
  stock: Partial<Record<Size, number>>;
  status: ProductStatus;
  featured: boolean;
  rating: number;
  createdAt: number;
}

export type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";
export type PaymentMethod = "online" | "cod" | "card";

export interface OrderItem {
  productId: string;
  name: string;
  category: Category;
  size: Size;
  color: string;
  colorHex: string;
  qty: number;
  price: number;
}

export interface OrderEvent {
  status: OrderStatus;
  at: number;
}

export interface Order {
  id: string;
  number: number;
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  payment: PaymentMethod;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode?: string;
  city: string;
  address: string;
  note?: string;
  createdAt: number;
  events: OrderEvent[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  joinedAt: number;
  note?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  usageLimit: number;
  used: number;
  expiresAt: number;
  active: boolean;
}

export interface Notification {
  id: string;
  kind: "order" | "stock" | "customer" | "system";
  title: string;
  body: string;
  at: number;
  read: boolean;
  href?: string;
}

export interface Activity {
  id: string;
  text: string;
  at: number;
}

export type AccentKey = "emerald" | "indigo" | "rose" | "amber" | "slate";

export interface Settings {
  storeName: string;
  email: string;
  phone: string;
  address: string;
  lowStockThreshold: number;
  shippingFee: number;
  freeShippingFrom: number;
  liveOrders: boolean;
  accent: AccentKey;
  notifyOrders: boolean;
  notifyStock: boolean;
}
