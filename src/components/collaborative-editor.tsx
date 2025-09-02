'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Editor } from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  Play, 
  Save, 
  Users, 
  Bot, 
  MessageSquare, 
  Settings,
  Share,
  Download,
  Copy,
  CheckCircle,
  Send
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSocket } from '@/hooks/use-socket'
import { useAI } from '@/hooks/use-ai'

interface CollaborativeEditorProps {
  sessionId?: string
  isAiSession?: boolean
  onCodeChange?: (code: string) => void
  onLanguageChange?: (language: string) => void
}

interface ChatMessage {
  content: string
  userId?: string
  userName?: string
  messageType: 'text' | 'code' | 'system'
  timestamp: string
}

const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' }
]

const DEFAULT_CODE = {
  javascript: `// Welcome to CodePals!
function greet(name) {
  return \`Hello, \${name}! Welcome to collaborative coding!\`;
}

console.log(greet("Developer"));`,
  python: `# Welcome to CodePals!
def greet(name):
    return f"Hello, {name}! Welcome to collaborative coding!"

print(greet("Developer"))`,
  java: `// Welcome to CodePals!
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Developer! Welcome to collaborative coding!");
    }
}`
}

export default function CollaborativeEditor({
  sessionId,
  isAiSession = false,
  onCodeChange,
  onLanguageChange
}: CollaborativeEditorProps) {
  const [code, setCode] = useState(DEFAULT_CODE.javascript)
  const [language, setLanguage] = useState('javascript')
  const [isConnected, setIsConnected] = useState(false)
  const [participants, setParticipants] = useState(1)
  const [isSaved, setIsSaved] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newChatMessage, setNewChatMessage] = useState('')
  const [isProcessingCodeChange, setIsProcessingCodeChange] = useState(false)
  const [aiQuestion, setAiQuestion] = useState('')
  const editorRef = useRef<any>(null)
  const { toast } = useToast()

  // Initialize socket connection
  const socket = useSocket({
    autoConnect: !!sessionId
  })

  // Initialize AI functionality
  const ai = useAI({
    onError: (error) => {
      toast({
        title: "AI Error",
        description: error,
        variant: "destructive"
      })
    },
    onSuccess: (response) => {
      console.log('AI response:', response)
    }
  })

  useEffect(() => {
    if (sessionId && socket.isConnected) {
      // Join the session
      const mockUser = {
        id: 'current-user',
        name: 'You',
        role: 'host' as const
      }
      
      socket.joinSession(sessionId, mockUser, isAiSession)
      setIsConnected(true)
      setParticipants(socket.participants.length)
      
      toast({
        title: "Connected to session",
        description: `You're now connected to session ${sessionId}`,
      })
    }
  }, [sessionId, socket.isConnected, socket.participants, isAiSession, toast])

  useEffect(() => {
    // Update participants count when it changes
    setParticipants(socket.participants.length)
  }, [socket.participants])

  useEffect(() => {
    // Handle incoming chat messages
    const handleChatMessage = (data: any) => {
      const message: ChatMessage = {
        content: data.content,
        userId: data.userId,
        userName: data.userId === 'current-user' ? 'You' : 'Partner',
        messageType: data.messageType,
        timestamp: data.timestamp
      }
      setChatMessages(prev => [...prev, message])
    }

    // Handle code changes from other users
    const handleCodeChanged = (data: any) => {
      if (data.userId !== 'current-user') {
        setIsProcessingCodeChange(true)
        setCode(data.code)
        setLanguage(data.language)
        setIsProcessingCodeChange(false)
      }
    }

    // Handle language changes from other users
    const handleLanguageChanged = (data: any) => {
      if (data.userId !== 'current-user') {
        setLanguage(data.language)
      }
    }

    // Handle AI help requests
    const handleAiHelpRequested = (data: any) => {
      setAiResponse(`AI Help Requested:\n\nCode:\n${data.code}\n\nLanguage: ${data.language}\n\nQuestion: ${data.question || 'General help requested'}`)
    }

    // Set up socket event listeners
    if (socket.socket) {
      socket.socket.on('chat-message-received', handleChatMessage)
      socket.socket.on('code-changed', handleCodeChanged)
      socket.socket.on('language-changed', handleLanguageChanged)
      socket.socket.on('ai-help-requested', handleAiHelpRequested)
    }

    return () => {
      if (socket.socket) {
        socket.socket.off('chat-message-received', handleChatMessage)
        socket.socket.off('code-changed', handleCodeChanged)
        socket.socket.off('language-changed', handleLanguageChanged)
        socket.socket.off('ai-help-requested', handleAiHelpRequested)
      }
    }
  }, [socket.socket])

  const handleEditorDidMount = useCallback((editor: any) => {
    editorRef.current = editor
    
    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'on',
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      selectOnLineNumbers: true,
      matchBrackets: 'always',
      autoIndent: 'advanced',
      formatOnPaste: true,
      formatOnType: true
    })
  }, [])

  const handleCodeChange = useCallback((value: string | undefined) => {
    const newCode = value || ''
    setCode(newCode)
    setIsSaved(false)
    onCodeChange?.(newCode)

    // Send code change to other participants
    if (sessionId && socket.isConnected && !isProcessingCodeChange) {
      socket.sendCodeChange(sessionId, newCode, language, 'current-user')
    }
  }, [sessionId, socket.isConnected, language, isProcessingCodeChange, onCodeChange])

  const handleLanguageChange = useCallback((newLanguage: string) => {
    setLanguage(newLanguage)
    onLanguageChange?.(newLanguage)
    
    // Set default code for the selected language
    if (DEFAULT_CODE[newLanguage as keyof typeof DEFAULT_CODE]) {
      setCode(DEFAULT_CODE[newLanguage as keyof typeof DEFAULT_CODE])
      setIsSaved(false)
    }

    // Send language change to other participants
    if (sessionId && socket.isConnected) {
      socket.sendLanguageChange(sessionId, newLanguage, 'current-user')
    }
  }, [sessionId, socket.isConnected, onLanguageChange])

  const handleSave = useCallback(() => {
    setIsSaved(true)
    toast({
      title: "Code saved",
      description: "Your code has been saved successfully.",
    })
  }, [toast])

  const handleRun = useCallback(() => {
    setIsRunning(true)
    setOutput('Running...')
    
    // Simulate code execution
    setTimeout(() => {
      setOutput('Hello, Developer! Welcome to collaborative coding!')
      setIsRunning(false)
    }, 1500)
  }, [])

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Code copied",
      description: "Code copied to clipboard.",
    })
  }, [code, toast])

  const handleDownloadCode = useCallback(() => {
    const extension = language === 'javascript' ? 'js' : 
                     language === 'typescript' ? 'ts' :
                     language === 'python' ? 'py' :
                     language === 'java' ? 'java' :
                     language === 'cpp' ? 'cpp' :
                     language === 'c' ? 'c' :
                     language === 'go' ? 'go' :
                     language === 'rust' ? 'rs' :
                     language === 'html' ? 'html' :
                     language === 'css' ? 'css' :
                     language === 'sql' ? 'sql' :
                     language === 'json' ? 'json' :
                     language === 'markdown' ? 'md' : 'txt'
    
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `codepals-code.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Code downloaded",
      description: `Code downloaded as codepals-code.${extension}`,
    })
  }, [code, language, toast])

  const handleShareSession = useCallback(() => {
    const shareUrl = `${window.location.origin}/session/${sessionId}`
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "Session link copied",
      description: "Share this link with your coding partner.",
    })
  }, [sessionId, toast])

  const handleAiHelp = useCallback(async () => {
    if (!code.trim()) {
      toast({
        title: "No code to analyze",
        description: "Please write some code first before requesting AI help.",
        variant: "destructive"
      })
      return
    }

    setAiResponse('Analyzing your code...')
    
    try {
      // Send AI help request
      if (sessionId && socket.isConnected) {
        socket.requestAiHelp(sessionId, code, language, aiQuestion || 'Please review my code and provide suggestions')
      }

      // Get real AI response
      const question = aiQuestion || 'Please review my code and provide suggestions for improvement.'
      const response = await ai.getAIHelp(code, language, question)
      setAiResponse(response)
      
      toast({
        title: "AI Help Complete",
        description: "AI analysis complete! Check the AI Help tab for suggestions.",
      })
    } catch (error) {
      setAiResponse('Sorry, I encountered an error while analyzing your code. Please try again.')
      console.error('AI help error:', error)
    }
  }, [sessionId, socket.isConnected, code, language, aiQuestion, ai, toast])

  const handleCodeReview = useCallback(async () => {
    if (!code.trim()) {
      toast({
        title: "No code to review",
        description: "Please write some code first before requesting a code review.",
        variant: "destructive"
      })
      return
    }

    setAiResponse('Performing comprehensive code review...')
    
    try {
      const review = await ai.getCodeReview(code, language, 'Collaborative coding session')
      
      const formattedResponse = `📊 Code Quality Score: ${review.score}/100

✅ Strengths:
${review.strengths.map(s => `• ${s}`).join('\n')}

🔧 Areas for Improvement:
${review.improvements.map(i => `• ${i}`).join('\n')}

💡 Suggestions:
${review.suggestions.map(s => `• ${s}`).join('\n')}

📚 Best Practices:
${review.bestPractices.map(b => `• ${b}`).join('\n')}

⚠️  Potential Issues:
${review.potentialIssues.map(i => `• ${i}`).join('\n')}

📝 Summary:
${review.summary}`
      
      setAiResponse(formattedResponse)
      
      toast({
        title: "Code Review Complete",
        description: `Your code scored ${review.score}/100. Check the AI Help tab for detailed feedback.`,
      })
    } catch (error) {
      setAiResponse('Sorry, I encountered an error while reviewing your code. Please try again.')
      console.error('Code review error:', error)
    }
  }, [code, language, ai, toast])

  const handleExplainCode = useCallback(async () => {
    if (!code.trim()) {
      toast({
        title: "No code to explain",
        description: "Please write some code first before requesting an explanation.",
        variant: "destructive"
      })
      return
    }

    setAiResponse('Analyzing and explaining your code...')
    
    try {
      const explanation = await ai.explainCode(code, language)
      setAiResponse(explanation)
      
      toast({
        title: "Code Explanation Complete",
        description: "AI explanation complete! Check the AI Help tab for the detailed explanation.",
      })
    } catch (error) {
      setAiResponse('Sorry, I encountered an error while explaining your code. Please try again.')
      console.error('Code explanation error:', error)
    }
  }, [code, language, ai, toast])

  const handleOptimizeCode = useCallback(async () => {
    if (!code.trim()) {
      toast({
        title: "No code to optimize",
        description: "Please write some code first before requesting optimization.",
        variant: "destructive"
      })
      return
    }

    setAiResponse('Optimizing your code...')
    
    try {
      const optimizedCode = await ai.optimizeCode(code, language)
      setAiResponse(`💡 Optimized Code:\n\n${optimizedCode}\n\nThe AI has analyzed your code and provided an optimized version above. The optimization focuses on performance, readability, and best practices.`)
      
      toast({
        title: "Code Optimization Complete",
        description: "AI optimization complete! Check the AI Help tab for the optimized code.",
      })
    } catch (error) {
      setAiResponse('Sorry, I encountered an error while optimizing your code. Please try again.')
      console.error('Code optimization error:', error)
    }
  }, [code, language, ai, toast])

  const handleSendChatMessage = useCallback(() => {
    if (newChatMessage.trim() && sessionId && socket.isConnected) {
      socket.sendChatMessage(sessionId, newChatMessage, 'current-user', 'text')
      setNewChatMessage('')
    }
  }, [newChatMessage, sessionId, socket.isConnected])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendChatMessage()
    }
  }, [handleSendChatMessage])

  return (
    <div className="flex flex-col h-full">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant={socket.isConnected ? "default" : "secondary"}>
              {socket.isConnected ? <CheckCircle className="w-3 h-3 mr-1" /> : null}
              {socket.isConnected ? "Connected" : "Offline"}
            </Badge>
            {sessionId && (
              <Badge variant="outline">
                Session: {sessionId.slice(0, 8)}...
              </Badge>
            )}
            {isAiSession && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                <Bot className="w-3 h-3 mr-1" />
                AI Session
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">{participants} participant{participants !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={handleCopyCode}>
            <Copy className="w-4 h-4 mr-1" />
            Copy
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" />
            {isSaved ? "Saved" : "Save"}
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleDownloadCode}>
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
          
          {sessionId && (
            <Button variant="outline" size="sm" onClick={handleShareSession}>
              <Share className="w-4 h-4 mr-1" />
              Share
            </Button>
          )}
          
          <Button onClick={handleRun} disabled={isRunning}>
            <Play className="w-4 h-4 mr-1" />
            {isRunning ? "Running..." : "Run"}
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex">
        <div className="flex-1">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            theme="vs-light"
            options={{
              readOnly: false,
              domReadOnly: false,
              scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8
              }
            }}
          />
        </div>

        {/* Side Panel */}
        <div className="w-80 border-l bg-gray-50 flex flex-col">
          <Tabs defaultValue="output" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="output">Output</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              {isAiSession && (
                <TabsTrigger value="ai">AI Help</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="output" className="flex-1 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Program Output</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-gray-900 text-green-400 p-3 rounded overflow-auto max-h-64">
                    {output || 'Run your code to see output here...'}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="chat" className="flex-1 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Session Chat</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                    {chatMessages.map((msg, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-semibold text-blue-600">
                          {msg.userName || 'System'}:
                        </span>
                        <p className="text-gray-600">{msg.content}</p>
                      </div>
                    ))}
                    {chatMessages.length === 0 && (
                      <div className="text-sm text-gray-500">
                        No messages yet. Start a conversation!
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Type a message..."
                      value={newChatMessage}
                      onChange={(e) => setNewChatMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleSendChatMessage}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {isAiSession && (
              <TabsContent value="ai" className="flex-1 p-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      AI Assistant
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Question Input */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          What would you like help with?
                        </label>
                        <Input
                          placeholder="e.g., 'How can I improve this code?', 'Explain this function', 'Find bugs'"
                          value={aiQuestion}
                          onChange={(e) => setAiQuestion(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      
                      {/* AI Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          onClick={handleAiHelp} 
                          variant="outline" 
                          className="w-full"
                          disabled={ai.isLoading}
                        >
                          {ai.isLoading ? "Analyzing..." : "Get Help"}
                        </Button>
                        <Button 
                          onClick={handleCodeReview} 
                          variant="outline" 
                          className="w-full"
                          disabled={ai.isLoading}
                        >
                          {ai.isLoading ? "Reviewing..." : "Code Review"}
                        </Button>
                        <Button 
                          onClick={handleExplainCode} 
                          variant="outline" 
                          className="w-full"
                          disabled={ai.isLoading}
                        >
                          {ai.isLoading ? "Explaining..." : "Explain Code"}
                        </Button>
                        <Button 
                          onClick={handleOptimizeCode} 
                          variant="outline" 
                          className="w-full"
                          disabled={ai.isLoading}
                        >
                          {ai.isLoading ? "Optimizing..." : "Optimize Code"}
                        </Button>
                      </div>
                      
                      {/* AI Response */}
                      {aiResponse && (
                        <div className="bg-blue-50 p-3 rounded text-sm max-h-64 overflow-y-auto">
                          <div className="whitespace-pre-wrap text-gray-700">
                            {aiResponse}
                          </div>
                        </div>
                      )}
                      
                      {/* Error Display */}
                      {ai.error && (
                        <div className="bg-red-50 p-3 rounded text-sm">
                          <div className="text-red-700">
                            Error: {ai.error}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}