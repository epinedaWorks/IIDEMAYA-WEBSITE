import type { FranjaEntrevista, Postulacion } from "@prisma/client";
import { getListaCorreos, SETTING_CONTACT_EMAIL, SETTING_POSTULACION_EMAIL } from "./settings";
import { formatearFechaHoraGt } from "./fecha";
import { crearIcs, fechaHoraLargaGt, rangoHorasGt, urlAgenda } from "./entrevistas";
import { nombreArchivoSeguro, obtenerArchivoPostulacion } from "./uploads";
import { generarPdfPostulacion } from "./postulacion-pdf";

const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || "IIDEMAYA <no-reply@iidemaya.org.gt>";
const ADMIN_URL = process.env.ADMIN_URL || "http://localhost:3000/admin";

// Los correos que reciben cada tipo de aviso se editan desde el panel
// (/admin/ajustes); la variable de entorno es el respaldo si aún no se ha
// guardado nada.
const getCorreosContacto = () => getListaCorreos(SETTING_CONTACT_EMAIL, process.env.TEAM_EMAIL);
const getCorreosPostulacion = () =>
  getListaCorreos(SETTING_POSTULACION_EMAIL, process.env.ADMIN_NOTIFY_EMAILS || process.env.TEAM_EMAIL);

let avisado = false;
function sinConfig() {
  if (!avisado) {
    console.warn("[email] RESEND_API_KEY no configurada — no se envían correos.");
    avisado = true;
  }
}

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// El asunto lleva datos de quien escribe (su nombre): sin saltos de línea ni
// caracteres de control, para que no pueda inyectar cabeceras de correo.
const limpiarAsunto = (s: string) => s.replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, 200);

function layout(titulo: string, cuerpo: string) {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /></head>
<body style="margin:0;background:#f4f4f4;padding:20px 16px">
  <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#1c2321">
    <div style="background:#0a3a24;color:#fbfaf7;padding:22px 24px;border-radius:14px 14px 0 0;border-bottom:3px solid #c98a2c">
      <strong style="font-size:17px;letter-spacing:0.01em">IIDEMAYA</strong>
    </div>
    <div style="background:#fff;border:1px solid #e5e5e5;border-top:none;padding:26px 24px;border-radius:0 0 14px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
      <h2 style="margin:0 0 14px;font-size:19px;color:#0a3a24">${esc(titulo)}</h2>
      ${cuerpo}
    </div>
    <p style="text-align:center;color:#999;font-size:12px;margin:18px 0 0">IIDEMAYA</p>
  </div>
</body></html>`;
}

function filas(pares: [string, string | null | undefined][]) {
  return `<table style="border-collapse:collapse;font-size:14px;width:100%">${pares
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top;white-space:nowrap">${esc(
          k
        )}</td><td style="padding:4px 0">${esc(String(v))}</td></tr>`
    )
    .join("")}</table>`;
}

type ResultadoEnvio = { ok: true } | { ok: false; motivo: string };

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Llamada directa a la API de Resend con reintento ante 429 (límite de
// peticiones por segundo). Nunca lanza: si falla, quien llama decide qué
// mostrarle a la persona.
type Adjunto = { filename: string; content: string }; // content en base64

async function enviar(opts: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: Adjunto[];
}): Promise<ResultadoEnvio> {
  if (!API_KEY) {
    sinConfig();
    return { ok: false, motivo: "no configurado" };
  }
  const INTENTOS = 3;
  for (let intento = 1; intento <= INTENTOS; intento++) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          from: FROM,
          to: Array.isArray(opts.to) ? opts.to : [opts.to],
          subject: limpiarAsunto(opts.subject),
          html: opts.html,
          ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
          ...(opts.attachments?.length ? { attachments: opts.attachments } : {}),
        }),
      });
      if (res.ok) return { ok: true };
      const cuerpo = await res.text().catch(() => "");
      if (res.status === 429 && intento < INTENTOS) {
        await esperar(700 * intento);
        continue;
      }
      console.error("[email] Resend respondió", res.status, cuerpo);
      return { ok: false, motivo: `HTTP ${res.status}: ${cuerpo}` };
    } catch (err) {
      if (intento < INTENTOS) {
        await esperar(500 * intento);
        continue;
      }
      console.error("[email] no se pudo enviar:", err);
      return { ok: false, motivo: "error de red" };
    }
  }
  return { ok: false, motivo: "desconocido" };
}

export type DatosContacto = {
  nombre: string;
  correo: string;
  mensaje: string;
};

// Envía el aviso al equipo y el acuse de recibo a quien escribió. Si el
// equipo no tiene correos configurados, igual se manda el acuse.
export async function sendContactEmail(d: DatosContacto): Promise<ResultadoEnvio> {
  const correosEquipo = await getCorreosContacto();
  let resultadoEquipo: ResultadoEnvio = { ok: false, motivo: "sin destinatario" };
  if (correosEquipo.length) {
    resultadoEquipo = await enviar({
      to: correosEquipo,
      subject: `Contacto desde el sitio: ${d.nombre}`,
      html: layout(
        "Nuevo mensaje de contacto",
        `${filas([
          ["Nombre", d.nombre],
          ["Correo", d.correo],
        ])}
        <p style="font-size:13px;color:#666;margin-top:12px">Mensaje:</p>
        <p style="font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(d.mensaje)}</p>`
      ),
      replyTo: d.correo,
    });
  }

  await enviar({
    to: d.correo,
    subject: "Recibimos tu mensaje · IIDEMAYA",
    html: layout(
      `¡Gracias por escribirnos, ${esc(d.nombre.split(" ")[0])}!`,
      `<p style="font-size:14px;line-height:1.6">Recibimos tu mensaje y te responderemos a este correo lo antes posible.</p>`
    ),
    replyTo: correosEquipo[0],
  });

  return resultadoEquipo;
}

// ---------- Postulaciones (/talento) ----------

// Descarga un archivo guardado en Netlify Blobs y lo deja listo como
// adjunto de Resend (base64). Si no se puede leer, devuelve null en vez de
// lanzar — un adjunto faltante no debe tumbar el aviso completo.
async function adjuntoDesdeBlobKey(key: string, nombrePorDefecto: string): Promise<Adjunto | null> {
  try {
    const archivo = await obtenerArchivoPostulacion(key);
    if (!archivo) return null;
    const nombreOriginal = nombreArchivoSeguro(
      (archivo.metadata?.nombreOriginal as string) || nombrePorDefecto,
      nombrePorDefecto
    );
    const content = Buffer.from(archivo.data as ArrayBuffer).toString("base64");
    return { filename: nombreOriginal, content };
  } catch (err) {
    console.error("[email] no se pudo adjuntar el archivo", key, err);
    return null;
  }
}

export async function sendPostulacionEmails(postulacion: Postulacion): Promise<ResultadoEnvio> {
  const correosEquipo = await getCorreosPostulacion();
  let resultadoEquipo: ResultadoEnvio = { ok: false, motivo: "sin destinatario" };
  if (correosEquipo.length) {
    // El CV y el PDF del cuestionario van adjuntos solo en el aviso al
    // equipo — a quien se postula no hace falta reenviarle su propio CV.
    const [cvAdjunto, pdfAdjunto] = await Promise.all([
      adjuntoDesdeBlobKey(postulacion.cvBlobKey, "cv.pdf"),
      generarPdfPostulacion(postulacion)
        .then((buf) => ({ filename: "cuestionario.pdf", content: buf.toString("base64") }))
        .catch((err) => {
          console.error("[email] no se pudo generar el PDF del cuestionario:", err);
          return null;
        }),
    ]);
    const attachments = [cvAdjunto, pdfAdjunto].filter((a): a is Adjunto => a !== null);

    resultadoEquipo = await enviar({
      to: correosEquipo,
      subject: `Nueva postulación: ${postulacion.nombre}`,
      html: layout(
        "Nueva postulación recibida",
        `${filas([
          ["Nombre", postulacion.nombre],
          ["Correo", postulacion.correo],
          ["Posición", postulacion.vacanteTitulo ?? "Postulación general"],
          ["Recibido", formatearFechaHoraGt(new Date())],
        ])}
        <p style="font-size:13px;color:#666;margin-top:12px">Se adjunta su CV y un PDF con las respuestas del cuestionario.</p>
        <p style="margin-top:16px"><a href="${ADMIN_URL}/postulaciones/${postulacion.id}" style="color:#0f5132">Ver postulación completa →</a></p>`
      ),
      replyTo: postulacion.correo,
      attachments,
    });
  }

  await enviar({
    to: postulacion.correo,
    subject: "Recibimos tu postulación · IIDEMAYA",
    html: layout(
      `¡Gracias por postularte, ${esc(postulacion.nombre.split(" ")[0])}!`,
      `<p style="font-size:14px;line-height:1.6">Recibimos tu información y tu CV. El equipo la revisará y te contactará a este correo si tu perfil avanza en el proceso.</p>`
    ),
    replyTo: correosEquipo[0],
  });

  return resultadoEquipo;
}

// ---------- Anuncios (panel: enviar un mensaje a una lista libre de correos) ----------
export type DestinatarioAnuncio = { correo: string; nombre: string };

// Sustituye {{nombre}} por el primer nombre de la persona (o lo deja igual
// si no aparece en el mensaje).
function personaliza(mensaje: string, nombre: string): string {
  const primerNombre = (nombre || "").trim().split(/\s+/)[0] || nombre;
  return mensaje.replaceAll("{{nombre}}", primerNombre);
}

function parrafos(texto: string): string {
  return texto
    .split(/\n{2,}/)
    .map((p) => `<p style="font-size:14px;line-height:1.6;white-space:pre-wrap;margin:0 0 12px">${esc(p)}</p>`)
    .join("");
}

type ResultadoEnvioIndividual = { ok: true } | { ok: false; motivo: string };

async function enviarConReintento(
  correo: string,
  cuerpoHtml: string,
  opts: { asunto: string; replyTo?: string }
): Promise<ResultadoEnvioIndividual> {
  if (!API_KEY) {
    sinConfig();
    return { ok: false, motivo: "no configurado" };
  }
  const INTENTOS = 3;
  for (let intento = 1; intento <= INTENTOS; intento++) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          from: FROM,
          to: [correo],
          subject: limpiarAsunto(opts.asunto),
          html: cuerpoHtml,
          ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
        }),
      });
      if (res.ok) return { ok: true };
      const cuerpo = await res.text().catch(() => "");
      if (res.status === 429 && intento < INTENTOS) {
        await esperar(700 * intento);
        continue;
      }
      console.error("[anuncio] Resend respondió", correo, res.status, cuerpo);
      return { ok: false, motivo: res.status === 429 ? "límite de envíos por segundo" : `HTTP ${res.status}` };
    } catch (err) {
      if (intento < INTENTOS) {
        await esperar(500 * intento);
        continue;
      }
      console.error("[anuncio] no se pudo enviar a", correo, err);
      return { ok: false, motivo: "error de red" };
    }
  }
  return { ok: false, motivo: "desconocido" };
}

// Envía el mismo mensaje (personalizado con {{nombre}}) a una lista libre de
// correos que el admin escribió a mano. Cada quien recibe SU PROPIO correo,
// en tandas pequeñas con pausa entre cada una para no pasarse del límite de
// 10 peticiones/seg de Resend, con reintento individual si alguna falla.
export async function enviarAnuncioMasivo(opts: {
  destinatarios: DestinatarioAnuncio[];
  asunto: string;
  mensaje: string; // texto plano; puede usar {{nombre}}; párrafos separados por línea en blanco
  remitenteEmail: string;
}): Promise<{ enviados: number; fallidos: { correo: string; motivo: string }[] }> {
  if (!API_KEY) {
    sinConfig();
    return { enviados: 0, fallidos: opts.destinatarios.map((d) => ({ correo: d.correo, motivo: "no configurado" })) };
  }
  if (opts.destinatarios.length === 0) return { enviados: 0, fallidos: [] };

  const correosEquipo = await getCorreosContacto();
  const html = (nombre: string) => layout(opts.asunto, parrafos(personaliza(opts.mensaje, nombre)));

  let enviados = 0;
  const fallidos: { correo: string; motivo: string }[] = [];
  const TANDA = 5; // concurrencia conservadora frente al límite de 10/seg de Resend
  for (let i = 0; i < opts.destinatarios.length; i += TANDA) {
    const tanda = opts.destinatarios.slice(i, i + TANDA);
    const resultados = await Promise.all(
      tanda.map((d) =>
        enviarConReintento(d.correo, html(d.nombre), { asunto: opts.asunto, replyTo: correosEquipo[0] })
      )
    );
    resultados.forEach((r, idx) => {
      if (r.ok) enviados++;
      else fallidos.push({ correo: tanda[idx].correo, motivo: r.motivo });
    });
    if (i + TANDA < opts.destinatarios.length) await esperar(400);
  }

  return { enviados, fallidos };
}

// ---------- Entrevistas ----------

// "Hola, Ana"; si no se conoce el nombre (invitación solo con correo), "Hola".
const saludo = (nombre: string) => {
  const primero = nombre.trim().split(/\s+/)[0];
  return primero ? `Hola, ${primero}` : "Hola";
};

function boton(url: string, texto: string) {
  return `<p style="margin:20px 0"><a href="${esc(url)}" style="background:#0a3a24;color:#fbfaf7;padding:12px 22px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;display:inline-block">${esc(texto)}</a></p>
  <p style="font-size:12px;color:#888;line-height:1.5;margin:0">Si el botón no funciona, copia este enlace en tu navegador:<br /><span style="word-break:break-all">${esc(url)}</span></p>`;
}

// El detalle (enlace de videollamada o lugar) lo escribe el equipo: si es un
// enlace web se vuelve clicable, si no se muestra como texto.
function detalleHtml(detalle: string) {
  return /^https?:\/\/\S+$/i.test(detalle.trim())
    ? `<a href="${esc(detalle.trim())}" style="color:#0f5132">${esc(detalle.trim())}</a>`
    : esc(detalle);
}

// Invitación para que la persona elija día y hora. Una sola vez por correo y
// con el enlace propio de cada postulación.
export async function sendInvitacionEntrevista(
  p: Pick<Postulacion, "nombre" | "correo" | "vacanteTitulo"> & { invitado?: boolean },
  token: string
): Promise<ResultadoEnvio> {
  const correosEquipo = await getCorreosPostulacion();
  const posicion = p.vacanteTitulo ? ` para la posición de ${esc(p.vacanteTitulo)}` : "";
  // Quien postuló recibe un agradecimiento; a quien se invitó a mano no se le
  // agradece una postulación que no hizo.
  const intro = p.invitado
    ? "Nos gustaría conocerte y te invitamos a una entrevista con IIDEMAYA: elige el día y la hora que mejor te acomoden."
    : `Gracias por postularte${posicion}. Nos gustaría conocerte: elige el día y la hora que mejor te acomoden para tu entrevista.`;
  return enviar({
    to: p.correo,
    subject: "Agenda tu entrevista · IIDEMAYA",
    html: layout(
      esc(saludo(p.nombre)),
      `<p style="font-size:14px;line-height:1.6">${intro}</p>
      ${boton(urlAgenda(token), "Agendar mi entrevista")}
      <p style="font-size:13px;color:#666;line-height:1.6;margin-top:16px">Si ninguno de los horarios te sirve, responde a este correo y buscamos otro.</p>`
    ),
    replyTo: correosEquipo[0],
  });
}

// Se envían en tandas pequeñas con pausa (límite de peticiones por segundo de
// Resend). Devuelve quién recibió la invitación y quién no, para marcar solo
// a quienes sí salió.
export async function sendInvitacionesEntrevista(
  lista: {
    id: string;
    nombre: string;
    correo: string;
    vacanteTitulo: string | null;
    token: string;
    invitado?: boolean;
  }[]
): Promise<{ enviados: string[]; fallidos: { id: string; correo: string; motivo: string }[] }> {
  const enviados: string[] = [];
  const fallidos: { id: string; correo: string; motivo: string }[] = [];
  const TANDA = 4;
  for (let i = 0; i < lista.length; i += TANDA) {
    const tanda = lista.slice(i, i + TANDA);
    const resultados = await Promise.all(tanda.map((p) => sendInvitacionEntrevista(p, p.token)));
    resultados.forEach((r, idx) => {
      if (r.ok) enviados.push(tanda[idx].id);
      else fallidos.push({ id: tanda[idx].id, correo: tanda[idx].correo, motivo: r.motivo });
    });
    if (i + TANDA < lista.length) await esperar(500);
  }
  return { enviados, fallidos };
}

// Confirmación a quien reservó (con el evento para su calendario) y aviso al
// equipo. `cambio` indica que movió una entrevista que ya tenía.
export async function sendEntrevistaAgendada(
  p: { nombre: string; correo: string; vacanteTitulo: string | null; rutaAdmin: string },
  franja: FranjaEntrevista,
  token: string,
  cambio: boolean
): Promise<void> {
  const correosEquipo = await getCorreosPostulacion();
  const cuando = fechaHoraLargaGt(franja.inicio);

  await enviar({
    to: p.correo,
    subject: cambio ? "Cambiamos tu entrevista · IIDEMAYA" : "Tu entrevista está agendada · IIDEMAYA",
    html: layout(
      cambio ? "Tu entrevista cambió de horario" : "¡Tu entrevista está agendada!",
      `<p style="font-size:14px;line-height:1.6">${esc(saludo(p.nombre))}. Te esperamos:</p>
      ${filas([
        ["Fecha", cuando],
        ["Hora", `${rangoHorasGt(franja.inicio, franja.fin)} (hora de Guatemala)`],
      ])}
      ${
        franja.detalle
          ? `<p style="font-size:14px;line-height:1.6;margin-top:12px"><strong>Dónde / cómo:</strong><br />${detalleHtml(franja.detalle)}</p>`
          : `<p style="font-size:13px;color:#666;line-height:1.6;margin-top:12px">Te enviaremos los detalles de conexión o el lugar antes de la entrevista.</p>`
      }
      <p style="font-size:13px;color:#666;line-height:1.6;margin-top:14px">Adjuntamos el evento para que lo agregues a tu calendario. Si necesitas otro horario, puedes cambiarlo desde este enlace:</p>
      <p style="font-size:13px;margin:0"><a href="${esc(urlAgenda(token))}" style="color:#0f5132">Cambiar mi horario</a></p>`
    ),
    replyTo: correosEquipo[0],
    attachments: [
      { filename: "entrevista.ics", content: Buffer.from(crearIcs(franja), "utf-8").toString("base64") },
    ],
  });

  if (correosEquipo.length) {
    await enviar({
      to: correosEquipo,
      subject: `${cambio ? "Entrevista reprogramada" : "Entrevista agendada"}: ${p.nombre || p.correo}`,
      html: layout(
        cambio ? "Una persona cambió su entrevista" : "Una persona agendó su entrevista",
        `${filas([
          ["Nombre", p.nombre || p.correo],
          ["Correo", p.correo],
          ["Posición", p.vacanteTitulo ?? "Postulación general"],
          ["Fecha", cuando],
          ["Hora", rangoHorasGt(franja.inicio, franja.fin)],
        ])}
        <p style="margin-top:16px"><a href="${ADMIN_URL}${p.rutaAdmin}" style="color:#0f5132">Ver en el panel →</a></p>`
      ),
      replyTo: p.correo,
    });
  }
}

// El equipo liberó un horario que la persona tenía reservado: se le avisa y se
// le da el enlace para elegir otro.
export async function sendEntrevistaLiberada(
  p: Pick<Postulacion, "nombre" | "correo">,
  franja: Pick<FranjaEntrevista, "inicio">,
  token: string
): Promise<ResultadoEnvio> {
  const correosEquipo = await getCorreosPostulacion();
  return enviar({
    to: p.correo,
    subject: "Necesitamos reagendar tu entrevista · IIDEMAYA",
    html: layout(
      esc(saludo(p.nombre)),
      `<p style="font-size:14px;line-height:1.6">Tuvimos que liberar el horario de tu entrevista del ${esc(fechaHoraLargaGt(franja.inicio))}. Disculpa el inconveniente: elige otro horario que te acomode.</p>
      ${boton(urlAgenda(token), "Elegir otro horario")}`
    ),
    replyTo: correosEquipo[0],
  });
}
