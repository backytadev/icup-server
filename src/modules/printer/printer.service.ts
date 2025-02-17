import { Injectable } from '@nestjs/common';

import PdfPrinter from 'pdfmake';
import type {
  BufferOptions,
  CustomTableLayout,
  TDocumentDefinitions,
} from 'pdfmake/interfaces';

const fonts = {
  Roboto: {
    normal: 'fonts/Roboto-Regular.ttf',
    bold: 'fonts/Roboto-Medium.ttf',
    italics: 'fonts/Roboto-Italic.ttf',
    bolditalics: 'fonts/Roboto-MediumItalic.ttf',
  },
};

const customTableLayouts: Record<string, CustomTableLayout> = {
  customLayout01: {
    hLineWidth: function (i, node) {
      if (i === 0 || i === node.table.body.length) {
        return 0;
      }
      return i === node.table.headerRows ? 2 : 1;
    },
    vLineWidth: function () {
      //i
      return 0;
    },
    hLineColor: function (i) {
      return i === 1 ? 'black' : '#eee';
    },
    paddingLeft: function (i) {
      //node
      return i === 0 ? 0 : 8;
    },
    paddingRight: function (i, node) {
      return i === node.table.widths.length - 1 ? 0 : 8;
    },
    fillColor: function (i) {
      if (i === 0) {
        return '#6aaef0';
      }
      return i % 2 === 0 ? '#f3f3f3' : null;
    },
  },

  summaryLayout: {
    hLineWidth: function (i) {
      return i === 1 ? 1 : 0;
    },
    vLineWidth: function () {
      return 0;
    },
    hLineColor: function () {
      return 'black';
    },
    paddingLeft: function () {
      return 8;
    },
    paddingRight: function () {
      return 8;
    },
    fillColor: function (i) {
      return i === 0 ? '#dcdcdc' : null; // Verde para el header
    },
  },
};

@Injectable()
export class PrinterService {
  private printer = new PdfPrinter(fonts);

  createPdf(
    docDefinition: TDocumentDefinitions,
    options: BufferOptions = {
      tableLayouts: customTableLayouts,
    },
  ): PDFKit.PDFDocument {
    return this.printer.createPdfKitDocument(docDefinition, options);
  }
}
