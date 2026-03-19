import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const { user, profile, loading, setProfile } = context;

  const signUp = async (email, password, fullName) => {
    if (!supabase) {
      toast.error('Supabase is not configured.');
      return;
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;
      
      // The trigger should create the profile, but if not we can do it here
      // For now we assume the trigger or we insert it manually
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ id: data.user.id, full_name: fullName, avatar_url: '' });
          
        if (profileError) console.error('Error creating profile:', profileError);
      }

      return data;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const signIn = async (email, password) => {
    if (!supabase) {
      toast.error('Supabase is not configured.');
      return;
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    if (!supabase) {
      toast.error('Supabase is not configured.');
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/chat`
        }
      });
      if (error) throw error;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const updateStatus = async (status) => {
    if (!supabase || !user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', user.id);
      if (error) throw error;
      setProfile(prev => ({ ...prev, status }));
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateStatus,
    setProfile
  };
};
