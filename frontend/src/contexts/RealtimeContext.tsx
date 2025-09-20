/**
 * Realtime Context
 * Manages WebSocket connections and real-time state
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useOffline } from './OfflineContext';

interface RealtimeContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  onlineUsers: string[];
  notifications: Notification[];
  unreadCount: number;
  
  // Methods
  connect: () => void;
  disconnect: () => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  sendMessage: (room: string, message: any) => void;
  markNotificationsRead: (notificationIds: string[]) => void;
  updateActivity: (activity: string, metadata?: any) => void;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  imageUrl?: string;
  actionUrl?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: Date;
  isRead: boolean;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const { user, token } = useAuth();
  const { isOnline } = useOffline();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!user || !token || !isOnline || socket?.connected) return;

    setConnectionStatus('connecting');
    
    const newSocket = io(`${process.env.EXPO_PUBLIC_API_URL}/realtime`, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0;
      
      // Subscribe to user-specific events
      newSocket.emit('feed:subscribe');
      newSocket.emit('notifications:subscribe');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      // Attempt reconnection if not a manual disconnect
      if (reason !== 'io client disconnect' && reconnectAttemptsRef.current < maxReconnectAttempts) {
        scheduleReconnect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔥 WebSocket connection error:', error);
      setConnectionStatus('error');
      
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        scheduleReconnect();
      }
    });

    // Feed events
    newSocket.on('feed:initial', (feedData) => {
      console.log('📰 Initial feed data received:', feedData.length, 'items');
    });

    newSocket.on('feed:new_post', (post) => {
      console.log('📝 New post received:', post.id);
      // Handle new post in feed
    });

    newSocket.on('feed:new_comment', (comment) => {
      console.log('💬 New comment received:', comment.id);
      // Handle new comment
    });

    newSocket.on('feed:new_like', (like) => {
      console.log('❤️ New like received:', like.id);
      // Handle new like
    });

    // Notification events
    newSocket.on('notifications:initial', (initialNotifications) => {
      console.log('🔔 Initial notifications received:', initialNotifications.length);
      setNotifications(initialNotifications.map(formatNotification));
      setUnreadCount(initialNotifications.filter((n: any) => !n.isRead).length);
    });

    newSocket.on('notification:new', (notification) => {
      console.log('🔔 New notification received:', notification.type);
      const formattedNotification = formatNotification(notification);
      setNotifications(prev => [formattedNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show local notification if app is in background
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/icons/icon-192x192.png',
            image: notification.imageUrl,
            tag: notification.id,
          });
        }
      }
    });

    // Presence events
    newSocket.on('presence:online_friends', (friends) => {
      console.log('👥 Online friends:', friends.length);
      setOnlineUsers(friends);
    });

    newSocket.on('presence:friend_activity', (activity) => {
      console.log('🎯 Friend activity:', activity.userId, activity.activity);
      // Handle friend activity updates
    });

    // Chat events
    newSocket.on('chat:unread_count', ({ count }) => {
      console.log('💬 Unread messages:', count);
      // Handle unread message count
    });

    newSocket.on('chat:new_message', ({ roomId, message }) => {
      console.log('💬 New message in room:', roomId);
      // Handle new chat message
    });

    newSocket.on('chat:user_joined', ({ userId, user }) => {
      console.log('👋 User joined chat:', user.displayName);
    });

    newSocket.on('chat:user_left', ({ userId }) => {
      console.log('👋 User left chat:', userId);
    });

    newSocket.on('chat:user_typing', ({ userId, user, isTyping }) => {
      console.log('⌨️ User typing:', user.displayName, isTyping);
    });

    // Social events
    newSocket.on('social:new_follower', (follow) => {
      console.log('👥 New follower:', follow.follower.displayName);
    });

    setSocket(newSocket);
  }, [user, token, isOnline]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, [socket]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectAttemptsRef.current += 1;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
    
    console.log(`🔄 Scheduling reconnect attempt ${reconnectAttemptsRef.current} in ${delay}ms`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (!socket?.connected && isOnline) {
        connect();
      }
    }, delay);
  }, [connect, socket, isOnline]);

  const joinRoom = useCallback((room: string) => {
    if (socket?.connected) {
      socket.emit('chat:join', { roomId: room });
    }
  }, [socket]);

  const leaveRoom = useCallback((room: string) => {
    if (socket?.connected) {
      socket.emit('chat:leave', { roomId: room });
    }
  }, [socket]);

  const sendMessage = useCallback((room: string, message: any) => {
    if (socket?.connected) {
      socket.emit('chat:message', { roomId: room, ...message });
    }
  }, [socket]);

  const markNotificationsRead = useCallback((notificationIds: string[]) => {
    if (socket?.connected) {
      socket.emit('notifications:mark_read', { notificationIds });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id) 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    }
  }, [socket]);

  const updateActivity = useCallback((activity: string, metadata?: any) => {
    if (socket?.connected) {
      socket.emit('presence:activity', { activity, metadata });
    }
  }, [socket]);

  // Auto-connect when user is authenticated and online
  useEffect(() => {
    if (user && token && isOnline && !socket?.connected) {
      connect();
    } else if ((!user || !token || !isOnline) && socket?.connected) {
      disconnect();
    }
  }, [user, token, isOnline, connect, disconnect, socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('Notification permission:', permission);
        });
      }
    }
  }, []);

  const formatNotification = (notification: any): Notification => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    data: notification.data,
    imageUrl: notification.imageUrl,
    actionUrl: notification.actionUrl,
    priority: notification.priority,
    createdAt: new Date(notification.createdAt),
    isRead: notification.isRead,
  });

  const value: RealtimeContextType = {
    socket,
    isConnected,
    connectionStatus,
    onlineUsers,
    notifications,
    unreadCount,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    sendMessage,
    markNotificationsRead,
    updateActivity,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};
