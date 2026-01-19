<script lang="ts">
	import { levels } from '$lib/levels';
	import type { Settings, Session, LevelProgress } from '$lib/types';
	import { progressStore, getProgressPercent, getMasteryDetails } from '$lib/stores/progress';

	let settings = $state<Settings>({
		currentLevel: 1,
		arousalCheckInterval: 45
	});
	let sessions = $state<Session[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let saved = $state(false);
	let showLockedWarning = $state<number | null>(null);
	let showResetConfirm = $state(false);
	let resetting = $state(false);

	async function loadData() {
		try {
			const [settingsRes, sessionsRes] = await Promise.all([
				fetch('/api/settings'),
				fetch('/api/sessions')
			]);
			if (settingsRes.ok) {
				settings = await settingsRes.json();
			}
			if (sessionsRes.ok) {
				sessions = await sessionsRes.json();
				progressStore.loadFromSessions(sessions);
			}
		} catch {
			// Use defaults
		} finally {
			loading = false;
		}
	}

	async function saveSettings() {
		saving = true;
		saved = false;
		try {
			await fetch('/api/settings', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(settings)
			});
			saved = true;
			setTimeout(() => (saved = false), 2000);
		} catch {
			// Handle error
		} finally {
			saving = false;
		}
	}

	function selectLevel(levelId: number, progress: LevelProgress) {
		if (!progress.unlocked) {
			showLockedWarning = levelId;
			setTimeout(() => showLockedWarning = null, 3000);
			return;
		}
		settings.currentLevel = levelId;
		saveSettings();
	}

	function forceSelectLevel(levelId: number) {
		settings.currentLevel = levelId;
		showLockedWarning = null;
		saveSettings();
	}

	$effect(() => {
		loadData();
	});

	function getProgressForLevel(levelId: number): LevelProgress {
		const progress = $progressStore.find(p => p.level === levelId);
		return progress ?? {
			level: levelId,
			sessionsAtLevel: 0,
			totalMinutesAtLevel: 0,
			totalEdgesAtLevel: 0,
			totalClimaxesAtLevel: 0,
			climaxRate: 0,
			unlocked: levelId === 1,
			mastered: false
		};
	}

	async function resetAllProgress() {
		resetting = true;
		try {
			await fetch('/api/sessions', { method: 'DELETE' });
			settings.currentLevel = 1;
			await saveSettings();
			sessions = [];
			progressStore.loadFromSessions([]);
			showResetConfirm = false;
		} catch {
			// Handle error
		} finally {
			resetting = false;
		}
	}
</script>

<svelte:head>
	<title>Settings - MMO Trainer</title>
</svelte:head>

<div class="p-4 max-w-lg mx-auto">
	<h1 class="text-2xl font-bold text-white mb-6">Settings</h1>

	{#if loading}
		<div class="text-center text-slate-400 py-8">Loading...</div>
	{:else}
		<div class="space-y-6">
			<section>
				<h2 class="text-lg font-bold text-white mb-3">Training Level</h2>
				<div class="space-y-3">
					{#each levels as level}
						{@const progress = getProgressForLevel(level.id)}
						{@const progressPercent = getProgressPercent(progress, level.id)}
						{@const details = getMasteryDetails(progress, level.id)}
						<button
							onclick={() => selectLevel(level.id, progress)}
							class="w-full text-left p-4 rounded-xl transition-all relative overflow-hidden {settings.currentLevel === level.id
								? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/20'
								: progress.unlocked
									? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
									: 'bg-slate-800/50 text-slate-500'}"
						>
							{#if !progress.unlocked}
								<div class="absolute top-2 right-2">
									<svg class="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
									</svg>
								</div>
							{/if}
							
							<div class="flex justify-between items-start">
								<div class="flex-1">
									<div class="flex items-center gap-2">
										<span class="font-bold">Level {level.id}: {level.name}</span>
										{#if progress.mastered}
											<span class="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">
												MASTERED
											</span>
										{/if}
									</div>
									<div class="text-sm opacity-80">{level.description}</div>
								</div>
								{#if settings.currentLevel === level.id}
									<svg class="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
									</svg>
								{/if}
							</div>

							<div class="mt-2 text-xs opacity-70 flex gap-4">
								<span>Stroke: {level.strokeSeconds / 60}min</span>
								<span>Rest: {level.restSeconds}s</span>
							</div>

							{#if !progress.mastered}
								<div class="mt-3">
									<div class="flex justify-between text-xs mb-1">
										<span class="opacity-70">Mastery Progress</span>
										<span class="font-bold">{progressPercent}%</span>
									</div>
									<div class="h-2 bg-slate-700/50 rounded-full overflow-hidden">
										<div 
											class="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full transition-all duration-500"
											style="width: {progressPercent}%"
										></div>
									</div>
									<div class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
										<div class="flex justify-between">
											<span class="opacity-60">Sessions</span>
											<span class="{details.sessions.met ? 'text-green-400' : ''}">{details.sessions.current}/{details.sessions.required}</span>
										</div>
										<div class="flex justify-between">
											<span class="opacity-60">Minutes</span>
											<span class="{details.minutes.met ? 'text-green-400' : ''}">{details.minutes.current}/{details.minutes.required}</span>
										</div>
										<div class="flex justify-between">
											<span class="opacity-60">Edges</span>
											<span class="{details.edges.met ? 'text-green-400' : ''}">{details.edges.current}/{details.edges.required}</span>
										</div>
										{#if level.requirements.minClimaxRate > 0}
											<div class="flex justify-between">
												<span class="opacity-60">Climax Rate</span>
												<span class="{details.climaxRate.met ? 'text-green-400' : ''}">{details.climaxRate.current}%/{details.climaxRate.required}%</span>
											</div>
										{/if}
									</div>
								</div>
							{/if}
						</button>

						{#if showLockedWarning === level.id}
							<div class="bg-amber-500/20 border border-amber-500/50 rounded-xl p-3 text-sm">
								<p class="text-amber-400 mb-2">This level is locked. Master the previous level first to unlock it.</p>
								<button
									onclick={() => forceSelectLevel(level.id)}
									class="text-amber-400 underline hover:text-amber-300"
								>
									Select anyway (not recommended)
								</button>
							</div>
						{/if}
					{/each}
				</div>
			</section>

			{#if saved}
				<div class="text-center text-purple-400 text-sm">Settings saved!</div>
			{/if}

			<section class="pt-6 border-t border-slate-700">
				<h2 class="text-lg font-bold text-white mb-3">Danger Zone</h2>
				{#if !showResetConfirm}
					<button
						onclick={() => showResetConfirm = true}
						class="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors text-left"
					>
						<div class="font-bold">Reset All Progress</div>
						<div class="text-sm opacity-80">Delete all sessions and start fresh from Level 1</div>
					</button>
				{:else}
					<div class="p-4 rounded-xl bg-red-500/20 border border-red-500/50 space-y-3">
						<p class="text-red-400 font-bold">Are you sure?</p>
						<p class="text-sm text-red-300/80">This will permanently delete all {sessions.length} sessions and reset your progress. This cannot be undone.</p>
						<div class="flex gap-3">
							<button
								onclick={resetAllProgress}
								disabled={resetting}
								class="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white font-bold hover:bg-red-500 transition-colors disabled:opacity-50"
							>
								{resetting ? 'Resetting...' : 'Yes, Reset Everything'}
							</button>
							<button
								onclick={() => showResetConfirm = false}
								class="flex-1 py-2 px-4 rounded-lg bg-slate-700 text-slate-300 font-bold hover:bg-slate-600 transition-colors"
							>
								Cancel
							</button>
						</div>
					</div>
				{/if}
			</section>
		</div>
	{/if}
</div>
