import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { ArrowLeft, Upload, CheckCircle, FileText, Download } from 'lucide-react';

interface Entry {
  id: number;
  account_name: string;
  debit: number;
  credit: number;
  closing_balance: number;
}

interface Account {
  id: number;
  name: string;
  type: string;
}

interface Template {
  id: number;
  name: string;
  statement_type: string;
}

export default function WorkDetails() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'map' | 'report'>('map');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [unmapped, setUnmapped] = useState<Entry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  
  // Actions State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchWorkData();
  }, [id]);

  const fetchWorkData = async () => {
    setLoading(true);
    try {
      const [unmappedRes, accountsRes, templatesRes] = await Promise.all([
        api.get(`/works/${id}/unmapped-entries`),
        api.get(`/accounts/`),
        api.get(`/templates/`)
      ]);
      setUnmapped(unmappedRes.data);
      setAccounts(accountsRes.data);
      setTemplates(templatesRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- Actions ---

  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      await api.post(`/works/${id}/trial-balance`, formData);
      alert('Upload Successful!');
      fetchWorkData(); // Refresh list
      setSelectedFile(null);
    } catch (e) {
      alert('Upload failed. Ensure it is a valid CSV.');
    }
  };

  const handleMap = async (entryId: number, accountId: number) => {
    try {
      await api.post(`/works/${id}/map-entry`, {
        trial_balance_entry_id: entryId,
        account_sub_head_id: accountId
      });
      // Optimistic Update: Remove from list immediately
      setUnmapped(prev => prev.filter(e => e.id !== entryId));
    } catch (e) {
      alert('Mapping failed');
    }
  };

  const handleDownload = (templateId: number, format: string) => {
    const url = `http://localhost:8000/works/${id}/statements/${templateId}?format=${format}`;
    window.open(url, '_blank');
  };

  // Filter Sub-Head accounts for dropdown
  const subHeadAccounts = useMemo(() => {
    return accounts
      .filter(a => a.type === 'SUB_HEAD')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [accounts]);

  // Filter unmapped entries
  const filteredEntries = unmapped.filter(e => 
    e.account_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div>Loading Workspace...</div>;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Link to="/works" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Work #{id} Workspace</h1>
        </div>
        <div className="flex bg-gray-200 rounded-lg p-1">
          <button 
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'map' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:text-gray-800'}`}
          >
            Mapping
          </button>
          <button 
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'report' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:text-gray-800'}`}
          >
            Reports
          </button>
        </div>
      </div>

      {/* --- MAPPING TAB --- */}
      {activeTab === 'map' && (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
          
          {/* Left: Actions & Upload */}
          <div className="lg:w-1/3 flex flex-col space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-700 mb-4 flex items-center">
                <Upload size={18} className="mr-2" /> Upload Trial Balance
              </h2>
              <div className="flex flex-col space-y-3">
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <button 
                  onClick={handleUpload} 
                  disabled={!selectedFile}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Upload CSV
                </button>
              </div>
            </div>

            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 flex-1">
              <h3 className="text-indigo-800 font-bold mb-2">Stats</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-indigo-600">Pending Items</span>
                <span className="text-xl font-bold text-indigo-900">{unmapped.length}</span>
              </div>
              <p className="text-xs text-indigo-500 mt-4">
                Tip: Use the search bar on the right to find specific line items quickly.
              </p>
            </div>
          </div>

          {/* Right: Mapping List */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="font-semibold text-gray-700">Unmapped Entries</h2>
              <input 
                type="text" 
                placeholder="Search entries..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {filteredEntries.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <CheckCircle size={48} className="mb-4 text-green-100" />
                  <p>All items mapped!</p>
                </div>
              ) : (
                filteredEntries.map(entry => (
                  <MappingRow 
                    key={entry.id} 
                    entry={entry} 
                    accounts={subHeadAccounts} 
                    onMap={handleMap} 
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- REPORTS TAB --- */}
      {activeTab === 'report' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div key={template.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <FileText size={24} className="text-green-600" />
                </div>
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-500">
                  {template.statement_type}
                </span>
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">{template.name}</h3>
              <p className="text-sm text-gray-500 mb-6">Ready to generate.</p>
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => handleDownload(template.id, 'pdf')}
                  className="flex-1 flex items-center justify-center border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  <Download size={16} className="mr-2" /> PDF
                </button>
                <button 
                  onClick={() => handleDownload(template.id, 'xlsx')}
                  className="flex-1 flex items-center justify-center bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  <Download size={16} className="mr-2" /> Excel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Sub-component for individual mapping rows to optimize rendering
function MappingRow({ entry, accounts, onMap }: { entry: Entry, accounts: Account[], onMap: (eid: number, aid: number) => void }) {
  const [selectedId, setSelectedId] = useState<number | ''>('');

  return (
    <div className="p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition bg-gray-50">
      <div className="flex justify-between mb-3">
        <span className="font-medium text-gray-800">{entry.account_name}</span>
        <span className={`font-mono font-bold ${entry.closing_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {entry.closing_balance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
        </span>
      </div>
      <div className="flex gap-2">
        <select 
          value={selectedId}
          onChange={(e) => setSelectedId(Number(e.target.value))}
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="" disabled>Select Target Account...</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.name}</option>
          ))}
        </select>
        <button 
          disabled={!selectedId}
          onClick={() => selectedId && onMap(entry.id, selectedId)}
          className="bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Map
        </button>
      </div>
    </div>
  );
}