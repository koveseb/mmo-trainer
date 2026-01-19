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
		arousalCheckIntervalSeconds: 60,
		requirements: {
			minSessions: 20,
			minTotalMinutes: 300,
			minEdges: 30,
			minClimaxRate: 0
		}
	},
	{
		id: 2,
		name: 'Apprentice',
		description: 'Build consistency with 10-minute strokes',
		strokeSeconds: 600,
		restSeconds: 55,
		arousalCheckIntervalSeconds: 55,
		requirements: {
			minSessions: 25,
			minTotalMinutes: 450,
			minEdges: 60,
			minClimaxRate: 40
		}
	},
	{
		id: 3,
		name: 'Initiate',
		description: 'Develop control with 15-minute strokes',
		strokeSeconds: 900,
		restSeconds: 50,
		arousalCheckIntervalSeconds: 50,
		requirements: {
			minSessions: 28,
			minTotalMinutes: 600,
			minEdges: 100,
			minClimaxRate: 50
		}
	},
	{
		id: 4,
		name: 'Practitioner',
		description: 'Refine your edge awareness with 20-minute strokes',
		strokeSeconds: 1200,
		restSeconds: 45,
		arousalCheckIntervalSeconds: 45,
		requirements: {
			minSessions: 28,
			minTotalMinutes: 750,
			minEdges: 150,
			minClimaxRate: 55
		}
	},
	{
		id: 5,
		name: 'Adept',
		description: 'Push boundaries with 25-minute strokes',
		strokeSeconds: 1500,
		restSeconds: 40,
		arousalCheckIntervalSeconds: 40,
		requirements: {
			minSessions: 30,
			minTotalMinutes: 900,
			minEdges: 200,
			minClimaxRate: 60
		}
	},
	{
		id: 6,
		name: 'Journeyman',
		description: 'Master sustained arousal with 30-minute strokes',
		strokeSeconds: 1800,
		restSeconds: 35,
		arousalCheckIntervalSeconds: 35,
		requirements: {
			minSessions: 30,
			minTotalMinutes: 1100,
			minEdges: 260,
			minClimaxRate: 65
		}
	},
	{
		id: 7,
		name: 'Expert',
		description: 'Demonstrate mastery with 35-minute strokes',
		strokeSeconds: 2100,
		restSeconds: 30,
		arousalCheckIntervalSeconds: 30,
		requirements: {
			minSessions: 32,
			minTotalMinutes: 1350,
			minEdges: 330,
			minClimaxRate: 70
		}
	},
	{
		id: 8,
		name: 'Virtuoso',
		description: 'Excel at 40-minute stroke periods',
		strokeSeconds: 2400,
		restSeconds: 25,
		arousalCheckIntervalSeconds: 30,
		requirements: {
			minSessions: 32,
			minTotalMinutes: 1600,
			minEdges: 400,
			minClimaxRate: 75
		}
	},
	{
		id: 9,
		name: 'Master',
		description: 'Near-complete control with 45-minute strokes',
		strokeSeconds: 2700,
		restSeconds: 20,
		arousalCheckIntervalSeconds: 25,
		requirements: {
			minSessions: 35,
			minTotalMinutes: 1900,
			minEdges: 500,
			minClimaxRate: 80
		}
	},
	{
		id: 10,
		name: 'Grandmaster',
		description: 'Ultimate mastery with 50-minute strokes',
		strokeSeconds: 3000,
		restSeconds: 15,
		arousalCheckIntervalSeconds: 20,
		requirements: {
			minSessions: 40,
			minTotalMinutes: 2400,
			minEdges: 650,
			minClimaxRate: 85
		}
	}
];

export function getLevelById(id: number): LevelConfig {
	return levels.find((l) => l.id === id) ?? levels[0];
}
