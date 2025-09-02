'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import CollaborativeEditor from '@/components/collaborative-editor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, Bot, Settings, Share } from 'lucide-react'
import Link from 'next/link'

export default function SessionPage() {
  const params = useParams()
  const sessionId = params.id as string
  const [sessionData, setSessionData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAiSession, setIsAiSession] = useState(false)

  useEffect(() => {
    // Simulate fetching session data
    const fetchSessionData = async () => {
      setIsLoading(true)
      
      // Simulate API call
      setTimeout(() => {
        setSessionData({
          id: sessionId,
          title: 'JavaScript Practice Session',
          language: 'javascript',
          participants: 2,
          isPrivate: false,
          createdAt: new Date().toISOString(),
          createdBy: 'user123'
        })
        setIsAiSession(sessionId.includes('ai'))
        setIsLoading(false)
      }, 1000)
    }

    if (sessionId) {
      fetchSessionData()
    }
  }, [sessionId])

  const handleCodeChange = (code: string) => {
    // Handle code changes (would sync with backend in real implementation)
    console.log('Code changed:', code)
  }

  const handleLanguageChange = (language: string) => {
    // Handle language changes
    console.log('Language changed:', language)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Session Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {sessionData?.title || 'Coding Session'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    {sessionData?.language || 'javascript'}
                  </Badge>
                  <Badge variant="outline">
                    <Users className="w-3 h-3 mr-1" />
                    {sessionData?.participants || 1} participant{sessionData?.participants !== 1 ? 's' : ''}
                  </Badge>
                  {isAiSession && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      <Bot className="w-3 h-3 mr-1" />
                      AI Session
                    </Badge>
                  )}
                  {sessionData?.isPrivate && (
                    <Badge variant="secondary">Private</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Editor Area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px]">
              <CardContent className="p-0 h-full">
                <CollaborativeEditor
                  sessionId={sessionId}
                  isAiSession={isAiSession}
                  onCodeChange={handleCodeChange}
                  onLanguageChange={handleLanguageChange}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Session Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Session ID</p>
                  <p className="text-sm font-mono">{sessionId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Language</p>
                  <p className="text-sm capitalize">{sessionData?.language}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-sm">
                    {new Date(sessionData?.createdAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                      Y
                    </div>
                    <div>
                      <p className="text-sm font-medium">You</p>
                      <p className="text-xs text-gray-500">Host</p>
                    </div>
                  </div>
                  {sessionData?.participants > 1 && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                        A
                      </div>
                      <div>
                        <p className="text-sm font-medium">Alex</p>
                        <p className="text-xs text-gray-500">Member</p>
                      </div>
                    </div>
                  )}
                  {isAiSession && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">AI Assistant</p>
                        <p className="text-xs text-gray-500">Always available</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-sm">
                  <Users className="w-4 h-4 mr-2" />
                  Invite Partner
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <Bot className="w-4 h-4 mr-2" />
                  Get AI Help
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <Share className="w-4 h-4 mr-2" />
                  Copy Session Link
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}