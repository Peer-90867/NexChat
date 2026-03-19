import { Users } from 'lucide-react';
import { UserAvatar } from './UserAvatar';

export const DMList = ({ dms, dmsLoading, activeDM, setActiveDM, setActiveRoom, onlineUsers }) => {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2">
        <Users className="w-3 h-3" /> Direct Messages
      </h3>
      <div className="space-y-1">
        {dmsLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse shrink-0" />
              <div className="h-4 bg-white/5 rounded animate-pulse w-32" />
            </div>
          ))
        ) : dms.map(dmUser => (
          <button
            key={dmUser.id}
            onClick={() => { setActiveDM(dmUser); setActiveRoom(null); }}
            className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm transition-colors ${
              activeDM?.id === dmUser.id 
                ? 'bg-purple-600/20 text-purple-400 font-medium' 
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`}
          >
            <UserAvatar user={dmUser} size="sm" isOnline={onlineUsers.has(dmUser.id)} />
            <span className="truncate">{dmUser.full_name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
