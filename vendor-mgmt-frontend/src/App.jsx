import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Dashboard/Home";
import PublicVendorRequest from "./pages/Dashboard/PublicVendorRequest";
import Dashboard from "./pages/Dashboard/Dashboard";
import VendorsList from "./pages/Dashboard/VendorsList";
import VendorDetail from "./pages/Dashboard/VendorDetail";
import VendorForm from "./pages/Dashboard/VendorForm";
import ActivityLog from "./pages/Dashboard/ActivityLog";
import NotificationsPage from "./pages/Dashboard/NotificationsPage";
import FollowUpDashboard from "./pages/Dashboard/FollowUpDashboard";
import Analytics from "./pages/Dashboard/Analytics";
import AddVendor from "./pages/Dashboard/AddVendor";
import Settings from "./pages/Dashboard/Settings";
import Help from "./pages/Dashboard/Help";
import SignUp from "./pages/Dashboard/SignUp";
import Login from "./pages/Dashboard/Login";
import VendorOTPLogin from "./pages/Dashboard/VendorOTPLogin";
import VendorOnboardingWizard from "./pages/Dashboard/VendorOnboardingWizard";
import VendorOnboardingSuccess from "./pages/Dashboard/VendorOnboardingSuccess";
import VendorOnboardingLanding from "./pages/Dashboard/VendorOnboardingLanding";
import { VendorsProvider } from './context/VendorsContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

class ErrorBoundary extends React.Component {
  constructor(props){
    super(props); this.state = { hasError:false };
  }
  static getDerivedStateFromError(){ return { hasError:true }; }
  componentDidCatch(err, info){ console.error('ErrorBoundary caught', err, info); }
  render(){
    if(this.state.hasError) return <div style={{padding:40}}><h2>Something went wrong.</h2><p>Please refresh or go back.</p></div>;
    return this.props.children;
  }
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <ThemeProvider>
            <VendorsProvider>
              <ErrorBoundary>
                <Routes>
                {/* Procurement Team Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                
                {/* Vendor Routes (Public - OTP based) */}
                <Route path="/vendor/onboard" element={<VendorOnboardingLanding />} />
                <Route path="/vendor-login" element={<VendorOTPLogin />} />
                <Route path="/vendor-onboarding-form" element={<VendorOnboardingWizard />} />
                <Route path="/vendor-onboarding-success" element={<VendorOnboardingSuccess />} />
                
                {/* Public vendor request form (shareable URL) */}
                <Route path="/vendor-request" element={<PublicVendorRequest />} />
                
                {/* Protected Procurement Routes */}
                <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/follow-ups" element={<ProtectedRoute><FollowUpDashboard /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                <Route path="/activity-log" element={<ProtectedRoute><ActivityLog /></ProtectedRoute>} />
                <Route path="/vendors" element={<ProtectedRoute><VendorsList /></ProtectedRoute>} />
                <Route path="/vendors/:vendorId" element={<ProtectedRoute><VendorDetail /></ProtectedRoute>} />
                <Route path="/add-vendor" element={<ProtectedRoute><AddVendor /></ProtectedRoute>} />
                <Route path="/vendor-form" element={<ProtectedRoute><VendorForm /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
              </Routes>
              <Toaster position="top-right" gutter={8} />
            </ErrorBoundary>
          </VendorsProvider>
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
    </BrowserRouter>
  );
}

export default App;