import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../lib/api';
import { 
  ArrowLeft, Upload, CheckCircle, FileText, Download, 
  Eye, Save, Search, RefreshCw, Plus, Layers, Building, 
  ShieldCheck, Lock, AlertTriangle, CheckCircle2, History, 
  FileCheck, X, Star, ChevronRight 
} from 'lucide-react';

// --- Types ---

interface Unit { id: number; unit_name: string; }
interface Work { id: number; company_id: number; status: string; units: Unit[]; udin_number?: string; signing_date?: string; }
interface Entry { id: number; account_name: string; debit: number; credit: number; closing_balance: number; }
interface Account { id: number; name: string; type: string; }
interface Template { id: number; name: string; statement_type: string; applicable_client_types?: string[]; }
interface ComplianceTemplate { id: number; name: string; }
interface PreviewData { company_name: string; template_def: any[]; balances: Record<string, number>; notes_data: any[]; note_map: Record<string, string>; }

export default function WorkDetails() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'map' | 'report' | 'preview' | 'documents'>('map');
  const [loading, setLoading] = useState(true);
  
  // Work & Data State
  const [work, setWork] = useState<Work | null>(null);
  const [clientType, setClientType] = useState<string>("");
  const [activeUnitId, setActiveUnitId] = useState<number | 'consolidated'>('consolidated');
  
  const [unmapped, setUnmapped] = useState<Entry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [complianceTemplates, setComplianceTemplates] = useState<ComplianceTemplate[]>([]);
  const [validation, setValidation] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  
  // Preview & Edit State (Financials)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<number | null>(null);
  const [customNotes, setCustomNotes] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState(false);
  
  // Document Preview State (Compliance)
  const [docPreviewHtml, setDocPreviewHtml] = useState<string | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);

  // Actions State
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const unitForm = useForm();
  const finalizeForm = useForm();

  useEffect(() => { 
    fetchWorkData(); 
  }, [id]);

  useEffect(() => {
    if (activeUnitId !== 'consolidated') fetchVersions(activeUnitId as number);
    else setVersions([]);
  }, [activeUnitId]);

  const fetchWorkData = async () => {
    if (activeTab !== 'map') setLoading(true);
    
    try {
      // 1. Fetch Work Details First
      const workRes = await api.get(`/works/${id}`);
      setWork(workRes.data);
      
      // 2. Fetch Company Details for Client Type
      const compRes = await api.get(`/companies/${workRes.data.company_id}`);
      setClientType(compRes.data.client_type);

      // 3. Parallel Fetch for Lists
      // Using Promise.allSettled to ensure one failure doesn't break the whole page
      const results = await Promise.allSettled([
        api.get(`/works/${id}/unmapped-entries`),
        api.get(`/accounts/`),
        api.get(`/templates/`),
        api.get(`/works/${id}/validation-stats`),
        api.get(`/compliance/templates`)
      ]);

      if (results[0].status === 'fulfilled') setUnmapped(results[0].value.data);
      if (results[1].status === 'fulfilled') setAccounts(results[1].value.data);
      if (results[2].status === 'fulfilled') setTemplates(results[2].value.data);
      if (results[3].status === 'fulfilled') setValidation(results[3].value.data);
      if (results[4].status === 'fulfilled') setComplianceTemplates(results[4].value.data);
      
    } catch (e) {
      console.error("Critical error fetching work data", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async (unitId: number) => {
    try {
      const res = await api.get(`/works/${id}/units/${unitId}/versions`);
      setVersions(res.data);
    } catch (e) {
      console.error("Failed to fetch versions");
    }
  };

  // --- Actions ---

  const handleAddUnit = async (data: any) => {
    try {
      await api.post(`/works/${id}/units`, data);
      setShowUnitModal(false);
      unitForm.reset();
      // Refresh to get new unit list
      const workRes = await api.get(`/works/${id}`);
      setWork(workRes.data);
      alert('Unit created successfully');
    } catch (e) {
      alert("Failed to create unit");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (activeUnitId === 'consolidated') {
      alert("Please select a specific Unit tab (e.g., Main) to upload data.");
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      await api.post(`/works/${id}/units/${activeUnitId}/trial-balance`, formData);
      alert('Upload Successful! Version incremented.');
      // Refresh data
      const unmappedRes = await api.get(`/works/${id}/unmapped-entries`);
      setUnmapped(unmappedRes.data);
      const valRes = await api.get(`/works/${id}/validation-stats`);
      setValidation(valRes.data);
      fetchVersions(activeUnitId as number);
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
      // Optimistic Update
      setUnmapped(prev => prev.filter(e => e.id !== entryId));
    } catch (e) {
      alert('Mapping failed');
    }
  };

  const handleFinalize = async (data: any) => {
    try {
      const formData = new FormData();
      formData.append('udin', data.udin);
      formData.append('signing_date', data.signing_date);
      if (data.file[0]) {
        formData.append('file', data.file[0]);
      } else {
        alert("Please attach the UDIN Certificate");
        return;
      }

      await api.post(`/works/${id}/finalize`, formData);
      setShowFinalizeModal(false);
      
      // Refresh Work Status
      const workRes = await api.get(`/works/${id}`);
      setWork(workRes.data);
      alert("Work Finalized Successfully!");
    } catch (e: any) {
      alert("Finalization failed: " + (e.response?.data?.detail || e.message));
    }
  };

  // Report Preview
  const fetchPreview = async (templateId: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/works/${id}/preview/${templateId}`);
      setPreviewData(res.data);
      setActiveTemplateId(templateId);
      
      const configRes = await api.get(`/reports/${id}/config`);
      setCustomNotes(configRes.data.custom_notes || {});
      
      setActiveTab('preview');
    } catch (e) {
      alert("Failed to load preview");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (templateId: number, format: string) => {
    const url = `http://localhost:8000/works/${id}/statements/${templateId}?format=${format}`;
    window.open(url, '_blank');
  };

  // Note Editing
  const handleNoteChange = (ref: string, text: string) => {
    setCustomNotes(prev => ({ ...prev, [ref]: text }));
  };

  const persistNotes = async () => {
    setSavingNotes(true);
    try {
      await api.post(`/reports/${id}/config`, { custom_notes: customNotes });
    } catch (e) {
      console.error("Failed to auto-save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  // Compliance Documents
  const handleDocPreview = async (tmplId: number) => {
    try {
      const res = await api.get(`/compliance/${id}/preview/${tmplId}`);
      setDocPreviewHtml(res.data.html);
      setShowDocModal(true);
    } catch (e) {
      alert("Failed to load document preview");
    }
  };

  const handleDocDownload = (tmplId: number) => {
    const url = `http://localhost:8000/compliance/${id}/download/${tmplId}`;
    window.open(url, '_blank');
  };

  // --- Helpers ---

  const isFinalized = work?.status === 'FINALIZED';

  const subHeadAccounts = useMemo(() => {
    return accounts
      .filter(a => a.type === 'SUB_HEAD')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [accounts]);

  const filteredEntries = unmapped.filter(e => 
    e.account_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Smart Template Filters
  const recommendedTemplates = templates.filter(t => 
    (!t.applicable_client_types || t.applicable_client_types.length === 0) || 
    t.applicable_client_types.includes(clientType)
  );
  
  const otherTemplates = templates.filter(t => 
    t.applicable_client_types && 
    t.applicable_client_types.length > 0 && 
    !t.applicable_client_types.includes(clientType)
  );

  if (loading) return (
    <div className="flex items-center justify-center h-full text-gray-500">
      <div className="animate-pulse flex flex-col items-center">
        <RefreshCw size={32} className="animate-spin mb-2" />
        Loading Workspace...
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      
      {/* Validation Banner */}
      {validation && (
        <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
                <ValidationItem label="Trial Balance" diff={validation.tb.difference} successMsg="Tallied" errorMsg={`Diff: ${validation.tb.difference.toFixed(2)}`} />
                <div className="h-4 w-px bg-gray-300"></div>
                <ValidationItem label="Balance Sheet" diff={validation.bs.difference} successMsg="Matched" errorMsg={`Diff: ${validation.bs.difference.toFixed(2)}`} />
            </div>
            <div className="text-xs text-gray-400">
                Last check: {new Date().toLocaleTimeString()}
            </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 mt-4">
        <div className="flex items-center space-x-4">
          <Link to="/works" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-800">Work #{id} Workspace</h1>
              {isFinalized && (
                 <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded flex items-center border border-green-200">
                   <Lock size={12} className="mr-1"/> FINALIZED
                 </span>
              )}
            </div>
            {work && (
              <div className="flex space-x-3 text-xs mt-1 text-gray-500">
                 <span className="flex items-center"><Building size={12} className="mr-1"/> {work.units.length} Units</span>
                 {work.udin_number && <span className="font-mono text-gray-600">UDIN: {work.udin_number}</span>}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {!isFinalized && (
            <button 
              onClick={() => setShowFinalizeModal(true)}
              className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium shadow-sm"
            >
              <ShieldCheck size={16} className="mr-2" /> Finalize Work
            </button>
          )}
          
          <div className="flex bg-gray-100 rounded-lg p-1">
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
            <button 
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'documents' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Documents
            </button>
            {activeTab === 'preview' && (
              <button className="px-4 py-2 rounded-md text-sm font-medium bg-white shadow text-indigo-600">
                Preview & Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- MAPPING TAB --- */}
      {activeTab === 'map' && work && (
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          
          {/* Units Tab Bar */}
          <div className="flex items-center border-b border-gray-200 bg-white px-4 pt-2">
            <button
              onClick={() => setActiveUnitId('consolidated')}
              className={`mr-6 pb-2 text-sm font-medium border-b-2 transition ${
                activeUnitId === 'consolidated' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Layers size={14} className="inline mr-2"/> Consolidated View
            </button>
            
            {work.units.map(unit => (
              <button
                key={unit.id}
                onClick={() => setActiveUnitId(unit.id)}
                className={`mr-6 pb-2 text-sm font-medium border-b-2 transition ${
                  activeUnitId === unit.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {unit.unit_name}
              </button>
            ))}

            {!isFinalized && (
              <button 
                onClick={() => setShowUnitModal(true)}
                className="ml-auto mb-2 text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100 transition flex items-center"
              >
                <Plus size={12} className="mr-1"/> Add Unit
              </button>
            )}
          </div>

          <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
            
            {/* Left Panel */}
            <div className="lg:w-1/3 flex flex-col space-y-6">
              
              {activeUnitId !== 'consolidated' ? (
                 <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 ${isFinalized ? 'opacity-50 pointer-events-none' : ''}`}>
                  <h2 className="font-semibold text-gray-700 mb-4 flex items-center">
                    <Upload size={18} className="mr-2" /> Upload Data
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
                      className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Upload CSV (Creates New Version)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <h3 className="text-blue-800 font-bold mb-2 flex items-center"><Layers size={18} className="mr-2"/> Consolidated Mode</h3>
                  <p className="text-sm text-blue-600">
                    You are viewing the aggregated data from all units. 
                    Switch to a specific Unit tab to upload new Trial Balance files.
                  </p>
                </div>
              )}

              {/* Version History */}
              {activeUnitId !== 'consolidated' && (
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-700 mb-3 flex items-center text-sm">
                          <History size={16} className="mr-2"/> Version History
                      </h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                          {versions.map((v, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded">
                                  <span className="font-medium text-gray-700">Version {v.version}</span>
                                  <span className="text-gray-500">{v.count} rows</span>
                                  {idx === 0 && <span className="text-green-600 font-bold px-1 bg-green-50 rounded">Current</span>}
                              </div>
                          ))}
                          {versions.length === 0 && <div className="text-gray-400 text-xs italic">No uploads yet.</div>}
                      </div>
                  </div>
              )}
              
              {/* Stats */}
              <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 flex-1">
                <h3 className="text-indigo-800 font-bold mb-2">Mapping Stats</h3>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-indigo-600">Pending Items</span>
                  <span className="text-xl font-bold text-indigo-900">{unmapped.length}</span>
                </div>
                <p className="text-xs text-indigo-500 mt-4">
                  Aggregated from latest unit versions.
                </p>
              </div>
            </div>

            {/* Right: Mapping List */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="font-semibold text-gray-700">
                  {activeUnitId === 'consolidated' ? 'Consolidated Unmapped' : 'Unit Unmapped'}
                </h2>
                
                {activeUnitId === 'consolidated' && (
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search entries..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-auto p-4 space-y-3">
                {activeUnitId !== 'consolidated' ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <CheckCircle size={48} className="mb-4 text-gray-200" />
                    <p>Switch to <strong>Consolidated View</strong> to map.</p>
                  </div>
                ) : filteredEntries.length === 0 ? (
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
                        disabled={isFinalized}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- REPORTS TAB --- */}
      {activeTab === 'report' && (
        <div className="flex flex-col space-y-6 overflow-y-auto p-1">
          {/* Recommended */}
          <div>
            <h3 className="text-sm font-bold text-indigo-600 uppercase mb-3 flex items-center">
              <Star size={16} className="mr-2 fill-indigo-600"/> Recommended for {clientType?.replace('_', ' ')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedTemplates.map(template => (
                <TemplateCard key={template.id} template={template} onPreview={fetchPreview} onDownload={handleDownload} />
              ))}
              {recommendedTemplates.length === 0 && <p className="text-gray-400 text-sm italic">No specific templates found.</p>}
            </div>
          </div>

          {/* Others */}
          {otherTemplates.length > 0 && (
            <details className="group">
              <summary className="flex items-center cursor-pointer list-none text-sm font-bold text-gray-500 hover:text-gray-700 mb-3">
                <ChevronRight size={16} className="mr-2 transition-transform group-open:rotate-90"/> Other Templates
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pl-4 border-l-2 border-gray-100">
                {otherTemplates.map(template => (
                  <TemplateCard key={template.id} template={template} onPreview={fetchPreview} onDownload={handleDownload} opacity="opacity-75 hover:opacity-100" />
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* --- DOCUMENTS TAB --- */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto p-1">
          {complianceTemplates.length === 0 && <div className="col-span-full text-gray-400 text-center py-10">No document templates found. Add them in Settings.</div>}
          {complianceTemplates.map(doc => (
            <div key={doc.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-purple-100 p-3 rounded-lg"><FileCheck size={24} className="text-purple-600" /></div>
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-500">DOC</span>
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-4">{doc.name}</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleDocPreview(doc.id)} className="flex items-center justify-center bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition text-sm">
                  <Eye size={16} className="mr-2" /> Preview
                </button>
                <button onClick={() => handleDocDownload(doc.id)} className="flex items-center justify-center border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition text-sm">
                  <Download size={16} className="mr-2" /> PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- PREVIEW TAB --- */}
      {activeTab === 'preview' && previewData && (
        <div className="flex-1 flex flex-col bg-gray-100/50 rounded-xl overflow-hidden border border-gray-200">
          {/* Toolbar */}
          <div className="p-3 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10 sticky top-0">
            <span className="text-sm font-semibold text-gray-700 flex items-center">
              {savingNotes ? <RefreshCw size={14} className="animate-spin mr-2"/> : <Save size={14} className="mr-2 text-green-500"/>}
              {savingNotes ? 'Saving changes...' : 'Changes saved'}
            </span>
            <div className="flex space-x-2">
              <button onClick={() => handleDownload(activeTemplateId!, 'pdf')} className="bg-red-600 text-white px-3 py-1.5 rounded text-sm flex items-center hover:bg-red-700">
                <Download size={14} className="mr-1" /> PDF
              </button>
              <button onClick={() => handleDownload(activeTemplateId!, 'xlsx')} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm flex items-center hover:bg-green-700">
                <Download size={14} className="mr-1" /> Excel
              </button>
            </div>
          </div>

          {/* Preview Canvas */}
          <div className="flex-1 overflow-auto p-8 flex flex-col items-center gap-8 bg-gray-200/50">
             <PreviewPageRenderer 
               previewData={previewData} 
               customNotes={customNotes} 
               handleNoteChange={handleNoteChange} 
               persistNotes={persistNotes} 
             />
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Unit Modal */}
      {showUnitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Add Business Unit</h2>
            <form onSubmit={unitForm.handleSubmit(handleAddUnit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Name</label>
                <input {...unitForm.register('unit_name', { required: true })} placeholder="e.g. Mumbai Branch" className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowUnitModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Finalize Modal */}
      {showFinalizeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Finalize Work</h2>
              <ShieldCheck className="text-green-600" size={24} />
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Finalizing locks this work from further edits. You must provide a valid UDIN.
            </p>
            <form onSubmit={finalizeForm.handleSubmit(handleFinalize)} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">UDIN Number</label>
                <input 
                  {...finalizeForm.register('udin', { required: true, pattern: /^\d{2}\d{6}[A-Z0-9]{10}$/ })} 
                  placeholder="e.g. 24123456AAAAAA1234"
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-mono uppercase" 
                />
                {finalizeForm.formState.errors.udin && <p className="text-xs text-red-500 mt-1">Invalid UDIN Format</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Signing Date</label>
                <input 
                  type="date" 
                  {...finalizeForm.register('signing_date', { required: true })} 
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Upload Certificate</label>
                <input 
                  type="file" 
                  accept=".pdf,.jpg,.png"
                  {...finalizeForm.register('file', { required: true })}
                  className="text-sm text-gray-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setShowFinalizeModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md">
                  Verify & Finalize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {showDocModal && docPreviewHtml && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-10">
          <div className="bg-white w-[210mm] h-full shadow-2xl overflow-hidden flex flex-col relative rounded-lg">
            <button onClick={() => setShowDocModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-red-600 bg-gray-100 rounded-full p-2 z-50"><X size={20}/></button>
            <div className="flex-1 overflow-y-auto p-[15mm]">
               <div dangerouslySetInnerHTML={{ __html: docPreviewHtml }} className="prose max-w-none" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// --- Sub Components ---

function ValidationItem({ label, diff, successMsg, errorMsg }: any) {
    const isValid = Math.abs(diff) < 0.1;
    return (
        <div className="flex items-center">
            <span className="text-gray-500 mr-2 font-medium">{label}:</span>
            {isValid ? (
                <span className="flex items-center text-green-600 font-bold"><CheckCircle2 size={16} className="mr-1"/> {successMsg}</span>
            ) : (
                <span className="flex items-center text-red-600 font-bold animate-pulse"><AlertTriangle size={16} className="mr-1"/> {errorMsg}</span>
            )}
        </div>
    );
}

function TemplateCard({ template, onPreview, onDownload, opacity = "" }: any) {
  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition ${opacity}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="bg-green-100 p-3 rounded-lg"><FileText size={24} className="text-green-600" /></div>
        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-500">{template.statement_type}</span>
      </div>
      <h3 className="font-bold text-gray-800 text-lg mb-1">{template.name}</h3>
      <p className="text-sm text-gray-500 mb-6">Ready to generate.</p>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onPreview(template.id)} className="col-span-2 flex items-center justify-center bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition">
          <Eye size={16} className="mr-2" /> Preview
        </button>
        <button onClick={() => onDownload(template.id, 'pdf')} className="flex items-center justify-center border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition">
          <Download size={16} className="mr-2" /> PDF
        </button>
        <button onClick={() => onDownload(template.id, 'xlsx')} className="flex items-center justify-center border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition">
          <Download size={16} className="mr-2" /> Excel
        </button>
      </div>
    </div>
  );
}

function PreviewPageRenderer({ previewData, customNotes, handleNoteChange, persistNotes }: any) {
  const reportPages = useMemo(() => {
    if (!previewData) return [];
    const pages: any[] = [];
    let currentPage: any[] = [];
    let currentHeader: any = null;

    previewData.template_def.forEach((item: any) => {
      if (item.type === 'header_block') {
        if (currentPage.length > 0 || currentHeader) pages.push({ header: currentHeader, items: currentPage });
        currentHeader = item;
        currentPage = [];
      } else { currentPage.push(item); }
    });
    if (currentPage.length > 0 || currentHeader) pages.push({ header: currentHeader, items: currentPage });
    return pages;
  }, [previewData]);

  return (
    <>
      {reportPages.map((page: any, pageIdx: number) => (
        <div key={pageIdx} className="bg-white w-[210mm] min-h-[297mm] shadow-lg p-[15mm] text-sm text-gray-900 relative">
          <div className="text-center mb-8">
            <h1 className="text-lg font-bold uppercase">{previewData.company_name}</h1>
            <h2 className="text-md font-bold uppercase mt-1">{page.header?.text}</h2>
            <p className="text-xs italic mt-1">(All amounts in Indian Rupees unless otherwise stated)</p>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-y border-black">
                <th className="text-left py-2 font-bold w-1/2">Particulars</th>
                <th className="text-center font-bold">Note</th>
                <th className="text-right font-bold">2024</th>
                <th className="text-right font-bold">2023</th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((item: any, idx: number) => {
                const val = previewData.balances[item.account_head_id || item.id] || 0;
                if (Math.abs(val) < 0.01 && !item.mandatory) return null;
                if (item.type === 'title') return <tr key={idx}><td colSpan={4} className="font-bold pt-4 pb-1 underline">{item.text}</td></tr>;
                return (
                  <tr key={idx} className={item.type === 'subtotal' ? 'font-bold border-y border-black' : 'border-b border-gray-100'}>
                    <td className="py-1 pl-4">{item.label}</td>
                    <td className="text-center">{previewData.note_map[item.note_ref] || ''}</td>
                    <td className="text-right">{Math.abs(val).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td className="text-right">0.00</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="absolute bottom-4 right-8 text-xs text-gray-400">Page {pageIdx + 1}</div>
        </div>
      ))}
      {previewData.notes_data.length > 0 && (
        <div className="bg-white w-[210mm] min-h-[297mm] shadow-lg p-[15mm] text-sm text-gray-900 relative">
          <div className="text-center mb-8">
            <h1 className="text-lg font-bold uppercase">{previewData.company_name}</h1>
            <h2 className="text-md font-bold uppercase mt-1">NOTES TO FINANCIAL STATEMENTS</h2>
            <p className="text-xs italic mt-1">(All amounts in Indian Rupees)</p>
          </div>
          <div className="border-t-2 border-black pt-6">
            {previewData.notes_data.map((note: any) => (
              <div key={note.original_ref} className="mb-8 break-inside-avoid">
                <div className="font-bold mb-2 text-gray-800">Note {note.ref}: {note.title}</div>
                <textarea
                  value={customNotes[note.original_ref] || ""}
                  onChange={(e) => handleNoteChange(note.original_ref, e.target.value)}
                  onBlur={persistNotes} 
                  placeholder="Add narrative text here..."
                  className="w-full p-2 border border-gray-200 rounded text-xs text-gray-600 italic mb-2 focus:ring-1 focus:ring-indigo-500 outline-none resize-none bg-gray-50 hover:bg-white transition"
                  rows={3}
                />
                <div className="ml-4 border-l-2 border-gray-100 pl-4">
                  {note.children.map((child: any, cIdx: number) => (
                    <div key={cIdx} className="flex justify-between py-1 border-b border-dotted border-gray-200">
                      <span>{child.name}</span>
                      <span className="font-mono text-gray-700">{Math.abs(child.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 font-bold border-t border-gray-300 mt-1">
                    <span>Total</span>
                    <span>{Math.abs(note.total).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute bottom-4 right-8 text-xs text-gray-400">Page {reportPages.length + 1}</div>
        </div>
      )}
    </>
  );
}

function MappingRow({ entry, accounts, onMap, disabled }: { entry: Entry, accounts: Account[], onMap: (eid: number, aid: number) => void, disabled: boolean }) {
  const [selectedId, setSelectedId] = useState<number | ''>('');

  return (
    <div className={`p-4 rounded-lg border border-gray-200 transition bg-gray-50 ${disabled ? 'opacity-60' : 'hover:border-indigo-300'}`}>
      <div className="flex justify-between mb-3">
        <span className="font-medium text-gray-800">{entry.account_name}</span>
        <span className={`font-mono font-bold ${entry.closing_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {entry.closing_balance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
        </span>
      </div>
      <div className="flex gap-2">
        <select 
          value={selectedId}
          disabled={disabled}
          onChange={(e) => setSelectedId(Number(e.target.value))}
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="" disabled>Select standard account...</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.name}</option>
          ))}
        </select>
        <button 
          disabled={!selectedId || disabled}
          onClick={() => selectedId && onMap(entry.id, selectedId)}
          className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Map
        </button>
      </div>
    </div>
  );
}