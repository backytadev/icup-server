import type { TDocumentDefinitions } from 'pdfmake/interfaces';

import { footerSection } from '@/modules/reports/sections/footer.section';
import { headerSection } from '@/modules/reports/sections/header.section';

import { formatDateToLimaDayMonthYear } from '@/common/helpers/format-date-to-lima';

import {
  MemberType,
  MemberTypeNames,
} from '@/modules/offering/income/enums/member-type.enum';
import { CurrencyType } from '@/modules/offering/shared/enums/currency-type.enum';
import { OfferingIncomeCreationTypeNames } from '@/modules/offering/income/enums/offering-income-creation-type.enum';
import { OfferingIncomeCreationCategoryNames } from '@/modules/offering/income/enums/offering-income-creation-category.enum';
import { OfferingIncomeCreationSubTypeNames } from '@/modules/offering/income/enums/offering-income-creation-sub-type.enum';
import { OfferingIncomeCreationShiftTypeNames } from '@/modules/offering/income/enums/offering-income-creation-shift-type.enum';

interface ReportOptions {
  title?: string;
  subTitle?: string;
  description: string;
  searchTerm?: string;
  searchType?: string;
  searchSubType?: string;
  orderSearch?: string;
  churchName?: string;
  data: any;
}

export const getOfferingIncomeReport = (
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
          widths: [85, 85, 60, 40, 65, 75, 60, 60, '*'],

          body: [
            [
              {
                text: 'Iglesia',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Tipo / Sub-tipo',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Categoría',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Turno',
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
                text: 'F. Ofrenda',
                style: {
                  bold: true,
                },
              },
              {
                text: 'G. Familiar',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Zona',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Miembro (Tipo/Nom./Ap.)',
                style: {
                  bold: true,
                },
              },
            ],
            ...data.map((item) => [
              `${item?.church?.abbreviatedChurchName ?? '-'}`,
              item?.subType
                ? `${OfferingIncomeCreationTypeNames[item?.type]} - ${OfferingIncomeCreationSubTypeNames[item?.subType] ?? ''}`
                : `${OfferingIncomeCreationTypeNames[item?.type]} `,
              OfferingIncomeCreationCategoryNames[item?.category] ?? '-',
              OfferingIncomeCreationShiftTypeNames[item?.shift] ?? '-',
              `${item?.amount} ${item?.currency}`,
              formatDateToLimaDayMonthYear(item?.date),
              `${item?.familyGroup?.familyGroupCode ?? '-'}`,
              `${item?.zone?.zoneName ?? '-'}`,
              `${MemberTypeNames[item?.memberType] ?? '-'}
              ${
                item?.memberType === MemberType.Pastor
                  ? `${item?.pastor?.firstNames} ${item?.pastor?.lastNames}`
                  : item?.memberType === MemberType.Copastor
                    ? `${item?.copastor?.firstNames} ${item?.copastor?.lastNames}`
                    : item?.memberType === MemberType.Supervisor
                      ? `${item?.supervisor?.firstNames} ${item?.supervisor?.lastNames}`
                      : item?.memberType === MemberType.Preacher
                        ? `${item?.preacher?.firstNames} ${item?.preacher?.lastNames}`
                        : item?.memberType === MemberType.Disciple
                          ? `${item?.disciple?.firstNames} ${item?.disciple?.lastNames}`
                          : item?.memberType === MemberType.ExternalDonor
                            ? `${item?.externalDonor?.firstNames} ${item?.externalDonor?.lastNames}`
                            : '-'
              }`,
            ]),
            ['', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', ''],
          ],
        },
      },

      {
        layout: 'summaryLayout',
        table: {
          headerRows: 1,
          widths: [
            100,
            'auto',
            'auto',
            'auto',
            'auto',
            'auto',
            'auto',
            'auto',
            '*',
          ],
          body: [
            [
              {
                text: `Resultados de Sumatoria por Divisa:`,
                colSpan: 3,
                fontSize: 13,
                bold: true,
                italics: true,
                margin: [0, 5, 0, 5],
              },
              {},
              {},
              {
                text: `${data
                  .filter((offering) => offering.currency === CurrencyType.PEN)
                  .reduce((acc, offering) => acc + +offering?.amount, 0)
                  .toFixed(2)} PEN   /`,
                bold: true,
                fontSize: 13,
                italics: true,
                margin: [-50, 5, 0, 5],
              },
              {
                text: `${data
                  .filter((offering) => offering.currency === CurrencyType.USD)
                  .reduce((acc, offering) => acc + +offering?.amount, 0)
                  .toFixed(2)} USD   /`,
                bold: true,
                fontSize: 13,
                italics: true,
                margin: [-5, 5, 0, 5],
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
              {},
            ],
          ],
        },
      },

      {
        layout: 'noBorders',
        table: {
          headerRows: 1,
          widths: [
            100,
            'auto',
            'auto',
            'auto',
            'auto',
            'auto',
            'auto',
            'auto',
            '*',
          ],
          body: [
            [
              {
                text: `Total de ${description}:`,
                colSpan: 2,
                fontSize: 13,
                bold: true,
                italics: true,
                margin: [0, 15, 0, 0],
              },
              {},
              {
                text: `${data.length} ${description}.`,
                bold: true,
                fontSize: 13,
                colSpan: 1,
                italics: true,
                margin: [-50, 15, 0, 0],
              },
              {},
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
