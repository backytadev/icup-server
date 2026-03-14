export enum CalendarEventSearchType {
  Date = 'date',
  Title = 'title',
  Category = 'category',
  TargetGroup = 'target_group',
  Status = 'status',
}

export const CalendarEventSearchTypeNames: Record<
  CalendarEventSearchType,
  string
> = {
  [CalendarEventSearchType.Date]: 'Fecha',
  [CalendarEventSearchType.Title]: 'Título',
  [CalendarEventSearchType.Category]: 'Categoría',
  [CalendarEventSearchType.TargetGroup]: 'Grupo WhatsApp',
  [CalendarEventSearchType.Status]: 'Estado',
};
