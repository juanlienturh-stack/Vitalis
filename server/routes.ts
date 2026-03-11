import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import pool from "./db";
import { signToken, requireAuth, JwtPayload } from "./auth";
import OpenAI from "openai";

function getOpenAI(): OpenAI | null {
  const key = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({
    apiKey: key,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
}

type AuthRequest = Request & { user?: JwtPayload };

async function verifyGoogleToken(accessToken: string): Promise<{ googleId: string; email: string; name: string; picture?: string } | null> {
  try {
    const res = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`);
    if (!res.ok) return null;
    const data = await res.json() as any;
    if (!data.email) return null;
    return {
      googleId: data.id,
      email: data.email,
      name: data.name || data.email.split("@")[0],
      picture: data.picture,
    };
  } catch {
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {

  // ─── AUTH ──────────────────────────────────────────────────────────────────

  app.get("/api/auth/check-username/:username", async (req: Request, res: Response) => {
    try {
      const username = req.params.username?.trim().toLowerCase();
      if (!username || username.length < 3) return res.json({ available: false, error: "Mínimo 3 caracteres" });
      if (!/^[a-z0-9_]+$/.test(username)) return res.json({ available: false, error: "Solo letras, números y guion bajo" });
      const result = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
      return res.json({ available: result.rows.length === 0 });
    } catch (e: any) {
      console.error("Check username error:", e.message);
      return res.json({ available: false, error: "Error de servidor" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, name, age, gender, height, weight, goalWeight, activityLevel, goal } = req.body;
      if (!username) return res.status(400).json({ error: "Usuario requerido" });
      const clean = username.trim().toLowerCase();
      const displayName = name || clean;
      if (clean.length < 3) return res.status(400).json({ error: "Mínimo 3 caracteres" });
      if (!/^[a-z0-9_]+$/.test(clean)) return res.status(400).json({ error: "Solo letras, números y guion bajo" });

      const existing = await pool.query("SELECT id FROM users WHERE username = $1", [clean]);
      if (existing.rows.length > 0) return res.status(409).json({ error: "Nombre de usuario ya existe" });

      const existingEmail = await pool.query("SELECT id FROM users WHERE email = $1", [clean + "@vitalis.app"]);
      if (existingEmail.rows.length > 0) return res.status(409).json({ error: "Nombre de usuario ya existe" });

      const email = clean + "@vitalis.app";
      const result = await pool.query(
        `INSERT INTO users (username, name, email, age, gender, height, weight, goal_weight, activity_level, goal)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [clean, displayName, email, age || 25, gender || "other", height || 175, weight || 75, goalWeight || 70, activityLevel || "moderate", goal || "maintain"]
      );
      const user = result.rows[0];
      const token = signToken({ userId: user.id, email, name: user.name });
      return res.json({ token, user: { id: user.id, username: clean, name: user.name } });
    } catch (e: any) {
      console.error("Register error:", e.message, e.code, e.detail);
      if (e.code === "23505") return res.status(409).json({ error: "Nombre de usuario ya existe" });
      return res.status(500).json({ error: "Error al crear usuario: " + (e.message || "desconocido") });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username } = req.body;
      if (!username) return res.status(400).json({ error: "Usuario requerido" });
      const clean = username.trim().toLowerCase();
      const result = await pool.query("SELECT * FROM users WHERE username = $1", [clean]);
      if (result.rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado. ¿Quieres registrarte?" });
      const user = result.rows[0];
      const token = signToken({ userId: user.id, email: user.email || clean + "@vitalis.app", name: user.name });
      return res.json({
        token, user: {
          id: user.id, username: user.username || clean, name: user.name,
          age: user.age, gender: user.gender,
          height: user.height ? parseFloat(user.height) : 175,
          weight: user.weight ? parseFloat(user.weight) : 75,
          goalWeight: user.goal_weight ? parseFloat(user.goal_weight) : 70,
          activityLevel: user.activity_level || "moderate",
          goal: user.goal || "maintain",
        }
      });
    } catch (e: any) {
      console.error("Login error:", e.message);
      return res.status(500).json({ error: "Error al iniciar sesión" });
    }
  });

  app.post("/api/auth/google", async (req: Request, res: Response) => {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ error: "Token requerido" });

    const googleUser = await verifyGoogleToken(accessToken);
    if (!googleUser) return res.status(401).json({ error: "Token de Google inválido" });

    const client = await pool.connect();
    try {
      let userRow = await client.query(
        "SELECT * FROM users WHERE google_id = $1 OR email = $2",
        [googleUser.googleId, googleUser.email]
      );

      let user;
      if (userRow.rows.length === 0) {
        const inserted = await client.query(
          `INSERT INTO users (google_id, email, name, avatar_url)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [googleUser.googleId, googleUser.email, googleUser.name, googleUser.picture || null]
        );
        user = inserted.rows[0];
      } else {
        user = userRow.rows[0];
        await client.query(
          "UPDATE users SET name = $1, avatar_url = $2, updated_at = NOW() WHERE id = $3",
          [googleUser.name, googleUser.picture || user.avatar_url, user.id]
        );
      }

      const token = signToken({ userId: user.id, email: user.email, name: user.name });
      return res.json({ token, user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar_url } });
    } finally {
      client.release();
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    const u = result.rows[0];
    return res.json({
      id: u.id, email: u.email, name: u.name, avatar: u.avatar_url,
      age: u.age, gender: u.gender, height: parseFloat(u.height),
      weight: parseFloat(u.weight), goalWeight: parseFloat(u.goal_weight),
      activityLevel: u.activity_level, goal: u.goal,
    });
  });

  // ─── USER PROFILE ──────────────────────────────────────────────────────────

  app.put("/api/data/user", requireAuth, async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { name, age, gender, height, weight, goalWeight, activityLevel, goal } = req.body;
    await pool.query(
      `UPDATE users SET name=$1, age=$2, gender=$3, height=$4, weight=$5,
       goal_weight=$6, activity_level=$7, goal=$8, updated_at=NOW() WHERE id=$9`,
      [name, age, gender, height, weight, goalWeight, activityLevel, goal, userId]
    );
    return res.json({ ok: true });
  });

  // ─── FULL SYNC ─────────────────────────────────────────────────────────────

  app.get("/api/data/all", requireAuth, async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const [food, workouts, steps, bodyScans, facialScans, water, weights] = await Promise.all([
      pool.query("SELECT * FROM food_entries WHERE user_id=$1 ORDER BY date DESC", [userId]),
      pool.query("SELECT * FROM workout_sessions WHERE user_id=$1 ORDER BY date DESC", [userId]),
      pool.query("SELECT * FROM step_records WHERE user_id=$1 ORDER BY date DESC", [userId]),
      pool.query("SELECT * FROM body_scans WHERE user_id=$1 ORDER BY date DESC", [userId]),
      pool.query("SELECT * FROM facial_scans WHERE user_id=$1 ORDER BY date DESC", [userId]),
      pool.query("SELECT * FROM water_intake WHERE user_id=$1 ORDER BY date DESC", [userId]),
      pool.query("SELECT * FROM weight_log WHERE user_id=$1 ORDER BY date DESC", [userId]),
    ]);
    return res.json({
      foodEntries: food.rows.map((r) => ({
        id: String(r.id), date: r.date, meal: r.meal, name: r.name,
        calories: parseFloat(r.calories), protein: parseFloat(r.protein),
        carbs: parseFloat(r.carbs), fat: parseFloat(r.fat),
        quantity: parseFloat(r.quantity), unit: r.unit,
      })),
      workouts: workouts.rows.map((r) => ({
        id: String(r.id), date: r.date, name: r.name,
        exercises: r.exercises, durationMinutes: r.duration_minutes, notes: r.notes,
      })),
      stepRecords: steps.rows.map((r) => ({
        date: r.date, steps: r.steps,
        distanceKm: parseFloat(r.distance_km), caloriesBurned: parseFloat(r.calories_burned),
      })),
      bodyScans: bodyScans.rows.map((r) => ({
        id: String(r.id), date: r.date,
        weight: parseFloat(r.weight), bodyFat: r.body_fat ? parseFloat(r.body_fat) : undefined,
        muscleMass: r.muscle_mass ? parseFloat(r.muscle_mass) : undefined,
        bmi: r.bmi ? parseFloat(r.bmi) : undefined,
        chest: r.chest ? parseFloat(r.chest) : undefined,
        waist: r.waist ? parseFloat(r.waist) : undefined,
        hips: r.hips ? parseFloat(r.hips) : undefined,
        notes: r.notes,
      })),
      facialScans: facialScans.rows.map((r) => ({
        id: String(r.id), date: r.date,
        symmetryScore: parseFloat(r.symmetry_score),
        jawScore: parseFloat(r.jaw_score),
        cheekboneScore: parseFloat(r.cheekbone_score),
        overallScore: parseFloat(r.overall_score),
        faceShape: r.face_shape, recommendations: r.recommendations,
      })),
      waterIntake: water.rows.map((r) => ({ date: r.date, glasses: r.glasses })),
      weight: weights.rows.map((r) => ({ date: r.date, value: parseFloat(r.value) })),
    });
  });

  app.post("/api/data/sync", requireAuth, async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { foodEntries, workouts, stepRecords, bodyScans, facialScans, waterIntake, weight } = req.body;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      if (foodEntries?.length) {
        for (const e of foodEntries) {
          await client.query(
            `INSERT INTO food_entries (user_id, date, meal, name, calories, protein, carbs, fat, quantity, unit)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING`,
            [userId, e.date, e.meal, e.name, e.calories, e.protein, e.carbs, e.fat, e.quantity, e.unit]
          );
        }
      }
      if (workouts?.length) {
        for (const w of workouts) {
          await client.query(
            `INSERT INTO workout_sessions (user_id, date, name, exercises, duration_minutes, notes)
             VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
            [userId, w.date, w.name, JSON.stringify(w.exercises), w.durationMinutes, w.notes]
          );
        }
      }
      if (stepRecords?.length) {
        for (const s of stepRecords) {
          await client.query(
            `INSERT INTO step_records (user_id, date, steps, distance_km, calories_burned)
             VALUES ($1,$2,$3,$4,$5) ON CONFLICT (user_id, date) DO UPDATE
             SET steps=$3, distance_km=$4, calories_burned=$5`,
            [userId, s.date, s.steps, s.distanceKm, s.caloriesBurned]
          );
        }
      }
      if (waterIntake?.length) {
        for (const w of waterIntake) {
          await client.query(
            `INSERT INTO water_intake (user_id, date, glasses) VALUES ($1,$2,$3)
             ON CONFLICT (user_id, date) DO UPDATE SET glasses=$3`,
            [userId, w.date, w.glasses]
          );
        }
      }
      if (weight?.length) {
        for (const w of weight) {
          await client.query(
            `INSERT INTO weight_log (user_id, date, value) VALUES ($1,$2,$3)
             ON CONFLICT (user_id, date) DO UPDATE SET value=$3`,
            [userId, w.date, w.value]
          );
        }
      }
      await client.query("COMMIT");
      return res.json({ ok: true, synced: true });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Sync error:", err);
      return res.status(500).json({ error: "Error sincronizando datos" });
    } finally {
      client.release();
    }
  });

  // ─── FOOD ──────────────────────────────────────────────────────────────────

  app.get("/api/data/food", requireAuth, async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { date } = req.query;
    const result = date
      ? await pool.query("SELECT * FROM food_entries WHERE user_id=$1 AND date=$2 ORDER BY id DESC", [userId, date])
      : await pool.query("SELECT * FROM food_entries WHERE user_id=$1 ORDER BY date DESC, id DESC", [userId]);
    return res.json(result.rows.map((r) => ({
      id: String(r.id), date: r.date, meal: r.meal, name: r.name,
      calories: parseFloat(r.calories), protein: parseFloat(r.protein),
      carbs: parseFloat(r.carbs), fat: parseFloat(r.fat),
      quantity: parseFloat(r.quantity), unit: r.unit,
    })));
  });

  app.post("/api/data/food", requireAuth, async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { date, meal, name, calories, protein, carbs, fat, quantity, unit } = req.body;
    const result = await pool.query(
      `INSERT INTO food_entries (user_id, date, meal, name, calories, protein, carbs, fat, quantity, unit)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [userId, date, meal, name, calories, protein, carbs, fat, quantity, unit]
    );
    return res.json({ id: String(result.rows[0].id) });
  });

  app.delete("/api/data/food/:id", requireAuth, async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    await pool.query("DELETE FROM food_entries WHERE id=$1 AND user_id=$2", [req.params.id, userId]);
    return res.json({ ok: true });
  });

  // ─── WORKOUTS ──────────────────────────────────────────────────────────────

  app.get("/api/data/workouts", requireAuth, async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const result = await pool.query("SELECT * FROM workout_sessions WHERE user_id=$1 ORDER BY date DESC", [userId]);
    return res.json(result.rows.map((r) => ({
      id: String(r.id), date: r.date, name: r.name,
      exercises: r.exercises, durationMinutes: r.duration_minutes, notes: r.notes,
    })));
  });

  app.post("/api/data/workouts", requireAuth, async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { date, name, exercises, durationMinutes, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO workout_sessions (user_id, date, name, exercises, duration_minutes, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [userId, date, name, JSON.stringify(exercises), durationMinutes, notes]
    );
    return res.json({ id: String(result.rows[0].id) });
  });

  app.delete("/api/data/workouts/:id", requireAuth, async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    await pool.query("DELETE FROM workout_sessions WHERE id=$1 AND user_id=$2", [req.params.id, userId]);
    return res.json({ ok: true });
  });

  // ─── STEPS ─────────────────────────────────────────────────────────────────

  app.get("/api/data/steps", requireAuth, async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const result = await pool.query("SELECT * FROM step_records WHERE user_id=$1 ORDER BY date DESC", [userId]);
    return res.json(result.rows.map((r) => ({
      date: r.date, steps: r.steps,
      distanceKm: parseFloat(r.distance_km), caloriesBurned: parseFloat(r.calories_burned),
    })));
  });

  app.post("/api/data/steps", requireAuth, async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { date, steps, distanceKm, caloriesBurned } = req.body;
    await pool.query(
      `INSERT INTO step_records (user_id, date, steps, distance_km, calories_burned)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id, date) DO UPDATE SET steps=$3, distance_km=$4, calories_burned=$5`,
      [userId, date, steps, distanceKm, caloriesBurned]
    );
    return res.json({ ok: true });
  });

  // ─── WATER ─────────────────────────────────────────────────────────────────

  app.get("/api/data/water", requireAuth, async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const result = await pool.query("SELECT * FROM water_intake WHERE user_id=$1 ORDER BY date DESC", [userId]);
    return res.json(result.rows.map((r) => ({ date: r.date, glasses: r.glasses })));
  });

  app.post("/api/data/water", requireAuth, async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { date, glasses } = req.body;
    await pool.query(
      `INSERT INTO water_intake (user_id, date, glasses) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, date) DO UPDATE SET glasses=$3`,
      [userId, date, glasses]
    );
    return res.json({ ok: true });
  });

  // ─── BODY SCANS ────────────────────────────────────────────────────────────

  app.get("/api/data/body-scans", requireAuth, async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const result = await pool.query("SELECT * FROM body_scans WHERE user_id=$1 ORDER BY date DESC", [userId]);
    return res.json(result.rows.map((r) => ({
      id: String(r.id), date: r.date,
      weight: parseFloat(r.weight), bodyFat: r.body_fat ? parseFloat(r.body_fat) : undefined,
      muscleMass: r.muscle_mass ? parseFloat(r.muscle_mass) : undefined,
      bmi: r.bmi ? parseFloat(r.bmi) : undefined,
      chest: r.chest ? parseFloat(r.chest) : undefined,
      waist: r.waist ? parseFloat(r.waist) : undefined,
      hips: r.hips ? parseFloat(r.hips) : undefined,
      notes: r.notes,
    })));
  });

  app.post("/api/data/body-scans", requireAuth, async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { date, weight, bodyFat, muscleMass, bmi, chest, waist, hips, arms, thighs, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO body_scans (user_id, date, weight, body_fat, muscle_mass, bmi, chest, waist, hips, arms, thighs, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [userId, date, weight, bodyFat, muscleMass, bmi, chest, waist, hips, arms, thighs, notes]
    );
    return res.json({ id: String(result.rows[0].id) });
  });

  // ─── AI CHAT ───────────────────────────────────────────────────────────────

  app.post("/api/ai/chat", async (req: Request, res: Response) => {
    const openai = getOpenAI();
    if (!openai) {
      return res.status(503).json({ error: "Servicio de IA no configurado. Añade OPENAI_API_KEY en los secretos." });
    }

    const { messages, userProfile } = req.body as {
      messages: { role: string; content: string }[];
      userProfile?: {
        name?: string; weight?: number; height?: number; age?: number;
        goal?: string; activityLevel?: string;
      };
    };

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages requerido" });
    }

    const goalMap: Record<string, string> = {
      lose: "perder peso", maintain: "mantener peso", gain: "ganar músculo",
    };
    const activityMap: Record<string, string> = {
      sedentary: "sedentario", light: "actividad ligera", moderate: "moderadamente activo",
      active: "muy activo", very_active: "extremadamente activo",
    };

    const profileCtx = userProfile
      ? `\nPerfil del usuario: ${userProfile.name ?? "Usuario"}, ${userProfile.age ?? "?"} años, ${userProfile.weight ?? "?"}kg, ${userProfile.height ?? "?"}cm, objetivo: ${goalMap[userProfile.goal ?? ""] ?? userProfile.goal ?? "?"}, nivel de actividad: ${activityMap[userProfile.activityLevel ?? ""] ?? userProfile.activityLevel ?? "?"}.`
      : "";

    const systemPrompt = `Eres Vitalis, un asistente experto en salud, fitness y nutrición. Respondes SIEMPRE en español de manera amigable, clara y motivadora. Eres conciso pero completo. Das consejos prácticos basados en evidencia científica.${profileCtx}

Áreas de expertise: entrenamiento de fuerza, cardio, nutrición deportiva, pérdida de grasa, ganancia muscular, recuperación, suplementación, descanso y bienestar general.
Si el usuario pregunta algo fuera de salud/fitness, redirige amablemente la conversación hacia su bienestar.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        ],
        max_tokens: 600,
        temperature: 0.7,
      });

      const reply = completion.choices[0]?.message?.content ?? "No pude generar una respuesta.";
      return res.json({ reply });
    } catch (err: any) {
      console.error("AI chat error:", err.message);
      return res.status(500).json({ error: "Error al generar respuesta de IA" });
    }
  });

  // ─── AI WORKOUT GENERATOR ──────────────────────────────────────────────────

  app.post("/api/ai/workout", async (req: Request, res: Response) => {
    const openai = getOpenAI();
    if (!openai) {
      return res.status(503).json({ error: "Servicio de IA no configurado. Añade OPENAI_API_KEY en los secretos." });
    }

    const { goal, level, equipment, daysPerWeek, focusAreas } = req.body as {
      goal: string; level: string; equipment: string;
      daysPerWeek: number; focusAreas?: string;
    };

    const prompt = `Crea una rutina de entrenamiento personalizada en español con las siguientes características:
- Objetivo: ${goal}
- Nivel: ${level}
- Equipamiento disponible: ${equipment}
- Días por semana: ${daysPerWeek}
- Áreas de enfoque: ${focusAreas ?? "cuerpo completo"}

Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta (sin markdown, sin explicaciones):
{
  "name": "Nombre descriptivo de la rutina",
  "description": "Descripción breve de la rutina (1-2 oraciones)",
  "exercises": [
    {
      "name": "Nombre del ejercicio en español",
      "sets": 3,
      "reps": "8-12",
      "weight": "20",
      "notes": "Técnica o consejo breve"
    }
  ]
}

Incluye entre 6 y 10 ejercicios apropiados para el nivel y equipamiento indicado.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1200,
        temperature: 0.6,
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      let routine;
      try {
        routine = JSON.parse(raw);
      } catch {
        return res.status(500).json({ error: "La IA generó una respuesta inválida" });
      }

      return res.json(routine);
    } catch (err: any) {
      console.error("AI workout error:", err.message);
      return res.status(500).json({ error: "Error al generar rutina con IA" });
    }
  });

  app.get("/api/download-project", (_req: Request, res: Response) => {
    try {
      const projectDir = path.resolve(__dirname, "..");
      const archivePath = path.join(projectDir, "public", "vitalis-ai.tar.gz");
      const publicDir = path.join(projectDir, "public");
      if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
      if (fs.existsSync(archivePath)) fs.unlinkSync(archivePath);
      execSync(
        `cd "${projectDir}" && tar czf "${archivePath}" --exclude=node_modules --exclude=.git --exclude=.cache --exclude=.local --exclude=attached_assets --exclude=public/vitalis-ai.tar.gz .`,
        { timeout: 30000 }
      );
      const stat = fs.statSync(archivePath);
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", 'attachment; filename="vitalis-ai.tar.gz"');
      res.setHeader("Content-Length", stat.size);
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      const stream = fs.createReadStream(archivePath);
      stream.pipe(res);
    } catch (e: any) {
      res.status(500).json({ error: "Error al generar archivo: " + e.message });
    }
  });

  app.get("/api/download-page", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Descargar Vitalis AI</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0A0A0F;font-family:system-ui,sans-serif;color:#fff}
.card{text-align:center;padding:40px;background:#13131A;border-radius:20px;max-width:360px;margin:20px}
h1{font-size:28px;margin:0 0 8px}
p{color:#888;margin:0 0 24px;font-size:14px}
a{display:inline-block;background:#00FF88;color:#000;font-weight:700;padding:16px 32px;border-radius:14px;text-decoration:none;font-size:16px}
a:active{opacity:.8}
.note{margin-top:16px;font-size:12px;color:#666}
</style></head>
<body><div class="card">
<h1>Vitalis AI</h1>
<p>Descarga el código fuente del proyecto</p>
<a href="/api/download-project" download="vitalis-ai.tar.gz">Descargar proyecto</a>
<p class="note">Archivo .tar.gz (~2.3 MB)</p>
</div></body></html>`);
  });

  const httpServer = createServer(app);
  return httpServer;
}
