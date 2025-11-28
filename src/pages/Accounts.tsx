import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import api from '../lib/api';
import { 
  FolderTree, Plus, Upload, ChevronRight, ChevronDown, 
  Search, FileSpreadsheet, Layers 
} from 'lucide-react';

interface Account {
  id: number;
  name: string;
  type: 'CATEGORY' | 'HEAD' | 'SUB_HEAD';
  category_type: string;
  parent_id: number | null;
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Toggle state for tree nodes (expanded/collapsed)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const { register, handleSubmit, reset, watch } = useForm();
  const selectedType = watch('type'); // Watch type to conditionally show parent dropdown

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts/');
      setAccounts(res.data);
      
      // Auto-expand all categories by default
      const initialExpanded: Record<number, boolean> = {};
      res.data.forEach((acc: Account) => {
        if (acc.type === 'CATEGORY') initialExpanded[acc.id] = true;
      });
      setExpanded(initialExpanded);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---

  const handleCreate = async (data: any) => {
    try {
      // Fix: Convert empty string parent_id to null
      const payload = {
        ...data,
        parent_id: data.parent_id ? Number(data.parent_id) : null
      };
      
      await api.post('/accounts/', payload);
      setIsModalOpen(false);
      reset();
      fetchAccounts();
      alert('Account created successfully');
    } catch (e) {
      alert('Error creating account');
    }
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);

    try {
      const res = await api.post('/accounts/bulk-upload', formData);
      alert(`Success! Processed ${res.data.sub_heads_processed} sub-heads.`);
      fetchAccounts();
    } catch (e) {
      alert('Upload failed. Ensure CSV has columns: Category, HEAD, Sub head');
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const toggleExpand = (id: number) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- TREE BUILDING LOGIC ---
  const treeData = useMemo(() => {
    if (!accounts.length) return [];

    const categories = accounts.filter(a => a.type === 'CATEGORY');
    
    return categories.map(cat => {
      const heads = accounts.filter(a => a.parent_id === cat.id && a.type === 'HEAD');
      
      const headsWithChildren = heads.map(head => {
        const subHeads = accounts.filter(a => a.parent_id === head.id && a.type === 'SUB_HEAD');
        
        // Filter by search query if active
        if (searchQuery) {
          const matches = subHeads.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
          if (matches.length === 0 && !head.name.toLowerCase().includes(searchQuery.toLowerCase())) return null;
          return { ...head, children: matches.length > 0 ? matches : subHeads };
        }
        
        return { ...head, children: subHeads };
      }).filter(Boolean); // Remove nulls (filtered out heads)

      if (searchQuery && headsWithChildren.length === 0 && !cat.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return null;
      }

      return { ...cat, children: headsWithChildren };
    }).filter(Boolean);
  }, [accounts, searchQuery]);

  // Helper for Parent Dropdown
  const potentialParents = useMemo(() => {
    if (selectedType === 'HEAD') return accounts.filter(a => a.type === 'CATEGORY');
    if (selectedType === 'SUB_HEAD') return accounts.filter(a => a.type === 'HEAD');
    return [];
  }, [accounts, selectedType]);


  if (loading) return <div>Loading Chart of Accounts...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <FolderTree className="mr-3 text-indigo-600" /> Chart of Accounts
        </h1>
        <div className="flex space-x-3">
          <label className={`cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700 transition ${uploading ? 'opacity-50' : ''}`}>
            <Upload size={18} className="mr-2" /> 
            {uploading ? 'Uploading...' : 'Bulk Upload'}
            <input type="file" className="hidden" accept=".csv" onChange={handleBulkUpload} disabled={uploading} />
          </label>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition"
          >
            <Plus size={18} className="mr-2" /> Add Account
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-t-xl border-b border-gray-100 flex items-center">
        <Search className="text-gray-400 mr-3" size={20} />
        <input 
          type="text" 
          placeholder="Search accounts..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 outline-none text-gray-700"
        />
      </div>

      {/* Tree View */}
      <div className="bg-white flex-1 rounded-b-xl shadow-sm border border-gray-100 overflow-auto p-2">
        {treeData.length === 0 ? (
          <div className="text-center text-gray-400 py-10">No accounts found. Upload a CSV to get started.</div>
        ) : (
          <div className="space-y-1">
            {treeData.map((cat: any) => (
              <div key={cat.id} className="border border-gray-100 rounded-lg overflow-hidden mb-2">
                {/* Category Row */}
                <div 
                  className="bg-gray-50 p-3 flex items-center cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleExpand(cat.id)}
                >
                  {expanded[cat.id] ? <ChevronDown size={16} className="mr-2 text-gray-500" /> : <ChevronRight size={16} className="mr-2 text-gray-500" />}
                  <span className="font-bold text-gray-800">{cat.name}</span>
                  <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">CATEGORY</span>
                </div>

                {/* Heads */}
                {expanded[cat.id] && (
                  <div className="bg-white">
                    {cat.children.map((head: any) => (
                      <div key={head.id}>
                        <div 
                          className="pl-8 pr-3 py-2 flex items-center cursor-pointer hover:bg-gray-50 border-t border-gray-50"
                          onClick={() => toggleExpand(head.id)}
                        >
                          {expanded[head.id] ? <ChevronDown size={14} className="mr-2 text-indigo-400" /> : <ChevronRight size={14} className="mr-2 text-indigo-400" />}
                          <span className="font-medium text-gray-700">{head.name}</span>
                          <span className="ml-auto text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded">HEAD</span>
                        </div>

                        {/* Sub Heads */}
                        {expanded[head.id] && (
                          <div className="bg-white pb-2">
                            {head.children.map((sub: any) => (
                              <div key={sub.id} className="pl-16 pr-3 py-1.5 flex items-center hover:bg-indigo-50/50 group">
                                <FileSpreadsheet size={14} className="mr-2 text-green-500" />
                                <span className="text-sm text-gray-600">{sub.name}</span>
                                <span className="ml-auto text-xs text-gray-300 group-hover:text-gray-400">#{sub.id}</span>
                              </div>
                            ))}
                            {head.children.length === 0 && (
                              <div className="pl-16 py-1 text-xs text-gray-400 italic">No sub-heads</div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {cat.children.length === 0 && (
                      <div className="pl-8 py-2 text-sm text-gray-400 italic">No heads defined</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Account</h2>
            <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                <input {...register('name', { required: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hierarchy Level</label>
                <select {...register('type', { required: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="CATEGORY">Category (Top Level)</option>
                  <option value="HEAD">Head (Mid Level)</option>
                  <option value="SUB_HEAD">Sub-Head (Bottom Level)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type (Tag)</label>
                <select {...register('category_type', { required: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="ASSET">Asset</option>
                  <option value="LIABILITY">Liability</option>
                  <option value="EQUITY">Equity</option>
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>

              {selectedType !== 'CATEGORY' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Account</label>
                  <select {...register('parent_id', { required: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Select Parent...</option>
                    {potentialParents.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}