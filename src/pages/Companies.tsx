import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Plus, Building, Search, Briefcase } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface Company {
  id: number;
  legal_name: string;
  client_type: string;
  cin: string;
  pan: string;
  registered_address: string;
}

export default function Companies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/companies/');
      setCompanies(res.data);
    } catch (error) {
      console.error("Failed to fetch companies", error);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      await api.post('/companies/', data);
      setIsModalOpen(false);
      reset();
      fetchCompanies();
    } catch (error) {
      alert('Failed to create company');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Client Companies</h1>
        {user?.role === 'ADMIN' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition"
          >
            <Plus size={18} className="mr-2" /> Add Client
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Client Name</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">ID (CIN/PAN)</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {companies.map((company) => (
              <tr key={company.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900 flex items-center">
                  <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                    <Building size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <div>{company.legal_name}</div>
                    <div className="text-xs text-gray-500">{company.registered_address}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {company.client_type.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                  {company.cin || company.pan || '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    to={`/companies/${company.id}`}
                    className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                  No clients found. Add one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Company Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Add New Client</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Legal Name</label>
                  <input {...register('legal_name', { required: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Type</label>
                  <select {...register('client_type')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                    <option value="PVT_LTD">Private Limited</option>
                    <option value="PUBLIC_LTD">Public Limited</option>
                    <option value="LLP">LLP</option>
                    <option value="PARTNERSHIP">Partnership Firm</option>
                    <option value="PROPRIETORSHIP">Proprietorship</option>
                    <option value="TRUST">Trust</option>
                    <option value="SOCIETY">Society</option>
                    <option value="INDIVIDUAL">Individual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Number (Physical)</label>
                  <input {...register('file_number')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. FILE-001" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CIN (if applicable)</label>
                  <input {...register('cin')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN</label>
                  <input {...register('pan')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TAN</label>
                  <input {...register('tan')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                  <input {...register('gstin')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registered Address</label>
                  <textarea {...register('registered_address')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" rows={2}></textarea>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create Client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}