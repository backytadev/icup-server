import { CalendarEvent } from '@/modules/calendar-events/entities/calendar-event.entity';

const categoryEmoji: Record<string, string> = {
  worship_service: '⛪',
  fast: '🙏',
  vigil: '🌙',
  retreat: '🏕️',
  camp: '⛺',
  conference: '🎤',
  walk: '🚶',
  other: '📌',
};

const categoryLabel: Record<string, string> = {
  worship_service: 'Culto',
  fast: 'Ayuno',
  vigil: 'Vigilia',
  retreat: 'Retiro',
  camp: 'Campamento',
  conference: 'Conferencia',
  walk: 'Paseo',
  other: 'Evento',
};

export function formatEventMessage(event: CalendarEvent): string {
  const emoji = categoryEmoji[event.category] ?? '📅';
  const label = categoryLabel[event.category] ?? 'Evento';

  const startDate = new Date(event.startDate);
  const formattedDate = startDate.toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = startDate.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const capitalizedDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    `${emoji} *${event.title}*\n` +
    `_${label}_\n\n` +
    `📋 ${event.description}\n\n` +
    `📅 *Fecha:* ${capitalizedDate}\n` +
    `⏰ *Hora:* ${formattedTime}\n` +
    (event.locationName ? `📍 *Lugar:* ${event.locationName}` : '') +
    (event.locationReference ? `\n   📌 ${event.locationReference}` : '')
  );
}
