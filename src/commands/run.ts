import { startOrchestrator } from '../orchestrator';

export async function run(): Promise<void> {
  await startOrchestrator();
}
