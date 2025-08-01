import type { Component } from "vue";

export interface DiagramNode {
	id: string;
	label: string;
	type: 'start' | 'process' | 'decision' | 'success' | 'error' | 'end';
	position?: { x: number; y: number };
	next?: string;
}

export interface TestDiagram {
	nodes: DiagramNode[];
}

export interface TestMetadata {
	id: string;
	title: string;
	description: string;
	category: string;
	learningGoals: string[];
	prerequisites: string[];
	setup: string[];
	operationalFlow: {
		description: string;
		diagram?: string;
	};
	stepByStepNarrative: string[];
	relatedTests: string[];
	sourceCode: {
		contract?: string;
		script?: string;
		documentation?: string;
	};
	component?: Component;
	diagram?: TestDiagram;
}