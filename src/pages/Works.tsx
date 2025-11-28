import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar, ArrowRight, Building } from 'lucide-react';
import api from '../lib/api';

interface Work {
  id: number;
  company_id: number;
  start_date: string;
  end_date: string;
  status: string;
}

interface Company {
  id: number;
  legal_name: string;
}

export default function Works() {
  const [works, setWorks] = useState<Work[]>([]);
  const [companies, setCompanies] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Parallel fetch for efficiency
      const [worksRes, companiesRes] = await Promise.all([
        api.get('/works/'),
        api.get('/companies/')
      ]);

      setWorks(worksRes.data);
      
      // Create a lookup map: { 1: "Apple Inc", 2: "Google" }
      const compMap: Record<number, string> = {};
      companiesRes.data.forEach((c: Company) => {
        compMap[c.id] = c.legal_name;
      });
      setCompanies(compMap);
    } catch (error) {
      console.error("Error loading works", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading works...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">All Financial Works</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Work ID</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Period</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {works.map((work) => (
              <tr key={work.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-gray-600">#{work.id}</td>
                <td className="px-6 py-4 font-medium text-gray-900 flex items-center">
                  <Building size={16} className="text-gray-400 mr-2" />
                  {companies[work.company_id] || 'Unknown Company'}
                </td>
                <td className="px-6 py-4 text-gray-600 text-sm">
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-2 text-gray-400" />
                    {work.start_date} <span className="mx-2">→</span> {work.end_date}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    work.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {work.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    to={`/works/${work.id}`}
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                  >
                    Open Workspace <ArrowRight size={16} className="ml-1" />
                  </Link>
                </td>
              </tr>
            ))}
            {works.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No active works found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}