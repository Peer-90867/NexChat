import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Image as ImageIcon, Smile, Hash, Users, FileText, Download, X, MessageSquare } from 'lucide-react';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabaseClient';
import { UserAvatar } from './UserAvatar';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const ChatWindow = ({ activeRoom, activeDM, onlineUsers, setMobileOpen }) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const isDM = !!activeDM;
  const roomId = isDM ? activeDM.id : activeRoom?.id;
  const { messages, loading, sendMessage } = useMessages(roomId, isDM);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !filePreview) return;

    try {
      if (filePreview) {
        if (!supabase) {
          toast.error('Supabase is not configured');
          return;
        }
        setUploading(true);
        const fileExt = filePreview.file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-files')
          .upload(filePath, filePreview.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('chat-files')
          .getPublicUrl(filePath);

        await sendMessage(newMessage, publicUrl, filePreview.file.type, filePreview.file.name);
        setFilePreview(null);
      } else {
        await sendMessage(newMessage);
      }
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    const isImage = file.type.startsWith('image/');
    
    if (isImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview({ file, url: reader.result, isImage: true });
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview({ file, isImage: false });
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview({ file, url: reader.result, isImage: true });
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  if (!activeRoom && !activeDM) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0a] text-gray-400 p-6 text-center">
        <div className="lg:hidden absolute top-4 left-4">
          <button 
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
        </div>
        <MessageSquare className="w-16 h-16 text-purple-600/50 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to NexChat</h2>
        <p className="max-w-xs">Select a room or start a direct message to begin chatting with your team.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] h-full relative w-full">
      {/* Header */}
      <div className="h-16 flex items-center px-4 lg:px-6 border-b border-white/10 bg-[#111111]/80 backdrop-blur-md sticky top-0 z-10">
        <button 
          onClick={() => setMobileOpen(true)}
          className="p-2 mr-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white lg:hidden"
        >
          <MessageSquare className="w-6 h-6" />
        </button>

        {isDM ? (
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar user={activeDM} size="md" isOnline={onlineUsers.has(activeDM.id)} />
            <div className="min-w-0">
              <h2 className="font-bold text-white truncate">{activeDM.full_name}</h2>
              <p className="text-xs text-gray-400">
                {onlineUsers.has(activeDM.id) ? (
                  <span className="text-green-500">Online</span>
                ) : (
                  'Offline'
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-500 shrink-0">
              <Hash className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white truncate">{activeRoom.name}</h2>
                {activeRoom.code && (
                  <span className="text-[10px] font-mono bg-white/10 text-gray-400 px-1.5 py-0.5 rounded">
                    #{activeRoom.code}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Users className="w-3 h-3" /> Group Room
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar" onPaste={handlePaste}>
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`flex gap-4 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse shrink-0" />
                <div className={`flex flex-col ${i % 2 === 0 ? 'items-end' : 'items-start'} max-w-[70%] w-full`}>
                  <div className="w-24 h-4 bg-white/5 rounded animate-pulse mb-2" />
                  <div className={`w-full max-w-sm h-16 rounded-2xl animate-pulse ${i % 2 === 0 ? 'bg-purple-600/20' : 'bg-white/5'}`} />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.user_id === user.id || msg.sender_id === user.id;
            const sender = isDM ? (isMe ? msg.sender : msg.receiver) : msg.user;
            const showAvatar = index === 0 || messages[index - 1].user_id !== msg.user_id;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                {!isMe && showAvatar && (
                  <div className="flex-shrink-0">
                    <UserAvatar user={sender} size="md" />
                  </div>
                )}
                {!isMe && !showAvatar && <div className="w-10" />}

                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  {showAvatar && !isMe && (
                    <span className="text-xs text-gray-400 mb-1 ml-1">{sender?.full_name}</span>
                  )}
                  
                  <div className={`
                    relative group p-3 rounded-2xl
                    ${isMe 
                      ? 'bg-purple-600 text-white rounded-tr-sm' 
                      : 'bg-[#1a1a1a] text-gray-100 rounded-tl-sm border border-white/5'
                    }
                  `}>
                    {msg.file_url && (
                      <div className="mb-2">
                        {msg.file_type?.startsWith('image/') ? (
                          <img 
                            src={msg.file_url} 
                            alt="attachment" 
                            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(msg.file_url, '_blank')}
                          />
                        ) : (
                          <a 
                            href={msg.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 bg-black/20 p-3 rounded-lg hover:bg-black/30 transition-colors"
                          >
                            <FileText className="w-8 h-8 text-blue-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{msg.file_name}</p>
                              <p className="text-xs opacity-70">Click to download</p>
                            </div>
                            <Download className="w-4 h-4 opacity-50" />
                          </a>
                        )}
                      </div>
                    )}
                    
                    {msg.content && (
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {msg.content}
                      </p>
                    )}
                    
                    <span className={`
                      text-[10px] mt-1 block
                      ${isMe ? 'text-purple-200 text-right' : 'text-gray-500 text-left'}
                    `}>
                      {format(new Date(msg.created_at), 'HH:mm')}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#111111] border-t border-white/10">
        <AnimatePresence>
          {filePreview && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-4 p-3 bg-[#1a1a1a] rounded-xl border border-white/10 flex items-center gap-4 relative"
            >
              <button 
                onClick={() => setFilePreview(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
              
              {filePreview.isImage ? (
                <img src={filePreview.url} alt="preview" className="w-16 h-16 object-cover rounded-lg" />
              ) : (
                <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-500">
                  <FileText className="w-8 h-8" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{filePreview.file.name}</p>
                <p className="text-xs text-gray-400">{(filePreview.file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSend} className="flex items-end gap-2">
          <div className="flex-1 bg-[#1a1a1a] rounded-2xl border border-white/10 focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/50 transition-all flex items-end min-h-[56px] p-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-xl transition-colors shrink-0"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden" 
              accept="image/*,.pdf,.doc,.docx,.txt,.zip"
            />
            
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder={`Message ${isDM ? activeDM.full_name : '#' + activeRoom?.name}...`}
              className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 resize-none max-h-32 min-h-[40px] py-2 px-3 text-sm custom-scrollbar"
              rows={1}
            />
            
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-xl transition-colors shrink-0"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={(!newMessage.trim() && !filePreview) || uploading}
            className="h-14 w-14 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white rounded-2xl flex items-center justify-center transition-colors shrink-0 shadow-lg shadow-purple-500/20"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5 ml-1" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
