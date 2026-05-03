import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Grid,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  notification,
} from "antd";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Clock3,
  Droplets,
  Eye,
  Filter,
  Heart,
  Languages,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
  UserRound,
  Wind,
} from "lucide-react";
import {
  adminEmails,
  isSupabaseConfigured,
  supabase,
  supabaseTable,
} from "../lib/supabaseClient";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const CONDITION_CONFIG = {
  diabetes: {
    label: "Diabetes",
    icon: <Droplets size={14} />,
    antColor: "blue",
  },
  asthma: {
    label: "Asthma",
    icon: <Wind size={14} />,
    antColor: "purple",
  },
  blood_pressure: {
    label: "Blood Pressure",
    icon: <Heart size={14} />,
    antColor: "red",
  },
};

const STATUS_CONFIG = {
  RED: {
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
    icon: <AlertTriangle size={13} />,
  },
  YELLOW: {
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    icon: <Activity size={13} />,
  },
  GREEN: {
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    icon: <CheckCircle size={13} />,
  },
};

const RECORD_LANGUAGE_LABELS = { uz: "UZ", ru: "RU", en: "EN" };
const UI_LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "ru", label: "Русский" },
  { value: "uz", label: "O'zbekcha" },
];

const FIELD_LABEL_KEYS = {
  age: "fieldAge",
  agegroup: "fieldAgeGroup",
  mood: "fieldMood",
  lunch: "fieldLunch",
  dinner: "fieldDinner",
  sweets: "fieldSweets",
  feeling: "fieldFeeling",
  glucose: "fieldGlucose",
  activity: "fieldActivity",
  fullname: "fieldFullName",
  full_name: "fieldFullName",
  breakfast: "fieldBreakfast",
  urination: "fieldUrination",
  medicationtaken: "fieldMedicationTaken",
  medication_taken: "fieldMedicationTaken",
  inhalerused: "fieldInhalerUsed",
  inhaler_used: "fieldInhalerUsed",
  shortnessofbreath: "fieldShortnessOfBreath",
  shortness_of_breath: "fieldShortnessOfBreath",
  chesttightness: "fieldChestTightness",
  chest_tightness: "fieldChestTightness",
  oxygenlevelknown: "fieldOxygenLevelKnown",
  oxygen_level_known: "fieldOxygenLevelKnown",
  headache: "fieldHeadache",
  blurredvision: "fieldBlurredVision",
  blurred_vision: "fieldBlurredVision",
  glucosecheckedtoday: "fieldGlucoseCheckedToday",
  glucose_checked_today: "fieldGlucoseCheckedToday",
  dizziness: "fieldDizziness",
  vomiting: "fieldVomiting",
};

const VALUE_TRANSLATIONS = {
  good: { en: "Good", ru: "Хорошее", uz: "Yaxshi" },
  bad: { en: "Bad", ru: "Плохое", uz: "Yomon" },
  yes: { en: "Yes", ru: "Да", uz: "Ha" },
  no: { en: "No", ru: "Нет", uz: "Yo'q" },
};

const UI_TEXT = {
  en: {
    dashboardName: "PediaScreen Admin",
    sidebarTitle: "Clinical workspace",
    sidebarText:
      "Keep the language switch, account status, and triage actions in one place so nurses and doctors can move faster.",
    nurseDirectory: "Nurse directory",
    nurseDirectoryText:
      "Open the list of allowed nurse/admin accounts and view profile details.",
    openDirectory: "Open nurses",
    signedIn: "SIGNED IN",
    demoData: "Demo data",
    liveData: "Live data",
    tableLabel: "Table",
    lastSync: "Last sync",
    waitingSync: "Waiting for first sync",
    languageSwitcher: "Panel language",
    refresh: "Refresh",
    signOut: "Sign Out",
    compactTitle: "Triage dashboard",
    compactText:
      "Critical cases rise to the top, status cards open filtered queues, and patient details stay one tap away.",
    secureLogin: "Secure Supabase login",
    liveRefresh: "Live refresh",
    fastTriage: "Fast triage access",
    mockTitle: "The dashboard is currently showing demo submissions.",
    mockDescription:
      "This usually means the table name is wrong, Row Level Security blocks access, or the browser session cannot read the live table yet.",
    urgentQueue: "Urgent queue",
    urgentText:
      "Critical cases should open first. Use this compact alert or the status cards below to jump directly into the right queue.",
    reviewCritical: "Open critical submissions",
    totalSubmissions: "Total submissions",
    criticalCases: "Critical cases",
    attentionCases: "Attention cases",
    stableCases: "Stable cases",
    languages: "Languages",
    allRecords: "All records",
    needAttention: "Need action",
    watchClosely: "Watch closely",
    greenStatus: "Stable status",
    coverage: "Coverage",
    queueEyebrow: "Submission Queue",
    queueTitle: "Review and filter incoming assessments",
    visibleSummary: "{visible} visible of {total} total",
    searchPlaceholder: "Search advice, reason, status, or answers",
    condition: "Condition",
    status: "Status",
    language: "Language",
    clear: "Clear",
    quickFilters: "Quick filters",
    allSubmissions: "All submissions",
    submitted: "Submitted",
    advice: "Advice",
    view: "View",
    noAdvice: "No advice",
    noMatches: "No submissions match the current filters.",
    noSubmissions: "No submissions are available yet.",
    record: "record",
    records: "records",
    loading: "Loading submissions...",
    submissionDetails: "Submission details",
    assessmentSummary: "Assessment summary",
    reason: "Reason",
    patientResponses: "Patient responses",
    personSummary: "Person summary",
    recentSubmissions: "Recent submissions",
    noRecentSubmissions: "No recent submissions were found for this person.",
    noPeople: "No people could be identified from submissions yet.",
    unknownPerson: "Unknown person",
    submissionsCount: "Submissions",
    latestStatus: "Latest status",
    lastSeen: "Last seen",
    detailsAboutPerson: "Person details",
    accountProfile: "Account profile",
    accountEmail: "Account email",
    accountRole: "Role",
    currentSession: "Current session",
    yesShort: "Yes",
    noShort: "No",
    noNurses: "No configured nurse/admin accounts were found.",
    primaryAdmin: "Primary admin",
    nurseMember: "Nurse member",
    noPatientAnswers: "No patient answers were recorded.",
    yes: "Yes",
    no: "No",
    unknown: "Unknown",
    couldNotLoad: "Could not load live submissions",
    demoFallback: "The dashboard is showing demo data for now.",
    criticalNotificationTitle: "Critical cases need attention",
    criticalNotificationBody:
      "{count} critical submissions are waiting. Click this alert to open the critical queue.",
    fieldAge: "Age",
    fieldAgeGroup: "Age group",
    fieldMood: "Mood",
    fieldLunch: "Lunch",
    fieldDinner: "Dinner",
    fieldSweets: "Sweets",
    fieldFeeling: "Feeling",
    fieldGlucose: "Glucose",
    fieldActivity: "Activity",
    fieldFullName: "Full name",
    fieldBreakfast: "Breakfast",
    fieldUrination: "Urination",
    fieldMedicationTaken: "Medication taken",
    fieldInhalerUsed: "Inhaler used",
    fieldShortnessOfBreath: "Shortness of breath",
    fieldChestTightness: "Chest tightness",
    fieldOxygenLevelKnown: "Oxygen level known",
    fieldHeadache: "Headache",
    fieldBlurredVision: "Blurred vision",
    fieldGlucoseCheckedToday: "Glucose checked today",
    fieldDizziness: "Dizziness",
    fieldVomiting: "Vomiting",
    securityNote: "Displayed content is sanitized and rendered as plain text.",
  },
  ru: {
    dashboardName: "PediaScreen Admin",
    sidebarTitle: "Рабочее место врача",
    sidebarText:
      "Переключение языка, статус аккаунта и быстрые действия находятся в одной боковой панели, чтобы медсёстрам и врачам было легче работать.",
    nurseDirectory: "Список медперсонала",
    nurseDirectoryText:
      "Откройте список разрешённых аккаунтов медсестёр и администраторов и смотрите их профили.",
    openDirectory: "Открыть медперсонал",
    signedIn: "ВХОД ВЫПОЛНЕН",
    demoData: "Демо-данные",
    liveData: "Живые данные",
    tableLabel: "Таблица",
    lastSync: "Последняя синхронизация",
    waitingSync: "Ожидание первой синхронизации",
    languageSwitcher: "Язык панели",
    refresh: "Обновить",
    signOut: "Выйти",
    compactTitle: "Панель triage",
    compactText:
      "Критические случаи поднимаются наверх, статусные карточки открывают нужные очереди, а детали пациента доступны в одно нажатие.",
    secureLogin: "Безопасный вход Supabase",
    liveRefresh: "Живое обновление",
    fastTriage: "Быстрый triage",
    mockTitle: "Сейчас панель показывает демо-заявки.",
    mockDescription:
      "Обычно это значит, что имя таблицы неверное, RLS блокирует доступ или сессия браузера пока не может читать живую таблицу.",
    urgentQueue: "Срочная очередь",
    urgentText:
      "Критические случаи должны открываться первыми. Используйте это компактное предупреждение или карточки статусов ниже, чтобы сразу перейти к нужной очереди.",
    reviewCritical: "Открыть критические заявки",
    totalSubmissions: "Все заявки",
    criticalCases: "Критические случаи",
    attentionCases: "Требуют внимания",
    stableCases: "Стабильные случаи",
    languages: "Языки",
    allRecords: "Все записи",
    needAttention: "Нужна реакция",
    watchClosely: "Нужно наблюдать",
    greenStatus: "Стабильный статус",
    coverage: "Покрытие",
    queueEyebrow: "Очередь заявок",
    queueTitle: "Просмотр и фильтрация поступающих оценок",
    visibleSummary: "Показано {visible} из {total}",
    searchPlaceholder: "Поиск по совету, причине, статусу или ответам",
    condition: "Состояние",
    status: "Статус",
    language: "Язык",
    clear: "Сбросить",
    quickFilters: "Быстрые фильтры",
    allSubmissions: "Все заявки",
    submitted: "Отправлено",
    advice: "Рекомендация",
    view: "Открыть",
    noAdvice: "Нет рекомендации",
    noMatches: "Нет заявок под текущие фильтры.",
    noSubmissions: "Заявок пока нет.",
    record: "запись",
    records: "записей",
    loading: "Загрузка заявок...",
    submissionDetails: "Детали заявки",
    assessmentSummary: "Краткий итог",
    reason: "Причина",
    patientResponses: "Ответы пациента",
    personSummary: "Сводка по человеку",
    recentSubmissions: "Последние заявки",
    noRecentSubmissions: "Для этого человека пока не найдено недавних заявок.",
    noPeople: "Пока не удалось определить людей по заявкам.",
    unknownPerson: "Неизвестный человек",
    submissionsCount: "Заявки",
    latestStatus: "Последний статус",
    lastSeen: "Последнее появление",
    detailsAboutPerson: "Данные человека",
    accountProfile: "Профиль аккаунта",
    accountEmail: "Email аккаунта",
    accountRole: "Роль",
    currentSession: "Текущая сессия",
    yesShort: "Да",
    noShort: "Нет",
    noNurses: "Не найдены настроенные аккаунты медперсонала.",
    primaryAdmin: "Главный администратор",
    nurseMember: "Медсестра",
    noPatientAnswers: "Ответы пациента не записаны.",
    yes: "Да",
    no: "Нет",
    unknown: "Неизвестно",
    couldNotLoad: "Не удалось загрузить живые заявки",
    demoFallback: "Пока показываются демо-данные.",
    criticalNotificationTitle: "Есть критические случаи",
    criticalNotificationBody:
      "Ожидают {count} критических заявок. Нажмите на это уведомление, чтобы открыть критическую очередь.",
    fieldAge: "Возраст",
    fieldAgeGroup: "Возрастная группа",
    fieldMood: "Настроение",
    fieldLunch: "Обед",
    fieldDinner: "Ужин",
    fieldSweets: "Сладкое",
    fieldFeeling: "Самочувствие",
    fieldGlucose: "Глюкоза",
    fieldActivity: "Активность",
    fieldFullName: "Полное имя",
    fieldBreakfast: "Завтрак",
    fieldUrination: "Мочеиспускание",
    fieldMedicationTaken: "Лекарство принято",
    fieldInhalerUsed: "Ингалятор использован",
    fieldShortnessOfBreath: "Одышка",
    fieldChestTightness: "Стеснение в груди",
    fieldOxygenLevelKnown: "Известен уровень кислорода",
    fieldHeadache: "Головная боль",
    fieldBlurredVision: "Затуманенное зрение",
    fieldGlucoseCheckedToday: "Глюкоза проверена сегодня",
    fieldDizziness: "Головокружение",
    fieldVomiting: "Рвота",
    securityNote: "Показываемый контент очищается и выводится только как обычный текст.",
  },
  uz: {
    dashboardName: "PediaScreen Admin",
    sidebarTitle: "Shifokor ish paneli",
    sidebarText:
      "Tilni almashtirish, akkaunt holati va tezkor amallar bitta yon panelda turadi, shuning uchun hamshira va shifokorlarga ishlash osonroq bo'ladi.",
    nurseDirectory: "Hamshiralar ro'yxati",
    nurseDirectoryText:
      "Ruxsat berilgan hamshira va admin akkauntlari ro'yxatini oching va profil tafsilotlarini ko'ring.",
    openDirectory: "Hamshiralarni ochish",
    signedIn: "TIZIMGA KIRILGAN",
    demoData: "Demo ma'lumotlar",
    liveData: "Jonli ma'lumotlar",
    tableLabel: "Jadval",
    lastSync: "Oxirgi sinxronlash",
    waitingSync: "Birinchi sinxronlash kutilmoqda",
    languageSwitcher: "Panel tili",
    refresh: "Yangilash",
    signOut: "Chiqish",
    compactTitle: "Triage paneli",
    compactText:
      "Kritik holatlar tepaga chiqadi, status kartalari kerakli navbatni ochadi va bemor tafsilotlari bir bosishda ko'rinadi.",
    secureLogin: "Xavfsiz Supabase login",
    liveRefresh: "Jonli yangilash",
    fastTriage: "Tez triage",
    mockTitle: "Panel hozir demo yuborishlarni ko'rsatmoqda.",
    mockDescription:
      "Odatda bu jadval nomi noto'g'ri, RLS kirishni to'smoqda yoki brauzer sessiyasi jonli jadvalni o'qiy olmayotganini bildiradi.",
    urgentQueue: "Shoshilinch navbat",
    urgentText:
      "Kritik holatlar birinchi ochilishi kerak. Kerakli navbatga tez o'tish uchun ushbu ixcham ogohlantirish yoki pastdagi status kartalaridan foydalaning.",
    reviewCritical: "Kritik yuborishlarni ochish",
    totalSubmissions: "Barcha yuborishlar",
    criticalCases: "Kritik holatlar",
    attentionCases: "E'tibor kerak",
    stableCases: "Barqaror holatlar",
    languages: "Tillar",
    allRecords: "Barcha yozuvlar",
    needAttention: "Tez ko'rish kerak",
    watchClosely: "Yaqin kuzatuv",
    greenStatus: "Barqaror status",
    coverage: "Qamrov",
    queueEyebrow: "Yuborish navbati",
    queueTitle: "Kelgan baholashlarni ko'rish va filtrlash",
    visibleSummary: "{visible} ta ko'rinmoqda / jami {total}",
    searchPlaceholder: "Maslahat, sabab, status yoki javoblardan qidirish",
    condition: "Holat",
    status: "Status",
    language: "Til",
    clear: "Tozalash",
    quickFilters: "Tez filtrlash",
    allSubmissions: "Barcha yuborishlar",
    submitted: "Yuborilgan vaqt",
    advice: "Maslahat",
    view: "Ko'rish",
    noAdvice: "Maslahat yo'q",
    noMatches: "Joriy filtrlarga mos yuborishlar topilmadi.",
    noSubmissions: "Hozircha yuborishlar yo'q.",
    record: "yozuv",
    records: "yozuv",
    loading: "Yuborishlar yuklanmoqda...",
    submissionDetails: "Yuborish tafsilotlari",
    assessmentSummary: "Baholash xulosasi",
    reason: "Sabab",
    patientResponses: "Bemor javoblari",
    personSummary: "Odam bo'yicha qisqa ma'lumot",
    recentSubmissions: "So'nggi yuborishlar",
    noRecentSubmissions: "Bu odam uchun yaqindagi yuborishlar topilmadi.",
    noPeople: "Hozircha yuborishlardan odamlarni aniqlab bo'lmadi.",
    unknownPerson: "Noma'lum odam",
    submissionsCount: "Yuborishlar",
    latestStatus: "Oxirgi status",
    lastSeen: "Oxirgi ko'rinish",
    detailsAboutPerson: "Odam tafsilotlari",
    accountProfile: "Akkaunt profili",
    accountEmail: "Akkaunt emaili",
    accountRole: "Roli",
    currentSession: "Joriy sessiya",
    yesShort: "Ha",
    noShort: "Yo'q",
    noNurses: "Sozlangan hamshira/admin akkauntlari topilmadi.",
    primaryAdmin: "Asosiy admin",
    nurseMember: "Hamshira",
    noPatientAnswers: "Bemor javoblari yozilmagan.",
    yes: "Ha",
    no: "Yo'q",
    unknown: "Noma'lum",
    couldNotLoad: "Jonli yuborishlarni yuklab bo'lmadi",
    demoFallback: "Hozircha demo ma'lumotlar ko'rsatilmoqda.",
    criticalNotificationTitle: "Kritik holatlar bor",
    criticalNotificationBody:
      "{count} ta kritik yuborish kutmoqda. Kritik navbatni ochish uchun bu bildirishnomani bosing.",
    fieldAge: "Yosh",
    fieldAgeGroup: "Yosh guruhi",
    fieldMood: "Kayfiyat",
    fieldLunch: "Tushlik",
    fieldDinner: "Kechki ovqat",
    fieldSweets: "Shirinlik",
    fieldFeeling: "Holat",
    fieldGlucose: "Glyukoza",
    fieldActivity: "Faollik",
    fieldFullName: "To'liq ism",
    fieldBreakfast: "Nonushta",
    fieldUrination: "Siyish",
    fieldMedicationTaken: "Dori qabul qilingan",
    fieldInhalerUsed: "Ingalyator ishlatilgan",
    fieldShortnessOfBreath: "Nafas qisishi",
    fieldChestTightness: "Ko'krak siqilishi",
    fieldOxygenLevelKnown: "Kislorod darajasi ma'lum",
    fieldHeadache: "Bosh og'rig'i",
    fieldBlurredVision: "Ko'rish xiralashuvi",
    fieldGlucoseCheckedToday: "Bugun glyukoza tekshirildi",
    fieldDizziness: "Bosh aylanishi",
    fieldVomiting: "Qusish",
    securityNote: "Ko'rsatilayotgan kontent tozalanadi va faqat oddiy matn sifatida chiqariladi.",
  },
};

const MOCK_SUBMISSIONS = [
  {
    id: "demo-1",
    created_at: "2026-05-01T08:15:00.000Z",
    condition_key: "diabetes",
    language: "en",
    result_data: {
      color: "YELLOW",
      advice: "Schedule a follow-up blood sugar check within 24 hours.",
      reason: "Reported dizziness, thirst, and irregular glucose readings.",
    },
    user_answers: {
      age_group: "8-12",
      glucose_checked_today: true,
      dizziness: true,
      vomiting: false,
    },
  },
  {
    id: "demo-2",
    created_at: "2026-05-01T07:40:00.000Z",
    condition_key: "asthma",
    language: "ru",
    result_data: {
      color: "RED",
      advice: "Immediate clinical review is recommended.",
      reason: "Breathing difficulty and night-time wheezing were reported.",
    },
    user_answers: {
      inhaler_used: true,
      shortness_of_breath: true,
      chest_tightness: true,
      oxygen_level_known: false,
    },
  },
  {
    id: "demo-3",
    created_at: "2026-05-01T06:20:00.000Z",
    condition_key: "blood_pressure",
    language: "uz",
    result_data: {
      color: "GREEN",
      advice: "Continue routine monitoring.",
      reason: "No urgent symptoms were reported and readings are within range.",
    },
    user_answers: {
      headache: false,
      blurred_vision: false,
      medication_taken: true,
    },
  },
];

const replaceTokens = (template, values) =>
  template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");

const sanitizeText = (value, maxLength = 240) => {
  if (value === null || value === undefined) return "";
  return Array.from(String(value))
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127);
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
};

const normalizeFieldKey = (key) =>
  sanitizeText(key, 80)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");

const sanitizeUnknownValue = (value, maxLength = 180) => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : "";
  if (Array.isArray(value)) {
    return value
      .slice(0, 6)
      .map((item) => sanitizeUnknownValue(item, 40))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    const pairs = Object.entries(value).slice(0, 6);
    return pairs
      .map(([key, item]) => `${sanitizeText(key, 30)}: ${sanitizeUnknownValue(item, 40)}`)
      .join(", ");
  }
  return sanitizeText(value, maxLength);
};

const sanitizeRecord = (record) => ({
  ...record,
  id: sanitizeText(record?.id || "-", 100),
  condition_key: sanitizeText(record?.condition_key || "", 60),
  language: sanitizeText(record?.language || "", 10),
  created_at: sanitizeText(record?.created_at || "", 40),
  result_data: {
    color: sanitizeText(record?.result_data?.color || "", 20),
    advice: sanitizeUnknownValue(record?.result_data?.advice, 500),
    reason: sanitizeUnknownValue(record?.result_data?.reason, 500),
  },
  user_answers: Object.fromEntries(
    Object.entries(record?.user_answers || {})
      .slice(0, 40)
      .map(([key, value]) => [sanitizeText(key, 80), sanitizeUnknownValue(value, 120)]),
  ),
});

// Normalize user answer keys once, then resolve values by alias list.
// This fixes cases like "Full name", "FullName", "full_name", and mixed casing.
const getAnswerValueByAliases = (answers, aliases) => {
  const normalizedAnswers = new Map(
    Object.entries(answers || {}).map(([key, value]) => [normalizeFieldKey(key), value]),
  );

  for (const alias of aliases) {
    const found = normalizedAnswers.get(normalizeFieldKey(alias));
    if (found !== undefined && found !== null && found !== "") {
      return found;
    }
  }

  return "";
};

const derivePersonName = (record, fallbackLabel) => {
  const answers = record?.user_answers || {};
  const rawName = getAnswerValueByAliases(answers, [
    "full_name",
    "fullname",
    "full name",
    "name",
    "patient_name",
    "patientname",
    "patient name",
  ]);

  return sanitizeText(rawName || "", 80) || fallbackLabel;
};

const formatProfileNameFromEmail = (email, fallbackLabel) => {
  const local = sanitizeText(email.split("@")[0] || "", 80);
  if (!local) return fallbackLabel;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((token) => token[0].toUpperCase() + token.slice(1))
    .join(" ");
};

// Build nurse/admin account cards from configured allowed emails.
// This uses env-configured accounts so staff can quickly open peer profiles.
const buildNurseProfiles = (allowedEmails, currentUserEmail, fallbackLabel, text) => {
  const normalizedCurrent = sanitizeText(currentUserEmail || "", 120).toLowerCase();
  const uniqueEmails = Array.from(
    new Set(
      [...allowedEmails, normalizedCurrent]
        .map((email) => sanitizeText(email || "", 120).toLowerCase())
        .filter(Boolean),
    ),
  );

  return uniqueEmails.map((email, index) => ({
    id: `nurse-${email}`,
    email,
    displayName: formatProfileNameFromEmail(email, fallbackLabel),
    role: index === 0 ? text.primaryAdmin : text.nurseMember,
    isCurrentSession: email === normalizedCurrent,
  }));
};

const formatDate = (iso, locale) => {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const translateFieldLabel = (key, text) => {
  const normalized = normalizeFieldKey(key);
  const labelKey = FIELD_LABEL_KEYS[normalized];
  if (labelKey && text[labelKey]) return text[labelKey];

  const fallback = sanitizeText(key, 80)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
  return fallback || text.unknown;
};

const formatValue = (value, text, locale) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? text.yes : text.no;
  if (typeof value === "number") return String(value);

  const sanitized = sanitizeUnknownValue(value, 180);
  const normalized = sanitized.toLowerCase();
  const translatedValue = VALUE_TRANSLATIONS[normalized]?.[locale];
  return translatedValue || sanitized || "-";
};

const matchesSearch = (record, query) => {
  if (!query) return true;

  const haystack = [
    record.id,
    record.condition_key,
    record.language,
    record.result_data?.color,
    record.result_data?.advice,
    record.result_data?.reason,
    JSON.stringify(record.user_answers || {}),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
};

const ConditionTag = ({ condition }) => {
  const config = CONDITION_CONFIG[condition] || {
    label: condition || "Unknown",
    antColor: "default",
    icon: null,
  };

  return (
    <Tag
      color={config.antColor}
      icon={config.icon}
      style={{ borderRadius: 999, fontWeight: 600, fontSize: 12, paddingInline: 10 }}
    >
      {config.label}
    </Tag>
  );
};

const StatusBadge = ({ status, label }) => {
  const config = STATUS_CONFIG[status];

  if (!config) {
    return <Tag style={{ borderRadius: 999 }}>{label || status || "Unknown"}</Tag>;
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      {config.icon}
      {label}
    </span>
  );
};

const StatCard = ({ title, value, icon, accent, helper, active, onClick }) => (
  <Card
    bordered={false}
    hoverable
    onClick={onClick}
    style={{
      borderRadius: 20,
      background: active ? "#ecfeff" : "#fff",
      boxShadow: active
        ? "0 18px 44px rgba(14, 165, 233, 0.16)"
        : "0 10px 30px rgba(15, 23, 42, 0.06)",
      height: "100%",
      cursor: "pointer",
      border: active ? "1px solid #67e8f9" : "1px solid transparent",
    }}
    styles={{ body: { padding: 20 } }}
  >
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Space style={{ justifyContent: "space-between", width: "100%" }} align="start">
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 15,
            background: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
          }}
        >
          {icon}
        </div>
        <Text style={{ color: "#94a3b8", fontSize: 12, textAlign: "right" }}>{helper}</Text>
      </Space>
      <Statistic
        title={<span style={{ color: "#64748b", fontWeight: 600 }}>{title}</span>}
        value={value}
        valueStyle={{ color: "#0f172a", fontSize: 28, fontWeight: 800 }}
      />
    </Space>
  </Card>
);

const DetailDrawer = ({
  open,
  onClose,
  record,
  text,
  statusLabels,
  locale,
  isMobile,
}) => {
  if (!record) return null;

  const status = record.result_data?.color;
  const statusConfig = STATUS_CONFIG[status] || {};
  const answers = record.user_answers || {};
  const translatedStatusLabel = statusLabels?.[status] || text.unknown;

  return (
    <Drawer
      title={
        <Space size={10}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: statusConfig.color || "#94a3b8",
            }}
          />
          <div>
            <Text strong style={{ fontSize: 16, color: "#0f172a" }}>
              {text.submissionDetails}
            </Text>
            <br />
            <Text style={{ color: "#64748b", fontSize: 12 }}>{record.id}</Text>
          </div>
        </Space>
      }
      placement="right"
      width={isMobile ? "100%" : 560}
      open={open}
      onClose={onClose}
      styles={{
        body: { padding: isMobile ? 16 : 24, background: "#f8fafc" },
        header: { borderBottom: "1px solid #e2e8f0" },
      }}
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card bordered={false} style={{ borderRadius: 18 }}>
          <Space wrap size={[10, 10]}>
            <Tag style={metaTagStyle}>
              <Clock3 size={13} />
              {formatDate(record.created_at, locale)}
            </Tag>
            <ConditionTag condition={record.condition_key} />
            <Tag style={metaTagStyle}>
              <Languages size={13} />
              {RECORD_LANGUAGE_LABELS[record.language] || record.language || text.unknown}
            </Tag>
            <StatusBadge status={status} label={translatedStatusLabel} />
          </Space>
        </Card>

        <Card bordered={false} style={{ borderRadius: 18 }}>
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            <Text strong style={sectionTitleStyle}>
              {text.assessmentSummary}
            </Text>
            <div
              style={{
                borderRadius: 16,
                border: `1px solid ${statusConfig.border || "#e2e8f0"}`,
                background: statusConfig.bg || "#fff",
                padding: 16,
              }}
            >
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <div>
                  <Text style={fieldTitleStyle}>{text.advice}</Text>
                  <div style={fieldBodyStyle}>{record.result_data?.advice || "-"}</div>
                </div>
                <div>
                  <Text style={fieldTitleStyle}>{text.reason}</Text>
                  <div style={fieldBodyStyle}>{record.result_data?.reason || "-"}</div>
                </div>
              </Space>
            </div>
          </Space>
        </Card>

        <Card bordered={false} style={{ borderRadius: 18 }}>
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            <Text strong style={sectionTitleStyle}>
              {text.patientResponses}
            </Text>
            {Object.keys(answers).length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={text.noPatientAnswers}
              />
            ) : (
              <Descriptions
                bordered
                size="small"
                column={1}
                styles={{
                  label: {
                    width: isMobile ? 138 : 190,
                    background: "#f8fafc",
                    color: "#475569",
                    fontSize: 12,
                    fontWeight: 700,
                  },
                  content: {
                    color: "#0f172a",
                    fontSize: 13,
                  },
                }}
              >
                {Object.entries(answers).map(([key, value]) => (
                  <Descriptions.Item key={key} label={translateFieldLabel(key, text)}>
                    {formatValue(value, text, locale)}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            )}
            <Text style={{ color: "#94a3b8", fontSize: 12 }}>{text.securityNote}</Text>
          </Space>
        </Card>
      </Space>
    </Drawer>
  );
};

const NurseDirectoryDrawer = ({
  open,
  onClose,
  nurses,
  onSelectNurse,
  text,
  isMobile,
}) => (
  <Drawer
    title={text.nurseDirectory}
    placement="left"
    width={isMobile ? "100%" : 420}
    open={open}
    onClose={onClose}
    styles={{
      body: { padding: isMobile ? 16 : 18, background: "#f8fafc" },
      header: { borderBottom: "1px solid #e2e8f0" },
    }}
  >
    <Space direction="vertical" size={14} style={{ width: "100%" }}>
      <Text style={{ color: "#64748b" }}>{text.nurseDirectoryText}</Text>
      {nurses.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={text.noNurses} />
      ) : (
        nurses.map((nurse) => (
          <Card
            key={nurse.id}
            bordered={false}
            hoverable
            onClick={() => onSelectNurse(nurse)}
            style={{ borderRadius: 18, cursor: "pointer" }}
            styles={{ body: { padding: 16 } }}
          >
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Space style={{ justifyContent: "space-between", width: "100%" }} align="start">
                <Space size={12}>
                  <Avatar
                    size={42}
                    style={{ background: "linear-gradient(135deg, #0f766e, #38bdf8)" }}
                    icon={<UserRound size={18} />}
                  />
                  <div>
                    <Text strong style={{ color: "#0f172a", fontSize: 15 }}>
                      {nurse.displayName}
                    </Text>
                    <div style={{ color: "#64748b", fontSize: 12 }}>{nurse.email}</div>
                  </div>
                </Space>
                <ChevronRight size={18} color="#94a3b8" />
              </Space>

              <Space wrap size={[8, 8]}>
                <Tag style={metaTagStyle}>
                  <ShieldCheck size={12} />
                  {nurse.role}
                </Tag>
                <Tag style={metaTagStyle}>
                  <UserRound size={12} />
                  {text.currentSession}: {nurse.isCurrentSession ? text.yesShort : text.noShort}
                </Tag>
              </Space>
            </Space>
          </Card>
        ))
      )}
    </Space>
  </Drawer>
);

const NurseProfileDrawer = ({ open, onClose, nurse, text, isMobile }) => {
  if (!nurse) return null;

  return (
    <Drawer
      title={text.accountProfile}
      placement="right"
      width={isMobile ? "100%" : 500}
      open={open}
      onClose={onClose}
      styles={{
        body: { padding: isMobile ? 16 : 20, background: "#f8fafc" },
        header: { borderBottom: "1px solid #e2e8f0" },
      }}
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card bordered={false} style={{ borderRadius: 18 }}>
          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            <Space size={12}>
              <Avatar
                size={50}
                style={{ background: "linear-gradient(135deg, #0f766e, #38bdf8)" }}
                icon={<UserRound size={20} />}
              />
              <div>
                <Title level={4} style={{ margin: 0, color: "#0f172a" }}>
                  {nurse.displayName}
                </Title>
                <Text style={{ color: "#64748b" }}>{nurse.email}</Text>
              </div>
            </Space>
          </Space>
        </Card>

        <Card bordered={false} style={{ borderRadius: 18 }}>
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Text strong style={sectionTitleStyle}>
              {text.accountProfile}
            </Text>
            <Descriptions
              bordered
              size="small"
              column={1}
              styles={{
                label: {
                  width: isMobile ? 132 : 180,
                  background: "#f8fafc",
                  color: "#475569",
                  fontSize: 12,
                  fontWeight: 700,
                },
                content: {
                  color: "#0f172a",
                  fontSize: 13,
                },
              }}
            >
              <Descriptions.Item label={text.accountEmail}>
                {nurse.email}
              </Descriptions.Item>
              <Descriptions.Item label={text.accountRole}>
                {nurse.role}
              </Descriptions.Item>
              <Descriptions.Item label={text.currentSession}>
                {nurse.isCurrentSession ? text.yesShort : text.noShort}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        </Card>
      </Space>
    </Drawer>
  );
};

export default function AdminPanel({ user, onSignOut }) {
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const isTablet = screens.lg && !screens.xxl;
  const [uiLanguage, setUiLanguage] = useState("en");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterCondition, setFilterCondition] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterLanguage, setFilterLanguage] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [selectedNurse, setSelectedNurse] = useState(null);
  const [nurseProfileOpen, setNurseProfileOpen] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [api, contextHolder] = notification.useNotification();
  const lastCriticalAlertCount = useRef(0);

  const text = UI_TEXT[uiLanguage];
  const statusLabels = {
    RED: text.criticalCases,
    YELLOW: text.attentionCases,
    GREEN: text.stableCases,
  };

  const clearFilters = useCallback(() => {
    setQuery("");
    setFilterCondition(null);
    setFilterStatus(null);
    setFilterLanguage(null);
  }, []);

  const applyStatusFilter = useCallback((status) => {
    setFilterStatus(status);
    setFilterCondition(null);
    setFilterLanguage(null);
    setQuery("");
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      if (!isSupabaseConfigured) {
        setData(MOCK_SUBMISSIONS.map(sanitizeRecord));
        setUsingMockData(true);
        setLastUpdated(new Date().toISOString());
        return;
      }

      const { data: rows, error } = await supabase
        .from(supabaseTable)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setData((rows || []).map(sanitizeRecord));
      setUsingMockData(false);
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      setData(MOCK_SUBMISSIONS.map(sanitizeRecord));
      setUsingMockData(true);
      setLastUpdated(new Date().toISOString());
      api.error({
        message: text.couldNotLoad,
        description: sanitizeText(error?.message || text.demoFallback, 220),
        placement: "topRight",
        style: { borderRadius: 14 },
      });
    } finally {
      setLoading(false);
    }
  }, [api, text.couldNotLoad, text.demoFallback]);

  useEffect(() => {
    Promise.resolve().then(fetchData);
  }, [fetchData]);

  const filtered = useMemo(
    () =>
      data.filter((record) => {
        if (filterCondition && record.condition_key !== filterCondition) return false;
        if (filterStatus && record.result_data?.color !== filterStatus) return false;
        if (filterLanguage && record.language !== filterLanguage) return false;
        if (!matchesSearch(record, query)) return false;
        return true;
      }),
    [data, filterCondition, filterLanguage, filterStatus, query],
  );

  const stats = useMemo(
    () => ({
      total: data.length,
      red: data.filter((item) => item.result_data?.color === "RED").length,
      yellow: data.filter((item) => item.result_data?.color === "YELLOW").length,
      green: data.filter((item) => item.result_data?.color === "GREEN").length,
    }),
    [data],
  );

  const languagesCount = useMemo(
    () => [...new Set(data.map((item) => item.language).filter(Boolean))].length,
    [data],
  );

  const nurseProfiles = useMemo(
    () => buildNurseProfiles(adminEmails, user?.email, text.unknownPerson, text),
    [text, user?.email],
  );

  useEffect(() => {
    if (stats.red === 0) {
      lastCriticalAlertCount.current = 0;
      return;
    }

    if (stats.red === lastCriticalAlertCount.current) {
      return;
    }

    lastCriticalAlertCount.current = stats.red;
    api.warning({
      message: text.criticalNotificationTitle,
      description: replaceTokens(text.criticalNotificationBody, { count: stats.red }),
      placement: "topRight",
      duration: 6,
      style: { borderRadius: 14, cursor: "pointer" },
      onClick: () => applyStatusFilter("RED"),
    });
  }, [
    api,
    applyStatusFilter,
    stats.red,
    text.criticalNotificationBody,
    text.criticalNotificationTitle,
  ]);

  const columns = [
    {
      title: text.submitted,
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
      responsive: ["xs"],
      render: (value) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontWeight: 700, color: "#0f172a", fontSize: 13 }}>
            {formatDate(value, uiLanguage)}
          </Text>
        </Space>
      ),
    },
    {
      // Surface patient name in the primary grid so clinicians do not need to
      // open each row just to identify who the submission belongs to.
      title: text.fieldFullName,
      key: "patient_name",
      width: 180,
      responsive: ["xs"],
      render: (_, record) => (
        <Text strong style={{ color: "#0f172a" }}>
          {derivePersonName(record, text.unknownPerson)}
        </Text>
      ),
    },
    {
      title: text.condition,
      dataIndex: "condition_key",
      key: "condition_key",
      width: 160,
      responsive: ["md"],
      render: (value) => <ConditionTag condition={value} />,
    },
    {
      title: text.language,
      dataIndex: "language",
      key: "language",
      width: 110,
      responsive: ["lg"],
      render: (value) => (
        <Tag style={metaTagStyle}>
          <Languages size={12} />
          {RECORD_LANGUAGE_LABELS[value] || value || text.unknown}
        </Tag>
      ),
    },
    {
      title: text.status,
      key: "status",
      width: 150,
      responsive: ["xs"],
      render: (_, record) => (
        <StatusBadge
          status={record.result_data?.color}
          label={statusLabels[record.result_data?.color] || text.unknown}
        />
      ),
    },
    {
      title: text.advice,
      key: "advice",
      responsive: ["xl"],
      render: (_, record) => (
        <Tooltip title={record.result_data?.advice || text.noAdvice}>
          <Text
            ellipsis
            style={{
              maxWidth: isMobile ? 220 : 360,
              display: "block",
              color: "#475569",
              fontSize: 13,
            }}
          >
            {record.result_data?.advice || "-"}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 92,
      align: "right",
      responsive: ["xs"],
      render: (_, record) => (
        <Button
          type="text"
          icon={<Eye size={15} />}
          style={{ color: "#0f766e", fontWeight: 700 }}
          onClick={(event) => {
            event.stopPropagation();
            setSelectedRecord(record);
            setDrawerOpen(true);
          }}
        >
          {text.view}
        </Button>
      ),
    },
  ];

  const activeFilterLabel = filterStatus
    ? statusLabels[filterStatus]
    : text.allSubmissions;

  // Keep mobile usable by showing only the highest-value columns first.
  const tableScrollX = isMobile ? 560 : 980;

  return (
    <>
      {contextHolder}

      <div style={pageStyles.page}>
        <div style={pageStyles.gradient} />
        <div style={pageStyles.grid} />

        <div
          style={{
            ...pageStyles.container,
            width: isMobile ? "calc(100% - 16px)" : pageStyles.container.width,
            padding: isMobile ? "12px 0 20px" : "22px 0 28px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "320px minmax(0, 1fr)",
              gap: 18,
              alignItems: "start",
            }}
          >
            <Card
              bordered={false}
              style={{
                ...pageStyles.sidebarCard,
                position: isMobile ? "relative" : "sticky",
                top: isMobile ? "auto" : 18,
              }}
              styles={{ body: { padding: 18 } }}
            >
              <Space direction="vertical" size={18} style={{ width: "100%" }}>
                <div>
                  <Space size={12} align="start">
                    <div style={pageStyles.sidebarIcon}>
                      <Stethoscope size={18} color="#fff" />
                    </div>
                    <div>
                      <Text style={sidebarEyebrowStyle}>{text.dashboardName}</Text>
                      <Title level={4} style={{ margin: "6px 0 6px", color: "#0f172a" }}>
                        {text.sidebarTitle}
                      </Title>
                    </div>
                  </Space>
                  <Text style={{ color: "#475569", lineHeight: 1.7 }}>
                    {text.sidebarText}
                  </Text>
                </div>

                <div style={sidebarSectionStyle}>
                  {/* The sidebar account card doubles as a directory launcher so
                      clinicians can move from "who is signed in" to "who needs review". */}
                  <button
                    type="button"
                    onClick={() => setDirectoryOpen(true)}
                    style={sidebarUserButtonStyle}
                  >
                    <Space
                      style={{ justifyContent: "space-between", width: "100%" }}
                      align="start"
                      wrap
                    >
                      <Space size={12} align="start">
                        <Avatar
                          size={46}
                          style={{
                            background: "linear-gradient(135deg, #0f766e, #38bdf8)",
                          }}
                          icon={<UserRound size={21} />}
                        />
                        <div style={{ minWidth: 0, textAlign: "left" }}>
                          <Text style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700 }}>
                            {text.signedIn}
                          </Text>
                          <div
                            style={{
                              color: "#0f172a",
                              fontWeight: 700,
                              wordBreak: "break-word",
                            }}
                          >
                            {sanitizeText(user?.email || "Admin", 120)}
                          </div>
                          <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                            {text.nurseDirectory}
                          </div>
                        </div>
                      </Space>

                      <Space size={10} align="center">
                        <Badge
                          status={usingMockData ? "warning" : "success"}
                          text={
                            <span style={{ color: "#475569", fontWeight: 600 }}>
                              {usingMockData ? text.demoData : text.liveData}
                            </span>
                          }
                        />
                        <ChevronRight size={18} color="#94a3b8" />
                      </Space>
                    </Space>
                  </button>
                </div>

                <div style={sidebarSectionStyle}>
                  <Card
                    bordered={false}
                    style={sidebarSecondaryCardStyle}
                    styles={{ body: { padding: 14 } }}
                  >
                    <Space direction="vertical" size={10} style={{ width: "100%" }}>
                      <Space style={{ justifyContent: "space-between", width: "100%" }}>
                        <Text strong style={{ color: "#0f172a" }}>
                          {text.nurseDirectory}
                        </Text>
                        <Users size={16} color="#0f766e" />
                      </Space>
                      <Text style={{ color: "#64748b" }}>{text.nurseDirectoryText}</Text>
                      <Button
                        onClick={() => setDirectoryOpen(true)}
                        style={{ borderRadius: 12, width: "100%", fontWeight: 700 }}
                      >
                        {text.openDirectory}
                      </Button>
                    </Space>
                  </Card>
                </div>

                <div style={sidebarSectionStyle}>
                  <Text style={sidebarLabelStyle}>
                    {text.tableLabel}: <Text strong>{supabaseTable}</Text>
                  </Text>
                  <Text style={sidebarLabelStyle}>
                    {text.lastSync}: {lastUpdated ? formatDate(lastUpdated, uiLanguage) : text.waitingSync}
                  </Text>
                </div>

                <div style={sidebarSectionStyle}>
                  <Text style={{ ...sidebarLabelStyle, display: "block", marginBottom: 8 }}>
                    {text.languageSwitcher}
                  </Text>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile
                        ? "repeat(2, minmax(0, 1fr))"
                        : "repeat(3, minmax(0, 1fr))",
                      gap: 8,
                    }}
                  >
                    {UI_LANGUAGE_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        type={uiLanguage === option.value ? "primary" : "default"}
                        onClick={() => setUiLanguage(option.value)}
                        style={{
                          borderRadius: 12,
                          fontWeight: 700,
                          minHeight: 40,
                          paddingInline: isMobile ? 8 : 12,
                          whiteSpace: "normal",
                        }}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div style={sidebarSectionStyle}>
                  <Space size={10} direction="vertical" style={{ width: "100%" }}>
                    <Button
                      type="primary"
                      icon={<RefreshCw size={14} />}
                      onClick={fetchData}
                      loading={loading}
                      style={{ ...pageStyles.refreshButton, width: "100%" }}
                    >
                      {text.refresh}
                    </Button>
                    <Button
                      icon={<LogOut size={14} />}
                      onClick={onSignOut}
                      style={{ ...pageStyles.logoutButton, width: "100%" }}
                    >
                      {text.signOut}
                    </Button>
                  </Space>
                </div>
              </Space>
            </Card>

            <div>
              <Card
                bordered={false}
                style={pageStyles.heroCard}
                styles={{ body: { padding: isMobile ? 18 : 22 } }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    justifyContent: "space-between",
                    gap: 14,
                    alignItems: isMobile ? "flex-start" : "center",
                  }}
                >
                  <div style={{ maxWidth: 860 }}>
                    <Text style={pageStyles.eyebrow}>{text.compactTitle}</Text>
                    <Title
                      level={3}
                      style={{
                        margin: "6px 0 8px",
                        color: "#fff",
                        fontSize: isMobile ? 26 : 34,
                        lineHeight: 1.08,
                      }}
                    >
                      {text.dashboardName}
                    </Title>
                    <Text
                      style={{
                        ...pageStyles.heroText,
                        fontSize: isMobile ? 14 : 15,
                      }}
                    >
                      {text.compactText}
                    </Text>
                  </div>

                  <Space wrap size={[8, 8]}>
                    <Tag style={pageStyles.heroPill}>
                      <ShieldCheck size={14} />
                      {text.secureLogin}
                    </Tag>
                    <Tag style={pageStyles.heroPill}>
                      <RefreshCw size={14} />
                      {text.liveRefresh}
                    </Tag>
                    <Tag style={pageStyles.heroPill}>
                      <Filter size={14} />
                      {text.fastTriage}
                    </Tag>
                  </Space>
                </div>
              </Card>

              {usingMockData && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginTop: 14, marginBottom: 14, borderRadius: 18 }}
                  message={text.mockTitle}
                  description={text.mockDescription}
                />
              )}

              {stats.red > 0 && (
                <Card
                  bordered={false}
                  style={pageStyles.alertCard}
                  styles={{ body: { padding: isMobile ? 14 : 16 } }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "1fr auto",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <Space align="start" size={12}>
                      <div style={pageStyles.alertIcon}>
                        <AlertTriangle size={18} />
                      </div>
                      <div>
                        <Text style={{ color: "#991b1b", fontWeight: 800, fontSize: 12 }}>
                          {text.urgentQueue}
                        </Text>
                        <div
                          style={{
                            fontSize: isMobile ? 22 : 26,
                            lineHeight: 1.1,
                            color: "#7f1d1d",
                            fontWeight: 800,
                            margin: "4px 0 4px",
                          }}
                        >
                          {stats.red} {text.criticalCases.toLowerCase()}
                        </div>
                        <Text style={{ color: "#7f1d1d" }}>{text.urgentText}</Text>
                      </div>
                    </Space>

                    <Button
                      type="primary"
                      danger
                      size={isMobile ? "middle" : "large"}
                      onClick={() => applyStatusFilter("RED")}
                      style={{ borderRadius: 14, minWidth: isMobile ? "100%" : 230 }}
                    >
                      {text.reviewCritical}
                    </Button>
                  </div>
                </Card>
              )}

              <Row gutter={[16, 16]} style={{ marginTop: 16, marginBottom: 16 }}>
                <Col xs={24} sm={12} xl={6}>
                  <StatCard
                    title={text.totalSubmissions}
                    value={stats.total}
                    icon={<Activity size={20} />}
                    accent="linear-gradient(135deg, #0f766e, #14b8a6)"
                    helper={text.allRecords}
                    active={filterStatus === null}
                    onClick={clearFilters}
                  />
                </Col>
                <Col xs={24} sm={12} xl={6}>
                  <StatCard
                    title={text.criticalCases}
                    value={stats.red}
                    icon={<AlertTriangle size={20} />}
                    accent="linear-gradient(135deg, #dc2626, #fb7185)"
                    helper={text.needAttention}
                    active={filterStatus === "RED"}
                    onClick={() => applyStatusFilter("RED")}
                  />
                </Col>
                <Col xs={24} sm={12} xl={6}>
                  <StatCard
                    title={text.attentionCases}
                    value={stats.yellow}
                    icon={<Activity size={20} />}
                    accent="linear-gradient(135deg, #d97706, #f59e0b)"
                    helper={text.watchClosely}
                    active={filterStatus === "YELLOW"}
                    onClick={() => applyStatusFilter("YELLOW")}
                  />
                </Col>
                <Col xs={24} sm={12} xl={6}>
                  <StatCard
                    title={text.stableCases}
                    value={stats.green}
                    icon={<CheckCircle size={20} />}
                    accent="linear-gradient(135deg, #15803d, #4ade80)"
                    helper={`${text.greenStatus} • ${languagesCount} ${text.languages.toLowerCase()}`}
                    active={filterStatus === "GREEN"}
                    onClick={() => applyStatusFilter("GREEN")}
                  />
                </Col>
              </Row>

              <Card bordered={false} style={pageStyles.tableCard} styles={{ body: { padding: 0 } }}>
                <div
                  style={{
                    ...pageStyles.tableHeader,
                    padding: isMobile ? 16 : 22,
                    alignItems: isMobile ? "stretch" : "center",
                  }}
                >
                  <div>
                    <Text style={tableEyebrowStyle}>{text.queueEyebrow}</Text>
                    <Title
                      level={4}
                      style={{
                        margin: "6px 0 2px",
                        color: "#0f172a",
                        fontSize: isMobile ? 22 : 28,
                      }}
                    >
                      {text.queueTitle}
                    </Title>
                    <Text style={{ color: "#64748b" }}>
                      {replaceTokens(text.visibleSummary, {
                        visible: filtered.length,
                        total: data.length,
                      })}
                    </Text>
                    <div style={{ marginTop: 10 }}>
                      <Tag style={activeFilterTagStyle}>
                        {text.quickFilters}: {activeFilterLabel}
                      </Tag>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile
                        ? "1fr"
                        : isTablet
                          ? "repeat(2, minmax(160px, 1fr))"
                          : "minmax(240px, 280px) repeat(4, minmax(120px, 150px))",
                      gap: 10,
                      width: isMobile ? "100%" : "auto",
                    }}
                  >
                    <Input
                      allowClear
                      value={query}
                      onChange={(event) => setQuery(sanitizeText(event.target.value, 80))}
                      placeholder={text.searchPlaceholder}
                      prefix={<Search size={14} />}
                      style={{ width: "100%", borderRadius: 12 }}
                    />
                    <Select
                      allowClear
                      placeholder={text.condition}
                      value={filterCondition}
                      onChange={setFilterCondition}
                      style={{ width: "100%" }}
                    >
                      {Object.entries(CONDITION_CONFIG).map(([key, config]) => (
                        <Select.Option key={key} value={key}>
                          <Space size={6}>
                            {config.icon}
                            {config.label}
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>
                    <Select
                      allowClear
                      placeholder={text.status}
                      value={filterStatus}
                      onChange={setFilterStatus}
                      style={{ width: "100%" }}
                    >
                      {Object.keys(STATUS_CONFIG).map((key) => (
                        <Select.Option key={key} value={key}>
                          {statusLabels[key]}
                        </Select.Option>
                      ))}
                    </Select>
                    <Select
                      allowClear
                      placeholder={text.language}
                      value={filterLanguage}
                      onChange={setFilterLanguage}
                      style={{ width: "100%" }}
                    >
                      {Object.entries(RECORD_LANGUAGE_LABELS).map(([key, label]) => (
                        <Select.Option key={key} value={key}>
                          {label}
                        </Select.Option>
                      ))}
                    </Select>
                    <Button onClick={clearFilters} style={{ borderRadius: 12, width: "100%" }}>
                      {text.clear}
                    </Button>
                  </div>
                </div>

                <div style={{ padding: isMobile ? "0 8px 8px" : 0 }}>
                  <Spin spinning={loading} tip={text.loading}>
                    <Table
                      dataSource={filtered}
                      columns={columns}
                      rowKey="id"
                      scroll={{ x: tableScrollX }}
                      size={isMobile ? "small" : "middle"}
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: false,
                        showTotal: (total) =>
                          `${total} ${total === 1 ? text.record : text.records}`,
                        style: { padding: isMobile ? "12px 10px 16px" : "14px 20px 18px" },
                      }}
                      locale={{
                        emptyText: (
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                              query || filterCondition || filterStatus || filterLanguage
                                ? text.noMatches
                                : text.noSubmissions
                            }
                          />
                        ),
                      }}
                      onRow={(record) => ({
                        onClick: () => {
                          setSelectedRecord(record);
                          setDrawerOpen(true);
                        },
                        style: { cursor: "pointer" },
                      })}
                      rowClassName={() => "admin-table-row"}
                    />
                  </Spin>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <DetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        record={selectedRecord}
        text={text}
        statusLabels={statusLabels}
        locale={uiLanguage}
        isMobile={isMobile}
      />

      <NurseDirectoryDrawer
        open={directoryOpen}
        onClose={() => setDirectoryOpen(false)}
        nurses={nurseProfiles}
        onSelectNurse={(nurse) => {
          setDirectoryOpen(false);
          setSelectedNurse(nurse);
          setNurseProfileOpen(true);
        }}
        text={text}
        isMobile={isMobile}
      />

      <NurseProfileDrawer
        open={nurseProfileOpen}
        onClose={() => setNurseProfileOpen(false)}
        nurse={selectedNurse}
        text={text}
        isMobile={isMobile}
      />

      <style>{`
        .admin-table-row:hover > td {
          background: #f0fdfa !important;
        }
        .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-size: 11px !important;
          font-weight: 800 !important;
          letter-spacing: .1em;
          text-transform: uppercase;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 16px !important;
        }
        .ant-input,
        .ant-input-affix-wrapper,
        .ant-select-selector,
        .ant-btn {
          border-radius: 12px !important;
        }
        @media (max-width: 980px) {
          .ant-drawer-content-wrapper {
            width: 100% !important;
          }
        }
        @media (max-width: 768px) {
          .ant-table-tbody > tr > td {
            padding: 12px !important;
          }
        }
      `}</style>
    </>
  );
}

const metaTagStyle = {
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  paddingInline: 10,
  height: 30,
  color: "#334155",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  fontWeight: 600,
};

const sidebarEyebrowStyle = {
  color: "#0f766e",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: ".16em",
};

const sidebarLabelStyle = {
  color: "#64748b",
  fontSize: 12,
  lineHeight: 1.8,
};

const sidebarSectionStyle = {
  paddingTop: 14,
  borderTop: "1px solid #e2e8f0",
};

const sidebarUserButtonStyle = {
  width: "100%",
  padding: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  textAlign: "left",
};

const sidebarSecondaryCardStyle = {
  borderRadius: 16,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};

const activeFilterTagStyle = {
  borderRadius: 999,
  padding: "6px 12px",
  background: "#ecfeff",
  border: "1px solid #a5f3fc",
  color: "#0f766e",
  fontWeight: 700,
};

const tableEyebrowStyle = {
  color: "#0f766e",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: ".16em",
};

const sectionTitleStyle = {
  fontSize: 13,
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: ".12em",
};

const fieldTitleStyle = {
  display: "block",
  marginBottom: 6,
  color: "#64748b",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: ".1em",
};

const fieldBodyStyle = {
  color: "#0f172a",
  fontSize: 14,
  lineHeight: 1.7,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const pageStyles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    position: "relative",
    overflow: "hidden",
  },
  gradient: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at top left, rgba(20,184,166,.12), transparent 28%), radial-gradient(circle at top right, rgba(56,189,248,.12), transparent 24%), linear-gradient(180deg, #f0fdfa, #f8fafc 18%, #f8fafc)",
    pointerEvents: "none",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(148,163,184,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.08) 1px, transparent 1px)",
    backgroundSize: "32px 32px",
    maskImage: "linear-gradient(180deg, rgba(0,0,0,.7), transparent 85%)",
    pointerEvents: "none",
  },
  container: {
    position: "relative",
    zIndex: 1,
    width: "min(1440px, calc(100% - 28px))",
    margin: "0 auto",
    padding: "22px 0 28px",
  },
  sidebarCard: {
    borderRadius: 24,
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
    background: "rgba(255,255,255,.96)",
    backdropFilter: "blur(10px)",
  },
  sidebarIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "linear-gradient(135deg, #0f766e, #0ea5e9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    borderRadius: 24,
    background: "linear-gradient(135deg, #0f172a, #0f766e 62%, #0ea5e9)",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.16)",
  },
  eyebrow: {
    color: "rgba(255,255,255,.72)",
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: ".16em",
  },
  heroText: {
    color: "rgba(255,255,255,.9)",
    lineHeight: 1.7,
    maxWidth: 840,
  },
  heroPill: {
    background: "rgba(255,255,255,.1)",
    border: "1px solid rgba(255,255,255,.16)",
    color: "#fff",
    borderRadius: 999,
    padding: "8px 12px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  refreshButton: {
    borderRadius: 12,
    height: 42,
    fontWeight: 700,
    background: "linear-gradient(135deg, #0f766e, #0ea5e9)",
    border: "none",
    boxShadow: "0 12px 28px rgba(14,165,233,.22)",
  },
  logoutButton: {
    borderRadius: 12,
    height: 42,
    fontWeight: 700,
  },
  alertCard: {
    marginTop: 14,
    borderRadius: 20,
    background: "linear-gradient(135deg, #fff1f2, #fff7ed)",
    border: "1px solid #fecdd3",
    boxShadow: "0 12px 28px rgba(220, 38, 38, 0.08)",
  },
  alertIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    background: "#dc2626",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
  tableCard: {
    borderRadius: 24,
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.06)",
    overflow: "hidden",
  },
  tableHeader: {
    padding: 22,
    borderBottom: "1px solid #eef2f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
};
