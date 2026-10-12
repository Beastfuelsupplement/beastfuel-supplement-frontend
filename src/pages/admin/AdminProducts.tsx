import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Globe,
  Award,
  Eye,
  SlidersHorizontal,
  PackageCheck,
  AlertTriangle,
  X,
  Layers,
  ArrowUpDown,
  CheckCircle2,
  Sparkles,
  Calendar,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ProductModal from '@/components/admin/ProductModal';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { Product } from '@/store/cartStore';
import { useProducts, useAddProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/currency';

const AdminProducts = () => {
  // Fetch all products (including inactive if any) for the admin view
  const { data: products = [], isLoading } = useProducts(false);
  const addProductMutation = useAddProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [selectedStockFilter, setSelectedStockFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'price-asc' | 'price-desc' | 'stock'>('newest');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; product: Product | null }>({
    isOpen: false,
    product: null,
  });

  // Extract unique filters
  const allBrands = useMemo(() => {
    return ['All', ...Array.from(new Set(products.map((p) => p.brand || 'BEASTFUEL')))];
  }, [products]);

  const allCategories = useMemo(() => {
    return ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesBrand =
          selectedBrandFilter === 'All' ||
          (p.brand || 'BEASTFUEL').toLowerCase() === selectedBrandFilter.toLowerCase();

        const matchesCategory =
          selectedCategoryFilter === 'All' ||
          (p.category || '').toLowerCase() === selectedCategoryFilter.toLowerCase();

        const threshold = p.lowStockThreshold ?? 5;
        const matchesStock =
          selectedStockFilter === 'All' ||
          (selectedStockFilter === 'in_stock' && (p.stock ?? 0) > threshold) ||
          (selectedStockFilter === 'low_stock' && (p.stock ?? 0) > 0 && (p.stock ?? 0) <= threshold) ||
          (selectedStockFilter === 'out_of_stock' && (p.stock ?? 0) === 0);

        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          p.name.toLowerCase().includes(query) ||
          (p.brand && p.brand.toLowerCase().includes(query)) ||
          (p.category && p.category.toLowerCase().includes(query)) ||
          (p.countryOfOrigin && p.countryOfOrigin.toLowerCase().includes(query)) ||
          (p.flavors && p.flavors.some((f) => f.toLowerCase().includes(query))) ||
          (p.weights && p.weights.some((w) => w.toLowerCase().includes(query)));

        return matchesBrand && matchesCategory && matchesStock && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'price-asc') return (a.price ?? 0) - (b.price ?? 0);
        if (sortBy === 'price-desc') return (b.price ?? 0) - (a.price ?? 0);
        if (sortBy === 'stock') return (b.stock ?? 0) - (a.stock ?? 0);
        // Default newest
        return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
      });
  }, [products, searchQuery, selectedBrandFilter, selectedCategoryFilter, selectedStockFilter, sortBy]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product);
  };

  const handleSaveProduct = (productData: Omit<Product, 'id'> | Product) => {
    if ('id' in productData && productData.id) {
      updateProductMutation.mutate(
        { id: productData.id, ...productData },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            setEditingProduct(null);
          },
        }
      );
    } else {
      addProductMutation.mutate(productData, {
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingProduct(null);
        },
      });
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setDeleteConfirm({ isOpen: true, product });
  };

  const confirmDelete = () => {
    if (deleteConfirm.product) {
      deleteProductMutation.mutate(deleteConfirm.product.id, {
        onSuccess: () => {
          setDeleteConfirm({ isOpen: false, product: null });
        },
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-28 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-semibold text-muted-foreground tracking-wide">
            Loading Supplement Inventory...
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-display text-3xl md:text-4xl bg-gradient-to-r from-amber-600 via-violet-600 to-rose-600 dark:from-amber-400 dark:via-violet-400 dark:to-rose-400 bg-clip-text text-transparent">
              SUPPLEMENT INVENTORY MANAGEMENT
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage product details, weight-based pricing, flavor stock matrices, and origins ({products.length} total products)
            </p>
          </div>
          <Button onClick={handleAddProduct} className="font-bold shadow-lg h-11 px-6">
            <Plus className="h-4 w-4 mr-2" />
            Add New Product
          </Button>
        </motion.div>

        {/* Search, Filter & Sort Toolbar */}
        <div className="p-4 bg-card/60 backdrop-blur-sm border border-border rounded-2xl shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products, brands, categories, origins, flavors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-secondary/70 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Brand Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">Brand:</span>
                <select
                  value={selectedBrandFilter}
                  onChange={(e) => setSelectedBrandFilter(e.target.value)}
                  className="h-9 px-2.5 bg-secondary border border-border rounded-lg text-xs font-medium text-foreground focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {allBrands.map((b) => (
                    <option key={b} value={b}>
                      {b === 'All' ? 'All Brands' : b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">Category:</span>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="h-9 px-2.5 bg-secondary border border-border rounded-lg text-xs font-medium text-foreground focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {allCategories.map((c) => (
                    <option key={c} value={c}>
                      {c === 'All' ? 'All Categories' : c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">Stock:</span>
                <select
                  value={selectedStockFilter}
                  onChange={(e) => setSelectedStockFilter(e.target.value)}
                  className="h-9 px-2.5 bg-secondary border border-border rounded-lg text-xs font-medium text-foreground focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="All">All Stock</option>
                  <option value="in_stock">In Stock (&gt; Threshold)</option>
                  <option value="low_stock">Low Stock (≤ Threshold / 5)</option>
                  <option value="out_of_stock">Out of Stock (0)</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="h-9 px-2.5 bg-secondary border border-border rounded-lg text-xs font-medium text-foreground focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="stock">Stock: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Products Management Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/70 backdrop-blur-sm border border-border/80 rounded-2xl overflow-hidden shadow-xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/50 font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="text-left p-4">Product Details</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-left p-4">Origin</th>
                  <th className="text-left p-4">Price / Weights</th>
                  <th className="text-left p-4">Flavor & Stock Breakdown</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredProducts.map((product, index) => {
                  const brand = product.brand || 'BEASTFUEL';
                  const origin = product.countryOfOrigin || 'USA';
                  const weights = product.weights?.length ? product.weights : [product.weight || '1kg'];
                  const flavors = product.flavors?.length ? product.flavors : [product.flavor || 'Standard'];
                  const threshold = product.lowStockThreshold ?? 5;
                  const totalStock = product.stock ?? 0;
                  const isOut = totalStock === 0;
                  const isLow = totalStock > 0 && totalStock <= threshold;

                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-secondary/40 transition-colors"
                    >
                      {/* Product Image & Name */}
                      <td className="p-4">
                        <div className="flex items-center gap-3 min-w-[220px]">
                          <img
                            src={product.image || '/placeholder.svg'}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-xl border border-border shadow-xs shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase">
                              <Award className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>{brand}</span>
                            </div>
                            <p className="font-bold text-foreground text-sm line-clamp-1">
                              {product.name}
                            </p>
                            {product.variants && product.variants.length > 0 && (
                              <span className="text-[10px] text-muted-foreground">
                                {product.variants.length} variant combination{product.variants.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="inline-flex px-2.5 py-1 bg-secondary rounded-lg text-xs font-semibold border border-border/60">
                          {product.category}
                        </span>
                      </td>

                      {/* Origin */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-foreground bg-secondary/80 px-2.5 py-1 rounded-lg border border-border/60 font-medium">
                          <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          {origin}
                        </span>
                      </td>

                      {/* Price & Weights */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-sm text-foreground">
                            {formatCurrency(product.price)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {weights.length} weight{weights.length > 1 ? 's' : ''}: {weights.join(', ')}
                          </p>
                        </div>
                      </td>

                      {/* Stock & Flavors */}
                      <td className="p-4">
                        <div className="space-y-1 max-w-[220px]">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isOut
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                  : isLow
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {isOut ? (
                                'Out of Stock'
                              ) : isLow ? (
                                <>
                                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                                  Low Stock Alert ({totalStock} units ≤ {threshold})
                                </>
                              ) : (
                                `${totalStock} units available`
                              )}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">
                            <strong>Flavors:</strong> {flavors.join(', ')}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            product.isActive !== false
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {product.isActive !== false ? 'Published' : 'Draft'}
                        </span>
                      </td>

                      {/* Actions: View, Edit, Delete */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewProduct(product)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg"
                            title="View Full Details & Inventory"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                            title="Edit Product"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-card/40 rounded-2xl border border-border space-y-3">
            <AlertTriangle className="h-10 w-10 mx-auto text-amber-500 opacity-80" />
            <h3 className="font-bold text-base text-foreground">No Products Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No products match your current search and filter criteria. Try resetting filters or adding a new supplement product.
            </p>
          </div>
        )}
      </div>

      {/* ================= VIEW PRODUCT DRAWER / MODAL ================= */}
      <AnimatePresence>
        {viewingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl my-auto flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-border bg-secondary/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold text-primary tracking-wider px-2 py-0.5 bg-primary/10 rounded">
                    {viewingProduct.brand || 'BEASTFUEL'}
                  </span>
                  <h3 className="text-lg font-bold text-foreground">{viewingProduct.name}</h3>
                </div>
                <button
                  onClick={() => setViewingProduct(null)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {/* Images & Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <div className="aspect-square rounded-xl overflow-hidden border border-border bg-background">
                      <img
                        src={viewingProduct.image || '/placeholder.svg'}
                        alt={viewingProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {viewingProduct.images && viewingProduct.images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {viewingProduct.images.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2 space-y-4 text-xs">
                    <div>
                      <h4 className="font-bold text-sm text-foreground mb-1">{viewingProduct.name}</h4>
                      <p className="text-muted-foreground leading-relaxed">{viewingProduct.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                      <div className="p-2.5 bg-secondary/50 rounded-xl">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold">Category</span>
                        <p className="font-bold text-foreground text-xs mt-0.5">{viewingProduct.category}</p>
                      </div>

                      <div className="p-2.5 bg-secondary/50 rounded-xl">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold">Country of Origin</span>
                        <p className="font-bold text-foreground text-xs mt-0.5 flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-blue-500" />
                          {viewingProduct.countryOfOrigin || 'USA'}
                        </p>
                      </div>

                      <div className="p-2.5 bg-secondary/50 rounded-xl">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold">Starting Price</span>
                        <p className="font-bold text-foreground text-sm mt-0.5 text-primary">
                          {formatCurrency(viewingProduct.price)}
                        </p>
                      </div>

                      <div className="p-2.5 bg-secondary/50 rounded-xl">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold">Total Inventory</span>
                        <p className="font-bold text-foreground text-sm mt-0.5">
                          {viewingProduct.stock} units
                        </p>
                      </div>

                      <div className="p-2.5 bg-secondary/50 rounded-xl">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold">Low Stock Threshold</span>
                        <p className="font-bold text-foreground text-sm mt-0.5 text-amber-500">
                          {viewingProduct.lowStockThreshold ?? 5} units
                        </p>
                      </div>
                    </div>

                    {/* Low Stock Alert Message if Applicable */}
                    {viewingProduct.stock <= (viewingProduct.lowStockThreshold ?? 5) && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Low Stock Alert: Total product inventory is at or below the threshold of {viewingProduct.lowStockThreshold ?? 5} units!</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Complete Variant Inventory Table */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Configured Variant Combinations ({(viewingProduct.variants || []).length})
                    </h4>
                    <span className="text-[11px] text-muted-foreground font-semibold">
                      Price = Product + Weight | Stock = Product + Weight + Flavor
                    </span>
                  </div>

                  <div className="border border-border rounded-xl overflow-hidden bg-background">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-secondary/70 border-b border-border text-foreground font-bold">
                          <th className="p-2.5 text-left">Weight</th>
                          <th className="p-2.5 text-left">Flavor</th>
                          <th className="p-2.5 text-left">Price</th>
                          <th className="p-2.5 text-left">Stock</th>
                          <th className="p-2.5 text-left">SKU</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {(viewingProduct.variants || []).map((v, i) => {
                          const vThreshold = viewingProduct.lowStockThreshold ?? 5;
                          const isVOut = v.stock === 0;
                          const isVLow = v.stock > 0 && v.stock <= vThreshold;

                          return (
                            <tr key={i} className="hover:bg-secondary/20">
                              <td className="p-2.5 font-bold text-foreground">{v.weight}</td>
                              <td className="p-2.5 font-medium text-foreground">{v.flavor}</td>
                              <td className="p-2.5 font-semibold text-primary">{formatCurrency(v.price)}</td>
                              <td className="p-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isVOut
                                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                      : isVLow
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  }`}
                                >
                                  {isVOut ? 'Out of Stock' : isVLow ? `⚠️ Low Stock (${v.stock} units)` : `${v.stock} units`}
                                </span>
                              </td>
                              <td className="p-2.5 text-muted-foreground font-mono text-[10px]">
                                {v.sku || 'N/A'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border bg-secondary/30 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setViewingProduct(null)}
                  className="text-xs h-9"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const prodToEdit = viewingProduct;
                    setViewingProduct(null);
                    handleEditProduct(prodToEdit);
                  }}
                  className="text-xs h-9 font-bold"
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit This Product
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Multi-step Add/Edit Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        product={editingProduct}
        isSubmitting={addProductMutation.isPending || updateProductMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, product: null })}
        onConfirm={confirmDelete}
        title="Delete Supplement Product"
        message={`Are you sure you want to delete "${deleteConfirm.product?.name}"? All associated weight-and-flavor inventory variants will also be safely removed.`}
      />
    </AdminLayout>
  );
};

export default AdminProducts;
