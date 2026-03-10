import React from "react";
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";

const BADGE_ICONS: Record<string, { name: string; iconSet: "ion" | "mci" }> = {
  walking: { name: "walk", iconSet: "ion" },
  fitness: { name: "barbell", iconSet: "ion" },
  water: { name: "water", iconSet: "ion" },
};

export default function ChallengesScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const { data } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const active = data.challenges.filter((c) => !c.completed);
  const completed = data.challenges.filter((c) => c.completed);

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
          <Text style={[styles.title, { color: C.text }]}>Retos del Mes</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Stats */}
        <LinearGradient
          colors={[Colors.dark.warning + "33", Colors.dark.accent + "22"]}
          style={styles.statsCard}
        >
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: Colors.dark.warning }]}>
                {active.length}
              </Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>Activos</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: C.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: Colors.dark.accent }]}>
                {completed.length}
              </Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>Completados</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: C.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: "#FF6B9D" }]}>
                {data.challenges.length}
              </Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>Total</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Active Challenges */}
        <Text style={[styles.sectionTitle, { color: C.text }]}>En Progreso</Text>
        {active.map((ch) => {
          const pct = Math.min(ch.current / ch.target, 1);
          const badge = BADGE_ICONS[ch.badge] ?? BADGE_ICONS.fitness;
          const daysLeft = Math.max(
            0,
            Math.ceil(
              (new Date(ch.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
          );

          return (
            <View key={ch.id} style={[styles.challengeCard, { backgroundColor: C.surface }]}>
              <View style={styles.challengeTop}>
                <View style={[styles.badgeIcon, { backgroundColor: Colors.dark.warning + "22" }]}>
                  <Ionicons name={badge.name as any} size={24} color={Colors.dark.warning} />
                </View>
                <View style={styles.challengeInfo}>
                  <Text style={[styles.challengeTitle, { color: C.text }]}>{ch.title}</Text>
                  <Text style={[styles.challengeDesc, { color: C.textSecondary }]}>
                    {ch.description}
                  </Text>
                </View>
                <View style={[styles.daysLeft, { backgroundColor: C.surface2 }]}>
                  <Text style={[styles.daysLeftNum, { color: Colors.dark.warning }]}>
                    {daysLeft}
                  </Text>
                  <Text style={[styles.daysLeftLabel, { color: C.textSecondary }]}>días</Text>
                </View>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressText, { color: C.textSecondary }]}>
                    {ch.current} / {ch.target} {ch.unit}
                  </Text>
                  <Text style={[styles.progressPct, { color: Colors.dark.warning }]}>
                    {Math.round(pct * 100)}%
                  </Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: C.surface2 }]}>
                  <LinearGradient
                    colors={[Colors.dark.warning, Colors.dark.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${pct * 100}%` }]}
                  />
                </View>
              </View>
            </View>
          );
        })}

        {active.length === 0 && (
          <View style={[styles.empty, { backgroundColor: C.surface }]}>
            <Ionicons name="trophy-outline" size={40} color={C.textTertiary} />
            <Text style={[styles.emptyText, { color: C.textSecondary }]}>
              No hay retos activos
            </Text>
          </View>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Completados</Text>
            {completed.map((ch) => {
              const badge = BADGE_ICONS[ch.badge] ?? BADGE_ICONS.fitness;
              return (
                <View key={ch.id} style={[styles.completedCard, { backgroundColor: C.surface }]}>
                  <LinearGradient
                    colors={[Colors.dark.accent + "22", "transparent"]}
                    style={styles.completedGrad}
                  >
                    <View style={[styles.badgeIcon, { backgroundColor: Colors.dark.accent + "22" }]}>
                      <Ionicons name={badge.name as any} size={24} color={Colors.dark.accent} />
                    </View>
                    <View style={styles.challengeInfo}>
                      <Text style={[styles.challengeTitle, { color: C.text }]}>{ch.title}</Text>
                      <Text style={[styles.challengeDesc, { color: C.textSecondary }]}>
                        {ch.target} {ch.unit} completados
                      </Text>
                    </View>
                    <View style={[styles.trophyBadge, { backgroundColor: Colors.dark.accent + "22" }]}>
                      <Ionicons name="trophy" size={20} color={Colors.dark.accent} />
                    </View>
                  </LinearGradient>
                </View>
              );
            })}
          </>
        )}

        {/* Tip */}
        <View style={[styles.tipCard, { backgroundColor: C.surface }]}>
          <Ionicons name="bulb" size={20} color={Colors.dark.warning} />
          <Text style={[styles.tipText, { color: C.textSecondary }]}>
            Los retos se actualizan automáticamente con tu actividad. Completa entrenamientos, camina y mantén la hidratación para avanzar.
          </Text>
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
  statsCard: { borderRadius: 20, padding: 20, marginBottom: 24 },
  statsRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  statItem: { alignItems: "center" },
  statNum: { fontFamily: "Inter_700Bold", fontSize: 36 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 13 },
  statDivider: { width: 1, height: 40 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, marginBottom: 12 },
  challengeCard: { borderRadius: 20, padding: 16, marginBottom: 12 },
  challengeTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  badgeIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  challengeInfo: { flex: 1 },
  challengeTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  challengeDesc: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  daysLeft: { alignItems: "center", borderRadius: 10, padding: 8 },
  daysLeftNum: { fontFamily: "Inter_700Bold", fontSize: 20 },
  daysLeftLabel: { fontFamily: "Inter_400Regular", fontSize: 10 },
  progressSection: { gap: 6 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between" },
  progressText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  progressPct: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4 },
  empty: { borderRadius: 20, padding: 32, alignItems: "center", gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
  completedCard: { borderRadius: 20, overflow: "hidden", marginBottom: 10 },
  completedGrad: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  trophyBadge: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  tipCard: { flexDirection: "row", borderRadius: 14, padding: 14, gap: 10, alignItems: "flex-start", marginTop: 8 },
  tipText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, lineHeight: 20 },
});
