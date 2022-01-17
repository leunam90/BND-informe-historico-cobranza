/**
 * @author Manuel Cervera <manuel_cervera@outlook.com>
 * @Name bnd_sl_invoice_details.js
 * @description Suitelet with the details of an invoice transaction.
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/ui/serverWidget', 'N/format', 'N/format/i18n', 'N/record', 'N/search', './bnd_lb_lib_report'], function(serverWidget, format, formati, record, search, libReport) {
    const entry_point = {
        onRequest: null,

    };

    entry_point.onRequest = function(context) {
            log.debug('context', context);
            let method = context.request.method;
            let parameters = context.request.parameters;
            let form;
            switch (method) {
                case 'GET':
                    try {
                        log.debug('parameters', context.request.parameters);

                        if (parameters.hasOwnProperty('invoiceid')) {
                            form = createForm('payments', parameters.invoiceid);
                        } else if (parameters.hasOwnProperty('invoiceidactivity')) {
                            form = createForm('activities', parameters.invoiceidactivity);
                        }

                        context.response.writePage(form);
                    } catch (error) {
                        log.debug('error', error)
                    }
                    break;
                case 'POST':
                    break;
            }
        } //end onRequest


    return entry_point;

    function createForm(action, invoiceId) {
        try {
            let reportLib = new libReport();
            let dollarUS = formati.getCurrencyFormatter({ currency: 'USD' });
            let form = serverWidget.createForm({ title: 'DETALLE DE FACTURA' });
            form.addTab({ id: 'custpage_maintab', label: 'DETALLE DE FACTURA' });
            switch (action) {
                case 'payments':
                    let invoiceDetails = form.addSublist({ id: 'custpage_invoicedetails', type: serverWidget.SublistType.LIST, label: 'DETALLE DE FACTURAS', tab: 'custpage_maintab' });
                    invoiceDetails.addField({ id: 'custpage_payment', type: 'text', label: 'PAGO' });
                    invoiceDetails.addField({ id: 'custpage_type', type: 'text', label: 'TIPO' });
                    invoiceDetails.addField({ id: 'custpage_amount', type: 'text', label: 'IMPORTE' });
                    let details = reportLib.getInvoiceDetails(invoiceId);
                    log.debug('details', details)

                    if (details.length > 0) {
                        for (let i = 0; i < details.length; i++) {
                            let amount = dollarUS.format({ number: Number(details[i].amount) })
                            invoiceDetails.setSublistValue({ id: 'custpage_payment', value: details[i].payment, line: i });
                            invoiceDetails.setSublistValue({ id: 'custpage_type', value: details[i].type, line: i });
                            invoiceDetails.setSublistValue({ id: 'custpage_amount', value: amount, line: i });
                        }
                    }
                    break;
                case 'activities':
                    let taskList = form.addSublist({ id: 'custpage_tasks', type: serverWidget.SublistType.LIST, label: 'ACTIVIDADES/TAREAS', tab: 'custpage_maintab' });
                    taskList.addField({ id: 'custpage_title', type: 'text', label: 'TAREA' });
                    taskList.addField({ id: 'custpage_date', type: 'text', label: 'FECHA' });
                    taskList.addField({ id: 'custpage_owner', type: 'text', label: 'PROPIETARIO' });
                    taskList.addField({ id: 'custpage_status', type: 'text', label: 'STATUS' });
                    taskList.addField({ id: 'custpage_asigned_to', type: 'text', label: 'ASIGNADO A' });
                    taskList.addField({ id: 'custpage_type', type: 'text', label: 'TYPE' });
                    taskList.addField({ id: 'custpage_amount', type: 'text', label: 'IMPORTE' });

                    let tasks = reportLib.getTaskInvoice(invoiceId);
                    log.debug('tasks', tasks);
                    if (tasks.length > 0) {
                        for (let i = 0; i < tasks.length; i++) {
                            let amount = dollarUS.format({ number: Number(tasks[i].amount) });
                            taskList.setSublistValue({ id: 'custpage_title', value: tasks[i].title, line: i });
                            taskList.setSublistValue({ id: 'custpage_date', value: tasks[i].date, line: i });
                            taskList.setSublistValue({ id: 'custpage_owner', value: tasks[i].owner, line: i });
                            taskList.setSublistValue({ id: 'custpage_status', value: tasks[i].status, line: i });
                            taskList.setSublistValue({ id: 'custpage_asigned_to', value: tasks[i].assigned, line: i });
                            taskList.setSublistValue({ id: 'custpage_type', value: tasks[i].type, line: i });
                            taskList.setSublistValue({ id: 'custpage_amount', value: amount, line: i });
                        }
                    }

                    break;
            }




            return form;

        } catch (error) {
            log.error('error', error)
        }

    }
});