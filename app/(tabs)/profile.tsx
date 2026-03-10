import React, { useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Polyline, Circle as SvgCircle } from "react-native-svg";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useApp, UserProfile } from "@/contexts/AppContext";

function WeightChart({ data, color = Colors.dark.accent }: { data: { date: string; value: number }[]; color?: string }) {
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  if (sorted.length < 2) {
    return (
      <View style={{ height: 80, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.dark.textSecondary }}>
          Sin datos de peso aún
        </Text>
      </View>
    );
  }
  const W = 280, H = 80, pad = 12;
  const values = sorted.map((d) => d.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const pts = sorted.map((d, i) => {
    const x = pad + (i / (sorted.length - 1)) * (W - pad * 2);
    const y = H - pad - ((d.value - minV) / range) * (H - pad * 2);
    return `${x},${y}`;
  });
  const lastPt = pts[pts.length - 1].split(",");
  return (
    <Svg width={W} height={H}>
      <Polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      <SvgCircle cx={parseFloat(lastPt[0])} cy={parseFloat(lastPt[1])} r={4} fill={color} />
    </Svg>
  );
}

const ACTIVITY_LEVELS = [
  { key: "sedentary", label: "Sedentario", desc: "Poco o ningún ejercicio" },
  { key: "light", label: "Ligero", desc: "1-3 días/semana" },
  { key: "moderate", label: "Moderado", desc: "3-5 días/semana" },
  { key: "active", label: "Activo", desc: "6-7 días/semana" },
  { key: "very_active", label: "Muy Activo", desc: "2x/día" },
] as const;

const GOALS = [
  { key: "lose", label: "Perder peso", icon: "trending-down", color: "#FF6B9D" },
  { key: "maintain", label: "Mantener", icon: "remove", color: Colors.dark.accentBlue },
  { key: "gain", label: "Ganar músculo", icon: "trending-up", color: Colors.dark.accent },
] as const;

function AvatarPlaceholder({ name, size }: { name: string; size: number }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <LinearGradient
      colors={[Colors.dark.accent, Colors.dark.accentBlue]}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <Text
        style={{
          color: "#000",
          fontFamily: "Inter_700Bold",
          fontSize: size * 0.36,
        }}
      >
        {initials || "U"}
      </Text>
    </LinearGradient>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;

  const { data, currentUser, addUser, updateUser, deleteUser, switchUser } = useApp();

  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: currentUser?.name ?? "",
    age: currentUser?.age ?? 25,
    gender: currentUser?.gender ?? "male",
    height: currentUser?.height ?? 175,
    weight: currentUser?.weight ?? 75,
    goalWeight: currentUser?.goalWeight ?? 70,
    activityLevel: currentUser?.activityLevel ?? "moderate",
    goal: currentUser?.goal ?? "maintain",
  });

  const [newUser, setNewUser] = useState({
    name: "",
    age: "25",
    gender: "male" as "male" | "female" | "other",
    height: "175",
    weight: "75",
    goalWeight: "70",
    activityLevel: "moderate" as UserProfile["activityLevel"],
    goal: "maintain" as UserProfile["goal"],
  });

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const saveEdit = async () => {
    if (!currentUser) return;
    await updateUser(currentUser.id, formData);
    setEditing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const createAccount = async () => {
    if (!newUser.name.trim()) {
      Alert.alert("Error", "Introduce un nombre");
      return;
    }
    await addUser({
      name: newUser.name,
      age: parseInt(newUser.age) || 25,
      gender: newUser.gender,
      height: parseFloat(newUser.height) || 175,
      weight: parseFloat(newUser.weight) || 75,
      goalWeight: parseFloat(newUser.goalWeight) || 70,
      activityLevel: newUser.activityLevel,
      goal: newUser.goal,
    });
    setCreating(false);
    setNewUser({ name: "", age: "25", gender: "male", height: "175", weight: "75", goalWeight: "70", activityLevel: "moderate", goal: "maintain" });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const bmi = currentUser
    ? parseFloat((currentUser.weight / Math.pow(currentUser.height / 100, 2)).toFixed(1))
    : 0;

  const bmiCategory =
    bmi < 18.5 ? "Bajo peso" : bmi < 25 ? "Normal" : bmi < 30 ? "Sobrepeso" : "Obesidad";
  const bmiColor =
    bmi < 18.5 ? Colors.dark.accentBlue : bmi < 25 ? Colors.dark.accent : Colors.dark.warning;

  const totalWorkouts = data.workouts.length;
  const totalKm = data.stepRecords.reduce((s, r) => s + r.distanceKm, 0);
  const totalCalBurned = data.stepRecords.reduce((s, r) => s + r.caloriesBurned, 0);

  if (!currentUser && !creating) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <View style={[styles.emptyProfile, { paddingTop: topInset + 40 }]}>
          <LinearGradient
            colors={[Colors.dark.accent + "33", Colors.dark.accentBlue + "33"]}
            style={styles.emptyIconBg}
          >
            <Ionicons name="person-add" size={48} color={Colors.dark.accent} />
          </LinearGradient>
          <Text style={[styles.emptyTitle, { color: C.text }]}>Crea tu perfil</Text>
          <Text style={[styles.emptySubtitle, { color: C.textSecondary }]}>
            Configura tu perfil para obtener recomendaciones personalizadas
          </Text>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: Colors.dark.accent }]}
            onPress={() => setCreating(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.createBtnText}>Crear Perfil</Text>
          </TouchableOpacity>
        </View>

        {creating && (
          <ScrollView style={styles.createForm} contentContainerStyle={{ padding: 20 }}>
            <CreateUserForm
              data={newUser}
              onChange={setNewUser}
              onSave={createAccount}
              onCancel={() => setCreating(false)}
              C={C}
            />
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 16 }]}
      >
        {/* Account Switcher */}
        {data.users.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountsRow}>
            {data.users.map((u) => (
              <TouchableOpacity
                key={u.id}
                style={[
                  styles.accountPill,
                  {
                    backgroundColor:
                      u.id === data.currentUserId ? Colors.dark.accent + "22" : C.surface,
                    borderWidth: u.id === data.currentUserId ? 1 : 0,
                    borderColor: Colors.dark.accent,
                  },
                ]}
                onPress={() => {
                  if (u.id !== data.currentUserId) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    switchUser(u.id);
                  }
                }}
              >
                <AvatarPlaceholder name={u.name} size={32} />
                <Text style={[styles.accountPillName, { color: u.id === data.currentUserId ? Colors.dark.accent : C.text }]}>
                  {u.name}
                </Text>
                {u.id === data.currentUserId && (
                  <Ionicons name="checkmark-circle" size={16} color={Colors.dark.accent} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.addAccountBtn, { backgroundColor: C.surface }]}
              onPress={() => setCreating(true)}
            >
              <Ionicons name="add" size={22} color={C.textSecondary} />
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Profile Header */}
        {!creating && currentUser && (
          <>
            <LinearGradient
              colors={[C.surface, C.surface2]}
              style={styles.profileCard}
            >
              <View style={styles.profileTop}>
                <AvatarPlaceholder name={currentUser.name} size={80} />
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: C.text }]}>{currentUser.name}</Text>
                  <Text style={[styles.profileSub, { color: C.textSecondary }]}>
                    {currentUser.age} años · {currentUser.height}cm · {currentUser.weight}kg
                  </Text>
                  <View style={[styles.goalTag, { backgroundColor: Colors.dark.accent + "22" }]}>
                    <Text style={[styles.goalTagText, { color: Colors.dark.accent }]}>
                      {GOALS.find((g) => g.key === currentUser.goal)?.label}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.editBtn, { backgroundColor: C.surface3 }]}
                  onPress={() => {
                    setFormData({
                      name: currentUser.name,
                      age: currentUser.age,
                      gender: currentUser.gender,
                      height: currentUser.height,
                      weight: currentUser.weight,
                      goalWeight: currentUser.goalWeight,
                      activityLevel: currentUser.activityLevel,
                      goal: currentUser.goal,
                    });
                    setEditing(!editing);
                  }}
                >
                  <Ionicons name={editing ? "close" : "pencil"} size={18} color={C.text} />
                </TouchableOpacity>
              </View>

              {/* BMI */}
              <View style={[styles.bmiRow, { backgroundColor: bmiColor + "22" }]}>
                <Text style={[styles.bmiLabel, { color: bmiColor }]}>IMC</Text>
                <Text style={[styles.bmiValue, { color: bmiColor }]}>{bmi}</Text>
                <Text style={[styles.bmiCat, { color: bmiColor }]}>{bmiCategory}</Text>
                <View style={styles.bmiScale}>
                  <View style={styles.bmiScaleBar}>
                    <View
                      style={[
                        styles.bmiIndicator,
                        {
                          left: `${Math.min(Math.max((bmi - 10) / 30, 0), 1) * 100}%`,
                          backgroundColor: bmiColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </LinearGradient>

            {/* Lifetime Stats */}
            <Text style={[styles.sectionTitle, { color: C.text }]}>Estadísticas Totales</Text>
            <View style={styles.lifeStats}>
              {[
                { label: "Entrenamientos", value: totalWorkouts.toString(), color: Colors.dark.accent, icon: "barbell" },
                { label: "Kilómetros", value: totalKm.toFixed(1), color: Colors.dark.accentBlue, icon: "walk" },
                { label: "Cal quemadas", value: Math.round(totalCalBurned).toString(), color: "#FF6B9D", icon: "flame" },
                { label: "Escaneos", value: (data.bodyScans.length + data.facialScans.length).toString(), color: Colors.dark.warning, icon: "scan" },
              ].map((s) => (
                <View key={s.label} style={[styles.lifeStatCard, { backgroundColor: C.surface }]}>
                  <View style={[styles.lifeStatIcon, { backgroundColor: s.color + "22" }]}>
                    <Ionicons name={s.icon as any} size={20} color={s.color} />
                  </View>
                  <Text style={[styles.lifeStatValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={[styles.lifeStatLabel, { color: C.textSecondary }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Weight Chart */}
            {data.weight.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: C.text }]}>Evolución del Peso</Text>
                <View style={[styles.weightChartCard, { backgroundColor: C.surface }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <View>
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.dark.accent }}>
                        {data.weight[data.weight.length - 1]?.value ?? currentUser?.weight ?? 0} kg
                      </Text>
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary }}>Peso actual</Text>
                    </View>
                    {currentUser?.goalWeight && (
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.dark.accentBlue }}>
                          {currentUser.goalWeight} kg
                        </Text>
                        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary }}>Objetivo</Text>
                      </View>
                    )}
                  </View>
                  <WeightChart data={data.weight} color={Colors.dark.accent} />
                  {data.weight.length >= 2 && (() => {
                    const first = data.weight[0].value;
                    const last = data.weight[data.weight.length - 1].value;
                    const diff = last - first;
                    return (
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: diff <= 0 ? Colors.dark.accent : "#FF6B9D", marginTop: 8 }}>
                        {diff <= 0 ? "↓" : "↑"} {Math.abs(diff).toFixed(1)} kg desde el inicio
                      </Text>
                    );
                  })()}
                </View>
              </>
            )}

            {/* Edit Form */}
            {editing && (
              <View style={[styles.editForm, { backgroundColor: C.surface }]}>
                <Text style={[styles.editTitle, { color: C.text }]}>Editar Perfil</Text>

                <LabeledInput label="Nombre" value={formData.name as string} onChange={(v) => setFormData({ ...formData, name: v })} C={C} />
                <LabeledInput label="Edad" value={String(formData.age)} onChange={(v) => setFormData({ ...formData, age: parseInt(v) || 0 })} keyboardType="numeric" C={C} />
                <LabeledInput label="Altura (cm)" value={String(formData.height)} onChange={(v) => setFormData({ ...formData, height: parseFloat(v) || 0 })} keyboardType="numeric" C={C} />
                <LabeledInput label="Peso actual (kg)" value={String(formData.weight)} onChange={(v) => setFormData({ ...formData, weight: parseFloat(v) || 0 })} keyboardType="numeric" C={C} />
                <LabeledInput label="Peso objetivo (kg)" value={String(formData.goalWeight)} onChange={(v) => setFormData({ ...formData, goalWeight: parseFloat(v) || 0 })} keyboardType="numeric" C={C} />

                <Text style={[styles.inputLabel, { color: C.textSecondary }]}>Objetivo</Text>
                <View style={styles.goalSelector}>
                  {GOALS.map((g) => (
                    <TouchableOpacity
                      key={g.key}
                      style={[
                        styles.goalBtn,
                        { backgroundColor: formData.goal === g.key ? g.color + "22" : C.surface2, borderColor: formData.goal === g.key ? g.color : "transparent", borderWidth: 1 },
                      ]}
                      onPress={() => setFormData({ ...formData, goal: g.key })}
                    >
                      <Ionicons name={g.icon as any} size={16} color={formData.goal === g.key ? g.color : C.textSecondary} />
                      <Text style={[styles.goalBtnText, { color: formData.goal === g.key ? g.color : C.textSecondary }]}>
                        {g.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { color: C.textSecondary }]}>Nivel de Actividad</Text>
                {ACTIVITY_LEVELS.map((a) => (
                  <TouchableOpacity
                    key={a.key}
                    style={[
                      styles.activityItem,
                      { backgroundColor: formData.activityLevel === a.key ? Colors.dark.accent + "22" : C.surface2 },
                    ]}
                    onPress={() => setFormData({ ...formData, activityLevel: a.key })}
                  >
                    <View>
                      <Text style={[styles.activityLabel, { color: C.text }]}>{a.label}</Text>
                      <Text style={[styles.activityDesc, { color: C.textSecondary }]}>{a.desc}</Text>
                    </View>
                    {formData.activityLevel === a.key && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.dark.accent} />
                    )}
                  </TouchableOpacity>
                ))}

                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={[styles.saveEditBtn, { backgroundColor: Colors.dark.accent }]}
                    onPress={saveEdit}
                  >
                    <Text style={styles.saveEditBtnText}>Guardar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteBtn, { backgroundColor: C.surface2 }]}
                    onPress={() => {
                      Alert.alert("Eliminar cuenta", "¿Seguro que quieres eliminar esta cuenta?", [
                        { text: "Cancelar", style: "cancel" },
                        { text: "Eliminar", style: "destructive", onPress: () => deleteUser(currentUser.id) },
                      ]);
                    }}
                  >
                    <Ionicons name="trash" size={18} color={C.error} />
                    <Text style={[styles.deleteBtnText, { color: C.error }]}>Eliminar cuenta</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {data.users.length === 1 && (
              <TouchableOpacity
                style={[styles.addAccountCard, { backgroundColor: C.surface }]}
                onPress={() => setCreating(true)}
              >
                <View style={[styles.addAccountIcon, { backgroundColor: Colors.dark.accent + "22" }]}>
                  <Ionicons name="person-add" size={22} color={Colors.dark.accent} />
                </View>
                <View style={styles.addAccountText}>
                  <Text style={[styles.addAccountTitle, { color: C.text }]}>Añadir otra cuenta</Text>
                  <Text style={[styles.addAccountSub, { color: C.textSecondary }]}>
                    Cambia de perfil fácilmente
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.textSecondary} />
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Create Account Form */}
        {creating && (
          <View style={[styles.createFormCard, { backgroundColor: C.surface }]}>
            <Text style={[styles.editTitle, { color: C.text }]}>Nuevo Perfil</Text>
            <CreateUserForm
              data={newUser}
              onChange={setNewUser}
              onSave={createAccount}
              onCancel={() => setCreating(false)}
              C={C}
            />
          </View>
        )}

        {/* Quick Links */}
        {!editing && !creating && (
          <>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Herramientas</Text>
            {QUICK_LINKS.map((link) => (
              <TouchableOpacity
                key={link.id}
                style={[styles.quickLink, { backgroundColor: C.surface }]}
                onPress={() => router.push(link.route as any)}
                activeOpacity={0.85}
              >
                <View style={[styles.quickLinkIcon, { backgroundColor: link.color + "22" }]}>
                  <Ionicons name={link.icon as any} size={20} color={link.color} />
                </View>
                <Text style={[styles.quickLinkLabel, { color: C.text }]}>{link.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={C.textSecondary} />
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  keyboardType,
  C,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: "numeric" | "default";
  C: typeof Colors.dark;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[styles.inputLabel, { color: C.textSecondary }]}>{label}</Text>
      <View style={[styles.inputBox, { backgroundColor: C.surface2 }]}>
        <TextInput
          style={[styles.inputField, { color: C.text }]}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType ?? "default"}
          placeholderTextColor={C.textSecondary}
        />
      </View>
    </View>
  );
}

function CreateUserForm({
  data,
  onChange,
  onSave,
  onCancel,
  C,
}: {
  data: any;
  onChange: (d: any) => void;
  onSave: () => void;
  onCancel: () => void;
  C: typeof Colors.dark;
}) {
  return (
    <View style={{ gap: 12 }}>
      <LabeledInput label="Nombre" value={data.name} onChange={(v) => onChange({ ...data, name: v })} C={C} />
      <LabeledInput label="Edad" value={data.age} onChange={(v) => onChange({ ...data, age: v })} keyboardType="numeric" C={C} />

      <Text style={[styles.inputLabel, { color: C.textSecondary }]}>Género</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(["male", "female", "other"] as const).map((g) => (
          <TouchableOpacity
            key={g}
            style={[
              { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
              { backgroundColor: data.gender === g ? Colors.dark.accent + "22" : C.surface2 },
            ]}
            onPress={() => onChange({ ...data, gender: g })}
          >
            <Text style={{ color: data.gender === g ? Colors.dark.accent : C.textSecondary, fontFamily: "Inter_500Medium", fontSize: 13 }}>
              {g === "male" ? "Hombre" : g === "female" ? "Mujer" : "Otro"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <LabeledInput label="Altura (cm)" value={data.height} onChange={(v) => onChange({ ...data, height: v })} keyboardType="numeric" C={C} />
      <LabeledInput label="Peso (kg)" value={data.weight} onChange={(v) => onChange({ ...data, weight: v })} keyboardType="numeric" C={C} />
      <LabeledInput label="Peso objetivo (kg)" value={data.goalWeight} onChange={(v) => onChange({ ...data, goalWeight: v })} keyboardType="numeric" C={C} />

      <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
        <TouchableOpacity
          style={[{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", backgroundColor: Colors.dark.accent }]}
          onPress={onSave}
        >
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#000" }}>Crear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", backgroundColor: C.surface2 }]}
          onPress={onCancel}
        >
          <Text style={{ fontFamily: "Inter_500Medium", fontSize: 15, color: C.textSecondary }}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const QUICK_LINKS = [
  { id: "settings", label: "Ajustes de la app", icon: "settings", color: Colors.dark.textSecondary, route: "/settings" },
  { id: "hist", label: "Historial completo", icon: "time", color: Colors.dark.accentBlue, route: "/history" },
  { id: "calc", label: "Calculadora 1RM", icon: "calculator", color: "#FF6B9D", route: "/calculator" },
  { id: "supp", label: "Guía de Suplementos", icon: "flask", color: "#B39DDB", route: "/supplements" },
  { id: "breath", label: "Respiración y Meditación", icon: "leaf", color: "#4DB6AC", route: "/breathing" },
  { id: "chall", label: "Retos del Mes", icon: "trophy", color: Colors.dark.warning, route: "/challenges" },
  { id: "hair", label: "Cortes de Pelo", icon: "cut", color: "#FFB74D", route: "/hairstyle" },
  { id: "shop", label: "Lista de Compra", icon: "cart", color: Colors.dark.accent, route: "/shopping" },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  emptyProfile: { flex: 1, alignItems: "center", paddingHorizontal: 40, gap: 16 },
  emptyIconBg: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 24, textAlign: "center" },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 },
  createBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  createBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#000" },
  createForm: { flex: 1 },
  accountsRow: { marginBottom: 16 },
  accountPill: { flexDirection: "row", alignItems: "center", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, gap: 8 },
  accountPillName: { fontFamily: "Inter_500Medium", fontSize: 14 },
  addAccountBtn: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  profileCard: { borderRadius: 24, padding: 20, marginBottom: 20 },
  profileTop: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontFamily: "Inter_700Bold", fontSize: 22 },
  profileSub: { fontFamily: "Inter_400Regular", fontSize: 13 },
  goalTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start", marginTop: 4 },
  goalTagText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  editBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  bmiRow: { borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  bmiLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  bmiValue: { fontFamily: "Inter_700Bold", fontSize: 24 },
  bmiCat: { fontFamily: "Inter_500Medium", fontSize: 12, flex: 1 },
  bmiScale: { width: 60 },
  bmiScaleBar: { height: 4, backgroundColor: "#2A2A3A", borderRadius: 2, position: "relative" },
  bmiIndicator: { position: "absolute", width: 8, height: 8, borderRadius: 4, top: -2 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, marginBottom: 12 },
  lifeStats: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  lifeStatCard: { width: "47%", borderRadius: 16, padding: 16, gap: 8 },
  lifeStatIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  lifeStatValue: { fontFamily: "Inter_700Bold", fontSize: 22 },
  lifeStatLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  weightChartCard: { borderRadius: 16, padding: 16, marginBottom: 16, alignItems: "flex-start" },
  editForm: { borderRadius: 20, padding: 20, marginBottom: 20 },
  editTitle: { fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 16 },
  inputLabel: { fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 6 },
  inputBox: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  inputField: { fontFamily: "Inter_400Regular", fontSize: 15 },
  goalSelector: { flexDirection: "row", gap: 8, marginBottom: 16 },
  goalBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 10, borderRadius: 10 },
  goalBtnText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  activityItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 12, padding: 14, marginBottom: 8 },
  activityLabel: { fontFamily: "Inter_500Medium", fontSize: 14 },
  activityDesc: { fontFamily: "Inter_400Regular", fontSize: 12 },
  editActions: { gap: 10, marginTop: 8 },
  saveEditBtn: { paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  saveEditBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#000" },
  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 12, gap: 8 },
  deleteBtnText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  addAccountCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 16, gap: 12, marginBottom: 20 },
  addAccountIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  addAccountText: { flex: 1 },
  addAccountTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  addAccountSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  createFormCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  quickLink: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 16, marginBottom: 10, gap: 12 },
  quickLinkIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  quickLinkLabel: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15 },
});
