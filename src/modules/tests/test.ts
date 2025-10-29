import type { NetworkType } from "@airgap/beacon-types";
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
  supportedNetworks?: NetworkType[];
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
