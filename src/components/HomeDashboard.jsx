import { motion } from 'framer-motion';
import { MessageSquare, Users, Hash, Pin, Search, Star, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export const HomeDashboard = ({ rooms, dms, onlineUsers, setActiveRoom, setActiveDM }) => {
  const recentDMs = dms.slice(0, 4);
  const pinnedRooms = rooms.filter(r => r.is_pinned).slice(0, 4);
  const activeCount = onlineUsers.size;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-main-bg p-6 lg:p-10">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Welcome Header */}
        <header className="space-y-2">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white tracking-tight"
          >
            Welcome back!
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg"
          >
            There are <span className="text-primary-purple font-semibold">{activeCount}</span> people online right now.
          </motion.p>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Recent Chats */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2 bg-card-bg border border-white/5 rounded-3xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-purple" />
                Recent Conversations
              </h3>
            </div>
            
            <div className="space-y-3">
              {recentDMs.length > 0 ? recentDMs.map(dm => (
                <button
                  key={dm.id}
                  onClick={() => setActiveDM(dm)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {dm.avatar_url ? (
                        <img src={dm.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary-purple/20 flex items-center justify-center text-primary-purple font-bold">
                          {dm.full_name.charAt(0)}
                        </div>
                      )}
                      {onlineUsers.has(dm.id) && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-online-green border-2 border-card-bg rounded-full" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white group-hover:text-primary-purple transition-colors">{dm.full_name}</p>
                      <p className="text-sm text-gray-500 truncate max-w-[200px]">{dm.lastMessage}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-primary-purple group-hover:translate-x-1 transition-all" />
                </button>
              )) : (
                <div className="text-center py-10 text-gray-600">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p>No recent conversations</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Stats/Quick Info */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-primary-purple rounded-3xl p-6 text-white shadow-xl shadow-primary-purple/20"
            >
              <Star className="w-8 h-8 mb-4" />
              <h3 className="text-xl font-bold mb-1">Pro Tip</h3>
              <p className="text-white/80 text-sm leading-relaxed">
                Use <code className="bg-white/20 px-1 rounded">/search</code> in any chat to quickly find messages or files.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-card-bg border border-white/5 rounded-3xl p-6 shadow-xl"
            >
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Online Now</h3>
              <div className="flex -space-x-3 overflow-hidden">
                {Array.from(onlineUsers.values()).slice(0, 5).map((user, i) => (
                  <div key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-card-bg bg-gray-800 flex items-center justify-center overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-gray-400">{user.full_name?.charAt(0)}</span>
                    )}
                  </div>
                ))}
                {activeCount > 5 && (
                  <div className="flex items-center justify-center h-10 w-10 rounded-full ring-2 ring-card-bg bg-gray-900 text-[10px] font-medium text-gray-400">
                    +{activeCount - 5}
                  </div>
                )}
              </div>
              <p className="mt-4 text-xs text-gray-500">
                {activeCount} active members in the community.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Explore Rooms */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Hash className="w-6 h-6 text-primary-purple" />
              Explore Rooms
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {rooms.slice(0, 8).map(room => (
              <motion.button
                key={room.id}
                whileHover={{ y: -5 }}
                onClick={() => setActiveRoom(room)}
                className="bg-card-bg border border-white/5 p-5 rounded-2xl text-left hover:bg-white/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-purple/10 flex items-center justify-center text-primary-purple mb-4 group-hover:bg-primary-purple group-hover:text-white transition-all">
                  <Hash className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white mb-1">{room.name}</h4>
                <p className="text-xs text-gray-500 line-clamp-2">Join the discussion in this public room.</p>
              </motion.button>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};
