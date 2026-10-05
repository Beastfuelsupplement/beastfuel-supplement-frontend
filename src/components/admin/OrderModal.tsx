import { X, Package, CreditCard, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Order, PaymentDetails } from '@/store/adminStore';
import { formatCurrency } from '@/lib/currency';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onUpdateStatus: (id: string, status: Order['status']) => void;
  onUpdatePaymentStatus: (id: string, paymentStatus: Order['paymentStatus'], paymentDetails?: PaymentDetails) => void;
}

const statuses: Order['status'][] = ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'];
const paymentStatuses: Order['paymentStatus'][] = ['Pending', 'Paid', 'Failed', 'Refunded'];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completed': return 'bg-secondary text-foreground border border-foreground';
    case 'Processing': return 'bg-secondary text-foreground border border-muted-foreground';
    case 'Shipped': return 'bg-secondary text-foreground border border-muted-foreground';
    case 'Pending': return 'bg-secondary text-muted-foreground border border-border';
    case 'Cancelled': return 'bg-secondary text-muted-foreground border border-border';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'Paid': return 'bg-secondary text-foreground border border-foreground';
    case 'Pending': return 'bg-secondary text-muted-foreground border border-border';
    case 'Failed': return 'bg-secondary text-muted-foreground border border-muted-foreground';
    case 'Refunded': return 'bg-secondary text-muted-foreground border border-border';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

const getPaymentMethodIcon = (method?: string) => {
  switch (method) {
    case 'card': return <CreditCard className="h-4 w-4" />;
    case 'paypal': return <span className="text-xs font-bold">PP</span>;
    case 'bank_transfer': return <Banknote className="h-4 w-4" />;
    case 'cash_on_delivery': return <span className="text-xs font-bold">COD</span>;
    default: return <CreditCard className="h-4 w-4" />;
  }
};

const OrderModal = ({ isOpen, onClose, order, onUpdateStatus, onUpdatePaymentStatus }: OrderModalProps) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-display text-xl">ORDER {order.id}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
              <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                Payment: {order.paymentStatus}
              </span>
            </div>
            <p className="text-muted-foreground">Placed on {order.createdAt}</p>
          </div>

          {/* Customer Info */}
          <div className="bg-secondary rounded-lg p-4">
            <h3 className="font-medium mb-3">Customer Information</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{order.customerEmail}</p>
              </div>
              {order.shippingAddress && (
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground">Shipping Address</p>
                  <p className="font-medium">{order.shippingAddress}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          {order.paymentDetails && (
            <div className="bg-secondary rounded-lg p-4">
              <h3 className="font-medium mb-3">Payment Details</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Method</p>
                  <div className="flex items-center gap-2 font-medium">
                    {getPaymentMethodIcon(order.paymentDetails.method)}
                    <span className="capitalize">{order.paymentDetails.method?.replace('_', ' ')}</span>
                  </div>
                </div>
                {order.paymentDetails.cardLast4 && (
                  <div>
                    <p className="text-muted-foreground">Card</p>
                    <p className="font-medium">{order.paymentDetails.cardBrand} •••• {order.paymentDetails.cardLast4}</p>
                  </div>
                )}
                {order.paymentDetails.transactionId && (
                  <div>
                    <p className="text-muted-foreground">Transaction ID</p>
                    <p className="font-medium font-mono text-xs">{order.paymentDetails.transactionId}</p>
                  </div>
                )}
                {order.paymentDetails.paidAt && (
                  <div>
                    <p className="text-muted-foreground">Paid At</p>
                    <p className="font-medium">{order.paymentDetails.paidAt}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div>
            <h3 className="font-medium mb-3">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-background rounded flex items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-lg font-medium">Total</span>
            <span className="text-2xl font-bold">{formatCurrency(order.total)}</span>
          </div>

          {/* Update Order Status */}
          <div className="pt-4 border-t border-border">
            <h3 className="font-medium mb-3">Update Order Status</h3>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <Button
                  key={status}
                  variant={order.status === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onUpdateStatus(order.id, status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          {/* Update Payment Status */}
          <div className="pt-4 border-t border-border">
            <h3 className="font-medium mb-3">Update Payment Status</h3>
            <div className="flex flex-wrap gap-2">
              {paymentStatuses.map((paymentStatus) => (
                <Button
                  key={paymentStatus}
                  variant={order.paymentStatus === paymentStatus ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const updatedDetails: PaymentDetails = {
                      ...order.paymentDetails,
                      method: order.paymentDetails?.method || 'card',
                      paidAt: paymentStatus === 'Paid' ? new Date().toISOString().split('T')[0] : order.paymentDetails?.paidAt,
                    };
                    onUpdatePaymentStatus(order.id, paymentStatus, updatedDetails);
                  }}
                >
                  {paymentStatus}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;