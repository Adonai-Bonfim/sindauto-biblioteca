export function normalizePhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 12 || digits.length === 13) {
    if (!digits.startsWith("55")) throw new Error("Informe um telefone brasileiro com DDD.");
    digits = digits.slice(2);
  }
  if (!/^[1-9]{2}[2-9]\d{7,8}$/.test(digits)) {
    throw new Error("Informe um telefone válido com DDD. Ex.: (71) 99999-9999.");
  }
  return `+55${digits}`;
}

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === "invalid_credentials") return "Telefone ou senha incorretos. Confira e tente novamente.";
  if (code === "user_already_exists" || code === "phone_exists") return "Este telefone já está cadastrado. Use a opção Entrar.";
  if (code === "phone_provider_disabled") return "O cadastro por telefone ainda não foi habilitado pela biblioteca. Não é um problema com sua senha. Entre em contato com o responsável pela biblioteca.";
  if (code === "signup_disabled") return "Novos cadastros estão desativados. Entre em contato com o responsável pela biblioteca.";
  if (code === "phone_not_confirmed") return "Seu telefone ainda não foi confirmado. Entre em contato com a biblioteca.";
  if (code === "weak_password") return "Escolha uma senha mais forte, com pelo menos 8 caracteres.";
  if (code === "over_request_rate_limit" || code === "over_sms_send_rate_limit") return "Muitas tentativas. Aguarde um pouco e tente novamente.";
  return "Não foi possível conectar à biblioteca. Tente novamente em instantes.";
}
