
export type Locale = 'en' | 'es';

export const dictionaries = {
    en: {
        sidebar: {
            coach: "Coach",
            plan: "My Plan",
            profile: "Profile",
            signOut: "Sign Out",
            title: "FitBuddy",
        },
        coach: {
            title: "Your AI Coach",
            placeholder: "Ask something...",
            viewPlan: "View My Plan",
            welcome: "Hey! I'm your training coach. Tell me briefly what you want to achieve (e.g. fat loss, muscle gain) and what equipment you have."
        },
        profile: {
            personalTitle: "Personal & App Settings",
            statsTitle: "Physical Stats & Goals",
            name: "Display Name",
            language: "Language (Interface & Coach)",
            age: "Age",
            weight: "Weight (kg)",
            height: "Height (cm)",
            experience: "Experience Level",
            goal: "Primary Goal",
            equipment: "Equipment (comma separated)",
            limitations: "Limitations / Injuries (comma separated)",
            save: "Save Changes",
            success: "Profile updated successfully!",
            error: "Error updating profile.",
            accountTitle: "Account Actions",
            signOutDesc: "Sign out of your session on this device.",
            options: {
                beginner: "Beginner",
                intermediate: "Intermediate",
                advanced: "Advanced",
                muscle_gain: "Muscle Gain",
                fat_loss: "Fat Loss",
                recomposition: "Recomposition",
                strength: "Strength",
                endurance: "Endurance"
            }
        }
    },
    es: {
        sidebar: {
            coach: "Entrenador",
            plan: "Mi Plan",
            profile: "Perfil",
            signOut: "Cerrar Sesión",
            title: "FitBuddy",
        },
        coach: {
            title: "Tu Entrenador IA",
            placeholder: "Pregunta algo...",
            viewPlan: "Ver Mi Plan",
            welcome: "¡Hola! Soy tu entrenador. Cuéntame qué quieres lograr (ej. perder grasa, ganar músculo) y qué equipo tienes."
        },
        profile: {
            personalTitle: "Configuración Personal",
            statsTitle: "Estadísticas y Objetivos",
            name: "Nombre visible",
            language: "Idioma (Interfaz y Entrenador)",
            age: "Edad",
            weight: "Peso (kg)",
            height: "Altura (cm)",
            experience: "Nivel de Experiencia",
            goal: "Objetivo Principal",
            equipment: "Equipamiento (separado por comas)",
            limitations: "Limitaciones / Lesiones",
            save: "Guardar Cambios",
            success: "¡Perfil actualizado con éxito!",
            error: "Error al actualizar el perfil.",
            accountTitle: "Acciones de Cuenta",
            signOutDesc: "Cierra sesión en este dispositivo.",
            options: {
                beginner: "Principiante",
                intermediate: "Intermedio",
                advanced: "Avanzado",
                muscle_gain: "Ganar Músculo",
                fat_loss: "Perder Grasa",
                recomposition: "Recomposición",
                strength: "Fuerza",
                endurance: "Resistencia"
            }
        }
    }
};
