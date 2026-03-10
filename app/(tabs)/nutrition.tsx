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
  FlatList,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, G } from "react-native-svg";
import Colors from "@/constants/colors";
import { useApp, FoodEntry } from "@/contexts/AppContext";

function MacroDonut({ protein, carbs, fat, size = 100 }: { protein: number; carbs: number; fat: number; size?: number }) {
  const total = protein + carbs + fat || 1;
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  const pPct = protein / total;
  const cPct = carbs / total;
  const fPct = fat / total;

  const pDash = pPct * circ;
  const cDash = cPct * circ;
  const fDash = fPct * circ;

  const pOffset = 0;
  const cOffset = -(pDash);
  const fOffset = -(pDash + cDash);

  const isEmpty = protein === 0 && carbs === 0 && fat === 0;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <G rotation="-90" origin={`${cx}, ${cy}`}>
          {isEmpty ? (
            <Circle cx={cx} cy={cy} r={r} stroke={Colors.dark.surface3} strokeWidth={10} fill="none" />
          ) : (
            <>
              <Circle cx={cx} cy={cy} r={r} stroke={Colors.dark.accentBlue} strokeWidth={10} fill="none"
                strokeDasharray={`${pDash} ${circ - pDash}`} strokeDashoffset={pOffset} strokeLinecap="round" />
              <Circle cx={cx} cy={cy} r={r} stroke={Colors.dark.accent} strokeWidth={10} fill="none"
                strokeDasharray={`${cDash} ${circ - cDash}`} strokeDashoffset={cOffset} strokeLinecap="round" />
              <Circle cx={cx} cy={cy} r={r} stroke="#FF6B9D" strokeWidth={10} fill="none"
                strokeDasharray={`${fDash} ${circ - fDash}`} strokeDashoffset={fOffset} strokeLinecap="round" />
            </>
          )}
        </G>
      </Svg>
      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.dark.text }}>
        {Math.round(protein + carbs + fat)}g
      </Text>
      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.dark.textSecondary }}>macros</Text>
    </View>
  );
}

const MEAL_LABELS: Record<FoodEntry["meal"], string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Snack",
};

const MEAL_ICONS: Record<FoodEntry["meal"], string> = {
  breakfast: "sunny",
  lunch: "partly-sunny",
  dinner: "moon",
  snack: "cafe",
};

const FOOD_DB = [
  // Proteínas animales
  { name: "Pollo a la plancha", calories: 165, protein: 31, carbs: 0, fat: 3.6, unit: "100g", category: "Proteínas" },
  { name: "Pechuga de pollo", calories: 110, protein: 23, carbs: 0, fat: 1.2, unit: "100g", category: "Proteínas" },
  { name: "Muslo de pollo", calories: 179, protein: 25, carbs: 0, fat: 8.3, unit: "100g", category: "Proteínas" },
  { name: "Salmón", calories: 208, protein: 20, carbs: 0, fat: 13, unit: "100g", category: "Proteínas" },
  { name: "Atún en lata (agua)", calories: 116, protein: 25, carbs: 0, fat: 1, unit: "100g", category: "Proteínas" },
  { name: "Atún fresco", calories: 144, protein: 23, carbs: 0, fat: 5, unit: "100g", category: "Proteínas" },
  { name: "Sardinas en aceite", calories: 208, protein: 24, carbs: 0, fat: 12, unit: "100g", category: "Proteínas" },
  { name: "Merluza", calories: 82, protein: 17, carbs: 0, fat: 0.8, unit: "100g", category: "Proteínas" },
  { name: "Caballa", calories: 205, protein: 19, carbs: 0, fat: 14, unit: "100g", category: "Proteínas" },
  { name: "Gambas", calories: 85, protein: 20, carbs: 0, fat: 0.5, unit: "100g", category: "Proteínas" },
  { name: "Ternera magra", calories: 143, protein: 22, carbs: 0, fat: 6, unit: "100g", category: "Proteínas" },
  { name: "Filete de ternera", calories: 158, protein: 26, carbs: 0, fat: 6.2, unit: "100g", category: "Proteínas" },
  { name: "Pavo picado", calories: 135, protein: 20, carbs: 0, fat: 6, unit: "100g", category: "Proteínas" },
  { name: "Cerdo lomo", calories: 143, protein: 24, carbs: 0, fat: 5, unit: "100g", category: "Proteínas" },
  { name: "Huevo entero", calories: 72, protein: 6, carbs: 0.4, fat: 5, unit: "unidad", category: "Proteínas" },
  { name: "Clara de huevo", calories: 17, protein: 3.6, carbs: 0.2, fat: 0, unit: "unidad", category: "Proteínas" },
  { name: "Proteína whey", calories: 120, protein: 25, carbs: 3, fat: 1.5, unit: "scoop", category: "Proteínas" },
  { name: "Proteína caseína", calories: 115, protein: 24, carbs: 3.5, fat: 1, unit: "scoop", category: "Proteínas" },
  // Lácteos
  { name: "Yogur griego 0%", calories: 59, protein: 10, carbs: 3.6, fat: 0.4, unit: "100g", category: "Lácteos" },
  { name: "Yogur griego entero", calories: 97, protein: 9, carbs: 3.8, fat: 5, unit: "100g", category: "Lácteos" },
  { name: "Queso cottage", calories: 98, protein: 11, carbs: 3.4, fat: 4.3, unit: "100g", category: "Lácteos" },
  { name: "Queso fresco batido", calories: 69, protein: 8, carbs: 4, fat: 2, unit: "100g", category: "Lácteos" },
  { name: "Mozzarella light", calories: 148, protein: 22, carbs: 2.5, fat: 5.5, unit: "100g", category: "Lácteos" },
  { name: "Leche desnatada", calories: 36, protein: 3.5, carbs: 4.9, fat: 0.1, unit: "100ml", category: "Lácteos" },
  { name: "Leche entera", calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, unit: "100ml", category: "Lácteos" },
  { name: "Leche de avena", calories: 45, protein: 1.5, carbs: 6.5, fat: 1.5, unit: "100ml", category: "Lácteos" },
  { name: "Leche de almendra", calories: 24, protein: 0.9, carbs: 3.2, fat: 1, unit: "100ml", category: "Lácteos" },
  // Carbohidratos
  { name: "Arroz blanco cocido", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, unit: "100g", category: "Carbos" },
  { name: "Arroz integral cocido", calories: 123, protein: 2.7, carbs: 26, fat: 0.9, unit: "100g", category: "Carbos" },
  { name: "Avena (cruda)", calories: 370, protein: 13, carbs: 66, fat: 7, unit: "100g", category: "Carbos" },
  { name: "Avena cocida", calories: 71, protein: 2.5, carbs: 12, fat: 1.5, unit: "100g", category: "Carbos" },
  { name: "Batata cocida", calories: 86, protein: 1.6, carbs: 20, fat: 0.1, unit: "100g", category: "Carbos" },
  { name: "Patata cocida", calories: 87, protein: 1.9, carbs: 20, fat: 0.1, unit: "100g", category: "Carbos" },
  { name: "Pan integral", calories: 247, protein: 13, carbs: 41, fat: 4.2, unit: "100g", category: "Carbos" },
  { name: "Pan blanco", calories: 265, protein: 9, carbs: 49, fat: 3.2, unit: "100g", category: "Carbos" },
  { name: "Pasta integral cocida", calories: 131, protein: 5.3, carbs: 25, fat: 0.9, unit: "100g", category: "Carbos" },
  { name: "Pasta blanca cocida", calories: 158, protein: 5.5, carbs: 31, fat: 0.9, unit: "100g", category: "Carbos" },
  { name: "Quinoa cocida", calories: 120, protein: 4.4, carbs: 21, fat: 1.9, unit: "100g", category: "Carbos" },
  { name: "Lentejas cocidas", calories: 116, protein: 9, carbs: 20, fat: 0.4, unit: "100g", category: "Carbos" },
  { name: "Garbanzos cocidos", calories: 164, protein: 9, carbs: 27, fat: 2.6, unit: "100g", category: "Carbos" },
  { name: "Alubias negras cocidas", calories: 132, protein: 8.9, carbs: 24, fat: 0.5, unit: "100g", category: "Carbos" },
  { name: "Maíz cocido", calories: 96, protein: 3.4, carbs: 21, fat: 1.5, unit: "100g", category: "Carbos" },
  { name: "Tortita de arroz", calories: 389, protein: 8, carbs: 82, fat: 3, unit: "100g", category: "Carbos" },
  // Verduras
  { name: "Brócoli", calories: 34, protein: 2.8, carbs: 7, fat: 0.4, unit: "100g", category: "Verduras" },
  { name: "Espinacas", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, unit: "100g", category: "Verduras" },
  { name: "Lechuga romana", calories: 17, protein: 1.2, carbs: 3.3, fat: 0.3, unit: "100g", category: "Verduras" },
  { name: "Tomate", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, unit: "100g", category: "Verduras" },
  { name: "Pepino", calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, unit: "100g", category: "Verduras" },
  { name: "Pimiento rojo", calories: 31, protein: 1, carbs: 6, fat: 0.3, unit: "100g", category: "Verduras" },
  { name: "Calabacín", calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, unit: "100g", category: "Verduras" },
  { name: "Zanahoria", calories: 41, protein: 0.9, carbs: 10, fat: 0.2, unit: "100g", category: "Verduras" },
  { name: "Cebolla", calories: 40, protein: 1.1, carbs: 9, fat: 0.1, unit: "100g", category: "Verduras" },
  { name: "Ajo", calories: 149, protein: 6.4, carbs: 33, fat: 0.5, unit: "100g", category: "Verduras" },
  { name: "Champiñones", calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, unit: "100g", category: "Verduras" },
  { name: "Coliflor", calories: 25, protein: 1.9, carbs: 5, fat: 0.3, unit: "100g", category: "Verduras" },
  { name: "Kale", calories: 49, protein: 4.3, carbs: 9, fat: 0.9, unit: "100g", category: "Verduras" },
  { name: "Remolacha cocida", calories: 44, protein: 1.7, carbs: 10, fat: 0.2, unit: "100g", category: "Verduras" },
  { name: "Espárragos", calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1, unit: "100g", category: "Verduras" },
  { name: "Apio", calories: 16, protein: 0.7, carbs: 3, fat: 0.2, unit: "100g", category: "Verduras" },
  // Frutas
  { name: "Plátano", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, unit: "unidad", category: "Frutas" },
  { name: "Manzana", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, unit: "unidad", category: "Frutas" },
  { name: "Naranja", calories: 47, protein: 0.9, carbs: 12, fat: 0.1, unit: "unidad", category: "Frutas" },
  { name: "Fresas", calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, unit: "100g", category: "Frutas" },
  { name: "Arándanos", calories: 57, protein: 0.7, carbs: 14, fat: 0.3, unit: "100g", category: "Frutas" },
  { name: "Kiwi", calories: 61, protein: 1.1, carbs: 15, fat: 0.5, unit: "unidad", category: "Frutas" },
  { name: "Sandía", calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2, unit: "100g", category: "Frutas" },
  { name: "Melón", calories: 34, protein: 0.8, carbs: 8.2, fat: 0.2, unit: "100g", category: "Frutas" },
  { name: "Piña", calories: 50, protein: 0.5, carbs: 13, fat: 0.1, unit: "100g", category: "Frutas" },
  { name: "Mango", calories: 60, protein: 0.8, carbs: 15, fat: 0.4, unit: "100g", category: "Frutas" },
  { name: "Uvas", calories: 69, protein: 0.7, carbs: 18, fat: 0.2, unit: "100g", category: "Frutas" },
  { name: "Pera", calories: 57, protein: 0.4, carbs: 15, fat: 0.1, unit: "unidad", category: "Frutas" },
  { name: "Cerezas", calories: 63, protein: 1.1, carbs: 16, fat: 0.2, unit: "100g", category: "Frutas" },
  // Grasas saludables
  { name: "Aguacate", calories: 160, protein: 2, carbs: 9, fat: 15, unit: "100g", category: "Grasas" },
  { name: "Almendras", calories: 576, protein: 21, carbs: 22, fat: 49, unit: "100g", category: "Grasas" },
  { name: "Nueces", calories: 654, protein: 15, carbs: 14, fat: 65, unit: "100g", category: "Grasas" },
  { name: "Cacahuetes", calories: 567, protein: 26, carbs: 16, fat: 49, unit: "100g", category: "Grasas" },
  { name: "Mantequilla de cacahuete", calories: 588, protein: 25, carbs: 20, fat: 50, unit: "100g", category: "Grasas" },
  { name: "Aceite de oliva virgen", calories: 884, protein: 0, carbs: 0, fat: 100, unit: "100ml", category: "Grasas" },
  { name: "Semillas de chía", calories: 486, protein: 17, carbs: 42, fat: 31, unit: "100g", category: "Grasas" },
  { name: "Semillas de lino", calories: 534, protein: 18, carbs: 29, fat: 42, unit: "100g", category: "Grasas" },
  { name: "Anacardos", calories: 553, protein: 18, carbs: 30, fat: 44, unit: "100g", category: "Grasas" },
  { name: "Pistachos", calories: 562, protein: 20, carbs: 28, fat: 45, unit: "100g", category: "Grasas" },
  // Bebidas
  { name: "Café negro", calories: 2, protein: 0.3, carbs: 0, fat: 0, unit: "taza", category: "Bebidas" },
  { name: "Café con leche desnatada", calories: 42, protein: 4, carbs: 5, fat: 0.2, unit: "taza", category: "Bebidas" },
  { name: "Té verde", calories: 1, protein: 0, carbs: 0.2, fat: 0, unit: "taza", category: "Bebidas" },
  { name: "Zumo de naranja natural", calories: 45, protein: 0.7, carbs: 10, fat: 0.2, unit: "100ml", category: "Bebidas" },
  { name: "Batido proteico", calories: 160, protein: 30, carbs: 8, fat: 2, unit: "porción", category: "Bebidas" },
  // Varios
  { name: "Aceite de coco", calories: 862, protein: 0, carbs: 0, fat: 100, unit: "100g", category: "Grasas" },
  { name: "Miel", calories: 304, protein: 0.3, carbs: 82, fat: 0, unit: "100g", category: "Otros" },
  { name: "Chocolate negro 70%", calories: 598, protein: 8, carbs: 46, fat: 43, unit: "100g", category: "Otros" },
  { name: "Palomitas (sin mantequilla)", calories: 387, protein: 13, carbs: 78, fat: 4.5, unit: "100g", category: "Otros" },
  { name: "Hummus", calories: 166, protein: 8, carbs: 14, fat: 10, unit: "100g", category: "Otros" },
];

function MacroBar({ label, grams, total, color }: { label: string; grams: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(grams / total, 1) : 0;
  return (
    <View style={styles.macroBar}>
      <View style={styles.macroBarHeader}>
        <Text style={styles.macroBarLabel}>{label}</Text>
        <Text style={[styles.macroBarValue, { color }]}>{Math.round(grams)}g</Text>
      </View>
      <View style={styles.macroBarBg}>
        <View style={[styles.macroBarFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function NutritionScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;

  const { currentUser, data, addFoodEntry, deleteFoodEntry, todayCalories, todayMacros } = useApp();

  const today = new Date().toISOString().split("T")[0];
  const [showAdd, setShowAdd] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<FoodEntry["meal"]>("breakfast");
  const [search, setSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState<(typeof FOOD_DB)[0] | null>(null);
  const [quantity, setQuantity] = useState("100");

  const calGoal = useMemo(() => {
    if (!currentUser) return 2000;
    const bmr = currentUser.gender === "male"
      ? 88.36 + 13.4 * currentUser.weight + 4.8 * currentUser.height - 5.7 * currentUser.age
      : 447.6 + 9.2 * currentUser.weight + 3.1 * currentUser.height - 4.3 * currentUser.age;
    const mult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
    return Math.round(bmr * mult[currentUser.activityLevel]);
  }, [currentUser]);

  const proteinGoal = Math.round((calGoal * 0.3) / 4);
  const carbsGoal = Math.round((calGoal * 0.45) / 4);
  const fatGoal = Math.round((calGoal * 0.25) / 9);

  const todayEntries = data.foodEntries.filter((e) => e.date === today);

  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const allCategories = ["Todos", "Proteínas", "Lácteos", "Carbos", "Verduras", "Frutas", "Grasas", "Bebidas", "Otros"];

  const filteredFoods = FOOD_DB.filter((f) => {
    const matchSearch = search.length < 2 || f.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "Todos" || f.category === activeCategory;
    return matchSearch && matchCat;
  }).slice(0, search.length >= 2 ? 20 : 8);

  const addEntry = async () => {
    if (!selectedFood) return;
    const q = parseFloat(quantity) || 100;
    const factor = q / 100;
    await addFoodEntry({
      date: today,
      meal: selectedMeal,
      name: selectedFood.name,
      calories: Math.round(selectedFood.calories * factor),
      protein: parseFloat((selectedFood.protein * factor).toFixed(1)),
      carbs: parseFloat((selectedFood.carbs * factor).toFixed(1)),
      fat: parseFloat((selectedFood.fat * factor).toFixed(1)),
      quantity: q,
      unit: selectedFood.unit,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowAdd(false);
    setSearch("");
    setSelectedFood(null);
    setQuantity("100");
  };

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 16 }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.text }]}>Nutrición</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: Colors.dark.accent }]}
            onPress={() => setShowAdd(!showAdd)}
            activeOpacity={0.85}
          >
            <Ionicons name={showAdd ? "close" : "add"} size={22} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Calorie Ring */}
        <LinearGradient colors={[C.surface, C.surface2]} style={styles.calCard}>
          <View style={styles.calMain}>
            <View style={styles.calRingWrap}>
              <View style={[styles.calRingBg, { borderColor: Colors.dark.accent + "22" }]} />
              <View
                style={[
                  styles.calRingFg,
                  {
                    borderColor: Colors.dark.accent,
                    borderTopColor: "transparent",
                    transform: [{ rotate: `${Math.min(todayCalories / calGoal, 1) * 360 - 90}deg` }],
                  },
                ]}
              />
              <View style={styles.calRingCenter}>
                <Text style={[styles.calValue, { color: C.text }]}>{todayCalories}</Text>
                <Text style={[styles.calUnit, { color: C.textSecondary }]}>kcal</Text>
              </View>
            </View>
            <View style={styles.calInfo}>
              <View style={styles.calStat}>
                <Text style={[styles.calStatVal, { color: Colors.dark.accent }]}>{calGoal}</Text>
                <Text style={[styles.calStatLabel, { color: C.textSecondary }]}>Objetivo</Text>
              </View>
              <View style={[styles.calDivider, { backgroundColor: C.border }]} />
              <View style={styles.calStat}>
                <Text style={[styles.calStatVal, { color: Colors.dark.accentBlue }]}>
                  {Math.max(0, calGoal - todayCalories)}
                </Text>
                <Text style={[styles.calStatLabel, { color: C.textSecondary }]}>Restante</Text>
              </View>
              <View style={[styles.calDivider, { backgroundColor: C.border }]} />
              <View style={styles.calStat}>
                <Text style={[styles.calStatVal, { color: "#FF6B9D" }]}>
                  {Math.round(todayCalories * 0.15)}
                </Text>
                <Text style={[styles.calStatLabel, { color: C.textSecondary }]}>Ejercicio</Text>
              </View>
            </View>
          </View>

          <View style={styles.macros}>
            <MacroDonut protein={todayMacros.protein} carbs={todayMacros.carbs} fat={todayMacros.fat} size={100} />
            <View style={styles.macrosBars}>
              <MacroBar label="Proteína" grams={todayMacros.protein} total={proteinGoal} color={Colors.dark.accentBlue} />
              <MacroBar label="Carbos" grams={todayMacros.carbs} total={carbsGoal} color={Colors.dark.accent} />
              <MacroBar label="Grasa" grams={todayMacros.fat} total={fatGoal} color="#FF6B9D" />
            </View>
          </View>
        </LinearGradient>

        {/* Add Food Panel */}
        {showAdd && (
          <View style={[styles.addPanel, { backgroundColor: C.surface }]}>
            <Text style={[styles.addPanelTitle, { color: C.text }]}>Añadir Alimento</Text>

            {/* Meal Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealSelector}>
              {(["breakfast", "lunch", "dinner", "snack"] as FoodEntry["meal"][]).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.mealTag,
                    { backgroundColor: selectedMeal === m ? Colors.dark.accent : C.surface2 },
                  ]}
                  onPress={() => setSelectedMeal(m)}
                >
                  <Ionicons
                    name={MEAL_ICONS[m] as any}
                    size={14}
                    color={selectedMeal === m ? "#000" : C.textSecondary}
                  />
                  <Text
                    style={[
                      styles.mealTagText,
                      { color: selectedMeal === m ? "#000" : C.textSecondary },
                    ]}
                  >
                    {MEAL_LABELS[m]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Search */}
            <View style={[styles.searchBox, { backgroundColor: C.surface2 }]}>
              <Ionicons name="search" size={18} color={C.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: C.text }]}
                placeholder="Buscar alimento..."
                placeholderTextColor={C.textSecondary}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={18} color={C.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {allCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    { backgroundColor: activeCategory === cat ? Colors.dark.accent : C.surface2 },
                  ]}
                  onPress={() => setActiveCategory(cat)}
                >
                  <Text style={[styles.catChipText, { color: activeCategory === cat ? "#000" : C.textSecondary }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Food List */}
            <View style={styles.foodList}>
              {filteredFoods.map((food, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.foodItem,
                    {
                      backgroundColor:
                        selectedFood?.name === food.name ? Colors.dark.accent + "22" : C.surface2,
                    },
                  ]}
                  onPress={() => setSelectedFood(food)}
                >
                  <View style={styles.foodItemMain}>
                    <Text style={[styles.foodName, { color: C.text }]}>{food.name}</Text>
                    <Text style={[styles.foodPer, { color: C.textSecondary }]}>
                      por {food.unit}
                    </Text>
                  </View>
                  <View style={styles.foodNutrients}>
                    <Text style={[styles.foodCal, { color: Colors.dark.accent }]}>
                      {food.calories} kcal
                    </Text>
                    <Text style={[styles.foodMacro, { color: C.textSecondary }]}>
                      P: {food.protein}g · C: {food.carbs}g · G: {food.fat}g
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {selectedFood && (
              <View style={styles.quantityRow}>
                <View style={[styles.quantityInput, { backgroundColor: C.surface2 }]}>
                  <Text style={[styles.quantityLabel, { color: C.textSecondary }]}>Cantidad</Text>
                  <TextInput
                    style={[styles.quantityField, { color: C.text }]}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.addFoodBtn, { backgroundColor: Colors.dark.accent }]}
                  onPress={addEntry}
                >
                  <Ionicons name="add" size={20} color="#000" />
                  <Text style={styles.addFoodBtnText}>Añadir</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Meals */}
        {(["breakfast", "lunch", "dinner", "snack"] as FoodEntry["meal"][]).map((meal) => {
          const entries = todayEntries.filter((e) => e.meal === meal);
          if (entries.length === 0 && !showAdd) return null;
          return (
            <View key={meal} style={[styles.mealCard, { backgroundColor: C.surface }]}>
              <View style={styles.mealHeader}>
                <View style={styles.mealHeaderLeft}>
                  <Ionicons name={MEAL_ICONS[meal] as any} size={18} color={Colors.dark.accent} />
                  <Text style={[styles.mealTitle, { color: C.text }]}>{MEAL_LABELS[meal]}</Text>
                </View>
                <Text style={[styles.mealCals, { color: C.textSecondary }]}>
                  {entries.reduce((s, e) => s + e.calories, 0)} kcal
                </Text>
              </View>
              {entries.map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  style={[styles.entryItem, { borderTopColor: C.border }]}
                  onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    Alert.alert("Eliminar", `¿Eliminar ${entry.name}?`, [
                      { text: "Cancelar", style: "cancel" },
                      { text: "Eliminar", style: "destructive", onPress: () => deleteFoodEntry(entry.id) },
                    ]);
                  }}
                >
                  <View style={styles.entryMain}>
                    <Text style={[styles.entryName, { color: C.text }]}>{entry.name}</Text>
                    <Text style={[styles.entryQuantity, { color: C.textSecondary }]}>
                      {entry.quantity}{entry.unit}
                    </Text>
                  </View>
                  <View style={styles.entryRight}>
                    <Text style={[styles.entryCal, { color: Colors.dark.accent }]}>{entry.calories}</Text>
                    <Text style={[styles.entryCalLabel, { color: C.textSecondary }]}>kcal</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {entries.length === 0 && (
                <Text style={[styles.emptyMeal, { color: C.textTertiary }]}>Sin entradas</Text>
              )}
            </View>
          );
        })}

        {/* Shopping List CTA */}
        <TouchableOpacity
          style={[styles.shopCta, { backgroundColor: C.surface }]}
          onPress={() => require("expo-router").router.push("/shopping")}
          activeOpacity={0.85}
        >
          <View style={[styles.shopCtaIcon, { backgroundColor: Colors.dark.accent + "22" }]}>
            <Ionicons name="cart" size={22} color={Colors.dark.accent} />
          </View>
          <View style={styles.shopCtaText}>
            <Text style={[styles.shopCtaTitle, { color: C.text }]}>Lista de Compra</Text>
            <Text style={[styles.shopCtaSub, { color: C.textSecondary }]}>
              Genera tu lista basada en el plan semanal
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.textSecondary} />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 28 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  calCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  calMain: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  calRingWrap: {
    position: "relative",
    width: 100,
    height: 100,
    marginRight: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  calRingBg: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
  },
  calRingFg: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
  },
  calRingCenter: { position: "absolute", alignItems: "center" },
  calValue: { fontFamily: "Inter_700Bold", fontSize: 20 },
  calUnit: { fontFamily: "Inter_400Regular", fontSize: 11 },
  calInfo: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  calStat: { alignItems: "center" },
  calStatVal: { fontFamily: "Inter_700Bold", fontSize: 18 },
  calStatLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  calDivider: { width: 1, height: 30 },
  macros: { flexDirection: "row", gap: 12, alignItems: "center" },
  macrosBars: { flex: 1, gap: 8 },
  macroBar: { gap: 4 },
  macroBarHeader: { flexDirection: "row", justifyContent: "space-between" },
  macroBarLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: "#8888AA" },
  macroBarValue: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  macroBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2A2A3A",
    overflow: "hidden",
  },
  macroBarFill: { height: 6, borderRadius: 3 },
  addPanel: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  addPanelTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, marginBottom: 12 },
  mealSelector: { marginBottom: 12 },
  mealTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  mealTagText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14 },
  foodList: { gap: 8 },
  foodItem: {
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  foodItemMain: { flexDirection: "row", justifyContent: "space-between" },
  foodName: { fontFamily: "Inter_500Medium", fontSize: 14 },
  foodPer: { fontFamily: "Inter_400Regular", fontSize: 12 },
  foodNutrients: { flexDirection: "row", justifyContent: "space-between" },
  foodCal: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  foodMacro: { fontFamily: "Inter_400Regular", fontSize: 12 },
  quantityRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    alignItems: "center",
  },
  quantityInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  quantityLabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginBottom: 2 },
  quantityField: { fontFamily: "Inter_600SemiBold", fontSize: 18 },
  addFoodBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  addFoodBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#000" },
  mealCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mealHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  mealTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  mealCals: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  entryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  entryMain: { flex: 1 },
  entryName: { fontFamily: "Inter_500Medium", fontSize: 14 },
  entryQuantity: { fontFamily: "Inter_400Regular", fontSize: 12 },
  entryRight: { alignItems: "flex-end" },
  entryCal: { fontFamily: "Inter_700Bold", fontSize: 16 },
  entryCalLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  emptyMeal: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", paddingVertical: 4 },
  shopCta: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  shopCtaIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  shopCtaText: { flex: 1 },
  shopCtaTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  shopCtaSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8 },
  catChipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
});
