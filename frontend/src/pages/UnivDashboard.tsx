import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, LogOut } from 'lucide-react';
import { api } from '../lib/api';

interface TeacherRecord {
  _id: string;
  email: string;
  name: string;
}

export const UnivDashboard = () => {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/univ/teachers');
      setTeachers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }

    const loadTeachers = async () => {
      try {
        const res = await api.get('/univ/teachers');
        setTeachers(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    void loadTeachers();
  }, [navigate, token]);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/univ/teachers', { name, email, password });
      setName(''); setEmail(''); setPassword('');
      void fetchTeachers();
    } catch {
      alert("Error adding teacher");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure?")) {
      try {
        await api.delete(`/univ/teachers/${id}`);
        void fetchTeachers();
      } catch {
        alert("Error deleting");
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_email');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">University Dashboard</h1>
          <button onClick={logout} className="text-gray-500 hover:text-red-500 flex items-center gap-2 font-medium bg-white px-4 py-2 rounded-lg border shadow-sm">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border shadow-sm h-fit">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-500" /> Add Teacher</h3>
            <form onSubmit={handleAddTeacher} className="space-y-4">
              <input type="text" placeholder="Name" required value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:border-blue-500" />
              <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:border-blue-500" />
              <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:border-blue-500" />
              <button className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700">Add Teacher</button>
            </form>
          </div>

          <div className="md:col-span-2 space-y-4">
            <h3 className="font-semibold text-lg">Manage Teachers</h3>
            {teachers.map(t => (
              <div key={t._id} className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900">{t.name}</h4>
                  <p className="text-sm text-gray-500">{t.email}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleDelete(t._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
            {teachers.length === 0 && <p className="text-gray-500 text-sm italic">No teachers added yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
