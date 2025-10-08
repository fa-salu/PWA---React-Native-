import { COMPANY_LOGO_BASE64 } from "../../constants/image";
import { PDFTemplate, TemplateData } from "../../types/TemplateTypes";

export class TransactionTemplate implements PDFTemplate {
  generateHTML(data: TemplateData): string {
    const { record, companyProfile, transactionHistory, activeView } = data;

    // Calculate totals
    const historyTotal =
      transactionHistory?.history?.reduce(
        (sum: number, entry: any) => sum + Number(entry.amount),
        0
      ) || 0;
    const finalAmountDue = Number(record.amount) - historyTotal;

    // Generate transaction history HTML
    const transactionHistoryHTML = this.generateTransactionHistoryHTML(
      transactionHistory,
      historyTotal,
      finalAmountDue
    );

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.getTransactionTitle(
      activeView
    )} - ${this.getTransactionNumber(record, activeView)}</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: Arial, sans-serif; 
            font-size: 12px;
            color: #333;
        }
        @page { 
            margin: 0.5in; 
            size: A4; 
        }
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
        }
        .company-info {
            width: 55%;
        }
        .logo-container {
            width: 20%;
            text-align: center;
        }
        .logo {
            width: 60px;
            height: 60px;
            object-fit: contain;
        }
        .transaction-info {
            width: 35%;
            text-align: right;
        }
        .company-title {
            font-size: 18px;
            font-weight: bold;
            color: #000;
            margin-bottom: 8px;
        }
        .company-details {
            font-size: 11px;
            color: #666;
            margin-bottom: 4px;
        }
        .transaction-title {
            font-size: 16px;
            font-weight: bold;
            border: 2px solid #000;
            padding: 10px;
            margin-bottom: 10px;
            background-color: #f8f9fa;
        }
        .transaction-details {
            font-size: 11px;
            margin-bottom: 5px;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #000;
            background-color: #f8f9fa;
            padding: 10px;
            border: 1px solid #ddd;
        }
        .details-container {
            padding: 15px;
            border: 1px solid #ddd;
            background-color: #f9f9f9;
        }
        .detail-row {
            display: flex;
            margin-bottom: 8px;
        }
        .detail-label {
            width: 25%;
            font-weight: bold;
            color: #000;
        }
        .detail-value {
            width: 75%;
            color: #333;
        }
        .payment-section {
            padding: 15px;
            border: 1px solid #ddd;
            background-color: #f9f9f9;
            margin-bottom: 20px;
        }
        .amount-container {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
        }
        .amount-table {
            width: 300px;
            border: 2px solid #000;
        }
        .amount-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 15px;
            background-color: #f0f0f0;
        }
        .amount-label {
            font-size: 14px;
            font-weight: bold;
            color: #000;
        }
        .amount-value {
            font-size: 14px;
            font-weight: bold;
            color: #000;
        }
        .amount-words {
            margin-top: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            background-color: #f9f9f9;
        }
        .amount-words-title {
            font-weight: bold;
            margin-bottom: 8px;
            color: #000;
        }
        .amount-words-text {
            font-size: 11px;
            color: #333;
            text-transform: capitalize;
        }
        .notes-section {
            margin-top: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            background-color: #f9f9f9;
        }
        .history-section {
            margin-top: 25px;
        }
        .history-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #000;
            background-color: #f8f9fa;
            padding: 10px;
            border: 1px solid #ddd;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .table th, .table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
            font-size: 10px;
        }
        .table th {
            background-color: #e9ecef;
            font-weight: bold;
            color: #000;
        }
        .table tbody tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .signature-section {
            margin-top: 40px;
            text-align: right;
        }
        .signature-box {
            display: inline-block;
            width: 200px;
            border-top: 1px solid #000;
            padding-top: 10px;
            text-align: center;
            font-weight: bold;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 15px;
        }
        .thank-you {
            font-size: 16px;
            font-weight: bold;
            color: #28a745;
        }
        ${
          record.cancelledById
            ? `
             .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 40px;
            color: rgba(255, 0, 0, 0.3);
            font-weight: bold;
            z-index: 9999;
            pointer-events: none;
            user-select: none;
            -webkit-user-select: none;
            font-family: Arial, sans-serif;
            text-shadow: 1px 1px 2px rgba(255, 0, 0, 0.1);
        }
        `
            : ""
        }
    </style>
</head>
<body>
    
    <div class="header">
        <div class="company-info">
            <div class="company-title">${companyProfile.companyName}</div>
            <div class="company-details">${companyProfile.address || ""}</div>
            <div class="company-details">Phone: ${
              companyProfile.phoneNumber || ""
            }</div>
            <div class="company-details">Email: ${
              companyProfile.email || ""
            }</div>
            ${
              companyProfile.trn
                ? `<div class="company-details">GSTIN: ${companyProfile.trn}</div>`
                : ""
            }
        </div>
       <div class="logo-container">
                     <img src="${COMPANY_LOGO_BASE64}" alt="Logo" class="logo" />
                  </div>
        <div class="transaction-info">
            <div class="transaction-title">${this.getTransactionTitle(
              activeView
            )}</div>
            <div class="transaction-details"><strong>No:</strong> ${this.getTransactionNumber(
              record,
              activeView
            )}</div>
            <div class="transaction-details"><strong>Date:</strong> ${new Date(
              record.date
            ).toLocaleDateString()}</div>
        </div>
    </div>

    <div class="section">
        <div class="details-container">
            ${this.renderTransactionDetails(record, activeView)}
        </div>
    </div>

    <div class="payment-section">
        <div class="section-title">Payment Information</div>
        <div class="detail-row">
            <div class="detail-label">Payment Method:</div>
            <div class="detail-value">${this.getPaymentMethod(
              record,
              activeView
            )}</div>
        </div>
        ${
          record.trxnId
            ? `
        <div class="detail-row">
            <div class="detail-label">Transaction ID:</div>
            <div class="detail-value">${record.trxnId}</div>
        </div>
        `
            : ""
        }
        ${
          activeView === "receipts"
            ? `
        <div class="detail-row">
            <div class="detail-label">Creator Name:</div>
            <div class="detail-value">${record.createdBy?.name || ""}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Creator Contact:</div>
            <div class="detail-value">${
              record.createdBy?.phoneNumber || ""
            }</div>
        </div>
        `
            : ""
        }
    </div>

    <div class="amount-container">
        <div class="amount-table">
            <div class="amount-row">
                <div class="amount-label">Total Amount:</div>
                <div class="amount-value">${record.amount}</div>
            </div>
        </div>
    </div>

    <div class="amount-words">
        <div class="amount-words-title">Amount in Words:</div>
        <div class="amount-words-text">${this.numberToWords(
          Number(record.amount)
        )}</div>
    </div>

    ${
      record.note
        ? `
    <div class="notes-section">
        <div class="section-title">Notes</div>
        <div>${record.note}</div>
    </div>
    `
        : ""
    }

    ${transactionHistoryHTML}

    <div class="signature-section">
        <div class="signature-box">
            Authorized Signatory
        </div>
    </div>

    <div class="footer">
        <div class="thank-you">Thank you for your business!</div>
        <div style="margin-top: 10px; font-size: 10px; color: #666;">
            Generated on ${new Date().toLocaleDateString()}
        </div>
    </div>
    ${record.cancelledById ? '<div class="watermark">CANCELLED</div>' : ""}

</body>
</html>
    `;
  }

  generateThermalHTML(data: TemplateData): string {
    const { record, companyProfile, activeView } = data;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=58mm, initial-scale=1.0">
    <style>
        @media print { @page { size: 58mm auto; margin: 0; } }
        body { 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 8px; 
            width: 58mm; 
            font-size: 11px; 
            line-height: 1.2;
            position: relative;
        }
        .center { text-align: center; }
        .line { 
            border-bottom: 1px dashed #000; 
            margin: 6px 0; 
        }
        .bold { font-weight: bold; }
        .small { font-size: 9px; }
        .section {
            margin-bottom: 8px;
        }
        .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
        }
              .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 24px;
            color: rgba(255, 0, 0, 0.3);
            font-weight: bold;
            z-index: 9999;
            pointer-events: none;
            user-select: none;
            width: 100%;
            text-align: center;
        }
    </style>
</head>
<body>

${record.cancelledById ? '<div class="watermark">CANCELLED</div>' : ""}
    <div class="center">
        <div class="bold" style="font-size: 12px;">${
          companyProfile.companyName
        }</div>
        <div class="small">${companyProfile.address}</div>
        <div class="small">Ph: ${companyProfile.phoneNumber}</div>
        ${
          companyProfile.trn
            ? `<div class="small">TRN: ${companyProfile.trn}</div>`
            : ""
        }
        <div class="bold" style="margin: 8px 0;">${this.getTransactionTitle(
          activeView
        )}</div>
    </div>
    
    <div class="line"></div>
    
    <div class="section">
        <div>Voucher No: ${this.getTransactionNumber(record, activeView)}</div>
        <div>Date: ${new Date(record.date).toLocaleDateString()}</div>
        <div>Time: ${new Date(record.date).toLocaleTimeString()}</div>
        ${
          activeView === "receipts"
            ? `
        <div>Salesman: ${record.createdBy?.name || ""}</div>
        <div>Contact: ${record.createdBy?.phoneNumber || ""}</div>
        `
            : ""
        }
    </div>
    
    <div class="line"></div>
    
    ${this.getThermalPartyInfo(record, activeView)}
    
    <div class="line"></div>
    
    <div class="section">
        <div class="bold">PAYMENT DETAILS:</div>
        <div>Method: ${this.getPaymentMethod(record, activeView)}</div>
        ${record.trxnId ? `<div>Txn ID: ${record.trxnId}</div>` : ""}
    </div>
    
    <div class="line"></div>
    
    <div class="section">
        <div class="row">
            <span class="bold">Amount:</span>
            <span class="bold">₹${record.amount}</span>
        </div>
        <div class="small" style="margin-top: 4px;">
            Amount in words: ${this.numberToWords(Number(record.amount))}
        </div>
    </div>
    
    ${
      record.note
        ? `
    <div class="line"></div>
    <div class="bold">Note:</div>
    <div class="small">${record.note}</div>
    `
        : ""
    }
    
    <div class="center" style="margin-top: 12px; padding-top: 6px; border-top: 1px dashed #000; font-size: 9px;">
        <div>Thank You!</div>
        <div>Visit Again</div>
        <div class="small" style="margin-top: 4px;">
            Generated on ${new Date().toLocaleString()}
        </div>
        <div style="margin-top: 4px;">
            ================================
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Get transaction title based on type
   * @private
   */
  private getTransactionTitle(activeView: string): string {
    switch (activeView) {
      case "receipts":
        return "RECEIPT VOUCHER";
      case "payments":
        return "PAYMENT VOUCHER";
      case "bankentries":
        return "BANK TRANSACTION";
      default:
        return "TRANSACTION";
    }
  }

  /**
   * Get transaction number based on type
   * @private
   */
  private getTransactionNumber(record: any, activeView: string): string {
    switch (activeView) {
      case "receipts":
        return record.receiptNo || "";
      case "payments":
        return record.paymentNo || "";
      case "bankentries":
        return record.trxnNumber || "";
      default:
        return "";
    }
  }

  /**
   * Get payment method based on type
   * @private
   */
  private getPaymentMethod(record: any, activeView: string): string {
    if (record.paymentType) {
      return record.paymentType;
    }
    return activeView === "bankentries" ? "Bank Transfer" : "Cash";
  }

  /**
   * Render transaction details based on type
   * @private
   */
  private renderTransactionDetails(record: any, activeView: string): string {
    if (activeView === "receipts") {
      return `
        <div class="detail-row">
            <div class="detail-label">Received From:</div>
            <div class="detail-value">${
              record.party?.ledgerName || record.ledger?.ledgerName || ""
            }</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Contact:</div>
            <div class="detail-value">${
              record.party?.PartyDetails?.phoneNumber ||
              record.ledger?.PartyDetails?.[0]?.phoneNumber ||
              ""
            }</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Address:</div>
            <div class="detail-value">${
              record.party?.PartyDetails?.address ||
              record.ledger?.PartyDetails?.[0]?.address ||
              ""
            }</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">TRN:</div>
            <div class="detail-value">${
              record.party?.PartyDetails?.trn ||
              record.ledger?.PartyDetails?.[0]?.trn ||
              ""
            }</div>
        </div>
      `;
    } else if (activeView === "payments") {
      return `
        <div class="detail-row">
            <div class="detail-label">Paid To:</div>
            <div class="detail-value">${record.party?.ledgerName || ""}</div>
        </div>
        ${
          record.party?.PartyDetails?.phoneNumber
            ? `
        <div class="detail-row">
            <div class="detail-label">Contact:</div>
            <div class="detail-value">${record.party.PartyDetails.phoneNumber}</div>
        </div>
        `
            : ""
        }
        ${
          record.party?.PartyDetails?.address
            ? `
        <div class="detail-row">
            <div class="detail-label">Address:</div>
            <div class="detail-value">${record.party.PartyDetails.address}</div>
        </div>
        `
            : ""
        }
        <div class="detail-row">
            <div class="detail-label">Payee Type:</div>
            <div class="detail-value">${
              record.party?.type?.toUpperCase() || ""
            }</div>
        </div>
      `;
    }
    return "";
  }

  /**
   * Get thermal party info
   * @private
   */
  private getThermalPartyInfo(record: any, activeView: string): string {
    if (activeView === "receipts") {
      return `
        <div class="section">
            <div class="bold">RECEIVED FROM:</div>
            <div>${record.party?.ledgerName || ""}</div>
            ${
              record.party?.PartyDetails?.phoneNumber
                ? `<div>Ph: ${record.party.PartyDetails.phoneNumber}</div>`
                : ""
            }
            ${
              record.party?.PartyDetails?.address
                ? `<div>${record.party.PartyDetails.address}</div>`
                : ""
            }
        </div>
      `;
    } else if (activeView === "payments") {
      return `
        <div class="section">
            <div class="bold">PAID TO:</div>
            <div>${record.party?.ledgerName || ""}</div>
            ${
              record.party?.PartyDetails?.phoneNumber
                ? `<div>Ph: ${record.party.PartyDetails.phoneNumber}</div>`
                : ""
            }
            ${
              record.party?.PartyDetails?.address
                ? `<div>${record.party.PartyDetails.address}</div>`
                : ""
            }
        </div>
      `;
    }
    return "";
  }

  /**
   * Generates HTML for transaction history table
   * @private
   */
  private generateTransactionHistoryHTML(
    transactionHistory: any,
    historyTotal: number,
    finalAmountDue: number
  ): string {
    if (
      !transactionHistory?.history ||
      transactionHistory.history.length === 0
    ) {
      return "";
    }

    let html = `
    <div class="history-section">
        <div class="history-title">Transaction History</div>
        <table class="table">
            <thead>
                <tr>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                </tr>
            </thead>
            <tbody>
    `;

    transactionHistory.history.forEach((entry: any) => {
      html += `
        <tr>
            <td>${entry.referenceNo}</td>
            <td>${new Date(entry.date).toLocaleDateString()}</td>
            <td>${entry.type}</td>
            <td>${Number(entry.amount).toFixed(2)}</td>
            <td>${entry.paymentType?.toLowerCase() || "N/A"}</td>
        </tr>
        `;
    });

    html += `
            <tr style="background-color: #f8f9fa; font-weight: bold;">
                <td colspan="3"><strong>History Total:</strong></td>
                <td><strong>${historyTotal.toFixed(2)}</strong></td>
                <td></td>
            </tr>
            <tr style="background-color: #e9ecef; font-weight: bold;">
                <td colspan="3"><strong>Final Amount Due:</strong></td>
                <td style="color: ${
                  finalAmountDue > 0 ? "#dc3545" : "#28a745"
                }">
                    <strong>${Math.abs(finalAmountDue).toFixed(2)} 
                    ${
                      finalAmountDue > 0
                        ? "(Due)"
                        : finalAmountDue < 0
                        ? "(Overpaid)"
                        : "(Settled)"
                    }</strong>
                </td>
                <td></td>
            </tr>
        </tbody>
    </table>
    </div>
    `;

    return html;
  }

  /**
   * Converts numeric amount to words (Indian Rupees)
   * @private
   */
  private numberToWords(num: number): string {
    if (num === 0) return "Zero Rupees Only";

    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];

    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const convertGroup = (n: number) => {
      let result = "";

      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + " Hundred ";
        n %= 100;
      }

      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + " ";
        n %= 10;
      }

      if (n > 0) {
        result += ones[n] + " ";
      }

      return result;
    };

    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);

    let result = "";
    let remaining = integerPart;

    if (remaining >= 10000000) {
      const crores = Math.floor(remaining / 10000000);
      result = convertGroup(crores) + "Crore ";
      remaining %= 10000000;
    }

    if (remaining >= 100000) {
      const lakhs = Math.floor(remaining / 100000);
      result += convertGroup(lakhs) + "Lakh ";
      remaining %= 100000;
    }

    if (remaining >= 1000) {
      const thousands = Math.floor(remaining / 1000);
      result += convertGroup(thousands) + "Thousand ";
      remaining %= 1000;
    }

    if (remaining > 0) {
      result += convertGroup(remaining);
    }

    result += "Rupees";

    if (decimalPart > 0) {
      result += " and " + convertGroup(decimalPart) + "Paise";
    }

    return result + " Only";
  }
}
