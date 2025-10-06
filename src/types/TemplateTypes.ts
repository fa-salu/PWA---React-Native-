export interface TemplateData {
  record: any;
  companyProfile: any;
  transactionHistory?: any;
  defaultBank?: any;
  activeView: string;
  userDetails?: any;
}

export interface PDFTemplate {
  generateHTML(data: TemplateData): string;
  generateThermalHTML?(data: TemplateData): string;
}

export type TemplateType = "sales" | "purchase" | "transactions" | "reports";
