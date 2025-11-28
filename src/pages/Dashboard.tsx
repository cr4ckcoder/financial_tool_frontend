import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { 
  Building2, FileText, FileJson, Plus, ArrowRight, 
  Users, Activity, Layers 
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    companies: 0,
    works: 0,
    templates: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch real data counts from your API
        const [compRes, worksRes, templRes] = await Promise.all([
          api.get('/companies/'),
          api.get('/works/'),
          api.get('/templates/')
        ]);
        
        setStats({
          companies: compRes.data.length,
          works: worksRes.data.length,
          templates: templRes.data.length
        });
      } catch (e) {
        console.error("Failed to load stats");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-end border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your financial workspace</p>
        </div>
        <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
          Logged in as <span className="font-semibold text-indigo-600">{user?.sub}</span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Clients" 
          value={stats.companies} 
          icon={<Building2 size={24} className="text-indigo-600" />}
          bg="bg-indigo-50"
          border="border-indigo-100"
        />
        <StatCard 
          title="Active Engagements" 
          value={stats.works} 
          icon={<FileText size={24} className="text-green-600" />}
          bg="bg-green-50"
          border="border-green-100"
        />
        <StatCard 
          title="Report Templates" 
          value={stats.templates} 
          icon={<FileJson size={24} className="text-orange-600" />}
          bg="bg-orange-50"
          border="border-orange-100"
        />
      </div>

      {/* Quick Actions Section */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Activity size={20} className="mr-2 text-indigo-600" /> Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard 
            to="/companies" 
            title="Add Company" 
            desc="Register a new client entity"
            icon={<Plus size={20} />}
            color="indigo"
          />
          <ActionCard 
            to="/works" 
            title="New Work" 
            desc="Start a new financial year"
            icon={<Layers size={20} />}
            color="green"
          />
          <ActionCard 
            to="/templates/new" 
            title="Create Template" 
            desc="Design report layout"
            icon={<FileJson size={20} />}
            color="orange"
          />
          
          {/* Only Admins see the Staff button */}
          {user?.role === 'ADMIN' && (
            <ActionCard 
              to="/staff" 
              title="Manage Staff" 
              desc="Add users & assignments"
              icon={<Users size={20} />}
              color="purple"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Reusable Stat Card Component
function StatCard({ title, value, icon, bg, border }: any) {
  return (
    <div className={`${bg} p-6 rounded-xl border ${border} flex items-center justify-between shadow-sm transition hover:shadow-md`}>
      <div>
        <p className="text-xs font-bold uppercase text-gray-500 tracking-wider">{title}</p>
        <p className="text-3xl font-extrabold text-gray-900 mt-1">{value}</p>
      </div>
      <div className="p-3 bg-white rounded-lg shadow-sm">
        {icon}
      </div>
    </div>
  );
}

// Reusable Action Card Component
function ActionCard({ to, title, desc, icon, color }: any) {
  const colorClasses: any = {
    indigo: "hover:border-indigo-300 hover:bg-indigo-50 text-indigo-600",
    green: "hover:border-green-300 hover:bg-green-50 text-green-600",
    orange: "hover:border-orange-300 hover:bg-orange-50 text-orange-600",
    purple: "hover:border-purple-300 hover:bg-purple-50 text-purple-600",
  };

  return (
    <Link 
      to={to} 
      className={`block p-4 bg-white border border-gray-200 rounded-xl transition-all duration-200 group ${colorClasses[color]}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-gray-50 group-hover:bg-white transition-colors shadow-sm`}>
          {icon}
        </div>
        <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
      </div>
      <h3 className="font-bold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">{desc}</p>
    </Link>
  );
}