
import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';

// Initialize Vertex AI
// We rely on ADC (Application Default Credentials) or env vars
const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID;
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const modelName = process.env.VERTEX_MODEL_NAME || 'gemini-1.5-flash-002';

let model: GenerativeModel | null = null;

export function getModel(): GenerativeModel {
    if (model) return model;

    if (!project) {
        console.warn("GOOGLE_CLOUD_PROJECT is not set. Vertex AI calls may fail if not running in a GCP environment that provides it automatically.");
    }

    const vertexAI = new VertexAI({ project: project || 'placeholder-project', location });

    model = vertexAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.9,
        },
    });

    return model;
}
