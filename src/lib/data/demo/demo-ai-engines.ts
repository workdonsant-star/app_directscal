import type { DemoAiAssignments, DemoAiEngine, DemoState } from "./demo-state";

export const demoAiProviders = [
  { id: "anthropic", name: "Anthropic", description: "Modelos Claude para as etapas do agente." },
  { id: "openai", name: "OpenAI", description: "Modelos OpenAI para as etapas do agente." },
  { id: "google", name: "Google", description: "Modelos Gemini para as etapas do agente." },
] as const;

export const emptyDemoAiAssignments: DemoAiAssignments = { planner: null, conductor: null, classifier: null };

function keepAvailableAssignments(assignments: DemoAiAssignments, engines: DemoAiEngine[]): DemoAiAssignments {
  const available = new Set(engines.filter(engine => engine.enabled).map(engine => engine.id));
  return {
    planner: assignments.planner && available.has(assignments.planner) ? assignments.planner : null,
    conductor: assignments.conductor && available.has(assignments.conductor) ? assignments.conductor : null,
    classifier: assignments.classifier && available.has(assignments.classifier) ? assignments.classifier : null,
  };
}

export function saveDemoAiEngine(state: DemoState, engine: DemoAiEngine): DemoState {
  const engines = [...(state.adminAiEngines ?? []).filter(item => item.id !== engine.id), engine];
  return { ...state, adminAiEngines: engines, adminAiAssignments: keepAvailableAssignments(state.adminAiAssignments ?? emptyDemoAiAssignments, engines) };
}

export function removeDemoAiEngine(state: DemoState, id: string): DemoState {
  const engines = (state.adminAiEngines ?? []).filter(item => item.id !== id);
  return { ...state, adminAiEngines: engines, adminAiAssignments: keepAvailableAssignments(state.adminAiAssignments ?? emptyDemoAiAssignments, engines) };
}

export function assignDemoAiEngine(state: DemoState, role: keyof DemoAiAssignments, id: string | null): DemoState {
  if (id && !(state.adminAiEngines ?? []).some(engine => engine.id === id && engine.enabled)) return state;
  return { ...state, adminAiAssignments: { ...(state.adminAiAssignments ?? emptyDemoAiAssignments), [role]: id } };
}
