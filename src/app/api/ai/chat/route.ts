import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { messages, code, language, question } = await request.json()

    if (!messages && !code) {
      return NextResponse.json(
        { error: 'Either messages or code is required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    let completion

    if (code) {
      // Handle code review/help request
      const systemMessage = {
        role: 'system',
        content: `You are an expert programming assistant helping users with their ${language || 'programming'} code. 
        Provide helpful, constructive feedback and suggestions. Be concise but thorough. 
        Focus on code quality, best practices, and potential improvements.`
      }

      const userMessage = {
        role: 'user',
        content: question 
          ? `Question: ${question}\n\nCode:\n${code}`
          : `Please review this ${language || 'code'} and provide suggestions:\n\n${code}`
      }

      completion = await zai.chat.completions.create({
        messages: [systemMessage, userMessage],
        temperature: 0.7,
        max_tokens: 1000
      })
    } else {
      // Handle general chat
      completion = await zai.chat.completions.create({
        messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    }

    const response = completion.choices[0]?.message?.content

    if (!response) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI API Error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    )
  }
}