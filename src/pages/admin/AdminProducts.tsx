import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, Loader2, Globe, Award } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ProductModal from '@/components/admin/ProductModal';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { Product } from '@/store/cartStore';
import { useProducts, useAddProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/currency';

const AdminProducts = () => {
  const { data: products = [], isLoading } = useProducts(false);
  const addProductMutation = useAddProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; product: Product | null }>({
    isOpen: false,
    product: null,
  });

  // Extract unique brands for admin filter
  const allBrands = ['All', ...Array.from(new Set(products.map((p) => p.brand || 'BEASTFUEL')))];

  const filteredProducts = products.filter((p) => {
    const matchesBrand =
      selectedBrandFilter === 'All' ||
      (p.brand || 'BEASTFUEL').toLowerCase() === selectedBrandFilter.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      (p.brand && p.brand.toLowerCase().includes(query)) ||
      (p.category && p.category.toLowerCase().includes(query)) ||
      (p.countryOfOrigin && p.countryOfOrigin.toLowerCase().includes(query));
    return matchesBrand && matchesSearch;
  });

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (productData: Omit<Product, 'id'> | Product) => {
    if ('id' in productData && productData.id) {
      updateProductMutation.mutate({ id: productData.id, ...productData });
    } else {
      addProductMutation.mutate(productData);
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setDeleteConfirm({ isOpen: true, product });
  };

  const confirmDelete = () => {
    if (deleteConfirm.product) {
      deleteProductMutation.mutate(deleteConfirm.product.id);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
              SUPPLEMENT PRODUCTS
            </h1>
            <p className="text-muted-foreground">
              Manage Brand → Category hierarchy, country of origin, flavors and weight variants ({products.length} products)
            </p>
          </div>
          <Button onClick={handleAddProduct} className="font-semibold shadow-md">
            <Plus className="h-4 w-4 mr-2" />
            Add New Product
          </Button>
        </motion.div>

        {/* Search & Brand Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by product, brand, category, origin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-12 pr-4 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Brand:</span>
            <select
              value={selectedBrandFilter}
              onChange={(e) => setSelectedBrandFilter(e.target.value)}
              className="h-11 px-3 bg-secondary border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            >
              {allBrands.map((b) => (
                <option key={b} value={b}>
                  {b === 'All' ? 'All Brands' : b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/50 backdrop-blur-sm border border-amber-500/20 rounded-xl overflow-hidden shadow-lg"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-violet-500/10">
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Product / Brand
                  </th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Category
                  </th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Origin
                  </th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Price
                  </th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Stock
                  </th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Options (Weights & Flavors)
                  </th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => {
                  const brand = product.brand || 'BEASTFUEL';
                  const origin = product.countryOfOrigin || 'USA';
                  const weights = product.weights?.length
                    ? product.weights
                    : product.weight
                    ? [product.weight]
                    : [];
                  const flavors = product.flavors?.length
                    ? product.flavors
                    : product.flavor
                    ? [product.flavor]
                    : [];

                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="border-b border-border last:border-0 hover:bg-amber-500/5 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg border border-border"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase">
                              <Award className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>{brand}</span>
                            </div>
                            <p className="font-semibold text-foreground text-sm line-clamp-1">
                              {product.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="inline-flex px-2.5 py-1 bg-secondary rounded-full text-xs font-medium border border-border/50">
                          {product.category}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded border border-border/40">
                          <Globe className="w-3 h-3 text-blue-500" />
                          {origin}
                        </span>
                      </td>

                      <td className="p-4 font-semibold text-sm">
                        {formatCurrency(product.price)}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.stock === 0
                              ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                              : product.stock <= 10
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {product.stock === 0 ? 'Out of Stock' : `${product.stock} units`}
                        </span>
                      </td>

                      <td className="p-4 text-xs text-muted-foreground">
                        <div className="space-y-1 max-w-[200px]">
                          {weights.length > 0 && (
                            <p className="line-clamp-1">
                              <strong className="text-foreground">Weights:</strong> {weights.join(', ')}
                            </p>
                          )}
                          {flavors.length > 0 && (
                            <p className="line-clamp-1">
                              <strong className="text-foreground">Flavors:</strong> {flavors.join(', ')}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditProduct(product)}
                            className="hover:text-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProduct(product)}
                            className="text-destructive hover:text-destructive"
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
          <div className="text-center py-16 bg-card/30 rounded-xl border border-border">
            <p className="text-muted-foreground">No products found matching your search</p>
          </div>
        )}
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, product: null })}
        onConfirm={confirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteConfirm.product?.name}"? This action cannot be undone.`}
      />
    </AdminLayout>
  );
};

export default AdminProducts;
