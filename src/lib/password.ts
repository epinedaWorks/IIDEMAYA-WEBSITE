// Política de contraseñas para las cuentas admin. Se valida tanto en el
// cliente (para avisar de inmediato) como en el servidor (la única que
// realmente cuenta — el cliente se puede saltar).
export const POLITICA_PASSWORD = [
  "Al menos 12 caracteres.",
  "Al menos 3 de estos 4 tipos: mayúsculas, minúsculas, números y símbolos.",
  "No puede ser igual a la contraseña actual.",
] as const;

export type ValidacionPassword = { ok: true } | { ok: false; error: string };

export function validarPassword(password: string): ValidacionPassword {
  if (password.length < 12) {
    return { ok: false, error: "La contraseña debe tener al menos 12 caracteres." };
  }
  const clases = [
    /[a-z]/.test(password), // minúsculas
    /[A-Z]/.test(password), // mayúsculas
    /[0-9]/.test(password), // números
    /[^a-zA-Z0-9]/.test(password), // símbolos
  ].filter(Boolean).length;

  if (clases < 3) {
    return {
      ok: false,
      error: "Usa al menos 3 de estos 4 tipos de caracteres: mayúsculas, minúsculas, números y símbolos.",
    };
  }

  return { ok: true };
}
