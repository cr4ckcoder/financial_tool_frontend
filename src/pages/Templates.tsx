import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { FileJson, Plus, Trash2, Edit, Copy } from 'lucide-react';

interface Template {
  id: number;
  name: string;
  statement_type: string;
  template_definition: any; // We need this for duplication
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

  const handleDuplicate = async (template: Template) => {
    try {
      let definition = template.template_definition;
      // Ensure it's parsed if it came as string
      if (typeof definition === 'string') definition = JSON.parse(definition);

      const payload = {
        name: `${template.name} (Copy)`,
        statement_type: template.statement_type,
        template_definition: definition
      };

      await api.post('/templates/', payload);
      alert("Template duplicated!");
      fetchTemplates();
    } catch (e) {
      alert("Failed to duplicate template");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete functionality requires backend update. Proceed?")) return;
    // Logic placeholder
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
              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition">
                <button 
                  onClick={() => handleDuplicate(template)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  title="Duplicate"
                >
                  <Copy size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  title="Delete"
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
                to={`/templates/${template.id}`}
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