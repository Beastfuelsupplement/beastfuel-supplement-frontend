import { Product } from '@/store/cartStore';

export const brands = [
  'All',
  'Optimum Nutrition',
  'MuscleTech',
  'BEASTFUEL',
  'Dymatize',
  'Cellucor'
];

export const categories = [
  'All',
  'Whey Protein',
  'Pre-Workout',
  'Performance',
  'Recovery',
  'Weight Gain',
  'Health'
];

export const countriesOfOrigin = [
  'USA',
  'United Kingdom',
  'Germany',
  'Canada',
  'Australia',
  'Japan',
  'New Zealand'
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Gold Standard 100% Whey',
    brand: 'Optimum Nutrition',
    category: 'Whey Protein',
    countryOfOrigin: 'USA',
    price: 38.99,
    image: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=800&auto=format&fit=crop&q=80',
    description: "The world's best-selling whey protein powder delivers 24g of premium whey protein primarily from Whey Protein Isolate (WPI). Formulated for instant mixability, muscle building, and peak post-workout recovery.",
    weight: '1kg',
    weights: ['500g', '1kg', '2kg', '5kg'],
    flavor: 'Double Rich Chocolate',
    flavors: ['Double Rich Chocolate', 'Vanilla Ice Cream', 'Delicious Strawberry', 'Cookies & Cream', 'Unflavored'],
    variants: [
      { weight: '500g', price: 38.99, stock: 40, sku: 'ON-GSW-500G' },
      { weight: '1kg', price: 64.99, stock: 50, sku: 'ON-GSW-1KG' },
      { weight: '2kg', price: 109.99, stock: 35, sku: 'ON-GSW-2KG' },
      { weight: '5kg', price: 229.99, stock: 20, sku: 'ON-GSW-5KG' }
    ],
    stock: 145,
    featured: true
  },
  {
    id: '2',
    name: 'Nitro-Tech 100% Whey Gold',
    brand: 'MuscleTech',
    category: 'Whey Protein',
    countryOfOrigin: 'USA',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&auto=format&fit=crop&q=80',
    description: 'Engineered with micro-filtered whey protein isolate and whey concentrate for superior absorption, digestibility, and easy mixability. Supplies 24g of ultra-pure protein with 5.5g BCAAs.',
    weight: '1kg',
    weights: ['1kg', '2.2kg'],
    flavor: 'French Vanilla',
    flavors: ['Milk Chocolate', 'French Vanilla', 'Cookies & Cream', 'Strawberry'],
    variants: [
      { weight: '1kg', price: 59.99, stock: 50, sku: 'MT-NT-1KG' },
      { weight: '2.2kg', price: 99.99, stock: 35, sku: 'MT-NT-2KG' }
    ],
    stock: 85,
    featured: true
  },
  {
    id: '3',
    name: 'BEASTFUEL Whey Isolate 100%',
    brand: 'BEASTFUEL',
    category: 'Whey Protein',
    countryOfOrigin: 'USA',
    price: 64.99,
    image: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=800&auto=format&fit=crop&q=80',
    description: 'Ultra-pure cross-flow micro-filtered whey protein isolate engineered for rapid absorption, zero bloating, and maximum lean muscle mass growth. 27g protein and under 1g carbs per scoop.',
    weight: '1kg',
    weights: ['1kg', '2kg', '4kg'],
    flavor: 'Double Rich Chocolate',
    flavors: ['Double Rich Chocolate', 'Vanilla Cream', 'Strawberry Blast', 'Unflavored'],
    variants: [
      { weight: '1kg', price: 64.99, stock: 50, sku: 'BF-ISO-1KG' },
      { weight: '2kg', price: 114.99, stock: 40, sku: 'BF-ISO-2KG' },
      { weight: '4kg', price: 199.99, stock: 20, sku: 'BF-ISO-4KG' }
    ],
    stock: 110,
    featured: true
  },
  {
    id: '4',
    name: 'BEASTFUEL Pre-Workout Igniter',
    brand: 'BEASTFUEL',
    category: 'Pre-Workout',
    countryOfOrigin: 'USA',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    description: 'Explosive energy and laser focus matrix formulated with beta-alanine, citrulline malate, and natural caffeine to crush high-intensity training sessions without crashes.',
    weight: '300g',
    weights: ['300g', '600g'],
    flavor: 'Blue Raspberry',
    flavors: ['Blue Raspberry', 'Fruit Punch', 'Green Apple', 'Sour Watermelon'],
    variants: [
      { weight: '300g', price: 39.99, stock: 45, sku: 'BF-PRE-300G' },
      { weight: '600g', price: 69.99, stock: 30, sku: 'BF-PRE-600G' }
    ],
    stock: 75,
    featured: true
  },
  {
    id: '5',
    name: 'BEASTFUEL Micronized Creatine 5000',
    brand: 'BEASTFUEL',
    category: 'Performance',
    countryOfOrigin: 'Germany',
    price: 27.99,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
    description: '100% pure Creapure micronized creatine monohydrate manufactured in Germany. Enhances intracellular hydration, explosive power output, and rapid ATP energy replenishment.',
    weight: '500g',
    weights: ['300g', '500g', '1kg'],
    flavor: 'Unflavored',
    flavors: ['Unflavored', 'Blue Raspberry'],
    variants: [
      { weight: '300g', price: 19.99, stock: 60, sku: 'BF-CRE-300G' },
      { weight: '500g', price: 27.99, stock: 70, sku: 'BF-CRE-500G' },
      { weight: '1kg', price: 48.99, stock: 30, sku: 'BF-CRE-1KG' }
    ],
    stock: 160,
    featured: true
  },
  {
    id: '6',
    name: 'ISO100 Hydrolyzed Whey Isolate',
    brand: 'Dymatize',
    category: 'Whey Protein',
    countryOfOrigin: 'USA',
    price: 74.99,
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&auto=format&fit=crop&q=80',
    description: 'World-renowned hydrolyzed 100% Whey Protein Isolate engineered for elite athletes. Hydrolyzed for ultra-fast digestion and absorption with legendary taste and mixability.',
    weight: '1.4kg',
    weights: ['1.4kg', '2.3kg'],
    flavor: 'Gourmet Chocolate',
    flavors: ['Gourmet Chocolate', 'Fudge Brownie', 'Birthday Cake', 'Cookies & Cream'],
    variants: [
      { weight: '1.4kg', price: 74.99, stock: 35, sku: 'DYM-ISO-1.4KG' },
      { weight: '2.3kg', price: 119.99, stock: 25, sku: 'DYM-ISO-2.3KG' }
    ],
    stock: 60,
    featured: false
  },
  {
    id: '7',
    name: 'C4 Original Pre-Workout',
    brand: 'Cellucor',
    category: 'Pre-Workout',
    countryOfOrigin: 'USA',
    price: 32.99,
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    description: "America's #1 selling pre-workout powder powered by CarnoSyn Beta-Alanine, Creatine Nitrate, and velvety energy compounds to unlock legendary endurance.",
    weight: '390g',
    weights: ['195g', '390g'],
    flavor: 'Icy Blue Razz',
    flavors: ['Icy Blue Razz', 'Fruit Punch', 'Watermelon', 'Orange Burst'],
    variants: [
      { weight: '195g', price: 22.99, stock: 40, sku: 'C4-PRE-195G' },
      { weight: '390g', price: 32.99, stock: 40, sku: 'C4-PRE-390G' }
    ],
    stock: 80,
    featured: false
  },
  {
    id: '8',
    name: 'BEASTFUEL BCAA + Electrolytes Recovery',
    brand: 'BEASTFUEL',
    category: 'Recovery',
    countryOfOrigin: 'UK',
    price: 32.99,
    image: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=800&auto=format&fit=crop&q=80',
    description: 'Fermented instantized 2:1:1 BCAAs with key Himalayan pink salt electrolytes to accelerate post-workout protein synthesis and sustain intracellular hydration.',
    weight: '420g',
    weights: ['420g', '840g'],
    flavor: 'Watermelon Burst',
    flavors: ['Watermelon Burst', 'Lemon Lime', 'Peach Mango'],
    variants: [
      { weight: '420g', price: 32.99, stock: 50, sku: 'BF-BCAA-420G' },
      { weight: '840g', price: 54.99, stock: 40, sku: 'BF-BCAA-840G' }
    ],
    stock: 90,
    featured: false
  }
];