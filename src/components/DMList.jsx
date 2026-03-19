import { Users, Circle } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const DMList = ({ dms, dmsLoading, activeDM, setActiveDM, setActiveRoom, onlineUsers, profile }) => {
  return (
    <div className="space-y-6">
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
                <div className="space-y-1 flex-1">
                  <div className="h-4 bg-white/5 rounded animate-pulse w-24" />
                  <div className="h-3 bg-white/5 rounded animate-pulse w-32" />
                </div>
              </div>
            ))
          ) : dms.length > 0 ? (
            dms.map(dmUser => (
              <button
                key={dmUser.id}
                onClick={() => { setActiveDM(dmUser); setActiveRoom(null); }}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl text-sm transition-all ${
                  activeDM?.id === dmUser.id 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <div className="relative shrink-0">
                  <UserAvatar 
                    user={dmUser} 
                    size="sm" 
                    isOnline={onlineUsers.has(dmUser.id)} 
                    status={onlineUsers.get(dmUser.id)?.status} 
                  />
                  {onlineUsers.has(dmUser.id) && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-[#1a1a1a] rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-medium truncate ${activeDM?.id === dmUser.id ? 'text-white' : 'text-gray-200'}`}>
                      {dmUser.full_name}
                    </span>
                    {dmUser.lastMessageTime && (
                      <span className={`text-[10px] shrink-0 ${activeDM?.id === dmUser.id ? 'text-purple-200' : 'text-gray-500'}`}>
                        {new Date(dmUser.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  {dmUser.lastMessage && (
                    <p className={`text-xs truncate ${activeDM?.id === dmUser.id ? 'text-purple-100' : 'text-gray-500'}`}>
                      {dmUser.lastMessage}
                    </p>
                  )}
                </div>
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
