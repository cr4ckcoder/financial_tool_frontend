// src/pages/Settings.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../lib/api';
import { Save, Building } from 'lucide-react';

export default function Settings() {
  const { register, handleSubmit, setValue } = useForm();

  useEffect(() => {
    api.get('/settings/').then(res => {
      Object.keys(res.data).forEach(key => setValue(key, res.data[key]));
    });
  }, []);

  const handleSeed = async () => {
    if(!confirm("This will add default templates to the Documents system. Continue?")) return;
    try {
      const res = await api.post('/compliance/seed-defaults');
      alert(`Success! Added ${res.data.templates_added} templates.`);
    } catch (e) {
      alert("Failed to seed templates");
    }
  };
  const onSubmit = async (data: any) => {
    await api.post('/settings/', data);
    alert("Settings Saved");
  };

  return (
    <div className="max-w-2xl mx-auto">
     <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center text-gray-800">
          <Building className="mr-2 text-indigo-600"/> Firm Settings
        </h1>
        <button onClick={handleSeed} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200">
          Initialize Templates
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Firm Name</label>
            <input {...register('firm_name')} className="w-full p-2 border rounded" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">FRN</label>
              <input {...register('firm_registration_number')} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Email</label>
              <input {...register('email')} className="w-full p-2 border rounded" />
            </div>
          </div>
          <div>
             <label className="block text-sm font-bold mb-1">Address</label>
             <textarea {...register('address')} className="w-full p-2 border rounded" rows={3}></textarea>
          </div>
          <button className="bg-indigo-600 text-white px-6 py-2 rounded flex items-center"><Save size={16} className="mr-2"/> Save Settings</button>
        </form>
      </div>
    </div>
  );
}