import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Session, Settings } from '$lib/types';

const DATA_DIR = '/app/data';
const SESSIONS_DIR = join(DATA_DIR, 'sessions');
const SETTINGS_FILE = join(DATA_DIR, 'settings.json');

async function ensureDir(dir: string) {
	if (!existsSync(dir)) {
		await mkdir(dir, { recursive: true });
	}
}

export async function getAllSessions(): Promise<Session[]> {
	await ensureDir(SESSIONS_DIR);
	const files = await readdir(SESSIONS_DIR);
	const sessions: Session[] = [];

	for (const file of files) {
		if (file.endsWith('.json')) {
			const content = await readFile(join(SESSIONS_DIR, file), 'utf-8');
			sessions.push(JSON.parse(content));
		}
	}

	return sessions.sort(
		(a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
	);
}

export async function getSession(id: string): Promise<Session | null> {
	const filePath = join(SESSIONS_DIR, `${id}.json`);
	if (!existsSync(filePath)) {
		return null;
	}
	const content = await readFile(filePath, 'utf-8');
	return JSON.parse(content);
}

export async function saveSession(session: Session): Promise<void> {
	await ensureDir(SESSIONS_DIR);
	const filePath = join(SESSIONS_DIR, `${session.id}.json`);
	await writeFile(filePath, JSON.stringify(session, null, 2));
}

export async function getSettings(): Promise<Settings> {
	await ensureDir(DATA_DIR);
	if (!existsSync(SETTINGS_FILE)) {
		const defaults: Settings = {
			currentLevel: 1,
			arousalCheckInterval: 45
		};
		await writeFile(SETTINGS_FILE, JSON.stringify(defaults, null, 2));
		return defaults;
	}
	const content = await readFile(SETTINGS_FILE, 'utf-8');
	return JSON.parse(content);
}

export async function saveSettings(settings: Settings): Promise<void> {
	await ensureDir(DATA_DIR);
	await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

export async function deleteSession(id: string): Promise<boolean> {
	const filePath = join(SESSIONS_DIR, `${id}.json`);
	if (!existsSync(filePath)) {
		return false;
	}
	const { unlink } = await import('fs/promises');
	await unlink(filePath);
	return true;
}

export async function clearAllSessions(): Promise<void> {
	await ensureDir(SESSIONS_DIR);
	const files = await readdir(SESSIONS_DIR);
	const { unlink } = await import('fs/promises');
	for (const file of files) {
		if (file.endsWith('.json')) {
			await unlink(join(SESSIONS_DIR, file));
		}
	}
}
