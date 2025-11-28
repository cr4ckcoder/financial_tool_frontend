import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../lib/api';
import { Users, UserPlus, Shield, Building2, Link as LinkIcon } from 'lucide-react';

interface Company {
  id: number;
  legal_name: string;
}

interface User {
  id: number;
  username: string;
  role: string;
  assigned_companies: Company[];
}

export default function Staff() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Forms
  const userForm = useForm();
  const assignForm = useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, compRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/companies/')
      ]);
      setUsers(usersRes.data);
      setCompanies(compRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (data: any) => {
    try {
      await api.post('/auth/register', data);
      setShowUserModal(false);
      userForm.reset();
      fetchData();
      alert('User created successfully');
    } catch (e: any) {
      alert('Error creating user: ' + (e.response?.data?.detail || e.message));
    }
  };

  const handleAssign = async (data: any) => {
    if (!selectedUser) return;
    try {
      await api.post('/auth/assign', {
        user_id: selectedUser.id,
        company_id: Number(data.company_id)
      });
      setShowAssignModal(false);
      assignForm.reset();
      fetchData();
      alert('Company assigned successfully');
    } catch (e: any) {
      alert('Error assigning company');
    }
  };

  const openAssignModal = (user: User) => {
    setSelectedUser(user);
    setShowAssignModal(true);
  };

  if (loading) return <div>Loading Staff...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Users className="mr-3 text-indigo-600" /> Staff Management
        </h1>
        <button 
          onClick={() => setShowUserModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition"
        >
          <UserPlus size={18} className="mr-2" /> New Staff
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Assigned Companies</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900">{user.username}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.role === 'ADMIN' ? (
                    <span className="text-gray-400 italic text-sm">All Access (Admin)</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {user.assigned_companies.length === 0 && <span className="text-gray-400 text-sm">No assignments</span>}
                      {user.assigned_companies.map(c => (
                        <span key={c.id} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded border border-gray-200 flex items-center">
                          <Building2 size={10} className="mr-1" /> {c.legal_name}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {user.role !== 'ADMIN' && (
                    <button 
                      onClick={() => openAssignModal(user)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium flex items-center justify-end w-full"
                    >
                      <LinkIcon size={14} className="mr-1" /> Assign Access
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- CREATE USER MODAL --- */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Register New User</h2>
            <form onSubmit={userForm.handleSubmit(handleCreateUser)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input {...userForm.register('username', { required: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" {...userForm.register('password', { required: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select {...userForm.register('role')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ASSIGN COMPANY MODAL --- */}
      {showAssignModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-1">Assign Access</h2>
            <p className="text-sm text-gray-500 mb-4">Select a company for <strong>{selectedUser.username}</strong></p>
            
            <form onSubmit={assignForm.handleSubmit(handleAssign)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <select {...assignForm.register('company_id', { required: true })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">Select Company...</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.legal_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}