import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeOptions {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

export const useRealtime = ({
  table,
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete
}: UseRealtimeOptions) => {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const realtimeChannel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes' as any,
        {
          event: event,
          schema: 'public',
          table: table,
          filter: filter
        },
        (payload: any) => {
          // Handle postgres changes payload
          if (payload.eventType === 'INSERT') {
            onInsert?.(payload);
          } else if (payload.eventType === 'UPDATE') {
            onUpdate?.(payload);
          } else if (payload.eventType === 'DELETE') {
            onDelete?.(payload);
          }
        }
      )
      .subscribe();

    setChannel(realtimeChannel);

    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [table, event, filter, onInsert, onUpdate, onDelete]);

  return channel;
};

// Hook for user presence tracking
export const usePresence = (channelName: string, userInfo: any) => {
  const [presenceState, setPresenceState] = useState<any>({});
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userInfo) return;

    const presenceChannel = supabase.channel(channelName);

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        setPresenceState(newState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track(userInfo);
        }
      });

    setChannel(presenceChannel);

    return () => {
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
      }
    };
  }, [channelName, userInfo]);

  const getOnlineUsers = () => {
    return Object.values(presenceState).flat();
  };

  return {
    presenceState,
    onlineUsers: getOnlineUsers(),
    channel
  };
};