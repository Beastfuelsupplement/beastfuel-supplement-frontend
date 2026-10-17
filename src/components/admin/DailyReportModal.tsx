import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  Send,
  Loader2,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductRestocked?: () => void;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({
  isOpen,
  onClose,
  onProductRestocked
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales' | 'email'>('inventory');
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [recipientEmail, setRecipientEmail] = useState('admin@beastfuel.com');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [restockInputs, setRestockInputs] = useState<Record<string, string>>({});
  const [isRestocking, setIsRestocking] = useState<string | null>(null);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDailySummaryReport();
      setReportData(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load daily report data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReport();
    }
  }, [isOpen]);

  const handleSendEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast.error('Please enter a valid recipient email address');
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await api.sendDailyReportEmail(recipientEmail);
      if (res.success) {
        toast.success(
          `End-of-day report sent to ${recipientEmail}! (${res.outOfStockCount} out-of-stock items, ${formatCurrency(res.todayRevenue)} revenue)`
        );
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispatch daily report email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleQuickRestock = async (v: any) => {
    const key = v.sku || `${v.productId}-${v.weight}-${v.flavor}`;
    const qtyStr = restockInputs[key] !== undefined ? restockInputs[key] : (v.stock === 0 ? '10' : '15');
    const qty = parseInt(qtyStr, 10);

    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid restock quantity greater than 0');
      return;
    }

    const currentStock = Number(v.stock) || 0;
    const newStockTotal = currentStock + qty;

    setIsRestocking(key);
    try {
      const res = await api.restockVariant({
        productId: v.productId,
        variantId: v.variantId || v._id,
        sku: v.sku,
        weight: v.weight,
        flavor: v.flavor,
        addStock: qty
      });

      toast.success(
        res?.message ||
        `Successfully restocked ${v.productName} (${v.weight} • ${v.flavor})! Added +${qty} units (${currentStock} existing + ${qty} new = ${newStockTotal} units).`
      );
      // Clear input
      setRestockInputs(prev => ({ ...prev, [key]: '' }));
      // Refresh report
      await fetchReport();
      if (onProductRestocked) {
        onProductRestocked();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to restock variant');
    } finally {
      setIsRestocking(null);
    }
  };

  if (!isOpen) return null;

  const sales = reportData?.salesProgress || {};
  const inventory = reportData?.inventory || {};
  const outOfStockList = inventory.outOfStockVariants || [];
  const lowStockList = inventory.lowStockVariants || [];
  const topSellingList = sales.topSellingVariants || [];

  return (
    <div className="fixed inset-0 lg:left-64 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-card border border-border/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* HEADER */}
        <div className="border-b border-border bg-card/95 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  DAILY SALES & STOCK ALERT REPORT
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {reportData?.date || 'Today'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                Live aggregated summary of today's progress & out-of-stock items
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchReport}
              disabled={isLoading}
              className="h-9 px-3 text-xs"
              title="Refresh live data"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-secondary/20 border-b border-border">
          <div className="p-3.5 bg-background rounded-xl border border-border shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Today's Net Revenue
            </span>
            <p className="text-xl font-black text-emerald-500 mt-1">
              {formatCurrency(sales.todayRevenue || 0)}
            </p>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              {sales.todayOrdersCount || 0} order{sales.todayOrdersCount !== 1 ? 's' : ''} placed
            </span>
          </div>

          <div className="p-3.5 bg-background rounded-xl border border-border shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Units Sold Today
            </span>
            <p className="text-xl font-black text-primary mt-1">
              {sales.todayUnitsSold || 0} units
            </p>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              Across all variants
            </span>
          </div>

          <div className="p-3.5 bg-background rounded-xl border border-rose-500/30 shadow-2xs bg-rose-500/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Out of Stock Variants
            </span>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {inventory.outOfStockCount || 0} sold out
            </p>
            <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5 block">
              Needs restock
            </span>
          </div>

          <div className="p-3.5 bg-background rounded-xl border border-amber-500/30 shadow-2xs bg-amber-500/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Low Stock Alerts
            </span>
            <p className="text-xl font-black text-amber-500 mt-1">
              {inventory.lowStockCount || 0} items
            </p>
            <span className="text-[10px] text-amber-500/80 mt-0.5 block">
              At or below threshold
            </span>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex border-b border-border bg-secondary/40 px-6 gap-2 pt-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2.5 border-b-2 font-bold transition-all flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Out of Stock Items ({outOfStockList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2.5 border-b-2 font-bold transition-all flex items-center gap-2 ${
              activeTab === 'sales'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Sales Progress & Best Sellers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2.5 border-b-2 font-bold transition-all flex items-center gap-2 ${
              activeTab === 'email'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Dispatch EOD Email & Preview
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Gathering today's sales and inventory statistics...</p>
            </div>
          ) : activeTab === 'inventory' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    Currently Sold Out Product Variants ({outOfStockList.length})
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Customers viewing these variants on the web portal will see a <strong>"Sold Out"</strong> badge and cannot add to cart. Restock them below to make them instantly available again!
                  </p>
                </div>
              </div>

              {outOfStockList.length === 0 ? (
                <div className="p-8 text-center bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-bold text-foreground text-sm">All Variants Are In Stock!</p>
                  <p className="text-xs text-muted-foreground">None of your products or variants currently have 0 stock.</p>
                </div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden bg-background">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-secondary/70 border-b border-border text-foreground font-bold">
                        <th className="p-3 text-left">Product</th>
                        <th className="p-3 text-left">Weight</th>
                        <th className="p-3 text-left">Flavor</th>
                        <th className="p-3 text-left">SKU</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Quick Restock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {outOfStockList.map((v: any, idx: number) => {
                        const key = v.sku || `${v.productId}-${v.weight}-${v.flavor}`;
                        const currentInput = restockInputs[key] !== undefined ? restockInputs[key] : '10';
                        const isThisRestocking = isRestocking === key;

                        return (
                          <tr key={idx} className="hover:bg-rose-500/5 transition-colors">
                            <td className="p-3 font-bold text-foreground">
                              <div>
                                <span className="text-[10px] uppercase text-primary block">{v.brand}</span>
                                {v.productName}
                              </div>
                            </td>
                            <td className="p-3 font-semibold text-foreground">
                              <span className="px-2 py-0.5 bg-secondary rounded border border-border/70">
                                {v.weight}
                              </span>
                            </td>
                            <td className="p-3 font-medium text-foreground">
                              {v.flavor}
                            </td>
                            <td className="p-3 text-[11px] font-mono text-muted-foreground">
                              {v.sku}
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                Sold Out (0)
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  placeholder="+10"
                                  value={currentInput}
                                  onChange={e => setRestockInputs(prev => ({ ...prev, [key]: e.target.value }))}
                                  className="w-16 h-8 text-center bg-secondary border border-border rounded-lg text-xs font-bold"
                                  title="Units to add to existing stock"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleQuickRestock(v)}
                                  disabled={isThisRestocking}
                                  className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                                  title={`Add +${currentInput || '10'} units to current stock`}
                                >
                                  {isThisRestocking ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    '+ Add Stock'
                                  )}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Low stock table if any */}
              {lowStockList.length > 0 && (
                <div className="space-y-3 pt-3">
                  <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Low Stock Warnings ({lowStockList.length} items at or below threshold)
                  </h4>
                  <div className="border border-border rounded-xl overflow-hidden bg-background">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-secondary/70 border-b border-border text-foreground font-bold">
                          <th className="p-3 text-left">Product</th>
                          <th className="p-3 text-left">Weight</th>
                          <th className="p-3 text-left">Flavor</th>
                          <th className="p-3 text-center">Remaining</th>
                          <th className="p-3 text-right">Quick Restock (+ Units)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {lowStockList.map((v: any, idx: number) => {
                          const key = v.sku || `${v.productId}-${v.weight}-${v.flavor}`;
                          const currentInput = restockInputs[key] !== undefined ? restockInputs[key] : '15';
                          const isThisRestocking = isRestocking === key;

                          return (
                            <tr key={idx} className="hover:bg-amber-500/5">
                              <td className="p-3 font-semibold text-foreground">{v.productName}</td>
                              <td className="p-3">{v.weight}</td>
                              <td className="p-3">{v.flavor}</td>
                              <td className="p-3 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                  {v.stock} units left (≤ {v.threshold})
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="+15"
                                    value={currentInput}
                                    onChange={e => setRestockInputs(prev => ({ ...prev, [key]: e.target.value }))}
                                    className="w-16 h-8 text-center bg-secondary border border-border rounded-lg text-xs font-bold"
                                    title="Units to add to existing stock"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleQuickRestock(v)}
                                    disabled={isThisRestocking}
                                    className="h-8 text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                                    title={`Add +${currentInput || '15'} units to current stock (${v.stock} current + ${currentInput || '15'} = ${(Number(v.stock) || 0) + (parseInt(currentInput, 10) || 15)})`}
                                  >
                                    {isThisRestocking ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      '+ Add Stock'
                                    )}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'sales' ? (
            <div className="space-y-6">
              {/* Top Selling Variants */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Today's Top Performing Flavors & Weights
                </h3>
                {topSellingList.length === 0 ? (
                  <div className="p-8 text-center bg-secondary/30 rounded-xl border border-border text-xs text-muted-foreground">
                    No items sold yet today. Place test orders to see sales velocity!
                  </div>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden bg-background">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-secondary/70 border-b border-border text-foreground font-bold">
                          <th className="p-3 text-left">Rank</th>
                          <th className="p-3 text-left">Product</th>
                          <th className="p-3 text-left">Weight & Flavor</th>
                          <th className="p-3 text-center">Units Sold</th>
                          <th className="p-3 text-right">Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {topSellingList.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-secondary/20">
                            <td className="p-3 font-bold text-amber-500">#{idx + 1}</td>
                            <td className="p-3 font-bold text-foreground">{item.productName}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-secondary border font-semibold mr-1.5">
                                {item.weight}
                              </span>
                              <span>{item.flavor}</span>
                            </td>
                            <td className="p-3 text-center font-bold text-emerald-500">{item.quantity} sold</td>
                            <td className="p-3 text-right font-bold text-foreground">{formatCurrency(item.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Order Status Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-secondary/40 rounded-xl border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Pending Orders</span>
                  <p className="text-lg font-bold text-foreground mt-0.5">{sales.statusCounts?.Pending || 0}</p>
                </div>
                <div className="p-3.5 bg-secondary/40 rounded-xl border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Processing</span>
                  <p className="text-lg font-bold text-sky-500 mt-0.5">{sales.statusCounts?.Processing || 0}</p>
                </div>
                <div className="p-3.5 bg-secondary/40 rounded-xl border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Shipped</span>
                  <p className="text-lg font-bold text-amber-500 mt-0.5">{sales.statusCounts?.Shipped || 0}</p>
                </div>
                <div className="p-3.5 bg-secondary/40 rounded-xl border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Delivered</span>
                  <p className="text-lg font-bold text-emerald-500 mt-0.5">{sales.statusCounts?.Delivered || 0}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Dispatch Controls */}
              <div className="p-5 bg-secondary/30 rounded-2xl border border-border space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">Send End-of-Day Report to Email</h3>
                    <p className="text-xs text-muted-foreground">
                      Delivers the complete sales summary and out-of-stock list directly to the manager's inbox.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    placeholder="Enter recipient email (e.g. manager@beastfuel.com)..."
                    className="flex-1 h-10 px-3 bg-background border border-border rounded-xl text-xs font-medium text-foreground focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    onClick={handleSendEmail}
                    disabled={isSendingEmail}
                    className="h-10 text-xs font-bold px-5"
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Dispatching Email...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Report Now
                      </>
                    )}
                  </Button>
                </div>

                <div className="p-3 bg-secondary/60 rounded-xl border border-border/80 text-[11px] text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    <strong>Automated Schedule:</strong> This report is also automatically compiled and dispatched every night at <strong>23:50 (11:50 PM)</strong>.
                  </span>
                </div>
              </div>

              {/* Email Live HTML Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-primary" />
                    Email Preview
                  </label>
                  <span className="text-[11px] text-muted-foreground">Rendered HTML email template</span>
                </div>

                <div className="border border-border rounded-xl overflow-hidden bg-background">
                  <iframe
                    title="Daily Report Email Preview"
                    srcDoc={reportData?.previewHtml || '<p style="padding: 20px; color: white;">Loading email preview...</p>'}
                    className="w-full h-96 border-0"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="border-t border-border bg-card/95 px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {outOfStockList.length > 0 ? (
              <span className="text-rose-500 font-bold">
                ⚠️ {outOfStockList.length} variant(s) require urgent inventory replenishment.
              </span>
            ) : (
              <span className="text-emerald-500 font-semibold">
                ✓ All product variants are stocked and available.
              </span>
            )}
          </p>
          <Button variant="outline" size="sm" onClick={onClose} className="h-9 px-4 text-xs font-bold">
            Close Report
          </Button>
        </div>

      </div>
    </div>
  );
};
