import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  height: number;
  weight: number;
  goalWeight: number;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "lose" | "maintain" | "gain";
  avatar?: string;
  createdAt: string;
}

export interface FoodEntry {
  id: string;
  date: string;
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  unit: string;
}

export interface WorkoutSet {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface WorkoutExercise {
  exerciseId: string;
  name: string;
  sets: WorkoutSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  date: string;
  name: string;
  exercises: WorkoutExercise[];
  durationMinutes: number;
  notes?: string;
}

export interface StepRecord {
  date: string;
  steps: number;
  distanceKm: number;
  caloriesBurned: number;
}

export interface BodyScan {
  id: string;
  date: string;
  weight: number;
  bodyFat?: number;
  muscleMass?: number;
  bmi?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
  notes?: string;
}

export interface FacialScan {
  id: string;
  date: string;
  symmetryScore: number;
  jawScore: number;
  cheekboneScore: number;
  overallScore: number;
  faceShape: string;
  recommendations: string[];
}

export interface MoodEntry {
  id: string;
  date: string;
  mood: 1 | 2 | 3 | 4 | 5;
  energy: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  startDate: string;
  endDate: string;
  completed: boolean;
  badge: string;
}

export interface AppSettings {
  stepGoal: number;
  waterGoal: number;
  calorieGoal: number;
  weightUnit: "kg" | "lbs";
  distanceUnit: "km" | "mi";
  notifyWater: boolean;
  notifyWorkout: boolean;
  notifySteps: boolean;
}

const defaultSettings: AppSettings = {
  stepGoal: 10000,
  waterGoal: 8,
  calorieGoal: 2000,
  weightUnit: "kg",
  distanceUnit: "km",
  notifyWater: false,
  notifyWorkout: false,
  notifySteps: true,
};

export interface AppData {
  currentUserId: string | null;
  users: UserProfile[];
  foodEntries: FoodEntry[];
  workouts: WorkoutSession[];
  stepRecords: StepRecord[];
  bodyScans: BodyScan[];
  facialScans: FacialScan[];
  moodEntries: MoodEntry[];
  challenges: Challenge[];
  waterIntake: { date: string; glasses: number }[];
  weight: { date: string; value: number }[];
}

const defaultData: AppData = {
  currentUserId: null,
  users: [],
  foodEntries: [],
  workouts: [],
  stepRecords: [],
  bodyScans: [],
  facialScans: [],
  moodEntries: [],
  challenges: [
    {
      id: "c1",
      title: "Caminata del Mes",
      description: "Camina 50km este mes",
      target: 50,
      current: 0,
      unit: "km",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      completed: false,
      badge: "walking",
    },
    {
      id: "c2",
      title: "8 Entrenamientos",
      description: "Completa 8 sesiones de entrenamiento",
      target: 8,
      current: 0,
      unit: "entrenamientos",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      completed: false,
      badge: "fitness",
    },
    {
      id: "c3",
      title: "Hidratación Perfecta",
      description: "Bebe 8 vasos de agua al día durante 7 días",
      target: 7,
      current: 0,
      unit: "días",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      completed: false,
      badge: "water",
    },
  ],
  waterIntake: [],
  weight: [],
};

interface AppContextValue {
  data: AppData;
  settings: AppSettings;
  currentUser: UserProfile | null;
  addUser: (user: Omit<UserProfile, "id" | "createdAt">) => Promise<UserProfile>;
  updateUser: (id: string, updates: Partial<UserProfile>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  switchUser: (id: string) => Promise<void>;
  addFoodEntry: (entry: Omit<FoodEntry, "id">) => Promise<void>;
  deleteFoodEntry: (id: string) => Promise<void>;
  addWorkout: (workout: Omit<WorkoutSession, "id">) => Promise<void>;
  updateWorkout: (id: string, updates: Partial<WorkoutSession>) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  updateSteps: (date: string, steps: number) => Promise<void>;
  addBodyScan: (scan: Omit<BodyScan, "id">) => Promise<void>;
  addFacialScan: (scan: Omit<FacialScan, "id">) => Promise<void>;
  addMoodEntry: (entry: Omit<MoodEntry, "id">) => Promise<void>;
  updateWater: (date: string, glasses: number) => Promise<void>;
  logWeight: (date: string, value: number) => Promise<void>;
  updateChallenge: (id: string, current: number) => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  clearAllData: () => Promise<void>;
  todaySteps: number;
  todayCalories: number;
  todayWater: number;
  todayMacros: { protein: number; carbs: number; fat: number };
  isLoading: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "vitalis_data";
const SETTINGS_KEY = "vitalis_settings";

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(defaultData);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedData, storedSettings] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
        ]);
        if (storedData) {
          const parsed = JSON.parse(storedData) as AppData;
          setData({
            ...defaultData,
            ...parsed,
            challenges: parsed.challenges?.length ? parsed.challenges : defaultData.challenges,
          });
        }
        if (storedSettings) {
          setSettings({ ...defaultSettings, ...JSON.parse(storedSettings) });
        }
      } catch (e) {
        console.error("Failed to load data:", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persist = async (newData: AppData) => {
    setData(newData);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const clearAllData = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(SETTINGS_KEY);
    setData(defaultData);
    setSettings(defaultSettings);
  };

  const currentUser = useMemo(
    () => data.users.find((u) => u.id === data.currentUserId) ?? null,
    [data.users, data.currentUserId]
  );

  const today = new Date().toISOString().split("T")[0];

  const todaySteps = useMemo(() => {
    const rec = data.stepRecords.find((r) => r.date === today);
    return rec?.steps ?? 0;
  }, [data.stepRecords, today]);

  const todayCalories = useMemo(() => {
    return data.foodEntries
      .filter((e) => e.date === today)
      .reduce((sum, e) => sum + e.calories, 0);
  }, [data.foodEntries, today]);

  const todayWater = useMemo(() => {
    const rec = data.waterIntake.find((w) => w.date === today);
    return rec?.glasses ?? 0;
  }, [data.waterIntake, today]);

  const todayMacros = useMemo(() => {
    const entries = data.foodEntries.filter((e) => e.date === today);
    return entries.reduce(
      (acc, e) => ({
        protein: acc.protein + e.protein,
        carbs: acc.carbs + e.carbs,
        fat: acc.fat + e.fat,
      }),
      { protein: 0, carbs: 0, fat: 0 }
    );
  }, [data.foodEntries, today]);

  const genId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const addUser = async (user: Omit<UserProfile, "id" | "createdAt">) => {
    const newUser: UserProfile = {
      ...user,
      id: genId(),
      createdAt: new Date().toISOString(),
    };
    const newData = {
      ...data,
      users: [...data.users, newUser],
      currentUserId: data.currentUserId ?? newUser.id,
    };
    await persist(newData);
    return newUser;
  };

  const updateUser = async (id: string, updates: Partial<UserProfile>) => {
    const newData = {
      ...data,
      users: data.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    };
    await persist(newData);
  };

  const deleteUser = async (id: string) => {
    const remaining = data.users.filter((u) => u.id !== id);
    const newData = {
      ...data,
      users: remaining,
      currentUserId:
        data.currentUserId === id
          ? remaining[0]?.id ?? null
          : data.currentUserId,
    };
    await persist(newData);
  };

  const switchUser = async (id: string) => {
    await persist({ ...data, currentUserId: id });
  };

  const addFoodEntry = async (entry: Omit<FoodEntry, "id">) => {
    const newData = {
      ...data,
      foodEntries: [...data.foodEntries, { ...entry, id: genId() }],
    };
    await persist(newData);
  };

  const deleteFoodEntry = async (id: string) => {
    await persist({
      ...data,
      foodEntries: data.foodEntries.filter((e) => e.id !== id),
    });
  };

  const addWorkout = async (workout: Omit<WorkoutSession, "id">) => {
    const newWorkout = { ...workout, id: genId() };
    const newData = { ...data, workouts: [...data.workouts, newWorkout] };
    const updated = {
      ...newData,
      challenges: newData.challenges.map((c) =>
        c.id === "c2"
          ? { ...c, current: Math.min(c.current + 1, c.target), completed: c.current + 1 >= c.target }
          : c
      ),
    };
    await persist(updated);
  };

  const updateWorkout = async (id: string, updates: Partial<WorkoutSession>) => {
    await persist({
      ...data,
      workouts: data.workouts.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    });
  };

  const deleteWorkout = async (id: string) => {
    await persist({
      ...data,
      workouts: data.workouts.filter((w) => w.id !== id),
    });
  };

  const updateSteps = async (date: string, steps: number) => {
    const distanceKm = steps * 0.000762;
    const caloriesBurned = steps * 0.04;
    const existing = data.stepRecords.find((r) => r.date === date);
    const stepRecords = existing
      ? data.stepRecords.map((r) =>
          r.date === date ? { ...r, steps, distanceKm, caloriesBurned } : r
        )
      : [...data.stepRecords, { date, steps, distanceKm, caloriesBurned }];

    const kmThisMonth = stepRecords
      .filter((r) => r.date.startsWith(date.substring(0, 7)))
      .reduce((sum, r) => sum + r.distanceKm, 0);

    const updated = {
      ...data,
      stepRecords,
      challenges: data.challenges.map((c) =>
        c.id === "c1"
          ? { ...c, current: parseFloat(kmThisMonth.toFixed(1)), completed: kmThisMonth >= c.target }
          : c
      ),
    };
    await persist(updated);
  };

  const addBodyScan = async (scan: Omit<BodyScan, "id">) => {
    await persist({
      ...data,
      bodyScans: [...data.bodyScans, { ...scan, id: genId() }],
    });
  };

  const addFacialScan = async (scan: Omit<FacialScan, "id">) => {
    await persist({
      ...data,
      facialScans: [...data.facialScans, { ...scan, id: genId() }],
    });
  };

  const addMoodEntry = async (entry: Omit<MoodEntry, "id">) => {
    await persist({
      ...data,
      moodEntries: [...data.moodEntries, { ...entry, id: genId() }],
    });
  };

  const updateWater = async (date: string, glasses: number) => {
    const existing = data.waterIntake.find((w) => w.date === date);
    const waterIntake = existing
      ? data.waterIntake.map((w) => (w.date === date ? { ...w, glasses } : w))
      : [...data.waterIntake, { date, glasses }];

    const daysWithFullWater = waterIntake.filter((w) => w.glasses >= 8).length;
    const updated = {
      ...data,
      waterIntake,
      challenges: data.challenges.map((c) =>
        c.id === "c3"
          ? { ...c, current: daysWithFullWater, completed: daysWithFullWater >= c.target }
          : c
      ),
    };
    await persist(updated);
  };

  const logWeight = async (date: string, value: number) => {
    const existing = data.weight.find((w) => w.date === date);
    const weight = existing
      ? data.weight.map((w) => (w.date === date ? { ...w, value } : w))
      : [...data.weight, { date, value }];
    await persist({ ...data, weight });
  };

  const updateChallenge = async (id: string, current: number) => {
    await persist({
      ...data,
      challenges: data.challenges.map((c) =>
        c.id === id ? { ...c, current, completed: current >= c.target } : c
      ),
    });
  };

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      settings,
      currentUser,
      addUser,
      updateUser,
      deleteUser,
      switchUser,
      addFoodEntry,
      deleteFoodEntry,
      addWorkout,
      updateWorkout,
      deleteWorkout,
      updateSteps,
      addBodyScan,
      addFacialScan,
      addMoodEntry,
      updateWater,
      logWeight,
      updateChallenge,
      updateSettings,
      clearAllData,
      todaySteps,
      todayCalories,
      todayWater,
      todayMacros,
      isLoading,
    }),
    [data, settings, currentUser, todaySteps, todayCalories, todayWater, todayMacros, isLoading]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
