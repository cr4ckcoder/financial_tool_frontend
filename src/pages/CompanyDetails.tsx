import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../lib/api';
import { Plus, FileText, ArrowLeft, Calendar, ArrowRight } from 'lucide-react';

interface Work {
  id: number;
  start_date: string;
  end_date: string;
  status: string;
}

interface Company {
  id: number;
  legal_name: string;
  cin: string;
  registered_address: string;
}

export default function CompanyDetails() {
  const { id } = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (id) fetchCompanyData();
  }, [id]);

  const fetchCompanyData = async () => {
    try {
      // Fetch both Company Info AND its Works in parallel
      const [compRes, worksRes] = await Promise.all([
        api.get(`/companies/${id}`),
        api.get('/works/', { params: { company_id: id } }) // Filter by company
      ]);
      setCompany(compRes.data);
      setWorks(worksRes.data);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  const onCreateWork = async (data: any) => {
    try {
      await api.post('/works/', { ...data, company_id: Number(id) });
      setIsModalOpen(false);
      reset();
      fetchCompanyData(); // Refresh list to show new work
    } catch (e) {
      alert("Failed to create work");
    }
  };

  if (!company) return <div>Loading...</div>;

  return (
    <div>
      <Link to="/companies" className="flex items-center text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={18} className="mr-1" /> Back to Companies
      </Link>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{company.legal_name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div><span className="font-semibold">CIN:</span> {company.cin}</div>
          <div><span className="font-semibold">Address:</span> {company.registered_address}</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Financial Works</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition"
        >
          <Plus size={18} className="mr-2" /> New Engagement
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {works.length === 0 ? (
          <div className="col-span-full bg-gray-50 p-8 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
            No financial works found for this company. Start a new one!
          </div>
        ) : (
          works.map(work => (
            <Link key={work.id} to={`/works/${work.id}`} className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-50 p-3 rounded-lg group-hover:bg-indigo-100 transition">
                  <FileText size={24} className="text-indigo-600" />
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  work.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {work.status}
                </span>
              </div>
              
              <h3 className="font-bold text-gray-800 text-lg mb-1">
                 FY {new Date(work.end_date).getFullYear()}
              </h3>
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Calendar size={14} className="mr-2" />
                {work.start_date} - {work.end_date}
              </div>
              
              <div className="flex items-center text-indigo-600 font-medium text-sm group-hover:underline">
                Open Workspace <ArrowRight size={16} className="ml-1" />
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Create Work Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Start New Engagement</h2>
            <form onSubmit={handleSubmit(onCreateWork)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" {...register('start_date', { required: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" {...register('end_date', { required: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}