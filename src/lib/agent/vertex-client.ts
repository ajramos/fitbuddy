
import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';

// Initialize Vertex AI
// We rely on ADC (Application Default Credentials) or env vars
const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID;
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

// Multi-Model Strategy: Fast model for conversation, comprehensive model for plan generation
const conversationModelName = process.env.VERTEX_CONVERSATION_MODEL || 'gemini-2.5-flash';
const planModelName = process.env.VERTEX_PLAN_MODEL || 'gemini-2.5-pro';

// Validation against STANDARDS.md
if (!conversationModelName || !planModelName) {
    throw new Error("Configuration Error: VERTEX_CONVERSATION_MODEL and VERTEX_PLAN_MODEL environment variables are required. See STANDARDS.md.");
}

let conversationModel: GenerativeModel | null = null;
let planModel: GenerativeModel | null = null;

const vertexAI = new VertexAI({
    project: project || 'placeholder-project',
    location
});

/**
 * Get the conversation model (fast, optimized for chat)
 */
export function getConversationModel(): GenerativeModel {
    if (conversationModel) return conversationModel;

    if (!project) {
        console.warn("GOOGLE_CLOUD_PROJECT is not set. Vertex AI calls may fail if not running in a GCP environment that provides it automatically.");
    }

    conversationModel = vertexAI.getGenerativeModel({
        model: conversationModelName,
        generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.8, // Slightly higher for better instruction following while maintaining naturalness
            topP: 0.95, // Increased for more diverse responses
        },
    });

    console.log(`[Vertex] Conversation model initialized: ${conversationModelName}`);
    return conversationModel;
}

/**
 * Get the plan generation model (comprehensive, optimized for quality)
 */
export function getPlanModel(): GenerativeModel {
    if (planModel) return planModel;

    if (!project) {
        console.warn("GOOGLE_CLOUD_PROJECT is not set. Vertex AI calls may fail if not running in a GCP environment that provides it automatically.");
    }

    planModel = vertexAI.getGenerativeModel({
        model: planModelName,
        generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.4, // Lower temp for more deterministic/structured output
            topP: 0.9,
        },
    });

    console.log(`[Vertex] Plan generation model initialized: ${planModelName}`);
    return planModel;
}

/**
 * @deprecated Use getConversationModel() or getPlanModel() instead
 */
export function getModel(): GenerativeModel {
    console.warn("[Vertex] getModel() is deprecated. Use getConversationModel() or getPlanModel() instead.");
    return getPlanModel();
}
