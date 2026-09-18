import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatearFechaHoraGt } from "@/lib/fecha";
import {
  PREGUNTAS_TEXTO,
  PREGUNTA_DIA_NO_DISPONIBLE,
  PREGUNTAS_SI_NO,
  OPCIONES_MODALIDAD,
} from "@/lib/postulacion-preguntas";

const ESTADO_LABEL: Record<string, string> = {
  NUEVA: "Nueva",
  EN_REVISION: "En revisión",
  ENTREVISTA: "Entrevista",
  RECHAZADA: "Rechazada",
  CONTRATADA: "Contratada",
};

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const postulaciones = await prisma.postulacion.findMany({ orderBy: { createdAt: "desc" } });

  const libro = new ExcelJS.Workbook();
  libro.creator = "IIDEMAYA";
  libro.created = new Date();
  const hoja = libro.addWorksheet("Postulaciones");

  // Derivamos el origen (https://dominio) de ADMIN_URL en vez de asumir su
  // forma exacta, para armar bien el enlace a /api/admin/archivo/...
  let origen = "";
  try {
    origen = process.env.ADMIN_URL ? new URL(process.env.ADMIN_URL).origin : "";
  } catch {
    origen = "";
  }

  hoja.columns = [
    { header: "Fecha", key: "fecha", width: 20 },
    { header: "Nombre", key: "nombre", width: 26 },
    { header: "Correo", key: "correo", width: 28 },
    { header: "Teléfono", key: "telefono", width: 16 },
    { header: "Estado", key: "estado", width: 14 },
    { header: "Modalidad de trabajo", key: "modalidad", width: 18 },
    ...PREGUNTAS_SI_NO.map((p) => ({ header: p.label, key: p.key, width: 22 })),
    ...PREGUNTAS_TEXTO.map((p) => ({ header: p.label, key: p.key, width: 40 })),
    { header: PREGUNTA_DIA_NO_DISPONIBLE.label, key: "diaNoDisponible", width: 22 },
    { header: "CV", key: "cv", width: 18 },
    { header: "Documento adicional", key: "documento", width: 20 },
  ];

  hoja.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  hoja.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A3A24" } };
  hoja.views = [{ state: "frozen", ySplit: 1 }];

  for (const post of postulaciones) {
    const fila: Record<string, unknown> = {
      fecha: formatearFechaHoraGt(post.createdAt),
      nombre: post.nombre,
      correo: post.correo,
      telefono: post.telefono || "",
      estado: ESTADO_LABEL[post.estado] || post.estado,
      modalidad: OPCIONES_MODALIDAD.find((o) => o.value === post.modalidadTrabajo)?.label || post.modalidadTrabajo,
      diaNoDisponible: post.diaNoDisponible || "",
    };
    for (const p of PREGUNTAS_SI_NO) {
      fila[p.key] = post[p.key as keyof typeof post] ? "Sí" : "No";
    }
    for (const p of PREGUNTAS_TEXTO) {
      fila[p.key] = String(post[p.key as keyof typeof post] ?? "");
    }

    const filaExcel = hoja.addRow(fila);
    if (origen) {
      filaExcel.getCell("cv").value = {
        text: "Descargar",
        hyperlink: `${origen}/api/admin/archivo/${post.cvBlobKey}`,
      };
      if (post.documentoBlobKey) {
        filaExcel.getCell("documento").value = {
          text: "Descargar",
          hyperlink: `${origen}/api/admin/archivo/${post.documentoBlobKey}`,
        };
      }
    }
  }

  const buffer = await libro.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="postulaciones-iidemaya.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
