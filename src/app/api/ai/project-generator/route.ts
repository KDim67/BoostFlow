import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Request payload structure for project generation API
interface ProjectGenerationRequest {
  prompt: string; // User's project description or requirements
  organizationName?: string; // Optional organization context
  industry?: string; // Optional industry context for better suggestions
}

// Response structure for AI-generated project suggestions
interface ProjectSuggestion {
  name: string; // Project title (max 60 characters)
  description: string; // Detailed project overview (200-400 words)
  suggestedStatus: string; // Project phase: planning|active|on-hold
  estimatedDuration: string; // Realistic timeline estimate
  keyFeatures: string[]; // Array of 3-5 key deliverables or features
}

// API route handler for generating AI-powered project suggestions
export async function POST(request: NextRequest) {
  try {
    // Extract and validate request payload
    const { prompt, organizationName, industry } = await request.json() as ProjectGenerationRequest;

    // Validate Gemini API key configuration
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Initialize Gemini AI client with flash model for fast responses
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build contextual information for more targeted project suggestions
    const contextInfo = organizationName ? `Organization: ${organizationName}` : '';
    const industryInfo = industry ? `Industry: ${industry}` : '';

    const generationPrompt = `
You are an expert project manager and business analyst. Based on the following input, generate a comprehensive project suggestion.

User Input: ${prompt}
${contextInfo}
${industryInfo}

Please provide a project suggestion in the following JSON format:

{
  "name": "Clear, professional project name (max 60 characters)",
  "description": "Detailed project description explaining objectives, scope, and expected outcomes (200-400 words)",
  "suggestedStatus": "planning|active|on-hold",
  "estimatedDuration": "Realistic timeline estimate (e.g., '3 months', '6 weeks')",
  "keyFeatures": ["Feature 1", "Feature 2", "Feature 3"]
}

Guidelines:
1. If the user has explicitly mentioned a specific project name in their input, use that exact name. Otherwise, create a concise but descriptive name.
2. Include specific, actionable objectives in the description
3. Consider realistic timelines and resource requirements
4. Suggest 3-5 key features or deliverables
5. Ensure the project aligns with modern business practices
6. Make it professional and implementable

Provide only the JSON object, no additional text.`;

    // Generate AI response and extract text content
    const result = await model.generateContent(generationPrompt);
    const response = await result.response;
    const text = response.text();

    let projectSuggestion: ProjectSuggestion;
    try {
      // Extract JSON from AI response using regex (AI may include extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      
      projectSuggestion = JSON.parse(jsonMatch[0]);
      
      // Ensure all required fields have fallback values for data integrity
      projectSuggestion = {
        name: projectSuggestion.name || 'AI Generated Project',
        description: projectSuggestion.description || 'AI generated project description',
        suggestedStatus: projectSuggestion.suggestedStatus || 'planning',
        estimatedDuration: projectSuggestion.estimatedDuration || '3 months',
        keyFeatures: Array.isArray(projectSuggestion.keyFeatures) ? projectSuggestion.keyFeatures : []
      };

    } catch (parseError) {
      // Log parsing errors for debugging while providing fallback response
      console.error('Error parsing AI response:', parseError);
      console.error('Raw AI response:', text);
      
      // Fallback project suggestion when AI response parsing fails
      projectSuggestion = {
        name: 'AI Generated Project',
        description: 'This is an AI-generated project based on your input. Please customize the details according to your specific requirements and organizational needs.',
        suggestedStatus: 'planning',
        estimatedDuration: '3 months',
        keyFeatures: ['Define project scope', 'Set up project structure', 'Implement core features']
      };
    }

    return NextResponse.json(projectSuggestion);

  } catch (error) {
    // Handle any unexpected errors during the generation process
    console.error('Error generating project suggestion:', error);
    
    // Return minimal fallback when entire process fails
    const fallbackSuggestion: ProjectSuggestion = {
      name: 'New Project',
      description: 'AI project generation is currently unavailable. Please manually enter your project details.',
      suggestedStatus: 'planning',
      estimatedDuration: '3 months',
      keyFeatures: []
    };

    return NextResponse.json(fallbackSuggestion);
  }
}