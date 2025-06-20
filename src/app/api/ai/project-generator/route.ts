import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ProjectGenerationRequest {
  prompt: string;
  organizationName?: string;
  industry?: string;
}

interface ProjectSuggestion {
  name: string;
  description: string;
  suggestedStatus: string;
  estimatedDuration: string;
  keyFeatures: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, organizationName, industry } = await request.json() as ProjectGenerationRequest;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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

    const result = await model.generateContent(generationPrompt);
    const response = await result.response;
    const text = response.text();

    let projectSuggestion: ProjectSuggestion;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      
      projectSuggestion = JSON.parse(jsonMatch[0]);
      
      projectSuggestion = {
        name: projectSuggestion.name || 'AI Generated Project',
        description: projectSuggestion.description || 'AI generated project description',
        suggestedStatus: projectSuggestion.suggestedStatus || 'planning',
        estimatedDuration: projectSuggestion.estimatedDuration || '3 months',
        keyFeatures: Array.isArray(projectSuggestion.keyFeatures) ? projectSuggestion.keyFeatures : []
      };

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw AI response:', text);
      
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
    console.error('Error generating project suggestion:', error);
    
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