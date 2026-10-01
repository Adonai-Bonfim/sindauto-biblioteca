// Temporary diagnostics: fixed stage names only, never SQL, parameters or errors.
export async function traceStage<T>(stage: string, work: () => T | Promise<T>, milliseconds = 15_000): Promise<T> {
  const id = crypto.randomUUID();
  const start = Date.now();
  console.log(`[library:${id}] ${stage}: before`);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      Promise.resolve().then(work),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("DATABASE_OPERATION_TIMEOUT")), milliseconds);
      }),
    ]);
    console.log(`[library:${id}] ${stage}: after (${Date.now() - start}ms)`);
    return result;
  } catch {
    console.error(`[library:${id}] ${stage}: failed (${Date.now() - start}ms)`);
    throw new Error("DATABASE_OPERATION_FAILED");
  } finally { clearTimeout(timer); }
}
