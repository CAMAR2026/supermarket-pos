// Response shapes mirror the original MongoDB API (`_id`, nested refs) so the React app keeps working.

type Ref = Record<string, unknown> | null | undefined;

const ref = (row: Ref) => {
  if (!row || row.id === null || row.id === undefined) return null;
  const { id, ...rest } = row;
  return { _id: id, ...rest };
};

export const withId = <T extends { id: number }>(row: T) => ({ _id: row.id, ...row });

export const userOut = (u: {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
  isActive: boolean;
  createdAt?: Date;
}) => ({
  id: u.id,
  _id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  phone: u.phone,
  isActive: u.isActive,
  createdAt: u.createdAt,
});

export const productOut = (p: Record<string, any>, category: Ref) => {
  const { categoryId, ...rest } = p;
  return { _id: p.id, ...rest, category: ref(category) ?? categoryId };
};

export const saleOut = (s: Record<string, any>, cashier?: Ref, customer?: Ref) => {
  const { cashierId, customerId, ...rest } = s;
  return {
    _id: s.id,
    ...rest,
    cashier: cashier === undefined ? cashierId : ref(cashier),
    customer: customer === undefined ? customerId : ref(customer),
  };
};

export const inventoryOut = (l: Record<string, any>, product: Ref, user: Ref, sale: Ref) => {
  const { productId, userId, saleId, ...rest } = l;
  return { _id: l.id, ...rest, product: ref(product), user: ref(user), sale: ref(sale) };
};
