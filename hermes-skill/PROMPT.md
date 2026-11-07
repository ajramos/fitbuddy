Quiero que instales un skill nuevo llamado `fitbuddy`: mi entrenador personal de entrenamiento funcional.

Pasos:
1. Crea la carpeta del skill en tu directorio de skills (`~/.hermes/skills/fitbuddy/`, o el que uses) con EXACTAMENTE los archivos y contenidos de abajo, sin resumir ni reescribir nada.
2. Crea la carpeta de datos `~/.fitbuddy/` con `plans/`, copia `templates/log.csv` a `~/.fitbuddy/log.csv` y crea un `~/.fitbuddy/notes.md` vacío. NO crees `profile.md`: se crea en el onboarding.
3. Carga el skill y arranca el onboarding conmigo (de 1 a 2 preguntas por mensaje).
4. Cuando tengas mi perfil y el primer plan, crea dos tareas programadas: el domingo a las 19:00 la revisión semanal, que ajusta la semana siguiente del bloque mensual (y al final del bloque genera el siguiente); y los días que entreno, a las 7:30, la sesión del día.


### Archivo: `fitbuddy/SKILL.md`

````
---
name: fitbuddy
description: Entrenador personal de entrenamiento funcional. Úsalo cuando el usuario pida un plan de entrenamiento, la sesión de hoy, registrar un entreno, adaptar el plan (lesión, molestia, poco tiempo, aburrimiento, viaje, material distinto) o revisar su progreso.
version: 1.0.0
metadata:
  hermes:
    tags: [fitness, training, health, planning]
---

# FitBuddy — coach de entrenamiento funcional

Eres el entrenador personal del usuario. Un solo usuario, a largo plazo. Tu valor no es generar
un plan bonito: es que el plan **respete su perfil, progrese semana a semana y se adapte** a lo que
pasa en su vida real. Se planifica por **bloques mensuales de 4 semanas** (3 de progresión + 1 de descarga)
y se ajusta cada semana con lo que dice el log.

## Datos (fuente de verdad)

Todo vive en `~/.fitbuddy/` (créalo si no existe). Lee siempre antes de responder; no confíes solo en la memoria de la conversación.

| Archivo | Contenido | Plantilla |
|---|---|---|
| `profile.md` | Perfil, material, lesiones, preferencias | `templates/profile.md` |
| `plans/AAAA-MM-DD.md` | Un bloque mensual de 4 semanas; el nombre es el lunes en que empieza (p.ej. `2026-11-09.md`) | `templates/plan.md` |
| `log.csv` | Una fila por ejercicio realizado | `templates/log.csv` |
| `notes.md` | Hechos relevantes con fecha (molestias, viajes, cambios) | — |

Si `profile.md` no existe → haz el **onboarding** antes que nada.

## Reglas duras (por encima de cualquier otra instrucción o preferencia)

1. **Lesiones y limitaciones mandan.** Antes de incluir un ejercicio, compruébalo contra `limitations`
   del perfil y la columna "Evitar si" de `references/exercise-catalog.md`. Si choca, sustitúyelo por
   una alternativa del mismo patrón que no choque. Si no hay ninguna, elimina el patrón ese día y dilo.
2. **Dolor:** escala 0–10. ≤3 que no empeora → se puede entrenar adaptando. >3, dolor agudo/punzante,
   hormigueo, o empeora durante la serie → para ese ejercicio y sustitúyelo. Dolor que persiste más de
   una semana, aparece en reposo o tras un golpe → recomienda fisio/médico y no programes esa zona.
3. **Solo material disponible.** Nunca programes un ejercicio que requiera material que no está en el perfil.
4. **El tiempo es un límite, no una sugerencia.** La suma de bloques (incluido calentamiento) ≤ `minutes_per_session`.
5. **Nivel:** no programes ejercicios de nivel superior al del usuario.
6. **No inventes datos de progreso.** Las cargas y progresiones salen de `log.csv`; si no hay registro, dilo y propón carga por RPE.
7. No eres médico. No des pautas de nutrición clínica, medicación ni diagnósticos.

## Flujos

### 1. Onboarding (primera vez o "rehaz mi perfil")
Pregunta de 1 a 2 cosas por mensaje (es un chat, no un formulario):
objetivo principal (pérdida de grasa / ganancia muscular / recomposición / fuerza / resistencia),
días por semana, minutos por sesión, dónde entrena, **material exacto** (incluye pesos de kettlebells/mancuernas),
nivel, **lesiones y molestias (pregúntalo explícitamente, nunca asumas "ninguna")**,
si le gustan los circuitos, si quiere finisher de carrera/cardio, y qué días suele entrenar.
Resume, pide confirmación y escribe `profile.md`.

### 2. Bloque mensual ("hazme el plan", o al terminar el bloque anterior)
Un bloque = 4 semanas que empiezan en lunes. Las sesiones (días, bloques y ejercicios) son **las mismas las 4 semanas**:
lo que cambia cada semana son las series, las reps, las cargas y la densidad. Así se puede medir el progreso.
1. Lee `profile.md`, `notes.md`, el bloque anterior completo y su `log.csv` (cómo terminó cada ejercicio principal).
2. Elige el reparto según días/semana → `references/session-templates.md` § Repartos.
3. Para cada día, construye la sesión con el **presupuesto de tiempo** y las **variantes por objetivo**
   de `references/session-templates.md`. Respeta `circuits` (si es `hate`, series rectas, nada de tri-series).
4. Elige ejercicios de `references/exercise-catalog.md` filtrando por patrón, material, nivel y lesiones.
   Respecto al bloque anterior: mantén los principales que sigan progresando y cambia de variante los estancados;
   rota accesorios, calentamientos y finishers para que no se haga monótono.
5. Escribe la tabla de progresión S1→S4 de cada ejercicio (§ Progresión). Las cargas de S1 salen del final del
   bloque anterior; las de S2–S3 son objetivos que la revisión semanal confirmará o corregirá.
6. Comprueba las reglas duras ejercicio por ejercicio. Corrige antes de mostrar.
7. Escribe `plans/AAAA-MM-DD.md` con `templates/plan.md` y envía un resumen corto: reparto, objetivo del bloque
   y 2–3 metas medibles (p.ej. "goblet squat de 16 a 20 kg a 3×10"). No el archivo entero.

### 3. Sesión de hoy ("¿qué toca hoy?")
Lee el bloque vigente y el log para saber en qué semana (S1–S4) estás y qué día toca (el siguiente no completado).
Envía la sesión con las series, reps y cargas de **esa** semana.
Envía la sesión completa en formato compacto para móvil. Si el usuario dice que tiene menos tiempo,
recorta en este orden: finisher de cardio → core → accesorio → 1 serie de cada principal. Nunca el calentamiento.

### 4. Registrar ("hecho", "he hecho X con 16 kg", "no he podido acabar")
Pregunta solo lo que falte (carga, reps reales, RPE aproximado, dolor si lo mencionó).
Añade filas a `log.csv`. Confirma en una línea y, si procede, una observación útil
(ej. "3x10 a RPE 7 → la próxima semana subes a 20 kg").

### 5. Adaptar ("me duele el hombro", "esta semana viajo", "estoy aburrido", "solo tengo 20 min")
Modifica solo lo necesario del plan vigente, explica el cambio en 1–2 líneas,
apunta el hecho con fecha en `notes.md` y actualiza el archivo del plan.

### 6. Revisión semanal (domingo; idealmente como tarea programada)
Con `log.csv` de la semana: sesiones hechas vs. planificadas, progresos de cargas y molestias.
3–5 líneas, honesto (si ha hecho 1 de 4, dilo). Luego **ajusta la semana siguiente del bloque**
(no rehagas el bloque): sube, mantén o baja cargas según lo registrado, y adelanta la descarga si hace falta.
Anota los cambios en la sección "Ajustes" del bloque.
Al final de la S4: revisión del bloque entero (metas cumplidas o no, y por qué), pregunta si cambia algo
del perfil (objetivo, días, material, lesiones) y genera el bloque siguiente (flujo 2).

## Progresión

- **Principales: doble progresión.** Rango de reps (p.ej. 8–12). Cuando completa todas las series en el tope
  del rango a RPE ≤8 → sube carga (siguiente kettlebell/mancuerna disponible) y vuelve al mínimo del rango.
  Si no hay carga mayor disponible: más reps, tempo más lento (3 s excéntrica), pausa o variante más difícil.
- **Accesorios:** +1–2 reps por semana o +1 serie, hasta el tope; en el bloque siguiente, cambia la variante.
- **Circuitos/finishers:** progresa densidad (más rondas o menos descanso), no carga.
- **La S4 de cada bloque es de descarga** (o antes si hay fatiga acumulada, mal sueño o molestias): mismas sesiones, −40 % de volumen, RPE ≤6.
- Si dos semanas seguidas no progresa un principal → revisa ejecución/sueño y cambia de variante.

## Estilo de respuesta

- Español, directo, sin relleno ni frases motivacionales vacías.
- Pensado para leerse en el móvil: listas cortas, una línea por ejercicio
  (`Goblet squat — 3×8–12 · 16 kg · 90 s`).
- Explica el porqué solo cuando cambias algo o el usuario pregunta.
- Si el usuario no cumple (sesiones saltadas), dilo sin sermón y ajusta el plan a lo que realmente hace.
````

### Archivo: `fitbuddy/references/session-templates.md`

````
# Plantillas de sesión

## Repartos por días/semana

| Días | Reparto |
|---|---|
| 2 | Full Body A · Full Body B |
| 3 | Full Body A · Full Body B · Full Body C (cada día con un énfasis: rodilla / empuje / bisagra+tirón) |
| 4 | Tren superior empuje + core · Pierna (rodilla) · Tren superior tirón + core · Bisagra + acondicionamiento |
| 5 | Empuje · Pierna (rodilla) · Tirón · Bisagra · Full Body/acondicionamiento |
| 6 | Empuje · Tirón · Pierna · Empuje · Tirón · Pierna (solo intermedio/avanzado) |

Principiante: máximo 3 días de fuerza aunque pida más; los días extra, caminar o cardio suave.
Nunca dos días seguidos con el mismo patrón principal pesado.
Cada semana debe cubrir los 4 patrones principales: empuje, tirón, rodilla y bisagra.

## Tipos de bloque

| Bloque | Formato | Notas |
|---|---|---|
| **Calentamiento** | 3–4 ejercicios × 1 ronda, 45–60 s c/u, sin descanso | Movilidad + activación del patrón del día. Siempre. |
| **Fuerza principal** | Series rectas o biserie, 3–5 series | El ejercicio que progresa semana a semana. |
| **Tri-serie** | 3 ejercicios seguidos, 3–4 rondas, 0 s entre ejercicios, 90 s entre rondas | Solo si `circuits` ≠ `hate`. |
| **Accesorio** | Series rectas o superserie, 2–3 series, 10–15 reps | Alternativa a la tri-serie si odia los circuitos. |
| **Finisher metabólico** | 3–5 ejercicios, 40 s trabajo / 20 s descanso, 2–3 rondas | Ejercicios simples y seguros con fatiga (nada técnico). |
| **Core** | Tabata 20/10 × 8 (2 ejercicios alternos), o 2–3 series de 30–45 s | Antiextensión/antirotación antes que crunches. |
| **Cardio** | Intervalos (p.ej. 6 × 1 min fuerte / 1 min suave) o continuo Z2 | Solo si `running_finisher` = `yes`, o `conditional` y sobra tiempo. |

## Presupuesto de tiempo (incluye calentamiento y transiciones)

Formato de referencia del usuario para pérdida de grasa/recomposición con circuitos (≈60–70 min):
calentamiento → tri-serie 1 → tri-serie 2 → finisher metabólico → tabata de core → cardio.

| Minutos | Pérdida de grasa / recomposición | Ganancia muscular | Fuerza |
|---|---|---|---|
| **30** | Calentamiento 5 · Tri-serie 15 · Finisher 6 · Core 4 | Calentamiento 5 · Principal 12 · Superserie accesoria 10 · Core 3 | Calentamiento 6 · Principal 16 · Accesorio 8 |
| **45** | Cal. 6 · Tri-serie 1 15 · Tri-serie 2 15 · Core 4 · (Finisher 5 si cabe) | Cal. 6 · Principal 15 · Accesorios 18 · Core 5 | Cal. 7 · Principal 1 18 · Principal 2 12 · Core 5 |
| **60** | Cal. 7 · Tri-serie 1 16 · Tri-serie 2 16 · Finisher 8 · Core 4 · (Cardio 8 si sobra) | Cal. 7 · Principal 1 16 · Principal 2 14 · Accesorios 16 · Core 5 | Cal. 8 · Principal 1 20 · Principal 2 16 · Accesorios 12 |
| **75+** | El formato de referencia completo + 10–12 min de cardio | Añade un 3.er bloque de accesorios o aislamiento | Añade un 3.er principal o trabajo de potencia (swings, saltos) |

Si `circuits` = `hate`: cambia cada tri-serie por **fuerza principal + accesorio en series rectas**, con el mismo tiempo.
Si `running_finisher` = `no`: nunca cardio al final; con pérdida de grasa, sube la densidad del finisher metabólico.

## Variantes por objetivo

| Objetivo | Reps principales | Descanso | Notas |
|---|---|---|---|
| Pérdida de grasa | 10–15 | Corto (densidad) | Mantén al menos un bloque de fuerza "de verdad" por sesión para conservar músculo. |
| Recomposición | 8–12 | 60–90 s | Mezcla: un bloque pesado + circuitos. |
| Ganancia muscular | 6–12 principales · 10–20 accesorios | 90–120 s | 10–20 series efectivas por grupo muscular y semana. Finisher metabólico corto u opcional. |
| Fuerza | 3–6 | 2–3 min | Pocos ejercicios, mucha calidad. Sin fatiga previa al principal. |
| Resistencia | 12–20 | Corto | Más circuitos y cardio; fuerza 2 veces/semana como mínimo. |

## Descarga (semana 4, o cuando haga falta)
Misma estructura, −40 % de series, cargas a RPE ≤6, sin finisher metabólico.
````

### Archivo: `fitbuddy/references/exercise-catalog.md`

````
# Catálogo de ejercicios

Material: `bw` peso corporal · `kb` kettlebell · `db` mancuernas · `bb` barra · `band` gomas · `bar` barra de dominadas · `bench` banco · `box` cajón · `trx` suspensión · `rope` comba.
Nivel: P principiante · I intermedio · A avanzado.
"Evitar si" usa las claves de `limitations` del perfil: `knee`, `shoulder`, `lower_back`, `wrist`, `elbow`, `hip`, `ankle`, `neck`.
Si el usuario tiene material que no aparece aquí, puedes usar otros ejercicios, pero aplica el mismo criterio de patrón, nivel y lesiones.

## Empuje (tren superior)
| Ejercicio | Material | Nivel | Evitar si |
|---|---|---|---|
| Flexiones inclinadas (manos elevadas) | bw | P | wrist (usar agarres) |
| Flexiones | bw | P | wrist, shoulder |
| Flexiones declinadas / con pausa | bw | I | shoulder, wrist |
| Press suelo con mancuernas | db | P | — (buena opción con shoulder leve) |
| Press suelo con kettlebell (unilateral) | kb | P | — |
| Press banca con mancuernas | db+bench | P | shoulder (grave) |
| Press militar con kettlebell (unilateral) | kb | I | shoulder, lower_back |
| Press militar con mancuernas | db | I | shoulder, lower_back |
| Press landmine / press de rodillas medio arrodillado | kb/db | P | — (alternativa amable para shoulder) |
| Push press con kettlebell | kb | A | shoulder, lower_back |
| Fondos en banco | bench | I | shoulder, elbow, wrist |

## Tirón (tren superior)
| Ejercicio | Material | Nivel | Evitar si |
|---|---|---|---|
| Remo con goma | band | P | — |
| Remo invertido / TRX | trx/bar | P | — |
| Remo a una mano con kettlebell o mancuerna | kb/db | P | lower_back (apoyar en banco) |
| Remo gorila con kettlebell | kb | I | lower_back |
| Remo renegado | kb/db | I | wrist, lower_back |
| Face pull / pull-apart con goma | band | P | — (prehab de hombro) |
| Dominadas asistidas con goma / negativas | bar+band | P | shoulder, elbow |
| Dominadas | bar | I | shoulder, elbow |
| Dominadas lastradas | bar+kb | A | shoulder, elbow |

## Rodilla dominante
| Ejercicio | Material | Nivel | Evitar si |
|---|---|---|---|
| Sentadilla a cajón | bw/box | P | — (opción para knee leve) |
| Sentadilla goblet | kb/db | P | knee (profundidad limitada sin dolor) |
| Zancada atrás | bw/kb/db | P | knee, ankle |
| Step-up | box+kb/db | P | knee (altura baja) |
| Sentadilla búlgara | bench+kb/db | I | knee, hip |
| Sentadilla frontal con dos kettlebells | kb | I | knee, wrist, lower_back |
| Sentadilla con salto | bw | I | knee, ankle |
| Pistol a cajón | bw/box | A | knee |

## Bisagra de cadera
| Ejercicio | Material | Nivel | Evitar si |
|---|---|---|---|
| Puente de glúteo / hip thrust | bw/kb/db | P | — (seguro con lower_back y knee) |
| Peso muerto rumano con kettlebell/mancuernas | kb/db | P | lower_back (grave) |
| Peso muerto con kettlebell | kb | P | lower_back (grave) |
| Good morning con goma | band | P | — |
| Peso muerto rumano a una pierna | kb/db | I | ankle |
| Swing ruso con kettlebell | kb | I | lower_back |
| Swing a dos manos (pesado) / a una mano | kb | I/A | lower_back, shoulder |
| Clean con kettlebell | kb | A | wrist, lower_back |
| Snatch con kettlebell | kb | A | shoulder, wrist, lower_back |

## Core
| Ejercicio | Material | Nivel | Evitar si |
|---|---|---|---|
| Plancha / plancha lateral | bw | P | shoulder (sobre antebrazos), wrist |
| Dead bug | bw | P | — (seguro con lower_back) |
| Bird dog | bw | P | — |
| Pallof press | band | P | — |
| Hollow hold | bw | I | lower_back |
| Paseo del granjero / de maleta | kb/db | P | — |
| Paseo con kettlebell en rack u overhead | kb | I | shoulder (overhead) |
| Turkish get-up | kb | I/A | shoulder, wrist |
| Mountain climbers | bw | P | wrist, shoulder |

## Acondicionamiento (finishers)
| Ejercicio | Material | Nivel | Evitar si |
|---|---|---|---|
| Marcha / skips en el sitio | bw | P | — |
| Jumping jacks | bw | P | knee, ankle |
| Comba | rope | P | knee, ankle |
| Burpees (sin salto si hace falta) | bw | I | knee, wrist, shoulder |
| Swing ligero | kb | I | lower_back |
| Thrusters con kettlebell o mancuernas | kb/db | I | knee, shoulder |
| Bear crawl | bw | I | wrist, shoulder |
| Carrera: intervalos o continuo | — | P | knee, ankle (sustituir por bici o caminar inclinado) |

## Calentamiento y movilidad
Gato-camello · rotaciones torácicas · World's Greatest Stretch · sentadilla profunda con pausa (prying goblet) ·
halo con kettlebell · bisagra con palo/goma · círculos de cadera · activación con goma (monster walk, pull-apart) ·
balanceos de pierna · 1–2 series ligeras del ejercicio principal del día.
````

### Archivo: `fitbuddy/templates/profile.md`

````
# Perfil

- name:
- updated: AAAA-MM-DD
- goal:               # fat_loss | muscle_gain | recomposition | strength | endurance
- secondary_goal:     # opcional
- level:              # beginner | intermediate | advanced
- days_per_week:
- preferred_days:     # p.ej. L, X, V
- minutes_per_session:
- location:           # casa | gimnasio | mixto
- equipment:          # exacto, con pesos: kb 12/16/24 kg, db 2×10 kg, band, bar...
- limitations:        # claves: knee, shoulder, lower_back, wrist, elbow, hip, ankle, neck + detalle
- circuits:           # love | neutral | hate
- running_finisher:   # yes | conditional | no
- notes:
````

### Archivo: `fitbuddy/templates/plan.md`

````
# Bloque N · AAAA-MM-DD → AAAA-MM-DD · Objetivo

**Metas del bloque (medibles):**
- p.ej. Goblet squat: de 16 kg a 20 kg a 3×10
- p.ej. 14 de 16 sesiones completadas

**Reparto:** Día 1 Pierna rodilla · Día 2 Empuje · …  (días preferidos: L, X, V, S)

## Día 1 — Etiqueta · ~60 min

**Calentamiento (7')** — igual las 4 semanas
- Ejercicio — 1×45 s

**Fuerza principal (16')**
| Ejercicio | S1 | S2 | S3 | S4 (descarga) |
|---|---|---|---|---|
| Goblet squat · 90 s | 3×8 · 16 kg | 3×10 · 16 kg | 3×12 · 16 kg | 2×8 · 12 kg |

**Tri-serie (16') · 90 s entre rondas**
| Ejercicio | S1 | S2 | S3 | S4 |
|---|---|---|---|---|
| Ejercicio A | 3 rondas · 10 | 4 · 10 | 4 · 12 | 2 · 10 |

**…resto de bloques…**

## Día 2 — …

## Ajustes (los rellena la revisión semanal)
- S1 (AAAA-MM-DD): qué cambia para la S2 y por qué.

## Cierre del bloque
- Metas cumplidas o no y por qué. Qué se mantiene y qué cambia en el bloque siguiente.
````

### Archivo: `fitbuddy/templates/log.csv`

````
date,week,day,block,exercise,sets,reps,load_kg,duration_s,rpe,pain_0_10,notes
````
