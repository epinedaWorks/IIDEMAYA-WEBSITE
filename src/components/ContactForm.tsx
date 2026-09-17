"use client";

import { useState, type FormEvent } from "react";

type Estado = "idle" | "enviando" | "ok" | "error";

export default function ContactForm() {
  const [estado, setEstado] = useState<Estado>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      nombre: String(data.get("nombre") || ""),
      correo: String(data.get("correo") || ""),
      mensaje: String(data.get("mensaje") || ""),
    };

    setEstado("enviando");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMsg(body.error || "No se pudo enviar el mensaje.");
        setEstado("error");
        return;
      }
      setEstado("ok");
      form.reset();
    } catch {
      setErrorMsg("No se pudo enviar el mensaje. Revisa tu conexión.");
      setEstado("error");
    }
  }

  if (estado === "ok") {
    return (
      <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-dark">¡Mensaje enviado!</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/70">
          Gracias por escribirnos. Te responderemos a tu correo lo antes posible.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
      <h2 className="text-lg font-semibold text-brand-dark">Escríbenos</h2>
      <p className="mt-2 text-sm leading-relaxed text-foreground/70">
        Completa el formulario y te responderemos a la brevedad.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nombre" className="text-sm font-medium text-foreground/80">
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            required
            maxLength={200}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="correo" className="text-sm font-medium text-foreground/80">
            Correo
          </label>
          <input
            id="correo"
            name="correo"
            type="email"
            required
            maxLength={200}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        <label htmlFor="mensaje" className="text-sm font-medium text-foreground/80">
          Mensaje
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          required
          rows={5}
          maxLength={5000}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>

      {estado === "error" && (
        <p className="mt-4 text-sm text-red-600">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={estado === "enviando"}
        className="mt-6 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {estado === "enviando" ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}
