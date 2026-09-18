import PDFDocument from "pdfkit";
import type { Postulacion } from "@prisma/client";
import { formatearFechaHoraGt } from "./fecha";
import {
  PREGUNTAS_TEXTO,
  PREGUNTA_DIA_NO_DISPONIBLE,
  PREGUNTAS_SI_NO,
  OPCIONES_MODALIDAD,
} from "./postulacion-preguntas";

const VERDE_OSCURO = "#0A3A24";
const VERDE = "#0F5132";
const GRIS = "#555555";

const ESTADO_LABEL: Record<string, string> = {
  NUEVA: "Nueva",
  EN_REVISION: "En revisión",
  ENTREVISTA: "Entrevista",
  RECHAZADA: "Rechazada",
  CONTRATADA: "Contratada",
};

function pregunta(doc: PDFKit.PDFDocument, etiqueta: string, respuesta: string) {
  doc.font("Helvetica-Bold").fontSize(10).fillColor(GRIS).text(etiqueta);
  doc.font("Helvetica").fontSize(11).fillColor("#1C2321").text(respuesta || "—", { paragraphGap: 10 });
  doc.moveDown(0.4);
}

// Genera el PDF en memoria y devuelve el buffer completo — más simple que
// hacer streaming para un documento de este tamaño (una sola postulación).
export function generarPdfPostulacion(postulacion: Postulacion): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margins: { top: 60, bottom: 60, left: 56, right: 56 } });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Encabezado
    doc.font("Helvetica-Bold").fontSize(20).fillColor(VERDE_OSCURO).text("IIDEMAYA");
    doc.font("Helvetica").fontSize(10).fillColor(GRIS).text("Postulación de personal");
    doc.moveDown(0.6);
    doc
      .strokeColor("#C98A2C")
      .lineWidth(2)
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .stroke();
    doc.moveDown(1);

    doc.font("Helvetica-Bold").fontSize(16).fillColor(VERDE_OSCURO).text(postulacion.nombre);
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(GRIS)
      .text(`${postulacion.correo}${postulacion.telefono ? " · " + postulacion.telefono : ""}`);
    doc.text(`Enviado el ${formatearFechaHoraGt(postulacion.createdAt)}`);
    doc.text(`Estado: ${ESTADO_LABEL[postulacion.estado] || postulacion.estado}`);
    doc.moveDown(1);

    // Datos adicionales
    doc.font("Helvetica-Bold").fontSize(13).fillColor(VERDE).text("Datos adicionales");
    doc.moveDown(0.3);
    pregunta(
      doc,
      "Modalidad de trabajo",
      OPCIONES_MODALIDAD.find((o) => o.value === postulacion.modalidadTrabajo)?.label ||
        postulacion.modalidadTrabajo
    );
    for (const p of PREGUNTAS_SI_NO) {
      const valor = postulacion[p.key as keyof Postulacion];
      pregunta(doc, p.label, valor ? "Sí" : "No");
    }
    if (postulacion.diaNoDisponible) {
      pregunta(doc, PREGUNTA_DIA_NO_DISPONIBLE.label, postulacion.diaNoDisponible);
    }

    // Cuestionario
    doc.moveDown(0.4);
    doc.font("Helvetica-Bold").fontSize(13).fillColor(VERDE).text("Cuestionario");
    doc.moveDown(0.3);
    for (const p of PREGUNTAS_TEXTO) {
      pregunta(doc, p.label, String(postulacion[p.key as keyof Postulacion] ?? ""));
    }

    doc.end();
  });
}
