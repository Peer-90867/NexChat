import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

export const useRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const fetchRooms = async () => {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRooms(data);
      } catch (error) {
        console.error('Error fetching rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();

    const subscription = supabase
      .channel('public:rooms')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rooms' }, payload => {
        setRooms(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'rooms' }, payload => {
        setRooms(prev => prev.filter(room => room.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const createRoom = async (name, userId) => {
    if (!name.trim() || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert([{ name, created_by: userId }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Room created successfully');
      return data;
    } catch (error) {
      toast.error('Failed to create room');
      console.error(error);
    }
  };

  return { rooms, loading, createRoom };
};
