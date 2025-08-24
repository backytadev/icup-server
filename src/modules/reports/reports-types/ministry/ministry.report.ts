import type { TDocumentDefinitions } from 'pdfmake/interfaces';

import { formatDateToLimaDayMonthYear } from '@/common/helpers/format-date-to-lima';

import { Ministry } from '@/modules/ministry/entities/ministry.entity';
import { MinistryServiceTimeNames } from '@/modules/ministry/enums/ministry-service-time.enum';

import { footerSection } from '@/modules/reports/sections/footer.section';
import { headerSection } from '@/modules/reports/sections/header.section';
import {
  MinistryType,
  MinistryTypeNames,
} from '@/modules/ministry/enums/ministry-type.enum';

interface ReportOptions {
  title?: string;
  subTitle?: string;
  description: string;
  searchTerm?: string;
  searchType?: string;
  searchSubType?: string;
  orderSearch?: string;
  churchName?: string;
  data: Ministry[];
}

export const getMinistriesReport = (
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
          widths: [100, 80, 70, 60, 90, 'auto', 'auto'],

          body: [
            [
              {
                text: 'Ministerio',
                style: {
                  bold: true,
                },
              },
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
              `${MinistryTypeNames[item?.ministryType as MinistryType]}`,
              `${item?.customMinistryName}`,
              formatDateToLimaDayMonthYear(item?.foundingDate),
              item?.serviceTimes.map((item) => MinistryServiceTimeNames[item]),
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
