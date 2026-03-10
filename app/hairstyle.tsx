import React, { useState } from "react";
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
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";

type FaceShape = "Ovalado" | "Redondo" | "Cuadrado" | "Corazón" | "Alargado" | "Diamante";

const HAIRCUTS: {
  name: string;
  style: string;
  length: string;
  description: string;
  bestFor: FaceShape[];
  color: string;
}[] = [
  { name: "Undercut", style: "Moderno", length: "Corto-Medio", description: "Lados muy cortos con volumen en la parte superior. Versátil y atemporal.", bestFor: ["Ovalado", "Cuadrado", "Corazón", "Diamante"], color: "#FF6B9D" },
  { name: "Fade + Pompadour", style: "Clásico Moderno", length: "Medio", description: "Degradado en lados con volumen peinado hacia atrás en el frente.", bestFor: ["Ovalado", "Redondo", "Alargado"], color: Colors.dark.accent },
  { name: "Crop Top", style: "Minimalista", length: "Corto", description: "Flequillo texturizado con lados limpios. Muy popular y de bajo mantenimiento.", bestFor: ["Ovalado", "Cuadrado", "Corazón", "Diamante"], color: Colors.dark.accentBlue },
  { name: "Texturizado Largo", style: "Natural", length: "Largo", description: "Cabello más largo con capas para dar movimiento y textura natural.", bestFor: ["Cuadrado", "Redondo", "Diamante"], color: "#B39DDB" },
  { name: "Buzz Cut", style: "Minimalista", length: "Muy Corto", description: "Corte uniforme a máquina. Resalta los rasgos faciales y es muy fácil de mantener.", bestFor: ["Ovalado", "Cuadrado", "Corazón"], color: Colors.dark.warning },
  { name: "Mid Fade con Flequillo", style: "Urbano", length: "Corto-Medio", description: "Degradado hasta el medio con flequillo natural hacia el frente.", bestFor: ["Ovalado", "Redondo", "Cuadrado"], color: "#4DB6AC" },
  { name: "Quiff Moderno", style: "Formal-Casual", length: "Medio", description: "Volumen en la parte delantera con lados más cortos. Estilo clásico actualizado.", bestFor: ["Ovalado", "Alargado", "Corazón"], color: "#EF5350" },
  { name: "Slick Back", style: "Clásico", length: "Medio-Largo", description: "Cabello peinado hacia atrás, ideal para un look formal y sofisticado.", bestFor: ["Ovalado", "Corazón", "Alargado"], color: "#FFB74D" },
  { name: "French Crop", style: "Europeo", length: "Corto", description: "Variación del crop con flequillo más largo y lados casi pelados.", bestFor: ["Redondo", "Cuadrado", "Diamante"], color: "#81C784" },
  { name: "Curly Fro Controlado", style: "Natural", length: "Medio", description: "Para cabellos rizados, dejando que el rizo fluya de forma controlada.", bestFor: ["Ovalado", "Alargado", "Corazón"], color: "#FF8A65" },
  { name: "Man Bun", style: "Bohemio", length: "Largo", description: "Cabello recogido en moño. Requiere cabello largo pero es muy versátil.", bestFor: ["Cuadrado", "Diamante", "Alargado"], color: "#4FC3F7" },
  { name: "Ivy League", style: "Preppy", length: "Corto", description: "Parte lateral con degradado suave. Look intelectual y cuidado.", bestFor: ["Ovalado", "Alargado", "Corazón"], color: "#CE93D8" },
  { name: "High Top Fade", style: "Streetwear", length: "Medio", description: "Lados muy cortos con volumen elevado en la corona.", bestFor: ["Alargado", "Ovalado"], color: Colors.dark.accent },
  { name: "Taper Fade", style: "Clásico", length: "Corto", description: "Degradado suave desde la nuca hacia los lados, muy limpio y profesional.", bestFor: ["Ovalado", "Redondo", "Cuadrado", "Corazón", "Alargado", "Diamante"], color: "#90CAF9" },
  { name: "Wolf Cut", style: "Retro Moderno", length: "Largo", description: "Capas largas en la corona con lados texturizados. Tendencia actual.", bestFor: ["Ovalado", "Cuadrado", "Diamante"], color: "#F48FB1" },
];

const FACE_SHAPES: FaceShape[] = ["Ovalado", "Redondo", "Cuadrado", "Corazón", "Alargado", "Diamante"];

const SHAPE_DESCRIPTIONS: Record<FaceShape, string> = {
  Ovalado: "La forma más versátil. Proporciones equilibradas, frente ligeramente más ancha que la mandíbula.",
  Redondo: "Pómulos anchos y mandíbula redondeada. Se beneficia de estilos que añaden altura.",
  Cuadrado: "Mandíbula angular y frente similar en anchura. Se beneficia de suavizar los ángulos.",
  Corazón: "Frente ancha con mandíbula estrecha. Los estilos con volumen en la base equilibran.",
  Alargado: "Cara más larga que ancha. Los estilos con volumen lateral reducen la elongación.",
  Diamante: "Pómulos son la parte más ancha. Frente y mandíbula más estrechas.",
};

export default function HairstyleScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const { data } = useApp();

  const lastFacialScan = data.facialScans[data.facialScans.length - 1];
  const [selectedShape, setSelectedShape] = useState<FaceShape>(
    (lastFacialScan?.faceShape as FaceShape) ?? "Ovalado"
  );
  const [filterStyle, setFilterStyle] = useState<string | null>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const recommended = HAIRCUTS.filter((h) => h.bestFor.includes(selectedShape));
  const others = HAIRCUTS.filter((h) => !h.bestFor.includes(selectedShape));

  const styles_ = [...new Set(HAIRCUTS.map((h) => h.style))];

  const displayCuts = filterStyle
    ? HAIRCUTS.filter((h) => h.style === filterStyle)
    : recommended;

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
          <Text style={[styles.title, { color: C.text }]}>Cortes de Pelo</Text>
          <View style={{ width: 40 }} />
        </View>

        {lastFacialScan && (
          <View style={[styles.scanBanner, { backgroundColor: Colors.dark.accent + "22" }]}>
            <Ionicons name="scan-circle" size={18} color={Colors.dark.accent} />
            <Text style={[styles.scanBannerText, { color: Colors.dark.accent }]}>
              Cara detectada: {lastFacialScan.faceShape}
            </Text>
          </View>
        )}

        {/* Face Shape Selector */}
        <Text style={[styles.sectionTitle, { color: C.text }]}>Tu Forma de Cara</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shapesRow}>
          {FACE_SHAPES.map((shape) => (
            <TouchableOpacity
              key={shape}
              style={[
                styles.shapeTag,
                {
                  backgroundColor: selectedShape === shape ? Colors.dark.accent : C.surface,
                  borderColor: selectedShape === shape ? Colors.dark.accent : "transparent",
                  borderWidth: 1,
                },
              ]}
              onPress={() => { setSelectedShape(shape); setFilterStyle(null); }}
            >
              <Text style={[styles.shapeTagText, { color: selectedShape === shape ? "#000" : C.textSecondary }]}>
                {shape}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Shape Description */}
        <View style={[styles.shapeDesc, { backgroundColor: C.surface }]}>
          <Text style={[styles.shapeDescTitle, { color: C.text }]}>{selectedShape}</Text>
          <Text style={[styles.shapeDescText, { color: C.textSecondary }]}>
            {SHAPE_DESCRIPTIONS[selectedShape]}
          </Text>
        </View>

        {/* Style Filter */}
        <Text style={[styles.sectionTitle, { color: C.text }]}>Filtrar por Estilo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stylesRow}>
          <TouchableOpacity
            style={[
              styles.styleTag,
              { backgroundColor: !filterStyle ? C.surface2 : C.surface },
            ]}
            onPress={() => setFilterStyle(null)}
          >
            <Text style={[styles.styleTagText, { color: !filterStyle ? C.text : C.textSecondary }]}>
              Recomendados
            </Text>
          </TouchableOpacity>
          {styles_.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.styleTag,
                { backgroundColor: filterStyle === s ? C.surface2 : C.surface },
              ]}
              onPress={() => setFilterStyle(filterStyle === s ? null : s)}
            >
              <Text style={[styles.styleTagText, { color: filterStyle === s ? C.text : C.textSecondary }]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Haircuts */}
        <Text style={[styles.sectionTitle, { color: C.text }]}>
          {filterStyle ? filterStyle : `Recomendados para ${selectedShape}`} ({displayCuts.length})
        </Text>
        {displayCuts.map((cut) => (
          <View key={cut.name} style={[styles.cutCard, { backgroundColor: C.surface }]}>
            <View style={styles.cutTop}>
              <View style={[styles.cutIcon, { backgroundColor: cut.color + "22" }]}>
                <Ionicons name="cut" size={24} color={cut.color} />
              </View>
              <View style={styles.cutInfo}>
                <Text style={[styles.cutName, { color: C.text }]}>{cut.name}</Text>
                <View style={styles.cutTags}>
                  <View style={[styles.cutTag, { backgroundColor: cut.color + "22" }]}>
                    <Text style={[styles.cutTagText, { color: cut.color }]}>{cut.style}</Text>
                  </View>
                  <View style={[styles.cutTag, { backgroundColor: C.surface2 }]}>
                    <Text style={[styles.cutTagText, { color: C.textSecondary }]}>{cut.length}</Text>
                  </View>
                </View>
              </View>
              {cut.bestFor.includes(selectedShape) && !filterStyle && (
                <View style={[styles.recommendedBadge, { backgroundColor: Colors.dark.accent + "22" }]}>
                  <Ionicons name="star" size={14} color={Colors.dark.accent} />
                </View>
              )}
            </View>
            <Text style={[styles.cutDesc, { color: C.textSecondary }]}>{cut.description}</Text>

            <View style={styles.bestForRow}>
              <Text style={[styles.bestForLabel, { color: C.textTertiary }]}>Ideal para: </Text>
              {cut.bestFor.map((f) => (
                <View key={f} style={[styles.faceTag, { backgroundColor: C.surface2 }]}>
                  <Text style={[styles.faceTagText, { color: C.textSecondary }]}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 24 },
  scanBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, padding: 10, marginBottom: 16 },
  scanBannerText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, marginBottom: 12 },
  shapesRow: { marginBottom: 16 },
  shapeTag: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8 },
  shapeTagText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  shapeDesc: { borderRadius: 16, padding: 16, marginBottom: 20 },
  shapeDescTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 6 },
  shapeDescText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  stylesRow: { marginBottom: 16 },
  styleTag: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  styleTagText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  cutCard: { borderRadius: 20, padding: 16, marginBottom: 12 },
  cutTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  cutIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cutInfo: { flex: 1 },
  cutName: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  cutTags: { flexDirection: "row", gap: 6, marginTop: 4 },
  cutTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  cutTagText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  recommendedBadge: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cutDesc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, marginBottom: 10 },
  bestForRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 },
  bestForLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  faceTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  faceTagText: { fontFamily: "Inter_400Regular", fontSize: 11 },
});
