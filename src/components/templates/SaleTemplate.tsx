import { COMPANY_LOGO_BASE64 } from "../../constants/image";
import { PDFTemplate, TemplateData } from "../../types/TemplateTypes";

export class SalesTemplate implements PDFTemplate {
  generateHTML(data: TemplateData): string {
    const {
      record,
      companyProfile,
      transactionHistory,
      defaultBank,
      activeView,
    } = data;

    // Calculate totals
    const historyTotal =
      transactionHistory?.history?.reduce(
        (sum: number, entry: any) => sum + Number(entry.amount),
        0
      ) || 0;
    const finalAmountDue = record.grandTotal - historyTotal;

    // Get items based on active view
    const items =
      activeView === "sales"
        ? record.saleItems
        : activeView === "returns"
        ? record.saleReturnItems
        : activeView === "estimates"
        ? record.estimateItems
        : [];

    // Number to words function
    const numberToWords = (num: number): string => {
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

      if (num === 0) return "Zero UAE Dirham Only";

      const convertGroup = (n: number): string => {
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
    };

    // Generate items HTML rows
    const itemsHTML =
      items
        ?.map((item: any, index: number) => {
          const baseAmount = Number(item.quantity) * Number(item.saleRate);
          const taxAmount = baseAmount * (Number(item.tax) / 100);
          const itemTotal =
            baseAmount + taxAmount - (Number(item.discount) || 0);

          return `
        <div class="table-row ${index % 2 === 1 ? "alternate-row" : ""}">
          <div class="table-col table-col-serial">${index + 1}</div>
          <div class="table-col table-col-wide">${
            item.item?.itemName || ""
          }</div>
          <div class="table-col table-col-narrow">${item.quantity}</div>
          <div class="table-col table-col-narrow">${item.saleRate}</div>
          <div class="table-col table-col-narrow">${baseAmount.toFixed(2)}</div>
          ${
            activeView === "sales"
              ? `<div class="table-col table-col-narrow">${(
                  Number(item.discount) || 0
                ).toFixed(2)}</div>`
              : ""
          }
          <div class="table-col table-col-tax">
            <div style="font-size: 7px;">(${item.tax}%)</div>
            <div>${taxAmount.toFixed(2)}</div>
          </div>
          <div class="table-col table-col-narrow">
            ${(
              Number(item.saleRate) * Number(item.quantity) -
              (Number(item.discount) || 0)
            ).toFixed(2)}
          </div>
          <div class="table-col table-col-narrow">${itemTotal.toFixed(2)}</div>
        </div>
      `;
        })
        .join("") || "";

    // Generate transaction history HTML
    const transactionHistoryHTML =
      transactionHistory?.history && transactionHistory.history.length > 0
        ? `
      <div class="section">
        <div class="section-title">Transaction History</div>
        <div class="history-table">
          <!-- Header -->
          <div class="history-header">
            <div class="history-cell-header">Reference</div>
            <div class="history-cell-header">Date</div>
            <div class="history-cell-header">Type</div>
            <div class="history-cell-header">Amount</div>
            <div class="history-cell-header">Payment Method</div>
          </div>
          
          <!-- Rows -->
          ${transactionHistory.history
            .map(
              (entry: any) => `
            <div class="history-row">
              <div class="history-cell">${entry.referenceNo}</div>
              <div class="history-cell">${new Date(
                entry.date
              ).toLocaleDateString()}</div>
              <div class="history-cell type-badge">${entry.type}</div>
              <div class="history-cell" style="text-align: right;">${Number(
                entry.amount
              ).toFixed(2)}</div>
              <div class="history-cell">${
                entry.paymentType?.toLowerCase() || ""
              }</div>
            </div>
          `
            )
            .join("")}
          
          <!-- Totals -->
          <div class="history-row" style="background-color: #f5f5f5;">
            <div class="history-cell" style="font-weight: bold;">History Total:</div>
            <div class="history-cell"></div>
            <div class="history-cell"></div>
            <div class="history-cell" style="text-align: right; font-weight: bold;">${historyTotal.toFixed(
              2
            )}</div>
            <div class="history-cell"></div>
          </div>
          
          <div class="history-row" style="background-color: #f0f0f0;">
            <div class="history-cell" style="font-weight: bold;">Final Amount Due:</div>
            <div class="history-cell"></div>
            <div class="history-cell"></div>
            <div class="history-cell" style="text-align: right; font-weight: bold; color: ${
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
            </div>
            <div class="history-cell"></div>
          </div>
        </div>
      </div>
    `
        : "";

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
            padding: 15px; 
            font-family: Arial, sans-serif; 
            font-size: 9px;
            color: #333;
            position: relative;
        }
        @page { 
            margin: 0.5in; 
            size: A4; 
        }
        
        /* Watermark */
        .watermark {
            position: fixed;
            top: 45%;
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

      
        
        .content-container {
            position: relative;
            z-index: 2;
        }

        /* Header */
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
        .logo-container {
            width: 25%;
            text-align: center;
        }
        .logo {
            width: 60px;
            height: 60px;
            object-fit: contain;
        }
        .invoice-info {
            width: 40%;
            text-align: right;
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

        /* Sections */
        .section {
            margin-bottom: 12px;
        }
        .section-title {
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 5px;
            background-color: #f5f5f5;
            padding: 5px;
            color: #000;
            border: 1px solid #ccc;
        }

        /* Bill To */
        .bill-to-container {
            padding: 8px;
            border: 1px solid #ddd;
        }
        .row {
            display: flex;
            margin-bottom: 3px;
        }
        .label {
            width: 35%;
            font-weight: bold;
            font-size: 9px;
            color: #000;
        }
        .value {
            width: 75%;
            font-size: 9px;
            color: #333;
        }

        /* Table */
        .table {
            display: flex;
            flex-direction: column;
            width: auto;
            border: 1px solid #000;
            margin-top: 8px;
        }
        .table-row {
            display: flex;
            border-bottom: 1px solid #ccc;
        }
        .table-col-header {
            flex: 1;
            padding: 5px;
            background-color: #e5e5e5;
            font-weight: bold;
            font-size: 8px;
            color: #000;
            border-right: 1px solid #000;
            text-align: center;
            min-height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .table-col {
            flex: 1;
            padding: 4px;
            border-right: 1px solid #ccc;
            font-size: 8px;
            text-align: center;
            min-height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .table-col-serial { flex: 0.3; }
        .table-col-wide { flex: 1.4; }
        .table-col-narrow { flex: 0.6; }
        .table-col-tax { flex: 0.8; }

        /* Totals */
        .totals-container {
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
        }
        .totals-table {
            width: 40%;
            border: 0.5px solid #333;
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
            padding: 12px 8px;
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
        .amount-in-words {
            margin-top: 1px;
            padding: 8px;
            border: 1px solid #ccc;
        }
        .amount-in-words-title {
            font-size: 9px;
            font-weight: bold;
            margin-bottom: 3px;
            color: #000;
        }
        .amount-in-words-text {
            font-size: 8px;
            color: #333;
            text-transform: capitalize;
        }

        /* Payment Section */
        .payment-section {
            padding: 8px;
            border: 1px solid #ddd;
        }

        /* Notes */
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
        .history-table {
            margin-top: 15px;
            border: 1px solid #000;
        }
        .history-header {
            display: flex;
            background-color: #e5e5e5;
            font-weight: bold;
            border-bottom: 1px solid #000;
        }
        .history-row {
            display: flex;
            border-bottom: 1px solid #ccc;
        }
        .history-cell {
            padding: 4px;
            font-size: 8px;
            flex: 1;
            border-right: 1px solid #ccc;
        }
        .history-cell-header {
            padding: 4px;
            font-size: 8px;
            font-weight: bold;
            flex: 1;
            border-right: 1px solid #000;
            text-align: center;
        }
        .type-badge {
            padding: 2px 4px;
            font-size: 7px;
            text-align: center;
        }

        /* Footer */
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
        }
        .thank-you-text {
            font-size: 9px;
            font-weight: bold;
            color: #000;
            margin-bottom: 3px;
        }

        /* Alternating rows */
        .alternate-row {
            background-color: #fafafa;
        }

        /* Signature */
        .signature-section {
            position: relative;
            width: 40%;
            padding: 10px;
            border: 1px solid #ccc;
            align-self: flex-end;
            margin-top: 20px;
            margin-left: auto;
        }
        .signature-text {
            font-size: 9px;
            font-weight: bold;
            margin-bottom: 30px;
            color: #000;
            text-align: center;
        }
    </style>
</head>
<body>
    
    <div class="content-container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <div class="company-title">${companyProfile.companyName}</div>
                <div class="company-subtitle">${
                  companyProfile.address || ""
                }</div>
                <div class="company-subtitle">
                    Phone: ${companyProfile.phoneNumber || ""}
                    ${
                      companyProfile.phoneNumber2
                        ? ` | ${companyProfile.phoneNumber2}`
                        : ""
                    }
                </div>
                <div class="company-subtitle">Email: ${
                  companyProfile.email || ""
                }</div>
                <div class="company-subtitle">TRN: ${
                  companyProfile.trn || ""
                }</div>
            </div>
            
           <div class="logo-container">
              <img src="${COMPANY_LOGO_BASE64}" alt="Logo" class="logo" />
           </div>

            <div class="invoice-info">
                <div class="invoice-title">
                    ${
                      activeView === "sales"
                        ? "TAX INVOICE"
                        : activeView === "returns"
                        ? "TAX INVOICE"
                        : "ESTIMATE"
                    }
                </div>
                <div class="invoice-details">Invoice #: ${
                  record.invoiceNo
                }</div>
                <div class="invoice-details">Date: ${new Date(
                  record.date
                ).toLocaleDateString()}</div>
            </div>
        </div>

        <!-- Bill To Section -->
        <div class="section">
            <div class="bill-to-container">
                <div class="row">
                    <div class="label">Name:</div>
                    <div class="value">${
                      record.party?.ledgerName ||
                      record.ledger?.ledgerName ||
                      ""
                    }</div>
                </div>
                <div class="row">
                    <div class="label">Phone:</div>
                    <div class="value">${
                      record.party?.PartyDetails?.phoneNumber ||
                      record.ledger?.phoneNumber ||
                      ""
                    }</div>
                </div>
                <div class="row">
                    <div class="label">Address:</div>
                    <div class="value">${
                      record.party?.PartyDetails?.address ||
                      record.ledger?.address ||
                      ""
                    }</div>
                </div>
                <div class="row">
                    <div class="label">TRN:</div>
                    <div class="value">${
                      record.party?.PartyDetails?.trn ||
                      record.ledger?.trn ||
                      ""
                    }</div>
                </div>
            </div>
        </div>

        <!-- Items Table -->
        <div class="section">
            <div class="table">
                <!-- Table Header -->
                <div class="table-row">
                    <div class="table-col-header table-col-serial">#</div>
                    <div class="table-col-header table-col-wide">ITEM</div>
                    <div class="table-col-header table-col-narrow">QTY</div>
                    <div class="table-col-header table-col-narrow">RATE</div>
                    <div class="table-col-header table-col-narrow">TOTAL</div>
                    ${
                      activeView === "sales"
                        ? '<div class="table-col-header table-col-narrow">DISCOUNT</div>'
                        : ""
                    }
                    <div class="table-col-header table-col-tax">VAT</div>
                    <div class="table-col-header table-col-narrow">TAXABLE VALUE</div>
                    <div class="table-col-header table-col-narrow">ITEM TOTAL</div>
                </div>

                <!-- Table Rows -->
                ${itemsHTML}
            </div>
        </div>

        <!-- Totals and Payment Section -->
        <div class="totals-container">
            ${
              activeView !== "estimates"
                ? `
            <div class="payment-section">
                <div class="row">
                    <div class="label">Amount Received:</div>
                    <div class="value">${record.received || "0.00"}</div>
                </div>
                <div class="row">
                    <div class="label">Balance Due:</div>
                    <div class="value">${(
                      record.grandTotal - (record.received || 0)
                    ).toFixed(2)}</div>
                </div>
                ${
                  record.paymentType
                    ? `
                <div class="row">
                    <div class="label">Payment Type:</div>
                    <div class="value">${record.paymentType}</div>
                </div>
                `
                    : ""
                }
                ${
                  record.bank
                    ? `
                <div class="row">
                    <div class="label">Bank:</div>
                    <div class="value">${record.bank.ledgerName}</div>
                </div>
                `
                    : ""
                }
                ${
                  record.trxnId
                    ? `
                <div class="row">
                    <div class="label">Transaction ID:</div>
                    <div class="value">${record.trxnId}</div>
                </div>
                `
                    : ""
                }
                <div class="row">
                    <div class="label">Created:</div>
                    <div class="value">${record.createdBy?.name || ""}</div>
                </div>
                ${
                  record.authorizedUserBy
                    ? `
                <div class="row">
                    <div class="label">Authorized:</div>
                    <div class="value">${record.authorizedUserBy.name} (${record.authorizedUserBy.phoneNumber})</div>
                </div>
                `
                    : ""
                }
                ${
                  record.vehicleUser
                    ? `
                <div class="row">
                    <div class="label">Vehicle User:</div>
                    <div class="value">${record.vehicleUser.name} (${record.vehicleUser.phoneNumber})</div>
                </div>
                `
                    : ""
                }
            </div>
            `
                : ""
            }
            
            <div class="totals-table">
                <div class="total-row">
                    <div class="total-label">Subtotal:</div>
                    <div class="total-value">${record.totalAmount}</div>
                </div>
                <div class="total-row">
                    <div class="total-label">Vat:</div>
                    <div class="total-value">${record.taxAmount}</div>
                </div>
                ${
                  activeView === "sales"
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
        <div class="amount-in-words">
            <div class="amount-in-words-title">Amount in Words:</div>
            <div class="amount-in-words-text">Amount in words : ${numberToWords(
              record.grandTotal
            )}</div>
        </div>

        ${
          record.notes
            ? `
        <div class="section">
            <div class="notes-section">
                <div class="notes-text">Note: ${record.notes}</div>
            </div>
        </div>
        `
            : ""
        }

        <!-- Transaction History -->
        ${transactionHistoryHTML}

        ${
          defaultBank
            ? `
        <div class="section">
            <div class="payment-section">
                <div class="section-title">Bank Details</div>
                <div class="row">
                    <div class="label">Bank Name:</div>
                    <div class="value">${
                      defaultBank.ledger?.ledgerName || ""
                    }</div>
                </div>
                <div class="row">
                    <div class="label">Account Name:</div>
                    <div class="value">${defaultBank.accountName}</div>
                </div>
                <div class="row">
                    <div class="label">Account Number:</div>
                    <div class="value">${defaultBank.accountNo}</div>
                </div>
                ${
                  defaultBank.ibanNo
                    ? `
                <div class="row">
                    <div class="label">IBAN:</div>
                    <div class="value">${defaultBank.ibanNo}</div>
                </div>
                `
                    : ""
                }
                ${
                  defaultBank.branch
                    ? `
                <div class="row">
                    <div class="label">Branch:</div>
                    <div class="value">${defaultBank.branch}</div>
                </div>
                `
                    : ""
                }
                ${
                  defaultBank.shiftCode
                    ? `
                <div class="row">
                    <div class="label">SWIFT Code:</div>
                    <div class="value">${defaultBank.shiftCode}</div>
                </div>
                `
                    : ""
                }
            </div>
        </div>
        `
            : ""
        }

        <!-- Authorized Signatory -->
        <div class="signature-section">
            <div class="signature-text">Authorized Signatory</div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="thank-you-text">Thank you for your business!</div>
            <div>Page 1 of 1</div>
        </div>
    </div>

    ${record.cancelledById ? '<div class="watermark">CANCELLED</div>' : ""}

</body>
</html>
    `;
  }

  generateThermalHTML(data: TemplateData): string {
    const { record, companyProfile, activeView } = data;
    const items =
      record.saleItems || record.saleReturnItems || record.estimateItems || [];

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
            font-size: 12px; 
            line-height: 1.2;
            box-sizing: border-box;
            position: relative;
        }
        .center { text-align: center; }
        .line { 
            border-bottom: 1px dashed #000; 
            margin: 8px 0; 
        }
        .bold { font-weight: bold; }
        .small { font-size: 10px; }
        .item-container {
            margin-bottom: 4px;
            border-bottom: 1px dotted #ccc;
            padding-bottom: 2px;
        }
        .item-name {
            font-size: 10px;
            font-weight: bold;
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-all;
            line-height: 1.1;
            margin-bottom: 2px;
        }
        .item-values {
            font-size: 9px;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            gap: 2px;
            text-align: center;
            align-items: center;
        }
        .amount-word-section {
            font-size: 8px;
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 6px 0;
            margin-bottom: 8px;
        }
        .supplier-section {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 6px 0;
            margin-bottom: 8px;
        }
        .supplier-info {
            font-size: 10px;
            line-height: 1.2;
            margin-bottom: 2px;
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-all;
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
        ${
          record.cancelledById
            ? `
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
        `
            : ""
        }
    </style>
</head>
<body>
    ${record.cancelledById ? '<div class="watermark">CANCELLED</div>' : ""}
    
    <div class="center">
        <div class="bold" style="font-size: 14px;">${
          companyProfile.companyName
        }</div>
        <div class="small">${companyProfile.address}</div>
        <div class="small">Ph: ${companyProfile.phoneNumber}${
      companyProfile.phoneNumber2 ? ` | ${companyProfile.phoneNumber2}` : ""
    }</div>
        ${
          companyProfile.trn
            ? `<div class="small">TRN: ${companyProfile.trn}</div>`
            : ""
        }
        <div class="bold" style="margin: 8px 0 4px 0; font-size: 12px;">${
          activeView === "sales"
            ? "TAX INVOICE"
            : activeView === "returns"
            ? "TAX INVOICE"
            : "ESTIMATE"
        }</div>
    </div>
    
    <div class="line"></div>
    
    <div style="font-size: 10px; text-align: left; margin-bottom: 8px;">
        <div>Bill No: ${record.invoiceNo}</div>
        <div>Date: ${new Date(record.date).toLocaleDateString()}</div>
        <div>Salesman Name: ${record.createdBy?.name || ""}</div>
        <div>Salesman Contact: ${record.createdBy?.phoneNumber || ""}</div>
    </div>
    
    <div class="supplier-section">
        <div class="supplier-info">
            <strong>Name: ${record.party?.ledgerName || "Walk-in"}</strong>
        </div>
        ${
          record.party?.PartyDetails?.phoneNumber
            ? `<div class="supplier-info">Ph: ${record.party.PartyDetails.phoneNumber}</div>`
            : ""
        }
        ${
          record.party?.PartyDetails?.address
            ? `<div class="supplier-info">Addr: ${record.party.PartyDetails.address}</div>`
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
          const baseAmount = Number(item.quantity) * Number(item.saleRate);
          const taxAmount = baseAmount * (Number(item.tax) / 100);
          const itemTotal =
            baseAmount + taxAmount - (Number(item.discount) || 0);

          return `
        <div class="item-container">
            <div class="item-name">${item.item?.itemName}</div>
            <div class="item-values">
                <div>${item.quantity}</div>
                <div>${item.saleRate}</div>
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
          activeView === "sales" && Number(record.discount) > 0
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
    
    <div class="amount-word-section">
        Amount in words : ${this.numberToWords(record.grandTotal)}
    </div>
    
    ${
      activeView !== "estimates" && record.received
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

  private numberToWords(num: number): string {
    // Your existing numberToWords implementation
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
