(() => {
  "use strict";

  const STORAGE_KEY = "powerbuild.tracker.v1";
  const STATE_VERSION = 2;
  const TAB_IDS = ["dashboard", "workout", "diet", "analytics", "profile"];
  const TAB_TITLES = {
    dashboard: "Dashboard",
    workout: "Workout Log",
    diet: "Diet & Nutrisi",
    analytics: "Analytics",
    profile: "User Profile"
  };

  const DEFAULT_BASELINE_PRS = Object.freeze({
    squat: 0,
    benchPress: 0,
    deadlift: 0,
    overheadPress: 0,
    cleanAndJerk: 0,
    snatch: 0
  });

  const DEFAULT_PROFILE = Object.freeze({
    isOnboarded: false,
    nickname: "",
    age: 0,
    gender: "male",
    heightCm: 0,
    currentWeight: 0,
    startWeight: 0,
    targetWeight: 0,
    fitnessGoal: "fat_loss",
    activityLevel: "moderate",
    calorieTarget: 0,
    proteinTarget: 0,
    baselinePRs: { ...DEFAULT_BASELINE_PRS }
  });

  const ACTIVITY_MULTIPLIERS = Object.freeze({
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  });

  const GOAL_LABELS = Object.freeze({
    fat_loss: "Fat Loss / Cutting",
    maintenance: "Recomp / Maintenance",
    muscle_gain: "Muscle Gain / Bulking"
  });

  const GOAL_SHORT_LABELS = Object.freeze({
    fat_loss: "Cutting",
    maintenance: "Maintenance",
    muscle_gain: "Bulking"
  });

  const DEFAULT_SPLITS = Object.freeze([
    {
      id: 1,
      day: "Day 1",
      type: "Upper Body · Push",
      name: "Push Day (Chest, Shoulder, Triceps)",
      description: "Fokus gerakan dorong untuk dada, bahu, dan triceps.",
      tags: ["Chest", "Shoulder", "Triceps"]
    },
    {
      id: 2,
      day: "Day 2",
      type: "Upper Body · Pull",
      name: "Pull Day (Back, Rear Delt, Biceps)",
      description: "Fokus gerakan tarik untuk punggung, bahu belakang, dan biceps.",
      tags: ["Back", "Rear Delt", "Biceps"]
    },
    {
      id: 3,
      day: "Day 3",
      type: "Lower Body · Legs",
      name: "Leg Day (Quads, Hamstring, Glutes)",
      description: "Latihan kaki menyeluruh untuk kuadrisep, hamstring, glutes, dan betis.",
      tags: ["Quads", "Hamstring", "Glutes"]
    },
    {
      id: 4,
      day: "Day 4",
      type: "Active Recovery",
      name: "Active Recovery / Cardio",
      description: "Pemulihan aktif dengan cardio ringan, jalan cepat, atau mobilitas.",
      tags: ["Cardio", "Mobility", "Stretching"]
    },
    {
      id: 5,
      day: "Day 5",
      type: "Upper Body",
      name: "Upper Body (Strength & Hypertrophy)",
      description: "Kombinasi compound dan isolasi tubuh bagian atas.",
      tags: ["Chest", "Back", "Arms"]
    },
    {
      id: 6,
      day: "Day 6",
      type: "Lower Body & Core",
      name: "Lower Body + Core",
      description: "Fokus kekuatan tubuh bagian bawah dan stabilitas otot inti (core).",
      tags: ["Lower Body", "Glutes", "Core"]
    },
    {
      id: 7,
      day: "Day 7",
      type: "Recovery",
      name: "Rest Day (Istirahat Total)",
      description: "Istirahat penuh untuk pemulihan otot, tidur cukup, dan hidrasi.",
      tags: ["Rest", "Recovery", "Sleep"]
    }
  ]);

  const SPLIT_TEMPLATES = Object.freeze({
    general_ppl: DEFAULT_SPLITS,
    upper_lower: [
      { id: 1, day: "Day 1", type: "Upper Body", name: "Upper Body A (Strength)", description: "Fokus compound dada, punggung, dan bahu.", tags: ["Chest", "Back", "Shoulder"] },
      { id: 2, day: "Day 2", type: "Lower Body", name: "Lower Body A (Quads & Glutes)", description: "Fokus squat/leg press, quad, dan betis.", tags: ["Quads", "Glutes", "Calves"] },
      { id: 3, day: "Day 3", type: "Active Recovery", name: "Cardio / Active Rest", description: "Cardio ringan dan peregangan.", tags: ["Cardio", "Mobility"] },
      { id: 4, day: "Day 4", type: "Upper Body", name: "Upper Body B (Hypertrophy)", description: "Volume hipertrofi dada, punggung, dan lengan.", tags: ["Hypertrophy", "Arms", "Upper"] },
      { id: 5, day: "Day 5", type: "Lower Body", name: "Lower Body B (Posterior Chain)", description: "Fokus deadlift/RDL, hamstring, glutes, dan core.", tags: ["Hamstring", "Glutes", "Core"] },
      { id: 6, day: "Day 6", type: "Conditioning", name: "Cardio & Core Conditioning", description: "Sesi pembakaran kalori dan latihan perut.", tags: ["Cardio", "Abs", "Conditioning"] },
      { id: 7, day: "Day 7", type: "Recovery", name: "Total Rest Day", description: "Istirahat penuh.", tags: ["Rest", "Sleep"] }
    ],
    bro_split: [
      { id: 1, day: "Day 1", type: "Hypertrophy", name: "Chest Day", description: "Fokus penuh otot dada (upper, mid, lower chest).", tags: ["Chest", "Press", "Fly"] },
      { id: 2, day: "Day 2", type: "Hypertrophy", name: "Back Day", description: "Fokus ketebalan dan kelebaran punggung.", tags: ["Lats", "Upper Back", "Row"] },
      { id: 3, day: "Day 3", type: "Lower Body", name: "Leg Day", description: "Latihan kaki lengkap.", tags: ["Quads", "Hamstring", "Calves"] },
      { id: 4, day: "Day 4", type: "Hypertrophy", name: "Shoulder & Traps", description: "Fokus front, side, dan rear deltoid.", tags: ["Shoulders", "Side Delt", "Rear Delt"] },
      { id: 5, day: "Day 5", type: "Hypertrophy", name: "Arms & Abs (Biceps + Triceps)", description: "Fokus lengan dan otot perut.", tags: ["Biceps", "Triceps", "Abs"] },
      { id: 6, day: "Day 6", type: "Active Recovery", name: "Cardio / Active Recovery", description: "Sesi cardio untuk kesehatan jantung dan fat loss.", tags: ["Cardio", "Recovery"] },
      { id: 7, day: "Day 7", type: "Recovery", name: "Rest Day", description: "Istirahat total.", tags: ["Rest", "Recovery"] }
    ],
    full_body: [
      { id: 1, day: "Day 1", type: "Full Body", name: "Full Body Workout A", description: "Latihan seluruh tubuh sesi A.", tags: ["Squat", "Push", "Pull"] },
      { id: 2, day: "Day 2", type: "Active Recovery", name: "Cardio & Mobility", description: "Jalan cepat, sepeda, atau renang.", tags: ["Cardio", "Mobility"] },
      { id: 3, day: "Day 3", type: "Full Body", name: "Full Body Workout B", description: "Latihan seluruh tubuh sesi B.", tags: ["Hinge", "Press", "Row"] },
      { id: 4, day: "Day 4", type: "Recovery", name: "Rest / Stretching", description: "Pemulihan otot.", tags: ["Rest", "Stretching"] },
      { id: 5, day: "Day 5", type: "Full Body", name: "Full Body Workout C", description: "Latihan seluruh tubuh sesi C + lengan.", tags: ["Legs", "Upper", "Arms"] },
      { id: 6, day: "Day 6", type: "Conditioning", name: "Active Sport / Cardio", description: "Olahraga favorit atau cardio akhir pekan.", tags: ["Sport", "Cardio"] },
      { id: 7, day: "Day 7", type: "Recovery", name: "Total Rest Day", description: "Istirahat penuh.", tags: ["Rest", "Sleep"] }
    ],
    powerbuilding: [
      { id: 1, day: "Day 1", type: "Lower · Push", name: "Squat + Bench Press + Quad Accessories", description: "Fokus kekuatan squat dan bench press.", tags: ["Squat", "Bench Press", "Quads"] },
      { id: 2, day: "Day 2", type: "Posterior · Pull", name: "Deadlift + Hamstring + Pull Accessories", description: "Deadlift utama dilanjutkan aksesori punggung.", tags: ["Deadlift", "Hamstring", "Pull"] },
      { id: 3, day: "Day 3", type: "Active Recovery", name: "Active Rest & Cardio", description: "Recovery aktif dan cardio 30-45 menit.", tags: ["Cardio", "Skipping", "Dance"] },
      { id: 4, day: "Day 4", type: "Hypertrophy", name: "Hypertrophy (Push + Pull + Arm)", description: "Sesi volume tubuh atas dan lengan.", tags: ["Push", "Pull", "Arms"] },
      { id: 5, day: "Day 5", type: "Powerlifting", name: "SBD (Squat, Bench, Deadlift)", description: "Latihan tiga angkatan utama.", tags: ["Squat", "Bench Press", "Deadlift"] },
      { id: 6, day: "Day 6", type: "Recovery", name: "Total Rest", description: "Istirahat penuh.", tags: ["Rest", "Sleep"] },
      { id: 7, day: "Day 7", type: "Weightlifting / Hypertrophy", name: "Weightlifting (Clean & Jerk / Snatch) or Hypertrophy", description: "Sesi olimpi atau hipertrofi tambahan.", tags: ["Clean & Jerk", "Snatch", "Hypertrophy"] }
    ]
  });

  const QUICK_MEALS = Object.freeze([
    {
      id: "chicken-breast-150",
      name: "150g Dada Ayam",
      calories: 248,
      protein: 46
    },
    {
      id: "boiled-eggs-2",
      name: "2 Telur Rebus",
      calories: 155,
      protein: 13
    },
    {
      id: "white-rice-150",
      name: "150g Nasi Putih",
      calories: 195,
      protein: 4
    },
    {
      id: "whey-protein-1",
      name: "1 Scoop Whey Protein",
      calories: 120,
      protein: 24
    }
  ]);

  const PRESET_EXERCISES = Object.freeze([
    "Bench Press",
    "Incline DB Press",
    "Overhead Press",
    "Lateral Raise",
    "Tricep Pushdown",
    "Lat Pulldown",
    "Barbell Row",
    "Seated Cable Row",
    "T-Bar Row",
    "Bicep Curl",
    "Squat",
    "Leg Press",
    "Romanian Deadlift",
    "Conventional Deadlift",
    "Sumo Deadlift",
    "Leg Extension",
    "Leg Curl",
    "Clean & Jerk",
    "Snatch"
  ]);

  const STRENGTH_EXERCISES = Object.freeze([
    "Bench Press",
    "Squat",
    "Deadlift",
    "Overhead Press",
    "Lat Pulldown",
    "Incline DB Press"
  ]);

  const CARDIO_ACTIVITIES = Object.freeze([
    "Incline Treadmill Walk",
    "Running / Jogging",
    "Stationary Bike (Sepeda Statis)",
    "Swimming (Zone 2 / Interval)",
    "Skipping",
    "K-Pop Dance / Aerobik / HIIT"
  ]);

  const CARDIO_KCAL_PER_MIN = Object.freeze({
    "Incline Treadmill Walk": 6,
    "Running / Jogging": 10,
    "Stationary Bike (Sepeda Statis)": 7.5,
    "Swimming (Zone 2 / Interval)": 9,
    "Skipping": 11,
    "K-Pop Dance / Aerobik / HIIT": 8,
    "K-Pop Dance": 7.5
  });

  const BODY_NOTE_TAGS = Object.freeze([
    "Wrist Kanan Aman",
    "Wrist Kanan Stiff/Nyeri",
    "Wrist Kiri Aman",
    "Wrist Kiri Stiff/Nyeri",
    "DOMS Lower Back",
    "DOMS Hamstring",
    "DOMS Quad",
    "Lower Back Fresh",
    "Sendi Bahu/Lutut Aman"
  ]);

  const SUPABASE_RAW_URL = "https://supabase.com/dashboard/project/tnzgvexoxxuiwwwazozy";
  const SUPABASE_ANON_KEY = "sb_publishable_v3-Ca_xImJsRkb8oNQEW5Q_9L9d_Mqz";
  const SUPABASE_TABLE = "user_tracker_data";

  function resolveSupabaseApiUrl(rawUrl) {
    const cleaned = String(rawUrl || "").replace(/^\[|\]$/g, "").trim();
    const dashboardMatch = cleaned.match(/supabase\.com\/dashboard\/project\/([a-z0-9-]+)/i);
    if (dashboardMatch && dashboardMatch[1]) {
      return `https://${dashboardMatch[1]}.supabase.co`;
    }
    return cleaned.replace(/\/+$/, "");
  }

  const SUPABASE_URL = resolveSupabaseApiUrl(SUPABASE_RAW_URL);

  const els = {};
  let state;
  let currentDay = "";
  let toastTimer = null;
  let lastFocusedElement = null;
  let storageWarned = false;
  let cardioCaloriesManual = false;
  let bodyweightChartInstance = null;
  let strengthChartInstance = null;
  let analyticsChartFrame = null;
  let strengthFilter = STRENGTH_EXERCISES[0];
  let supabaseClient = null;
  let currentUser = null;
  let authMode = "login";
  let authBusy = false;
  let isHydratingFromCloud = false;
  let syncQueueTimer = null;

  const numberFormatter = new Intl.NumberFormat("id-ID");
  const decimalFormatter = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
  const macroFormatter = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1
  });
  const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const weekdayFormatter = new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric"
  });
  const timeFormatter = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  });
  const chartDateFormatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short"
  });
  const strengthDateFormatter = new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function dateKey(date = new Date()) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function parseDateKey(key) {
    const [year, month, day] = String(key).split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  function isValidDateKey(key) {
    if (typeof key !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
    const parsed = parseDateKey(key);
    return !Number.isNaN(parsed.getTime()) && dateKey(parsed) === key;
  }

  function todayKey() {
    return dateKey(new Date());
  }

  function capitalize(value) {
    const text = String(value);
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
  }

  function round1(value) {
    return Math.round(Number(value) * 10) / 10;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function formatNumber(value) {
    return numberFormatter.format(Number(value) || 0);
  }

  function formatWeight(value) {
    return decimalFormatter.format(Number(value) || 0);
  }

  function formatMacro(value) {
    return macroFormatter.format(Number(value) || 0);
  }

  function formatTime(value) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "" : timeFormatter.format(parsed);
  }

  function formatShortDay(key) {
    return capitalize(weekdayFormatter.format(parseDateKey(key)));
  }

  function formatChartDate(key) {
    return chartDateFormatter.format(parseDateKey(key));
  }

  function formatStrengthDate(key) {
    return capitalize(strengthDateFormatter.format(parseDateKey(key)));
  }

  function escapeHTML(value) {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return String(value).replace(/[&<>"']/g, (character) => replacements[character]);
  }

  function uid() {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
    return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function normalizeId(value) {
    const normalized = String(value ?? "")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 64);
    return normalized || uid();
  }

  function validNumber(value, min, max) {
    const raw = typeof value === "number" ? value : Number(String(value ?? "").replace(",", "."));
    if (!Number.isFinite(raw) || raw < min || raw > max) return null;
    return raw;
  }

  function lastNDays(count) {
    const result = [];
    const cursor = new Date();
    cursor.setHours(12, 0, 0, 0);
    for (let offset = count - 1; offset >= 0; offset -= 1) {
      const day = new Date(cursor);
      day.setDate(cursor.getDate() - offset);
      result.push(dateKey(day));
    }
    return result;
  }

  function calculateEpley1RM(weight, reps) {
    const w = Number(weight);
    const r = Number(reps);
    if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(r) || r <= 0) return 0;
    return round1(w * (1 + r / 30));
  }

  function normalizeExerciseKey(name) {
    return String(name ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function mapExerciseToPRKey(exerciseName) {
    const key = normalizeExerciseKey(exerciseName);
    if (!key) return "";
    if (key === "squat" || key === "back squat" || key === "barbell squat") return "squat";
    if (key === "bench press" || key === "barbell bench press" || key === "flat bench press") return "benchPress";
    if (key === "deadlift" || key === "conventional deadlift" || key === "sumo deadlift") return "deadlift";
    if (key === "overhead press" || key === "ohp" || key === "military press" || key === "shoulder press") return "overheadPress";
    if (key.includes("clean") && key.includes("jerk")) return "cleanAndJerk";
    if (key === "snatch" || key === "power snatch") return "snatch";
    return key;
  }

  function getBaselinePR(exerciseName, profileSource = state?.profile) {
    const prKey = mapExerciseToPRKey(exerciseName);
    if (!prKey) return 0;
    const prs = profileSource?.baselinePRs;
    if (prs && typeof prs === "object" && prKey in prs) {
      const val = Number(prs[prKey]);
      return Number.isFinite(val) && val >= 0 ? val : 0;
    }
    return 0;
  }

  function calculateMifflinStJeor({ age, gender, heightCm, weightKg, fitnessGoal, activityLevel }) {
    const a = validNumber(age, 12, 100);
    const h = validNumber(heightCm, 100, 250);
    const w = validNumber(weightKg, 30, 300);
    if (a === null || h === null || w === null) return null;

    const bmr = gender === "female"
      ? 10 * w + 6.25 * h - 5 * a - 161
      : 10 * w + 6.25 * h - 5 * a + 5;
    const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.55;
    const tdee = bmr * multiplier;

    let adjusted = tdee;
    if (fitnessGoal === "fat_loss") {
      adjusted = tdee - 500;
    } else if (fitnessGoal === "muscle_gain") {
      adjusted = tdee + 300;
    }

    const calories = Math.max(1000, Math.round(adjusted / 10) * 10);
    const protein = Math.max(40, Math.round(w * 2));

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      calories,
      protein
    };
  }

  function cloneDefaultSplits() {
    return DEFAULT_SPLITS.map((s) => ({
      id: s.id,
      day: s.day,
      type: s.type,
      name: s.name,
      description: s.description,
      tags: [...s.tags]
    }));
  }

  function sanitizeCustomSplits(rawSplits) {
    const defaults = cloneDefaultSplits();
    if (!Array.isArray(rawSplits) || rawSplits.length === 0) return defaults;

    const byId = new Map();
    rawSplits.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const id = Number(item.id);
      if (!Number.isInteger(id) || id < 1 || id > 7) return;
      const fallback = defaults[id - 1];
      const name = typeof item.name === "string" && item.name.trim()
        ? item.name.trim().slice(0, 70)
        : fallback.name;
      const type = typeof item.type === "string" && item.type.trim()
        ? item.type.trim().slice(0, 40)
        : fallback.type;
      const description = typeof item.description === "string" && item.description.trim()
        ? item.description.trim().slice(0, 140)
        : fallback.description;
      const tags = Array.isArray(item.tags)
        ? item.tags.map((t) => String(t).trim()).filter((t) => t.length > 0 && t.length <= 32).slice(0, 8)
        : fallback.tags;

      byId.set(id, {
        id,
        day: `Day ${id}`,
        type,
        name,
        description,
        tags: tags.length > 0 ? tags : fallback.tags
      });
    });

    return defaults.map((fallback) => byId.get(fallback.id) ?? fallback);
  }

  function cloneDefaultMeals() {
    return QUICK_MEALS.map((m) => ({
      id: m.id,
      name: m.name,
      calories: m.calories,
      protein: m.protein
    }));
  }

  function sanitizeCustomMeals(rawMeals) {
    if (!Array.isArray(rawMeals)) return cloneDefaultMeals();
    const seenIds = new Set();
    const list = [];
    rawMeals.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const name = typeof item.name === "string" ? item.name.trim().slice(0, 80) : "";
      const calories = validNumber(item.calories, 0, 20000);
      const protein = validNumber(item.protein, 0, 1000);
      if (!name || calories === null || protein === null) return;
      let id = normalizeId(item.id);
      while (seenIds.has(id)) id = uid();
      seenIds.add(id);
      list.push({
        id,
        name,
        calories: Math.round(calories),
        protein: round1(protein)
      });
    });
    return list;
  }

  function sanitizeBaselinePRs(rawPRs) {
    const clean = { ...DEFAULT_BASELINE_PRS };
    if (!rawPRs || typeof rawPRs !== "object") return clean;
    Object.entries(rawPRs).forEach(([key, val]) => {
      const num = validNumber(val, 0, 600);
      if (num !== null) {
        clean[key] = round1(num);
      }
    });
    return clean;
  }

  function createDefaultState() {
    const now = new Date().toISOString();
    const today = todayKey();
    const starterPresets = cloneDefaultMeals();
    return {
      version: STATE_VERSION,
      profile: {
        ...DEFAULT_PROFILE,
        baselinePRs: { ...DEFAULT_BASELINE_PRS }
      },
      weights: [],
      foodLogs: [],
      logs: [],
      workoutLogs: [],
      workouts: [],
      cardioLogs: [],
      bodyNotes: [],
      customSplits: cloneDefaultSplits(),
      customExercises: [],
      customCardioActivities: [],
      customPresets: starterPresets,
      customMeals: starterPresets,
      selectedSplits: { [today]: 1 },
      createdAt: now
    };
  }

  function sanitizeState(raw, strict = false) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error("Struktur data tidak dikenali.");
    }

    const source = raw.data && typeof raw.data === "object" && !Array.isArray(raw.data)
      ? raw.data
      : raw;

    if (!source || typeof source !== "object" || Array.isArray(source)) {
      throw new Error("Struktur data tidak dikenali.");
    }

    const knownKeys = [
      "profile",
      "weights",
      "foodLogs",
      "logs",
      "workoutLogs",
      "workouts",
      "cardioLogs",
      "bodyNotes",
      "customSplits",
      "customExercises",
      "customPresets",
      "customMeals",
      "selectedSplits"
    ];
    if (strict && !knownKeys.some((key) => key in source)) {
      throw new Error("File JSON bukan backup Gym Tracker App by LapoN.");
    }

    const weightMap = new Map();
    if (Array.isArray(source.weights)) {
      source.weights.forEach((item) => {
        if (!item || typeof item !== "object") return;
        const key = item.date;
        const weight = validNumber(item.weight, 20, 500);
        if (!isValidDateKey(key) || weight === null) return;
        const updatedAt = !Number.isNaN(new Date(item.updatedAt).getTime())
          ? new Date(item.updatedAt).toISOString()
          : `${key}T12:00:00.000Z`;
        weightMap.set(key, {
          date: key,
          weight: round1(weight),
          updatedAt
        });
      });
    }

    const weights = [...weightMap.values()].sort((a, b) => a.date.localeCompare(b.date));

    const rawProfile = source.profile && typeof source.profile === "object"
      ? source.profile
      : {};

    const isOnboarded = Boolean(rawProfile.isOnboarded);
    const nickname = typeof rawProfile.nickname === "string" ? rawProfile.nickname.trim().slice(0, 50) : "";
    const age = validNumber(rawProfile.age, 12, 100) ?? 0;
    const gender = rawProfile.gender === "female" ? "female" : "male";
    const heightCm = validNumber(rawProfile.heightCm, 100, 250) ?? 0;

    const earliestWeight = weights.length > 0 ? weights[0].weight : 0;
    const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight : 0;

    const currentWeight = validNumber(rawProfile.currentWeight, 30, 300) ?? latestWeight ?? 0;
    const startWeight = validNumber(rawProfile.startWeight, 30, 300) ?? (earliestWeight > 0 ? earliestWeight : currentWeight);
    const targetWeight = validNumber(rawProfile.targetWeight, 30, 300) ?? 0;
    const fitnessGoal = ["fat_loss", "maintenance", "muscle_gain"].includes(rawProfile.fitnessGoal)
      ? rawProfile.fitnessGoal
      : "fat_loss";
    const activityLevel = Object.prototype.hasOwnProperty.call(ACTIVITY_MULTIPLIERS, rawProfile.activityLevel)
      ? rawProfile.activityLevel
      : "moderate";
    const calorieTarget = validNumber(rawProfile.calorieTarget, 800, 10000) ?? 0;
    const proteinTarget = validNumber(rawProfile.proteinTarget, 30, 500) ?? 0;
    const baselinePRs = sanitizeBaselinePRs(rawProfile.baselinePRs);

    const profile = {
      isOnboarded,
      nickname,
      age: Math.round(age),
      gender,
      heightCm: round1(heightCm),
      currentWeight: round1(currentWeight),
      startWeight: round1(startWeight),
      targetWeight: round1(targetWeight),
      fitnessGoal,
      activityLevel,
      calorieTarget: Math.round(calorieTarget),
      proteinTarget: round1(proteinTarget),
      baselinePRs
    };

    const rawFoodArray = Array.isArray(source.foodLogs)
      ? source.foodLogs
      : Array.isArray(source.logs)
        ? source.logs
        : [];
    const seenFoodIds = new Set();
    const foodLogs = [];
    rawFoodArray.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const key = item.date;
      const name = typeof item.name === "string" ? item.name.trim().slice(0, 80) : "";
      const calories = validNumber(item.calories, 0, 20000);
      const protein = validNumber(item.protein, 0, 1000);
      if (!isValidDateKey(key) || !name || calories === null || protein === null) return;

      let id = normalizeId(item.id);
      while (seenFoodIds.has(id)) id = uid();
      seenFoodIds.add(id);

      const createdAt = !Number.isNaN(new Date(item.createdAt).getTime())
        ? new Date(item.createdAt).toISOString()
        : `${key}T12:00:00.000Z`;

      foodLogs.push({
        id,
        date: key,
        name,
        calories: Math.round(calories),
        protein: round1(protein),
        createdAt
      });
    });

    const rawWorkoutArray = Array.isArray(source.workoutLogs)
      ? source.workoutLogs
      : Array.isArray(source.workouts)
        ? source.workouts
        : [];
    const seenWorkoutIds = new Set();
    const workoutLogs = [];
    rawWorkoutArray.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const key = item.date;
      const exercise = typeof item.exercise === "string" ? item.exercise.trim().slice(0, 80) : "";
      const splitId = Number.isInteger(Number(item.splitId)) && Number(item.splitId) >= 1 && Number(item.splitId) <= 7
        ? Number(item.splitId)
        : 1;
      const weight = validNumber(item.weight, 0, 600);
      const sets = validNumber(item.sets, 1, 30);
      const reps = validNumber(item.reps, 1, 100);
      const rpe = validNumber(item.rpe, 6, 10);
      if (!isValidDateKey(key) || !exercise || weight === null || sets === null || reps === null || rpe === null) return;

      let id = normalizeId(item.id);
      while (seenWorkoutIds.has(id)) id = uid();
      seenWorkoutIds.add(id);

      const createdAt = !Number.isNaN(new Date(item.createdAt).getTime())
        ? new Date(item.createdAt).toISOString()
        : `${key}T12:00:00.000Z`;

      const est1RM = calculateEpley1RM(weight, reps);
      const isPR = Boolean(item.isPR);

      workoutLogs.push({
        id,
        date: key,
        splitId,
        exercise,
        weight: round1(weight),
        sets: Math.round(sets),
        reps: Math.round(reps),
        rpe: round1(rpe),
        est1RM,
        isPR,
        createdAt
      });
    });

    const seenCardioIds = new Set();
    const cardioLogs = [];
    if (Array.isArray(source.cardioLogs)) {
      source.cardioLogs.forEach((item) => {
        if (!item || typeof item !== "object") return;
        const key = item.date;
        const activity = typeof item.activity === "string" ? item.activity.trim().slice(0, 80) : "";
        const duration = validNumber(item.duration, 1, 600);
        const calories = validNumber(item.calories, 1, 5000);
        if (!isValidDateKey(key) || !activity || duration === null || calories === null) return;

        let id = normalizeId(item.id);
        while (seenCardioIds.has(id)) id = uid();
        seenCardioIds.add(id);

        const createdAt = !Number.isNaN(new Date(item.createdAt).getTime())
          ? new Date(item.createdAt).toISOString()
          : `${key}T12:00:00.000Z`;

        cardioLogs.push({
          id,
          date: key,
          activity,
          duration: Math.round(duration),
          calories: Math.round(calories),
          createdAt
        });
      });
    }

    const bodyNotesMap = new Map();
    if (Array.isArray(source.bodyNotes)) {
      source.bodyNotes.forEach((item) => {
        if (!item || typeof item !== "object") return;
        const key = item.date;
        if (!isValidDateKey(key)) return;
        const tags = Array.isArray(item.tags)
          ? item.tags.map((t) => String(t).trim()).filter((t) => t.length > 0 && t.length <= 50).slice(0, 12)
          : [];
        const note = typeof item.note === "string" ? item.note.trim().slice(0, 200) : "";
        if (tags.length === 0 && !note) return;
        const updatedAt = !Number.isNaN(new Date(item.updatedAt).getTime())
          ? new Date(item.updatedAt).toISOString()
          : `${key}T12:00:00.000Z`;
        bodyNotesMap.set(key, {
          date: key,
          tags: [...new Set(tags)],
          note,
          updatedAt
        });
      });
    }
    const bodyNotes = [...bodyNotesMap.values()].sort((a, b) => b.date.localeCompare(a.date));

    const customSplits = sanitizeCustomSplits(source.customSplits);

    const customExercisesSet = new Set();
    const customExercises = [];
    if (Array.isArray(source.customExercises)) {
      source.customExercises.forEach((item) => {
        const clean = typeof item === "string" ? item.trim().slice(0, 80) : "";
        const norm = normalizeExerciseKey(clean);
        if (!clean || customExercisesSet.has(norm)) return;
        if (PRESET_EXERCISES.some((preset) => normalizeExerciseKey(preset) === norm)) return;
        customExercisesSet.add(norm);
        customExercises.push(clean);
      });
    }

    const customCardioSet = new Set();
    const customCardioActivities = [];
    if (Array.isArray(source.customCardioActivities)) {
      source.customCardioActivities.forEach((item) => {
        const clean = typeof item === "string" ? item.trim().slice(0, 80) : "";
        const norm = normalizeExerciseKey(clean);
        if (!clean || customCardioSet.has(norm)) return;
        if (CARDIO_ACTIVITIES.some((preset) => normalizeExerciseKey(preset) === norm)) return;
        customCardioSet.add(norm);
        customCardioActivities.push(clean);
      });
    }

    const rawPresets = Array.isArray(source.customPresets)
      ? source.customPresets
      : source.customMeals;
    const customPresets = sanitizeCustomMeals(rawPresets);

    const selectedSplits = {};
    if (source.selectedSplits && typeof source.selectedSplits === "object") {
      Object.entries(source.selectedSplits).forEach(([key, value]) => {
        const splitId = Number(value);
        if (isValidDateKey(key) && Number.isInteger(splitId) && splitId >= 1 && splitId <= 7) {
          selectedSplits[key] = splitId;
        }
      });
    }
    if (!selectedSplits[todayKey()]) selectedSplits[todayKey()] = 1;

    return {
      version: STATE_VERSION,
      profile,
      weights,
      foodLogs,
      logs: foodLogs,
      workoutLogs,
      workouts: workoutLogs,
      cardioLogs,
      bodyNotes,
      customSplits,
      customExercises,
      customCardioActivities,
      customPresets,
      customMeals: customPresets,
      selectedSplits,
      createdAt: typeof source.createdAt === "string" ? source.createdAt : new Date().toISOString()
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState();
      return sanitizeState(JSON.parse(raw));
    } catch (error) {
      console.warn("Gagal memuat data lokal:", error);
      return createDefaultState();
    }
  }

  function setSyncStatus(mode = "idle", customText = "") {
    if (!els.syncStatusBadge || !els.syncStatusText) return;
    els.syncStatusBadge.dataset.syncState = mode;
    if (customText) {
      els.syncStatusText.textContent = customText;
    } else if (mode === "saving") {
      els.syncStatusText.textContent = "Saving...";
    } else if (mode === "error") {
      els.syncStatusText.textContent = "Sync Pending";
    } else {
      els.syncStatusText.textContent = "Cloud Synced";
    }
  }

  async function syncStateToCloud() {
    if (!supabaseClient || !currentUser || isHydratingFromCloud) return false;
    setSyncStatus("saving", "Saving...");
    try {
      const payload = {
        user_id: currentUser.id,
        email: currentUser.email || "",
        app_data: state,
        updated_at: new Date().toISOString()
      };
      const { error } = await supabaseClient
        .from(SUPABASE_TABLE)
        .upsert(payload, { onConflict: "user_id" });

      if (error) throw error;
      setSyncStatus("idle", "Cloud Synced");
      return true;
    } catch (error) {
      console.warn("Gagal sinkronisasi ke Supabase:", error);
      setSyncStatus("error", navigator.onLine === false ? "Offline" : "Sync Error");
      return false;
    }
  }

  function scheduleCloudSync(immediate = false) {
    if (!supabaseClient || !currentUser || isHydratingFromCloud) return;
    window.clearTimeout(syncQueueTimer);
    setSyncStatus("saving", "Saving...");
    if (immediate) {
      syncStateToCloud();
      return;
    }
    syncQueueTimer = window.setTimeout(() => {
      syncStateToCloud();
    }, 180);
  }

  function persistState(options = {}) {
    const shouldSync = options.sync ?? true;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (shouldSync && currentUser && !isHydratingFromCloud) {
        scheduleCloudSync();
      }
      return true;
    } catch (error) {
      console.warn("Gagal menyimpan data lokal:", error);
      if (!storageWarned) {
        storageWarned = true;
        showToast("Gagal menyimpan ke LocalStorage. Periksa pengaturan browser.", "error");
      }
      if (shouldSync && currentUser && !isHydratingFromCloud) {
        scheduleCloudSync();
      }
      return false;
    }
  }

  function getLatestWeightEntry() {
    if (!Array.isArray(state.weights) || state.weights.length === 0) {
      const fallbackWeight = state.profile.currentWeight || state.profile.startWeight || 0;
      return {
        date: todayKey(),
        weight: fallbackWeight,
        updatedAt: new Date().toISOString()
      };
    }
    return state.weights.reduce((latest, entry) =>
      !latest || entry.date >= latest.date ? entry : latest
    , null);
  }

  function getPreviousWeightEntry() {
    const latest = getLatestWeightEntry();
    const older = state.weights
      .filter((entry) => entry.date < latest.date)
      .sort((a, b) => a.date.localeCompare(b.date));
    return older.length ? older[older.length - 1] : null;
  }

  function getTodayWeightEntry() {
    return state.weights.find((entry) => entry.date === todayKey()) ?? null;
  }

  function getFoodLogsFor(key) {
    return state.foodLogs
      .filter((item) => item.date === key)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  function getTodayFoodLogs() {
    return getFoodLogsFor(todayKey());
  }

  function sumNutrition(logs) {
    return logs.reduce(
      (totals, item) => {
        totals.calories += Number(item.calories) || 0;
        totals.protein += Number(item.protein) || 0;
        return totals;
      },
      { calories: 0, protein: 0 }
    );
  }

  function getActiveSplits() {
    if (state && Array.isArray(state.customSplits) && state.customSplits.length === 7) {
      return state.customSplits;
    }
    return DEFAULT_SPLITS;
  }

  function getSplit(id) {
    const splits = getActiveSplits();
    return splits.find((split) => split.id === Number(id)) ?? splits[0] ?? null;
  }

  function getAllExercises() {
    const custom = Array.isArray(state?.customExercises) ? state.customExercises : [];
    const seen = new Set();
    const list = [];
    [...custom, ...PRESET_EXERCISES].forEach((name) => {
      const clean = String(name || "").trim();
      const norm = normalizeExerciseKey(clean);
      if (!clean || seen.has(norm)) return;
      seen.add(norm);
      list.push(clean);
    });
    return list;
  }

  function getAllCardioActivities() {
    const custom = Array.isArray(state?.customCardioActivities) ? state.customCardioActivities : [];
    const seen = new Set();
    const list = [];
    [...custom, ...CARDIO_ACTIVITIES].forEach((name) => {
      const clean = String(name || "").trim();
      const norm = normalizeExerciseKey(clean);
      if (!clean || seen.has(norm)) return;
      seen.add(norm);
      list.push(clean);
    });
    return list;
  }

  function getAnalyticsStrengthOptions() {
    const loggedExercises = Array.isArray(state?.workoutLogs)
      ? state.workoutLogs.map((l) => l.exercise)
      : [];
    const custom = Array.isArray(state?.customExercises) ? state.customExercises : [];
    const seen = new Set();
    const list = [];
    [...loggedExercises, ...custom, ...STRENGTH_EXERCISES].forEach((name) => {
      const clean = String(name || "").trim();
      const norm = normalizeExerciseKey(clean);
      if (!clean || seen.has(norm)) return;
      seen.add(norm);
      list.push(clean);
    });
    return list.length > 0 ? list : [...STRENGTH_EXERCISES];
  }

  function getSelectedSplitId() {
    const selected = Number(state.selectedSplits[todayKey()]);
    return Number.isInteger(selected) && selected >= 1 && selected <= 7 ? selected : 1;
  }

  function getWeightProgress() {
    const current = getLatestWeightEntry().weight;
    const startWeight = state.profile.startWeight || current || 0;
    const targetWeight = state.profile.targetWeight || 0;
    const totalSpan = Math.abs(startWeight - targetWeight);

    if (!startWeight || !targetWeight) {
      return {
        current,
        startWeight,
        targetWeight,
        lost: 0,
        remaining: 0,
        percentage: 0,
        mode: "unset"
      };
    }

    if (totalSpan < 0.05) {
      const diff = Math.abs(current - targetWeight);
      return {
        current,
        startWeight,
        targetWeight,
        lost: 0,
        remaining: round1(diff),
        percentage: diff <= 0.5 ? 100 : clamp(100 - diff * 15, 0, 100),
        mode: "maintenance"
      };
    }

    if (targetWeight < startWeight) {
      const lost = startWeight - current;
      const remaining = Math.max(round1(current - targetWeight), 0);
      const percentage = clamp((lost / totalSpan) * 100, 0, 100);
      return {
        current,
        startWeight,
        targetWeight,
        lost: round1(lost),
        remaining,
        percentage,
        mode: "cutting"
      };
    }

    const gained = current - startWeight;
    const remaining = Math.max(round1(targetWeight - current), 0);
    const percentage = clamp((gained / totalSpan) * 100, 0, 100);
    return {
      current,
      startWeight,
      targetWeight,
      lost: round1(gained),
      remaining,
      percentage,
      mode: "bulking"
    };
  }

  function startOfWeekKey(key) {
    const date = parseDateKey(key);
    const offset = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - offset);
    return dateKey(date);
  }

  function matchesStrengthFilter(exerciseName, filter) {
    const key = normalizeExerciseKey(exerciseName);
    if (!key) return false;

    if (filter === "Deadlift") return key.includes("deadlift");
    if (filter === "Bench Press") return key === "bench press" || key.endsWith(" bench press");
    if (filter === "Clean & Jerk") return key.includes("clean") && key.includes("jerk");
    if (filter === "Snatch") return key.includes("snatch");
    if (filter === "Squat") {
      return key === "squat" || key === "back squat" || key === "barbell squat";
    }
    return key === normalizeExerciseKey(filter);
  }

  function getStrengthLogsForFilter(filter) {
    return state.workoutLogs
      .filter((log) => matchesStrengthFilter(log.exercise, filter))
      .sort((a, b) => b.date.localeCompare(a.date) || String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  function getStrengthWeeklyData(filter) {
    const weeks = new Map();

    state.workoutLogs.forEach((log) => {
      if (!matchesStrengthFilter(log.exercise, filter)) return;

      const week = startOfWeekKey(log.date);
      const weight = Number(log.weight) || 0;
      const reps = Number(log.reps) || 0;
      const e1rm = Number(log.est1RM) > 0
        ? round1(log.est1RM)
        : calculateEpley1RM(weight, reps);

      const bucket = weeks.get(week) ?? {
        week,
        topSet: 0,
        topSetReps: 0,
        e1rm: 0,
        count: 0
      };

      if (weight > bucket.topSet || (weight === bucket.topSet && reps > bucket.topSetReps)) {
        bucket.topSet = weight;
        bucket.topSetReps = reps;
      }
      bucket.e1rm = Math.max(bucket.e1rm, e1rm);
      bucket.count += 1;
      weeks.set(week, bucket);
    });

    return [...weeks.values()]
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12);
  }

  function getStrengthSummary(filter) {
    const logs = getStrengthLogsForFilter(filter);
    return logs.reduce(
      (summary, log) => {
        const weight = Number(log.weight) || 0;
        const e1rm = Number(log.est1RM) > 0
          ? round1(log.est1RM)
          : calculateEpley1RM(weight, log.reps);
        summary.bestTopSet = Math.max(summary.bestTopSet, weight);
        summary.bestE1rm = Math.max(summary.bestE1rm, e1rm);
        summary.totalSets += Math.max(1, Number(log.sets) || 1);
        return summary;
      },
      { bestTopSet: 0, bestE1rm: 0, totalSets: 0 }
    );
  }

  function splitIcon(id, className = "h-5 w-5") {
    const base = `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="${className}" aria-hidden="true"`;
    if (Number(id) === 3) {
      return `<svg ${base}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;
    }
    if (Number(id) === 6) {
      return `<svg ${base}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/><path d="M19 3v4M17 5h4"/></svg>`;
    }
    if (Number(id) === 7) {
      return `<svg ${base}><path d="m6.5 6.5 11 11M3 10l7-7M14 21l7-7M3 14l3-3M18 22l4-4M2 6l4-4"/></svg>`;
    }
    return `<svg ${base}><path d="m6.5 6.5 11 11M3 10l7-7M14 21l7-7M3 14l3-3M18 22l4-4M2 6l4-4"/></svg>`;
  }

  function buildWeightChart(entries, options = {}) {
    const input = Array.isArray(entries)
      ? entries.filter((entry) => Number.isFinite(Number(entry.weight)))
      : [];

    if (input.length < 2) {
      return `<div class="chart-empty">Catat minimal 2 hari untuk melihat tren berat badan.</div>`;
    }

    const sorted = [...input].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const width = options.width ?? 600;
    const height = options.height ?? 120;
    const padX = 8;
    const padTop = 12;
    const padBottom = 12;
    const values = sorted.map((entry) => Number(entry.weight));
    let min = Math.min(...values);
    let max = Math.max(...values);

    if (max - min < 0.8) {
      const middle = (max + min) / 2;
      min = middle - 0.5;
      max = middle + 0.5;
    } else {
      min -= 0.45;
      max += 0.45;
    }

    const usableWidth = width - padX * 2;
    const usableHeight = height - padTop - padBottom;
    const coordinates = sorted.map((entry, index) => ({
      x: padX + (usableWidth * index) / (sorted.length - 1),
      y: padTop + (1 - (Number(entry.weight) - min) / (max - min)) * usableHeight
    }));

    const linePath = coordinates
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(" ");
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    const areaPath = `${linePath} L ${last.x.toFixed(2)} ${(height - padBottom).toFixed(2)} L ${first.x.toFixed(2)} ${(height - padBottom).toFixed(2)} Z`;
    const grid = [0.25, 0.5, 0.75]
      .map((fraction) => {
        const y = padTop + usableHeight * fraction;
        return `<path d="M ${padX} ${y.toFixed(2)} H ${(width - padX).toFixed(2)}" stroke="rgba(148, 163, 184, 0.09)" stroke-width="1"/>`;
      })
      .join("");
    const safeId = `weight-gradient-${String(options.gradientId ?? "default").replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const rangeLabel = `${formatShortDay(sorted[0].date)}–${formatShortDay(sorted[sorted.length - 1].date)}`;

    return `
      <svg class="weight-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Grafik tren berat badan ${escapeHTML(rangeLabel)}">
        <defs>
          <linearGradient id="${safeId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#34d399" stop-opacity="0.26"/>
            <stop offset="100%" stop-color="#34d399" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${grid}
        <path d="${areaPath}" fill="url(#${safeId})"/>
        <path d="${linePath}" fill="none" stroke="#34d399" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="${last.x.toFixed(2)}" cy="${last.y.toFixed(2)}" r="3.8" fill="#0f172a" stroke="#34d399" stroke-width="2.4"/>
      </svg>
    `;
  }

  function renderDates() {
    const formatted = capitalize(dateFormatter.format(new Date()));
    els.todayDates.forEach((element) => {
      element.textContent = formatted;
    });
  }

  function populateSplitSelect() {
    const splits = getActiveSplits();
    const currentVal = els.splitSelect?.value;
    const currentWorkoutVal = els.workoutSplitSelect?.value;
    const optionsMarkup = splits
      .map((split) => `<option value="${split.id}">${escapeHTML(`${split.day} — ${split.name}`)}</option>`)
      .join("");
    if (els.splitSelect) {
      els.splitSelect.innerHTML = optionsMarkup;
      if (currentVal) els.splitSelect.value = currentVal;
    }
    if (els.workoutSplitSelect) {
      els.workoutSplitSelect.innerHTML = optionsMarkup;
      if (currentWorkoutVal) els.workoutSplitSelect.value = currentWorkoutVal;
    }
  }

  function populateExerciseSelect(preferredValue = "") {
    if (!els.workoutExerciseSelect) return;
    const previous = preferredValue || els.workoutExerciseSelect.value || "Bench Press";
    const exercises = getAllExercises();
    const customSet = new Set((state?.customExercises || []).map((c) => normalizeExerciseKey(c)));

    const optionsMarkup = exercises
      .map((name) => {
        const isUserCustom = customSet.has(normalizeExerciseKey(name));
        const label = isUserCustom ? `★ ${name}` : name;
        return `<option value="${escapeHTML(name)}">${escapeHTML(label)}</option>`;
      })
      .join("") + `<option value="__custom__">+ Tambah Jenis Latihan Baru...</option>`;

    els.workoutExerciseSelect.innerHTML = optionsMarkup;
    if (previous === "__custom__" || exercises.includes(previous)) {
      els.workoutExerciseSelect.value = previous;
    } else if (exercises.length > 0) {
      els.workoutExerciseSelect.value = exercises[0];
    }

    if (els.customExercisesManage && els.customExercisesChips) {
      const customList = state?.customExercises || [];
      els.customExercisesManage.hidden = customList.length === 0;
      els.customExercisesChips.innerHTML = customList
        .map((name) => `
          <span class="inline-flex items-center gap-1 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
            <span>${escapeHTML(name)}</span>
            <button type="button" data-remove-custom-exercise="${escapeHTML(name)}" class="ml-0.5 text-emerald-300/70 hover:text-rose-300" title="Hapus dari daftar">&times;</button>
          </span>
        `)
        .join("");
    }
  }

  function populateCardioSelect(preferredValue = "") {
    if (!els.cardioActivity) return;
    const previous = preferredValue || els.cardioActivity.value || CARDIO_ACTIVITIES[0];
    const activities = getAllCardioActivities();

    els.cardioActivity.innerHTML = activities
      .map((name) => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`)
      .join("") + `<option value="__custom__">+ Tambah Aktivitas Cardio Baru...</option>`;

    if (previous === "__custom__" || activities.includes(previous)) {
      els.cardioActivity.value = previous;
    } else if (activities.length > 0) {
      els.cardioActivity.value = activities[0];
    }
  }

  function populateSplitEditorForm(dayId) {
    const id = Number(dayId || els.editSplitDay?.value || getSelectedSplitId());
    const split = getSplit(id);
    if (!split) return;
    if (els.editSplitDay) els.editSplitDay.value = String(split.id);
    if (els.editSplitName) els.editSplitName.value = split.name;
    if (els.editSplitType) els.editSplitType.value = split.type;
    if (els.editSplitTags) els.editSplitTags.value = (split.tags || []).join(", ");
    if (els.editSplitDesc) els.editSplitDesc.value = split.description;
  }

  function getActiveMeals() {
    if (state && Array.isArray(state.customPresets)) {
      return state.customPresets;
    }
    if (state && Array.isArray(state.customMeals)) {
      return state.customMeals;
    }
    return cloneDefaultMeals();
  }

  function renderQuickMeals() {
    if (!els.quickMealGrid) return;
    const meals = getActiveMeals();

    if (meals.length === 0) {
      els.quickMealGrid.innerHTML = `
        <div class="col-span-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center text-xs text-slate-400">
          Belum ada template menu diet. Buka panel <strong>Kelola Menu</strong> di bawah untuk menambahkan menu andalan Anda.
        </div>
      `;
    } else {
      els.quickMealGrid.innerHTML = meals
        .map((meal, index) => {
          const tone = index % 2 === 0
            ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/15"
            : "bg-blue-400/10 text-blue-300 ring-blue-400/15";

          return `
            <button type="button" data-quick-meal-id="${escapeHTML(meal.id)}" class="quick-add-btn group flex min-h-[6.8rem] flex-col justify-between rounded-2xl border border-white/5 bg-slate-950/30 p-3 text-left transition hover:border-emerald-400/25 hover:bg-emerald-400/[0.055] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60" aria-label="Tambahkan ${escapeHTML(meal.name)}: ${formatNumber(meal.calories)} kilokalori, ${formatMacro(meal.protein)} gram protein">
              <span class="flex w-full items-start justify-between gap-2">
                <span class="grid h-7 w-7 place-items-center rounded-lg ring-1 ring-inset ${tone}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v8h5Z"/><path d="M21 15v7"/>
                  </svg>
                </span>
                <span class="quick-add-plus grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-slate-500 transition">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" class="h-3 w-3" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
                </span>
              </span>
              <span class="mt-2.5 block">
                <span class="block text-[11px] font-semibold leading-snug text-white">+${escapeHTML(meal.name)}</span>
                <span class="mt-1 flex flex-wrap items-center gap-x-1 text-[9px] font-medium leading-relaxed text-slate-500">
                  <span>${formatNumber(meal.calories)} kcal</span>
                  <span class="text-slate-700">·</span>
                  <span class="text-emerald-300/75">${formatMacro(meal.protein)} g protein</span>
                </span>
              </span>
            </button>
          `;
        })
        .join("");
    }

    if (els.mealTemplateManageList) {
      if (meals.length === 0) {
        els.mealTemplateManageList.innerHTML = `<p class="text-[11px] text-slate-500">Daftar template kosong.</p>`;
      } else {
        els.mealTemplateManageList.innerHTML = meals
          .map((meal) => `
            <div class="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-slate-900/60 px-3 py-2">
              <div class="min-w-0 flex-1">
                <p class="truncate text-xs font-semibold text-white">${escapeHTML(meal.name)}</p>
                <p class="text-[10px] text-slate-400">${formatNumber(meal.calories)} kcal · <span class="text-emerald-300">${formatMacro(meal.protein)} g protein</span></p>
              </div>
              <div class="flex shrink-0 items-center gap-1.5">
                <button type="button" data-edit-meal-template="${escapeHTML(meal.id)}" class="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">Edit</button>
                <button type="button" data-delete-meal-template="${escapeHTML(meal.id)}" class="rounded-lg border border-rose-400/20 bg-rose-400/10 px-2 py-1 text-[10px] font-semibold text-rose-200 transition hover:bg-rose-400/20">Hapus</button>
              </div>
            </div>
          `)
          .join("");
      }
    }
  }

  function renderProfileStatus() {
    const nickname = state.profile.nickname || "";
    const goalLabel = GOAL_SHORT_LABELS[state.profile.fitnessGoal] || "Personal Goal";

    if (els.headerNicknameLabel) {
      els.headerNicknameLabel.textContent = nickname || "Profile";
    }
    if (els.dashUserGreeting) {
      els.dashUserGreeting.textContent = nickname
        ? `Halo, ${nickname}! Pantau progres Anda hari ini.`
        : "Pantau berat badan, nutrisi, dan latihan Anda";
    }
    if (els.dashGoalBadge) {
      els.dashGoalBadge.textContent = goalLabel;
    }
    if (els.dietGoalBadge) {
      els.dietGoalBadge.textContent = goalLabel;
    }
  }

  function renderWeightCard() {
    const latest = getLatestWeightEntry();
    const previous = getPreviousWeightEntry();
    const progress = getWeightProgress();
    const target = state.profile.targetWeight || 0;

    els.currentWeight.textContent = latest.weight > 0 ? formatWeight(latest.weight) : "0,0";
    els.targetWeight.textContent = target > 0 ? formatNumber(target) : "—";
    els.targetWeightSide.textContent = target > 0 ? formatNumber(target) : "—";
    els.weightStart.textContent = progress.startWeight > 0 ? formatNumber(progress.startWeight) : "0";
    els.weightProgressLabel.textContent = `${Math.round(progress.percentage)}%`;
    els.weightProgressBar.style.width = `${progress.percentage}%`;

    if (els.weightProgressTitle) {
      if (progress.mode === "cutting") {
        els.weightProgressTitle.textContent = "Progres penurunan";
      } else if (progress.mode === "bulking") {
        els.weightProgressTitle.textContent = "Progres kenaikan";
      } else if (progress.mode === "maintenance") {
        els.weightProgressTitle.textContent = "Stabilitas berat badan";
      } else {
        els.weightProgressTitle.textContent = "Progres menuju target";
      }
    }

    const progressTrack = els.weightProgressBar.parentElement;
    if (progressTrack) {
      progressTrack.setAttribute("aria-valuenow", String(Math.round(progress.percentage)));
    }

    if (progress.mode === "unset") {
      els.weightRemaining.textContent = "Lengkapi profil untuk mengatur target berat";
    } else if (progress.remaining <= 0) {
      els.weightRemaining.textContent = "Target tercapai — pertahankan!";
    } else {
      els.weightRemaining.textContent = `${formatWeight(progress.remaining)} kg lagi menuju target`;
    }

    const badgeBase = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ";
    if (previous) {
      const difference = round1(latest.weight - previous.weight);
      if (Math.abs(difference) < 0.05) {
        els.weightChangeBadge.className = `${badgeBase}bg-white/5 text-slate-400`;
        els.weightChangeBadge.textContent = "Stabil";
      } else {
        const isDown = difference < 0;
        els.weightChangeBadge.className = `${badgeBase}${isDown ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"}`;
        els.weightChangeBadge.textContent = `${isDown ? "↓" : "↑"} ${formatWeight(Math.abs(difference))} kg`;
      }
    } else {
      els.weightChangeBadge.className = `${badgeBase}bg-white/5 text-slate-400`;
      els.weightChangeBadge.textContent = "—";
    }

    const todayEntry = getTodayWeightEntry();
    els.weightSavedStatus.textContent = todayEntry
      ? `Tersimpan hari ini pukul ${formatTime(todayEntry.updatedAt) || "—"}.`
      : "Belum ada update hari ini.";

    if (document.activeElement !== els.weightInput) {
      const prefill = round1(todayEntry?.weight ?? latest.weight);
      els.weightInput.value = prefill > 0 ? String(prefill) : "";
    }

    const chartEntries = state.weights.slice(-7);
    els.weightChart.innerHTML = buildWeightChart(chartEntries, {
      width: 600,
      height: 118,
      gradientId: "dashboard"
    });
    els.weightTrendLabel.textContent = chartEntries.length > 1
      ? `${chartEntries.length} catatan terakhir`
      : "Butuh 1 catatan lagi";
  }

  function updateNutritionMetric({ valueEl, targetEl, percentEl, barEl, noteEl, consumed, target, unit, formatter }) {
    const percent = target > 0 ? (consumed / target) * 100 : 0;
    valueEl.textContent = formatter(consumed);
    targetEl.textContent = formatter(target);
    percentEl.textContent = `${Math.round(percent)}%`;
    barEl.style.width = `${clamp(percent, 0, 100)}%`;

    const track = barEl.parentElement;
    if (track) {
      track.setAttribute("aria-valuenow", String(Math.round(clamp(percent, 0, 100))));
    }

    const remaining = round1(target - consumed);
    const isOver = remaining < 0;
    noteEl.textContent = isOver
      ? `${formatter(Math.abs(remaining))} ${unit} di atas target`
      : `Sisa ${formatter(remaining)} ${unit}`;
    noteEl.classList.toggle("text-rose-300", isOver);
    noteEl.classList.toggle("text-slate-500", !isOver);
  }

  function renderNutrition() {
    const logs = getTodayFoodLogs();
    const totals = sumNutrition(logs);
    const { calorieTarget, proteinTarget } = state.profile;

    updateNutritionMetric({
      valueEl: els.dashCaloriesValue,
      targetEl: els.dashCaloriesTarget,
      percentEl: els.dashCaloriesPercent,
      barEl: els.dashCaloriesBar,
      noteEl: els.dashCaloriesNote,
      consumed: totals.calories,
      target: calorieTarget,
      unit: "kcal",
      formatter: formatNumber
    });
    updateNutritionMetric({
      valueEl: els.dashProteinValue,
      targetEl: els.dashProteinTarget,
      percentEl: els.dashProteinPercent,
      barEl: els.dashProteinBar,
      noteEl: els.dashProteinNote,
      consumed: totals.protein,
      target: proteinTarget,
      unit: "g",
      formatter: formatMacro
    });
    updateNutritionMetric({
      valueEl: els.dietCaloriesValue,
      targetEl: els.dietCaloriesTarget,
      percentEl: els.dietCaloriesPercent,
      barEl: els.dietCaloriesBar,
      noteEl: els.dietCaloriesNote,
      consumed: totals.calories,
      target: calorieTarget,
      unit: "kcal",
      formatter: formatNumber
    });
    updateNutritionMetric({
      valueEl: els.dietProteinValue,
      targetEl: els.dietProteinTarget,
      percentEl: els.dietProteinPercent,
      barEl: els.dietProteinBar,
      noteEl: els.dietProteinNote,
      consumed: totals.protein,
      target: proteinTarget,
      unit: "g",
      formatter: formatMacro
    });

    const itemLabel = `${logs.length} item`;
    els.dietMealCount.textContent = itemLabel;
    els.dietLogCount.textContent = `${logs.length} log`;

    if (logs.length === 0) {
      els.dashNutritionSummary.textContent = "Belum ada makanan tercatat hari ini.";
      return;
    }

    const remainingCalories = round1(calorieTarget - totals.calories);
    const remainingProtein = round1(proteinTarget - totals.protein);
    let detail = `${logs.length} item · ${formatNumber(totals.calories)} kcal · ${formatMacro(totals.protein)} g protein. `;

    if (remainingCalories <= 0 && remainingProtein <= 0) {
      detail += "Target kalori dan protein sudah tercapai.";
    } else if (remainingCalories <= 0) {
      detail += `Kalori sudah penuh, sisa ${formatMacro(remainingProtein)} g protein.`;
    } else if (remainingProtein <= 0) {
      detail += `Protein sudah tercapai, sisa ${formatNumber(remainingCalories)} kcal.`;
    } else {
      detail += `Sisa ${formatNumber(remainingCalories)} kcal dan ${formatMacro(remainingProtein)} g protein.`;
    }

    els.dashNutritionSummary.textContent = detail;
  }

  function splitDetailMarkup(id) {
    const split = getSplit(id) ?? getActiveSplits()[0];
    const typeLower = String(split.type || "").toLowerCase();
    const isRest = typeLower.includes("rest") && !typeLower.includes("active");
    const isActiveRest = typeLower.includes("active") || typeLower.includes("cardio") || typeLower.includes("conditioning");
    const iconTone = isRest
      ? "bg-slate-400/10 text-slate-300 ring-slate-400/20"
      : isActiveRest
        ? "bg-amber-400/10 text-amber-300 ring-amber-400/20"
        : "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20";

    const tags = (split.tags || [])
      .map((tag) => `<span class="rounded-lg border border-white/5 bg-white/[0.045] px-2 py-1 text-[10px] font-medium text-slate-400">${escapeHTML(tag)}</span>`)
      .join("");

    return `
      <div class="flex items-start gap-3">
        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ring-inset ${iconTone}">
          ${splitIcon(split.id, "h-5 w-5")}
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500">${escapeHTML(split.type)}</p>
          <h4 class="mt-0.5 text-sm font-semibold leading-snug text-white">${escapeHTML(split.name)}</h4>
          <p class="mt-1 text-[11px] leading-relaxed text-slate-400">${escapeHTML(split.description)}</p>
        </div>
      </div>
      <div class="mt-3 flex flex-wrap gap-1.5">${tags}</div>
    `;
  }

  function renderSplit() {
    populateSplitSelect();
    const splitId = getSelectedSplitId();
    const split = getSplit(splitId) ?? getActiveSplits()[0];
    els.splitSelect.value = String(splitId);
    els.splitDayBadge.textContent = split.day;
    els.splitDetail.innerHTML = splitDetailMarkup(splitId);
    if (els.workoutSplitSelect && document.activeElement !== els.workoutSplitSelect) {
      els.workoutSplitSelect.value = String(splitId);
    }
  }

  function getActiveExerciseInput() {
    if (!els.workoutExerciseSelect) return "Squat";
    const selected = els.workoutExerciseSelect.value;
    if (selected === "__custom__") {
      return els.workoutExerciseCustom?.value.trim() || "";
    }
    return selected;
  }

  function getExerciseBestBefore(exerciseName, excludeId = null) {
    const norm = normalizeExerciseKey(exerciseName);
    const baseline = getBaselinePR(exerciseName);
    let bestLogged = 0;
    let bestLogged1RM = 0;

    if (norm && Array.isArray(state.workoutLogs)) {
      state.workoutLogs.forEach((log) => {
        if (excludeId && log.id === excludeId) return;
        if (normalizeExerciseKey(log.exercise) === norm) {
          const w = Number(log.weight) || 0;
          const e1rm = Number(log.est1RM) > 0 ? Number(log.est1RM) : calculateEpley1RM(w, log.reps);
          bestLogged = Math.max(bestLogged, w);
          bestLogged1RM = Math.max(bestLogged1RM, e1rm);
        }
      });
    }

    const threshold = Math.max(baseline, bestLogged);
    return { baseline, bestLogged, bestLogged1RM, threshold };
  }

  function isLogPR(log) {
    if (!log) return false;
    if (log.isPR) return true;
    const baseline = getBaselinePR(log.exercise);
    const est1RM = Number(log.est1RM) > 0 ? Number(log.est1RM) : calculateEpley1RM(log.weight, log.reps);
    if (baseline > 0 && (Number(log.weight) > baseline || est1RM > baseline)) return true;
    return false;
  }

  function getTodayBodyNote() {
    const key = todayKey();
    return state.bodyNotes.find((item) => item.date === key) ?? {
      date: key,
      tags: [],
      note: "",
      updatedAt: null
    };
  }

  function updateWorkoutLive1RM() {
    if (!els.workoutEst1RM) return;
    const exercise = getActiveExerciseInput();
    const { baseline, bestLogged, bestLogged1RM, threshold } = getExerciseBestBefore(exercise);
    const prKey = mapExerciseToPRKey(exercise);

    if (els.workoutPrBaselineHint) {
      if (baseline > 0) {
        const currentRecord = Math.max(baseline, bestLogged);
        els.workoutPrBaselineHint.textContent = currentRecord > baseline
          ? `PR Saat Ini: ${formatMacro(currentRecord)} kg`
          : `Baseline PR: ${formatMacro(baseline)} kg`;
      } else if (bestLogged > 0) {
        els.workoutPrBaselineHint.textContent = `Rekor: ${formatMacro(bestLogged)} kg`;
      } else {
        els.workoutPrBaselineHint.textContent = exercise ? "Baseline PR: 0 kg (Siap Cetak PR)" : "Pilih Gerakan";
      }
    }

    const weight = validNumber(els.workoutWeight?.value, 0.5, 600);
    const reps = validNumber(els.workoutReps?.value, 1, 100);
    const sets = validNumber(els.workoutSets?.value, 1, 30) ?? 1;

    if (weight === null || reps === null) {
      els.workoutEst1RM.textContent = "0,0";
      els.workoutVolumePreview.textContent = "Masukkan beban & repetisi";
      if (els.workoutLivePrBadge) els.workoutLivePrBadge.hidden = true;
      if (els.workout1RMBox) {
        els.workout1RMBox.classList.remove("border-amber-400/40", "bg-amber-400/[0.06]");
        els.workout1RMBox.classList.add("border-emerald-400/20", "bg-slate-950/50");
      }
      return;
    }

    const est1RM = calculateEpley1RM(weight, reps);
    const totalVolume = Math.round(weight * sets * reps);
    const isPRCandidate = threshold > 0
      ? (weight > threshold || est1RM > Math.max(baseline, bestLogged1RM))
      : Boolean(prKey && weight > 0);

    els.workoutEst1RM.textContent = formatWeight(est1RM);
    els.workoutVolumePreview.textContent = `${formatMacro(weight)} × (1 + ${Math.round(reps)}/30) · Vol ${formatNumber(totalVolume)} kg`;

    if (els.workoutLivePrBadge) {
      els.workoutLivePrBadge.hidden = !isPRCandidate;
    }
    if (els.workout1RMBox) {
      els.workout1RMBox.classList.toggle("border-amber-400/40", isPRCandidate);
      els.workout1RMBox.classList.toggle("bg-amber-400/[0.06]", isPRCandidate);
      els.workout1RMBox.classList.toggle("border-emerald-400/20", !isPRCandidate);
      els.workout1RMBox.classList.toggle("bg-slate-950/50", !isPRCandidate);
    }
  }

  function updateCardioAutoCalories() {
    if (!els.cardioDuration || !els.cardioCalories || cardioCaloriesManual) return;
    const duration = validNumber(els.cardioDuration.value, 1, 600);
    if (duration === null) {
      els.cardioCalories.value = "";
      return;
    }
    const activity = els.cardioActivity?.value || CARDIO_ACTIVITIES[0];
    const rate = CARDIO_KCAL_PER_MIN[activity] ?? 8;
    els.cardioCalories.value = String(Math.round(duration * rate));
  }

  function renderBodyNoteTags() {
    if (!els.bodyNoteTags) return;
    const todayNote = getTodayBodyNote();
    const activeTags = new Set(todayNote.tags);

    els.bodyNoteTags.innerHTML = BODY_NOTE_TAGS
      .map((tag) => {
        const selected = activeTags.has(tag);
        return `
          <button type="button" data-body-tag="${escapeHTML(tag)}" class="body-tag-btn ${selected ? "is-selected" : ""}" aria-pressed="${selected}">
            ${selected ? "✓ " : "+ "}${escapeHTML(tag)}
          </button>
        `;
      })
      .join("");

    if (els.bodyNotesInput && document.activeElement !== els.bodyNotesInput) {
      els.bodyNotesInput.value = todayNote.note || "";
    }

    if (els.bodyNotesStatus) {
      const hasContent = todayNote.tags.length > 0 || Boolean(todayNote.note);
      els.bodyNotesStatus.textContent = hasContent ? "Tersimpan hari ini" : "Hari ini";
      els.bodyNotesStatus.className = hasContent
        ? "shrink-0 rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold text-amber-300"
        : "shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-slate-400";
    }
  }

  function renderWorkoutHistory() {
    if (!els.workoutHistoryList) return;

    const totalPRs = state.workoutLogs.filter((log) => isLogPR(log)).length;
    if (els.workoutPrCountBadge) {
      els.workoutPrCountBadge.innerHTML = `
        <span class="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
        <span>${formatNumber(totalPRs)} PR</span>
      `;
    }

    const datesSet = new Set();
    state.workoutLogs.forEach((item) => datesSet.add(item.date));
    state.cardioLogs.forEach((item) => datesSet.add(item.date));
    state.bodyNotes.forEach((item) => {
      if ((item.tags && item.tags.length > 0) || item.note) {
        datesSet.add(item.date);
      }
    });

    const sortedDates = [...datesSet].sort((a, b) => b.localeCompare(a));
    if (els.workoutHistoryCount) {
      const totalItems = state.workoutLogs.length + state.cardioLogs.length;
      els.workoutHistoryCount.textContent = `${formatNumber(sortedDates.length)} hari · ${formatNumber(totalItems)} log`;
    }

    if (sortedDates.length === 0) {
      els.workoutHistoryList.innerHTML = `
        <div class="flex items-start gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4">
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-slate-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true">
              <path d="m6.5 6.5 11 11M3 10l7-7M14 21l7-7M3 14l3-3M18 22l4-4M2 6l4-4"/>
            </svg>
          </span>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-slate-300">Belum ada riwayat latihan tercatat</p>
            <p class="mt-1 text-[10px] leading-relaxed text-slate-500">Catat angkatan beban, sesi cardio/active recovery, atau kondisi fisik di atas. Badge <span class="font-bold text-amber-300">NEW PR! 🔥</span> akan menyala otomatis saat angkatan atau Est. 1RM melewati Baseline PR di profil Anda.</p>
          </div>
        </div>
      `;
      return;
    }

    els.workoutHistoryList.innerHTML = sortedDates
      .map((date) => {
        const dayWorkouts = state.workoutLogs
          .filter((item) => item.date === date)
          .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        const dayCardios = state.cardioLogs
          .filter((item) => item.date === date)
          .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        const dayBodyNote = state.bodyNotes.find((item) => item.date === date);

        const isToday = date === todayKey();
        const dateLabel = capitalize(dateFormatter.format(parseDateKey(date)));
        const dayHasPR = dayWorkouts.some((item) => isLogPR(item));
        const splitIdForDay = dayWorkouts[0]?.splitId ?? state.selectedSplits[date] ?? null;
        const splitForDay = splitIdForDay ? getSplit(splitIdForDay) : null;

        const bodyNoteMarkup = dayBodyNote && (dayBodyNote.tags.length > 0 || dayBodyNote.note)
          ? `
            <div class="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-3">
              <div class="flex items-center justify-between gap-2">
                <p class="text-[10px] font-bold uppercase tracking-wider text-amber-300">Body &amp; Joint Notes</p>
                <button type="button" data-delete-body-note="${escapeHTML(date)}" class="text-[10px] font-medium text-slate-500 transition hover:text-rose-300" aria-label="Hapus catatan fisik tanggal ${escapeHTML(dateLabel)}">Hapus</button>
              </div>
              ${dayBodyNote.tags.length > 0
                ? `<div class="mt-2 flex flex-wrap gap-1.5">
                    ${dayBodyNote.tags.map((tag) => `<span class="rounded-lg border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">${escapeHTML(tag)}</span>`).join("")}
                  </div>`
                : ""}
              ${dayBodyNote.note
                ? `<p class="mt-2 text-[11px] leading-relaxed text-slate-300">${escapeHTML(dayBodyNote.note)}</p>`
                : ""}
            </div>
          `
          : "";

        const workoutsMarkup = dayWorkouts
          .map((log) => {
            const pr = isLogPR(log);
            const baseline = getBaselinePR(log.exercise);
            const splitObj = getSplit(log.splitId);
            const prDiff = pr
              ? `Rekor PR untuk ${log.exercise} (Baseline PR saat ini: ${formatMacro(baseline)} kg)`
              : "Rekor angkatan terbaik baru!";

            return `
              <div class="flex items-start gap-3 rounded-2xl border ${pr ? "border-amber-400/35 bg-amber-400/[0.045]" : "border-white/5 bg-slate-950/40"} p-3.5">
                <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl ${pr ? "bg-amber-400/15 text-amber-300 ring-1 ring-inset ring-amber-400/30" : "bg-emerald-400/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/15"}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true">
                    <path d="m6.5 6.5 11 11M3 10l7-7M14 21l7-7M3 14l3-3M18 22l4-4M2 6l4-4"/>
                  </svg>
                </span>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <h5 class="text-xs font-semibold text-white">${escapeHTML(log.exercise)}</h5>
                    ${splitObj ? `<span class="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">${escapeHTML(splitObj.day)}</span>` : ""}
                    ${pr ? `<span class="pr-badge" title="${escapeHTML(prDiff)}">NEW PR! 🔥</span>` : ""}
                  </div>
                  <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                    <span class="font-mono font-bold text-white">${formatMacro(log.weight)} kg</span>
                    <span class="font-mono text-slate-300">${formatNumber(log.sets)} set &times; ${formatNumber(log.reps)} rep</span>
                    <span class="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">RPE ${formatMacro(log.rpe)}</span>
                    <span class="font-mono text-[10px] font-semibold text-emerald-300">Est. 1RM ${formatWeight(log.est1RM)} kg</span>
                  </div>
                  ${pr ? `<p class="mt-1 text-[10px] font-medium text-amber-300/90">${escapeHTML(prDiff)}</p>` : ""}
                </div>
                <button type="button" data-delete-workout="${escapeHTML(log.id)}" class="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-600 transition hover:bg-rose-400/10 hover:text-rose-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60" aria-label="Hapus log ${escapeHTML(log.exercise)}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
                  </svg>
                </button>
              </div>
            `;
          })
          .join("");

        const cardiosMarkup = dayCardios
          .map((cardio) => `
            <div class="flex items-center gap-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3.5">
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300 ring-1 ring-inset ring-cyan-400/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-1.5">
                  <h5 class="text-xs font-semibold text-white">${escapeHTML(cardio.activity)}</h5>
                  <span class="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-300">Cardio</span>
                </div>
                <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
                  <span class="font-mono font-semibold text-slate-200">${formatNumber(cardio.duration)} menit</span>
                  <span class="font-mono text-cyan-300">~${formatNumber(cardio.calories)} kcal terbakar</span>
                </div>
              </div>
              <button type="button" data-delete-cardio="${escapeHTML(cardio.id)}" class="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-600 transition hover:bg-rose-400/10 hover:text-rose-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60" aria-label="Hapus cardio ${escapeHTML(cardio.activity)}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
                </svg>
              </button>
            </div>
          `)
          .join("");

        return `
          <article class="glass-card p-4 sm:p-5">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div class="flex flex-wrap items-center gap-2">
                <h4 class="text-xs font-bold text-white">${escapeHTML(dateLabel)}</h4>
                ${isToday ? `<span class="rounded-md bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">Hari ini</span>` : ""}
              </div>
              <div class="flex items-center gap-1.5">
                ${dayHasPR ? `<span class="pr-badge">NEW PR! 🔥</span>` : ""}
                ${splitForDay ? `<span class="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">${escapeHTML(splitForDay.day)}</span>` : ""}
              </div>
            </div>

            ${bodyNoteMarkup}

            ${workoutsMarkup ? `<div class="mt-3 space-y-2.5">${workoutsMarkup}</div>` : ""}
            ${cardiosMarkup ? `<div class="mt-2.5 space-y-2.5">${cardiosMarkup}</div>` : ""}
          </article>
        `;
      })
      .join("");
  }

  function renderWorkout() {
    populateSplitSelect();
    populateExerciseSelect();
    populateCardioSelect();

    const splitId = getSelectedSplitId();
    els.workoutTodayDay.textContent = getSplit(splitId)?.day ?? "Day 1";
    els.workoutToday.innerHTML = splitDetailMarkup(splitId);

    if (els.workoutSplitSelect && document.activeElement !== els.workoutSplitSelect) {
      els.workoutSplitSelect.value = String(splitId);
    }

    if (els.editSplitName && !els.editSplitName.value) {
      populateSplitEditorForm(splitId);
    }

    els.workoutSplitList.innerHTML = getActiveSplits()
      .map((split) => {
        const isActive = split.id === splitId;
        const tags = (split.tags || [])
          .map((tag) => `<span class="rounded-md border border-white/5 bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-medium text-slate-400">${escapeHTML(tag)}</span>`)
          .join("");

        return `
          <article class="rounded-2xl border p-4 transition ${isActive ? "border-emerald-400/35 bg-emerald-400/[0.055]" : "border-white/5 bg-slate-950/30"}">
            <div class="flex items-start gap-3">
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[11px] font-bold ${isActive ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/20" : "bg-white/[0.045] text-slate-500 ring-1 ring-inset ring-white/5"}">
                ${pad(split.id)}
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-emerald-400" : "text-slate-500"}">${split.day} · ${escapeHTML(split.type)}</p>
                    <h4 class="mt-0.5 text-xs font-semibold leading-snug text-white">${escapeHTML(split.name)}</h4>
                  </div>
                  <div class="flex shrink-0 items-center gap-1.5">
                    <button type="button" data-edit-split="${split.id}" class="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">Edit</button>
                    ${isActive
                      ? `<span class="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-300">Aktif</span>`
                      : `<button type="button" data-select-split="${split.id}" class="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-200 transition hover:bg-emerald-400/20">Pilih</button>`}
                  </div>
                </div>
                <p class="mt-1.5 text-[10px] leading-relaxed text-slate-500">${escapeHTML(split.description)}</p>
                <div class="mt-2 flex flex-wrap gap-1">${tags}</div>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    updateWorkoutLive1RM();
    renderBodyNoteTags();
    renderWorkoutHistory();
  }

  function renderFoodList() {
    const logs = getTodayFoodLogs();

    if (logs.length === 0) {
      els.foodList.innerHTML = `
        <div class="flex items-start gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4">
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-slate-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true">
              <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/>
            </svg>
          </span>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-slate-300">Belum ada log makanan</p>
            <p class="mt-1 text-[10px] leading-relaxed text-slate-500">Gunakan Template Menu Diet (1-Tap) atau Input Makanan Manual di atas. Dashboard akan langsung diperbarui.</p>
          </div>
        </div>
      `;
      return;
    }

    const templateNames = new Set(getActiveMeals().map((m) => normalizeExerciseKey(m.name)));

    els.foodList.innerHTML = logs
      .map((log) => {
        const time = formatTime(log.createdAt);
        const alreadyInTemplate = templateNames.has(normalizeExerciseKey(log.name));
        return `
          <article class="flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-950/30 p-3.5">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-400/10 text-blue-300 ring-1 ring-inset ring-blue-400/15">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v8h5Z"/><path d="M21 15v7"/>
              </svg>
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <h4 class="truncate text-xs font-semibold text-white">${escapeHTML(log.name)}</h4>
                ${time ? `<span class="shrink-0 font-mono text-[9px] text-slate-600">${escapeHTML(time)}</span>` : ""}
              </div>
              <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px]">
                <span class="font-medium text-slate-400">${formatNumber(log.calories)} kcal</span>
                <span class="font-medium text-emerald-300/80">${formatMacro(log.protein)} g protein</span>
              </div>
            </div>
            ${!alreadyInTemplate
              ? `<button type="button" data-save-log-template="${escapeHTML(log.id)}" class="shrink-0 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2 py-1.5 text-[9px] font-bold text-emerald-300 transition hover:bg-emerald-400/20" title="Simpan ke Template Menu 1-Tap">+ Template</button>`
              : ""}
            <button type="button" data-delete-food="${escapeHTML(log.id)}" class="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-600 transition hover:bg-rose-400/10 hover:text-rose-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60" aria-label="Hapus ${escapeHTML(log.name)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
              </svg>
            </button>
          </article>
        `;
      })
      .join("");
  }

  function analyticsStatCard(label, value, unit, detail, tone = "slate") {
    const valueTone = tone === "emerald"
      ? "text-emerald-300"
      : tone === "blue"
        ? "text-blue-300"
        : "text-white";
    return `
      <article class="glass-card p-4">
        <p class="text-[10px] font-medium uppercase tracking-wider text-slate-500">${label}</p>
        <p class="mt-1.5 font-mono text-[1.35rem] font-semibold leading-none tracking-tight ${valueTone}">${value}<span class="ml-1 text-[10px] font-medium text-slate-500">${unit}</span></p>
        <p class="mt-2 text-[9px] leading-relaxed text-slate-500">${detail}</p>
      </article>
    `;
  }

  function isAnalyticsVisible() {
    return Boolean(els.analyticsView && !els.analyticsView.hidden);
  }

  function destroyAnalyticsCharts() {
    if (bodyweightChartInstance) {
      bodyweightChartInstance.destroy();
      bodyweightChartInstance = null;
    }
    if (strengthChartInstance) {
      strengthChartInstance.destroy();
      strengthChartInstance = null;
    }
  }

  function refreshAnalyticsChartsSoon() {
    if (analyticsChartFrame) window.cancelAnimationFrame(analyticsChartFrame);
    analyticsChartFrame = window.requestAnimationFrame(() => {
      analyticsChartFrame = null;
      renderAnalyticsCharts();
    });
  }

  function bodyweightAreaGradient(context) {
    const { ctx, chartArea } = context.chart;
    if (!chartArea) return "rgba(52, 211, 153, 0.12)";
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, "rgba(52, 211, 153, 0.28)");
    gradient.addColorStop(1, "rgba(52, 211, 153, 0)");
    return gradient;
  }

  function chartTooltipOptions() {
    return {
      backgroundColor: "rgba(2, 6, 23, 0.95)",
      borderColor: "rgba(148, 163, 184, 0.22)",
      borderWidth: 1,
      titleColor: "#e2e8f0",
      bodyColor: "#cbd5e1",
      padding: 10,
      cornerRadius: 10,
      titleFont: { size: 10, family: '"Plus Jakarta Sans", sans-serif', weight: "700" },
      bodyFont: { size: 10, family: '"JetBrains Mono", monospace', weight: "600" },
      displayColors: false
    };
  }

  function renderAnalyticsCharts() {
    destroyAnalyticsCharts();
    if (!isAnalyticsVisible()) return;

    const ChartLib = window.Chart;
    if (!ChartLib) return;

    ChartLib.defaults.font.family = '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif';
    ChartLib.defaults.color = "#64748b";

    const weightCanvas = document.getElementById("analytics-bodyweight-chart");
    if (weightCanvas) {
      const entries = state.weights
        .slice(-30)
        .filter((entry) => Number.isFinite(Number(entry.weight)));
      const labels = entries.map((entry) => formatChartDate(entry.date));
      const values = entries.map((entry) => round1(entry.weight));
      const target = state.profile.targetWeight;
      const anchored = [...values, target];
      const low = Math.min(...anchored);
      const high = Math.max(...anchored);
      const padding = Math.max((high - low) * 0.2, 0.8);

      bodyweightChartInstance = new ChartLib(weightCanvas, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Bodyweight",
              data: values,
              borderColor: "#34d399",
              backgroundColor: bodyweightAreaGradient,
              borderWidth: 2.4,
              pointRadius: values.length > 16 ? 0 : 3,
              pointHoverRadius: 5,
              pointBackgroundColor: "#0f172a",
              pointBorderColor: "#34d399",
              pointBorderWidth: 2,
              tension: 0.32,
              fill: true
            },
            {
              label: `Target ${formatNumber(target)} kg`,
              data: labels.map(() => target),
              borderColor: "#38bdf8",
              borderWidth: 1.4,
              borderDash: [6, 5],
              pointRadius: 0,
              pointHoverRadius: 0,
              tension: 0,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 520 },
          interaction: { mode: "index", intersect: false },
          layout: { padding: { top: 4, right: 4 } },
          plugins: {
            legend: {
              display: true,
              position: "top",
              align: "end",
              labels: {
                color: "#94a3b8",
                boxWidth: 12,
                boxHeight: 2,
                padding: 12,
                font: { size: 9, weight: "600" }
              }
            },
            tooltip: {
              ...chartTooltipOptions(),
              callbacks: {
                label(context) {
                  if (context.datasetIndex === 1) {
                    return `Target: ${formatWeight(context.parsed.y)} kg`;
                  }
                  return `Berat: ${formatWeight(context.parsed.y)} kg`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              border: { display: false },
              ticks: {
                color: "#64748b",
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 6,
                font: { size: 9 }
              }
            },
            y: {
              suggestedMin: round1(low - padding),
              suggestedMax: round1(high + padding),
              grid: { color: "rgba(148, 163, 184, 0.08)" },
              border: { display: false },
              ticks: {
                color: "#64748b",
                maxTicksLimit: 5,
                font: { size: 9 },
                callback: (value) => `${formatWeight(value)}`
              }
            }
          }
        }
      });
    }

    const strengthCanvas = document.getElementById("analytics-strength-chart");
    if (strengthCanvas) {
      const weeks = getStrengthWeeklyData(strengthFilter);
      const labels = weeks.map((week) => formatChartDate(week.week));

      strengthChartInstance = new ChartLib(strengthCanvas, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Top Set",
              data: weeks.map((week) => round1(week.topSet)),
              borderColor: "#34d399",
              backgroundColor: "rgba(52, 211, 153, 0.1)",
              borderWidth: 2.2,
              pointRadius: 3,
              pointHoverRadius: 5,
              pointBackgroundColor: "#0f172a",
              pointBorderColor: "#34d399",
              pointBorderWidth: 2,
              tension: 0.3,
              fill: true
            },
            {
              label: "Estimated 1RM",
              data: weeks.map((week) => round1(week.e1rm)),
              borderColor: "#38bdf8",
              backgroundColor: "rgba(56, 189, 248, 0.08)",
              borderWidth: 1.8,
              borderDash: [5, 4],
              pointRadius: 2.5,
              pointHoverRadius: 4.5,
              pointBackgroundColor: "#0f172a",
              pointBorderColor: "#38bdf8",
              pointBorderWidth: 2,
              tension: 0.3,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 520 },
          interaction: { mode: "index", intersect: false },
          layout: { padding: { top: 4, right: 4 } },
          plugins: {
            legend: {
              display: true,
              position: "top",
              align: "end",
              labels: {
                color: "#94a3b8",
                boxWidth: 12,
                boxHeight: 2,
                padding: 12,
                font: { size: 9, weight: "600" }
              }
            },
            tooltip: {
              ...chartTooltipOptions(),
              callbacks: {
                label(context) {
                  return `${context.dataset.label}: ${formatWeight(context.parsed.y)} kg`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              border: { display: false },
              ticks: {
                color: "#64748b",
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 6,
                font: { size: 9 }
              }
            },
            y: {
              grid: { color: "rgba(148, 163, 184, 0.08)" },
              border: { display: false },
              ticks: {
                color: "#64748b",
                maxTicksLimit: 5,
                font: { size: 9 },
                callback: (value) => `${formatWeight(value)} kg`
              }
            }
          }
        }
      });
    }
  }

  function renderAnalytics() {
    if (analyticsChartFrame) {
      window.cancelAnimationFrame(analyticsChartFrame);
      analyticsChartFrame = null;
    }
    destroyAnalyticsCharts();

    const latest = getLatestWeightEntry();
    const progress = getWeightProgress();
    const startDifference = round1(latest.weight - progress.startWeight);
    const changeDetail = Math.abs(startDifference) < 0.05
      ? "Belum ada perubahan dari berat awal"
      : startDifference < 0
        ? `Turun ${formatWeight(Math.abs(startDifference))} kg dari berat awal`
        : `Naik ${formatWeight(startDifference)} kg dari berat awal`;

    const weekKeys = lastNDays(7);
    const weekData = weekKeys.map((key) => {
      const logs = getFoodLogsFor(key);
      return { key, logs, totals: sumNutrition(logs) };
    });
    const loggedDays = weekData.filter((day) => day.logs.length > 0);
    const averageCalories = loggedDays.length
      ? loggedDays.reduce((total, day) => total + day.totals.calories, 0) / loggedDays.length
      : 0;
    const averageProtein = loggedDays.length
      ? loggedDays.reduce((total, day) => total + day.totals.protein, 0) / loggedDays.length
      : 0;

    const weightEntries = state.weights.slice(-30);
    const hasChartJs = typeof window.Chart === "function";
    const hasWeightTrend = weightEntries.length > 1;
    const weightChartMarkup = hasChartJs && hasWeightTrend
      ? `<div class="chart-canvas-wrap">
          <canvas id="analytics-bodyweight-chart" role="img" aria-label="Grafik tren berat badan menuju target ${formatNumber(progress.targetWeight)} kilogram"></canvas>
        </div>`
      : buildWeightChart(weightEntries.slice(-14), {
        width: 600,
        height: 168,
        gradientId: "analytics"
      });

    const analyticsOptions = getAnalyticsStrengthOptions();
    if (!analyticsOptions.includes(strengthFilter)) {
      strengthFilter = analyticsOptions[0];
    }
    const strengthWeeks = getStrengthWeeklyData(strengthFilter);
    const strengthSummary = getStrengthSummary(strengthFilter);
    const strengthLogs = getStrengthLogsForFilter(strengthFilter);
    const latestStrength = strengthLogs[0] ?? null;
    const exerciseOptions = analyticsOptions
      .map((exercise) => `<option value="${escapeHTML(exercise)}"${exercise === strengthFilter ? " selected" : ""}>${escapeHTML(exercise)}</option>`)
      .join("");

    let strengthChartMarkup;
    if (!hasChartJs) {
      strengthChartMarkup = `
        <div class="chart-empty">
          Grafik interaktif membutuhkan Chart.js. Muat aplikasi sekali dengan koneksi internet agar grafik tersedia offline.
        </div>
      `;
    } else if (strengthWeeks.length === 0) {
      strengthChartMarkup = `
        <div class="chart-empty flex-col gap-2.5">
          <span>Belum ada data ${escapeHTML(strengthFilter)}. Catat set pertamamu dari tab Workout untuk memulai grafik mingguan.</span>
          <button type="button" data-go-tab="workout" class="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-300 transition hover:bg-emerald-400/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60">
            Catat di Workout
          </button>
        </div>
      `;
    } else {
      strengthChartMarkup = `
        <div class="chart-canvas-wrap">
          <canvas id="analytics-strength-chart" role="img" aria-label="Grafik progres ${escapeHTML(strengthFilter)}: top set dan estimated 1RM per minggu"></canvas>
        </div>
      `;
    }

    const latestStrengthMarkup = latestStrength
      ? `<p class="mt-3 border-t border-white/5 pt-3 text-[10px] leading-relaxed text-slate-500">
          Terakhir: <span class="font-mono font-semibold text-slate-300">${formatMacro(latestStrength.weight)} kg × ${formatNumber(latestStrength.reps)}</span>
          · ${escapeHTML(formatStrengthDate(latestStrength.date))}
          · e1RM <span class="font-mono font-semibold text-blue-300">${formatWeight(latestStrength.est1RM)} kg</span>
        </p>`
      : "";

    const weekRows = weekData
      .map((day) => {
        const hasLogs = day.logs.length > 0;
        const caloriePercent = state.profile.calorieTarget > 0
          ? clamp((day.totals.calories / state.profile.calorieTarget) * 100, 0, 100)
          : 0;
        const proteinPercent = state.profile.proteinTarget > 0
          ? clamp((day.totals.protein / state.profile.proteinTarget) * 100, 0, 100)
          : 0;
        const isToday = day.key === todayKey();
        const detail = hasLogs
          ? `${formatNumber(day.totals.calories)} kcal · ${formatMacro(day.totals.protein)} g`
          : "Tidak ada log";

        return `
          <div class="border-b border-white/5 py-3.5 first:pt-0 last:border-0 last:pb-0">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-semibold ${isToday ? "text-emerald-300" : "text-slate-400"}">${escapeHTML(formatShortDay(day.key))}</span>
                ${isToday ? `<span class="rounded-md bg-emerald-400/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-300">Hari ini</span>` : ""}
              </div>
              <span class="text-[9px] ${hasLogs ? "text-slate-400" : "text-slate-600"}">${detail}</span>
            </div>
            <div class="mt-2 space-y-1">
              <div class="h-1.5 overflow-hidden rounded-full bg-slate-950/60" role="progressbar" aria-label="Kalori ${escapeHTML(formatShortDay(day.key))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(caloriePercent)}">
                <div class="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style="width: ${caloriePercent}%"></div>
              </div>
              <div class="h-1.5 overflow-hidden rounded-full bg-slate-950/60" role="progressbar" aria-label="Protein ${escapeHTML(formatShortDay(day.key))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(proteinPercent)}">
                <div class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300" style="width: ${proteinPercent}%"></div>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    els.analyticsContent.innerHTML = `
      <div class="grid grid-cols-2 gap-3">
        ${analyticsStatCard("Berat saat ini", formatWeight(latest.weight), "kg", changeDetail, "emerald")}
        ${analyticsStatCard("Sisa ke target", formatWeight(progress.remaining), "kg", `Target ${formatNumber(progress.targetWeight)} kg`, "blue")}
        ${analyticsStatCard("Kalori 7D", formatNumber(averageCalories), "kcal", `${loggedDays.length} dari 7 hari tercatat`)}
        ${analyticsStatCard("Protein 7D", formatMacro(averageProtein), "g", `${loggedDays.length} dari 7 hari tercatat`)}
      </div>

      <article class="glass-card p-5 sm:p-6">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-sm font-semibold text-white">Bodyweight Trend</h3>
            <p class="mt-0.5 text-[11px] text-slate-400">${hasWeightTrend ? `${Math.min(weightEntries.length, 30)} catatan terakhir · garis target ${formatNumber(progress.targetWeight)} kg` : "Butuh minimal 2 catatan"}</p>
          </div>
          <span class="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">${state.weights.length} data</span>
        </div>
        <div class="mt-4">${weightChartMarkup}</div>
        <div class="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-[10px]">
          <span class="text-slate-500">Awal <span class="font-semibold text-slate-300">${formatWeight(progress.startWeight)} kg</span></span>
          <span class="text-slate-500">Sekarang <span class="font-semibold text-emerald-300">${formatWeight(progress.current)} kg</span></span>
        </div>
      </article>

      <article class="glass-card p-5 sm:p-6">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-sm font-semibold text-white">Strength Progression</h3>
            <p class="mt-0.5 text-[11px] text-slate-400">Top set & estimated 1RM per minggu</p>
          </div>
          <span class="rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-[10px] font-semibold text-blue-300">${formatNumber(strengthSummary.totalSets)} set</span>
        </div>

        <label for="strength-filter" class="sr-only">Filter gerakan strength</label>
        <div class="relative mt-3">
          <select id="strength-filter" class="select-field">${exerciseOptions}</select>
        </div>

        <div class="mt-3 grid grid-cols-2 gap-2">
          <div class="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] px-3 py-2.5">
            <p class="text-[9px] font-medium uppercase tracking-wider text-slate-500">Top Set terbaik</p>
            <p class="mt-1 font-mono text-sm font-semibold text-emerald-300">${strengthSummary.totalSets > 0 ? formatWeight(strengthSummary.bestTopSet) : "—"}<span class="ml-1 text-[9px] font-medium text-slate-500">kg</span></p>
          </div>
          <div class="rounded-xl border border-blue-400/15 bg-blue-400/[0.04] px-3 py-2.5">
            <p class="text-[9px] font-medium uppercase tracking-wider text-slate-500">e1RM terbaik</p>
            <p class="mt-1 font-mono text-sm font-semibold text-blue-300">${strengthSummary.totalSets > 0 ? formatWeight(strengthSummary.bestE1rm) : "—"}<span class="ml-1 text-[9px] font-medium text-slate-500">kg</span></p>
          </div>
        </div>

        <div class="mt-4">${strengthChartMarkup}</div>
        ${latestStrengthMarkup}
        <p class="mt-2 text-[9px] leading-relaxed text-slate-500">Estimated 1RM memakai rumus Epley: beban × (1 + reps / 30). Grafik menampilkan maksimal 12 minggu terakhir.</p>
      </article>

      <article class="glass-card p-5 sm:p-6">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-sm font-semibold text-white">Asupan 7 Hari</h3>
            <p class="mt-0.5 text-[11px] text-slate-400">Dibanding target harian</p>
          </div>
          <div class="flex items-center gap-2.5 text-[9px] text-slate-500">
            <span class="inline-flex items-center gap-1"><span class="h-1.5 w-3 rounded-full bg-blue-400"></span>Kalori</span>
            <span class="inline-flex items-center gap-1"><span class="h-1.5 w-3 rounded-full bg-emerald-400"></span>Protein</span>
          </div>
        </div>
        <div class="mt-3">${weekRows}</div>
      </article>

      <div class="flex items-start gap-2.5 rounded-2xl border border-white/5 bg-white/[0.025] px-4 py-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true">
          <circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>
        </svg>
        <p class="text-[10px] leading-relaxed text-slate-500">Rata-rata kalori dan protein hanya menghitung hari yang memiliki log makanan. Data strength diambil dari Workout Log; minggu dimulai hari Senin.</p>
      </div>
    `;

    refreshAnalyticsChartsSoon();
  }

  function renderDataSummary() {
    const weightCount = state.weights.length;
    const foodCount = state.foodLogs.length;
    const workoutCount = state.workoutLogs.length + state.cardioLogs.length;
    els.dataSummary.textContent = `${formatNumber(weightCount)} catatan berat · ${formatNumber(foodCount)} log makanan · ${formatNumber(workoutCount)} log latihan`;
  }

  function renderAll() {
    renderDates();
    renderProfileStatus();
    populateProfileForms();
    renderWeightCard();
    renderQuickMeals();
    renderNutrition();
    renderSplit();
    renderWorkout();
    renderFoodList();
    renderAnalytics();
    renderDataSummary();
  }

  function cacheElements() {
    els.todayDates = [...document.querySelectorAll("[data-today-date]")];
    els.navButtons = [...document.querySelectorAll("[data-tab-target]")];
    els.views = [...document.querySelectorAll("[data-view]")];

    els.headerProfileBtn = document.getElementById("header-profile-btn");
    els.headerNicknameLabel = document.getElementById("header-nickname-label");
    els.dashUserGreeting = document.getElementById("dash-user-greeting");
    els.dashGoalBadge = document.getElementById("dash-goal-badge");
    els.weightProgressTitle = document.getElementById("weight-progress-title");
    els.dietGoalBadge = document.getElementById("diet-goal-badge");

    els.onboardingModal = document.getElementById("onboarding-modal");
    els.onboardingForm = document.getElementById("onboarding-form");
    els.onbCalcBtn = document.getElementById("onb-calc-btn");
    els.profilePageForm = document.getElementById("profile-page-form");
    els.profCalcBtn = document.getElementById("prof-calc-btn");

    els.openSettings = document.getElementById("open-settings");
    els.settingsModal = document.getElementById("settings-modal");
    els.settingsBackdrop = document.getElementById("settings-backdrop");
    els.closeSettings = document.getElementById("close-settings");
    els.exportData = document.getElementById("export-data");
    els.importData = document.getElementById("import-data");
    els.importFile = document.getElementById("import-file");
    els.dataSummary = document.getElementById("data-summary");
    els.settingsForm = document.getElementById("settings-form");
    els.settingTargetWeight = document.getElementById("setting-target-weight");
    els.settingCalorieTarget = document.getElementById("setting-calorie-target");
    els.settingProteinTarget = document.getElementById("setting-protein-target");

    els.currentWeight = document.getElementById("current-weight");
    els.targetWeight = document.getElementById("target-weight");
    els.targetWeightSide = document.getElementById("target-weight-side");
    els.weightChangeBadge = document.getElementById("weight-change-badge");
    els.weightProgressLabel = document.getElementById("weight-progress-label");
    els.weightProgressBar = document.getElementById("weight-progress-bar");
    els.weightRemaining = document.getElementById("weight-remaining");
    els.weightStart = document.getElementById("weight-start");
    els.weightTrendLabel = document.getElementById("weight-trend-label");
    els.weightChart = document.getElementById("weight-chart");
    els.weightForm = document.getElementById("weight-form");
    els.weightInput = document.getElementById("weight-input");
    els.weightSavedStatus = document.getElementById("weight-saved-status");

    els.dashCaloriesValue = document.getElementById("dash-calories-value");
    els.dashCaloriesTarget = document.getElementById("dash-calories-target");
    els.dashCaloriesPercent = document.getElementById("dash-calories-percent");
    els.dashCaloriesBar = document.getElementById("dash-calories-bar");
    els.dashCaloriesNote = document.getElementById("dash-calories-note");
    els.dashProteinValue = document.getElementById("dash-protein-value");
    els.dashProteinTarget = document.getElementById("dash-protein-target");
    els.dashProteinPercent = document.getElementById("dash-protein-percent");
    els.dashProteinBar = document.getElementById("dash-protein-bar");
    els.dashProteinNote = document.getElementById("dash-protein-note");
    els.dashNutritionSummary = document.getElementById("dash-nutrition-summary");

    els.splitSelect = document.getElementById("split-select");
    els.splitDetail = document.getElementById("split-detail");
    els.splitDayBadge = document.getElementById("split-day-badge");

    els.workoutTodayDay = document.getElementById("workout-today-day");
    els.workoutToday = document.getElementById("workout-today");
    els.workoutSplitDetails = document.getElementById("workout-split-details");
    els.workoutSplitList = document.getElementById("workout-split-list");
    els.splitTemplateSelect = document.getElementById("split-template-select");
    els.applySplitTemplateBtn = document.getElementById("apply-split-template-btn");
    els.splitEditorForm = document.getElementById("split-editor-form");
    els.editSplitDay = document.getElementById("edit-split-day");
    els.editSplitName = document.getElementById("edit-split-name");
    els.editSplitType = document.getElementById("edit-split-type");
    els.editSplitTags = document.getElementById("edit-split-tags");
    els.editSplitDesc = document.getElementById("edit-split-desc");

    els.workoutPrCountBadge = document.getElementById("workout-pr-count-badge");
    els.workoutSplitSelect = document.getElementById("workout-split-select");
    els.workoutForm = document.getElementById("workout-form");
    els.workoutExerciseSelect = document.getElementById("workout-exercise-select");
    els.workoutExerciseCustomWrap = document.getElementById("workout-custom-exercise-wrap");
    els.workoutExerciseCustom = document.getElementById("workout-exercise-custom");
    els.addCustomExerciseBtn = document.getElementById("add-custom-exercise-btn");
    els.customExercisesManage = document.getElementById("custom-exercises-manage");
    els.customExercisesChips = document.getElementById("custom-exercises-chips");
    els.workoutWeight = document.getElementById("workout-weight");
    els.workoutSets = document.getElementById("workout-sets");
    els.workoutReps = document.getElementById("workout-reps");
    els.workoutRpe = document.getElementById("workout-rpe");
    els.workout1RMBox = document.getElementById("workout-1rm-box");
    els.workoutLivePrBadge = document.getElementById("workout-live-pr-badge");
    els.workoutEst1RM = document.getElementById("workout-est-1rm");
    els.workoutVolumePreview = document.getElementById("workout-volume-preview");
    els.workoutPrBaselineHint = document.getElementById("workout-pr-baseline-hint");
    els.workoutHistoryCount = document.getElementById("workout-history-count");
    els.workoutHistoryList = document.getElementById("workout-history-list");

    els.cardioForm = document.getElementById("cardio-form");
    els.cardioActivity = document.getElementById("cardio-activity");
    els.cardioCustomActivityWrap = document.getElementById("cardio-custom-activity-wrap");
    els.cardioActivityCustom = document.getElementById("cardio-activity-custom");
    els.addCustomCardioBtn = document.getElementById("add-custom-cardio-btn");
    els.cardioDuration = document.getElementById("cardio-duration");
    els.cardioCalories = document.getElementById("cardio-calories");

    els.bodyNotesForm = document.getElementById("body-notes-form");
    els.bodyNotesInput = document.getElementById("body-notes-input");
    els.bodyNoteTags = document.getElementById("body-note-tags");
    els.bodyNotesStatus = document.getElementById("body-notes-status");
    els.workoutCustomExerciseWrap = els.workoutExerciseCustomWrap;

    els.dietMealCount = document.getElementById("diet-meal-count");
    els.dietCaloriesValue = document.getElementById("diet-calories-value");
    els.dietCaloriesTarget = document.getElementById("diet-calories-target");
    els.dietCaloriesPercent = document.getElementById("diet-calories-percent");
    els.dietCaloriesBar = document.getElementById("diet-calories-bar");
    els.dietCaloriesNote = document.getElementById("diet-calories-note");
    els.dietProteinValue = document.getElementById("diet-protein-value");
    els.dietProteinTarget = document.getElementById("diet-protein-target");
    els.dietProteinPercent = document.getElementById("diet-protein-percent");
    els.dietProteinBar = document.getElementById("diet-protein-bar");
    els.dietProteinNote = document.getElementById("diet-protein-note");
    els.quickMealGrid = document.getElementById("quick-meal-grid");
    els.mealTemplateDetails = document.getElementById("meal-template-details");
    els.mealTemplateForm = document.getElementById("meal-template-form");
    els.mealTemplateFormTitle = document.getElementById("meal-template-form-title");
    els.mealTemplateCancelEdit = document.getElementById("meal-template-cancel-edit");
    els.templateMealId = document.getElementById("template-meal-id");
    els.templateMealName = document.getElementById("template-meal-name");
    els.templateMealCalories = document.getElementById("template-meal-calories");
    els.templateMealProtein = document.getElementById("template-meal-protein");
    els.mealTemplateSubmitBtn = document.getElementById("meal-template-submit-btn");
    els.resetMealTemplatesBtn = document.getElementById("reset-meal-templates-btn");
    els.mealTemplateManageList = document.getElementById("meal-template-manage-list");
    els.foodForm = document.getElementById("food-form");
    els.foodName = document.getElementById("food-name");
    els.foodCalories = document.getElementById("food-calories");
    els.foodProtein = document.getElementById("food-protein");
    els.foodSaveAsTemplate = document.getElementById("food-save-as-template");
    els.foodList = document.getElementById("food-list");
    els.dietLogCount = document.getElementById("diet-log-count");

    els.analyticsContent = document.getElementById("analytics-content");
    els.analyticsView = document.getElementById("view-analytics");
    els.toast = document.getElementById("toast");
    els.toastMessage = document.getElementById("toast-message");

    els.appShell = document.getElementById("app-shell");
    els.authGate = document.getElementById("auth-gate");
    els.authTitle = document.getElementById("auth-title");
    els.authSubtitle = document.getElementById("auth-subtitle");
    els.authModeBadge = document.getElementById("auth-mode-badge");
    els.authFeedback = document.getElementById("auth-feedback");
    els.authForm = document.getElementById("auth-form");
    els.authEmail = document.getElementById("auth-email");
    els.authPasswordGroup = document.getElementById("auth-password-group");
    els.authPassword = document.getElementById("auth-password");
    els.authForgotWrap = document.getElementById("auth-forgot-wrap");
    els.authForgotBtn = document.getElementById("auth-forgot-btn");
    els.authSubmitBtn = document.getElementById("auth-submit-btn");
    els.authSubmitLabel = document.getElementById("auth-submit-label");
    els.authTogglePrompt = document.getElementById("auth-toggle-prompt");
    els.authToggleBtn = document.getElementById("auth-toggle-btn");

    els.passwordRecoveryModal = document.getElementById("password-recovery-modal");
    els.passwordRecoveryForm = document.getElementById("password-recovery-form");
    els.recoveryNewPassword = document.getElementById("recovery-new-password");
    els.recoverySubmitBtn = document.getElementById("recovery-submit-btn");
    els.recoverySubmitLabel = document.getElementById("recovery-submit-label");
    els.recoveryFeedback = document.getElementById("recovery-feedback");

    els.userEmailDisplay = document.getElementById("user-email-display");
    els.syncStatusBadge = document.getElementById("sync-status-badge");
    els.syncStatusDot = document.getElementById("sync-status-dot");
    els.syncStatusText = document.getElementById("sync-status-text");
    els.logoutBtn = document.getElementById("logout-btn");
  }

  function showToast(message, type = "success") {
    if (!els.toast || !els.toastMessage) return;
    window.clearTimeout(toastTimer);
    els.toastMessage.textContent = message;
    els.toast.dataset.type = type;
    els.toast.classList.add("show");
    toastTimer = window.setTimeout(() => {
      els.toast.classList.remove("show");
    }, 2800);
  }

  function setActiveTab(tab, options = {}) {
    const target = TAB_IDS.includes(tab) ? tab : "dashboard";
    const updateHash = options.updateHash ?? true;
    const shouldScroll = options.scroll ?? true;

    els.views.forEach((view) => {
      view.hidden = view.dataset.view !== target;
    });

    els.navButtons.forEach((button) => {
      const isActive = button.dataset.tabTarget === target;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", String(isActive));
      button.tabIndex = isActive ? 0 : -1;
    });

    if (updateHash) {
      const nextHash = `#${target}`;
      if (window.location.hash !== nextHash) {
        window.history.replaceState(null, "", nextHash);
      }
    }

    document.title = `${TAB_TITLES[target]} · Gym Tracker App by LapoN`;
    if (target === "analytics") refreshAnalyticsChartsSoon();
    if (shouldScroll) window.scrollTo({ top: 0, behavior: "auto" });
  }

  function goToTab(tab, options = {}) {
    setActiveTab(tab);
    if (options.focusField && tab === "diet") {
      window.setTimeout(() => els.foodName?.focus(), 280);
    }
  }

  function populateSettingsForm() {
    els.settingTargetWeight.value = state.profile.targetWeight > 0 ? String(state.profile.targetWeight) : "";
    els.settingCalorieTarget.value = state.profile.calorieTarget > 0 ? String(state.profile.calorieTarget) : "";
    els.settingProteinTarget.value = state.profile.proteinTarget > 0 ? String(state.profile.proteinTarget) : "";
  }

  function openSettings() {
    lastFocusedElement = document.activeElement;
    populateSettingsForm();
    renderDataSummary();
    els.settingsModal.hidden = false;
    els.openSettings.setAttribute("aria-expanded", "true");
    document.body.classList.add("modal-open");
    window.setTimeout(() => els.exportData?.focus(), 40);
  }

  function closeSettings() {
    if (!els.settingsModal || els.settingsModal.hidden) return;
    els.settingsModal.hidden = true;
    els.openSettings.setAttribute("aria-expanded", "false");
    document.body.classList.remove("modal-open");
    if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
    lastFocusedElement = null;
  }

  function trapModalFocus(event) {
    if (event.key !== "Tab" || els.settingsModal.hidden) return;
    const focusable = [...els.settingsModal.querySelectorAll(
      'button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    )].filter((element) => element.offsetParent !== null);

    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleWeightSubmit(event) {
    event.preventDefault();
    const weight = validNumber(els.weightInput.value, 30, 300);

    if (weight === null) {
      showToast("Masukkan berat antara 30–300 kg.", "error");
      els.weightInput.focus();
      return;
    }

    const key = todayKey();
    const existing = state.weights.find((entry) => entry.date === key);
    const now = new Date().toISOString();

    if (existing) {
      existing.weight = round1(weight);
      existing.updatedAt = now;
    } else {
      state.weights.push({
        date: key,
        weight: round1(weight),
        updatedAt: now
      });
    }

    state.profile.currentWeight = round1(weight);
    if (!state.profile.startWeight || state.profile.startWeight <= 0) {
      state.profile.startWeight = round1(weight);
    }

    state.weights.sort((a, b) => a.date.localeCompare(b.date));
    persistState();
    populateProfileForms();
    renderWeightCard();
    renderAnalytics();
    renderDataSummary();
    els.weightInput.blur();
    showToast(`Berat ${formatWeight(weight)} kg tersimpan.`);
  }

  function applySplit(id) {
    const split = getSplit(id);
    if (!split) return;
    state.selectedSplits[todayKey()] = split.id;
    persistState();
    renderSplit();
    renderWorkout();
    showToast(`${split.day} dipilih untuk hari ini.`);
  }

  function refreshFoodViews() {
    renderQuickMeals();
    renderNutrition();
    renderFoodList();
    renderAnalytics();
    renderDataSummary();
  }

  function addFoodEntry({ name, calories, protein }) {
    const cleanName = typeof name === "string" ? name.trim().slice(0, 80) : "";
    const validCalories = validNumber(calories, 0, 20000);
    const validProtein = validNumber(protein, 0, 1000);

    if (!cleanName || validCalories === null || validProtein === null) return false;

    state.foodLogs.push({
      id: uid(),
      date: todayKey(),
      name: cleanName,
      calories: Math.round(validCalories),
      protein: round1(validProtein),
      createdAt: new Date().toISOString()
    });
    state.logs = state.foodLogs;

    persistState();
    refreshFoodViews();
    return true;
  }

  function upsertMealTemplate({ id, name, calories, protein }) {
    const cleanName = typeof name === "string" ? name.trim().slice(0, 80) : "";
    const validCalories = validNumber(calories, 0, 20000);
    const validProtein = validNumber(protein, 0, 1000);
    if (!cleanName || validCalories === null || validProtein === null) return null;

    if (!Array.isArray(state.customMeals)) {
      state.customMeals = cloneDefaultMeals();
    }

    const norm = normalizeExerciseKey(cleanName);
    const existingIndex = id
      ? state.customMeals.findIndex((m) => m.id === id)
      : state.customMeals.findIndex((m) => normalizeExerciseKey(m.name) === norm);

    const entry = {
      id: existingIndex >= 0 ? state.customMeals[existingIndex].id : uid(),
      name: cleanName,
      calories: Math.round(validCalories),
      protein: round1(validProtein)
    };

    if (existingIndex >= 0) {
      state.customMeals[existingIndex] = entry;
    } else {
      state.customMeals.push(entry);
    }

    state.customPresets = state.customMeals;
    return entry;
  }

  function resetMealTemplateForm() {
    if (els.templateMealId) els.templateMealId.value = "";
    if (els.templateMealName) els.templateMealName.value = "";
    if (els.templateMealCalories) els.templateMealCalories.value = "";
    if (els.templateMealProtein) els.templateMealProtein.value = "";
    if (els.mealTemplateFormTitle) els.mealTemplateFormTitle.textContent = "Tambah Preset Makanan Baru";
    if (els.mealTemplateSubmitBtn) els.mealTemplateSubmitBtn.textContent = "+ Simpan ke Preset Favorit";
    if (els.mealTemplateCancelEdit) els.mealTemplateCancelEdit.hidden = true;
  }

  function handleMealTemplateSubmit(event) {
    event.preventDefault();
    const editId = els.templateMealId?.value.trim() || "";
    const name = els.templateMealName?.value.trim() || "";
    const calories = validNumber(els.templateMealCalories?.value, 0, 20000);
    const protein = validNumber(els.templateMealProtein?.value, 0, 1000);

    if (!name) {
      showToast("Nama preset makanan tidak boleh kosong.", "error");
      els.templateMealName?.focus();
      return;
    }
    if (calories === null || protein === null) {
      showToast("Masukkan nilai kalori dan protein yang valid.", "error");
      return;
    }

    const saved = upsertMealTemplate({ id: editId, name, calories, protein });
    if (!saved) {
      showToast("Gagal menyimpan preset makanan.", "error");
      return;
    }

    persistState();
    resetMealTemplateForm();
    refreshFoodViews();
    showToast(editId ? `Preset "${saved.name}" diperbarui.` : `"${saved.name}" ditambahkan ke Preset Makanan Favorit.`);
  }

  function handleMealTemplateManageClick(event) {
    const editBtn = event.target.closest("[data-edit-meal-template]");
    if (editBtn) {
      const id = editBtn.dataset.editMealTemplate;
      const meal = getActiveMeals().find((m) => m.id === id);
      if (!meal) return;

      if (els.templateMealId) els.templateMealId.value = meal.id;
      if (els.templateMealName) els.templateMealName.value = meal.name;
      if (els.templateMealCalories) els.templateMealCalories.value = String(meal.calories);
      if (els.templateMealProtein) els.templateMealProtein.value = String(meal.protein);
      if (els.mealTemplateFormTitle) els.mealTemplateFormTitle.textContent = "Edit Preset Makanan";
      if (els.mealTemplateSubmitBtn) els.mealTemplateSubmitBtn.textContent = "Simpan Perubahan Preset";
      if (els.mealTemplateCancelEdit) els.mealTemplateCancelEdit.hidden = false;
      els.templateMealName?.focus();
      return;
    }

    const deleteBtn = event.target.closest("[data-delete-meal-template]");
    if (deleteBtn) {
      const id = deleteBtn.dataset.deleteMealTemplate;
      const meal = getActiveMeals().find((m) => m.id === id);
      if (!meal) return;
      if (!window.confirm(`Hapus "${meal.name}" dari daftar Preset Makanan Favorit Anda?`)) return;

      state.customMeals = getActiveMeals().filter((m) => m.id !== id);
      state.customPresets = state.customMeals;
      if (els.templateMealId?.value === id) resetMealTemplateForm();
      persistState();
      refreshFoodViews();
      showToast(`Preset "${meal.name}" dihapus.`);
    }
  }

  function handleResetMealTemplates() {
    if (!window.confirm("Kembalikan daftar Preset Makanan Favorit ke contoh dasar?")) return;
    state.customMeals = cloneDefaultMeals();
    state.customPresets = state.customMeals;
    resetMealTemplateForm();
    persistState();
    refreshFoodViews();
    showToast("Preset Makanan Favorit dikembalikan ke contoh dasar.");
  }

  function handleQuickMealClick(event) {
    const button = event.target.closest("[data-quick-meal-id]");
    if (!button) return;

    const mealId = button.dataset.quickMealId;
    const meal = getActiveMeals().find((m) => m.id === mealId);
    if (!meal) return;

    if (!addFoodEntry(meal)) {
      showToast("Gagal menambahkan menu.", "error");
      return;
    }

    button.classList.add("is-added");
    window.setTimeout(() => button.classList.remove("is-added"), 520);
    showToast(`+${meal.name} · ${formatNumber(meal.calories)} kcal, ${formatMacro(meal.protein)} g protein`);
  }

  function handleFoodSubmit(event) {
    event.preventDefault();
    const name = els.foodName.value.trim();
    const calories = validNumber(els.foodCalories.value, 0, 20000);
    const protein = validNumber(els.foodProtein.value, 0, 1000);
    const saveAsTemplate = Boolean(els.foodSaveAsTemplate?.checked);

    if (!name) {
      showToast("Nama makanan tidak boleh kosong.", "error");
      els.foodName.focus();
      return;
    }
    if (calories === null || protein === null) {
      showToast("Kalori atau protein belum valid.", "error");
      return;
    }

    if (saveAsTemplate) {
      upsertMealTemplate({ name, calories, protein });
    }

    if (!addFoodEntry({ name, calories, protein })) {
      showToast("Gagal menambahkan makanan.", "error");
      return;
    }

    els.foodForm.reset();
    els.foodName.focus();
    showToast(
      saveAsTemplate
        ? `"${name}" masuk log hari ini & disimpan ke Template 1-Tap.`
        : "Makanan ditambahkan ke log hari ini."
    );
  }

  function handleFoodDelete(event) {
    const saveTemplateBtn = event.target.closest("[data-save-log-template]");
    if (saveTemplateBtn) {
      const logId = saveTemplateBtn.dataset.saveLogTemplate;
      const log = state.foodLogs.find((item) => item.id === logId);
      if (!log) return;
      upsertMealTemplate({
        name: log.name,
        calories: log.calories,
        protein: log.protein
      });
      persistState();
      refreshFoodViews();
      showToast(`"${log.name}" disimpan ke Template Menu (1-Tap).`);
      return;
    }

    const button = event.target.closest("[data-delete-food]");
    if (!button) return;

    const id = button.dataset.deleteFood;
    const log = state.foodLogs.find((item) => item.id === id);
    if (!log) return;

    if (!window.confirm(`Hapus "${log.name}" dari log hari ini?`)) return;

    state.foodLogs = state.foodLogs.filter((item) => item.id !== id);
    persistState();
    refreshFoodViews();
    showToast("Log makanan dihapus.");
  }

  function handleSplitTemplateApply() {
    const templateKey = els.splitTemplateSelect?.value || "general_ppl";
    const template = SPLIT_TEMPLATES[templateKey];
    if (!template) return;

    state.customSplits = sanitizeCustomSplits(template);
    persistState();
    populateSplitEditorForm(els.editSplitDay?.value || getSelectedSplitId());
    renderSplit();
    renderWorkout();
    showToast("Template split latihan berhasil diterapkan ke akun Anda.");
  }

  function handleSplitEditorSubmit(event) {
    event.preventDefault();
    const dayId = Number(els.editSplitDay?.value) || 1;
    const name = els.editSplitName?.value.trim().slice(0, 70) || "";
    const type = els.editSplitType?.value.trim().slice(0, 40) || "General";
    const desc = els.editSplitDesc?.value.trim().slice(0, 140) || "Sesi latihan kustom.";
    const rawTags = els.editSplitTags?.value || "";
    const tags = rawTags
      .split(",")
      .map((t) => t.trim().slice(0, 32))
      .filter(Boolean)
      .slice(0, 8);

    if (!name) {
      showToast("Nama sesi latihan tidak boleh kosong.", "error");
      els.editSplitName?.focus();
      return;
    }

    if (!Array.isArray(state.customSplits) || state.customSplits.length !== 7) {
      state.customSplits = cloneDefaultSplits();
    }

    const index = state.customSplits.findIndex((s) => s.id === dayId);
    const updatedSplit = {
      id: dayId,
      day: `Day ${dayId}`,
      type,
      name,
      description: desc,
      tags: tags.length > 0 ? tags : ["Workout"]
    };

    if (index >= 0) {
      state.customSplits[index] = updatedSplit;
    } else {
      state.customSplits.push(updatedSplit);
      state.customSplits = sanitizeCustomSplits(state.customSplits);
    }

    persistState();
    renderSplit();
    renderWorkout();
    showToast(`Split Day ${dayId} (${name}) berhasil disimpan.`);
  }

  function addCustomExerciseToAccount(rawName) {
    const clean = String(rawName || "").trim().slice(0, 80);
    if (!clean) return "";

    if (!Array.isArray(state.customExercises)) {
      state.customExercises = [];
    }

    const norm = normalizeExerciseKey(clean);
    const allExisting = getAllExercises();
    const existingMatch = allExisting.find((item) => normalizeExerciseKey(item) === norm);

    if (existingMatch) {
      return existingMatch;
    }

    state.customExercises.unshift(clean);
    return clean;
  }

  function handleAddCustomExerciseClick() {
    const rawName = els.workoutExerciseCustom?.value.trim() || "";
    if (!rawName) {
      showToast("Ketik nama jenis latihan baru terlebih dahulu.", "error");
      els.workoutExerciseCustom?.focus();
      return;
    }

    const savedName = addCustomExerciseToAccount(rawName);
    persistState();
    if (els.workoutExerciseCustom) els.workoutExerciseCustom.value = "";
    if (els.workoutCustomExerciseWrap) els.workoutCustomExerciseWrap.hidden = true;
    populateExerciseSelect(savedName);
    updateWorkoutLive1RM();
    renderAnalytics();
    showToast(`Jenis latihan "${savedName}" ditambahkan ke daftar akun Anda.`);
  }

  function handleRemoveCustomExerciseClick(event) {
    const btn = event.target.closest("[data-remove-custom-exercise]");
    if (!btn) return;
    const name = btn.dataset.removeCustomExercise;
    if (!name || !Array.isArray(state.customExercises)) return;

    state.customExercises = state.customExercises.filter(
      (item) => normalizeExerciseKey(item) !== normalizeExerciseKey(name)
    );
    persistState();
    populateExerciseSelect();
    updateWorkoutLive1RM();
    renderAnalytics();
    showToast(`"${name}" dihapus dari daftar latihan tambahan.`);
  }

  function handleExerciseSelectChange() {
    if (!els.workoutExerciseSelect || !els.workoutCustomExerciseWrap) return;
    const isCustom = els.workoutExerciseSelect.value === "__custom__";
    els.workoutCustomExerciseWrap.hidden = !isCustom;
    if (isCustom) {
      els.workoutExerciseCustom?.focus();
    }
    updateWorkoutLive1RM();
  }

  function handleCardioSelectChange() {
    if (!els.cardioActivity) return;
    const isCustom = els.cardioActivity.value === "__custom__";
    if (els.cardioCustomActivityWrap) {
      els.cardioCustomActivityWrap.hidden = !isCustom;
    }
    if (isCustom) {
      els.cardioActivityCustom?.focus();
    } else {
      updateCardioAutoCalories();
    }
  }

  function addCustomCardioToAccount(rawName) {
    const clean = String(rawName || "").trim().slice(0, 80);
    if (!clean) return "";

    if (!Array.isArray(state.customCardioActivities)) {
      state.customCardioActivities = [];
    }

    const norm = normalizeExerciseKey(clean);
    const allExisting = getAllCardioActivities();
    const existingMatch = allExisting.find((item) => normalizeExerciseKey(item) === norm);

    if (existingMatch) {
      return existingMatch;
    }

    state.customCardioActivities.unshift(clean);
    return clean;
  }

  function handleAddCustomCardioClick() {
    const rawName = els.cardioActivityCustom?.value.trim() || "";
    if (!rawName) {
      showToast("Ketik nama aktivitas cardio baru terlebih dahulu.", "error");
      els.cardioActivityCustom?.focus();
      return;
    }

    const savedName = addCustomCardioToAccount(rawName);
    persistState();
    if (els.cardioActivityCustom) els.cardioActivityCustom.value = "";
    if (els.cardioCustomActivityWrap) els.cardioCustomActivityWrap.hidden = true;
    populateCardioSelect(savedName);
    updateCardioAutoCalories();
    showToast(`Aktivitas "${savedName}" ditambahkan ke daftar cardio Anda.`);
  }

  function syncPendingBodyNoteText() {
    if (!els.bodyNotesInput) return;
    const typedNote = els.bodyNotesInput.value.trim().slice(0, 200);
    if (!typedNote) return;

    const key = todayKey();
    const existing = state.bodyNotes.find((item) => item.date === key);
    if (existing) {
      if (existing.note !== typedNote) {
        existing.note = typedNote;
        existing.updatedAt = new Date().toISOString();
      }
    } else {
      state.bodyNotes.unshift({
        date: key,
        tags: [],
        note: typedNote,
        updatedAt: new Date().toISOString()
      });
    }
  }

  function handleWorkoutSubmit(event) {
    event.preventDefault();
    const splitId = Number(els.workoutSplitSelect?.value) || getSelectedSplitId();
    const isCustom = els.workoutExerciseSelect?.value === "__custom__";
    const rawExercise = (isCustom ? els.workoutExerciseCustom?.value : els.workoutExerciseSelect?.value || "")
      .trim()
      .slice(0, 80);

    if (!rawExercise) {
      showToast("Pilih atau ketik nama gerakan terlebih dahulu.", "error");
      if (isCustom) els.workoutExerciseCustom?.focus();
      return;
    }

    const exercise = isCustom ? addCustomExerciseToAccount(rawExercise) : rawExercise;

    const weight = validNumber(els.workoutWeight?.value, 0.5, 600);
    const sets = validNumber(els.workoutSets?.value, 1, 30);
    const reps = validNumber(els.workoutReps?.value, 1, 100);
    const rpe = validNumber(els.workoutRpe?.value, 6, 10);

    if (weight === null) {
      showToast("Masukkan beban angkatan yang valid (0,5–600 kg).", "error");
      els.workoutWeight?.focus();
      return;
    }
    if (sets === null || reps === null) {
      showToast("Jumlah Sets (1–30) dan Reps (1–100) harus valid.", "error");
      return;
    }
    if (rpe === null) {
      showToast("Masukkan nilai RPE pada skala 6–10.", "error");
      els.workoutRpe?.focus();
      return;
    }

    const { baseline, bestLogged1RM, threshold } = getExerciseBestBefore(exercise);
    const est1RM = calculateEpley1RM(weight, reps);
    const prKey = mapExerciseToPRKey(exercise);
    const isPR = threshold > 0
      ? (weight > threshold || est1RM > Math.max(baseline, bestLogged1RM))
      : Boolean(prKey && weight > 0);
    const today = todayKey();

    state.selectedSplits[today] = splitId;
    syncPendingBodyNoteText();

    if (isPR && prKey) {
      if (!state.profile.baselinePRs || typeof state.profile.baselinePRs !== "object") {
        state.profile.baselinePRs = { ...DEFAULT_BASELINE_PRS };
      }
      const nextPRValue = round1(Math.max(weight, est1RM, Number(state.profile.baselinePRs[prKey]) || 0));
      state.profile.baselinePRs[prKey] = nextPRValue;
    }

    state.workoutLogs.push({
      id: uid(),
      date: today,
      splitId,
      exercise,
      weight: round1(weight),
      sets: Math.round(sets),
      reps: Math.round(reps),
      rpe: round1(rpe),
      est1RM,
      isPR,
      createdAt: new Date().toISOString()
    });
    state.workouts = state.workoutLogs;

    persistState();
    els.workoutWeight.value = "";
    if (isCustom) {
      if (els.workoutExerciseCustom) els.workoutExerciseCustom.value = "";
      if (els.workoutCustomExerciseWrap) els.workoutCustomExerciseWrap.hidden = true;
      populateExerciseSelect(exercise);
    }
    populateProfileForms();
    renderSplit();
    renderWorkout();
    renderAnalytics();
    renderDataSummary();

    if (isPR) {
      showToast(`NEW PR! 🔥 ${exercise} ${formatMacro(weight)} kg · Est. 1RM ${formatWeight(est1RM)} kg (PR Profil diperbarui)`);
    } else {
      showToast(`Log ${exercise} (${formatMacro(weight)} kg × ${Math.round(sets)}×${Math.round(reps)}) tersimpan.`);
    }
  }

  function handleCardioSubmit(event) {
    event.preventDefault();
    const isCustom = els.cardioActivity?.value === "__custom__";
    const rawActivity = (isCustom ? els.cardioActivityCustom?.value : els.cardioActivity?.value || CARDIO_ACTIVITIES[0])
      .trim()
      .slice(0, 80);

    if (!rawActivity) {
      showToast("Pilih atau ketik nama aktivitas cardio terlebih dahulu.", "error");
      if (isCustom) els.cardioActivityCustom?.focus();
      return;
    }

    const activity = isCustom ? addCustomCardioToAccount(rawActivity) : rawActivity;
    const duration = validNumber(els.cardioDuration?.value, 1, 600);
    const calories = validNumber(els.cardioCalories?.value, 1, 5000);

    if (duration === null) {
      showToast("Masukkan durasi cardio dalam menit (1–600).", "error");
      els.cardioDuration?.focus();
      return;
    }
    if (calories === null) {
      showToast("Masukkan estimasi kalori terbakar (1–5000 kcal).", "error");
      els.cardioCalories?.focus();
      return;
    }

    syncPendingBodyNoteText();

    state.cardioLogs.push({
      id: uid(),
      date: todayKey(),
      activity,
      duration: Math.round(duration),
      calories: Math.round(calories),
      createdAt: new Date().toISOString()
    });

    cardioCaloriesManual = false;
    els.cardioDuration.value = "";
    els.cardioCalories.value = "";
    if (isCustom) {
      if (els.cardioActivityCustom) els.cardioActivityCustom.value = "";
      if (els.cardioCustomActivityWrap) els.cardioCustomActivityWrap.hidden = true;
      populateCardioSelect(activity);
    }

    persistState();
    renderWorkout();
    renderDataSummary();
    showToast(`${activity} (${Math.round(duration)} menit · ${formatNumber(calories)} kcal) tersimpan.`);
  }

  function handleBodyTagClick(event) {
    const button = event.target.closest("[data-body-tag]");
    if (!button) return;

    const tag = button.dataset.bodyTag;
    if (!tag) return;

    const key = todayKey();
    let entry = state.bodyNotes.find((item) => item.date === key);
    if (!entry) {
      entry = {
        date: key,
        tags: [],
        note: els.bodyNotesInput?.value.trim().slice(0, 200) || "",
        updatedAt: new Date().toISOString()
      };
      state.bodyNotes.unshift(entry);
    }

    if (entry.tags.includes(tag)) {
      entry.tags = entry.tags.filter((item) => item !== tag);
    } else {
      entry.tags.push(tag);
    }
    entry.updatedAt = new Date().toISOString();

    if (entry.tags.length === 0 && !entry.note) {
      state.bodyNotes = state.bodyNotes.filter((item) => item.date !== key);
    }

    persistState();
    renderWorkout();
  }

  function handleBodyNotesSubmit(event) {
    event.preventDefault();
    const key = todayKey();
    const noteText = els.bodyNotesInput?.value.trim().slice(0, 200) || "";
    const existing = state.bodyNotes.find((item) => item.date === key);
    const currentTags = existing ? existing.tags : [];

    if (!noteText && currentTags.length === 0) {
      showToast("Pilih minimal 1 tag cepat atau isi catatan kondisi fisik.", "error");
      els.bodyNotesInput?.focus();
      return;
    }

    if (existing) {
      existing.note = noteText;
      existing.updatedAt = new Date().toISOString();
    } else {
      state.bodyNotes.unshift({
        date: key,
        tags: [],
        note: noteText,
        updatedAt: new Date().toISOString()
      });
    }

    persistState();
    renderWorkout();
    showToast("Body & Joint Notes hari ini tersimpan.");
  }

  function handleWorkoutHistoryClick(event) {
    const deleteWorkoutBtn = event.target.closest("[data-delete-workout]");
    if (deleteWorkoutBtn) {
      const id = deleteWorkoutBtn.dataset.deleteWorkout;
      const log = state.workoutLogs.find((item) => item.id === id);
      if (!log) return;
      if (!window.confirm(`Hapus log "${log.exercise} (${formatMacro(log.weight)} kg)"?`)) return;
      state.workoutLogs = state.workoutLogs.filter((item) => item.id !== id);
      persistState();
      renderWorkout();
      renderAnalytics();
      renderDataSummary();
      showToast("Log latihan beban dihapus.");
      return;
    }

    const deleteCardioBtn = event.target.closest("[data-delete-cardio]");
    if (deleteCardioBtn) {
      const id = deleteCardioBtn.dataset.deleteCardio;
      const log = state.cardioLogs.find((item) => item.id === id);
      if (!log) return;
      if (!window.confirm(`Hapus log cardio "${log.activity}"?`)) return;
      state.cardioLogs = state.cardioLogs.filter((item) => item.id !== id);
      persistState();
      renderWorkout();
      renderDataSummary();
      showToast("Log cardio dihapus.");
      return;
    }

    const deleteBodyNoteBtn = event.target.closest("[data-delete-body-note]");
    if (deleteBodyNoteBtn) {
      const date = deleteBodyNoteBtn.dataset.deleteBodyNote;
      if (!window.confirm("Hapus Body & Joint Notes pada tanggal ini?")) return;
      state.bodyNotes = state.bodyNotes.filter((item) => item.date !== date);
      if (date === todayKey() && els.bodyNotesInput) {
        els.bodyNotesInput.value = "";
      }
      persistState();
      renderWorkout();
      showToast("Catatan kondisi fisik dihapus.");
    }
  }
  function populateProfileFormByPrefix(prefix) {
    const p = state.profile || DEFAULT_PROFILE;
    const prs = p.baselinePRs || DEFAULT_BASELINE_PRS;
    const latestW = getLatestWeightEntry().weight || p.currentWeight || 0;

    const getEl = (suffix) => document.getElementById(`${prefix}-${suffix}`);
    const setVal = (suffix, val, allowZero = false) => {
      const el = getEl(suffix);
      if (!el || document.activeElement === el) return;
      if (allowZero) {
        el.value = String(Number(val) || 0);
      } else {
        el.value = val !== undefined && val !== null && val !== "" && Number(val) !== 0 ? String(val) : (typeof val === "string" && val ? val : "");
      }
    };

    const nickEl = getEl("nickname");
    if (nickEl && document.activeElement !== nickEl) {
      nickEl.value = p.nickname || "";
    }
    setVal("age", p.age);
    const genderEl = getEl("gender");
    if (genderEl && document.activeElement !== genderEl) {
      genderEl.value = p.gender === "female" ? "female" : "male";
    }
    setVal("height", p.heightCm);
    setVal("current-weight", latestW > 0 ? round1(latestW) : p.currentWeight);
    setVal("target-weight", p.targetWeight);

    const goalEl = getEl("goal");
    if (goalEl && document.activeElement !== goalEl) {
      goalEl.value = p.fitnessGoal || "fat_loss";
    }
    const actEl = getEl("activity");
    if (actEl && document.activeElement !== actEl) {
      actEl.value = p.activityLevel || "moderate";
    }

    setVal("calories", p.calorieTarget);
    setVal("protein", p.proteinTarget);

    setVal("pr-squat", prs.squat, true);
    setVal("pr-bench", prs.benchPress, true);
    setVal("pr-deadlift", prs.deadlift, true);
    setVal("pr-ohp", prs.overheadPress, true);
    setVal("pr-cj", prs.cleanAndJerk, true);
    setVal("pr-snatch", prs.snatch, true);
  }

  function populateProfileForms() {
    populateProfileFormByPrefix("prof");
    populateProfileFormByPrefix("onb");
  }

  function handleAutoCalcByPrefix(prefix) {
    const getEl = (suffix) => document.getElementById(`${prefix}-${suffix}`);
    const age = validNumber(getEl("age")?.value, 12, 100);
    const gender = getEl("gender")?.value === "female" ? "female" : "male";
    const heightCm = validNumber(getEl("height")?.value, 100, 250);
    const weightKg = validNumber(getEl("current-weight")?.value, 30, 300);
    const fitnessGoal = getEl("goal")?.value || "fat_loss";
    const activityLevel = getEl("activity")?.value || "moderate";

    if (age === null) {
      showToast("Isi Umur (12–100 tahun) terlebih dahulu.", "error");
      getEl("age")?.focus();
      return;
    }
    if (heightCm === null) {
      showToast("Isi Tinggi Badan (100–250 cm) terlebih dahulu.", "error");
      getEl("height")?.focus();
      return;
    }
    if (weightKg === null) {
      showToast("Isi Berat Saat Ini (30–300 kg) terlebih dahulu.", "error");
      getEl("current-weight")?.focus();
      return;
    }

    const result = calculateMifflinStJeor({
      age,
      gender,
      heightCm,
      weightKg,
      fitnessGoal,
      activityLevel
    });

    if (!result) {
      showToast("Gagal menghitung rekomendasi kalori. Periksa data fisik Anda.", "error");
      return;
    }

    const calEl = getEl("calories");
    const protEl = getEl("protein");
    if (calEl) calEl.value = String(result.calories);
    if (protEl) protEl.value = String(result.protein);

    const summaryEl = getEl("calc-summary");
    if (summaryEl) {
      const goalNote = fitnessGoal === "fat_loss"
        ? "Defisit -500 kcal"
        : fitnessGoal === "muscle_gain"
          ? "Surplus +300 kcal"
          : "Maintenance ±0 kcal";
      summaryEl.textContent = `BMR: ${formatNumber(result.bmr)} kcal · TDEE: ${formatNumber(result.tdee)} kcal (${goalNote}) → Target: ${formatNumber(result.calories)} kcal & ${formatNumber(result.protein)}g protein (2g/kg BB).`;
      summaryEl.hidden = false;
    }

    showToast(`Rekomendasi dihitung: ${formatNumber(result.calories)} kcal & ${formatNumber(result.protein)}g protein.`);
  }

  function handleProfileFormSubmit(prefix, event) {
    event.preventDefault();
    const getEl = (suffix) => document.getElementById(`${prefix}-${suffix}`);

    const nickname = (getEl("nickname")?.value || "").trim().slice(0, 50);
    const age = validNumber(getEl("age")?.value, 12, 100);
    const gender = getEl("gender")?.value === "female" ? "female" : "male";
    const heightCm = validNumber(getEl("height")?.value, 100, 250);
    const currentWeight = validNumber(getEl("current-weight")?.value, 30, 300);
    const targetWeight = validNumber(getEl("target-weight")?.value, 30, 300);
    const fitnessGoal = ["fat_loss", "maintenance", "muscle_gain"].includes(getEl("goal")?.value)
      ? getEl("goal").value
      : "fat_loss";
    const activityLevel = Object.prototype.hasOwnProperty.call(ACTIVITY_MULTIPLIERS, getEl("activity")?.value)
      ? getEl("activity").value
      : "moderate";

    if (!nickname) {
      showToast("Nama panggilan wajib diisi.", "error");
      getEl("nickname")?.focus();
      return;
    }
    if (age === null) {
      showToast("Masukkan umur yang valid (12–100 tahun).", "error");
      getEl("age")?.focus();
      return;
    }
    if (heightCm === null) {
      showToast("Masukkan tinggi badan yang valid (100–250 cm).", "error");
      getEl("height")?.focus();
      return;
    }
    if (currentWeight === null) {
      showToast("Masukkan berat badan saat ini yang valid (30–300 kg).", "error");
      getEl("current-weight")?.focus();
      return;
    }
    if (targetWeight === null) {
      showToast("Masukkan target berat badan yang valid (30–300 kg).", "error");
      getEl("target-weight")?.focus();
      return;
    }

    let calorieTarget = validNumber(getEl("calories")?.value, 800, 10000);
    let proteinTarget = validNumber(getEl("protein")?.value, 30, 500);

    if (calorieTarget === null || proteinTarget === null) {
      const autoCalc = calculateMifflinStJeor({
        age,
        gender,
        heightCm,
        weightKg: currentWeight,
        fitnessGoal,
        activityLevel
      });
      if (calorieTarget === null && autoCalc) calorieTarget = autoCalc.calories;
      if (proteinTarget === null && autoCalc) proteinTarget = autoCalc.protein;
    }

    if (calorieTarget === null || proteinTarget === null) {
      showToast("Masukkan target kalori (800–10000 kcal) dan protein (30–500 g) yang valid.", "error");
      getEl("calories")?.focus();
      return;
    }

    const squat = validNumber(getEl("pr-squat")?.value, 0, 600) ?? 0;
    const benchPress = validNumber(getEl("pr-bench")?.value, 0, 600) ?? 0;
    const deadlift = validNumber(getEl("pr-deadlift")?.value, 0, 600) ?? 0;
    const overheadPress = validNumber(getEl("pr-ohp")?.value, 0, 600) ?? 0;
    const cleanAndJerk = validNumber(getEl("pr-cj")?.value, 0, 600) ?? 0;
    const snatch = validNumber(getEl("pr-snatch")?.value, 0, 600) ?? 0;

    const wasOnboarded = Boolean(state.profile.isOnboarded);
    const nextStartWeight = !wasOnboarded || !state.profile.startWeight || state.weights.length === 0
      ? round1(currentWeight)
      : round1(state.profile.startWeight);

    state.profile = {
      ...state.profile,
      isOnboarded: true,
      nickname,
      age: Math.round(age),
      gender,
      heightCm: round1(heightCm),
      currentWeight: round1(currentWeight),
      startWeight: nextStartWeight,
      targetWeight: round1(targetWeight),
      fitnessGoal,
      activityLevel,
      calorieTarget: Math.round(calorieTarget),
      proteinTarget: round1(proteinTarget),
      baselinePRs: {
        ...(state.profile.baselinePRs || DEFAULT_BASELINE_PRS),
        squat: round1(squat),
        benchPress: round1(benchPress),
        deadlift: round1(deadlift),
        overheadPress: round1(overheadPress),
        cleanAndJerk: round1(cleanAndJerk),
        snatch: round1(snatch)
      }
    };

    const key = todayKey();
    const now = new Date().toISOString();
    const existingWeight = state.weights.find((entry) => entry.date === key);
    if (existingWeight) {
      existingWeight.weight = round1(currentWeight);
      existingWeight.updatedAt = now;
    } else {
      state.weights.push({
        date: key,
        weight: round1(currentWeight),
        updatedAt: now
      });
    }
    state.weights.sort((a, b) => a.date.localeCompare(b.date));

    if (els.onboardingModal) {
      els.onboardingModal.hidden = true;
    }
    if (els.settingsModal?.hidden !== false) {
      document.body.classList.remove("modal-open");
    }

    persistState();
    scheduleCloudSync(true);
    renderAll();
    populateSettingsForm();
    showToast(
      prefix === "onb"
        ? `Selamat datang, ${nickname}! Profil & baseline Anda tersimpan di Cloud.`
        : `Profil ${nickname} berhasil diperbarui & disinkronkan ke Cloud.`
    );
  }

  function checkOnboardingGate() {
    if (!els.onboardingModal) return;
    if (currentUser && !state.profile.isOnboarded) {
      populateProfileForms();
      els.onboardingModal.hidden = false;
      document.body.classList.add("modal-open");
      window.setTimeout(() => document.getElementById("onb-nickname")?.focus(), 60);
    } else {
      els.onboardingModal.hidden = true;
      if (els.settingsModal?.hidden !== false) {
        document.body.classList.remove("modal-open");
      }
    }
  }

  function handleSettingsSubmit(event) {
    event.preventDefault();
    const targetWeight = validNumber(els.settingTargetWeight.value, 30, 300);
    const calorieTarget = validNumber(els.settingCalorieTarget.value, 800, 10000);
    const proteinTarget = validNumber(els.settingProteinTarget.value, 30, 500);

    if (targetWeight === null || calorieTarget === null || proteinTarget === null) {
      showToast("Periksa kembali nilai target yang dimasukkan.", "error");
      return;
    }

    state.profile.targetWeight = round1(targetWeight);
    state.profile.calorieTarget = Math.round(calorieTarget);
    state.profile.proteinTarget = round1(proteinTarget);

    persistState();
    renderAll();
    populateSettingsForm();
    closeSettings();
    showToast("Target harian diperbarui.");
  }

  function exportData() {
    try {
      const payload = {
        app: "Gym Tracker App by LapoN",
        version: STATE_VERSION,
        exportedAt: new Date().toISOString(),
        data: state
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gym-tracker-lapon-backup-${todayKey()}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1200);
      showToast("Backup JSON berhasil diunduh.");
    } catch (error) {
      console.error("Export gagal:", error);
      showToast("Gagal membuat file backup.", "error");
    }
  }

  async function handleImportFile(file) {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("File terlalu besar. Maksimal 5 MB.", "error");
      els.importFile.value = "";
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const imported = sanitizeState(parsed, true);
      const totalWorkouts = imported.workoutLogs.length + imported.cardioLogs.length;
      const confirmed = window.confirm(
        `Import akan mengganti data saat ini dengan ${imported.weights.length} catatan berat, ${imported.foodLogs.length} log makanan, dan ${totalWorkouts} log latihan. Lanjutkan?`
      );

      if (!confirmed) {
        showToast("Import dibatalkan.");
        return;
      }

      state = imported;
      currentDay = todayKey();
      persistState();
      renderAll();
      populateSettingsForm();
      closeSettings();
      showToast("Data berhasil diimport.");
    } catch (error) {
      console.error("Import gagal:", error);
      const message = error instanceof SyntaxError
        ? "File JSON tidak valid."
        : error?.message || "Import gagal. Periksa format file backup.";
      showToast(message, "error");
    } finally {
      els.importFile.value = "";
    }
  }

  function clearAuthFeedback() {
    if (!els.authFeedback) return;
    els.authFeedback.hidden = true;
    els.authFeedback.textContent = "";
    delete els.authFeedback.dataset.tone;
  }

  function showAuthFeedback(message, tone = "error") {
    if (!els.authFeedback) return;
    els.authFeedback.textContent = message;
    els.authFeedback.dataset.tone = tone;
    els.authFeedback.hidden = false;
  }

  function translateAuthError(error) {
    const raw = String(error?.message || error || "").toLowerCase();
    if (raw.includes("invalid login credentials")) {
      return "Password salah atau email belum terdaftar. Silakan periksa kembali.";
    }
    if (raw.includes("user already registered") || raw.includes("already been registered")) {
      return "Email ini sudah terdaftar. Silakan beralih ke mode Masuk (Login).";
    }
    if (raw.includes("password should be at least")) {
      return "Password minimal harus terdiri dari 6 karakter.";
    }
    if (raw.includes("email not confirmed")) {
      return "Email belum dikonfirmasi. Cek kotak masuk email Anda atau matikan opsi Confirm Email di Supabase Dashboard.";
    }
    if (raw.includes("invalid email") || raw.includes("unable to validate email")) {
      return "Format alamat email tidak valid.";
    }
    if (raw.includes("rate limit") || raw.includes("too many requests")) {
      return "Terlalu banyak percobaan. Silakan tunggu beberapa saat lalu coba lagi.";
    }
    return error?.message || "Terjadi kesalahan autentikasi. Periksa koneksi internet Anda.";
  }

  function resetPasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = "password";
    const toggleBtn = document.querySelector(`[data-toggle-password="${inputId}"]`);
    if (!toggleBtn) return;
    toggleBtn.setAttribute("aria-pressed", "false");
    toggleBtn.setAttribute("aria-label", "Tampilkan password");
    const eyeOpen = toggleBtn.querySelector("[data-eye-open]");
    const eyeOff = toggleBtn.querySelector("[data-eye-off]");
    if (eyeOpen) eyeOpen.hidden = false;
    if (eyeOff) eyeOff.hidden = true;
  }

  function handlePasswordToggleClick(event) {
    const toggleBtn = event.target.closest("[data-toggle-password]");
    if (!toggleBtn) return;
    const targetId = toggleBtn.dataset.togglePassword;
    const input = targetId ? document.getElementById(targetId) : null;
    if (!input) return;

    const showPlain = input.type === "password";
    input.type = showPlain ? "text" : "password";
    toggleBtn.setAttribute("aria-pressed", String(showPlain));
    toggleBtn.setAttribute("aria-label", showPlain ? "Sembunyikan password" : "Tampilkan password");

    const eyeOpen = toggleBtn.querySelector("[data-eye-open]");
    const eyeOff = toggleBtn.querySelector("[data-eye-off]");
    if (eyeOpen) eyeOpen.hidden = showPlain;
    if (eyeOff) eyeOff.hidden = !showPlain;
    input.focus();
  }

  function clearRecoveryFeedback() {
    if (!els.recoveryFeedback) return;
    els.recoveryFeedback.hidden = true;
    els.recoveryFeedback.textContent = "";
    delete els.recoveryFeedback.dataset.tone;
  }

  function showRecoveryFeedback(message, tone = "error") {
    if (!els.recoveryFeedback) return;
    els.recoveryFeedback.textContent = message;
    els.recoveryFeedback.dataset.tone = tone;
    els.recoveryFeedback.hidden = false;
  }

  function openPasswordRecoveryModal() {
    if (!els.passwordRecoveryModal) return;
    clearRecoveryFeedback();
    if (els.recoveryNewPassword) els.recoveryNewPassword.value = "";
    resetPasswordVisibility("recovery-new-password");
    els.passwordRecoveryModal.hidden = false;
    document.body.classList.add("modal-open");
    window.setTimeout(() => els.recoveryNewPassword?.focus(), 60);
  }

  function closePasswordRecoveryModal() {
    if (!els.passwordRecoveryModal) return;
    els.passwordRecoveryModal.hidden = true;
    clearRecoveryFeedback();
    if (els.recoveryNewPassword) els.recoveryNewPassword.value = "";
    resetPasswordVisibility("recovery-new-password");
    if (els.onboardingModal?.hidden !== false && els.settingsModal?.hidden !== false) {
      document.body.classList.remove("modal-open");
    }
  }

  async function handlePasswordRecoverySubmit(event) {
    event.preventDefault();
    if (!supabaseClient) {
      showRecoveryFeedback("Supabase SDK belum siap. Periksa koneksi internet Anda.", "error");
      return;
    }

    const newPassword = els.recoveryNewPassword?.value || "";
    if (newPassword.length < 6) {
      showRecoveryFeedback("Password baru minimal harus terdiri dari 6 karakter.", "error");
      els.recoveryNewPassword?.focus();
      return;
    }

    clearRecoveryFeedback();
    if (els.recoverySubmitBtn) els.recoverySubmitBtn.disabled = true;
    if (els.recoveryNewPassword) els.recoveryNewPassword.disabled = true;
    if (els.recoverySubmitLabel) els.recoverySubmitLabel.textContent = "Menyimpan Password...";

    try {
      const { data, error } = await supabaseClient.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;

      const updatedUser = data?.user ?? currentUser ?? (await supabaseClient.auth.getUser())?.data?.user ?? null;
      closePasswordRecoveryModal();

      if (window.location.hash.includes("type=recovery") || window.location.hash.includes("access_token")) {
        window.history.replaceState(null, "", "#dashboard");
      }

      if (updatedUser) {
        await loadUserDataFromCloud(updatedUser);
      }
      hideAuthGate();
      setActiveTab("dashboard", { updateHash: true, scroll: true });
      showToast("Password baru berhasil disimpan! Selamat datang di Dashboard.");
    } catch (error) {
      showRecoveryFeedback(translateAuthError(error), "error");
    } finally {
      if (els.recoverySubmitBtn) els.recoverySubmitBtn.disabled = false;
      if (els.recoveryNewPassword) els.recoveryNewPassword.disabled = false;
      if (els.recoverySubmitLabel) els.recoverySubmitLabel.textContent = "Simpan Password Baru";
    }
  }

  function setAuthMode(mode, options = {}) {
    authMode = mode === "register" || mode === "forgot" ? mode : "login";
    if (!options.keepFeedback) clearAuthFeedback();
    resetPasswordVisibility("auth-password");

    const isRegister = authMode === "register";
    const isForgot = authMode === "forgot";

    if (els.authPasswordGroup) {
      els.authPasswordGroup.hidden = isForgot;
    }
    if (els.authPassword) {
      els.authPassword.required = !isForgot;
      els.authPassword.setAttribute("autocomplete", isRegister ? "new-password" : "current-password");
    }
    if (els.authForgotWrap) {
      els.authForgotWrap.hidden = authMode !== "login";
    }

    if (els.authTitle) {
      if (isForgot) {
        els.authTitle.textContent = "Reset Password · Gym Tracker App";
      } else if (isRegister) {
        els.authTitle.textContent = "Daftar · Gym Tracker App by LapoN";
      } else {
        els.authTitle.textContent = "Gym Tracker App by LapoN";
      }
    }
    if (els.authSubtitle) {
      if (isForgot) {
        els.authSubtitle.textContent = "Masukkan alamat email akun Anda. Kami akan mengirimkan link pemulihan (recovery) untuk mengatur ulang password Anda.";
      } else if (isRegister) {
        els.authSubtitle.textContent = "Buat akun baru menggunakan email dan password untuk menyimpan seluruh progres latihan Anda di cloud.";
      } else {
        els.authSubtitle.textContent = "Masuk dengan akun email Anda untuk menyinkronkan riwayat berat badan, nutrisi, dan progres angkatan ke cloud secara otomatis.";
      }
    }
    if (els.authSubmitLabel) {
      if (isForgot) {
        els.authSubmitLabel.textContent = "Kirim Link Recovery";
      } else if (isRegister) {
        els.authSubmitLabel.textContent = "Daftar Akun Baru (Register)";
      } else {
        els.authSubmitLabel.textContent = "Masuk (Login)";
      }
    }
    if (els.authTogglePrompt) {
      if (isForgot) {
        els.authTogglePrompt.textContent = "Sudah ingat password Anda?";
      } else if (isRegister) {
        els.authTogglePrompt.textContent = "Sudah punya akun Gym Tracker App by LapoN?";
      } else {
        els.authTogglePrompt.textContent = "Belum punya akun?";
      }
    }
    if (els.authToggleBtn) {
      if (isForgot) {
        els.authToggleBtn.textContent = "Kembali ke Masuk (Login)";
      } else if (isRegister) {
        els.authToggleBtn.textContent = "Masuk ke Akun (Login)";
      } else {
        els.authToggleBtn.textContent = "Daftar Akun Baru (Register)";
      }
    }
  }

  function setAuthBusy(busy) {
    authBusy = Boolean(busy);
    if (els.authSubmitBtn) els.authSubmitBtn.disabled = authBusy;
    if (els.authToggleBtn) els.authToggleBtn.disabled = authBusy;
    if (els.authForgotBtn) els.authForgotBtn.disabled = authBusy;
    if (els.authEmail) els.authEmail.disabled = authBusy;
    if (els.authPassword) els.authPassword.disabled = authBusy;
    if (els.authSubmitLabel) {
      if (authBusy) {
        els.authSubmitLabel.textContent = "Memproses...";
      } else if (authMode === "forgot") {
        els.authSubmitLabel.textContent = "Kirim Link Recovery";
      } else if (authMode === "register") {
        els.authSubmitLabel.textContent = "Daftar Akun Baru (Register)";
      } else {
        els.authSubmitLabel.textContent = "Masuk (Login)";
      }
    }
  }

  function showAuthGate() {
    if (!els.authGate) return;
    els.authGate.hidden = false;
    if (els.appShell) els.appShell.hidden = true;
    document.body.classList.add("auth-locked");
    document.title = "Login · Gym Tracker App by LapoN";
  }

  function hideAuthGate() {
    if (!els.authGate) return;
    els.authGate.hidden = true;
    if (els.appShell) els.appShell.hidden = false;
    document.body.classList.remove("auth-locked");
    const activeNav = els.navButtons.find((btn) => btn.classList.contains("active"));
    const tab = activeNav?.dataset.tabTarget || "dashboard";
    document.title = `${TAB_TITLES[tab] || "Dashboard"} · Gym Tracker App by LapoN`;
    if (tab === "analytics") refreshAnalyticsChartsSoon();
  }

  async function loadUserDataFromCloud(user) {
    if (!supabaseClient || !user) return;
    currentUser = user;

    if (els.userEmailDisplay) {
      els.userEmailDisplay.textContent = user.email || "User Aktif";
    }

    isHydratingFromCloud = true;
    setSyncStatus("saving", "Saving...");

    try {
      const { data, error } = await supabaseClient
        .from(SUPABASE_TABLE)
        .select("app_data, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data && data.app_data && typeof data.app_data === "object") {
        state = sanitizeState(data.app_data);
        currentDay = todayKey();
        persistState({ sync: false });
        renderAll();
        populateSettingsForm();
        setSyncStatus("idle", "Cloud Synced");
      } else {
        // User baru di cloud: inisialisasi state kosong bersih lalu UPSERT ke Supabase
        state = createDefaultState();
        currentDay = todayKey();
        persistState({ sync: false });
        renderAll();
        populateSettingsForm();

        const { error: upsertError } = await supabaseClient
          .from(SUPABASE_TABLE)
          .upsert(
            {
              user_id: user.id,
              email: user.email || "",
              app_data: state,
              updated_at: new Date().toISOString()
            },
            { onConflict: "user_id" }
          );

        if (upsertError) throw upsertError;
        setSyncStatus("idle", "Cloud Synced");
      }
    } catch (error) {
      console.warn("Gagal memuat atau membuat data cloud:", error);
      setSyncStatus("error", "Sync Error");
      showToast("Data lokal dimuat (gagal terhubung ke tabel cloud).", "error");
    } finally {
      isHydratingFromCloud = false;
      checkOnboardingGate();
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    if (authBusy) return;

    if (!supabaseClient) {
      showAuthFeedback("Supabase SDK belum siap. Periksa koneksi internet Anda lalu muat ulang halaman.", "error");
      return;
    }

    const email = els.authEmail?.value.trim() || "";
    const password = els.authPassword?.value || "";

    if (!email || !email.includes("@")) {
      showAuthFeedback("Masukkan alamat email yang valid.", "error");
      els.authEmail?.focus();
      return;
    }

    if (authMode !== "forgot" && password.length < 6) {
      showAuthFeedback("Password minimal harus terdiri dari 6 karakter.", "error");
      els.authPassword?.focus();
      return;
    }

    clearAuthFeedback();
    setAuthBusy(true);

    try {
      if (authMode === "forgot") {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
        });

        if (error) throw error;

        showAuthFeedback(
          "Link reset password telah dikirim! Silakan cek inbox atau folder spam email Anda.",
          "success"
        );
      } else if (authMode === "register") {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password
        });

        if (error) throw error;

        if (data?.user && data?.session) {
          // Inisialisasi baris data awal untuk user baru jika sesi langsung aktif
          const initialState = createDefaultState();
          await supabaseClient
            .from(SUPABASE_TABLE)
            .upsert(
              {
                user_id: data.user.id,
                email: data.user.email || email,
                app_data: initialState,
                updated_at: new Date().toISOString()
              },
              { onConflict: "user_id" }
            );
          await supabaseClient.auth.signOut();
        }

        setAuthMode("login", { keepFeedback: true });
        showAuthFeedback("Akun berhasil dibuat, silakan masuk.", "success");
        els.authPassword?.focus();
      } else {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        const signedInUser = data?.user ?? data?.session?.user;
        if (!signedInUser) {
          throw new Error("Sesi pengguna tidak ditemukan.");
        }

        showAuthFeedback("Berhasil masuk! Memuat data cloud...", "success");
        await loadUserDataFromCloud(signedInUser);
        hideAuthGate();
        if (els.authPassword) els.authPassword.value = "";
        resetPasswordVisibility("auth-password");
        clearAuthFeedback();
        showToast(`Selamat datang, ${signedInUser.email}!`);
      }
    } catch (error) {
      showAuthFeedback(translateAuthError(error), "error");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    if (!window.confirm("Keluar dari akun ini? Data lokal di browser akan dibersihkan agar tetap aman.")) {
      return;
    }

    window.clearTimeout(syncQueueTimer);

    try {
      if (supabaseClient) {
        await supabaseClient.auth.signOut();
      }
    } catch (error) {
      console.warn("Gagal sign out dari Supabase:", error);
    }

    currentUser = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Gagal menghapus LocalStorage:", error);
    }

    state = createDefaultState();
    currentDay = todayKey();
    if (els.onboardingModal) els.onboardingModal.hidden = true;
    closePasswordRecoveryModal();
    document.body.classList.remove("modal-open");
    renderAll();
    populateSettingsForm();

    if (els.userEmailDisplay) {
      els.userEmailDisplay.textContent = "Belum login";
    }
    setSyncStatus("idle", "Cloud Synced");
    setAuthMode("login");
    showAuthFeedback("Anda telah keluar. Silakan masuk kembali.", "info");
    showAuthGate();
    window.setTimeout(() => els.authEmail?.focus(), 60);
  }

  async function initSupabaseAuth() {
    if (!globalThis.supabase || typeof globalThis.supabase.createClient !== "function") {
      showAuthGate();
      showAuthFeedback("Gagal memuat Supabase SDK dari CDN. Periksa koneksi internet Anda.", "error");
      return;
    }

    const isRecoveryRedirect =
      window.location.hash.includes("type=recovery") ||
      window.location.search.includes("type=recovery");

    const cleanKey = String(SUPABASE_ANON_KEY || "").replace(/^\[|\]$/g, "").trim();
    supabaseClient = globalThis.supabase.createClient(SUPABASE_URL, cleanKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });

    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        if (session?.user) currentUser = session.user;
        openPasswordRecoveryModal();
      } else if (event === "SIGNED_OUT") {
        currentUser = null;
        closePasswordRecoveryModal();
        showAuthGate();
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        currentUser = session.user;
      }
    });

    try {
      const { data, error } = await supabaseClient.auth.getSession();
      if (error) throw error;

      const sessionUser = data?.session?.user ?? null;
      if (isRecoveryRedirect) {
        if (sessionUser) currentUser = sessionUser;
        openPasswordRecoveryModal();
      } else if (sessionUser) {
        hideAuthGate();
        await loadUserDataFromCloud(sessionUser);
      } else {
        showAuthGate();
      }
    } catch (error) {
      console.warn("Gagal memeriksa sesi Supabase:", error);
      showAuthGate();
    }
  }

  function checkDayRollover() {
    const current = todayKey();
    if (current === currentDay) return;
    currentDay = current;
    renderAll();
    showToast("Hari baru dimulai. Data hari ini siap diisi.");
  }

  function bindEvents() {
    els.authForm?.addEventListener("submit", handleAuthSubmit);
    els.authToggleBtn?.addEventListener("click", () => {
      setAuthMode(authMode === "login" ? "register" : "login");
    });
    els.authForgotBtn?.addEventListener("click", () => {
      setAuthMode("forgot");
      els.authEmail?.focus();
    });
    els.passwordRecoveryForm?.addEventListener("submit", handlePasswordRecoverySubmit);
    document.addEventListener("click", handlePasswordToggleClick);
    els.logoutBtn?.addEventListener("click", handleLogout);

    els.profCalcBtn?.addEventListener("click", () => handleAutoCalcByPrefix("prof"));
    els.onbCalcBtn?.addEventListener("click", () => handleAutoCalcByPrefix("onb"));
    els.profilePageForm?.addEventListener("submit", (event) => handleProfileFormSubmit("prof", event));
    els.onboardingForm?.addEventListener("submit", (event) => handleProfileFormSubmit("onb", event));

    window.addEventListener("online", () => {
      if (currentUser) scheduleCloudSync(true);
    });
    els.navButtons.forEach((button, index) => {
      button.addEventListener("click", () => setActiveTab(button.dataset.tabTarget));
      button.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex = (index + direction + els.navButtons.length) % els.navButtons.length;
        const nextButton = els.navButtons[nextIndex];
        nextButton.focus();
        setActiveTab(nextButton.dataset.tabTarget);
      });
    });

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-go-tab]");
      if (!trigger) return;
      const tab = trigger.dataset.goTab;
      goToTab(tab, { focusField: tab === "diet" });
    });

    els.weightForm.addEventListener("submit", handleWeightSubmit);
    els.splitSelect.addEventListener("change", (event) => applySplit(event.target.value));

    els.workoutSplitList.addEventListener("click", (event) => {
      const editBtn = event.target.closest("[data-edit-split]");
      if (editBtn) {
        const dayId = Number(editBtn.dataset.editSplit);
        populateSplitEditorForm(dayId);
        if (els.workoutSplitDetails) els.workoutSplitDetails.open = true;
        els.editSplitName?.focus();
        return;
      }
      const button = event.target.closest("[data-select-split]");
      if (!button) return;
      applySplit(button.dataset.selectSplit);
    });

    els.applySplitTemplateBtn?.addEventListener("click", handleSplitTemplateApply);
    els.editSplitDay?.addEventListener("change", (event) => populateSplitEditorForm(event.target.value));
    els.splitEditorForm?.addEventListener("submit", handleSplitEditorSubmit);

    els.workoutSplitSelect?.addEventListener("change", (event) => applySplit(event.target.value));
    els.workoutExerciseSelect?.addEventListener("change", handleExerciseSelectChange);
    els.workoutExerciseCustom?.addEventListener("input", updateWorkoutLive1RM);
    els.addCustomExerciseBtn?.addEventListener("click", handleAddCustomExerciseClick);
    els.customExercisesChips?.addEventListener("click", handleRemoveCustomExerciseClick);
    els.workoutWeight?.addEventListener("input", updateWorkoutLive1RM);
    els.workoutSets?.addEventListener("input", updateWorkoutLive1RM);
    els.workoutReps?.addEventListener("input", updateWorkoutLive1RM);
    els.workoutForm?.addEventListener("submit", handleWorkoutSubmit);

    els.cardioActivity?.addEventListener("change", handleCardioSelectChange);
    els.addCustomCardioBtn?.addEventListener("click", handleAddCustomCardioClick);
    els.cardioDuration?.addEventListener("input", updateCardioAutoCalories);
    els.cardioCalories?.addEventListener("input", () => {
      cardioCaloriesManual = Boolean(els.cardioCalories.value.trim());
    });
    els.cardioForm?.addEventListener("submit", handleCardioSubmit);

    els.bodyNoteTags?.addEventListener("click", handleBodyTagClick);
    els.bodyNotesForm?.addEventListener("submit", handleBodyNotesSubmit);

    els.workoutHistoryList?.addEventListener("click", handleWorkoutHistoryClick);

    els.analyticsContent.addEventListener("change", (event) => {
      if (event.target.id !== "strength-filter") return;
      const options = getAnalyticsStrengthOptions();
      strengthFilter = options.includes(event.target.value)
        ? event.target.value
        : options[0];
      renderAnalytics();
    });

    els.quickMealGrid.addEventListener("click", handleQuickMealClick);
    els.mealTemplateForm?.addEventListener("submit", handleMealTemplateSubmit);
    els.mealTemplateCancelEdit?.addEventListener("click", resetMealTemplateForm);
    els.mealTemplateManageList?.addEventListener("click", handleMealTemplateManageClick);
    els.resetMealTemplatesBtn?.addEventListener("click", handleResetMealTemplates);
    els.foodForm.addEventListener("submit", handleFoodSubmit);
    els.foodList.addEventListener("click", handleFoodDelete);

    els.openSettings.addEventListener("click", openSettings);
    els.closeSettings.addEventListener("click", closeSettings);
    els.settingsBackdrop.addEventListener("click", closeSettings);
    els.settingsForm.addEventListener("submit", handleSettingsSubmit);
    els.exportData.addEventListener("click", exportData);
    els.importData.addEventListener("click", () => els.importFile.click());
    els.importFile.addEventListener("change", (event) => handleImportFile(event.target.files?.[0]));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !els.settingsModal.hidden) {
        closeSettings();
        return;
      }
      trapModalFocus(event);
    });

    window.addEventListener("hashchange", () => {
      const tab = window.location.hash.replace("#", "");
      if (TAB_IDS.includes(tab)) setActiveTab(tab, { updateHash: false, scroll: true });
    });

    window.addEventListener("storage", (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        state = sanitizeState(JSON.parse(event.newValue));
        currentDay = todayKey();
        renderAll();
        populateSettingsForm();
      } catch (error) {
        console.warn("Data dari tab lain tidak dapat dimuat:", error);
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) checkDayRollover();
    });

    window.setInterval(checkDayRollover, 60000);
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || window.location.protocol === "file:") return;

    const register = () => {
      navigator.serviceWorker
        .register("./sw.js")
        .then((reg) => reg.update().catch(() => {}))
        .catch((error) => {
          console.warn("Service Worker tidak dapat didaftarkan:", error);
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }

  function init() {
    currentDay = todayKey();
    state = loadState();
    cacheElements();
    setAuthMode("login");
    showAuthGate();
    populateSplitSelect();
    renderQuickMeals();
    bindEvents();
    renderAll();

    const hashTab = window.location.hash.replace("#", "");
    setActiveTab(TAB_IDS.includes(hashTab) ? hashTab : "dashboard", {
      updateHash: true,
      scroll: false
    });

    persistState({ sync: false });
    initSupabaseAuth();
    registerServiceWorker();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }



})();
