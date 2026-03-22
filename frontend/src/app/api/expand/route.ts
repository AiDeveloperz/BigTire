import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API with your key. In Vercel, this will be in the environment variables.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_INSTRUCTION = `You are the cognitive engine of 'BigTire', an AI that solves problems by expanding their surface area until they become trivial, based on the physics formula P = F/A. The user will provide a core problem (F). Your goal is NOT to solve the problem immediately. Your goal is to increase the problem's contextual surface area (A) to drastically reduce the perceived pressure or complexity (P).

When you receive a user prompt:
Analyze the core objective and identify the missing context.
Generate 1 to 3 highly targeted, expansive questions designed to extract hidden constraints, underlying assumptions, and available resources.
Do not offer solutions until the user has answered enough questions that the solution becomes an inevitable, transparent logical deduction.
Maintain an analytical, calm, and inquisitive tone. You act as a cognitive mirror.`;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { messages, isFinalState } = body;

        let promptModifier = "";
        if (isFinalState) {
          promptModifier = "\n\nThe user has requested the final transparency state. Please provide the comprehensive, step-by-step breakdown showing how the problem essentially solves itself given the mapped constraints.";
        }

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: SYSTEM_INSTRUCTION
        });

        // Initialize chat taking all messages except the very last one
        const chat = model.startChat({
            history: messages.slice(0, -1)
        });

        // Send the last message
        const lastMessage = messages[messages.length - 1].parts[0].text;
        const result = await chat.sendMessage(lastMessage + promptModifier);
        
        const responseText = result.response.text();

        return NextResponse.json({
            text: responseText,
            success: true
        });
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json(
            { error: "Failed to process request", details: error.message },
            { status: 500 }
        );
    }
}
