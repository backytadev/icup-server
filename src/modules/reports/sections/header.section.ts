import type { Content } from 'pdfmake/interfaces';

import { RecordOrderNames } from '@/common/enums/record-order.enum';
import { DateFormatter } from '@/modules/reports/helpers/date-formatter';

const monthNames = {
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

const logo: Content = {
  image: 'src/assets/logo.png',
  width: 85,
  height: 85,
  margin: [20, 15, 0, 20],
};

// const currentDate: Content = {
//   text: DateFormatter.getDDMMYYYY(new Date()),
//   alignment: 'right',
//   bold: true,
//   margin: [-35, 40, 20, 35],
//   width: 150,
// };

interface HeaderSectionOptions {
  title?: string;
  subTitle?: string;
  yearSearch?: string;
  startMonthSearch?: string;
  endMonthSearch?: string;
  searchTerm?: string;
  searchType?: string;
  searchSubType?: string;
  orderSearch?: string;
  showLogo?: boolean;
  showDate?: boolean;
  churchName?: string;
}

export const headerSection = (options: HeaderSectionOptions): Content => {
  const {
    title,
    subTitle,
    showDate = true,
    showLogo = true,
    searchTerm,
    searchType,
    searchSubType,
    orderSearch,
    yearSearch,
    startMonthSearch,
    endMonthSearch,
    churchName,
  } = options;

  const headerLogo: Content = showLogo ? logo : null;
  const headerDate: Content = showDate
    ? {
        text: DateFormatter.getDDMMYYYY(new Date()),
        alignment: 'right',
        bold: true,
        margin: [-35, 40, 20, 35],
        width: 150,
      }
    : null;

  const headerSubtitle: Content = subTitle
    ? {
        text: subTitle,
        alignment: 'center',
        margin: [20, 2, 0, 0],
        style: {
          bold: true,
          fontSize: 16,
        },
      }
    : null;

  const headerTerms: Content =
    searchTerm && searchSubType && orderSearch && churchName
      ? {
          text: `Tipo de búsqueda: ${searchType} ~ Sub-tipo de búsqueda: ${searchSubType}\n Tipo de orden: ${orderSearch} ~ Iglesia de búsqueda: ${churchName}\n Termino de búsqueda: ${searchTerm}`,
          alignment: 'center',
          margin: [20, 5, 0, 0],
          style: {
            color: '#3b9917',
            bold: true,
            fontSize: 12,
          },
        }
      : searchTerm && searchSubType && orderSearch && !churchName
        ? {
            text: `Tipo de búsqueda: ${searchType} ~ Sub-tipo de búsqueda: ${searchSubType}\n Tipo de orden: ${orderSearch} ~ Iglesia de búsqueda: Todas las iglesias \n Termino de búsqueda: ${searchTerm}`,
            alignment: 'center',
            margin: [20, 5, 0, 0],
            style: {
              color: '#3b9917',
              bold: true,
              fontSize: 12,
            },
          }
        : !searchTerm && !searchSubType && orderSearch && !churchName
          ? {
              text: `Tipo de búsqueda: Búsqueda general / Tipo de orden: ${RecordOrderNames[orderSearch]}\n Iglesia de búsqueda: Todas las iglesias`,
              alignment: 'center',
              margin: [20, 5, 0, 0],
              style: {
                color: '#3b9917',
                bold: true,
                fontSize: 12,
              },
            }
          : !searchTerm && !searchSubType && orderSearch && churchName
            ? {
                text: `Tipo de búsqueda: Búsqueda general / Tipo de orden: ${RecordOrderNames[orderSearch]}\n Iglesia de búsqueda: ${churchName}`,
                alignment: 'center',
                margin: [20, 5, 0, 0],
                style: {
                  color: '#3b9917',
                  bold: true,
                  fontSize: 12,
                },
              }
            : startMonthSearch && endMonthSearch && yearSearch
              ? {
                  text: `Año de búsqueda: ${yearSearch} / Mes de búsqueda: ${monthNames[startMonthSearch]} - ${monthNames[endMonthSearch]}`,
                  alignment: 'center',
                  margin: [20, 5, 0, 0],
                  style: {
                    color: '#3b9917',
                    bold: true,
                    fontSize: 12,
                  },
                }
              : !startMonthSearch && !endMonthSearch && yearSearch
                ? {
                    text: `Año de búsqueda: ${yearSearch}`,
                    alignment: 'center',
                    margin: [20, 5, 0, 0],
                    style: {
                      color: '#3b9917',
                      bold: true,
                      fontSize: 12,
                    },
                  }
                : null;

  const headerTitle: Content = title
    ? {
        stack: [
          {
            text: title,
            alignment: 'center',
            margin: [20, 20, 0, 0],
            style: {
              bold: true,
              fontSize: 22,
            },
          },
          headerSubtitle,
          headerTerms,
        ],
      }
    : null;

  return {
    columns: [headerLogo, headerTitle, headerDate],
  };
};
