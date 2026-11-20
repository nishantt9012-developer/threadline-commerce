import { checkoutFields } from './checkoutFields';

export default function ShippingFields({ customer, onChange }) {
  return (
    <div className="checkout-fields">
      {checkoutFields.map((field) => (
        <label key={field.name}>
          {field.label}
          <input
            name={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            value={customer[field.name]}
            required={!field.optional}
            maxLength={field.maxLength}
            pattern={field.pattern}
            title={field.title}
            inputMode={field.inputMode}
            onChange={(event) => onChange(field.name, event.target.value)}
          />
        </label>
      ))}
    </div>
  );
}
