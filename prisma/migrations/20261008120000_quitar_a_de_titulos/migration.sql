-- Quita el "(a)" de las tres vacantes iniciales (títulos y textos). Solo toca
-- esas tres, para no pisar vacantes creadas o editadas desde el panel.
UPDATE "Vacante"
SET
  "titulo" = replace("titulo", '(a)', ''),
  "resumen" = replace("resumen", '(a)', ''),
  "modalidad" = replace("modalidad", '(a)', ''),
  "funciones" = ARRAY(
    SELECT replace(x, '(a)', '') FROM unnest("funciones") WITH ORDINALITY AS t(x, n) ORDER BY n
  ),
  "requisitos" = ARRAY(
    SELECT replace(x, '(a)', '') FROM unnest("requisitos") WITH ORDINALITY AS t(x, n) ORDER BY n
  ),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" IN ('vacante-dev-semi-senior', 'vacante-dev-junior', 'vacante-help-desk');

-- El título guardado en cada postulación debe coincidir con el nuevo nombre.
UPDATE "Postulacion"
SET "vacanteTitulo" = replace("vacanteTitulo", '(a)', '')
WHERE "vacanteId" IN ('vacante-dev-semi-senior', 'vacante-dev-junior', 'vacante-help-desk');
