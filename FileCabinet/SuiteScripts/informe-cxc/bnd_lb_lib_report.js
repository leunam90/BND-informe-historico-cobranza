/**
 * @author Manuel Cervera <>
 * @Name bnd_lb_lib_report.js
 * @description BANDANA Libs
 * @NApiVersion 2.1
 * @ModuleScope Public
 */

define(['N/search', 'N/runtime'], (search, runtime) => {
    return class BandanaLibs {
        constructor() {}

        getCustomerPayments(startDate, endDate, customer, docNumber, nocustpayment, nocustpaymentns, accountnumber) {
            let paymentsObj = {};
            let transaction = {};
            try {
                let filters = [
                    ["type", "anyof", "CustPymt", "CustCred"],
                    "AND", ["trandate", "within", startDate, endDate]
                ]
                if (nocustpayment) {
                    filters.push("AND");
                    filters.push(["custbody23", "startswith", nocustpayment]);
                }
                if (nocustpaymentns) {
                    filters.push("AND");
                    filters.push(["transactionnumbernumber", "equalto", nocustpaymentns]);
                }
                if (customer) {
                    filters.push("AND");
                    filters.push(["customermain.internalid", "anyof", customer]);
                }
                if (docNumber != '-1') {
                    filters.push("AND");
                    filters.push(["appliedtotransaction", "anyof", docNumber]);
                }
                if(accountnumber){
                    filters.push("AND");
                    filters.push(["account","anyof",accountnumber])
                }

                log.debug('filters', filters);

                let columns = [
                    "mainline", "trandate", "tranid", "amount", "customerMain.altname", "transactionnumber", "transactionname",
                    "appliedtotransaction", "appliedToTransaction.type", "appliedToTransaction.trandate", "appliedToTransaction.amount", "appliedToTransaction.amountpaid",
                    "appliedtolinkamount", "appliedToTransaction.amountremaining", "appliedToTransaction.custbody_be_uuid_sat",
                    "appliedToTransaction.otherrefnum", "custbody26", "custbody23", "appliedToTransaction.tranestgrossprofit"
                ];

                let paymentSearchObj = search.create({
                    type: "transaction",
                    filters,
                    columns
                }).runPaged({
                    pageSize: 1000
                });
                //let searchResultCount = paymentSearchObj.runPaged().count;
                //log.debug("vendorbillSearchObj result count", paymentSearchObj.pageRanges);
                //log.debug("vendorbillSearchObj result count", paymentSearchObj.pageRanges.length);
                paymentSearchObj.pageRanges.forEach((pageRange) => {
                    let currentPage = paymentSearchObj.fetch({ index: pageRange.index });
                    log.debug("vendorbillSearchObj result count", currentPage.data.length);
                    currentPage.data.forEach((currentRow) => {

                        let mainline = currentRow.getValue({ name: 'mainline' });
                        let customerName = currentRow.getValue({ name: 'altname', join: 'customerMain' });
                        let trandate = currentRow.getValue({ name: 'trandate' });
                        let transactionname = currentRow.getValue({ name: 'transactionname' });
                        let amount = currentRow.getValue({ name: 'amount' });
                        let appliedtotransaction = currentRow.getValue({ name: 'appliedtotransaction' });
                        let invoicenumber = currentRow.getText({ name: 'appliedtotransaction' });
                        let invoiceId = currentRow.getValue({ name: 'appliedtotransaction' });
                        let invoicetrandate = currentRow.getValue({ name: 'trandate', join: 'appliedToTransaction' });
                        let tranType = currentRow.getValue({ name: 'type', join: 'appliedToTransaction' });
                        let invoiceamount = currentRow.getValue({ name: 'amount', join: 'appliedToTransaction' });
                        let invoiceamountremaining = currentRow.getValue({ name: 'amountremaining', join: 'appliedToTransaction' });
                        let invoiceuuid = currentRow.getValue({ name: 'custbody_be_uuid_sat', join: 'appliedToTransaction' });
                        let invoiceamountpaid = currentRow.getValue({ name: 'appliedtolinkamount' });
                        let invoicetotalamountpaid = currentRow.getValue({ name: 'amountpaid', join: 'appliedToTransaction' });
                        let invoicepo = currentRow.getValue({ name: 'otherrefnum', join: 'appliedToTransaction' });
                        let iscompensation = currentRow.getValue({ name: 'custbody26' });
                        let nopagocliente = currentRow.getValue({ name: 'custbody23' });
                        let estgrossprofit = currentRow.getValue({ name: 'tranestgrossprofit', join: 'appliedToTransaction' });

                        if (mainline == '*') {
                            if (!paymentsObj.hasOwnProperty(customerName)) {
                                paymentsObj[customerName] = {};
                                paymentsObj[customerName][transactionname] = {
                                    transactionname,
                                    trandate,
                                    amount,
                                    iscompensation,
                                    nopagocliente,
                                    invoices: {}
                                };
                                if (appliedtotransaction && tranType == 'CustInvc' && invoiceamountpaid != "") {
                                    paymentsObj[customerName][transactionname].invoices[appliedtotransaction] = {
                                        appliedtotransaction,
                                        invoiceId,
                                        invoicenumber,
                                        invoicetrandate,
                                        invoiceamount,
                                        invoiceamountremaining,
                                        invoiceuuid,
                                        invoiceamountpaid,
                                        invoicetotalamountpaid,
                                        invoicepo,
                                        estgrossprofit
                                    }
                                }

                            } else {
                                if (!paymentsObj[customerName].hasOwnProperty(transactionname)) {
                                    paymentsObj[customerName][transactionname] = {
                                        transactionname,
                                        trandate,
                                        amount,
                                        iscompensation,
                                        nopagocliente,
                                        invoices: {}
                                    };
                                }

                                if (appliedtotransaction && tranType == 'CustInvc' && invoiceamountpaid != "") {
                                    paymentsObj[customerName][transactionname].invoices[appliedtotransaction] = {
                                        appliedtotransaction,
                                        invoiceId,
                                        invoicenumber,
                                        invoicetrandate,
                                        invoiceamount,
                                        invoiceamountremaining,
                                        invoiceuuid,
                                        invoiceamountpaid,
                                        invoicetotalamountpaid,
                                        invoicepo,
                                        estgrossprofit
                                    }
                                }
                            }
                        } else {
                            //log.debug('appliedtotransaction', appliedtotransaction)
                            if (!paymentsObj.hasOwnProperty(customerName)) {
                                paymentsObj[customerName] = {};
                                paymentsObj[customerName][transactionname] = {
                                    transactionname,
                                    trandate,
                                    amount,
                                    iscompensation,
                                    nopagocliente,
                                    invoices: {}
                                };
                                if (appliedtotransaction && tranType == 'CustInvc' && invoiceamountpaid != "") {
                                    paymentsObj[customerName][transactionname].invoices[appliedtotransaction] = {
                                        appliedtotransaction,
                                        invoiceId,
                                        invoicenumber,
                                        invoicetrandate,
                                        invoiceamount,
                                        invoiceamountremaining,
                                        invoiceuuid,
                                        invoiceamountpaid,
                                        invoicetotalamountpaid,
                                        invoicepo,
                                        estgrossprofit
                                    }
                                }
                            } else {

                                if (appliedtotransaction && tranType == 'CustInvc' && invoiceamountpaid != "") {
                                    paymentsObj[customerName][transactionname].invoices[appliedtotransaction] = {
                                        appliedtotransaction,
                                        invoiceId,
                                        invoicenumber,
                                        invoicetrandate,
                                        invoiceamount,
                                        invoiceamountremaining,
                                        invoiceuuid,
                                        invoiceamountpaid,
                                        invoicetotalamountpaid,
                                        invoicepo,
                                        estgrossprofit
                                    }
                                }
                            }

                        }

                        if (iscompensation) {
                            if (nopagocliente != "") {
                                this.getBillPayments(paymentsObj, nopagocliente);
                            }

                        }
                        //log.debug('paymntobj', paymentsObj);
                        let scriptObj = runtime.getCurrentScript();
                        //log.debug('remaining', scriptObj.getRemainingUsage())
                    });
                });
            } catch (error) {
                log.error('error', error);
            }

            log.debug('paymentsObj', paymentsObj);
            return paymentsObj;
        }

        getInvoiceDetails(invoiceId) {
            let details = [];
            let transactionSearchObj = search.create({
                type: "transaction",
                filters: [
                    ["internalid", "anyof", invoiceId],
                    "AND", ["mainline", "is", "T"]
                ],
                columns: ['transactionname', 'applyingtransaction', 'applyinglinktype', 'applyinglinkamount']
            }).runPaged({ pageSize: 1000 });
            transactionSearchObj.pageRanges.forEach((pageRange) => {
                let currentPage = transactionSearchObj.fetch({ index: pageRange.index });
                currentPage.data.forEach((currentRow) => {
                    log.debug('currentRow', currentRow)
                    let payment = currentRow.getText({ name: 'applyingtransaction' });
                    let type = currentRow.getText({ name: 'applyinglinktype' });
                    let amount = currentRow.getValue({ name: 'applyinglinkamount' });

                    if (payment && type && amount) {
                        let detail = {
                            payment,
                            type,
                            amount
                        };
                        details.push(detail);
                    }
                });
            });
            return details;
        }

        getTaskInvoice(invoiceId) {
            let tasks = [];
            let taskSearchObj = search.create({
                type: "task",
                filters: [
                    ["transaction.internalid", "anyof", invoiceId]
                ],
                columns: ['internalid', 'title', 'createddate', 'owner', 'status', 'assigned', 'custevent1', 'custevent2']
            }).runPaged({ pageSize: 1000 });
            let aux = null;
            taskSearchObj.pageRanges.forEach((pageRange) => {
                let currentPage = taskSearchObj.fetch({ index: pageRange.index });
                currentPage.data.forEach((currentRow) => {
                    log.debug('currentRow', currentRow)
                    let internalid = currentRow.getText({ name: 'internalid' });
                    let title = currentRow.getValue({ name: 'title' });
                    let date = currentRow.getValue({ name: 'createddate' });
                    let owner = currentRow.getText({ name: 'owner' });
                    let status = currentRow.getText({ name: 'status' });
                    let assigned = currentRow.getText({ name: 'assigned' });
                    let type = currentRow.getText({ name: 'custevent1' })
                    let amount = currentRow.getValue({ name: 'custevent2' });

                    if (internalid != aux) {
                        let task = {
                            title,
                            date,
                            owner,
                            status,
                            assigned,
                            type,
                            amount
                        };
                        tasks.push(task);
                        aux = internalid;
                    }
                });
            });

            return tasks;
        }

        getInvoicesByCustomer(idCustomer, startdate, enddate) {
            let invoicesArray = [];
            try {
                let invoiceSearchObj = search.create({
                    type: 'transaction',
                    filters: [
                        ["customermain.internalid", "anyof", idCustomer],
                        "AND", ["trandate", "within", startdate, enddate],
                        "AND", ["mainline", "is", "T"],
                        "AND", ["type", "anyof", "CustInvc"]
                    ],
                    columns: ['internalid', 'transactionname']
                }).runPaged({ pageSize: 1000 });
                invoiceSearchObj.pageRanges.forEach((pageRange) => {
                    let currentPage = invoiceSearchObj.fetch({ index: pageRange.index });
                    currentPage.data.forEach((currentRow) => {
                        log.debug('currentRow', currentRow)
                        let internalid = currentRow.getValue({ name: 'internalid' });
                        let tranname = currentRow.getValue({ name: 'transactionname' });
                        let transaction = {
                            internalid,
                            tranname
                        };
                        invoicesArray.push(transaction);
                    });
                });
                return invoicesArray;
            } catch (error) {
                log.error('error', error);
                return error;
            }
        }

        getBillPayments(paymentsObj, noPagoCliente) {
            let transaction = {};
            let filters = [
                ["custbody23", "contains", noPagoCliente],
                "AND", ["type", "anyof", "VendPymt"]
            ]

            let columns = [
                "mainline", "trandate", "tranid", "amount", "vendor.entityid", "transactionnumber", "transactionname",
                "appliedtotransaction", "appliedToTransaction.type", "appliedToTransaction.trandate", "appliedToTransaction.amount", "appliedToTransaction.amountpaid",
                "appliedtolinkamount", "appliedToTransaction.amountremaining", "appliedToTransaction.custbody_be_uuid_sat",
                "appliedToTransaction.otherrefnum", "custbody26", "custbody23", "estgrossprofit"
            ];

            let paymentSearchObj = search.create({
                type: "transaction",
                filters,
                columns
            }).runPaged({
                pageSize: 1000
            });
            paymentSearchObj.pageRanges.forEach((pageRange) => {
                let currentPage = paymentSearchObj.fetch({ index: pageRange.index });
                currentPage.data.forEach((currentRow) => {
                    let mainline = currentRow.getValue({ name: 'mainline' });
                    let customerName = currentRow.getValue({ name: 'entityid', join: 'vendor' });
                    let trandate = currentRow.getValue({ name: 'trandate' });
                    let transactionname = currentRow.getValue({ name: 'transactionname' });
                    let amount = currentRow.getValue({ name: 'amount' });
                    let appliedtotransaction = currentRow.getValue({ name: 'appliedtotransaction' });
                    let invoicenumber = currentRow.getText({ name: 'appliedtotransaction' });
                    let invoiceId = currentRow.getValue({ name: 'appliedtotransaction' });
                    let invoicetrandate = currentRow.getValue({ name: 'trandate', join: 'appliedToTransaction' });
                    let tranType = currentRow.getValue({ name: 'type', join: 'appliedToTransaction' });
                    let invoiceamount = currentRow.getValue({ name: 'amount', join: 'appliedToTransaction' });
                    let invoiceamountremaining = currentRow.getValue({ name: 'amountremaining', join: 'appliedToTransaction' });
                    let invoiceuuid = currentRow.getValue({ name: 'custbody_be_uuid_sat', join: 'appliedToTransaction' });
                    let invoiceamountpaid = currentRow.getValue({ name: 'appliedtolinkamount' });
                    let invoicetotalamountpaid = currentRow.getValue({ name: 'amountpaid', join: 'appliedToTransaction' });
                    let invoicepo = currentRow.getValue({ name: 'otherrefnum', join: 'appliedToTransaction' });
                    let iscompensation = currentRow.getValue({ name: 'custbody26' });
                    let nopagocliente = currentRow.getValue({ name: 'custbody23' });
                    let estgrossprofit = currentRow.getValue({ name: 'estgrossprofit' });

                    if (mainline == '*') {
                        if (!paymentsObj.hasOwnProperty(customerName)) {
                            paymentsObj[customerName] = {};
                            paymentsObj[customerName][transactionname] = {
                                transactionname,
                                trandate,
                                amount,
                                iscompensation,
                                nopagocliente,
                                invoices: {}
                            };
                            if (appliedtotransaction && tranType == 'VendBill') {
                                paymentsObj[customerName][transactionname]['invoices'][appliedtotransaction] = {
                                    appliedtotransaction,
                                    invoiceId,
                                    invoicenumber,
                                    invoicetrandate,
                                    invoiceamount,
                                    invoiceamountremaining,
                                    invoiceuuid,
                                    invoiceamountpaid,
                                    invoicetotalamountpaid,
                                    invoicepo,
                                    estgrossprofit
                                }
                            }

                        } else {
                            paymentsObj[customerName][transactionname] = {
                                transactionname,
                                trandate,
                                amount,
                                iscompensation,
                                nopagocliente,
                                invoices: {}
                            };
                            if (appliedtotransaction && tranType == 'VendBill') {
                                paymentsObj[customerName][transactionname]['invoices'][appliedtotransaction] = {
                                    appliedtotransaction,
                                    invoiceId,
                                    invoicenumber,
                                    invoicetrandate,
                                    invoiceamount,
                                    invoiceamountremaining,
                                    invoiceuuid,
                                    invoiceamountpaid,
                                    invoicetotalamountpaid,
                                    invoicepo,
                                    estgrossprofit
                                }
                            }
                        }
                    } else {
                        //log.debug('appliedtotransaction', appliedtotransaction)
                        if (!paymentsObj.hasOwnProperty(customerName)) {
                            paymentsObj[customerName] = {};
                            paymentsObj[customerName][transactionname] = {
                                transactionname,
                                trandate,
                                amount,
                                iscompensation,
                                nopagocliente,
                                invoices: {}
                            };
                            if (appliedtotransaction && tranType == 'VendBill') {
                                paymentsObj[customerName][transactionname]['invoices'][appliedtotransaction] = {
                                    appliedtotransaction,
                                    invoiceId,
                                    invoicenumber,
                                    invoicetrandate,
                                    invoiceamount,
                                    invoiceamountremaining,
                                    invoiceuuid,
                                    invoiceamountpaid,
                                    invoicetotalamountpaid,
                                    invoicepo,
                                    estgrossprofit
                                }
                            }
                        } else {
                            if (appliedtotransaction && tranType == 'VendBill') {
                                paymentsObj[customerName][transactionname]['invoices'][appliedtotransaction] = {
                                    appliedtotransaction,
                                    invoiceId,
                                    invoicenumber,
                                    invoicetrandate,
                                    invoiceamount,
                                    invoiceamountremaining,
                                    invoiceuuid,
                                    invoiceamountpaid,
                                    invoicetotalamountpaid,
                                    invoicepo,
                                    estgrossprofit
                                }
                            }
                        }

                    }
                });
            });

            //log.debug('paymentsObj', paymentsObj);
            return paymentsObj;
        }
    }
})