import type { TDocumentDefinitions } from 'pdfmake/interfaces';

import { headerSection } from '@/modules/reports/sections/header.section';
import { footerSection } from '@/modules/reports/sections/footer.section';

import { MetricSearchType } from '@/modules/metrics/enums/metrics-search-type.enum';

import { formatDateToLimaDayMonthYear } from '@/common/helpers/format-date-to-lima';

import {
  OfferingIncomeCreationCategory,
  OfferingIncomeCreationCategoryNames,
} from '@/modules/offering/income/enums/offering-income-creation-category.enum';
import { MemberTypeNames } from '@/modules/offering/income/enums/member-type.enum';

import { OfferingIncomeCreationSubTypeNames } from '@/modules/offering/income/enums/offering-income-creation-sub-type.enum';
import { OfferingIncomeByActivitiesDataResult } from '@/modules/metrics/helpers/offering-income/offering-income-by-activities-formatter.helper';
import { OfferingIncomeByFamilyGroupDataResult } from '@/modules/metrics/helpers/offering-income/offering-income-by-family-group-formatter.helper';
import { OfferingIncomeByChurchGroundDataResult } from '@/modules/metrics/helpers/offering-income/offering-income-by-church-ground-formatter.helper';
import { OfferingIncomeByYouthServiceDataResult } from '@/modules/metrics/helpers/offering-income/offering-income-by-youth-service-formatter.helper';
import { OfferingIncomeBySundaySchoolDataResult } from '@/modules/metrics/helpers/offering-income/offering-income-by-sunday-school-formatter.helper';
import { OfferingIncomeBySundayServiceDataResult } from '@/modules/metrics/helpers/offering-income/offering-income-by-sunday-service-formatter.helper';
import { OfferingIncomeByUnitedServiceDataResult } from '@/modules/metrics/helpers/offering-income/offering-income-by-united-service-formatter.helper';
import { OfferingIncomeBySpecialOfferingDataResult } from '@/modules/metrics/helpers/offering-income/offering-income-by-special-offering-formatter.helper';
import { OfferingIncomeByFastingAndVigilAndEvangelismDataResult } from '@/modules/metrics/helpers/offering-income/offering-income-by-fasting-and-vigil-and-evangelism-formatter.helper';
import { OfferingIncomeByIncomeAdjustmentDataResult } from '@/modules/metrics/helpers/offering-income/offering-income-by-income-adjustment-formatter.helper';

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

interface ReportOptions {
  title?: string;
  subTitle?: string;
  year: string;
  startMonth: string;
  endMonth: string;
  metricsTypesArray: string[];
  offeringIncomeBySundayServiceDataResult: OfferingIncomeBySundayServiceDataResult[];
  offeringIncomeByFamilyGroupDataResult: OfferingIncomeByFamilyGroupDataResult[][];
  offeringIncomeBySundaySchoolDataResult: OfferingIncomeBySundaySchoolDataResult[];
  offeringIncomeByUnitedServiceDataResult: OfferingIncomeByUnitedServiceDataResult[];
  offeringIncomeByFastingAndVigilDataResult: OfferingIncomeByFastingAndVigilAndEvangelismDataResult[];
  offeringIncomeByYouthServiceDataResult: OfferingIncomeByYouthServiceDataResult[];
  offeringIncomeBySpecialOfferingDataResult: OfferingIncomeBySpecialOfferingDataResult[];
  offeringIncomeByChurchGroundDataResult: OfferingIncomeByChurchGroundDataResult[];
  offeringIncomeByActivitiesDataResult: OfferingIncomeByActivitiesDataResult[];
  offeringIncomeByIncomeAdjustmentDataResult: OfferingIncomeByIncomeAdjustmentDataResult[];
}

export const getOfferingIncomeMetricsReport = (
  options: ReportOptions,
): TDocumentDefinitions => {
  const {
    title,
    subTitle,
    year,
    startMonth,
    endMonth,
    metricsTypesArray,
    offeringIncomeBySundayServiceDataResult,
    offeringIncomeByFamilyGroupDataResult,
    offeringIncomeBySundaySchoolDataResult,
    offeringIncomeByUnitedServiceDataResult,
    offeringIncomeByFastingAndVigilDataResult,
    offeringIncomeByYouthServiceDataResult,
    offeringIncomeBySpecialOfferingDataResult,
    offeringIncomeByChurchGroundDataResult,
    offeringIncomeByActivitiesDataResult,
    offeringIncomeByIncomeAdjustmentDataResult,
  } = options;

  return {
    pageOrientation: 'landscape',
    header: headerSection({
      title: title,
      subTitle: subTitle,
      yearSearch: year,
      startMonthSearch: startMonth,
      endMonthSearch: endMonth,
    }),
    footer: footerSection,
    pageMargins: [20, 110, 20, 60],
    content: [
      //* OfferingIncomeBySundayService
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeBySundayService)
        ? [
            // Table Title
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Ofrendas por Culto Dominical`,
                      color: '#1d96d3',
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -10, 0, 3],
                    },
                  ],
                ],
              },
            },
            // Table body (content)
            {
              pageBreak: 'after',
              layout: 'customLayout01', // optional
              table: {
                headerRows: 1,
                widths: [70, 70, 70, '*', '*', '*', '*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Fecha',
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
                      text: 'Turnos (PEN)',
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total (PEN)',
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: 'Turnos (USD)',
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total (USD)',
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                    {
                      text: 'Turnos (EUR)',
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total (EUR)',
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                  ],
                  ...offeringIncomeBySundayServiceDataResult.map((offering) => [
                    offering?.church?.abbreviatedChurchName,
                    formatDateToLimaDayMonthYear(offering?.date),
                    OfferingIncomeCreationCategoryNames[offering.category],
                    `D: ${offering?.dayPEN.toFixed(2)} PEN\nT: ${offering?.afternoonPEN.toFixed(2)} PEN`,
                    `${(offering?.dayPEN + offering?.afternoonPEN).toFixed(2)} PEN`,
                    `D: ${offering?.dayUSD.toFixed(2)} USD\nT: ${offering?.afternoonUSD} USD`,
                    `${(offering?.dayUSD + offering?.afternoonUSD).toFixed(2)} USD`,
                    `D: ${offering?.dayEUR.toFixed(2)} EUR\nT: ${offering?.afternoonEUR.toFixed(2)} EUR`,
                    `${(offering?.dayEUR + offering?.afternoonEUR).toFixed(2)} USD`,
                  ]),
                  ['', '', '', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', '', '', ''],
                  [
                    '',
                    '',
                    '',
                    {
                      text: 'Totales',
                      style: {
                        bold: true,
                        color: 'red',
                        fontSize: 13,
                        italics: true,
                        alignment: 'center',
                      },
                    },
                    {
                      text: `${offeringIncomeBySundayServiceDataResult.reduce((acc, offering) => acc + offering?.dayPEN + offering?.afternoonPEN, 0).toFixed(2)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    '',
                    {
                      text: `${offeringIncomeBySundayServiceDataResult.reduce((acc, offering) => acc + offering?.dayUSD + offering?.afternoonUSD, 0).toFixed(2)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    '',
                    {
                      text: `${offeringIncomeBySundayServiceDataResult.reduce((acc, offering) => acc + offering?.dayEUR + offering?.afternoonEUR, 0).toFixed(2)} EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                  ],
                ],
              },
            },
          ]
        : null,

      //* OfferingIncomeByFamilyGroup
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeByFamilyGroup)
        ? offeringIncomeByFamilyGroupDataResult.map(
            (offeringIncomeByFamilyGroupData) => [
              // Table Title
              {
                layout: 'noBorders',
                table: {
                  headerRows: 1,
                  widths: ['*'],
                  body: [
                    [
                      {
                        text: `Ofrendas por Grupo Familiar`,
                        color: '#1d96d3',
                        fontSize: 20,
                        bold: true,
                        alignment: 'center',
                        margin: [0, -10, 0, 3],
                      },
                    ],
                  ],
                },
              },
              {
                layout: 'noBorders',
                table: {
                  headerRows: 1,
                  widths: ['*'],
                  body: [
                    [
                      {
                        text: `Zona: ${offeringIncomeByFamilyGroupData[0].zone.zoneName}`,
                        color: '#1d96d3',
                        fontSize: 16,
                        bold: true,
                        italics: true,
                        alignment: 'center',
                        margin: [0, 0, 0, 5],
                      },
                    ],
                  ],
                },
              },
              // Table body (content)
              {
                pageBreak: 'after',
                layout: 'customLayout01', // optional
                table: {
                  headerRows: 1,
                  widths: [70, 70, 70, 70, '*', '*', '*', '*'],
                  body: [
                    [
                      {
                        text: 'Iglesia',
                        style: {
                          bold: true,
                        },
                      },
                      {
                        text: 'Rango',
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
                        text: 'Código',
                        style: {
                          bold: true,
                        },
                      },
                      {
                        text: 'Predicador',
                        style: {
                          bold: true,
                        },
                      },
                      {
                        text: 'Total Acu. (PEN)',
                        style: {
                          color: 'blue',
                          bold: true,
                        },
                      },
                      {
                        text: 'Total Acu. (USD)',
                        style: {
                          color: 'purple',
                          bold: true,
                        },
                      },
                      {
                        text: 'Total Acu. (EUR)',
                        style: {
                          color: 'green',
                          bold: true,
                        },
                      },
                    ],
                    ...offeringIncomeByFamilyGroupData.map((offering) => [
                      offering?.church?.abbreviatedChurchName,
                      `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                      OfferingIncomeCreationCategoryNames[offering?.category],
                      offering?.familyGroup?.familyGroupCode,
                      `${offering?.preacher?.firstNames} ${offering?.preacher?.lastNames}`,
                      offering.accumulatedOfferingPEN.toFixed(2),
                      offering.accumulatedOfferingUSD.toFixed(2),
                      offering.accumulatedOfferingEUR.toFixed(2),
                    ]),
                    ['', '', '', '', '', '', '', ''],
                    ['', '', '', '', '', '', '', ''],
                    [
                      '',
                      '',
                      '',
                      '',
                      {
                        text: 'Totales',
                        style: {
                          bold: true,
                          fontSize: 13,
                          italics: true,
                          color: 'red',
                          alignment: 'center',
                        },
                      },
                      {
                        text: `${offeringIncomeByFamilyGroupData.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0).toFixed(2)} PEN`,
                        style: {
                          bold: true,
                          fontSize: 13,
                          italics: true,
                          color: '#475569',
                        },
                      },
                      {
                        text: `${offeringIncomeByFamilyGroupData.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0).toFixed(2)} USD`,
                        style: {
                          bold: true,
                          fontSize: 13,
                          italics: true,
                          color: '#475569',
                        },
                      },
                      {
                        text: `${offeringIncomeByFamilyGroupData.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0).toFixed(2)} EUR`,
                        style: {
                          bold: true,
                          fontSize: 13,
                          italics: true,
                          color: '#475569',
                        },
                      },
                    ],
                  ],
                },
              },
            ],
          )
        : null,

      //* OfferingIncomeBySundaySchool
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeBySundaySchool)
        ? [
            // Table Title
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Ofrendas por Escuela Dominical`,
                      color: '#1d96d3',
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -10, 0, 3],
                    },
                  ],
                ],
              },
            },
            // Table body (content)
            {
              pageBreak: 'after',
              layout: 'customLayout01', // optional
              table: {
                headerRows: 1,
                widths: [80, '*', 75, '*', '*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Fecha o Rango',
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
                      text: 'Miembro',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (PEN)',
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (USD)',
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (EUR)',
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                  ],
                  ...offeringIncomeBySundaySchoolDataResult
                    .reduce((acc, offering) => {
                      const existingEntry = acc.find((item) => {
                        if (
                          offering.category ===
                            OfferingIncomeCreationCategory.InternalDonation &&
                          offering.internalDonor.memberId
                        ) {
                          return (
                            item.category === offering.category &&
                            item.internalDonor?.memberId ===
                              offering?.internalDonor?.memberId
                          );
                        }

                        if (
                          offering.category ===
                            OfferingIncomeCreationCategory.ExternalDonation &&
                          offering.externalDonor.donorId
                        ) {
                          return (
                            item.category === offering.category &&
                            item.externalDonor?.donorId ===
                              offering?.externalDonor?.donorId
                          );
                        }

                        if (
                          monthNames[startMonth] === monthNames[endMonth] &&
                          offering.category ===
                            OfferingIncomeCreationCategory.OfferingBox
                        ) {
                          return (
                            item.date === item.category &&
                            item.category === offering.category
                          );
                        }

                        return item.category === offering.category;
                      });

                      if (existingEntry) {
                        if (
                          monthNames[startMonth] !== monthNames[endMonth] &&
                          offering.category ===
                            OfferingIncomeCreationCategory.OfferingBox
                        ) {
                          existingEntry.dayPEN += offering.dayPEN;
                          existingEntry.dayUSD += offering.dayUSD;
                          existingEntry.dayEUR += offering.dayEUR;
                          existingEntry.afternoonPEN += offering.afternoonPEN;
                          existingEntry.afternoonUSD += offering.afternoonUSD;
                          existingEntry.afternoonEUR += offering.afternoonEUR;
                        }

                        if (
                          offering.category ===
                          OfferingIncomeCreationCategory.InternalDonation
                        ) {
                          existingEntry.accumulatedOfferingPEN +=
                            offering.accumulatedOfferingPEN;
                          existingEntry.accumulatedOfferingUSD +=
                            offering.accumulatedOfferingUSD;
                          existingEntry.accumulatedOfferingEUR +=
                            offering.accumulatedOfferingEUR;
                        }

                        if (
                          offering.category ===
                          OfferingIncomeCreationCategory.ExternalDonation
                        ) {
                          existingEntry.accumulatedOfferingPEN +=
                            offering.accumulatedOfferingPEN;
                          existingEntry.accumulatedOfferingUSD +=
                            offering.accumulatedOfferingUSD;
                          existingEntry.accumulatedOfferingEUR +=
                            offering.accumulatedOfferingEUR;
                        }

                        if (
                          offering.category ===
                          OfferingIncomeCreationCategory.FundraisingProMinistry
                        ) {
                          existingEntry.accumulatedOfferingPEN +=
                            offering.accumulatedOfferingPEN;
                          existingEntry.accumulatedOfferingUSD +=
                            offering.accumulatedOfferingUSD;
                          existingEntry.accumulatedOfferingEUR +=
                            offering.accumulatedOfferingEUR;
                        }
                      } else {
                        acc.push({
                          date: offering.date,
                          category: offering.category,
                          dayPEN: offering.dayPEN ? offering.dayPEN : 0,
                          afternoonPEN: offering.afternoonPEN
                            ? offering.afternoonPEN
                            : 0,
                          dayUSD: offering.dayUSD ? offering.dayUSD : 0,
                          afternoonUSD: offering.afternoonUSD
                            ? offering.afternoonUSD
                            : 0,
                          dayEUR: offering.dayEUR ? offering.dayEUR : 0,
                          afternoonEUR: offering.afternoonEUR
                            ? offering.afternoonEUR
                            : 0,
                          accumulatedOfferingPEN:
                            offering.category !==
                            OfferingIncomeCreationCategory.OfferingBox
                              ? offering.accumulatedOfferingPEN
                              : 0,
                          accumulatedOfferingUSD:
                            offering.category !==
                            OfferingIncomeCreationCategory.OfferingBox
                              ? offering.accumulatedOfferingUSD
                              : 0,
                          accumulatedOfferingEUR:
                            offering.category !==
                            OfferingIncomeCreationCategory.OfferingBox
                              ? offering.accumulatedOfferingEUR
                              : 0,
                          internalDonor: {
                            memberType:
                              offering.category ===
                              OfferingIncomeCreationCategory.InternalDonation
                                ? offering.internalDonor.memberType
                                : null,
                            memberFullName: offering?.internalDonor
                              ?.memberFullName
                              ? offering?.internalDonor?.memberFullName
                              : null,
                            memberId: offering?.internalDonor?.memberId
                              ? offering?.internalDonor?.memberId
                              : null,
                          },
                          externalDonor: {
                            donorFullName: offering?.externalDonor
                              ?.donorFullName
                              ? offering?.externalDonor?.donorFullName
                              : null,
                            donorId: offering?.externalDonor?.donorId ?? null,
                            sendingCountry:
                              offering?.externalDonor?.sendingCountry ??
                              'País anónimo',
                          },
                          church: {
                            isAnexe: offering?.church?.isAnexe,
                            abbreviatedChurchName:
                              offering?.church?.abbreviatedChurchName,
                          },
                        });
                      }

                      return acc;
                    }, [])
                    .sort((a, b) => {
                      const categoryA =
                        OfferingIncomeCreationCategoryNames[
                          a.category
                        ].toLowerCase();
                      const categoryB =
                        OfferingIncomeCreationCategoryNames[
                          b.category
                        ].toLowerCase();

                      if (categoryA < categoryB) return -1;
                      if (categoryA > categoryB) return 1;
                      return 0;
                    })
                    .map((offering) => [
                      offering?.church?.abbreviatedChurchName,
                      monthNames[startMonth] === monthNames[endMonth] &&
                      offering.category ===
                        OfferingIncomeCreationCategory.OfferingBox
                        ? formatDateToLimaDayMonthYear(offering?.date)
                        : `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                      OfferingIncomeCreationCategoryNames[offering.category],
                      offering?.internalDonor?.memberType
                        ? ` ${offering?.internalDonor?.memberFullName} (${MemberTypeNames[offering?.internalDonor?.memberType]})`
                        : offering?.externalDonor?.donorId
                          ? ` ${offering?.externalDonor?.donorFullName} (Donador Externo)`
                          : '-',
                      offering?.dayPEN || offering?.afternoonPEN
                        ? `D: ${offering?.dayPEN.toFixed(2)} PEN\nT: ${offering?.afternoonPEN.toFixed(2)} PEN\nTot: ${(offering?.dayPEN + offering?.afternoonPEN).toFixed(2)} PEN`
                        : offering.accumulatedOfferingPEN
                          ? `${offering.accumulatedOfferingPEN.toFixed(2)} PEN`
                          : '-',
                      offering?.dayUSD || offering?.afternoonUSD
                        ? `D: ${offering?.dayUSD.toFixed(2)} USD\nT: ${offering?.afternoonUSD.toFixed(2)} USD\nTot.: ${(offering?.dayUSD + offering?.afternoonUSD).toFixed(2)} USD`
                        : offering.accumulatedOfferingUSD
                          ? `${offering.accumulatedOfferingUSD.toFixed(2)} USD`
                          : '-',
                      offering?.dayEUR || offering?.afternoonEUR
                        ? `D: ${offering?.dayEUR.toFixed(2)} EUR\nT: ${offering?.afternoonEUR.toFixed(2)} EUR\nTot.: ${(offering?.dayEUR + offering?.afternoonEUR).toFixed(2)} EUR`
                        : offering.accumulatedOfferingEUR
                          ? `${offering.accumulatedOfferingEUR.toFixed(2)} EUR`
                          : '-',
                    ]),
                  ['', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', ''],
                  [
                    '',
                    '',
                    '',
                    {
                      text: 'Totales',
                      style: {
                        color: 'red',
                        alignment: 'center',
                        bold: true,
                        fontSize: 13,
                        italics: true,
                      },
                    },
                    {
                      text: `${(
                        offeringIncomeBySundaySchoolDataResult.reduce(
                          (acc, offering) =>
                            acc + offering?.dayPEN + offering?.afternoonPEN,
                          0,
                        ) +
                        offeringIncomeBySundaySchoolDataResult.reduce(
                          (acc, offering) =>
                            acc + offering?.accumulatedOfferingPEN,
                          0,
                        )
                      ).toFixed(2)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${(
                        offeringIncomeBySundaySchoolDataResult.reduce(
                          (acc, offering) =>
                            acc + offering?.dayUSD + offering?.afternoonUSD,
                          0,
                        ) +
                        offeringIncomeBySundaySchoolDataResult.reduce(
                          (acc, offering) =>
                            acc + offering?.accumulatedOfferingUSD,
                          0,
                        )
                      ).toFixed(2)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${(
                        offeringIncomeBySundaySchoolDataResult.reduce(
                          (acc, offering) =>
                            acc + offering?.dayEUR + offering?.afternoonEUR,
                          0,
                        ) +
                        offeringIncomeBySundaySchoolDataResult.reduce(
                          (acc, offering) =>
                            acc + offering?.accumulatedOfferingEUR,
                          0,
                        )
                      ).toFixed(2)} EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                  ],
                ],
              },
            },
          ]
        : null,

      //* OfferingIncomeByUnitedService
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeByUnitedService)
        ? [
            // Table Title
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Ofrendas por Culto Unido`,
                      color: '#1d96d3',
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -10, 0, 3],
                    },
                  ],
                ],
              },
            },
            // Table body (content)
            {
              pageBreak: 'after',
              layout: 'customLayout01', // optional
              table: {
                headerRows: 1,
                widths: [100, 70, 70, '*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Fecha',
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
                      text: 'Total (PEN)',
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total (USD)',
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total (EUR)',
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                  ],
                  ...offeringIncomeByUnitedServiceDataResult.map((offering) => [
                    offering?.church?.abbreviatedChurchName,
                    formatDateToLimaDayMonthYear(offering?.date),
                    OfferingIncomeCreationCategoryNames[offering.category],
                    `${offering.accumulatedOfferingPEN.toFixed(2)} PEN`,
                    `${offering.accumulatedOfferingUSD.toFixed(2)} USD`,
                    `${offering.accumulatedOfferingEUR.toFixed(2)} EUR`,
                  ]),
                  ['', '', '', '', '', ''],
                  ['', '', '', '', '', ''],
                  [
                    '',
                    '',
                    {
                      text: 'Totales',
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: 'red',
                        alignment: 'center',
                      },
                    },
                    {
                      text: `${offeringIncomeByUnitedServiceDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0).toFixed(2)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByUnitedServiceDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0).toFixed(2)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByUnitedServiceDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0).toFixed(2)} EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                  ],
                ],
              },
            },
          ]
        : null,

      //* OfferingIncomeByFastingAndVigil
      metricsTypesArray.includes(
        MetricSearchType.OfferingIncomeByFastingAndVigilAndEvangelism,
      )
        ? [
            // Table Title
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Ofrendas por Ayuno, Vigilia y Evangelismo`,
                      color: '#1d96d3',
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -10, 0, 3],
                    },
                  ],
                ],
              },
            },
            // Table body (content)
            {
              pageBreak: 'after',
              layout: 'customLayout01', // optional
              table: {
                headerRows: 1,
                widths: [60, 65, 70, 65, '*', 50, '*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Fecha',
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
                      text: 'Categoría',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Supervisor',
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
                      text: 'Total (PEN)',
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total (USD)',
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total (EUR)',
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                  ],
                  ...offeringIncomeByFastingAndVigilDataResult.map(
                    (offering) => [
                      offering?.church?.abbreviatedChurchName,
                      formatDateToLimaDayMonthYear(offering?.date),
                      OfferingIncomeCreationSubTypeNames[offering?.type],
                      OfferingIncomeCreationCategoryNames[offering?.category],
                      offering?.supervisor?.firstNames &&
                      offering?.supervisor?.lastNames
                        ? `${offering?.supervisor?.firstNames} ${offering?.supervisor?.lastNames}`
                        : '-',
                      offering.zone.zoneName ? offering?.zone?.zoneName : '-',
                      `${offering.accumulatedOfferingPEN.toFixed(2)} PEN`,
                      `${offering.accumulatedOfferingUSD.toFixed(2)} USD`,
                      `${offering.accumulatedOfferingEUR.toFixed(2)} EUR`,
                    ],
                  ),
                  ['', '', '', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', '', '', ''],
                  [
                    '',
                    '',
                    '',
                    '',
                    '',
                    {
                      text: 'Totales',
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: 'red',
                        alignment: 'center',
                      },
                    },
                    {
                      text: `${offeringIncomeByFastingAndVigilDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0).toFixed(2)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByFastingAndVigilDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0).toFixed(2)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByFastingAndVigilDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0).toFixed(2)} EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                  ],
                ],
              },
            },
          ]
        : null,

      //* OfferingIncomeByYouthService
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeByYouthService)
        ? [
            // Table Title
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Ofrendas por Culto de Jóvenes`,
                      color: '#1d96d3',
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -10, 0, 3],
                    },
                  ],
                ],
              },
            },
            // Table body (content)
            {
              pageBreak: 'after',
              layout: 'customLayout01', // optional
              table: {
                headerRows: 1,
                widths: [65, '*', 75, 100, '*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Fecha o Rango',
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
                      text: 'Miembro',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (PEN)',
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (USD)',
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (EUR)',
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                  ],
                  ...offeringIncomeByYouthServiceDataResult
                    .reduce((acc, offering) => {
                      const existingEntry = acc.find((item) => {
                        if (
                          offering.category ===
                            OfferingIncomeCreationCategory.InternalDonation &&
                          offering.internalDonor.memberId
                        ) {
                          return (
                            item.category === offering.category &&
                            item.internalDonor?.memberId ===
                              offering?.internalDonor?.memberId
                          );
                        }

                        if (
                          offering.category ===
                            OfferingIncomeCreationCategory.ExternalDonation &&
                          offering.externalDonor.donorId
                        ) {
                          return (
                            item.category === offering.category &&
                            item.externalDonor?.donorId ===
                              offering?.externalDonor?.donorId
                          );
                        }

                        if (
                          monthNames[startMonth] === monthNames[endMonth] &&
                          offering.category ===
                            OfferingIncomeCreationCategory.OfferingBox
                        ) {
                          return (
                            item.date === item.category &&
                            item.category === offering.category
                          );
                        }

                        return item.category === offering.category;
                      });

                      if (existingEntry) {
                        if (
                          monthNames[startMonth] !== monthNames[endMonth] &&
                          offering.category ===
                            OfferingIncomeCreationCategory.OfferingBox
                        ) {
                          existingEntry.accumulatedOfferingPEN +=
                            offering.accumulatedOfferingPEN;
                          existingEntry.accumulatedOfferingUSD +=
                            offering.accumulatedOfferingUSD;
                          existingEntry.accumulatedOfferingEUR +=
                            offering.accumulatedOfferingEUR;
                        }

                        if (
                          offering.category ===
                          OfferingIncomeCreationCategory.InternalDonation
                        ) {
                          existingEntry.accumulatedOfferingPEN +=
                            offering.accumulatedOfferingPEN;
                          existingEntry.accumulatedOfferingUSD +=
                            offering.accumulatedOfferingUSD;
                          existingEntry.accumulatedOfferingEUR +=
                            offering.accumulatedOfferingEUR;
                        }

                        if (
                          offering.category ===
                          OfferingIncomeCreationCategory.ExternalDonation
                        ) {
                          existingEntry.accumulatedOfferingPEN +=
                            offering.accumulatedOfferingPEN;
                          existingEntry.accumulatedOfferingUSD +=
                            offering.accumulatedOfferingUSD;
                          existingEntry.accumulatedOfferingEUR +=
                            offering.accumulatedOfferingEUR;
                        }

                        if (
                          offering.category ===
                          OfferingIncomeCreationCategory.FundraisingProMinistry
                        ) {
                          existingEntry.accumulatedOfferingPEN +=
                            offering.accumulatedOfferingPEN;
                          existingEntry.accumulatedOfferingUSD +=
                            offering.accumulatedOfferingUSD;
                          existingEntry.accumulatedOfferingEUR +=
                            offering.accumulatedOfferingEUR;
                        }
                      } else {
                        acc.push({
                          date: offering.date,
                          category: offering.category,
                          accumulatedOfferingPEN: offering.category
                            ? offering.accumulatedOfferingPEN
                            : 0,
                          accumulatedOfferingUSD: offering.category
                            ? offering.accumulatedOfferingUSD
                            : 0,
                          accumulatedOfferingEUR: offering.category
                            ? offering.accumulatedOfferingEUR
                            : 0,
                          internalDonor: {
                            memberType:
                              offering.category ===
                              OfferingIncomeCreationCategory.InternalDonation
                                ? offering.internalDonor.memberType
                                : null,
                            memberFullName: offering?.internalDonor
                              ?.memberFullName
                              ? offering?.internalDonor?.memberFullName
                              : null,
                            memberId: offering?.internalDonor?.memberId
                              ? offering?.internalDonor?.memberId
                              : null,
                          },
                          externalDonor: {
                            donorFullName: offering?.externalDonor
                              ?.donorFullName
                              ? offering?.externalDonor?.donorFullName
                              : null,
                            donorId: offering?.externalDonor?.donorId ?? null,
                            sendingCountry:
                              offering?.externalDonor?.sendingCountry ??
                              'País anónimo',
                          },
                          church: {
                            isAnexe: offering?.church?.isAnexe,
                            abbreviatedChurchName:
                              offering?.church?.abbreviatedChurchName,
                          },
                        });
                      }

                      return acc;
                    }, [])
                    .sort((a, b) => {
                      const categoryA =
                        OfferingIncomeCreationCategoryNames[
                          a.category
                        ].toLowerCase();
                      const categoryB =
                        OfferingIncomeCreationCategoryNames[
                          b.category
                        ].toLowerCase();

                      if (categoryA < categoryB) return -1;
                      if (categoryA > categoryB) return 1;
                      return 0;
                    })
                    .map((offering) => [
                      offering?.church?.abbreviatedChurchName,
                      monthNames[startMonth] === monthNames[endMonth] &&
                      offering.category ===
                        OfferingIncomeCreationCategory.OfferingBox
                        ? formatDateToLimaDayMonthYear(offering?.date)
                        : `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                      OfferingIncomeCreationCategoryNames[offering.category],
                      offering?.internalDonor?.memberType
                        ? `${offering?.internalDonor?.memberFullName} (${MemberTypeNames[offering?.internalDonor?.memberType]})`
                        : offering?.externalDonor?.donorId
                          ? ` ${offering?.externalDonor?.donorFullName} (Donador Externo)`
                          : '-',
                      offering.accumulatedOfferingPEN
                        ? `${offering.accumulatedOfferingPEN.toFixed(2)} PEN`
                        : '-',
                      offering.accumulatedOfferingUSD
                        ? `${offering.accumulatedOfferingUSD.toFixed(2)} USD`
                        : '-',
                      offering.accumulatedOfferingEUR
                        ? `${offering.accumulatedOfferingEUR.toFixed(2)} EUR`
                        : '-',
                    ]),
                  ['', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', ''],
                  [
                    '',
                    '',
                    '',
                    {
                      text: 'Totales',
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: 'red',
                        alignment: 'center',
                      },
                    },
                    {
                      text: `${offeringIncomeByYouthServiceDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0).toFixed(2)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByYouthServiceDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0).toFixed(2)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByYouthServiceDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0).toFixed(2)} EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                  ],
                ],
              },
            },
          ]
        : null,

      //* OfferingIncomeByChurchGround
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeByChurchGround)
        ? [
            // Table Title
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Ofrendas por Terreno Iglesia`,
                      color: '#1d96d3',
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -10, 0, 3],
                    },
                  ],
                ],
              },
            },
            // Table body (content)
            {
              pageBreak: 'after',
              layout: 'customLayout01', // optional
              table: {
                headerRows: 1,
                widths: [65, '*', 80, 120, '*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Fecha o Rango',
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
                      text: 'Miembro',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (PEN)',
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (USD)',
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (EUR)',
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                  ],
                  ...offeringIncomeByChurchGroundDataResult.map((offering) => [
                    offering?.church?.abbreviatedChurchName,
                    `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                    OfferingIncomeCreationCategoryNames[offering.category],
                    offering?.memberType && !offering?.externalDonor?.donorId
                      ? ` ${offering?.memberFullName} (${MemberTypeNames[offering?.memberType]})`
                      : offering?.externalDonor?.donorId
                        ? ` ${offering?.memberFullName} (En General)`
                        : 'Actividades Pro-Terreno (En General)',
                    offering.accumulatedOfferingPEN
                      ? `${offering.accumulatedOfferingPEN.toFixed(2)} PEN`
                      : '-',
                    offering.accumulatedOfferingUSD
                      ? `${offering.accumulatedOfferingUSD.toFixed(2)} USD`
                      : '-',
                    offering.accumulatedOfferingEUR
                      ? `${offering.accumulatedOfferingEUR.toFixed(2)} EUR`
                      : '-',
                  ]),
                  ['', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', ''],
                  [
                    '',
                    '',
                    '',
                    {
                      text: 'Totales',
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: 'red',
                        alignment: 'center',
                      },
                    },
                    {
                      text: `${offeringIncomeByChurchGroundDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0).toFixed(2)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByChurchGroundDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0).toFixed(2)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByChurchGroundDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0).toFixed(2)} EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                  ],
                ],
              },
            },
          ]
        : null,

      //* OfferingIncomeByActivities
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeByActivities)
        ? [
            // Table Title
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Ofrendas por Actividades`,
                      color: '#1d96d3',
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -10, 0, 3],
                    },
                  ],
                ],
              },
            },
            // Table body (content)
            {
              pageBreak: 'after',
              layout: 'customLayout01', // optional
              table: {
                headerRows: 1,
                widths: [100, 70, '*', '*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Fecha',
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
                      text: 'Total Acu. (PEN)',
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (USD)',
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (EUR)',
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                  ],
                  ...offeringIncomeByActivitiesDataResult.map((offering) => [
                    offering?.church?.abbreviatedChurchName,
                    formatDateToLimaDayMonthYear(offering?.date),
                    OfferingIncomeCreationCategoryNames[offering.category],
                    `${offering.accumulatedOfferingPEN.toFixed(2)} PEN`,
                    `${offering.accumulatedOfferingUSD.toFixed(2)} USD`,
                    `${offering.accumulatedOfferingEUR.toFixed(2)} EUR`,
                  ]),
                  ['', '', '', '', '', ''],
                  ['', '', '', '', '', ''],
                  [
                    '',
                    '',
                    {
                      text: 'Totales',
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: 'red',
                        alignment: 'center',
                      },
                    },
                    {
                      text: `${offeringIncomeByActivitiesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0).toFixed(2)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByActivitiesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0).toFixed(2)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByActivitiesDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0).toFixed(2)} EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                  ],
                ],
              },
            },
          ]
        : null,

      //* OfferingIncomeBySpecialOffering
      metricsTypesArray.includes(
        MetricSearchType.OfferingIncomeBySpecialOffering,
      )
        ? [
            // Table Title
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Ofrendas por Ofrenda Especial`,
                      color: '#1d96d3',
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -10, 0, 3],
                    },
                  ],
                ],
              },
            },
            // Table body (content)
            {
              pageBreak: 'after',
              layout: 'customLayout01', // optional
              table: {
                headerRows: 1,
                widths: [100, '*', 65, 120, '*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Rango',
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
                      text: 'Miembro',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (PEN)',
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (USD)',
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (EUR)',
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                  ],
                  ...offeringIncomeBySpecialOfferingDataResult.map(
                    (offering) => [
                      offering?.church?.abbreviatedChurchName,
                      `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                      OfferingIncomeCreationCategoryNames[offering.category],
                      offering?.memberType
                        ? ` ${offering?.memberFullName} (${MemberTypeNames[offering?.memberType]})`
                        : '-',
                      offering.accumulatedOfferingPEN
                        ? `${offering.accumulatedOfferingPEN.toFixed(2)} PEN`
                        : '-',
                      offering.accumulatedOfferingUSD
                        ? `${offering.accumulatedOfferingUSD.toFixed(2)} USD`
                        : '-',
                      offering.accumulatedOfferingEUR
                        ? `${offering.accumulatedOfferingEUR.toFixed(2)} EUR`
                        : '-',
                    ],
                  ),
                  ['', '', '', '', '', '', ''],
                  ['', '', '', '', '', '', ''],
                  [
                    '',
                    '',
                    '',
                    {
                      text: 'Totales',
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: 'red',
                        alignment: 'center',
                      },
                    },
                    {
                      text: `${offeringIncomeBySpecialOfferingDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0).toFixed(2)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeBySpecialOfferingDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0).toFixed(2)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeBySpecialOfferingDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0).toFixed(2)} EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                  ],
                ],
              },
            },
          ]
        : null,

      //* OfferingIncomeByIncomeAdjustment
      metricsTypesArray.includes(MetricSearchType.OfferingIncomeAdjustment)
        ? [
            // Table Title
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Ajustes de Ofrenda (Ingreso)`,
                      color: '#1d96d3',
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -10, 0, 3],
                    },
                  ],
                ],
              },
            },
            // Table body (content)
            {
              pageBreak: 'after',
              layout: 'customLayout01', // optional
              table: {
                headerRows: 1,
                widths: [100, 70, 120, '*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Fecha',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Comentarios',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (PEN)',
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (USD)',
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                    {
                      text: 'Total Acu. (EUR)',
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                  ],
                  ...offeringIncomeByIncomeAdjustmentDataResult.map(
                    (offering) => [
                      offering?.church?.abbreviatedChurchName,
                      formatDateToLimaDayMonthYear(offering?.date),
                      offering.comments,
                      `${offering.accumulatedOfferingPEN.toFixed(2)} PEN`,
                      `${offering.accumulatedOfferingUSD.toFixed(2)} USD`,
                      `${offering.accumulatedOfferingEUR.toFixed(2)} EUR`,
                    ],
                  ),
                  ['', '', '', '', '', ''],
                  ['', '', '', '', '', ''],
                  [
                    '',
                    '',
                    {
                      text: 'Totales',
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: 'red',
                        alignment: 'center',
                      },
                    },
                    {
                      text: `${offeringIncomeByIncomeAdjustmentDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0).toFixed(2)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByIncomeAdjustmentDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0).toFixed(2)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${offeringIncomeByIncomeAdjustmentDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0).toFixed(2)} EUR`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                  ],
                ],
              },
            },
          ]
        : null,
    ],
  };
};
