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
  setup: string[];
  relatedTests: string[];
  contractApi?: boolean;
  documentation: {
    contract?: { name: string; url: string }[];
    script?: string;
    taquitoDocumentation?: string;
    tezosDocumentation?: string;
  };
  component?: () => Promise<{ default: Component }>;
  diagrams?: TestDiagrams;
  icon?: Component;
}
