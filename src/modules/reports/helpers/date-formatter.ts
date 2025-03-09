export class DateFormatter {
  static formatter = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });

  static getDDMMYYYY(date: Date): string {
    return this.formatter.format(date);
  }
}
