import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { FileCheck, Plus, Edit, Trash2 } from 'lucide-react';

interface ComplianceTemplate {
  id: number;
  name: string;
}

export default function DocumentTemplates() {
  const [templates, setTemplates] = useState<ComplianceTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/compliance/templates');
      setTemplates(res.data);
    } catch (e) {
      console.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  // Placeholder for delete (Backend implementation optional for now)
  const handleDelete = (id: number) => {
     if(confirm("Delete this template?")) {
         alert("Delete feature pending backend implementation.");
     }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading Documents...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Compliance Documents</h1>
            <p className="text-sm text-gray-500">Manage standard letters and legal formats</p>
        </div>
        <Link 
          to="/documents/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition"
        >
          <Plus size={18} className="mr-2" /> New Document
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((doc) => (
          <div key={doc.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileCheck size={24} className="text-purple-600" />
              </div>
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                <button 
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                >
                    <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="font-bold text-gray-800 text-lg mb-2 truncate" title={doc.name}>{doc.name}</h3>
            <p className="text-xs text-gray-400 mb-4">HTML Template</p>
            
            <div className="border-t border-gray-100 pt-4">
              <Link 
                to={`/documents/${doc.id}`}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
              >
                <Edit size={14} className="mr-1" /> Edit Content
              </Link>
            </div>
          </div>
        ))}
        
        {templates.length === 0 && (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400">No documents found.</p>
                <p className="text-sm text-gray-400">Go to Settings Initialize Templates to load defaults.</p>
            </div>
        )}
      </div>
    </div>
  );
}