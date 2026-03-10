import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";

const STEP_LENGTH_M = 0.762;
const CAL_PER_STEP = 0.04;

function haversineMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function StepsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const { todaySteps, updateSteps, data, settings } = useApp();

  const [tracking, setTracking] = useState(false);
  const [sessionSteps, setSessionSteps] = useState(0);
  const [sessionMeters, setSessionMeters] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const webWatchId = useRef<number | null>(null);
  const lastCoords = useRef<{ lat: number; lon: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStepsRef = useRef(0);
  const sessionMetersRef = useRef(0);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const stepGoal = settings.stepGoal ?? 10000;

  const totalSteps = todaySteps + sessionSteps;
  const totalMeters = sessionMeters;
  const totalCalories = Math.round(totalSteps * CAL_PER_STEP);
  const pct = Math.min(totalSteps / stepGoal, 1);
  const speed =
    elapsedSeconds > 0 ? (sessionMeters / 1000) / (elapsedSeconds / 3600) : 0;

  const stopTracking = useCallback(async () => {
    if (locationSub.current) {
      locationSub.current.remove();
      locationSub.current = null;
    }
    if (webWatchId.current !== null) {
      navigator.geolocation.clearWatch(webWatchId.current);
      webWatchId.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTracking(false);
    lastCoords.current = null;

    const captured = sessionStepsRef.current;
    if (captured > 0) {
      await updateSteps(todaySteps + captured);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSessionSteps(0);
      setSessionMeters(0);
      setElapsedSeconds(0);
      sessionStepsRef.current = 0;
      sessionMetersRef.current = 0;
    }
  }, [todaySteps, updateSteps]);

  const startTracking = useCallback(async () => {
    setSessionSteps(0);
    setSessionMeters(0);
    setElapsedSeconds(0);
    sessionStepsRef.current = 0;
    sessionMetersRef.current = 0;
    lastCoords.current = null;

    if (Platform.OS === "web") {
      if (!navigator.geolocation) {
        Alert.alert("No disponible", "Tu navegador no soporta geolocalización.");
        return;
      }
      setTracking(true);
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
      webWatchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude: lat, longitude: lon } = pos.coords;
          if (lastCoords.current) {
            const dist = haversineMeters(lastCoords.current.lat, lastCoords.current.lon, lat, lon);
            if (dist > 1) {
              const newSteps = Math.round(dist / STEP_LENGTH_M);
              sessionStepsRef.current += newSteps;
              sessionMetersRef.current += dist;
              setSessionSteps(sessionStepsRef.current);
              setSessionMeters(sessionMetersRef.current);
            }
          }
          lastCoords.current = { lat, lon };
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      );
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso requerido",
        "Necesitamos acceso a tu ubicación para contar pasos por GPS.",
        [{ text: "Entendido" }]
      );
      return;
    }

    setTracking(true);
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);

    locationSub.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 1,
        timeInterval: 1000,
      },
      (location) => {
        const { latitude: lat, longitude: lon } = location.coords;
        if (lastCoords.current) {
          const dist = haversineMeters(lastCoords.current.lat, lastCoords.current.lon, lat, lon);
          if (dist > 1) {
            const newSteps = Math.round(dist / STEP_LENGTH_M);
            sessionStepsRef.current += newSteps;
            sessionMetersRef.current += dist;
            setSessionSteps(sessionStepsRef.current);
            setSessionMeters(sessionMetersRef.current);
          }
        }
        lastCoords.current = { lat, lon };
      }
    );
  }, []);

  useEffect(() => {
    return () => {
      if (locationSub.current) locationSub.current.remove();
      if (webWatchId.current !== null && Platform.OS === "web") {
        navigator.geolocation.clearWatch(webWatchId.current);
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const recent7 = [...data.stepRecords]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  const arcRadius = 80;
  const arcCircumference = 2 * Math.PI * arcRadius;
  const arcOffset = arcCircumference * (1 - pct);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 8, paddingBottom: insets.bottom + 80 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: C.surface }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: C.text }]}>Contador de Pasos</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Main ring card */}
        <LinearGradient
          colors={["#1A1A2E", "#13131A"]}
          style={styles.ringCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.ringWrap}>
            <View style={styles.svgContainer}>
              {/* SVG ring (web & native) */}
              {Platform.OS === "web" ? (
                <svg width={200} height={200} viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r={arcRadius} fill="none" stroke="#1E1E2E" strokeWidth="14" />
                  <circle
                    cx="100" cy="100" r={arcRadius} fill="none"
                    stroke={Colors.dark.accent} strokeWidth="14"
                    strokeDasharray={arcCircumference}
                    strokeDashoffset={arcOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 100 100)"
                  />
                </svg>
              ) : (
                (() => {
                  try {
                    const Svg = require("react-native-svg").Svg;
                    const Circle = require("react-native-svg").Circle;
                    return (
                      <Svg width={200} height={200} viewBox="0 0 200 200">
                        <Circle cx="100" cy="100" r={arcRadius} fill="none" stroke="#1E1E2E" strokeWidth={14} />
                        <Circle
                          cx="100" cy="100" r={arcRadius} fill="none"
                          stroke={Colors.dark.accent} strokeWidth={14}
                          strokeDasharray={arcCircumference}
                          strokeDashoffset={arcOffset}
                          strokeLinecap="round"
                          rotation="-90"
                          origin="100, 100"
                        />
                      </Svg>
                    );
                  } catch {
                    return null;
                  }
                })()
              )}
              <View style={styles.ringCenter}>
                <Text style={[styles.stepsValue, { color: Colors.dark.accent }]}>
                  {totalSteps.toLocaleString()}
                </Text>
                <Text style={[styles.stepsLabel, { color: C.textSecondary }]}>pasos hoy</Text>
                <Text style={[styles.stepsGoal, { color: C.textTertiary }]}>
                  meta: {stepGoal.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: Colors.dark.accentBlue }]}>
                {(totalMeters / 1000).toFixed(2)}
              </Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>km</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: C.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: "#FF6B9D" }]}>
                {totalCalories}
              </Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>kcal</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: C.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: Colors.dark.accentPurple ?? "#7C3AED" }]}>
                {formatTime(elapsedSeconds)}
              </Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>tiempo</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: C.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: Colors.dark.warning ?? "#F59E0B" }]}>
                {speed.toFixed(1)}
              </Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>km/h</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Start / Stop button */}
        <TouchableOpacity
          style={[
            styles.mainBtn,
            { backgroundColor: tracking ? "#EF5350" : Colors.dark.accent },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            tracking ? stopTracking() : startTracking();
          }}
          activeOpacity={0.85}
        >
          <Ionicons
            name={tracking ? "stop-circle" : "walk"}
            size={26}
            color="#000"
          />
          <Text style={styles.mainBtnText}>
            {tracking ? "Detener" : "Iniciar Seguimiento GPS"}
          </Text>
        </TouchableOpacity>

        {tracking && (
          <View style={[styles.liveIndicator, { backgroundColor: C.surface }]}>
            <View style={styles.liveDot} />
            <Text style={[styles.liveText, { color: Colors.dark.accent }]}>GPS activo — rastreando posición</Text>
          </View>
        )}

        {/* Session mini stats */}
        {sessionSteps > 0 && (
          <View style={[styles.sessionCard, { backgroundColor: C.surface }]}>
            <Text style={[styles.sessionTitle, { color: C.text }]}>Sesión actual</Text>
            <View style={styles.sessionRow}>
              <View style={styles.sessionStat}>
                <Text style={[styles.sessionVal, { color: Colors.dark.accent }]}>{sessionSteps.toLocaleString()}</Text>
                <Text style={[styles.sessionStatLabel, { color: C.textSecondary }]}>pasos</Text>
              </View>
              <View style={styles.sessionStat}>
                <Text style={[styles.sessionVal, { color: Colors.dark.accentBlue }]}>{(sessionMeters / 1000).toFixed(3)} km</Text>
                <Text style={[styles.sessionStatLabel, { color: C.textSecondary }]}>distancia</Text>
              </View>
              <View style={styles.sessionStat}>
                <Text style={[styles.sessionVal, { color: "#FF6B9D" }]}>{Math.round(sessionSteps * CAL_PER_STEP)}</Text>
                <Text style={[styles.sessionStatLabel, { color: C.textSecondary }]}>kcal</Text>
              </View>
            </View>
          </View>
        )}

        {/* History */}
        <Text style={[styles.sectionTitle, { color: C.text }]}>Historial (7 días)</Text>
        {recent7.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: C.surface }]}>
            <Ionicons name="footsteps-outline" size={36} color={C.textTertiary} />
            <Text style={[styles.emptyText, { color: C.textSecondary }]}>
              Inicia tu primera sesión de pasos
            </Text>
          </View>
        ) : (
          recent7.map((r) => {
            const p = Math.min(r.steps / stepGoal, 1);
            return (
              <View key={r.date} style={[styles.historyRow, { backgroundColor: C.surface }]}>
                <View style={styles.historyLeft}>
                  <View style={[styles.historyIconWrap, { backgroundColor: Colors.dark.accent + "22" }]}>
                    <Ionicons name="walk" size={18} color={Colors.dark.accent} />
                  </View>
                  <View>
                    <Text style={[styles.historyDate, { color: C.text }]}>{r.date}</Text>
                    <Text style={[styles.historyMeta, { color: C.textSecondary }]}>
                      {(r.distanceKm).toFixed(2)} km · {Math.round(r.caloriesBurned)} kcal
                    </Text>
                  </View>
                </View>
                <View style={styles.historyRight}>
                  <Text style={[styles.historySteps, { color: Colors.dark.accent }]}>
                    {r.steps.toLocaleString()}
                  </Text>
                  <View style={[styles.historyBar, { backgroundColor: C.border }]}>
                    <View style={[styles.historyBarFill, { width: `${Math.round(p * 100)}%` as any, backgroundColor: Colors.dark.accent }]} />
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 22 },
  ringCard: { borderRadius: 24, padding: 24, marginBottom: 20, alignItems: "center" },
  ringWrap: { alignItems: "center", marginBottom: 20 },
  svgContainer: { width: 200, height: 200, alignItems: "center", justifyContent: "center" },
  ringCenter: { position: "absolute", alignItems: "center" },
  stepsValue: { fontFamily: "Inter_700Bold", fontSize: 34 },
  stepsLabel: { fontFamily: "Inter_400Regular", fontSize: 13 },
  stepsGoal: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  statsRow: { flexDirection: "row", width: "100%", alignItems: "center" },
  statItem: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, height: 30 },
  statVal: { fontFamily: "Inter_700Bold", fontSize: 16 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  mainBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, borderRadius: 18, paddingVertical: 16, marginBottom: 14,
  },
  mainBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#000" },
  liveIndicator: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 16,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.dark.accent },
  liveText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  sessionCard: { borderRadius: 16, padding: 16, marginBottom: 20 },
  sessionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 12 },
  sessionRow: { flexDirection: "row", justifyContent: "space-around" },
  sessionStat: { alignItems: "center" },
  sessionVal: { fontFamily: "Inter_700Bold", fontSize: 18 },
  sessionStatLabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 14 },
  emptyCard: { borderRadius: 16, padding: 32, alignItems: "center", gap: 10, marginBottom: 20 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
  historyRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 16, padding: 14, marginBottom: 10,
  },
  historyLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  historyIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  historyDate: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  historyMeta: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  historyRight: { alignItems: "flex-end", gap: 4 },
  historySteps: { fontFamily: "Inter_700Bold", fontSize: 16 },
  historyBar: { width: 80, height: 4, borderRadius: 2 },
  historyBarFill: { height: 4, borderRadius: 2, minWidth: 4 },
});
