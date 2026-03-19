import { format } from 'date-fns';
import { UserAvatar } from './UserAvatar';
import { FileText, Download, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';

export const MessageBubble = ({ message, isOwnMessage, showAvatar }) => {
  const time = format(new Date(message.created_at), 'h:mm a');
  const user = message.user || message.sender;

  const renderFile = () => {
    if (!message.file_url) return null;

    if (message.file_type?.startsWith('image/')) {
      return (
        <div className="mt-2 rounded-lg overflow-hidden border border-white/10 max-w-sm">
          <img 
            src={message.file_url} 
            alt="Attachment" 
            className="w-full h-auto object-cover hover:opacity-90 transition-opacity cursor-pointer"
            onClick={() => window.open(message.file_url, '_blank')}
          />
        </div>
      );
    }

    return (
      <a 
        href={message.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 mt-2 p-3 rounded-lg bg-black/20 hover:bg-black/40 transition-colors border border-white/5 max-w-sm"
      >
        <div className="bg-purple-500/20 p-2 rounded-lg">
          <FileText className="w-6 h-6 text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {message.file_name || 'Download File'}
          </p>
          <p className="text-xs text-gray-400 uppercase">
            {message.file_type?.split('/')[1] || 'File'}
          </p>
        </div>
        <Download className="w-4 h-4 text-gray-400" />
      </a>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 max-w-[85%] ${isOwnMessage ? 'ml-auto flex-row-reverse' : ''}`}
    >
      {showAvatar && !isOwnMessage && (
        <div className="flex-shrink-0 mt-1">
          <UserAvatar user={user} size="sm" />
        </div>
      )}
      
      {!showAvatar && !isOwnMessage && <div className="w-8 flex-shrink-0" />}

      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {showAvatar && !isOwnMessage && (
          <div className="flex items-baseline gap-2 mb-1 ml-1">
            <span className="text-sm font-medium text-gray-200">
              {user?.full_name || 'User'}
            </span>
            <span className="text-xs text-gray-500">{time}</span>
          </div>
        )}

        <div 
          className={`relative px-4 py-2.5 rounded-2xl shadow-sm ${
            isOwnMessage 
              ? 'bg-purple-600 text-white rounded-tr-sm' 
              : 'bg-[#1a1a1a] text-gray-100 border border-white/5 rounded-tl-sm'
          }`}
        >
          {message.content && (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
          {renderFile()}
        </div>

        {isOwnMessage && showAvatar && (
          <span className="text-xs text-gray-500 mt-1 mr-1">{time}</span>
        )}
      </div>
    </motion.div>
  );
};
