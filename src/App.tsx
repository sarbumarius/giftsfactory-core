import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CategoryProvider } from "@/contexts/CategoryContext";
import { ShopProvider } from "@/contexts/ShopContext";
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
import GlobalFooter from "./components/common/GlobalFooter";
import { useIsMobile } from "./hooks/use-mobile";

const queryClient = new QueryClient();

const App = () => {
  const isMobile = useIsMobile();

  return (
    <QueryClientProvider client={queryClient}>
      <ShopProvider>
        <CategoryProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/produs/:slug" element={<ProductPageEntry />} />
                <Route path="/cos" element={<CartPageEntry />} />
                <Route path="/plata-cos" element={<CheckoutPageEntry />} />
                <Route path="/wishlist" element={<WishlistPageEntry />} />
                <Route path="/cont" element={<AccountPage />} />
              <Route path="/reduceri" element={<DiscountsPageEntry />} />
              <Route path="/intrebari-frecvente" element={<FAQPageEntry />} />
              <Route path="/contact" element={<ContactPageEntry />} />
              <Route path="/recenzii" element={<ReviewsPageEntry />} />
              <Route path="/despre-mine" element={<AboutPageEntry />} />
              <Route path="/creeaza-produs" element={<CreateUniqueProductPageEntry />} />
                <Route path="/plata-cos/order-received/:orderNumber" element={<ThankYouPage />} />
                <Route path="/categorie/:slug" element={<CategoryLandingPage />} />
                <Route path="/en" element={<Index />} />
                <Route path="/en/product/:slug" element={<ProductPageEntry />} />
                <Route path="/en/cos" element={<CartPageEntry />} />
                <Route path="/en/plata-cos" element={<CheckoutPageEntry />} />
                <Route path="/en/wishlist" element={<WishlistPageEntry />} />
                <Route path="/en/cont" element={<AccountPage />} />
                <Route path="/en/reduceri" element={<DiscountsPageEntry />} />
                <Route path="/en/intrebari-frecvente" element={<FAQPageEntry />} />
                <Route path="/en/contact" element={<ContactPageEntry />} />
                <Route path="/en/recenzii" element={<ReviewsPageEntry />} />
                <Route path="/en/about-me" element={<AboutPageEntry />} />
                <Route path="/en/create-unique-product" element={<CreateUniqueProductPageEntry />} />
                <Route path="/en/plata-cos/order-received/:orderNumber" element={<ThankYouPage />} />
                <Route path="/en/categorie/:slug" element={<CategoryLandingPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              {isMobile ? <GlobalFooter /> : null}
            </BrowserRouter>
          </TooltipProvider>
        </CategoryProvider>
      </ShopProvider>
    </QueryClientProvider>
  );
};

export default App;
