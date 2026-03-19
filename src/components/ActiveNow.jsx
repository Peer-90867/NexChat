import { motion } from 'framer-motion';
import { UserAvatar } from './UserAvatar';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const ActiveNow = ({ onlineUsers, profile, setActiveDM, setActiveRoom }) => {
  const [onlineProfiles, setOnlineProfiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOnlineProfiles = async () => {
      if (!supabase || !profile || !onlineUsers) return;
      
      const onlineIds = Array.from(onlineUsers.keys()).filter(id => id !== profile.id);
      if (onlineIds.length === 0) {
        setOnlineProfiles([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, status')
          .in('id', onlineIds);

        if (error) throw error;
        setOnlineProfiles(data);
      } catch (error) {
        console.error('Error fetching online profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOnlineProfiles();
  }, [onlineUsers, profile]);

  if (onlineProfiles.length === 0 && !loading) return null;

  return (
    <div className="mb-6">
      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Active Now</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="flex-shrink-0 w-12 h-12 rounded-full bg-white/5 animate-pulse" />
          ))
        ) : (
          onlineProfiles.map(user => (
            <motion.button
              key={user.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setActiveDM(user); setActiveRoom(null); }}
              className="flex-shrink-0 relative group"
            >
              <UserAvatar 
                user={user} 
                size="md" 
                isOnline={true} 
                status={onlineUsers.get(user.id)?.status || user.status} 
              />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-black/80 text-[8px] text-white px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {user.full_name.split(' ')[0]}
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
};
