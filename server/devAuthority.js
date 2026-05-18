const DEFAULT_DURATION_SECONDS = 180;
const MAX_SERVER_ELAPSED_MS = Number(process.env.DEV_SERVER_MAX_ELAPSED_MS || 6 * 60 * 60 * 1000);

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function clampNumber(value, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function sameProject(a, b) {
  return Boolean(isPlainObject(a) && isPlainObject(b) && a.id && b.id && String(a.id) === String(b.id));
}

function researchHas(data, id) {
  return safeArray(data?.unlockedResearchIds).includes(id);
}

function studioMomentumRatio(data) {
  return clampNumber((Number(data?.studioXp) || 0) / 1200, 0, 1);
}

function releaseVelocityBoost(data) {
  return Math.min(0.32, Math.log1p(Math.max(0, Number(data?.gamesReleased) || 0)) * 0.045);
}

function studioLevelSpeedBoost(data) {
  return Math.max(0, Math.floor(Number(data?.level) || 1) - 1) * 0.07;
}

function developmentSpeedMultiplier(data) {
  const employees = safeArray(data?.employees);
  const employeeBoost = employees.reduce((sum, employee) => sum + (Number(employee?.speedBoost) || 0), 0);
  const researchBoost =
    (researchHas(data, 'fast-prototype') ? 0.1 : 0) +
    (researchHas(data, 'engine-v2') ? 0.15 : 0) +
    (researchHas(data, 'ai-assist') ? 0.12 : 0);
  const synergy = researchHas(data, 'team-synergy') ? employees.length * 0.025 : 0;
  const momentum = 1 + studioMomentumRatio(data) * 0.25;
  return clampNumber((1 + employeeBoost + researchBoost + synergy + releaseVelocityBoost(data) + studioLevelSpeedBoost(data)) * momentum, 0.55, 3.75);
}

function earliestStartedAt(currentProject, previousProject) {
  const currentStartedAt = Number(currentProject?.startedAt) || 0;
  const previousStartedAt = Number(previousProject?.startedAt) || 0;
  if (currentStartedAt && previousStartedAt) return Math.min(currentStartedAt, previousStartedAt);
  return currentStartedAt || previousStartedAt || 0;
}

export function mergeServerDevelopment(incomingData, previousData) {
  if (!isPlainObject(incomingData)) return incomingData;
  const incomingProject = incomingData.selectedProject;
  const previousProject = previousData?.selectedProject;

  if (!sameProject(incomingProject, previousProject)) return incomingData;

  const incomingProgress = clampNumber(incomingProject.progress, 0, 100);
  const previousProgress = clampNumber(previousProject.progress, 0, 100);
  const progress = Number(Math.max(incomingProgress, previousProgress).toFixed(2));
  const startedAt = earliestStartedAt(incomingProject, previousProject);

  return {
    ...incomingData,
    selectedProject: {
      ...incomingProject,
      startedAt,
      progress,
      durationSeconds: clampNumber(incomingProject.durationSeconds || previousProject.durationSeconds, 1, 900),
    },
  };
}

export function normalizeServerDevelopment(data, previousData = null) {
  if (!isPlainObject(data)) return data;
  const project = data.selectedProject;
  if (!isPlainObject(project)) return data;

  const previousProject = sameProject(project, previousData?.selectedProject) ? previousData.selectedProject : null;
  const startedAt = earliestStartedAt(project, previousProject);
  const durationSeconds = clampNumber(project.durationSeconds, 1, 900) || DEFAULT_DURATION_SECONDS;
  const clientProgress = clampNumber(project.progress, 0, 100);
  const previousProgress = previousProject ? clampNumber(previousProject.progress, 0, 100) : 0;

  if (!startedAt || project.pendingDevEvent || clientProgress >= 100) {
    return {
      ...data,
      selectedProject: {
        ...project,
        startedAt: startedAt || project.startedAt,
        progress: Number(Math.max(clientProgress, previousProgress).toFixed(2)),
        serverProgressAt: Date.now(),
      },
    };
  }

  const now = Date.now();
  const elapsedMs = clampNumber(now - startedAt, 0, MAX_SERVER_ELAPSED_MS);
  const serverProgress = clampNumber((elapsedMs / (durationSeconds * 1000)) * 100 * developmentSpeedMultiplier(data), 0, 100);
  const progress = Number(Math.max(clientProgress, previousProgress, serverProgress).toFixed(2));

  return {
    ...data,
    selectedProject: {
      ...project,
      startedAt,
      durationSeconds,
      progress,
      serverProgressAt: now,
    },
    lastSavedAt: now,
  };
}

export function publicDevelopmentStatus(data) {
  const normalized = normalizeServerDevelopment(data);
  const project = normalized?.selectedProject;
  return {
    serverNow: Date.now(),
    active: isPlainObject(project),
    project: isPlainObject(project) ? {
      id: project.id || null,
      name: project.name || '',
      progress: clampNumber(project.progress, 0, 100),
      durationSeconds: clampNumber(project.durationSeconds, 1, 900),
      startedAt: Number(project.startedAt) || null,
      paused: Boolean(project.pendingDevEvent),
      serverProgressAt: Number(project.serverProgressAt) || null,
    } : null,
  };
}
