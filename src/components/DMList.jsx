import { Users, Circle } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const DMList = ({ dms, dmsLoading, activeDM, setActiveDM, setActiveRoom, onlineUsers, profile }) => {
  const [onlineProfiles, setOnlineProfiles] = useState([]);
  const [loadingOnline, setLoadingOnline] = useState(false);

  // Get count of online users excluding current user
  const onlineCount = onlineUsers ? Array.from(onlineUsers.keys()).filter(id => id !== profile?.id).length : 0;

  useEffect(() => {
    const fetchOnlineProfiles = async () => {
      if (!supabase || !profile || !onlineUsers) return;
      
      const onlineIds = Array.from(onlineUsers.keys()).filter(id => id !== profile.id);
      if (onlineIds.length === 0) {
        setOnlineProfiles([]);
        return;
      }

      setLoadingOnline(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, status')
          .in('id', onlineIds);

        if (error) throw error;
        setOnlineProfiles(data);
      } catch (error) {
        console.error('Error fetching online profiles for sidebar:', error);
      } finally {
        setLoadingOnline(false);
      }
    };

    fetchOnlineProfiles();
  }, [onlineUsers, profile]);

  return (
    <div className="space-y-6">
      {/* Active Users Section */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Circle className="w-2 h-2 fill-green-500 text-green-500" /> Active Now
          </div>
          <span className="bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded text-[10px]">{onlineCount}</span>
        </h3>
        <div className="space-y-1">
          {loadingOnline ? (
            <div className="px-2 py-1 text-xs text-gray-500">Loading...</div>
          ) : onlineProfiles.length > 0 ? (
            onlineProfiles.map(user => (
              <button
                key={user.id}
                onClick={() => { setActiveDM(user); setActiveRoom(null); }}
                className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm transition-all ${
                  activeDM?.id === user.id 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <UserAvatar 
                  user={user} 
                  size="sm" 
                  isOnline={true} 
                  status={onlineUsers.get(user.id)?.status || user.status} 
                />
                <span className="truncate">{user.full_name}</span>
              </button>
            ))
          ) : (
            <div className="px-2 py-1 text-xs text-gray-500 italic">No users online</div>
          )}
        </div>
      </div>

      {/* Recent Direct Messages Section */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2">
          <Users className="w-3 h-3" /> Recent Chats
        </h3>
        <div className="space-y-1">
          {dmsLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse shrink-0" />
                <div className="h-4 bg-white/5 rounded animate-pulse w-32" />
              </div>
            ))
          ) : dms.length > 0 ? (
            dms.map(dmUser => (
              <button
                key={dmUser.id}
                onClick={() => { setActiveDM(dmUser); setActiveRoom(null); }}
                className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm transition-all ${
                  activeDM?.id === dmUser.id 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <UserAvatar 
                  user={dmUser} 
                  size="sm" 
                  isOnline={onlineUsers.has(dmUser.id)} 
                  status={onlineUsers.get(dmUser.id)?.status} 
                />
                <span className="truncate">{dmUser.full_name}</span>
              </button>
            ))
          ) : (
            <div className="px-2 py-1 text-xs text-gray-500 italic">No recent chats</div>
          )}
        </div>
      </div>
    </div>
  );
};
