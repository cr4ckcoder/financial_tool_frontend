import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { 
  Building2, FileText, FileJson, Plus, ArrowRight, 
  Users, Activity, Layers, Briefcase, TrendingUp 
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ companies: 0, works: 0, templates: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const results = await Promise.allSettled([
          api.get('/companies/'),
          api.get('/works/'),
          api.get('/templates/')
        ]);
        
        setStats({
          companies: results[0].status === 'fulfilled' ? results[0].value.data.length : 0,
          works: results[1].status === 'fulfilled' ? results[1].value.data.length : 0,
          templates: results[2].status === 'fulfilled' ? results[2].value.data.length : 0
        });
      } catch (e) {
        console.error("Failed to load stats");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full text-gray-400 font-medium">
      Loading Dashboard...
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-end pb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, get an overview of your workspace.</p>
        </div>
        <div className="hidden md:flex items-center text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
          System Status: Online
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Clients" 
          value={stats.companies} 
          icon={<Building2 size={24} className="text-indigo-600" />}
          gradient="from-indigo-500 to-indigo-600"
          link="/companies"
        />
        <StatCard 
          title="Active Engagements" 
          value={stats.works} 
          icon={<Briefcase size={24} className="text-emerald-600" />}
          gradient="from-emerald-500 to-emerald-600"
          link="/works"
        />
        <StatCard 
          title="Report Templates" 
          value={stats.templates} 
          icon={<FileJson size={24} className="text-orange-600" />}
          gradient="from-orange-500 to-orange-600"
          link="/templates"
        />
      </div>

      {/* Quick Actions Section */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center">
          <Activity size={20} className="mr-2 text-indigo-600" /> Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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
            color="emerald"
          />
          <ActionCard 
            to="/templates/new" 
            title="Design Template" 
            desc="Create report layout"
            icon={<FileJson size={20} />}
            color="orange"
          />
          {user?.role === 'ADMIN' && (
            <ActionCard 
              to="/staff" 
              title="Manage Staff" 
              desc="Add users & permissions"
              icon={<Users size={20} />}
              color="purple"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Polished Stat Card
function StatCard({ title, value, icon, gradient, link }: any) {
  return (
    <Link to={link} className="relative group overflow-hidden bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">{title}</p>
          <p className="text-4xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-colors border border-transparent group-hover:border-slate-100">
          {icon}
        </div>
      </div>
      {/* Subtle bottom gradient bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
    </Link>
  );
}

// Polished Action Card
function ActionCard({ to, title, desc, icon, color }: any) {
  const themes: any = {
    indigo: { text: "text-indigo-600", bg: "bg-indigo-50", hover: "group-hover:bg-indigo-600", icon: "group-hover:text-white" },
    emerald: { text: "text-emerald-600", bg: "bg-emerald-50", hover: "group-hover:bg-emerald-600", icon: "group-hover:text-white" },
    orange: { text: "text-orange-600", bg: "bg-orange-50", hover: "group-hover:bg-orange-600", icon: "group-hover:text-white" },
    purple: { text: "text-purple-600", bg: "bg-purple-50", hover: "group-hover:bg-purple-600", icon: "group-hover:text-white" },
  };
  
  const theme = themes[color];

  return (
    <Link 
      to={to} 
      className="block p-5 bg-white border border-slate-200 rounded-xl transition-all duration-300 group hover:shadow-md hover:border-slate-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${theme.bg} ${theme.text} ${theme.hover} ${theme.icon} transition-all duration-300 shadow-sm`}>
          {icon}
        </div>
        <ArrowRight size={18} className="text-slate-300 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
      </div>
      <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 font-medium">{desc}</p>
    </Link>
  );
}