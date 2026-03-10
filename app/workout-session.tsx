import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp, WorkoutExercise, WorkoutSet } from "@/contexts/AppContext";

export default function WorkoutSessionScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const { saveWorkout } = useApp();
  const params = useLocalSearchParams<{ exercises?: string; name?: string }>();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [sessionName, setSessionName] = useState(params.name ?? "Entrenamiento");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initialExercises: WorkoutExercise[] = params.exercises
    ? JSON.parse(params.exercises)
    : [];

  const [exercises, setExercises] = useState<WorkoutExercise[]>(
    initialExercises.length > 0
      ? initialExercises
      : [{ exerciseId: "e1", name: "Ejercicio 1", sets: [{ reps: 10, weight: 0, completed: false }] }]
  );

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const addSet = (exIdx: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exIdx] };
      const lastSet = ex.sets[ex.sets.length - 1];
      ex.sets = [...ex.sets, { ...lastSet, completed: false }];
      updated[exIdx] = ex;
      return updated;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exIdx] };
      if (ex.sets.length <= 1) return prev;
      ex.sets = ex.sets.filter((_, i) => i !== setIdx);
      updated[exIdx] = ex;
      return updated;
    });
  };

  const updateSet = (exIdx: number, setIdx: number, field: "reps" | "weight", value: string) => {
    setExercises((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exIdx] };
      ex.sets = ex.sets.map((s, i) =>
        i === setIdx ? { ...s, [field]: parseFloat(value) || 0 } : s
      );
      updated[exIdx] = ex;
      return updated;
    });
  };

  const toggleSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exIdx] };
      ex.sets = ex.sets.map((s, i) =>
        i === setIdx ? { ...s, completed: !s.completed } : s
      );
      updated[exIdx] = ex;
      return updated;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const addExercise = () => {
    const id = Date.now().toString();
    setExercises((prev) => [
      ...prev,
      { exerciseId: id, name: `Ejercicio ${prev.length + 1}`, sets: [{ reps: 10, weight: 0, completed: false }] },
    ]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const finishSession = async () => {
    const completed = exercises.every((ex) => ex.sets.every((s) => s.completed));
    if (!completed) {
      Alert.alert(
        "Finalizar entrenamiento",
        "Hay series sin completar. ¿Deseas guardar igualmente?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Guardar", onPress: doSave },
        ]
      );
    } else {
      doSave();
    }
  };

  const doSave = async () => {
    const today = new Date().toISOString().split("T")[0];
    await saveWorkout({
      date: today,
      name: sessionName,
      exercises,
      durationMinutes: Math.round(seconds / 60),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const totalSets = exercises.reduce((s, ex) => s + ex.sets.length, 0);
  const completedSets = exercises.reduce((s, ex) => s + ex.sets.filter((st) => st.completed).length, 0);
  const totalVolume = exercises.reduce(
    (s, ex) => s + ex.sets.reduce((sv, st) => sv + st.weight * st.reps, 0),
    0
  );

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 16, paddingBottom: bottomInset + 80 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={C.text} />
          </TouchableOpacity>
          <TextInput
            style={[styles.sessionName, { color: C.text }]}
            value={sessionName}
            onChangeText={setSessionName}
          />
          <TouchableOpacity
            style={[styles.timerBtn, { backgroundColor: running ? Colors.dark.accent + "22" : C.surface2 }]}
            onPress={() => setRunning(!running)}
          >
            <Ionicons name={running ? "pause" : "play"} size={18} color={running ? Colors.dark.accent : C.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Stats Bar */}
        <LinearGradient
          colors={[C.surface, C.surface2]}
          style={styles.statsBar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.dark.accent }]}>{formatTime(seconds)}</Text>
            <Text style={[styles.statLabel, { color: C.textSecondary }]}>Tiempo</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: C.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.dark.accentBlue }]}>{completedSets}/{totalSets}</Text>
            <Text style={[styles.statLabel, { color: C.textSecondary }]}>Series</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: C.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#FF6B9D" }]}>{totalVolume.toFixed(0)}kg</Text>
            <Text style={[styles.statLabel, { color: C.textSecondary }]}>Volumen</Text>
          </View>
        </LinearGradient>

        {/* Exercises */}
        {exercises.map((ex, exIdx) => (
          <View key={ex.exerciseId} style={[styles.exerciseCard, { backgroundColor: C.surface }]}>
            <View style={styles.exerciseHeader}>
              <View style={[styles.exNumBadge, { backgroundColor: Colors.dark.accent + "22" }]}>
                <Text style={[styles.exNum, { color: Colors.dark.accent }]}>{exIdx + 1}</Text>
              </View>
              <TextInput
                style={[styles.exerciseName, { color: C.text }]}
                value={ex.name}
                onChangeText={(t) => setExercises((prev) => prev.map((e, i) => i === exIdx ? { ...e, name: t } : e))}
              />
            </View>

            {/* Set Headers */}
            <View style={styles.setHeaders}>
              <Text style={[styles.setHeaderText, { color: C.textSecondary, width: 32 }]}>Serie</Text>
              <Text style={[styles.setHeaderText, { color: C.textSecondary, flex: 1, textAlign: "center" }]}>kg</Text>
              <Text style={[styles.setHeaderText, { color: C.textSecondary, flex: 1, textAlign: "center" }]}>Reps</Text>
              <View style={{ width: 40 }} />
            </View>

            {ex.sets.map((set, setIdx) => (
              <View key={setIdx} style={[styles.setRow, { borderTopColor: C.border }]}>
                <TouchableOpacity
                  style={[
                    styles.setNumBtn,
                    {
                      backgroundColor: set.completed ? Colors.dark.accent : C.surface2,
                    },
                  ]}
                  onPress={() => toggleSet(exIdx, setIdx)}
                >
                  {set.completed
                    ? <Ionicons name="checkmark" size={14} color="#000" />
                    : <Text style={[styles.setNumText, { color: C.textSecondary }]}>{setIdx + 1}</Text>
                  }
                </TouchableOpacity>
                <TextInput
                  style={[styles.setInput, { color: C.text, backgroundColor: C.surface2 }]}
                  value={set.weight === 0 ? "" : String(set.weight)}
                  onChangeText={(v) => updateSet(exIdx, setIdx, "weight", v)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={C.textTertiary}
                />
                <TextInput
                  style={[styles.setInput, { color: C.text, backgroundColor: C.surface2 }]}
                  value={set.reps === 0 ? "" : String(set.reps)}
                  onChangeText={(v) => updateSet(exIdx, setIdx, "reps", v)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={C.textTertiary}
                />
                <TouchableOpacity
                  style={styles.removeSetBtn}
                  onPress={() => removeSet(exIdx, setIdx)}
                >
                  <Ionicons name="remove-circle-outline" size={20} color={C.textTertiary} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.addSetBtn, { borderColor: C.border }]}
              onPress={() => addSet(exIdx)}
            >
              <Ionicons name="add" size={16} color={Colors.dark.accent} />
              <Text style={[styles.addSetText, { color: Colors.dark.accent }]}>Añadir serie</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.addExBtn, { borderColor: C.border }]}
          onPress={addExercise}
        >
          <Ionicons name="barbell" size={18} color={C.textSecondary} />
          <Text style={[styles.addExText, { color: C.textSecondary }]}>Añadir ejercicio</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Finish Button */}
      <View style={[styles.finishWrap, { paddingBottom: bottomInset + 16, backgroundColor: C.background }]}>
        <TouchableOpacity
          style={[styles.finishBtn, { backgroundColor: Colors.dark.accent }]}
          onPress={finishSession}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle" size={22} color="#000" />
          <Text style={styles.finishBtnText}>Finalizar Entrenamiento</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  sessionName: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 20 },
  timerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  statsBar: { borderRadius: 16, padding: 16, flexDirection: "row", marginBottom: 20 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 22 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, marginHorizontal: 8 },
  exerciseCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  exerciseHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  exNumBadge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  exNum: { fontFamily: "Inter_700Bold", fontSize: 13 },
  exerciseName: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 16 },
  setHeaders: { flexDirection: "row", alignItems: "center", paddingBottom: 8, gap: 8 },
  setHeaderText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  setRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, gap: 8 },
  setNumBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  setNumText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  setInput: { flex: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 4, fontFamily: "Inter_600SemiBold", fontSize: 16, textAlign: "center" },
  removeSetBtn: { width: 40, alignItems: "center" },
  addSetBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderStyle: "dashed", marginTop: 8 },
  addSetText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  addExBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderStyle: "dashed", marginTop: 4 },
  addExText: { fontFamily: "Inter_500Medium", fontSize: 15 },
  finishWrap: { paddingHorizontal: 20, paddingTop: 12 },
  finishBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 16, gap: 10 },
  finishBtnText: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#000" },
});
