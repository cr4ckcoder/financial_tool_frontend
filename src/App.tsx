import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import CompanyDetails from './pages/CompanyDetails';
import Works from './pages/Works';
import WorkDetails from './pages/WorkDetails';
import Accounts from './pages/Accounts';
import Templates from './pages/Templates';
import TemplateEditor from './pages/TemplateEditor';
import Staff from './pages/Staff';
import Settings from './pages/Settings';
import DocumentTemplates from './pages/DocumentTemplates'; // <--- NEW
import DocumentEditor from './pages/DocumentEditor';       // <--- NEW (Ensure this file exists from previous steps)

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
            
            {/* Master Data */}
            <Route path="/companies" element={<Companies />} />
            <Route path="/companies/:id" element={<CompanyDetails />} />
            <Route path="/accounts" element={<Accounts />} />
            
            {/* Works & Operations */}
            <Route path="/works" element={<Works />} />
            <Route path="/works/:id" element={<WorkDetails />} />
            
            {/* Financial Reporting */}
            <Route path="/templates" element={<Templates />} />
            <Route path="/templates/new" element={<TemplateEditor />} />
            <Route path="/templates/:id" element={<TemplateEditor />} />
            
            {/* Compliance Documents (NEW) */}
            <Route path="/documents" element={<DocumentTemplates />} />
            <Route path="/documents/new" element={<DocumentEditor />} />
            <Route path="/documents/:id" element={<DocumentEditor />} />
            
            {/* Administration */}
            <Route path="/staff" element={<Staff />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}