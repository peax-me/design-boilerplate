/* three.js, then the React renderer, each imported on its own. The bundler gives each import a chunk and the browser evaluates each chunk in a task of its own; imported with a scene, all of it would run in one long task. */
export async function loadStageRuntime(): Promise<void> {
  await import("three");
  await import("@react-three/fiber");
}
