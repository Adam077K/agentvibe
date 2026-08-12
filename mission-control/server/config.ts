// config.ts — the one place Mission Control's network surface is decided.
//
// Loopback-only by construction: HOST is a literal, not read from the environment,
// so there is no MC_HOST override that could push this onto 0.0.0.0. PORT stays
// overridable (MC_PORT) because a developer running two instances needs that; the
// host binding does not have an equivalent legitimate reason to change.
//
// 4200/4201 belong to the old dashboard (war-room/dashboard/) — this project does
// not read or import that one, so the ports must not collide with it either.

export const HOST = '127.0.0.1';
export const PORT = Number(process.env.MC_PORT || 4300);
export const CLIENT_PORT = 4301;
