import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export const useRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!supabase || !user) {
      setLoading(false);
      return;
    }

    const fetchRooms = async () => {
      try {
        // Get room IDs where user is a member
        const { data: memberData, error: memberError } = await supabase
          .from('room_members')
          .select('room_id')
          .eq('user_id', user.id);

        if (memberError) throw memberError;

        if (memberData.length === 0) {
          setRooms([]);
          return;
        }

        const roomIds = memberData.map(m => m.room_id);

        // Fetch room details
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .in('id', roomIds)
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

    // Subscribe to room membership changes
    const subscription = supabase
      .channel('public:room_members')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_members',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchRooms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const createRoom = async (name, userId, customCode) => {
    if (!name.trim() || !supabase) return;
    try {
      // Use custom code or generate a random 6-digit code
      const code = customCode || Math.floor(100000 + Math.random() * 900000).toString();
      
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert([{ name, created_by: userId, code }])
        .select()
        .single();

      if (roomError) {
        if (roomError.code === '23505') {
          toast.error('Room code already exists');
        } else {
          throw roomError;
        }
        return null;
      }

      // Add creator as member
      const { error: memberError } = await supabase
        .from('room_members')
        .insert([{ room_id: room.id, user_id: userId }]);

      if (memberError) throw memberError;

      toast.success('Room created successfully');
      return room;
    } catch (error) {
      toast.error('Failed to create room');
      console.error(error);
    }
  };

  const joinRoomByCode = async (code, userId) => {
    if (!code.trim() || !supabase) return;
    try {
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code)
        .single();

      if (roomError) {
        if (roomError.code === 'PGRST116') {
          toast.error('Room not found');
        } else {
          throw roomError;
        }
        return null;
      }

      // Check if already a member
      const { data: existing, error: checkError } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', room.id)
        .eq('user_id', userId)
        .single();

      if (existing) {
        toast.success(`Already a member of ${room.name}`);
        return room;
      }

      // Add as member
      const { error: memberError } = await supabase
        .from('room_members')
        .insert([{ room_id: room.id, user_id: userId }]);

      if (memberError) throw memberError;

      toast.success(`Joined room: ${room.name}`);
      return room;
    } catch (error) {
      toast.error('Failed to join room');
      console.error(error);
      return null;
    }
  };

  const joinRoomByName = async (name, userId) => {
    if (!name.trim() || !supabase) return;
    try {
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .ilike('name', name)
        .limit(1)
        .single();

      if (roomError) {
        if (roomError.code === 'PGRST116') {
          toast.error('Room not found');
        } else {
          throw roomError;
        }
        return null;
      }

      // Check if already a member
      const { data: existing, error: checkError } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', room.id)
        .eq('user_id', userId)
        .single();

      if (existing) {
        toast.success(`Already a member of ${room.name}`);
        return room;
      }

      // Add as member
      const { error: memberError } = await supabase
        .from('room_members')
        .insert([{ room_id: room.id, user_id: userId }]);

      if (memberError) throw memberError;

      toast.success(`Joined room: ${room.name}`);
      return room;
    } catch (error) {
      toast.error('Failed to join room');
      console.error(error);
      return null;
    }
  };

  return { rooms, loading, createRoom, joinRoomByCode, joinRoomByName };
};
