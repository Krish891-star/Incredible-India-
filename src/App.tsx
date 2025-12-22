import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "@/lib/auth";
import PostAuthRedirect from "@/components/PostAuthRedirect";
import "./index.css"; // Add this import for proper styling
import Index from "./pages/Index";
import SimpleAuth from "./pages/SimpleAuth";
import AuthCallback from "./pages/AuthCallback";
import MagicLinkCallback from "./pages/MagicLinkCallback";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import MapView from "./pages/MapView";
import States from "./pages/States";
import StateDetail from "./pages/StateDetail";
import Saved from "./pages/Saved";
import Settings from "./pages/Settings";
import TripPlanner from "./pages/TripPlanner";
import RoutePlanner from "./pages/RoutePlanner";
import Admin from "./pages/Admin";
import GuideRegistration from "./pages/GuideRegistration";
import TouristRegistration from "./pages/TouristRegistration";
import Hotels from "./pages/Hotels";
import HotelDetail from "./pages/HotelDetail";
import HotelRegistration from "./pages/HotelRegistration";
import TourGuideRegistration from "./pages/TourGuideRegistration";
import HotelPartnerRegistration from "./pages/HotelPartnerRegistration";
import GuideDirectory from "./pages/GuideDirectory";
import GuideDetail from "./pages/GuideDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  
  return (
    <div>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <PostAuthRedirect />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<SimpleAuth />} />
                  <Route path="/login" element={<SimpleAuth />} />
                  <Route path="/signup" element={<SimpleAuth />} />
                  <Route path="/register" element={<SimpleAuth />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/auth/magic-link-callback" element={<MagicLinkCallback />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/guide-registration" element={<GuideRegistration />} />
                  <Route path="/tour-guide-registration" element={<TourGuideRegistration />} />
                  <Route path="/tourist-registration" element={<TouristRegistration />} />
                  <Route path="/hotel-registration" element={<HotelRegistration />} />
                  <Route path="/hotel-partner-registration" element={<HotelPartnerRegistration />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/map" element={<MapView />} />
                  <Route path="/states" element={<States />} />
                  <Route path="/states/:stateName" element={<StateDetail />} />
                  <Route path="/hotels" element={<Hotels />} />
                  <Route path="/hotels/:hotelId" element={<HotelDetail />} />
                  <Route path="/guides" element={<GuideDirectory />} />
                  <Route path="/guides/:guideId" element={<GuideDetail />} />
                  <Route path="/saved" element={<Saved />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/trip-planner" element={<TripPlanner />} />
                  <Route path="/route-planner" element={<RoutePlanner />} />
                  <Route path="/admin" element={<Admin />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </div>
  );
};

export default App;