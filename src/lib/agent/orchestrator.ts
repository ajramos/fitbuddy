
import { getModel } from './vertex-client';
import { tools } from './tools';
import { Content, GenerateContentRequest, Part } from '@google-cloud/vertexai';
import { UserProfileInput } from '@/lib/engine/types';
import { db } from '@/lib/db/firestore';

export type ConversationState = 'collecting' | 'ready';

export interface AgentResponse {
    message: string;
    updatedProfile?: Partial<UserProfileInput>;
    state: ConversationState;
}

const SYSTEM_INSTRUCTION = `
You are an expert functional training coach creating a personalized plan for a user.
Your goal is to have a natural conversation to build a user profile.
Don't ask all questions at once. Ask 1-2 relevant questions at a time.

CRITICAL: You MUST explicitly ask about "Limitations or Injuries" before finishing the profile. Do not assume none.

You need to gather:
1. Primary Goal (fat_loss, muscle_gain, recomposition)
2. Training Frequency (sessions/week)
3. Duration (minutes)
4. Equipment available
5. Experience Level
6. Limitations (injuries) - MUST ASK EXPLICITLY
7. Style preferences (circuits, running)

When the user provides information, call 'updateUserProfile'.
If the user's input is vague, infer the best match but confirm with them.
Once you have enough info, summarize it and ask for confirmation.

CRITICAL: When the user confirms the summary (e.g., "yes", "correct", "go ahead"), you MUST call the 'generatePlan' function immediately. Do not just say you are ready. YOU MUST CALL THE FUNCTION.
`;

export async function processUserMessage(
    userId: string,
    message: string,
    history: Content[],
    currentProfile: Partial<UserProfileInput>
): Promise<AgentResponse> {
    const model = getModel();

    const languageContext = currentProfile.language === 'es'
        ? "You must interact with the user primarily in Spanish, but keep technical fitness terms in English if appropriate."
        : "You must interact with the user in English.";

    const nameContext = currentProfile.name ? `The user's name is ${currentProfile.name}. Address them by name occasionally to be friendly.` : "";

    const DYNAMIC_SYSTEM_INSTRUCTION = `
${SYSTEM_INSTRUCTION}
    
${nameContext}
${languageContext}
    `;

    const chat = model.startChat({
        history: history,
        generationConfig: {
            temperature: 0.7,
        },
        systemInstruction: { role: 'system', parts: [{ text: DYNAMIC_SYSTEM_INSTRUCTION }] },
        tools: tools,
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;

    let agentMessage = "";
    let updatedProfile: Partial<UserProfileInput> | undefined = undefined;
    let state: ConversationState = 'collecting';

    const functionCalls: any[] = [];
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.functionCall) {
                functionCalls.push(part.functionCall);
            }
        }
    }

    if (functionCalls && functionCalls.length > 0) {
        console.log("Function Calls detected:", JSON.stringify(functionCalls));

        const functionResponseParts: any[] = [];

        for (const call of functionCalls) {
            if (call.name === 'updateUserProfile') {
                const args = call.args as any;
                updatedProfile = {
                    ...updatedProfile,
                    ...args,
                    stylePreferences: {
                        circuitsPreference: args.circuitsPreference || currentProfile.stylePreferences?.circuitsPreference,
                        runningFinisherPreference: args.runningFinisher || currentProfile.stylePreferences?.runningFinisherPreference
                    }
                };

                functionResponseParts.push({
                    functionResponse: {
                        name: 'updateUserProfile',
                        response: { name: 'updateUserProfile', content: { success: true } }
                    }
                });
            }
            else if (call.name === 'generatePlan') {
                state = 'ready';
                functionResponseParts.push({
                    functionResponse: {
                        name: 'generatePlan',
                        response: { name: 'generatePlan', content: { success: true } }
                    }
                });
            }
        }

        // Send all function responses in a SINGLE turn to avoid 400 error
        const followUp = await chat.sendMessage(functionResponseParts);
        agentMessage = followUp.response.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // If plan is ready, override message with localized success text
        if (state === 'ready') {
            agentMessage = currentProfile.language === 'es'
                ? "Perfecto. Tengo todo lo que necesito. ¡Haz clic en el botón de abajo para crear tu plan!"
                : "Perfect. I have everything I need. Click the button below to create your plan!";
        }

    } else {
        agentMessage = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
        console.log("Agent Text Response:", agentMessage);
    }

    return {
        message: agentMessage,
        updatedProfile,
        state
    };
}
