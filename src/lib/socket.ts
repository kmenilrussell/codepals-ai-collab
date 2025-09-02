import { Server } from 'socket.io';

interface SessionUser {
  id: string;
  name: string;
  avatar?: string;
  role: 'host' | 'member' | 'observer';
}

interface CodeChange {
  sessionId: string;
  code: string;
  language: string;
  userId: string;
  timestamp: string;
}

interface ChatMessage {
  sessionId: string;
  content: string;
  userId?: string;
  messageType: 'text' | 'code' | 'system';
  timestamp: string;
}

// Store active sessions and participants
const activeSessions = new Map<string, Set<string>>();
const sessionUsers = new Map<string, Map<string, SessionUser>>();

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join a session
    socket.on('join-session', (data: { 
      sessionId: string; 
      user: SessionUser;
      isAiSession: boolean;
    }) => {
      const { sessionId, user, isAiSession } = data;
      
      // Join socket room for the session
      socket.join(sessionId);
      
      // Track session participants
      if (!activeSessions.has(sessionId)) {
        activeSessions.set(sessionId, new Set());
        sessionUsers.set(sessionId, new Map());
      }
      
      activeSessions.get(sessionId)!.add(socket.id);
      sessionUsers.get(sessionId)!.set(user.id, user);
      
      // Notify others in the session
      socket.to(sessionId).emit('user-joined', {
        user,
        participants: Array.from(sessionUsers.get(sessionId)!.values())
      });
      
      // Send current session state to the joining user
      socket.emit('session-joined', {
        sessionId,
        participants: Array.from(sessionUsers.get(sessionId)!.values()),
        isAiSession
      });
      
      console.log(`User ${user.name} joined session ${sessionId}`);
    });
    
    // Handle code changes
    socket.on('code-change', (data: CodeChange) => {
      const { sessionId, code, language, userId, timestamp } = data;
      
      // Broadcast code change to other participants
      socket.to(sessionId).emit('code-changed', {
        code,
        language,
        userId,
        timestamp
      });
      
      console.log(`Code changed in session ${sessionId} by user ${userId}`);
    });
    
    // Handle chat messages
    socket.on('chat-message', (data: ChatMessage) => {
      const { sessionId, content, userId, messageType, timestamp } = data;
      
      // Broadcast chat message to all participants in the session
      io.to(sessionId).emit('chat-message-received', {
        content,
        userId,
        messageType,
        timestamp
      });
      
      console.log(`Chat message in session ${sessionId}: ${content}`);
    });
    
    // Handle cursor position (for real-time cursor tracking)
    socket.on('cursor-position', (data: {
      sessionId: string;
      userId: string;
      position: { line: number; column: number };
    }) => {
      const { sessionId, userId, position } = data;
      
      // Broadcast cursor position to other participants
      socket.to(sessionId).emit('cursor-moved', {
        userId,
        position
      });
    });
    
    // Handle selection (for real-time selection tracking)
    socket.on('selection-change', (data: {
      sessionId: string;
      userId: string;
      selection: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };
    }) => {
      const { sessionId, userId, selection } = data;
      
      // Broadcast selection change to other participants
      socket.to(sessionId).emit('selection-changed', {
        userId,
        selection
      });
    });
    
    // Handle language change
    socket.on('language-change', (data: {
      sessionId: string;
      language: string;
      userId: string;
    }) => {
      const { sessionId, language, userId } = data;
      
      // Broadcast language change to all participants
      io.to(sessionId).emit('language-changed', {
        language,
        userId
      });
      
      console.log(`Language changed to ${language} in session ${sessionId}`);
    });
    
    // Handle AI help requests
    socket.on('ai-help-request', (data: {
      sessionId: string;
      code: string;
      language: string;
      question?: string;
    }) => {
      const { sessionId, code, language, question } = data;
      
      // Broadcast AI help request to all participants
      io.to(sessionId).emit('ai-help-requested', {
        code,
        language,
        question,
        timestamp: new Date().toISOString()
      });
      
      console.log(`AI help requested in session ${sessionId}`);
    });
    
    // Handle session end
    socket.on('leave-session', (data: { sessionId: string; userId: string }) => {
      const { sessionId, userId } = data;
      
      // Remove user from session
      socket.leave(sessionId);
      activeSessions.get(sessionId)?.delete(socket.id);
      sessionUsers.get(sessionId)?.delete(userId);
      
      // Notify others in the session
      socket.to(sessionId).emit('user-left', {
        userId,
        participants: sessionUsers.get(sessionId) ? 
          Array.from(sessionUsers.get(sessionId)!.values()) : []
      });
      
      // Clean up empty sessions
      if (activeSessions.get(sessionId)?.size === 0) {
        activeSessions.delete(sessionId);
        sessionUsers.delete(sessionId);
      }
      
      console.log(`User ${userId} left session ${sessionId}`);
    });
    
    // Handle session invite
    socket.on('invite-user', (data: {
      sessionId: string;
      invitedUserId: string;
      inviterName: string;
    }) => {
      const { sessionId, invitedUserId, inviterName } = data;
      
      // Send invite to specific user (in real implementation, this would use user socket mapping)
      io.emit('session-invite', {
        sessionId,
        inviterName,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Invite sent to user ${invitedUserId} for session ${sessionId}`);
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Clean up from all sessions
      for (const [sessionId, sockets] of activeSessions.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          
          // Find and remove the user from session users
          const users = sessionUsers.get(sessionId);
          if (users) {
            let disconnectedUserId: string | null = null;
            for (const [userId, user] of users.entries()) {
              // In real implementation, we'd have a socket-to-user mapping
              // For now, we'll just remove the first user (simplified)
              disconnectedUserId = userId;
              users.delete(userId);
              break;
            }
            
            if (disconnectedUserId) {
              // Notify others in the session
              socket.to(sessionId).emit('user-left', {
                userId: disconnectedUserId,
                participants: Array.from(users.values())
              });
            }
          }
          
          // Clean up empty sessions
          if (sockets.size === 0) {
            activeSessions.delete(sessionId);
            sessionUsers.delete(sessionId);
          }
        }
      }
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to CodePals Real-time Collaboration!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};