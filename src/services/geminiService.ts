/**
 * ─────────────────────────────────────────────────────────────────────────────
 * OmniRide AI Service  —  AWS Lambda proxy for Google Gemini
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * All Gemini calls are routed through:
 *   Frontend  →  API Gateway  →  Lambda (holds the Gemini API key)  →  Gemini
 *
 * The frontend NEVER holds a Gemini key.
 * Streaming (support chat) uses Server-Sent Events via awsStream().
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { TripInsight, DeliveryOrder, RiderProfile, Location, User } from '../types';
import { awsPost, awsStream } from './awsClient';
import { LAMBDA_ROUTES } from './awsConfig';

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces (unchanged — contracts stay the same)
// ─────────────────────────────────────────────────────────────────────────────

export interface OptimizationStep {
  jobId: string;
  action: 'pickup' | 'dropoff';
  location: string;
  estTime: string;
}

export interface OptimizationPlan {
  sequence: OptimizationStep[];
  summary: string;
  bestPractices: string[];
}

export interface RiderMatchSuggestion {
  riderId: string;
  matchScore: number;
  reasoning: string;
  efficiencyGain: string;
}

export interface TaskLogistics {
  totalDistanceKm: number;
  suggestedStation: string;
  rangeConfidence: string;
  estimatedConsumptionKwh: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Parse a JSON response from Lambda; return fallback on any failure. */
function safeJson<T>(raw: unknown, fallback: T): T {
  if (!raw) return fallback;
  if (typeof raw === 'object') return raw as T;
  try { return JSON.parse(raw as string) as T; } catch { return fallback; }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Functions — all routed through Lambda
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Enterprise-level corporate growth strategy.
 * Lambda calls Gemini with business context and returns bullet points.
 */
export const getBusinessStrategy = async (user: User, riders: User[]): Promise<string> => {
  const biz = user.businessProfile;
  const context = {
    company:       biz?.companyName,
    fleetSize:     riders.length,
    wallet:        biz?.walletBalance,
    employeeCount: biz?.employees.length,
    avgBattery:    riders.reduce((a, r) => a + (r.riderProfile?.batteryStatus ?? 0), 0) / (riders.length || 1),
  };

  const { data, error } = await awsPost<{ text: string }>(
    LAMBDA_ROUTES.AI_BUSINESS_STRATEGY,
    { context },
  );

  if (error || !data?.text) {
    console.warn('[AI] getBusinessStrategy fallback:', error?.message);
    return 'Optimize your dedicated fleet deployment by clustering pickups in high-density sectors. Consider increasing your station footprint to capture 90% net revenue from independent riders.';
  }
  return data.text;
};

/**
 * Road distance + travel time between two addresses.
 * Lambda calls Gemini with structured JSON response schema.
 */
export const calculateRoadDistance = async (
  from: string,
  to: string,
): Promise<{ distanceKm: number; durationMinutes: number }> => {
  const FALLBACK = { distanceKm: 8.5, durationMinutes: 22 };

  const { data, error } = await awsPost<{ distanceKm: number; durationMinutes: number }>(
    LAMBDA_ROUTES.AI_DISTANCE,
    { from, to },
  );

  if (error || !data) {
    console.warn('[AI] calculateRoadDistance fallback:', error?.message);
    return FALLBACK;
  }
  return safeJson(data, FALLBACK);
};

/**
 * Multi-stop mission logistics: total distance, swap station, energy use.
 */
export const calculateTaskLogistics = async (
  tasks: any[],
  profile: RiderProfile,
): Promise<TaskLogistics> => {
  const FALLBACK: TaskLogistics = {
    totalDistanceKm:        tasks.length * 5.2,
    suggestedStation:       `${profile.vehicleModel.split(' ')[0]} Hub Alpha`,
    rangeConfidence:        'Standard operating parameters.',
    estimatedConsumptionKwh: 2.5,
  };

  const taskContext = tasks.map(t => ({
    from: t.sender?.address ?? t.pickup,
    to:   t.receiver?.address ?? t.destination,
  }));

  const { data, error } = await awsPost<TaskLogistics>(
    LAMBDA_ROUTES.AI_TASK_LOGISTICS,
    {
      tasks:        taskContext,
      vehicleModel: profile.vehicleModel,
      batteryStatus: profile.batteryStatus,
    },
  );

  if (error || !data) {
    console.warn('[AI] calculateTaskLogistics fallback:', error?.message);
    return FALLBACK;
  }
  return safeJson(data, FALLBACK);
};

/**
 * Location autocomplete — returns 5 real address suggestions.
 */
export const searchLocations = async (query: string): Promise<Location[]> => {
  if (!query || query.length < 2) return [];

  const { data, error } = await awsPost<Location[]>(
    LAMBDA_ROUTES.AI_LOCATIONS,
    { query },
  );

  if (error || !data) {
    console.warn('[AI] searchLocations fallback:', error?.message);
    return [];
  }
  return Array.isArray(data) ? data : safeJson<Location[]>(data, []);
};

/**
 * Best rider match for a given job.
 */
export const suggestBestRiders = async (
  job: Partial<DeliveryOrder>,
  riders: RiderProfile[],
): Promise<RiderMatchSuggestion[]> => {
  const FALLBACK = riders.map(r => ({
    riderId: r.id, matchScore: 50, reasoning: 'Standard matching', efficiencyGain: '0%',
  }));

  const { data, error } = await awsPost<RiderMatchSuggestion[]>(
    LAMBDA_ROUTES.AI_RIDER_MATCH,
    { job, riders },
  );

  if (error || !data) {
    console.warn('[AI] suggestBestRiders fallback:', error?.message);
    return FALLBACK;
  }
  return Array.isArray(data) ? data : safeJson<RiderMatchSuggestion[]>(data, FALLBACK);
};

/**
 * Optimal delivery sequence for a batch of orders.
 */
export const getRouteOptimization = async (jobs: DeliveryOrder[]): Promise<OptimizationPlan> => {
  const FALLBACK: OptimizationPlan = { sequence: [], summary: 'Local sequence fallback', bestPractices: [] };

  const { data, error } = await awsPost<OptimizationPlan>(
    LAMBDA_ROUTES.AI_ROUTE_OPTIMIZE,
    { jobs },
  );

  if (error || !data) {
    console.warn('[AI] getRouteOptimization fallback:', error?.message);
    return FALLBACK;
  }
  return safeJson(data, FALLBACK);
};

/**
 * Best alternative route for an EV motorcycle.
 */
export const getAlternativeRoute = async (
  pickup: string,
  destination: string,
): Promise<{ routeName: string; reason: string; timeSaved: string }> => {
  const FALLBACK = { routeName: 'Standard Bypass', reason: 'Avoid main road traffic', timeSaved: '5m' };

  const { data, error } = await awsPost<{ routeName: string; reason: string; timeSaved: string }>(
    LAMBDA_ROUTES.AI_GENERATE,
    {
      prompt: `Suggest 1 best alternative route from ${pickup} to ${destination} for an EV motorcycle. JSON: {routeName, reason, timeSaved}`,
      responseFormat: 'json',
    },
  );

  if (error || !data) return FALLBACK;
  return safeJson(data, FALLBACK);
};

/**
 * Smart trip insights (3 bullet points).
 */
export const getTripInsights = async (pickup: string, destination: string): Promise<TripInsight[]> => {
  const { data, error } = await awsPost<TripInsight[]>(
    LAMBDA_ROUTES.AI_GENERATE,
    {
      prompt: `Provide 3 smart insights for a ride from ${pickup} to ${destination}. JSON array of {title, description, estimatedTimeAddition}`,
      responseFormat: 'json',
    },
  );

  if (error || !data) return [];
  return Array.isArray(data) ? data : safeJson<TripInsight[]>(data, []);
};

// ─────────────────────────────────────────────────────────────────────────────
// Streaming chat helpers — Lambda returns text/event-stream SSE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generic streaming chat via Lambda SSE endpoint.
 * `onChunk` fires with each text delta; `onDone` fires when stream closes.
 */
export const streamChat = (
  role: 'user' | 'vendor' | 'rider',
  message: string,
  history: { role: string; text: string }[],
  onChunk: (delta: string) => void,
  onDone:  () => void,
  onError: (err: string) => void,
): Promise<void> => {
  return awsStream(
    LAMBDA_ROUTES.AI_STREAM,
    { role, message, history },
    onChunk,
    onDone,
    onError,
  );
};

/**
 * Customer support AI chat stream.
 * Replaces the old `streamSupportChat` using @google/genai SDK directly.
 */
export const streamSupportChat = (
  message: string,
  history: any[],
  onChunk: (delta: string) => void,
  onDone:  () => void,
  onError: (err: string) => void,
): Promise<void> =>
  streamChat('user', message, history, onChunk, onDone, onError);

/**
 * Vendor support AI chat stream.
 */
export const streamVendorSupportChat = (
  message: string,
  history: any[],
  onChunk: (delta: string) => void,
  onDone:  () => void,
  onError: (err: string) => void,
): Promise<void> =>
  streamChat('vendor', message, history, onChunk, onDone, onError);

/**
 * Rider support AI chat stream.
 */
export const streamRiderSupportChat = (
  message: string,
  history: any[],
  onChunk: (delta: string) => void,
  onDone:  () => void,
  onError: (err: string) => void,
): Promise<void> =>
  streamChat('rider', message, history, onChunk, onDone, onError);
