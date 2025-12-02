import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Building2, FileText, FolderTree, 
  Users, FileJson, LogOut, UserCircle, Settings, FileCheck 
} from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItem = (path: string, icon: any, label: string) => (
    <Link to={path} className={clsx(
      "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
      location.pathname === path ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50"
    )}>
      {icon} <span>{label}</span>
    </Link>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-indigo-700 flex items-center">
            <FileText className="mr-2" size={24} /> Finstat Pro
          </h1>
          <p className="text-xs text-gray-400 mt-1 ml-8">Audit Management System</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItem("/", <LayoutDashboard size={20} />, "Dashboard")}
          {navItem("/companies", <Building2 size={20} />, "Companies")}
          {navItem("/works", <FileText size={20} />, "Engagements")}
          
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Masters & Templates</div>
          {navItem("/accounts", <FolderTree size={20} />, "Chart of Accounts")}
          {navItem("/templates", <FileJson size={20} />, "Report Templates")}
          {navItem("/documents", <FileCheck size={20} />, "Compliance Docs")} {/* <--- NEW ITEM */}
          
          {user?.role === 'ADMIN' && (
            <>
              <div className="pt-6 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Administration</div>
              {navItem("/staff", <Users size={20} />, "Staff Management")}
              {navItem("/settings", <Settings size={20} />, "Firm Settings")}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg mb-3 border border-gray-200">
            <UserCircle className="w-8 h-8 text-indigo-400 mr-3" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-800 truncate">{user?.sub}</p>
              <p className="text-xs text-gray-500 font-medium">{user?.role}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center space-x-2 text-gray-500 hover:text-red-600 w-full px-2 py-1 transition-colors text-sm font-medium">
            <LogOut size={18} /> <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}