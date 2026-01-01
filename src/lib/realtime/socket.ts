/**
 * Real-time Socket.IO Server
 * WebSocket connections for real-time updates
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { z } from 'zod';

const SocketConfigSchema = z.object({
  cors: z.object({
    origin: z.union([z.string(), z.array(z.string())]).default('*'),
    methods: z.array(z.string()).default(['GET', 'POST']),
    credentials: z.boolean().default(true),
  }),
  pingTimeout: z.number().default(60000),
  pingInterval: z.number().default(25000),
});

type SocketConfig = z.infer<typeof SocketConfigSchema>;

export interface SocketUser {
  userId: string;
  socketId: string;
  roles: string[];
  organizationId?: string;
  connectedAt: Date;
}

export class RealtimeSocketServer {
  private io: SocketIOServer | null = null;
  private users: Map<string, SocketUser> = new Map();
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds

  /**
   * Initialize Socket.IO server
   */
  initialize(httpServer: HTTPServer, config: Partial<SocketConfig> = {}): SocketIOServer {
    const socketConfig = SocketConfigSchema.parse({
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      ...config,
    });

    this.io = new SocketIOServer(httpServer, {
      cors: socketConfig.cors,
      pingTimeout: socketConfig.pingTimeout,
      pingInterval: socketConfig.pingInterval,
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    return this.io;
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    if (!this.io) return;

    this.io.use(async (socket, next) => {
      try {
        // Extract token from handshake
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify token (implement your JWT verification here)
        // const decoded = await verifyToken(token);
        // socket.data.userId = decoded.userId;
        // socket.data.roles = decoded.roles;

        // For now, just accept the connection
        socket.data.userId = socket.handshake.auth.userId || 'anonymous';
        socket.data.roles = socket.handshake.auth.roles || ['user'];

        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Register user
      this.registerUser(socket);

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        this.unregisterUser(socket);
      });

      // Handle room subscriptions
      socket.on('subscribe', (rooms: string | string[]) => {
        const roomList = Array.isArray(rooms) ? rooms : [rooms];
        roomList.forEach(room => {
          socket.join(room);
          console.log(`Socket ${socket.id} joined room: ${room}`);
        });
      });

      socket.on('unsubscribe', (rooms: string | string[]) => {
        const roomList = Array.isArray(rooms) ? rooms : [rooms];
        roomList.forEach(room => {
          socket.leave(room);
          console.log(`Socket ${socket.id} left room: ${room}`);
        });
      });

      // Handle presence
      socket.on('presence:online', () => {
        socket.broadcast.emit('user:online', {
          userId: socket.data.userId,
          socketId: socket.id,
        });
      });

      socket.on('presence:away', () => {
        socket.broadcast.emit('user:away', {
          userId: socket.data.userId,
          socketId: socket.id,
        });
      });

      // Handle typing indicators
      socket.on('typing:start', (data: { conversationId: string }) => {
        socket.to(`conversation:${data.conversationId}`).emit('typing:start', {
          userId: socket.data.userId,
          conversationId: data.conversationId,
        });
      });

      socket.on('typing:stop', (data: { conversationId: string }) => {
        socket.to(`conversation:${data.conversationId}`).emit('typing:stop', {
          userId: socket.data.userId,
          conversationId: data.conversationId,
        });
      });

      // Send connection acknowledgment
      socket.emit('connected', {
        socketId: socket.id,
        userId: socket.data.userId,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Register connected user
   */
  private registerUser(socket: Socket): void {
    const user: SocketUser = {
      userId: socket.data.userId,
      socketId: socket.id,
      roles: socket.data.roles || [],
      organizationId: socket.data.organizationId,
      connectedAt: new Date(),
    };

    this.users.set(socket.id, user);

    // Track user's sockets
    if (!this.userSockets.has(user.userId)) {
      this.userSockets.set(user.userId, new Set());
    }
    this.userSockets.get(user.userId)?.add(socket.id);

    // Auto-subscribe to user's personal room
    socket.join(`user:${user.userId}`);

    // Auto-subscribe to organization room if applicable
    if (user.organizationId) {
      socket.join(`org:${user.organizationId}`);
    }

    // Auto-subscribe to role-based rooms
    user.roles.forEach(role => {
      socket.join(`role:${role}`);
    });
  }

  /**
   * Unregister disconnected user
   */
  private unregisterUser(socket: Socket): void {
    const user = this.users.get(socket.id);
    if (!user) return;

    this.users.delete(socket.id);

    // Remove from user sockets tracking
    const userSocketSet = this.userSockets.get(user.userId);
    if (userSocketSet) {
      userSocketSet.delete(socket.id);
      if (userSocketSet.size === 0) {
        this.userSockets.delete(user.userId);
      }
    }
  }

  /**
   * Emit to specific user (all their connections)
   */
  toUser(userId: string, event: string, data: any): void {
    this.io?.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Emit to specific room
   */
  toRoom(room: string, event: string, data: any): void {
    this.io?.to(room).emit(event, data);
  }

  /**
   * Emit to all users in organization
   */
  toOrganization(organizationId: string, event: string, data: any): void {
    this.io?.to(`org:${organizationId}`).emit(event, data);
  }

  /**
   * Emit to all users with specific role
   */
  toRole(role: string, event: string, data: any): void {
    this.io?.to(`role:${role}`).emit(event, data);
  }

  /**
   * Emit to all connected clients
   */
  broadcast(event: string, data: any): void {
    this.io?.emit(event, data);
  }

  /**
   * Get online users
   */
  getOnlineUsers(): SocketUser[] {
    return Array.from(this.users.values());
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * Get user's socket connections
   */
  getUserSockets(userId: string): string[] {
    return Array.from(this.userSockets.get(userId) || []);
  }

  /**
   * Get Socket.IO server instance
   */
  getServer(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Disconnect specific socket
   */
  disconnectSocket(socketId: string): void {
    const socket = this.io?.sockets.sockets.get(socketId);
    socket?.disconnect(true);
  }

  /**
   * Disconnect all sockets for a user
   */
  disconnectUser(userId: string): void {
    const socketIds = this.getUserSockets(userId);
    socketIds.forEach(socketId => this.disconnectSocket(socketId));
  }
}

/**
 * Singleton instance
 */
export const realtimeServer = new RealtimeSocketServer();

/**
 * Initialize real-time server
 */
export function initializeRealtimeServer(httpServer: HTTPServer, config?: Partial<SocketConfig>): SocketIOServer {
  return realtimeServer.initialize(httpServer, config);
}

/**
 * Emit event to user
 */
export function emitToUser(userId: string, event: string, data: any): void {
  realtimeServer.toUser(userId, event, data);
}

/**
 * Emit event to room
 */
export function emitToRoom(room: string, event: string, data: any): void {
  realtimeServer.toRoom(room, event, data);
}

/**
 * Emit event to organization
 */
export function emitToOrganization(organizationId: string, event: string, data: any): void {
  realtimeServer.toOrganization(organizationId, event, data);
}

/**
 * Broadcast to all users
 */
export function broadcast(event: string, data: any): void {
  realtimeServer.broadcast(event, data);
}
