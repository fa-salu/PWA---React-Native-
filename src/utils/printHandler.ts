import * as FileSystem from "expo-file-system/legacy";
import { Alert, Platform } from "react-native";
import { WebViewMessageEvent } from "react-native-webview";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import { TemplateData, TemplateType } from "../types/TemplateTypes";
import { TemplateFactory } from "../components/templates/templateFactory";
import { getErrorMessage } from "./helper/getErrorMessage";

export interface WebViewMessage {
  type: string;
  timestamp?: string;
  data?: any;
}

export interface PrintDataPayload {
  recordId: number;
  invoiceNo: string;
  activeView: string;
  record: any;
  companyProfile: any;
  transactionHistory: any;
  defaultBank: any;
  userDetails?: any;
  url: string;
  isThermalPrinter?: boolean;
  templateType?: TemplateType;
}

export class PrintHandler {
  private static instance: PrintHandler;
  private templateFactory: TemplateFactory;
  private savedDirectoryUri: string | null = null;

  private constructor() {
    this.templateFactory = TemplateFactory.getInstance();
  }

  public static getInstance(): PrintHandler {
    if (!PrintHandler.instance) {
      PrintHandler.instance = new PrintHandler();
    }
    return PrintHandler.instance;
  }

  public handleMessage = (event: WebViewMessageEvent): void => {
    try {
      const data: WebViewMessage = JSON.parse(event.nativeEvent.data);
      console.log("Print Handler - Message from WebView:", data);

      switch (data.type) {
        case "APP_READY":
          console.log("ERP system loaded successfully");
          break;
        case "PRINT_DATA":
          this.handlePrintWithData(data.data);
          break;
        case "SHARE_DATA":
          this.handleShareWithData(data.data);
          break;
        case "DOWNLOAD_DATA":
          this.handleDownloadWithData(data.data);
          break;
        case "THERMAL_PRINT_DATA":
          this.handleThermalPrintWithData(data.data);
          break;
        case "ORIENTATION_CHANGED":
          console.log("Orientation changed:", data.data);
          break;
        default:
          console.log("Unknown message type:", data.type);
      }
    } catch (error) {
      console.warn("Print Handler - Message parsing error:", error);
    }
  };

  private generateHTML(
    data: PrintDataPayload,
    isThermal: boolean = false
  ): string {
    const templateType: TemplateType =
      data.templateType || this.getTemplateTypeFromActiveView(data.activeView);
    const template = this.templateFactory.getTemplate(templateType);

    const templateData: TemplateData = {
      record: data.record,
      companyProfile: data.companyProfile,
      transactionHistory: data.transactionHistory,
      defaultBank: data.defaultBank,
      activeView: data.activeView,
      userDetails: data.userDetails,
    };

    if (isThermal && template.generateThermalHTML) {
      return template.generateThermalHTML(templateData);
    }

    return template.generateHTML(templateData);
  }

  private getTemplateTypeFromActiveView(activeView: string): TemplateType {
    switch (activeView.toLowerCase()) {
      case "sales":
      case "returns":
      case "estimates":
        return "sales";
      case "purchase":
      case "purchaseReturn":
        return "purchase";
      case "receipts":
      case "payments":
      case "bankentries":
        return "transactions";
      default:
        return "sales";
    }
  }

  private handlePrintWithData = async (data: PrintDataPayload) => {
    console.log("Printing with data for:", data.invoiceNo);

    try {
      const html = this.generateHTML(data);

      await Print.printAsync({
        html: html,
        width: 612,
        height: 792,
        margins: { left: 40, right: 40, top: 40, bottom: 40 },
      });

      console.log("Print completed successfully");
    } catch (error) {
      console.error("Error printing:", error);
      Alert.alert("Print Error", `Failed to print: ${getErrorMessage(error)}`);
    }
  };

  private handleShareWithData = async (data: PrintDataPayload) => {
    console.log("Sharing with data for:", data.invoiceNo);

    try {
      const html = this.generateHTML(data);

      const { uri } = await Print.printToFileAsync({
        html: html,
        width: 612,
        height: 792,
        margins: { left: 40, right: 40, top: 40, bottom: 40 },
      });

      await shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
        dialogTitle: `Share ${data.activeView} - ${data.invoiceNo}`,
      });

      console.log("PDF shared successfully");
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("Share Error", "Failed to share PDF");
    }
  };

  private checkStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS !== "android") {
      return true; // iOS doesn't need this permission
    }

    try {
      // Check current permission status
      const { status: currentStatus } =
        await MediaLibrary.getPermissionsAsync();

      if (currentStatus === "granted") {
        console.log("Storage permission already granted");
        return true;
      }

      // Request permission if not granted
      const { status: newStatus } =
        await MediaLibrary.requestPermissionsAsync();

      if (newStatus === "granted") {
        console.log("Storage permission granted");
        return true;
      }

      console.log("Storage permission denied");
      return false;
    } catch (error) {
      console.error("Error checking storage permission:", error);
      return false;
    }
  };

  private handleDownloadWithData = async (data: PrintDataPayload) => {
    console.log("Downloading with data for:", data.invoiceNo);

    const hasPermission = await this.checkStoragePermission();

    if (!hasPermission) {
      Alert.alert(
        "Permission Required",
        "Storage permission is needed to download PDFs."
      );
      return;
    }

    Alert.alert(
      "Download PDF",
      `Do you want to download ${data.activeView} - ${data.invoiceNo}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: () => this.performDirectDownload(data),
        },
      ]
    );
  };

  private performDirectDownload = async (data: PrintDataPayload) => {
    try {
      console.log("Generating PDF for:", data.invoiceNo);

      const html = this.generateHTML(data);

      const { uri } = await Print.printToFileAsync({
        html,
        width: 612,
        height: 792,
        margins: {
          left: 40,
          right: 40,
          top: 40,
          bottom: 40,
        },
      });

      console.log("PDF generated at:", uri);

      const fileName = `${data.activeView}-${data.invoiceNo.replace(
        /\//g,
        "-"
      )}.pdf`;

      if (Platform.OS === "android") {
        let directoryUri = this.savedDirectoryUri;

        if (!directoryUri) {
          const permissions =
            await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

          if (!permissions.granted) {
            Alert.alert(
              "Permission Denied",
              "Cannot save file without storage access"
            );
            return;
          }

          directoryUri = permissions.directoryUri;
          this.savedDirectoryUri = directoryUri;
          console.log("Directory permission granted and saved");
        } else {
          console.log("Using saved directory permission");
        }

        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          directoryUri,
          fileName,
          "application/pdf"
        );

        const pdfContent = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await FileSystem.writeAsStringAsync(fileUri, pdfContent, {
          encoding: FileSystem.EncodingType.Base64,
        });

        Alert.alert("Download Complete", `PDF saved as:\n${fileName}`);
        console.log("PDF saved successfully");
      } else {
        const documentsDir = FileSystem.documentDirectory;
        const newUri = `${documentsDir}${fileName}`;
        await FileSystem.copyAsync({ from: uri, to: newUri });
        await shareAsync(newUri, {
          UTI: ".pdf",
          mimeType: "application/pdf",
        });
        Alert.alert("Download Complete", `PDF saved as:\n${fileName}`);
      }
    } catch (error: any) {
      console.error("Error downloading:", error);
      Alert.alert("Download Failed", error.message || "Could not save PDF");
    }
  };

  private handleThermalPrintWithData = async (data: PrintDataPayload) => {
    console.log("Thermal printing with data for:", data.invoiceNo);

    try {
      const html = this.generateHTML(data, true);

      await Print.printAsync({
        html: html,
        width: 226,
        margins: { left: 5, right: 5, top: 5, bottom: 5 },
      });

      console.log("Thermal print completed");
    } catch (error) {
      console.error("Error with thermal print:", error);
      Alert.alert(
        "Thermal Print Error",
        `Failed to print: ${getErrorMessage(error)}`
      );
    }
  };
}

export const printHandler = PrintHandler.getInstance();
