import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { 
  ArrowLeft, Save, Plus, Trash2, ArrowUp, ArrowDown, 
  Type, Users, FileText, AlertCircle 
} from 'lucide-react';

interface DocBlock {
  type: 'text' | 'signatories';
  content?: string; // For text blocks
  title?: string;   // For signatory blocks
}

export default function DocumentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [blocks, setBlocks] = useState<DocBlock[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const res = await api.get('/compliance/templates');
      const tmpl = res.data.find((t: any) => t.id === Number(id));
      if (tmpl) {
        setName(tmpl.name);
        if (tmpl.template_definition) {
          setBlocks(tmpl.template_definition); // Already parsed by axios/backend
        } else {
          // Convert legacy HTML to a single text block
          setBlocks([{ type: 'text', content: tmpl.content_html }]);
        }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // --- Builder Actions ---
  const addBlock = (type: 'text' | 'signatories') => {
    if (type === 'text') setBlocks([...blocks, { type: 'text', content: '<p>Write your content here...</p>' }]);
    if (type === 'signatories') setBlocks([...blocks, { type: 'signatories', title: 'For {{client.company.name}}' }]);
  };

  const updateBlock = (index: number, field: string, value: string) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], [field]: value };
    setBlocks(newBlocks);
  };

  const moveBlock = (index: number, dir: 'up' | 'down') => {
    if ((dir === 'up' && index === 0) || (dir === 'down' && index === blocks.length - 1)) return;
    const newBlocks = [...blocks];
    const target = dir === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const deleteBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name) return alert("Please enter a template name");
    try {
      const payload = {
        name,
        template_definition: blocks,
        content_html: "" // Legacy field, can be empty for new templates
      };
      await api.post('/compliance/templates', payload);
      alert("Template Saved!");
      navigate('/settings'); // Or wherever you list templates
    } catch (e) {
      alert("Failed to save");
    }
  };

  // Variable Helper
  const insertVariable = (index: number, variable: string) => {
    const block = blocks[index];
    if(block.type === 'text') {
      updateBlock(index, 'content', (block.content || '') + variable);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700"><ArrowLeft size={20}/></button>
          <h1 className="text-xl font-bold text-gray-800">Document Editor</h1>
        </div>
        <div className="flex items-center space-x-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Template Name" className="border-b border-gray-300 px-2 py-1 outline-none font-medium w-64" />
          <button onClick={handleSave} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700"><Save size={18} className="mr-2"/> Save</button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-20">
          {blocks.map((block, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm group relative">
              <div className="absolute -left-3 top-4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => moveBlock(idx, 'up')} className="bg-gray-100 p-1 rounded hover:bg-indigo-100"><ArrowUp size={14}/></button>
                <button onClick={() => moveBlock(idx, 'down')} className="bg-gray-100 p-1 rounded hover:bg-indigo-100"><ArrowDown size={14}/></button>
              </div>
              
              {/* TEXT BLOCK */}
              {block.type === 'text' && (
                <div>
                  <div className="flex justify-between mb-2">
                    <div className="text-xs font-bold text-gray-400 uppercase flex items-center"><Type size={14} className="mr-1"/> Text Block</div>
                    <div className="flex gap-2">
                      <span className="text-xs text-gray-400 cursor-pointer hover:text-indigo-600" onClick={() => insertVariable(idx, ' {{client.company.name}} ')}>+ Company Name</span>
                      <span className="text-xs text-gray-400 cursor-pointer hover:text-indigo-600" onClick={() => insertVariable(idx, ' {{assignment.financialyear}} ')}>+ FY</span>
                    </div>
                  </div>
                  <textarea 
                    value={block.content} 
                    onChange={(e) => updateBlock(idx, 'content', e.target.value)} 
                    className="w-full p-3 border rounded text-sm h-40 font-mono"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Supports HTML tags like &lt;b&gt;, &lt;br&gt;, &lt;p&gt;</p>
                </div>
              )}

              {/* SIGNATORY BLOCK */}
              {block.type === 'signatories' && (
                <div className="bg-indigo-50 p-4 rounded border border-indigo-100">
                  <div className="flex justify-between mb-2">
                     <div className="text-xs font-bold text-indigo-600 uppercase flex items-center"><Users size={14} className="mr-1"/> Signatories Loop</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="text-sm text-gray-600">Section Title:</label>
                    <input 
                      value={block.title} 
                      onChange={(e) => updateBlock(idx, 'title', e.target.value)}
                      className="border rounded px-2 py-1 text-sm flex-1"
                    />
                  </div>
                  <p className="text-xs text-indigo-400 mt-2">This block will repeat for each selected signatory during generation.</p>
                </div>
              )}

              <button onClick={() => deleteBlock(idx)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
            </div>
          ))}

          <div className="flex justify-center gap-4 py-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
            <button onClick={() => addBlock('text')} className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50"><Type size={16} className="mr-2"/> Add Text</button>
            <button onClick={() => addBlock('signatories')} className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50"><Users size={16} className="mr-2"/> Add Signatories</button>
          </div>
        </div>
      </div>
    </div>
  );
}