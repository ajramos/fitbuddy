
import { getConversationModel } from './vertex-client';
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

CRITICAL REQUIREMENTS - YOU MUST GATHER ALL OF THESE:
1. Primary Goal (fat_loss, muscle_gain, recomposition) - REQUIRED
2. Training Frequency (sessions/week) - REQUIRED
3. Duration (minutes per session) - REQUIRED
4. Equipment available (be specific: kettlebells, dumbbells, bands, etc.) - REQUIRED
5. Experience Level (beginner, intermediate, advanced) - REQUIRED
6. Limitations/Injuries (MUST ASK EXPLICITLY - do not assume none) - REQUIRED
7. Circuit Training Preference (love, neutral, hate) - REQUIRED
8. Running Finisher Preference (yes, conditional, no) - REQUIRED

IMPORTANT: You MUST ask about BOTH:
- Whether they like circuit-style training (multiple exercises back-to-back)
- Whether they want to finish sessions with running/cardio

Do not skip these questions. They are essential for plan quality.

When the user provides information, call 'updateUserProfile' with the relevant fields.
If the user's input is vague, infer the best match but confirm with them.
Once you have ALL required info, summarize it and ask for confirmation.

CRITICAL: When the user confirms the summary (e.g., "yes", "correct", "go ahead"), you MUST call the 'generatePlan' function immediately. Do not just say you are ready. YOU MUST CALL THE FUNCTION.
`;

export async function processUserMessage(
    userId: string,
    message: string,
    history: Content[],
    currentProfile: Partial<UserProfileInput>
): Promise<AgentResponse> {
    const model = getConversationModel(); // Use fast Flash model for conversation

    const languageContext = currentProfile.language === 'es'
        ? "You must interact with the user primarily in Spanish, but keep technical fitness terms in English if appropriate."
        : "You must interact with the user in English.";

    const nameContext = currentProfile.name ? `The user's name is ${currentProfile.name}. Address them by name occasionally to be friendly.` : "";

    // Build a context of what data we already know
    const knownInfo: string[] = [];
    const missingInfo: string[] = [];

    // Check what profile data we have
    if (currentProfile.primaryGoal) knownInfo.push(`Primary Goal: ${currentProfile.primaryGoal}`);
    else missingInfo.push('Primary Goal');

    if (currentProfile.sessionsPerWeek) knownInfo.push(`Sessions per week: ${currentProfile.sessionsPerWeek}`);
    else missingInfo.push('Training Frequency');

    if (currentProfile.minutesPerSession) knownInfo.push(`Duration: ${currentProfile.minutesPerSession} minutes`);
    else missingInfo.push('Session Duration');

    if (currentProfile.equipmentKeys && currentProfile.equipmentKeys.length > 0) knownInfo.push(`Equipment: ${currentProfile.equipmentKeys.join(', ')}`);
    else missingInfo.push('Equipment Available');

    if (currentProfile.experienceLevel) knownInfo.push(`Experience Level: ${currentProfile.experienceLevel}`);
    else missingInfo.push('Experience Level');

    if (currentProfile.limitations && currentProfile.limitations.length > 0) knownInfo.push(`Limitations: ${currentProfile.limitations.join(', ')}`);
    else missingInfo.push('Limitations/Injuries');

    if (currentProfile.stylePreferences?.circuitsPreference) knownInfo.push(`Circuit Preference: ${currentProfile.stylePreferences.circuitsPreference}`);
    else missingInfo.push('Circuit Training Preference');

    if (currentProfile.stylePreferences?.runningFinisherPreference) knownInfo.push(`Running Finisher: ${currentProfile.stylePreferences.runningFinisherPreference}`);
    else missingInfo.push('Running Finisher Preference');

    if (currentProfile.age) knownInfo.push(`Age: ${currentProfile.age}`);
    if (currentProfile.weight) knownInfo.push(`Weight: ${currentProfile.weight}kg`);
    if (currentProfile.height) knownInfo.push(`Height: ${currentProfile.height}cm`);

    const profileContext = knownInfo.length > 0
        ? `\n\nINFO WE ALREADY HAVE (do NOT ask about these):\n${knownInfo.map(i => `- ${i}`).join('\n')}`
        : '';

    const missingContext = missingInfo.length > 0
        ? `\n\nINFO WE STILL NEED:\n${missingInfo.map(i => `- ${i}`).join('\n')}`
        : '\n\nYou have all required information. Summarize and confirm with the user.';

    const DYNAMIC_SYSTEM_INSTRUCTION = `
${SYSTEM_INSTRUCTION}
    
${nameContext}
${languageContext}
${profileContext}
${missingContext}
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
