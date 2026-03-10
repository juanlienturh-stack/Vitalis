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
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";

const HEALTHY_ESSENTIALS = [
  { name: "Pollo (500g)", category: "Proteínas", checked: false },
  { name: "Salmón (400g)", category: "Proteínas", checked: false },
  { name: "Huevos (12 unidades)", category: "Proteínas", checked: false },
  { name: "Atún en lata (x4)", category: "Proteínas", checked: false },
  { name: "Yogur griego (x4)", category: "Lácteos", checked: false },
  { name: "Queso cottage (250g)", category: "Lácteos", checked: false },
  { name: "Leche (1L)", category: "Lácteos", checked: false },
  { name: "Arroz integral (1kg)", category: "Carbohidratos", checked: false },
  { name: "Avena (500g)", category: "Carbohidratos", checked: false },
  { name: "Batata (1kg)", category: "Carbohidratos", checked: false },
  { name: "Pan integral", category: "Carbohidratos", checked: false },
  { name: "Brócoli", category: "Verduras", checked: false },
  { name: "Espinacas (bolsa)", category: "Verduras", checked: false },
  { name: "Tomates", category: "Verduras", checked: false },
  { name: "Pepino", category: "Verduras", checked: false },
  { name: "Pimiento", category: "Verduras", checked: false },
  { name: "Plátanos (x6)", category: "Frutas", checked: false },
  { name: "Manzanas (x6)", category: "Frutas", checked: false },
  { name: "Naranja (x4)", category: "Frutas", checked: false },
  { name: "Aguacate (x2)", category: "Grasas", checked: false },
  { name: "Almendras (200g)", category: "Grasas", checked: false },
  { name: "Aceite de oliva", category: "Grasas", checked: false },
  { name: "Agua (pack 6L)", category: "Bebidas", checked: false },
  { name: "Café", category: "Bebidas", checked: false },
];

const CATEGORY_COLORS: Record<string, string> = {
  Proteínas: "#FF6B9D",
  Lácteos: Colors.dark.accentBlue,
  Carbohidratos: Colors.dark.warning,
  Verduras: Colors.dark.accent,
  Frutas: "#FF8A65",
  Grasas: "#B39DDB",
  Bebidas: "#4FC3F7",
  Personalizado: "#8888AA",
};

type ShoppingItem = {
  id: string;
  name: string;
  category: string;
  checked: boolean;
};

export default function ShoppingScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const { data } = useApp();

  const genId = () => Date.now().toString() + Math.random().toString(36).substr(2, 5);

  const [items, setItems] = useState<ShoppingItem[]>(
    HEALTHY_ESSENTIALS.map((i) => ({ ...i, id: genId() }))
  );
  const [newItem, setNewItem] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const toggleItem = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
    );
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    setItems((prev) => [
      ...prev,
      { id: genId(), name: newItem.trim(), category: "Personalizado", checked: false },
    ]);
    setNewItem("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeChecked = () => {
    setItems((prev) => prev.filter((i) => !i.checked));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  const groupedUnchecked = useMemo(() => {
    const groups: Record<string, ShoppingItem[]> = {};
    unchecked.forEach((i) => {
      if (!groups[i.category]) groups[i.category] = [];
      groups[i.category].push(i);
    });
    return groups;
  }, [unchecked]);

  const progress = items.length > 0 ? checked.length / items.length : 0;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 16 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: C.text }]}>Lista de Compra</Text>
          {checked.length > 0 && (
            <TouchableOpacity
              style={[styles.clearBtn, { backgroundColor: C.surface2 }]}
              onPress={removeChecked}
            >
              <Ionicons name="trash" size={18} color={C.error} />
            </TouchableOpacity>
          )}
        </View>

        {/* Progress */}
        <View style={[styles.progressCard, { backgroundColor: C.surface }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: C.text }]}>
              {checked.length} de {items.length} productos
            </Text>
            <Text style={[styles.progressPct, { color: Colors.dark.accent }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: C.surface2 }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%`, backgroundColor: Colors.dark.accent },
              ]}
            />
          </View>
        </View>

        {/* Add Item */}
        <View style={[styles.addRow, { backgroundColor: C.surface }]}>
          <TextInput
            style={[styles.addInput, { color: C.text }]}
            value={newItem}
            onChangeText={setNewItem}
            placeholder="Añadir producto..."
            placeholderTextColor={C.textSecondary}
            onSubmitEditing={addItem}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: Colors.dark.accent }]}
            onPress={addItem}
          >
            <Ionicons name="add" size={22} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Unchecked by Category */}
        {Object.entries(groupedUnchecked).map(([category, categoryItems]) => (
          <View key={category} style={styles.categoryGroup}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[category] ?? "#8888AA" }]} />
              <Text style={[styles.categoryTitle, { color: C.text }]}>{category}</Text>
              <Text style={[styles.categoryCount, { color: C.textSecondary }]}>
                {categoryItems.length}
              </Text>
            </View>
            {categoryItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.item, { backgroundColor: C.surface }]}
                onPress={() => toggleItem(item.id)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: CATEGORY_COLORS[item.category] ?? "#8888AA",
                      backgroundColor: item.checked
                        ? (CATEGORY_COLORS[item.category] ?? "#8888AA")
                        : "transparent",
                    },
                  ]}
                >
                  {item.checked && <Ionicons name="checkmark" size={14} color="#000" />}
                </View>
                <Text style={[styles.itemName, { color: C.text, textDecorationLine: item.checked ? "line-through" : "none" }]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Checked Items */}
        {checked.length > 0 && (
          <>
            <TouchableOpacity
              style={styles.showCompletedBtn}
              onPress={() => setShowCompleted(!showCompleted)}
            >
              <Ionicons
                name={showCompleted ? "chevron-up" : "chevron-down"}
                size={16}
                color={C.textSecondary}
              />
              <Text style={[styles.showCompletedText, { color: C.textSecondary }]}>
                {checked.length} producto{checked.length !== 1 ? "s" : ""} en el carrito
              </Text>
            </TouchableOpacity>
            {showCompleted &&
              checked.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.item, { backgroundColor: C.surface, opacity: 0.6 }]}
                  onPress={() => toggleItem(item.id)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: Colors.dark.accent, backgroundColor: Colors.dark.accent },
                    ]}
                  >
                    <Ionicons name="checkmark" size={14} color="#000" />
                  </View>
                  <Text
                    style={[
                      styles.itemName,
                      { color: C.textSecondary, textDecorationLine: "line-through" },
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
          </>
        )}

        {unchecked.length === 0 && checked.length === items.length && items.length > 0 && (
          <View style={[styles.doneCard, { backgroundColor: Colors.dark.accent + "22" }]}>
            <Ionicons name="checkmark-circle" size={40} color={Colors.dark.accent} />
            <Text style={[styles.doneText, { color: Colors.dark.accent }]}>
              Lista completada
            </Text>
          </View>
        )}

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
  title: { fontFamily: "Inter_700Bold", fontSize: 24, flex: 1, textAlign: "center" },
  clearBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  progressCard: { borderRadius: 16, padding: 16, marginBottom: 16, gap: 8 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontFamily: "Inter_500Medium", fontSize: 14 },
  progressPct: { fontFamily: "Inter_700Bold", fontSize: 14 },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  addRow: { flexDirection: "row", borderRadius: 14, padding: 8, gap: 8, marginBottom: 20, alignItems: "center" },
  addInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, paddingHorizontal: 8, paddingVertical: 8 },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  categoryGroup: { marginBottom: 16 },
  categoryHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, flex: 1 },
  categoryCount: { fontFamily: "Inter_400Regular", fontSize: 13 },
  item: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 14, marginBottom: 6, gap: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  itemName: { fontFamily: "Inter_400Regular", fontSize: 15, flex: 1 },
  showCompletedBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, justifyContent: "center" },
  showCompletedText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  doneCard: { borderRadius: 20, padding: 32, alignItems: "center", gap: 12, marginTop: 16 },
  doneText: { fontFamily: "Inter_700Bold", fontSize: 18 },
});
