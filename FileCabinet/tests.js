require(['N/search'], function(search) {

    function getCustomerPayments(startDate, endDate, customer, docNumber) {
        let paymentsObj = {};
        let transaction = {};
        let filters = [
            ["type", "anyof", "CustPymt", "CustCred"],
            "AND", ["trandate", "within", startDate, endDate]
        ]
        if (customer) {
            filters.push("AND");
            filters.push(["customermain.internalid", "anyof", customer]);
        }
        if (docNumber != '-1') {
            filters.push("AND");
            filters.push(["appliedtotransaction", "anyof", docNumber]);
        }

        let columns = [
            "mainline", "trandate", "tranid", "amount", "customerMain.altname", "transactionnumber", "transactionname",
            "appliedtotransaction", "appliedToTransaction.type", "appliedToTransaction.trandate", "appliedToTransaction.amount", "appliedToTransaction.amountpaid",
            "appliedtolinkamount", "appliedToTransaction.amountremaining", "appliedToTransaction.custbody_be_uuid_sat",
            "appliedToTransaction.otherrefnum", "custbody26", "custbody23"
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
                //log.debug('currentRow', currentRow)
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
                        if (appliedtotransaction && tranType == 'CustInvc') {
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
                                invoicepo
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
                        if (appliedtotransaction && tranType == 'CustInvc') {
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
                                invoicepo
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
                        if (appliedtotransaction && tranType == 'CustInvc') {
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
                                invoicepo
                            }
                        }
                    } else {
                        if (appliedtotransaction && tranType == 'CustInvc') {
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
                                invoicepo
                            }
                        }
                    }

                }

                if (iscompensation) {
                    log.debug('iscompensation', iscompensation);
                    log.debug('nopagocliente', nopagocliente);
                    if (nopagocliente != "") {
                        getBillPayments(paymentsObj, nopagocliente);
                    }

                }
            });
        });

        log.debug('paymentsObj', paymentsObj);
        return paymentsObj;
    }

    function getBillPayments(paymentsObj, noPagoCliente) {
        let transaction = {};
        let filters = [
            ["custbody23", "contains", noPagoCliente],
            "AND", ["type", "anyof", "VendPymt"]
        ]

        let columns = [
            "mainline", "trandate", "tranid", "amount", "vendor.entityid", "transactionnumber", "transactionname",
            "appliedtotransaction", "appliedToTransaction.type", "appliedToTransaction.trandate", "appliedToTransaction.amount", "appliedToTransaction.amountpaid",
            "appliedtolinkamount", "appliedToTransaction.amountremaining", "appliedToTransaction.custbody_be_uuid_sat",
            "appliedToTransaction.otherrefnum", "custbody26", "custbody23"
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
                //log.debug('currentRow', currentRow)
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
                                invoicepo
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
                                invoicepo
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
                                invoicepo
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
                                invoicepo
                            }
                        }
                    }

                }
            });
        });

        log.debug('paymentsObj', paymentsObj);
        return paymentsObj;
    }


    const startdate = '01/11/2021';
    const enddate = '30/11/2021';
    const customer = '219';
    let result = getCustomerPayments(startdate, enddate, customer, '-1');

    log.debug('result', result);

});