import { createConfigSchematics } from "@lmstudio/sdk";

export const pluginConfigSchematics = createConfigSchematics()
  .field("retrievalLimit", "numeric", {
    int: true,
    min: 1,
    displayName: "Retrieval Limit",
    subtitle: "When retrieval is triggered, this is the maximum number of chunks to return.",
    slider: { min: 1, max: 10, step: 1 },
  }, 3)
  .field("retrievalAffinityThreshold", "numeric", {
    min: 0.0,
    max: 1.0,
    displayName: "Retrieval Affinity Threshold",
    subtitle: "The minimum similarity score for a chunk to be considered relevant.",
    slider: { min: 0.0, max: 1.0, step: 0.01 },
  }, 0.5)
  .field("allowJavascriptExecution", "boolean", {
    displayName: "Allow JavaScript Execution",
    subtitle: "Enable the 'run_javascript' tool. DANGER: Code runs on your machine.",
  }, false)
  .field("allowPythonExecution", "boolean", {
    displayName: "Allow Python Execution",
    subtitle: "Enable the 'run_python' tool. DANGER: Code runs on your machine.",
  }, false)
  .field("allowTerminalExecution", "boolean", {
    displayName: "Allow Terminal Execution",
    subtitle: "Enable the 'run_in_terminal' tool. Opens real terminal windows.",
  }, false)
  .field("allowShellCommandExecution", "boolean", {
    displayName: "Allow Shell Command Execution",
    subtitle: "Enable the 'execute_command' tool. DANGER: Commands run on your machine.",
  }, false)
  .field("allowAllCode", "boolean", {
    displayName: "Allow All Code Execution",
    subtitle: "MASTER SWITCH: Overrides all other settings to enable ALL execution tools.",
  }, false)
  .field("searchApiKey", "string", {
    displayName: "Search API Key",
    subtitle: "Optional API key for search services (if supported) to avoid rate limits.",
  }, "")
  .field("enableMemory", "boolean", {
    displayName: "Enable Memory",
    subtitle: "If enabled, the model can save and recall information from a 'memory.md' file in the workspace.",
  }, false)
  .build();