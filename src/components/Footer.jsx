import { ROUTE, FILTER } from '../constants/index.js';
import Brand from './Brand';
import { FOOTER_LINKS } from '../constants/navigation';

/** This function is used for displaying useful collection links, customer care and the demo disclosure. */
export default function Footer({ navigate }) {
  return (
    <footer className="footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <Brand onClick={() => navigate(ROUTE.HOME)} />
          <p>
            Less noise. More you.
            <br />
            Everyday essentials, considered.
          </p>
          <span className="footer-caption">TOPS. DENIM. LAYERS. YOUR EVERYDAY.</span>
        </div>
        <div>
          <h4>THE COLLECTION</h4>
          {FOOTER_LINKS.map(([label, category]) => (
            <a
              href={`/shop${category === FILTER.ALL ? '' : `?category=${encodeURIComponent(category)}`}`}
              key={label}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                navigate(ROUTE.SHOP, category);
              }}
            >
              {label}
            </a>
          ))}
        </div>
        <div>
          <h4>YOUR THREADLINE</h4>
          <a
            href="/wishlist"
            onClick={(event) => {
              event.preventDefault();
              navigate(ROUTE.WISHLIST);
            }}
          >
            Saved for later
          </a>
          <a
            href="/help"
            onClick={(event) => {
              event.preventDefault();
              navigate(ROUTE.HELP);
            }}
          >
            Delivery & returns
          </a>
          <a
            href="/help"
            onClick={(event) => {
              event.preventDefault();
              navigate(ROUTE.HELP);
            }}
          >
            Payments & ordering
          </a>
          <a
            href="/help"
            onClick={(event) => {
              event.preventDefault();
              navigate(ROUTE.HELP);
            }}
          >
            Customer care
          </a>
        </div>
        <div className="footer-news">
          <h4>A CONSIDERED WARDROBE</h4>
          <p>
            Shirts for the plans.
            <br />
            Hoodies for the in-between.
            <br />
            Pieces that feel like you.
          </p>
          <p className="demo-disclosure">
            Demonstration storefront. Imagery and catalogue details are illustrative.
          </p>
        </div>
      </div>
      <div className="footer-wordmark container" aria-hidden="true">
        EVERYDAY, CONSIDERED.
      </div>
      <div className="footer-base container">
        <span>© {new Date().getFullYear()} THREADLINE. DEMO STORE.</span>
        <span>AN INDEPENDENT PERSPECTIVE.</span>
      </div>
    </footer>
  );
}
