import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { FileJson, Plus, Trash2, Edit } from 'lucide-react';

interface Template {
  id: number;
  name: string;
  statement_type: string;
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/templates/');
      setTemplates(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      // Note: You'll need to add a DELETE endpoint to your backend later if you want this to work.
      // For now, this is a placeholder or you can implement the backend delete endpoint quickly.
      alert("Delete functionality requires backend update. (Skipping for now)");
    } catch (e) {
      alert("Failed to delete");
    }
  };

  if (loading) return <div>Loading Templates...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Report Templates</h1>
        <Link 
          to="/templates/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition"
        >
          <Plus size={18} className="mr-2" /> New Template
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <FileJson size={24} className="text-orange-600" />
              </div>
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                <button 
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="font-bold text-gray-800 text-lg mb-1">{template.name}</h3>
            <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-mono mb-4">
              {template.statement_type}
            </span>
            
            <div className="border-t border-gray-100 pt-4 mt-2">
              <Link 
                to={`/templates/${template.id}`} // We will build this edit page next
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
              >
                <Edit size={14} className="mr-1" /> Edit Definition
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}