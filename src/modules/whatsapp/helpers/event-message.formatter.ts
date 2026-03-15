import { CalendarEvent } from '@/modules/calendar-events/entities/calendar-event.entity';
import { CalendarEventCategory } from '@/common/enums/calendar-event-category.enum';
import { Member } from '@/modules/member/entities/member.entity';

const categoryEmoji: Record<CalendarEventCategory, string> = {
  [CalendarEventCategory.WorshipService]: '⛪',
  [CalendarEventCategory.Discipleship]: '📖',
  [CalendarEventCategory.Prayer]: '🙏',
  [CalendarEventCategory.Evangelism]: '✝️',
  [CalendarEventCategory.Ministry]: '🎺',
  [CalendarEventCategory.Meetings]: '🎤',
  [CalendarEventCategory.SpecialEvent]: '🌟',
  [CalendarEventCategory.Fellowship]: '🤝',
  [CalendarEventCategory.Other]: '📌',
};

const categoryLabel: Record<CalendarEventCategory, string> = {
  [CalendarEventCategory.WorshipService]: 'Cultos y Servicios',
  [CalendarEventCategory.Discipleship]: 'Discipulado y Enseñanza',
  [CalendarEventCategory.Prayer]: 'Oración e Intercesión',
  [CalendarEventCategory.Evangelism]: 'Evangelismo y Misiones',
  [CalendarEventCategory.Ministry]: 'Ministerios',
  [CalendarEventCategory.Meetings]: 'Reuniones y Conferencias',
  [CalendarEventCategory.SpecialEvent]: 'Eventos Especiales',
  [CalendarEventCategory.Fellowship]: 'Confraternidad y Actividades',
  [CalendarEventCategory.Other]: 'Otro',
};

export function formatEventsSummary(events: CalendarEvent[]): string {
  const firstDate = new Date(events[0].startDate);
  const formattedDate = firstDate.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Lima',
  });
  const capitalizedDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

  const lines: string[] = [
    `📋 *AGENDA DEL DÍA*`,
    `📅 ${capitalizedDate}`,
    `─────────────────────`,
  ];

  events.forEach((event, index) => {
    const num = numbers[index] ?? `${index + 1}.`;

    const startDate = new Date(event.startDate);
    const startTime = startDate.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Lima',
    });

    const endTime = event.endDate
      ? new Date(event.endDate).toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Lima',
        })
      : null;

    lines.push(`${num} *${event.title}*`);
    lines.push(`🏷️ *Categoría:* ${categoryLabel[event.category] ?? 'Evento'}`);
    lines.push(`🕐 *Horario:* ${startTime}${endTime ? ` — ${endTime}` : ''}`);

    if (event.locationName) {
      lines.push(`📍 *Lugar:* ${event.locationName}`);
    }

    if (event.locationReference) {
      lines.push(`📌 *Referencia:* ${event.locationReference}`);
    }

    if (event.description) {
      lines.push(`📝 *Nota:* ${event.description}`);
    }

    if (index < events.length - 1) {
      lines.push('');
    }
  });

  const bibleVerses = [
    '"No dejemos de congregarnos, como algunos acostumbran hacerlo." — Heb. 10:25',
    '"Todo lo que hagan, háganlo de corazón, como para el Señor." — Col. 3:23',
    '"Donde dos o tres se reúnen en mi nombre, allí estoy yo en medio de ellos." — Mat. 18:20',
    '"Obedezcan a sus líderes y sométanse a ellos, pues cuidan de ustedes." — Heb. 13:17',
    '"No se olviden de hacer el bien y de compartir lo que tienen." — Heb. 13:16',
    '"Síganme, y yo los haré pescadores de hombres." — Mat. 4:19',
    '"Estén firmes, inconmovibles, progresando en la obra del Señor." — 1 Cor. 15:58',
  ];

  const now = new Date();
  const dayIndex = now.toLocaleDateString('es-PE', {
    weekday: 'long',
    timeZone: 'America/Lima',
  });
  const dayMap: Record<string, number> = {
    lunes: 0,
    martes: 1,
    miércoles: 2,
    jueves: 3,
    viernes: 4,
    sábado: 5,
    domingo: 6,
  };
  const verse = bibleVerses[dayMap[dayIndex] ?? 0];

  lines.push(`─────────────────────`);
  lines.push(`_${verse}_`);

  return lines.join('\n');
}

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

  const hasLocation = event.latitude && event.longitude;
  const hasDescription = event.description;

  return (
    `${emoji} *${event.title}*\n` +
    `_${label}_\n\n` +
    (hasDescription ? `📋 ${event.description}\n\n` : '') +
    `📅 *Fecha:* ${capitalizedDate}\n` +
    `⏰ *Hora:* ${formattedTime}\n` +
    (event.locationName ? `📍 *Lugar:* ${event.locationName}` : '') +
    (event.locationReference ? `\n📍 *Ref:* ${event.locationReference}` : '') +
    (hasLocation ? '\n\n📌 *Ubicación del evento* ⬇️' : '')
  );
}

export function formatBirthdayMessage(members: Member[]): string {
  const now = new Date();

  const formattedDate = now.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Lima',
  });
  const capitalizedDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

  const isSingle = members.length === 1;

  const lines: string[] = [
    `🎂 *¡FELIZ CUMPLEAÑOS!*`,
    `📅 ${capitalizedDate}`,
    `─────────────────────`,
    isSingle
      ? `En este día tan especial, toda la familia de *ICUP* se une para celebrar y agradecer a Dios por la vida de uno de nuestros hermanos.\n\nQue este nuevo año de vida esté lleno de la gracia, la paz y el favor de nuestro Señor Jesucristo. 🙏\n\n¡Te amamos, hermano/a! Eres una bendición para nuestra congregación. 💛`
      : `En este día tan especial, toda la familia de *ICUP* se une para celebrar y agradecer a Dios por la vida de nuestros hermanos tan queridos.\n\nQue este nuevo año de vida esté lleno de la gracia, la paz y el favor de nuestro Señor Jesucristo. 🙏\n\n¡Los amamos, hermanos! Son una bendición para nuestra congregación. 💛`,
    `─────────────────────`,
  ];

  members.forEach((member, index) => {
    const num = numbers[index] ?? `${index + 1}.`;
    const fullName = `${member.firstNames} ${member.lastNames}`;

    lines.push(`${num} *${fullName}*`);
    lines.push(`   🥳 Hoy cumple *${member.age} años*`);

    if (index < members.length - 1) {
      lines.push('');
    }
  });

  lines.push(`─────────────────────`);
  lines.push(
    `_"Que el Señor te bendiga y te guarde; que haga resplandecer su rostro sobre ti y te sea propicio." — Núm. 6:24-25_`,
  );

  return lines.join('\n');
}
