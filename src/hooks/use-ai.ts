'use client'

import { useState } from 'react'

interface AIChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface AIReviewResponse {
  score: number
  strengths: string[]
  improvements: string[]
  suggestions: string[]
  bestPractices: string[]
  potentialIssues: string[]
  summary: string
}

interface UseAIOptions {
  onError?: (error: string) => void
  onSuccess?: (response: any) => void
}

export const useAI = (options: UseAIOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chatHistory, setChatHistory] = useState<AIChatMessage[]>([])
  const [lastResponse, setLastResponse] = useState<string | null>(null)

  const { onError, onSuccess } = options

  const clearError = () => setError(null)

  const sendChatMessage = async (
    messages: AIChatMessage[],
    code?: string,
    language?: string,
    question?: string
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          code,
          language,
          question
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get AI response')
      }

      const data = await response.json()
      setLastResponse(data.response)
      
      // Add assistant response to chat history
      if (messages.length > 0) {
        setChatHistory(prev => [
          ...prev,
          ...messages.filter(msg => msg.role === 'user'),
          { role: 'assistant', content: data.response }
        ])
      }

      onSuccess?.(data)
      return data.response

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      onError?.(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getCodeReview = async (
    code: string,
    language?: string,
    context?: string
  ): Promise<AIReviewResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          context
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get AI review')
      }

      const data = await response.json()
      setLastResponse(data.rawResponse)
      onSuccess?.(data)
      return data.review

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      onError?.(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getAIHelp = async (
    code: string,
    language: string,
    question: string
  ): Promise<string> => {
    const messages: AIChatMessage[] = [
      {
        role: 'user',
        content: `I'm working with ${language} code and need help. Here's my code:\n\n${code}\n\nMy question: ${question}`
      }
    ]

    return sendChatMessage(messages, code, language, question)
  }

  const generateCode = async (
    prompt: string,
    language: string
  ): Promise<string> => {
    const messages: AIChatMessage[] = [
      {
        role: 'system',
        content: `You are an expert ${language} programmer. Generate clean, efficient, and well-commented ${language} code based on the user's request.`
      },
      {
        role: 'user',
        content: prompt
      }
    ]

    return sendChatMessage(messages)
  }

  const explainCode = async (
    code: string,
    language: string
  ): Promise<string> => {
    const messages: AIChatMessage[] = [
      {
        role: 'system',
        content: `You are an expert programming instructor. Explain this ${language} code in a clear, educational way. Break down what each part does and provide insights into the programming concepts used.`
      },
      {
        role: 'user',
        content: `Please explain this ${language} code:\n\n${code}`
      }
    ]

    return sendChatMessage(messages)
  }

  const debugCode = async (
    code: string,
    language: string,
    error?: string
  ): Promise<string> => {
    const messages: AIChatMessage[] = [
      {
        role: 'system',
        content: `You are an expert debugging assistant. Help identify and fix issues in ${language} code. Provide clear explanations of the problems and offer corrected code.`
      },
      {
        role: 'user',
        content: `Help me debug this ${language} code${error ? ` with this error: ${error}` : ''}:\n\n${code}`
      }
    ]

    return sendChatMessage(messages)
  }

  const optimizeCode = async (
    code: string,
    language: string
  ): Promise<string> => {
    const messages: AIChatMessage[] = [
      {
        role: 'system',
        content: `You are an expert code optimizer. Analyze the provided ${language} code and suggest optimizations for better performance, readability, and maintainability. Provide the optimized version with explanations.`
      },
      {
        role: 'user',
        content: `Please optimize this ${language} code:\n\n${code}`
      }
    ]

    return sendChatMessage(messages)
  }

  const clearChatHistory = () => {
    setChatHistory([])
    setLastResponse(null)
  }

  return {
    isLoading,
    error,
    chatHistory,
    lastResponse,
    clearError,
    sendChatMessage,
    getCodeReview,
    getAIHelp,
    generateCode,
    explainCode,
    debugCode,
    optimizeCode,
    clearChatHistory
  }
}