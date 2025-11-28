import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../lib/api';
import { 
  ArrowLeft, Save, Plus, Trash2, ArrowUp, ArrowDown, 
  FileText, Heading, Calculator, Layout, GripVertical 
} from 'lucide-react';

// Types matching your Backend Schema
interface TemplateItem {
  type: 'header_block' | 'title' | 'financial_line_item' | 'subtotal';
  text?: string;      // For headers/titles
  label?: string;     // For lines/subtotals
  account_head_id?: number;
  note_ref?: string;
  id?: number;        // For subtotals (special IDs like 999)
  mandatory?: boolean;
}

interface Account {
  id: number;
  name: string;
  type: string;
}

export default function TemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Form for Metadata (Name, Type)
  const { register, handleSubmit, setValue } = useForm();
  
  // State for the Visual Builder
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // Fetch Accounts for the dropdowns
      const accRes = await api.get('/accounts/');
      setAccounts(accRes.data);

      if (id) {
        // Fetch existing template if editing
        const tplRes = await api.get('/templates/');
        const template = tplRes.data.find((t: any) => t.id === Number(id));
        
        if (template) {
          setValue('name', template.name);
          setValue('statement_type', template.statement_type);
          
          // Parse the definition if it's a string, else use as is
          let def = template.template_definition;
          if (typeof def === 'string') def = JSON.parse(def);
          setItems(def);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- Builder Actions ---

  const addItem = (type: TemplateItem['type']) => {
    const newItem: TemplateItem = { type };
    if (type === 'header_block') newItem.text = "NEW PAGE HEADER";
    if (type === 'title') newItem.text = "New Section Title";
    if (type === 'financial_line_item') {
      newItem.label = "Line Item Name";
      newItem.account_head_id = 0;
      newItem.mandatory = false;
    }
    if (type === 'subtotal') {
      newItem.label = "Total Name";
      newItem.id = 0; // User must set a special ID or we auto-gen logic later
      newItem.mandatory = true;
    }
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, field: keyof TemplateItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const deleteItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;
    
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setItems(newItems);
  };

  // --- Save Logic ---

  const onSave = async (metadata: any) => {
    try {
      const payload = {
        name: metadata.name,
        statement_type: metadata.statement_type,
        template_definition: items // Send the array directly
      };

      // Since backend doesn't support PUT on ID yet, we POST (Create New)
      // If you added PUT support, you'd check 'id' here.
      await api.post('/templates/', payload);
      alert('Template saved successfully!');
      navigate('/templates');
    } catch (e) {
      alert('Failed to save template');
    }
  };

  // Filter accounts for dropdown (Heads & Categories mostly)
  const filteredAccounts = useMemo(() => {
    return accounts.sort((a, b) => a.name.localeCompare(b.name));
  }, [accounts]);

  if (loading) return <div>Loading Builder...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/templates')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{id ? 'Edit Template' : 'New Template'}</h1>
            <p className="text-xs text-gray-500">Visual Builder</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 font-semibold uppercase">Template Name</label>
            <input 
              {...register('name', { required: true })} 
              className="border-b border-gray-300 focus:border-indigo-500 outline-none px-1 py-0.5 w-64 bg-transparent font-medium"
              placeholder="e.g. Balance Sheet 2024"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 font-semibold uppercase">Type</label>
            <select 
              {...register('statement_type', { required: true })} 
              className="border-b border-gray-300 focus:border-indigo-500 outline-none px-1 py-0.5 bg-transparent text-sm"
            >
              <option value="BALANCE_SHEET">Balance Sheet</option>
              <option value="PROFIT_LOSS">Profit & Loss</option>
              <option value="CASH_FLOW">Cash Flow</option>
              <option value="FULL_SET">Full Set</option>
            </select>
          </div>
          <button 
            onClick={handleSubmit(onSave)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition shadow-sm"
          >
            <Save size={18} className="mr-2" /> Save
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* LEFT: Builder Canvas (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-20">
          {items.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
              <p className="text-gray-400">Your template is empty.</p>
              <p className="text-sm text-gray-400">Click a button on the right to add items.</p>
            </div>
          )}

          {items.map((item, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition group relative">
              
              {/* Type Badge & Drag Handle Visual */}
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" 
                style={{ backgroundColor: getItemColor(item.type) }}></div>
              
              <div className="flex items-start gap-3">
                {/* Controls */}
                <div className="flex flex-col space-y-1 pt-1 text-gray-400">
                  <button onClick={() => moveItem(idx, 'up')} className="hover:text-indigo-600"><ArrowUp size={14}/></button>
                  <GripVertical size={14} className="cursor-grab" />
                  <button onClick={() => moveItem(idx, 'down')} className="hover:text-indigo-600"><ArrowDown size={14}/></button>
                </div>

                {/* Content based on Type */}
                <div className="flex-1 grid gap-3">
                  
                  {/* HEADER BLOCK */}
                  {item.type === 'header_block' && (
                    <div>
                      <div className="flex items-center text-xs font-bold text-gray-500 uppercase mb-1">
                        <Layout size={12} className="mr-1"/> Page Header / Break
                      </div>
                      <input 
                        value={item.text} 
                        onChange={(e) => updateItem(idx, 'text', e.target.value)}
                        className="w-full font-bold text-lg border-b border-dashed border-gray-300 focus:border-indigo-500 outline-none pb-1"
                        placeholder="Report Title (e.g. BALANCE SHEET)"
                      />
                    </div>
                  )}

                  {/* SECTION TITLE */}
                  {item.type === 'title' && (
                    <div>
                      <div className="flex items-center text-xs font-bold text-gray-500 uppercase mb-1">
                        <Heading size={12} className="mr-1"/> Section Title
                      </div>
                      <input 
                        value={item.text} 
                        onChange={(e) => updateItem(idx, 'text', e.target.value)}
                        className="w-full font-semibold border-b border-gray-200 focus:border-indigo-500 outline-none pb-1"
                        placeholder="Section Name (e.g. Current Assets)"
                      />
                    </div>
                  )}

                  {/* FINANCIAL LINE ITEM */}
                  {item.type === 'financial_line_item' && (
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-6">
                        <label className="text-[10px] uppercase font-bold text-gray-400">Label</label>
                        <input 
                          value={item.label} 
                          onChange={(e) => updateItem(idx, 'label', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="text-[10px] uppercase font-bold text-gray-400">Mapped Account</label>
                        <select 
                            value={item.account_head_id || ""} 
                            onChange={(e) => {
                                const newId = Number(e.target.value);
                                const acc = accounts.find(a => a.id === newId);
                                
                                // Smart Label Logic:
                                // If label is empty OR label matches the OLD account name (meaning user didn't customize it),
                                // update it to the NEW account name.
                                const oldAcc = accounts.find(a => a.id === item.account_head_id);
                                const currentLabel = item.label || "";
                                
                                // Check if label appears customized
                                const isDefaultLabel = currentLabel === "" || currentLabel === "Line Item Name" || (oldAcc && currentLabel === oldAcc.name);
                                
                                // Update State
                                const newItems = [...items];
                                newItems[idx] = { 
                                ...newItems[idx], 
                                account_head_id: newId,
                                // Auto-update label if it wasn't customized
                                label: (isDefaultLabel && acc) ? acc.name : currentLabel
                                };
                                setItems(newItems);
                            }}
                            className="w-full border rounded px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                            >
                            <option value="">Select Account...</option>
                            {filteredAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                            ))}
                            </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] uppercase font-bold text-gray-400">Note Ref</label>
                        <input 
                          value={item.note_ref || ""} 
                          onChange={(e) => updateItem(idx, 'note_ref', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm text-center" 
                          placeholder="e.g. 10A"
                        />
                      </div>
                      <div className="col-span-12 flex items-center">
                        <input 
                          type="checkbox" 
                          checked={item.mandatory || false} 
                          onChange={(e) => updateItem(idx, 'mandatory', e.target.checked)}
                          id={`mandatory-${idx}`}
                          className="mr-2 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor={`mandatory-${idx}`} className="text-xs text-gray-600 cursor-pointer select-none">
                          Mandatory (Show even if zero)
                        </label>
                      </div>
                    </div>
                  )}

                  {/* SUBTOTAL */}
                  {item.type === 'subtotal' && (
                    <div className="grid grid-cols-12 gap-3 bg-gray-50 p-2 rounded">
                      <div className="col-span-8">
                        <label className="text-[10px] uppercase font-bold text-gray-400">Total Label</label>
                        <input 
                          value={item.label} 
                          onChange={(e) => updateItem(idx, 'label', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm font-bold"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="text-[10px] uppercase font-bold text-gray-400">System ID</label>
                        <input 
                          type="number"
                          value={item.id || ""} 
                          onChange={(e) => updateItem(idx, 'id', Number(e.target.value))}
                          className="w-full border rounded px-2 py-1 text-sm" 
                          placeholder="e.g. 1000"
                        />
                      </div>
                    </div>
                  )}

                </div>

                {/* Delete Button */}
                <button 
                  onClick={() => deleteItem(idx)}
                  className="text-gray-300 hover:text-red-500 p-1 self-start"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT: Toolbar (Fixed) */}
        <div className="w-64 flex flex-col space-y-3">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-4">
            <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">Toolbox</h3>
            
            <button onClick={() => addItem('header_block')} className="w-full flex items-center p-3 mb-2 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition text-left group">
              <Layout size={20} className="text-gray-400 group-hover:text-indigo-600 mr-3" />
              <div>
                <div className="font-semibold text-gray-800 text-sm">Page Header</div>
                <div className="text-[10px] text-gray-500">Start new page/report</div>
              </div>
            </button>

            <button onClick={() => addItem('title')} className="w-full flex items-center p-3 mb-2 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition text-left group">
              <Heading size={20} className="text-gray-400 group-hover:text-blue-600 mr-3" />
              <div>
                <div className="font-semibold text-gray-800 text-sm">Section Title</div>
                <div className="text-[10px] text-gray-500">e.g. "Current Assets"</div>
              </div>
            </button>

            <button onClick={() => addItem('financial_line_item')} className="w-full flex items-center p-3 mb-2 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition text-left group">
              <FileText size={20} className="text-gray-400 group-hover:text-green-600 mr-3" />
              <div>
                <div className="font-semibold text-gray-800 text-sm">Line Item</div>
                <div className="text-[10px] text-gray-500">Map to an account</div>
              </div>
            </button>

            <button onClick={() => addItem('subtotal')} className="w-full flex items-center p-3 mb-2 rounded-lg border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition text-left group">
              <Calculator size={20} className="text-gray-400 group-hover:text-orange-600 mr-3" />
              <div>
                <div className="font-semibold text-gray-800 text-sm">Total / Calculation</div>
                <div className="text-[10px] text-gray-500">Sum of previous section</div>
              </div>
            </button>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800">
            <strong>Tip:</strong> Use the arrow buttons on the left of each item to reorder them.
          </div>
        </div>

      </div>
    </div>
  );
}

// Helper for visual coloring
function getItemColor(type: string) {
  switch (type) {
    case 'header_block': return '#6366f1'; // Indigo
    case 'title': return '#3b82f6'; // Blue
    case 'financial_line_item': return '#10b981'; // Green
    case 'subtotal': return '#f97316'; // Orange
    default: return '#ccc';
  }
}