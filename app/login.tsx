import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { getApiUrl } from "@/lib/query-client";

const { width } = Dimensions.get("window");

interface Props {
  onAuth: (userData: any, token: string) => void;
}

export default function LoginScreen({ onAuth }: Props) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [mode, setMode] = useState<"login" | "register">("register");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkUsername = useCallback(async (val: string) => {
    const clean = val.trim().toLowerCase();
    if (clean.length < 3) {
      setUsernameStatus("invalid");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(clean)) {
      setUsernameStatus("invalid");
      return;
    }
    setUsernameStatus("checking");
    try {
      const apiBase = getApiUrl();
      const res = await fetch(new URL(`/api/auth/check-username/${clean}`, apiBase).toString());
      const data = await res.json();
      setUsernameStatus(data.available ? "available" : "taken");
    } catch {
      setUsernameStatus("idle");
    }
  }, []);

  const handleUsernameChange = (val: string) => {
    const clean = val.replace(/[^a-zA-Z0-9_]/g, "").substring(0, 20);
    setUsername(clean);
    setError("");
    if (clean.length >= 3) {
      checkUsername(clean);
    } else {
      setUsernameStatus(clean.length > 0 ? "invalid" : "idle");
    }
  };

  const handleSubmit = async () => {
    const clean = username.trim().toLowerCase();
    if (clean.length < 3) {
      setError("Mínimo 3 caracteres");
      return;
    }
    setLoading(true);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const apiBase = getApiUrl();
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body = mode === "register"
        ? { username: clean, name: clean }
        : { username: clean };

      const res = await fetch(new URL(endpoint, apiBase).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404 && mode === "login") {
          setError("Usuario no encontrado. Cámbiate a Registrarse.");
        } else if (res.status === 409 && mode === "register") {
          setError("Ya existe. Cámbiate a Iniciar Sesión.");
        } else {
          setError(data.error || "Error al procesar");
        }
        return;
      }

      if (!data.token || !data.user) {
        setError("Respuesta inesperada del servidor");
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAuth(data.user, data.token);
    } catch (e: any) {
      console.log("Auth error:", e?.message || e);
      setError("Error de conexión. Verifica tu internet.");
    } finally {
      setLoading(false);
    }
  };

  const statusIcon = () => {
    if (mode === "login") return null;
    switch (usernameStatus) {
      case "checking": return <ActivityIndicator size="small" color={Colors.dark.accent} />;
      case "available": return <Ionicons name="checkmark-circle" size={22} color={Colors.dark.accent} />;
      case "taken": return <Ionicons name="close-circle" size={22} color="#FF6B6B" />;
      case "invalid": return <Ionicons name="alert-circle" size={22} color={Colors.dark.warning} />;
      default: return null;
    }
  };

  const statusText = () => {
    if (mode === "login") return null;
    switch (usernameStatus) {
      case "available": return <Text style={[styles.statusText, { color: Colors.dark.accent }]}>Disponible</Text>;
      case "taken": return <Text style={[styles.statusText, { color: "#FF6B6B" }]}>Ya existe</Text>;
      case "invalid": return <Text style={[styles.statusText, { color: Colors.dark.warning }]}>Solo letras, números y _ (mín. 3)</Text>;
      default: return null;
    }
  };

  const canSubmit = username.trim().length >= 3 && usernameStatus !== "taken";

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0A0A0F", "#0D1A12", "#0A0A0F"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glowTop, { top: topInset + 40 }]} />
      <View style={styles.glowBottom} />

      <View style={[styles.content, { paddingTop: topInset + 60, paddingBottom: bottomInset + 30 }]}>
        <View style={styles.heroSection}>
          <LinearGradient
            colors={[Colors.dark.accent + "33", Colors.dark.accentBlue + "22"]}
            style={styles.logoContainer}
          >
            <LinearGradient
              colors={[Colors.dark.accent, Colors.dark.accentBlue]}
              style={styles.logoInner}
            >
              <Ionicons name="pulse" size={44} color="#000" />
            </LinearGradient>
          </LinearGradient>

          <Text style={styles.appName}>Vitalis AI</Text>
          <Text style={styles.tagline}>Tu compañero de salud inteligente</Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === "register" && styles.modeBtnActive]}
              onPress={() => { setMode("register"); setError(""); }}
            >
              <Text style={[styles.modeBtnText, mode === "register" && styles.modeBtnTextActive]}>Registrarse</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === "login" && styles.modeBtnActive]}
              onPress={() => { setMode("login"); setError(""); }}
            >
              <Text style={[styles.modeBtnText, mode === "login" && styles.modeBtnTextActive]}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Nombre de usuario</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputPrefix}>
                <Text style={styles.prefixText}>@</Text>
              </View>
              <TextInput
                style={styles.textInput}
                value={username}
                onChangeText={handleUsernameChange}
                placeholder="tu_nombre"
                placeholderTextColor={Colors.dark.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
              <View style={styles.inputStatus}>
                {statusIcon()}
              </View>
            </View>
            {statusText()}
            {!!error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { opacity: canSubmit && !loading ? 1 : 0.5 }]}
            onPress={handleSubmit}
            disabled={!canSubmit || loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.dark.accent, "#00CC6A"]}
              style={styles.submitBtnGrad}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>
                    {mode === "register" ? "Crear cuenta" : "Entrar"}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#000" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            {mode === "register"
              ? "Crea un nombre de usuario único para guardar tu progreso"
              : "Ingresa tu nombre de usuario para acceder a tu cuenta"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0F" },
  glowTop: {
    position: "absolute", left: width / 2 - 150,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: Colors.dark.accent + "18",
  },
  glowBottom: {
    position: "absolute", bottom: 80, right: -50,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: Colors.dark.accentBlue + "12",
  },
  content: { flex: 1, paddingHorizontal: 28, justifyContent: "space-between" },
  heroSection: { alignItems: "center" },
  logoContainer: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  logoInner: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: "center", justifyContent: "center",
  },
  appName: { fontSize: 38, fontFamily: "Inter_700Bold", color: "#FFF", letterSpacing: -1, marginBottom: 8 },
  tagline: { fontSize: 16, fontFamily: "Inter_400Regular", color: Colors.dark.textSecondary, textAlign: "center" },
  formSection: { gap: 16 },
  modeToggle: {
    flexDirection: "row", backgroundColor: Colors.dark.surface,
    borderRadius: 14, padding: 4,
  },
  modeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  modeBtnActive: { backgroundColor: Colors.dark.accent + "22" },
  modeBtnText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.dark.textSecondary },
  modeBtnTextActive: { color: Colors.dark.accent },
  inputSection: { gap: 8 },
  inputLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.dark.textSecondary },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.dark.surface, borderRadius: 14, overflow: "hidden",
  },
  inputPrefix: {
    paddingHorizontal: 14, paddingVertical: 16,
    backgroundColor: Colors.dark.accent + "15",
  },
  prefixText: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.dark.accent },
  textInput: {
    flex: 1, paddingHorizontal: 12, paddingVertical: 16,
    fontFamily: "Inter_400Regular", fontSize: 16, color: "#FFF",
  },
  inputStatus: { paddingRight: 14, width: 40, alignItems: "center" },
  statusText: { fontFamily: "Inter_400Regular", fontSize: 12, marginLeft: 4 },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#FF6B6B" },
  submitBtn: { borderRadius: 16, overflow: "hidden" },
  submitBtnGrad: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, gap: 8,
  },
  submitBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: "#000" },
  disclaimer: {
    fontSize: 12, fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary + "99", textAlign: "center", lineHeight: 18,
  },
});
