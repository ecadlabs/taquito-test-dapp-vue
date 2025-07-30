import type { Component } from "vue";

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
	component: Component,
}