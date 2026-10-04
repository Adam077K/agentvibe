// Fixture: a Userland script opening the Journal directly. Must fail.
import { homedir } from 'node:os';
import { join } from 'node:path';

const path = join(homedir(), '.agentvibe', 'kernel', 'journal.db');
export default path;
