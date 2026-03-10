import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  useColorScheme,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useApp, WorkoutExercise, WorkoutSet } from "@/contexts/AppContext";
import { getApiUrl } from "@/lib/query-client";

type MuscleGroup =
  | "Pecho"
  | "Espalda"
  | "Piernas"
  | "Hombros"
  | "Bíceps"
  | "Tríceps"
  | "Core"
  | "Cardio";

const MUSCLE_ICONS: Record<MuscleGroup, string> = {
  Pecho: "fitness",
  Espalda: "body",
  Piernas: "walk",
  Hombros: "person",
  Bíceps: "barbell",
  Tríceps: "barbell",
  Core: "ellipse",
  Cardio: "heart",
};

const EXERCISES: Record<MuscleGroup, { name: string; description: string; tips: string }[]> = {
  Pecho: [
    { name: "Press de banca con barra", description: "Pectoral mayor en general", tips: "Arco lumbar neutro, escápulas juntas" },
    { name: "Press inclinado con mancuernas", description: "Pectoral superior", tips: "Ángulo 30-45°, codos a 75°" },
    { name: "Press declinado con barra", description: "Pectoral inferior", tips: "Cuidado con el hombro, agarre medio" },
    { name: "Aperturas planas con mancuernas", description: "Estiramiento pectoral", tips: "Codos ligeramente flexionados" },
    { name: "Fondos en paralelas", description: "Pectoral inferior y tríceps", tips: "Inclínate hacia adelante para pecho" },
    { name: "Crossover en cable bajo", description: "Pectoral superior", tips: "Contracción en la cima del movimiento" },
    { name: "Flexiones de pecho", description: "Pectoral general + estabilizadores", tips: "Cuerpo recto, descenso controlado" },
    { name: "Press en máquina", description: "Pectoral simétrico", tips: "Excelente para principiantes" },
    { name: "Aperturas en cable", description: "Contracción pectoral", tips: "Mantén tensión durante todo el recorrido" },
    { name: "Pullover con mancuerna", description: "Pectoral y serrato", tips: "Mantén codos semiflexionados" },
    { name: "Press de banca con mancuernas", description: "Pectoral con mayor rango", tips: "Más rango de movimiento que barra" },
    { name: "Aperturas con cable cruzado", description: "Pectoral completo", tips: "Desde la cadera hasta hombros" },
    { name: "Flexiones diamante", description: "Pectoral interno + tríceps", tips: "Manos formando un diamante" },
    { name: "Press piso con mancuernas", description: "Pectoral sin banco", tips: "Ideal para entrenar en casa" },
    { name: "Landmine press", description: "Pectoral unilateral funcional", tips: "Gran ejercicio para hombro sano" },
  ],
  Espalda: [
    { name: "Dominadas pronadas", description: "Dorsal ancho", tips: "Agarre ancho, baja hasta el pecho" },
    { name: "Dominadas supinas (Chin-up)", description: "Dorsal + bíceps", tips: "Agarre estrecho, contrae en la cima" },
    { name: "Remo con barra", description: "Dorsal y romboides", tips: "Torso 45°, codos pegados al cuerpo" },
    { name: "Jalón al pecho en polea", description: "Dorsal ancho", tips: "No balancees, tira con los codos" },
    { name: "Remo con mancuerna", description: "Dorsal unilateral", tips: "Rodilla y mano apoyadas en banco" },
    { name: "Peso muerto convencional", description: "Cadena posterior completa", tips: "Espalda neutra, empuja el suelo" },
    { name: "Peso muerto sumo", description: "Cadena posterior + glúteos", tips: "Pies abiertos, rodillas hacia afuera" },
    { name: "Remo en máquina sentado", description: "Dorsal y romboides", tips: "Retracción escapular en la cima" },
    { name: "Face pull con cuerda", description: "Deltoides posterior y manguito", tips: "Polea alta, tira hacia la cara" },
    { name: "Hiperextensiones", description: "Erector espinal", tips: "No hiperextiendas la zona lumbar" },
    { name: "Shrug con barra", description: "Trapecio superior", tips: "Movimiento vertical, sin rotación" },
    { name: "Pull-through en cable", description: "Glúteos y erector", tips: "Bisagra de cadera, no sentadilla" },
    { name: "Jalón al pecho agarre estrecho", description: "Dorsal medio", tips: "Tirar hacia el esternón" },
    { name: "Remo Pendlay", description: "Espalda explosiva", tips: "Barra al suelo cada rep" },
    { name: "Remo en cable sentado", description: "Dorsales y romboides", tips: "Retracción total de escápulas" },
  ],
  Piernas: [
    { name: "Sentadilla con barra (alta)", description: "Cuádriceps y glúteos", tips: "Rodillas sobre los pies, pecho arriba" },
    { name: "Sentadilla con barra (baja)", description: "Cuádriceps y cadena posterior", tips: "Barra más abajo en el trapecio" },
    { name: "Prensa de piernas", description: "Cuádriceps y glúteos", tips: "Pies a anchura de hombros" },
    { name: "Zancadas caminando", description: "Cuádriceps y glúteos unilateral", tips: "Rodilla trasera cerca del suelo" },
    { name: "Zancadas con mancuernas", description: "Cuádriceps estático", tips: "Tronco erguido, peso distribuido" },
    { name: "Peso muerto rumano", description: "Isquiotibiales y glúteos", tips: "Bisagra de cadera, espalda neutra" },
    { name: "Curl de isquios tumbado", description: "Isquiotibiales", tips: "Contracción completa al final" },
    { name: "Curl de isquios sentado", description: "Isquiotibiales en estiramiento", tips: "Posición sentada aumenta rango" },
    { name: "Extensión de cuádriceps", description: "Cuádriceps aislado", tips: "Rango completo, control en negativo" },
    { name: "Elevación de gemelos de pie", description: "Gastrocnemio", tips: "Rango de movimiento completo" },
    { name: "Elevación de gemelos sentado", description: "Sóleo", tips: "Rodillas dobladas activan el sóleo" },
    { name: "Hip thrust", description: "Glúteos", tips: "Pausa en la cima, extensión completa" },
    { name: "Sentadilla búlgara", description: "Cuádriceps unilateral", tips: "Pie trasero en banco, torso erguido" },
    { name: "Abductores en máquina", description: "Glúteo medio", tips: "Apertura controlada, sin rebote" },
    { name: "Aductores en máquina", description: "Aductores y glúteo mayor", tips: "Control en todo el movimiento" },
    { name: "Sentadilla hack", description: "Cuádriceps", tips: "Rodillas al frente, espalda en pad" },
    { name: "Step-up con mancuernas", description: "Cuádriceps y glúteos funcional", tips: "Banco a altura de rodilla" },
  ],
  Hombros: [
    { name: "Press militar con barra", description: "Deltoides anterior y medio", tips: "Sin arqueamiento lumbar excesivo" },
    { name: "Press militar con mancuernas", description: "Deltoides con mayor rango", tips: "Pausa al bajar para más estiramiento" },
    { name: "Press Arnold", description: "Deltoides completo", tips: "Rotación controlada en el movimiento" },
    { name: "Elevaciones laterales", description: "Deltoides medio", tips: "Codos ligeramente flexionados" },
    { name: "Elevaciones frontales", description: "Deltoides anterior", tips: "Hasta la altura de los ojos" },
    { name: "Pájaros con mancuernas", description: "Deltoides posterior", tips: "Torso paralelo al suelo, codos abiertos" },
    { name: "Press en máquina hombros", description: "Deltoides anterior simétrico", tips: "Controla la fase excéntrica" },
    { name: "Upright row con barra", description: "Deltoides y trapecio", tips: "Cuidado con el impingement" },
    { name: "Face pull con cuerda", description: "Deltoides posterior", tips: "Polea alta, ángulo neutro de hombro" },
    { name: "Elevaciones laterales en cable", description: "Deltoides medio", tips: "Tensión constante del cable" },
    { name: "Rotación externa con mancuerna", description: "Manguito rotador", tips: "Movimiento preventivo de lesiones" },
    { name: "Press Z con barra", description: "Deltoides frontal", tips: "Agarre neutro, codos adelante" },
    { name: "Elevaciones en W (YWT)", description: "Deltoides posterior y escápulas", tips: "Movimiento de activación" },
    { name: "Lateral raise en máquina", description: "Deltoides medio aislado", tips: "Sin trampa en la postura" },
  ],
  Bíceps: [
    { name: "Curl con barra", description: "Foco: Bíceps braquial", tips: "Codos fijos, sin balanceo" },
    { name: "Curl con mancuerna alterno", description: "Foco: Bíceps unilateral", tips: "Supinación en la cima" },
    { name: "Curl martillo", description: "Foco: Braquial y braquiorradial", tips: "Agarre neutro, codo fijo" },
    { name: "Curl predicador", description: "Foco: Cabeza larga del bíceps", tips: "Rango completo sin hiperextender" },
    { name: "Curl en cable polea baja", description: "Foco: Tensión constante en bíceps", tips: "Sin usar inercia" },
    { name: "Curl concentrado", description: "Foco: Contracción máxima", tips: "Codo apoyado en muslo interior" },
    { name: "Curl inclinado", description: "Foco: Cabeza larga del bíceps", tips: "Estiramiento máximo en inicio" },
    { name: "Curl Zottman", description: "Foco: Bíceps y braquiorradial", tips: "Supinar al subir, prinar al bajar" },
    { name: "Curl en máquina", description: "Foco: Bíceps simétrico", tips: "Ideal para finisher" },
    { name: "Curl con banda elástica", description: "Foco: Bíceps con resistencia variable", tips: "Control en toda la fase" },
  ],
  Tríceps: [
    { name: "Press francés con barra", description: "Foco: Cabeza larga del tríceps", tips: "Codos apuntando al techo" },
    { name: "Fondos en paralelas estrecho", description: "Foco: Tríceps completo", tips: "Cuerpo recto, codos cerca" },
    { name: "Extensión de tríceps polea", description: "Foco: Cabeza lateral y medial", tips: "Codos fijos a los costados" },
    { name: "Press de banca agarre cerrado", description: "Foco: Tríceps y pecho interno", tips: "Agarre a 30cm, codos cerca" },
    { name: "Kickbacks con mancuerna", description: "Foco: Cabeza lateral del tríceps", tips: "Brazo paralelo al suelo" },
    { name: "Extensión sobre cabeza en cable", description: "Foco: Cabeza larga", tips: "Codos cerca de la cabeza" },
    { name: "Rompecráneos con mancuernas", description: "Foco: Todas las cabezas", tips: "Bajar hasta la oreja, codos fijos" },
    { name: "Press Arnold inverso", description: "Foco: Tríceps con variante", tips: "Rotación controlada" },
    { name: "Extensión unilateral polea", description: "Foco: Tríceps unilateral", tips: "Codo apuntando al techo" },
    { name: "Fondos en banco", description: "Foco: Tríceps bodyweight", tips: "Baja hasta 90° de codo" },
  ],
  Core: [
    { name: "Plancha frontal", description: "Foco: Core completo isométrico", tips: "Cuerpo recto, glúteos contraídos" },
    { name: "Crunch abdominal", description: "Foco: Recto abdominal", tips: "Solo eleva los hombros, no el cuello" },
    { name: "Elevación de piernas colgado", description: "Foco: Recto inferior", tips: "Contrae el core antes de subir" },
    { name: "Russian twist con peso", description: "Foco: Oblicuos", tips: "Pies levantados del suelo para más dificultad" },
    { name: "Dead bug", description: "Foco: Core funcional", tips: "Zona lumbar en contacto con el suelo" },
    { name: "Pallof press", description: "Foco: Core anti-rotacional", tips: "Cable a altura de pecho, codos bloqueados" },
    { name: "Ab wheel rollout", description: "Foco: Core avanzado", tips: "Solo avanza hasta donde mantengas posición" },
    { name: "Plancha lateral", description: "Foco: Oblicuos", tips: "Cuerpo en línea recta, no hundas la cadera" },
    { name: "Crunch en cable", description: "Foco: Recto abdominal con resistencia", tips: "Flexiona la columna, no la cadera" },
    { name: "Hollow body hold", description: "Foco: Core funcional", tips: "Zona lumbar pegada al suelo siempre" },
  ],
  Cardio: [
    { name: "Correr en cinta", description: "Foco: Cardiovascular general", tips: "Ritmo conversacional para LISS" },
    { name: "HIIT en bicicleta", description: "Foco: Cardio de alta intensidad", tips: "20s al máximo, 40s descanso" },
    { name: "Salto a la comba", description: "Foco: Coordinación y cardiovascular", tips: "Aterrizaje suave en bola de pie" },
    { name: "Burpees", description: "Foco: Cardio + fuerza total body", tips: "Mantén el ritmo constante" },
    { name: "Mountain climbers", description: "Foco: Core + cardio", tips: "Caderas abajo, ritmo alto" },
    { name: "Remo en ergómetro", description: "Foco: Cardiovascular + espalda", tips: "60% piernas, 30% torso, 10% brazos" },
    { name: "Sprints", description: "Foco: Cardio anaeróbico", tips: "100% de esfuerzo, descanso completo" },
    { name: "Caminata en inclinación", description: "Foco: Cardio de baja intensidad", tips: "12% inclinación, 5.5km/h" },
    { name: "Elíptica LISS", description: "Foco: Cardiovascular bajo impacto", tips: "30-60 min a ritmo moderado" },
    { name: "Box jumps", description: "Foco: Potencia + cardio", tips: "Aterrizaje suave, reset entre saltos" },
  ],
};

const MUSCLE_GROUPS = Object.keys(EXERCISES) as MuscleGroup[];

const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  Pecho: "#FF6B9D",
  Espalda: Colors.dark.accentBlue,
  Piernas: Colors.dark.accent,
  Hombros: Colors.dark.warning,
  Bíceps: "#B39DDB",
  Tríceps: "#4DB6AC",
  Core: "#FF8A65",
  Cardio: "#EF5350",
};

const WORKOUT_TEMPLATES = [
  {
    name: "Push (Empuje)",
    icon: "arrow-up-circle",
    color: "#FF6B9D",
    exercises: ["Press de banca", "Press militar con barra", "Press inclinado con mancuernas", "Fondos en paralelas", "Elevaciones laterales"],
  },
  {
    name: "Pull (Jalón)",
    icon: "arrow-down-circle",
    color: Colors.dark.accentBlue,
    exercises: ["Dominadas", "Remo con barra", "Pulldown en polea", "Face pull", "Curl con barra"],
  },
  {
    name: "Legs (Piernas)",
    icon: "walk",
    color: Colors.dark.accent,
    exercises: ["Sentadilla con barra", "Peso muerto rumano", "Prensa de piernas", "Extensiones de cuádriceps", "Curl femoral tumbado"],
  },
  {
    name: "Full Body",
    icon: "body",
    color: Colors.dark.warning,
    exercises: ["Sentadilla con barra", "Press de banca", "Peso muerto rumano", "Press militar con barra", "Dominadas"],
  },
  {
    name: "Cardio + Core",
    icon: "heart",
    color: "#EF5350",
    exercises: ["HIIT en bicicleta", "Plancha abdominal", "Mountain climbers", "Crunch en cable", "Burpees"],
  },
];

export default function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const { data, addWorkout, deleteWorkout } = useApp();

  const [activeGroup, setActiveGroup] = useState<MuscleGroup>("Pecho");
  const [building, setBuilding] = useState(false);
  const [workoutName, setWorkoutName] = useState("Mi Entrenamiento");
  const [selectedExercises, setSelectedExercises] = useState<
    { name: string; sets: { reps: string; weight: string }[] }[]
  >([]);

  const [builderMode, setBuilderMode] = useState<"manual" | "ai">("manual");
  const [aiGoal, setAiGoal] = useState("Ganar músculo");
  const [aiLevel, setAiLevel] = useState("Intermedio");
  const [aiEquipment, setAiEquipment] = useState("Gimnasio completo");
  const [aiDaysPerWeek, setAiDaysPerWeek] = useState(3);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const recentWorkouts = [...data.workouts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const addExercise = (name: string) => {
    if (selectedExercises.find((e) => e.name === name)) return;
    setSelectedExercises((prev) => [
      ...prev,
      { name, sets: [{ reps: "8", weight: "20" }] },
    ]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeExercise = (name: string) => {
    setSelectedExercises((prev) => prev.filter((e) => e.name !== name));
  };

  const addSet = (exerciseName: string) => {
    setSelectedExercises((prev) =>
      prev.map((e) =>
        e.name === exerciseName
          ? { ...e, sets: [...e.sets, { reps: "8", weight: e.sets[e.sets.length - 1]?.weight ?? "20" }] }
          : e
      )
    );
  };

  const updateSet = (exerciseName: string, setIdx: number, field: "reps" | "weight", value: string) => {
    setSelectedExercises((prev) =>
      prev.map((e) =>
        e.name === exerciseName
          ? { ...e, sets: e.sets.map((s, i) => (i === setIdx ? { ...s, [field]: value } : s)) }
          : e
      )
    );
  };

  const loadTemplate = (template: typeof WORKOUT_TEMPLATES[0]) => {
    const exercises = template.exercises.map((exName) => ({
      name: exName,
      sets: [{ reps: "10", weight: "20" }, { reps: "10", weight: "20" }, { reps: "10", weight: "20" }],
    }));
    setSelectedExercises(exercises);
    setWorkoutName(template.name);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const generateAiWorkout = async () => {
    setAiError(null);
    setAiGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const apiBase = getApiUrl();
      const url = new URL("/api/ai/workout", apiBase).toString();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: aiGoal,
          level: aiLevel,
          equipment: aiEquipment,
          daysPerWeek: aiDaysPerWeek,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Error del servidor");
      }
      const routine = await res.json() as {
        name: string;
        description?: string;
        exercises: { name: string; sets: number; reps: string; weight: string; notes?: string }[];
      };
      if (!routine.exercises?.length) throw new Error("La IA no generó ejercicios");
      setWorkoutName(routine.name ?? "Rutina IA");
      setSelectedExercises(
        routine.exercises.map((ex) => ({
          name: ex.name,
          sets: Array.from({ length: ex.sets ?? 3 }, () => ({
            reps: String(ex.reps ?? "10"),
            weight: String(ex.weight ?? "20"),
          })),
        }))
      );
      setBuilderMode("manual");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setAiError(e.message ?? "Error al generar rutina");
    } finally {
      setAiGenerating(false);
    }
  };

  const saveWorkout = async () => {
    if (selectedExercises.length === 0) {
      Alert.alert("Sin ejercicios", "Añade al menos un ejercicio");
      return;
    }
    const exercises: WorkoutExercise[] = selectedExercises.map((e) => ({
      exerciseId: e.name.replace(/\s/g, "_").toLowerCase(),
      name: e.name,
      sets: e.sets.map((s) => ({
        reps: parseInt(s.reps) || 0,
        weight: parseFloat(s.weight) || 0,
        completed: true,
      })),
    }));
    await addWorkout({
      date: today,
      name: workoutName,
      exercises,
      durationMinutes: selectedExercises.length * 8,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBuilding(false);
    setSelectedExercises([]);
    setWorkoutName("Mi Entrenamiento");
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 16 }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.text }]}>Entrenamiento</Text>
          <TouchableOpacity
            style={[styles.buildBtn, { backgroundColor: building ? C.surface2 : Colors.dark.accent }]}
            onPress={() => setBuilding(!building)}
            activeOpacity={0.85}
          >
            <Ionicons name={building ? "close" : "add"} size={22} color={building ? C.text : "#000"} />
          </TouchableOpacity>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsRow}>
          {[
            { label: "Total", value: data.workouts.length.toString(), color: Colors.dark.accent },
            { label: "Esta semana", value: data.workouts.filter((w) => {
              const d = new Date(w.date);
              const now = new Date();
              const week = new Date(now.setDate(now.getDate() - 7));
              return d >= week;
            }).length.toString(), color: Colors.dark.accentBlue },
            { label: "Hoy", value: data.workouts.filter((w) => w.date === today).length.toString(), color: "#FF6B9D" },
          ].map((stat) => (
            <View key={stat.label} style={[styles.statBox, { backgroundColor: C.surface }]}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Workout Builder */}
        {building && (
          <View style={[styles.builderCard, { backgroundColor: C.surface }]}>
            {/* Mode toggle */}
            <View style={[styles.modeToggle, { backgroundColor: C.surface2 }]}>
              <TouchableOpacity
                style={[styles.modeBtn, builderMode === "manual" && { backgroundColor: C.background }]}
                onPress={() => setBuilderMode("manual")}
                activeOpacity={0.8}
              >
                <Ionicons name="list" size={15} color={builderMode === "manual" ? Colors.dark.accent : C.textSecondary} />
                <Text style={[styles.modeBtnText, { color: builderMode === "manual" ? Colors.dark.accent : C.textSecondary }]}>
                  Manual
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, builderMode === "ai" && { backgroundColor: C.background }]}
                onPress={() => setBuilderMode("ai")}
                activeOpacity={0.8}
              >
                <Ionicons name="sparkles" size={15} color={builderMode === "ai" ? Colors.dark.accent : C.textSecondary} />
                <Text style={[styles.modeBtnText, { color: builderMode === "ai" ? Colors.dark.accent : C.textSecondary }]}>
                  Generar con IA
                </Text>
              </TouchableOpacity>
            </View>

            {/* AI Builder */}
            {builderMode === "ai" && (
              <View style={styles.aiForm}>
                <Text style={[styles.aiFormTitle, { color: C.text }]}>Crea tu rutina con IA</Text>
                <Text style={[styles.aiFormSub, { color: C.textSecondary }]}>
                  Responde estas preguntas y la IA diseñará una rutina personalizada para ti.
                </Text>

                <Text style={[styles.aiFieldLabel, { color: C.textSecondary }]}>Objetivo</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {["Ganar músculo", "Perder grasa", "Mejorar resistencia", "Fuerza general", "Flexibilidad"].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.aiChip, { backgroundColor: aiGoal === g ? Colors.dark.accent + "33" : C.surface2, borderColor: aiGoal === g ? Colors.dark.accent : "transparent" }]}
                      onPress={() => setAiGoal(g)}
                    >
                      <Text style={[styles.aiChipText, { color: aiGoal === g ? Colors.dark.accent : C.textSecondary }]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.aiFieldLabel, { color: C.textSecondary }]}>Nivel</Text>
                <View style={styles.aiRow}>
                  {["Principiante", "Intermedio", "Avanzado"].map((l) => (
                    <TouchableOpacity
                      key={l}
                      style={[styles.aiLevelBtn, { backgroundColor: aiLevel === l ? Colors.dark.accentBlue + "33" : C.surface2, borderColor: aiLevel === l ? Colors.dark.accentBlue : "transparent" }]}
                      onPress={() => setAiLevel(l)}
                    >
                      <Text style={[styles.aiLevelText, { color: aiLevel === l ? Colors.dark.accentBlue : C.textSecondary }]}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.aiFieldLabel, { color: C.textSecondary }]}>Equipamiento</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {["Gimnasio completo", "Mancuernas", "Sin equipo", "Bandas elásticas", "Barra dominadas"].map((e) => (
                    <TouchableOpacity
                      key={e}
                      style={[styles.aiChip, { backgroundColor: aiEquipment === e ? "#7C3AED33" : C.surface2, borderColor: aiEquipment === e ? "#7C3AED" : "transparent" }]}
                      onPress={() => setAiEquipment(e)}
                    >
                      <Text style={[styles.aiChipText, { color: aiEquipment === e ? "#7C3AED" : C.textSecondary }]}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.aiFieldLabel, { color: C.textSecondary }]}>Días por semana</Text>
                <View style={styles.aiRow}>
                  {[2, 3, 4, 5, 6].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.aiDayBtn, { backgroundColor: aiDaysPerWeek === d ? "#FF6B9D33" : C.surface2, borderColor: aiDaysPerWeek === d ? "#FF6B9D" : "transparent" }]}
                      onPress={() => setAiDaysPerWeek(d)}
                    >
                      <Text style={[styles.aiDayText, { color: aiDaysPerWeek === d ? "#FF6B9D" : C.textSecondary }]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {aiError && (
                  <View style={[styles.aiErrorBox, { backgroundColor: "#EF535022" }]}>
                    <Ionicons name="alert-circle" size={16} color="#EF5350" />
                    <Text style={[styles.aiErrorText, { color: "#EF5350" }]}>{aiError}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.aiGenBtn, { backgroundColor: aiGenerating ? C.border : Colors.dark.accent }]}
                  onPress={generateAiWorkout}
                  disabled={aiGenerating}
                  activeOpacity={0.85}
                >
                  {aiGenerating ? (
                    <>
                      <ActivityIndicator size="small" color="#000" />
                      <Text style={styles.aiGenBtnText}>Generando rutina...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={18} color="#000" />
                      <Text style={styles.aiGenBtnText}>Generar Rutina con IA</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Manual Builder */}
            {builderMode === "manual" && (
              <>
            <TextInput
              style={[styles.workoutNameInput, { color: C.text, borderBottomColor: C.border }]}
              value={workoutName}
              onChangeText={setWorkoutName}
              placeholder="Nombre del entrenamiento"
              placeholderTextColor={C.textSecondary}
            />

            {/* Templates */}
            <Text style={[styles.templateTitle, { color: C.textSecondary }]}>Plantillas Rápidas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {WORKOUT_TEMPLATES.map((t) => (
                <TouchableOpacity
                  key={t.name}
                  style={[styles.templateCard, { backgroundColor: t.color + "22", borderColor: t.color + "44" }]}
                  onPress={() => loadTemplate(t)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={t.icon as any} size={20} color={t.color} />
                  <Text style={[styles.templateName, { color: t.color }]}>{t.name}</Text>
                  <Text style={[styles.templateExCount, { color: C.textSecondary }]}>{t.exercises.length} ejercicios</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Muscle Group Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroll}>
              {MUSCLE_GROUPS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.groupTag,
                    {
                      backgroundColor:
                        activeGroup === g ? MUSCLE_COLORS[g] : C.surface2,
                    },
                  ]}
                  onPress={() => setActiveGroup(g)}
                >
                  <Ionicons
                    name={MUSCLE_ICONS[g] as any}
                    size={14}
                    color={activeGroup === g ? "#000" : C.textSecondary}
                  />
                  <Text
                    style={[
                      styles.groupTagText,
                      { color: activeGroup === g ? "#000" : C.textSecondary },
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Exercise List */}
            <View style={styles.exerciseList}>
              {EXERCISES[activeGroup].map((ex) => {
                const isSelected = !!selectedExercises.find((e) => e.name === ex.name);
                return (
                  <TouchableOpacity
                    key={ex.name}
                    style={[
                      styles.exerciseItem,
                      {
                        backgroundColor: isSelected
                          ? MUSCLE_COLORS[activeGroup] + "22"
                          : C.surface2,
                        borderLeftColor: isSelected ? MUSCLE_COLORS[activeGroup] : "transparent",
                      },
                    ]}
                    onPress={() =>
                      isSelected ? removeExercise(ex.name) : addExercise(ex.name)
                    }
                  >
                    <View style={styles.exerciseItemContent}>
                      <Text style={[styles.exerciseName, { color: C.text }]}>{ex.name}</Text>
                      <Text style={[styles.exerciseDesc, { color: C.textSecondary }]}>
                        {ex.description}
                      </Text>
                      <Text style={[styles.exerciseTip, { color: MUSCLE_COLORS[activeGroup] }]}>
                        {ex.tips}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.exerciseCheck,
                        {
                          backgroundColor: isSelected
                            ? MUSCLE_COLORS[activeGroup]
                            : C.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={isSelected ? "checkmark" : "add"}
                        size={16}
                        color={isSelected ? "#000" : C.textSecondary}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected Exercises & Sets */}
            {selectedExercises.length > 0 && (
              <View style={styles.setsSection}>
                <Text style={[styles.setsSectionTitle, { color: C.text }]}>
                  Ejercicios Seleccionados ({selectedExercises.length})
                </Text>
                {selectedExercises.map((ex) => (
                  <View key={ex.name} style={[styles.setsCard, { backgroundColor: C.surface2 }]}>
                    <View style={styles.setsHeader}>
                      <Text style={[styles.setsExName, { color: C.text }]}>{ex.name}</Text>
                      <TouchableOpacity onPress={() => removeExercise(ex.name)}>
                        <Ionicons name="close-circle" size={20} color={C.error} />
                      </TouchableOpacity>
                    </View>
                    {ex.sets.map((set, i) => (
                      <View key={i} style={styles.setRow}>
                        <Text style={[styles.setNum, { color: Colors.dark.accent }]}>
                          Serie {i + 1}
                        </Text>
                        <View style={[styles.setInput, { backgroundColor: C.surface }]}>
                          <TextInput
                            style={[styles.setInputField, { color: C.text }]}
                            value={set.reps}
                            onChangeText={(v) => updateSet(ex.name, i, "reps", v)}
                            keyboardType="numeric"
                          />
                          <Text style={[styles.setInputLabel, { color: C.textSecondary }]}>reps</Text>
                        </View>
                        <View style={[styles.setInput, { backgroundColor: C.surface }]}>
                          <TextInput
                            style={[styles.setInputField, { color: C.text }]}
                            value={set.weight}
                            onChangeText={(v) => updateSet(ex.name, i, "weight", v)}
                            keyboardType="numeric"
                          />
                          <Text style={[styles.setInputLabel, { color: C.textSecondary }]}>kg</Text>
                        </View>
                      </View>
                    ))}
                    <TouchableOpacity
                      style={[styles.addSetBtn, { borderColor: Colors.dark.accent + "44" }]}
                      onPress={() => addSet(ex.name)}
                    >
                      <Ionicons name="add" size={16} color={Colors.dark.accent} />
                      <Text style={[styles.addSetText, { color: Colors.dark.accent }]}>
                        Añadir Serie
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.saveWorkoutBtn, { backgroundColor: Colors.dark.accent }]}
                  onPress={saveWorkout}
                  activeOpacity={0.85}
                >
                  <Ionicons name="save" size={20} color="#000" />
                  <Text style={styles.saveWorkoutBtnText}>Guardar Entrenamiento</Text>
                </TouchableOpacity>
              </View>
            )}
              </>
            )}
          </View>
        )}

        {/* Exercise Database Browser */}
        {!building && (
          <>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Biblioteca de Ejercicios</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroll2}>
              {MUSCLE_GROUPS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.groupCard,
                    { backgroundColor: activeGroup === g ? MUSCLE_COLORS[g] : C.surface },
                  ]}
                  onPress={() => setActiveGroup(g)}
                >
                  <Ionicons
                    name={MUSCLE_ICONS[g] as any}
                    size={22}
                    color={activeGroup === g ? "#000" : MUSCLE_COLORS[g]}
                  />
                  <Text
                    style={[
                      styles.groupCardText,
                      { color: activeGroup === g ? "#000" : C.text },
                    ]}
                  >
                    {g}
                  </Text>
                  <Text
                    style={[
                      styles.groupCardCount,
                      { color: activeGroup === g ? "#000" : C.textSecondary },
                    ]}
                  >
                    {EXERCISES[g].length} ejercicios
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={[styles.exerciseBrowser, { backgroundColor: C.surface }]}>
              <Text style={[styles.groupTitle, { color: MUSCLE_COLORS[activeGroup] }]}>
                {activeGroup}
              </Text>
              {EXERCISES[activeGroup].map((ex, i) => (
                <View
                  key={i}
                  style={[
                    styles.browserItem,
                    { borderBottomColor: C.border, borderBottomWidth: i < EXERCISES[activeGroup].length - 1 ? 1 : 0 },
                  ]}
                >
                  <View style={[styles.browserNum, { backgroundColor: MUSCLE_COLORS[activeGroup] + "22" }]}>
                    <Text style={[styles.browserNumText, { color: MUSCLE_COLORS[activeGroup] }]}>{i + 1}</Text>
                  </View>
                  <View style={styles.browserContent}>
                    <Text style={[styles.browserName, { color: C.text }]}>{ex.name}</Text>
                    <Text style={[styles.browserDesc, { color: C.textSecondary }]}>{ex.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Recent Workouts */}
        <Text style={[styles.sectionTitle, { color: C.text }]}>Últimos Entrenamientos</Text>
        {recentWorkouts.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: C.surface }]}>
            <Ionicons name="barbell-outline" size={40} color={C.textTertiary} />
            <Text style={[styles.emptyText, { color: C.textSecondary }]}>
              Aún no has registrado entrenamientos
            </Text>
          </View>
        ) : (
          recentWorkouts.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={[styles.workoutCard, { backgroundColor: C.surface }]}
              onLongPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert("Eliminar", `¿Eliminar "${w.name}"?`, [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Eliminar", style: "destructive", onPress: () => deleteWorkout(w.id) },
                ]);
              }}
              activeOpacity={0.85}
            >
              <View style={styles.workoutCardHeader}>
                <View style={[styles.workoutIcon, { backgroundColor: Colors.dark.accent + "22" }]}>
                  <Ionicons name="barbell" size={20} color={Colors.dark.accent} />
                </View>
                <View style={styles.workoutInfo}>
                  <Text style={[styles.workoutName, { color: C.text }]}>{w.name}</Text>
                  <Text style={[styles.workoutDate, { color: C.textSecondary }]}>{w.date}</Text>
                </View>
                <View style={styles.workoutStats}>
                  <Text style={[styles.workoutStatVal, { color: Colors.dark.accent }]}>
                    {w.exercises.length}
                  </Text>
                  <Text style={[styles.workoutStatLabel, { color: C.textSecondary }]}>ejerc.</Text>
                </View>
                <View style={styles.workoutStats}>
                  <Text style={[styles.workoutStatVal, { color: Colors.dark.accentBlue }]}>
                    {w.durationMinutes}
                  </Text>
                  <Text style={[styles.workoutStatLabel, { color: C.textSecondary }]}>min</Text>
                </View>
              </View>
              <View style={styles.workoutExList}>
                {w.exercises.slice(0, 3).map((e, i) => (
                  <View key={i} style={[styles.workoutExTag, { backgroundColor: C.surface2 }]}>
                    <Text style={[styles.workoutExTagText, { color: C.textSecondary }]}>{e.name}</Text>
                  </View>
                ))}
                {w.exercises.length > 3 && (
                  <View style={[styles.workoutExTag, { backgroundColor: C.surface2 }]}>
                    <Text style={[styles.workoutExTagText, { color: C.textSecondary }]}>
                      +{w.exercises.length - 3}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28 },
  buildBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  statBox: { flex: 1, borderRadius: 14, padding: 14, alignItems: "center" },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 24 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  builderCard: { borderRadius: 20, padding: 16, marginBottom: 20 },
  workoutNameInput: { fontFamily: "Inter_600SemiBold", fontSize: 20, borderBottomWidth: 1, paddingBottom: 10, marginBottom: 16 },
  groupScroll: { marginBottom: 12 },
  templateTitle: { fontFamily: "Inter_500Medium", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  templateCard: { borderRadius: 14, padding: 14, marginRight: 10, alignItems: "center", gap: 6, borderWidth: 1, minWidth: 110 },
  templateName: { fontFamily: "Inter_600SemiBold", fontSize: 13, textAlign: "center" },
  templateExCount: { fontFamily: "Inter_400Regular", fontSize: 11 },
  groupScroll2: { marginBottom: 16 },
  groupTag: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, gap: 6 },
  groupTagText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  groupCard: { width: 110, borderRadius: 16, padding: 14, marginRight: 12, alignItems: "center", gap: 6 },
  groupCardText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  groupCardCount: { fontFamily: "Inter_400Regular", fontSize: 11 },
  exerciseList: { gap: 8 },
  exerciseItem: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    alignItems: "center",
    gap: 12,
  },
  exerciseItemContent: { flex: 1 },
  exerciseName: { fontFamily: "Inter_500Medium", fontSize: 14 },
  exerciseDesc: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  exerciseTip: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 4, fontStyle: "italic" },
  exerciseCheck: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  setsSection: { marginTop: 16 },
  setsSectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, marginBottom: 12 },
  setsCard: { borderRadius: 14, padding: 14, marginBottom: 12 },
  setsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  setsExName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  setRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  setNum: { fontFamily: "Inter_600SemiBold", fontSize: 12, width: 50 },
  setInput: { flex: 1, borderRadius: 10, padding: 10 },
  setInputField: { fontFamily: "Inter_700Bold", fontSize: 18 },
  setInputLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  addSetBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 10, paddingVertical: 8, gap: 4 },
  addSetText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  saveWorkoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 14, gap: 8, marginTop: 8 },
  saveWorkoutBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#000" },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, marginBottom: 12 },
  exerciseBrowser: { borderRadius: 20, padding: 16, marginBottom: 20 },
  groupTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 12 },
  browserItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  browserNum: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  browserNumText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  browserContent: { flex: 1 },
  browserName: { fontFamily: "Inter_500Medium", fontSize: 14 },
  browserDesc: { fontFamily: "Inter_400Regular", fontSize: 12 },
  emptyCard: { borderRadius: 16, padding: 32, alignItems: "center", gap: 12, marginBottom: 16 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
  workoutCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  workoutCardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  workoutIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  workoutInfo: { flex: 1 },
  workoutName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  workoutDate: { fontFamily: "Inter_400Regular", fontSize: 12 },
  workoutStats: { alignItems: "center" },
  workoutStatVal: { fontFamily: "Inter_700Bold", fontSize: 18 },
  workoutStatLabel: { fontFamily: "Inter_400Regular", fontSize: 10 },
  workoutExList: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  workoutExTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  workoutExTagText: { fontFamily: "Inter_400Regular", fontSize: 11 },
  modeToggle: { flexDirection: "row", borderRadius: 12, padding: 4, marginBottom: 16 },
  modeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 10 },
  modeBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  aiForm: { paddingTop: 4 },
  aiFormTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 4 },
  aiFormSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 16, lineHeight: 18 },
  aiFieldLabel: { fontFamily: "Inter_500Medium", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  aiChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  aiChipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  aiRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  aiLevelBtn: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center", borderWidth: 1 },
  aiLevelText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  aiDayBtn: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center", borderWidth: 1 },
  aiDayText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  aiErrorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 12, marginBottom: 12 },
  aiErrorText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  aiGenBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14, marginTop: 8 },
  aiGenBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#000" },
});
