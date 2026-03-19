import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

export const ProfileModal = ({ onClose }) => {
  const { profile, setProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [theme, setTheme] = useState(profile?.theme || 'purple');
  const [status, setStatus] = useState(profile?.status || 'online');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!supabase) {
      toast.error('Supabase is not configured');
      return;
    }
    try {
      if (!profile?.id) return;
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          username: username,
          status: status,
          bio: bio,
          theme: theme
        })
        .eq('id', profile.id);

      if (error) {
        if (error.code === '23505') {
          toast.error('Username already taken');
        } else {
          throw error;
        }
        return;
      }
      
      setProfile({ ...profile, full_name: fullName, username: username, status: status, bio: bio, theme: theme });
      toast.success('Profile updated successfully');
      onClose();
    } catch (error) {
      toast.error('Error updating profile');
      console.error(error);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!supabase) {
      toast.error('Supabase is not configured');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      if (!profile?.id) return;
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success('Avatar updated successfully');
    } catch (error) {
      toast.error('Error uploading avatar');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-card-bg rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Profile Settings</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-white/5 border-4 border-card-bg shadow-xl">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-500 bg-purple-900/30">
                    {profile?.full_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            <p className="text-sm text-gray-500 mt-3">Click to change avatar</p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="block w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent transition-all"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="block w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent transition-all"
                placeholder="username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="block w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent transition-all resize-none"
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-primary-purple transition-all appearance-none cursor-pointer"
                >
                  <option value="online">Online</option>
                  <option value="away">Away</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-primary-purple transition-all appearance-none cursor-pointer"
                >
                  <option value="purple">Purple (Default)</option>
                  <option value="blue">Blue</option>
                  <option value="emerald">Emerald</option>
                  <option value="rose">Rose</option>
                  <option value="amber">Amber</option>
                  <option value="cyberpunk">Cyberpunk</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 bg-primary-purple hover:bg-primary-purple/90 rounded-xl text-sm font-medium text-white transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
