-- CreateTable
CREATE TABLE "Vacante" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "resumen" TEXT NOT NULL,
    "modalidad" TEXT NOT NULL,
    "funciones" TEXT[],
    "requisitos" TEXT[],
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vacante_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Postulacion" ADD COLUMN     "vacanteId" TEXT,
ADD COLUMN     "vacanteTitulo" TEXT;

-- CreateIndex
CREATE INDEX "Postulacion_vacanteId_idx" ON "Postulacion"("vacanteId");

-- AddForeignKey
ALTER TABLE "Postulacion" ADD CONSTRAINT "Postulacion_vacanteId_fkey" FOREIGN KEY ("vacanteId") REFERENCES "Vacante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Vacantes iniciales (resumen del documento "Perfiles y TDR para Unidad de
-- Informática", sin honorarios). Después se administran desde /admin/vacantes.
INSERT INTO "Vacante" ("id", "titulo", "resumen", "modalidad", "funciones", "requisitos", "activa", "orden", "updatedAt") VALUES
(
  'vacante-dev-semi-senior',
  'Desarrollador(a) Semi-Senior',
  'Construirás y mantendrás los sistemas propios de IIDEMAYA (centros educativos, contabilidad, ITMES y un sistema administrativo interno), trabajando con autonomía bajo la coordinación del Líder de TI.',
  'Híbrida: presencial de tiempo completo al inicio (análisis, diseño y capacitación) y después remota o híbrida según la necesidad del proyecto.',
  ARRAY[
    'Desarrollar y mantener los módulos del sistema que se te asigne.',
    'Implementar soluciones en la nube (AWS) siguiendo la arquitectura definida por el Líder de TI.',
    'Trabajar con control de versiones (Git/GitHub), revisión de código y documentación técnica.',
    'Participar en el levantamiento de requerimientos y en el diseño técnico de los nuevos sistemas.',
    'Apoyar y revisar el trabajo del desarrollador(a) junior.',
    'Diseñar pensando en centros educativos con conexión a internet limitada.',
    'Reportar avances y bloqueos de forma oportuna.'
  ],
  ARRAY[
    'Estudiante avanzado o graduado de Ingeniería en Sistemas, Ciencias de la Computación o carrera afín.',
    'Mínimo 3 años de experiencia en desarrollo de software, en backend o en frontend (no se requiere ser full-stack).',
    'Experiencia trabajando con autonomía en esquema remoto o híbrido.',
    'Bases de datos relacionales y SQL.',
    'Git/GitHub y flujo de revisión de código (pull requests).',
    'Nociones de sistemas operativos (Windows/Linux) y de seguridad en el desarrollo.',
    'Deseable: experiencia con despliegues en AWS u otra nube.',
    'No se exige un lenguaje o framework específico; se valoran los fundamentos.'
  ],
  true,
  1,
  CURRENT_TIMESTAMP
),
(
  'vacante-dev-junior',
  'Desarrollador(a) Junior',
  'Apoyarás al equipo de TI en documentación, diseño y desarrollo guiado de los sistemas de IIDEMAYA, con acompañamiento cercano del Semi-Senior y del Líder de TI.',
  'Híbrida: presencial de tiempo completo al inicio, con acompañamiento y capacitación, y luego remota o híbrida según tu autonomía y la necesidad del proyecto.',
  ARRAY[
    'Apoyar el levantamiento y la documentación de procesos de los sistemas en preparación.',
    'Elaborar wireframes (bocetos de pantallas) para validar con los usuarios.',
    'Realizar tareas de desarrollo guiadas, con revisión de tu trabajo.',
    'Apoyar en pruebas funcionales y en el reporte de errores.',
    'Participar en sesiones de planificación y en visitas puntuales a centros u oficinas.',
    'Documentar tu trabajo siguiendo los estándares del equipo.'
  ],
  ARRAY[
    'Estudiante o egresado de Ingeniería en Sistemas, Ciencias de la Computación o carrera afín.',
    '0 a 2 años de experiencia en desarrollo (se aceptan proyectos académicos y prácticas).',
    'Conocimientos básicos de programación web (frontend y/o backend).',
    'Nociones de bases de datos relacionales y SQL.',
    'Nociones de Git y de sistemas operativos (Windows/Linux).',
    'Disposición para aprender, recibir acompañamiento y documentar con claridad.',
    'Disponibilidad para trabajar de forma presencial a tiempo completo al inicio.',
    'No se exige una tecnología específica; se valoran los fundamentos.'
  ],
  true,
  2,
  CURRENT_TIMESTAMP
),
(
  'vacante-help-desk',
  'Técnico(a) de Help Desk / Soporte en Sitio',
  'Serás el primer punto de contacto del personal para resolver las incidencias tecnológicas del día a día en la oficina, y aplicarás en sitio las políticas de seguridad definidas por el Líder de TI.',
  'Presencial, tiempo completo, en las instalaciones de IIDEMAYA.',
  ARRAY[
    'Dar soporte técnico presencial a usuarios: computadoras, laptops y periféricos.',
    'Resolver problemas de correo institucional y de herramientas de oficina (Office 365 / Google Workspace).',
    'Mantener las impresoras y la red local de la oficina (switches, cableado y WiFi), escalando las fallas mayores.',
    'Instalar antivirus y actualizaciones, y aplicar en los equipos las políticas de seguridad y control de acceso.',
    'Llevar el inventario de equipos y licencias, y preparar y entregar equipo nuevo.',
    'Crear, modificar y dar de baja cuentas de correo y accesos básicos.',
    'Registrar cada incidencia y su solución, y capacitar a los usuarios en el uso básico de las herramientas.'
  ],
  ARRAY[
    'Técnico en informática, redes o carrera afín, o estudiante avanzado de Ingeniería en Sistemas.',
    '1 a 2 años de experiencia en soporte técnico o mesa de ayuda.',
    'Windows: instalación, configuración y solución de fallas comunes.',
    'Office 365 / Google Workspace: cuentas, correo y aplicaciones básicas.',
    'Redes básicas (TCP/IP, WiFi, cableado) e impresoras de red.',
    'Orientación al servicio y buen trato con usuarios no técnicos.',
    'Capacidad de atender varias solicitudes a la vez y de seguir con disciplina los lineamientos de seguridad.',
    'Disponibilidad presencial de tiempo completo.'
  ],
  true,
  3,
  CURRENT_TIMESTAMP
);
