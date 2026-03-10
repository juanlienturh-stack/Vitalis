import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  useColorScheme,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";

const EXERCISES = [
  {
    id: "478",
    name: "4-7-8 Relajante",
    description: "Técnica para reducir el estrés y mejorar el sueño",
    color: "#4DB6AC",
    inhale: 4,
    hold: 7,
    exhale: 8,
    cycles: 4,
    icon: "leaf",
  },
  {
    id: "box",
    name: "Respiración Cuadrada",
    description: "Equilibra el sistema nervioso antes del ejercicio",
    color: Colors.dark.accentBlue,
    inhale: 4,
    hold: 4,
    exhale: 4,
    cycles: 6,
    icon: "square",
  },
  {
    id: "wim",
    name: "Respiración Energizante",
    description: "Aumenta energía y concentración pre-entreno",
    color: Colors.dark.accent,
    inhale: 2,
    hold: 0,
    exhale: 2,
    cycles: 10,
    icon: "flash",
  },
  {
    id: "diaphragm",
    name: "Diafragmática",
    description: "Mejora capacidad pulmonar y reduce tensión",
    color: "#B39DDB",
    inhale: 4,
    hold: 2,
    exhale: 6,
    cycles: 8,
    icon: "heart",
  },
];

type Phase = "idle" | "inhale" | "hold" | "exhale" | "done";

export default function BreathingScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const { addMoodEntry } = useApp();

  const [selectedEx, setSelectedEx] = useState(EXERCISES[0]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [cyclesLeft, setCyclesLeft] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [moodLogged, setMoodLogged] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const animatePhase = (p: Phase, ex: typeof EXERCISES[0]) => {
    const dur = p === "inhale" ? ex.inhale : p === "hold" ? ex.hold : ex.exhale;
    if (p === "inhale") {
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.6, duration: dur * 1000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: dur * 1000, useNativeDriver: true }),
      ]).start();
    } else if (p === "exhale") {
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: dur * 1000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.6, duration: dur * 1000, useNativeDriver: true }),
      ]).start();
    }
  };

  const runCycle = (ex: typeof EXERCISES[0], cycles: number) => {
    if (cycles <= 0) {
      setPhase("done");
      scale.setValue(1);
      opacity.setValue(0.6);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    const phases: [Phase, number][] = [
      ["inhale", ex.inhale],
      ...(ex.hold > 0 ? [["hold" as Phase, ex.hold]] : []),
      ["exhale", ex.exhale],
    ];

    let idx = 0;
    setCyclesLeft(cycles);

    const next = () => {
      if (idx >= phases.length) {
        runCycle(ex, cycles - 1);
        return;
      }
      const [p, dur] = phases[idx];
      setPhase(p);
      setSecondsLeft(dur);
      animatePhase(p, ex);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      idx++;

      let s = dur;
      intervalRef.current = setInterval(() => {
        s--;
        setSecondsLeft(s);
        if (s <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          next();
        }
      }, 1000);
    };

    next();
  };

  const start = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    scale.setValue(1);
    opacity.setValue(0.6);
    runCycle(selectedEx, selectedEx.cycles);
  };

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    scale.setValue(1);
    opacity.setValue(0.6);
    setPhase("idle");
  };

  const phaseLabel: Record<Phase, string> = {
    idle: "Listo",
    inhale: "Inhala",
    hold: "Mantén",
    exhale: "Exhala",
    done: "Completado",
  };

  const phaseColor: Record<Phase, string> = {
    idle: C.textSecondary,
    inhale: selectedEx.color,
    hold: Colors.dark.warning,
    exhale: Colors.dark.accentBlue,
    done: Colors.dark.accent,
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 16 }]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { stop(); router.back(); }} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: C.text }]}>Respiración</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Exercise Selector */}
        {phase === "idle" && (
          <View style={styles.exList}>
            {EXERCISES.map((ex) => (
              <TouchableOpacity
                key={ex.id}
                style={[
                  styles.exCard,
                  {
                    backgroundColor:
                      selectedEx.id === ex.id ? ex.color + "22" : C.surface,
                    borderColor: selectedEx.id === ex.id ? ex.color : "transparent",
                    borderWidth: 1,
                  },
                ]}
                onPress={() => setSelectedEx(ex)}
                activeOpacity={0.85}
              >
                <View style={[styles.exIcon, { backgroundColor: ex.color + "22" }]}>
                  <Ionicons name={ex.icon as any} size={22} color={ex.color} />
                </View>
                <View style={styles.exInfo}>
                  <Text style={[styles.exName, { color: C.text }]}>{ex.name}</Text>
                  <Text style={[styles.exDesc, { color: C.textSecondary }]}>{ex.description}</Text>
                  <View style={styles.exPattern}>
                    <Text style={[styles.exPatternText, { color: ex.color }]}>
                      {ex.inhale}-{ex.hold > 0 ? `${ex.hold}-` : ""}{ex.exhale} · {ex.cycles} ciclos
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Breathing Circle */}
        <View style={styles.circleArea}>
          <Animated.View
            style={[
              styles.outerRing,
              {
                borderColor: selectedEx.color + "33",
                transform: [{ scale }],
                opacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.innerRing,
              {
                borderColor: selectedEx.color + "66",
                transform: [{ scale: Animated.multiply(scale, 0.75) }],
              },
            ]}
          />
          <LinearGradient
            colors={[selectedEx.color + "44", selectedEx.color + "22"]}
            style={[styles.circle]}
          >
            <Animated.View style={{ transform: [{ scale }] }}>
              <Text style={[styles.phaseLabel, { color: phaseColor[phase] }]}>
                {phaseLabel[phase]}
              </Text>
              {phase !== "idle" && phase !== "done" && (
                <Text style={[styles.seconds, { color: C.text }]}>{secondsLeft}</Text>
              )}
              {phase === "done" && (
                <Ionicons name="checkmark" size={36} color={Colors.dark.accent} />
              )}
              {phase === "idle" && (
                <Ionicons name={selectedEx.icon as any} size={40} color={selectedEx.color} />
              )}
            </Animated.View>
          </LinearGradient>
        </View>

        {(phase !== "idle" && phase !== "done") && (
          <View style={styles.progressInfo}>
            <Text style={[styles.cyclesText, { color: C.textSecondary }]}>
              Ciclo {selectedEx.cycles - cyclesLeft + 1} de {selectedEx.cycles}
            </Text>
          </View>
        )}

        {phase === "done" && !moodLogged && (
          <View style={[styles.doneCard, { backgroundColor: C.surface }]}>
            <Text style={[styles.doneTitle, { color: C.text }]}>¡Sesión completada!</Text>
            <Text style={[styles.doneSub, { color: C.textSecondary }]}>
              ¿Cómo te sientes ahora?
            </Text>
            <View style={styles.moodRow}>
              {[1, 2, 3, 4, 5].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.moodBtn, { backgroundColor: C.surface2 }]}
                  onPress={async () => {
                    await addMoodEntry({
                      date: new Date().toISOString().split("T")[0],
                      mood: m as 1 | 2 | 3 | 4 | 5,
                      energy: m as 1 | 2 | 3 | 4 | 5,
                      notes: "Post-respiración",
                    });
                    setMoodLogged(true);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }}
                >
                  <Text style={styles.moodEmoji}>
                    {["😟", "😕", "😐", "🙂", "😄"][m - 1]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {moodLogged && (
          <View style={[styles.doneCard, { backgroundColor: C.surface }]}>
            <Ionicons name="checkmark-circle" size={36} color={Colors.dark.accent} />
            <Text style={[styles.doneTitle, { color: C.text }]}>Estado de ánimo guardado</Text>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {phase === "idle" || phase === "done" ? (
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: selectedEx.color }]}
              onPress={start}
              activeOpacity={0.85}
            >
              <Ionicons name="play" size={24} color="#000" />
              <Text style={styles.startBtnText}>
                {phase === "done" ? "Repetir" : "Comenzar"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.stopBtn, { backgroundColor: C.surface }]}
              onPress={stop}
              activeOpacity={0.85}
            >
              <Ionicons name="stop" size={24} color={C.text} />
              <Text style={[styles.stopBtnText, { color: C.text }]}>Detener</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 24 },
  exList: { gap: 10, marginBottom: 24 },
  exCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 14, gap: 14 },
  exIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  exInfo: { flex: 1 },
  exName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  exDesc: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  exPattern: { marginTop: 6 },
  exPatternText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  circleArea: {
    alignItems: "center",
    justifyContent: "center",
    height: 240,
    marginBottom: 16,
    position: "relative",
  },
  outerRing: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
  },
  innerRing: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
  },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  phaseLabel: { fontFamily: "Inter_700Bold", fontSize: 18, textAlign: "center" },
  seconds: { fontFamily: "Inter_700Bold", fontSize: 40, textAlign: "center" },
  progressInfo: { alignItems: "center", marginBottom: 16 },
  cyclesText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  doneCard: { borderRadius: 20, padding: 24, alignItems: "center", gap: 12, marginBottom: 16 },
  doneTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  doneSub: { fontFamily: "Inter_400Regular", fontSize: 14 },
  moodRow: { flexDirection: "row", gap: 8 },
  moodBtn: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  moodEmoji: { fontSize: 28 },
  controls: { alignItems: "center" },
  startBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 48, paddingVertical: 16, borderRadius: 32, gap: 10 },
  startBtnText: { fontFamily: "Inter_700Bold", fontSize: 18, color: "#000" },
  stopBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 48, paddingVertical: 16, borderRadius: 32, gap: 10 },
  stopBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 18 },
});
