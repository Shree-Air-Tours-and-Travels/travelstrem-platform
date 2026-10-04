export const PROCESS_STATUS = Object.freeze({
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  BLOCKED: "BLOCKED",
});
export const PROCESS_ACTION = Object.freeze({
  SAVE: "SAVE",
  SUBMIT_AND_NEXT: "SUBMIT_AND_NEXT",
  BACK: "BACK",
  GO_TO: "GO_TO",
});

const childCollections = ["steps", "subSteps", "children", "widgets"];
const unique = (items = []) => [...new Set(items.filter(Boolean))];

export function flattenProcessNodes(definition = {}) {
  const output = [];
  const visit = (node, parentId = null, depth = 0) => {
    if (!node?.id) return;
    output.push({ ...node, parentId, depth });
    childCollections.forEach((key) =>
      (node[key] || []).forEach((child) => visit(child, node.id, depth + 1)),
    );
  };
  (definition.steps || []).forEach((step) => visit(step));
  return output;
}

/** Top-level stages are the only nodes used for wizard navigation/progress. */
export const getProcessStages = (definition = {}) =>
  (definition.steps || []).filter((step) => step?.id);

export function createProcessState(definition, persisted = {}) {
  if (!definition?.key || !definition?.version)
    throw new TypeError("A versioned process definition is required");
  const nodes = flattenProcessNodes(definition);
  const stages = getProcessStages(definition);
  const validIds = new Set(nodes.map(({ id }) => id));
  const completedNodeIds = unique(persisted.completedNodeIds).filter((id) => validIds.has(id));
  const completedStageIds = unique(persisted.completedStageIds || completedNodeIds).filter((id) =>
    stages.some((stage) => stage.id === id),
  );
  const currentNodeId = validIds.has(persisted.currentNodeId)
    ? persisted.currentNodeId
    : stages[0]?.id || null;
  const allComplete = stages.length > 0 && stages.every(({ id }) => completedStageIds.includes(id));
  return {
    definitionKey: definition.key,
    definitionVersion: definition.version,
    status: allComplete
      ? PROCESS_STATUS.COMPLETED
      : completedStageIds.length
        ? PROCESS_STATUS.IN_PROGRESS
        : PROCESS_STATUS.NOT_STARTED,
    currentNodeId,
    completedNodeIds,
    completedStageIds,
    nodeStates: persisted.nodeStates || {},
  };
}

const getPath = (source, path = "") =>
  String(path)
    .split(".")
    .filter(Boolean)
    .reduce((value, key) => value?.[key], source);
const empty = (value) =>
  value == null || value === "" || (Array.isArray(value) && value.length === 0);

function validateField(field, data) {
  const value = getPath(data, field.path);
  if (empty(value)) {
    if (field.required !== false)
      return field.message || `${field.label || field.path} is required`;
    if (Number(field.minItems || 0) > 0)
      return field.message || `${field.label || field.path} needs at least ${field.minItems} items`;
    if (Number(field.enabledMin || 0) > 0)
      return (
        field.message ||
        `${field.label || field.path} needs at least ${field.enabledMin} enabled items`
      );
    return null;
  }
  if (field.minItems != null && (!Array.isArray(value) || value.length < Number(field.minItems)))
    return field.message || `${field.label || field.path} needs at least ${field.minItems} items`;
  if (field.maxItems != null && Array.isArray(value) && value.length > Number(field.maxItems))
    return field.message || `${field.label || field.path} allows at most ${field.maxItems} items`;
  if (field.enabledMin != null || field.enabledMax != null) {
    const count = (Array.isArray(value) ? value : []).filter(
      (item) => item?.enabled !== false,
    ).length;
    if (field.enabledMin != null && count < Number(field.enabledMin))
      return (
        field.message ||
        `${field.label || field.path} needs at least ${field.enabledMin} enabled items`
      );
    if (field.enabledMax != null && count > Number(field.enabledMax))
      return (
        field.message ||
        `${field.label || field.path} allows at most ${field.enabledMax} enabled items`
      );
  }
  if (field.min != null && Number(value) < Number(field.min))
    return field.message || `${field.label || field.path} must be at least ${field.min}`;
  if (field.max != null && Number(value) > Number(field.max))
    return field.message || `${field.label || field.path} must be at most ${field.max}`;
  if (field.pattern) {
    try {
      if (!new RegExp(field.pattern).test(String(value)))
        return field.message || `${field.label || field.path} is invalid`;
    } catch {
      return `${field.label || field.path} has an invalid validation pattern`;
    }
  }
  return null;
}

export function validateProcessNode(definition, nodeId, data = {}, context = {}) {
  const nodes = flattenProcessNodes(definition);
  const node = nodes.find((candidate) => candidate.id === nodeId);
  if (!node) return { valid: false, errors: { process: `Unknown process node: ${nodeId}` } };
  const errors = {};
  const isDescendant = (candidate) => {
    let parentId = candidate.parentId;
    while (parentId) {
      if (parentId === nodeId) return true;
      parentId = nodes.find((item) => item.id === parentId)?.parentId;
    }
    return false;
  };
  [node, ...nodes.filter(isDescendant)]
    .flatMap((item) => item.requiredFields || [])
    .forEach((field) => {
      const message = validateField(field, data);
      if (message) errors[field.path] = message;
    });
  for (const validator of node.validators || []) {
    if (typeof validator === "function") Object.assign(errors, validator(data, context) || {});
  }
  return { valid: !Object.keys(errors).length, errors, node };
}

const descendantsOf = (nodes, nodeId) =>
  nodes.filter((candidate) => {
    let parentId = candidate.parentId;
    while (parentId) {
      if (parentId === nodeId) return true;
      parentId = nodes.find((item) => item.id === parentId)?.parentId;
    }
    return false;
  });

export function applyProcessAction(
  definition,
  persisted,
  { nodeId, data, action = PROCESS_ACTION.SUBMIT_AND_NEXT, targetNodeId = null, context = {} },
) {
  const nodes = flattenProcessNodes(definition);
  const stages = getProcessStages(definition);
  const state = createProcessState(definition, persisted);
  const stageIndex = stages.findIndex(({ id }) => id === nodeId);
  if (stageIndex < 0)
    return { ok: false, errors: { process: `Unknown process stage: ${nodeId}` }, process: state };
  if (action === PROCESS_ACTION.BACK) {
    const previousNode = stages[Math.max(0, stageIndex - 1)] || null;
    return {
      ok: true,
      action,
      process: {
        ...state,
        status: PROCESS_STATUS.IN_PROGRESS,
        currentNodeId: previousNode?.id || nodeId,
      },
      nextNode: previousNode,
    };
  }
  if (action === PROCESS_ACTION.GO_TO) {
    const target = stages.find(({ id }) => id === targetNodeId);
    if (!target)
      return {
        ok: false,
        errors: { process: `Unknown target process stage: ${targetNodeId}` },
        process: state,
      };
    return { ok: true, action, process: { ...state, currentNodeId: target.id }, nextNode: target };
  }
  const validation = validateProcessNode(definition, nodeId, data, context);
  if (!validation.valid) return { ok: false, errors: validation.errors, process: state };
  const completedNodeIds = unique([
    ...state.completedNodeIds,
    nodeId,
    ...descendantsOf(nodes, nodeId).map(({ id }) => id),
  ]);
  const completedStageIds = unique([...state.completedStageIds, nodeId]);
  const nextNode =
    action === PROCESS_ACTION.SAVE ? stages[stageIndex] : stages[stageIndex + 1] || null;
  const complete = stages.every(({ id }) => completedStageIds.includes(id));
  return {
    ok: true,
    action,
    process: {
      ...state,
      status: complete ? PROCESS_STATUS.COMPLETED : PROCESS_STATUS.IN_PROGRESS,
      currentNodeId: nextNode?.id || nodeId,
      completedNodeIds,
      completedStageIds,
      nodeStates: {
        ...state.nodeStates,
        [nodeId]: { status: PROCESS_STATUS.COMPLETED, completedAt: new Date().toISOString() },
      },
    },
    nextNode,
  };
}

export function getProcessSnapshot(definition, persisted = {}) {
  const process = createProcessState(definition, persisted);
  const stages = getProcessStages(definition);
  const completed = new Set(process.completedNodeIds);
  const completedStages = new Set(process.completedStageIds);
  const currentStageIndex = Math.max(
    0,
    stages.findIndex(({ id }) => id === process.currentNodeId),
  );
  return {
    ...process,
    definition,
    progress: {
      completed: completedStages.size,
      total: stages.length,
      percentage: stages.length ? Math.round((completedStages.size / stages.length) * 100) : 0,
    },
    navigation: {
      previousNodeId: stages[currentStageIndex - 1]?.id || null,
      nextNodeId: stages[currentStageIndex + 1]?.id || null,
    },
    nodes: flattenProcessNodes(definition).map((node) => ({
      ...node,
      status: completed.has(node.id)
        ? PROCESS_STATUS.COMPLETED
        : node.id === process.currentNodeId
          ? PROCESS_STATUS.IN_PROGRESS
          : PROCESS_STATUS.NOT_STARTED,
    })),
  };
}
