import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Users, Hash, MessageSquare, Trash2, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, rooms: 0, messages: 0 });
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [roomToDelete, setRoomToDelete] = useState(null);

  // Hardcoded admin credentials as requested
  const ADMIN_ID = 'admin';
  const ADMIN_PASS = 'admin123';

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminId === ADMIN_ID && adminPassword === ADMIN_PASS) {
      setIsAdminAuthenticated(true);
      toast.success('Admin authenticated');
    } else {
      toast.error('Invalid admin credentials');
    }
  };

  useEffect(() => {
    if (!isAdminAuthenticated || !supabase) {
      if (!supabase) setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch stats
        const [{ count: usersCount }, { count: roomsCount }, { count: msgsCount }] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('rooms').select('*', { count: 'exact', head: true }),
          supabase.from('messages').select('*', { count: 'exact', head: true })
        ]);

        setStats({ users: usersCount || 0, rooms: roomsCount || 0, messages: msgsCount || 0 });

        // Fetch rooms
        const { data: roomsData } = await supabase
          .from('rooms')
          .select('*, created_by:profiles(full_name)')
          .order('created_at', { ascending: false });
        setRooms(roomsData || []);

        // Fetch users
        const { data: usersData } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        setUsers(usersData || []);

      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdminAuthenticated]);

  const handleDeleteRoom = async () => {
    if (!roomToDelete || !supabase) return;
    
    try {
      // Delete messages first due to foreign key constraint
      await supabase.from('messages').delete().eq('room_id', roomToDelete);
      const { error } = await supabase.from('rooms').delete().eq('id', roomToDelete);
      
      if (error) throw error;
      
      setRooms(rooms.filter(r => r.id !== roomToDelete));
      toast.success('Room deleted successfully');
    } catch (error) {
      toast.error('Failed to delete room');
      console.error(error);
    } finally {
      setRoomToDelete(null);
    }
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#111111] p-8 rounded-2xl border border-white/10 shadow-2xl"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-500 mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Access</h1>
            <p className="text-gray-400 text-sm">Enter credentials to continue</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Admin ID</label>
              <input
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Enter admin ID"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Enter password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-600/20"
            >
              Authenticate
            </button>
            <button
              type="button"
              onClick={() => navigate('/chat')}
              className="w-full text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Back to Chat
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/chat')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-500" />
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#111111] p-6 rounded-2xl border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Users</p>
              <p className="text-2xl font-bold">{stats.users}</p>
            </div>
          </div>
          <div className="bg-[#111111] p-6 rounded-2xl border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-500">
              <Hash className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Rooms</p>
              <p className="text-2xl font-bold">{stats.rooms}</p>
            </div>
          </div>
          <div className="bg-[#111111] p-6 rounded-2xl border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-500">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Messages</p>
              <p className="text-2xl font-bold">{stats.messages}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Rooms List */}
          <div className="bg-[#111111] rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[600px]">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Hash className="w-5 h-5 text-purple-500" /> Manage Rooms
              </h2>
            </div>
            <div className="overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {rooms.map(room => (
                <div key={room.id} className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl border border-white/5">
                  <div>
                    <h3 className="font-semibold text-white">{room.name}</h3>
                    <p className="text-xs text-gray-400">
                      Created by {room.created_by?.full_name || 'Unknown'} on {format(new Date(room.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <button 
                    onClick={() => setRoomToDelete(room.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Users List */}
          <div className="bg-[#111111] rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[600px]">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" /> Recent Users
              </h2>
            </div>
            <div className="overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-xl border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-500 font-bold">
                    {u.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{u.full_name}</h3>
                    <p className="text-xs text-gray-400">
                      Joined {format(new Date(u.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {roomToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-[#111111] rounded-2xl border border-white/10 shadow-2xl overflow-hidden p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">Delete Room</h2>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this room and all its messages? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRoomToDelete(null)}
                className="flex-1 py-2.5 px-4 border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRoom}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-medium text-white transition-colors"
              >
                Delete Room
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
