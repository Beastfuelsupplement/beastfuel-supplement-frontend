import { Product } from '@/store/cartStore';

export const products: Product[] = [
  {
    id: '1',
    name: 'Whey Protein Isolate',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&auto=format&fit=crop&q=80',
    category: 'Protein',
    description: 'Premium whey protein isolate with 27g of protein per serving. Fast-absorbing formula for optimal muscle recovery and growth. Zero added sugars and low in fat.',
    weight: '2.2 lbs',
    flavor: 'Chocolate',
    stock: 25
  },
  {
    id: '2',
    name: 'Pre-Workout Surge',
    price: 44.99,
    image: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=800&auto=format&fit=crop&q=80',
    category: 'Pre-Workout',
    description: 'Explosive energy formula with caffeine, beta-alanine, and citrulline. Experience intense focus and endurance for your most demanding workouts.',
    weight: '300g',
    flavor: 'Blue Raspberry',
    stock: 18
  },
  {
    id: '3',
    name: 'Creatine Monohydrate',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=800&auto=format&fit=crop&q=80',
    category: 'Performance',
    description: 'Pure micronized creatine monohydrate for increased strength, power, and muscle volume. 5g per serving for optimal results.',
    weight: '500g',
    stock: 10
  },
  {
    id: '4',
    name: 'BCAA Recovery',
    price: 34.99,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80',
    category: 'Recovery',
    description: 'Essential branched-chain amino acids in optimal 2:1:1 ratio. Supports muscle recovery, reduces soreness, and prevents muscle breakdown.',
    weight: '400g',
    flavor: 'Watermelon',
    stock: 30
  },
  {
    id: '5',
    name: 'Mass Gainer Elite',
    price: 69.99,
    image: 'https://images.unsplash.com/photo-1612532275214-e4ca76d0e4d1?w=800&auto=format&fit=crop&q=80',
    category: 'Weight Gain',
    description: 'High-calorie formula with 1250 calories and 50g protein per serving. Complex carbs and healthy fats for lean muscle gains.',
    weight: '6 lbs',
    flavor: 'Vanilla',
    stock: 15
  },
  {
    id: '6',
    name: 'Omega-3 Fish Oil',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
    category: 'Health',
    description: 'Ultra-pure omega-3 fatty acids from wild-caught fish. Supports heart health, joint function, and cognitive performance.',
    weight: '120 softgels',
    stock: 50
  },
  {
    id: '7',
    name: 'Multivitamin Pro',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&auto=format&fit=crop&q=80',
    category: 'Health',
    description: 'Complete daily vitamin and mineral formula designed for athletes. Enhanced absorption with essential micronutrients.',
    weight: '90 tablets',
    stock: 40
  },
  {
    id: '8',
    name: 'Casein Protein',
    price: 54.99,
    image: 'https://images.unsplash.com/photo-1622485831122-e4f2b33f7a2a?w=800&auto=format&fit=crop&q=80',
    category: 'Protein',
    description: 'Slow-release micellar casein for overnight muscle recovery. 24g protein per serving with sustained amino acid release.',
    weight: '2 lbs',
    flavor: 'Cookies & Cream',
    stock: 20
  }
];

export const categories = ['All', 'Protein', 'Pre-Workout', 'Performance', 'Recovery', 'Weight Gain', 'Health'];