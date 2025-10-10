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
            font-family: Helvetica, Arial, sans-serif; 
            font-size: 10px;
            color: #2c3e50;
            background-color: #ffffff;
        }
        
        @page { 
            margin: 20px; 
            size: A4; 
        }
        
        .container {
            padding: 15px;
            position: relative;
            z-index: 1;
        }

        /* Header Section - Matching PDF */
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #34495e;
        }

        .company-section {
            width: 45%;
        }

        .logo-section {
            width: 20%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .logo {
            width: 50px;
            height: 50px;
            object-fit: contain;
        }

        .voucher-section {
            width: 35%;
            text-align: right;
        }

        .company-name {
            font-size: 14px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 3px;
        }

        .company-details {
            font-size: 8px;
            color: #34495e;
            margin-bottom: 1px;
            line-height: 1.2;
        }

        .voucher-title {
            font-size: 12px;
            font-weight: bold;
            border: 1px solid #000;
            color: #000;
            padding: 6px;
            text-align: center;
            margin-bottom: 5px;
        }

        .voucher-info {
            font-size: 9px;
            color: #2c3e50;
            margin-bottom: 2px;
            text-align: right;
        }

        /* Party Section - Matching PDF */
        .party-section {
            background-color: #ecf0f1;
            padding: 8px;
            margin-bottom: 10px;
            border-left: 3px solid #3498db;
        }

        .section-title {
            font-size: 10px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }

        .info-row {
            display: flex;
            margin-bottom: 3px;
        }

        .info-label {
            width: 25%;
            font-size: 9px;
            font-weight: bold;
            color: #34495e;
        }

        .info-value {
            width: 75%;
            font-size: 9px;
            color: #2c3e50;
        }

        /* Amount Section - Matching PDF */
        .amount-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #f8f9fa;
            padding: 12px;
            margin-bottom: 10px;
            border: 1px solid #dee2e6;
        }

        .payment-details {
            width: 65%;
        }

        .payment-row {
            display: flex;
            margin-bottom: 2px;
        }

        .payment-label {
            width: 40%;
            font-size: 9px;
            font-weight: bold;
            color: #34495e;
        }

        .payment-value {
            width: 60%;
            font-size: 9px;
            color: #2c3e50;
        }

        .amount-box {
            border: 1px solid #000;
            padding: 10px;
            border-radius: 4px;
            min-width: 120px;
        }

        .amount-label {
            font-size: 8px;
            color: #000;
            text-align: center;
            margin-bottom: 2px;
        }

        .amount-value {
            font-size: 16px;
            font-weight: bold;
            color: #000;
            text-align: center;
        }

        /* Amount in Words - Matching PDF */
        .amount-in-words {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 8px;
            margin-bottom: 10px;
        }

        .amount-words-title {
            font-size: 8px;
            font-weight: bold;
            color: #856404;
            margin-bottom: 3px;
        }

        .amount-words-text {
            font-size: 8px;
            color: #856404;
            font-style: italic;
        }

        /* Notes Section - Matching PDF */
        .notes-section {
            background-color: #f8f9fa;
            padding: 8px;
            margin-bottom: 10px;
            border-left: 3px solid #6c757d;
        }

        .notes-text {
            font-size: 8px;
            color: #495057;
            line-height: 1.3;
        }

        /* History Table - Matching PDF */
        .history-section {
            margin-bottom: 10px;
        }

        .history-table {
            border: 1px solid #dee2e6;
            width: 100%;
            border-collapse: collapse;
        }

        .history-header {
            background-color: #e9ecef;
            border-bottom: 1px solid #dee2e6;
        }

        .history-cell {
            font-size: 7px;
            text-align: center;
            padding: 4px 6px;
            border-right: 1px solid #ccc;
        }

        .history-cell-bold {
            font-size: 7px;
            font-weight: bold;
            text-align: center;
            padding: 4px 6px;
            border-right: 1px solid #ccc;
        }

        .history-row {
            border-bottom: 0.5px solid #f1f3f4;
        }

        .total-row {
            background-color: #f8f9fa;
            font-weight: bold;
        }

        /* Signature Section - Matching PDF */
        .signature-section {
            display: flex;
            justify-content: flex-end;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #dee2e6;
        }

        .signature-box {
            width: 30%;
            text-align: center;
        }

        .signature-line {
            width: 100%;
            height: 30px;
            border-bottom: 1px solid #6c757d;
            margin-bottom: 5px;
        }

        .signature-label {
            font-size: 8px;
            font-weight: bold;
            color: #495057;
            text-align: center;
        }

        /* Footer - Matching PDF */
        .footer {
            margin-top: 15px;
            padding-top: 8px;
            border-top: 1px solid #dee2e6;
            text-align: center;
        }

        .footer-text {
            font-size: 7px;
            color: #6c757d;
            text-align: center;
            margin-bottom: 2px;
        }

        .thank-you {
            font-size: 9px;
            font-weight: bold;
            color: #27ae60;
            text-align: center;
        }

        /* Watermark */
        ${
          record.cancelledById
            ? `
        .watermark {
            position: fixed;
            top: 25%;
            left: 25%;
            transform: rotate(-45deg);
            font-size: 40px;
            color: rgba(220, 53, 69, 0.15);
            font-weight: 900;
            text-transform: uppercase;
            z-index: 0;
            pointer-events: none;
            user-select: none;
        }
        `
            : ""
        }

        /* Print styles */
        @media print {
            body { padding: 10px; }
            .container { padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="company-section">
                <div class="company-name">${companyProfile.companyName}</div>
                <div class="company-details">${
                  companyProfile.address || ""
                }</div>
                <div class="company-details">Ph: ${
                  companyProfile.phoneNumber || ""
                } | ${companyProfile.email || ""}</div>
                ${
                  companyProfile.trn
                    ? `<div class="company-details">TRN: ${companyProfile.trn}</div>`
                    : ""
                }
            </div>
            
            <div class="logo-section">
                <img src="${COMPANY_LOGO_BASE64}" alt="Logo" class="logo" />
            </div>

            <div class="voucher-section">
                <div class="voucher-title">${this.getTransactionTitle(
                  activeView
                )}</div>
                <div class="voucher-info">No: ${this.getTransactionNumber(
                  record,
                  activeView
                )}</div>
                <div class="voucher-info">Date: ${new Date(
                  record.date
                ).toLocaleDateString()}</div>
                <div class="voucher-info">Time: ${new Date(
                  record.date
                ).toLocaleTimeString()}</div>
            </div>
        </div>

        <!-- Party Information -->
        ${this.renderPartyInfo(record, activeView)}

        <!-- Amount and Payment Details -->
        <div class="amount-section">
            <div class="payment-details">
                <div class="payment-row">
                    <div class="payment-label">Payment Mode:</div>
                    <div class="payment-value">${this.getPaymentMethod(
                      record,
                      activeView
                    )}</div>
                </div>
                ${
                  record.trxnId
                    ? `
                <div class="payment-row">
                    <div class="payment-label">Transaction ID:</div>
                    <div class="payment-value">${record.trxnId}</div>
                </div>
                `
                    : ""
                }
                ${
                  activeView === "receipts"
                    ? `
                <div class="payment-row">
                    <div class="payment-label">Received by:</div>
                    <div class="payment-value">${
                      record.createdBy?.name || ""
                    }</div>
                </div>
                <div class="payment-row">
                    <div class="payment-label">Contact:</div>
                    <div class="payment-value">${
                      record.createdBy?.phoneNumber || ""
                    }</div>
                </div>
                `
                    : ""
                }
            </div>
            
            <div class="amount-box">
                <div class="amount-label">TOTAL AMOUNT</div>
                <div class="amount-value">AED ${Number(record.amount).toFixed(
                  2
                )}</div>
            </div>
        </div>

        <!-- Amount in Words -->
        <div class="amount-in-words">
            <div class="amount-words-title">Amount in Words:</div>
            <div class="amount-words-text">${this.numberToWords(
              Number(record.amount)
            )}</div>
        </div>

        <!-- Notes -->
        ${
          record.note
            ? `
        <div class="notes-section">
            <div class="section-title">Notes:</div>
            <div class="notes-text">${record.note}</div>
        </div>
        `
            : ""
        }

        <!-- Transaction History -->
        ${transactionHistoryHTML}

        <!-- Signatures -->
        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Authorized By</div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="thank-you">Thank you for your business!</div>
            <div class="footer-text">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
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

  private renderPartyInfo(record: any, activeView: string): string {
    if (activeView === "receipts") {
      const party = record.party || record.ledger;
      const details = party?.PartyDetails || record.ledger?.PartyDetails?.[0];

      return `
        <div class="party-section">
            <div class="section-title">RECEIVED FROM</div>
            <div class="info-row">
                <div class="info-label">Party:</div>
                <div class="info-value">${party?.ledgerName || ""}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Contact:</div>
                <div class="info-value">${details?.phoneNumber || ""}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Address:</div>
                <div class="info-value">${details?.address || ""}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Trn:</div>
                <div class="info-value">${details?.trn || ""}</div>
            </div>
        </div>
      `;
    } else if (activeView === "payments") {
      const party = record.party;
      const details = party?.PartyDetails;

      return `
        <div class="party-section">
            <div class="section-title">PAID TO</div>
            <div class="info-row">
                <div class="info-label">Party:</div>
                <div class="info-value">${party?.ledgerName || ""}</div>
            </div>
            ${
              details?.phoneNumber
                ? `
            <div class="info-row">
                <div class="info-label">Contact:</div>
                <div class="info-value">${details.phoneNumber}</div>
            </div>
            `
                : ""
            }
            <div class="info-row">
                <div class="info-label">Type:</div>
                <div class="info-value">${
                  party?.type?.toUpperCase() || ""
                }</div>
            </div>
        </div>
      `;
    }
    return "";
  }

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

  private getPaymentMethod(record: any, activeView: string): string {
    if (record.paymentType) {
      return record.paymentType;
    }
    return activeView === "bankentries" ? "Bank Transfer" : "Cash";
  }

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
        <div class="section-title">Transaction History</div>
        <table class="history-table">
            <thead class="history-header">
                <tr>
                    <th class="history-cell-bold">Ref No.</th>
                    <th class="history-cell-bold">Date</th>
                    <th class="history-cell-bold">Type</th>
                    <th class="history-cell-bold">Amount</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Show only first 5 entries to match PDF
    transactionHistory.history.slice(0, 5).forEach((entry: any) => {
      html += `
        <tr class="history-row">
            <td class="history-cell">${entry.referenceNo}</td>
            <td class="history-cell">${new Date(
              entry.date
            ).toLocaleDateString()}</td>
            <td class="history-cell">${entry.type}</td>
            <td class="history-cell">${Number(entry.amount).toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
            <tr class="history-row total-row">
                <td class="history-cell-bold">Total History:</td>
                <td class="history-cell"></td>
                <td class="history-cell"></td>
                <td class="history-cell-bold">${historyTotal.toFixed(2)}</td>
            </tr>
            <tr class="history-row total-row">
                <td class="history-cell-bold">Balance Due:</td>
                <td class="history-cell"></td>
                <td class="history-cell"></td>
                <td class="history-cell-bold" style="color: ${
                  finalAmountDue > 0 ? "#dc3545" : "#28a745"
                }">
                    ${Math.abs(finalAmountDue).toFixed(2)} 
                    ${
                      finalAmountDue > 0
                        ? "(Due)"
                        : finalAmountDue < 0
                        ? "(Overpaid)"
                        : "(Settled)"
                    }
                </td>
            </tr>
        </tbody>
    </table>
    </div>
    `;

    return html;
  }

  private numberToWords(num: number): string {
    if (num === 0) return "Zero Dirham Only";

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

    result += "Dirham";

    if (decimalPart > 0) {
      result += " and " + convertGroup(decimalPart) + "fils";
    }

    return result + " Only";
  }
}
