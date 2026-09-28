/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Sparkles, 
  Flame, 
  HeartPulse, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  RefreshCw, 
  Calendar, 
  MessageSquare, 
  ShieldAlert, 
  Clock, 
  RotateCcw,
  ChevronRight,
  Target,
  Zap,
  Activity,
  Layers,
  Award,
  ChevronDown,
  Printer,
  Check,
  User,
  Sliders,
  TrendingUp,
  ShieldCheck,
  Info
} from 'lucide-react';
import heroDumbbellBg from './assets/images/hero_dumbbell_bg_1790565673500.jpg';

interface Exercise {
  exercise: string;
  sets: string;
  reps: string;
  rest: string;
}

interface DayPlan {
  day: string;
  focus: string;
  exercises: Exercise[];
  rest_recovery: string;
}

interface WorkoutPlanData {
  plan_title?: string;
  overview: string;
  safety_guidelines?: string;
  days: DayPlan[];
}

interface WorkoutPlanResponse {
  id: number;
  user_id: number;
  plan_data: WorkoutPlanData;
  created_at: string;
}

interface UserProfile {
  id?: number;
  name: string;
  age: number;
  weight: number;
  height?: number;
  gender?: string;
  goal: string;
  intensity: string;
  experience: string;
  equipment?: string;
}

interface NutritionTip {
  goal: string;
  tip: string;
  disclaimer: string;
}

export default function App() {
  // Navigation & Step State
  const [currentStep, setCurrentStep] = useState<number>(1); // 1: Profile, 2: Goal, 3: Preferences, 4: Plan
  const [activeDayTab, setActiveDayTab] = useState<number>(0); // 0-6 for Day 1-7
  const [viewMode, setViewMode] = useState<'tabs' | 'grid'>('grid');
  
  // Form State
  const [formData, setFormData] = useState<UserProfile>({
    name: 'Arun Kumar',
    age: 23,
    weight: 68,
    height: 175,
    gender: 'Male',
    goal: 'Muscle Gain',
    intensity: 'Medium',
    experience: 'Beginner',
    equipment: 'Gym (Full Access)'
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // App State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlanResponse | null>(null);
  const [nutritionTip, setNutritionTip] = useState<NutritionTip | null>(null);
  const [historyPlans, setHistoryPlans] = useState<WorkoutPlanResponse[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Loading & Feedback
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>('Analyzing your biomechanics & metrics...');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isUpdatingFeedback, setIsUpdatingFeedback] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Cycling generation stages
  useEffect(() => {
    if (!isGenerating) return;
    const stages = [
      'Analyzing physical biometrics and target metabolic rate...',
      'Consulting Gemini AI exercise physiology model...',
      'Balancing weekly progressive overload and compound lifts...',
      'Formulating tailored recovery intervals and rest days...',
      'Synthesizing sport-specific nutrition & fuel recommendations...'
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % stages.length;
      setLoadingStage(stages[idx]);
    }, 2200);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
  };

  // Validation per step
  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!formData.name.trim()) errs.name = 'Please provide your full name.';
      if (!formData.age || formData.age < 12 || formData.age > 120) {
        errs.age = 'Age must be between 12 and 120 years.';
      }
      if (!formData.weight || formData.weight < 20 || formData.weight > 400) {
        errs.weight = 'Weight must be between 20 kg and 400 kg.';
      }
    } else if (step === 2) {
      if (!formData.goal) errs.goal = 'Please choose a primary fitness goal.';
    } else if (step === 3) {
      if (!formData.intensity) errs.intensity = 'Please choose your preferred workout intensity.';
      if (!formData.experience) errs.experience = 'Please select your current fitness experience.';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Generate Plan Handler
  const handleGeneratePlan = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

    setIsGenerating(true);
    try {
      // 1. Create or register user profile
      const userRes = await fetch('/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          age: formData.age,
          weight: formData.weight,
          goal: formData.goal,
          intensity: formData.intensity,
          experience: formData.experience
        })
      });

      if (!userRes.ok) {
        const err = await userRes.json().catch(() => ({}));
        throw new Error(err.detail || 'Could not save user profile');
      }
      const user: UserProfile = await userRes.json();
      setCurrentUser(user);

      // 2. Generate Plan with Gemini AI
      const planRes = await fetch('/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });

      if (!planRes.ok) {
        const err = await planRes.json().catch(() => ({}));
        throw new Error(err.detail || 'AI could not generate plan. Please try again.');
      }
      const plan: WorkoutPlanResponse = await planRes.json();
      setCurrentPlan(plan);

      // 3. Nutrition tip
      try {
        const nutRes = await fetch('/nutrition-tip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal: user.goal, name: user.name })
        });
        if (nutRes.ok) {
          const nutData = await nutRes.json();
          setNutritionTip(nutData);
        }
      } catch (e) {
        console.warn('Nutrition tip fetch issue:', e);
      }

      showToast('Personalized 7-day routine created!', 'success');
      setCurrentStep(4);
      loadHistory(user.id!);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      showToast(err.message || 'Error communicating with FitBuddy service', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Feedback Submission
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() || feedbackText.length < 3) {
      showToast('Please enter at least 3 characters of feedback', 'error');
      return;
    }
    if (!currentUser?.id || !currentPlan?.id) {
      showToast('No active workout plan loaded to update', 'error');
      return;
    }

    setIsUpdatingFeedback(true);
    try {
      const res = await fetch('/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          plan_id: currentPlan.id,
          feedback_text: feedbackText.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Could not update plan with feedback');
      }

      const fbData = await res.json();
      setCurrentPlan({
        id: currentPlan.id,
        user_id: currentUser.id,
        plan_data: fbData.updated_plan,
        created_at: fbData.created_at
      });

      setFeedbackText('');
      showToast('7-Day workout plan updated with your feedback!', 'success');
      loadHistory(currentUser.id);
    } catch (err: any) {
      showToast(err.message || 'Error updating workout plan', 'error');
    } finally {
      setIsUpdatingFeedback(false);
    }
  };

  const loadHistory = async (userId: number) => {
    try {
      const res = await fetch(`/plans/${userId}`);
      if (res.ok) {
        const list = await res.json();
        setHistoryPlans(list);
      }
    } catch (e) {
      console.warn('Could not load plan history:', e);
    }
  };

  // Goal options data for card selection
  const goalCards = [
    {
      id: 'Muscle Gain',
      title: 'Muscle Gain',
      tagline: 'Hypertrophy & progressive overload',
      desc: 'Focus on compound resistance, time under tension, and targeted muscle split to build lean mass.',
      icon: <Dumbbell className="w-6 h-6 text-orange-500" />,
      badge: 'High Protein / Surplus'
    },
    {
      id: 'Weight Loss',
      title: 'Weight Loss',
      tagline: 'Fat oxidation & caloric deficit',
      desc: 'High-density circuits, metabolic conditioning, and structured cardio intervals to preserve lean tissue.',
      icon: <Flame className="w-6 h-6 text-orange-500" />,
      badge: 'Metabolic Conditioning'
    },
    {
      id: 'General Fitness',
      title: 'General Fitness',
      tagline: 'Daily vitality & functional mobility',
      desc: 'Balanced combination of strength, core stability, joint health, and cardio-respiratory endurance.',
      icon: <Activity className="w-6 h-6 text-orange-500" />,
      badge: 'Balanced Wellness'
    },
    {
      id: 'Strength',
      title: 'Maximal Strength',
      tagline: 'Neuromuscular power & force',
      desc: 'Heavy foundational compound barbell and dumbbell lifts with longer rest intervals for peak power.',
      icon: <Award className="w-6 h-6 text-orange-500" />,
      badge: 'Low Reps / High Load'
    },
    {
      id: 'Endurance',
      title: 'Endurance',
      tagline: 'Aerobic capacity & stamina',
      desc: 'Sustained cardiovascular conditioning, high-rep sets, and active recovery for peak stamina.',
      icon: <TrendingUp className="w-6 h-6 text-orange-500" />,
      badge: 'Aerobic Stamina'
    }
  ];

  const intensityOptions = [
    {
      id: 'Low',
      name: 'Low Intensity',
      label: 'Gentle & Restorative',
      desc: 'Focus on form mastery, low impact, active joint mobility, and minimal CNS fatigue.'
    },
    {
      id: 'Medium',
      name: 'Medium Intensity',
      label: 'Balanced Progression',
      desc: 'Moderate RPE, sustainable volume, progressive challenge, and steady athletic growth.'
    },
    {
      id: 'High',
      name: 'High Intensity',
      label: 'Demanding & Peak Effort',
      desc: 'Push limits with higher training volume, challenging pacing, and heavy compound lifting.'
    }
  ];

  const experienceOptions = [
    {
      id: 'Beginner',
      name: 'Beginner',
      timeframe: '0 - 1 Years Training',
      desc: 'Mastering exercise fundamentals, form, and establishing neurological adaptations.'
    },
    {
      id: 'Intermediate',
      name: 'Intermediate',
      timeframe: '1 - 3 Years Training',
      desc: 'Experienced with major compound movements, ready for periodized loading and volume.'
    },
    {
      id: 'Advanced',
      name: 'Advanced',
      timeframe: '3+ Years Dedicated Training',
      desc: 'High training fluency, capable of managing heavy volume, specialization, and intensity.'
    }
  ];

  const quickFeedbackChips = [
    '🏃‍♂️ Add more cardio & HIIT finishers',
    '🧘 I need more rest days to recover properly',
    '⚡ Reduce the overall workout intensity & weight loads',
    '🦵 Focus more on legs, glutes & core stability',
    '💪 Focus more on chest, back & upper body hypertrophy',
    '⏱️ Shorten workouts to fit under 40 minutes'
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-4 py-3 rounded-xl shadow-2xl text-sm font-bold flex items-center gap-3 border backdrop-blur-md ${
            toastMessage.type === 'success' 
              ? 'bg-white border-orange-500 text-slate-900 shadow-orange-500/10' 
              : 'bg-white border-rose-500 text-rose-600'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75 text-base cursor-pointer">×</button>
          </div>
        </div>
      )}

      {/* Header & Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div 
            onClick={() => {
              if (currentPlan) setCurrentStep(4);
              else setCurrentStep(1);
            }}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 flex items-center justify-center text-white font-black shadow-md shadow-orange-500/25 group-hover:scale-105 transition-all">
              <Dumbbell className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-xl text-slate-900">FitBuddy</span>
                <span className="text-[10px] font-extrabold tracking-widest px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 uppercase">
                  AI COACH
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Smart 7-Day Fitness Planning</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-600">
            <button 
              onClick={() => setCurrentStep(1)}
              className={`hover:text-orange-600 transition-colors ${currentStep < 4 ? 'text-orange-600' : ''}`}
            >
              Plan Builder
            </button>
            {currentPlan && (
              <button 
                onClick={() => setCurrentStep(4)}
                className={`hover:text-orange-600 transition-colors ${currentStep === 4 ? 'text-orange-600' : ''}`}
              >
                Active Schedule
              </button>
            )}
            <a href="#how-it-works" className="hover:text-orange-600 transition-colors">
              How It Works
            </a>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            {currentUser && historyPlans.length > 0 && (
              <button 
                onClick={() => setShowHistoryModal(true)}
                className="text-xs font-bold px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-orange-500 text-slate-700 hover:text-orange-600 flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Layers className="w-4 h-4 text-orange-500" />
                <span className="hidden sm:inline">History</span>
                <span className="px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-700 text-[10px] font-extrabold border border-orange-200">
                  {historyPlans.length}
                </span>
              </button>
            )}

            {currentStep === 4 ? (
              <button 
                onClick={() => {
                  setCurrentStep(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-xs font-bold px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
                <span>New Routine</span>
              </button>
            ) : (
              <button 
                onClick={() => {
                  if (currentStep === 3) handleGeneratePlan();
                  else setCurrentStep(s => Math.min(3, s + 1));
                }}
                className="text-xs font-extrabold px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <span>{currentStep === 3 ? 'Generate Plan' : 'Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 bg-white">
        {/* Onboarding Wizard (Steps 1, 2, 3) */}
        {currentStep < 4 && (
          <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14 space-y-10">
            {/* Hero Header on Step 1 with Dumbbell Background */}
            {currentStep === 1 && (
              <div className="relative rounded-3xl overflow-hidden border border-orange-200 shadow-md mb-8 max-w-4xl mx-auto">
                {/* Background Dumbbell Image */}
                <img 
                  src={heroDumbbellBg} 
                  alt="Fitness Dumbbell Hero Background" 
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover object-center opacity-30 filter contrast-125 saturate-125"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/85 to-white/95" />

                <div className="relative z-10 text-center py-12 px-6 sm:px-10 space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-orange-200 text-orange-700 text-xs font-bold tracking-wide shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    PRECISION FITNESS ENGINE POWERED BY GOOGLE GEMINI AI
                  </div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                    Personalized 7-Day <br />
                    <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                      Fitness &amp; Fuel Blueprint
                    </span>
                  </h1>
                  <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
                    Enter your physical markers and goals. FitBuddy uses advanced exercise physiology models to build a periodized, 7-day schedule with sets, reps, and sports nutrition tailored to you.
                  </p>
                </div>
              </div>
            )}

            {/* Stepper Progress Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm max-w-3xl mx-auto">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-3 px-1">
                <span className={currentStep === 1 ? 'text-orange-600' : 'text-slate-400'}>
                  1. Biometrics
                </span>
                <span className={currentStep === 2 ? 'text-orange-600' : 'text-slate-400'}>
                  2. Fitness Goal
                </span>
                <span className={currentStep === 3 ? 'text-orange-600' : 'text-slate-400'}>
                  3. Training Preferences
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                />
              </div>
            </div>

            {/* STEP 1: Biometrics & Profile */}
            {currentStep === 1 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
                <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Step 1: Physical Assessment</h2>
                    <p className="text-sm text-slate-500 mt-0.5">We calculate metabolic rate, intensity thresholds, and safe load volume from your biometrics.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Your Name <span className="text-orange-600">*</span>
                    </label>
                    <input 
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Arun Kumar"
                      className="w-full bg-white border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all shadow-xs"
                    />
                    {formErrors.name && <p className="text-rose-600 text-xs font-medium">{formErrors.name}</p>}
                  </div>

                  {/* Age */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Age (Years) <span className="text-orange-600">*</span>
                    </label>
                    <input 
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value, 10) || 0 })}
                      min="12"
                      max="120"
                      placeholder="23"
                      className="w-full bg-white border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all shadow-xs"
                    />
                    {formErrors.age && <p className="text-rose-600 text-xs font-medium">{formErrors.age}</p>}
                  </div>

                  {/* Weight */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Current Weight (kg) <span className="text-orange-600">*</span>
                      </label>
                      <span className="text-xs text-orange-600 font-bold">{formData.weight} kg</span>
                    </div>
                    <input 
                      type="number"
                      step="0.5"
                      value={formData.weight || ''}
                      onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                      min="20"
                      max="400"
                      placeholder="68"
                      className="w-full bg-white border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all shadow-xs"
                    />
                    {formErrors.weight && <p className="text-rose-600 text-xs font-medium">{formErrors.weight}</p>}
                  </div>

                  {/* Height */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Height (cm) <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <span className="text-xs text-slate-500 font-semibold">{formData.height || 175} cm</span>
                    </div>
                    <input 
                      type="number"
                      value={formData.height || 175}
                      onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value, 10) || 0 })}
                      min="100"
                      max="250"
                      placeholder="175"
                      className="w-full bg-white border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all shadow-xs"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    type="button"
                    onClick={() => {
                      if (validateStep(1)) setCurrentStep(2);
                    }}
                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all hover:-translate-y-0.5 cursor-pointer"
                  >
                    <span>Next: Select Goal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Goal Selection */}
            {currentStep === 2 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
                <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Step 2: Choose Your Primary Focus</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Select what you want to achieve over this 7-day periodized training block.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {goalCards.map((card) => {
                    const isSelected = formData.goal === card.id;
                    return (
                      <div 
                        key={card.id}
                        onClick={() => setFormData({ ...formData, goal: card.id })}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                          isSelected 
                            ? 'bg-orange-50/70 border-orange-500 ring-2 ring-orange-500/30 shadow-md -translate-y-1' 
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}

                        <div>
                          <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-4">
                            {card.icon}
                          </div>
                          <h3 className="font-bold text-lg text-slate-900 mb-1">{card.title}</h3>
                          <p className="text-xs font-semibold text-orange-600 mb-2">{card.tagline}</p>
                          <p className="text-xs text-slate-600 leading-relaxed">{card.desc}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 bg-white px-2 py-0.5 rounded border border-orange-200">
                            {card.badge}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <button 
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      if (validateStep(2)) setCurrentStep(3);
                    }}
                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all hover:-translate-y-0.5 cursor-pointer"
                  >
                    <span>Next: Training Preferences</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Workout Preferences */}
            {currentStep === 3 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
                <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Step 3: Training Preferences</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Calibrate exercise complexity, session intensity, and available training facilities.</p>
                  </div>
                </div>

                {/* Intensity Selection */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Training Intensity Level <span className="text-orange-600">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {intensityOptions.map((opt) => {
                      const isSelected = formData.intensity === opt.id;
                      return (
                        <div 
                          key={opt.id}
                          onClick={() => setFormData({ ...formData, intensity: opt.id })}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-orange-50/80 border-orange-500 ring-2 ring-orange-500/25 shadow-xs' 
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm text-slate-900">{opt.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-orange-600" />}
                          </div>
                          <p className="text-xs font-semibold text-orange-600 mb-1">{opt.label}</p>
                          <p className="text-xs text-slate-500">{opt.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Experience Level Selection */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Lifting &amp; Sport Experience <span className="text-orange-600">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {experienceOptions.map((opt) => {
                      const isSelected = formData.experience === opt.id;
                      return (
                        <div 
                          key={opt.id}
                          onClick={() => setFormData({ ...formData, experience: opt.id })}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-orange-50/80 border-orange-500 ring-2 ring-orange-500/25 shadow-xs' 
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm text-slate-900">{opt.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-orange-600" />}
                          </div>
                          <p className="text-xs font-semibold text-orange-600 mb-1">{opt.timeframe}</p>
                          <p className="text-xs text-slate-500">{opt.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Equipment / Environment */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Equipment Access
                  </label>
                  <select 
                    value={formData.equipment || 'Gym (Full Access)'}
                    onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                    className="w-full bg-white border border-slate-300 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none shadow-xs"
                  >
                    <option value="Gym (Full Access)">Commercial Gym (Full barbells, dumbbells, cables, machines)</option>
                    <option value="Dumbbells Only">Home Gym (Dumbbells &amp; adjustable bench)</option>
                    <option value="Bodyweight &amp; Calisthenics">Bodyweight Only (No weights required, pull-up bar optional)</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button 
                    type="button"
                    onClick={handleGeneratePlan}
                    disabled={isGenerating}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-base flex items-center gap-2.5 shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin text-white" />
                        <span>Crafting With Gemini...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 text-white" />
                        <span>Generate My 7-Day Plan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Loading Generation View */}
        {isGenerating && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-orange-500/25 animate-ping" />
                <div className="absolute inset-2 rounded-full border-4 border-amber-500/30 animate-pulse" />
                <div className="w-20 h-20 rounded-full bg-orange-50 border-2 border-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Dumbbell className="w-9 h-9 text-orange-600 animate-bounce" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900">Gemini AI Engine Active</h3>
                <p className="text-sm text-orange-600 font-bold mt-1">{loadingStage}</p>
                <p className="text-xs text-slate-500 mt-2">Computing physiological progression, recovery indices, and exercise combinations.</p>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full w-3/4 animate-pulse rounded-full" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Workout Dashboard */}
        {currentStep === 4 && currentPlan && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-in fade-in duration-500">
            {/* Athlete Profile & Coaching Overview Card */}
            <div className="bg-gradient-to-r from-white via-orange-50/40 to-white border border-orange-200 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-2xl shadow-md shadow-orange-500/20 shrink-0">
                    {currentUser?.name?.charAt(0) || 'A'}
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                        {currentPlan.plan_data.plan_title || `7-Day Plan for ${currentUser?.name || formData.name}`}
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-700">
                        Goal: {currentUser?.goal || formData.goal}
                      </span>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-700">
                        {currentUser?.intensity || formData.intensity} Intensity
                      </span>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-800">
                        {currentUser?.experience || formData.experience} Level
                      </span>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {currentUser?.weight || formData.weight} kg
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 max-w-3xl pt-1 leading-relaxed">
                      {currentPlan.plan_data.overview}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center">
                  <button 
                    onClick={() => {
                      setCurrentStep(1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-xs font-bold px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
                    <span>Re-evaluate</span>
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="text-xs font-bold px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>Print Plan</span>
                  </button>
                </div>
              </div>

              {/* Safety banner */}
              {currentPlan.plan_data.safety_guidelines && (
                <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center gap-2.5 text-xs text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
                  <span><strong>Safety Directive:</strong> {currentPlan.plan_data.safety_guidelines}</span>
                </div>
              )}
            </div>

            {/* Nutrition & Recovery Fuel Card */}
            {nutritionTip && (
              <div className="bg-gradient-to-r from-orange-50/70 via-white to-orange-50/40 border border-orange-200 rounded-3xl p-6 sm:p-7 shadow-xs">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
                    <HeartPulse className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-extrabold uppercase tracking-widest text-orange-700">
                        NUTRITION &amp; RECOVERY FUEL RECOMMENDATION
                      </h3>
                      <span className="text-[10px] font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded border border-orange-200">
                        Targeted for {nutritionTip.goal}
                      </span>
                    </div>
                    <p className="text-base text-slate-900 font-semibold leading-relaxed">
                      "{nutritionTip.tip}"
                    </p>
                    <p className="text-[11px] text-slate-500 italic">
                      {nutritionTip.disclaimer}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule View Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Your 7-Day Workout Routine</h3>
                <p className="text-xs text-slate-500">Periodized distribution of muscle groups, sets, repetitions, and rest intervals.</p>
              </div>

              {/* View Toggle */}
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-1 flex items-center gap-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                    viewMode === 'grid' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All 7 Days Grid
                </button>
                <button
                  onClick={() => setViewMode('tabs')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                    viewMode === 'tabs' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Day-by-Day Focus
                </button>
              </div>
            </div>

            {/* Tabbed Day View */}
            {viewMode === 'tabs' && (
              <div className="space-y-6">
                {/* 7 Day Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {currentPlan.plan_data.days.map((dayItem, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveDayTab(idx)}
                      className={`px-4 py-3 rounded-2xl border text-left shrink-0 transition-all cursor-pointer ${
                        activeDayTab === idx
                          ? 'bg-orange-50 border-orange-500 text-slate-900 shadow-sm ring-1 ring-orange-500/25'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600">
                        {dayItem.day}
                      </div>
                      <div className="text-xs font-bold truncate max-w-[120px] text-slate-900">
                        {dayItem.focus}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Active Day Detail Card */}
                {(() => {
                  const dayItem = currentPlan.plan_data.days[activeDayTab];
                  if (!dayItem) return null;
                  return (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                        <div>
                          <span className="text-xs font-black uppercase tracking-widest text-orange-700 px-3 py-1 rounded-full bg-orange-50 border border-orange-200">
                            {dayItem.day}
                          </span>
                          <h4 className="text-2xl font-black text-slate-900 mt-2">{dayItem.focus}</h4>
                        </div>
                        <Calendar className="w-6 h-6 text-slate-400" />
                      </div>

                      <div className="space-y-3">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Scheduled Exercises</h5>
                        {dayItem.exercises && dayItem.exercises.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {dayItem.exercises.map((ex, exIdx) => (
                              <div key={exIdx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                                <div className="font-bold text-base text-slate-900 mb-2">{ex.exercise}</div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                  <span className="px-2.5 py-1 rounded-lg bg-orange-100 text-orange-800 font-bold border border-orange-200">
                                    Sets: {ex.sets}
                                  </span>
                                  <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800 font-bold border border-slate-300">
                                    Reps: {ex.reps}
                                  </span>
                                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold border border-amber-200">
                                    Rest: {ex.rest}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500">
                            <Activity className="w-8 h-8 text-orange-500 mx-auto mb-2 opacity-50" />
                            <p className="font-bold text-slate-800 text-base">Rest &amp; Muscle Repair Protocol</p>
                            <p className="text-xs mt-1">Light active recovery (walk, mobility foam rolling, stretching).</p>
                          </div>
                        )}
                      </div>

                      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-xl text-xs text-slate-700">
                        <strong className="text-orange-800">Recovery Directive:</strong> {dayItem.rest_recovery}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Grid View (All 7 Days Cards) */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {currentPlan.plan_data.days.map((dayItem, idx) => (
                  <div 
                    key={idx}
                    className="bg-white border border-slate-200 hover:border-orange-300 rounded-3xl p-5 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-xs hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                        <span className="text-[11px] font-extrabold text-orange-700 uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200">
                          {dayItem.day}
                        </span>
                        <Calendar className="w-4 h-4 text-slate-400" />
                      </div>

                      <h4 className="text-base font-bold text-slate-900 mb-3 min-h-[44px]">
                        {dayItem.focus}
                      </h4>

                      <div className="space-y-2 mb-4">
                        {dayItem.exercises && dayItem.exercises.length > 0 ? (
                          dayItem.exercises.map((ex, exIdx) => (
                            <div key={exIdx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                              <div className="font-semibold text-slate-900 mb-1.5">{ex.exercise}</div>
                              <div className="flex flex-wrap gap-1.5 text-[11px]">
                                <span className="text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded border border-orange-200">
                                  {ex.sets}
                                </span>
                                <span className="text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded">
                                  {ex.reps}
                                </span>
                                <span className="text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                                  {ex.rest}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-500 italic py-4 text-center bg-slate-50 rounded-xl border border-slate-200">
                            Active Rest &amp; Regeneration
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-600 bg-orange-50/60 p-2.5 rounded-xl border-l-2 border-orange-500">
                      <strong className="text-orange-800">Recovery:</strong> {dayItem.rest_recovery}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Conversational Feedback & Real-Time Plan Iteration Section */}
            <div className="bg-gradient-to-br from-white via-orange-50/30 to-white border border-orange-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Want to improve or customize this plan?</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Describe any changes in plain English (e.g. increase cardio volume, add more rest, swap exercises, or focus on specific muscle groups). Gemini AI will regenerate an updated 7-day schedule immediately.
                  </p>
                </div>
              </div>

              {/* Quick Suggestion Chips */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Quick Suggestion Ideas:
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickFeedbackChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFeedbackText(chip)}
                      className="text-xs px-3 py-1.5 rounded-full bg-white hover:bg-orange-50 hover:border-orange-400 border border-slate-200 text-slate-700 hover:text-orange-700 transition-all cursor-pointer shadow-2xs"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <textarea 
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Enter your feedback here (e.g., 'I want more cardio and core strength', 'Focus more on legs', 'I need 2 rest days instead of 1')..."
                  rows={3}
                  className="w-full bg-white border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-2xl p-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all shadow-xs"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingFeedback}
                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm flex items-center gap-2 shadow-md shadow-orange-500/25 disabled:opacity-50 transition-all cursor-pointer hover:-translate-y-0.5"
                  >
                    {isUpdatingFeedback ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Updating Plan with Gemini...</span>
                      </>
                    ) : (
                      <>
                        <span>Update My Plan</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 border-t border-slate-200 bg-slate-50/70">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-extrabold uppercase tracking-widest text-orange-600">
                SCIENTIFIC FITNESS ARCHITECTURE
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">How FitBuddy Works</h2>
              <p className="text-slate-600 text-sm">
                Built to solve the problem of generic online templates with adaptive physiological planning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center font-black text-xl">
                  01
                </div>
                <h3 className="text-lg font-bold text-slate-900">Biometric Calibration</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  FitBuddy takes your age, weight, target intensity, and experience to calculate appropriate lifting volume and frequency without overtraining.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center font-black text-xl">
                  02
                </div>
                <h3 className="text-lg font-bold text-slate-900">Gemini AI Synthesis</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Google Gemini AI generates a structured 7-day periodized routine with compound movements, sets, target reps, and rest intervals.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center font-black text-xl">
                  03
                </div>
                <h3 className="text-lg font-bold text-slate-900">Continuous Feedback Loop</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Provide natural language feedback any time. FitBuddy iterates on the schedule while preserving safety guidelines and progressive overload.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Plan History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Your Workout History</h3>
                <p className="text-xs text-slate-500">Previous iterations and saved workout routines.</p>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-700 text-2xl px-2 cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3">
              {historyPlans.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">No previous plans recorded yet.</p>
              ) : (
                historyPlans.map((p, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      setCurrentPlan(p);
                      setShowHistoryModal(false);
                      setCurrentStep(4);
                      showToast('Loaded workout plan from history', 'success');
                    }}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-orange-500 hover:bg-orange-50/40 cursor-pointer transition-all shadow-2xs"
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-sm text-slate-900">
                        {p.plan_data.plan_title || `Version ${historyPlans.length - idx}`}
                      </div>
                      <span className="text-[10px] text-orange-700 bg-orange-100 px-2 py-0.5 rounded font-bold border border-orange-200">
                        {p.plan_data.days?.length || 7} Days
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {new Date(p.created_at).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-600 mt-2 line-clamp-2">
                      {p.plan_data.overview}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center font-bold">
              FB
            </div>
            <div>
              <span className="font-extrabold text-slate-800">FitBuddy</span> — AI-Powered Fitness Planning.
              <p className="text-[11px] text-slate-500">Engineered with Google Gemini AI, FastAPI &amp; SQLite.</p>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 max-w-md text-center sm:text-right">
            Disclaimer: FitBuddy provides general exercise and wellness advice for educational purposes. Consult a licensed medical practitioner before starting any intensive fitness regimen.
          </div>
        </div>
      </footer>
    </div>
  );
}
