import { writable, derived } from 'svelte/store';
import type { Session, LevelProgress } from '$lib/types';
import { levels } from '$lib/levels';

function createProgressStore() {
	const { subscribe, set } = writable<LevelProgress[]>([]);

	function calculateProgress(sessions: Session[]): LevelProgress[] {
		return levels.map((level, index) => {
			const sessionsAtLevel = sessions.filter((s) => s.level === level.id);
			const totalMinutes = sessionsAtLevel.reduce(
				(sum, s) => sum + (s.durationSeconds ?? 0) / 60,
				0
			);
			const allEdges = sessionsAtLevel.flatMap((s) => s.edgeEvents);
			const totalEdges = allEdges.length;
			const totalClimaxes = allEdges.filter((e) => e.outcome === 'climax').length;
			const climaxRate = totalEdges > 0 ? (totalClimaxes / totalEdges) * 100 : 0;

			const req = level.requirements;
			const meetsRequirements =
				sessionsAtLevel.length >= req.minSessions &&
				totalMinutes >= req.minTotalMinutes &&
				totalEdges >= req.minEdges &&
				climaxRate >= req.minClimaxRate;

			const previousLevelMastered = index === 0 || calculatePreviousMastered(sessions, index);
			const unlocked = index === 0 || previousLevelMastered;

			return {
				level: level.id,
				sessionsAtLevel: sessionsAtLevel.length,
				totalMinutesAtLevel: Math.round(totalMinutes),
				totalEdgesAtLevel: totalEdges,
				totalClimaxesAtLevel: totalClimaxes,
				climaxRate: Math.round(climaxRate),
				unlocked,
				mastered: meetsRequirements
			};
		});
	}

	function calculatePreviousMastered(sessions: Session[], currentIndex: number): boolean {
		if (currentIndex === 0) return true;
		const prevLevel = levels[currentIndex - 1];
		const sessionsAtPrev = sessions.filter((s) => s.level === prevLevel.id);
		const totalMinutes = sessionsAtPrev.reduce(
			(sum, s) => sum + (s.durationSeconds ?? 0) / 60,
			0
		);
		const allEdges = sessionsAtPrev.flatMap((s) => s.edgeEvents);
		const totalEdges = allEdges.length;
		const totalClimaxes = allEdges.filter((e) => e.outcome === 'climax').length;
		const climaxRate = totalEdges > 0 ? (totalClimaxes / totalEdges) * 100 : 0;

		const req = prevLevel.requirements;
		return (
			sessionsAtPrev.length >= req.minSessions &&
			totalMinutes >= req.minTotalMinutes &&
			totalEdges >= req.minEdges &&
			climaxRate >= req.minClimaxRate
		);
	}

	return {
		subscribe,
		loadFromSessions(sessions: Session[]) {
			const progress = calculateProgress(sessions);
			set(progress);
		},
		getProgressForLevel(levelId: number): LevelProgress | undefined {
			let result: LevelProgress | undefined;
			subscribe((progress) => {
				result = progress.find((p) => p.level === levelId);
			})();
			return result;
		}
	};
}

export const progressStore = createProgressStore();

export const currentLevelProgress = derived(progressStore, ($progress) => {
	return $progress;
});

export function getProgressPercent(progress: LevelProgress | null | undefined, levelId: number): number {
	if (!progress) return 0;
	const level = levels.find((l) => l.id === levelId);
	if (!level || !level.requirements) return 0;

	const req = level.requirements;
	const sessionPercent = Math.min(100, (progress.sessionsAtLevel / req.minSessions) * 100);
	const minutesPercent = Math.min(100, (progress.totalMinutesAtLevel / req.minTotalMinutes) * 100);
	const edgesPercent = Math.min(100, (progress.totalEdgesAtLevel / req.minEdges) * 100);
	
	if (req.minClimaxRate > 0) {
		const climaxPercent = Math.min(100, (progress.climaxRate / req.minClimaxRate) * 100);
		return Math.round((sessionPercent + minutesPercent + edgesPercent + climaxPercent) / 4);
	}
	
	return Math.round((sessionPercent + minutesPercent + edgesPercent) / 3);
}

export function getMasteryDetails(progress: LevelProgress | null | undefined, levelId: number): {
	sessions: { current: number; required: number; met: boolean };
	minutes: { current: number; required: number; met: boolean };
	edges: { current: number; required: number; met: boolean };
	climaxRate: { current: number; required: number; met: boolean };
} {
	const defaultResult = {
		sessions: { current: 0, required: 0, met: true },
		minutes: { current: 0, required: 0, met: true },
		edges: { current: 0, required: 0, met: true },
		climaxRate: { current: 0, required: 0, met: true }
	};
	
	if (!progress) return defaultResult;
	
	const level = levels.find((l) => l.id === levelId);
	if (!level || !level.requirements) return defaultResult;

	const req = level.requirements;
	return {
		sessions: {
			current: progress.sessionsAtLevel,
			required: req.minSessions,
			met: progress.sessionsAtLevel >= req.minSessions
		},
		minutes: {
			current: progress.totalMinutesAtLevel,
			required: req.minTotalMinutes,
			met: progress.totalMinutesAtLevel >= req.minTotalMinutes
		},
		edges: {
			current: progress.totalEdgesAtLevel,
			required: req.minEdges,
			met: progress.totalEdgesAtLevel >= req.minEdges
		},
		climaxRate: {
			current: progress.climaxRate,
			required: req.minClimaxRate,
			met: progress.climaxRate >= req.minClimaxRate
		}
	};
}
