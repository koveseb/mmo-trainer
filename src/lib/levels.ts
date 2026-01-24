import type { LevelConfig } from './types';

if (import.meta.hot) {
	import.meta.hot.accept(() => {
		window.location.reload();
	});
}

export const levels: LevelConfig[] = [
	{
		id: 1,
		name: 'Novice',
		description: 'Learn the basics with 5-minute stroke periods',
		strokeSeconds: 300,
		restSeconds: 60,
		arousalCheckIntervalSeconds: 180,
		requirements: {
			minSessions: 20,
			minTotalMinutes: 300,
			minEdges: 30,
			minClimaxes: 15,
			minClimaxRate: 0
		}
	},
	{
		id: 2,
		name: 'Apprentice',
		description: 'Build consistency with 10-minute strokes',
		strokeSeconds: 600,
		restSeconds: 55,
		arousalCheckIntervalSeconds: 240,
		requirements: {
			minSessions: 25,
			minTotalMinutes: 450,
			minEdges: 60,
			minClimaxes: 28,
			minClimaxRate: 40
		}
	},
	{
		id: 3,
		name: 'Initiate',
		description: 'Develop control with 15-minute strokes',
		strokeSeconds: 900,
		restSeconds: 50,
		arousalCheckIntervalSeconds: 300,
		requirements: {
			minSessions: 28,
			minTotalMinutes: 600,
			minEdges: 100,
			minClimaxes: 40,
			minClimaxRate: 50
		}
	},
	{
		id: 4,
		name: 'Practitioner',
		description: 'Refine your edge awareness with 25-minute strokes',
		strokeSeconds: 1500,
		restSeconds: 45,
		arousalCheckIntervalSeconds: 360,
		requirements: {
			minSessions: 28,
			minTotalMinutes: 750,
			minEdges: 150,
			minClimaxes: 50,
			minClimaxRate: 55
		}
	},
	{
		id: 5,
		name: 'Adept',
		description: 'Push boundaries with 35-minute strokes',
		strokeSeconds: 2100,
		restSeconds: 40,
		arousalCheckIntervalSeconds: 420,
		requirements: {
			minSessions: 30,
			minTotalMinutes: 900,
			minEdges: 200,
			minClimaxes: 60,
			minClimaxRate: 60
		}
	},
	{
		id: 6,
		name: 'Journeyman',
		description: 'Master sustained arousal with 50-minute strokes',
		strokeSeconds: 3000,
		restSeconds: 35,
		arousalCheckIntervalSeconds: 480,
		requirements: {
			minSessions: 30,
			minTotalMinutes: 1100,
			minEdges: 260,
			minClimaxes: 68,
			minClimaxRate: 65
		}
	},
	{
		id: 7,
		name: 'Expert',
		description: 'Demonstrate mastery with 70-minute strokes',
		strokeSeconds: 4200,
		restSeconds: 30,
		arousalCheckIntervalSeconds: 600,
		requirements: {
			minSessions: 32,
			minTotalMinutes: 1350,
			minEdges: 330,
			minClimaxes: 75,
			minClimaxRate: 70
		}
	},
	{
		id: 8,
		name: 'Virtuoso',
		description: 'Excel at 90-minute stroke periods',
		strokeSeconds: 5400,
		restSeconds: 25,
		arousalCheckIntervalSeconds: 720,
		requirements: {
			minSessions: 32,
			minTotalMinutes: 1600,
			minEdges: 400,
			minClimaxes: 82,
			minClimaxRate: 75
		}
	},
	{
		id: 9,
		name: 'Master',
		description: 'Near-complete control with 105-minute strokes',
		strokeSeconds: 6300,
		restSeconds: 20,
		arousalCheckIntervalSeconds: 840,
		requirements: {
			minSessions: 35,
			minTotalMinutes: 1900,
			minEdges: 500,
			minClimaxes: 88,
			minClimaxRate: 80
		}
	},
	{
		id: 10,
		name: 'Grandmaster',
		description: 'Ultimate mastery with 2-hour strokes',
		strokeSeconds: 7200,
		restSeconds: 15,
		arousalCheckIntervalSeconds: 900,
		requirements: {
			minSessions: 40,
			minTotalMinutes: 2400,
			minEdges: 650,
			minClimaxes: 95,
			minClimaxRate: 85
		}
	}
];

export function getLevelById(id: number): LevelConfig {
	return levels.find((l) => l.id === id) ?? levels[0];
}
