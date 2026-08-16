// Backward-compatible entry point. The old one-time patcher could restore stale
// dates and entity URLs; all reputation and entity files now come from one source.
await import("./sync-discovery-data.mjs");
