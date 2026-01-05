import type {
  Annotations,
  ReadResourceResult,
  Resource,
  ResourceTemplate,
} from "../mcp/20251125/types.js";

export type ResourceReader = (
  uri: string
) => Promise<ReadResourceResult> | ReadResourceResult;

export interface ResourceMetadata {
  title?: string;
  description?: string;
  mimeType?: string;
  annotations?: Annotations;
  size?: number;
  _meta?: Resource["_meta"];
}

export interface URITemplate {
  template: string;
}

export type RegisteredResource = {
  type: "resource";
  resource: Resource;
  reader: ResourceReader;
};

export type RegisteredTemplate = {
  type: "template";
  template: ResourceTemplate;
  reader: ResourceReader;
};

export type RegisteredResourceOrTemplate =
  | RegisteredResource
  | RegisteredTemplate;
