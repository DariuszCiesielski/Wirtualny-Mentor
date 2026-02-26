/**
 * Achievement Definitions
 *
 * Client-side mirror of the achievements table for UI rendering.
 * Icons correspond to Lucide icon names.
 */

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "learning" | "focus" | "quiz" | "streak";
  points: number;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
  { id: "first_chapter", name: "Pierwszy krok", description: "Ukończ swój pierwszy rozdział", icon: "Star", category: "learning", points: 10 },
  { id: "ten_chapters", name: "Pilny uczeń", description: "Ukończ 10 rozdziałów", icon: "BookOpen", category: "learning", points: 50 },
  { id: "level_beginner", name: "Początkujący opanowany", description: "Ukończ poziom Początkujący", icon: "Medal", category: "learning", points: 25 },
  { id: "level_intermediate", name: "Średnio zaawansowany", description: "Ukończ poziom Średnio zaawansowany", icon: "Medal", category: "learning", points: 50 },
  { id: "level_advanced", name: "Zaawansowany", description: "Ukończ poziom Zaawansowany", icon: "Medal", category: "learning", points: 75 },
  { id: "level_master", name: "Master", description: "Ukończ poziom Master", icon: "Medal", category: "learning", points: 100 },
  { id: "level_guru", name: "Guru", description: "Ukończ poziom Guru", icon: "Crown", category: "learning", points: 150 },
  { id: "course_complete", name: "Absolwent", description: "Ukończ cały kurs", icon: "GraduationCap", category: "learning", points: 200 },
  { id: "quiz_master", name: "Quiz Master", description: "Zdaj 10 quizów na 100%", icon: "Trophy", category: "quiz", points: 100 },
  { id: "first_quiz", name: "Pierwszy quiz", description: "Zdaj swój pierwszy quiz", icon: "CheckCircle", category: "quiz", points: 10 },
  { id: "pomodoro_marathon", name: "Maratończyk", description: "5 sesji Pomodoro w jednym dniu", icon: "Flame", category: "focus", points: 30 },
  { id: "streak_7", name: "Konsekwentny", description: "7 dni nauki z rzędu", icon: "Calendar", category: "streak", points: 50 },
  { id: "streak_30", name: "Wytrwały", description: "30 dni nauki z rzędu", icon: "Shield", category: "streak", points: 200 },
];
