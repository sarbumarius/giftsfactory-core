import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRoutes } from "react-router-dom";
import { CategoryProvider } from "@/contexts/CategoryContext";
import { ShopProvider } from "@/contexts/ShopContext";
import GlobalFooter from "./components/common/GlobalFooter";
import { useIsMobile } from "./hooks/use-mobile";
import routes from "./routes";

const queryClient = new QueryClient();

const App = () => {
  const isMobile = useIsMobile();
  const routing = useRoutes(routes);

  return (
    <QueryClientProvider client={queryClient}>
      <ShopProvider>
        <CategoryProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {routing}
            {isMobile ? <GlobalFooter /> : null}
          </TooltipProvider>
        </CategoryProvider>
      </ShopProvider>
    </QueryClientProvider>
  );
};

export default App;
