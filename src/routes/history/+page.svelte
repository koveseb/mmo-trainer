<script lang="ts">
	import type { Session, ArousalReading } from '$lib/types';
	import { getLevelById } from '$lib/levels';

	let sessions = $state<Session[]>([]);
	let loading = $state(true);
	let selectedSession = $state<Session | null>(null);
	let deleting = $state(false);
	let activeTab = $state<'sessions' | 'insights'>('sessions');

	interface ArousalTiming {
		level: number;
		avgSecondsToReach: number;
		occurrences: number;
		trend: 'improving' | 'stable' | 'declining' | 'unknown';
	}

	const arousalInsights = $derived.by(() => {
		const sessionsWithReadings = sessions.filter(s => s.arousalReadings && s.arousalReadings.length > 0);
		if (sessionsWithReadings.length === 0) return null;

		const timingsByLevel: Map<number, number[]> = new Map();
		
		for (const session of sessionsWithReadings) {
			const sessionStart = new Date(session.startTime).getTime();
			
			for (const reading of session.arousalReadings) {
				const readingTime = new Date(reading.timestamp).getTime();
				const secondsIntoSession = Math.floor((readingTime - sessionStart) / 1000);
				
				if (!timingsByLevel.has(reading.value)) {
					timingsByLevel.set(reading.value, []);
				}
				timingsByLevel.get(reading.value)!.push(secondsIntoSession);
			}
		}

		const timings: ArousalTiming[] = [];
		for (let level = 1; level <= 10; level++) {
			const times = timingsByLevel.get(level) ?? [];
			if (times.length === 0) continue;

			const avgSeconds = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
			
			let trend: ArousalTiming['trend'] = 'unknown';
			if (times.length >= 3) {
				const recentHalf = times.slice(-Math.ceil(times.length / 2));
				const olderHalf = times.slice(0, Math.floor(times.length / 2));
				const recentAvg = recentHalf.reduce((a, b) => a + b, 0) / recentHalf.length;
				const olderAvg = olderHalf.reduce((a, b) => a + b, 0) / olderHalf.length;
				const diff = ((recentAvg - olderAvg) / olderAvg) * 100;
				
				if (diff > 10) trend = 'improving';
				else if (diff < -10) trend = 'declining';
				else trend = 'stable';
			}

			timings.push({
				level,
				avgSecondsToReach: avgSeconds,
				occurrences: times.length,
				trend
			});
		}

		const recentSessions = sessionsWithReadings.slice(0, 10);
		const arousalOverTime: { sessionDate: string; avgArousal: number; maxArousal: number }[] = [];
		for (const session of recentSessions) {
			if (session.arousalReadings.length === 0) continue;
			const avg = session.arousalReadings.reduce((sum, r) => sum + r.value, 0) / session.arousalReadings.length;
			const max = Math.max(...session.arousalReadings.map(r => r.value));
			arousalOverTime.push({
				sessionDate: new Date(session.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
				avgArousal: Math.round(avg * 10) / 10,
				maxArousal: max
			});
		}

		return {
			totalReadings: sessionsWithReadings.reduce((sum, s) => sum + s.arousalReadings.length, 0),
			sessionsWithData: sessionsWithReadings.length,
			timings: timings.sort((a, b) => a.level - b.level),
			arousalOverTime: arousalOverTime.reverse()
		};
	});

	async function loadSessions() {
		try {
			const res = await fetch('/api/sessions');
			if (res.ok) {
				sessions = await res.json();
			}
		} catch {
			// Handle error
		} finally {
			loading = false;
		}
	}

	async function deleteSession(session: Session) {
		if (!confirm('Delete this session?')) return;

		deleting = true;
		try {
			const res = await fetch(`/api/sessions/${session.id}`, { method: 'DELETE' });
			if (res.ok) {
				sessions = sessions.filter((s) => s.id !== session.id);
				selectedSession = null;
			}
		} finally {
			deleting = false;
		}
	}

	function formatDuration(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		if (mins === 0) return `${secs}s`;
		return `${mins}m ${secs}s`;
	}

	function formatDateTime(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function formatTime(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	$effect(() => {
		loadSessions();
	});
</script>

<svelte:head>
	<title>History - MMO Trainer</title>
</svelte:head>

<div class="p-4 max-w-lg mx-auto">
	<h1 class="text-2xl font-bold text-white mb-4">History</h1>

	<div class="flex gap-2 mb-4">
		<button
			onclick={() => activeTab = 'sessions'}
			class="flex-1 py-2 px-4 rounded-lg font-bold transition-colors {activeTab === 'sessions' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}"
		>
			Sessions
		</button>
		<button
			onclick={() => activeTab = 'insights'}
			class="flex-1 py-2 px-4 rounded-lg font-bold transition-colors {activeTab === 'insights' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}"
		>
			Arousal Insights
		</button>
	</div>

	{#if loading}
		<div class="text-center text-slate-400 py-8">Loading...</div>
	{:else if activeTab === 'sessions'}
		{#if sessions.length === 0}
			<div class="text-center text-slate-400 py-8">
				<p>No sessions yet.</p>
				<a href="/train" class="text-purple-500 hover:text-purple-400 mt-2 inline-block">
					Start your first training
				</a>
			</div>
		{:else}
			<div class="space-y-3">
				{#each sessions as session}
					<button
						onclick={() => (selectedSession = session)}
						class="w-full text-left bg-slate-800 rounded-xl p-4 hover:bg-slate-700 transition-colors"
					>
						<div class="flex justify-between items-start">
							<div>
								<div class="text-white font-medium">{formatDateTime(session.startTime)}</div>
								<div class="text-sm text-slate-400 mt-1">
									Level {session.level} - {getLevelById(session.level).name}
								</div>
							</div>
							<div class="text-right">
								<div class="text-slate-300">
									{session.durationSeconds ? formatDuration(session.durationSeconds) : '-'}
								</div>
							</div>
						</div>
						<div class="flex gap-4 mt-2 text-sm">
							<span class="text-amber-500">{session.edgeEvents.length} edges</span>
							<span class="text-green-500">
								{session.edgeEvents.filter((e) => e.outcome === 'climax').length} climax
							</span>
							<span class="text-red-500">
								{session.edgeEvents.filter((e) => e.outcome === 'ejaculated').length} ejaculated
							</span>
						</div>
					</button>
				{/each}
			</div>
		{/if}
	{:else if activeTab === 'insights'}
		{#if !arousalInsights}
			<div class="text-center text-slate-400 py-8">
				<p>No arousal data yet.</p>
				<p class="text-sm mt-2">Complete sessions with arousal checks enabled to see insights.</p>
			</div>
		{:else}
			<div class="space-y-6">
				<div class="grid grid-cols-2 gap-3">
					<div class="bg-slate-800 rounded-xl p-4 text-center">
						<div class="text-2xl font-bold text-purple-400">{arousalInsights.totalReadings}</div>
						<div class="text-xs text-slate-400">Total Readings</div>
					</div>
					<div class="bg-slate-800 rounded-xl p-4 text-center">
						<div class="text-2xl font-bold text-purple-400">{arousalInsights.sessionsWithData}</div>
						<div class="text-xs text-slate-400">Sessions with Data</div>
					</div>
				</div>

				<section>
					<h2 class="text-lg font-bold text-white mb-3">Time to Reach Each Level</h2>
					<p class="text-sm text-slate-400 mb-3">Average time into session when you first report each arousal level.</p>
					<div class="space-y-2">
						{#each arousalInsights.timings as timing}
							<div class="bg-slate-800 rounded-xl p-3">
								<div class="flex items-center justify-between mb-2">
									<div class="flex items-center gap-3">
										<span class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white
											{timing.level <= 3 ? 'bg-green-600' : ''}
											{timing.level >= 4 && timing.level <= 6 ? 'bg-yellow-600' : ''}
											{timing.level >= 7 && timing.level <= 8 ? 'bg-orange-600' : ''}
											{timing.level >= 9 ? 'bg-red-600' : ''}">
											{timing.level}
										</span>
										<div>
											<div class="text-white font-medium">{formatDuration(timing.avgSecondsToReach)}</div>
											<div class="text-xs text-slate-500">{timing.occurrences} readings</div>
										</div>
									</div>
									<div class="text-sm">
										{#if timing.trend === 'improving'}
											<span class="text-green-400 flex items-center gap-1">
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
												</svg>
												Slower
											</span>
										{:else if timing.trend === 'declining'}
											<span class="text-red-400 flex items-center gap-1">
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
												</svg>
												Faster
											</span>
										{:else if timing.trend === 'stable'}
											<span class="text-slate-400 flex items-center gap-1">
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14" />
												</svg>
												Stable
											</span>
										{/if}
									</div>
								</div>
								<div class="h-2 bg-slate-700 rounded-full overflow-hidden">
									<div 
										class="h-full rounded-full transition-all
											{timing.level <= 3 ? 'bg-green-500' : ''}
											{timing.level >= 4 && timing.level <= 6 ? 'bg-yellow-500' : ''}
											{timing.level >= 7 && timing.level <= 8 ? 'bg-orange-500' : ''}
											{timing.level >= 9 ? 'bg-red-500' : ''}"
										style="width: {Math.min(100, (timing.avgSecondsToReach / 1800) * 100)}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				</section>

				{#if arousalInsights.arousalOverTime.length > 1}
					<section>
						<h2 class="text-lg font-bold text-white mb-3">Recent Sessions</h2>
						<div class="bg-slate-800 rounded-xl p-4">
							<div class="flex items-end justify-between gap-1 h-32">
								{#each arousalInsights.arousalOverTime as data}
									<div class="flex-1 flex flex-col items-center gap-1">
										<div class="w-full flex flex-col items-center gap-0.5">
											<div 
												class="w-full bg-red-500/50 rounded-t"
												style="height: {data.maxArousal * 10}px"
												title="Max: {data.maxArousal}"
											></div>
										</div>
										<div class="text-xs text-slate-500 truncate w-full text-center">{data.sessionDate}</div>
									</div>
								{/each}
							</div>
							<div class="flex justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-700">
								<span>Max arousal per session</span>
								<span>Last {arousalInsights.arousalOverTime.length} sessions</span>
							</div>
						</div>
					</section>
				{/if}
			</div>
		{/if}
	{/if}
</div>

{#if selectedSession}
	<div class="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-4 z-50">
		<div class="bg-slate-800 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
			<div class="flex justify-between items-start mb-4">
				<h2 class="text-xl font-bold text-white">Session Details</h2>
				<div class="flex items-center gap-2">
					<button
						onclick={() => deleteSession(selectedSession!)}
						disabled={deleting}
						class="text-red-400 hover:text-red-300 p-1 disabled:opacity-50"
						aria-label="Delete session"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
					</button>
					<button
						onclick={() => (selectedSession = null)}
						class="text-slate-400 hover:text-white p-1"
						aria-label="Close"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			</div>

			<div class="space-y-4">
				<div class="bg-slate-700 rounded-xl p-3">
					<div class="text-sm text-slate-400">Date & Time</div>
					<div class="text-white">{formatDateTime(selectedSession.startTime)}</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div class="bg-slate-700 rounded-xl p-3">
						<div class="text-sm text-slate-400">Duration</div>
						<div class="text-white font-bold">
							{selectedSession.durationSeconds
								? formatDuration(selectedSession.durationSeconds)
								: '-'}
						</div>
					</div>
					<div class="bg-slate-700 rounded-xl p-3">
						<div class="text-sm text-slate-400">Level</div>
						<div class="text-white font-bold">
							{selectedSession.level} - {getLevelById(selectedSession.level).name}
						</div>
					</div>
				</div>

				<div class="grid grid-cols-3 gap-2">
					<div class="bg-slate-700 rounded-xl p-3 text-center">
						<div class="text-xl font-bold text-amber-500">{selectedSession.edgeEvents.length}</div>
						<div class="text-xs text-slate-400">Edges</div>
					</div>
					<div class="bg-slate-700 rounded-xl p-3 text-center">
						<div class="text-xl font-bold text-green-500">
							{selectedSession.edgeEvents.filter((e) => e.outcome === 'climax').length}
						</div>
						<div class="text-xs text-slate-400">Climax</div>
					</div>
					<div class="bg-slate-700 rounded-xl p-3 text-center">
						<div class="text-xl font-bold text-red-500">
							{selectedSession.edgeEvents.filter((e) => e.outcome === 'ejaculated').length}
						</div>
						<div class="text-xs text-slate-400">Ejaculated</div>
					</div>
				</div>

				{#if selectedSession.edgeEvents.length > 0}
					<div>
						<h3 class="text-sm font-bold text-slate-400 mb-2">Edge Events</h3>
						<div class="space-y-2">
							{#each selectedSession.edgeEvents as edge, i}
								<div class="bg-slate-700 rounded-lg p-3 flex justify-between items-center">
									<div>
										<span class="text-white">Edge #{i + 1}</span>
										<span class="text-slate-400 text-sm ml-2">
											{formatTime(edge.startTime)}
										</span>
									</div>
									<div class="flex items-center gap-2">
										{#if edge.durationSeconds}
											<span class="text-slate-300 text-sm">
												{formatDuration(edge.durationSeconds)}
											</span>
										{/if}
										{#if edge.outcome === 'climax'}
											<span
												class="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-bold"
											>
												CLIMAX
											</span>
										{:else if edge.outcome === 'ejaculated'}
											<span class="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold">
												EJACULATED
											</span>
										{:else}
											<span
												class="bg-slate-600 text-slate-300 text-xs px-2 py-1 rounded-full font-bold"
											>
												INCOMPLETE
											</span>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
