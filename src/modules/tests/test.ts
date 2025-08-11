import type { Component } from "vue";

export interface DiagramNode {
  id: string;
  label: string;
  position?: { x: number; y: number };
}

export interface TestDiagram {
  nodes: DiagramNode[];
  noIndexer?: boolean;
}

export interface TestDiagrams {
  [key: string]: TestDiagram;
}

export interface TestMetadata {
  id: string;
  title: string;
  description: string;
  category: string;
  learningGoals: string[];
  prerequisites: string[];
  setup: string[];
  relatedTests: string[];
  sourceCode: {
    contract?: string;
    script?: string;
    documentation?: string;
  };
  component?: Component;
  diagrams?: TestDiagrams;
}
