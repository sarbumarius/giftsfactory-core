import type { RouteObject } from "react-router-dom";
import Index from "./pages/Index";
import ProductPageEntry from "./pages/ProductPageEntry";
import CartPageEntry from "./pages/CartPageEntry";
import CheckoutPageEntry from "./pages/CheckoutPageEntry";
import WishlistPageEntry from "./pages/WishlistPageEntry";
import AccountPage from "./pages/AccountPage";
import DiscountsPageEntry from "./pages/DiscountsPageEntry";
import FAQPageEntry from "./pages/FAQPageEntry";
import ContactPageEntry from "./pages/ContactPageEntry";
import ReviewsPageEntry from "./pages/ReviewsPageEntry";
import ThankYouPage from "./pages/ThankYouPage";
import CategoryLandingPage from "./pages/CategoryLandingPage";
import AboutPageEntry from "./pages/AboutPageEntry";
import CreateUniqueProductPageEntry from "./pages/CreateUniqueProductPageEntry";
import NotFound from "./pages/NotFound";

const routes: RouteObject[] = [
  { path: "/", element: <Index /> },
  { path: "/produs/:slug", element: <ProductPageEntry /> },
  { path: "/cos", element: <CartPageEntry /> },
  { path: "/plata-cos", element: <CheckoutPageEntry /> },
  { path: "/wishlist", element: <WishlistPageEntry /> },
  { path: "/cont", element: <AccountPage /> },
  { path: "/reduceri", element: <DiscountsPageEntry /> },
  { path: "/intrebari-frecvente", element: <FAQPageEntry /> },
  { path: "/contact", element: <ContactPageEntry /> },
  { path: "/recenzii", element: <ReviewsPageEntry /> },
  { path: "/despre-mine", element: <AboutPageEntry /> },
  { path: "/creeaza-produs", element: <CreateUniqueProductPageEntry /> },
  { path: "/plata-cos/order-received/:orderNumber", element: <ThankYouPage /> },
  { path: "/categorie/:slug", element: <CategoryLandingPage /> },
  { path: "/en", element: <Index /> },
  { path: "/en/product/:slug", element: <ProductPageEntry /> },
  { path: "/en/cos", element: <CartPageEntry /> },
  { path: "/en/plata-cos", element: <CheckoutPageEntry /> },
  { path: "/en/wishlist", element: <WishlistPageEntry /> },
  { path: "/en/cont", element: <AccountPage /> },
  { path: "/en/reduceri", element: <DiscountsPageEntry /> },
  { path: "/en/intrebari-frecvente", element: <FAQPageEntry /> },
  { path: "/en/contact", element: <ContactPageEntry /> },
  { path: "/en/recenzii", element: <ReviewsPageEntry /> },
  { path: "/en/about-me", element: <AboutPageEntry /> },
  { path: "/en/create-unique-product", element: <CreateUniqueProductPageEntry /> },
  { path: "/en/plata-cos/order-received/:orderNumber", element: <ThankYouPage /> },
  { path: "/en/category/:slug", element: <CategoryLandingPage /> },
  { path: "*", element: <NotFound /> },
];

export default routes;
