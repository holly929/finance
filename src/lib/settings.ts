

import { store } from './store';

// This is an in-memory store for settings.
// It will be reset every time the application restarts.
// For persistence, this would be replaced by a database or a remote config service.
export const inMemorySettings: { [key: string]: any } = store.settings;
