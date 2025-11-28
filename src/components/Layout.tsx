import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Building2, FileText, FolderTree, 
  Users, FileJson, LogOut, UserCircle, ChevronRight
} from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItem = (path: string, icon: any, label: string) => {
    const isActive = location.pathname === path;
    return (
      <Link 
        to={path} 
        className={clsx(
          "flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group",
          isActive 
            ? "bg-indigo-600 text-white shadow-md" 
            : "text-slate-400 hover:bg-slate-800 hover:text-white"
        )}
      >
        <div className="flex items-center space-x-3">
          {icon} <span className="font-medium text-sm">{label}</span>
        </div>
        {isActive && <ChevronRight size={16} className="text-indigo-200" />}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="font-bold text-lg text-white">F</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">FinTool Pro</h1>
            <p className="text-xs text-slate-500 font-medium">Financial Automation</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-4 mt-2">Overview</div>
          {navItem("/", <LayoutDashboard size={18} />, "Dashboard")}
          
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-4 mt-6">Management</div>
          {navItem("/companies", <Building2 size={18} />, "Companies")}
          {navItem("/works", <FileText size={18} />, "Works")}
          
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-4 mt-6">Configuration</div>
          {navItem("/accounts", <FolderTree size={18} />, "Chart of Accounts")}
          {navItem("/templates", <FileJson size={18} />, "Templates")}
          
          {user?.role === 'ADMIN' && (
            <>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-4 mt-6">Admin</div>
              {navItem("/staff", <Users size={18} />, "Staff & Access")}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <div className="flex items-center p-3 bg-slate-800 rounded-xl mb-3 border border-slate-700">
            <div className="bg-indigo-900/50 p-2 rounded-full mr-3">
              <UserCircle className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user?.sub}</p>
              <p className="text-[10px] uppercase font-bold text-indigo-400">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="flex items-center justify-center space-x-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 w-full py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={16} /> <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50/50">
        <div className="max-w-7xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}