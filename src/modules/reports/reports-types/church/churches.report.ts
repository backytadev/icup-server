import type { TDocumentDefinitions } from 'pdfmake/interfaces';

import { formatDateToLimaDayMonthYear } from '@/common/helpers/format-date-to-lima';

import { Church } from '@/modules/church/entities/church.entity';
import { ChurchServiceTimeNames } from '@/modules/church/enums/church-service-time.enum';

import { footerSection } from '@/modules/reports/sections/footer.section';
import { headerSection } from '@/modules/reports/sections/header.section';

interface ReportOptions {
  title?: string;
  subTitle?: string;
  description: string;
  searchTerm?: string;
  searchType?: string;
  searchSubType?: string;
  orderSearch?: string;
  churchName?: string;
  data: Church[];
}

export const getChurchesReport = (
  options: ReportOptions,
): TDocumentDefinitions => {
  const {
    title,
    subTitle,
    data,
    description,
    searchTerm,
    searchType,
    searchSubType,
    orderSearch,
    churchName,
  } = options;

  return {
    pageOrientation: 'landscape',
    header: headerSection({
      title: title,
      subTitle: subTitle,
      searchTerm: searchTerm,
      searchType: searchType,
      searchSubType: searchSubType,
      orderSearch: orderSearch,
      churchName: churchName,
    }),
    footer: footerSection,
    pageMargins: [20, 120, 20, 60],
    content: [
      {
        layout: 'customLayout01', // optional
        table: {
          headerRows: 1,
          widths: [100, 75, 'auto', 60, 95, 'auto', 'auto'],

          body: [
            [
              {
                text: 'Nombre',
                style: {
                  bold: true,
                },
              },
              {
                text: 'F. Fundación',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Anexo',
                style: {
                  bold: true,
                },
              },
              {
                text: 'H. Culto',
                style: {
                  bold: true,
                },
              },
              {
                text: 'N. Teléfono',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Distrito (S.U)',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Dirección',
                style: {
                  bold: true,
                },
              },
            ],
            ...data.map((item) => [
              `${item?.abbreviatedChurchName}`,
              formatDateToLimaDayMonthYear(item?.foundingDate),
              item?.isAnexe ? 'Sí' : 'No',
              item?.serviceTimes.map((item) => ChurchServiceTimeNames[item]),
              item?.phoneNumber,
              `${item?.district} - ${item?.urbanSector}`,
              `${item?.address} (${item?.referenceAddress})`,
            ]),
            ['', '', '', '', '', '', ''],
            ['', '', '', '', '', '', ''],
          ],
        },
      },

      {
        layout: 'noBorders',
        table: {
          headerRows: 1,
          widths: [100, 75, 'auto', 60, 75, 'auto', 'auto'],
          body: [
            [
              {
                text: `Total de ${description}:`,
                colSpan: 1,
                fontSize: 13,
                bold: true,
                margin: [0, 10, 0, 0],
              },
              {
                text: `${data.length} ${description}.`,
                bold: true,
                fontSize: 13,
                colSpan: 2,
                margin: [0, 10, 0, 0],
              },
              {},
              {},
              {},
              {},
              {},
            ],
          ],
        },
      },
    ],
  };
};
