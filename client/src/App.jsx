import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./AuthContext";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import AddMoviePage from "./pages/AddMoviePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";


// v2 - african cinema routes
import AfricanPage from "./pages/african/AfricanPage";
import SubmitMoviePage from "./pages/african/SubmitMoviePage";
import AdminDashboard  from "./pages/african/AdminDashboard";




function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/add-movie" element={<AddMoviePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/african" element={<AfricanPage />} />
          <Route path="/african/submit" element={<SubmitMoviePage />} />
          <Route path="/admin" element={<AdminDashboard />} />
         
          
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;