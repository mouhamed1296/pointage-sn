import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Modules } from './pages/Modules';
import { Persons } from './pages/Persons';
import { Station } from './pages/Station';
import { Cameras } from './pages/Cameras';
import { Devices } from './pages/Devices';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/station" element={<Station />} />
            <Route path="/cameras" element={<Cameras />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/modules" element={<Modules />} />
            <Route path="/persons" element={<Persons />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
