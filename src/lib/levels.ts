import type { LevelConfig } from './types';

export const levels: LevelConfig[] = [
	{
		id: 1,
		name: 'Beginner',
		description: 'Short sessions with frequent rest periods',
		strokeSeconds: 120,
		restSeconds: 60,
		arousalCheckIntervalSeconds: 60,
		requirements: {
			minSessions: 3,
			minTotalMinutes: 30,
			minEdges: 5,
			minClimaxRate: 0
		}
	},
	{
		id: 2,
		name: 'Intermediate',
		description: 'Moderate sessions with balanced rest',
		strokeSeconds: 300,
		restSeconds: 45,
		arousalCheckIntervalSeconds: 45,
		requirements: {
			minSessions: 5,
			minTotalMinutes: 60,
			minEdges: 10,
			minClimaxRate: 60
		}
	},
	{
		id: 3,
		name: 'Advanced',
		description: 'Longer sessions with shorter rest',
		strokeSeconds: 600,
		restSeconds: 30,
		arousalCheckIntervalSeconds: 30,
		requirements: {
			minSessions: 10,
			minTotalMinutes: 120,
			minEdges: 20,
			minClimaxRate: 70
		}
	},
	{
		id: 4,
		name: 'Expert',
		description: 'Extended edge training',
		strokeSeconds: 900,
		restSeconds: 20,
		arousalCheckIntervalSeconds: 30,
		requirements: {
			minSessions: 15,
			minTotalMinutes: 180,
			minEdges: 30,
			minClimaxRate: 80
		}
	}
];

export function getLevelById(id: number): LevelConfig {
	return levels.find((l) => l.id === id) ?? levels[0];
}
