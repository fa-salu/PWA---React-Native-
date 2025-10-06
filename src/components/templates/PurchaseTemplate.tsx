import { PDFTemplate, TemplateData } from "../../types/TemplateTypes";

export class PurchaseTemplate implements PDFTemplate {
  generateHTML(data: TemplateData): string {
    const { record, companyProfile, transactionHistory, activeView } = data;

    console.log("data", data);

    // Calculate totals
    const historyTotal =
      transactionHistory?.history?.reduce(
        (sum: number, entry: any) => sum + Number(entry.amount),
        0
      ) || 0;
    const finalAmountDue =
      record.grandTotal - (record.received || 0) - historyTotal;

    // Generate items HTML
    const itemsHTML = this.generateItemsHTML(record, activeView);
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
    <title>${activeView.toUpperCase()} - ${record.invoiceNo}</title>
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
        .supplier-info {
            width: 60%;
        }
        .supplier-title {
            font-size: 18px;
            font-weight: bold;
            color: #000;
            margin-bottom: 8px;
        }
        .supplier-details {
            font-size: 11px;
            color: #666;
            margin-bottom: 4px;
        }
        .invoice-info {
            width: 40%;
            text-align: right;
        }
        .invoice-title {
            font-size: 16px;
            font-weight: bold;
            border: 2px solid #000;
            padding: 10px;
            margin-bottom: 10px;
            background-color: #f8f9fa;
        }
        .invoice-details {
            font-size: 11px;
            margin-bottom: 5px;
        }
        .section {
            margin-bottom: 20px;
        }
        .bill-to {
            padding: 15px;
            border: 1px solid #ddd;
            margin-bottom: 20px;
            background-color: #f9f9f9;
        }
        .bill-to-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #000;
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
        .totals-container {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
            gap: 20px;
        }
        .payment-section {
            width: 300px;
            padding: 15px;
            border: 1px solid #ddd;
            background-color: #f9f9f9;
        }
        .totals {
            width: 300px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 15px;
            border-bottom: 1px solid #ddd;
        }
        .total-label {
            font-weight: bold;
        }
        .grand-total {
            font-weight: bold;
            background-color: #e9ecef;
            padding: 15px;
            font-size: 14px;
            border: 2px solid #000;
        }
        .amount-words {
            margin-top: 30px;
            padding: 15px;
            border: 1px solid #ddd;
            background-color: #f9f9f9;
            clear: both;
        }
        .amount-words-title {
            font-weight: bold;
            margin-bottom: 8px;
            color: #000;
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
        .notes-section {
            margin-top: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            background-color: #f9f9f9;
        }
        ${
          record.cancelledById
            ? `
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 80px;
            color: rgba(255, 0, 0, 0.2);
            font-weight: bold;
            z-index: -1;
        }
        `
            : ""
        }
    </style>
</head>
<body>
    ${record.cancelledById ? '<div class="watermark">CANCELLED</div>' : ""}
    
    <div class="header">
        <div class="supplier-info">
            <div class="supplier-title">${
              record.party?.ledgerName || record.ledger?.ledgerName || ""
            }</div>
            <div class="supplier-details">Phone: ${
              record.party?.PartyDetails?.phoneNumber ||
              record.ledger?.PartyDetails?.[0]?.phoneNumber ||
              ""
            }</div>
            <div class="supplier-details">Address: ${
              record.party?.PartyDetails?.address ||
              record.ledger?.PartyDetails?.[0]?.address ||
              ""
            }</div>
            <div class="supplier-details">TRN: ${
              record.party?.PartyDetails?.trn ||
              record.ledger?.PartyDetails?.[0]?.trn ||
              ""
            }</div>
        </div>
        <div class="invoice-info">
            <div class="invoice-title">TAX INVOICE</div>
            <div class="invoice-details"><strong>Invoice #:</strong> ${
              record.invoiceNo
            }</div>
            <div class="invoice-details"><strong>Date:</strong> ${new Date(
              record.date
            ).toLocaleDateString()}</div>
        </div>
    </div>

    <div class="bill-to">
        <div class="bill-to-title">Bill To:</div>
        <div><strong>Name:</strong> ${companyProfile.companyName}</div>
        <div><strong>Phone:</strong> ${companyProfile.phoneNumber}</div>
        ${
          companyProfile.phoneNumber2
            ? `<div><strong>Phone 2:</strong> ${companyProfile.phoneNumber2}</div>`
            : ""
        }
        <div><strong>Address:</strong> ${companyProfile.address || "N/A"}</div>
        <div><strong>TRN:</strong> ${companyProfile.trn || "N/A"}</div>
    </div>

    ${itemsHTML}

    <div class="totals-container">
        <div class="payment-section">
            <div class="bill-to-title">Payment Information</div>
            <div><strong>Amount Paid:</strong> ${
              record.received || "0.00"
            }</div>
            <div><strong>Balance Due:</strong> ${(
              record.grandTotal - (record.received || 0)
            ).toFixed(2)}</div>
            ${
              record.paymentType
                ? `<div><strong>Payment Type:</strong> ${record.paymentType}</div>`
                : ""
            }
            ${
              record.bank?.ledgerName
                ? `<div><strong>Bank:</strong> ${record.bank.ledgerName}</div>`
                : ""
            }
            ${
              record.trxnId
                ? `<div><strong>Transaction ID:</strong> ${record.trxnId}</div>`
                : ""
            }
        </div>
        <div class="totals">
            <div class="total-row">
                <span class="total-label">Subtotal:</span>
                <span>${record.totalAmount}</span>
            </div>
            <div class="total-row">
                <span class="total-label">VAT:</span>
                <span>${record.taxAmount}</span>
            </div>
            ${
              activeView === "purchase"
                ? `
            <div class="total-row">
                <span class="total-label">Discount:</span>
                <span>${record.discount || "0.00"}</span>
            </div>
            `
                : ""
            }
            <div class="total-row grand-total">
                <span class="total-label">Grand Total:</span>
                <span>${record.grandTotal}</span>
            </div>
        </div>
    </div>

    <div class="amount-words">
        <div class="amount-words-title">Amount in Words:</div>
        <div>${this.numberToWords(record.grandTotal)}</div>
    </div>

    ${transactionHistoryHTML}

    ${
      record.notes
        ? `
    <div class="notes-section">
        <div class="bill-to-title">Notes</div>
        <div>${record.notes}</div>
    </div>
    `
        : ""
    }

    <div class="signature-section">
        <div class="signature-box">
            Authorized Signatory
        </div>
    </div>

    <div class="footer">
        <div class="thank-you">Thank you for your business!</div>
        <div style="margin-top: 10px; font-size: 10px; color: #666;">
            Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
        </div>
    </div>
</body>
</html>
    `;
  }

  generateThermalHTML(data: TemplateData): string {
    const { record, companyProfile, activeView } = data;
    const items = record.purchaseItems || record.purchaseReturnItems || [];

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
            padding: 2mm; 
            width: 58mm; 
            font-size: 11px; 
            line-height: 1.2;
        }
        .center { text-align: center; }
        .line { 
            border-bottom: 1px dashed #000; 
            margin: 6px 0; 
        }
        .bold { font-weight: bold; }
        .small { font-size: 9px; }
        .item-container {
            margin-bottom: 4px;
            border-bottom: 1px dotted #ccc;
            padding-bottom: 2px;
        }
        .item-name {
            font-size: 10px;
            font-weight: bold;
            word-wrap: break-word;
            line-height: 1.1;
            margin-bottom: 2px;
        }
        .item-values {
            font-size: 9px;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            gap: 2px;
            text-align: center;
        }
        .totals-section {
            border-top: 1px dashed #000;
            padding-top: 6px;
            margin-top: 8px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            margin-bottom: 2px;
        }
        .grand-total {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            font-weight: bold;
            padding-top: 4px;
            margin-top: 4px;
        }
    </style>
</head>
<body>
    <div class="center">
        <div class="bold">${companyProfile.companyName}</div>
        <div class="small">${companyProfile.address}</div>
        <div class="small">Ph: ${companyProfile.phoneNumber}${
      companyProfile.phoneNumber2 ? ` | ${companyProfile.phoneNumber2}` : ""
    }</div>
        ${
          companyProfile.trn
            ? `<div class="small">TRN: ${companyProfile.trn}</div>`
            : ""
        }
        <div class="bold" style="margin: 8px 0 4px 0;">TAX INVOICE</div>
    </div>
    
    <div class="line"></div>
    
    <div style="font-size: 10px; text-align: left; margin-bottom: 8px;">
        <div>Bill No: ${record.invoiceNo}</div>
        <div>Date: ${new Date(record.date).toLocaleDateString()}</div>
    </div>
    
    <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 6px 0; margin-bottom: 8px;">
        <div style="font-size: 10px; line-height: 1.2; margin-bottom: 2px;">
            <strong>Supplier: ${record.party?.ledgerName || ""}</strong>
        </div>
        ${
          record.party?.PartyDetails?.phoneNumber
            ? `<div style="font-size: 10px;">Ph: ${record.party.PartyDetails.phoneNumber}</div>`
            : ""
        }
        ${
          record.party?.PartyDetails?.address
            ? `<div style="font-size: 10px; word-wrap: break-word;">Addr: ${record.party.PartyDetails.address}</div>`
            : ""
        }
    </div>
    
    <div style="font-size: 10px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 4px; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 2px;">
        <div style="text-align: center;">QTY</div>
        <div style="text-align: center;">RATE</div>
        <div style="text-align: center;">TAX %</div>
        <div style="text-align: right;">AMT</div>
    </div>
    
    ${
      items
        ?.map((item: any) => {
          const baseAmount = Number(item.quantity) * Number(item.purchaseRate);
          const taxAmount = baseAmount * (Number(item.tax) / 100);
          const itemTotal =
            baseAmount + taxAmount - (Number(item.discount) || 0);

          return `
        <div class="item-container">
            <div class="item-name">${item.item?.itemName}</div>
            <div class="item-values">
                <div>${item.quantity}</div>
                <div>${item.purchaseRate}</div>
                <div>${item.tax}</div>
                <div style="text-align: right;">${itemTotal.toFixed(2)}</div>
            </div>
        </div>
        `;
        })
        .join("") || ""
    }
    
    <div class="totals-section">
        <div class="total-row">
            <span>Subtotal:</span>
            <span>${record.totalAmount}</span>
        </div>
        <div class="total-row">
            <span>VAT:</span>
            <span>${record.taxAmount}</span>
        </div>
        ${
          activeView === "purchase" && Number(record.discount) > 0
            ? `
        <div class="total-row">
            <span>Discount:</span>
            <span>${record.discount}</span>
        </div>
        `
            : ""
        }
        <div class="grand-total">
            <span>TOTAL:</span>
            <span>${record.grandTotal}</span>
        </div>
    </div>
    
    <div style="font-size: 8px; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 6px 0; margin: 8px 0;">
        Amount in words: ${this.numberToWords(record.grandTotal)}
    </div>
    
    ${
      record.received
        ? `
    <div style="margin-top: 8px; font-size: 10px;">
        <div class="total-row">
            <span>Paid:</span>
            <span>${record.received}</span>
        </div>
        <div class="total-row">
            <span>Balance:</span>
            <span>${(record.grandTotal - (record.received || 0)).toFixed(
              2
            )}</span>
        </div>
        ${
          record.paymentType
            ? `<div style="text-align: center; font-size: 9px; margin-top: 4px;">Payment: ${record.paymentType}</div>`
            : ""
        }
        ${
          record.bank?.ledgerName
            ? `<div style="text-align: center; font-size: 9px; margin-top: 2px;">Bank: ${record.bank.ledgerName}</div>`
            : ""
        }
        ${
          record.trxnId
            ? `<div style="text-align: center; font-size: 8px; margin-top: 2px;">Txn ID: ${record.trxnId}</div>`
            : ""
        }
    </div>
    `
        : ""
    }
    
    ${
      record.notes
        ? `
    <div style="margin-top: 8px; font-size: 9px; text-align: center;">
        <div style="border-top: 1px dotted #000; padding-top: 4px;">
            Note: ${record.notes}
        </div>
    </div>
    `
        : ""
    }
    
    <div class="center" style="margin-top: 10px; padding-top: 6px; border-top: 1px dashed #000; font-size: 9px;">
        <div>Thank You!</div>
        <div>for your business</div>
    </div>
    
    <div style="text-align: center; margin: 4px 0; font-size: 10px;">
        ================================
    </div>
</body>
</html>
    `;
  }

  /**
   * Generates HTML table for purchase items
   * @private
   */
  private generateItemsHTML(record: any, activeView: string): string {
    const items = record.purchaseItems || record.purchaseReturnItems || [];

    if (!items || items.length === 0) {
      return '<div style="text-align: center; padding: 20px; color: #666;">No items found</div>';
    }

    let html = `
    <table class="table">
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 30%;">Item</th>
                <th style="width: 10%;">Qty</th>
                <th style="width: 10%;">Rate</th>
                <th style="width: 10%;">Total</th>
                ${
                  activeView === "purchase"
                    ? '<th style="width: 10%;">Discount</th>'
                    : ""
                }
                <th style="width: 15%;">VAT</th>
                <th style="width: 10%;">Taxable Value</th>
                <th style="width: 10%;">Item Total</th>
            </tr>
        </thead>
        <tbody>
    `;

    items.forEach((item: any, index: number) => {
      const baseAmount = Number(item.quantity) * Number(item.purchaseRate);
      const taxAmount = baseAmount * (Number(item.tax) / 100);
      const discount = Number(item.discount) || 0;
      const taxableValue = baseAmount - discount;
      const itemTotal = taxableValue + taxAmount;

      html += `
        <tr>
            <td>${index + 1}</td>
            <td style="text-align: left;">${
              item.item?.itemName || "Unknown Item"
            }</td>
            <td>${item.quantity}</td>
            <td>${Number(item.purchaseRate).toFixed(2)}</td>
            <td>${baseAmount.toFixed(2)}</td>
            ${
              activeView === "purchase" ? `<td>${discount.toFixed(2)}</td>` : ""
            }
            <td>${taxAmount.toFixed(2)}<br><small>(${item.tax}%)</small></td>
            <td>${taxableValue.toFixed(2)}</td>
            <td><strong>${itemTotal.toFixed(2)}</strong></td>
        </tr>
        `;
    });

    html += `
        </tbody>
    </table>
    `;

    return html;
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
            <td>${entry.paymentType || "N/A"}</td>
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
   * Converts numeric amount to words (UAE Dirham)
   * @private
   */
  private numberToWords(num: number): string {
    if (num === 0) return "Zero UAE Dirham Only";

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

    result += "UAE Dirham";

    if (decimalPart > 0) {
      result += " and " + convertGroup(decimalPart) + "Fils";
    }

    return result + " Only";
  }
}
