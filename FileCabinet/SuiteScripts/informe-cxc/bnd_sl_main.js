/**
 * @author Manuel Cervera <manuel_cervera@outlook.com>
 * @Name bnd_sl_main.js
 * @description Suitelet to show the filters to create a cxc report.
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/ui/serverWidget', 'N/format', 'N/format/i18n', 'N/url', 'N/encode', 'N/file', 'N/runtime', 'N/record', 'N/search', './bnd_lb_lib_report'], (serverWidget, format, formati, url, encode, file, runtime, record, search, libReport) => {
    const entry_point = {
        onRequest: null,
    };

    entry_point.onRequest = (context) => {
            log.debug('context', context);
            log.debug('parameters', context.request.parameters)
            let form = null;
            try {
                switch (context.request.method) {
                    case 'GET':
                        if (context.request.parameters.hasOwnProperty('export')) {
                            log.debug('parameters', context.request.parameters);
                            const xlsFile = exportReport(context.request.parameters);
                            context.response.writeFile(xlsFile);
                        } else {
                            form = createForm();
                            context.response.writePage(form);
                        }

                        break;
                    case 'POST':
                        const startdate = context.request.parameters.custpage_startdate;
                        const enddate = context.request.parameters.custpage_enddate;
                        const customer = context.request.parameters.custpage_customer;
                        const docnumber = context.request.parameters.custpage_docnumber;
                        const percent = context.request.parameters.custpage_percent;
                        form = createResults(startdate, enddate, customer, docnumber, percent);
                        log.debug('form', form)
                        context.response.writePage({ pageObject: form });
                        break;
                }
            } catch (error) {
                log.error('onrequest error', error);
            }
        } //end onRequest


    return entry_point;

    function createForm() {
        let form = serverWidget.createForm({ title: 'HISTORIAL DE COBRANZA' });
        form.clientScriptModulePath = './bnd_cs_main.js';
        form.addTab({ id: 'custpage_maintab', label: 'HISTORIAL DE COBRANZA' });
        form.addFieldGroup({ id: 'custpage_fieldgroup', label: 'INGRESE DATOS', tab: 'custpage_maintab' });
        form.addSubmitButton('Generar');
        //FILTERS
        let startDateField = form.addField({ id: 'custpage_startdate', type: 'date', label: 'FECHA INICIAL', container: 'custpage_fieldgroup' });
        let endDateField = form.addField({ id: 'custpage_enddate', type: 'date', label: 'FECHA FINAL', container: 'custpage_fieldgroup' });
        let customerField = form.addField({ id: 'custpage_customer', type: 'select', label: 'CLIENTE', container: 'custpage_fieldgroup', source: 'customer' });
        let docNumberField = form.addField({ id: 'custpage_docnumber', type: 'select', label: 'NO DOCUMENTO', container: 'custpage_fieldgroup' });
        let percentField = form.addField({ id: 'custpage_percent', type: 'select', label: 'PORCENTAJE', container: 'custpage_fieldgroup' });
        percentField.addSelectOption({ value: '-1', text: '-Seleccione-' });
        percentField.addSelectOption({ value: '1', text: '0% - 50%' });
        percentField.addSelectOption({ value: '2', text: '50% - 80%' });
        percentField.addSelectOption({ value: '3', text: '80% - 100%' });
        startDateField.isMandatory = true;
        endDateField.isMandatory = true;
        return form
    }

    function createResults(startdate, enddate, customer, docnumber, percent) {
        let results = serverWidget.createList({ title: 'HISTORIAL DE COBRANZA' });
        results.clientScriptModulePath = './bnd_cs_main.js';
        results.addButton({ id: 'custpage_mainpage', label: 'Filtros', functionName: "mainpage" });
        results.addButton({ id: 'custpage_export', label: 'Exportar', functionName: 'exportReport("' + startdate + '", "' + enddate + '", "' + customer + '", "' + docnumber + '", "' + percent + '")' });
        results.addColumn({ id: 'custpage_customer', type: serverWidget.FieldType.TEXT, label: 'CLIENTE' });
        results.addColumn({ id: 'custpage_transaction', type: serverWidget.FieldType.TEXT, label: 'PAGO' });
        results.addColumn({ id: 'custpage_payment_date', type: serverWidget.FieldType.TEXT, label: 'FECHA PAGO' });
        results.addColumn({ id: 'custpage_payment_iscompensation', type: serverWidget.FieldType.TEXT, label: 'COMPENSACIÓN' });
        results.addColumn({ id: 'custpage_payment_nopagocliente', type: serverWidget.FieldType.TEXT, label: 'NO PAGO CLIENTE' });
        results.addColumn({ id: 'custpage_document_number', type: serverWidget.FieldType.URL, label: 'NÚMERO DE DOCUMENTO' }).setURL({ url: getBaseURL() }).addParamToURL({ param: 'invoiceid', value: 'custpage_document_id', dynamic: true });
        results.addColumn({ id: 'custpage_document_activities', type: serverWidget.FieldType.URL, label: 'ACTIVIDADES' }).setURL({ url: getBaseURL() }).addParamToURL({ param: 'invoiceidactivity', value: 'custpage_document_id', dynamic: true });
        results.addColumn({ id: 'custpage_uuid', type: serverWidget.FieldType.TEXT, label: 'UUID' });
        results.addColumn({ id: 'custpage_po_number', type: serverWidget.FieldType.TEXT, label: 'NÚMERO PEDIDO' });
        results.addColumn({ id: 'custpage_original_amount', type: serverWidget.FieldType.TEXT, label: 'VALOR ORIGINAL' });
        results.addColumn({ id: 'custpage_payed_amount', type: serverWidget.FieldType.TEXT, label: 'IMPORTE ABONADO' });
        results.addColumn({ id: 'custpage_total_payed_amount', type: serverWidget.FieldType.TEXT, label: 'IMPORTE TOTAL ABONADO' });
        results.addColumn({ id: 'custpage_balance', type: serverWidget.FieldType.TEXT, label: 'SALDO ACTUAL FACTURA' });
        results.addColumn({ id: 'custpage_balance_percent', type: serverWidget.FieldType.TEXT, label: '% DEUDA ACTUAL' });

        const reportLib = new libReport();
        let paymentsObj = reportLib.getCustomerPayments(startdate, enddate, customer, docnumber);
        let cont = 0;
        let dollarUS = formati.getCurrencyFormatter({ currency: 'USD' });

        for (let customerName in paymentsObj) {
            results.addRow({
                row: {
                    custpage_customer: customerName,
                    custpage_transaction: "",
                    custpage_payment_date: "",
                    custpage_payment_iscompensation: "",
                    custpage_payment_nopagocliente: "",
                    custpage_document_number: "",
                    custpage_document_activities: "",
                    custpage_uuid: "",
                    custpage_po_number: "",
                    custpage_original_amount: "",
                    custpage_payed_amount: "",
                    custpage_total_payed_amount: "",
                    custpage_balance: "",
                    custpage_balance_percent: ""
                }
            });
            cont++;
            log.debug('customer payments', paymentsObj[customerName]);
            let payments = paymentsObj[customerName]

            for (let payment in payments) {
                log.debug('payment', payments[payment])
                let payedAmount = Number(payments[payment].amount);
                if (payedAmount > 0) {
                    payedAmount = dollarUS.format({ number: payedAmount });
                } else {
                    payedAmount = dollarUS.format({ number: payedAmount });
                }

                let invoices = payments[payment].invoices;
                for (let inv in invoices) {
                    let percentaje = (Number(invoices[inv].invoiceamountremaining) / invoices[inv].invoiceamount) * 100;
                    let percentRangeMin = null;
                    let percentRangeMax = null;
                    if (percent != '-1') {
                        switch (percent) {
                            case '1':
                                percentRangeMin = 0;
                                percentRangeMax = 50;
                                break;
                            case '2':
                                percentRangeMin = 51;
                                percentRangeMax = 80;
                                break;
                            case '3':
                                percentRangeMin = 81;
                                percentRangeMax = 100;
                                break;
                        }
                        if (percentaje >= percentRangeMin && percentaje <= percentRangeMax) {
                            results.addRow({
                                custpage_customer: "",
                                custpage_transaction: payment,
                                custpage_payment_date: payments[payment].trandate,
                                custpage_payment_iscompensation: payments[payment].iscompensation ? 'SI' : 'NO',
                                custpage_payment_nopagocliente: payments[payment].nopagocliente,
                                custpage_document_number: "",
                                custpage_document_activities: "",
                                custpage_uuid: "",
                                custpage_po_number: "",
                                custpage_original_amount: "",
                                custpage_payed_amount: payedAmount,
                                custpage_total_payed_amount: "",
                                custpage_balance: "",
                                custpage_balance_percent: ""
                            });
                            break;
                        }
                    } else {
                        results.addRow({
                            custpage_customer: "",
                            custpage_transaction: payment,
                            custpage_payment_date: payments[payment].trandate,
                            custpage_payment_iscompensation: payments[payment].iscompensation ? 'SI' : 'NO',
                            custpage_payment_nopagocliente: payments[payment].nopagocliente,
                            custpage_document_number: "",
                            custpage_document_activities: "",
                            custpage_uuid: "",
                            custpage_po_number: "",
                            custpage_original_amount: "",
                            custpage_payed_amount: payedAmount,
                            custpage_total_payed_amount: "",
                            custpage_balance: "",
                            custpage_balance_percent: ""
                        });
                        break;
                    }
                }


                cont++;

                for (let invoice in invoices) {
                    log.debug('invoice', invoices[invoice]);
                    let invAmount = Number(invoices[invoice].invoiceamount);
                    let invRemaing = Number(invoices[invoice].invoiceamountremaining);
                    let amountPaid = Number(invoices[invoice].invoiceamountpaid);
                    let totalAmountPaid = Number(invoices[invoice].invoicetotalamountpaid)

                    invAmount = dollarUS.format({ number: invAmount });
                    totalAmountPaid = dollarUS.format({ number: totalAmountPaid });
                    invRemaing = dollarUS.format({ number: invRemaing });
                    amountPaid = dollarUS.format({ number: amountPaid });

                    let percentaje = (Number(invoices[invoice].invoiceamountremaining) / invoices[invoice].invoiceamount) * 100;
                    let percentRangeMin = null;
                    let percentRangeMax = null;
                    if (percent != '-1') {
                        switch (percent) {
                            case '1':
                                percentRangeMin = 0;
                                percentRangeMax = 50;
                                break;
                            case '2':
                                percentRangeMin = 51;
                                percentRangeMax = 80;
                                break;
                            case '3':
                                percentRangeMin = 81;
                                percentRangeMax = 100;
                                break;
                        }

                        if (percentaje >= percentRangeMin && percentaje <= percentRangeMax) {
                            results.addRow({
                                custpage_customer: "",
                                custpage_transaction: payment,
                                custpage_payment_date: payments[payment].trandate,
                                custpage_payment_iscompensation: payments[payment].iscompensation ? 'SI' : 'NO',
                                custpage_payment_nopagocliente: payments[payment].nopagocliente,
                                custpage_document_number: invoices[invoice].invoicenumber,
                                custpage_document_activities: "VER ACTIVIDADES",
                                custpage_document_id: invoices[invoice].invoiceId,
                                custpage_uuid: invoices[invoice].invoiceuuid || null,
                                custpage_po_number: invoices[invoice].invoicepo || null,
                                custpage_original_amount: invAmount,
                                custpage_payed_amount: amountPaid,
                                custpage_total_payed_amount: totalAmountPaid,
                                custpage_balance: invRemaing,
                                custpage_balance_percent: percentaje.toFixed(2) + "%"
                            });
                        }
                    } else {
                        results.addRow({
                            custpage_customer: "",
                            custpage_transaction: payment,
                            custpage_payment_date: payments[payment].trandate,
                            custpage_payment_iscompensation: payments[payment].iscompensation ? 'SI' : 'NO',
                            custpage_payment_nopagocliente: payments[payment].nopagocliente,
                            custpage_document_number: invoices[invoice].invoicenumber,
                            custpage_document_activities: "VER ACTIVIDADES",
                            custpage_document_id: invoices[invoice].invoiceId,
                            custpage_uuid: invoices[invoice].invoiceuuid || null,
                            custpage_po_number: invoices[invoice].invoicepo || null,
                            custpage_original_amount: invAmount,
                            custpage_payed_amount: amountPaid,
                            custpage_total_payed_amount: totalAmountPaid,
                            custpage_balance: invRemaing,
                            custpage_balance_percent: percentaje.toFixed(2) + "%"
                        });
                    }
                    cont++
                }
            }

        }

        log.debug('results', results)

        return results;
    }

    function exportReport(parameters) {
        const reportLib = new libReport();
        let transactions = reportLib.getCustomerPayments(parameters.startdate, parameters.enddate, parameters.customer, parameters.docnumber);
        let base64 = encode.convert({
            string: getContents(transactions, parameters.percent),
            inputEncoding: encode.Encoding.UTF_8,
            outputEncoding: encode.Encoding.BASE_64
        });

        let fileName = parameters.startdate + '_to_' + parameters.enddate + 'historico_cobranza.xls';
        let fileXML = file.create({
            name: fileName,
            contents: base64,
            fileType: file.Type.EXCEL
        });
        return fileXML;
    }

    function getContents(paymentsObj, percent) {
        log.debug('percent', percent)
        let dollarUS = formati.getCurrencyFormatter({ currency: 'USD' });
        let xmlFile = '<?xml version="1.0"?>' +
            '<ss:Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ' +
            'xmlns:o="urn:schemas-microsoft-com:office:office" ' +
            'xmlns:x="urn:schemas-microsoft-com:office:excel" ' +
            'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ' +
            'xmlns:html="http://www.w3.org/TR/REC-html40">' +
            '<ss:Styles>' +
            '<ss:Style ss:ID="Default" ss:Name="Normal">' +
            '<ss:Alignment ss:Vertical="Bottom"/>' +
            '<ss:Borders/>' +
            '<ss:Font/>' +
            '<ss:Interior/>' +
            '<ss:NumberFormat/>' +
            '<ss:Protection/>' +
            '</ss:Style>' +
            '<ss:Style ss:ID="s8">' +
            '<ss:Alignment ss:Horizontal="Center" ss:Vertical="Bottom"/>' +
            '<ss:Font x:Family="Swiss" ss:Size="10" ss:Bold="1"/>' +
            '</ss:Style>' +
            '</ss:Styles>' +
            '<ss:Worksheet ss:Name="historicocobranza">' +
            '<ss:Table>' +
            '<ss:Row ss:StyleID="s8">' +
            '<ss:Cell>' +
            '<ss:Data ss:Type="String">CLIENTE</ss:Data>' +
            '</ss:Cell>' +
            '<ss:Cell>' +
            '<ss:Data ss:Type="String">PAGO</ss:Data>' +
            '</ss:Cell>' +
            '<ss:Cell>' +
            '<ss:Data ss:Type="String">FECHA PAGO</ss:Data>' +
            '</ss:Cell>' +
            '<ss:Cell>' +
            '<ss:Data ss:Type="String">COMPENSACIÓN</ss:Data>' +
            '</ss:Cell>' +
            '<ss:Cell>' +
            '<ss:Data ss:Type="String">NO PAGO CLIENTE</ss:Data>' +
            '</ss:Cell>' +
            '<ss:Cell>' +
            '<ss:Data ss:Type="String">NÚMERO DE DOCUMENTO</ss:Data>' +
            '</ss:Cell>' +
            '<ss:Cell>' +
            '<ss:Data ss:Type="String">UUID</ss:Data>' +
            '</ss:Cell>' +
            '<ss:Cell>' +
            '<ss:Data ss:Type="String">NÚMERO DE PEDIDO</ss:Data>' +
            '</ss:Cell>' +
            '<ss:Cell>' +
            '<ss:Data ss:Type="String">VALOR ORIGINAL</ss:Data>' +
            '</ss:Cell>' +
            '<ss:Cell>' +
            '<ss:Data ss:Type="String">IMPORTE ABONADO</ss:Data>' +
            '</ss:Cell>' +
            '<ss:Cell>' +
            '<ss:Data ss:Type="String">SALDO ACTUAL</ss:Data>' +
            '</ss:Cell>' +
            '<ss:Cell>' +
            '<ss:Data ss:Type="String">% DEUDA ACTUAL</ss:Data>' +
            '</ss:Cell>' +
            '</ss:Row>';
        //Data rows start
        let cont = 0;
        for (let customerName in paymentsObj) {
            xmlFile += '<ss:Row>' +
                '<ss:Cell>' +
                '<ss:Data ss:Type="String">' + customerName + '</ss:Data>' +
                '</ss:Cell>' +
                '<ss:Cell>' +
                '<ss:Data ss:Type="String"></ss:Data>' +
                '</ss:Cell>' +
                '<ss:Cell>' +
                '<ss:Data ss:Type="String"></ss:Data>' +
                '</ss:Cell>' +
                '<ss:Cell>' +
                '<ss:Data ss:Type="String"></ss:Data>' +
                '</ss:Cell>' +
                '<ss:Cell>' +
                '<ss:Data ss:Type="String"></ss:Data>' +
                '</ss:Cell>' +
                '<ss:Cell>' +
                '<ss:Data ss:Type="String"></ss:Data>' +
                '</ss:Cell>' +
                '<ss:Cell>' +
                '<ss:Data ss:Type="String"></ss:Data>' +
                '</ss:Cell>' +
                '<ss:Cell>' +
                '<ss:Data ss:Type="String"></ss:Data>' +
                '</ss:Cell>' +
                '<ss:Cell>' +
                '<ss:Data ss:Type="String"></ss:Data>' +
                '</ss:Cell>' +
                '<ss:Cell>' +
                '<ss:Data ss:Type="String"></ss:Data>' +
                '</ss:Cell>' +
                '<ss:Cell>' +
                '<ss:Data ss:Type="String"></ss:Data>' +
                '</ss:Cell>' +
                '<ss:Cell>' +
                '<ss:Data ss:Type="String"></ss:Data>' +
                '</ss:Cell>' +
                '</ss:Row>';
            cont++;
            let payments = paymentsObj[customerName]
            for (let payment in payments) {
                let payedAmount = Number(payments[payment].amount);
                if (payedAmount > 0) {
                    payedAmount = dollarUS.format({ number: payedAmount });
                } else {
                    payedAmount = dollarUS.format({ number: payedAmount });
                }
                log.debug('payments[payment]', payments[payment])

                let invoices = payments[payment].invoices;

                for (let inv in invoices) {
                    let percentaje = (Number(invoices[inv].invoiceamountremaining) / invoices[inv].invoiceamount) * 100;
                    let percentRangeMin = null;
                    let percentRangeMax = null;

                    if (percent != '-1') {
                        switch (percent) {
                            case '1':
                                percentRangeMin = 0;
                                percentRangeMax = 50;
                                break;
                            case '2':
                                percentRangeMin = 51;
                                percentRangeMax = 80;
                                break;
                            case '3':
                                percentRangeMin = 81;
                                percentRangeMax = 100;
                                break;
                        }
                        if (percentaje >= percentRangeMin && percentaje <= percentRangeMax) {
                            let iscompen = payments[payment].iscompensation ? 'SI' : 'NO';
                            xmlFile += '<ss:Row>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String"></ss:Data>' +
                                '</ss:Cell>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String">' + payment + '</ss:Data>' +
                                '</ss:Cell>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String">' + payments[payment].trandate + '</ss:Data>' +
                                '</ss:Cell>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String">' + iscompen + '</ss:Data>' +
                                '</ss:Cell>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String">' + payments[payment].nopagocliente + '</ss:Data>' +
                                '</ss:Cell>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String"></ss:Data>' +
                                '</ss:Cell>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String"></ss:Data>' +
                                '</ss:Cell>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String"></ss:Data>' +
                                '</ss:Cell>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String">' + payments[payment].amount + '</ss:Data>' +
                                '</ss:Cell>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String"></ss:Data>' +
                                '</ss:Cell>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String"></ss:Data>' +
                                '</ss:Cell>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String"></ss:Data>' +
                                '</ss:Cell>' +
                                '</ss:Row>';
                            break;
                        }
                    } else {
                        let iscompen = payments[payment].iscompensation ? 'SI' : 'NO';
                        xmlFile += '<ss:Row>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String"></ss:Data>' +
                            '</ss:Cell>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String">' + payment + '</ss:Data>' +
                            '</ss:Cell>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String">' + payments[payment].trandate + '</ss:Data>' +
                            '</ss:Cell>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String">' + iscompen + '</ss:Data>' +
                            '</ss:Cell>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String">' + payments[payment].nopagocliente + '</ss:Data>' +
                            '</ss:Cell>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String"></ss:Data>' +
                            '</ss:Cell>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String"></ss:Data>' +
                            '</ss:Cell>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String"></ss:Data>' +
                            '</ss:Cell>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String">' + payments[payment].amount + '</ss:Data>' +
                            '</ss:Cell>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String"></ss:Data>' +
                            '</ss:Cell>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String"></ss:Data>' +
                            '</ss:Cell>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String"></ss:Data>' +
                            '</ss:Cell>' +
                            '</ss:Row>';
                        break;
                    }
                }

                cont++;

                for (let invoice in invoices) {

                    let invAmount = Number(invoices[invoice].invoiceamount);
                    let invRemaing = Number(invoices[invoice].invoiceamountremaining);
                    let amountPaid = Number(invoices[invoice].invoiceamountpaid);
                    let totalAmountPaid = Number(invoices[invoice].invoicetotalamountpaid)

                    invAmount = dollarUS.format({ number: invAmount });
                    totalAmountPaid = dollarUS.format({ number: totalAmountPaid });
                    invRemaing = dollarUS.format({ number: invRemaing });
                    amountPaid = dollarUS.format({ number: amountPaid });

                    let percentaje = (Number(invoices[invoice].invoiceamountremaining) / invoices[invoice].invoiceamount) * 100;
                    let percentRangeMin = null;
                    let percentRangeMax = null;

                    if (percent != '-1') {
                        switch (percent) {
                            case '1':
                                percentRangeMin = 0;
                                percentRangeMax = 50;
                                break;
                            case '2':
                                percentRangeMin = 51;
                                percentRangeMax = 80;
                                break;
                            case '3':
                                percentRangeMin = 81;
                                percentRangeMax = 100;
                                break;
                        }
                        if (percentaje >= percentRangeMin && percentaje <= percentRangeMax) {
                            let iscompen = payments[payment].iscompensation ? 'SI' : 'NO';
                            xmlFile += '<ss:Row>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String"></ss:Data>' +
                                '</ss:Cell>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String">' + payment + '</ss:Data>' +
                                '</ss:Cell>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String">' + payments[payment].trandate + '</ss:Data>' +
                                '</ss:Cell>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String">' + iscompen + '</ss:Data>' +
                                '</ss:Cell>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String">' + payments[payment].nopagocliente + '</ss:Data>' +
                                '</ss:Cell>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String">' + invoices[invoice].invoicenumber + '</ss:Data>' +
                                '</ss:Cell>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String">' + invoices[invoice].invoiceuuid + '</ss:Data>' +
                                '</ss:Cell>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String">' + invoices[invoice].invoicepo + '</ss:Data>' +
                                '</ss:Cell>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String">' + invAmount + '</ss:Data>' +
                                '</ss:Cell>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String">' + amountPaid + '</ss:Data>' +
                                '</ss:Cell>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String">' + invRemaing + '</ss:Data>' +
                                '</ss:Cell>' +
                                '<ss:Cell>' +
                                '<ss:Data ss:Type="String">' + percentaje.toFixed(2) + "%" + '</ss:Data>' +
                                '</ss:Cell>' +
                                '</ss:Row>';
                        }
                    } else {
                        let iscompen = payments[payment].iscompensation ? 'SI' : 'NO';
                        xmlFile += '<ss:Row>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String"></ss:Data>' +
                            '</ss:Cell>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String">' + payment + '</ss:Data>' +
                            '</ss:Cell>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String">' + payments[payment].trandate + '</ss:Data>' +
                            '</ss:Cell>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String">' + iscompen + '</ss:Data>' +
                            '</ss:Cell>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String">' + payments[payment].nopagocliente + '</ss:Data>' +
                            '</ss:Cell>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String">' + invoices[invoice].invoicenumber + '</ss:Data>' +
                            '</ss:Cell>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String">' + invoices[invoice].invoiceuuid + '</ss:Data>' +
                            '</ss:Cell>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String">' + invoices[invoice].invoicepo + '</ss:Data>' +
                            '</ss:Cell>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String">' + invAmount + '</ss:Data>' +
                            '</ss:Cell>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String">' + amountPaid + '</ss:Data>' +
                            '</ss:Cell>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String">' + invRemaing + '</ss:Data>' +
                            '</ss:Cell>' +
                            '<ss:Cell>' +
                            '<ss:Data ss:Type="String">' + percentaje.toFixed(2) + "%" + '</ss:Data>' +
                            '</ss:Cell>' +
                            '</ss:Row>';
                    }

                    cont++
                }
            }
        }

        //Data rows end
        xmlFile += '</ss:Table>' +
            '</ss:Worksheet>' +
            '</ss:Workbook>';

        log.debug('xmlString', xmlFile);
        return xmlFile;
    }

    function getBaseURL() {
        //let baseURL = url.resolveRecord({ recordType: 'invoice' });
        let baseURL = url.resolveScript({
            scriptId: 'customscript_bnd_sl_invodetails',
            deploymentId: 'customdeploy_bnd_sl_invodetails_1',
            returnExternalUrl: false
        });
        return baseURL;
    }

});