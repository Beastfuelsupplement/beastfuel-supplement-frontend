import { Order, DeletedOrder } from '@/store/adminStore';
import { formatCurrency } from '@/lib/currency';

interface FilterInfo {
  status?: string;
  payment?: string;
  search?: string;
}

const getBasePrintStyles = () => `
  <style>
    @page {
      size: A4;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 12px;
      line-height: 1.5;
    }
    .print-header {
      border-bottom: 2px solid #111827;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
      margin: 0 0 2px 0;
      text-transform: uppercase;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 0;
    }
    .report-meta {
      text-align: right;
    }
    .report-title {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px 0;
      letter-spacing: 0.5px;
    }
    .report-meta-item {
      font-size: 11px;
      color: #475569;
      margin: 2px 0;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }
    .summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
    }
    .summary-card.accent-red {
      background: #fff1f2;
      border-color: #fecdd3;
    }
    .summary-label {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #64748b;
      margin: 0 0 4px 0;
    }
    .summary-value {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .summary-card.accent-red .summary-value {
      color: #be123c;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 20px;
    }
    th {
      background-color: #f1f5f9;
      color: #334155;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 10px;
      text-align: left;
      border-top: 1px solid #cbd5e1;
      border-bottom: 2px solid #cbd5e1;
    }
    td {
      padding: 8px 10px;
      font-size: 11px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    tr:nth-child(even) td {
      background-color: #fafafa;
    }
    .badge {
      display: inline-block;
      padding: 2px 7px;
      font-size: 9px;
      font-weight: 700;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-paid, .badge-completed {
      background-color: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
    }
    .badge-pending {
      background-color: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .badge-shipped, .badge-processing {
      background-color: #ede9fe;
      color: #5b21b6;
      border: 1px solid #ddd6fe;
    }
    .badge-cancelled, .badge-failed {
      background-color: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .font-bold { font-weight: 700; }
    .print-footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 12px;
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      color: #64748b;
      font-size: 10px;
    }
    .items-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .items-list li {
      margin-bottom: 2px;
    }
    .notice-box {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 10px 14px;
      margin-bottom: 16px;
      border-radius: 4px;
    }
    .notice-title {
      font-weight: 700;
      color: #991b1b;
      font-size: 11px;
      margin: 0 0 2px 0;
    }
    .notice-text {
      color: #7f1d1d;
      font-size: 10px;
      margin: 0;
    }
  </style>
`;

const openPrintWindow = (title: string, htmlContent: string) => {
  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        ${getBasePrintStyles()}
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;

  // Create an invisible iframe for reliable print without popup blocker or theme issues
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(fullHtml);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }, 250);
  }
};

/**
 * Print Master / Filtered Orders Report
 */
export const printOrdersReport = (
  orders: Order[],
  filterInfo?: FilterInfo
) => {
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalItemsCount = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
  const completedCount = orders.filter((o) => o.status === 'Completed').length;
  const pendingCount = orders.filter((o) => o.status === 'Pending').length;
  const shippedCount = orders.filter((o) => o.status === 'Shipped').length;
  const cancelledCount = orders.filter((o) => o.status === 'Cancelled').length;

  const dateStr = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const filterSummary = [
    filterInfo?.status && filterInfo.status !== 'All' ? `Status: ${filterInfo.status}` : '',
    filterInfo?.payment && filterInfo.payment !== 'All' ? `Payment: ${filterInfo.payment}` : '',
    filterInfo?.search ? `Search: "${filterInfo.search}"` : '',
  ].filter(Boolean).join(' | ') || 'All Active Orders';

  const rows = orders.map((order, idx) => {
    const itemsText = (order.items || [])
      .map((item) => `• ${item.productName} (x${item.quantity}) - ${formatCurrency(item.price * item.quantity)}`)
      .join('<br>');

    const statusBadgeClass = `badge badge-${order.status?.toLowerCase() || 'pending'}`;
    const paymentBadgeClass = `badge badge-${order.paymentStatus?.toLowerCase() || 'pending'}`;

    return `
      <tr>
        <td class="text-center font-mono">${idx + 1}</td>
        <td class="font-mono font-bold">${order.id}</td>
        <td>
          <div class="font-bold">${order.customerName}</div>
          <div style="color: #64748b; font-size: 10px;">${order.customerEmail}</div>
        </td>
        <td>${order.createdAt}</td>
        <td style="max-width: 250px;">
          <div style="font-size: 10px; color: #334155;">
            ${itemsText || '1 item'}
          </div>
        </td>
        <td class="text-center">
          <span class="${statusBadgeClass}">${order.status}</span>
        </td>
        <td class="text-center">
          <span class="${paymentBadgeClass}">${order.paymentStatus}</span>
        </td>
        <td class="text-right font-mono font-bold">${formatCurrency(order.total)}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <div class="print-header">
      <div>
        <h1 class="brand-title">BEASTFUEL SUPPLEMENTS</h1>
        <p class="brand-subtitle">Premium Nutrition & Performance • Admin Portal</p>
      </div>
      <div class="report-meta">
        <h2 class="report-title">CUSTOMER ORDERS REPORT</h2>
        <div class="report-meta-item"><strong>Generated:</strong> ${dateStr}</div>
        <div class="report-meta-item"><strong>Filter:</strong> ${filterSummary}</div>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <p class="summary-label">Total Orders</p>
        <p class="summary-value">${orders.length}</p>
      </div>
      <div class="summary-card">
        <p class="summary-label">Total Revenue</p>
        <p class="summary-value">${formatCurrency(totalRevenue)}</p>
      </div>
      <div class="summary-card">
        <p class="summary-label">Items Sold</p>
        <p class="summary-value">${totalItemsCount} items</p>
      </div>
      <div class="summary-card">
        <p class="summary-label">Order Breakdown</p>
        <p style="font-size: 11px; font-weight: 600; margin: 0; color: #475569;">
          Comp: ${completedCount} | Ship: ${shippedCount} | Pend: ${pendingCount} | Canc: ${cancelledCount}
        </p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th class="text-center" style="width: 30px;">#</th>
          <th style="width: 80px;">Order ID</th>
          <th>Customer</th>
          <th style="width: 85px;">Date</th>
          <th>Items Ordered</th>
          <th class="text-center" style="width: 85px;">Status</th>
          <th class="text-center" style="width: 80px;">Payment</th>
          <th class="text-right" style="width: 95px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="8" class="text-center" style="padding: 20px; color: #64748b;">No orders found matching the criteria.</td></tr>'}
      </tbody>
      <tfoot>
        <tr style="background: #f8fafc; font-weight: 800; border-top: 2px solid #cbd5e1;">
          <td colspan="7" class="text-right" style="padding: 10px;">GRAND TOTAL:</td>
          <td class="text-right font-mono" style="padding: 10px; font-size: 13px;">${formatCurrency(totalRevenue)}</td>
        </tr>
      </tfoot>
    </table>

    <div class="print-footer">
      <div>Report generated by BEASTFUEL Management System</div>
      <div>Confidential • Internal Store Administration Document</div>
    </div>
  `;

  openPrintWindow(`Orders_Report_${new Date().toISOString().split('T')[0]}`, html);
};

/**
 * Print Deleted Orders Audit Report
 */
export const printDeletedOrdersReport = (deletedOrders: DeletedOrder[]) => {
  const totalLostRevenue = deletedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const dateStr = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const rows = deletedOrders.map((order, idx) => {
    const itemsText = (order.items || [])
      .map((item) => `${item.productName} (x${item.quantity})`)
      .join(', ');

    return `
      <tr>
        <td class="text-center font-mono">${idx + 1}</td>
        <td class="font-mono font-bold" style="color: #991b1b;">${order.id}</td>
        <td>
          <div class="font-bold">${order.customerName}</div>
          <div style="color: #64748b; font-size: 10px;">${order.customerEmail}</div>
        </td>
        <td>${order.createdAt}</td>
        <td style="color: #b91c1c; font-weight: 600;">${order.deletedAt}</td>
        <td>
          <div style="font-weight: 600;">${order.deletedBy || 'Admin User'}</div>
          <div style="color: #64748b; font-size: 10px; font-style: italic;">${order.deletionReason || 'Manual deletion'}</div>
        </td>
        <td style="max-width: 200px; font-size: 10px;">${itemsText || '1 item'}</td>
        <td class="text-center">
          <span class="badge badge-${order.status?.toLowerCase() || 'pending'}">${order.status}</span>
        </td>
        <td class="text-right font-mono font-bold">${formatCurrency(order.total)}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <div class="print-header">
      <div>
        <h1 class="brand-title">BEASTFUEL SUPPLEMENTS</h1>
        <p class="brand-subtitle">Security & Administrative Compliance • Deleted Orders Audit</p>
      </div>
      <div class="report-meta">
        <h2 class="report-title" style="color: #b91c1c;">DELETED ORDERS REPORT</h2>
        <div class="report-meta-item"><strong>Generated:</strong> ${dateStr}</div>
        <div class="report-meta-item"><strong>Status:</strong> Security Audit Archive</div>
      </div>
    </div>

    <div class="notice-box">
      <div class="notice-title">SECURITY AUDIT NOTICE</div>
      <div class="notice-text">
        This document lists all customer orders that have been removed/deleted from the active order register.
        Details include original timestamps, responsible administrator, reason for deletion, and financial sums.
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card accent-red">
        <p class="summary-label">Total Deleted Orders</p>
        <p class="summary-value">${deletedOrders.length}</p>
      </div>
      <div class="summary-card accent-red">
        <p class="summary-label">Total Deleted Value</p>
        <p class="summary-value">${formatCurrency(totalLostRevenue)}</p>
      </div>
      <div class="summary-card">
        <p class="summary-label">Audit Period</p>
        <p class="summary-value" style="font-size: 13px;">Full Store History</p>
      </div>
      <div class="summary-card">
        <p class="summary-label">Verification</p>
        <p class="summary-value" style="font-size: 13px; color: #166534;">Verified Log</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th class="text-center" style="width: 30px;">#</th>
          <th style="width: 80px;">Order ID</th>
          <th>Customer</th>
          <th style="width: 80px;">Order Date</th>
          <th style="width: 105px;">Deleted At</th>
          <th>Deleted By / Reason</th>
          <th>Items Ordered</th>
          <th class="text-center" style="width: 75px;">Orig. Status</th>
          <th class="text-right" style="width: 90px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="9" class="text-center" style="padding: 20px; color: #64748b;">No deleted orders on record.</td></tr>'}
      </tbody>
      <tfoot>
        <tr style="background: #fff1f2; font-weight: 800; border-top: 2px solid #fecdd3;">
          <td colspan="8" class="text-right" style="padding: 10px; color: #991b1b;">TOTAL VALUE OF DELETED ORDERS:</td>
          <td class="text-right font-mono" style="padding: 10px; font-size: 13px; color: #991b1b;">${formatCurrency(totalLostRevenue)}</td>
        </tr>
      </tfoot>
    </table>

    <div style="margin-top: 35px; display: flex; justify-content: space-between; font-size: 11px;">
      <div style="border-top: 1px solid #94a3b8; width: 220px; padding-top: 5px; text-align: center;">
        <strong>Administrator Signature</strong>
      </div>
      <div style="border-top: 1px solid #94a3b8; width: 220px; padding-top: 5px; text-align: center;">
        <strong>Audit Date & Authorization</strong>
      </div>
    </div>

    <div class="print-footer">
      <div>BEASTFUEL Administrative Security Archive • System Record Log</div>
      <div>Strictly Confidential</div>
    </div>
  `;

  openPrintWindow(`Deleted_Orders_Audit_${new Date().toISOString().split('T')[0]}`, html);
};

/**
 * Print Individual Order Invoice / Receipt / Report
 */
export const printSingleOrderInvoice = (order: Order | DeletedOrder) => {
  const dateStr = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const isDeleted = 'deletedAt' in order && Boolean((order as DeletedOrder).deletedAt);

  const itemRows = (order.items || []).map((item, idx) => {
    const itemTotal = item.price * item.quantity;
    return `
      <tr>
        <td class="text-center font-mono">${idx + 1}</td>
        <td>
          <div class="font-bold">${item.productName}</div>
          <div style="color: #64748b; font-size: 10px;">SKU: PROD-${item.productId || 'GEN'}</div>
        </td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-right font-mono">${formatCurrency(item.price)}</td>
        <td class="text-right font-mono font-bold">${formatCurrency(itemTotal)}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <div class="print-header">
      <div>
        <h1 class="brand-title">BEASTFUEL SUPPLEMENTS</h1>
        <p class="brand-subtitle">High Performance Nutrition • 123 Fitness Street, Gym City</p>
        <p style="font-size: 10px; color: #64748b; margin: 3px 0 0 0;">Phone: +1 (555) 123-4567 • Email: support@beastfuel.com</p>
      </div>
      <div class="report-meta">
        <h2 class="report-title" style="color: ${isDeleted ? '#dc2626' : '#0f172a'};">
          ${isDeleted ? 'DELETED ORDER RECORD' : 'OFFICIAL INVOICE'}
        </h2>
        <div class="report-meta-item"><strong>Order ID:</strong> <span class="font-mono font-bold">${order.id}</span></div>
        <div class="report-meta-item"><strong>Date Placed:</strong> ${order.createdAt}</div>
        <div class="report-meta-item"><strong>Print Date:</strong> ${dateStr}</div>
      </div>
    </div>

    ${isDeleted ? `
      <div class="notice-box">
        <div class="notice-title">ORDER MARKED AS DELETED</div>
        <div class="notice-text">
          This order was deleted on <strong>${(order as DeletedOrder).deletedAt}</strong> 
          by <strong>${(order as DeletedOrder).deletedBy || 'Admin'}</strong>. 
          Reason: <em>${(order as DeletedOrder).deletionReason || 'N/A'}</em>.
        </div>
      </div>
    ` : ''}

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
        <h3 style="font-size: 11px; text-transform: uppercase; margin: 0 0 8px 0; color: #475569; font-weight: 700;">Customer Details</h3>
        <p style="margin: 0 0 3px 0; font-size: 13px; font-weight: 700;">${order.customerName}</p>
        <p style="margin: 0 0 4px 0; font-size: 11px; color: #475569;">Email: ${order.customerEmail}</p>
        ${order.shippingAddress ? `
          <p style="margin: 6px 0 0 0; font-size: 10px; color: #64748b;"><strong>Shipping Address:</strong><br>${order.shippingAddress}</p>
        ` : ''}
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
        <h3 style="font-size: 11px; text-transform: uppercase; margin: 0 0 8px 0; color: #475569; font-weight: 700;">Order & Payment Status</h3>
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <span class="badge badge-${order.status?.toLowerCase() || 'pending'}">Status: ${order.status}</span>
          <span class="badge badge-${order.paymentStatus?.toLowerCase() || 'pending'}">Payment: ${order.paymentStatus}</span>
        </div>
        ${order.paymentDetails?.method ? `
          <p style="margin: 2px 0; font-size: 11px; color: #475569;">
            <strong>Payment Method:</strong> ${order.paymentDetails.method.toUpperCase().replace('_', ' ')}
            ${order.paymentDetails.cardLast4 ? `(Ending in ${order.paymentDetails.cardLast4})` : ''}
          </p>
        ` : ''}
        ${order.paymentDetails?.transactionId ? `
          <p style="margin: 2px 0; font-size: 10px; color: #64748b; font-family: monospace;">
            TXN: ${order.paymentDetails.transactionId}
          </p>
        ` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th class="text-center" style="width: 30px;">#</th>
          <th>Item Description</th>
          <th class="text-center" style="width: 70px;">Quantity</th>
          <th class="text-right" style="width: 100px;">Unit Price</th>
          <th class="text-right" style="width: 110px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" class="text-right" style="padding-top: 10px; font-weight: 600;">Subtotal:</td>
          <td class="text-right font-mono" style="padding-top: 10px;">${formatCurrency(order.total)}</td>
        </tr>
        <tr>
          <td colspan="4" class="text-right" style="font-weight: 600;">Shipping & Handling:</td>
          <td class="text-right font-mono" style="color: #166534;">FREE</td>
        </tr>
        <tr style="border-top: 2px solid #0f172a; font-weight: 900; font-size: 14px;">
          <td colspan="4" class="text-right" style="padding: 10px;">TOTAL AMOUNT:</td>
          <td class="text-right font-mono" style="padding: 10px;">${formatCurrency(order.total)}</td>
        </tr>
      </tfoot>
    </table>

    <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 12px; margin-top: 20px;">
      <h4 style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: #334155;">Thank you for your purchase!</h4>
      <p style="margin: 0; font-size: 10px; color: #64748b;">
        All BEASTFUEL supplements are 100% lab certified and backed by our satisfaction guarantee.
        For queries or order modifications, contact support@beastfuel.com with your Order ID.
      </p>
    </div>

    <div class="print-footer">
      <div>BEASTFUEL Supplements • Customer Order Receipt</div>
      <div>Page 1 of 1</div>
    </div>
  `;

  openPrintWindow(`Order_Invoice_${order.id}`, html);
};
