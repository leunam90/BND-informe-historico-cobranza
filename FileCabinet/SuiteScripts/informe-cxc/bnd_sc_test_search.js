/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/record', 'N/search', 'N/runtime', './bnd_lb_lib_report'],
    /**
     * @param{record} record
     * @param{search} search
     */
    (record, search, runtime, libReport) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            const reportLib = new libReport();
            let paymentsObj = reportLib.getCustomerPayments("01/01/2019", "23/06/2022", 233, "-1");

            log.debug('payments', paymentsObj);
        }

        return { execute }

    });