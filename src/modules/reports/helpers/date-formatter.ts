import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

export class DateFormatter {
  static formatter = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });

  static getDDMMYYYY(date: Date): string {
    const zonedDate = toZonedTime(date, 'America/Lima');
    const formatted = format(zonedDate, "d 'de' MMMM 'del' yyyy", {
      locale: es,
    });

    return formatted;
  }
}
