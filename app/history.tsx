import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Rect } from "react-native-svg";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";

type FilterType = "all" | "workouts" | "nutrition" | "steps" | "scans" | "mood";

const FILTERS: { key: FilterType; label: string; icon: string; color: string }[] = [
  { key: "all", label: "Todo", icon: "layers", color: Colors.dark.accent },
  { key: "workouts", label: "Entrenos", icon: "barbell", color: "#FF6B9D" },
  { key: "nutrition", label: "Nutrición", icon: "nutrition", color: Colors.dark.accentBlue },
  { key: "steps", label: "Pasos", icon: "walk", color: Colors.dark.accent },
  { key: "scans", label: "Escaneos", icon: "scan", color: "#B39DDB" },
  { key: "mood", label: "Ánimo", icon: "happy", color: Colors.dark.warning },
];

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const { data } = useApp();

  const [filter, setFilter] = useState<FilterType>("all");

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const events = useMemo(() => {
    const all: { date: string; type: FilterType; title: string; subtitle: string; color: string; icon: string }[] = [];

    if (filter === "all" || filter === "workouts") {
      data.workouts.forEach((w) => {
        all.push({
          date: w.date,
          type: "workouts",
          title: w.name,
          subtitle: `${w.exercises.length} ejercicios · ${w.durationMinutes} min`,
          color: "#FF6B9D",
          icon: "barbell",
        });
      });
    }

    if (filter === "all" || filter === "nutrition") {
      const grouped: Record<string, number> = {};
      data.foodEntries.forEach((e) => {
        grouped[e.date] = (grouped[e.date] || 0) + e.calories;
      });
      Object.entries(grouped).forEach(([date, cal]) => {
        all.push({
          date,
          type: "nutrition",
          title: "Diario de Nutrición",
          subtitle: `${cal} kcal registradas`,
          color: Colors.dark.accentBlue,
          icon: "nutrition",
        });
      });
    }

    if (filter === "all" || filter === "steps") {
      data.stepRecords.forEach((r) => {
        all.push({
          date: r.date,
          type: "steps",
          title: "Registro de Pasos",
          subtitle: `${r.steps.toLocaleString()} pasos · ${r.distanceKm.toFixed(1)} km`,
          color: Colors.dark.accent,
          icon: "walk",
        });
      });
    }

    if (filter === "all" || filter === "scans") {
      data.bodyScans.forEach((s) => {
        all.push({
          date: s.date,
          type: "scans",
          title: "Escaneo Corporal",
          subtitle: `IMC: ${s.bmi} · Grasa: ${s.bodyFat}%`,
          color: "#B39DDB",
          icon: "body",
        });
      });
      data.facialScans.forEach((s) => {
        all.push({
          date: s.date,
          type: "scans",
          title: "Análisis Facial",
          subtitle: `Puntuación: ${s.overallScore}/10 · ${s.faceShape}`,
          color: "#B39DDB",
          icon: "scan-circle",
        });
      });
    }

    if (filter === "all" || filter === "mood") {
      data.moodEntries.forEach((m) => {
        const moods = ["Muy mal", "Mal", "Regular", "Bien", "Excelente"];
        all.push({
          date: m.date,
          type: "mood",
          title: `Ánimo: ${moods[m.mood - 1]}`,
          subtitle: `Energía: ${m.energy}/5${m.notes ? ` · ${m.notes}` : ""}`,
          color: Colors.dark.warning,
          icon: "happy",
        });
      });
    }

    return all.sort((a, b) => b.date.localeCompare(a.date));
  }, [data, filter]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, typeof events> = {};
    events.forEach((e) => {
      if (!groups[e.date]) groups[e.date] = [];
      groups[e.date].push(e);
    });
    return groups;
  }, [events]);

  const dates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const weekStats = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const eventsOnDay = events.filter((e) => e.date === dateStr);
      days.push({ date: dateStr, count: eventsOnDay.length });
    }
    return days;
  }, [events]);

  const maxCount = Math.max(...weekStats.map((d) => d.count), 1);
  const barW = 26, barH = 52, barGap = 8;
  const chartW = weekStats.length * (barW + barGap) - barGap;
  const dayLabels = ["D", "L", "M", "X", "J", "V", "S"];

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 16 }]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: C.text }]}>Historial</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* 7-Day Activity Chart */}
        <View style={[styles.weekCard, { backgroundColor: C.surface }]}>
          <Text style={[styles.weekCardTitle, { color: C.text }]}>Actividad — Últimos 7 días</Text>
          <View style={styles.weekChartRow}>
            <Svg width={chartW} height={barH}>
              {weekStats.map((day, i) => {
                const h = Math.max(4, (day.count / maxCount) * barH);
                const x = i * (barW + barGap);
                const today = new Date().toISOString().split("T")[0];
                const isToday = day.date === today;
                return (
                  <Rect
                    key={day.date}
                    x={x}
                    y={barH - h}
                    width={barW}
                    height={h}
                    rx={6}
                    fill={isToday ? Colors.dark.accent : Colors.dark.accent + "55"}
                  />
                );
              })}
            </Svg>
          </View>
          <View style={[styles.weekLabelsRow, { width: chartW }]}>
            {weekStats.map((day, i) => {
              const d = new Date(day.date + "T12:00:00");
              const label = dayLabels[d.getDay()];
              const today = new Date().toISOString().split("T")[0];
              return (
                <Text
                  key={day.date}
                  style={[styles.weekDayLabel, {
                    color: day.date === today ? Colors.dark.accent : C.textSecondary,
                    width: barW,
                    marginRight: i < weekStats.length - 1 ? barGap : 0,
                  }]}
                >
                  {label}
                </Text>
              );
            })}
          </View>
          <View style={styles.weekSummaryRow}>
            <View style={styles.weekStat}>
              <Text style={[styles.weekStatVal, { color: "#FF6B9D" }]}>{data.workouts.filter(w => { const d = new Date(); d.setDate(d.getDate() - 7); return new Date(w.date) >= d; }).length}</Text>
              <Text style={[styles.weekStatLabel, { color: C.textSecondary }]}>Entrenos</Text>
            </View>
            <View style={[styles.weekStatDivider, { backgroundColor: C.border }]} />
            <View style={styles.weekStat}>
              <Text style={[styles.weekStatVal, { color: Colors.dark.accent }]}>{data.stepRecords.filter(r => { const d = new Date(); d.setDate(d.getDate() - 7); return new Date(r.date) >= d; }).reduce((s, r) => s + r.steps, 0).toLocaleString()}</Text>
              <Text style={[styles.weekStatLabel, { color: C.textSecondary }]}>Pasos</Text>
            </View>
            <View style={[styles.weekStatDivider, { backgroundColor: C.border }]} />
            <View style={styles.weekStat}>
              <Text style={[styles.weekStatVal, { color: Colors.dark.accentBlue }]}>{data.foodEntries.filter(e => { const d = new Date(); d.setDate(d.getDate() - 7); return new Date(e.date) >= d; }).reduce((s, e) => s + e.calories, 0).toLocaleString()}</Text>
              <Text style={[styles.weekStatLabel, { color: C.textSecondary }]}>kcal</Text>
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterTag,
                { backgroundColor: filter === f.key ? f.color + "22" : C.surface, borderColor: filter === f.key ? f.color : "transparent", borderWidth: 1 },
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Ionicons name={f.icon as any} size={14} color={filter === f.key ? f.color : C.textSecondary} />
              <Text style={[styles.filterText, { color: filter === f.key ? f.color : C.textSecondary }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {dates.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: C.surface }]}>
            <Ionicons name="time-outline" size={48} color={C.textTertiary} />
            <Text style={[styles.emptyText, { color: C.textSecondary }]}>
              No hay registros aún. Empieza a usar la app para ver tu historial aquí.
            </Text>
          </View>
        ) : (
          dates.map((date) => (
            <View key={date} style={styles.dateGroup}>
              <View style={styles.dateLabelRow}>
                <View style={[styles.dateDot, { backgroundColor: Colors.dark.accent }]} />
                <Text style={[styles.dateLabel, { color: C.text }]}>
                  {formatDate(date)}
                </Text>
              </View>
              <View style={styles.timelineGroup}>
                <View style={[styles.timelineLine, { backgroundColor: C.border }]} />
                <View style={styles.timelineEvents}>
                  {groupedByDate[date].map((event, i) => (
                    <View key={i} style={[styles.eventCard, { backgroundColor: C.surface }]}>
                      <View style={[styles.eventIconWrap, { backgroundColor: event.color + "22" }]}>
                        <Ionicons name={event.icon as any} size={18} color={event.color} />
                      </View>
                      <View style={styles.eventContent}>
                        <Text style={[styles.eventTitle, { color: C.text }]}>{event.title}</Text>
                        <Text style={[styles.eventSub, { color: C.textSecondary }]}>{event.subtitle}</Text>
                      </View>
                      <View style={[styles.eventBadge, { backgroundColor: event.color + "22" }]}>
                        <View style={[styles.eventDot, { backgroundColor: event.color }]} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function formatDate(date: string) {
  const d = new Date(date + "T12:00:00");
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date === today.toISOString().split("T")[0]) return "Hoy";
  if (date === yesterday.toISOString().split("T")[0]) return "Ayer";

  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 24 },
  weekCard: { borderRadius: 20, padding: 18, marginBottom: 20, gap: 0 },
  weekCardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 14 },
  weekChartRow: { alignItems: "flex-end" },
  weekLabelsRow: { flexDirection: "row", marginTop: 6, marginBottom: 14 },
  weekDayLabel: { fontFamily: "Inter_500Medium", fontSize: 11, textAlign: "center" },
  weekSummaryRow: { flexDirection: "row", alignItems: "center", gap: 0 },
  weekStat: { flex: 1, alignItems: "center" },
  weekStatVal: { fontFamily: "Inter_700Bold", fontSize: 18 },
  weekStatLabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  weekStatDivider: { width: 1, height: 32 },
  filtersRow: { marginBottom: 20 },
  filterTag: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, gap: 6 },
  filterText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  empty: { borderRadius: 20, padding: 32, alignItems: "center", gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 },
  dateGroup: { marginBottom: 24 },
  dateLabelRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  dateDot: { width: 10, height: 10, borderRadius: 5 },
  dateLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  timelineGroup: { flexDirection: "row", gap: 12 },
  timelineLine: { width: 2, marginLeft: 4, borderRadius: 1 },
  timelineEvents: { flex: 1, gap: 8 },
  eventCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 14, gap: 12 },
  eventIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  eventContent: { flex: 1 },
  eventTitle: { fontFamily: "Inter_500Medium", fontSize: 14 },
  eventSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  eventBadge: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  eventDot: { width: 8, height: 8, borderRadius: 4 },
});
