/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MAP YIL BRS Revoke Transactions
 * File Name: MAP_YIL_revoke_transactions.js
 * Created On: 26/07/2023
 * Modified On:
 * Created By: (Yantra Inc.)
 * Modified By:
 * Description: Revoke Transaction
 *********************************************************** */
// GetInputData : 10000 Units
// Map : 1000 Units
// Reduce : 5000 Units
// Summary : 10000 Units
define(['N/record', 'N/search', 'N/runtime', 'N/email', 'N/format', 'N/file', 'N/task', './LIB_YIL_Bank_Reco_Suite_Process'],

    function(record, search, runtime, email, format, file, task, LIB) {

        function getInputData(context) {
            try {
                var o_contextOBJ = runtime.getCurrentScript();

                try {

                    var jsonData = JSON.parse(o_contextOBJ.getParameter({
                        name: 'custscript_yil_brs_gl_brs_data'
                    }));
                    return jsonData;

                } catch (ewqd) {
                    log.error('Input| ERROR', 'r Exception WQ -->' + ewqd);
                }

            } catch (ex) {
                log.error("ERROR", 'Input error Exception ' + ex);
            }

        }

        function map(context) {
            try {
                // 12773
                //log.debug("---Map-----");

                var key = context.key
                // log.debug("map", 'key -->'+key);

                var value = JSON.parse(context.value);
                //log.debug("map | value", value);

                var recordType = value.recordType;
                var recordid = value.recordid;
                log.debug("map", 'recordType -->' + recordType);

                if (recordType == 'customrecord_yil_brs_bank_statement') {
                    // Get Bank Statement Record
                    var o_bsRec = record.load({
                        type: 'customrecord_yil_brs_bank_statement',
                        id: recordid
                    });
                    o_bsRec.getValue("custrecord_yil_b_b_amount")
                    o_bsRec.getValue("custrecord_yil_brs_bs_manu_reco_amt")
                    var bsCreAmt = o_bsRec.getValue("custrecord_yil_b_b_ns_bank_amount");
                    var bsDebAmt = o_bsRec.getValue("custrecord_yil_b_b_ns_bank_amount_credit");
                    var bsDueAmt = 0
                    if (bsCreAmt)
                        bsDueAmt = bsCreAmt;

                    if (bsDebAmt)
                        bsDueAmt = bsDebAmt;
                    log.debug("bsDueAmt", bsDueAmt)
                    var i_refIds = o_bsRec.getValue("custrecord_yil_b_b_gl_reconciled");
                    log.debug("i_refIds", i_refIds)
                    for (var gl in i_refIds) {
                        // Get GL Data from Bank Statement.
                        log.debug("i_refIds >> " + gl, i_refIds[gl])
                        var o_glRec = record.load({
                            type: 'customrecord_yil_brs_ns_gl_data',
                            id: i_refIds[gl]
                        });

                        var glCreAmt = o_glRec.getValue("custrecord_yil_brs_ns_gl_data_gl_amount");
                        var glDebAmt = o_glRec.getValue("custrecord_yil_brs_ns_gl_data_gl_credit_");

                        var gldue_amt = 0;

                        if (glCreAmt)
                            gldue_amt = glCreAmt;

                        if (glDebAmt)
                            gldue_amt = glDebAmt;

                        log.debug("gldue_amt", gldue_amt)

                        o_glRec.setValue("custrecord_yil_brs_gl_data_post_reco_", '')
                        o_glRec.setValue("custrecord_yil_brs_ns_gl_data_recoremark", '')
                        o_glRec.setValue("custrecord_yil_brs_gl_data_reco_datetime", '')
                        o_glRec.setValue("custrecord_yil_brs_gl_data_a_m_status", '')
                        o_glRec.setValue("custrecord_yil_brs_gl_data_remarks_st", '')
                        o_glRec.setValue("custrecord_yil_brs_ns_gl_data_status", '')
                        o_glRec.setValue("custrecord_yil_brs_g_gl_data", '')
                        o_glRec.setValue("custrecord_yil_g_g_due_amount", gldue_amt);
                        o_glRec.save();
                    }

                    o_bsRec.setValue('custrecord_yil_b_b_ns_post_reco_primary_', '');
                    o_bsRec.setValue('custrecord_yil_brs_bs_auto_rec_amt', '');
                    o_bsRec.setValue('custrecord_yil_b_b_ns_status', '');
                    o_bsRec.setValue('custrecord_yil_brs_bs_a_m_status', '');
                    o_bsRec.setValue('custrecord_yil_b_b_gl_reconciled', '');
                    o_bsRec.setValue('custrecord_yil_b_b_reco_datetime', '');
                    o_bsRec.setValue('custrecord_yil_b_b_reconciled_amount_', '');
                    o_bsRec.setValue('custrecord_yil_b_b_reconciled_remarks', '');
                    o_bsRec.setValue('custrecord_yil_b_b_amount', bsDueAmt);
                    o_bsRec.save();

                }

                if (recordType == 'customrecord_yil_brs_ns_gl_data') {

                    // GL Data Record
                    var o_glRec = record.load({
                        type: 'customrecord_yil_brs_ns_gl_data',
                        id: recordid
                    });
                    var glCreAmt = o_glRec.getValue("custrecord_yil_brs_ns_gl_data_gl_amount");
                    var glDebAmt = o_glRec.getValue("custrecord_yil_brs_ns_gl_data_gl_credit_");

                    var gldue_amt = 0;

                    if (glCreAmt)
                        gldue_amt = glCreAmt;

                    if (glDebAmt)
                        gldue_amt = glDebAmt;

                    log.debug("gldue_amt", gldue_amt)

                    o_glRec.setValue("custrecord_yil_brs_gl_data_post_reco_", '')
                    o_glRec.setValue("custrecord_yil_brs_ns_gl_data_recoremark", '')
                    o_glRec.setValue("custrecord_yil_brs_gl_data_reco_datetime", '')
                    o_glRec.setValue("custrecord_yil_brs_gl_data_a_m_status", '')
                    o_glRec.setValue("custrecord_yil_brs_gl_data_remarks_st", '')
                    o_glRec.setValue("custrecord_yil_brs_ns_gl_data_status", '')

                    o_glRec.setValue("custrecord_yil_g_g_due_amount", gldue_amt)
                    var i_refIds = o_glRec.getValue("custrecord_yil_brs_g_gl_data");
                    log.debug("i_refIds", i_refIds)
                    for (var gl in i_refIds) {
                        // Get Bank Statement record from GL Data
                        log.debug("i_refIds >> " + gl, i_refIds[gl])
                        var o_bsRec = record.load({
                            type: 'customrecord_yil_brs_bank_statement',
                            id: i_refIds[gl]
                        });

                        var bsCreAmt = o_bsRec.getValue("custrecord_yil_b_b_ns_bank_amount");
                        var bsDebAmt = o_bsRec.getValue("custrecord_yil_b_b_ns_bank_amount_credit");
                        var bsDueAmt = 0
                        if (bsCreAmt)
                            bsDueAmt = bsCreAmt;

                        if (bsDebAmt)
                            bsDueAmt = bsDebAmt;
                        log.debug("bsDueAmt", bsDueAmt)

                        o_bsRec.setValue('custrecord_yil_b_b_ns_post_reco_primary_', '');
                        o_bsRec.setValue('custrecord_yil_brs_bs_auto_rec_amt', '');
                        o_bsRec.setValue('custrecord_yil_b_b_ns_status', '');
                        o_bsRec.setValue('custrecord_yil_brs_bs_a_m_status', '');
                        o_bsRec.setValue('custrecord_yil_b_b_gl_reconciled', '');
                        o_bsRec.setValue('custrecord_yil_b_b_reco_datetime', '');
                        o_bsRec.setValue('custrecord_yil_b_b_reconciled_amount_', '');
                        o_bsRec.setValue('custrecord_yil_b_b_reconciled_remarks', '');
                        o_bsRec.setValue('custrecord_yil_b_b_amount', bsDueAmt);

                        o_bsRec.save();
                    }
                    o_glRec.setValue("custrecord_yil_brs_g_gl_data", '')
                    o_glRec.save();

                }

                //return false;
            } catch (ex) {
                log.error('map error: ', ex.message);
            }
        }

        function reduce(context) {

            try {

                //log.debug("----------");

                log.debug('-*-reduce-*-', '****** AR_INV_NP context.values *******' + JSON.stringify(context.values))

                var key_ = context.key;
                var values_ = context.values;

                values_ = JSON.parse(values_[0]);

                log.debug("reduce", "key_ -->" + key_ + " Length " + values_.length);
                // log.debug("reduce","values_ -->" + values_);
                //log.debug("reduce","values_ L -->" + values_.length);

                var TIMESTAMP = new Date();
                TIMESTAMP = TIMESTAMP.getTime();

                context.write({
                    key: context.key,
                    value: context.values.length
                });

            } catch (ex) {
                log.error('reduce error: ', ex.message);
            }

        }

        function summarize(summary) {

            var type = summary.toString();
            log.debug(type + ' Usage Consumed', summary.usage);
            log.debug(type + ' Concurrency parseFloat ', summary.concurrency);
            log.debug(type + ' parseFloat of Yields', summary.yields);

           

        }
        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });