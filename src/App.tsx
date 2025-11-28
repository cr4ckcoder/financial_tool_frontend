// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import CompanyDetails from './pages/CompanyDetails';
import Works from './pages/Works';             // <--- NEW IMPORT
import WorkDetails from './pages/WorkDetails'; // <--- NEW IMPORT
import Accounts from './pages/Accounts'; // <--- Import
import Templates from './pages/Templates';         // <--- NEW
import TemplateEditor from './pages/TemplateEditor'; // <--- NEW
import Staff from './pages/Staff';





const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/companies/:id" element={<CompanyDetails />} />
            <Route path="/works" element={<Works />} />                 {/* UPDATED */}
            <Route path="/works/:id" element={<WorkDetails />} />       {/* NEW */}
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/templates/new" element={<TemplateEditor />} />
            <Route path="/templates/:id" element={<TemplateEditor />} />
            <Route path="/staff" element={<Staff />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}