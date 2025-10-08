import { PDFTemplate, TemplateData } from "../../types/TemplateTypes";

export class PurchaseTemplate implements PDFTemplate {
  generateHTML(data: TemplateData): string {
    const { record, companyProfile, transactionHistory, activeView } = data;

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
            padding: 25px; 
            font-family: Helvetica, Arial, sans-serif; 
            font-size: 9px;
            color: #333;
            position: relative;
        }
        @page { 
            margin: 0.5in; 
            size: A4; 
        }
        
        /* Watermark - matches PDF positioning */
        .watermark {
            position: fixed;
            top: 40%;
            left: 30%;
            transform: rotate(-45deg);
            font-size: 40px;
            color: rgba(255, 0, 0, 0.25);
            font-weight: 900;
            text-transform: uppercase;
            text-align: center;
            z-index: 9999;
            pointer-events: none;
            user-select: none;
        }
        
        .content-container {
            position: relative;
            z-index: 1;
        }
        
        /* Header - LEFT: Party Info (58%), RIGHT: Invoice Info (40%) */
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            border-bottom: 1px solid #000;
            padding-bottom: 10px;
        }
        .company-info {
            width: 58%;
        }
        .company-title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 4px;
            color: #000;
        }
        .company-subtitle {
            font-size: 9px;
            color: #333;
            margin-bottom: 2px;
        }
        .invoice-info {
            width: 40%;
            align-items: flex-end;
            text-align: right;
        }
        .invoice-title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 6px;
            color: #000;
            text-align: right;
            border: 1px solid #000;
            padding: 6px;
        }
        .invoice-details {
            font-size: 9px;
            margin-bottom: 2px;
            text-align: right;
        }
        
        /* Section */
        .section {
            margin-bottom: 12px;
        }
        
        /* Bill To Container - Company Profile */
        .bill-to-container {
            padding: 8px;
            border: 1px solid #ddd;
        }
        .row {
            display: flex;
            margin-bottom: 3px;
        }
        .label {
            width: 25%;
            font-weight: bold;
            font-size: 9px;
            color: #000;
        }
        .value {
            width: 75%;
            font-size: 9px;
            color: #333;
        }
        
        /* Items Table */
        .table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            margin-top: 8px;
        }
        .table th, .table td {
            border: 1px solid #000;
            padding: 5px 4px;
            text-align: center;
            font-size: 8px;
            min-height: 18px;
            vertical-align: middle;
        }
        .table th {
            background-color: #e5e5e5;
            font-weight: bold;
            color: #000;
            min-height: 20px;
        }
        .table tbody tr:nth-child(even) {
            background-color: #fafafa;
        }
        
        /* Totals Container - Payment Section + Totals Table side by side */
        .totals-container {
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
            gap: 20px;
        }
        
        /* Payment Section - LEFT side of totals */
        .payment-section {
            padding: 8px;
            border: 1px solid #ddd;
            width: 300px;
        }
        .payment-title {
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #000;
        }
        .payment-row {
            display: flex;
            margin-bottom: 3px;
        }
        .payment-label {
            width: 60%;
            font-weight: bold;
            font-size: 9px;
            color: #000;
        }
        .payment-value {
            width: 40%;
            font-size: 9px;
            color: #333;
        }
        
        /* Totals Table - RIGHT side */
        .totals-table {
            width: 300px;
            border: 1px solid #000;
        }
        .total-row {
            display: flex;
            padding: 4px 8px;
            border-bottom: 1px solid #ccc;
        }
        .total-label {
            width: 65%;
            font-size: 9px;
            font-weight: bold;
            color: #000;
        }
        .total-value {
            width: 35%;
            font-size: 9px;
            text-align: right;
            color: #000;
        }
        .grand-total-row {
            display: flex;
            padding: 6px 8px;
            background-color: #f0f0f0;
        }
        .grand-total-label {
            width: 65%;
            font-size: 10px;
            font-weight: bold;
            color: #000;
        }
        .grand-total-value {
            width: 35%;
            font-size: 10px;
            text-align: right;
            font-weight: bold;
            color: #000;
        }
        
        /* Amount in Words */
        .amount-words {
            margin-top: 10px;
            padding: 8px;
            border: 1px solid #ccc;
        }
        .amount-words-title {
            font-size: 9px;
            font-weight: bold;
            margin-bottom: 3px;
            color: #000;
        }
        .amount-words-text {
            font-size: 8px;
            color: #333;
            text-transform: capitalize;
        }
        
        /* Notes Section */
        .notes-section {
            padding: 8px;
            border: 1px solid #ccc;
        }
        .notes-text {
            font-size: 8px;
            line-height: 1.3;
            color: #333;
        }
        
        /* Transaction History */
        .history-section {
            margin-top: 15px;
        }
        .history-title {
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 5px;
            background-color: #f5f5f5;
            padding: 5px;
            color: #000;
            border: 1px solid #ccc;
        }
        .history-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
        }
        .history-header {
            background-color: #e5e5e5;
            font-weight: bold;
            border-bottom: 1px solid #000;
        }
        .history-row {
            border-bottom: 1px solid #ccc;
        }
        .history-cell {
            padding: 4px;
            font-size: 8px;
            border-right: 1px solid #ccc;
            text-align: center;
        }
        .history-cell-header {
            padding: 4px;
            font-size: 8px;
            font-weight: bold;
            border-right: 1px solid #000;
            text-align: center;
        }
        .type-badge {
            padding: 2px 4px;
            font-size: 7px;
            text-align: center;
        }
        
        /* Authorized Signatory - 40% width, right aligned */
        .signature-section {
            width: 40%;
            padding: 10px;
            border: 1px solid #ccc;
            margin: 20px 0 0 auto;
        }
        .signature-text {
            font-size: 9px;
            font-weight: bold;
            margin-bottom: 30px;
            color: #000;
            text-align: center;
        }
        
        /* Footer - absolute positioning */
        .footer {
    position: fixed;
    bottom: 20px;
    left: 25px;
    right: 25px;
    font-size: 8px;
    text-align: center;
    border-top: 1px solid #ccc;
    padding-top: 8px;
    color: #666;
    z-index: 10;
    background-color: white;  
}
.thank-you-text {
    font-size: 9px;
    font-weight: bold;
    color: #000;
    margin-bottom: 3px;
}
    </style>
</head>
<body>
    ${record.cancelledById ? '<div class="watermark">CANCELLED</div>' : ""}
    
    <div class="content-container">
        <!-- Header: LEFT - Party Info, RIGHT - Invoice Info -->
        <div class="header">
            <div class="company-info">
                <div class="company-title">${
                  record.party?.ledgerName || record.ledger?.ledgerName || ""
                }</div>
                <div class="company-subtitle">Phone: ${
                  record.party?.PartyDetails?.phoneNumber ||
                  record.ledger?.PartyDetails?.[0]?.phoneNumber ||
                  ""
                }</div>
                <div class="company-subtitle">Address: ${
                  record.party?.PartyDetails?.address ||
                  record.ledger?.PartyDetails?.[0]?.address ||
                  ""
                }</div>
                <div class="company-subtitle">TRN: ${
                  record.party?.PartyDetails?.trn ||
                  record.ledger?.PartyDetails?.[0]?.trn ||
                  ""
                }</div>
            </div>
            
            <div class="invoice-info">
                <div class="invoice-title">TAX INVOICE</div>
                <div class="invoice-details">Invoice #: ${
                  record.invoiceNo
                }</div>
                <div class="invoice-details">Date: ${new Date(
                  record.date
                ).toLocaleDateString()}</div>
            </div>
        </div>

        <!-- Bill To Section (Company Profile) -->
        <div class="section">
            <div class="bill-to-container">
                <div class="row">
                    <div class="label">Name:</div>
                    <div class="value">${companyProfile.companyName}</div>
                </div>
                <div class="row">
                    <div class="label">Phone:</div>
                    <div class="value">${companyProfile.phoneNumber}</div>
                </div>
                ${
                  companyProfile.phoneNumber2
                    ? `
                <div class="row">
                    <div class="label">Phone 2:</div>
                    <div class="value">${companyProfile.phoneNumber2}</div>
                </div>
                `
                    : ""
                }
                <div class="row">
                    <div class="label">Address:</div>
                    <div class="value">${companyProfile.address || "N/A"}</div>
                </div>
                <div class="row">
                    <div class="label">TRN:</div>
                    <div class="value">${companyProfile.trn || "N/A"}</div>
                </div>
            </div>
        </div>

        <!-- Items Table -->
        <div class="section">
            ${itemsHTML}
        </div>

        <!-- Totals Container: LEFT - Payment Info, RIGHT - Totals -->
        <div class="totals-container">
            <div class="section">
                <div class="payment-section">
                    <div class="payment-row">
                        <div class="payment-label">Amount Paid:</div>
                        <div class="payment-value">${
                          record.received || "0.00"
                        }</div>
                    </div>
                    <div class="payment-row">
                        <div class="payment-label">Balance Due:</div>
                        <div class="payment-value">${(
                          record.grandTotal - (record.received || 0)
                        ).toFixed(2)}</div>
                    </div>
                    ${
                      record.paymentType
                        ? `
                    <div class="payment-row">
                        <div class="payment-label">Payment Type:</div>
                        <div class="payment-value">${record.paymentType}</div>
                    </div>
                    `
                        : ""
                    }
                    ${
                      record.bank?.ledgerName
                        ? `
                    <div class="payment-row">
                        <div class="payment-label">Bank:</div>
                        <div class="payment-value">${record.bank.ledgerName}</div>
                    </div>
                    `
                        : ""
                    }
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
                </div>
            </div>
            
            <div class="totals-table">
                <div class="total-row">
                    <div class="total-label">Subtotal:</div>
                    <div class="total-value">${record.totalAmount}</div>
                </div>
                <div class="total-row">
                    <div class="total-label">VAT:</div>
                    <div class="total-value">${record.taxAmount}</div>
                </div>
                ${
                  activeView === "purchase"
                    ? `
                <div class="total-row">
                    <div class="total-label">Discount:</div>
                    <div class="total-value">${record.discount || "0.00"}</div>
                </div>
                `
                    : ""
                }
                <div class="grand-total-row">
                    <div class="grand-total-label">Grand Total:</div>
                    <div class="grand-total-value">${record.grandTotal}</div>
                </div>
            </div>
        </div>

        <!-- Amount in Words -->
        <div class="amount-words">
            <div class="amount-words-title">Amount in Words:</div>
            <div class="amount-words-text">Amount in words : ${this.numberToWords(
              record.grandTotal
            )}</div>
        </div>

        <!-- Transaction History -->
        ${transactionHistoryHTML}

        <!-- Notes Section -->
        ${
          record.notes
            ? `
        <div class="section">
            <div class="notes-section">
                <div class="amount-words-title">Notes</div>
                <div class="notes-text">Note: ${record.notes}</div>
            </div>
        </div>
        `
            : ""
        }

        <!-- Authorized Signatory -->
        <div class="signature-section">
            <div class="signature-text">
                Authorized Signatory
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="thank-you-text">Thank you for your business!</div>
            <div>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
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
            position: relative;
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
                <th style="width: 30%;">ITEM</th>
                <th style="width: 10%;">QTY</th>
                <th style="width: 10%;">RATE</th>
                <th style="width: 10%;">TOTAL</th>
                ${
                  activeView === "purchase"
                    ? '<th style="width: 10%;">DISCOUNT</th>'
                    : ""
                }
                <th style="width: 15%;">VAT</th>
                <th style="width: 10%;">TAXABLE VALUE</th>
                <th style="width: 10%;">ITEM TOTAL</th>
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
            <td>
                <div style="font-size: 7px;">(${item.tax}%)</div>
                <div>${taxAmount.toFixed(2)}</div>
            </td>
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
        <table class="history-table">
            <thead>
                <tr class="history-header">
                    <th class="history-cell-header">Reference</th>
                    <th class="history-cell-header">Date</th>
                    <th class="history-cell-header">Type</th>
                    <th class="history-cell-header">Amount</th>
                    <th class="history-cell-header">Payment Method</th>
                </tr>
            </thead>
            <tbody>
    `;

    transactionHistory.history.forEach((entry: any) => {
      html += `
        <tr class="history-row">
            <td class="history-cell">${entry.referenceNo}</td>
            <td class="history-cell">${new Date(
              entry.date
            ).toLocaleDateString()}</td>
            <td class="history-cell">
                <span class="type-badge">${entry.type}</span>
            </td>
            <td class="history-cell" style="text-align: right;">${Number(
              entry.amount
            ).toFixed(2)}</td>
            <td class="history-cell">${(
              entry.paymentType || "N/A"
            ).toLowerCase()}</td>
        </tr>
        `;
    });

    html += `
            <tr class="history-row" style="background-color: #f5f5f5;">
                <td class="history-cell" style="font-weight: bold;">History Total:</td>
                <td class="history-cell"></td>
                <td class="history-cell"></td>
                <td class="history-cell" style="text-align: right; font-weight: bold;">${historyTotal.toFixed(
                  2
                )}</td>
                <td class="history-cell"></td>
            </tr>
            <tr class="history-row" style="background-color: #f0f0f0;">
                <td class="history-cell" style="font-weight: bold;">Final Amount Due:</td>
                <td class="history-cell"></td>
                <td class="history-cell"></td>
                <td class="history-cell" style="text-align: right; font-weight: bold; color: ${
                  finalAmountDue > 0 ? "#d32f2f" : "#388e3c"
                };">
                    ${Math.abs(finalAmountDue).toFixed(2)} 
                    ${
                      finalAmountDue > 0
                        ? "(Due)"
                        : finalAmountDue < 0
                        ? "(Overpaid)"
                        : "(Settled)"
                    }
                </td>
                <td class="history-cell"></td>
            </tr>
        </tbody>
    </table>
    </div>
    `;

    return html;
  }

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
