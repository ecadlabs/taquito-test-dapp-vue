<template>
  <div class="relative w-full overflow-auto" ref="diagram-container">
    <div class="relative h-[180px] min-w-full">
      <!-- Connections layer -->
      <div
        class="pointer-events-none absolute top-0 left-0 z-[1] h-full w-full"
      >
        <div
          v-for="connection in connections"
          :key="connection.id"
          class="pointer-events-none absolute transition-all duration-300"
          :class="[
            getConnectionClass(connection),
            isConnectionErrored(connection) ? 'error-path' : '',
          ]"
        >
          <!-- The random z-index and bg-white is to prevent the connections from visually overlapping. This should be re-done. -->
          <div
            v-if="connection.horizontal"
            class="connection-line horizontal absolute rounded bg-white transition-all duration-300"
            :class="[
              isConnectionActive(connection) ? 'animated' : '',
              inProgressConnectionErroredClasses(connection),
              `z-[${connections.indexOf(connection)}]`,
            ]"
            :style="connection.horizontal"
          />
          <div
            v-if="connection.vertical"
            class="connection-line vertical absolute rounded transition-all duration-300"
            :style="connection.vertical"
          />
        </div>
      </div>

      <!-- Nodes layer -->
      <div class="absolute top-0 left-0 z-[2] w-full">
        <div
          v-for="node in positionedNodes"
          :key="node.id"
          :class="
            getNodeClass(node) +
            ' absolute flex flex-col items-center gap-2 transition-all duration-300'
          "
          :style="getNodeStyle(node)"
        >
          <!-- Circle node -->
          <div
            class="node-circle h-5 w-5 rounded-full border-2 border-gray-300 bg-white transition-all duration-300"
          ></div>
          <!-- Text label -->
          <div
            class="absolute text-center text-xs leading-[1.2] font-medium text-gray-700"
            :class="node.type === 'error' ? 'top-6' : 'bottom-6'"
          >
            <!-- Locator for automated tests to know when an example is completed -->
            <div
              v-if="node.type === 'success' && diagramStatus === 'completed'"
              class="sr-only absolute top-0 left-0"
              aria-hidden="true"
              data-testid="diagramComplete"
              tabindex="-1"
            />
            <!-- Locator for automated tests to know when an example has errored -->
            <div
              v-if="node.type === 'error' && diagramStatus === 'errored'"
              class="sr-only absolute top-0 left-0"
              aria-hidden="true"
              data-testid="diagramError"
              tabindex="-1"
            />
            <a
              v-if="
                node.type === 'success' &&
                diagramStatus === 'completed' &&
                !diagram?.noIndexer
              "
              :href="operationsUrl"
              target="_blank"
              class="cursor-pointer transition-opacity hover:opacity-80"
            >
              <Badge variant="secondary" class="mb-1">
                <Hash />
                <p>View on {{ selectedIndexerName }}</p>
              </Badge>
            </a>

            <button
              v-if="diagramStore.getNodeButton(node.id)"
              @click="diagramStore.getNodeButton(node.id)?.onClick"
              class="cursor-pointer transition-opacity hover:opacity-80"
              :aria-label="diagramStore.getNodeButton(node.id)?.text"
            >
              <Badge variant="secondary" class="mb-1">
                <component :is="diagramStore.getNodeButton(node.id)?.icon" />
                <p>{{ diagramStore.getNodeButton(node.id)?.text }}</p>
              </Badge>
            </button>

            <p>
              {{ node.label }}
            </p>
            <p
              v-if="node.type === 'error'"
              class="mt-1 text-red-400"
              role="status"
              aria-live="assertive"
            >
              {{ errorMessage }}
            </p>

            <!-- Timing badge -->
            <div v-if="node.type === 'process'" class="mt-1">
              <Badge
                v-if="getStepTiming(node.id)?.duration !== undefined"
                variant="outline"
                class="font-mono text-xs"
              >
                {{ Math.round(getStepTiming(node.id)?.duration ?? 0) }}ms
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { buildIndexerUrl } from "@/lib/utils";
import type { DiagramNode } from "@/modules/tests/test";
import { useDiagramStore } from "@/stores/diagramStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { Hash } from "lucide-vue-next";
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";

// Extended node type for internal use
type TypedNode = DiagramNode & {
  type: "start" | "process" | "error" | "success";
};

const diagramStore = useDiagramStore();
const settingsStore = useSettingsStore();

const diagramContainer = useTemplateRef("diagram-container");

const verticalSpacing = 50;
const horizontalMargin = 80;
const verticalMargin = 75;
const NODE_SPACING_MINIMUM = 100;

const diagram = computed(() => diagramStore.currentDiagram);
const currentStep = computed(() => diagramStore.currentStep);
const diagramStatus = computed(() => diagramStore.diagramStatus);
const errorMessage = computed(() => diagramStore.errorMessage);
const operationHash = computed(() => diagramStore.operationHash);

const getStepTiming = (stepId: string) => {
  return diagramStore.getStepTiming(stepId);
};

const networkType = import.meta.env.VITE_NETWORK_TYPE;

const operationsUrl = computed(() =>
  buildIndexerUrl(
    settingsStore.settings.indexer,
    networkType,
    operationHash.value?.toString(),
    "operations",
  ),
);
const selectedIndexerName = computed(() => settingsStore.settings.indexer.name);

const positionedNodes = computed((): TypedNode[] => {
  if (!diagram.value?.nodes) return [];

  // Always create a start node at the beginning
  const startNode: TypedNode = {
    id: "start",
    label: "Start",
    type: "start",
    position: {
      x: horizontalMargin,
      y: verticalMargin,
    },
  };

  // Position main flow nodes horizontally, starting after the start node
  const positionedMainNodes: TypedNode[] = diagram.value.nodes.map(
    (node, index) => ({
      ...node,
      type: "process" as const, // All main flow nodes are process nodes
      position: {
        x:
          horizontalMargin +
          (index + 1) * (nodeSpacing.value ?? NODE_SPACING_MINIMUM),
        y: verticalMargin,
      },
    }),
  );

  // All nodes that are dynamically generated, i.e., not start, success, or error
  const dynamicNodes = positionedMainNodes.filter(
    (node) => node.type === "process",
  );

  let errorNodeX = 0;
  if (dynamicNodes.length > 0) {
    const firstErrorPathNode = dynamicNodes[0];
    const lastErrorPathNode = dynamicNodes[dynamicNodes.length - 1];

    if (firstErrorPathNode.position && lastErrorPathNode.position) {
      const firstX = firstErrorPathNode.position.x;
      const lastX = lastErrorPathNode.position.x;
      errorNodeX = (firstX + lastX) / 2;
    }
  }

  const errorNode: TypedNode = {
    id: "error",
    label: "Error",
    type: "error",
    position: {
      x: errorNodeX,
      y: verticalMargin + verticalSpacing,
    },
  };

  let successNodeX = 0;
  if (positionedMainNodes.length > 0) {
    const lastMainNode = positionedMainNodes[positionedMainNodes.length - 1];
    if (lastMainNode.position) {
      successNodeX =
        lastMainNode.position.x + (nodeSpacing.value ?? NODE_SPACING_MINIMUM);
    } else {
      successNodeX =
        startNode.position?.x ??
        horizontalMargin + (nodeSpacing.value ?? NODE_SPACING_MINIMUM);
    }
  } else {
    successNodeX =
      startNode.position?.x ??
      horizontalMargin + (nodeSpacing.value ?? NODE_SPACING_MINIMUM);
  }

  const successNode: TypedNode = {
    id: "success",
    label: "Success",
    type: "success",
    position: {
      x: successNodeX,
      y: verticalMargin,
    },
  };

  return [startNode, ...positionedMainNodes, errorNode, successNode];
});

// Allows for quickly looking up keys without having to run expensive find operations on positionedNodes
const nodeMap = computed(() => {
  const map = new Map<string, TypedNode>();
  positionedNodes.value.forEach((node) => {
    map.set(node.id, node);
  });
  return map;
});
const errorNode = computed(() =>
  positionedNodes.value.find((n) => n.type === "error"),
);
const successNode = computed(() =>
  positionedNodes.value.find((n) => n.type === "success"),
);

const containerWidth = ref(0);
const nodeSpacing = computed(() => {
  const width = containerWidth.value;

  if (!diagram.value?.nodes.length) return;

  // The +2 accounts for the start node at the beginning and success node at the end, which are in every diagram
  const nodeCount: number = diagram.value.nodes.length + 2;

  if (nodeCount <= 1) return 100;

  const availableWidth = width - horizontalMargin * 2;
  return Math.max(NODE_SPACING_MINIMUM, availableWidth / (nodeCount - 1));
});

onMounted(() => {
  let lastUpdate = 0;
  const throttleMs = 100;

  const observer = new ResizeObserver((entries) => {
    const now = Date.now();
    if (now - lastUpdate >= throttleMs) {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width;
      }
      lastUpdate = now;
    }
  });

  if (diagramContainer.value) {
    observer.observe(diagramContainer.value);
  }

  onBeforeUnmount(() => {
    observer.disconnect();
  });
});

const connections = computed(() => {
  if (!positionedNodes.value.length) return [];

  const conns: Array<{
    id: string;
    from: string;
    to: string;
    type: "success" | "error" | "next";
    horizontal?: { left: string; top: string; width: string };
    vertical?: { left: string; top: string; height: string };
  }> = [];

  // Get all nodes except error and success nodes for sequential connections
  const mainFlowNodes = positionedNodes.value.filter(
    (node) => node.type !== "error" && node.type !== "success",
  );

  // Connect nodes sequentially
  for (let i = 0; i < mainFlowNodes.length - 1; i++) {
    const fromNode = mainFlowNodes[i];
    const toNode = mainFlowNodes[i + 1];
    const connection = createConnection(fromNode, toNode, "next");
    conns.push(connection);
  }

  // Connect the last main flow node to success (if there are main flow nodes)
  if (mainFlowNodes.length > 0) {
    const lastMainNode = mainFlowNodes[mainFlowNodes.length - 1];
    if (successNode.value) {
      const connection = createConnection(
        lastMainNode,
        successNode.value,
        "next",
      );
      conns.push(connection);
    }
  }

  // Handle error connections for process nodes
  positionedNodes.value.forEach((node) => {
    if (node.type === "process") {
      if (errorNode.value) {
        const connection = createConnection(node, errorNode.value, "error");
        conns.push(connection);
      }
    }
  });

  return conns;
});

function createConnection(
  from: TypedNode,
  to: TypedNode,
  type: "success" | "error" | "next",
) {
  if (!from.position || !to.position) return { id: "", from: "", to: "", type };

  const NODE_RADIUS = 10;
  const OFFSET = 1.5;

  const fromX = from.position.x + NODE_RADIUS - OFFSET;
  const fromY = from.position.y + NODE_RADIUS;
  const toX = to.position.x + NODE_RADIUS;

  const connection: {
    id: string;
    from: string;
    to: string;
    type: "success" | "error" | "next";
    horizontal?: { left: string; top: string; width: string };
    vertical?: { left: string; top: string; height: string };
  } = {
    id: `${from.id}-${type}`,
    from: from.id,
    to: to.id,
    type,
  };

  if (type === "error") {
    const errorX = to.position.x + NODE_RADIUS;
    const midY = fromY + verticalSpacing;

    // Vertical line down from source node
    connection.vertical = {
      left: `${fromX}px`,
      top: `${fromY}px`,
      height: `${midY - fromY}px`,
    };

    if (errorX >= fromX) {
      // Error node is to the right of source node
      connection.horizontal = {
        left: `${fromX}px`,
        top: `${midY - OFFSET}px`,
        width: `${errorX - fromX}px`,
      };
    } else {
      // Error node is to the left of source node
      connection.horizontal = {
        left: `${errorX}px`,
        top: `${midY - OFFSET}px`,
        width: `${fromX - errorX + 3}px`,
      };
    }
  } else {
    const midX = toX;
    connection.horizontal = {
      left: `${fromX}px`,
      top: `${fromY - OFFSET}px`,
      width: `${midX - fromX}px`,
    };
  }

  return connection;
}

function getNodeStyle(node: TypedNode) {
  if (!node.position) return {};

  return {
    left: `${node.position.x}px`,
    top: `${node.position.y}px`,
  };
}

function getNodeClass(node: TypedNode): string {
  const classes = ["node"];

  // Error nodes should never be the current step
  if (
    node.id === currentStep.value &&
    node.type !== "error" &&
    node.type !== "success"
  ) {
    if (diagramStatus.value === "errored") {
      classes.push("current");
    } else {
      classes.push("current-animated");
    }
  }

  if (isNodeCompleted(node)) {
    classes.push("completed");
  }

  // Error nodes should show error styling when diagram is errored
  if (errorMessage.value && node.type === "error") {
    classes.push("error");
  }

  return classes.join(" ");
}

function getConnectionClass(connection: {
  type: "success" | "error" | "next";
  from: string;
  to: string;
}): string {
  const classes = ["connection"];

  // Check if both nodes in the connection are completed
  const fromNode = nodeMap.value.get(connection.from);
  const toNode = nodeMap.value.get(connection.to);

  const isFromCompleted = isNodeCompleted(fromNode);
  const isToCompleted = isNodeCompleted(toNode);
  const bothCompleted = isFromCompleted && isToCompleted;

  if (connection.type === "success") {
    classes.push("success-path");
  } else if (connection.type === "error") {
    classes.push("neutral-path");
  } else {
    // For neutral paths, check if both nodes are completed
    if (bothCompleted) {
      classes.push("success-path");
    } else if (!isToCompleted && isFromCompleted && errorMessage.value) {
      classes.push("caution-path");
    } else {
      classes.push("neutral-path");
    }
  }

  return classes.join(" ");
}

const isConnectionActive = (connection: {
  from: string;
  to: string;
}): boolean => {
  const toNode = nodeMap.value.get(connection.to);

  return (
    currentStep.value === connection.to &&
    toNode !== undefined &&
    !errorMessage.value
  );
};

const inProgressConnectionErroredClasses = (connection: {
  from: string;
  to: string;
}): string => {
  const toNode = nodeMap.value.get(connection.to);

  const classes = [];
  if (
    currentStep.value === connection.to &&
    toNode !== undefined &&
    errorMessage.value
  ) {
    classes.push("caution-path");
  }

  return classes.join(" ");
};

const isConnectionErrored = (connection: {
  from: string;
  to: string;
}): boolean => {
  const fromNode = nodeMap.value.get(connection.from);
  const toNode = nodeMap.value.get(connection.to);

  const isTargetErrorNode = toNode?.type === "error";

  if (
    errorMessage.value &&
    isTargetErrorNode &&
    currentStep.value === fromNode?.id
  )
    return true;
  return false;
};

function isNodeCompleted(node: TypedNode | undefined): boolean {
  if (!node || node.type === "error") return false;

  // For running state, check if we've passed this node
  if (
    diagramStatus.value === "running" ||
    (errorMessage.value && currentStep.value)
  ) {
    const currentNodeIndex = positionedNodes.value.findIndex(
      (n) => n.id === currentStep.value,
    );
    const nodeIndex = positionedNodes.value.findIndex((n) => n.id === node.id);

    return nodeIndex < currentNodeIndex;
  }

  // For completed state, all main flow nodes are considered completed
  if (diagramStatus.value === "completed") {
    return true;
  }

  return false;
}
</script>

<style scoped>
/* Connection line thicknesses */
.connection-line.horizontal {
  height: 3px;
}

.connection-line.vertical {
  width: 3px;
}

/* Success and error path coloring */
.success-path .connection-line {
  background: #10b981;
}

.error-path .connection-line {
  background: #ef4444 !important;
  z-index: 2;
}

.caution-path .connection-line.horizontal {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' %3E%3Cline x1='0' y1='50%25' x2='100%25' y2='50%25' stroke='%23FFA130' stroke-width='3' stroke-dasharray='5 5'/%3E%3C/svg%3E");
  background-repeat: repeat-x;
}

.neutral-path .connection-line.horizontal {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' %3E%3Cline x1='0' y1='50%25' x2='100%25' y2='50%25' stroke='%23d1d5dc' stroke-width='3' stroke-dasharray='5 5'/%3E%3C/svg%3E");
  background-repeat: repeat-x;
}

.neutral-path .connection-line.vertical {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' %3E%3Cline x1='50%25' y1='0' x2='50%25' y2='100%25' stroke='%23d1d5dc' stroke-width='3' stroke-dasharray='5 5'/%3E%3C/svg%3E");
  background-repeat: repeat-y;
}

.neutral-path .connection-line.horizontal.animated {
  background-size: 40px 100%;
  animation: move-right 3s linear infinite;
}

.neutral-path .connection-line.vertical.animated {
  background-size: 100% 40px;
  animation: move-down 3s linear infinite;
}

@keyframes move-right {
  0% {
    background-position: 0% 0;
  }

  100% {
    background-position: 40px 0;
  }
}

@keyframes move-down {
  0% {
    background-position: 0 0%;
  }

  100% {
    background-position: 0 40px;
  }
}

@keyframes pulse {
  0%,
  100% {
    border-color: #3b83f680;
  }

  50% {
    border-color: #3b82f6;
  }
}

/* Node state coloring */
.node-circle {
  border-width: 2.5px;
}

.node.current .node-circle {
  border-color: #3b82f6;
}

.node.current-animated .node-circle {
  animation: pulse 2s infinite;
}

.node.completed .node-circle {
  border-color: #10b981;
}

.node.error .node-circle {
  border-color: #ef4444;
}
</style>
