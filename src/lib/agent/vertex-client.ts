
import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';

// Initialize Vertex AI
// We rely on ADC (Application Default Credentials) or env vars
const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID;
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const modelName = process.env.VERTEX_MODEL_NAME;

// Validation against STANDARDS.md
if (!modelName) {
    throw new Error("Configuration Error: VERTEX_MODEL_NAME environment variable is invalid or missing. See STANDARDS.md.");
}

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
            maxOutputTokens: 8192,
            temperature: 0.5, // Lower temperature for more deterministic JSON
            topP: 0.9,
        },
    });

    return model;
}
