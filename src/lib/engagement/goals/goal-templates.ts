/**
 * Goal Templates - Pre-defined Health Goal Templates
 * Weight management, activity goals, medication adherence, and more
 */

import { GoalType, GoalPriority, Goal } from './goal-engine';

export interface GoalTemplate {
  id: string;
  type: GoalType;
  title: string;
  description: string;
  icon: string;
  category: string;
  priority: GoalPriority;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // days
  targetValue: number;
  unit: string;
  direction: 'increase' | 'decrease' | 'maintain';
  specific: string;
  achievable: string;
  relevant: string;
  tips: string[];
  requiredTracking: string[];
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  // ============ WEIGHT MANAGEMENT ============
  {
    id: 'weight_loss_5percent',
    type: GoalType.WEIGHT_LOSS,
    title: 'Healthy Weight Loss - 5%',
    description: 'Lose 5% of your body weight in 12 weeks',
    icon: '⚖️',
    category: 'Weight Management',
    priority: GoalPriority.HIGH,
    difficulty: 'beginner',
    duration: 84,
    targetValue: 5,
    unit: 'percent',
    direction: 'decrease',
    specific: 'Lose 5% of current body weight through diet and exercise',
    achievable: 'Safe weight loss rate of 1-2 lbs per week',
    relevant: 'Reduce health risks associated with excess weight',
    tips: [
      'Track calories with nutrition app',
      'Aim for 500-750 calorie deficit per day',
      'Combine diet with 150+ minutes exercise per week',
      'Weigh yourself weekly at same time',
      'Focus on whole foods and vegetables',
    ],
    requiredTracking: ['weight', 'nutrition', 'exercise'],
  },
  {
    id: 'weight_loss_10percent',
    type: GoalType.WEIGHT_LOSS,
    title: 'Healthy Weight Loss - 10%',
    description: 'Lose 10% of your body weight in 24 weeks',
    icon: '⚖️',
    category: 'Weight Management',
    priority: GoalPriority.HIGH,
    difficulty: 'intermediate',
    duration: 168,
    targetValue: 10,
    unit: 'percent',
    direction: 'decrease',
    specific: 'Lose 10% of current body weight through comprehensive lifestyle changes',
    achievable: 'Sustainable pace of 1-2 lbs per week with support',
    relevant: 'Significantly improve metabolic health and reduce disease risk',
    tips: [
      'Work with registered dietitian',
      'Track all meals and snacks',
      'Exercise 5-6 days per week',
      'Join weight loss support group',
      'Consider behavioral therapy',
    ],
    requiredTracking: ['weight', 'nutrition', 'exercise', 'mood'],
  },
  {
    id: 'weight_maintenance',
    type: GoalType.WEIGHT_LOSS,
    title: 'Weight Maintenance',
    description: 'Maintain current weight for 12 weeks',
    icon: '⚖️',
    category: 'Weight Management',
    priority: GoalPriority.MEDIUM,
    difficulty: 'intermediate',
    duration: 84,
    targetValue: 0,
    unit: 'lbs',
    direction: 'maintain',
    specific: 'Maintain weight within 3-5 lbs of current weight',
    achievable: 'Balance caloric intake with energy expenditure',
    relevant: 'Sustain weight loss and prevent regain',
    tips: [
      'Continue tracking nutrition',
      'Weigh weekly to catch early changes',
      'Stay physically active',
      'Plan for special occasions',
      'Build healthy habits',
    ],
    requiredTracking: ['weight', 'nutrition', 'exercise'],
  },

  // ============ EXERCISE & FITNESS ============
  {
    id: 'steps_10k_daily',
    type: GoalType.EXERCISE,
    title: '10,000 Steps Daily',
    description: 'Walk 10,000 steps every day for 30 days',
    icon: '👟',
    category: 'Exercise',
    priority: GoalPriority.MEDIUM,
    difficulty: 'beginner',
    duration: 30,
    targetValue: 300000,
    unit: 'steps',
    direction: 'increase',
    specific: 'Achieve 10,000 steps per day through walking',
    achievable: 'Break into smaller walks throughout the day',
    relevant: 'Improve cardiovascular health and daily activity levels',
    tips: [
      'Wear fitness tracker or use phone pedometer',
      'Take walking breaks every hour',
      'Walk during phone calls',
      'Park farther away from destinations',
      'Take stairs instead of elevator',
    ],
    requiredTracking: ['steps'],
  },
  {
    id: 'exercise_150min_weekly',
    type: GoalType.EXERCISE,
    title: '150 Minutes Exercise Weekly',
    description: 'Complete 150 minutes of moderate exercise per week',
    icon: '🏃',
    category: 'Exercise',
    priority: GoalPriority.HIGH,
    difficulty: 'intermediate',
    duration: 84,
    targetValue: 150,
    unit: 'minutes/week',
    direction: 'increase',
    specific: 'Engage in 150 minutes of moderate-intensity aerobic activity weekly',
    achievable: 'Split into 30-minute sessions, 5 days per week',
    relevant: 'Meet CDC guidelines for physical activity and health',
    tips: [
      'Schedule workouts like appointments',
      'Find activities you enjoy',
      'Start slow and gradually increase',
      'Include variety (walking, cycling, swimming)',
      'Track with fitness app or watch',
    ],
    requiredTracking: ['exercise'],
  },
  {
    id: 'strength_training',
    type: GoalType.EXERCISE,
    title: 'Strength Training 3x Weekly',
    description: 'Complete strength training 3 times per week for 12 weeks',
    icon: '💪',
    category: 'Exercise',
    priority: GoalPriority.MEDIUM,
    difficulty: 'intermediate',
    duration: 84,
    targetValue: 36,
    unit: 'sessions',
    direction: 'increase',
    specific: 'Perform resistance training targeting major muscle groups 3x weekly',
    achievable: '30-45 minute sessions with progressive overload',
    relevant: 'Build muscle mass, increase metabolism, improve bone density',
    tips: [
      'Learn proper form to prevent injury',
      'Start with bodyweight or light weights',
      'Target all major muscle groups',
      'Rest 48 hours between sessions',
      'Track exercises and weights',
    ],
    requiredTracking: ['exercise'],
  },
  {
    id: 'couch_to_5k',
    type: GoalType.EXERCISE,
    title: 'Couch to 5K',
    description: 'Build up to running 5K continuously',
    icon: '🏃‍♀️',
    category: 'Exercise',
    priority: GoalPriority.MEDIUM,
    difficulty: 'beginner',
    duration: 63,
    targetValue: 5,
    unit: 'km',
    direction: 'increase',
    specific: 'Progress from walking to running 5K (3.1 miles) without stopping',
    achievable: 'Follow structured 9-week training program',
    relevant: 'Build cardiovascular fitness and running endurance',
    tips: [
      'Start with run/walk intervals',
      'Run 3 days per week with rest days',
      'Invest in proper running shoes',
      'Focus on time, not speed',
      'Join running group for motivation',
    ],
    requiredTracking: ['exercise'],
  },

  // ============ NUTRITION ============
  {
    id: 'vegetable_servings',
    type: GoalType.NUTRITION,
    title: '5 Servings of Vegetables Daily',
    description: 'Eat 5 servings of vegetables every day for 30 days',
    icon: '🥗',
    category: 'Nutrition',
    priority: GoalPriority.MEDIUM,
    difficulty: 'beginner',
    duration: 30,
    targetValue: 150,
    unit: 'servings',
    direction: 'increase',
    specific: 'Consume minimum 5 servings of vegetables daily',
    achievable: 'Plan vegetables into each meal and snack',
    relevant: 'Increase nutrient intake and support overall health',
    tips: [
      'Prep vegetables on Sunday for the week',
      'Add vegetables to breakfast (omelet, smoothie)',
      'Make vegetables half your plate at meals',
      'Keep cut vegetables ready for snacks',
      'Try new vegetables each week',
    ],
    requiredTracking: ['nutrition'],
  },
  {
    id: 'reduce_sugar',
    type: GoalType.NUTRITION,
    title: 'Reduce Added Sugar',
    description: 'Limit added sugar to <25g per day for 60 days',
    icon: '🍬',
    category: 'Nutrition',
    priority: GoalPriority.HIGH,
    difficulty: 'intermediate',
    duration: 60,
    targetValue: 25,
    unit: 'grams/day',
    direction: 'decrease',
    specific: 'Reduce added sugar intake to less than 25g (6 tsp) daily',
    achievable: 'Eliminate sugary drinks and processed foods',
    relevant: 'Improve metabolic health and reduce diabetes risk',
    tips: [
      'Read nutrition labels carefully',
      'Avoid sugary beverages',
      'Choose whole fruits over juice',
      'Cook meals at home',
      'Use natural sweeteners sparingly',
    ],
    requiredTracking: ['nutrition'],
  },
  {
    id: 'hydration',
    type: GoalType.NUTRITION,
    title: 'Optimal Hydration',
    description: 'Drink 8 glasses of water daily for 30 days',
    icon: '💧',
    category: 'Nutrition',
    priority: GoalPriority.LOW,
    difficulty: 'beginner',
    duration: 30,
    targetValue: 240,
    unit: 'glasses',
    direction: 'increase',
    specific: 'Drink 8 eight-ounce glasses of water daily (64 oz total)',
    achievable: 'Spread throughout day with reminders',
    relevant: 'Support hydration, kidney function, and metabolism',
    tips: [
      'Start day with glass of water',
      'Carry reusable water bottle',
      'Set hourly hydration reminders',
      'Drink glass before each meal',
      'Track with hydration app',
    ],
    requiredTracking: ['nutrition'],
  },
  {
    id: 'meal_prep',
    type: GoalType.NUTRITION,
    title: 'Weekly Meal Prep',
    description: 'Prep healthy meals every Sunday for 12 weeks',
    icon: '🍱',
    category: 'Nutrition',
    priority: GoalPriority.MEDIUM,
    difficulty: 'intermediate',
    duration: 84,
    targetValue: 12,
    unit: 'weeks',
    direction: 'increase',
    specific: 'Prepare healthy meals on Sundays for the upcoming week',
    achievable: 'Dedicate 2-3 hours on Sunday for meal prep',
    relevant: 'Save time, money, and make healthier food choices',
    tips: [
      'Plan menu on Friday',
      'Shop on Saturday',
      'Prep on Sunday',
      'Use meal prep containers',
      'Batch cook proteins and grains',
    ],
    requiredTracking: ['nutrition'],
  },

  // ============ MEDICATION ADHERENCE ============
  {
    id: 'medication_perfect_30',
    type: GoalType.MEDICATION_ADHERENCE,
    title: 'Perfect Medication Adherence',
    description: 'Take all medications as prescribed for 30 days',
    icon: '💊',
    category: 'Medication',
    priority: GoalPriority.CRITICAL,
    difficulty: 'beginner',
    duration: 30,
    targetValue: 100,
    unit: 'percent',
    direction: 'increase',
    specific: 'Take 100% of prescribed medications on time for 30 consecutive days',
    achievable: 'Use pill organizer and phone reminders',
    relevant: 'Maximize treatment effectiveness and health outcomes',
    tips: [
      'Set daily medication alarms',
      'Use weekly pill organizer',
      'Link to daily routine (meals, bedtime)',
      'Keep medications visible',
      'Track with medication app',
    ],
    requiredTracking: ['medication'],
  },
  {
    id: 'medication_perfect_90',
    type: GoalType.MEDICATION_ADHERENCE,
    title: '90-Day Adherence Challenge',
    description: 'Maintain perfect medication adherence for 90 days',
    icon: '💊',
    category: 'Medication',
    priority: GoalPriority.CRITICAL,
    difficulty: 'intermediate',
    duration: 90,
    targetValue: 100,
    unit: 'percent',
    direction: 'increase',
    specific: 'Achieve 100% adherence to medication regimen for 90 days',
    achievable: 'Establish strong medication-taking habits',
    relevant: 'Demonstrate long-term commitment to treatment plan',
    tips: [
      'Build strong daily habits',
      'Refill prescriptions early',
      'Communicate with pharmacist',
      'Track side effects',
      'Celebrate milestones',
    ],
    requiredTracking: ['medication'],
  },

  // ============ VITAL SIGNS & CHRONIC DISEASE ============
  {
    id: 'blood_pressure_control',
    type: GoalType.VITAL_SIGNS,
    title: 'Blood Pressure Control',
    description: 'Maintain BP <120/80 for 90 days',
    icon: '❤️',
    category: 'Vital Signs',
    priority: GoalPriority.CRITICAL,
    difficulty: 'intermediate',
    duration: 90,
    targetValue: 120,
    unit: 'mmHg systolic',
    direction: 'decrease',
    specific: 'Keep blood pressure below 120/80 mmHg',
    achievable: 'Combine medication, diet (DASH), exercise, and stress management',
    relevant: 'Reduce cardiovascular disease and stroke risk',
    tips: [
      'Monitor BP daily at same time',
      'Reduce sodium to <2300mg/day',
      'Exercise regularly',
      'Manage stress',
      'Take medications as prescribed',
    ],
    requiredTracking: ['vital_signs', 'medication', 'nutrition'],
  },
  {
    id: 'blood_sugar_control',
    type: GoalType.CHRONIC_DISEASE,
    title: 'Blood Glucose Management',
    description: 'Keep fasting glucose 80-130 mg/dL for 60 days',
    icon: '🩸',
    category: 'Chronic Disease',
    priority: GoalPriority.CRITICAL,
    difficulty: 'advanced',
    duration: 60,
    targetValue: 130,
    unit: 'mg/dL',
    direction: 'decrease',
    specific: 'Maintain fasting blood glucose between 80-130 mg/dL',
    achievable: 'Follow meal plan, exercise, and medication regimen',
    relevant: 'Prevent diabetes complications and improve A1C',
    tips: [
      'Check glucose as directed',
      'Count carbohydrates',
      'Exercise after meals',
      'Take medications on time',
      'Keep detailed food log',
    ],
    requiredTracking: ['vital_signs', 'medication', 'nutrition', 'exercise'],
  },
  {
    id: 'a1c_reduction',
    type: GoalType.CHRONIC_DISEASE,
    title: 'A1C Improvement',
    description: 'Lower A1C by 1% in 90 days',
    icon: '🩸',
    category: 'Chronic Disease',
    priority: GoalPriority.CRITICAL,
    difficulty: 'advanced',
    duration: 90,
    targetValue: 1,
    unit: 'percent reduction',
    direction: 'decrease',
    specific: 'Reduce hemoglobin A1C by 1 percentage point',
    achievable: 'Comprehensive diabetes management with medical supervision',
    relevant: 'Significantly reduce long-term diabetes complications',
    tips: [
      'Work closely with endocrinologist',
      'Monitor glucose 4+ times daily',
      'Follow diabetes meal plan',
      'Exercise 150+ minutes weekly',
      'Optimize medication regimen',
    ],
    requiredTracking: ['vital_signs', 'medication', 'nutrition', 'exercise'],
  },

  // ============ SLEEP ============
  {
    id: 'sleep_7to9_hours',
    type: GoalType.SLEEP,
    title: 'Optimal Sleep Duration',
    description: 'Get 7-9 hours of sleep nightly for 30 days',
    icon: '😴',
    category: 'Sleep',
    priority: GoalPriority.MEDIUM,
    difficulty: 'intermediate',
    duration: 30,
    targetValue: 8,
    unit: 'hours',
    direction: 'increase',
    specific: 'Sleep 7-9 hours per night for 30 consecutive nights',
    achievable: 'Establish consistent sleep schedule and bedtime routine',
    relevant: 'Improve energy, mood, cognitive function, and overall health',
    tips: [
      'Set consistent bedtime and wake time',
      'Create relaxing bedtime routine',
      'Avoid screens 1 hour before bed',
      'Keep bedroom cool and dark',
      'Limit caffeine after 2pm',
    ],
    requiredTracking: ['sleep'],
  },
  {
    id: 'sleep_quality',
    type: GoalType.SLEEP,
    title: 'Sleep Quality Improvement',
    description: 'Achieve 85%+ sleep efficiency for 60 days',
    icon: '😴',
    category: 'Sleep',
    priority: GoalPriority.MEDIUM,
    difficulty: 'advanced',
    duration: 60,
    targetValue: 85,
    unit: 'percent efficiency',
    direction: 'increase',
    specific: 'Achieve sleep efficiency of 85% or higher',
    achievable: 'Optimize sleep environment and habits',
    relevant: 'Maximize restorative sleep and daytime functioning',
    tips: [
      'Track sleep with wearable device',
      'Use bed only for sleep',
      'Exercise during day, not before bed',
      'Manage stress and anxiety',
      'Consider cognitive behavioral therapy for insomnia',
    ],
    requiredTracking: ['sleep'],
  },

  // ============ STRESS MANAGEMENT ============
  {
    id: 'daily_meditation',
    type: GoalType.STRESS_MANAGEMENT,
    title: 'Daily Meditation Practice',
    description: 'Meditate 10 minutes daily for 30 days',
    icon: '🧘',
    category: 'Mental Health',
    priority: GoalPriority.MEDIUM,
    difficulty: 'beginner',
    duration: 30,
    targetValue: 300,
    unit: 'minutes',
    direction: 'increase',
    specific: 'Complete 10 minutes of meditation every day',
    achievable: 'Use guided meditation apps for support',
    relevant: 'Reduce stress, improve focus, and enhance emotional wellbeing',
    tips: [
      'Start with 5 minutes and build up',
      'Use apps like Headspace or Calm',
      'Meditate at same time daily',
      'Create quiet meditation space',
      'Be patient with yourself',
    ],
    requiredTracking: ['mood'],
  },
  {
    id: 'stress_reduction',
    type: GoalType.STRESS_MANAGEMENT,
    title: 'Stress Level Reduction',
    description: 'Reduce perceived stress score by 30% in 60 days',
    icon: '🧘',
    category: 'Mental Health',
    priority: GoalPriority.HIGH,
    difficulty: 'intermediate',
    duration: 60,
    targetValue: 30,
    unit: 'percent reduction',
    direction: 'decrease',
    specific: 'Lower Perceived Stress Scale (PSS) score by 30%',
    achievable: 'Implement multiple stress management techniques',
    relevant: 'Improve mental health and reduce physical health impacts',
    tips: [
      'Practice daily relaxation',
      'Exercise regularly',
      'Improve time management',
      'Set healthy boundaries',
      'Consider therapy or counseling',
    ],
    requiredTracking: ['mood'],
  },

  // ============ PREVENTIVE CARE ============
  {
    id: 'annual_screenings',
    type: GoalType.PREVENTIVE_CARE,
    title: 'Complete Annual Screenings',
    description: 'Finish all recommended preventive screenings',
    icon: '🔍',
    category: 'Preventive Care',
    priority: GoalPriority.HIGH,
    difficulty: 'beginner',
    duration: 365,
    targetValue: 100,
    unit: 'percent',
    direction: 'increase',
    specific: 'Complete 100% of age-appropriate preventive screenings',
    achievable: 'Schedule and attend all recommended appointments',
    relevant: 'Early detection and prevention of serious health conditions',
    tips: [
      'Review screening guidelines with provider',
      'Schedule all appointments at once',
      'Set calendar reminders',
      'Arrange transportation if needed',
      'Track completion in health app',
    ],
    requiredTracking: ['appointments'],
  },
];

/**
 * Get template by ID
 */
export function getGoalTemplate(id: string): GoalTemplate | undefined {
  return GOAL_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by type
 */
export function getGoalTemplatesByType(type: GoalType): GoalTemplate[] {
  return GOAL_TEMPLATES.filter((t) => t.type === type);
}

/**
 * Get templates by category
 */
export function getGoalTemplatesByCategory(category: string): GoalTemplate[] {
  return GOAL_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get templates by difficulty
 */
export function getGoalTemplatesByDifficulty(
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): GoalTemplate[] {
  return GOAL_TEMPLATES.filter((t) => t.difficulty === difficulty);
}

/**
 * Get all unique categories
 */
export function getGoalCategories(): string[] {
  return Array.from(new Set(GOAL_TEMPLATES.map((t) => t.category)));
}
