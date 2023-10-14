/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/https', 'N/record', 'N/runtime', 'N/search', './bnd_lb_lib_report', 'N/format', 'N/format/i18n'],
    /**
 * @param{https} https
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
    (https, record, runtime, search, libReport, format, formati) => {
        const PARENTRECORD = 'custscript_bnd_sc_parent_record';
        const RECORDLINES = 'customrecord_historico_cobranza_lineas';
        const RECORDHISTORIC = 'customrecord_bnd_historial_cobranza';
        const HISTORICSUBLIST = 'recmachcustrecord_reporte';
        const STARTDATE = 'custscript_sc_historic_startdate';
        const ENDDATE = 'custscript_sc_historic_enddate';
        const CUSTOMER = 'custscript_sc_historic_customer';
        const DOCUMENT_NUMBER = 'custscript_sc_historic_docnumber';
        const PERCENT = 'custscript_sc_historic_percent';
        const NUMERO_PAGO_CLIENTE = 'custscript_sc_historic_nopagocliente';
        const NUMERO_PAGO_NETSUITE = 'custscript_sc_historic_nopagonetsuite';

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            const reportLib = new libReport();
            let newRecordId = runtime.getCurrentScript().getParameter({ name: PARENTRECORD });
            let startdate = runtime.getCurrentScript().getParameter({ name: STARTDATE });
            let enddate = runtime.getCurrentScript().getParameter({ name: ENDDATE });
            let customer = runtime.getCurrentScript().getParameter({ name: CUSTOMER });
            let docnumber = runtime.getCurrentScript().getParameter({ name: DOCUMENT_NUMBER });
            let nocustpayment = runtime.getCurrentScript().getParameter({ name: NUMERO_PAGO_CLIENTE });
            let nocustpaymentns = runtime.getCurrentScript().getParameter({ name: NUMERO_PAGO_NETSUITE });
            let percent = runtime.getCurrentScript().getParameter({ name: PERCENT });
            try {
                let newRecord = record.load({
                    type: RECORDHISTORIC,
                    id: newRecordId,
                    isDynamic: true
                })

                let paymentsObj = reportLib.getCustomerPayments(startdate, enddate, customer, docnumber, nocustpayment, nocustpaymentns);
                log.debug('paymentsObj', paymentsObj);

                let cont = 0;
                let dollarUS = formati.getCurrencyFormatter({ currency: 'USD' });

                for (let customerName in paymentsObj) {
                    newRecord.selectNewLine({ sublistId: HISTORICSUBLIST });
                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_cliente', value: customerName });
                    newRecord.commitLine({ sublistId: HISTORICSUBLIST });
                    cont++;
                    let payments = paymentsObj[customerName]

                    for (let payment in payments) {
                        //log.debug('payment', payments[payment])
                        let payedAmount = Number(payments[payment].amount);
                        if (payedAmount > 0) {
                            payedAmount = dollarUS.format({ number: payedAmount });
                        } else {
                            payedAmount = dollarUS.format({ number: payedAmount });
                        }

                        let invoices = payments[payment].invoices;
                        for (let inv in invoices) {
                            let percentaje = (Number(invoices[inv].invoiceamountremaining) / invoices[inv].invoiceamount) * 100;
                            let percentRangeMax = null;
                            if (percent != '-1') {
                                switch (percent) {
                                    case '1':
                                        percentRangeMax = 10;
                                        break;
                                    case '2':
                                        percentRangeMax = 25;
                                        break;
                                    case '3':
                                        percentRangeMax = 50;
                                        break;
                                    case '4':
                                        percentRangeMax = 75;
                                        break;
                                    case '5':
                                        percentRangeMax = 100;
                                        break;
                                }
                                if (percentaje <= percentRangeMax) {
                                    newRecord.selectNewLine({ sublistId: HISTORICSUBLIST });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_cliente', value: customerName });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_no_pago_cliente', value: payments[payment].nopagocliente });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_pago', value: payment });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_fecha_pago', value: payments[payment].trandate });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_compensacion', value: payments[payment].iscompensation ? 'SI' : 'NO' });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_payed_amount', value: payedAmount });
                                    newRecord.commitLine({ sublistId: HISTORICSUBLIST });
                                    break;
                                }
                            } else {
                                newRecord.selectNewLine({ sublistId: HISTORICSUBLIST });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_cliente', value: customerName });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_no_pago_cliente', value: payments[payment].nopagocliente });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_pago', value: payment });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_fecha_pago', value: payments[payment].trandate });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_compensacion', value: payments[payment].iscompensation ? 'SI' : 'NO' });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_payed_amount', value: payedAmount });
                                newRecord.commitLine({ sublistId: HISTORICSUBLIST });
                                break;
                            }
                        }


                        cont++;

                        for (let invoice in invoices) {
                            //log.debug('invoice', invoices[invoice]);
                            let invAmount = Number(invoices[invoice].invoiceamount);
                            let invRemaing = Number(invoices[invoice].invoiceamountremaining);
                            let amountPaid = Number(invoices[invoice].invoiceamountpaid);
                            let totalAmountPaid = Number(invoices[invoice].invoicetotalamountpaid);
                            let grossProfit = Number(invoices[invoice].estgrossprofit);

                            invAmount = dollarUS.format({ number: invAmount });
                            totalAmountPaid = dollarUS.format({ number: totalAmountPaid });
                            invRemaing = dollarUS.format({ number: invRemaing });
                            amountPaid = dollarUS.format({ number: amountPaid });
                            grossProfit = dollarUS.format({ number: grossProfit });

                            let percentaje = (Number(invoices[invoice].invoiceamountremaining) / invoices[invoice].invoiceamount) * 100;
                            let percentRangeMax = null;
                            if (percent != '-1') {
                                switch (percent) {
                                    case '1':
                                        percentRangeMax = 10;
                                        break;
                                    case '2':
                                        percentRangeMax = 25;
                                        break;
                                    case '3':
                                        percentRangeMax = 50;
                                        break;
                                    case '4':
                                        percentRangeMax = 75;
                                        break;
                                    case '5':
                                        percentRangeMax = 100;
                                        break;
                                }

                                if (percentaje <= percentRangeMax) {
                                    newRecord.selectNewLine({ sublistId: HISTORICSUBLIST });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_cliente', value: customerName });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_no_pago_cliente', value: payments[payment].nopagocliente });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_pago', value: payment });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_fecha_pago', value: payments[payment].trandate });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_compensacion', value: payments[payment].iscompensation ? 'SI' : 'NO' });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_document_number', value: '<a href="/app/site/hosting/scriptlet.nl?script=129&deploy=1&invoiceid=' + invoices[invoice].invoiceId + '" target="_blank">' + (invoices[invoice].invoicenumber).split("#")[1] + '</a>' });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_document_activities', value: '<a href="/app/site/hosting/scriptlet.nl?script=129&deploy=1&invoiceidactivity=' + invoices[invoice].invoiceId + '" target="_blank">VER ACTIVIDADES</a>' });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_uuid', value: invoices[invoice].invoiceuuid || null });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_po_number', value: invoices[invoice].invoicepo || null });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_original_amount', value: invAmount });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_payed_amount', value: payments[payment].iscompensation ? 'SI' : 'NO' });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_compensacion', value: payments[payment].iscompensation ? 'SI' : 'NO' });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_compensacion', value: payments[payment].iscompensation ? 'SI' : 'NO' });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_payed_amount', value: payedAmount });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_payed_amount', value: payedAmount });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_total_payed_amount', value: totalAmountPaid });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_balance', value: invRemaing });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_balance_percent', value: percentaje.toFixed(2) + "%" });
                                    newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_gross_profit', value: grossProfit });
                                    newRecord.commitLine({ sublistId: HISTORICSUBLIST });
                                }
                            } else {
                                newRecord.selectNewLine({ sublistId: HISTORICSUBLIST });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_cliente', value: customerName });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_no_pago_cliente', value: payments[payment].nopagocliente });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_pago', value: payment });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_fecha_pago', value: payments[payment].trandate });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_compensacion', value: payments[payment].iscompensation ? 'SI' : 'NO' });
                                // newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_document_number', value: '<a href="/app/site/hosting/scriptlet.nl?script=129&deploy=1&invoiceid=' + invoices[invoice].invoiceId + '" target="_blank">' + (invoices[invoice].invoicenumber).split("#")[1] + '</a>' });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_document_number', value: (invoices[invoice].invoicenumber).split("#")[1] });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_document_details', value: 'https://5825789.app.netsuite.com/app/site/hosting/scriptlet.nl?script=129&deploy=1&invoiceid=' + invoices[invoice].invoiceId });
                                //log.debug('url', '<a href="/app/site/hosting/scriptlet.nl?script=129&deploy=1&invoiceid=' + invoices[invoice].invoiceId + '" target="_blank">' + (invoices[invoice].invoicenumber).split("#")[1] + '</a>')
                                // newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_document_activities', value: '<a href="/app/site/hosting/scriptlet.nl?script=129&deploy=1&invoiceidactivity=' + invoices[invoice].invoiceId + '" target="_blank">VER ACTIVIDADES</a>' });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_document_activities', value: 'https://5825789.app.netsuite.com/app/site/hosting/scriptlet.nl?script=129&deploy=1&invoiceidactivity=' + invoices[invoice].invoiceId });
                                //log.debug('url 2', '<a href="/app/site/hosting/scriptlet.nl?script=129&deploy=1&invoiceidactivity=' + invoices[invoice].invoiceId + '" target="_blank">VER ACTIVIDADES</a>');
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_uuid', value: invoices[invoice].invoiceuuid || null });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_po_number', value: invoices[invoice].invoicepo || null });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_original_amount', value: invAmount });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_payed_amount', value: payments[payment].iscompensation ? 'SI' : 'NO' });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_compensacion', value: payments[payment].iscompensation ? 'SI' : 'NO' });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_compensacion', value: payments[payment].iscompensation ? 'SI' : 'NO' });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_payed_amount', value: payedAmount });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_payed_amount', value: payedAmount });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_total_payed_amount', value: totalAmountPaid });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_balance', value: invRemaing });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_balance_percent', value: percentaje.toFixed(2) + "%" });
                                newRecord.setCurrentSublistValue({ sublistId: HISTORICSUBLIST, fieldId: 'custrecord_gross_profit', value: grossProfit });
                                newRecord.commitLine({ sublistId: HISTORICSUBLIST });
                            }
                            cont++
                        }
                    }

                }

                newRecord.setValue({ fieldId: 'custrecord_report_status', value: 2 })
                newRecord.save();
            } catch (error) {
                log.error('error', error);
                record.submitFields({
                    type: RECORDHISTORIC,
                    id: newRecordId,
                    values: {
                        custrecord_report_status: 3
                    }
                });
            }
        }

        return { execute }

    });
