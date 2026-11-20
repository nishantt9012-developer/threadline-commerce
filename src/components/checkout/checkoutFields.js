// Field definitions for the shipping form. Limits come from the same file the API validator uses.
import { CUSTOMER_FIELD_LIMITS } from '../../config/storeRules';

export const checkoutFields = [
  { name: 'name', label: 'Full name', type: 'text', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  {
    name: 'phone',
    label: 'Mobile number',
    type: 'tel',
    autoComplete: 'tel',
    inputMode: 'numeric',
    pattern: '[6-9][0-9]{9}',
    title: 'Enter a 10-digit Indian mobile number',
  },
  {
    name: 'address',
    label: 'House / flat, street and area',
    type: 'text',
    autoComplete: 'street-address',
  },
  {
    name: 'landmark',
    label: 'Landmark (optional)',
    type: 'text',
    autoComplete: 'off',
    optional: true,
  },
  { name: 'city', label: 'City', type: 'text', autoComplete: 'address-level2' },
  { name: 'state', label: 'State', type: 'text', autoComplete: 'address-level1' },
  {
    name: 'pincode',
    label: 'PIN code',
    type: 'text',
    autoComplete: 'postal-code',
    inputMode: 'numeric',
    pattern: '[0-9]{6}',
    title: 'Enter a 6-digit PIN code',
  },
].map((field) => ({ ...field, maxLength: CUSTOMER_FIELD_LIMITS[field.name] }));

export const emptyCustomer = Object.fromEntries(checkoutFields.map((field) => [field.name, '']));
