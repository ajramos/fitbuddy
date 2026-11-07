
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

When you have previous data from the user's profile, PRESENT it and ASK if they want 
to use it or change it. For example:
- "I see you have kettlebell. Do you still have it or has your equipment changed?"
- "Last time your goal was muscle gain. Same goal now or something different?"
- "You trained 3 days/week for 60 minutes. Want to keep that or adjust?"

This gives the user control while making the conversation faster if nothing changed.
The user can confirm multiple items at once (e.g., "yes, all the same") or specify changes.

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

CRITICAL: When the user confirms the summary (e.g., "yes", "correct", "go ahead", "vale", "si"), you MUST call the 'generatePlan' function immediately. 
- Do NOT summarize again.
- Do NOT ask more questions.
- Do NOT say "Great" or "Perfect" without calling the function.
- ONLY call 'generatePlan({ ready: true })'.
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

    // Build context from profile data - present to user for validation
    const knownInfo: string[] = [];
    const missingInfo: string[] = [];

    // Present previous profile data for user validation
    if (currentProfile.equipmentKeys && currentProfile.equipmentKeys.length > 0) {
        knownInfo.push(`Previous Equipment: ${currentProfile.equipmentKeys.join(', ')}`);
    }
    if (currentProfile.limitations && currentProfile.limitations.length > 0) {
        knownInfo.push(`Previous Limitations: ${currentProfile.limitations.join(', ')}`);
    }
    if (currentProfile.experienceLevel) {
        knownInfo.push(`Previous Experience Level: ${currentProfile.experienceLevel}`);
    }
    if (currentProfile.primaryGoal) {
        knownInfo.push(`Previous Goal: ${currentProfile.primaryGoal}`);
    }
    if (currentProfile.sessionsPerWeek) {
        knownInfo.push(`Previous Frequency: ${currentProfile.sessionsPerWeek} days/week`);
    }
    if (currentProfile.minutesPerSession) {
        knownInfo.push(`Previous Duration: ${currentProfile.minutesPerSession} minutes`);
    }
    if (currentProfile.stylePreferences?.circuitsPreference) {
        knownInfo.push(`Previous Circuit Preference: ${currentProfile.stylePreferences.circuitsPreference}`);
    }
    if (currentProfile.stylePreferences?.runningFinisherPreference) {
        knownInfo.push(`Previous Running Finisher: ${currentProfile.stylePreferences.runningFinisherPreference}`);
    }

    // Demographic info can be used directly without asking every time
    if (currentProfile.age) knownInfo.push(`Age: ${currentProfile.age}`);
    if (currentProfile.weight) knownInfo.push(`Weight: ${currentProfile.weight}kg`);
    if (currentProfile.height) knownInfo.push(`Height: ${currentProfile.height}cm`);

    const profileContext = knownInfo.length > 0
        ? `\n\nPREVIOUS DATA FROM PROFILE (present to user and ask if still valid):\n${knownInfo.map(i => `- ${i}`).join('\n')}`
        : '';

    const missingContext = missingInfo.length > 0
        ? `\n\nIf any required data is missing after validation, ask for it.`
        : '';

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
                    ...(updatedProfile || {}),
                    ...args,
                    stylePreferences: {
                        circuitsPreference: args.circuitsPreference || currentProfile.stylePreferences?.circuitsPreference,
                        runningFinisherPreference: args.runningFinisherPreference || currentProfile.stylePreferences?.runningFinisherPreference
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
