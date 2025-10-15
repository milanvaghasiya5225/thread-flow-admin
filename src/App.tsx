import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DotNetAuthProvider } from "@/contexts/DotNetAuthContext";
import Dashboard from "./pages/Dashboard";
import ContactsManager from "./pages/ContactsManager";
import ContactsPage from "./pages/ContactsPage";
import ProfileSettings from "./pages/ProfileSettings";
import UsersList from "./pages/UsersList";
import RoleManagement from "./pages/RoleManagement";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import OtpVerification from "./pages/auth/OtpVerification";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <DotNetAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/otp-verification" element={<OtpVerification />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/contacts" element={<ContactsManager />} />
              <Route path="/contacts-page" element={<ContactsPage />} />
              <Route path="/users" element={<UsersList />} />
              <Route path="/roles" element={<RoleManagement />} />
              <Route path="/profile" element={<ProfileSettings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DotNetAuthProvider>
    </QueryClientProvider>
  );
};

export default App;
