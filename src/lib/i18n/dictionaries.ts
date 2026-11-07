
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
            welcome: "Hey! I'm your training coach. Tell me briefly what you want to achieve (e.g. fat loss, muscle gain) and what equipment you have.",
            errorMessage: "Sorry, I had trouble connecting. Please try again.",
            planReady: "Perfect. I have everything I need. Generating your plan now...",
            generatingPlan: "Generating weekly plan...",
            resetConfirm: "Are you sure you want to start a new plan? This will clear the current conversation.",
            newPlan: "Start New Plan"
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
            sessionsPerWeek: "Sessions per Week",
            minutesPerSession: "Minutes per Session",
            equipment: "Equipment (comma separated)",
            limitations: "Limitations / Injuries (comma separated)",
            preferencesTitle: "Training Style Preferences",
            circuitsLabel: "Circuit Training",
            circuitsLove: "Love it",
            circuitsNeutral: "Neutral",
            circuitsHate: "Don't like it",
            runningFinisherLabel: "Running/Cardio Finisher",
            runningFinisherYes: "Yes, always",
            runningFinisherConditional: "Sometimes",
            runningFinisherNo: "No",
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
        },
        navigation: {
            coach: "Coach",
            myPlan: "My Plan",
            plans: "My Plans",
            profile: "Profile"
        },
        plans: {
            title: "My Training Plans",
            noPlans: "No plans yet",
            createFirst: "Start a conversation with your coach to create your first personalized training plan.",
            goToCoach: "Talk to Coach",
            createdOn: "Created on",
            viewPlan: "View Plan"
        },
        planDetail: {
            notFound: "Plan not found",
            goBack: "Go back to Coach",
            planContext: "Plan Context",
            weekCycle: "Weekly Repeating Schedule",
            week: "Week",
            weeks: "Weeks"
        }
    },
    es: {
        sidebar: {
            coach: "Coach",
            plan: "Mi Plan",
            profile: "Perfil",
            signOut: "Cerrar Sesión",
            title: "FitBuddy",
        },
        coach: {
            welcome: "¡Hola! Soy tu entrenador personal. Vamos a crear un plan de entrenamiento adaptado a ti. ¿Cuál es tu objetivo principal?",
            errorMessage: "Lo siento, tuve problemas de conexión. Por favor, inténtalo de nuevo.",
            planReady: "Perfecto. Tengo todo lo que necesito. Generando tu plan ahora mismo...",
            generatingPlan: "Generando Plan Semanal...",
            viewPlan: "Ver Mi Plan",
            resetConfirm: "¿Estás seguro de que quieres empezar un nuevo plan? Esto borrará la conversación actual.",
            newPlan: "Nuevo Plan"
        },
        navigation: {
            coach: "Coach",
            myPlan: "Mi Plan",
            plans: "Mis Planes",
            profile: "Perfil"
        },
        plans: {
            title: "Mis Planes de Entrenamiento",
            noPlans: "Aún no tienes planes",
            createFirst: "Inicia una conversación con tu coach para crear tu primer plan de entrenamiento personalizado.",
            goToCoach: "Hablar con el Coach",
            createdOn: "Creado el",
            viewPlan: "Ver Plan"
        },
        planDetail: {
            notFound: "Plan no encontrado",
            goBack: "Volver al Coach",
            planContext: "Contexto del Plan",
            weekCycle: "Horario Semanal Repetitivo",
            week: "Semana",
            weeks: "Semanas"
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
            sessionsPerWeek: "Sesiones por Semana",
            minutesPerSession: "Minutos por Sesión",
            equipment: "Equipamiento (separado por comas)",
            limitations: "Limitaciones / Lesiones",
            preferencesTitle: "Preferencias de Estilo de Entrenamiento",
            circuitsLabel: "Entrenamiento en Circuito",
            circuitsLove: "Me encanta",
            circuitsNeutral: "Neutral",
            circuitsHate: "No me gusta",
            runningFinisherLabel: "Finisher de Carrera/Cardio",
            runningFinisherYes: "Sí, siempre",
            runningFinisherConditional: "A veces",
            runningFinisherNo: "No",
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
