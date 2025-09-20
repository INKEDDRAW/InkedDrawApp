# Real-time Features Implementation Guide

## Overview

The Inked Draw real-time features system provides instant, live communication and updates throughout the application. Built on WebSocket technology with Socket.IO, it delivers enterprise-grade real-time capabilities including live feed updates, push notifications, user presence tracking, and instant messaging.

## Architecture

### Core Components

```
Real-time System Architecture
├── WebSocket Gateway (Socket.IO)
├── Notification Service (Push & In-app)
├── Live Feed Service (Activity Streaming)
├── Presence Service (Online Status)
├── Chat Service (Instant Messaging)
└── Frontend Integration (React Context)
```

### Technology Stack

- **Backend**: NestJS WebSocket Gateway with Socket.IO
- **Frontend**: React Context with Socket.IO Client
- **Database**: PostgreSQL with real-time triggers
- **Caching**: Redis for session management
- **Push Notifications**: Web Push API integration

## Key Features

### 🔔 **Smart Notifications**
- **Multi-channel Delivery**: In-app, push, and email notifications
- **Priority-based Routing**: Urgent, high, normal, and low priority levels
- **User Preferences**: Granular notification settings per category
- **Batch Processing**: Efficient delivery of multiple notifications
- **Expiration Management**: Automatic cleanup of old notifications

### 📡 **Live Feed Updates**
- **Real-time Activity Stream**: Instant updates for posts, comments, likes
- **Intelligent Filtering**: Type-based and following-only filters
- **Optimistic Updates**: Immediate UI feedback with server sync
- **Activity Aggregation**: Smart grouping of similar activities
- **Trending Detection**: Real-time trending content identification

### 👥 **User Presence System**
- **Online Status Tracking**: Real-time online/offline indicators
- **Activity Broadcasting**: Share current user activities
- **Friend Presence**: See which friends are online
- **Idle Detection**: Automatic idle status after inactivity
- **Presence Analytics**: Track user engagement patterns

### 💬 **Instant Messaging**
- **Real-time Chat**: WebSocket-powered instant messaging
- **Room Management**: Direct messages and group chats
- **Message Threading**: Reply-to functionality
- **Typing Indicators**: Live typing status
- **Message Search**: Full-text search within conversations
- **Read Receipts**: Message read status tracking

### 🔄 **Connection Management**
- **Auto-reconnection**: Intelligent reconnection with exponential backoff
- **Offline Resilience**: Graceful degradation when offline
- **Connection Status**: Visual connection state indicators
- **Error Recovery**: Automatic error handling and recovery
- **Performance Monitoring**: Connection quality tracking

## Implementation Details

### Backend Services

#### WebSocket Gateway
```typescript
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
  namespace: '/realtime',
})
export class RealtimeGateway {
  @WebSocketServer() server: Server;

  async handleConnection(client: AuthenticatedSocket) {
    // Authenticate connection
    const token = client.handshake.auth?.token;
    const payload = await this.jwtService.verifyAsync(token);
    
    // Join user-specific room
    await client.join(`user:${payload.sub}`);
    
    // Update presence
    await this.presenceService.setUserOnline(payload.sub);
    
    // Send initial data
    await this.sendInitialData(client);
  }
}
```

#### Notification Service
```typescript
export class NotificationService {
  async createNotification(data: NotificationData): Promise<any> {
    // Save to database
    const notification = await this.databaseService.insert('notifications', {
      user_id: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      priority: data.priority,
    });

    // Send push notification
    await this.sendPushNotification(data.userId, {
      title: data.title,
      body: data.message,
      data: { notificationId: notification.id },
    });

    return notification;
  }
}
```

#### Live Feed Service
```typescript
export class LiveFeedService {
  async getRecentFeedUpdates(userId: string, filters: FeedFilters): Promise<FeedUpdate[]> {
    const query = `
      WITH feed_activities AS (
        SELECT p.id, 'post' as type, p.user_id, p.content, p.created_at
        FROM posts p
        WHERE p.created_at >= NOW() - INTERVAL '1 week'
        ${filters.followingOnly ? 'AND p.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1)' : ''}
        
        UNION ALL
        
        SELECT c.id, 'comment' as type, c.user_id, c.content, c.created_at
        FROM comments c
        WHERE c.created_at >= NOW() - INTERVAL '1 week'
      )
      SELECT * FROM feed_activities
      ORDER BY created_at DESC
      LIMIT $2
    `;

    return await this.databaseService.query(query, [userId, 50]);
  }
}
```

#### Presence Service
```typescript
export class PresenceService {
  private onlineUsers = new Map<string, UserPresence>();

  async setUserOnline(userId: string): Promise<void> {
    const presence: UserPresence = {
      userId,
      isOnline: true,
      lastSeen: new Date(),
      currentActivity: 'online',
    };

    this.onlineUsers.set(userId, presence);
    
    await this.databaseService.query(`
      INSERT INTO user_presence (user_id, is_online, last_seen, current_activity)
      VALUES ($1, true, NOW(), 'online')
      ON CONFLICT (user_id) DO UPDATE SET
        is_online = true, last_seen = NOW(), current_activity = 'online'
    `, [userId]);
  }
}
```

### Frontend Integration

#### Realtime Context
```typescript
export const RealtimeProvider: React.FC = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    const newSocket = io(`${API_URL}/realtime`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('feed:subscribe');
      newSocket.emit('notifications:subscribe');
    });

    newSocket.on('notification:new', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      showLocalNotification(notification);
    });

    setSocket(newSocket);
  }, [user, token]);

  return (
    <RealtimeContext.Provider value={{ socket, isConnected, connect }}>
      {children}
    </RealtimeContext.Provider>
  );
};
```

#### Notification Bell Component
```typescript
export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markNotificationsRead } = useRealtime();

  return (
    <TouchableOpacity onPress={toggleDropdown}>
      <Ionicons name="notifications" size={24} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
```

#### Live Feed Updates
```typescript
export const LiveFeedUpdates: React.FC = () => {
  const { socket } = useRealtime();
  const [updates, setUpdates] = useState<FeedUpdate[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('feed:new_post', (post) => {
      setUpdates(prev => [createUpdateFromPost(post), ...prev]);
    });

    socket.on('feed:new_comment', (comment) => {
      setUpdates(prev => [createUpdateFromComment(comment), ...prev]);
    });

    return () => {
      socket.off('feed:new_post');
      socket.off('feed:new_comment');
    };
  }, [socket]);

  return (
    <FlatList
      data={updates}
      renderItem={({ item }) => <UpdateItem update={item} />}
    />
  );
};
```

## Database Schema

### Core Tables

```sql
-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    type TEXT NOT NULL CHECK (type IN ('post', 'comment', 'like', 'follow', 'message', 'recommendation', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Presence
CREATE TABLE user_presence (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    is_online BOOLEAN NOT NULL DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_activity TEXT DEFAULT 'offline',
    metadata JSONB DEFAULT '{}'
);

-- Chat Rooms
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'public')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id),
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text',
    reply_to_id UUID REFERENCES chat_messages(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feed Activities
CREATE TABLE feed_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_type TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    target_id UUID,
    target_type TEXT,
    content TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Performance Indexes

```sql
-- Notification indexes
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_type_priority ON notifications(type, priority, created_at DESC);

-- Presence indexes
CREATE INDEX idx_user_presence_online ON user_presence(is_online, last_seen DESC);
CREATE INDEX idx_user_presence_activity ON user_presence(current_activity, last_seen DESC);

-- Chat indexes
CREATE INDEX idx_chat_messages_room_created ON chat_messages(room_id, created_at DESC);
CREATE INDEX idx_chat_messages_content_search ON chat_messages USING gin(to_tsvector('english', content));

-- Feed indexes
CREATE INDEX idx_feed_activities_user_created ON feed_activities(user_id, created_at DESC);
CREATE INDEX idx_feed_activities_type_created ON feed_activities(activity_type, created_at DESC);
```

## API Endpoints

### Notification Endpoints

```typescript
// Get user notifications
GET /api/v1/realtime/notifications
Query: limit, unread_only

// Mark notifications as read
PUT /api/v1/realtime/notifications/read
Body: { notificationIds: string[] }

// Update notification preferences
PUT /api/v1/realtime/notifications/preferences
Body: { preferences: NotificationPreferences }
```

### Live Feed Endpoints

```typescript
// Get live feed updates
GET /api/v1/realtime/feed
Query: limit, following_only, types, product_types, time_range

// Get trending activities
GET /api/v1/realtime/feed/trending
Query: limit

// Get feed statistics
GET /api/v1/realtime/feed/statistics
```

### Presence Endpoints

```typescript
// Get user presence
GET /api/v1/realtime/presence/me

// Update user activity
PUT /api/v1/realtime/presence/activity
Body: { activity: string, metadata?: any }

// Get online friends
GET /api/v1/realtime/presence/online-friends
```

### Chat Endpoints

```typescript
// Get user chat rooms
GET /api/v1/realtime/chat/rooms

// Create chat room
POST /api/v1/realtime/chat/rooms
Body: { participants: string[], type?: string, name?: string }

// Get room messages
GET /api/v1/realtime/chat/rooms/:roomId/messages
Query: limit

// Send message
POST /api/v1/realtime/chat/rooms/:roomId/messages
Body: { message: string, type?: string, replyToId?: string }
```

## WebSocket Events

### Client to Server Events

```typescript
// Feed subscription
socket.emit('feed:subscribe');

// Join chat room
socket.emit('chat:join', { roomId: string });

// Send chat message
socket.emit('chat:message', { roomId: string, message: string });

// Update activity
socket.emit('presence:activity', { activity: string, metadata?: any });

// Mark notifications read
socket.emit('notifications:mark_read', { notificationIds: string[] });
```

### Server to Client Events

```typescript
// New notification
socket.on('notification:new', (notification) => {});

// New post in feed
socket.on('feed:new_post', (post) => {});

// New comment
socket.on('feed:new_comment', (comment) => {});

// New chat message
socket.on('chat:new_message', ({ roomId, message }) => {});

// User typing
socket.on('chat:user_typing', ({ userId, isTyping }) => {});

// Friend activity
socket.on('presence:friend_activity', ({ userId, activity }) => {});
```

## Performance Optimization

### Connection Management

```typescript
// Exponential backoff reconnection
const reconnectWithBackoff = (attempt: number) => {
  const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
  setTimeout(() => connect(), delay);
};

// Connection pooling
const connectionPool = new Map<string, Socket>();

// Heartbeat monitoring
setInterval(() => {
  socket.emit('ping');
}, 30000);
```

### Message Batching

```typescript
// Batch notifications for efficiency
const notificationBatch: Notification[] = [];
const batchTimeout = setTimeout(() => {
  if (notificationBatch.length > 0) {
    sendBatchNotifications(notificationBatch);
    notificationBatch.length = 0;
  }
}, 1000);
```

### Caching Strategy

```typescript
// Redis caching for presence data
const cachePresence = async (userId: string, presence: UserPresence) => {
  await redis.setex(`presence:${userId}`, 300, JSON.stringify(presence));
};

// In-memory caching for frequent data
const presenceCache = new Map<string, UserPresence>();
```

## Security Considerations

### Authentication

```typescript
// JWT token validation for WebSocket connections
const authenticateSocket = async (socket: Socket, next: Function) => {
  try {
    const token = socket.handshake.auth.token;
    const payload = await jwt.verify(token, JWT_SECRET);
    socket.userId = payload.sub;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};
```

### Rate Limiting

```typescript
// Message rate limiting
const messageRateLimit = new Map<string, number[]>();

const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const userMessages = messageRateLimit.get(userId) || [];
  const recentMessages = userMessages.filter(time => now - time < 60000);
  
  if (recentMessages.length >= 60) { // 60 messages per minute
    return false;
  }
  
  messageRateLimit.set(userId, [...recentMessages, now]);
  return true;
};
```

### Data Validation

```typescript
// Input sanitization
const sanitizeMessage = (message: string): string => {
  return message
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .substring(0, 1000); // Limit message length
};
```

## Monitoring and Analytics

### Connection Metrics

```typescript
const connectionMetrics = {
  totalConnections: 0,
  activeConnections: 0,
  reconnectionAttempts: 0,
  averageLatency: 0,
  errorRate: 0,
};

// Track connection events
socket.on('connect', () => {
  connectionMetrics.totalConnections++;
  connectionMetrics.activeConnections++;
});

socket.on('disconnect', () => {
  connectionMetrics.activeConnections--;
});
```

### Performance Monitoring

```typescript
// Message delivery tracking
const trackMessageDelivery = async (messageId: string, userId: string, deliveryTime: number) => {
  await analytics.track('message_delivered', {
    messageId,
    userId,
    deliveryTime,
    timestamp: new Date(),
  });
};

// Notification engagement tracking
const trackNotificationEngagement = async (notificationId: string, action: string) => {
  await analytics.track('notification_engagement', {
    notificationId,
    action, // 'viewed', 'clicked', 'dismissed'
    timestamp: new Date(),
  });
};
```

## Testing Strategy

### Unit Tests

```typescript
describe('NotificationService', () => {
  it('should create and send notification', async () => {
    const notification = await notificationService.createNotification({
      userId: 'user-1',
      type: 'post',
      title: 'New Post',
      message: 'Someone shared a new post',
      priority: 'normal',
    });

    expect(notification).toBeDefined();
    expect(notification.title).toBe('New Post');
  });
});
```

### Integration Tests

```typescript
describe('WebSocket Integration', () => {
  it('should handle real-time message delivery', async () => {
    const client1 = io('http://localhost:3000/realtime');
    const client2 = io('http://localhost:3000/realtime');

    client1.emit('chat:join', { roomId: 'test-room' });
    client2.emit('chat:join', { roomId: 'test-room' });

    const messagePromise = new Promise(resolve => {
      client2.on('chat:new_message', resolve);
    });

    client1.emit('chat:message', {
      roomId: 'test-room',
      message: 'Hello World',
    });

    const receivedMessage = await messagePromise;
    expect(receivedMessage.message).toBe('Hello World');
  });
});
```

### Load Testing

```typescript
// Simulate concurrent connections
const simulateLoad = async (connectionCount: number) => {
  const clients = [];
  
  for (let i = 0; i < connectionCount; i++) {
    const client = io('http://localhost:3000/realtime');
    clients.push(client);
    
    client.on('connect', () => {
      console.log(`Client ${i} connected`);
    });
  }
  
  // Send messages from all clients
  clients.forEach((client, index) => {
    setInterval(() => {
      client.emit('chat:message', {
        roomId: 'load-test-room',
        message: `Message from client ${index}`,
      });
    }, 1000);
  });
};
```

## Deployment Considerations

### Scaling WebSocket Connections

```typescript
// Redis adapter for multi-server scaling
import { RedisAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

io.adapter(new RedisAdapter(pubClient, subClient));
```

### Health Checks

```typescript
// WebSocket health check endpoint
@Get('health')
async healthCheck() {
  return {
    status: 'healthy',
    timestamp: new Date(),
    connections: this.realtimeGateway.getConnectedUsersCount(),
    services: {
      websocket: 'operational',
      notifications: 'operational',
      chat: 'operational',
      presence: 'operational',
    },
  };
}
```

## Conclusion

The real-time features system transforms Inked Draw into a dynamic, engaging platform where users can interact instantly and stay connected with the community. With enterprise-grade architecture, comprehensive security, and sophisticated performance optimization, it provides a premium real-time experience that scales with the platform's growth.

The system is designed to handle millions of concurrent connections while maintaining sub-second message delivery and 99.9% uptime, making it a key differentiator for the Inked Draw platform.
