import React, { useState } from "react";
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
import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";

const SUPPLEMENTS = [
  {
    name: "Proteína en Polvo",
    category: "Recuperación",
    color: "#FF6B9D",
    icon: "flask",
    evidence: 5,
    description:
      "La proteína en polvo (whey, caseína, vegetal) es el suplemento más respaldado científicamente. Ayuda a alcanzar las necesidades proteicas diarias para la síntesis muscular y recuperación.",
    benefits: ["Síntesis de proteína muscular", "Recuperación post-entrenamiento", "Saciedad"],
    timing: "Post-entreno o entre comidas",
    doseFormula: (weight: number) => `${Math.round(weight * 0.3)}-${Math.round(weight * 0.4)}g/día`,
    cautions: "Asegúrate de que complementa tu ingesta total de proteína, no la sustituye.",
  },
  {
    name: "Creatina Monohidrato",
    category: "Rendimiento",
    color: Colors.dark.accent,
    icon: "flash",
    evidence: 5,
    description:
      "La creatina es el suplemento deportivo más estudiado. Aumenta los depósitos de fosfocreatina en los músculos, mejorando la fuerza, potencia y recuperación entre series.",
    benefits: ["Fuerza y potencia", "Recuperación muscular", "Función cognitiva"],
    timing: "Cualquier momento del día, consistencia es clave",
    doseFormula: (_: number) => "3-5g/día (sin fase de carga necesaria)",
    cautions: "Hidratarse bien. Es segura para uso a largo plazo en personas sanas.",
  },
  {
    name: "Cafeína",
    category: "Rendimiento",
    color: Colors.dark.warning,
    icon: "cafe",
    evidence: 5,
    description:
      "La cafeína es un potente ergogénico que mejora el rendimiento en fuerza, resistencia y función cognitiva. Funciona bloqueando los receptores de adenosina.",
    benefits: ["Rendimiento aeróbico y anaeróbico", "Reducción de fatiga percibida", "Foco mental"],
    timing: "30-60 minutos antes del entrenamiento",
    doseFormula: (weight: number) => `${Math.round(weight * 3)}-${Math.round(weight * 6)}mg (máx 400mg/día)`,
    cautions: "No consumir después de las 2pm. Puede causar tolerancia.",
  },
  {
    name: "Vitamina D3",
    category: "Salud General",
    color: Colors.dark.accentBlue,
    icon: "sunny",
    evidence: 4,
    description:
      "Esencial para la función inmune, salud ósea y niveles hormonales (incluyendo testosterona). La deficiencia es muy común en personas con poca exposición solar.",
    benefits: ["Salud ósea y muscular", "Sistema inmune", "Producción hormonal"],
    timing: "Con una comida que contenga grasa",
    doseFormula: (_: number) => "2000-5000 UI/día (revisar niveles séricos)",
    cautions: "Combinar con K2 para mejor absorción de calcio.",
  },
  {
    name: "Omega-3",
    category: "Salud General",
    color: "#4FC3F7",
    icon: "water",
    evidence: 4,
    description:
      "Los ácidos grasos EPA y DHA tienen evidencia sólida para reducción de inflamación, salud cardiovascular y cognitiva. Especialmente importante si no consumes pescado graso regularmente.",
    benefits: ["Antiinflamatorio", "Salud cardiovascular", "Recuperación muscular"],
    timing: "Con comidas",
    doseFormula: (_: number) => "2-3g EPA+DHA/día",
    cautions: "Asegúrate que el producto tiene suficiente EPA+DHA, no solo aceite de pescado total.",
  },
  {
    name: "Beta-Alanina",
    category: "Rendimiento",
    color: "#B39DDB",
    icon: "fitness",
    evidence: 4,
    description:
      "Precursor de carnosina, un buffer intracelular que retrasa la acidificación muscular durante el ejercicio de alta intensidad de 1-4 minutos.",
    benefits: ["Resistencia muscular", "Retraso de fatiga", "Mejora en HIIT"],
    timing: "Dividido en varias tomas para reducir parestesia",
    doseFormula: (_: number) => "3.2-6.4g/día divididos",
    cautions: "Produce sensación de hormigueo (parestesia) inofensiva.",
  },
  {
    name: "L-Citrulina",
    category: "Pre-entreno",
    color: "#EF5350",
    icon: "pulse",
    evidence: 3,
    description:
      "Aumenta los niveles de arginina y óxido nítrico, mejorando el flujo sanguíneo, el pump muscular y potencialmente la resistencia.",
    benefits: ["Pump muscular", "Reducción del dolor muscular", "Rendimiento aeróbico"],
    timing: "30-60 minutos antes del entrenamiento",
    doseFormula: (_: number) => "6-8g L-Citrulina o 8g Citrulina Malato",
    cautions: "Más efectiva que L-arginina oral.",
  },
  {
    name: "Magnesio",
    category: "Salud General",
    color: "#4DB6AC",
    icon: "moon",
    evidence: 4,
    description:
      "Mineral esencial para más de 300 reacciones enzimáticas. Crucial para la función muscular, calidad del sueño y reducción del estrés. Alta prevalencia de deficiencia.",
    benefits: ["Calidad del sueño", "Reducción de calambres", "Función muscular"],
    timing: "Por la noche, antes de dormir",
    doseFormula: (_: number) => "200-400mg/día (glicinato o malato para mejor absorción)",
    cautions: "Evitar óxido de magnesio (baja biodisponibilidad).",
  },
];

export default function SupplementsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const { currentUser } = useApp();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const weight = currentUser?.weight ?? 75;
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const filtered = SUPPLEMENTS.filter(
    (s) =>
      search === "" ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
  );

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
          <Text style={[styles.title, { color: C.text }]}>Suplementación</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={[styles.subtitle, { color: C.textSecondary }]}>
          Guía basada en evidencia científica. Las dosis están calculadas para {weight}kg.
        </Text>

        <View style={[styles.searchBox, { backgroundColor: C.surface }]}>
          <Ionicons name="search" size={18} color={C.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: C.text }]}
            placeholder="Buscar suplemento..."
            placeholderTextColor={C.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {filtered.map((supp) => (
          <TouchableOpacity
            key={supp.name}
            style={[styles.card, { backgroundColor: C.surface }]}
            onPress={() => setExpanded(expanded === supp.name ? null : supp.name)}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: supp.color + "22" }]}>
                <Ionicons name={supp.icon as any} size={20} color={supp.color} />
              </View>
              <View style={styles.cardHeaderInfo}>
                <Text style={[styles.cardName, { color: C.text }]}>{supp.name}</Text>
                <View style={styles.cardMeta}>
                  <View style={[styles.categoryTag, { backgroundColor: supp.color + "22" }]}>
                    <Text style={[styles.categoryText, { color: supp.color }]}>{supp.category}</Text>
                  </View>
                  <View style={styles.evidenceStars}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Ionicons
                        key={i}
                        name="star"
                        size={10}
                        color={i < supp.evidence ? supp.color : C.border}
                      />
                    ))}
                  </View>
                </View>
              </View>
              <Ionicons
                name={expanded === supp.name ? "chevron-up" : "chevron-down"}
                size={20}
                color={C.textSecondary}
              />
            </View>

            {/* Dose always visible */}
            <View style={[styles.doseRow, { backgroundColor: supp.color + "11" }]}>
              <Ionicons name="calculator" size={14} color={supp.color} />
              <Text style={[styles.doseText, { color: supp.color }]}>
                {supp.doseFormula(weight)}
              </Text>
            </View>

            {expanded === supp.name && (
              <View style={styles.expanded}>
                <Text style={[styles.description, { color: C.textSecondary }]}>
                  {supp.description}
                </Text>

                <Text style={[styles.sectionLabel, { color: C.text }]}>Beneficios</Text>
                {supp.benefits.map((b, i) => (
                  <View key={i} style={styles.benefitItem}>
                    <View style={[styles.benefitDot, { backgroundColor: supp.color }]} />
                    <Text style={[styles.benefitText, { color: C.textSecondary }]}>{b}</Text>
                  </View>
                ))}

                <View style={[styles.timingRow, { backgroundColor: C.surface2 }]}>
                  <Ionicons name="time" size={16} color={Colors.dark.accentBlue} />
                  <Text style={[styles.timingText, { color: C.textSecondary }]}>
                    {supp.timing}
                  </Text>
                </View>

                <View style={[styles.cautionRow, { backgroundColor: Colors.dark.warning + "11" }]}>
                  <Ionicons name="warning" size={16} color={Colors.dark.warning} />
                  <Text style={[styles.cautionText, { color: C.textSecondary }]}>
                    {supp.cautions}
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={[styles.disclaimer, { backgroundColor: C.surface }]}>
          <Ionicons name="information-circle" size={20} color={Colors.dark.accentBlue} />
          <Text style={[styles.disclaimerText, { color: C.textSecondary }]}>
            Esta guía es educativa. Consulta con un profesional de salud antes de iniciar cualquier suplementación, especialmente si tienes condiciones médicas.
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 24 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, marginBottom: 16 },
  searchBox: { flexDirection: "row", alignItems: "center", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 8, marginBottom: 16 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14 },
  card: { borderRadius: 20, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  cardIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardHeaderInfo: { flex: 1 },
  cardName: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  categoryTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  evidenceStars: { flexDirection: "row", gap: 2 },
  doseRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 10 },
  doseText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  expanded: { marginTop: 12, gap: 10 },
  description: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginTop: 4 },
  benefitItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  benefitDot: { width: 6, height: 6, borderRadius: 3 },
  benefitText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  timingRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 10 },
  timingText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  cautionRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, padding: 10 },
  cautionText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, lineHeight: 18 },
  disclaimer: { flexDirection: "row", alignItems: "flex-start", borderRadius: 14, padding: 14, gap: 10, marginTop: 8 },
  disclaimerText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1, lineHeight: 18 },
});
