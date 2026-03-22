import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Pulls the key from Vercel/Local Environment Variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_INSTRUCTION = `You are the cognitive engine of 'BigTire', an AI that solves problems by expanding their surface area until they become trivial, based on the physics formula $$P = \frac{F}{A}$$. The user will provide a core problem (F). Your goal is NOT to solve the problem immediately. Your goal is to increase the problem's contextual surface area (A) to drastically reduce the perceived pressure or complexity (P).

When you receive a user prompt:
1. Analyze the core objective and identify the missing context.
2. Generate 1 to 3 highly targeted, expansive questions designed to extract hidden constraints, underlying assumptions, and available resources.
3. Do not offer solutions until the user has answered enough questions that the solution becomes an inevitable, transparent logical deduction.
4. Maintain an analytical, calm, and inquisitive tone. You act as a cognitive mirror.`;

export async function POST(req: Request) {
  try {
    const { messages, isFinalState } = await req.json();

    // Determine if we need to force a final output (user clicking 'Transparency')
    let promptModifier = "";
    if (isFinalState) {
      promptModifier = "\n\nThe user has requested the final transparency state. Please provide the comprehensive, step-by-step breakdown showing how the problem essentially solves itself given the mapped constraints.";
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // Carrying over your specific model choice
      systemInstruction: SYSTEM_INSTRUCTION
    });

    // We start the chat with the history (everything except the current prompt)
    const chat = model.startChat({
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: m.parts
      }))
    });

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