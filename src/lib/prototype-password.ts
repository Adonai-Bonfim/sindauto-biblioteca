export function hashPrototypePassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./password.worker.ts", import.meta.url), { type: "module" });
    const finish = (error?: string, hash?: string) => {
      clearTimeout(timer);
      worker.terminate();
      if (error) reject(new Error(error));
      else resolve(hash!);
    };
    const timer = setTimeout(() => finish("O processamento demorou demais. Mantenha a página aberta e tente novamente."), 20_000);
    worker.onmessage = (event: MessageEvent<{ hash?: string; error?: string }>) => {
      if (typeof event.data.hash === "string") finish(undefined, event.data.hash);
      else finish(event.data.error || "Não foi possível processar a senha. Tente novamente.");
    };
    worker.onerror = () => finish("Não foi possível processar a senha. Atualize a página e tente abrir no Chrome ou Safari.");
    worker.onmessageerror = () => finish("Não foi possível processar a senha. Atualize a página e tente novamente.");
    try { worker.postMessage({ password, salt }); }
    catch { finish("Não foi possível iniciar o cadastro. Atualize a página e tente novamente."); }
  });
}
