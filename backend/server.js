import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_INSTRUCTION = `You are the cognitive engine of 'BigTire', an AI that solves problems by expanding their surface area until they become trivial, based on the physics formula P = F/A. The user will provide a core problem (F). Your goal is NOT to solve the problem immediately. Your goal is to increase the problem's contextual surface area (A) to drastically reduce the perceived pressure or complexity (P).

When you receive a user prompt:
Analyze the core objective and identify the missing context.
Generate 1 to 3 highly targeted, expansive questions designed to extract hidden constraints, underlying assumptions, and available resources.
Do not offer solutions until the user has answered enough questions that the solution becomes an inevitable, transparent logical deduction.
Maintain an analytical, calm, and inquisitive tone. You act as a cognitive mirror.`;

app.post('/api/expand', async (req, res) => {
    try {
        const { messages, isFinalState } = req.body;
        // messages should be an array of { role: 'user' | 'model', parts: [{ text: '...' }] }

        // Determine if we need to force a final output (user clicking a 'Transparency' button)
        let promptModifier = "";
        if (isFinalState) {
            promptModifier = "\n\nThe user has requested the final transparency state. Please provide the comprehensive, step-by-step breakdown showing how the problem essentially solves itself given the mapped constraints.";
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: SYSTEM_INSTRUCTION
        });

        const chat = model.startChat({
            history: messages.slice(0, -1) // All but the last message
        });

        const lastMessage = messages[messages.length - 1].parts[0].text;
        const result = await chat.sendMessage(lastMessage + promptModifier);

        const responseText = result.response.text();

        res.json({
            text: responseText,
            success: true
        });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "Failed to process request", details: error.message });
    }
});

app.listen(port, () => {
    console.log(`BigTire backend listening on port ${port}`);
});
