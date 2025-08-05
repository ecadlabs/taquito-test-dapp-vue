<template>
	<div class="overflow-auto w-full relative" ref="diagram-container">
		<div class="min-w-full h-[150px] relative min-w-max">
			<!-- Connections layer -->
			<div class="absolute top-0 left-0 w-full h-full pointer-events-none z-[1]">
				<div v-for="connection in connections" :key="connection.id"
					class="absolute pointer-events-none transition-all duration-300"
					:class="[getConnectionClass(connection), isConnectionErrored(connection) ? 'error-path' : '']">
					<div v-if="connection.horizontal"
						class="connection-line horizontal absolute rounded transition-all duration-300"
						:class="[isConnectionActive(connection) ? 'animated' : '', inProgressConnectionErroredClasses(connection)]"
						:style="connection.horizontal" />
					<div v-if="connection.vertical"
						class="connection-line vertical absolute rounded transition-all duration-300"
						:style="connection.vertical" />
				</div>
			</div>

			<!-- Nodes layer -->
			<div class="absolute top-0 left-0 w-full z-[2]">
				<div v-for="node in positionedNodes" :key="node.id"
					:class="getNodeClass(node) + ' absolute flex flex-col items-center gap-2 transition-all duration-300'"
					:style="getNodeStyle(node)">
					<!-- Circle node -->
					<div
						class="node-circle w-5 h-5 rounded-full bg-white border-2 border-gray-300 transition-all duration-300">
					</div>
					<!-- Text label -->
					<div class="text-xs absolute font-medium text-gray-700 text-center leading-[1.2]"
						:class="node.type === 'error' ? 'top-6' : 'bottom-6'">
						<a v-if="node.type === 'success' && diagramStatus === 'completed'"
							:href="`${indexerUrl}/${operationHash}/operations`" target="_blank">
							<Badge variant="secondary" class="mb-1">
								<Hash />
								<p>View on {{ selectedIndexerName }}</p>
							</Badge>
						</a>
						<p>
							{{ node.label }}
						</p>
						<p v-if="node.type === 'error'" class="text-red-400 mt-1">
							{{ errorMessage }}
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { useDiagramStore } from '@/stores/diagramStore';
import type { DiagramNode } from '@/modules/tests/test';
import { Hash } from 'lucide-vue-next';
import { Badge } from '@/components/ui/badge'
import { buildIndexerUrl } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';

const diagramStore = useDiagramStore();
const settingsStore = useSettingsStore();

const diagramContainer = useTemplateRef('diagram-container');

const verticalSpacing = 50;
const horizontalMargin = 80;
const verticalMargin = 50;
const NODE_SPACING_MINIMUM = 100;

const diagram = computed(() => diagramStore.currentDiagram);
const currentStep = computed(() => diagramStore.currentStep);
const diagramStatus = computed(() => diagramStore.diagramStatus);
const errorMessage = computed(() => diagramStore.errorMessage);
const operationHash = computed(() => diagramStore.operationHash);

const networkType = import.meta.env.VITE_NETWORK_TYPE;

const indexerUrl = computed(() => buildIndexerUrl(settingsStore.settings.indexer, networkType));
const selectedIndexerName = computed(() => settingsStore.settings.indexer.name);

const positionedNodes = computed(() => {
	if (!diagram.value?.nodes) return [];

	// Position main flow nodes horizontally
	const positionedMainNodes = diagram.value.nodes.map((node, index) => ({
		...node,
		position: {
			x: horizontalMargin + (index * (nodeSpacing.value ?? NODE_SPACING_MINIMUM)),
			y: verticalMargin,
		}
	}));

	// All nodes that are dynamically generated, i.e., not start, success, or error 
	const dynamicNodes = positionedMainNodes.filter(node => node.type === 'process');

	let errorNodeX = 0;
	if (dynamicNodes.length > 0) {
		const firstErrorPathNode = dynamicNodes[0];
		const lastErrorPathNode = dynamicNodes[dynamicNodes.length - 1];

		const firstX = firstErrorPathNode.position.x;
		const lastX = lastErrorPathNode.position.x;

		errorNodeX = (firstX + lastX) / 2;
	}

	const errorNode: DiagramNode = {
		id: 'error',
		label: 'Error',
		type: 'error',
		position: {
			x: errorNodeX,
			y: verticalMargin + verticalSpacing
		}
	};

	let successNodeX = positionedMainNodes[positionedMainNodes.length - 1].position.x + (nodeSpacing.value ?? NODE_SPACING_MINIMUM);

	const successNode: DiagramNode = {
		id: 'success',
		label: 'Success',
		type: 'success',
		position: {
			x: successNodeX,
			y: verticalMargin
		}
	};

	return [...positionedMainNodes, errorNode, successNode];
});

// Allows for quickly looking up keys without having to run expensive find operations on positionedNodes
const nodeMap = computed(() => {
	const map = new Map();
	positionedNodes.value.forEach(node => {
		map.set(node.id, node);
	});
	return map;
});
const errorNode = computed(() =>
	positionedNodes.value.find(n => n.type === 'error')
);
const successNode = computed(() =>
	positionedNodes.value.find(n => n.type === 'success')
);

const containerWidth = ref(0);
const nodeSpacing = computed(() => {
	const width = containerWidth.value;

	if (!diagram.value?.nodes.length) return;

	// The +1 accounts for the success node at the end, which is in every diagram
	const nodeCount: number = diagram.value.nodes.length + 1;

	if (nodeCount <= 1) return 100;

	const availableWidth = width - (horizontalMargin * 2);
	return Math.max(NODE_SPACING_MINIMUM, availableWidth / (nodeCount - 1));
});
onMounted(() => {
	let lastUpdate = 0;
	const throttleMs = 100;

	const observer = new ResizeObserver(entries => {
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
		type: 'success' | 'error' | 'next';
		horizontal?: { left: string; top: string; width: string };
		vertical?: { left: string; top: string; height: string };
	}> = [];

	positionedNodes.value.forEach(node => {
		if (node.next) {
			const targetNode = nodeMap.value.get(node.next);
			if (targetNode) {
				const connection = createConnection(node, targetNode, 'next');
				conns.push(connection);
			}
		} else if (node.type !== 'error' && node.type !== 'success') {
			if (successNode.value) {
				const connection = createConnection(node, successNode.value, 'next');
				conns.push(connection);
			}
		}

		if (node.type === 'process') {
			if (errorNode.value) {
				const connection = createConnection(node, errorNode.value, 'error');
				conns.push(connection);
			}
		}
	});

	return conns;
});

function createConnection(from: DiagramNode, to: DiagramNode, type: 'success' | 'error' | 'next') {
	if (!from.position || !to.position) return { id: '', from: '', to: '', type };

	const NODE_RADIUS = 10;
	const OFFSET = 1.5;

	const fromX = from.position.x + NODE_RADIUS - OFFSET;
	const fromY = from.position.y + NODE_RADIUS;
	const toX = to.position.x + NODE_RADIUS;

	const connection: {
		id: string;
		from: string;
		to: string;
		type: 'success' | 'error' | 'next';
		horizontal?: { left: string; top: string; width: string };
		vertical?: { left: string; top: string; height: string };
	} = {
		id: `${from.id}-${type}`,
		from: from.id,
		to: to.id,
		type
	};

	if (type === 'error') {
		const errorX = to.position.x + NODE_RADIUS;
		const midY = fromY + verticalSpacing;

		// Vertical line down from source node
		connection.vertical = {
			left: `${fromX}px`,
			top: `${fromY}px`,
			height: `${midY - fromY}px`
		};

		if (errorX >= fromX) {
			// Error node is to the right of source node
			connection.horizontal = {
				left: `${fromX}px`,
				top: `${midY - OFFSET}px`,
				width: `${errorX - fromX}px`
			};
		} else {
			// Error node is to the left of source node
			connection.horizontal = {
				left: `${errorX}px`,
				top: `${midY - OFFSET}px`,
				width: `${fromX - errorX + 3}px`
			};
		}
	} else {
		const midX = toX;
		connection.horizontal = {
			left: `${fromX}px`,
			top: `${fromY - OFFSET}px`,
			width: `${midX - fromX}px`
		};
	}

	return connection;
}

function getNodeStyle(node: DiagramNode) {
	if (!node.position) return {};

	return {
		left: `${node.position.x}px`,
		top: `${node.position.y}px`
	};
}

function getNodeClass(node: DiagramNode): string {
	const classes = ['node'];

	// Error nodes should never be the current step
	if (node.id === currentStep.value && node.type !== 'error' && node.type !== 'success') {
		if (diagramStatus.value === 'errored') {
			classes.push('current');
		} else {
			classes.push('current-animated');
		}
	}

	if (isNodeCompleted(node)) {
		classes.push('completed');
	}

	// Error nodes should show error styling when diagram is errored
	if (errorMessage.value && node.type === 'error') {
		classes.push('error');
	}

	return classes.join(' ');
}

function getConnectionClass(connection: { type: 'success' | 'error' | 'next'; from: string; to: string }): string {
	const classes = ['connection'];

	// Check if both nodes in the connection are completed
	const fromNode = nodeMap.value.get(connection.from);
	const toNode = nodeMap.value.get(connection.to);

	const isFromCompleted = isNodeCompleted(fromNode);
	const isToCompleted = isNodeCompleted(toNode);
	const bothCompleted = isFromCompleted && isToCompleted;

	if (connection.type === 'success') {
		classes.push('success-path');
	} else if (connection.type === 'error') {
		classes.push('neutral-path')
	} else {
		// For neutral paths, check if both nodes are completed
		if (bothCompleted) {
			classes.push('success-path');
		} else if (!isToCompleted && isFromCompleted && errorMessage.value) {
			classes.push('caution-path')
		} else {
			classes.push('neutral-path')
		}
	}

	return classes.join(' ');
}

const isConnectionActive = (connection: { from: string; to: string }): boolean => {
	const toNode = nodeMap.value.get(connection.to);

	return currentStep.value === connection.to && toNode !== undefined && !errorMessage.value;
}

const inProgressConnectionErroredClasses = (connection: { from: string; to: string }): string => {
	const toNode = nodeMap.value.get(connection.to);

	const classes = [];
	if (currentStep.value === connection.to && toNode !== undefined && errorMessage.value) {
		classes.push('caution-path');
	}

	return classes.join(' ');
}

const isConnectionErrored = (connection: { from: string; to: string }): boolean => {
	const fromNode = nodeMap.value.get(connection.from);
	const toNode = nodeMap.value.get(connection.to);

	const isTargetErrorNode = toNode?.type === 'error';

	if (errorMessage.value && isTargetErrorNode && currentStep.value === fromNode?.id) return true;
	return false;
}

function isNodeCompleted(node: DiagramNode | undefined): boolean {
	if (!node || node.type === 'error') return false;

	// For running state, check if we've passed this node
	if (diagramStatus.value === 'running' || errorMessage.value && currentStep.value) {
		const currentNodeIndex = positionedNodes.value.findIndex(n => n.id === currentStep.value);
		const nodeIndex = positionedNodes.value.findIndex(n => n.id === node.id);

		return nodeIndex < currentNodeIndex;
	}

	// For completed state, all main flow nodes are considered completed
	if (diagramStatus.value === 'completed') {
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
		border-color: #3b83f680
	}

	50% {
		border-color: #3b82f6
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