import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import Constants from "expo-constants";

function SettingRow({
  icon, color, label, subtitle, value, onPress, rightElement,
}: {
  icon: string; color: string; label: string; subtitle?: string;
  value?: boolean; onPress?: () => void; rightElement?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && value === undefined}
    >
      <View style={[styles.settingIcon, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
      </View>
      {rightElement !== undefined ? rightElement : (
        onPress ? <Ionicons name="chevron-forward" size={18} color={Colors.dark.textSecondary} /> : null
      )}
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const { data, currentUser, settings, updateSettings, clearAllData } = useApp();
  const { user: authUser, isAuthenticated, signOut } = useAuth();

  const version = Constants.expoConfig?.version ?? "1.0.0";

  const handleExportData = async () => {
    try {
      const json = JSON.stringify(data, null, 2);
      if (Platform.OS === "web") {
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "vitalis_data.json";
        a.click();
      } else {
        await Share.share({ message: json, title: "Vitalis AI — Datos exportados" });
      }
    } catch (e) {
      Alert.alert("Error", "No se pudo exportar los datos");
    }
  };

  const handleClearData = () => {
    Alert.alert(
      "Borrar todos los datos",
      "Esto eliminará permanentemente todos tus datos de salud, entrenamientos y nutrición. ¿Estás seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar",
          style: "destructive",
          onPress: async () => {
            await clearAllData();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.replace("/onboarding");
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      "Cerrar sesión",
      "Tus datos locales se mantendrán en este dispositivo. ¿Cerrar sesión de Google?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            await signOut();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 8 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.dark.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ajustes</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Account */}
        <Section title="Cuenta">
          {isAuthenticated && authUser ? (
            <>
              <View style={styles.accountRow}>
                <LinearGradient
                  colors={[Colors.dark.accent, Colors.dark.accentBlue]}
                  style={styles.accountAvatar}
                >
                  <Text style={styles.accountAvatarText}>
                    {authUser.name.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{authUser.name}</Text>
                  <Text style={styles.accountEmail}>{authUser.email}</Text>
                  <View style={styles.syncBadge}>
                    <Ionicons name="cloud-done" size={12} color={Colors.dark.accent} />
                    <Text style={styles.syncText}>Datos sincronizados</Text>
                  </View>
                </View>
              </View>
              <View style={styles.divider} />
              <SettingRow
                icon="log-out"
                color="#FF6B9D"
                label="Cerrar sesión"
                onPress={handleSignOut}
              />
            </>
          ) : (
            <View style={styles.notLoggedIn}>
              <Ionicons name="person-circle" size={48} color={Colors.dark.textSecondary} />
              <Text style={styles.notLoggedInText}>Sin cuenta Google</Text>
              <Text style={styles.notLoggedInSub}>
                Inicia sesión para sincronizar tus datos entre dispositivos
              </Text>
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => router.back()}
              >
                <Text style={styles.loginBtnText}>Conectar con Google</Text>
              </TouchableOpacity>
            </View>
          )}
        </Section>

        {/* Goals */}
        <Section title="Objetivos Diarios">
          <SettingRow
            icon="walk"
            color={Colors.dark.accent}
            label="Meta de pasos"
            subtitle={`${(settings.stepGoal || 10000).toLocaleString()} pasos/día`}
            onPress={() => {
              Alert.prompt?.("Meta de pasos", "Introduce tu objetivo de pasos diarios", (val) => {
                const n = parseInt(val);
                if (!isNaN(n) && n > 0) updateSettings({ stepGoal: n });
              }, "plain-text", String(settings.stepGoal || 10000), "number-pad");
            }}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="water"
            color={Colors.dark.accentBlue}
            label="Meta de agua"
            subtitle={`${settings.waterGoal || 8} vasos/día`}
            onPress={() => {
              Alert.prompt?.("Meta de agua", "¿Cuántos vasos de agua al día?", (val) => {
                const n = parseInt(val);
                if (!isNaN(n) && n > 0) updateSettings({ waterGoal: n });
              }, "plain-text", String(settings.waterGoal || 8), "number-pad");
            }}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="flame"
            color="#FF6B9D"
            label="Meta de calorías"
            subtitle={`${(settings.calorieGoal || 2000).toLocaleString()} kcal/día`}
            onPress={() => {
              Alert.prompt?.("Meta de calorías", "¿Cuántas calorías al día?", (val) => {
                const n = parseInt(val);
                if (!isNaN(n) && n > 0) updateSettings({ calorieGoal: n });
              }, "plain-text", String(settings.calorieGoal || 2000), "number-pad");
            }}
          />
        </Section>

        {/* Units */}
        <Section title="Unidades">
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: Colors.dark.accentBlue + "22" }]}>
              <Ionicons name="scale" size={20} color={Colors.dark.accentBlue} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Peso</Text>
            </View>
            <View style={styles.segmentControl}>
              {(["kg", "lbs"] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.segment, settings.weightUnit === u && styles.segmentActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateSettings({ weightUnit: u });
                  }}
                >
                  <Text style={[styles.segmentText, settings.weightUnit === u && styles.segmentTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: Colors.dark.accent + "22" }]}>
              <Ionicons name="navigate" size={20} color={Colors.dark.accent} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Distancia</Text>
            </View>
            <View style={styles.segmentControl}>
              {(["km", "mi"] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.segment, settings.distanceUnit === u && styles.segmentActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateSettings({ distanceUnit: u });
                  }}
                >
                  <Text style={[styles.segmentText, settings.distanceUnit === u && styles.segmentTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Section>

        {/* Notifications */}
        <Section title="Notificaciones">
          <SettingRow
            icon="water-outline"
            color={Colors.dark.accentBlue}
            label="Recordatorio de agua"
            subtitle="Cada 2 horas"
            rightElement={
              <Switch
                value={settings.notifyWater ?? false}
                onValueChange={(v) => updateSettings({ notifyWater: v })}
                trackColor={{ false: Colors.dark.surface3, true: Colors.dark.accentBlue + "88" }}
                thumbColor={settings.notifyWater ? Colors.dark.accentBlue : Colors.dark.textSecondary}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="barbell"
            color={Colors.dark.accent}
            label="Recordatorio de entreno"
            subtitle="Diariamente"
            rightElement={
              <Switch
                value={settings.notifyWorkout ?? false}
                onValueChange={(v) => updateSettings({ notifyWorkout: v })}
                trackColor={{ false: Colors.dark.surface3, true: Colors.dark.accent + "88" }}
                thumbColor={settings.notifyWorkout ? Colors.dark.accent : Colors.dark.textSecondary}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="footsteps"
            color="#FF6B9D"
            label="Meta de pasos"
            subtitle="Al llegar a tu objetivo"
            rightElement={
              <Switch
                value={settings.notifySteps ?? true}
                onValueChange={(v) => updateSettings({ notifySteps: v })}
                trackColor={{ false: Colors.dark.surface3, true: "#FF6B9D88" }}
                thumbColor={settings.notifySteps !== false ? "#FF6B9D" : Colors.dark.textSecondary}
              />
            }
          />
        </Section>

        {/* Data */}
        <Section title="Datos">
          <SettingRow
            icon="download"
            color={Colors.dark.accent}
            label="Exportar datos"
            subtitle="Descarga todo en JSON"
            onPress={handleExportData}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="trash"
            color="#FF6B9D"
            label="Borrar todos los datos"
            subtitle="Acción irreversible"
            onPress={handleClearData}
          />
        </Section>

        {/* App Info */}
        <Section title="Aplicación">
          <SettingRow
            icon="information-circle"
            color={Colors.dark.accentBlue}
            label="Versión"
            subtitle={`Vitalis AI v${version}`}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="document-text"
            color={Colors.dark.textSecondary}
            label="Términos de uso"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="shield-checkmark"
            color={Colors.dark.textSecondary}
            label="Política de privacidad"
            onPress={() => {}}
          />
        </Section>

        {/* Build APK Banner */}
        <TouchableOpacity style={styles.apkBanner} activeOpacity={0.8}>
          <LinearGradient
            colors={[Colors.dark.accent + "22", Colors.dark.accentBlue + "11"]}
            style={styles.apkBannerGradient}
          >
            <Ionicons name="phone-portrait" size={28} color={Colors.dark.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.apkBannerTitle}>Instalar en Android</Text>
              <Text style={styles.apkBannerSub}>Consulta BUILD_GUIDE.md para generar el APK con EAS Build</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scroll: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.text,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.text,
  },
  settingSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginLeft: 66,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  accountAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  accountAvatarText: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#000",
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  accountEmail: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  syncText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.accent,
  },
  notLoggedIn: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 6,
  },
  notLoggedInText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
    marginTop: 4,
  },
  notLoggedInSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 8,
  },
  loginBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.dark.accent + "22",
    borderWidth: 1,
    borderColor: Colors.dark.accent + "44",
  },
  loginBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.accent,
  },
  segmentControl: {
    flexDirection: "row",
    backgroundColor: Colors.dark.surface2,
    borderRadius: 8,
    overflow: "hidden",
  },
  segment: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  segmentActive: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 8,
  },
  segmentText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
  },
  segmentTextActive: {
    color: "#000",
    fontFamily: "Inter_700Bold",
  },
  apkBanner: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 4,
  },
  apkBannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.dark.accent + "33",
    borderRadius: 16,
  },
  apkBannerTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.accent,
  },
  apkBannerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
});
