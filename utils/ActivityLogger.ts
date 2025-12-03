
import { saveActivityLog } from '../services/dbService';

export type FocusCategory = 
  | "Phrasal Verbs"
  | "Vocabulary"
  | "Grammar"
  | "Pronunciation"
  | "Fluency"
  | "Flow"
  | "Discourse";

export type ActivityType = 
  | "drill"
  | "login"
  | "navigation"
  | "reading"
  | "real_world"
  | "view_about"
  | "view_faq";

export interface FocusItem {
  focus_category: string;
  focus_item: string;
  time_spent_seconds: number;
  performance_score: number | null;
  attempts_count: number;
  error_pattern_detected: string[];
  context_sentence?: string;
  timestamp: string;
}

export interface ActivityLog {
  activity_id: string;
  activity_type: string;
  activity_description: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  focus_items: FocusItem[];
  metadata: Record<string, any>;
}

export interface SessionLog {
  session_id: string;
  user_id: string;
  module_id: string;
  start_time: string;
  end_time: string | null;
  activities: ActivityLog[];
}

export class ActivityLogger {
  private moduleId: string;
  private userId: string;
  private sessionId: string;
  private sessionStartTime: number;
  private activities: ActivityLog[];
  public currentActivity: ActivityLog | null;

  constructor(moduleId: string, userId: string) {
    this.moduleId = moduleId;
    this.userId = userId;
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.sessionStartTime = Date.now();
    this.activities = [];
    this.currentActivity = null;
  }

  startSession() {
    this.sessionStartTime = Date.now();
    this.persistSession();
  }

  startActivity(activityId: string, type: string, description: string) {
    if (this.currentActivity) {
      this.endActivity();
    }

    this.currentActivity = {
      activity_id: activityId,
      activity_type: type,
      activity_description: description,
      start_time: new Date().toISOString(),
      end_time: null,
      duration_seconds: null,
      focus_items: [],
      metadata: {}
    };
  }

  endActivity() {
    if (!this.currentActivity) return;

    const now = Date.now();
    const startTime = new Date(this.currentActivity.start_time).getTime();
    this.currentActivity.end_time = new Date(now).toISOString();
    this.currentActivity.duration_seconds = (now - startTime) / 1000;

    this.activities.push(this.currentActivity);
    this.currentActivity = null;
    
    this.persistSession();
  }

  addMetadata(key: string, value: any) {
    if (this.currentActivity) {
      this.currentActivity.metadata[key] = value;
    }
  }

  logFocusItem(
    category: string, 
    focusOn: string,
    timeSpent: number,
    performanceScore: number | null,
    attempts: number,
    errorPattern: string[],
    context?: string
  ) {
    if (!this.currentActivity) return;

    const item: FocusItem = {
      focus_category: category,
      focus_item: focusOn,
      time_spent_seconds: timeSpent,
      performance_score: performanceScore,
      attempts_count: attempts,
      error_pattern_detected: errorPattern,
      context_sentence: context,
      timestamp: new Date().toISOString()
    };

    this.currentActivity.focus_items.push(item);
  }

  private persistSession() {
    const sessionLog: SessionLog = {
      session_id: this.sessionId,
      user_id: this.userId,
      module_id: this.moduleId,
      start_time: new Date(this.sessionStartTime).toISOString(),
      end_time: new Date().toISOString(),
      activities: [...this.activities]
    };

    // Save to local IndexedDB
    saveActivityLog(sessionLog).catch(err => console.error("Failed to save activity log locally", err));

    // Send to API
    const apiPayload = {
      ...sessionLog,
      source: 'practice_uni'
    };

    fetch('https://gitenglishhub.com/api/data/track-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiPayload)
    }).catch(err => console.error("Failed to send session data to API", err));
  }
}
