import { loadStripe } from "@stripe/stripe-js";

export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const lightAppearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#4f46e5',
    colorBackground: '#ffffff',
    colorText: '#111827',
    colorTextSecondary: '#4b5563',
    colorTextPlaceholder: '#6b7280',
    colorDanger: '#dc2626',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    borderRadius: '8px',
  },
  rules: {
    '.Input': {
      border: '1px solid #e5e7eb',
    },
    '.Label': {
      color: '#4b5563',
    },
  },
};

export const darkAppearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#818cf8',
    colorBackground: '#1a1e29',
    colorText: '#f9fafb',
    colorTextSecondary: '#d1d5db',
    colorTextPlaceholder: '#9ca3af',
    colorDanger: '#f87171',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    borderRadius: '8px',
  },
  rules: {
    '.Input': {
      border: '1px solid #2a2f3d',
      backgroundColor: '#1a1e29',
    },
    '.Label': {
      color: '#d1d5db',
    },
  },
};
