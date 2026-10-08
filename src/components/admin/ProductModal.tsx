import { useState, useEffect, useRef } from 'react';
import { X, Upload, Plus, Trash2, Globe, Award, Sparkles, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, ProductVariant } from '@/store/cartStore';
import { categories, brands, countriesOfOrigin } from '@/data/products';
import { supabase } from '@/integrations/supabase/client';
import { api, API_BASE_URL } from '@/lib/api';
import { toast } from 'sonner';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'> | Product) => void;
  product?: Product | null;
}

const COMMON_FLAVORS = [
  'Chocolate',
  'Vanilla',
  'Strawberry',
  'Unflavored',
  'Cookies & Cream',
  'Blue Raspberry',
  'Fruit Punch',
  'Watermelon',
  'Banana',
  'Peanut Butter',
];

const COMMON_WEIGHTS = ['300g', '500g', '1kg', '2kg', '2.5kg', '4kg', '5kg'];

const ProductModal = ({ isOpen, onClose, onSave, product }: ProductModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    brand: 'Optimum Nutrition',
    category: 'Whey Protein',
    countryOfOrigin: 'USA',
    price: '',
    stock: '',
    image: '',
    description: '',
    weight: '1kg',
    flavor: 'Chocolate',
  });

  const [flavorsList, setFlavorsList] = useState<string[]>([]);
  const [newFlavorInput, setNewFlavorInput] = useState('');

  const [weightsList, setWeightsList] = useState<string[]>([]);
  const [newWeightInput, setNewWeightInput] = useState('');

  const [variantsList, setVariantsList] = useState<ProductVariant[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        brand: product.brand || 'BEASTFUEL',
        category: product.category || 'Whey Protein',
        countryOfOrigin: product.countryOfOrigin || 'USA',
        price: product.price.toString(),
        stock: (product.stock ?? 0).toString(),
        image: product.image,
        description: product.description || '',
        weight: product.weight || '1kg',
        flavor: product.flavor || '',
      });

      const initialFlavors =
        product.flavors && product.flavors.length > 0
          ? product.flavors
          : product.flavor
          ? [product.flavor]
          : ['Chocolate'];
      setFlavorsList(initialFlavors);

      const initialWeights =
        product.weights && product.weights.length > 0
          ? product.weights
          : product.weight
          ? [product.weight]
          : ['1kg'];
      setWeightsList(initialWeights);

      if (product.variants && product.variants.length > 0) {
        setVariantsList(product.variants);
      } else {
        setVariantsList(
          initialWeights.map((w) => ({
            weight: w,
            price: product.price,
            stock: product.stock ?? 0,
          }))
        );
      }

      setImagePreview(product.image);
    } else {
      setFormData({
        name: '',
        brand: 'Optimum Nutrition',
        category: 'Whey Protein',
        countryOfOrigin: 'USA',
        price: '49.99',
        stock: '50',
        image: '',
        description: '',
        weight: '1kg',
        flavor: 'Chocolate',
      });
      const defaultFlavors = ['Double Rich Chocolate', 'Vanilla Ice Cream', 'Delicious Strawberry'];
      const defaultWeights = ['500g', '1kg', '2kg'];
      setFlavorsList(defaultFlavors);
      setWeightsList(defaultWeights);
      setVariantsList([
        { weight: '500g', price: 29.99, stock: 25 },
        { weight: '1kg', price: 49.99, stock: 50 },
        { weight: '2kg', price: 89.99, stock: 30 },
      ]);
      setImagePreview(null);
    }
  }, [product, isOpen]);

  // Flavor helpers
  const handleAddFlavor = (flavorName: string) => {
    const trimmed = flavorName.trim();
    if (!trimmed) return;
    if (!flavorsList.includes(trimmed)) {
      setFlavorsList([...flavorsList, trimmed]);
    }
    setNewFlavorInput('');
  };

  const handleRemoveFlavor = (flavorToRemove: string) => {
    setFlavorsList(flavorsList.filter((f) => f !== flavorToRemove));
  };

  // Weight helpers
  const handleAddWeight = (weightVal: string) => {
    const trimmed = weightVal.trim();
    if (!trimmed) return;
    if (!weightsList.includes(trimmed)) {
      const updated = [...weightsList, trimmed];
      setWeightsList(updated);
      // Also add to variants if not present
      if (!variantsList.some((v) => v.weight === trimmed)) {
        setVariantsList([
          ...variantsList,
          {
            weight: trimmed,
            price: parseFloat(formData.price) || 49.99,
            stock: Math.floor(parseInt(formData.stock) / (updated.length || 1)) || 20,
          },
        ]);
      }
    }
    setNewWeightInput('');
  };

  const handleRemoveWeight = (weightToRemove: string) => {
    setWeightsList(weightsList.filter((w) => w !== weightToRemove));
    setVariantsList(variantsList.filter((v) => v.weight !== weightToRemove));
  };

  const handleVariantChange = (weight: string, field: 'price' | 'stock', value: number) => {
    setVariantsList((prev) =>
      prev.map((v) => (v.weight === weight ? { ...v, [field]: value } : v))
    );
  };

  // Image Upload handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PNG, JPG, JPEG, or WEBP image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Try uploading to backend
      try {
        const uploadRes = await api.uploadImage(file);
        if (uploadRes?.imageUrl) {
          const backendHost = API_BASE_URL.replace('/api', '');
          const fullImageUrl = uploadRes.imageUrl.startsWith('http')
            ? uploadRes.imageUrl
            : `${backendHost}${uploadRes.imageUrl}`;
          setFormData((prev) => ({ ...prev, image: fullImageUrl }));
          setImagePreview(fullImageUrl);
          toast.success('Image uploaded successfully to server');
          return;
        }
      } catch (backendErr) {
        console.log('Backend upload fallback...', backendErr);
      }

      // 2. Fallback to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, image: publicUrl }));
      setImagePreview(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.image) {
      toast.error('Please upload or specify a product image');
      return;
    }

    const primaryWeight = weightsList[0] || formData.weight || '1kg';
    const primaryFlavor = flavorsList[0] || formData.flavor || 'Unflavored';
    const basePrice = parseFloat(formData.price) || 0;
    const totalStock = parseInt(formData.stock) || 0;

    const productData: Partial<Product> = {
      ...(product?.id && { id: product.id }),
      name: formData.name.trim(),
      brand: formData.brand.trim() || 'BEASTFUEL',
      category: formData.category.trim() || 'Whey Protein',
      countryOfOrigin: formData.countryOfOrigin.trim() || 'USA',
      price: basePrice,
      stock: totalStock,
      image: formData.image,
      images: [formData.image],
      description: formData.description,
      weight: primaryWeight,
      weights: weightsList.length > 0 ? weightsList : [primaryWeight],
      flavor: primaryFlavor,
      flavors: flavorsList.length > 0 ? flavorsList : [primaryFlavor],
      variants: variantsList.length > 0 ? variantsList : [
        { weight: primaryWeight, price: basePrice, stock: totalStock }
      ],
      isActive: true,
    };

    onSave(productData as Product);
    toast.success(product ? 'Product updated successfully!' : 'New product created!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl my-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-card/95 backdrop-blur-md border-b border-border">
          <div>
            <h2 className="text-display text-2xl font-bold bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
              {product ? 'EDIT SUPPLEMENT PRODUCT' : 'CREATE SUPPLEMENT PRODUCT'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Brand → Product Name → Category hierarchy with multi-variant Flavors & Weights
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 1. HIERARCHY: Brand -> Product Name -> Category */}
          <div className="p-5 bg-secondary/30 rounded-xl border border-border/60 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Award className="w-4 h-4 text-amber-500" />
              1. Brand & Category Structure
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Brand */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-foreground">
                  Brand Name *
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full h-11 px-3.5 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="e.g. Optimum Nutrition"
                  />
                  {/* Quick Select Brand Chips */}
                  <div className="flex flex-wrap gap-1">
                    {brands.filter((b) => b !== 'All').map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setFormData({ ...formData, brand: b })}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          formData.brand === b
                            ? 'bg-primary text-primary-foreground font-bold border-primary'
                            : 'bg-secondary text-muted-foreground hover:text-foreground border-border'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-foreground">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-11 px-3.5 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="e.g. Gold Standard 100% Whey"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-foreground">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-11 px-3.5 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {categories.filter((c) => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Country of Origin */}
            <div className="pt-2 border-t border-border/40">
              <label className="block text-xs font-semibold mb-1.5 text-foreground flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                Country of Origin *
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={formData.countryOfOrigin}
                  onChange={(e) => setFormData({ ...formData, countryOfOrigin: e.target.value })}
                  className="h-10 px-3.5 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {countriesOfOrigin.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="Other">Other (Custom)</option>
                </select>

                <input
                  type="text"
                  value={formData.countryOfOrigin}
                  onChange={(e) => setFormData({ ...formData, countryOfOrigin: e.target.value })}
                  className="h-10 px-3.5 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none flex-1 min-w-[140px]"
                  placeholder="Or enter custom country"
                />
              </div>
            </div>
          </div>

          {/* 2. FLAVOR SELECTION (Multiple Options) */}
          <div className="p-5 bg-secondary/30 rounded-xl border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                2. Flavor Selection (Multiple Selectable Options)
              </label>
              <span className="text-xs text-muted-foreground">
                {flavorsList.length} flavor{flavorsList.length !== 1 ? 's' : ''} added
              </span>
            </div>

            {/* Input to add custom flavor */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newFlavorInput}
                onChange={(e) => setNewFlavorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFlavor(newFlavorInput);
                  }
                }}
                className="flex-1 h-10 px-3.5 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="Type a flavor and press enter (e.g. Cookies & Cream, Vanilla)"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddFlavor(newFlavorInput)}
                className="h-10 px-4 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Flavor
              </Button>
            </div>

            {/* Current Flavor Chips */}
            <div className="flex flex-wrap gap-2 pt-1 min-h-[36px]">
              {flavorsList.map((flavor) => (
                <span
                  key={flavor}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/30"
                >
                  <Check className="w-3 h-3 text-primary" />
                  {flavor}
                  <button
                    type="button"
                    onClick={() => handleRemoveFlavor(flavor)}
                    className="hover:text-destructive transition-colors ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {flavorsList.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  No flavors added yet. Click presets below to add quickly:
                </p>
              )}
            </div>

            {/* Quick Presets */}
            <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span className="text-[11px] font-medium mr-1">Quick Add:</span>
              {COMMON_FLAVORS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => handleAddFlavor(f)}
                  disabled={flavorsList.includes(f)}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                    flavorsList.includes(f)
                      ? 'opacity-40 cursor-not-allowed bg-secondary'
                      : 'hover:bg-primary/10 hover:text-primary border-border bg-background'
                  }`}
                >
                  + {f}
                </button>
              ))}
            </div>
          </div>

          {/* 3. WEIGHT SELECTION & VARIANTS BUILDER */}
          <div className="p-5 bg-secondary/30 rounded-xl border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                3. Weight Selection & Variant Pricing/Stock
              </label>
              <span className="text-xs text-muted-foreground">
                {weightsList.length} weight option{weightsList.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Input to add custom weight */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newWeightInput}
                onChange={(e) => setNewWeightInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddWeight(newWeightInput);
                  }
                }}
                className="flex-1 h-10 px-3.5 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="Type a weight (e.g. 500g, 1kg, 2kg, 5kg)"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddWeight(newWeightInput)}
                className="h-10 px-4 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Weight
              </Button>
            </div>

            {/* Quick Weight Presets */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span className="text-[11px] font-medium mr-1">Presets:</span>
              {COMMON_WEIGHTS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => handleAddWeight(w)}
                  disabled={weightsList.includes(w)}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                    weightsList.includes(w)
                      ? 'opacity-40 cursor-not-allowed bg-secondary'
                      : 'hover:bg-primary/10 hover:text-primary border-border bg-background'
                  }`}
                >
                  + {w}
                </button>
              ))}
            </div>

            {/* Variants Pricing Table */}
            {weightsList.length > 0 && (
              <div className="mt-3 border border-border/80 rounded-xl overflow-hidden bg-background">
                <div className="bg-secondary/70 px-4 py-2 text-xs font-semibold text-foreground grid grid-cols-12 gap-2">
                  <span className="col-span-4">Weight Variant</span>
                  <span className="col-span-4">Price ($)</span>
                  <span className="col-span-3">Stock</span>
                  <span className="col-span-1 text-right">Del</span>
                </div>
                <div className="divide-y divide-border/50">
                  {weightsList.map((w) => {
                    const variant = variantsList.find((v) => v.weight === w) || {
                      weight: w,
                      price: parseFloat(formData.price) || 0,
                      stock: 20,
                    };
                    return (
                      <div key={w} className="px-4 py-2.5 grid grid-cols-12 gap-2 items-center text-sm">
                        <span className="col-span-4 font-semibold text-foreground flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          {w}
                        </span>
                        <div className="col-span-4">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={variant.price}
                            onChange={(e) =>
                              handleVariantChange(w, 'price', parseFloat(e.target.value) || 0)
                            }
                            className="w-full h-8 px-2 bg-secondary border border-border rounded text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                            placeholder="Price"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            min="0"
                            value={variant.stock}
                            onChange={(e) =>
                              handleVariantChange(w, 'stock', parseInt(e.target.value) || 0)
                            }
                            className="w-full h-8 px-2 bg-secondary border border-border rounded text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                            placeholder="Stock"
                          />
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveWeight(w)}
                            className="text-muted-foreground hover:text-destructive p-1 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5 ml-auto" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. BASE PRICE, STOCK, IMAGE, DESCRIPTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">
                Base/Default Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full h-11 px-3.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="49.99"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">
                Total Stock Units *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full h-11 px-3.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="50"
              />
            </div>
          </div>

          {/* Product Image */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-foreground">
              Product Image URL / Upload *
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                value={formData.image}
                onChange={(e) => {
                  setFormData({ ...formData, image: e.target.value });
                  setImagePreview(e.target.value);
                }}
                className="flex-1 h-11 px-3.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="https://images.unsplash.com/photo-..."
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="h-11 px-4 text-xs"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Upload className="w-4 h-4 mr-1" />
                )}
                Upload
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            {imagePreview && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border mt-2">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-foreground">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 bg-secondary border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none resize-none"
              placeholder="Detailed supplement product description..."
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} className="px-6">
              Cancel
            </Button>
            <Button type="submit" className="px-8 font-bold shadow-md">
              {product ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
