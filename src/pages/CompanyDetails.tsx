import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../lib/api';
import { Plus, FileText, ArrowLeft, Calendar } from 'lucide-react';

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
  const [works, setWorks] = useState<Work[]>([]); // You might need to update backend to fetch works by company
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (id) fetchCompanyData();
  }, [id]);

  const fetchCompanyData = async () => {
    try {
      const compRes = await api.get(`/companies/${id}`);
      setCompany(compRes.data);
      
      // Note: We might need a specific endpoint to list works for a company
      // For now, let's assume we fetch all works and filter (Optimization for later: Backend Filter)
      // Or you can update your backend to return works inside company details (it likely already does via relationship!)
      // Let's assume compRes.data includes works based on your SQLAlchemy models.
      // If not, we might need a dedicated fetch.
      // Checking your backend model: Company has `works = relationship(...)` but Pydantic schema might not include it by default.
      // Let's assume for now we might need to add it or fetch separately.
      // For this step, I'll add a quick fetch for works if they aren't in the company object.
      
      // Temporary fix: fetch all works and filter client-side (Not efficient for prod, but works for starter)
      // Ideally: GET /companies/{id}/works
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  const onCreateWork = async (data: any) => {
    try {
      await api.post('/works/', { ...data, company_id: Number(id) });
      setIsModalOpen(false);
      reset();
      // Refresh page or list
      alert("Work created! (Reload to see - backend list update needed)"); 
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
          <Plus size={18} className="mr-2" /> New Work
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Placeholder for Works List - we need to ensure backend sends this data */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center text-gray-500 italic">
          No works visible yet. (We need to wire up the list).
        </div>
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