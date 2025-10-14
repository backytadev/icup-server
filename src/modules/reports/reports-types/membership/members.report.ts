import type { TDocumentDefinitions } from 'pdfmake/interfaces';

import { MaritalStatusNames } from '@/common/enums/marital-status.enum';

import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';

import { footerSection } from '@/modules/reports/sections/footer.section';
import { headerSection } from '@/modules/reports/sections/header.section';
import { formatDateToLimaDayMonthYear } from '@/common/helpers/format-date-to-lima';

type MemberOptions = Pastor | Copastor | Supervisor | Preacher | Disciple;
type DataOptions =
  | Pastor[]
  | Copastor[]
  | Supervisor[]
  | Preacher[]
  | Disciple[];

interface ReportOptions {
  title?: string;
  subTitle?: string;
  description: string;
  searchTerm?: string;
  searchType?: string;
  searchSubType?: string;
  orderSearch?: string;
  churchName?: string;
  data: DataOptions;
  isDiscipleModule?: boolean;
}

export const getMembersReport = (
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
    isDiscipleModule = false,
  } = options;

  //* Grouped by Family Group
  const groupedByZone = data.reduce(
    (acc: Record<string, Disciple[]>, item: Disciple) => {
      const groupId = item.theirFamilyGroup?.familyGroupCode ?? 'SIN_CODIGO';
      if (!acc[groupId]) {
        acc[groupId] = [];
      }
      acc[groupId].push(item);
      return acc;
    },
    {},
  );

  if (!isDiscipleModule) {
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
            widths: [100, 75, 'auto', 80, 95, 100, '*'],

            body: [
              [
                { text: 'Nom. y Apellidos', style: { bold: true } },
                { text: 'F. Nacimiento', style: { bold: true } },
                { text: 'E. Civil', style: { bold: true } },
                { text: 'F. Conversión', style: { bold: true } },
                { text: 'N. Teléfono', style: { bold: true } },
                { text: 'Distrito (S.U)', style: { bold: true } },
                { text: 'Dirección', style: { bold: true } },
              ],
              ...data.map((item: MemberOptions) => [
                `${item?.member?.firstNames} ${item?.member?.lastNames}`,
                formatDateToLimaDayMonthYear(item?.member?.birthDate),
                MaritalStatusNames[item?.member?.maritalStatus],
                formatDateToLimaDayMonthYear(item?.member?.conversionDate),
                item.member.phoneNumber ?? '-',
                `${item?.member?.residenceDistrict} - ${item?.member?.residenceUrbanSector}`,
                `${item?.member?.residenceAddress} (${item?.member?.referenceAddress})`,
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
            widths: [115, 75, 'auto', 'auto', 'auto', 'auto', 'auto'],
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
  } else if (searchType === 'Nombre de Zona') {
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
      content: Object.values(groupedByZone)
        .sort((a, b) =>
          (a[0]?.theirFamilyGroup?.familyGroupCode ?? '').localeCompare(
            b[0]?.theirFamilyGroup.familyGroupCode ?? '',
          ),
        )
        .map((data, index, array) => ({
          stack: [
            {
              layout: 'noBorders',
              table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                      text: `${data[0]?.theirFamilyGroup?.familyGroupCode} ~ ${data[0]?.theirFamilyGroup?.familyGroupName}`,
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
            {
              layout: 'customLayout01',
              table: {
                headerRows: 1,
                widths: [100, 75, 'auto', 80, 95, 100, '*'],
                body: [
                  [
                    { text: 'Nom. y Apellidos', style: { bold: true } },
                    { text: 'F. Nacimiento', style: { bold: true } },
                    { text: 'E. Civil', style: { bold: true } },
                    { text: 'F. Conversion', style: { bold: true } },
                    { text: 'N. Teléfono', style: { bold: true } },
                    { text: 'Distrito (S.U)', style: { bold: true } },
                    { text: 'Dirección', style: { bold: true } },
                  ],
                  ...data.map((item: MemberOptions) => [
                    `${item?.member?.firstNames} ${item?.member?.lastNames}`,
                    formatDateToLimaDayMonthYear(item?.member?.birthDate),
                    MaritalStatusNames[item?.member?.maritalStatus],
                    formatDateToLimaDayMonthYear(item?.member?.conversionDate),
                    item.member.phoneNumber ?? '-',
                    `${item?.member?.residenceDistrict} - ${item?.member?.residenceUrbanSector}`,
                    `${item?.member?.residenceAddress} (${item?.member?.referenceAddress})`,
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
                widths: [115, 75, 'auto', 75, 'auto', 'auto', 'auto'],
                body: [
                  [
                    {
                      text: `Total de ${description}:`,
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
          pageBreak: index < array.length - 1 ? 'after' : undefined,
        })),
    };
  }
};
