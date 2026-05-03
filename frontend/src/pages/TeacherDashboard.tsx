import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export const TeacherDashboard = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) navigate('/auth');
    }, [navigate, token]);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8 font-sans">
            <div className="w-full max-w-4xl flex justify-between items-center mb-12">
                <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
                <button onClick={logout} className="text-gray-500 hover:text-red-500 flex items-center gap-2 font-medium bg-white px-4 py-2 rounded-lg border shadow-sm">
                    <LogOut className="w-4 h-4" /> Logout
                </button>
            </div>

            <div className="text-center space-y-6">
                <h2 className="text-xl font-semibold text-gray-600">The grading module is currently under construction...</h2>
                <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white inline-block">
                    <img
                        src="https://i.imgflip.com/4/3482m7.jpg"
                        alt="Grading Meme"
                        className="max-w-md object-cover"
                    />
                </div>
                <p className="text-gray-400 italic">"When you realize scanning unreadable handwriting is an AI feature, not yours."</p>
            </div>
        </div>
    );
};
