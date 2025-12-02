import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../lib/api';
import { 
  Plus, FileText, ArrowLeft, Calendar, ArrowRight, 
  Users, Briefcase, Building2 
} from 'lucide-react';

interface Work {
  id: number;
  start_date: string;
  end_date: string;
  status: string;
}

interface Signatory {
  id: number;
  name: string;
  designation: string;
  din_number: string;
  pan_number: string;
}

interface Company {
  id: number;
  legal_name: string;
  client_type: string;
  cin: string;
  pan: string;
  gstin: string;
  registered_address: string;
}

export default function CompanyDetails() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'works' | 'signatories'>('works');
  const [company, setCompany] = useState<Company | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [signatories, setSignatories] = useState<Signatory[]>([]);
  
  // Modals
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [showSigModal, setShowSigModal] = useState(false);
  
  const workForm = useForm();
  const sigForm = useForm();

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [compRes, worksRes, sigRes] = await Promise.all([
        api.get(`/companies/${id}`),
        api.get('/works/', { params: { company_id: id } }),
        api.get(`/signatories/${id}`)
      ]);
      setCompany(compRes.data);
      setWorks(worksRes.data);
      setSignatories(sigRes.data);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  const onCreateWork = async (data: any) => {
    try {
      await api.post('/works/', { ...data, company_id: Number(id) });
      setShowWorkModal(false);
      workForm.reset();
      fetchData();
    } catch (e) {
      alert("Failed to create work");
    }
  };

  const onCreateSignatory = async (data: any) => {
    try {
      await api.post('/signatories/', { ...data, company_id: Number(id) });
      setShowSigModal(false);
      sigForm.reset();
      fetchData();
    } catch (e) {
      alert("Failed to add signatory");
    }
  };

  if (!company) return <div>Loading...</div>;

  return (
    <div>
      <Link to="/companies" className="flex items-center text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={18} className="mr-1" /> Back to Clients
      </Link>

      {/* Company Header Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{company.legal_name}</h1>
            <div className="flex space-x-3 text-sm mb-4">
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{company.client_type}</span>
              {company.gstin && <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">GST: {company.gstin}</span>}
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>PAN: <span className="font-mono text-gray-800">{company.pan || 'N/A'}</span></p>
            <p>CIN: <span className="font-mono text-gray-800">{company.cin || 'N/A'}</span></p>
          </div>
        </div>
        <div className="text-sm text-gray-600 border-t border-gray-100 pt-4 mt-2">
          <Building2 size={14} className="inline mr-1" /> {company.registered_address}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button 
          onClick={() => setActiveTab('works')}
          className={`px-6 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'works' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Engagements (Works)
        </button>
        <button 
          onClick={() => setActiveTab('signatories')}
          className={`px-6 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'signatories' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Signatories (Directors/Partners)
        </button>
      </div>

      {/* --- WORKS TAB --- */}
      {activeTab === 'works' && (
        <div>
          <div className="flex justify-end mb-4">
            <button 
              onClick={() => setShowWorkModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition text-sm"
            >
              <Plus size={16} className="mr-2" /> Start New Engagement
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {works.length === 0 ? (
              <div className="col-span-full bg-gray-50 p-10 rounded-xl border border-dashed border-gray-300 text-center text-gray-400">
                No active engagements. Start one for a new financial year.
              </div>
            ) : (
              works.map(work => (
                <Link key={work.id} to={`/works/${work.id}`} className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-indigo-50 p-3 rounded-lg group-hover:bg-indigo-100 transition">
                      <FileText size={24} className="text-indigo-600" />
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${work.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {work.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg mb-1">FY {new Date(work.end_date).getFullYear()}</h3>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Calendar size={14} className="mr-2" /> {work.start_date} - {work.end_date}
                  </div>
                  <div className="flex items-center text-indigo-600 font-medium text-sm group-hover:underline">
                    Open Workspace <ArrowRight size={16} className="ml-1" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- SIGNATORIES TAB --- */}
      {activeTab === 'signatories' && (
        <div>
          <div className="flex justify-end mb-4">
            <button 
              onClick={() => setShowSigModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition text-sm"
            >
              <Plus size={16} className="mr-2" /> Add Signatory
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Designation</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">DIN / PAN</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {signatories.map(sig => (
                  <tr key={sig.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 mr-3">
                        {sig.name.charAt(0)}
                      </div>
                      {sig.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{sig.designation}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {sig.din_number ? `DIN: ${sig.din_number}` : `PAN: ${sig.pan_number}`}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">Active</span>
                    </td>
                  </tr>
                ))}
                {signatories.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No signatories added yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}
      
      {showWorkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">New Engagement</h2>
            <form onSubmit={workForm.handleSubmit(onCreateWork)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" {...workForm.register('start_date')} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" {...workForm.register('end_date')} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowWorkModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Signatory</h2>
            <form onSubmit={sigForm.handleSubmit(onCreateSignatory)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input {...sigForm.register('name', { required: true })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <select {...sigForm.register('designation')} className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="Director">Director</option>
                  <option value="Managing Director">Managing Director</option>
                  <option value="Partner">Partner</option>
                  <option value="Proprietor">Proprietor</option>
                  <option value="CEO">CEO</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DIN Number</label>
                <input {...sigForm.register('din_number')} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                <input {...sigForm.register('pan_number')} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Optional" />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowSigModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}