import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  useColorScheme,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";

function RingProgress({
  size,
  strokeWidth,
  progress,
  color,
}: {
  size: number;
  strokeWidth: number;
  progress: number;
  color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = Math.min(progress, 1) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.ringBg,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color + "22",
          },
        ]}
      />
      <View
        style={[
          styles.ringFg,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: "transparent",
            borderTopColor: color,
            transform: [{ rotate: `${Math.min(progress, 1) * 360 - 90}deg` }],
          },
        ]}
      />
    </View>
  );
}

function QuickActionCard({
  icon,
  label,
  sublabel,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  color: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={styles.qaWrap}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={[color + "33", color + "11"]}
          style={[styles.qaCard]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.qaIconCircle, { backgroundColor: color + "33" }]}>
            <Ionicons name={icon as any} size={22} color={color} />
          </View>
          <Text style={[styles.qaLabel, { color: "#FFF" }]}>{label}</Text>
          {sublabel && <Text style={[styles.qaSub, { color: color }]}>{sublabel}</Text>}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

function ToolChip({
  icon,
  label,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.toolChip}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      activeOpacity={0.8}
    >
      <View style={[styles.toolChipIcon, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.toolChipLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={14} color="#55556A" />
    </TouchableOpacity>
  );
}

function calculateTDEE(user: ReturnType<typeof useApp>["currentUser"]) {
  if (!user) return 2000;
  const bmr =
    user.gender === "male"
      ? 88.36 + 13.4 * user.weight + 4.8 * user.height - 5.7 * user.age
      : 447.6 + 9.2 * user.weight + 3.1 * user.height - 4.3 * user.age;
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  return Math.round(bmr * (multipliers[user.activityLevel] ?? 1.55));
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;

  const {
    currentUser,
    todaySteps,
    todayCalories,
    todayWater,
    data,
    updateWater,
    settings,
  } = useApp();

  const today = new Date().toISOString().split("T")[0];
  const stepGoal = settings.stepGoal || 10000;
  const calGoal = settings.calorieGoal || calculateTDEE(currentUser);
  const waterGoal = settings.waterGoal || 8;

  const todayWorkout = data.workouts.find((w) => w.date === today);
  const latestWeight = data.weight[data.weight.length - 1];
  const weeklyWorkouts = data.workouts.filter((w) => {
    const d = new Date(w.date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  }).length;

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const stepPct = Math.min(todaySteps / stepGoal, 1);
  const calPct = Math.min(todayCalories / calGoal, 1);
  const waterPct = Math.min(todayWater / waterGoal, 1);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 16, paddingBottom: bottomInset + 80 }]}
      >
        {/* ────── Header ────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: C.textSecondary }]}>{getGreeting()},</Text>
            <Text style={[styles.userName, { color: C.text }]} numberOfLines={1}>
              {currentUser?.name ?? "Atleta"}
            </Text>
          </View>
          <View style={styles.headerBtns}>
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: C.surface }]}
              onPress={() => router.push("/challenges")}
            >
              <Ionicons name="trophy" size={20} color={Colors.dark.warning} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: C.surface }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.navigate("/(tabs)/assistant"); }}
            >
              <Ionicons name="sparkles" size={20} color={Colors.dark.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: C.surface }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/settings"); }}
            >
              <Ionicons name="settings-outline" size={20} color={C.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ────── Hero Card ────── */}
        <LinearGradient
          colors={["#1A1A2E", "#13131A"]}
          style={styles.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Accent glow */}
          <View style={styles.heroGlow} />

          <View style={styles.heroTop}>
            {/* Main step ring */}
            <TouchableOpacity
              style={styles.mainRingWrap}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/steps"); }}
              activeOpacity={0.85}
            >
              <RingProgress size={130} strokeWidth={12} progress={stepPct} color={Colors.dark.accent} />
              <View style={styles.mainRingCenter}>
                <Text style={[styles.mainRingValue, { color: Colors.dark.accent }]}>
                  {todaySteps.toLocaleString()}
                </Text>
                <Text style={[styles.mainRingLabel, { color: C.textSecondary }]}>pasos</Text>
                <Text style={[styles.mainRingPct, { color: C.textTertiary }]}>
                  {Math.round(stepPct * 100)}%
                </Text>
              </View>
            </TouchableOpacity>

            {/* Mini rings */}
            <View style={styles.miniRings}>
              <View style={styles.miniRingRow}>
                <View style={styles.miniRingContainer}>
                  <RingProgress size={60} strokeWidth={7} progress={calPct} color={Colors.dark.accentBlue} />
                  <View style={styles.miniRingCenter}>
                    <Ionicons name="flame" size={12} color={Colors.dark.accentBlue} />
                  </View>
                </View>
                <View style={styles.miniRingInfo}>
                  <Text style={[styles.miniVal, { color: C.text }]}>{todayCalories}</Text>
                  <Text style={[styles.miniLabel, { color: C.textSecondary }]}>/ {calGoal} kcal</Text>
                </View>
              </View>

              <View style={styles.miniRingRow}>
                <View style={styles.miniRingContainer}>
                  <RingProgress size={60} strokeWidth={7} progress={waterPct} color="#4FC3F7" />
                  <View style={styles.miniRingCenter}>
                    <Ionicons name="water" size={12} color="#4FC3F7" />
                  </View>
                </View>
                <View style={styles.miniRingInfo}>
                  <Text style={[styles.miniVal, { color: C.text }]}>{todayWater}</Text>
                  <Text style={[styles.miniLabel, { color: C.textSecondary }]}>/ {waterGoal} vasos</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Hero Footer stats */}
          <View style={[styles.heroFooter, { borderTopColor: C.border }]}>
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatVal, { color: C.text }]}>
                {(todaySteps * 0.000762).toFixed(2)}
              </Text>
              <Text style={[styles.heroStatLbl, { color: C.textSecondary }]}>km</Text>
            </View>
            <View style={[styles.heroStatDiv, { backgroundColor: C.border }]} />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatVal, { color: C.text }]}>
                {Math.round(todaySteps * 0.04)}
              </Text>
              <Text style={[styles.heroStatLbl, { color: C.textSecondary }]}>kcal quemadas</Text>
            </View>
            <View style={[styles.heroStatDiv, { backgroundColor: C.border }]} />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatVal, { color: C.text }]}>
                {weeklyWorkouts}
              </Text>
              <Text style={[styles.heroStatLbl, { color: C.textSecondary }]}>entrenos/semana</Text>
            </View>
            <View style={[styles.heroStatDiv, { backgroundColor: C.border }]} />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatVal, { color: C.text }]}>
                {latestWeight?.value ?? currentUser?.weight ?? "-"}
              </Text>
              <Text style={[styles.heroStatLbl, { color: C.textSecondary }]}>kg</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ────── Quick Actions ────── */}
        <Text style={[styles.sectionTitle, { color: C.text }]}>Acciones Rápidas</Text>
        <View style={styles.qaGrid}>
          <QuickActionCard
            icon="add-circle"
            label="Añadir comida"
            sublabel={`${todayCalories} kcal hoy`}
            color={Colors.dark.accentBlue}
            onPress={() => router.push("/nutrition")}
          />
          <QuickActionCard
            icon="barbell"
            label="Entrenar"
            sublabel={todayWorkout ? "Completado ✓" : "Comenzar sesión"}
            color={Colors.dark.accent}
            onPress={() => router.push("/workout-session")}
          />
          <QuickActionCard
            icon="water"
            label="Agua"
            sublabel={`${todayWater}/${waterGoal} vasos`}
            color="#4FC3F7"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              updateWater(today, todayWater + 1);
            }}
          />
          <QuickActionCard
            icon="scan"
            label="Escanear"
            sublabel="Análisis corporal"
            color="#FF6B9D"
            onPress={() => router.push("/scan")}
          />
        </View>

        {/* ────── Workout Banner ────── */}
        <TouchableOpacity
          onPress={() => router.push("/workout")}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[Colors.dark.accent + "33", Colors.dark.accentBlue + "22"]}
            style={styles.workoutBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.workoutBannerLeft}>
              <Text style={[styles.workoutBannerTitle, { color: C.text }]}>
                {todayWorkout ? todayWorkout.name : "Sin entrenamiento hoy"}
              </Text>
              <Text style={[styles.workoutBannerSub, { color: C.textSecondary }]}>
                {todayWorkout
                  ? `${todayWorkout.exercises.length} ejercicios · ${todayWorkout.durationMinutes} min`
                  : "Toca para crear tu rutina"}
              </Text>
            </View>
            <View style={[styles.workoutBannerIcon, { backgroundColor: todayWorkout ? Colors.dark.accent + "33" : C.surface }]}>
              <Ionicons
                name={todayWorkout ? "checkmark-circle" : "add"}
                size={28}
                color={todayWorkout ? Colors.dark.accent : C.textSecondary}
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ────── Herramientas ────── */}
        <Text style={[styles.sectionTitle, { color: C.text }]}>Herramientas</Text>
        <View style={[styles.toolsList, { backgroundColor: C.surface }]}>
          <ToolChip icon="calculator" label="Calculadora 1RM" color="#FF6B9D" onPress={() => router.push("/calculator")} />
          <View style={[styles.toolDivider, { backgroundColor: C.border }]} />
          <ToolChip icon="flask" label="Guía de Suplementos" color="#B39DDB" onPress={() => router.push("/supplements")} />
          <View style={[styles.toolDivider, { backgroundColor: C.border }]} />
          <ToolChip icon="leaf" label="Respiración y Meditación" color="#4DB6AC" onPress={() => router.push("/breathing")} />
          <View style={[styles.toolDivider, { backgroundColor: C.border }]} />
          <ToolChip icon="trophy" label="Retos Mensuales" color={Colors.dark.warning} onPress={() => router.push("/challenges")} />
          <View style={[styles.toolDivider, { backgroundColor: C.border }]} />
          <ToolChip icon="cut" label="Recomendador de Peinados" color="#FFB74D" onPress={() => router.push("/hairstyle")} />
          <View style={[styles.toolDivider, { backgroundColor: C.border }]} />
          <ToolChip icon="cart" label="Lista de Compra Saludable" color={Colors.dark.accent} onPress={() => router.push("/shopping")} />
          <View style={[styles.toolDivider, { backgroundColor: C.border }]} />
          <ToolChip icon="time" label="Historial de Actividad" color={Colors.dark.accentBlue} onPress={() => router.push("/history")} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  header: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 },
  headerLeft: { flex: 1 },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 14 },
  userName: { fontFamily: "Inter_700Bold", fontSize: 28, letterSpacing: -0.5 },
  headerBtns: { flexDirection: "row", gap: 8 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },

  heroCard: { borderRadius: 24, padding: 20, marginBottom: 24, overflow: "hidden" },
  heroGlow: {
    position: "absolute",
    top: -30,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#00FF8811",
  },
  heroTop: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  mainRingWrap: { position: "relative", alignItems: "center", justifyContent: "center", marginRight: 24 },
  mainRingCenter: { position: "absolute", alignItems: "center" },
  mainRingValue: { fontFamily: "Inter_700Bold", fontSize: 20, letterSpacing: -0.5 },
  mainRingLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  mainRingPct: { fontFamily: "Inter_500Medium", fontSize: 10 },

  miniRings: { flex: 1, gap: 16 },
  miniRingRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  miniRingContainer: { position: "relative", alignItems: "center", justifyContent: "center" },
  miniRingCenter: { position: "absolute" },
  miniVal: { fontFamily: "Inter_700Bold", fontSize: 16 },
  miniLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  miniRingInfo: {},

  heroFooter: { flexDirection: "row", justifyContent: "space-around", paddingTop: 16, borderTopWidth: 1 },
  heroStatItem: { alignItems: "center", flex: 1 },
  heroStatVal: { fontFamily: "Inter_700Bold", fontSize: 16 },
  heroStatLbl: { fontFamily: "Inter_400Regular", fontSize: 10, textAlign: "center" },
  heroStatDiv: { width: 1 },

  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 12, letterSpacing: -0.3 },

  qaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  qaWrap: { width: "48%" },
  qaCard: { borderRadius: 18, padding: 16, gap: 8, minHeight: 90 },
  qaIconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  qaLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  qaSub: { fontFamily: "Inter_400Regular", fontSize: 11 },

  workoutBanner: { borderRadius: 18, padding: 18, flexDirection: "row", alignItems: "center", marginBottom: 28, justifyContent: "space-between" },
  workoutBannerLeft: { flex: 1 },
  workoutBannerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  workoutBannerSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 3 },
  workoutBannerIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", marginLeft: 12 },

  toolsList: { borderRadius: 20, overflow: "hidden", marginBottom: 24 },
  toolChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  toolChipIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  toolChipLabel: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15, color: "#FFFFFF" },
  toolDivider: { height: 1, marginLeft: 64 },

  ringBg: { position: "absolute" },
  ringFg: { position: "absolute" },
});
