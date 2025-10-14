import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { DotNetAuthProvider } from "./contexts/DotNetAuthContext";
import Register from "./pages/auth/Register";
import Verify from "./pages/auth/Verify";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import ContactsManager from "./pages/ContactsManager";
import ProfileSettings from "./pages/ProfileSettings";
import UsersList from "./pages/UsersList";
import RoleManagement from "./pages/RoleManagement";
import NotFound from "./pages/NotFound";
import DotNetLogin from "./pages/DotNetLogin";
import DotNetRegister from "./pages/DotNetRegister";
import OtpVerification from "./pages/OtpVerification";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DotNetAuthProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dotnet-login" element={<DotNetLogin />} />
              <Route path="/dotnet-register" element={<DotNetRegister />} />
              <Route path="/otp-verify" element={<OtpVerification />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/contacts" element={<ContactsManager />} />
              <Route path="/profile" element={<ProfileSettings />} />
              <Route path="/users" element={<UsersList />} />
              <Route path="/roles" element={<RoleManagement />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DotNetAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
