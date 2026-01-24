import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSession, saveSession, deleteSession } from '$lib/server/storage';
import type { Session } from '$lib/types';

export const GET: RequestHandler = async ({ params }) => {
	const session = await getSession(params.id);
	if (!session) {
		throw error(404, 'Session not found');
	}
	return json(session);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const existing = await getSession(params.id);
	if (!existing) {
		throw error(404, 'Session not found');
	}
	const session: Session = await request.json();
	await saveSession(session);
	return json(session);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const deleted = await deleteSession(params.id);
	if (!deleted) {
		throw error(404, 'Session not found');
	}
	return new Response(null, { status: 204 });
};
