import { PDFTemplate, TemplateType } from "../../types/TemplateTypes";
import { PurchaseTemplate } from "./PurchaseTemplate";
import { SalesTemplate } from "./SaleTemplate";
import { TransactionTemplate } from "./TransactionTemplate";

export class TemplateFactory {
  private static instance: TemplateFactory;
  private templates: Map<TemplateType, PDFTemplate> = new Map();

  private constructor() {
    this.templates.set("sales", new SalesTemplate());
    this.templates.set("purchase", new PurchaseTemplate());
    this.templates.set("transactions", new TransactionTemplate());
    // this.templates.set("reports", new ReportsTemplate());
  }

  public static getInstance(): TemplateFactory {
    if (!TemplateFactory.instance) {
      TemplateFactory.instance = new TemplateFactory();
    }
    return TemplateFactory.instance;
  }

  public getTemplate(templateType: TemplateType): PDFTemplate {
    const template = this.templates.get(templateType);
    if (!template) {
      throw new Error(`Template type '${templateType}' not found`);
    }
    return template;
  }

  public addTemplate(templateType: TemplateType, template: PDFTemplate): void {
    this.templates.set(templateType, template);
  }
}
