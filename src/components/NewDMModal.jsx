import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Search, UserPlus } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { UserAvatar } from './UserAvatar';

export const NewDMModal = ({ onClose, onSelect, onlineUsers }) => {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [onlineProfiles, setOnlineProfiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      if (!supabase || !profile || !onlineUsers) return;
      
      const onlineIds = Array.from(onlineUsers.keys()).filter(id => id !== profile.id);
      if (onlineIds.length === 0) {
        setOnlineProfiles([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, status')
          .in('id', onlineIds);

        if (error) throw error;
        setOnlineProfiles(data);
      } catch (error) {
        console.error('Error fetching online profiles:', error);
      }
    };

    if (!search.trim()) {
      fetchOnlineUsers();
    }
  }, [onlineUsers, profile, search]);

  useEffect(() => {
    const searchUsers = async () => {
      if (!search.trim() || !supabase || !profile) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        if (!profile?.id) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .or(`full_name.ilike.%${search}%,username.ilike.%${search}%`)
          .neq('id', profile.id)
          .limit(10);

        if (error) throw error;
        setUsers(data);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [search, profile]);

  const displayUsers = search.trim() ? users : onlineProfiles;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#111111] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-purple-500" />
            New Direct Message
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 shrink-0 border-b border-white/5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-xl bg-[#1a1a1a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Search users by name..."
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {!search.trim() && onlineProfiles.length > 0 && (
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4 px-2">Online Now</h3>
          )}
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
            </div>
          ) : displayUsers.length > 0 ? (
            <div className="space-y-2">
              {displayUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => onSelect(user)}
                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                >
                  <UserAvatar 
                    user={user} 
                    size="md" 
                    isOnline={onlineUsers ? onlineUsers.has(user.id) : false} 
                    status={onlineUsers ? (onlineUsers.get(user.id)?.status || user.status) : user.status} 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate group-hover:text-purple-400 transition-colors">
                      {user.full_name}
                    </p>
                    {user.username && (
                      <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : search.trim() ? (
            <div className="text-center py-8 text-gray-500">
              No users found matching "{search}"
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No users are currently online.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
