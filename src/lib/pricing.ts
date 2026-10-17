/**
 * BEASTFUEL Offer and Pricing Calculation Utilities
 *
 * Core Business Rules:
 * 1. Base regular price is retrieved directly from product / variant (never inflated).
 * 2. discountAmount = regularPrice * (discountPercentage / 100)
 * 3. offerPrice = regularPrice - discountAmount
 * 4. Never add discount amount to regular price.
 * 5. Offer discount is applied cleanly and consistently across:
 *    - Offers page
 *    - Product cards
 *    - Product details
 *    - Cart
 *    - Checkout
 */

import { formatCurrency } from './currency';

export interface OfferPricingResult {
  hasOffer: boolean;
  regularPrice: number;
  discountPercentage: number;
  discountAmount: number;
  offerPrice: number;
  savings: number;
  badge: string;
  isExpired: boolean;
}

export interface OfferDetailsInput {
  hasOffer?: boolean;
  offerDiscount?: number;
  offerDiscountType?: 'percentage' | 'fixed';
  offerDiscountAmount?: number;
  offerEndDate?: string | Date;
  offerBadge?: string;
}

export function calculateOfferPricing(
  rawRegularPrice: number,
  offer?: OfferDetailsInput | null
): OfferPricingResult {
  const regularPrice = Math.max(0, Number(rawRegularPrice) || 0);

  const isExpired = Boolean(
    offer?.offerEndDate && new Date(offer.offerEndDate).getTime() < Date.now()
  );

  const hasOffer = Boolean(
    offer &&
    (offer.hasOffer || (offer.offerDiscount !== undefined && Number(offer.offerDiscount) > 0) || (offer.offerDiscountAmount !== undefined && Number(offer.offerDiscountAmount) > 0)) &&
    !isExpired
  );

  if (!hasOffer) {
    return {
      hasOffer: false,
      regularPrice,
      discountPercentage: 0,
      discountAmount: 0,
      offerPrice: regularPrice,
      savings: 0,
      badge: '',
      isExpired,
    };
  }

  const discountType = offer?.offerDiscountType || 'percentage';
  let discountAmount = 0;
  let discountPercentage = 0;

  if (discountType === 'fixed') {
    const fixedAmount = Math.max(0, Number(offer?.offerDiscountAmount) || 0);
    discountAmount = Math.min(regularPrice, fixedAmount);
    discountPercentage = regularPrice > 0 ? Math.round((discountAmount / regularPrice) * 100) : 0;
  } else {
    // Percentage discount (0 to 100)
    discountPercentage = Math.max(0, Math.min(100, Number(offer?.offerDiscount) || 0));
    discountAmount = (regularPrice * discountPercentage) / 100;
  }

  // Ensure offerPrice is regularPrice - discountAmount, clamped to 0 minimum
  const offerPrice = Math.max(0, regularPrice - discountAmount);
  const savings = discountAmount;

  const defaultBadge =
    discountType === 'fixed'
      ? `SAVE ${formatCurrency(discountAmount)}`
      : `${discountPercentage}% OFF`;

  const badge = offer?.offerBadge?.trim() || defaultBadge;

  return {
    hasOffer: true,
    regularPrice,
    discountPercentage,
    discountAmount,
    offerPrice,
    savings,
    badge,
    isExpired,
  };
}
