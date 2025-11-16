export const MONTH_MAP_EN_TO_ES: Record<string, string> = {
  january: 'Enero',
  february: 'Febrero',
  march: 'Marzo',
  april: 'Abril',
  may: 'Mayo',
  june: 'Junio',
  july: 'Julio',
  august: 'Agosto',
  september: 'Septiembre',
  october: 'Octubre',
  november: 'Noviembre',
  december: 'Diciembre',
};

export const normalizeMonth = (month: string) => {
  if (!month) return null;

  const lower = month.toLowerCase();
  const spanish = MONTH_MAP_EN_TO_ES[lower];
  return spanish ?? null;
};
