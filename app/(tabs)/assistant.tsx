import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";
import { getApiUrl } from "@/lib/query-client";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "¿Qué debería comer hoy?",
  "Necesito una rutina para principiantes",
  "¿Cómo mejorar mi descanso?",
  "Consejos para ganar músculo",
];

function TypingIndicator({ color }: { color: string }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );
    const a1 = anim(dot1, 0);
    const a2 = anim(dot2, 200);
    const a3 = anim(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={typingStyles.container}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            typingStyles.dot,
            { backgroundColor: color, opacity: dot, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] },
          ]}
        />
      ))}
    </View>
  );
}

const typingStyles = StyleSheet.create({
  container: { flexDirection: "row", gap: 5, padding: 12, alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

function MessageBubble({ msg, C }: { msg: ChatMessage; C: typeof Colors.dark }) {
  const isUser = msg.role === "user";
  return (
    <View style={[bubbleStyles.row, isUser && bubbleStyles.rowUser]}>
      {!isUser && (
        <LinearGradient
          colors={[Colors.dark.accent + "33", Colors.dark.accentBlue + "22"]}
          style={bubbleStyles.avatar}
        >
          <Ionicons name="sparkles" size={16} color={Colors.dark.accent} />
        </LinearGradient>
      )}
      <View
        style={[
          bubbleStyles.bubble,
          isUser
            ? { backgroundColor: Colors.dark.accent, borderBottomRightRadius: 4 }
            : { backgroundColor: C.surface, borderBottomLeftRadius: 4 },
        ]}
      >
        <Text style={[bubbleStyles.text, { color: isUser ? "#000" : C.text }]}>
          {msg.content}
        </Text>
      </View>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 12 },
  rowUser: { flexDirection: "row-reverse" },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  bubble: { maxWidth: "75%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  text: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22 },
});

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const { currentUser } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `¡Hola${currentUser ? `, ${currentUser.name.split(" ")[0]}` : ""}! 👋 Soy Vitalis, tu asistente de salud y fitness. ¿En qué puedo ayudarte hoy?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    setInput("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: ChatMessage = {
      id: Date.now().toString() + "_user",
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [userMsg, ...prev]);
    setIsTyping(true);

    try {
      const history = messages
        .slice(0, 10)
        .reverse()
        .map((m) => ({ role: m.role, content: m.content }));

      const apiBase = getApiUrl();
      const url = new URL("/api/ai/chat", apiBase).toString();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, { role: "user", content: trimmed }],
          userProfile: currentUser
            ? {
                name: currentUser.name,
                weight: currentUser.weight,
                height: currentUser.height,
                age: currentUser.age,
                goal: currentUser.goal,
                activityLevel: currentUser.activityLevel,
              }
            : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Error del servidor");
      }

      const data = await res.json() as { reply: string };
      const assistantMsg: ChatMessage = {
        id: Date.now().toString() + "_ai",
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [assistantMsg, ...prev]);
    } catch (e: any) {
      const errMsg: ChatMessage = {
        id: Date.now().toString() + "_err",
        role: "assistant",
        content: "Lo siento, hubo un problema al conectar con el asistente. Por favor intenta más tarde.",
        timestamp: new Date(),
      };
      setMessages((prev) => [errMsg, ...prev]);
    } finally {
      setIsTyping(false);
    }
  }, [messages, isTyping, currentUser]);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <LinearGradient
        colors={["#0A0A0F", "#13131A"]}
        style={[styles.headerGrad, { paddingTop: topInset + 8 }]}
      >
        <View style={styles.header}>
          <LinearGradient
            colors={[Colors.dark.accent + "44", Colors.dark.accentBlue + "33"]}
            style={styles.headerAvatar}
          >
            <Ionicons name="sparkles" size={20} color={Colors.dark.accent} />
          </LinearGradient>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.headerName, { color: C.text }]}>Vitalis AI</Text>
            <Text style={[styles.headerSub, { color: Colors.dark.accent }]}>
              {isTyping ? "escribiendo..." : "Asistente de salud"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble msg={item} C={C} />}
          inverted
          contentContainerStyle={[styles.listContent, { paddingBottom: 16 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            isTyping ? (
              <View style={[styles.typingBubble, { backgroundColor: C.surface }]}>
                <TypingIndicator color={Colors.dark.accent} />
              </View>
            ) : null
          }
          ListFooterComponent={
            messages.length === 1 ? (
              <View style={styles.suggestionsWrap}>
                <Text style={[styles.suggestTitle, { color: C.textSecondary }]}>
                  Sugerencias
                </Text>
                <View style={styles.suggestGrid}>
                  {SUGGESTIONS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.suggestChip, { backgroundColor: C.surface, borderColor: C.border }]}
                      onPress={() => sendMessage(s)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.suggestText, { color: C.text }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null
          }
        />

        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: C.surface,
              paddingBottom: Math.max(bottomInset, 8) + 4,
              borderTopColor: C.border,
            },
          ]}
        >
          <TextInput
            style={[styles.textInput, { color: C.text, backgroundColor: C.background }]}
            value={input}
            onChangeText={setInput}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={C.textSecondary}
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor: input.trim() && !isTyping ? Colors.dark.accent : C.border,
              },
            ]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-up"
              size={20}
              color={input.trim() && !isTyping ? "#000" : C.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 20, paddingBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTextWrap: {},
  headerName: { fontFamily: "Inter_700Bold", fontSize: 18 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  listContent: { paddingHorizontal: 16, paddingTop: 16 },
  typingBubble: {
    alignSelf: "flex-start", borderRadius: 18, borderBottomLeftRadius: 4, marginBottom: 12, marginLeft: 40,
  },
  suggestionsWrap: { paddingHorizontal: 4, paddingBottom: 8, marginTop: 8 },
  suggestTitle: { fontFamily: "Inter_500Medium", fontSize: 12, marginBottom: 10, textAlign: "center" },
  suggestGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  suggestChip: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1,
  },
  suggestText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    paddingHorizontal: 16, paddingTop: 10,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    fontFamily: "Inter_400Regular", fontSize: 15, maxHeight: 120,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    marginBottom: 2,
  },
});
