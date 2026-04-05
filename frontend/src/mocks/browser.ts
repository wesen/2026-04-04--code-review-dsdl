import { setupWorker } from 'msw/browser';
import { packageHandlers } from './handlers';

export const worker = setupWorker(...packageHandlers);
