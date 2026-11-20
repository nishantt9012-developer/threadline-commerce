import { ROUTE } from '../constants/index.js';
import { RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '../config/storeRules';
import { money } from '../utils/cart';

/** This function is used for explaining delivery, ordering and the available payment methods honestly. */
export default function Help({ navigate }) {
  return (
    <main className="container help-page">
      <div className="shop-heading">
        <p className="eyebrow">A LITTLE GUIDANCE</p>
        <h1>
          Here to help<span className="period">.</span>
        </h1>
        <p>Good to know before your next everyday favourite.</p>
      </div>
      <div className="help-grid">
        <section>
          <Truck />
          <h2>Delivery, made clear.</h2>
          <p>
            Delivery is available to Indian PIN codes. Shipping is {money(SHIPPING_FEE)}, with free
            shipping for orders of {money(FREE_SHIPPING_THRESHOLD)} or more.
          </p>
          <p>Your delivery cost is shown in the bag and confirmed at checkout.</p>
        </section>
        <section>
          <ShieldCheck />
          <h2>Order with clarity.</h2>
          <p>
            Choose a size, add your pieces to the bag and check your shipping details. Cash on
            delivery is available. Online payment availability is shown at checkout.
          </p>
          <p>Keep your order reference after confirmation for any follow-up.</p>
        </section>
        <section>
          <RotateCcw />
          <h2>Finding the right fit.</h2>
          <p>
            Available sizes are listed on each product. The store&apos;s final size measurements,
            return and exchange terms should be confirmed before purchase.
          </p>
        </section>
      </div>
      <div className="help-cta">
        <h2>Ready to find your next favourite?</h2>
        <button className="primary dark" onClick={() => navigate(ROUTE.SHOP)}>
          Explore the collection
        </button>
      </div>
    </main>
  );
}
