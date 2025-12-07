import type { TDocumentDefinitions } from 'pdfmake/interfaces';

import { GenderNames } from '@/common/enums/gender.enum';
import { UserRoleNames } from '@/common/enums/user-role.enum';

import { User } from '@/modules/user/entities/user.entity';

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
  data: User[];
}

export const getUsersReport = (
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
    }),
    footer: footerSection,
    pageMargins: [20, 120, 20, 60],
    content: [
      {
        layout: 'customLayout01', // optional
        table: {
          headerRows: 1,
          widths: ['*', '*', '*', '*', '*'],

          body: [
            [
              {
                text: 'Nombres',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Apellidos',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Genero',
                style: {
                  bold: true,
                },
              },
              {
                text: 'E-mail',
                style: {
                  bold: true,
                },
              },
              {
                text: 'Roles',
                style: {
                  bold: true,
                },
              },
            ],
            ...data.map((item) => [
              item?.firstNames,
              item?.lastNames,
              GenderNames[item?.gender],
              item?.email,
              item?.roles.length > 1
                ? item?.roles.map((role) => UserRoleNames[role]).join(' ~ ')
                : UserRoleNames[item?.roles[0]],
            ]),
            ['', '', '', '', ''],
            ['', '', '', '', ''],
          ],
        },
      },

      {
        layout: 'noBorders',
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto', 'auto', 'auto'],
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
            ],
          ],
        },
      },
    ],
  };
};
