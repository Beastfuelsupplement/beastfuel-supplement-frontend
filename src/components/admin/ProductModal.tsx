import { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Globe,
  Award,
  Sparkles,
  AlertCircle,
  Layers,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Info
} from 'lucide-react';
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

const PRESET_FLAVORS = [
  'Chocolate',
  'Vanilla',
  'Strawberry',
  'Cookies & Cream',
  'Unflavored',
  'Blue Raspberry',
  'Fruit Punch',
  'Watermelon',
];

const PRESET_WEIGHTS = ['300g', '500g', '1kg', '2kg', '4kg', '5kg'];

const PRESET_COUNTRIES = [
  'USA',
  'United Kingdom',
  'Germany',
  'Canada',
  'Australia',
  'Japan',
  'New Zealand',
];

export interface VariantRow {
  id: string;
  flavor: string;
  weight: string;
  price: string;
  stock: string;
}

const ProductModal = ({ isOpen, onClose, onSave, product }: ProductModalProps) => {
  // ================= SECTION 1: BASIC PRODUCT INFORMATION =================
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('');

  // ================= SECTION 2: PRODUCT VARIANTS =================
  const [flavorsPool, setFlavorsPool] = useState<string[]>(['Chocolate', 'Vanilla']);
  const [newFlavor, setNewFlavor] = useState('');

  const [weightsPool, setWeightsPool] = useState<string[]>(['1kg', '2kg']);
  const [newWeight, setNewWeight] = useState('');

  const [variantRows, setVariantRows] = useState<VariantRow[]>([
    { id: '1', flavor: 'Chocolate', weight: '1kg', price: '', stock: '' },
    { id: '2', flavor: 'Vanilla', weight: '1kg', price: '', stock: '' },
  ]);

  // ================= SECTION 3: PRODUCT DETAILS =================
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation States
  const [submitted, setSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Deduplicated Brand & Category options
  const existingBrands = Array.from(new Set(brands.filter((b) => b !== 'All')));
  const existingCategories = Array.from(new Set(categories.filter((c) => c !== 'All')));

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setBrand(product.brand || '');
      setCategory(product.category || '');
      setCountryOfOrigin(product.countryOfOrigin || '');
      setDescription(product.description || '');
      setImage(product.image || '');
      setImagePreview(product.image || null);
      setAdditionalImages(product.images ? product.images.filter(img => img !== product.image) : []);

      const flavors =
        product.flavors && product.flavors.length > 0
          ? product.flavors
          : product.flavor
          ? [product.flavor]
          : ['Chocolate'];
      setFlavorsPool(flavors);

      const weights =
        product.weights && product.weights.length > 0
          ? product.weights
          : product.weight
          ? [product.weight]
          : ['1kg'];
      setWeightsPool(weights);

      if (product.variants && product.variants.length > 0) {
        setVariantRows(
          product.variants.map((v, i) => ({
            id: v.id || `v-${i}-${Date.now()}`,
            flavor: v.flavor || flavors[0] || 'Unflavored',
            weight: v.weight || weights[0] || '1kg',
            price: v.price !== undefined ? v.price.toString() : '',
            stock: v.stock !== undefined ? v.stock.toString() : '',
          }))
        );
      } else {
        setVariantRows([
          {
            id: 'v-1',
            flavor: flavors[0] || 'Chocolate',
            weight: weights[0] || '1kg',
            price: product.price?.toString() || '',
            stock: product.stock?.toString() || '',
          },
        ]);
      }
    } else {
      // Clean slate for new product creation
      setName('');
      setBrand('');
      setCategory('');
      setCountryOfOrigin('');
      setDescription('');
      setImage('');
      setImagePreview(null);
      setAdditionalImages([]);
      setFlavorsPool(['Chocolate', 'Vanilla']);
      setWeightsPool(['1kg', '2kg']);
      setVariantRows([
        { id: '1', flavor: 'Chocolate', weight: '1kg', price: '', stock: '' },
        { id: '2', flavor: 'Chocolate', weight: '2kg', price: '', stock: '' },
        { id: '3', flavor: 'Vanilla', weight: '1kg', price: '', stock: '' },
        { id: '4', flavor: 'Vanilla', weight: '2kg', price: '', stock: '' },
      ]);
    }
    setSubmitted(false);
    setValidationErrors([]);
  }, [product, isOpen]);

  // Flavor Pool helpers
  const handleAddFlavor = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (!flavorsPool.includes(trimmed)) {
      setFlavorsPool([...flavorsPool, trimmed]);
    }
    setNewFlavor('');
  };

  const handleRemoveFlavor = (val: string) => {
    if (flavorsPool.length <= 1) {
      toast.error('Product must have at least one flavor option');
      return;
    }
    setFlavorsPool(flavorsPool.filter((f) => f !== val));
  };

  // Weight Pool helpers
  const handleAddWeight = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (!weightsPool.includes(trimmed)) {
      setWeightsPool([...weightsPool, trimmed]);
    }
    setNewWeight('');
  };

  const handleRemoveWeight = (val: string) => {
    if (weightsPool.length <= 1) {
      toast.error('Product must have at least one weight option');
      return;
    }
    setWeightsPool(weightsPool.filter((w) => w !== val));
  };

  // Auto-generate variant combinations from flavors & weights pools
  const handleGenerateVariantMatrix = () => {
    if (flavorsPool.length === 0 || weightsPool.length === 0) {
      toast.error('Please add at least one flavor and one weight before generating variants');
      return;
    }

    const basePrice = variantRows.find(r => r.price)?.price || '49.99';
    const baseStock = variantRows.find(r => r.stock)?.stock || '20';

    const combinations: VariantRow[] = [];
    flavorsPool.forEach((fl) => {
      weightsPool.forEach((w) => {
        const existing = variantRows.find((v) => v.flavor === fl && v.weight === w);
        combinations.push({
          id: `${fl}-${w}-${Date.now()}-${Math.random()}`,
          flavor: fl,
          weight: w,
          price: existing?.price || basePrice,
          stock: existing?.stock || baseStock,
        });
      });
    });

    setVariantRows(combinations);
    toast.success(`Generated ${combinations.length} variant combinations!`);
  };

  // Add individual custom variant row
  const handleAddEmptyVariantRow = () => {
    const defaultFlavor = flavorsPool[0] || 'Unflavored';
    const defaultWeight = weightsPool[0] || '1kg';
    const defaultPrice = variantRows[0]?.price || '';
    const defaultStock = variantRows[0]?.stock || '';

    setVariantRows([
      ...variantRows,
      {
        id: `row-${Date.now()}`,
        flavor: defaultFlavor,
        weight: defaultWeight,
        price: defaultPrice,
        stock: defaultStock,
      },
    ]);
  };

  const handleRemoveVariantRow = (rowId: string) => {
    if (variantRows.length <= 1) {
      toast.error('At least one product variant is required');
      return;
    }
    setVariantRows(variantRows.filter((r) => r.id !== rowId));
  };

  const handleUpdateVariantRow = (rowId: string, field: keyof VariantRow, value: string) => {
    setVariantRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r))
    );
  };

  // Image upload handling
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
      try {
        const uploadRes = await api.uploadImage(file);
        if (uploadRes?.imageUrl) {
          const backendHost = API_BASE_URL.replace('/api', '');
          const fullImageUrl = uploadRes.imageUrl.startsWith('http')
            ? uploadRes.imageUrl
            : `${backendHost}${uploadRes.imageUrl}`;
          setImage(fullImageUrl);
          setImagePreview(fullImageUrl);
          toast.success('Image uploaded successfully');
          return;
        }
      } catch (backendErr) {
        console.log('Backend upload fallback...', backendErr);
      }

      // Supabase fallback
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

      setImage(publicUrl);
      setImagePreview(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddAdditionalImage = () => {
    if (!newImageUrl.trim()) return;
    setAdditionalImages([...additionalImages, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const handleRemoveAdditionalImage = (index: number) => {
    setAdditionalImages(additionalImages.filter((_, i) => i !== index));
  };

  // ================= FORM VALIDATION =================
  const validateForm = (): boolean => {
    const errors: string[] = [];

    // 1. Basic Product Information Validation
    if (!name.trim()) errors.push('Product Name is required');
    if (!brand.trim()) errors.push('Brand is required');
    if (!category.trim()) errors.push('Category is required');
    
    // Country of Origin is STRICTLY REQUIRED
    if (!countryOfOrigin.trim()) {
      errors.push('Country of Origin is strictly required (e.g. USA, United Kingdom, Germany, Canada, Australia)');
    }

    // 2. Product Variant Information Validation
    if (variantRows.length === 0) {
      errors.push('At least one product variant (Flavor, Weight, Price, Stock) is required');
    } else {
      let missingFlavor = false;
      let missingWeight = false;
      let missingPrice = false;
      let missingStock = false;

      variantRows.forEach((v) => {
        if (!v.flavor.trim()) missingFlavor = true;
        if (!v.weight.trim()) missingWeight = true;
        const p = parseFloat(v.price);
        if (isNaN(p) || p <= 0) missingPrice = true;
        const s = parseInt(v.stock);
        if (isNaN(s) || s < 0) missingStock = true;
      });

      if (missingFlavor) errors.push('Flavor is required for each variant');
      if (missingWeight) errors.push('Weight is required for each variant');
      if (missingPrice) errors.push('Price is required for each variant and must be greater than 0');
      if (missingStock) errors.push('Stock Quantity is required for each variant and cannot be negative');
    }

    // 3. Product Details Validation
    if (!image.trim()) {
      errors.push('Product Image is required (enter an image URL or upload a file)');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!validateForm()) {
      toast.error('Validation failed. Please complete all required supplement fields marked with an asterisk (*).');
      return;
    }

    // Map variantRows into ProductVariant objects
    const compiledVariants: ProductVariant[] = variantRows.map((row) => ({
      flavor: row.flavor.trim(),
      weight: row.weight.trim(),
      price: parseFloat(row.price),
      stock: parseInt(row.stock),
      sku: `${brand.substring(0, 3).toUpperCase()}-${name.substring(0, 3).toUpperCase()}-${row.weight}-${row.flavor.substring(0, 3)}`.replace(/\s+/g, ''),
    }));

    // Starting price and total stock
    const basePrice = Math.min(...compiledVariants.map((v) => v.price));
    const totalStock = compiledVariants.reduce((sum, v) => sum + v.stock, 0);

    const primaryWeight = compiledVariants[0]?.weight || '1kg';
    const primaryFlavor = compiledVariants[0]?.flavor || 'Unflavored';

    const allImages = [image.trim(), ...additionalImages.filter(img => img.trim() && img !== image.trim())];

    const productData: Partial<Product> = {
      ...(product?.id && { id: product.id }),
      name: name.trim(),
      brand: brand.trim(),
      category: category.trim(),
      countryOfOrigin: countryOfOrigin.trim(),
      price: basePrice,
      stock: totalStock,
      image: image.trim(),
      images: allImages,
      description: description.trim(),
      weight: primaryWeight,
      weights: Array.from(new Set(compiledVariants.map((v) => v.weight))),
      flavor: primaryFlavor,
      flavors: Array.from(new Set(compiledVariants.map((v) => v.flavor))),
      variants: compiledVariants,
      isActive: true,
    };

    onSave(productData as Product);
    toast.success(product ? 'Product updated successfully!' : 'Supplement product published successfully!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[94vh] overflow-y-auto shadow-2xl my-auto flex flex-col">
        {/* Modal Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-5 bg-card/95 backdrop-blur-md border-b border-border">
          <div>
            <h2 className="text-display text-2xl font-bold bg-gradient-to-r from-primary via-amber-500 to-rose-500 bg-clip-text text-transparent">
              {product ? 'EDIT SUPPLEMENT PRODUCT' : 'ADD NEW SUPPLEMENT PRODUCT'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Admin is responsible for entering all required supplement product, variant, and origin information.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Validation Errors Alert Banner */}
        {submitted && validationErrors.length > 0 && (
          <div className="m-6 mb-0 p-4 bg-destructive/10 border-2 border-destructive/40 rounded-xl text-destructive space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-bold text-sm tracking-wide">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Please fix the following {validationErrors.length} required field errors:</span>
            </div>
            <ul className="text-xs space-y-1 list-disc list-inside pl-2">
              {validationErrors.map((err, i) => (
                <li key={i} className="font-medium">{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Live Hierarchy Relationship Badge */}
        {(brand || name || category) && (
          <div className="mx-6 mt-5 p-3 bg-secondary/50 border border-border/80 rounded-xl flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-muted-foreground flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-primary" /> Category Hierarchy:
            </span>
            <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold rounded">
              Brand: {brand || '(Select Brand)'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="px-2 py-0.5 bg-secondary text-foreground font-semibold rounded">
              Product: {name || '(Enter Name)'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold rounded">
              Category: {category || '(Select Category)'}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-8 flex-1">
          {/* ========================================================================= */}
          {/* SECTION 1: PRODUCT INFORMATION                                           */}
          {/* ========================================================================= */}
          <div className="p-5 sm:p-6 bg-secondary/30 rounded-2xl border border-border/70 space-y-5">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                  <Award className="w-4 h-4 text-amber-500" />
                  Product Information
                </h3>
                <p className="text-[11px] text-muted-foreground">Product Name, Brand, Category, Origin</p>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">
                * All fields in this section are required
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {/* Product Name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                  Product Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full h-11 px-4 bg-background border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                    submitted && !name.trim() ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                  }`}
                  placeholder="e.g. Gold Standard 100% Whey"
                />
                {submitted && !name.trim() && (
                  <p className="text-[11px] text-destructive mt-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Product Name is required.
                  </p>
                )}
              </div>

              {/* Brand */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                  Brand <span className="text-destructive">*</span>
                </label>
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <select
                      value={existingBrands.includes(brand) ? brand : 'Custom'}
                      onChange={(e) => {
                        if (e.target.value !== 'Custom') {
                          setBrand(e.target.value);
                        }
                      }}
                      className="h-11 px-3 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary flex-1 cursor-pointer"
                    >
                      <option value="">-- Select Brand --</option>
                      {existingBrands.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                      <option value="Custom">Custom Brand...</option>
                    </select>

                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className={`h-11 px-3 bg-background border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary flex-1 ${
                        submitted && !brand.trim() ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                      }`}
                      placeholder="Or enter brand"
                    />
                  </div>
                  {submitted && !brand.trim() && (
                    <p className="text-[11px] text-destructive mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Brand is required.
                    </p>
                  )}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                  Category <span className="text-destructive">*</span>
                </label>
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <select
                      value={existingCategories.includes(category) ? category : 'Custom'}
                      onChange={(e) => {
                        if (e.target.value !== 'Custom') {
                          setCategory(e.target.value);
                        }
                      }}
                      className="h-11 px-3 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary flex-1 cursor-pointer"
                    >
                      <option value="">-- Select Category --</option>
                      {existingCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="Custom">Custom Category...</option>
                    </select>

                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={`h-11 px-3 bg-background border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary flex-1 ${
                        submitted && !category.trim() ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                      }`}
                      placeholder="Or enter category"
                    />
                  </div>
                  {submitted && !category.trim() && (
                    <p className="text-[11px] text-destructive mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Category is required.
                    </p>
                  )}
                </div>
              </div>

              {/* Country of Origin (STRICTLY REQUIRED) */}
              <div className="md:col-span-2 pt-3 border-t border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-500" />
                    Country of Origin <span className="text-destructive font-black">* REQUIRED</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Admin must select or enter the manufacturing origin. Cannot be empty.
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <select
                    value={PRESET_COUNTRIES.includes(countryOfOrigin) ? countryOfOrigin : 'Custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'Custom') {
                        setCountryOfOrigin(e.target.value);
                      }
                    }}
                    className="h-11 px-3.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer sm:w-56"
                  >
                    <option value="">-- Select Origin --</option>
                    {PRESET_COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="Custom">Other Country...</option>
                  </select>

                  <input
                    type="text"
                    required
                    value={countryOfOrigin}
                    onChange={(e) => setCountryOfOrigin(e.target.value)}
                    className={`h-11 px-4 bg-background border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary flex-1 ${
                      submitted && !countryOfOrigin.trim()
                        ? 'border-destructive ring-1 ring-destructive'
                        : 'border-border'
                    }`}
                    placeholder="e.g. USA, United Kingdom, Germany, Canada, Australia"
                  />
                </div>

                {submitted && !countryOfOrigin.trim() && (
                  <p className="text-[11px] text-destructive mt-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Country of Origin is strictly required. You cannot publish the product without specifying an origin.
                  </p>
                )}

                {/* Country Quick Selection Pills */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className="text-[10px] text-muted-foreground font-semibold mr-1">Quick Select:</span>
                  {PRESET_COUNTRIES.map((country) => (
                    <button
                      key={country}
                      type="button"
                      onClick={() => setCountryOfOrigin(country)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        countryOfOrigin === country
                          ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-sm'
                          : 'bg-background hover:bg-secondary text-muted-foreground hover:text-foreground border-border'
                      }`}
                    >
                      {country}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: PRODUCT VARIANTS                                              */}
          {/* ========================================================================= */}
          <div className="p-5 sm:p-6 bg-secondary/30 rounded-2xl border border-border/70 space-y-5">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                  <Layers className="w-4 h-4 text-amber-500" />
                  Product Variants
                </h3>
                <p className="text-[11px] text-muted-foreground">Flavor, Weight, Price, Stock Quantity</p>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">
                * Each variant requires Flavor, Weight, Price, and Stock
              </span>
            </div>

            {/* Flavor & Weight Selectable Option Pools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Flavor Options Pool */}
              <div className="p-4 bg-background rounded-xl border border-border/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Available Flavors <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">Selectable options</span>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFlavor}
                    onChange={(e) => setNewFlavor(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFlavor(newFlavor);
                      }
                    }}
                    placeholder="Add custom flavor..."
                    className="h-9 px-3 bg-secondary border border-border rounded-lg text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddFlavor(newFlavor)}
                    className="h-9 px-3 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </div>

                {/* Flavor Badges */}
                <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                  {flavorsPool.map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                    >
                      {f}
                      <button
                        type="button"
                        onClick={() => handleRemoveFlavor(f)}
                        className="hover:text-destructive ml-0.5"
                        title="Remove flavor"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Preset Flavor Suggestions */}
                <div className="flex flex-wrap gap-1 pt-1 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground font-semibold py-0.5 mr-1">Presets:</span>
                  {PRESET_FLAVORS.map((pf) => (
                    <button
                      key={pf}
                      type="button"
                      disabled={flavorsPool.includes(pf)}
                      onClick={() => handleAddFlavor(pf)}
                      className="text-[10px] px-2 py-0.5 bg-secondary hover:bg-primary/10 hover:text-primary rounded border border-border disabled:opacity-40 transition-colors"
                    >
                      + {pf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight Options Pool */}
              <div className="p-4 bg-background rounded-xl border border-border/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Available Weights <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">Selectable options</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddWeight(newWeight);
                      }
                    }}
                    placeholder="Add weight (e.g. 500g, 1kg, 2kg)..."
                    className="h-9 px-3 bg-secondary border border-border rounded-lg text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddWeight(newWeight)}
                    className="h-9 px-3 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </div>

                {/* Weight Badges */}
                <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                  {weightsPool.map((w) => (
                    <span
                      key={w}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-foreground border border-border"
                    >
                      {w}
                      <button
                        type="button"
                        onClick={() => handleRemoveWeight(w)}
                        className="hover:text-destructive ml-0.5"
                        title="Remove weight"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Preset Weight Suggestions */}
                <div className="flex flex-wrap gap-1 pt-1 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground font-semibold py-0.5 mr-1">Presets:</span>
                  {PRESET_WEIGHTS.map((pw) => (
                    <button
                      key={pw}
                      type="button"
                      disabled={weightsPool.includes(pw)}
                      onClick={() => handleAddWeight(pw)}
                      className="text-[10px] px-2 py-0.5 bg-secondary hover:bg-primary/10 hover:text-primary rounded border border-border disabled:opacity-40 transition-colors"
                    >
                      + {pw}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Variant Matrix Generator Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div>
                <p className="text-xs font-bold text-foreground">Configured Product Variants ({variantRows.length})</p>
                <p className="text-[11px] text-muted-foreground">
                  Each variant has its own independent Flavor, Weight, Price, and Stock Quantity.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateVariantMatrix}
                  className="text-xs font-semibold bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Auto-Combine All Flavors & Weights
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddEmptyVariantRow}
                  className="text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  + Add Custom Variant
                </Button>
              </div>
            </div>

            {/* Multi-Variants Table */}
            <div className="border border-border rounded-xl overflow-hidden bg-background">
              <div className="bg-secondary/70 px-4 py-2.5 text-xs font-bold text-foreground grid grid-cols-12 gap-2 border-b border-border">
                <span className="col-span-3">Flavor <span className="text-destructive">*</span></span>
                <span className="col-span-3">Weight <span className="text-destructive">*</span></span>
                <span className="col-span-3">Price ($ / Rs.) <span className="text-destructive">*</span></span>
                <span className="col-span-2">Stock Units <span className="text-destructive">*</span></span>
                <span className="col-span-1 text-right">Action</span>
              </div>

              <div className="divide-y divide-border/50 max-h-72 overflow-y-auto">
                {variantRows.map((row, idx) => {
                  const hasFlavorErr = submitted && !row.flavor.trim();
                  const hasWeightErr = submitted && !row.weight.trim();
                  const hasPriceErr = submitted && (!row.price || isNaN(parseFloat(row.price)) || parseFloat(row.price) <= 0);
                  const hasStockErr = submitted && (!row.stock || isNaN(parseInt(row.stock)) || parseInt(row.stock) < 0);

                  return (
                    <div key={row.id} className="px-4 py-2.5 grid grid-cols-12 gap-2 items-center text-xs">
                      {/* Flavor */}
                      <div className="col-span-3">
                        <select
                          value={flavorsPool.includes(row.flavor) ? row.flavor : 'custom'}
                          onChange={(e) => {
                            if (e.target.value !== 'custom') {
                              handleUpdateVariantRow(row.id, 'flavor', e.target.value);
                            }
                          }}
                          className={`w-full h-8 px-2 bg-secondary border rounded text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none mb-1 ${
                            hasFlavorErr ? 'border-destructive' : 'border-border'
                          }`}
                        >
                          {flavorsPool.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                          <option value="custom">Custom...</option>
                        </select>
                        <input
                          type="text"
                          required
                          value={row.flavor}
                          onChange={(e) => handleUpdateVariantRow(row.id, 'flavor', e.target.value)}
                          className={`w-full h-8 px-2 bg-secondary border rounded text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none ${
                            hasFlavorErr ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                          }`}
                          placeholder="Flavor name"
                        />
                      </div>

                      {/* Weight */}
                      <div className="col-span-3">
                        <select
                          value={weightsPool.includes(row.weight) ? row.weight : 'custom'}
                          onChange={(e) => {
                            if (e.target.value !== 'custom') {
                              handleUpdateVariantRow(row.id, 'weight', e.target.value);
                            }
                          }}
                          className={`w-full h-8 px-2 bg-secondary border rounded text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none mb-1 ${
                            hasWeightErr ? 'border-destructive' : 'border-border'
                          }`}
                        >
                          {weightsPool.map((w) => (
                            <option key={w} value={w}>
                              {w}
                            </option>
                          ))}
                          <option value="custom">Custom...</option>
                        </select>
                        <input
                          type="text"
                          required
                          value={row.weight}
                          onChange={(e) => handleUpdateVariantRow(row.id, 'weight', e.target.value)}
                          className={`w-full h-8 px-2 bg-secondary border rounded text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none ${
                            hasWeightErr ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                          }`}
                          placeholder="e.g. 1kg, 2kg"
                        />
                      </div>

                      {/* Price */}
                      <div className="col-span-3 self-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={row.price}
                          onChange={(e) => handleUpdateVariantRow(row.id, 'price', e.target.value)}
                          className={`w-full h-10 px-2.5 bg-secondary border rounded-lg text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none ${
                            hasPriceErr ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                          }`}
                          placeholder="Price > 0"
                        />
                        {hasPriceErr && (
                          <span className="text-[10px] text-destructive block mt-0.5">Required (&gt; 0)</span>
                        )}
                      </div>

                      {/* Stock */}
                      <div className="col-span-2 self-center">
                        <input
                          type="number"
                          min="0"
                          required
                          value={row.stock}
                          onChange={(e) => handleUpdateVariantRow(row.id, 'stock', e.target.value)}
                          className={`w-full h-10 px-2.5 bg-secondary border rounded-lg text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none ${
                            hasStockErr ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                          }`}
                          placeholder="Stock"
                        />
                        {hasStockErr && (
                          <span className="text-[10px] text-destructive block mt-0.5">Required (≥ 0)</span>
                        )}
                      </div>

                      {/* Delete */}
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantRow(row.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                          title="Remove Variant"
                        >
                          <Trash2 className="w-4 h-4 ml-auto" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: PRODUCT DETAILS                                               */}
          {/* ========================================================================= */}
          <div className="p-5 sm:p-6 bg-secondary/30 rounded-2xl border border-border/70 space-y-5">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  Product Details
                </h3>
                <p className="text-[11px] text-muted-foreground">Description, Images</p>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">
                * Product Image is required
              </span>
            </div>

            {/* Product Image (REQUIRED) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Product Image URL / Upload <span className="text-destructive font-black">* REQUIRED</span>
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Required for catalog display & checkout
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="url"
                  required
                  value={image}
                  onChange={(e) => {
                    setImage(e.target.value);
                    setImagePreview(e.target.value);
                  }}
                  className={`h-11 px-4 bg-background border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary flex-1 ${
                    submitted && !image.trim() ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                  }`}
                  placeholder="https://images.unsplash.com/photo-..."
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="h-11 px-4 text-xs font-semibold shrink-0"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <Upload className="w-4 h-4 mr-1.5" />
                  )}
                  Upload Image File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {submitted && !image.trim() && (
                <p className="text-[11px] text-destructive mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Product Image is required. Please provide an image URL or upload an image file.
                </p>
              )}

              {/* Main Image Preview */}
              {imagePreview && (
                <div className="mt-3 flex items-center gap-3 p-2 bg-background rounded-xl border border-border w-fit">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-border">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-foreground flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Primary Product Image
                    </p>
                    <p className="text-muted-foreground text-[11px]">Successfully loaded</p>
                  </div>
                </div>
              )}

              {/* Additional Product Images */}
              <div className="mt-4 pt-4 border-t border-border/40">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Additional Product Images (Optional Gallery)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAdditionalImage();
                      }
                    }}
                    placeholder="Enter additional image URL..."
                    className="h-9 px-3 bg-background border border-border rounded-lg text-xs text-foreground focus:ring-1 focus:ring-primary flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAdditionalImage}
                    className="h-9 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Image
                  </Button>
                </div>

                {additionalImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {additionalImages.map((img, idx) => (
                      <div key={idx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-border">
                        <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveAdditionalImage(idx)}
                          className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Product Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                Product Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3.5 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                placeholder="Comprehensive description of the supplement product, active ingredients, usage instructions, etc."
              />
            </div>
          </div>

          {/* Sticky Form Actions Footer */}
          <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 pt-4 border-t border-border bg-card/95 backdrop-blur-md">
            <Button type="button" variant="outline" onClick={onClose} className="px-6 h-11">
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-8 h-11 font-bold shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {product ? 'Save & Update Product' : 'Publish Supplement Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
