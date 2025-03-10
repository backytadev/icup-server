import type { TDocumentDefinitions } from 'pdfmake/interfaces';

import { CurrencyType } from '@/modules/offering/shared/enums/currency-type.enum';
import { formatDateToLimaDayMonthYear } from '@/common/helpers/format-date-to-lima';

import { OfferingExpenseSearchTypeNames } from '@/modules/offering/expense/enums/offering-expense-search-type.enum';
import { OfferingExpenseSearchSubTypeNames } from '@/modules/offering/expense/enums/offering-expense-search-sub-type.enum';

import { OfferingExpense } from '@/modules/offering/expense/entities/offering-expense.entity';

import { headerSection } from '@/modules/reports/sections/header.section';
import { footerSection } from '@/modules/reports/sections/footer.section';

interface ReportOptions {
  title?: string;
  subTitle?: string;
  description: string;
  searchTerm?: string;
  searchType?: string;
  searchSubType?: string;
  orderSearch?: string;
  churchName?: string;
  data: OfferingExpense[];
}

export const getOfferingExpensesReport = (
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
          widths: [100, 100, 130, 55, 70, 80, '*'],

          body: [
            [
              {
                text: 'Iglesia',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Tipo',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Sub-tipo',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Monto',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Divisa',
                style: {
                  bold: true,
                },
              },
              {
                text: 'F. de Gasto',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Detalles y/o observaciones',
                style: {
                  bold: true,
                },
              },
            ],
            ...data.map((item) => [
              `${item?.church?.abbreviatedChurchName ?? '-'}`,
              OfferingExpenseSearchTypeNames[item?.type],
              OfferingExpenseSearchSubTypeNames[item?.subType] ?? '-',
              item?.amount ?? '-',
              item?.currency ?? '-',
              formatDateToLimaDayMonthYear(item?.date),
              item?.comments ?? '-',
            ]),
            ['', '', '', '', '', '', ''],
            ['', '', '', '', '', '', ''],
          ],
        },
      },

      {
        layout: 'summaryLayout',
        table: {
          headerRows: 1,
          widths: [100, 100, 130, 55, 70, 80, '*'],
          body: [
            [
              {
                text: `Resultados de Sumatoria por Divisa:`,
                colSpan: 2,
                fontSize: 13,
                bold: true,
                italics: true,
                margin: [0, 5, 0, 5],
              },
              {},
              {
                text: `${data
                  .filter((offering) => offering.currency === CurrencyType.PEN)
                  .reduce((acc, offering) => acc + +offering?.amount, 0)
                  .toFixed(2)} PEN   /`,
                bold: true,
                fontSize: 13,
                italics: true,
                margin: [0, 5, 0, 5],
              },
              {
                text: `${data
                  .filter((offering) => offering.currency === CurrencyType.USD)
                  .reduce((acc, offering) => acc + +offering?.amount, 0)
                  .toFixed(2)} USD   /`,
                bold: true,
                fontSize: 13,
                italics: true,
                margin: [-40, 5, 0, 5],
              },
              {
                text: `${data
                  .filter((offering) => offering.currency === CurrencyType.EUR)
                  .reduce((acc, offering) => acc + +offering?.amount, 0)
                  .toFixed(2)} EUR`,
                bold: true,
                fontSize: 13,
                italics: true,
                margin: [-5, 5, 0, 5],
              },
              {},
              {},
            ],
          ],
        },
      },

      {
        layout: 'noBorders',
        table: {
          headerRows: 1,
          widths: [100, 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
          body: [
            [
              {
                text: `Total de ${description}:`,
                colSpan: 2,
                fontSize: 13,
                bold: true,
                margin: [0, 10, 0, 0],
              },
              {},
              {
                text: `${data.length} ${description}.`,
                bold: true,
                fontSize: 13,
                colSpan: 1,
                margin: [-50, 10, 0, 0],
              },
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
