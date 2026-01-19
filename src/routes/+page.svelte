<script lang="ts">
	import type { Session, SessionStats, Settings, LevelProgress } from '$lib/types';
	import { getLevelById, levels } from '$lib/levels';
	import { progressStore, getProgressPercent, getMasteryDetails } from '$lib/stores/progress';

	let sessions = $state<Session[]>([]);
	let stats = $state<SessionStats | null>(null);
	let settings = $state<Settings | null>(null);
	let loading = $state(true);

	async function loadData() {
		try {
			const [sessionsRes, settingsRes] = await Promise.all([
				fetch('/api/sessions'),
				fetch('/api/settings')
			]);
			if (sessionsRes.ok) {
				sessions = await sessionsRes.json();
				stats = calculateStats(sessions);
				progressStore.loadFromSessions(sessions);
			}
			if (settingsRes.ok) {
				settings = await settingsRes.json();
			}
		} catch {
			// Handle error
		} finally {
			loading = false;
		}
	}

	function calculateStats(sessions: Session[]): SessionStats {
		const allEdges = sessions.flatMap((s) => s.edgeEvents);
		const completedEdges = allEdges.filter((e) => e.outcome);
		const successfulEdges = allEdges.filter((e) => e.outcome === 'climax');

		const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationSeconds ?? 0) / 60, 0);
		const avgEdgeDuration =
			completedEdges.length > 0
				? completedEdges.reduce((sum, e) => sum + (e.durationSeconds ?? 0), 0) /
					completedEdges.length
				: 0;
		const longestEdge = Math.max(...completedEdges.map((e) => e.durationSeconds ?? 0), 0);

		return {
			totalSessions: sessions.length,
			totalEdges: allEdges.length,
			successfulEdges: successfulEdges.length,
			totalTrainingMinutes: Math.round(totalMinutes),
			averageEdgeDuration: Math.round(avgEdgeDuration),
			longestEdge
		};
	}

	function formatDuration(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		if (mins === 0) return `${secs}s`;
		return `${mins}m ${secs}s`;
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}

	$effect(() => {
		loadData();
	});

	const currentLevel = $derived(settings ? getLevelById(settings.currentLevel) : levels[0]);
	
	function getCurrentProgress(): LevelProgress {
		const levelId = settings?.currentLevel ?? 1;
		const progress = $progressStore.find(p => p.level === levelId);
		return progress ?? {
			level: levelId,
			sessionsAtLevel: 0,
			totalMinutesAtLevel: 0,
			totalEdgesAtLevel: 0,
			totalClimaxesAtLevel: 0,
			climaxRate: 0,
			unlocked: true,
			mastered: false
		};
	}

	function getNextMilestone(progress: LevelProgress): string {
		const level = getLevelById(progress.level);
		if (!level || !level.requirements) return 'Keep training!';
		
		const details = getMasteryDetails(progress, progress.level);
		
		if (!details.sessions.met) {
			const remaining = details.sessions.required - details.sessions.current;
			return `${remaining} more session${remaining === 1 ? '' : 's'} to master`;
		}
		if (!details.minutes.met) {
			const remaining = details.minutes.required - details.minutes.current;
			return `${remaining} more minute${remaining === 1 ? '' : 's'} to master`;
		}
		if (!details.edges.met) {
			const remaining = details.edges.required - details.edges.current;
			return `${remaining} more edge${remaining === 1 ? '' : 's'} to master`;
		}
		if (!details.climaxes.met) {
			const remaining = details.climaxes.required - details.climaxes.current;
			return `${remaining} more climax${remaining === 1 ? '' : 'es'} to master`;
		}
		if (level.requirements.minClimaxRate > 0 && !details.climaxRate.met) {
			return `Reach ${details.climaxRate.required}% climax rate`;
		}
		return 'Level mastered!';
	}
</script>

<svelte:head>
	<title>MMO Trainer</title>
</svelte:head>

<div class="p-4 max-w-lg mx-auto">
	<div class="text-center pt-4 pb-6">
		<h1 class="text-3xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">MMO Trainer</h1>
		<p class="text-slate-400 mt-1">Stamina Training</p>
	</div>

	{#if loading}
		<div class="text-center text-slate-400 py-8">Loading...</div>
	{:else if stats}
		{@const progress = getCurrentProgress()}
		{@const progressPercent = getProgressPercent(progress, progress.level)}
		{@const milestone = getNextMilestone(progress)}
		<div class="space-y-4">
			<div class="bg-gradient-to-r from-purple-900/50 to-violet-900/50 border border-purple-500/30 rounded-2xl p-4">
				<div class="flex items-center justify-between mb-2">
					<div>
						<div class="text-sm text-purple-300">Current Level</div>
						<div class="text-xl font-bold text-white">
							Level {currentLevel.id}: {currentLevel.name}
							{#if progress.mastered}
								<span class="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full align-middle">
									MASTERED
								</span>
							{/if}
						</div>
					</div>
					<div class="text-right">
						<div class="text-3xl font-bold text-purple-400">{progressPercent}%</div>
					</div>
				</div>
				<div class="h-3 bg-slate-800 rounded-full overflow-hidden">
					<div 
						class="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full transition-all duration-500"
						style="width: {progressPercent}%"
					></div>
				</div>
				<div class="mt-2 text-sm text-purple-300/80">{milestone}</div>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div class="bg-slate-800/80 rounded-xl p-4 text-center">
					<div class="text-3xl font-bold text-white">{stats.totalSessions}</div>
					<div class="text-sm text-slate-400">Sessions</div>
				</div>
				<div class="bg-slate-800/80 rounded-xl p-4 text-center">
					<div class="text-3xl font-bold text-white">{stats.totalTrainingMinutes}</div>
					<div class="text-sm text-slate-400">Minutes</div>
				</div>
			</div>

			<div class="grid grid-cols-3 gap-3">
				<div class="bg-slate-800/80 rounded-xl p-4 text-center">
					<div class="text-2xl font-bold text-amber-500">{stats.totalEdges}</div>
					<div class="text-xs text-slate-400">Total Edges</div>
				</div>
				<div class="bg-slate-800/80 rounded-xl p-4 text-center">
					<div class="text-2xl font-bold text-green-500">{stats.successfulEdges}</div>
					<div class="text-xs text-slate-400">Climaxes</div>
				</div>
				<div class="bg-slate-800/80 rounded-xl p-4 text-center">
					<div class="text-2xl font-bold text-purple-400">
						{stats.totalEdges > 0
							? Math.round((stats.successfulEdges / stats.totalEdges) * 100)
							: 0}%
					</div>
					<div class="text-xs text-slate-400">Climax Rate</div>
				</div>
			</div>

			{#if stats.averageEdgeDuration > 0}
				<div class="bg-slate-800/80 rounded-xl p-4">
					<div class="flex justify-between items-center">
						<span class="text-slate-400">Avg Edge Duration</span>
						<span class="text-white font-bold">{formatDuration(stats.averageEdgeDuration)}</span>
					</div>
					<div class="flex justify-between items-center mt-2">
						<span class="text-slate-400">Longest Edge</span>
						<span class="text-white font-bold">{formatDuration(stats.longestEdge)}</span>
					</div>
				</div>
			{/if}

			{#if sessions.length > 0}
				<div class="pt-4">
					<h2 class="text-lg font-bold text-white mb-3">Recent Sessions</h2>
					<div class="space-y-2">
						{#each sessions.slice(0, 3) as session}
							<a
								href="/history"
								class="block bg-slate-800/80 rounded-xl p-4 hover:bg-slate-700 transition-colors"
							>
								<div class="flex justify-between items-center">
									<span class="text-white">{formatDate(session.startTime)}</span>
									<span class="text-slate-400">
										{session.durationSeconds ? formatDuration(session.durationSeconds) : '-'}
									</span>
								</div>
								<div class="flex gap-4 mt-1 text-sm">
									<span class="text-amber-500">{session.edgeEvents.length} edges</span>
									<span class="text-green-500">
										{session.edgeEvents.filter((e) => e.outcome === 'climax').length} climax
									</span>
								</div>
							</a>
						{/each}
					</div>
				</div>
			{/if}

		<a
			href="/train"
			class="block w-full py-5 px-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 active:from-purple-700 active:to-violet-700 text-white font-bold text-xl text-center rounded-2xl transition-all shadow-lg shadow-purple-500/20 mt-6"
		>
			START TRAINING
		</a>
		</div>
	{:else}
		<div class="text-center space-y-6 py-8">
			<p class="text-slate-400">No sessions yet. Start your first training!</p>
			<a
				href="/train"
				class="block w-full py-5 px-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 active:from-purple-700 active:to-violet-700 text-white font-bold text-xl text-center rounded-2xl transition-all shadow-lg shadow-purple-500/20"
			>
				START TRAINING
			</a>
		</div>
	{/if}
</div>
