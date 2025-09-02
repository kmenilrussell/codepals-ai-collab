'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface SessionUser {
  id: string;
  name: string;
  avatar?: string;
  role: 'host' | 'member' | 'observer';
}

interface UseSocketOptions {
  autoConnect?: boolean;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { autoConnect = true } = options
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [participants, setParticipants] = useState<SessionUser[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      autoConnect,
    })

    const socket = socketRef.current

    // Connection events
    socket.on('connect', () => {
      setIsConnected(true)
      setError(null)
      console.log('Connected to socket server')
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
      console.log('Disconnected from socket server')
    })

    socket.on('connect_error', (err) => {
      setError(err.message)
      setIsConnected(false)
      console.error('Socket connection error:', err)
    })

    // Session events
    socket.on('session-joined', (data: {
      sessionId: string;
      participants: SessionUser[];
      isAiSession: boolean;
    }) => {
      setParticipants(data.participants)
      console.log('Joined session:', data.sessionId)
    })

    socket.on('user-joined', (data: {
      user: SessionUser;
      participants: SessionUser[];
    }) => {
      setParticipants(data.participants)
      console.log('User joined:', data.user.name)
    })

    socket.on('user-left', (data: {
      userId: string;
      participants: SessionUser[];
    }) => {
      setParticipants(data.participants)
      console.log('User left:', data.userId)
    })

    // Code collaboration events
    socket.on('code-changed', (data: {
      code: string;
      language: string;
      userId: string;
      timestamp: string;
    }) => {
      // This will be handled by the editor component
      console.log('Code changed by:', data.userId)
    })

    socket.on('language-changed', (data: {
      language: string;
      userId: string;
    }) => {
      console.log('Language changed to:', data.language, 'by:', data.userId)
    })

    // Chat events
    socket.on('chat-message-received', (data: {
      content: string;
      userId?: string;
      messageType: 'text' | 'code' | 'system';
      timestamp: string;
    }) => {
      console.log('Chat message received:', data.content)
    })

    // AI events
    socket.on('ai-help-requested', (data: {
      code: string;
      language: string;
      question?: string;
      timestamp: string;
    }) => {
      console.log('AI help requested:', data.question || 'No specific question')
    })

    // Session invite events
    socket.on('session-invite', (data: {
      sessionId: string;
      inviterName: string;
      timestamp: string;
    }) => {
      console.log('Session invite from:', data.inviterName)
    })

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [autoConnect])

  // Session management functions
  const joinSession = (sessionId: string, user: SessionUser, isAiSession = false) => {
    if (socketRef.current) {
      socketRef.current.emit('join-session', {
        sessionId,
        user,
        isAiSession
      })
    }
  }

  const leaveSession = (sessionId: string, userId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-session', {
        sessionId,
        userId
      })
    }
  }

  // Code collaboration functions
  const sendCodeChange = (sessionId: string, code: string, language: string, userId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('code-change', {
        sessionId,
        code,
        language,
        userId,
        timestamp: new Date().toISOString()
      })
    }
  }

  const sendLanguageChange = (sessionId: string, language: string, userId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('language-change', {
        sessionId,
        language,
        userId
      })
    }
  }

  const sendCursorPosition = (sessionId: string, userId: string, position: { line: number; column: number }) => {
    if (socketRef.current) {
      socketRef.current.emit('cursor-position', {
        sessionId,
        userId,
        position
      })
    }
  }

  const sendSelectionChange = (sessionId: string, userId: string, selection: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  }) => {
    if (socketRef.current) {
      socketRef.current.emit('selection-change', {
        sessionId,
        userId,
        selection
      })
    }
  }

  // Chat functions
  const sendChatMessage = (sessionId: string, content: string, userId?: string, messageType: 'text' | 'code' | 'system' = 'text') => {
    if (socketRef.current) {
      socketRef.current.emit('chat-message', {
        sessionId,
        content,
        userId,
        messageType,
        timestamp: new Date().toISOString()
      })
    }
  }

  // AI functions
  const requestAiHelp = (sessionId: string, code: string, language: string, question?: string) => {
    if (socketRef.current) {
      socketRef.current.emit('ai-help-request', {
        sessionId,
        code,
        language,
        question
      })
    }
  }

  // Invite functions
  const inviteUser = (sessionId: string, invitedUserId: string, inviterName: string) => {
    if (socketRef.current) {
      socketRef.current.emit('invite-user', {
        sessionId,
        invitedUserId,
        inviterName
      })
    }
  }

  return {
    socket: socketRef.current,
    isConnected,
    participants,
    error,
    joinSession,
    leaveSession,
    sendCodeChange,
    sendLanguageChange,
    sendCursorPosition,
    sendSelectionChange,
    sendChatMessage,
    requestAiHelp,
    inviteUser
  }
}