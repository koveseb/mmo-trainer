import { writable, derived, get } from 'svelte/store';
import type { Session, EdgeEvent, ArousalReading, Phase } from '$lib/types';
import { getLevelById } from '$lib/levels';

function generateId(): string {
	const now = new Date();
	const pad = (n: number) => n.toString().padStart(2, '0');
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

function createSessionStore() {
	const { subscribe, set, update } = writable<Session | null>(null);

	return {
		subscribe,

		start(level: number) {
			const now = new Date().toISOString();
			const session: Session = {
				id: generateId(),
				startTime: now,
				level,
				arousalReadings: [],
				phases: [{ type: 'stroke', startTime: now, durationSeconds: 0 }],
				edgeEvents: []
			};
			set(session);
			return session;
		},

		end() {
			let finalSession: Session | null = null;
			update((session) => {
				if (!session) return null;
				const now = new Date();
				const start = new Date(session.startTime);
				finalSession = {
					...session,
					endTime: now.toISOString(),
					durationSeconds: Math.floor((now.getTime() - start.getTime()) / 1000)
				};
				return finalSession;
			});
			return finalSession;
		},

		recordArousal(value: number) {
			update((session) => {
				if (!session) return null;
				const reading: ArousalReading = {
					timestamp: new Date().toISOString(),
					value
				};
				return {
					...session,
					arousalReadings: [...session.arousalReadings, reading]
				};
			});
		},

		startEdge(): string {
			const edgeId = crypto.randomUUID();
			update((session) => {
				if (!session) return null;
				const edge: EdgeEvent = {
					id: edgeId,
					startTime: new Date().toISOString()
				};
				return {
					...session,
					edgeEvents: [...session.edgeEvents, edge]
				};
			});
			return edgeId;
		},

		endEdge(edgeId: string, outcome: 'climax' | 'ejaculated') {
			update((session) => {
				if (!session) return null;
				const now = new Date();
				return {
					...session,
					edgeEvents: session.edgeEvents.map((edge) => {
						if (edge.id === edgeId) {
							const start = new Date(edge.startTime);
							return {
								...edge,
								endTime: now.toISOString(),
								outcome,
								durationSeconds: Math.floor((now.getTime() - start.getTime()) / 1000)
							};
						}
						return edge;
					})
				};
			});
		},

		getCurrentEdge(): EdgeEvent | null {
			const session = get({ subscribe });
			if (!session) return null;
			return session.edgeEvents.find((e) => !e.outcome) ?? null;
		},

		addPhase(type: Phase['type']) {
			update((session) => {
				if (!session) return null;
				const now = new Date().toISOString();
				const phases = session.phases;
				if (phases.length > 0) {
					const lastPhase = phases[phases.length - 1];
					const start = new Date(lastPhase.startTime);
					const end = new Date(now);
					lastPhase.durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
				}
				return {
					...session,
					phases: [...phases, { type, startTime: now, durationSeconds: 0 }]
				};
			});
		},

		clear() {
			set(null);
		},

		get() {
			return get({ subscribe });
		}
	};
}

export const sessionStore = createSessionStore();

export const isSessionActive = derived(sessionStore, ($session) => $session !== null);

export const currentEdge = derived(sessionStore, ($session) => {
	if (!$session) return null;
	return $session.edgeEvents.find((e) => !e.outcome) ?? null;
});

export const sessionStats = derived(sessionStore, ($session) => {
	if (!$session) return null;
	const successfulEdges = $session.edgeEvents.filter((e) => e.outcome === 'climax').length;
	const ejaculatedEdges = $session.edgeEvents.filter((e) => e.outcome === 'ejaculated').length;
	const totalEdges = $session.edgeEvents.length;
	const completedEdges = $session.edgeEvents.filter((e) => e.outcome);
	const avgEdgeDuration =
		completedEdges.length > 0
			? completedEdges.reduce((sum, e) => sum + (e.durationSeconds ?? 0), 0) / completedEdges.length
			: 0;

	return {
		totalEdges,
		successfulEdges,
		ejaculatedEdges,
		avgEdgeDuration: Math.round(avgEdgeDuration)
	};
});
