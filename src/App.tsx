import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewComplaint from "./pages/NewComplaint";
import ComplaintDetail from "./pages/ComplaintDetail";
import AdminDashboard from "./pages/AdminDashboard";
import AdminComplaintDetail from "./pages/AdminComplaintDetail";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import StudentUpdates from "./pages/StudentUpdates";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/complaint/new" element={<NewComplaint />} />
            <Route path="/complaint/:id" element={<ComplaintDetail />} />
            <Route path="/updates" element={<StudentUpdates />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/complaint/:id" element={<AdminComplaintDetail />} />
            <Route path="/admin/announcements" element={<AdminAnnouncements />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
