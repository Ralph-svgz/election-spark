import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import Elections from "./pages/Elections";
import ElectionResults from "./pages/ElectionResults";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      } />
      <Route path="/auth" element={<Auth />} />
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin={true}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/elections" element={
        <ProtectedRoute>
          <Elections />
        </ProtectedRoute>
      } />
            <Route path="/users" element={
              <ProtectedRoute requireAdmin={true}>
                <Users />
              </ProtectedRoute>
            } />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </TooltipProvider>
);

export default App;
