export type PhaseType = 'stroke' | 'rest' | 'edge';

export interface Phase {
	type: PhaseType;
	startTime: string;
	durationSeconds: number;
}

export interface ArousalReading {
	timestamp: string;
	value: number;
}

export interface EdgeEvent {
	id: string;
	startTime: string;
	endTime?: string;
	outcome?: 'climax' | 'ejaculated';
	durationSeconds?: number;
}

export interface Session {
	id: string;
	startTime: string;
	endTime?: string;
	durationSeconds?: number;
	level: number;
	arousalReadings: ArousalReading[];
	phases: Phase[];
	edgeEvents: EdgeEvent[];
	notes?: string;
}

export interface LevelRequirements {
	minSessions: number;
	minTotalMinutes: number;
	minEdges: number;
	minClimaxes: number;
	minClimaxRate: number;
}

export interface LevelConfig {
	id: number;
	name: string;
	description: string;
	strokeSeconds: number;
	restSeconds: number;
	arousalCheckIntervalSeconds: number;
	requirements: LevelRequirements;
}

export interface LevelProgress {
	level: number;
	sessionsAtLevel: number;
	totalMinutesAtLevel: number;
	totalEdgesAtLevel: number;
	totalClimaxesAtLevel: number;
	climaxRate: number;
	unlocked: boolean;
	mastered: boolean;
}

export interface Settings {
	currentLevel: number;
	arousalCheckInterval: number;
	pushSubscription?: PushSubscriptionJSON;
}

export interface SessionStats {
	totalSessions: number;
	totalEdges: number;
	successfulEdges: number;
	totalTrainingMinutes: number;
	averageEdgeDuration: number;
	longestEdge: number;
}
