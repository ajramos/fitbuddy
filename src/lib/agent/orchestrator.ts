
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
Be encouraging and concise.

You need to gather:
1. Primary Goal (fat_loss, muscle_gain, recomposition)
2. Training Frequency (sessions/week)
3. Duration (minutes)
4. Equipment available
5. Experience Level
6. Limitations (injuries)
7. Style preferences (circuits, running)

When the user provides information, call 'updateUserProfile'.
If the user's input is vague, infer the best match but confirm with them (e.g. "I want to get toned" -> fat_loss + muscle_maintenance).
Once you have enough info, summarize it and ask for confirmation.
If confirmed, call 'generatePlan'.
`;

export async function processUserMessage(
    userId: string,
    message: string,
    history: Content[],
    currentProfile: Partial<UserProfileInput>
): Promise<AgentResponse> {
    const model = getModel();

    const chat = model.startChat({
        history: history,
        generationConfig: {
            temperature: 0.7,
        },
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        tools: tools,
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;

    let agentMessage = "";
    let updatedProfile: Partial<UserProfileInput> | undefined = undefined;
    let state: ConversationState = 'collecting';

    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
            if (call.name === 'updateUserProfile') {
                const args = call.args as any;
                // Merge with current profile context if we were tracking it in session (omitted for brevity here, assumed passed in/out)
                // Map flat args to nested structure if needed
                updatedProfile = {
                    ...args,
                    stylePreferences: {
                        circuitsPreference: args.circuitsPreference || currentProfile.stylePreferences?.circuitsPreference,
                        runningFinisherPreference: args.runningFinisher || currentProfile.stylePreferences?.runningFinisherPreference
                    }
                };

                // We must send a function response back to the model to get the final text response
                // In a real app we might do this loop. For simplicity in this demo,
                // we acknowledge the update and let the model continue or we might need a second turn.
                // Vertex AI Node SDK usually handles function calling by returning the call request.
                // We "mock" the execution here by returning success.

                const functionResponseParts = [{
                    functionResponse: {
                        name: 'updateUserProfile',
                        response: { name: 'updateUserProfile', content: { success: true } }
                    }
                }];

                // Continue conversation with tool result
                const followUp = await chat.sendMessage(functionResponseParts);
                agentMessage = followUp.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
            }
            else if (call.name === 'generatePlan') {
                state = 'ready';
                agentMessage = "Great! I'm generating your plan now..."; // The frontend should see the 'ready' state and trigger generation
            }
        }
    } else {
        agentMessage = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    return {
        message: agentMessage,
        updatedProfile,
        state
    };
}
