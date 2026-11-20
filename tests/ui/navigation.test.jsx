import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../../src/App';
import { StoreProvider } from '../../src/context/StoreContext';

/** This function is used for opening the store at a shareable route in isolation. */
function openStore(path) {
  window.history.replaceState(null, '', path);
  return render(
    <StoreProvider>
      <App />
    </StoreProvider>,
  );
}

describe('shareable collection and saved items', () => {
  it('opens a filtered collection directly and responds to browser history', () => {
    openStore('/shop?category=Hoodies');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hoodies');
    expect(screen.getByText('2 PRODUCTS')).toBeInTheDocument();
    act(() => {
      window.history.replaceState(null, '', '/shop?q=linen');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByText(/1 PRODUCTS FOR/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Linen Weekend Shirt' })).toBeInTheDocument();
  });

  it('shows saved products on their own page and removes them immediately', async () => {
    const user = userEvent.setup();
    openStore('/shop');
    await user.click(screen.getByRole('button', { name: 'Add Relaxed Oxford Shirt to wishlist' }));
    await user.click(screen.getByRole('button', { name: 'View wishlist' }));
    expect(window.location.pathname).toBe('/wishlist');
    expect(screen.getByText('1 PRODUCTS')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Remove Relaxed Oxford Shirt from wishlist' }),
    );
    expect(
      screen.getByRole('heading', { name: 'Your next favourite is out there.' }),
    ).toBeInTheDocument();
  });

  it('keeps keyboard focus inside product details and restores the opener', async () => {
    const user = userEvent.setup();
    openStore('/shop');
    const opener = screen.getByRole('button', { name: 'Relaxed Oxford Shirt' });
    await user.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'Relaxed Oxford Shirt details' });
    const close = within(dialog).getByRole('button', { name: 'Close product details' });
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(dialog.querySelectorAll('summary')[1]);
    await user.tab();
    expect(close).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(opener).toHaveFocus();
  });
});
