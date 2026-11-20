import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { it, expect } from 'vitest';
import App from '../../src/App';
import { StoreProvider } from '../../src/context/StoreContext';
it('filters jeans by waist size and keeps the selected waist in the bag', async () => {
  window.history.replaceState(null, '', '/shop?category=Jeans');
  render(
    <StoreProvider>
      <App />
    </StoreProvider>,
  );
  const user = userEvent.setup();
  expect(screen.getByText('2 PRODUCTS')).toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText('AVAILABLE SIZE'), '32');
  await user.click(screen.getByRole('button', { name: 'Relaxed Straight Jeans' }));
  const dialog = screen.getByRole('dialog', { name: 'Relaxed Straight Jeans details' });
  await user.click(within(dialog).getByRole('button', { name: '32' }));
  await user.click(within(dialog).getByRole('button', { name: /ADD TO CART/ }));
  expect(
    within(screen.getByRole('dialog', { name: 'Shopping cart' })).getByText(/SIZE: 32/),
  ).toBeInTheDocument();
});
