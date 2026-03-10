import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";

const GOALS = [
  { key: "lose", label: "Perder Peso", desc: "Déficit calórico y cardio", icon: "trending-down", color: "#FF6B9D" },
  { key: "maintain", label: "Mantener", desc: "Equilibrio y salud", icon: "remove", color: Colors.dark.accentBlue },
  { key: "gain", label: "Ganar Músculo", desc: "Superávit y fuerza", icon: "trending-up", color: Colors.dark.accent },
] as const;

const ACTIVITY = [
  { key: "sedentary", label: "Sedentario", desc: "Poco ejercicio" },
  { key: "light", label: "Ligero", desc: "1-3 días/semana" },
  { key: "moderate", label: "Moderado", desc: "3-5 días/semana" },
  { key: "active", label: "Activo", desc: "6-7 días/semana" },
] as const;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const { addUser } = useApp();

  const [name, setName] = useState("");
  const [age, setAge] = useState("25");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [height, setHeight] = useState("175");
  const [weight, setWeight] = useState("75");
  const [goal, setGoal] = useState<"lose" | "maintain" | "gain">("maintain");
  const [activity, setActivity] = useState<"sedentary" | "light" | "moderate" | "active">("moderate");
  const [loading, setLoading] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await addUser({
        name: name.trim(),
        age: parseInt(age) || 25,
        gender,
        height: parseFloat(height) || 175,
        weight: parseFloat(weight) || 75,
        goalWeight: goal === "lose" ? (parseFloat(weight) - 5) : parseFloat(weight) + (goal === "gain" ? 3 : 0),
        activityLevel: activity,
        goal,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <LinearGradient
        colors={["#0A0A0F", Colors.dark.accent + "22", "#0A0A0F"]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 24, paddingBottom: bottomInset + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Ionicons name="body" size={40} color={Colors.dark.accent} />
          </View>
          <Text style={styles.appName}>Vitalis AI</Text>
          <Text style={[styles.tagline, { color: C.textSecondary }]}>
            Tu asistente personal de salud y fitness
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: C.surface }]}>
          <Text style={[styles.cardTitle, { color: C.text }]}>Cuéntanos sobre ti</Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: C.textSecondary }]}>Nombre</Text>
            <View style={[styles.inputWrap, { backgroundColor: C.surface2 }]}>
              <TextInput
                style={[styles.input, { color: C.text }]}
                value={name}
                onChangeText={setName}
                placeholder="Tu nombre"
                placeholderTextColor={C.textTertiary}
              />
            </View>
          </View>

          <View style={styles.fieldRow}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: C.textSecondary }]}>Edad</Text>
              <View style={[styles.inputWrap, { backgroundColor: C.surface2 }]}>
                <TextInput
                  style={[styles.input, { color: C.text }]}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: C.textSecondary }]}>Altura (cm)</Text>
              <View style={[styles.inputWrap, { backgroundColor: C.surface2 }]}>
                <TextInput
                  style={[styles.input, { color: C.text }]}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: C.textSecondary }]}>Peso (kg)</Text>
              <View style={[styles.inputWrap, { backgroundColor: C.surface2 }]}>
                <TextInput
                  style={[styles.input, { color: C.text }]}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: C.textSecondary }]}>Género</Text>
              <View style={styles.genderRow}>
                {(["male", "female", "other"] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderBtn,
                      { backgroundColor: gender === g ? Colors.dark.accent + "22" : C.surface2, borderColor: gender === g ? Colors.dark.accent : "transparent", borderWidth: 1 },
                    ]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.genderText, { color: gender === g ? Colors.dark.accent : C.textSecondary }]}>
                      {g === "male" ? "H" : g === "female" ? "M" : "O"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <Text style={[styles.label, { color: C.textSecondary, marginBottom: 8 }]}>Objetivo</Text>
          <View style={styles.goalsRow}>
            {GOALS.map((g) => (
              <TouchableOpacity
                key={g.key}
                style={[
                  styles.goalCard,
                  {
                    backgroundColor: goal === g.key ? g.color + "22" : C.surface2,
                    borderColor: goal === g.key ? g.color : "transparent",
                    borderWidth: 1,
                  },
                ]}
                onPress={() => setGoal(g.key)}
              >
                <Ionicons name={g.icon as any} size={20} color={goal === g.key ? g.color : C.textSecondary} />
                <Text style={[styles.goalLabel, { color: goal === g.key ? g.color : C.text }]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: C.textSecondary, marginBottom: 8, marginTop: 4 }]}>Actividad</Text>
          <View style={styles.activityGrid}>
            {ACTIVITY.map((a) => (
              <TouchableOpacity
                key={a.key}
                style={[
                  styles.activityCard,
                  {
                    backgroundColor: activity === a.key ? Colors.dark.accent + "22" : C.surface2,
                    borderColor: activity === a.key ? Colors.dark.accent : "transparent",
                    borderWidth: 1,
                  },
                ]}
                onPress={() => setActivity(a.key)}
              >
                <Text style={[styles.activityLabel, { color: activity === a.key ? Colors.dark.accent : C.text }]}>
                  {a.label}
                </Text>
                <Text style={[styles.activityDesc, { color: C.textSecondary }]}>{a.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.createBtn,
              { backgroundColor: name.trim() ? Colors.dark.accent : C.surface2, marginTop: 8 },
            ]}
            onPress={handleCreate}
            disabled={!name.trim() || loading}
            activeOpacity={0.85}
          >
            <Text style={[styles.createBtnText, { color: name.trim() ? "#000" : C.textSecondary }]}>
              {loading ? "Creando..." : "Comenzar"}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={name.trim() ? "#000" : C.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  logoArea: { alignItems: "center", marginBottom: 32, gap: 8 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.accent + "22",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  appName: { fontFamily: "Inter_700Bold", fontSize: 32, color: "#FFFFFF" },
  tagline: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
  card: { borderRadius: 24, padding: 20, gap: 12 },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 4 },
  field: { gap: 6 },
  fieldRow: { flexDirection: "row", gap: 12 },
  label: { fontFamily: "Inter_500Medium", fontSize: 13 },
  inputWrap: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  input: { fontFamily: "Inter_400Regular", fontSize: 15 },
  genderRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  genderBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  genderText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  goalsRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  goalCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", gap: 6 },
  goalLabel: { fontFamily: "Inter_500Medium", fontSize: 12, textAlign: "center" },
  activityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  activityCard: { width: "47%", borderRadius: 12, padding: 12 },
  activityLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  activityDesc: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  createBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 16, gap: 8 },
  createBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 17 },
});
