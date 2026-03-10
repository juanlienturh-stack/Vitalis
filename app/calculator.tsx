import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

const EXERCISES = [
  { name: "Press de Banca", icon: "barbell" },
  { name: "Sentadilla", icon: "fitness" },
  { name: "Peso Muerto", icon: "body" },
  { name: "Press Militar", icon: "person" },
  { name: "Dominadas", icon: "walk" },
];

const FORMULAS = [
  { name: "Epley", formula: (w: number, r: number) => w * (1 + r / 30) },
  { name: "Brzycki", formula: (w: number, r: number) => w * (36 / (37 - r)) },
  { name: "Lombardi", formula: (w: number, r: number) => w * Math.pow(r, 0.1) },
  { name: "O'Conner", formula: (w: number, r: number) => w * (1 + r / 40) },
];

export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;

  const [selectedEx, setSelectedEx] = useState(EXERCISES[0].name);
  const [weight, setWeight] = useState("100");
  const [reps, setReps] = useState("5");

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const results = useMemo(() => {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps) || 1;
    if (w <= 0 || r <= 0) return null;

    const oneRM = FORMULAS.reduce((sum, f) => sum + f.formula(w, r), 0) / FORMULAS.length;

    return {
      oneRM: Math.round(oneRM),
      percentages: [100, 95, 90, 85, 80, 75, 70, 65, 60].map((pct) => ({
        pct,
        weight: Math.round(oneRM * (pct / 100)),
        reps: pct === 100 ? 1 : pct >= 95 ? 2 : pct >= 90 ? 3 : pct >= 85 ? 4 : pct >= 80 ? 6 : pct >= 75 ? 8 : pct >= 70 ? 10 : pct >= 65 ? 12 : 15,
      })),
    };
  }, [weight, reps]);

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
          <Text style={[styles.title, { color: C.text }]}>Calculadora 1RM</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={[styles.subtitle, { color: C.textSecondary }]}>
          Estima tu máximo de una repetición basado en el peso y las reps que realizas
        </Text>

        {/* Exercise Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exScroll}>
          {EXERCISES.map((ex) => (
            <TouchableOpacity
              key={ex.name}
              style={[
                styles.exTag,
                {
                  backgroundColor:
                    selectedEx === ex.name ? Colors.dark.accent : C.surface,
                  borderWidth: selectedEx === ex.name ? 0 : 0,
                },
              ]}
              onPress={() => setSelectedEx(ex.name)}
            >
              <Ionicons
                name={ex.icon as any}
                size={16}
                color={selectedEx === ex.name ? "#000" : C.textSecondary}
              />
              <Text
                style={[
                  styles.exTagText,
                  { color: selectedEx === ex.name ? "#000" : C.textSecondary },
                ]}
              >
                {ex.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input Cards */}
        <View style={styles.inputs}>
          <View style={[styles.inputCard, { backgroundColor: C.surface }]}>
            <Text style={[styles.inputCardLabel, { color: C.textSecondary }]}>Peso levantado</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.inputNum, { color: Colors.dark.accent }]}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={C.textTertiary}
              />
              <Text style={[styles.inputUnit, { color: C.textSecondary }]}>kg</Text>
            </View>
          </View>
          <View style={[styles.inputCard, { backgroundColor: C.surface }]}>
            <Text style={[styles.inputCardLabel, { color: C.textSecondary }]}>Repeticiones</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.inputNum, { color: Colors.dark.accentBlue }]}
                value={reps}
                onChangeText={setReps}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={C.textTertiary}
              />
              <Text style={[styles.inputUnit, { color: C.textSecondary }]}>reps</Text>
            </View>
          </View>
        </View>

        {/* Result */}
        {results && (
          <>
            <LinearGradient
              colors={[Colors.dark.accent + "33", Colors.dark.accentBlue + "33"]}
              style={styles.resultHero}
            >
              <Text style={[styles.resultLabel, { color: C.textSecondary }]}>{selectedEx}</Text>
              <Text style={[styles.result1RM, { color: C.text }]}>{results.oneRM} kg</Text>
              <Text style={[styles.resultSub, { color: Colors.dark.accent }]}>1 Repetición Máxima estimada</Text>
            </LinearGradient>

            {/* Percentage Table */}
            <View style={[styles.table, { backgroundColor: C.surface }]}>
              <View style={[styles.tableHeader, { borderBottomColor: C.border }]}>
                <Text style={[styles.tableHeaderText, { color: C.textSecondary }]}>%</Text>
                <Text style={[styles.tableHeaderText, { color: C.textSecondary }]}>Peso</Text>
                <Text style={[styles.tableHeaderText, { color: C.textSecondary }]}>Reps aprox.</Text>
                <Text style={[styles.tableHeaderText, { color: C.textSecondary }]}>Objetivo</Text>
              </View>
              {results.percentages.map((row) => (
                <View
                  key={row.pct}
                  style={[
                    styles.tableRow,
                    { borderBottomColor: C.border },
                  ]}
                >
                  <Text style={[styles.tableCell, { color: Colors.dark.accent }]}>
                    {row.pct}%
                  </Text>
                  <Text style={[styles.tableCell, { color: C.text }]}>
                    {row.weight} kg
                  </Text>
                  <Text style={[styles.tableCell, { color: C.textSecondary }]}>
                    {row.reps}
                  </Text>
                  <Text style={[styles.tableCell, { color: C.textTertiary, fontSize: 11 }]}>
                    {row.pct >= 90 ? "Fuerza máx." :
                      row.pct >= 80 ? "Fuerza" :
                      row.pct >= 70 ? "Hipertrofia" : "Resistencia"}
                  </Text>
                </View>
              ))}
            </View>

            {/* Info */}
            <View style={[styles.infoCard, { backgroundColor: C.surface }]}>
              <Ionicons name="information-circle" size={20} color={Colors.dark.accentBlue} />
              <Text style={[styles.infoText, { color: C.textSecondary }]}>
                El 1RM es una estimación. Factores como el descanso, nutrición y técnica influyen en el resultado real. Usa el 90% o menos para entrenar de forma segura.
              </Text>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 24 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, marginBottom: 20 },
  exScroll: { marginBottom: 20 },
  exTag: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, marginRight: 8, gap: 6 },
  exTagText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  inputs: { flexDirection: "row", gap: 12, marginBottom: 20 },
  inputCard: { flex: 1, borderRadius: 20, padding: 20 },
  inputCardLabel: { fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 8 },
  inputRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  inputNum: { fontFamily: "Inter_700Bold", fontSize: 36, flex: 1 },
  inputUnit: { fontFamily: "Inter_500Medium", fontSize: 16 },
  resultHero: { borderRadius: 24, padding: 28, alignItems: "center", marginBottom: 20, gap: 8 },
  resultLabel: { fontFamily: "Inter_500Medium", fontSize: 14 },
  result1RM: { fontFamily: "Inter_700Bold", fontSize: 56 },
  resultSub: { fontFamily: "Inter_500Medium", fontSize: 14 },
  table: { borderRadius: 20, overflow: "hidden", marginBottom: 20 },
  tableHeader: { flexDirection: "row", padding: 14, borderBottomWidth: 1, gap: 4 },
  tableHeaderText: { fontFamily: "Inter_600SemiBold", fontSize: 12, flex: 1 },
  tableRow: { flexDirection: "row", padding: 14, borderBottomWidth: 1, gap: 4 },
  tableCell: { fontFamily: "Inter_500Medium", fontSize: 14, flex: 1 },
  infoCard: { flexDirection: "row", borderRadius: 14, padding: 16, gap: 12, alignItems: "flex-start" },
  infoText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, lineHeight: 20 },
});
