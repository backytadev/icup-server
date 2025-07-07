import type { TDocumentDefinitions } from 'pdfmake/interfaces';

import { footerSection } from '@/modules/reports/sections/footer.section';
import { headerSection } from '@/modules/reports/sections/header.section';

import { Church } from '@/modules/church/entities/church.entity';
import { MetricSearchType } from '@/modules/metrics/enums/metrics-search-type.enum';

import { OfferingIncomeCreationTypeNames } from '@/modules/offering/income/enums/offering-income-creation-type.enum';
import { YearlyIncomeExpenseComparativeDataResult } from '@/modules/metrics/helpers/offering-comparative/income-and-expenses-comparative-formatter.helper';
import { OfferingIncomeComparativeByTypeDataResult } from '@/modules/metrics/helpers/offering-comparative/comparative-offering-income-by-type-formatter.helper';
import { GeneralOfferingIncomeComparativeDataResult } from '@/modules/metrics/helpers/offering-comparative/general-comparative-offering-income-formatter.helper';
import { OfferingExpenseComparativeByTypeDataResult } from '@/modules/metrics/helpers/offering-comparative/comparative-offering-expenses-by-type-formatter.helper';
import { GeneralOfferingExpensesComparativeDataResult } from '@/modules/metrics/helpers/offering-comparative/general-comparative-offering-expenses-formatter.helper';
import { OfferingExpenseComparativeBySubTypeDataResult } from '@/modules/metrics/helpers/offering-comparative/comparative-offering-expenses-by-sub-type-formatter.helper';

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
  church: Church;
  startMonth: string;
  endMonth: string;
  metricsTypesArray: string[];
  yearlyIncomeExpenseComparativePenDataResult: YearlyIncomeExpenseComparativeDataResult[];
  yearlyIncomeExpenseComparativeUsdDataResult: YearlyIncomeExpenseComparativeDataResult[];
  yearlyIncomeExpenseComparativeEurDataResult: YearlyIncomeExpenseComparativeDataResult[];
  generalOfferingIncomeComparativeDataResult: GeneralOfferingIncomeComparativeDataResult[];
  offeringIncomeComparativeByFamilyGroupDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeBySundayServiceDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeBySundaySchoolDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeByGeneralFastingDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeByGeneralVigilDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeByZonalVigilDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeByZonalFastingDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeByYouthServiceDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeByUnitedServiceDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeBySpecialOfferingDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeByActivitiesDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeByChurchGroundDataResult: OfferingIncomeComparativeByTypeDataResult[];
  offeringIncomeComparativeByIncomeAdjustmentDataResult: OfferingIncomeComparativeByTypeDataResult[];
  generalOfferingExpensesComparativeDataResult: GeneralOfferingExpensesComparativeDataResult[];
  offeringOperationalExpensesComparativeDataResult: OfferingExpenseComparativeByTypeDataResult[];
  offeringExpensesComparativeByMaintenanceAndRepairDataResult: OfferingExpenseComparativeByTypeDataResult[];
  offeringExpensesComparativeByDecorationDataResult: OfferingExpenseComparativeByTypeDataResult[];
  offeringExpensesComparativeByEquipmentAndTechnologyDataResult: OfferingExpenseComparativeByTypeDataResult[];
  offeringExpensesComparativeBySuppliesDataResult: OfferingExpenseComparativeByTypeDataResult[];
  offeringExpensesComparativeByPlaningEventsDataResult: OfferingExpenseComparativeByTypeDataResult[];
  offeringExpensesComparativeByOtherExpensesDataResult: OfferingExpenseComparativeByTypeDataResult[];
  offeringExpensesComparativeByExpenseAdjustmentDataResult: OfferingExpenseComparativeByTypeDataResult[];
  offeringOperationalExpensesBySubTypeComparativeDataResult: OfferingExpenseComparativeBySubTypeDataResult[];
  offeringMaintenanceAndRepairExpensesBySubTypeComparativeDataResult: OfferingExpenseComparativeBySubTypeDataResult[];
  offeringDecorationExpensesBySubTypeComparativeDataResult: OfferingExpenseComparativeBySubTypeDataResult[];
  offeringSuppliesExpensesBySubTypeComparativeDataResult: OfferingExpenseComparativeBySubTypeDataResult[];
  offeringPlaningEventsExpensesBySubTypeComparativeDataResult: OfferingExpenseComparativeBySubTypeDataResult[];
  offeringOtherExpensesBySubTypeComparativeDataResult: OfferingExpenseComparativeBySubTypeDataResult[];
  offeringEquipmentAndTechnologyExpensesBySubTypeComparativeDataResult: OfferingExpenseComparativeBySubTypeDataResult[];
}

export const getFinancialBalanceComparativeMetricsReport = (
  options: ReportOptions,
): TDocumentDefinitions => {
  const {
    title,
    subTitle,
    year,
    church,
    startMonth,
    endMonth,
    metricsTypesArray,
    yearlyIncomeExpenseComparativePenDataResult,
    yearlyIncomeExpenseComparativeUsdDataResult,
    yearlyIncomeExpenseComparativeEurDataResult,
    generalOfferingIncomeComparativeDataResult,
    offeringIncomeComparativeByFamilyGroupDataResult,
    offeringIncomeComparativeBySundayServiceDataResult,
    offeringIncomeComparativeBySundaySchoolDataResult,
    offeringIncomeComparativeByGeneralFastingDataResult,
    offeringIncomeComparativeByGeneralVigilDataResult,
    offeringIncomeComparativeByZonalVigilDataResult,
    offeringIncomeComparativeByZonalFastingDataResult,
    offeringIncomeComparativeByYouthServiceDataResult,
    offeringIncomeComparativeByUnitedServiceDataResult,
    offeringIncomeComparativeBySpecialOfferingDataResult,
    offeringIncomeComparativeByActivitiesDataResult,
    offeringIncomeComparativeByChurchGroundDataResult,
    offeringIncomeComparativeByIncomeAdjustmentDataResult,
    generalOfferingExpensesComparativeDataResult,
    offeringOperationalExpensesComparativeDataResult,
    offeringExpensesComparativeByMaintenanceAndRepairDataResult,
    offeringExpensesComparativeByDecorationDataResult,
    offeringExpensesComparativeByEquipmentAndTechnologyDataResult,
    offeringExpensesComparativeBySuppliesDataResult,
    offeringExpensesComparativeByPlaningEventsDataResult,
    offeringExpensesComparativeByOtherExpensesDataResult,
    offeringExpensesComparativeByExpenseAdjustmentDataResult,
    offeringOperationalExpensesBySubTypeComparativeDataResult,
    offeringMaintenanceAndRepairExpensesBySubTypeComparativeDataResult,
    offeringDecorationExpensesBySubTypeComparativeDataResult,
    offeringEquipmentAndTechnologyExpensesBySubTypeComparativeDataResult,
    offeringSuppliesExpensesBySubTypeComparativeDataResult,
    offeringOtherExpensesBySubTypeComparativeDataResult,
    offeringPlaningEventsExpensesBySubTypeComparativeDataResult,
  } = options;

  const monthValues = Object.values(monthNames);
  const startIndex = monthValues.indexOf(monthNames[startMonth]);
  const endIndex = monthValues.indexOf(monthNames[endMonth]);

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
      //? IncomeAndExpensesComparativeByYear
      metricsTypesArray.includes(
        MetricSearchType.IncomeAndExpensesComparativeByYear,
      )
        ? [
            //* Sol Peruano PEN
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `Comparativa Ingresos vs Egresos`,
                      color: '#1d96d3',
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -10, 0, 0],
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
                      text: `Moneda: Sol Peruano (PEN)`,
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
                widths: [100, 100, '*', '*', '*', '*'],
                body: [
                  [
                    {
                      text: 'Iglesia',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: 'Mes / Año',
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: `Saldo (Mes Anterior)`,
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: `Ingresos`,
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                    {
                      text: `Gastos`,
                      style: {
                        color: 'red',
                        bold: true,
                      },
                    },
                    {
                      text: `Diferencia`,
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                  ],
                  ...yearlyIncomeExpenseComparativePenDataResult
                    .filter(
                      (item) =>
                        Object.values(monthNames).indexOf(item.month) <=
                        Object.values(monthNames).indexOf(monthNames[endMonth]),
                    )
                    .map((item) => [
                      item?.church?.abbreviatedChurchName,
                      `${item?.month} - ${year}`,
                      `${item?.netResultPrevious.toFixed(2)} ${item?.currency !== 'S/D' ? item?.currency : 'PEN'}`,
                      `${item?.totalIncome.toFixed(2)} ${item?.currency !== 'S/D' ? item?.currency : 'PEN'}`,
                      `${item?.totalExpenses.toFixed(2)} ${item?.currency !== 'S/D' ? item?.currency : 'PEN'}`,
                      `${(+item?.netResultPrevious + item?.totalIncome - item?.totalExpenses).toFixed(2)} ${item?.currency !== 'S/D' ? item?.currency : 'PEN'}`,
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
                        alignment: 'right',
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${yearlyIncomeExpenseComparativePenDataResult
                        .filter(
                          (item) =>
                            Object.values(monthNames).indexOf(item.month) <=
                            Object.values(monthNames).indexOf(
                              monthNames[endMonth],
                            ),
                        )
                        .reduce(
                          (acc, offering) => acc + offering?.totalIncome,
                          0,
                        )
                        .toFixed(2)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${yearlyIncomeExpenseComparativePenDataResult
                        .filter(
                          (item) =>
                            Object.values(monthNames).indexOf(item.month) <=
                            Object.values(monthNames).indexOf(
                              monthNames[endMonth],
                            ),
                        )
                        .reduce(
                          (acc, offering) => acc + offering?.totalExpenses,
                          0,
                        )
                        .toFixed(2)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    '-',
                  ],
                  [
                    '',
                    '',
                    '',
                    '',
                    {
                      text: `Saldo actual (${monthNames[endMonth]})`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#e89c37',
                      },
                    },
                    {
                      text: `${yearlyIncomeExpenseComparativePenDataResult
                        .filter(
                          (item) =>
                            Object.values(monthNames).indexOf(item.month) <=
                            Object.values(monthNames).indexOf(
                              monthNames[endMonth],
                            ),
                        )
                        .at(-1)
                        .netResult.toFixed(2)} PEN`,
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

            //* Dolar Americano USD
            yearlyIncomeExpenseComparativeUsdDataResult.some(
              (item) => item.totalIncome !== 0 || item.totalExpenses !== 0,
            )
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos vs Egresos`,
                            color: '#1d96d3',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Moneda: Dolar Americano (USD)`,
                            color: '#1d96d3',
                            fontSize: 16,
                            bold: true,
                            italics: true,
                            alignment: 'center',
                            margin: [0, 1, 0, 5],
                          },
                        ],
                      ],
                    },
                  },
                  {
                    pageBreak: 'after',
                    layout: 'customLayout01', // optional
                    table: {
                      headerRows: 1,
                      widths: [100, 100, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes / Año',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Saldo (Mes Anterior)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Ingresos`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Gastos`,
                            style: {
                              color: 'red',
                              bold: true,
                            },
                          },
                          {
                            text: `Diferencia`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...yearlyIncomeExpenseComparativeUsdDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .map((item) => [
                            item?.church?.abbreviatedChurchName ??
                              church?.abbreviatedChurchName,
                            `${item?.month} - ${year}`,
                            `${item?.netResultPrevious.toFixed(2)} ${item?.currency !== 'S/D' ? item?.currency : 'USD'}`,
                            `${item?.totalIncome.toFixed(2)} ${item?.currency !== 'S/D' ? item?.currency : 'USD'}`,
                            `${item?.totalExpenses.toFixed(2)} ${item?.currency !== 'S/D' ? item?.currency : 'USD'}`,
                            `${(+item?.netResultPrevious + item?.totalIncome - item?.totalExpenses).toFixed(2)} ${item?.currency !== 'S/D' ? item?.currency : 'USD'}`,
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
                              alignment: 'right',
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${yearlyIncomeExpenseComparativeUsdDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) => acc + offering?.totalIncome,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${yearlyIncomeExpenseComparativeUsdDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.totalExpenses,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          '-',
                        ],
                        [
                          '',
                          '',
                          '',
                          '',
                          {
                            text: `Saldo actual (${monthNames[endMonth]})`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              colSpan: 2,
                              color: '#e89c37',
                            },
                          },
                          {
                            text: `${yearlyIncomeExpenseComparativeUsdDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .at(-1)
                              .netResult.toFixed(2)} USD`,
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

            //* Euro Europeo EUR
            yearlyIncomeExpenseComparativeEurDataResult.some(
              (item) => item.totalIncome !== 0 || item.totalExpenses !== 0,
            )
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos vs Egresos`,
                            color: '#1d96d3',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Moneda: Euro Europeo (EUR)`,
                            color: '#1d96d3',
                            fontSize: 16,
                            bold: true,
                            italics: true,
                            alignment: 'center',
                            margin: [0, 1, 0, 5],
                          },
                        ],
                      ],
                    },
                  },
                  {
                    pageBreak: 'after',
                    layout: 'customLayout01', // optional
                    table: {
                      headerRows: 1,
                      widths: [100, 100, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes / Año',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Saldo (Mes Anterior)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Ingresos`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Gastos`,
                            style: {
                              color: 'red',
                              bold: true,
                            },
                          },
                          {
                            text: `Diferencia`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...yearlyIncomeExpenseComparativeEurDataResult
                          .filter(
                            (item) =>
                              Object.values(monthNames).indexOf(item.month) <=
                              Object.values(monthNames).indexOf(
                                monthNames[endMonth],
                              ),
                          )
                          .map((item) => [
                            item?.church?.abbreviatedChurchName ??
                              church?.abbreviatedChurchName,
                            `${item?.month} - ${year}`,
                            `${item?.netResultPrevious.toFixed(2)} ${item?.currency !== 'S/D' ? item?.currency : 'EUR'}`,
                            `${item?.totalIncome.toFixed(2)} ${item?.currency !== 'S/D' ? item?.currency : 'EUR'}`,
                            `${item?.totalExpenses.toFixed(2)} ${item?.currency !== 'S/D' ? item?.currency : 'EUR'}`,
                            `${(+item?.netResultPrevious + item?.totalIncome - item?.totalExpenses).toFixed(2)} ${item?.currency !== 'S/D' ? item?.currency : 'EUR'}`,
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
                              alignment: 'right',
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${yearlyIncomeExpenseComparativeEurDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) => acc + offering?.totalIncome,
                                0,
                              )
                              .toFixed(2)} EUR`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${yearlyIncomeExpenseComparativeEurDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.totalExpenses,
                                0,
                              )
                              .toFixed(2)} EUR`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          '',
                        ],
                        [
                          '',
                          '',
                          '',
                          '',
                          {
                            text: `Saldo actual (${monthNames[endMonth]})`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              colSpan: 2,
                              color: '#e89c37',
                            },
                          },
                          {
                            text: `${yearlyIncomeExpenseComparativeEurDataResult
                              .filter(
                                (item) =>
                                  Object.values(monthNames).indexOf(
                                    item.month,
                                  ) <=
                                  Object.values(monthNames).indexOf(
                                    monthNames[endMonth],
                                  ),
                              )
                              .at(-1)
                              .netResult.toFixed(2)} EUR`,
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
          ]
        : null,

      //* GeneralComparativeOfferingIncome
      metricsTypesArray.includes(
        MetricSearchType.GeneralComparativeOfferingIncome,
      ) && generalOfferingIncomeComparativeDataResult.length > 0
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
                      text: `Comparativa Ingresos de Ofrenda`,
                      color: '#1d59d3',
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -10, 0, 0],
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
                      text: `Búsqueda General`,
                      color: '#1d96d3',
                      fontSize: 18,
                      italics: true,
                      bold: true,
                      alignment: 'center',
                      margin: [0, 0, 0, 5],
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
                      text: `(Acumulado por sub-tipo, rango de meses y año)`,
                      color: '#1d96d3',
                      fontSize: 15,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -8, 0, 8],
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
                widths: [100, 100, '*', '*', '*', '*', '*'],
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
                      text: `Tipo`,
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: `Sub-Tipo`,
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: `Total Acu. (PEN)`,
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: `Total Acu. (USD)`,
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                    {
                      text: `Total Acu. (EUR)`,
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                  ],
                  ...generalOfferingIncomeComparativeDataResult.map((item) => [
                    item?.church?.abbreviatedChurchName,
                    `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                    item?.type,
                    item?.subType ===
                    OfferingIncomeCreationTypeNames.income_adjustment
                      ? '-'
                      : item?.subType,
                    item?.accumulatedOfferingPEN.toFixed(2),
                    item?.accumulatedOfferingUSD.toFixed(2),
                    item?.accumulatedOfferingEUR.toFixed(2),
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
                        alignment: 'right',
                        color: '#475569',
                      },
                    },
                    {
                      text: `${generalOfferingIncomeComparativeDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0).toFixed(2)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${generalOfferingIncomeComparativeDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0).toFixed(2)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${generalOfferingIncomeComparativeDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0).toFixed(2)} EUR`,
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

      //? ComparativeOfferingIncomeByType
      metricsTypesArray.includes(
        MetricSearchType.ComparativeOfferingIncomeByType,
      )
        ? [
            //* Sunday Service
            offeringIncomeComparativeBySundayServiceDataResult.length > 0 &&
            offeringIncomeComparativeBySundayServiceDataResult.filter(
              (item) => {
                const itemIndex = monthValues.indexOf(item.month);
                return itemIndex >= startIndex && itemIndex <= endIndex;
              },
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
                            color: '#1d59d3',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por sub-tipo, mes y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Culto Dominical`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 2, 0, 2],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeBySundayServiceDataResult
                          .filter((item) => {
                            const itemIndex = monthValues.indexOf(item.month);
                            return (
                              itemIndex >= startIndex && itemIndex <= endIndex
                            );
                          })
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeBySundayServiceDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeBySundayServiceDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeBySundayServiceDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* Family Group
            offeringIncomeComparativeByFamilyGroupDataResult.length > 0 &&
            offeringIncomeComparativeByFamilyGroupDataResult.filter((item) => {
              const itemIndex = monthValues.indexOf(item.month);
              return itemIndex >= startIndex && itemIndex <= endIndex;
            }).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
                            color: '#1d59d3',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por sub-tipo, mes y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Grupo Familiar`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 2, 0, 2],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeByFamilyGroupDataResult
                          .filter((item) => {
                            const itemIndex = monthValues.indexOf(item.month);
                            return (
                              itemIndex >= startIndex && itemIndex <= endIndex
                            );
                          })
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByFamilyGroupDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByFamilyGroupDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByFamilyGroupDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* Sunday School
            offeringIncomeComparativeBySundaySchoolDataResult.length > 0 &&
            offeringIncomeComparativeBySundaySchoolDataResult.filter((item) => {
              const itemIndex = monthValues.indexOf(item.month);
              return itemIndex >= startIndex && itemIndex <= endIndex;
            }).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
                            color: '#1d59d3',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por sub-tipo, mes y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Escuela Dominical`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 2, 0, 2],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeBySundaySchoolDataResult
                          .filter((item) => {
                            const itemIndex = monthValues.indexOf(item.month);
                            return (
                              itemIndex >= startIndex && itemIndex <= endIndex
                            );
                          })
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeBySundaySchoolDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeBySundaySchoolDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeBySundaySchoolDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* Youth Service
            offeringIncomeComparativeByYouthServiceDataResult.length > 0 &&
            offeringIncomeComparativeByYouthServiceDataResult.filter((item) => {
              const itemIndex = monthValues.indexOf(item.month);
              return itemIndex >= startIndex && itemIndex <= endIndex;
            }).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
                            color: '#1d59d3',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por sub-tipo, mes y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Culto Jóvenes`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 2, 0, 2],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeByYouthServiceDataResult
                          .filter((item) => {
                            const itemIndex = monthValues.indexOf(item.month);
                            return (
                              itemIndex >= startIndex && itemIndex <= endIndex
                            );
                          })
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByYouthServiceDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByYouthServiceDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByYouthServiceDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* Church Ground
            offeringIncomeComparativeByChurchGroundDataResult.length > 0 &&
            offeringIncomeComparativeByChurchGroundDataResult.filter((item) => {
              const itemIndex = monthValues.indexOf(item.month);
              return itemIndex >= startIndex && itemIndex <= endIndex;
            }).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
                            color: '#1d59d3',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por sub-tipo, mes y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Terreno Iglesia`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 2, 0, 2],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeByChurchGroundDataResult
                          .filter((item) => {
                            const itemIndex = monthValues.indexOf(item.month);
                            return (
                              itemIndex >= startIndex && itemIndex <= endIndex
                            );
                          })
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByChurchGroundDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByChurchGroundDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByChurchGroundDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* Activities
            offeringIncomeComparativeByActivitiesDataResult.length > 0 &&
            offeringIncomeComparativeByActivitiesDataResult.filter((item) => {
              const itemIndex = monthValues.indexOf(item.month);
              return itemIndex >= startIndex && itemIndex <= endIndex;
            }).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
                            color: '#1d59d3',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por sub-tipo, mes y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Actividades`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 2, 0, 2],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeByActivitiesDataResult
                          .filter((item) => {
                            const itemIndex = monthValues.indexOf(item.month);
                            return (
                              itemIndex >= startIndex && itemIndex <= endIndex
                            );
                          })
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByActivitiesDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByActivitiesDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByActivitiesDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* General Fasting
            offeringIncomeComparativeByGeneralFastingDataResult.length > 0 &&
            offeringIncomeComparativeByGeneralFastingDataResult.filter(
              (item) => {
                const itemIndex = monthValues.indexOf(item.month);
                return itemIndex >= startIndex && itemIndex <= endIndex;
              },
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
                            color: '#1d59d3',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por sub-tipo, mes y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Ayuno General`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 2, 0, 2],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeByGeneralFastingDataResult
                          .filter((item) => {
                            const itemIndex = monthValues.indexOf(item.month);
                            return (
                              itemIndex >= startIndex && itemIndex <= endIndex
                            );
                          })
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByGeneralFastingDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByGeneralFastingDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByGeneralFastingDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* Zonal Fasting
            offeringIncomeComparativeByZonalFastingDataResult.length > 0 &&
            offeringIncomeComparativeByZonalFastingDataResult.filter((item) => {
              const itemIndex = monthValues.indexOf(item.month);
              return itemIndex >= startIndex && itemIndex <= endIndex;
            }).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
                            color: '#1d59d3',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por sub-tipo, mes y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Ayuno Zonal`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 2, 0, 2],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeByZonalFastingDataResult
                          .filter((item) => {
                            const itemIndex = monthValues.indexOf(item.month);
                            return (
                              itemIndex >= startIndex && itemIndex <= endIndex
                            );
                          })
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByZonalFastingDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByZonalFastingDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByZonalFastingDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* General Vigil
            offeringIncomeComparativeByGeneralVigilDataResult.length > 0 &&
            offeringIncomeComparativeByGeneralVigilDataResult.filter((item) => {
              const itemIndex = monthValues.indexOf(item.month);
              return itemIndex >= startIndex && itemIndex <= endIndex;
            }).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
                            color: '#1d59d3',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por sub-tipo, mes y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Vigilia General`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 2, 0, 2],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeByGeneralVigilDataResult
                          .filter((item) => {
                            const itemIndex = monthValues.indexOf(item.month);
                            return (
                              itemIndex >= startIndex && itemIndex <= endIndex
                            );
                          })
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByGeneralVigilDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByGeneralVigilDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByGeneralVigilDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* Zonal Vigil
            offeringIncomeComparativeByZonalVigilDataResult.length > 0 &&
            offeringIncomeComparativeByZonalVigilDataResult.filter((item) => {
              const itemIndex = monthValues.indexOf(item.month);
              return itemIndex >= startIndex && itemIndex <= endIndex;
            }).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
                            color: '#1d59d3',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por sub-tipo, mes y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Vigilia Zonal`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 2, 0, 2],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeByZonalVigilDataResult
                          .filter((item) => {
                            const itemIndex = monthValues.indexOf(item.month);
                            return (
                              itemIndex >= startIndex && itemIndex <= endIndex
                            );
                          })
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByZonalVigilDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByZonalVigilDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByZonalVigilDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* United Service
            offeringIncomeComparativeByUnitedServiceDataResult.length > 0 &&
            offeringIncomeComparativeByUnitedServiceDataResult.filter(
              (item) => {
                const itemIndex = monthValues.indexOf(item.month);
                return itemIndex >= startIndex && itemIndex <= endIndex;
              },
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
                            color: '#1d59d3',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por sub-tipo, mes y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Culto Unido`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 2, 0, 2],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeByUnitedServiceDataResult
                          .filter((item) => {
                            const itemIndex = monthValues.indexOf(item.month);
                            return (
                              itemIndex >= startIndex && itemIndex <= endIndex
                            );
                          })
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByUnitedServiceDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByUnitedServiceDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByUnitedServiceDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* Special Offering
            offeringIncomeComparativeBySpecialOfferingDataResult.length > 0 &&
            offeringIncomeComparativeBySpecialOfferingDataResult.filter(
              (item) => {
                const itemIndex = monthValues.indexOf(item.month);
                return itemIndex >= startIndex && itemIndex <= endIndex;
              },
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
                            color: '#1d59d3',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por sub-tipo, mes y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Ofrenda Especial`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 2, 0, 2],
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
                      widths: [100, 100, 60, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeBySpecialOfferingDataResult
                          .filter((item) => {
                            const itemIndex = monthValues.indexOf(item.month);
                            return (
                              itemIndex >= startIndex && itemIndex <= endIndex
                            );
                          })
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeBySpecialOfferingDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeBySpecialOfferingDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeBySpecialOfferingDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* Income Adjustment
            offeringIncomeComparativeByIncomeAdjustmentDataResult.length > 0 &&
            offeringIncomeComparativeByIncomeAdjustmentDataResult.filter(
              (item) => {
                const itemIndex = monthValues.indexOf(item.month);
                return itemIndex >= startIndex && itemIndex <= endIndex;
              },
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Ingresos de Ofrenda`,
                            color: '#1d59d3',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por tipo, mes y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Ajustes (Ingreso)`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 5, 0, 2],
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
                      widths: [100, 80, 100, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringIncomeComparativeByIncomeAdjustmentDataResult
                          .filter((item) => {
                            const itemIndex = monthValues.indexOf(item.month);
                            return (
                              itemIndex >= startIndex && itemIndex <= endIndex
                            );
                          })
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            item?.subType ===
                            OfferingIncomeCreationTypeNames.income_adjustment
                              ? '-'
                              : item?.subType,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByIncomeAdjustmentDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByIncomeAdjustmentDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringIncomeComparativeByIncomeAdjustmentDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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
          ]
        : null,

      //? GeneralComparativeOfferingExpenses
      metricsTypesArray.includes(
        MetricSearchType.GeneralComparativeOfferingExpenses,
      ) && generalOfferingExpensesComparativeDataResult.length > 0
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
                      text: `Comparativa Gastos de Ofrenda`,
                      color: 'red',
                      fontSize: 20,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -10, 0, 0],
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
                      text: `Búsqueda General`,
                      color: '#1d96d3',
                      fontSize: 18,
                      italics: true,
                      bold: true,
                      alignment: 'center',
                      margin: [0, 0, 0, 5],
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
                      text: `(Acumulado por tipo, rango de meses y año)`,
                      color: '#1d96d3',
                      fontSize: 15,
                      bold: true,
                      alignment: 'center',
                      margin: [0, -8, 0, 8],
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
                widths: [100, 100, '*', '*', '*', '*'],
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
                      text: `Tipo`,
                      style: {
                        bold: true,
                      },
                    },
                    {
                      text: `Total Acu. (PEN)`,
                      style: {
                        color: 'blue',
                        bold: true,
                      },
                    },
                    {
                      text: `Total Acu. (USD)`,
                      style: {
                        color: 'green',
                        bold: true,
                      },
                    },
                    {
                      text: `Total Acu. (EUR)`,
                      style: {
                        color: 'purple',
                        bold: true,
                      },
                    },
                  ],
                  ...generalOfferingExpensesComparativeDataResult.map(
                    (item) => [
                      item?.church?.abbreviatedChurchName,
                      `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                      item?.type,
                      item?.accumulatedOfferingPEN.toFixed(2),
                      item?.accumulatedOfferingUSD.toFixed(2),
                      item?.accumulatedOfferingEUR.toFixed(2),
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
                        alignment: 'right',
                        color: '#475569',
                      },
                    },
                    {
                      text: `${generalOfferingExpensesComparativeDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingPEN, 0).toFixed(2)} PEN`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${generalOfferingExpensesComparativeDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingUSD, 0).toFixed(2)} USD`,
                      style: {
                        bold: true,
                        fontSize: 13,
                        italics: true,
                        color: '#475569',
                      },
                    },
                    {
                      text: `${generalOfferingExpensesComparativeDataResult.reduce((acc, offering) => acc + offering?.accumulatedOfferingEUR, 0).toFixed(2)} EUR`,
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

      //? ComparativeOfferingExpensesByType
      metricsTypesArray.includes(
        MetricSearchType.ComparativeOfferingExpensesByType,
      )
        ? [
            //* Operational Expenses
            offeringOperationalExpensesComparativeDataResult.length > 0 &&
            offeringOperationalExpensesComparativeDataResult.filter((item) => {
              const itemIndex = monthValues.indexOf(item.month);
              return itemIndex >= startIndex && itemIndex <= endIndex;
            }).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por tipo, mes y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Gastos Operativos`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 2, 0, 2],
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
                      widths: [100, 90, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringOperationalExpensesComparativeDataResult
                          .filter((item) => {
                            const itemIndex = monthValues.indexOf(item.month);
                            return (
                              itemIndex >= startIndex && itemIndex <= endIndex
                            );
                          })
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringOperationalExpensesComparativeDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringOperationalExpensesComparativeDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringOperationalExpensesComparativeDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* Maintenance and Repair
            offeringExpensesComparativeByMaintenanceAndRepairDataResult.length >
              0 &&
            offeringExpensesComparativeByMaintenanceAndRepairDataResult.filter(
              (item) => {
                const itemIndex = monthValues.indexOf(item.month);
                return itemIndex >= startIndex && itemIndex <= endIndex;
              },
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por tipo, mes y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Gastos de Mantenimiento y Reparación`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 2, 0, 2],
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
                      widths: [100, 90, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringExpensesComparativeByMaintenanceAndRepairDataResult
                          .filter((item) => {
                            const itemIndex = monthValues.indexOf(item.month);
                            return (
                              itemIndex >= startIndex && itemIndex <= endIndex
                            );
                          })
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByMaintenanceAndRepairDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByMaintenanceAndRepairDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByMaintenanceAndRepairDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* Decoration
            offeringExpensesComparativeByDecorationDataResult.length > 0 &&
            offeringExpensesComparativeByDecorationDataResult.filter((item) => {
              const itemIndex = monthValues.indexOf(item.month);
              return itemIndex >= startIndex && itemIndex <= endIndex;
            }).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por tipo, mes y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Gastos de Decoración`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 2, 0, 2],
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
                      widths: [100, 90, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringExpensesComparativeByDecorationDataResult
                          .filter((item) => {
                            const itemIndex = monthValues.indexOf(item.month);
                            return (
                              itemIndex >= startIndex && itemIndex <= endIndex
                            );
                          })
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByDecorationDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByDecorationDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByDecorationDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* Equipment and Technology
            offeringExpensesComparativeByEquipmentAndTechnologyDataResult.length >
              0 &&
            offeringExpensesComparativeByEquipmentAndTechnologyDataResult.filter(
              (item) => {
                const itemIndex = monthValues.indexOf(item.month);
                return itemIndex >= startIndex && itemIndex <= endIndex;
              },
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por tipo, mes y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Gastos de Equipamiento y Tecnología`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 2, 0, 2],
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
                      widths: [100, 90, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringExpensesComparativeByEquipmentAndTechnologyDataResult
                          .filter((item) => {
                            const itemIndex = monthValues.indexOf(item.month);
                            return (
                              itemIndex >= startIndex && itemIndex <= endIndex
                            );
                          })
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByEquipmentAndTechnologyDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByEquipmentAndTechnologyDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByEquipmentAndTechnologyDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* Supplies
            offeringExpensesComparativeBySuppliesDataResult.length > 0 &&
            offeringExpensesComparativeBySuppliesDataResult.filter((item) => {
              const itemIndex = monthValues.indexOf(item.month);
              return itemIndex >= startIndex && itemIndex <= endIndex;
            }).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por tipo, mes y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Gastos de Suministros`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 2, 0, 2],
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
                      widths: [100, 90, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringExpensesComparativeBySuppliesDataResult
                          .filter((item) => {
                            const itemIndex = monthValues.indexOf(item.month);
                            return (
                              itemIndex >= startIndex && itemIndex <= endIndex
                            );
                          })
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeBySuppliesDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeBySuppliesDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeBySuppliesDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* Planing Events
            offeringExpensesComparativeByPlaningEventsDataResult.length > 0 &&
            offeringExpensesComparativeByPlaningEventsDataResult.filter(
              (item) => {
                const itemIndex = monthValues.indexOf(item.month);
                return itemIndex >= startIndex && itemIndex <= endIndex;
              },
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por tipo, mes y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Gastos de Planificación de Eventos`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 2, 0, 2],
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
                      widths: [100, 90, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringExpensesComparativeByPlaningEventsDataResult
                          .filter((item) => {
                            const itemIndex = monthValues.indexOf(item.month);
                            return (
                              itemIndex >= startIndex && itemIndex <= endIndex
                            );
                          })
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByPlaningEventsDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByPlaningEventsDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByPlaningEventsDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* Other Expenses
            offeringExpensesComparativeByOtherExpensesDataResult.length > 0 &&
            offeringExpensesComparativeByOtherExpensesDataResult.filter(
              (item) => {
                const itemIndex = monthValues.indexOf(item.month);
                return itemIndex >= startIndex && itemIndex <= endIndex;
              },
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por tipo, mes y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Otros Gastos`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 2, 0, 2],
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
                      widths: [100, 90, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringExpensesComparativeByOtherExpensesDataResult
                          .filter((item) => {
                            const itemIndex = monthValues.indexOf(item.month);
                            return (
                              itemIndex >= startIndex && itemIndex <= endIndex
                            );
                          })
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByOtherExpensesDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByOtherExpensesDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByOtherExpensesDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* Expense Adjustment
            offeringExpensesComparativeByExpenseAdjustmentDataResult.length >
              0 &&
            offeringExpensesComparativeByExpenseAdjustmentDataResult.filter(
              (item) => {
                const itemIndex = monthValues.indexOf(item.month);
                return itemIndex >= startIndex && itemIndex <= endIndex;
              },
            ).length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por tipo, mes y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Ajustes (Salidas)`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 5, 0, 2],
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
                      widths: [100, 90, '*', '*', '*', '*'],
                      body: [
                        [
                          {
                            text: 'Iglesia',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: 'Mes',
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringExpensesComparativeByExpenseAdjustmentDataResult
                          .filter((item) => {
                            const itemIndex = monthValues.indexOf(item.month);
                            return (
                              itemIndex >= startIndex && itemIndex <= endIndex
                            );
                          })
                          .map((item) => [
                            item?.church?.abbreviatedChurchName,
                            item?.month,
                            item?.type,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByExpenseAdjustmentDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByExpenseAdjustmentDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringExpensesComparativeByExpenseAdjustmentDataResult
                              .filter((item) => {
                                const itemIndex = monthValues.indexOf(
                                  item.month,
                                );
                                return (
                                  itemIndex >= startIndex &&
                                  itemIndex <= endIndex
                                );
                              })
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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
          ]
        : null,

      //? ComparativeOffering Expenses By SubType
      metricsTypesArray.includes(
        MetricSearchType.ComparativeOfferingExpensesBySubType,
      )
        ? [
            //* Operational Expenses
            offeringOperationalExpensesBySubTypeComparativeDataResult.length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por sub-tipo, rango de meses y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Gastos Operativos`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 2, 0, 2],
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
                      widths: [100, 110, '*', '*', '*', '*'],
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
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringOperationalExpensesBySubTypeComparativeDataResult.map(
                          (item) => [
                            item?.church?.abbreviatedChurchName,
                            `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                            item?.subType,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringOperationalExpensesBySubTypeComparativeDataResult.reduce(
                              (acc, offering) =>
                                acc + offering?.accumulatedOfferingPEN,
                              0,
                            )} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringOperationalExpensesBySubTypeComparativeDataResult.reduce(
                              (acc, offering) =>
                                acc + offering?.accumulatedOfferingUSD,
                              0,
                            )} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringOperationalExpensesBySubTypeComparativeDataResult.reduce(
                              (acc, offering) =>
                                acc + offering?.accumulatedOfferingEUR,
                              0,
                            )} EUR`,
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

            //* Maintenance and Repair Expenses
            offeringMaintenanceAndRepairExpensesBySubTypeComparativeDataResult.length >
            0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por sub-tipo, rango de meses y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Gastos de Mantenimiento y Reparación`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 2, 0, 2],
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
                      widths: [100, 110, '*', '*', '*', '*'],
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
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringMaintenanceAndRepairExpensesBySubTypeComparativeDataResult.map(
                          (item) => [
                            item?.church?.abbreviatedChurchName,
                            `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                            item?.subType,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringMaintenanceAndRepairExpensesBySubTypeComparativeDataResult
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringMaintenanceAndRepairExpensesBySubTypeComparativeDataResult
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringOperationalExpensesBySubTypeComparativeDataResult
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* Decoration Expenses
            offeringDecorationExpensesBySubTypeComparativeDataResult.length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por sub-tipo, rango de meses y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Gastos de Decoración`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 5, 0, 2],
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
                      widths: [100, 110, '*', '*', '*', '*'],
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
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringDecorationExpensesBySubTypeComparativeDataResult.map(
                          (item) => [
                            item?.church?.abbreviatedChurchName,
                            `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                            item?.subType,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringDecorationExpensesBySubTypeComparativeDataResult
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringDecorationExpensesBySubTypeComparativeDataResult
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringDecorationExpensesBySubTypeComparativeDataResult
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* Equipment and Technology Expenses
            offeringEquipmentAndTechnologyExpensesBySubTypeComparativeDataResult.length >
            0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por sub-tipo, rango de meses y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Gastos de Equipamiento y Tecnología`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 5, 0, 2],
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
                      widths: [100, 110, '*', '*', '*', '*'],
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
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringEquipmentAndTechnologyExpensesBySubTypeComparativeDataResult.map(
                          (item) => [
                            item?.church?.abbreviatedChurchName,
                            `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                            item?.subType,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringEquipmentAndTechnologyExpensesBySubTypeComparativeDataResult
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringEquipmentAndTechnologyExpensesBySubTypeComparativeDataResult
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringEquipmentAndTechnologyExpensesBySubTypeComparativeDataResult
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* Supplies Expenses
            offeringSuppliesExpensesBySubTypeComparativeDataResult.length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por sub-tipo, rango de meses y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Gastos de Suministros`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 2, 0, 2],
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
                      widths: [100, 110, '*', '*', '*', '*'],
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
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringSuppliesExpensesBySubTypeComparativeDataResult.map(
                          (item) => [
                            item?.church?.abbreviatedChurchName,
                            `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                            item?.subType,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringSuppliesExpensesBySubTypeComparativeDataResult
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringSuppliesExpensesBySubTypeComparativeDataResult
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringSuppliesExpensesBySubTypeComparativeDataResult
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* Planing Events
            offeringPlaningEventsExpensesBySubTypeComparativeDataResult.length >
            0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por sub-tipo, rango de meses y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Gastos de Planificación de Eventos`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 5, 0, 2],
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
                      widths: [100, 110, '*', '*', '*', '*'],
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
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringPlaningEventsExpensesBySubTypeComparativeDataResult.map(
                          (item) => [
                            item?.church?.abbreviatedChurchName,
                            `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                            item?.subType,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringPlaningEventsExpensesBySubTypeComparativeDataResult
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringPlaningEventsExpensesBySubTypeComparativeDataResult
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringPlaningEventsExpensesBySubTypeComparativeDataResult
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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

            //* Other Expenses
            offeringOtherExpensesBySubTypeComparativeDataResult.length > 0
              ? [
                  {
                    layout: 'noBorders',
                    table: {
                      headerRows: 1,
                      widths: ['*'],
                      body: [
                        [
                          {
                            text: `Comparativa Gastos de Ofrenda`,
                            color: 'red',
                            fontSize: 20,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
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
                            text: `Búsqueda Detallada`,
                            color: '#1d96d3',
                            fontSize: 18,
                            italics: true,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 0, 0, 5],
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
                            text: `(Acumulado por sub-tipo, rango de meses y año)`,
                            color: '#1d96d3',
                            fontSize: 15,
                            bold: true,
                            alignment: 'center',
                            margin: [0, -8, 0, 0],
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
                            text: `Otros Gastos`,
                            color: '#e77f08',
                            fontSize: 18,
                            bold: true,
                            alignment: 'center',
                            margin: [0, 5, 0, 2],
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
                      widths: [100, 110, '*', '*', '*', '*'],
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
                            text: `Sub-Tipo`,
                            style: {
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (PEN)`,
                            style: {
                              color: 'blue',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (USD)`,
                            style: {
                              color: 'green',
                              bold: true,
                            },
                          },
                          {
                            text: `Total Acu. (EUR)`,
                            style: {
                              color: 'purple',
                              bold: true,
                            },
                          },
                        ],
                        ...offeringOtherExpensesBySubTypeComparativeDataResult.map(
                          (item) => [
                            item?.church?.abbreviatedChurchName,
                            `${monthNames[startMonth]} - ${monthNames[endMonth]}`,
                            item?.subType,
                            `${item?.accumulatedOfferingPEN.toFixed(2)} PEN`,
                            `${item?.accumulatedOfferingUSD.toFixed(2)} USD`,
                            `${item?.accumulatedOfferingEUR.toFixed(2)} EUR`,
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
                              alignment: 'right',
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringOtherExpensesBySubTypeComparativeDataResult
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingPEN,
                                0,
                              )
                              .toFixed(2)} PEN`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringOtherExpensesBySubTypeComparativeDataResult
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingUSD,
                                0,
                              )
                              .toFixed(2)} USD`,
                            style: {
                              bold: true,
                              fontSize: 13,
                              italics: true,
                              color: '#475569',
                            },
                          },
                          {
                            text: `${offeringOtherExpensesBySubTypeComparativeDataResult
                              .reduce(
                                (acc, offering) =>
                                  acc + offering?.accumulatedOfferingEUR,
                                0,
                              )
                              .toFixed(2)} EUR`,
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
          ]
        : null,
    ],
  };
};
