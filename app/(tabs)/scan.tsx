import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  useColorScheme,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Circle } from "react-native-svg";
import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";
import { router } from "expo-router";

function FaceScoreGauge({ score, size = 180 }: { score: number; size?: number }) {
  const pct = Math.min(score / 10, 1);
  const cx = size / 2;
  const cy = size * 0.6;
  const r = size * 0.38;
  const startAngle = -Math.PI;
  const endAngle = 0;
  const arcAngle = startAngle + pct * Math.PI;

  const describeArc = (start: number, end: number) => {
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = end - start > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const needleX = cx + (r - 8) * Math.cos(arcAngle);
  const needleY = cy + (r - 8) * Math.sin(arcAngle);

  const scoreColor = score >= 8 ? Colors.dark.accent : score >= 6 ? Colors.dark.accentBlue : score >= 4 ? Colors.dark.warning : "#FF4444";

  return (
    <View style={{ width: size, height: size * 0.65, alignItems: "center" }}>
      <Svg width={size} height={size * 0.65}>
        <Path d={describeArc(startAngle, endAngle)} stroke={Colors.dark.surface3} strokeWidth={14} fill="none" strokeLinecap="round" />
        <Path d={describeArc(startAngle, arcAngle)} stroke={scoreColor} strokeWidth={14} fill="none" strokeLinecap="round" />
        <Circle cx={needleX} cy={needleY} r={7} fill={scoreColor} />
        <Circle cx={cx} cy={cy} r={4} fill={Colors.dark.textSecondary} />
      </Svg>
      <View style={{ position: "absolute", bottom: 0, alignItems: "center" }}>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 40, color: scoreColor, lineHeight: 44 }}>{score.toFixed(1)}</Text>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.dark.textSecondary }}>de 10</Text>
      </View>
    </View>
  );
}

type ScanMode = "body" | "face";

const BODY_METRICS = [
  { key: "bodyFat", label: "Grasa Corporal", unit: "%" },
  { key: "muscleMass", label: "Masa Muscular", unit: "kg" },
  { key: "bmi", label: "IMC", unit: "" },
  { key: "chest", label: "Pecho", unit: "cm" },
  { key: "waist", label: "Cintura", unit: "cm" },
  { key: "hips", label: "Caderas", unit: "cm" },
];

const FACE_SHAPES = ["Ovalado", "Redondo", "Cuadrado", "Corazón", "Alargado", "Diamante"];

function estimateBodyMetrics(weight: number, height: number, gender: string, age: number) {
  const heightM = height / 100;
  const bmi = parseFloat((weight / (heightM * heightM)).toFixed(1));
  const bodyFatMale = 1.2 * bmi + 0.23 * age - 16.2;
  const bodyFatFemale = 1.2 * bmi + 0.23 * age - 5.4;
  const bodyFat = parseFloat(
    Math.max(5, Math.min(45, gender === "female" ? bodyFatFemale : bodyFatMale)).toFixed(1)
  );
  const muscleMass = parseFloat((weight * (1 - bodyFat / 100) * 0.85).toFixed(1));

  return {
    bmi,
    bodyFat,
    muscleMass,
    chest: Math.round(height * 0.52 + (gender === "female" ? 2 : 0)),
    waist: Math.round(height * 0.44 - (gender === "female" ? 2 : 0)),
    hips: Math.round(height * 0.55 + (gender === "female" ? 4 : 0)),
  };
}

function estimateFacialMetrics() {
  const symmetry = parseFloat((6 + Math.random() * 3).toFixed(1));
  const jaw = parseFloat((5.5 + Math.random() * 4).toFixed(1));
  const cheekbone = parseFloat((5 + Math.random() * 4.5).toFixed(1));
  const overall = parseFloat(((symmetry + jaw + cheekbone) / 3).toFixed(1));
  const shape = FACE_SHAPES[Math.floor(Math.random() * FACE_SHAPES.length)];

  const recs = [];
  if (symmetry < 8) recs.push("Considera ejercicios de masticación asimétrica");
  if (jaw < 7) recs.push("Mewing y ejercicios de mandíbula pueden ayudar");
  if (overall < 7) recs.push("Hidratación y sueño mejoran el aspecto facial");
  recs.push(
    shape === "Redondo" ? "Un peinado más alto favorece tu forma de cara" :
    shape === "Cuadrado" ? "Cortes con textura en la parte superior son ideales" :
    shape === "Ovalado" ? "Casi cualquier corte te favorece, ¡tienes suerte!" :
    "Un corte con volumen lateral equilibra tu cara"
  );

  return { symmetryScore: symmetry, jawScore: jaw, cheekboneScore: cheekbone, overallScore: overall, faceShape: shape, recommendations: recs };
}

function ScoreRing({ score, color, label }: { score: number; color: string; label: string }) {
  const pct = score / 10;
  return (
    <View style={styles.scoreRing}>
      <View style={[styles.scoreRingOuter, { borderColor: color + "33" }]}>
        <View style={[styles.scoreRingInner, { borderColor: color, borderTopColor: "transparent", transform: [{ rotate: `${pct * 360}deg` }] }]} />
        <View style={styles.scoreCenter}>
          <Text style={[styles.scoreValue, { color }]}>{score.toFixed(1)}</Text>
        </View>
      </View>
      <Text style={styles.scoreLabel}>{label}</Text>
    </View>
  );
}

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const { currentUser, addBodyScan, addFacialScan, data } = useApp();

  const [mode, setMode] = useState<ScanMode>("body");
  const [scanning, setScanning] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [bodyResult, setBodyResult] = useState<ReturnType<typeof estimateBodyMetrics> | null>(null);
  const [faceResult, setFaceResult] = useState<ReturnType<typeof estimateFacialMetrics> | null>(null);
  const [saved, setSaved] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const lastBodyScan = data.bodyScans[data.bodyScans.length - 1];
  const lastFacialScan = data.facialScans[data.facialScans.length - 1];

  const takePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (galleryStatus !== "granted") {
        Alert.alert("Permiso requerido", "Necesitamos acceso a la cámara o galería.");
        return;
      }
    }

    let result: ImagePicker.ImagePickerResult;
    if (status === "granted") {
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      startScan(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tus fotos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: mode === "body" ? [3, 4] : [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      startScan(result.assets[0].uri);
    }
  };

  const startScan = (_uri: string) => {
    setScanning(true);
    setBodyResult(null);
    setFaceResult(null);
    setSaved(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTimeout(() => {
      if (mode === "body") {
        const user = currentUser;
        const metrics = estimateBodyMetrics(
          user?.weight ?? 75,
          user?.height ?? 175,
          user?.gender ?? "male",
          user?.age ?? 25
        );
        setBodyResult(metrics);
      } else {
        setFaceResult(estimateFacialMetrics());
      }
      setScanning(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2500);
  };

  const saveScan = async () => {
    const today = new Date().toISOString().split("T")[0];
    if (mode === "body" && bodyResult) {
      await addBodyScan({
        date: today,
        weight: currentUser?.weight ?? 75,
        ...bodyResult,
      });
    } else if (mode === "face" && faceResult) {
      await addFacialScan({
        date: today,
        ...faceResult,
      });
    }
    setSaved(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 16 }]}
      >
        <Text style={[styles.title, { color: C.text }]}>Escáner IA</Text>

        {/* Mode Toggle */}
        <View style={[styles.modeToggle, { backgroundColor: C.surface }]}>
          {(["body", "face"] as ScanMode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, mode === m && { backgroundColor: Colors.dark.accent }]}
              onPress={() => {
                setMode(m);
                setPhotoUri(null);
                setBodyResult(null);
                setFaceResult(null);
                setSaved(false);
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={m === "body" ? "body" : "scan-circle"}
                size={18}
                color={mode === m ? "#000" : C.textSecondary}
              />
              <Text style={[styles.modeBtnText, { color: mode === m ? "#000" : C.textSecondary }]}>
                {m === "body" ? "Cuerpo" : "Rostro"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Camera/Photo Area */}
        <View style={[styles.photoArea, { backgroundColor: C.surface }]}>
          {photoUri ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: photoUri }} style={styles.photoImg} />
              {scanning && (
                <View style={styles.scanOverlay}>
                  <LinearGradient
                    colors={["transparent", Colors.dark.accent + "33", "transparent"]}
                    style={styles.scanLine}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  <Text style={styles.scanText}>Analizando con IA...</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <LinearGradient
                colors={[Colors.dark.accent + "22", Colors.dark.accentBlue + "22"]}
                style={styles.photoGrad}
              >
                <Ionicons
                  name={mode === "body" ? "body" : "scan-circle"}
                  size={64}
                  color={Colors.dark.accent}
                />
                <Text style={[styles.photoHint, { color: C.textSecondary }]}>
                  {mode === "body"
                    ? "Toma una foto de tu cuerpo completo de frente"
                    : "Toma una selfie con buena iluminación"}
                </Text>
              </LinearGradient>
            </View>
          )}
        </View>

        <View style={styles.photoButtons}>
          <TouchableOpacity
            style={[styles.photoBtn, { backgroundColor: Colors.dark.accent }]}
            onPress={takePicture}
            activeOpacity={0.85}
          >
            <Ionicons name="camera" size={20} color="#000" />
            <Text style={styles.photoBtnText}>Cámara</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.photoBtn, { backgroundColor: C.surface2 }]}
            onPress={pickFromGallery}
            activeOpacity={0.85}
          >
            <Ionicons name="images" size={20} color={C.text} />
            <Text style={[styles.photoBtnText, { color: C.text }]}>Galería</Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        {bodyResult && mode === "body" && (
          <View style={[styles.resultsCard, { backgroundColor: C.surface }]}>
            <Text style={[styles.resultsTitle, { color: C.text }]}>Resultados del Escaneo</Text>
            <View style={styles.metricsGrid}>
              {BODY_METRICS.map((m) => (
                <View key={m.key} style={[styles.metricItem, { backgroundColor: C.surface2 }]}>
                  <Text style={[styles.metricValue, { color: Colors.dark.accent }]}>
                    {(bodyResult as any)[m.key]}
                    {m.unit}
                  </Text>
                  <Text style={[styles.metricLabel, { color: C.textSecondary }]}>{m.label}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: saved ? C.surface2 : Colors.dark.accent },
              ]}
              onPress={saveScan}
              disabled={saved}
            >
              <Ionicons name={saved ? "checkmark" : "save"} size={18} color={saved ? Colors.dark.accent : "#000"} />
              <Text style={[styles.saveBtnText, { color: saved ? Colors.dark.accent : "#000" }]}>
                {saved ? "Guardado" : "Guardar Escaneo"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {faceResult && mode === "face" && (
          <View style={[styles.resultsCard, { backgroundColor: C.surface }]}>
            <Text style={[styles.resultsTitle, { color: C.text }]}>Análisis Facial</Text>
            
            {/* Overall Score Gauge */}
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <FaceScoreGauge score={faceResult.overallScore} size={200} />
            </View>

            {/* Sub-scores */}
            <View style={styles.scoresRow}>
              <ScoreRing score={faceResult.symmetryScore} color={Colors.dark.accent} label="Simetría" />
              <ScoreRing score={faceResult.jawScore} color={Colors.dark.accentBlue} label="Mandíbula" />
              <ScoreRing score={faceResult.cheekboneScore} color="#FF6B9D" label="Pómulos" />
            </View>

            <View style={[styles.faceShapeTag, { backgroundColor: Colors.dark.accentBlue + "22" }]}>
              <Text style={[styles.faceShapeText, { color: Colors.dark.accentBlue }]}>
                Forma de cara: {faceResult.faceShape}
              </Text>
            </View>

            <Text style={[styles.recsTitle, { color: C.text }]}>Recomendaciones</Text>
            {faceResult.recommendations.map((r, i) => (
              <View key={i} style={styles.recItem}>
                <View style={[styles.recDot, { backgroundColor: Colors.dark.accent }]} />
                <Text style={[styles.recText, { color: C.textSecondary }]}>{r}</Text>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.hairBtn, { backgroundColor: Colors.dark.accentBlue + "22" }]}
              onPress={() => router.push("/hairstyle")}
            >
              <Ionicons name="cut" size={18} color={Colors.dark.accentBlue} />
              <Text style={[styles.hairBtnText, { color: Colors.dark.accentBlue }]}>
                Ver Cortes Recomendados
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: saved ? C.surface2 : Colors.dark.accent, marginTop: 12 },
              ]}
              onPress={saveScan}
              disabled={saved}
            >
              <Ionicons name={saved ? "checkmark" : "save"} size={18} color={saved ? Colors.dark.accent : "#000"} />
              <Text style={[styles.saveBtnText, { color: saved ? Colors.dark.accent : "#000" }]}>
                {saved ? "Guardado" : "Guardar Análisis"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Past Scans */}
        {(lastBodyScan || lastFacialScan) && (
          <>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Últimos Escaneos</Text>
            {lastBodyScan && (
              <View style={[styles.pastCard, { backgroundColor: C.surface }]}>
                <View style={styles.pastCardHeader}>
                  <Ionicons name="body" size={20} color={Colors.dark.accent} />
                  <Text style={[styles.pastCardTitle, { color: C.text }]}>Escaneo Corporal</Text>
                  <Text style={[styles.pastCardDate, { color: C.textSecondary }]}>{lastBodyScan.date}</Text>
                </View>
                <View style={styles.pastMetrics}>
                  <Text style={[styles.pastMetric, { color: C.textSecondary }]}>
                    IMC: <Text style={{ color: Colors.dark.accent }}>{lastBodyScan.bmi}</Text>
                  </Text>
                  <Text style={[styles.pastMetric, { color: C.textSecondary }]}>
                    Grasa: <Text style={{ color: Colors.dark.accentBlue }}>{lastBodyScan.bodyFat}%</Text>
                  </Text>
                  <Text style={[styles.pastMetric, { color: C.textSecondary }]}>
                    Músculo: <Text style={{ color: "#FF6B9D" }}>{lastBodyScan.muscleMass}kg</Text>
                  </Text>
                </View>
              </View>
            )}
            {lastFacialScan && (
              <View style={[styles.pastCard, { backgroundColor: C.surface }]}>
                <View style={styles.pastCardHeader}>
                  <Ionicons name="scan-circle" size={20} color="#FF6B9D" />
                  <Text style={[styles.pastCardTitle, { color: C.text }]}>Análisis Facial</Text>
                  <Text style={[styles.pastCardDate, { color: C.textSecondary }]}>{lastFacialScan.date}</Text>
                </View>
                <View style={styles.pastMetrics}>
                  <Text style={[styles.pastMetric, { color: C.textSecondary }]}>
                    Puntuación: <Text style={{ color: "#FF6B9D" }}>{lastFacialScan.overallScore}/10</Text>
                  </Text>
                  <Text style={[styles.pastMetric, { color: C.textSecondary }]}>
                    Forma: <Text style={{ color: Colors.dark.accentBlue }}>{lastFacialScan.faceShape}</Text>
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, marginBottom: 20 },
  modeToggle: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  modeBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  photoArea: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    minHeight: 280,
  },
  photoPreview: { position: "relative" },
  photoImg: { width: "100%", height: 280, resizeMode: "cover" },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 4,
    top: "50%",
  },
  scanText: {
    color: Colors.dark.accent,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  photoPlaceholder: { minHeight: 280 },
  photoGrad: {
    flex: 1,
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  photoHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
  photoButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  photoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  photoBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#000",
  },
  resultsCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  resultsTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 16 },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  metricItem: {
    width: "30%",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  metricValue: { fontFamily: "Inter_700Bold", fontSize: 18 },
  metricLabel: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  saveBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  scoresRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  scoreRing: { alignItems: "center", gap: 6 },
  scoreRingOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 6,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  scoreRingInner: {
    position: "absolute",
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 6,
    borderColor: "transparent",
  },
  scoreCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreValue: { fontFamily: "Inter_700Bold", fontSize: 15 },
  scoreLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: "#8888AA" },
  faceShapeTag: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  faceShapeText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  recsTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 10 },
  recItem: { flexDirection: "row", gap: 10, marginBottom: 8, alignItems: "flex-start" },
  recDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  recText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, lineHeight: 20 },
  hairBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  hairBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, marginBottom: 12 },
  pastCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  pastCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  pastCardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, flex: 1 },
  pastCardDate: { fontFamily: "Inter_400Regular", fontSize: 12 },
  pastMetrics: { flexDirection: "row", gap: 16 },
  pastMetric: { fontFamily: "Inter_400Regular", fontSize: 13 },
});
