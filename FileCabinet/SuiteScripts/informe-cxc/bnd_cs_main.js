/**
 * @author Manuel Cervera <manuel_cervera@outlook.com>
 * @Name bnd_cs_main.js
 * @description Client Script that will help to handles some functions from suitelet.
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */

define(['N/url', './bnd_lb_lib_report'], (url, reportLib) => {
    const entry_point = {
        pageInit: null,
        exportReport: null,
        mainpage: null,
        saveRecord: null,
        fieldChanged: null
    };

    entry_point.pageInit = (context) => {
            // Autogenerated, do not edit. All changes will be undone.  
        } //end pageInit

    entry_point.mainpage = () => {
        const urlSuitelet = url.resolveScript({
            scriptId: 'customscript_bnd_sl_main',
            deploymentId: 'customdeploy_bnd_sl_main_1'
        });
        window.open(urlSuitelet)
    }

    entry_point.exportReport = (startDate, endDate, customer, docnumber, percent) => {

        const urlSuitelet = url.resolveScript({
            scriptId: 'customscript_bnd_sl_main',
            deploymentId: 'customdeploy_bnd_sl_main_1'
        });

        window.open(urlSuitelet + '&export=true&startdate=' + startDate + '&enddate=' + endDate + '&customer=' + customer + '&docnumber=' + docnumber + '&percent=' + percent, '_blank');

    }

    entry_point.saveRecord = (context) => {
        console.log('context save record', context);
        let startdate = context.currentRecord.getText({ fieldId: 'custpage_startdate' });
        let enddate = context.currentRecord.getText({ fieldId: 'custpage_enddate' });

        if (!startdate && !enddate) {
            alert("Por favor, seleccione una fecha de inicio y una fecha de fin");
            return false;
        }
        return true;
    }

    entry_point.fieldChanged = (context) => {
        const currentRecord = context.currentRecord;
        const libReport = new reportLib();
        switch (context.fieldId) {
            case 'custpage_customer':
                try {
                    let idCustomer = currentRecord.getValue({ fieldId: 'custpage_customer' });
                    let startdate = currentRecord.getText({ fieldId: 'custpage_startdate' });
                    let enddate = currentRecord.getText({ fieldId: 'custpage_enddate' });

                    console.log('start', startdate);
                    console.log('end', enddate)
                    let transactions = libReport.getInvoicesByCustomer(idCustomer, startdate, enddate);
                    console.log('transactions', transactions);
                    let docNumber = currentRecord.getField('custpage_docnumber');
                    docNumber.removeSelectOption({ value: null });
                    docNumber.insertSelectOption({ value: '-1', text: '-Seleccione-' });
                    for (let i = 0; i < transactions.length; i++) {
                        docNumber.insertSelectOption({ value: transactions[i].internalid, text: transactions[i].tranname });
                    }
                } catch (error) {
                    console.log('error', error)
                }
                break;
        }
    }


    return entry_point;
    /* 
     * Your code here
     */
});