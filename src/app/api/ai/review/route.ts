import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { code, language, context } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const systemMessage = {
      role: 'system',
        content: `You are an expert code reviewer for ${language || 'programming'}. 
        Analyze the provided code and give a comprehensive review including:
        1. Overall code quality score (1-100)
        2. Strengths of the code
        3. Areas for improvement
        4. Specific suggestions with line-by-line feedback when possible
        5. Best practices recommendations
        6. Potential bugs or issues
        
        Format your response as JSON with the following structure:
        {
          "score": number,
          "strengths": string[],
          "improvements": string[],
          "suggestions": string[],
          "bestPractices": string[],
          "potentialIssues": string[],
          "summary": string
        }`
    }

    const userMessage = {
      role: 'user',
      content: `Please review this ${language || 'code'}${context ? ` in the context of: ${context}` : ''}:\n\n${code}`
    }

    const completion = await zai.chat.completions.create({
      messages: [systemMessage, userMessage],
      temperature: 0.3,
      max_tokens: 2000
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      )
    }

    // Try to parse the response as JSON, fall back to raw text if parsing fails
    let reviewData
    try {
      reviewData = JSON.parse(response)
    } catch (parseError) {
      // If JSON parsing fails, create a structured response from the text
      reviewData = {
        score: 75, // Default score
        strengths: [],
        improvements: [],
        suggestions: [response],
        bestPractices: [],
        potentialIssues: [],
        summary: response
      }
    }

    return NextResponse.json({
      review: reviewData,
      rawResponse: response,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI Review API Error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI review' },
      { status: 500 }
    )
  }
}