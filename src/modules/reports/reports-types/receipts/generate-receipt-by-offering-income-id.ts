import type { TDocumentDefinitions } from 'pdfmake/interfaces';

import {
  formatDateToLimaWithTime,
  formatDateToLimaDayMonthYear,
} from '@/common/helpers/format-date-to-lima';

import {
  OfferingIncomeCreationType,
  OfferingIncomeCreationTypeNames,
} from '@/modules/offering/income/enums/offering-income-creation-type.enum';
import {
  OfferingIncomeCreationSubType,
  OfferingIncomeCreationSubTypeNames,
} from '@/modules/offering/income/enums/offering-income-creation-sub-type.enum';
import {
  OfferingIncomeCreationCategory,
  OfferingIncomeCreationCategoryNames,
} from '@/modules/offering/income/enums/offering-income-creation-category.enum';
import { MemberTypeNames } from '@/modules/offering/income/enums/member-type.enum';
import { OfferingIncomeCreationShiftTypeNames } from '@/modules/offering/income/enums/offering-income-creation-shift-type.enum';

interface ReceiptValues {
  churchName: string;
  abbreviatedChurchName: string;
  churchAddress: string;
  churchPhoneNumber: string;
  churchEmail: string;
  type: string;
  subType?: string;
  amount: number;
  currency: string;
  comments?: string;
  category?: string;
  shift?: string;
  date: Date;
  familyGroupName?: string;
  familyGroupCode?: string;
  zoneName?: string;
  zoneDistrict?: string;
  memberType?: string;
  preacherFullName?: string;
  supervisorFullName?: string;
  copastorFullName?: string;
  pastorFullName?: string;
  memberFullName?: string;
  externalDonorFullName?: string;
  ticketImageUrl?: string;
  receiptCode: string;
  createdAt?: Date;
  createdBy?: string;
  generationType?: string;
}

export const generateReceiptByOfferingIncomeId = (
  values: ReceiptValues,
): TDocumentDefinitions => {
  const {
    churchName,
    churchAddress,
    // churchPhoneNumber,
    churchEmail,
    type,
    subType,
    amount,
    currency,
    comments,
    category,
    shift,
    date,
    familyGroupName,
    familyGroupCode,
    zoneName,
    zoneDistrict,
    preacherFullName,
    // supervisorFullName,
    copastorFullName,
    // pastorFullName,
    memberType,
    memberFullName,
    externalDonorFullName,
    receiptCode,
    ticketImageUrl,
    createdAt,
    createdBy,
    generationType,
  } = values;

  //! Table body
  const body = [
    [
      {
        text: `Detalles generales`,
        colSpan: 2,
        italics: true,
        margin: [0, 0, 0, 5],
        style: {
          bold: true,
          fontSize: 14,
        },
      },
      {},
    ],

    [
      {
        text: 'Tipo:',
        style: 'label',
      },
      {
        text: `${OfferingIncomeCreationTypeNames[type]}`,
        style: 'value',
      },
    ],
  ];

  //* Add condition for sub-type
  if (type !== OfferingIncomeCreationType.IncomeAdjustment) {
    body.push([
      {
        text: 'Sub-tipo:',
        style: 'label',
      },
      {
        text: `${OfferingIncomeCreationSubTypeNames[subType]}`,
        style: 'value',
      },
    ]);
  }

  //* Add condition for category
  if (type !== OfferingIncomeCreationType.IncomeAdjustment) {
    body.push([
      {
        text: 'Categoría:',
        style: 'label',
      },
      {
        text: `${OfferingIncomeCreationCategoryNames[category]}`,
        style: 'value',
      },
    ]);
  }

  //* Add condition for shift
  if (
    category == OfferingIncomeCreationCategory.OfferingBox &&
    (subType === OfferingIncomeCreationSubType.SundaySchool ||
      subType === OfferingIncomeCreationSubType.SundayService)
  ) {
    body.push([
      {
        text: 'Turno:',
        style: 'label',
      },
      {
        text: `${OfferingIncomeCreationShiftTypeNames[shift]}`,
        style: 'value',
      },
    ]);
  }

  //* Add condition for date
  if (date) {
    body.push([
      {
        text: 'Fecha:',
        style: 'label',
      },
      {
        text: `${formatDateToLimaDayMonthYear(date)}`,
        style: 'value',
      },
    ]);
  }

  //* Add condition for amount
  if (amount) {
    body.push([
      {
        text: 'Monto / Divisa',
        style: 'label',
      },
      {
        text: `${amount} ${currency}`,
        style: 'value',
      },
    ]);
  }

  //* Add condition for member type
  if (
    category === OfferingIncomeCreationCategory.InternalDonation ||
    category === OfferingIncomeCreationCategory.ExternalDonation
  ) {
    body.push([
      {
        text: 'Tipo de miembro:',
        style: 'label',
      },
      {
        text: `${MemberTypeNames[memberType]}`,
        style: 'value',
      },
    ]);
  }

  //* Add condition for member
  if (category === OfferingIncomeCreationCategory.InternalDonation) {
    body.push([
      {
        text: 'Miembro:',
        style: 'label',
      },
      {
        text: `${memberFullName}`,
        style: 'value',
      },
    ]);
  }

  //* Add condition for external donor
  if (category === OfferingIncomeCreationCategory.ExternalDonation) {
    body.push([
      {
        text: 'Donador:',
        style: 'label',
      },
      {
        text: `${externalDonorFullName}`,
        style: 'value',
      },
    ]);
  }

  //* Add condition for comments
  if (comments) {
    body.push([
      {
        text: 'Observaciones:',
        style: 'label',
        colSpan: 2,
        margin: [0, 5, 0, 0],
      } as any,
      {} as any,
    ]);

    body.push([
      {
        text: comments,
        style: 'value',
        colSpan: 2,
        margin: [0, 0, 0, 5],
      } as any,
      {} as any,
    ]);
  }

  //! Relationship Details
  const relationshipDetails = [];

  //* Add condition for relationship details
  if (
    subType === OfferingIncomeCreationSubType.FamilyGroup ||
    subType === OfferingIncomeCreationSubType.ZonalFasting ||
    subType === OfferingIncomeCreationSubType.ZonalVigil
  ) {
    relationshipDetails.push([
      {
        text:
          subType === OfferingIncomeCreationSubType.FamilyGroup
            ? `Detalles del grupo familiar`
            : `Detalles de la zona`,
        colSpan: 2,
        italics: true,
        margin: [0, 0, 0, 5],
        style: {
          bold: true,
          fontSize: 14,
        },
      },
      {},
    ]);
  }

  //* Add condition for preacher
  if (subType === OfferingIncomeCreationSubType.FamilyGroup) {
    relationshipDetails.push(
      [
        {
          text: 'Nombre / Código:',
          margin: [5, 0, 5, 2],
          style: 'labelDetails',
        },
        {
          text: `${familyGroupName} ~ ${familyGroupCode}`,
          margin: [5, 0, 5, 2],
          style: 'valueDetails',
        },
      ],
      [
        {
          text: 'Predicador:',
          margin: [5, 0, 5, 2],
          style: 'labelDetails',
        },
        {
          text: `${preacherFullName}`,
          margin: [5, 0, 5, 2],
          style: 'valueDetails',
        },
      ],
    );
  }

  if (
    subType === OfferingIncomeCreationSubType.ZonalFasting ||
    subType === OfferingIncomeCreationSubType.ZonalVigil ||
    subType === OfferingIncomeCreationSubType.ZonalEvangelism
  ) {
    relationshipDetails.push([
      {
        text: 'Zona:',
        margin: [5, 0, 5, 2],
        style: 'labelDetails',
      },
      {
        text: `${zoneName} - ${zoneDistrict}`,
        margin: [5, 0, 5, 2],
        style: 'valueDetails',
      },
    ]);
  }

  //* Add condition for supervisor
  // /* if (
  //   subType === OfferingIncomeCreationSubType.FamilyGroup ||
  //   subType === OfferingIncomeCreationSubType.ZonalFasting ||
  //   subType === OfferingIncomeCreationSubType.ZonalVigil ||
  //   subType === OfferingIncomeCreationSubType.ZonalEvangelism
  // ) {
  //   relationshipDetails.push([
  //     {
  //       text: 'Supervisor:',
  //       margin: [5, 0, 5, 2],
  //       style: 'labelDetails',
  //     },
  //     {
  //       text: `${supervisorFullName}`,
  //       margin: [5, 0, 5, 2],
  //       style: 'valueDetails',
  //     },
  //   ]);
  // } */

  //* Add condition for co-pastor
  if (
    subType === OfferingIncomeCreationSubType.FamilyGroup ||
    subType === OfferingIncomeCreationSubType.ZonalFasting ||
    subType === OfferingIncomeCreationSubType.ZonalVigil ||
    subType === OfferingIncomeCreationSubType.ZonalEvangelism
  ) {
    relationshipDetails.push([
      {
        text: 'Co-Pastor:',
        margin: [5, 0, 5, 2],
        style: 'labelDetails',
      },
      {
        text: `${copastorFullName}`,
        margin: [5, 0, 5, 2],
        style: 'valueDetails',
      },
    ]);
  }

  //* Add condition for pastor
  // if (
  //   subType === OfferingIncomeCreationSubType.FamilyGroup ||
  //   subType === OfferingIncomeCreationSubType.ZonalFasting ||
  //   subType === OfferingIncomeCreationSubType.ZonalVigil ||
  //   subType === OfferingIncomeCreationSubType.ZonalEvangelism
  // ) {
  //   relationshipDetails.push([
  //     {
  //       text: 'Pastor:',
  //       margin: [5, 0, 5, 2],
  //       style: 'labelDetails',
  //     },
  //     {
  //       text: `${pastorFullName}`,
  //       margin: [5, 0, 5, 2],
  //       style: 'valueDetails',
  //     },
  //   ]);
  // }

  //! Record Details
  const recordDetails = [];

  if (type) {
    recordDetails.push([
      {
        text: `Detalles del registro`,
        colSpan: 2,
        italics: true,
        margin: [0, 0, 0, 5],
        style: {
          bold: true,
          fontSize: 14,
        },
      },
      {},
    ]);
  }

  //* Add condition for created by
  if (type) {
    recordDetails.push([
      {
        text: 'Registrado por:',
        margin: [5, 0, 5, 2],
        style: {
          fontSize: 12,
          bold: true,
        },
      },
      {
        text: `${createdBy}`,
        margin: [5, 0, 5, 2],
        style: {
          fontSize: 12,
        },
      },
    ]);
  }

  //* Add condition for created at
  if (type) {
    recordDetails.push([
      {
        text: 'Fecha de emisión:',
        margin: [5, 0, 5, 0],
        style: {
          fontSize: 12,
          bold: true,
        },
      },
      {
        text: `${formatDateToLimaWithTime(createdAt)}`,
        margin: [5, 0, 5, 0],
        style: {
          fontSize: 12,
        },
      },
    ]);
  }

  //? Documente definition
  const docDefinition: TDocumentDefinitions = {
    pageSize: { width: 302, height: 'auto' }, // 80 mm width (302 px)
    pageMargins: [15, 10, 15, 15], // Margins for thermal printer
    styles: {
      header: {
        fontSize: 20,
        bold: true,
        alignment: 'center',
      },
      header2: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
      },
      subheader: {
        fontSize: 13,
        italics: true,
      },
      title: {
        fontSize: 15,
        bold: true,
        margin: [0, 5, 0, 8],
      },
      tileTickerNumber: {
        fontSize: 13,
        bold: true,
        margin: [0, 0, 0, 5],
      },
      label: {
        fontSize: 13,
        margin: [5, 0, 5, 2],
        bold: true,
      },
      value: {
        fontSize: 13,
        margin: [5, 0, 5, 2],
      },
      labelDetails: {
        fontSize: 13,
        bold: true,
      },
      valueDetails: {
        fontSize: 13,
      },
      footer: {
        fontSize: 13,
        italics: true,
      },
    },
    content: [
      //? HEADER
      {
        text: `${churchName.trim().split(' ').slice(0, 2).join(' ')}`,
        style: 'header',
      },
      {
        text: churchName.includes('Cristiana')
          ? `"${churchName.split('-')[0].trim().split('Cristiana')[1]?.trim()}"`
          : `"${churchName.trim()}"`,
        style: 'header2',
      },
      {
        text: `${churchAddress.toUpperCase()}`,
        style: 'subheader',
        alignment: 'center',
        margin: [0, 5, 0, 10],
      },
      {
        text: [
          { text: 'Web: ', bold: true },
          'www.unidosensupresencia.com\n',
          { text: 'E-mail: ', bold: true },
          `${churchEmail}`,
        ],
        style: 'subheader',
        alignment: 'center',
        margin: [-3, 0, -3, 5],
      },
      {
        text: '--------------------------------------------------------------------------------',
        alignment: 'center',
        margin: [0, 3, 0, 0],
      },
      {
        text: 'RECIBO DE OFRENDA',
        style: 'title',
        alignment: 'center',
      },
      {
        text: `${receiptCode}`,
        style: 'tileTickerNumber',
        alignment: 'center',
      },
      {
        text: '--------------------------------------------------------------------------------',
        alignment: 'center',
        margin: [0, 0, 0, 3],
      },

      //? BODY
      {
        table: {
          widths: ['*', '*'],
          body,
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 3],
      },
      relationshipDetails.length !== 0
        ? {
            text: '--------------------------------------------------------------------------------',
            alignment: 'center',
            margin: [0, 0, 0, 3],
          }
        : {
            text: '',
            alignment: 'center',
            margin: [0, -8, 0, 0],
          },
      {
        table: {
          widths: ['*', '*'],
          body:
            relationshipDetails.length === 0 ? [[{}, {}]] : relationshipDetails,
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 3],
      },

      //? RECORD INFORMATION
      {
        text: '--------------------------------------------------------------------------------',
        alignment: 'center',
        margin: [0, 0, 0, 3],
      },
      {
        table: {
          widths: ['*', '*'],
          body: recordDetails,
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 3],
      },

      //? FOOTER
      {
        text: '--------------------------------------------------------------------------------',
        alignment: 'center',
        margin: [0, 0, 0, 5],
      },
      {
        text: 'Gracias por su generosidad',
        style: 'footer',
        alignment: 'center',
      },
      {
        text: 'Que Dios los bendiga',
        style: 'footer',
        alignment: 'center',
        margin: [0, 5],
      },
      {
        text: '"Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, porque Dios ama al dador alegre." - 2 Corintios 9:7',
        style: 'footer',
        alignment: 'center',
        margin: [0, 5],
      },
      ticketImageUrl &&
      ticketImageUrl.length > 0 &&
      generationType !== 'without-qr'
        ? {
            table: {
              widths: ['auto', '*'],
              body: [
                [
                  {
                    // Columna 1: QR
                    qr: `${ticketImageUrl}`,
                    fit: 120,
                    alignment: 'left',
                  },
                  {
                    // Columna 2: Texto
                    text: '"Escanea el código QR para ver tu recibo de ofrenda en línea. Accede a tu boleta digital de forma rápida y segura, almacenada en la nube."',
                    alignment: 'center',
                    fontSize: 11,
                    italics: true,
                    margin: [0, 15],
                  },
                ],
              ],
            },
            layout: 'noBorders',
            margin: [5, 15, 5, 5],
          }
        : null,
    ],
  };

  return docDefinition;
};
