import { motion, AnimatePresence } from 'framer-motion';
import { UserAvatar } from './UserAvatar';
import { MessageSquare, Mail, Info, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export const UserPopover = ({ user, isOnline, status, onClose, onMessage }) => {
  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="absolute bottom-full mb-2 left-0 w-64 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="h-20 bg-gradient-to-r from-purple-600 to-blue-600 relative">
        <div className="absolute -bottom-6 left-4">
          <UserAvatar user={user} size="lg" isOnline={isOnline} status={status} className="border-4 border-[#1a1a1a]" />
        </div>
      </div>
      
      <div className="pt-8 p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-bold text-white text-lg">{user.full_name}</h3>
            <p className="text-xs text-gray-400">@{user.username || user.full_name?.toLowerCase().replace(' ', '_')}</p>
          </div>
          <button 
            onClick={() => { onMessage(user); onClose(); }}
            className="p-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>

        {user.status_message && (
          <div className="mb-3 p-2 bg-white/5 rounded-lg border border-white/5">
            <p className="text-xs text-gray-300 italic">"{user.status_message}"</p>
          </div>
        )}

        <div className="space-y-2">
          {user.bio && (
            <div className="flex items-start gap-2">
              <Info className="w-3 h-3 text-gray-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-gray-400 leading-relaxed">{user.bio}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 text-gray-500 shrink-0" />
            <p className="text-[11px] text-gray-400">Joined {user.created_at ? format(new Date(user.created_at), 'MMMM yyyy') : 'Recently'}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
          <div className="flex-1 text-center">
            <p className="text-xs font-bold text-white">1.2k</p>
            <p className="text-[10px] text-gray-500 uppercase">Messages</p>
          </div>
          <div className="w-px bg-white/5" />
          <div className="flex-1 text-center">
            <p className="text-xs font-bold text-white">12</p>
            <p className="text-[10px] text-gray-500 uppercase">Groups</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
