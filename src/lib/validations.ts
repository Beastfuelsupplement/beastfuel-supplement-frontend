import { z } from 'zod';

// Email validation
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters');

// Password validation with strong requirements
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Simple password for login (less strict)
export const loginPasswordSchema = z
  .string()
  .min(1, 'Password is required')
  .max(128, 'Password must be less than 128 characters');

// Name validation
export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens and apostrophes');

// Phone validation
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[\d\s\-+()]+$/, 'Please enter a valid phone number')
  .min(10, 'Phone number must be at least 10 digits')
  .max(20, 'Phone number must be less than 20 characters');

// Address validation
export const addressSchema = z
  .string()
  .trim()
  .min(5, 'Address must be at least 5 characters')
  .max(200, 'Address must be less than 200 characters');

// City validation
export const citySchema = z
  .string()
  .trim()
  .min(2, 'City must be at least 2 characters')
  .max(100, 'City must be less than 100 characters');

// State validation
export const stateSchema = z
  .string()
  .trim()
  .min(2, 'State must be at least 2 characters')
  .max(50, 'State must be less than 50 characters');

// ZIP code validation
export const zipSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{5}(-[0-9]{4})?$/, 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)');

// Credit card validation
export const cardNumberSchema = z
  .string()
  .trim()
  .regex(/^[\d\s-]+$/, 'Card number can only contain digits')
  .transform(val => val.replace(/[\s-]/g, ''))
  .refine(val => val.length >= 13 && val.length <= 19, 'Card number must be 13-19 digits')
  .refine(val => luhnCheck(val), 'Please enter a valid card number');

// Card expiry validation
export const cardExpirySchema = z
  .string()
  .trim()
  .regex(/^(0[1-9]|1[0-2])\s*\/\s*([0-9]{2})$/, 'Please enter a valid expiry date (MM/YY)')
  .refine(val => {
    const [month, year] = val.split('/').map(s => s.trim());
    const now = new Date();
    const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
    return expiry > now;
  }, 'Card has expired');

// CVC validation
export const cvcSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{3,4}$/, 'CVC must be 3 or 4 digits');

// Bank account validation
export const bankAccountSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{8,17}$/, 'Bank account must be 8-17 digits');

// Routing number validation
export const routingNumberSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{9}$/, 'Routing number must be 9 digits');

// Luhn algorithm for card validation
function luhnCheck(cardNumber: string): boolean {
  let sum = 0;
  let isEven = false;
  
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

// Login form schema
export const loginFormSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

// Registration form schema
export const registerFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Checkout form schema
export const checkoutFormSchema = z.object({
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  address: addressSchema,
  city: citySchema,
  state: stateSchema,
  zip: zipSchema,
  paymentMethod: z.enum(['card', 'paypal', 'bank_transfer', 'cash_on_delivery']),
  cardNumber: z.string().optional(),
  expiry: z.string().optional(),
  cvc: z.string().optional(),
}).refine(data => {
  if (data.paymentMethod === 'card') {
    return data.cardNumber && data.expiry && data.cvc;
  }
  return true;
}, {
  message: 'Card details are required for card payments',
  path: ['cardNumber'],
});

// Contact form schema
export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(150, 'Subject must be less than 150 characters'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000, 'Message must be less than 2000 characters'),
});

// Type exports
export type LoginFormData = z.infer<typeof loginFormSchema>;
export type RegisterFormData = z.infer<typeof registerFormSchema>;
export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
