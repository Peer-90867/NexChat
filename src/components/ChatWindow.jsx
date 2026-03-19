import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Image as ImageIcon, Smile, Hash, Users, FileText, Download, X, MessageSquare, Reply, ChevronDown, ChevronUp, Search, Pin, Mic, Play, Square, Share2 } from 'lucide-react';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../hooks/useAuth';
import { useTyping } from '../hooks/useTyping';
import { supabase } from '../supabaseClient';
import { UserAvatar } from './UserAvatar';
import { UserPopover } from './UserPopover';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const ChatWindow = ({ activeRoom, activeDM, onlineUsers, setMobileOpen, rooms, dms }) => {
  const { profile } = useAuth();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [showGifs, setShowGifs] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const mediaRecorderRef = useRef(null);
  const [expandedThreads, setExpandedThreads] = useState(new Set());
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [activePopover, setActivePopover] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const isDM = !!activeDM;
  const roomId = isDM ? activeDM.id : activeRoom?.id;
  const { 
    messages, 
    loading, 
    sendMessage, 
    editMessage, 
    deleteMessage,
    addReaction,
    removeReaction,
    togglePin
  } = useMessages(roomId, isDM);
  const { typingUsers, setTyping } = useTyping(roomId);

  const handleReaction = async (messageId, emoji) => {
    const message = messages.find(m => m.id === messageId);
    const currentReactions = message.reactions || {};
    const userReactions = currentReactions[emoji] || [];
    
    try {
      if (userReactions.includes(user.id)) {
        await removeReaction(messageId, emoji);
      } else {
        await addReaction(messageId, emoji);
      }
    } catch (error) {
      toast.error('Failed to update reaction');
    }
  };

  const handlePin = async (messageId, isPinned) => {
    try {
      await togglePin(messageId, isPinned);
      toast.success(isPinned ? 'Message unpinned' : 'Message pinned');
    } catch (error) {
      toast.error('Failed to pin message');
    }
  };

  const handleEdit = async (messageId) => {
    if (!editContent.trim()) return;
    try {
      await editMessage(messageId, editContent);
      setEditingMessageId(null);
      setEditContent('');
      toast.success('Message updated');
    } catch (error) {
      toast.error('Failed to edit message');
    }
  };

  const handleForward = async (target, isDM) => {
    if (!forwardingMessage || !profile) return;
    try {
      const messageData = {
        content: forwardingMessage.content,
        file_url: forwardingMessage.file_url,
        file_type: forwardingMessage.file_type,
        file_name: forwardingMessage.file_name,
      };

      if (isDM) {
        const { error } = await supabase
          .from('direct_messages')
          .insert({
            ...messageData,
            sender_id: profile.id,
            receiver_id: target.id
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('messages')
          .insert({
            ...messageData,
            user_id: profile.id,
            room_id: target.id
          });
        if (error) throw error;
      }

      toast.success(`Message forwarded to ${target.full_name || target.name}`);
      setForwardingMessage(null);
    } catch (error) {
      console.error('Forward error:', error);
      toast.error('Failed to forward message');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        setFilePreview({ file, isAudio: true, url: URL.createObjectURL(blob) });
      };
      
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error('Could not access microphone');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const GifPicker = ({ onSelect }) => {
    const [gifs, setGifs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
      const fetchGifs = async () => {
        setLoading(true);
        try {
          const query = search || 'trending';
          const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${query}&limit=12`);
          const data = await res.json();
          setGifs(data.data || []);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      const timer = setTimeout(fetchGifs, 500);
      return () => clearTimeout(timer);
    }, [search]);

    return (
      <div className="absolute bottom-full mb-4 left-0 w-72 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
        <div className="p-3 border-b border-white/10">
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search GIFs..."
            className="w-full bg-white/5 border-none rounded-lg text-xs text-white placeholder-gray-500 focus:ring-1 focus:ring-purple-500"
            autoFocus
          />
        </div>
        <div className="h-64 overflow-y-auto p-2 grid grid-cols-2 gap-2 custom-scrollbar">
          {loading ? (
            <div className="col-span-2 flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : gifs.map(gif => (
            <img 
              key={gif.id}
              src={gif.images.fixed_height_small.url}
              alt="gif"
              className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onSelect(gif.images.original.url)}
            />
          ))}
        </div>
      </div>
    );
  };

  const LinkPreview = ({ content }) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex);
    if (!urls) return null;

    return (
      <div className="mt-2 space-y-2">
        {urls.map((url, i) => (
          <a 
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-2 bg-black/20 rounded-lg border border-white/10 hover:bg-black/30 transition-all group"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center shrink-0">
                <Paperclip className="w-4 h-4 text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-purple-400 font-medium truncate">{new URL(url).hostname}</p>
                <p className="text-xs text-gray-300 truncate">{url}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    );
  };

  // Filter messages based on search query
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    return messages.filter(m => 
      m.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.file_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, searchQuery]);

  // Group messages into threads
  const threadedMessages = useMemo(() => {
    const topLevel = filteredMessages.filter(m => !m.parent_id);
    const replies = filteredMessages.filter(m => m.parent_id);
    
    return topLevel.map(m => ({
      ...m,
      replies: replies.filter(r => r.parent_id === m.id)
    }));
  }, [filteredMessages]);

  const toggleThread = (messageId) => {
    setExpandedThreads(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

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

        await sendMessage(newMessage, publicUrl, filePreview.file.type, filePreview.file.name, replyTo?.id);
        setFilePreview(null);
      } else {
        await sendMessage(newMessage, null, null, null, replyTo?.id);
      }
      setNewMessage('');
      setReplyTo(null);
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
    <div className="flex-1 flex flex-col bg-main-bg h-full relative w-full">
      {/* Header */}
      <div className="h-16 flex items-center px-4 lg:px-6 border-b border-white/10 bg-card-bg/80 backdrop-blur-md sticky top-0 z-10">
        <button 
          onClick={() => setMobileOpen(true)}
          className="p-2 mr-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white lg:hidden"
        >
          <MessageSquare className="w-6 h-6" />
        </button>

        {isDM ? (
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar 
              user={activeDM} 
              size="md" 
              isOnline={onlineUsers.has(activeDM.id)} 
              status={onlineUsers.get(activeDM.id)?.status} 
            />
            <div className="min-w-0">
              <h2 className="font-bold text-white truncate">{activeDM.full_name}</h2>
              <p className="text-xs text-gray-400">
                {onlineUsers.has(activeDM.id) ? (
                  <span className={
                    onlineUsers.get(activeDM.id)?.status === 'busy' ? 'text-red-500' :
                    onlineUsers.get(activeDM.id)?.status === 'away' ? 'text-yellow-500' :
                    'text-green-500'
                  }>
                    {onlineUsers.get(activeDM.id)?.status ? onlineUsers.get(activeDM.id).status.charAt(0).toUpperCase() + onlineUsers.get(activeDM.id).status.slice(1) : 'Online'}
                  </span>
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

        <div className="flex items-center gap-2 ml-auto">
          <div className={`flex items-center bg-white/5 rounded-lg transition-all ${isSearching ? 'w-48 px-2' : 'w-10'}`}>
            <button 
              onClick={() => {
                setIsSearching(!isSearching);
                if (isSearching) setSearchQuery('');
              }}
              className="p-2 text-gray-400 hover:text-white shrink-0"
            >
              <Search className="w-5 h-5" />
            </button>
            {isSearching && (
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chat..."
                className="bg-transparent border-none text-xs text-white placeholder-gray-500 focus:ring-0 w-full"
                autoFocus
              />
            )}
          </div>
          <button 
            onClick={() => setShowGallery(true)}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"
            title="File Gallery"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white relative">
            <Pin className="w-5 h-5" />
            {messages.filter(m => m.is_pinned).length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full border-2 border-[#111111]"></span>
            )}
          </button>
        </div>
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
        ) : threadedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          threadedMessages.map((msg, index) => {
            const isMe = msg.user_id === user.id || msg.sender_id === user.id;
            const sender = isDM ? (isMe ? msg.sender : msg.receiver) : msg.user;
            const showAvatar = index === 0 || threadedMessages[index - 1].user_id !== msg.user_id;
            const isExpanded = expandedThreads.has(msg.id);

            return (
              <div key={msg.id} className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  {!isMe && showAvatar && (
                    <div className="flex-shrink-0 relative">
                      <button onClick={() => setActivePopover(activePopover === msg.id ? null : msg.id)}>
                        <UserAvatar 
                          user={sender} 
                          size="md" 
                          isOnline={onlineUsers.has(sender?.id)} 
                          status={onlineUsers.get(sender?.id)?.status} 
                        />
                      </button>
                      <AnimatePresence>
                        {activePopover === msg.id && (
                          <UserPopover 
                            user={sender} 
                            isOnline={onlineUsers.has(sender?.id)} 
                            status={onlineUsers.get(sender?.id)?.status} 
                            onClose={() => setActivePopover(null)}
                            onMessage={(u) => {
                              // Logic to start DM with u
                              setActivePopover(null);
                            }}
                          />
                        )}
                      </AnimatePresence>
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
                      {/* Reply Button */}
                      <button 
                        onClick={() => setReplyTo(msg)}
                        className={`
                          absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 z-10
                          ${isMe ? '-left-10' : '-right-10'}
                        `}
                        title="Reply"
                      >
                        <Reply className="w-4 h-4" />
                      </button>

                      {/* Pin Button */}
                      <button 
                        onClick={() => handlePin(msg.id, msg.is_pinned)}
                        className={`
                          absolute top-10 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-black/50 hover:bg-black/70 z-10
                          ${isMe ? '-left-10' : '-right-10'}
                          ${msg.is_pinned ? 'text-purple-400 opacity-100' : 'text-white'}
                        `}
                        title={msg.is_pinned ? "Unpin" : "Pin"}
                      >
                        <Pin className="w-4 h-4" />
                      </button>

                      {/* Edit/Delete Buttons for own messages */}
                      {isMe && (
                        <div className={`
                          absolute top-20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-10
                          ${isMe ? '-left-10' : '-right-10'}
                        `}>
                          <button 
                            onClick={() => {
                              setEditingMessageId(msg.id);
                              setEditContent(msg.content);
                            }}
                            className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70"
                            title="Edit"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(msg.id)}
                            className="p-1.5 rounded-full bg-black/50 text-red-400 hover:bg-black/70"
                            title="Delete"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setForwardingMessage(msg)}
                            className="p-1.5 rounded-full bg-black/50 text-blue-400 hover:bg-black/70"
                            title="Forward"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {msg.is_pinned && (
                        <div className="flex items-center gap-1 text-[10px] text-purple-400 mb-1">
                          <Pin className="w-3 h-3" /> Pinned
                        </div>
                      )}

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
                        <div className="space-y-1">
                          {editingMessageId === msg.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg text-sm text-white p-2 focus:ring-1 focus:ring-purple-500"
                                rows={2}
                              />
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingMessageId(null)} className="text-[10px] text-gray-400 hover:text-white">Cancel</button>
                                <button onClick={() => handleEdit(msg.id)} className="text-[10px] text-purple-400 hover:text-purple-300 font-bold">Save</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {msg.content}
                                {msg.is_edited && <span className="text-[9px] opacity-40 ml-1">(edited)</span>}
                              </p>
                              <LinkPreview content={msg.content} />
                            </>
                          )}
                        </div>
                      )}

                      {/* Reactions Display */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.entries(msg.reactions).map(([emoji, uids]) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(msg.id, emoji)}
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] border transition-all ${
                                uids.includes(user.id) 
                                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' 
                                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                              }`}
                            >
                              <span>{emoji}</span>
                              <span>{uids.length}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Reaction Picker (on hover) */}
                      <div className={`
                        absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#1a1a1a] border border-white/10 p-1 rounded-full shadow-xl z-20
                        ${isMe ? 'right-0' : 'left-0'}
                      `}>
                        {['👍', '❤️', '🔥', '😂', '😮', '😢'].map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg.id, emoji)}
                            className={`text-sm p-1 rounded-full hover:bg-white/10 transition-colors ${
                              msg.reactions?.[emoji]?.includes(user.id) ? 'bg-purple-500/20' : ''
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      
                      <div className={`
                        text-[10px] mt-1 flex items-center gap-1
                        ${isMe ? 'text-purple-200 justify-end' : 'text-gray-500 justify-start'}
                      `}>
                        {format(new Date(msg.created_at), 'HH:mm')}
                        {isMe && (
                          <span className="flex ml-1">
                            <svg className={`w-3 h-3 ${msg.read_by?.length > 0 ? 'text-blue-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {msg.read_by?.length > 0 && (
                              <svg className="w-3 h-3 -ml-1.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Thread Toggle */}
                    {msg.replies.length > 0 && (
                      <button 
                        onClick={() => toggleThread(msg.id)}
                        className="mt-2 text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {msg.replies.length} {msg.replies.length === 1 ? 'reply' : 'replies'}
                      </button>
                    )}
                  </div>
                </motion.div>

                {/* Replies */}
                <AnimatePresence>
                  {isExpanded && msg.replies.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-14 space-y-4 border-l-2 border-white/5 pl-4"
                    >
                      {msg.replies.map(reply => {
                        const isReplyMe = reply.user_id === user.id || reply.sender_id === user.id;
                        const replySender = isDM ? (isReplyMe ? reply.sender : reply.receiver) : reply.user;
                        
                        return (
                          <div key={reply.id} className={`flex gap-3 ${isReplyMe ? 'flex-row-reverse' : ''}`}>
                            <div className="flex-shrink-0">
                              <UserAvatar 
                                user={replySender} 
                                size="sm" 
                                isOnline={onlineUsers.has(replySender?.id)} 
                                status={onlineUsers.get(replySender?.id)?.status} 
                              />
                            </div>
                            <div className={`flex flex-col ${isReplyMe ? 'items-end' : 'items-start'} max-w-[85%]`}>
                              <div className={`
                                p-2 rounded-xl text-sm
                                ${isReplyMe 
                                  ? 'bg-purple-600/80 text-white rounded-tr-sm' 
                                  : 'bg-[#1a1a1a] text-gray-200 rounded-tl-sm border border-white/5'
                                }
                              `}>
                                {reply.content && <p>{reply.content}</p>}
                                {reply.file_url && (
                                  <div className="mt-1">
                                    {reply.file_type?.startsWith('image/') ? (
                                      <img src={reply.file_url} alt="attachment" className="max-w-[200px] rounded-lg" />
                                    ) : (
                                      <a href={reply.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 underline truncate block max-w-[150px]">
                                        {reply.file_name}
                                      </a>
                                    )}
                                  </div>
                                )}
                                <span className="text-[9px] opacity-50 block mt-1">
                                  {format(new Date(reply.created_at), 'HH:mm')}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-card-bg border-t border-white/10">
        {typingUsers.size > 0 && (
          <div className="px-4 py-1 text-[10px] text-purple-400 italic animate-pulse flex items-center gap-2">
            <div className="flex gap-0.5">
              <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></span>
            </div>
            {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        <AnimatePresence>
          {replyTo && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 p-2 bg-purple-600/10 border-l-4 border-purple-600 rounded-r-lg flex items-center justify-between"
            >
              <div className="min-w-0">
                <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Replying to</p>
                <p className="text-xs text-gray-300 truncate">{replyTo.content || 'Attachment'}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="p-1 text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
          
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
              
              {filePreview.isAudio ? (
                <div className="w-16 h-16 bg-red-500/20 rounded-lg flex items-center justify-center text-red-500">
                  <Mic className="w-8 h-8" />
                </div>
              ) : filePreview.isImage ? (
                <img src={filePreview.url} alt="preview" className="w-16 h-16 object-cover rounded-lg" />
              ) : (
                <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-500">
                  <FileText className="w-8 h-8" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{filePreview.file?.name || (filePreview.isAudio ? 'Voice Message' : 'GIF')}</p>
                {filePreview.file && <p className="text-xs text-gray-400">{(filePreview.file.size / 1024 / 1024).toFixed(2)} MB</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSend} className="flex items-end gap-2">
          <div className="flex-1 bg-[#1a1a1a] rounded-2xl border border-white/10 focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/50 transition-all flex items-end min-h-[56px] p-2 relative">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-xl transition-colors shrink-0"
                title="Attach File"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2 rounded-xl transition-colors shrink-0 ${isRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'}`}
                title={isRecording ? "Stop Recording" : "Voice Message"}
              >
                {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden" 
              accept="image/*,.pdf,.doc,.docx,.txt,.zip"
            />
            
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                setTyping(e.target.value.length > 0);
              }}
              onBlur={() => setTyping(false)}
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
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowGifs(!showGifs)}
                className={`p-2 rounded-xl transition-colors shrink-0 ${showGifs ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10'}`}
                title="GIFs"
              >
                <Smile className="w-5 h-5" />
              </button>
              {showGifs && (
                <GifPicker onSelect={(url) => {
                  setFilePreview({ url, isImage: true, isGif: true });
                  setShowGifs(false);
                }} />
              )}
            </div>
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
      {/* Forward Modal */}
      <AnimatePresence>
        {forwardingMessage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Forward Message</h3>
                <button 
                  onClick={() => setForwardingMessage(null)}
                  className="p-2 hover:bg-white/5 rounded-lg text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rooms</p>
                  {rooms.map(room => (
                    <button
                      key={room.id}
                      onClick={() => handleForward(room, false)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all">
                        <Hash className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium text-white">{room.name}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Direct Messages</p>
                  {dms.map(dm => (
                    <button
                      key={dm.id}
                      onClick={() => handleForward(dm, true)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                    >
                      <UserAvatar user={dm} size="md" isOnline={onlineUsers.has(dm.id)} status={onlineUsers.get(dm.id)?.status} />
                      <span className="text-sm font-medium text-white">{dm.full_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* File Gallery Modal */}
      <AnimatePresence>
        {showGallery && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowGallery(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111111] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-500">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">File Gallery</h3>
                    <p className="text-sm text-gray-400">All shared media and documents</p>
                  </div>
                </div>
                <button onClick={() => setShowGallery(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {messages.filter(m => m.file_url).map(m => (
                    <div key={m.id} className="group relative aspect-square bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden hover:border-purple-500/50 transition-all">
                      {m.file_type?.startsWith('image/') ? (
                        <img src={m.file_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                          <FileText className="w-10 h-10 text-blue-400 mb-2" />
                          <p className="text-[10px] text-gray-400 truncate w-full">{m.file_name}</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                        <p className="text-[10px] text-white text-center line-clamp-2">{m.file_name}</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => window.open(m.file_url, '_blank')}
                            className="p-2 bg-purple-600 rounded-lg text-white hover:bg-purple-700"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {messages.filter(m => m.file_url).length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                      <Paperclip className="w-12 h-12 mb-4 opacity-20" />
                      <p>No files shared in this chat yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
