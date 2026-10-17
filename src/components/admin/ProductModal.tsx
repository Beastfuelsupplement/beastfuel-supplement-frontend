import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Globe,
  Award,
  Layers,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  PackageCheck,
  Sparkles,
  Info,
  Check,
  RefreshCw,
  Eye,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  FolderOpen,
  Link as LinkIcon,
  HardDrive,
  FileImage,
  FolderUp,
  Gift,
  Clock,
  Flame,
  Calendar,
  Percent,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, ProductVariant } from '@/store/cartStore';
import { categories, brands } from '@/data/products';
import { api, API_BASE_URL, formatImageUrl } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import { calculateOfferPricing } from '@/lib/pricing';
import { useBrands } from '@/hooks/useBrands';
import AdminBrandsModal from '@/components/admin/AdminBrandsModal';
import { toast } from 'sonner';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'> | Product) => void;
  product?: Product | null;
  isSubmitting?: boolean;
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
  'Banana',
  'Caramel',
];

const PRESET_WEIGHTS = ['300g', '500g', '1kg', '2kg', '2.5kg', '4kg', '5kg'];

const PRESET_COUNTRIES = [
  'USA',
  'Germany',
  'United Kingdom',
  'Canada',
  'Australia',
  'New Zealand',
  'Japan',
  'Netherlands',
];

export interface WeightPriceConfig {
  weight: string;
  price: string;
  hasOffer?: boolean;
  originalPrice?: string;
  offerDiscount?: string;
  offerDiscountType?: 'percentage' | 'fixed';
  offerDiscountAmount?: string;
  offerBadge?: string;
  offerFreeProduct?: string;
}

export interface VariantCell {
  weight: string;
  flavor: string;
  price: number;
  stock: number;
  sku: string;
}

const STEPS = [
  { id: 1, title: 'Basic Info', desc: 'Name, Brand, Category, Origin' },
  { id: 2, title: 'Weights & Pricing', desc: 'Weight options & price' },
  { id: 3, title: 'Flavors & Stock', desc: 'Flavor inventory matrix' },
  { id: 4, title: 'Images', desc: 'Primary & gallery images' },
  { id: 5, title: 'Review & Publish', desc: 'Verify and save product' },
];

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  isSubmitting = false,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // ================= STEP 1: BASIC INFO =================
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('');
  const [description, setDescription] = useState('');

  // ================= STEP 2: WEIGHTS & PRICING =================
  const [weightConfigs, setWeightConfigs] = useState<WeightPriceConfig[]>([
    { weight: '1kg', price: '7000' },
    { weight: '2kg', price: '12000' },
  ]);
  const [newWeightInput, setNewWeightInput] = useState('');
  const [newWeightPriceInput, setNewWeightPriceInput] = useState('');
  
  // Special Promotional Offer State
  const [hasOffer, setHasOffer] = useState<boolean>(false);
  const [offerScope, setOfferScope] = useState<'all' | 'weights'>('all');
  const [offerBadge, setOfferBadge] = useState<string>('20% OFF');
  const [offerDiscount, setOfferDiscount] = useState<string>('');
  const [offerDiscountType, setOfferDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [offerDiscountAmount, setOfferDiscountAmount] = useState<string>('');
  const [offerEndDate, setOfferEndDate] = useState<string>('');
  const [offerFreeProduct, setOfferFreeProduct] = useState<string>('');
  const [originalPrice, setOriginalPrice] = useState<string>('');

  // ================= STEP 3: FLAVORS & INVENTORY MATRIX =================
  const [flavors, setFlavors] = useState<string[]>(['Chocolate', 'Vanilla']);
  const [newFlavorInput, setNewFlavorInput] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  // Map key: `${weight}:::${flavor}` -> stock (number)
  const [stockMatrix, setStockMatrix] = useState<Record<string, number>>({
    '1kg:::Chocolate': 0,
    '1kg:::Vanilla': 0,
    '2kg:::Chocolate': 0,
    '2kg:::Vanilla': 0,
  });
  // Map key: `${weight}:::${flavor}` -> boolean (true if produced for this weight, false if not produced)
  const [producedMatrix, setProducedMatrix] = useState<Record<string, boolean>>({
    '1kg:::Chocolate': true,
    '1kg:::Vanilla': true,
    '2kg:::Chocolate': true,
    '2kg:::Vanilla': true,
  });

  // ================= STEP 4: IMAGES =================
  const [primaryImageSource, setPrimaryImageSource] = useState<'local' | 'url'>('local');
  const [galleryImageSource, setGalleryImageSource] = useState<'local' | 'url'>('local');
  const [primaryImage, setPrimaryImage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [primaryFileName, setPrimaryFileName] = useState<string | null>(null);
  const [primaryFileSize, setPrimaryFileSize] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isDraggingPrimary, setIsDraggingPrimary] = useState(false);
  const [isDraggingGallery, setIsDraggingGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Step-level validation tracking
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [isSubmittingInternal, setIsSubmittingInternal] = useState(false);

  // Dynamic Brands from backend + static fallbacks
  const { data: dbBrands = [] } = useBrands();
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  // Brand and Category list
  const existingBrands = useMemo(() => {
    const list = new Set(dbBrands.map(b => b.name).concat(brands.filter(b => b !== 'All')));
    return Array.from(list);
  }, [dbBrands]);

  const selectedBrandObj = useMemo(() => {
    return dbBrands.find(b => b.name.toLowerCase() === (brand || '').trim().toLowerCase());
  }, [dbBrands, brand]);

  const existingCategories = useMemo(() => Array.from(new Set(categories.filter(c => c !== 'All'))), []);

  // Initialize or reset form state when modal opens or product changes
  useEffect(() => {
    if (!isOpen) return;

    if (product) {
      setName(product.name || '');
      setBrand(product.brand || '');
      setCategory(product.category || '');
      setCountryOfOrigin(product.countryOfOrigin || '');
      setDescription(product.description || '');
      setHasOffer(Boolean(product.hasOffer));
      setOfferScope(product.offerScope || 'all');
      setOfferBadge(product.offerBadge || (product.hasOffer ? 'SPECIAL DEAL' : '20% OFF'));
      setOfferDiscount(product.offerDiscount !== undefined && product.offerDiscount !== null ? String(product.offerDiscount) : '');
      setOfferDiscountType(product.offerDiscountType || 'percentage');
      setOfferDiscountAmount(product.offerDiscountAmount !== undefined && product.offerDiscountAmount !== null ? String(product.offerDiscountAmount) : '');
      setOfferEndDate(product.offerEndDate ? new Date(product.offerEndDate).toISOString().slice(0, 16) : '');
      setOfferFreeProduct(product.offerFreeProduct || '');
      setOriginalPrice(product.originalPrice !== undefined && product.originalPrice !== null ? String(product.originalPrice) : '');
      setPrimaryImage(product.image || '');
      setImagePreview(product.image ? formatImageUrl(product.image) : null);
      setPrimaryFileName(null);
      setPrimaryFileSize(null);
      if (product.image?.startsWith('http://') || product.image?.startsWith('https://')) {
        setPrimaryImageSource('url');
      } else {
        setPrimaryImageSource('local');
      }
      setGalleryImages(
        product.images
          ? product.images.filter(img => img && img !== product.image).map(img => formatImageUrl(img))
          : []
      );

      // Extract weights and prices
      const wList = product.weights && product.weights.length > 0
        ? product.weights
        : product.weight
        ? [product.weight]
        : ['1kg'];

      const fList = product.flavors && product.flavors.length > 0
        ? product.flavors
        : product.flavor
        ? [product.flavor]
        : ['Standard'];

      setFlavors(fList);

      // Build weight configs from variants or fallback
      const wConfigs: WeightPriceConfig[] = wList.map(w => {
        const matchingVariant = product.variants?.find(v => v.weight === w);
        const matchingWeightOffer = product.weightOffers?.find(wo => wo.weight === w);
        const p = matchingVariant?.price ?? product.price ?? 5000;
        return {
          weight: w,
          price: p.toString(),
          hasOffer: matchingWeightOffer ? Boolean(matchingWeightOffer.hasOffer) : (matchingVariant?.hasOffer !== undefined ? Boolean(matchingVariant.hasOffer) : Boolean(product.hasOffer)),
          originalPrice: matchingWeightOffer?.originalPrice ? String(matchingWeightOffer.originalPrice) : (matchingVariant?.originalPrice ? String(matchingVariant.originalPrice) : ''),
          offerDiscount: matchingWeightOffer?.offerDiscount ? String(matchingWeightOffer.offerDiscount) : (matchingVariant?.offerDiscount ? String(matchingVariant.offerDiscount) : ''),
          offerDiscountType: matchingWeightOffer?.offerDiscountType || matchingVariant?.offerDiscountType || 'percentage',
          offerDiscountAmount: matchingWeightOffer?.offerDiscountAmount ? String(matchingWeightOffer.offerDiscountAmount) : (matchingVariant?.offerDiscountAmount ? String(matchingVariant.offerDiscountAmount) : ''),
          offerBadge: matchingWeightOffer?.offerBadge || matchingVariant?.offerBadge || '',
          offerFreeProduct: matchingWeightOffer?.offerFreeProduct || matchingVariant?.offerFreeProduct || '',
        };
      });
      setWeightConfigs(wConfigs.length > 0 ? wConfigs : [{ weight: '1kg', price: '7000' }]);
      setLowStockThreshold(product.lowStockThreshold !== undefined ? Number(product.lowStockThreshold) : 5);

      // Populate stock matrix & produced status
      const matrix: Record<string, number> = {};
      const prodMap: Record<string, boolean> = {};
      const hasExistingVariants = Boolean(product.variants && product.variants.length > 0);

      wList.forEach(w => {
        fList.forEach(f => {
          const key = `${w}:::${f}`;
          const v = product.variants?.find(
            item => item.weight === w && (item.flavor === f || !item.flavor)
          );
          if (v) {
            prodMap[key] = true;
            matrix[key] = v.stock !== undefined ? v.stock : 0;
          } else {
            // If the product had existing variants, any combo not in variants is NOT produced
            prodMap[key] = hasExistingVariants ? false : true;
            matrix[key] = 0;
          }
        });
      });
      setStockMatrix(matrix);
      setProducedMatrix(prodMap);
    } else {
      // Clean state for adding new product
      setName('');
      setBrand('');
      setCategory('');
      setCountryOfOrigin('USA');
      setDescription('');
      setHasOffer(false);
      setOfferScope('all');
      setOfferBadge('20% OFF');
      setOfferDiscount('');
      setOfferDiscountType('percentage');
      setOfferDiscountAmount('');
      setOfferEndDate('');
      setOfferFreeProduct('');
      setOriginalPrice('');
      setLowStockThreshold(5);
      setWeightConfigs([
        { weight: '1kg', price: '7000' },
        { weight: '2kg', price: '12000' },
        { weight: '2.2kg', price: '13000' },
      ]);
      setFlavors(['Chocolate', 'Vanilla', 'Strawberry']);
      // All variant unit stocks default to 0
      setStockMatrix({
        '1kg:::Chocolate': 0,
        '1kg:::Vanilla': 0,
        '1kg:::Strawberry': 0,
        '2kg:::Chocolate': 0,
        '2kg:::Vanilla': 0,
        '2kg:::Strawberry': 0,
        '2.2kg:::Chocolate': 0,
        '2.2kg:::Vanilla': 0,
        '2.2kg:::Strawberry': 0,
      });
      // By default enable produced
      setProducedMatrix({
        '1kg:::Chocolate': true,
        '1kg:::Vanilla': true,
        '1kg:::Strawberry': true,
        '2kg:::Chocolate': true,
        '2kg:::Vanilla': true,
        '2kg:::Strawberry': false,
        '2.2kg:::Chocolate': true,
        '2.2kg:::Vanilla': false,
        '2.2kg:::Strawberry': true,
      });
      setPrimaryImage('');
      setImagePreview(null);
      setPrimaryFileName(null);
      setPrimaryFileSize(null);
      setPrimaryImageSource('local');
      setGalleryImageSource('local');
      setGalleryImages([]);
    }

    setCurrentStep(1);
    setStepErrors({});
    setIsSubmittingInternal(false);
  }, [isOpen, product]);

  // Compute full compiled variants list (only for combinations produced for that weight)
  const compiledVariants = useMemo<VariantCell[]>(() => {
    const list: VariantCell[] = [];
    const bCode = (brand || 'BF').substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const nCode = (name || 'PRD').substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');

    weightConfigs.forEach(wc => {
      const priceNum = parseFloat(wc.price) || 0;
      flavors.forEach(fl => {
        const key = `${wc.weight}:::${fl}`;
        const isProduced = producedMatrix[key] !== false;
        if (!isProduced) return; // Skip if this flavor is NOT produced for this weight

        const stockNum = stockMatrix[key] !== undefined ? stockMatrix[key] : 0;
        const wCode = wc.weight.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const flCode = fl.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const sku = `${bCode}-${nCode}-${wCode}-${flCode}`;

        list.push({
          weight: wc.weight,
          flavor: fl,
          price: priceNum,
          stock: stockNum,
          sku,
        });
      });
    });

    return list;
  }, [weightConfigs, flavors, stockMatrix, producedMatrix, brand, name]);

  const totalCalculatedStock = useMemo(() => {
    return compiledVariants.reduce((sum, v) => sum + v.stock, 0);
  }, [compiledVariants]);

  const startingPrice = useMemo(() => {
    const prices = weightConfigs.map(wc => parseFloat(wc.price)).filter(p => !isNaN(p) && p > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  }, [weightConfigs]);

  // ================= STEP VALIDATION =================
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!name.trim()) errors.name = 'Product name is required.';
      if (!brand.trim()) errors.brand = 'Brand is required.';
      if (!category.trim()) errors.category = 'Category is required.';
      if (!countryOfOrigin.trim()) errors.countryOfOrigin = 'Country of origin is strictly required.';
      if (!description.trim()) errors.description = 'Product description is required.';
    }

    if (step === 2) {
      if (weightConfigs.length === 0) {
        errors.weights = 'Please configure at least one weight option.';
      } else {
        const seen = new Set<string>();
        weightConfigs.forEach((wc, idx) => {
          if (!wc.weight.trim()) {
            errors[`weight_${idx}`] = 'Weight name cannot be empty.';
          } else if (seen.has(wc.weight.trim().toLowerCase())) {
            errors[`weight_${idx}`] = `Duplicate weight "${wc.weight}". Weights must be unique.`;
          } else {
            seen.add(wc.weight.trim().toLowerCase());
          }

          const p = parseFloat(wc.price);
          if (isNaN(p) || p <= 0) {
            errors[`price_${idx}`] = 'Price must be greater than 0.';
          }
        });
      }
    }

    if (step === 3) {
      if (flavors.length === 0) {
        errors.flavors = 'Please add at least one flavor option.';
      } else if (compiledVariants.length === 0) {
        errors.flavors = 'Please enable at least one weight & flavor combination for this product.';
      } else {
        // Validate stock inputs only for produced combinations
        weightConfigs.forEach(wc => {
          flavors.forEach(fl => {
            const key = `${wc.weight}:::${fl}`;
            if (producedMatrix[key] !== false) {
              const s = stockMatrix[key];
              if (s === undefined || isNaN(s) || s < 0) {
                errors[key] = 'Stock cannot be negative.';
              }
            }
          });
        });
      }
    }

    if (step === 4) {
      if (!primaryImage.trim()) {
        errors.image = 'A primary product image is required. Upload an image or enter a valid URL.';
      }
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setStepErrors({});
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } else {
      toast.error('Please complete all required fields on this step before proceeding.');
    }
  };

  const handleBack = () => {
    setStepErrors({});
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // ================= WEIGHT CONTROLS =================
  const handleAddWeight = () => {
    const w = newWeightInput.trim();
    const p = newWeightPriceInput.trim();
    if (!w) {
      toast.error('Enter a weight label (e.g. 1kg, 2kg, 500g)');
      return;
    }
    if (weightConfigs.some(wc => wc.weight.toLowerCase() === w.toLowerCase())) {
      toast.error(`Weight "${w}" already exists.`);
      return;
    }
    const priceNum = parseFloat(p);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please enter a valid selling price greater than 0.');
      return;
    }

    setWeightConfigs([...weightConfigs, { weight: w, price: p }]);
    setNewWeightInput('');
    setNewWeightPriceInput('');

    // Prepopulate matrix for this new weight across existing flavors (default to 0, enabled by default)
    const updated = { ...stockMatrix };
    const updatedProd = { ...producedMatrix };
    flavors.forEach(fl => {
      updated[`${w}:::${fl}`] = 0;
      updatedProd[`${w}:::${fl}`] = true;
    });
    setStockMatrix(updated);
    setProducedMatrix(updatedProd);
    toast.success(`Added weight option: ${w} at Rs. ${p}`);
  };

  const handleUpdateWeightOffer = (index: number, patch: Partial<WeightPriceConfig>) => {
    setWeightConfigs(prev =>
      prev.map((wc, i) => (i === index ? { ...wc, ...patch } : wc))
    );
  };

  const handleRemoveWeight = (wToRemove: string) => {
    if (weightConfigs.length <= 1) {
      toast.error('Product must have at least one weight option.');
      return;
    }
    setWeightConfigs(weightConfigs.filter(wc => wc.weight !== wToRemove));
  };

  const handleUpdateWeightPrice = (index: number, newPrice: string) => {
    setWeightConfigs(prev =>
      prev.map((wc, i) => (i === index ? { ...wc, price: newPrice } : wc))
    );
  };

  // ================= FLAVOR CONTROLS =================
  const handleAddFlavor = (val: string) => {
    const fl = val.trim();
    if (!fl) return;
    if (flavors.some(f => f.toLowerCase() === fl.toLowerCase())) {
      toast.error(`Flavor "${fl}" already exists.`);
      return;
    }

    setFlavors([...flavors, fl]);
    setNewFlavorInput('');

    // Prepopulate matrix for this flavor across existing weights (default to 0, enabled by default)
    const updated = { ...stockMatrix };
    const updatedProd = { ...producedMatrix };
    weightConfigs.forEach(wc => {
      updated[`${wc.weight}:::${fl}`] = 0;
      updatedProd[`${wc.weight}:::${fl}`] = true;
    });
    setStockMatrix(updated);
    setProducedMatrix(updatedProd);
  };

  const handleRemoveFlavor = (flToRemove: string) => {
    if (flavors.length <= 1) {
      toast.error('Product must have at least one flavor option.');
      return;
    }
    setFlavors(flavors.filter(f => f !== flToRemove));
  };

  // Toggle whether a specific weight+flavor combination is produced/offered
  const handleToggleProduced = (weight: string, flavor: string) => {
    const key = `${weight}:::${flavor}`;
    setProducedMatrix(prev => {
      const current = prev[key] !== false;
      const nextVal = !current;
      toast.info(
        nextVal
          ? `Enabled "${flavor}" for "${weight}"`
          : `Disabled "${flavor}" for "${weight}" (Not Produced)`
      );
      return { ...prev, [key]: nextVal };
    });
  };

  // Bulk enable or disable all flavors for a specific weight
  const handleSetRowProduced = (weight: string, enabled: boolean) => {
    setProducedMatrix(prev => {
      const updated = { ...prev };
      flavors.forEach(fl => {
        updated[`${weight}:::${fl}`] = enabled;
      });
      toast.info(`${enabled ? 'Enabled' : 'Disabled'} all flavors for ${weight}`);
      return updated;
    });
  };

  const handleUpdateStockCell = (weight: string, flavor: string, value: string) => {
    // Strip leading zeros if more than 1 digit (e.g. "010" -> "10", "05" -> "5")
    const stripped = value.replace(/^0+(?=\d)/, '');
    const num = stripped === '' ? 0 : parseInt(stripped, 10);
    const validNum = isNaN(num) || num < 0 ? 0 : num;
    setStockMatrix(prev => ({
      ...prev,
      [`${weight}:::${flavor}`]: validNum,
    }));
  };

  const handleBulkSetStock = (qty: number) => {
    const updated: Record<string, number> = {};
    weightConfigs.forEach(wc => {
      flavors.forEach(fl => {
        updated[`${wc.weight}:::${fl}`] = qty;
      });
    });
    setStockMatrix(updated);
    toast.success(`Set stock of all variants to ${qty} units.`);
  };

  // ================= IMAGE COMPRESSION & UPLOAD =================
  const compressImageFile = (file: File, maxDim = 1200, quality = 0.82): Promise<{ file: File; dataUrl: string }> => {
    return new Promise((resolve) => {
      // SVGs/GIFs pass through
      if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
        const reader = new FileReader();
        reader.onload = () => resolve({ file, dataUrl: (reader.result as string) || '' });
        reader.onerror = () => resolve({ file, dataUrl: '' });
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ file, dataUrl: (e.target?.result as string) || '' });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const outMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(outMime, quality);

          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                const optFile = new File([blob], file.name, {
                  type: outMime,
                  lastModified: Date.now(),
                });
                resolve({ file: optFile, dataUrl });
              } else {
                resolve({ file, dataUrl: dataUrl || ((e.target?.result as string) || '') });
              }
            },
            outMime,
            quality
          );
        };
        img.onerror = () => {
          resolve({ file, dataUrl: (e.target?.result as string) || '' });
        };
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => resolve({ file, dataUrl: '' });
      reader.readAsDataURL(file);
    });
  };

  const handlePrimaryFileSelect = async (file?: File) => {
    if (!file) return;

    // Validate format
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      toast.error('Only PNG, JPG, JPEG, WEBP or GIF formats are allowed.');
      return;
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size exceeds 10MB limit. Please choose a smaller image.');
      return;
    }

    setPrimaryFileName(file.name);
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;
    setPrimaryFileSize(sizeStr);

    setIsUploading(true);
    setUploadProgress(`Processing "${file.name}"...`);

    try {
      // Compress and get instant local preview
      const { file: optimizedFile, dataUrl: compressedDataUrl } = await compressImageFile(file);
      if (compressedDataUrl) {
        setImagePreview(compressedDataUrl);
      }

      // Attempt persistent upload to backend storage
      try {
        setUploadProgress(`Uploading "${file.name}" to storage...`);
        const res = await api.uploadImage(optimizedFile);
        if (res && res.imageUrl) {
          const formatted = formatImageUrl(res.imageUrl);
          setPrimaryImage(formatted);
          setImagePreview(formatted);
          toast.success(`"${file.name}" uploaded successfully!`);
          return;
        }
      } catch (uploadErr) {
        console.warn('Server upload unavailable, using optimized local image data:', uploadErr);
      }

      // Offline / fallback: save compressed data URL so payload stays lightweight
      if (compressedDataUrl) {
        setPrimaryImage(compressedDataUrl);
        toast.success(`"${file.name}" loaded successfully!`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to process image file');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleGalleryFilesSelect = async (fileList?: FileList | File[]) => {
    if (!fileList) return;
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(`Processing ${files.length} image(s)...`);

    let addedCount = 0;
    for (const file of files) {
      const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
      if (!allowed.includes(file.type)) {
        toast.error(`Skipped "${file.name}": Unsupported format.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Skipped "${file.name}": Exceeds 10MB limit.`);
        continue;
      }

      try {
        const { file: optimizedFile, dataUrl: compressedDataUrl } = await compressImageFile(file);
        let finalImage = '';
        try {
          const res = await api.uploadImage(optimizedFile);
          if (res?.imageUrl) {
            finalImage = formatImageUrl(res.imageUrl);
          }
        } catch {
          // Fallback to compressed data URL
        }

        if (!finalImage) {
          finalImage = compressedDataUrl;
        }

        if (finalImage) {
          setGalleryImages(prev => [...prev, finalImage]);
          addedCount++;
        }
      } catch (err: any) {
        toast.error(`Error loading "${file.name}": ${err.message}`);
      }
    }

    if (addedCount > 0) {
      toast.success(`Added ${addedCount} image(s) to gallery!`);
    }
    setIsUploading(false);
    setUploadProgress(null);
  };

  const handleAddGalleryUrl = () => {
    if (!newGalleryUrl.trim()) return;
    setGalleryImages([...galleryImages, newGalleryUrl.trim()]);
    setNewGalleryUrl('');
  };

  const handleRemoveGalleryImage = (idx: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== idx));
  };

  // ================= FINAL SUBMISSION =================
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Verify all steps
    for (let s = 1; s <= 4; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        toast.error(`Please correct errors in Step ${s}: ${STEPS[s - 1].title}`);
        return;
      }
    }

    setIsSubmittingInternal(true);

    const weightOffers = weightConfigs.map(wc => {
      const isWeightOfferActive = offerScope === 'all' ? Boolean(hasOffer) : Boolean(wc.hasOffer);
      const wBasePrice = Number(wc.price) || 0;
      const wPricing = calculateOfferPricing(wBasePrice, isWeightOfferActive ? {
        hasOffer: true,
        offerDiscount: offerScope === 'weights' ? (wc.offerDiscount ? Number(wc.offerDiscount) : undefined) : (offerDiscount ? Number(offerDiscount) : undefined),
        offerDiscountType: offerScope === 'weights' ? (wc.offerDiscountType || 'percentage') : offerDiscountType,
        offerDiscountAmount: offerScope === 'weights' ? (wc.offerDiscountAmount ? Number(wc.offerDiscountAmount) : undefined) : (offerDiscountAmount ? Number(offerDiscountAmount) : undefined),
        offerEndDate,
      } : null);

      return {
        weight: wc.weight,
        hasOffer: isWeightOfferActive,
        price: wBasePrice,
        originalPrice: wBasePrice,
        offerPrice: isWeightOfferActive ? wPricing.offerPrice : undefined,
        offerDiscount: offerScope === 'weights'
          ? (wc.offerDiscount ? Number(wc.offerDiscount) : undefined)
          : (offerDiscount ? Number(offerDiscount) : undefined),
        offerDiscountType: offerScope === 'weights' ? (wc.offerDiscountType || 'percentage') : offerDiscountType,
        offerDiscountAmount: offerScope === 'weights'
          ? (wc.offerDiscountAmount ? Number(wc.offerDiscountAmount) : undefined)
          : (offerDiscountAmount ? Number(offerDiscountAmount) : undefined),
        offerBadge: offerScope === 'weights' ? (wc.offerBadge || offerBadge) : offerBadge,
        offerFreeProduct: offerScope === 'weights' ? (wc.offerFreeProduct || offerFreeProduct) : offerFreeProduct,
      };
    });

    const isAnyOfferActive = hasOffer && (offerScope === 'all' || weightOffers.some(wo => wo.hasOffer));

    const compiled: ProductVariant[] = compiledVariants.map(v => {
      const matchingWc = weightConfigs.find(wc => wc.weight === v.weight);
      const isWeightOfferActive = offerScope === 'all' ? Boolean(hasOffer) : Boolean(matchingWc?.hasOffer);
      const vPricing = calculateOfferPricing(v.price, isWeightOfferActive ? {
        hasOffer: true,
        offerDiscount: offerScope === 'weights' ? (matchingWc?.offerDiscount ? Number(matchingWc.offerDiscount) : undefined) : (offerDiscount ? Number(offerDiscount) : undefined),
        offerDiscountType: offerScope === 'weights' ? (matchingWc?.offerDiscountType || 'percentage') : offerDiscountType,
        offerDiscountAmount: offerScope === 'weights' ? (matchingWc?.offerDiscountAmount ? Number(matchingWc.offerDiscountAmount) : undefined) : (offerDiscountAmount ? Number(offerDiscountAmount) : undefined),
        offerEndDate,
      } : null);

      return {
        weight: v.weight,
        flavor: v.flavor,
        price: v.price,
        stock: v.stock,
        sku: v.sku,
        hasOffer: isWeightOfferActive,
        originalPrice: v.price,
        offerPrice: isWeightOfferActive ? vPricing.offerPrice : undefined,
        offerDiscount: offerScope === 'weights'
          ? (matchingWc?.offerDiscount ? Number(matchingWc.offerDiscount) : undefined)
          : (offerDiscount ? Number(offerDiscount) : undefined),
        offerDiscountType: offerScope === 'weights' ? (matchingWc?.offerDiscountType || 'percentage') : offerDiscountType,
        offerDiscountAmount: offerScope === 'weights'
          ? (matchingWc?.offerDiscountAmount ? Number(matchingWc.offerDiscountAmount) : undefined)
          : (offerDiscountAmount ? Number(offerDiscountAmount) : undefined),
        offerBadge: offerScope === 'weights' ? (matchingWc?.offerBadge || offerBadge) : offerBadge,
        offerFreeProduct: offerScope === 'weights' ? (matchingWc?.offerFreeProduct || offerFreeProduct) : offerFreeProduct,
      };
    });

    const allImagesList = Array.from(
      new Set([primaryImage.trim(), ...galleryImages.map(img => img.trim()).filter(Boolean)])
    );

    const derivedWeights = Array.from(new Set(compiled.map(v => v.weight)));
    const derivedFlavors = Array.from(new Set(compiled.map(v => v.flavor)));

    const globalPricing = calculateOfferPricing(startingPrice, isAnyOfferActive ? {
      hasOffer: true,
      offerDiscount: offerDiscount ? Number(offerDiscount) : undefined,
      offerDiscountType,
      offerDiscountAmount: offerDiscountAmount ? Number(offerDiscountAmount) : undefined,
      offerEndDate,
    } : null);

    const productPayload: any = {
      ...(product?.id && { id: product.id }),
      name: name.trim(),
      brand: brand.trim(),
      category: category.trim(),
      countryOfOrigin: countryOfOrigin.trim(),
      description: description.trim(),
      image: primaryImage.trim(),
      images: allImagesList,
      price: startingPrice,
      stock: totalCalculatedStock,
      lowStockThreshold: Math.max(0, Number(lowStockThreshold) || 5),
      weight: derivedWeights[0] || weightConfigs[0]?.weight || '1kg',
      weights: derivedWeights.length > 0 ? derivedWeights : weightConfigs.map(wc => wc.weight),
      flavor: derivedFlavors[0] || flavors[0] || 'Standard',
      flavors: derivedFlavors.length > 0 ? derivedFlavors : flavors,
      variants: compiled,
      isActive: true,
      hasOffer: Boolean(isAnyOfferActive),
      offerScope: isAnyOfferActive ? offerScope : 'all',
      weightOffers: isAnyOfferActive ? weightOffers : [],
      offerBadge: hasOffer ? (offerBadge.trim() || 'SPECIAL DEAL') : undefined,
      offerDiscountType: hasOffer ? offerDiscountType : undefined,
      offerDiscount: hasOffer && offerDiscountType === 'percentage' && offerDiscount ? Number(offerDiscount) : undefined,
      offerDiscountAmount: hasOffer && offerDiscountType === 'fixed' && offerDiscountAmount ? Number(offerDiscountAmount) : undefined,
      offerEndDate: hasOffer && offerEndDate ? new Date(offerEndDate).toISOString() : undefined,
      offerFreeProduct: hasOffer && offerFreeProduct.trim() ? offerFreeProduct.trim() : undefined,
      originalPrice: hasOffer ? startingPrice : undefined,
      offerPrice: hasOffer ? globalPricing.offerPrice : undefined,
    };

    try {
      onSave(productPayload);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save product');
      setIsSubmittingInternal(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 lg:left-64 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-card border border-border/80 rounded-2xl w-full max-w-6xl max-h-[95vh] h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* ================= MODAL HEADER & STEP PROGRESS ================= */}
        <div className="border-b border-border bg-card/95 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-primary flex items-center justify-center text-primary-foreground shadow-md font-black">
                BF
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  {product ? 'EDIT SUPPLEMENT PRODUCT' : 'ADD NEW SUPPLEMENT PRODUCT'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Step {currentStep} of 5: {STEPS[currentStep - 1].desc}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
              title="Close Dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {STEPS.map(step => {
              const isPassed = step.id < currentStep;
              const isCurrent = step.id === currentStep;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    // Allow clicking previous steps or next step if valid
                    if (step.id < currentStep) {
                      setCurrentStep(step.id);
                    } else if (step.id === currentStep + 1 && validateStep(currentStep)) {
                      setCurrentStep(step.id);
                    }
                  }}
                  className={`flex flex-col text-left py-2 px-2.5 sm:px-3 rounded-xl border transition-all text-xs font-semibold ${
                    isCurrent
                      ? 'bg-primary/10 border-primary text-primary shadow-xs ring-1 ring-primary/30'
                      : isPassed
                      ? 'bg-secondary/60 border-border text-foreground hover:bg-secondary'
                      : 'bg-background/40 border-border/50 text-muted-foreground opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider">
                      Step {step.id}
                    </span>
                    {isPassed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-primary' : 'bg-muted'}`} />
                    )}
                  </div>
                  <span className="truncate text-[11px] sm:text-xs font-bold">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= MODAL BODY / FORM STEPS ================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          
          {/* STEP 1: BASIC PRODUCT INFORMATION */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 flex items-start gap-3">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <strong className="text-foreground font-semibold">Step 1: Basic Information</strong> — Provide core supplement identity. All fields in this step are mandatory, including Country of Origin.
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                  Product Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. 100% Whey Gold Standard Isolate"
                  className={`w-full h-11 px-4 bg-background border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                    stepErrors.name ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                  }`}
                />
                {stepErrors.name && (
                  <p className="text-[11px] text-destructive mt-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {stepErrors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Brand with Logo Preview and Quick Creator */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Brand <span className="text-destructive">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsBrandModalOpen(true)}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Brand & Logo
                    </button>
                  </div>

                  <div className="flex gap-2 items-center">
                    {/* Brand logo thumbnail preview */}
                    {selectedBrandObj?.logo && (
                      <div
                        className="w-11 h-11 rounded-xl bg-white/95 dark:bg-zinc-900 border border-border flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-xs"
                        title={`${selectedBrandObj.name} Logo`}
                      >
                        <img
                          src={formatImageUrl(selectedBrandObj.logo)}
                          alt={selectedBrandObj.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )}

                    <select
                      value={existingBrands.includes(brand) ? brand : 'custom'}
                      onChange={e => {
                        if (e.target.value === 'ADD_NEW') {
                          setIsBrandModalOpen(true);
                        } else if (e.target.value !== 'custom') {
                          setBrand(e.target.value);
                          const matched = dbBrands.find(b => b.name.toLowerCase() === e.target.value.toLowerCase());
                          if (matched?.countryOfOrigin && !countryOfOrigin) {
                            setCountryOfOrigin(matched.countryOfOrigin);
                          }
                        }
                      }}
                      className="h-11 px-3 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary w-2/5 cursor-pointer"
                    >
                      <option value="">-- Preset Brand --</option>
                      {existingBrands.map(b => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                      <option value="custom">Other / Custom...</option>
                      <option value="ADD_NEW" className="font-bold text-primary">+ New Brand with Logo...</option>
                    </select>

                    <input
                      type="text"
                      value={brand}
                      onChange={e => setBrand(e.target.value)}
                      placeholder="Brand name"
                      className={`h-11 px-3 bg-background border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary flex-1 ${
                        stepErrors.brand ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                      }`}
                    />
                  </div>
                  {stepErrors.brand && (
                    <p className="text-[11px] text-destructive mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {stepErrors.brand}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                    Category <span className="text-destructive">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={existingCategories.includes(category) ? category : 'custom'}
                      onChange={e => {
                        if (e.target.value !== 'custom') {
                          setCategory(e.target.value);
                        }
                      }}
                      className="h-11 px-3 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary w-2/5 cursor-pointer"
                    >
                      <option value="">-- Preset --</option>
                      {existingCategories.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="custom">Custom...</option>
                    </select>

                    <input
                      type="text"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      placeholder="Category name"
                      className={`h-11 px-3 bg-background border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary flex-1 ${
                        stepErrors.category ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                      }`}
                    />
                  </div>
                  {stepErrors.category && (
                    <p className="text-[11px] text-destructive mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {stepErrors.category}
                    </p>
                  )}
                </div>
              </div>

              {/* Country of Origin (MANDATORY) */}
              <div className="p-4 bg-secondary/20 rounded-xl border border-border/80 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-500" />
                    Country of Origin <span className="text-destructive font-black">* STRICTLY REQUIRED</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Manufacturing country is prominently displayed to customers
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={PRESET_COUNTRIES.includes(countryOfOrigin) ? countryOfOrigin : 'custom'}
                    onChange={e => {
                      if (e.target.value !== 'custom') {
                        setCountryOfOrigin(e.target.value);
                      }
                    }}
                    className="h-11 px-3.5 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary sm:w-48 cursor-pointer"
                  >
                    <option value="">-- Select Country --</option>
                    {PRESET_COUNTRIES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="custom">Other Country...</option>
                  </select>

                  <input
                    type="text"
                    value={countryOfOrigin}
                    onChange={e => setCountryOfOrigin(e.target.value)}
                    placeholder="e.g. USA, Germany, United Kingdom, Canada, Australia"
                    className={`h-11 px-4 bg-background border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary flex-1 ${
                      stepErrors.countryOfOrigin ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                    }`}
                  />
                </div>

                {/* Country Quick Select Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-muted-foreground font-semibold mr-1">Quick Select:</span>
                  {PRESET_COUNTRIES.map(country => (
                    <button
                      key={country}
                      type="button"
                      onClick={() => setCountryOfOrigin(country)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        countryOfOrigin === country
                          ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-xs'
                          : 'bg-background hover:bg-secondary text-muted-foreground hover:text-foreground border-border'
                      }`}
                    >
                      {country}
                    </button>
                  ))}
                </div>

                {stepErrors.countryOfOrigin && (
                  <p className="text-[11px] text-destructive mt-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {stepErrors.countryOfOrigin}
                  </p>
                )}
              </div>

              {/* Product Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                  Product Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Comprehensive description of the supplement product, nutritional highlights, key ingredients, usage instructions..."
                  className={`w-full p-3.5 bg-background border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none ${
                    stepErrors.description ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                  }`}
                />
                {stepErrors.description && (
                  <p className="text-[11px] text-destructive mt-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {stepErrors.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: PRODUCT WEIGHTS & PRICING */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Critical Business Rule Banner */}
              <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/30 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs text-foreground space-y-1">
                  <p className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    CRITICAL BUSINESS RULE: Price Depends On Product and Weight Only
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Flavor must NEVER change the price. For each weight, enter one selling price. All flavors of the same product and weight automatically use this same price.
                  </p>
                </div>
              </div>

              {/* SPECIAL PROMOTIONAL OFFER BOX */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-500/10 via-amber-500/10 to-primary/10 border-2 border-rose-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center font-black text-sm shadow-md">
                      <Flame className="w-5 h-5 fill-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                        Special Promotional Offer
                        {hasOffer && (
                          offerEndDate && new Date(offerEndDate).getTime() < Date.now() ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-destructive text-destructive-foreground uppercase tracking-wider">
                              Deal Expired
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white uppercase tracking-wider animate-pulse flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              Active Deal
                            </span>
                          )
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Promotes this product on the exclusive Offers page with custom discounts, duration, and bonus gifts
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasOffer}
                      onChange={e => {
                        const checked = e.target.checked;
                        setHasOffer(checked);
                        if (checked && !offerEndDate) {
                          // Default to 7 days duration on enable
                          const d = new Date();
                          d.setDate(d.getDate() + 7);
                          const pad = (n: number) => String(n).padStart(2, '0');
                          setOfferEndDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>

                {hasOffer && (
                  <div className="space-y-4 pt-4 border-t border-rose-500/20 animate-in fade-in duration-200">
                    {/* OFFER SCOPE SELECTOR: ALL WEIGHTS VS PER-WEIGHT */}
                    <div className="p-3.5 rounded-xl bg-background/60 border border-border space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-primary" />
                          Offer Application Scope (By Weight)
                        </label>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {offerScope === 'all'
                            ? 'Same offer applies to all weight options'
                            : 'Customized offers and discounts per weight option'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 max-w-md">
                        <button
                          type="button"
                          onClick={() => setOfferScope('all')}
                          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                            offerScope === 'all'
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'bg-background hover:bg-secondary border-border text-foreground'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          Apply to All Weights
                        </button>
                        <button
                          type="button"
                          onClick={() => setOfferScope('weights')}
                          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                            offerScope === 'weights'
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'bg-background hover:bg-secondary border-border text-foreground'
                          }`}
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          Customize Per Weight
                        </button>
                      </div>
                    </div>

                    {offerScope === 'weights' ? (
                      /* PER-WEIGHT CUSTOMIZATION CARDS */
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            Individual Offer Settings per Weight:
                          </p>
                          <span className="text-[10px] text-muted-foreground">
                            Enable offer on specific weights & set unique discounts or free gifts
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {weightConfigs.map((wc, idx) => {
                            const isWeightActive = wc.hasOffer ?? true;
                            const discType = wc.offerDiscountType || 'percentage';
                            return (
                              <div
                                key={idx}
                                className={`p-3.5 rounded-xl border transition-all ${
                                  isWeightActive
                                    ? 'bg-background/90 border-rose-500/40 shadow-xs'
                                    : 'bg-secondary/30 border-border opacity-70'
                                }`}
                              >
                                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="px-2.5 py-1 rounded-lg bg-secondary text-foreground text-xs font-black border border-border">
                                      {wc.weight}
                                    </span>
                                    <span className="text-xs font-bold text-foreground">
                                      Selling Price: Rs. {Number(wc.price || 0).toLocaleString()}
                                    </span>
                                    {isWeightActive ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">
                                        Offer Active
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                                        Regular Price (No Offer)
                                      </span>
                                    )}
                                  </div>

                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isWeightActive}
                                      onChange={e => handleUpdateWeightOffer(idx, { hasOffer: e.target.checked })}
                                      className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                                  </label>
                                </div>

                                {isWeightActive && (
                                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2.5">
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase text-foreground mb-1">
                                        Discount Type
                                      </label>
                                      <select
                                        value={discType}
                                        onChange={e => handleUpdateWeightOffer(idx, { offerDiscountType: e.target.value as any })}
                                        className="w-full h-8 px-2 bg-background border border-border rounded-lg text-xs font-semibold text-foreground focus:ring-1 focus:ring-rose-500"
                                      >
                                        <option value="percentage">% Percentage Off</option>
                                        <option value="fixed">Fixed Rs. Deduct</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold uppercase text-foreground mb-1">
                                        {discType === 'percentage' ? 'Discount %' : 'Deduct Amount (Rs.)'}
                                      </label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={discType === 'percentage' ? (wc.offerDiscount || '') : (wc.offerDiscountAmount || '')}
                                        onChange={e => {
                                          const val = e.target.value;
                                          if (discType === 'percentage') {
                                            handleUpdateWeightOffer(idx, {
                                              offerDiscount: val,
                                              offerBadge: val ? `${val}% OFF` : wc.offerBadge,
                                            });
                                          } else {
                                            handleUpdateWeightOffer(idx, {
                                              offerDiscountAmount: val,
                                              offerBadge: val ? `SAVE Rs. ${Number(val).toLocaleString()}` : wc.offerBadge,
                                            });
                                          }
                                        }}
                                        placeholder={discType === 'percentage' ? 'e.g. 20' : 'e.g. 1500'}
                                        className="w-full h-8 px-2 bg-background border border-border rounded-lg text-xs font-semibold text-foreground focus:ring-1 focus:ring-rose-500"
                                      />
                                    </div>

                                    <div>
                                      <div className="flex items-center justify-between mb-1">
                                        <label className="text-[10px] font-bold uppercase text-foreground">
                                          Original Ref (Rs.)
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const cur = Number(wc.price || 0);
                                            handleUpdateWeightOffer(idx, { originalPrice: String(cur) });
                                          }}
                                          className="text-[9px] font-bold text-primary hover:underline"
                                        >
                                          Auto-Calc
                                        </button>
                                      </div>
                                      <input
                                        type="number"
                                        min="1"
                                        value={wc.originalPrice || ''}
                                        onChange={e => handleUpdateWeightOffer(idx, { originalPrice: e.target.value })}
                                        placeholder="e.g. 9500"
                                        className="w-full h-8 px-2 bg-background border border-border rounded-lg text-xs font-semibold text-foreground focus:ring-1 focus:ring-rose-500"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold uppercase text-foreground mb-1">
                                        Bonus Gift for {wc.weight}
                                      </label>
                                      <input
                                        type="text"
                                        value={wc.offerFreeProduct || ''}
                                        onChange={e => handleUpdateWeightOffer(idx, { offerFreeProduct: e.target.value })}
                                        placeholder="e.g. Free Shaker Bottle"
                                        className="w-full h-8 px-2 bg-background border border-border rounded-lg text-xs font-semibold text-foreground focus:ring-1 focus:ring-emerald-500"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* GLOBAL INPUTS FOR ALL WEIGHTS */
                      <>
                        {/* 1. DISCOUNT TYPE SELECTOR */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-foreground">
                            Offer Discount Type
                          </label>
                          <div className="grid grid-cols-2 gap-2 max-w-md">
                            <button
                              type="button"
                              onClick={() => {
                                setOfferDiscountType('percentage');
                                if (offerDiscount && Number(offerDiscount) > 0) {
                                  setOfferBadge(`${offerDiscount}% OFF`);
                                }
                              }}
                              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                                offerDiscountType === 'percentage'
                                  ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                                  : 'bg-background hover:bg-secondary border-border text-foreground'
                              }`}
                            >
                              <Percent className="w-3.5 h-3.5" />
                              Percentage (%) Off
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOfferDiscountType('fixed');
                                if (offerDiscountAmount && Number(offerDiscountAmount) > 0) {
                                  setOfferBadge(`SAVE Rs. ${Number(offerDiscountAmount).toLocaleString()}`);
                                }
                              }}
                              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                                offerDiscountType === 'fixed'
                                  ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                                  : 'bg-background hover:bg-secondary border-border text-foreground'
                              }`}
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              Fixed Cash Deduct (Rs.)
                            </button>
                          </div>
                        </div>

                        {/* 2. VALUE & BADGE INPUTS */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {offerDiscountType === 'percentage' ? (
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-foreground mb-1">
                                Discount %
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="99"
                                value={offerDiscount}
                                onChange={e => {
                                  const val = e.target.value;
                                  setOfferDiscount(val);
                                  if (val && Number(val) > 0) {
                                    setOfferBadge(`${val}% OFF`);
                                  }
                                }}
                                placeholder="e.g. 20"
                                className="w-full h-10 px-3 bg-background border border-border rounded-xl text-xs font-semibold text-foreground focus:ring-2 focus:ring-rose-500"
                              />
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {['10', '15', '20', '25', '30', '50'].map(pct => (
                                  <button
                                    key={pct}
                                    type="button"
                                    onClick={() => {
                                      setOfferDiscount(pct);
                                      setOfferBadge(`${pct}% OFF`);
                                    }}
                                    className="px-1.5 py-0.5 rounded bg-secondary hover:bg-rose-500/20 text-[10px] font-bold text-foreground border border-border/50"
                                  >
                                    {pct}%
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-foreground mb-1">
                                Deduct Amount (Rs.)
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={offerDiscountAmount}
                                onChange={e => {
                                  const val = e.target.value;
                                  setOfferDiscountAmount(val);
                                  if (val && Number(val) > 0) {
                                    setOfferBadge(`SAVE Rs. ${Number(val).toLocaleString()}`);
                                  }
                                }}
                                placeholder="e.g. 1500"
                                className="w-full h-10 px-3 bg-background border border-border rounded-xl text-xs font-semibold text-foreground focus:ring-2 focus:ring-rose-500"
                              />
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {['500', '1000', '1500', '2000', '3000'].map(amt => (
                                  <button
                                    key={amt}
                                    type="button"
                                    onClick={() => {
                                      setOfferDiscountAmount(amt);
                                      setOfferBadge(`SAVE Rs. ${Number(amt).toLocaleString()}`);
                                    }}
                                    className="px-1.5 py-0.5 rounded bg-secondary hover:bg-rose-500/20 text-[10px] font-bold text-foreground border border-border/50"
                                  >
                                    Rs.{amt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-foreground mb-1">
                              Offer Badge Label
                            </label>
                            <input
                              type="text"
                              value={offerBadge}
                              onChange={e => setOfferBadge(e.target.value)}
                              placeholder="e.g. 25% OFF or FLASH SALE"
                              className="w-full h-10 px-3 bg-background border border-border rounded-xl text-xs font-semibold text-foreground focus:ring-2 focus:ring-rose-500"
                            />
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {['SPECIAL DEAL', 'FLASH SALE', 'MEGA DISCOUNT', 'HOT DEAL'].map(b => (
                                <button
                                  key={b}
                                  type="button"
                                  onClick={() => setOfferBadge(b)}
                                  className="px-1.5 py-0.5 rounded bg-secondary hover:bg-rose-500/20 text-[10px] font-bold text-foreground border border-border/50"
                                >
                                  {b}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-foreground">
                                Original Reference Price (Rs.)
                              </label>
                              {weightConfigs[0]?.price && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = Number(weightConfigs[0]?.price || 0);
                                    setOriginalPrice(String(current));
                                  }}
                                  className="text-[10px] font-bold text-primary hover:underline"
                                >
                                  Auto-Calc
                                </button>
                              )}
                            </div>
                            <input
                              type="number"
                              min="1"
                              value={originalPrice}
                              onChange={e => setOriginalPrice(e.target.value)}
                              placeholder="e.g. 9500 (before discount)"
                              className="w-full h-10 px-3 bg-background border border-border rounded-xl text-xs font-semibold text-foreground focus:ring-2 focus:ring-rose-500"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Shown crossed-out next to offer price
                            </p>
                            {weightConfigs[0]?.price && (
                              <div className="mt-2.5 p-2.5 rounded-lg bg-secondary/80 border border-border/70 text-xs">
                                {(() => {
                                  const reg = Number(weightConfigs[0].price);
                                  const p = calculateOfferPricing(reg, {
                                    hasOffer: true,
                                    offerDiscount: offerDiscount ? Number(offerDiscount) : undefined,
                                    offerDiscountType,
                                    offerDiscountAmount: offerDiscountAmount ? Number(offerDiscountAmount) : undefined,
                                    offerBadge,
                                  });
                                  return (
                                    <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                                      <span className="text-muted-foreground">Regular: <strong className="text-foreground">{formatCurrency(p.regularPrice)}</strong></span>
                                      <span className="text-muted-foreground">Offer Deal: <strong className="text-emerald-500">{formatCurrency(p.offerPrice)}</strong></span>
                                      <span className="text-rose-500 font-bold">Save {formatCurrency(p.savings)} ({p.discountPercentage}% OFF)</span>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* 3. OFFER DURATION & EXPIRATION CONTROLS */}
                    <div className="p-3.5 rounded-xl bg-background/60 border border-border space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          Offer Time Duration & Expiration
                        </label>
                        {offerEndDate && (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            new Date(offerEndDate).getTime() < Date.now()
                              ? 'bg-destructive/15 text-destructive border border-destructive/30'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {new Date(offerEndDate).getTime() < Date.now()
                              ? 'Expired'
                              : `Ends ${new Date(offerEndDate).toLocaleDateString()} at ${new Date(offerEndDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                        <div className="sm:col-span-6">
                          <input
                            type="datetime-local"
                            value={offerEndDate}
                            onChange={e => setOfferEndDate(e.target.value)}
                            className="w-full h-9 px-3 bg-background border border-border rounded-xl text-xs text-foreground focus:ring-2 focus:ring-rose-500"
                          />
                        </div>

                        <div className="sm:col-span-6 flex flex-wrap gap-1.5">
                          {[
                            { label: '24h Flash', hours: 24 },
                            { label: '3 Days', hours: 72 },
                            { label: '7 Days', hours: 168 },
                            { label: '14 Days', hours: 336 },
                            { label: '30 Days', hours: 720 },
                          ].map(item => (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() => {
                                const d = new Date();
                                d.setHours(d.getHours() + item.hours);
                                const pad = (n: number) => String(n).padStart(2, '0');
                                setOfferEndDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
                              }}
                              className="px-2 py-1 rounded-lg bg-secondary hover:bg-rose-500/20 text-[10px] font-bold text-foreground border border-border/60 transition-colors"
                            >
                              +{item.label}
                            </button>
                          ))}
                          {offerEndDate && (
                            <button
                              type="button"
                              onClick={() => setOfferEndDate('')}
                              className="px-2 py-1 rounded-lg bg-secondary hover:bg-destructive/20 text-[10px] font-bold text-muted-foreground hover:text-destructive border border-border/60 transition-colors"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 4. FREE COMPANION GIFT / BONUS PRODUCT */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                          <Gift className="w-3.5 h-3.5 text-emerald-500" />
                          Bonus Free Gift / Companion Product (Optional)
                        </label>
                        {offerFreeProduct && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                            Bonus Included
                          </span>
                        )}
                      </div>

                      <div>
                        <input
                          type="text"
                          value={offerFreeProduct}
                          onChange={e => setOfferFreeProduct(e.target.value)}
                          placeholder="e.g. Free 700ml BeastFuel Shaker Bottle or 100g Creatine Monohydrate"
                          className="w-full h-10 px-3 bg-background border border-border rounded-xl text-xs font-semibold text-foreground focus:ring-2 focus:ring-emerald-500"
                        />
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {[
                            'Free 700ml Gym Shaker Bottle',
                            'Free 100g Creatine Monohydrate',
                            'Free BEASTFUEL Lifting Straps',
                            'Free Pre-Workout Sachet Pack',
                            'Free Gym Hand Towel',
                          ].map(gift => (
                            <button
                              key={gift}
                              type="button"
                              onClick={() => setOfferFreeProduct(gift)}
                              className="px-2 py-0.5 rounded-md bg-secondary hover:bg-emerald-500/20 text-[10px] font-bold text-foreground border border-border/60 transition-colors flex items-center gap-1"
                            >
                              <Plus className="w-2.5 h-2.5 text-emerald-500" />
                              {gift}
                            </button>
                          ))}
                          {offerFreeProduct && (
                            <button
                              type="button"
                              onClick={() => setOfferFreeProduct('')}
                              className="px-2 py-0.5 rounded-md bg-secondary hover:bg-destructive/20 text-[10px] font-bold text-muted-foreground hover:text-destructive border border-border/60 transition-colors"
                            >
                              Remove Gift
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Add New Weight Box */}
              <div className="p-4 bg-secondary/30 rounded-xl border border-border/70 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                  + Add Weight Option & Selling Price
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      value={newWeightInput}
                      onChange={e => setNewWeightInput(e.target.value)}
                      placeholder="Weight label (e.g. 500g, 1kg, 2kg)"
                      className="w-full h-10 px-3 bg-background border border-border rounded-xl text-xs text-foreground focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                        Rs.
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={newWeightPriceInput}
                        onChange={e => setNewWeightPriceInput(e.target.value)}
                        placeholder="Price for this weight"
                        className="w-full h-10 pl-10 pr-3 bg-background border border-border rounded-xl text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Button
                      type="button"
                      onClick={handleAddWeight}
                      className="w-full h-10 text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Weight
                    </Button>
                  </div>
                </div>

                {/* Preset Weight Quick Add Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground font-semibold mr-1">Quick Weight Presets:</span>
                  {PRESET_WEIGHTS.map(pw => {
                    const alreadyAdded = weightConfigs.some(wc => wc.weight.toLowerCase() === pw.toLowerCase());
                    return (
                      <button
                        key={pw}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => {
                          setNewWeightInput(pw);
                          setNewWeightPriceInput('5000');
                        }}
                        className="text-[10px] px-2 py-1 bg-background hover:bg-secondary rounded-lg border border-border disabled:opacity-40 font-medium transition-colors"
                      >
                        + {pw}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Configured Weights & Prices Table */}
              <div className="border border-border rounded-xl overflow-hidden bg-background">
                <div className="bg-secondary/70 px-4 py-3 text-xs font-bold text-foreground grid grid-cols-12 gap-3 border-b border-border">
                  <span className="col-span-5">Weight Option</span>
                  <span className="col-span-5">Selling Price (Rs.)</span>
                  <span className="col-span-2 text-right">Actions</span>
                </div>

                <div className="divide-y divide-border/60">
                  {weightConfigs.map((wc, index) => {
                    const hasWeightErr = stepErrors[`weight_${index}`];
                    const hasPriceErr = stepErrors[`price_${index}`];

                    return (
                      <div key={index} className="px-4 py-3 grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-5">
                          <span className="font-bold text-sm text-foreground px-3 py-1 bg-secondary rounded-lg border border-border/70 inline-block">
                            {wc.weight}
                          </span>
                          {hasWeightErr && (
                            <p className="text-[10px] text-destructive mt-1 font-medium">{hasWeightErr}</p>
                          )}
                        </div>

                        <div className="col-span-5">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                              Rs.
                            </span>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={wc.price}
                              onChange={e => handleUpdateWeightPrice(index, e.target.value)}
                              className={`w-full h-9 pl-10 pr-3 bg-secondary/50 border rounded-lg text-xs font-bold text-foreground focus:ring-1 focus:ring-primary ${
                                hasPriceErr ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                              }`}
                            />
                          </div>
                          {hasPriceErr && (
                            <p className="text-[10px] text-destructive mt-1 font-medium">{hasPriceErr}</p>
                          )}
                        </div>

                        <div className="col-span-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveWeight(wc.weight)}
                            disabled={weightConfigs.length <= 1}
                            className="text-muted-foreground hover:text-destructive h-8 px-2"
                            title="Delete this weight"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {stepErrors.weights && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {stepErrors.weights}
                </p>
              )}
            </div>
          )}

          {/* STEP 3: FLAVORS & INVENTORY MATRIX */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 flex items-start gap-3">
                <Layers className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <strong className="text-foreground font-semibold">Step 3: Flavors & Inventory Matrix</strong>
                  <p>
                    Stock = Product + Weight + Flavor. Add flavors, then enter the stock quantity for each combination in the inventory matrix below.
                  </p>
                </div>
              </div>

              {/* Flavor Selector & Badges */}
              <div className="p-4 bg-secondary/20 rounded-xl border border-border/70 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Available Flavors ({flavors.length}) <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">Add all flavors supported for this product</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFlavorInput}
                    onChange={e => setNewFlavorInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFlavor(newFlavorInput);
                      }
                    }}
                    placeholder="Enter flavor name (e.g. Chocolate, Vanilla, Strawberry)..."
                    className="h-10 px-3 bg-background border border-border rounded-xl text-xs text-foreground focus:ring-2 focus:ring-primary flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddFlavor(newFlavorInput)}
                    className="h-10 text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Flavor
                  </Button>
                </div>

                {/* Flavor Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {flavors.map(fl => (
                    <span
                      key={fl}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                    >
                      {fl}
                      <button
                        type="button"
                        onClick={() => handleRemoveFlavor(fl)}
                        className="hover:text-destructive transition-colors ml-0.5"
                        title={`Remove ${fl}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Flavor Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground font-semibold mr-1">Quick Presets:</span>
                  {PRESET_FLAVORS.map(pf => {
                    const exists = flavors.some(f => f.toLowerCase() === pf.toLowerCase());
                    return (
                      <button
                        key={pf}
                        type="button"
                        disabled={exists}
                        onClick={() => handleAddFlavor(pf)}
                        className="text-[10px] px-2 py-0.5 bg-background hover:bg-secondary rounded border border-border disabled:opacity-40 font-medium transition-colors"
                      >
                        + {pf}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Admin Customizable Low Stock Threshold */}
              <div className="p-4 bg-secondary/30 rounded-xl border border-border/70 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Low Stock Alert Threshold (Customizable)
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Variants or products at or below this stock value trigger low stock alert messages. (Default: 5 units)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={lowStockThreshold}
                      onFocus={e => { if (e.target.value === '0') e.target.select(); }}
                      onChange={e => {
                        const stripped = e.target.value.replace(/^0+(?=\d)/, '');
                        const val = stripped === '' ? 0 : parseInt(stripped, 10);
                        setLowStockThreshold(isNaN(val) || val < 0 ? 0 : val);
                      }}
                      className="w-20 h-9 px-3 text-center bg-background border border-border rounded-lg text-xs font-bold text-foreground focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">units</span>
                  </div>
                </div>
              </div>

              {/* Low Stock Alert Message Banner */}
              {compiledVariants.some(v => v.stock <= lowStockThreshold) && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-amber-600 dark:text-amber-400 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <strong className="font-bold">Low Stock Alert:</strong>{' '}
                    {compiledVariants.filter(v => v.stock === 0).length > 0 && (
                      <span>{compiledVariants.filter(v => v.stock === 0).length} variant(s) are completely out of stock (0 units). </span>
                    )}
                    {compiledVariants.filter(v => v.stock > 0 && v.stock <= lowStockThreshold).length > 0 && (
                      <span>{compiledVariants.filter(v => v.stock > 0 && v.stock <= lowStockThreshold).length} variant(s) are at or below low stock threshold (≤ {lowStockThreshold} units). </span>
                    )}
                    <span>Admin alert message will be shown to customers and managers.</span>
                  </div>
                </div>
              )}

              {/* Weight x Flavor Inventory Matrix */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                      <span>Weight & Flavor Inventory Matrix</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                        {compiledVariants.length} Active Variant{compiledVariants.length !== 1 ? 's' : ''}
                      </span>
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Toggle which flavors are produced for each weight. Set stock to <strong>0</strong> to mark as <strong>Sold Out</strong>.
                    </p>
                  </div>

                  {/* Bulk Stock Actions */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-muted-foreground mr-1">Quick Fill Active:</span>
                    <button
                      type="button"
                      onClick={() => handleBulkSetStock(0)}
                      className="text-[10px] px-2 py-1 bg-secondary hover:bg-secondary/80 rounded border font-semibold text-rose-600 dark:text-rose-400"
                      title="Set all active variants to 0 (Sold Out)"
                    >
                      All 0 (Sold Out)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSetStock(5)}
                      className="text-[10px] px-2 py-1 bg-secondary hover:bg-secondary/80 rounded border font-semibold"
                    >
                      All 5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSetStock(10)}
                      className="text-[10px] px-2 py-1 bg-secondary hover:bg-secondary/80 rounded border font-semibold"
                    >
                      All 10
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSetStock(25)}
                      className="text-[10px] px-2 py-1 bg-secondary hover:bg-secondary/80 rounded border font-semibold"
                    >
                      All 25
                    </button>
                  </div>
                </div>

                {/* Helpful Business Logic Tip */}
                <div className="p-3 bg-secondary/40 border border-border/80 rounded-xl text-[11px] text-muted-foreground flex items-start gap-2">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <strong className="text-foreground">Flavor-to-Weight Mapping & Sold-Out Rules:</strong>
                    <p>
                      • <strong>Not Produced:</strong> Click <span className="text-foreground font-semibold">Disable</span> if a flavor is not manufactured in that weight (e.g. 2kg has Chocolate & Vanilla, but never Strawberry). Customers will not see unproduced options for that weight.
                    </p>
                    <p>
                      • <strong>Sold Out:</strong> Leave as <span className="text-emerald-500 font-semibold">Produced</span> and enter <span className="text-rose-500 font-semibold">0</span> units (e.g. 2kg Chocolate is produced but sold out). Customers will see a <span className="text-rose-500 font-semibold">Sold Out</span> badge and cannot buy it.
                    </p>
                  </div>
                </div>

                {/* Matrix Table */}
                <div className="border border-border rounded-xl overflow-hidden bg-background">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-secondary/70 border-b border-border text-foreground font-bold">
                          <th className="p-3 text-left min-w-[170px]">Weight Option</th>
                          <th className="p-3 text-left min-w-[130px]">Price (Rs.)</th>
                          {flavors.map(fl => (
                            <th key={fl} className="p-3 text-center min-w-[175px]">
                              {fl}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {weightConfigs.map(wc => (
                          <tr key={wc.weight} className="hover:bg-secondary/10 transition-colors">
                            {/* Weight info & row toggles */}
                            <td className="p-3 align-top">
                              <div className="space-y-1.5">
                                <span className="inline-block px-2.5 py-1 bg-secondary rounded-lg border border-border/80 font-bold text-foreground">
                                  {wc.weight}
                                </span>
                                <div className="flex items-center gap-1.5 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSetRowProduced(wc.weight, true)}
                                    className="text-[9px] px-1.5 py-0.5 bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary rounded border border-border/60 font-semibold transition-colors"
                                    title={`Enable all flavors for ${wc.weight}`}
                                  >
                                    All On
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSetRowProduced(wc.weight, false)}
                                    className="text-[9px] px-1.5 py-0.5 bg-secondary hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded border border-border/60 font-semibold transition-colors"
                                    title={`Disable all flavors for ${wc.weight}`}
                                  >
                                    All Off
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Fixed price for weight */}
                            <td className="p-3 align-top font-semibold text-primary">
                              <div className="pt-1">
                                {formatCurrency(parseFloat(wc.price) || 0)}
                              </div>
                            </td>

                            {/* Per Flavor cells */}
                            {flavors.map(fl => {
                              const key = `${wc.weight}:::${fl}`;
                              const isProduced = producedMatrix[key] !== false;
                              const currentVal = stockMatrix[key] !== undefined ? stockMatrix[key] : 0;
                              const isOut = currentVal === 0;
                              const isLow = currentVal > 0 && currentVal <= lowStockThreshold;

                              return (
                                <td key={fl} className="p-2.5 text-center align-top">
                                  {!isProduced ? (
                                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-secondary/15 border border-dashed border-border/70 text-center min-h-[82px] transition-all">
                                      <span className="text-[10px] text-muted-foreground/70 italic font-medium mb-1.5">
                                        Not Produced
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleProduced(wc.weight, fl)}
                                        className="text-[9px] px-2 py-0.5 rounded-md bg-background hover:bg-primary hover:text-primary-foreground border border-border font-bold transition-all shadow-xs flex items-center gap-1"
                                      >
                                        <Plus className="w-2.5 h-2.5" /> Enable
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-card border border-border/90 shadow-2xs transition-all">
                                      {/* Cell Header: Produced pill + Disable button */}
                                      <div className="w-full flex items-center justify-between gap-1 pb-1 border-b border-border/40 text-[9px]">
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                          <Check className="w-2.5 h-2.5" /> Produced
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleToggleProduced(wc.weight, fl)}
                                          className="text-muted-foreground hover:text-destructive transition-colors px-1 py-0.5 rounded hover:bg-destructive/10"
                                          title={`Disable ${fl} for ${wc.weight} (Not Produced)`}
                                        >
                                          Disable
                                        </button>
                                      </div>

                                      {/* Stock input + Quick Zero / Restock toggle */}
                                      <div className="flex items-center justify-center gap-1 w-full">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateStockCell(wc.weight, fl, Math.max(0, currentVal - 1).toString())}
                                          className="w-5 h-6 rounded bg-secondary hover:bg-secondary/80 text-foreground border border-border/80 text-[11px] font-bold flex items-center justify-center transition-colors shadow-2xs"
                                          title="Decrease 1"
                                        >
                                          -
                                        </button>
                                        <input
                                          type="number"
                                          min="0"
                                          step="1"
                                          value={currentVal}
                                          onFocus={e => {
                                            if (e.target.value === '0') {
                                              e.target.select();
                                            }
                                          }}
                                          onChange={e => handleUpdateStockCell(wc.weight, fl, e.target.value)}
                                          className={`w-14 h-6 text-center bg-background border rounded text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary ${
                                            isOut
                                              ? 'border-destructive/60 bg-destructive/5 text-destructive font-black'
                                              : isLow
                                              ? 'border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                              : 'border-border text-foreground'
                                          }`}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateStockCell(wc.weight, fl, (currentVal + 1).toString())}
                                          className="w-5 h-6 rounded bg-secondary hover:bg-secondary/80 text-foreground border border-border/80 text-[11px] font-bold flex items-center justify-center transition-colors shadow-2xs"
                                          title="Increase 1"
                                        >
                                          +
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateStockCell(wc.weight, fl, isOut ? '10' : '0')}
                                          className={`h-6 px-1.5 rounded text-[9px] font-bold border transition-all ${
                                            isOut
                                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                                          }`}
                                          title={isOut ? "Quick restock to 10 units" : "Mark Sold Out (0 stock)"}
                                        >
                                          {isOut ? '+10' : '0'}
                                        </button>
                                      </div>

                                      {/* Visual status badge */}
                                      <span
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                                          isOut
                                            ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
                                            : isLow
                                            ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
                                            : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                        }`}
                                      >
                                        {isOut ? 'Sold Out (0)' : isLow ? `⚠️ Low (${currentVal})` : `In Stock (${currentVal})`}
                                      </span>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Matrix Totals Summary */}
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border/60 text-xs">
                  <span className="text-muted-foreground">
                    Active Produced Variants: <strong className="text-foreground">{compiledVariants.length} combinations</strong>
                  </span>
                  <span className="text-muted-foreground">
                    Total Inventory: <strong className="text-primary font-bold">{totalCalculatedStock} units</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PRODUCT IMAGES */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 flex items-start gap-3">
                <ImageIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <strong className="text-foreground font-semibold">Step 4: Product Images</strong>
                  <p>
                    Add product images using <strong>local folder files</strong> from your computer or <strong>direct web image URLs</strong>. Both methods are supported for primary and gallery images.
                  </p>
                </div>
              </div>

              {/* Primary Image Upload Card */}
              <div className="p-5 bg-background rounded-2xl border-2 border-border/80 hover:border-primary/50 transition-colors space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      Primary Product Image <span className="text-destructive">* REQUIRED</span>
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Main showcase image displayed on cards, detail view, and cart
                    </p>
                  </div>
                  {primaryImage && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 w-fit">
                      <Check className="w-3 h-3" /> Image Configured
                    </span>
                  )}
                </div>

                {/* Source Selection Tabs */}
                <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                  <button
                    type="button"
                    onClick={() => setPrimaryImageSource('local')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      primaryImageSource === 'local'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Upload from Local Folder
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrimaryImageSource('url')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      primaryImageSource === 'url'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Enter Image URL
                  </button>
                </div>

                {/* Option 1: Local Folder Upload Area */}
                {primaryImageSource === 'local' && (
                  <div
                    onDragOver={e => {
                      e.preventDefault();
                      setIsDraggingPrimary(true);
                    }}
                    onDragLeave={() => setIsDraggingPrimary(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setIsDraggingPrimary(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handlePrimaryFileSelect(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      isDraggingPrimary
                        ? 'border-primary bg-primary/10 scale-[1.01]'
                        : 'border-border/80 hover:border-primary/60 bg-secondary/10 hover:bg-secondary/20'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2.5">
                      <FolderUp className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-foreground">
                      Choose an image from your local computer folder
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm">
                      Drag & drop an image here or click below to browse files (PNG, JPG, JPEG, WEBP up to 10MB)
                    </p>
                    <div className="mt-3.5 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        disabled={isUploading}
                        onClick={e => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="text-xs font-bold h-9 px-4 gap-2 shadow-sm"
                      >
                        {isUploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <HardDrive className="w-3.5 h-3.5" />
                        )}
                        Browse Local Files
                      </Button>
                      {primaryImage && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="text-xs h-9"
                        >
                          Change File
                        </Button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handlePrimaryFileSelect(file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Option 2: Image URL Input Area */}
                {primaryImageSource === 'url' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          value={primaryImage}
                          onChange={e => {
                            setPrimaryImage(e.target.value);
                            setImagePreview(e.target.value);
                            setPrimaryFileName(null);
                            setPrimaryFileSize(null);
                          }}
                          placeholder="https://images.unsplash.com/... or any online image URL"
                          className={`w-full h-11 pl-10 pr-4 bg-secondary/30 border rounded-xl text-xs text-foreground focus:ring-2 focus:ring-primary ${
                            stepErrors.image ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                          }`}
                        />
                      </div>
                      {primaryImage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPrimaryImage('');
                            setImagePreview(null);
                            setPrimaryFileName(null);
                            setPrimaryFileSize(null);
                          }}
                          className="h-11 text-xs text-muted-foreground hover:text-destructive"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Paste an image URL from Unsplash, manufacturer CDN, or any public image link.
                    </p>
                  </div>
                )}

                {uploadProgress && (
                  <p className="text-xs text-primary font-semibold flex items-center gap-1.5 animate-pulse bg-primary/10 p-2.5 rounded-lg border border-primary/20">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> {uploadProgress}
                  </p>
                )}

                {stepErrors.image && (
                  <p className="text-[11px] text-destructive font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {stepErrors.image}
                  </p>
                )}

                {/* Primary Image Preview Box */}
                {imagePreview && (
                  <div className="flex items-center gap-4 p-3 bg-secondary/30 rounded-xl border border-border w-full sm:w-fit">
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-border shrink-0 bg-background relative">
                      <img
                        src={formatImageUrl(imagePreview)}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                        onError={() => setImagePreview('/placeholder.svg')}
                      />
                    </div>
                    <div className="text-xs space-y-1 min-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground">Selected Primary Image</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20">
                          {primaryFileName ? '📁 Local Folder' : '🔗 Web URL'}
                        </span>
                      </div>
                      {primaryFileName ? (
                        <p className="text-foreground text-[11px] font-semibold truncate max-w-xs">
                          {primaryFileName} {primaryFileSize && <span className="text-muted-foreground">({primaryFileSize})</span>}
                        </p>
                      ) : (
                        <p className="text-muted-foreground text-[11px] truncate max-w-xs">{primaryImage}</p>
                      )}
                      <div className="pt-0.5 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (primaryImageSource === 'local') {
                              fileInputRef.current?.click();
                            } else {
                              setPrimaryImage('');
                              setImagePreview(null);
                            }
                          }}
                          className="text-[11px] text-primary hover:underline font-semibold"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPrimaryImage('');
                            setImagePreview(null);
                            setPrimaryFileName(null);
                            setPrimaryFileSize(null);
                          }}
                          className="text-[11px] text-destructive hover:underline font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Gallery Images */}
              <div className="p-5 bg-secondary/20 rounded-2xl border border-border/70 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-primary" />
                      Additional Gallery Images (Optional)
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Extra product shots, nutrition label, ingredient breakdown ({galleryImages.length} image{galleryImages.length === 1 ? '' : 's'})
                    </p>
                  </div>
                </div>

                {/* Gallery Source Tabs */}
                <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                  <button
                    type="button"
                    onClick={() => setGalleryImageSource('local')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      galleryImageSource === 'local'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Upload from Local Folder (Multiple)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGalleryImageSource('url')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      galleryImageSource === 'url'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Add by Web URL
                  </button>
                </div>

                {/* Gallery Local Folder Multi-upload Dropzone */}
                {galleryImageSource === 'local' && (
                  <div
                    onDragOver={e => {
                      e.preventDefault();
                      setIsDraggingGallery(true);
                    }}
                    onDragLeave={() => setIsDraggingGallery(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setIsDraggingGallery(false);
                      if (e.dataTransfer.files) handleGalleryFilesSelect(e.dataTransfer.files);
                    }}
                    onClick={() => galleryInputRef.current?.click()}
                    className={`p-5 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      isDraggingGallery
                        ? 'border-primary bg-primary/10 scale-[1.01]'
                        : 'border-border/80 hover:border-primary/60 bg-background/50 hover:bg-background/80'
                    }`}
                  >
                    <FolderUp className="w-7 h-7 text-primary mb-2" />
                    <p className="text-xs font-bold text-foreground">
                      Select or drop multiple gallery images from your local folder
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Supports selecting multiple images at once (PNG, JPG, JPEG, WEBP)
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploading}
                      onClick={e => {
                        e.stopPropagation();
                        galleryInputRef.current?.click();
                      }}
                      className="mt-3 text-xs font-bold h-8 gap-1.5"
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      Browse Local Folder Images
                    </Button>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                      onChange={e => {
                        if (e.target.files) handleGalleryFilesSelect(e.target.files);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Gallery URL Input */}
                {galleryImageSource === 'url' && (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={newGalleryUrl}
                        onChange={e => setNewGalleryUrl(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddGalleryUrl();
                          }
                        }}
                        placeholder="Enter additional web image URL..."
                        className="w-full h-10 pl-10 pr-3 bg-background border border-border rounded-xl text-xs text-foreground focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddGalleryUrl}
                      className="h-10 text-xs font-bold px-4"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add URL
                    </Button>
                  </div>
                )}

                {/* Gallery Images Grid */}
                {galleryImages.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] text-muted-foreground font-semibold">
                      Gallery Collection ({galleryImages.length}):
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {galleryImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative group w-20 h-20 rounded-xl overflow-hidden border border-border bg-background shadow-xs"
                        >
                          <img
                            src={formatImageUrl(img)}
                            alt={`Gallery ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={e => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(idx)}
                            className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                            title="Remove image"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 rounded font-bold">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & PUBLISH */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs text-foreground space-y-1">
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                    Ready to Publish / Save
                  </strong>
                  <p className="text-muted-foreground leading-relaxed">
                    Please review all product details, weight-based pricing, and flavor inventory matrix before submitting.
                  </p>
                </div>
              </div>

              {/* Product Overview Summary Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-secondary/30 rounded-xl border border-border space-y-3">
                  <div className="aspect-square rounded-lg overflow-hidden border border-border bg-background">
                    <img
                      src={primaryImage || '/placeholder.svg'}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-primary tracking-wider">{brand}</span>
                    <h3 className="font-bold text-sm text-foreground line-clamp-2">{name}</h3>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                      <span className="px-2 py-0.5 bg-secondary rounded border border-border font-medium">
                        {category}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded border border-blue-500/20 font-bold">
                        Origin: {countryOfOrigin}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  {/* Description Box */}
                  <div className="p-4 bg-secondary/20 rounded-xl border border-border space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Description</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {description}
                    </p>
                  </div>

                  {/* Weights & Prices Summary */}
                  <div className="p-4 bg-secondary/20 rounded-xl border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Configured Weights & Selling Prices
                      </h4>
                      <span className="text-[11px] text-muted-foreground">Price by Weight</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {weightConfigs.map(wc => (
                        <div key={wc.weight} className="p-2.5 bg-background rounded-lg border border-border/80">
                          <p className="text-[11px] text-muted-foreground font-semibold">{wc.weight}</p>
                          <p className="text-sm font-bold text-foreground">{formatCurrency(parseFloat(wc.price) || 0)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Flavors Summary */}
                  <div className="p-4 bg-secondary/20 rounded-xl border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Configured Flavors ({flavors.length})
                      </h4>
                      <span className="text-[11px] text-muted-foreground">Available options</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {flavors.map(fl => (
                        <span
                          key={fl}
                          className="px-2.5 py-0.5 bg-background rounded-md border border-border text-xs font-semibold text-foreground"
                        >
                          {fl}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Complete Variant Inventory Table & Low Stock Summary */}
              <div className="border border-border rounded-xl overflow-hidden bg-background space-y-2">
                <div className="bg-secondary/70 px-4 py-2.5 text-xs font-bold text-foreground flex items-center justify-between border-b border-border">
                  <span>Variant Inventory Breakdown ({compiledVariants.length} Combinations)</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">Alert Threshold: <strong className="text-amber-500">{lowStockThreshold} units</strong></span>
                    <span>Total Stock: <strong className="text-primary">{totalCalculatedStock} units</strong></span>
                  </div>
                </div>

                {/* Low Stock Alert in Review */}
                {compiledVariants.some(v => v.stock <= lowStockThreshold) && (
                  <div className="mx-3 mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Low Stock Alert Notice: This product contains variants at or below the threshold of {lowStockThreshold} units.</span>
                  </div>
                )}

                <div className="max-h-56 overflow-y-auto divide-y divide-border/50 text-xs">
                  {compiledVariants.map((v, i) => {
                    const isVLow = v.stock > 0 && v.stock <= lowStockThreshold;
                    return (
                      <div key={i} className="px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{v.weight}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="font-medium text-foreground">{v.flavor}</span>
                          <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border">
                            SKU: {v.sku}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-foreground">{formatCurrency(v.price)}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              v.stock === 0
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                : isVLow
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {v.stock === 0 ? 'Out of Stock' : isVLow ? `⚠️ Low Stock (${v.stock} units)` : `${v.stock} in stock`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER & ACTION CONTROLS ================= */}
        <div className="border-t border-border bg-card/95 backdrop-blur-sm px-6 py-4 flex items-center justify-between gap-3">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting || isSubmittingInternal}
                className="h-10 px-4 text-xs font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting || isSubmittingInternal}
              className="h-10 px-4 text-xs"
            >
              Cancel
            </Button>

            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="h-10 px-6 text-xs font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Next Step <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting || isSubmittingInternal || !primaryImage.trim()}
                className="h-11 px-8 text-xs font-black shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting || isSubmittingInternal ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving Product...
                  </>
                ) : (
                  <>
                    <PackageCheck className="w-4 h-4 mr-2" />
                    {product ? 'Update Supplement Product' : 'Publish Supplement Product'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Brand & Logo Manager Modal */}
      {isBrandModalOpen && (
        <AdminBrandsModal
          isOpen={isBrandModalOpen}
          onClose={() => setIsBrandModalOpen(false)}
          onSelectBrand={(newBrandName) => {
            setBrand(newBrandName);
            const matched = dbBrands.find(b => b.name.toLowerCase() === newBrandName.toLowerCase());
            if (matched?.countryOfOrigin) {
              setCountryOfOrigin(matched.countryOfOrigin);
            }
            setIsBrandModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default ProductModal;
