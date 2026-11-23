import { money, formatDate } from '../utils/format';

const Receipt = ({ sale, settings }) => {
  if (!sale) return null;
  const currency = settings?.currency || 'KSh';

  return (
    <div id="print-area" className="mx-auto max-w-sm bg-white p-6 text-sm text-slate-800">
      {settings?.logo && (
        <img src={settings.logo} alt="" className="mx-auto mb-3 h-12 object-contain" />
      )}
      <div className="text-center">
        <h2 className="text-lg font-bold">{settings?.storeName || 'SuperMarket POS'}</h2>
        <p>{settings?.address}</p>
        <p>{settings?.phone}</p>
      </div>
      <div className="my-4 border-t border-dashed border-slate-300" />
      <p>Receipt: {sale.receiptNumber}</p>
      <p>Date: {formatDate(sale.createdAt)}</p>
      <p>Cashier: {sale.cashier?.name}</p>
      {sale.customer && <p>Customer: {sale.customer.name}</p>}
      <div className="my-4 border-t border-dashed border-slate-300" />
      <table className="w-full">
        <thead>
          <tr className="text-left">
            <th>Item</th>
            <th>Qty</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item) => (
            <tr key={`${item.sku}-${item.name}`}>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
              <td className="text-right">{money(item.total, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="my-4 border-t border-dashed border-slate-300" />
      <p className="flex justify-between">
        <span>Subtotal</span>
        <span>{money(sale.subtotal, currency)}</span>
      </p>
      <p className="flex justify-between">
        <span>Discount</span>
        <span>{money(sale.discount, currency)}</span>
      </p>
      <p className="flex justify-between">
        <span>Tax</span>
        <span>{money(sale.tax, currency)}</span>
      </p>
      <p className="flex justify-between text-base font-bold">
        <span>Total</span>
        <span>{money(sale.total, currency)}</span>
      </p>
      <p className="flex justify-between">
        <span>Paid ({sale.paymentMethod})</span>
        <span>{money(sale.amountPaid, currency)}</span>
      </p>
      <p className="flex justify-between">
        <span>Change</span>
        <span>{money(sale.change, currency)}</span>
      </p>
      {sale.mpesaReference && <p>M-Pesa: {sale.mpesaReference}</p>}
      <p className="mt-6 text-center text-xs">{settings?.receiptFooter}</p>
    </div>
  );
};

export default Receipt;
