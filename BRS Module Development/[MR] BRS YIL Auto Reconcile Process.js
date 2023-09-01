/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */

/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: [MR] BRS YIL Auto Reconcile Process
 * File Name: [MR] BRS YIL Auto Reconcile Process.js
 * Created On: 23/05/2023
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: BRS YIL Auto Reconcile Process
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

                    /* 'AND',
						['internalidnumber','greaterthan','18207'],
                            'AND',
                            ['internalid', 'is', '46392'],
							'AND',
                            ['internalid', 'is', '21387']	,'AND',
                            ['internalid', 'is', '202683']  */
                    var BRS_STATUS_JSON = LIB.BRS_STATUS();

                    var o_BS_Search_OBJ = search.create({
                        type: "customrecord_yil_brs_bank_statement",
                        filters: [
                            ["custrecord_yil_b_b_ns_status", "noneof", [BRS_STATUS_JSON["FL_REC"].status_id, BRS_STATUS_JSON["AT_REC"].status_id]]
							
                            /*,
                              'AND' ,
                              ["custrecord_yil_brs_bs_a_m_status", "noneof", [BRS_STATUS_JSON["FL_REC"].status_id, BRS_STATUS_JSON["AT_REC"].status_id]] */

                        ],
                        columns: [
                            search.createColumn({
                                name: "custrecord_yil_brs_bs_counter",
                                sort: search.Sort.ASC,
                                label: "Process Counter"
                            }),
                            search.createColumn({
                                name: "internalid"
                            }),
                            search.createColumn({
                                name: "name"
                            }),
                            search.createColumn({
                                name: "custrecord_yil_b_b_bank_amount"
                            }),
                            search.createColumn({
                                name: "custrecord_yil_b_b_ns_primary_key"
                            }),
                            search.createColumn({
                                name: "custrecord_yil_b_b_bank_date"
                            }),
                            search.createColumn({
                                name: "custrecord_yil_b_b_ns_bank_date"
                            }),
                            search.createColumn({
                                name: "custrecord_yil_b_b_bank_name"
                            }),
                            search.createColumn({
                                name: "custrecord_yil_b_b_current_date"
                            }),
                            search.createColumn({
                                name: "created"
                            }),
                            search.createColumn({
                                name: "custrecord_yil_b_b_amount"
                            }),
                            search.createColumn({
                                name: "custrecord_yil_b_b_journal_entry"
                            }),
                            search.createColumn({
                                name: "custrecord_yil_b_b_ns_bank_amount"
                            }),
                            search.createColumn({
                                name: "custrecord_yil_b_b_ns_current_date"
                            }),
                            search.createColumn({
                                name: "custrecord_yil_b_b_ns_bank_name"
                            }),
                            search.createColumn({
                                name: "custrecord_yil_b_b_post_reco_primary_key"
                            }),
                            search.createColumn({
                                name: "custrecord_yil_b_b_primary_key"
                            }),
                            search.createColumn({
                                name: "custrecord_yil_b_b_statement_date"
                            }),
                            search.createColumn({
                                name: "custrecord_yil_b_b_ns_bank_amount_credit"
                            })

                        ]
                    });

                    /*o_BS_Search_OBJ.run().each(function(result){
                       // .run().each has a limit of 4,000 results
                       return true;
                    });*/

                    /*  var custResultRange = [];
					//var resultSet = o_BS_Search_OBJ.run();
                    var resultSet = o_BS_Search_OBJ.run().getRange({
                        start: 0,
                        end: 1000
                    });
                     if (resultSet != null && resultSet != '' && resultSet != ' ') {
                        var completeResultSet = resultSet;
                        var start = 0;
                        var last = 1000;

                        while (resultSet.length == 1000) {
                            resultSet = o_BS_Search_OBJ.run().getRange(start, last);
                            completeResultSet = completeResultSet.concat(resultSet);
                            //start = parseFloat(start) + 1000;
                            //last = parseFloat(last) + 1000;

                            //log.debug("Input Call","start "+start)
                        }
                        resultSet = completeResultSet;
                        if (resultSet) {
                            log.debug('In getInputData_savedSearch: resultSet: ', resultSet.length);
                        }
                        custResultRange = resultSet;
                    } */

                    var searchResultCount = o_BS_Search_OBJ.runPaged().count;
                    log.audit("o_BS_Search_OBJ result count", searchResultCount);
                    //log.debug("o_BS_Search_OBJ",JSON.stringify(o_BS_Search_OBJ))
                    return o_BS_Search_OBJ;

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
                //return false;
                var key = context.key
                // log.debug("map", 'key -->'+key);

                var value = context.value;
                //log.debug("map", 'Value -->'+value);

                if (LIB._logValidation(value)) {
                    var data = JSON.parse(context.value); //read the data
                    var getValues = data.values;

                    var BS_ID = getValues["internalid"].value;
                    //log.debug('map','********* BS_ID *********** -->'+BS_ID)

                    var BS_PRIMARY_KEY = getValues["custrecord_yil_b_b_ns_primary_key"];
                    // log.debug('map','********* BS_PRIMARY_KEY *********** -->'+BS_PRIMARY_KEY);

                    var BS_RECO_BANK_DATE = getValues["custrecord_yil_b_b_ns_bank_date"];
                    //log.debug('map','********* BS_RECO_BANK_DATE *********** -->'+BS_RECO_BANK_DATE);

                    var BS_RECO_AMOUNT_DEBIT = getValues["custrecord_yil_b_b_ns_bank_amount"];
                    var BS_BRS_BS_COUNTER = getValues["custrecord_yil_brs_bs_counter"];
                    if (!BS_BRS_BS_COUNTER)
                        BS_BRS_BS_COUNTER = 0;

                    var total_BS_BRS_BS_COUNTER = parseInt(BS_BRS_BS_COUNTER) + parseInt(1);

                    var BS_RECO_BANK_NAME = getValues["custrecord_yil_b_b_ns_bank_name"].value;
                    //log.debug('map','********* BS_RECO_BANK_NAME *********** -->'+BS_RECO_BANK_NAME);

                    var BS_RECO_AMOUNT_CREDIT = getValues["custrecord_yil_b_b_ns_bank_amount_credit"];
                    //log.debug('map','********* BS_RECO_AMOUNT_CREDIT *********** -->'+BS_RECO_AMOUNT_CREDIT);
                    log.debug('map','********* BS_PRIMARY_KEY.length *********** -->'+BS_PRIMARY_KEY.length);

                    if (BS_PRIMARY_KEY && BS_PRIMARY_KEY.length > 3) {
                        var BRS_GL_DATA_ARRAY = LIB.get_BRS_GL_DATA(BS_PRIMARY_KEY, BS_RECO_BANK_DATE, BS_RECO_BANK_NAME); // 4000 -- 20 X 4000 =80000

                        if (BRS_GL_DATA_ARRAY.length === 0) {
                            log.error('map>> ' + key, '********* BRS_GL_DATA_ARRAY NOT AVAILABLE*********** ' + total_BS_BRS_BS_COUNTER);
                            record.submitFields({
                                type: 'customrecord_yil_brs_bank_statement',
                                id: key,
                                values: {
                                    custrecord_yil_brs_bs_counter: total_BS_BRS_BS_COUNTER
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });
                        } else {

                            log.audit('map ' + key, BS_PRIMARY_KEY + '********* BRS_GL_DATA_ARRAY *********** --><br>' + JSON.stringify(BRS_GL_DATA_ARRAY));
                            context.write(key, BRS_GL_DATA_ARRAY);

                        }
                        //context.write(key,BRS_GL_DATA_ARRAY); 
                    } else {
                        //   log.debug('map', '********* BRS_GL_DATA_ARRAY NOT AVAILABLE*********** '+total_BS_BRS_BS_COUNTER);
                        record.submitFields({
                            type: 'customrecord_yil_brs_bank_statement',
                            id: key,
                            values: {
                                custrecord_yil_brs_bs_counter: total_BS_BRS_BS_COUNTER   
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });


                    }

                }
                //return false;
            } catch (ex) {
                log.error('map error: '+ key, ex.message);
            }
        }

        function reduce(context) {

            try {

                //log.debug("----------");
                //return false;
                log.debug('-*-reduce-*-', '****** AR_INV_NP context.values *******' + JSON.stringify(context.values))

                var key_ = context.key;
                var values_ = context.values;

                values_ = JSON.parse(values_[0]);

                log.debug("reduce", "key_ -->" + key_ + " Length " + values_.length);
                // log.debug("reduce","values_ -->" + values_);
                //log.debug("reduce","values_ L -->" + values_.length);

                var TIMESTAMP = new Date();
                TIMESTAMP = TIMESTAMP.getTime();

                var BRS_GL_IDs = [];
                var TEMP_BRS_GL_IDs = [];
                var BS_GL_PRIMARY_KEY = "";
                var BS_FINAL_REMARKS_ = "";
                var GL_FINAL_REMARKS_ = "";
                var TEMP_GS_FINAL_REMARKS_ = "";
                if (LIB._logValidation(values_)) {
                    var BRS_STATUS_JSON = LIB.BRS_STATUS();

                    var TODAYS_DATE = LIB.get_todays_date();
                    var TODAYS_DATETIME = LIB.get_todays_datetime(TODAYS_DATE);

                    var o_BS_OBJ = record.load({
                        type: 'customrecord_yil_brs_bank_statement',
                        id: key_,
                        isDynamic: true
                    });

                    var BS_RECO_AMOUNT_DEBIT = o_BS_OBJ.getValue({
                        fieldId: 'custrecord_yil_b_b_ns_bank_amount'
                    });

                    BS_RECO_AMOUNT_DEBIT = Math.round(Math.abs(BS_RECO_AMOUNT_DEBIT));

                    var BS_RECO_AMOUNT_CREDIT = o_BS_OBJ.getValue({
                        fieldId: 'custrecord_yil_b_b_ns_bank_amount_credit'
                    });

                    BS_RECO_AMOUNT_CREDIT = Math.round(Math.abs(BS_RECO_AMOUNT_CREDIT));

                    var BS_DUE_RECO_AMOUNT = o_BS_OBJ.getValue({
                        fieldId: 'custrecord_yil_b_b_amount'
                    });
                    BS_DUE_RECO_AMOUNT = Math.round(Math.abs(BS_DUE_RECO_AMOUNT));
					
					log.debug("BS_RECO_AMOUNT_CREDIT",BS_RECO_AMOUNT_CREDIT)
					//return false;

                    var BS_REMARKS = o_BS_OBJ.getValue({
                        fieldId: 'custrecord_yil_b_b_reconciled_remarks'
                    });

                    var BS_RECONCILED_AMOUNT = o_BS_OBJ.getValue({
                        fieldId: 'custrecord_yil_b_b_reconciled_amount_'
                    });
                    BS_RECONCILED_AMOUNT = Math.round(Math.abs(BS_RECONCILED_AMOUNT));

                    var F_DEBIT_CREDIT = "";

                    if (!LIB._logValidation(BS_RECO_AMOUNT_DEBIT)) {
                        BS_RECO_AMOUNT_DEBIT = 0;
                    }
                    if (!LIB._logValidation(BS_RECO_AMOUNT_CREDIT)) {
                        BS_RECO_AMOUNT_CREDIT = 0;
                    }
                    if (LIB._logValidation(BS_RECO_AMOUNT_DEBIT)) {
                        BS_RECO_AMOUNT = parseFloat(BS_RECO_AMOUNT_DEBIT);
                        F_DEBIT_CREDIT = 'DEBIT'
                    } else if (LIB._logValidation(BS_RECO_AMOUNT_CREDIT)) {
                        BS_RECO_AMOUNT = parseFloat(BS_RECO_AMOUNT_CREDIT);
                        F_DEBIT_CREDIT = 'CREDIT'
                    }

                    if (!LIB._logValidation(BS_RECONCILED_AMOUNT)) {
                        BS_RECONCILED_AMOUNT = 0;
                    }
                    log.debug("reduce", "BS_RECONCILED_AMOUNT -->" + BS_RECONCILED_AMOUNT);

                    if (!LIB._logValidation(BS_DUE_RECO_AMOUNT) || (BS_DUE_RECO_AMOUNT == 0)) {
                        BS_DUE_RECO_AMOUNT = parseFloat(BS_RECO_AMOUNT);
                    }

                    var TEMP_RECO_AMOUNT = 0;
                    var TEMP_RECO_AMOUNT_FINAL = 0;

                    log.debug("reduce", "BS_RECO_AMOUNT -->" + BS_RECO_AMOUNT + " | BS_DUE_RECO_AMOUNT " + BS_DUE_RECO_AMOUNT);
                    //log.debug("reduce", "BS_DUE_RECO_AMOUNT -->" + BS_DUE_RECO_AMOUNT);

                    for (var v_qm = 0; v_qm < values_.length; v_qm++) {
                        var GL_NS_ID = values_[v_qm].GL_ID;
                        log.debug("reduce", "GL_NS_ID [" + v_qm + "] -->" + GL_NS_ID);

                        if (LIB._logValidation(GL_NS_ID)) {
                            try {
                                var GL_RECO_AMOUNT = 0;
                                var o_GL_OBJ = record.load({
                                    type: 'customrecord_yil_brs_ns_gl_data',
                                    id: GL_NS_ID,
                                    isDynamic: true
                                });
                                var GL_REMARKS = o_GL_OBJ.getValue({
                                    fieldId: 'custrecord_yil_brs_ns_gl_data_recoremark'
                                });
                                var GL_STATUS = o_GL_OBJ.getValue({
                                    fieldId: 'custrecord_yil_brs_ns_gl_data_status'
                                });
                                var GL_RECO_AMOUNT_DEBIT = o_GL_OBJ.getValue({
                                    fieldId: 'custrecord_yil_brs_ns_gl_data_gl_amount'
                                });
                                GL_RECO_AMOUNT_DEBIT = Math.round(Math.abs(GL_RECO_AMOUNT_DEBIT));

                                var GL_RECO_AMOUNT_CREDIT = o_GL_OBJ.getValue({
                                    fieldId: 'custrecord_yil_brs_ns_gl_data_gl_credit_'
                                });
                                GL_RECO_AMOUNT_CREDIT = Math.round(Math.abs(GL_RECO_AMOUNT_CREDIT));

                                var GL_DUE_RECO_AMOUNT = o_GL_OBJ.getValue({
                                    fieldId: 'custrecord_yil_g_g_due_amount'
                                });
                                GL_DUE_RECO_AMOUNT = Math.round(Math.abs(GL_DUE_RECO_AMOUNT));

                                // log.debug("F_DEBIT_CREDIT",F_DEBIT_CREDIT)

                                if (F_DEBIT_CREDIT == 'DEBIT') {
                                    GL_RECO_AMOUNT = parseFloat(GL_RECO_AMOUNT_CREDIT);
                                } else if (F_DEBIT_CREDIT == 'CREDIT') {
                                    GL_RECO_AMOUNT = parseFloat(GL_RECO_AMOUNT_DEBIT);
                                }

                                //  F_DEBIT_CREDIT = 'CREDIT' 	

                                if (!LIB._logValidation(GL_DUE_RECO_AMOUNT) || (GL_DUE_RECO_AMOUNT == 0)) {
                                    GL_DUE_RECO_AMOUNT = parseFloat(GL_RECO_AMOUNT);
                                }

                                /*  log.debug("reduce", "GL_RECO_AMOUNT  [" + v_qm + "] -->" + parseFloat(GL_RECO_AMOUNT));
                                 log.debug("reduce", "GL_DUE_RECO_AMOUNT [" + v_qm + "] -->" + parseFloat(GL_DUE_RECO_AMOUNT));
                                 log.debug("reduce", "BS_DUE_RECO_AMOUNT  [" + v_qm + "] -->" + parseFloat(BS_DUE_RECO_AMOUNT));

                                 log.debug("reduce", "TEMP_RECO_AMOUNT  [" + v_qm + "] -->" + parseFloat(TEMP_RECO_AMOUNT));
                                 log.debug("reduce", "BS_RECO_AMOUNT  [" + v_qm + "] -->" + parseFloat(BS_RECO_AMOUNT)); */

                                log.debug("reduce | o_GL_OBJ " + v_qm, "GL_RECO_AMOUNT " + GL_RECO_AMOUNT + " | GL_DUE_RECO_AMOUNT " + GL_DUE_RECO_AMOUNT + " | BS_DUE_RECO_AMOUNT " + BS_DUE_RECO_AMOUNT + " | TEMP_RECO_AMOUNT " + TEMP_RECO_AMOUNT + " | BS_RECO_AMOUNT " + BS_RECO_AMOUNT + " | GL_RECO_AMOUNT_DEBIT " + GL_RECO_AMOUNT_DEBIT + " | GL_RECO_AMOUNT_CREDIT " + GL_RECO_AMOUNT_CREDIT)

                                if (GL_RECO_AMOUNT > 0) {

                                    /* log.debug("BS_RECO_AMOUNT ",parseFloat(TEMP_RECO_AMOUNT)+" < "+ parseFloat(BS_RECO_AMOUNT))
                                    log.debug("status ",GL_STATUS +" != "+BRS_STATUS_JSON["FL_REC"].status_id)
                                    log.debug("GL_DUE_RECO_AMOUNT ",parseFloat(GL_DUE_RECO_AMOUNT)+" <= "+ parseFloat(BS_DUE_RECO_AMOUNT)) */

                                    if ((parseFloat(TEMP_RECO_AMOUNT) < parseFloat(BS_RECO_AMOUNT)) && (GL_STATUS == '' || (GL_STATUS != BRS_STATUS_JSON["FL_REC"].status_id)) && (parseFloat(GL_DUE_RECO_AMOUNT) <= parseFloat(BS_DUE_RECO_AMOUNT))) {
                                        //log.debug("In if 384")
                                        //log.debug("reduce", "GL_RECO_AMOUNT In Block.... ");
                                        try {
                                            var BRS_STATUS_ID = BRS_STATUS_JSON["AT_REC"].status_id;
                                        } catch (excdd) {
                                            var BRS_STATUS_ID = "";
                                        }
                                        log.debug("reduce", "BRS_STATUS_ID  [" + v_qm + "] -->" + BRS_STATUS_ID);

                                        o_GL_OBJ.setValue({
                                            fieldId: 'custrecord_yil_brs_ns_gl_data_rec_amt',
                                            value: GL_DUE_RECO_AMOUNT
                                        });
                                        o_GL_OBJ.setValue({
                                            fieldId: 'custrecord_yil_brs_gl_auto_reco_amt',
                                            value: GL_DUE_RECO_AMOUNT
                                        });
                                        o_GL_OBJ.setValue({
                                            fieldId: 'custrecord_yil_brs_g_gl_data',
                                            value: key_
                                        });

                                        o_GL_OBJ.setValue({
                                            fieldId: 'custrecord_yil_brs_gl_data_a_m_status',
                                            value: BRS_STATUS_JSON["AT_REC"].status_id
                                        });

                                        if (parseFloat(GL_DUE_RECO_AMOUNT) == parseFloat(GL_RECO_AMOUNT)) {
                                            o_GL_OBJ.setValue({
                                                fieldId: 'custrecord_yil_brs_ns_gl_data_status',
                                                value: BRS_STATUS_JSON["FL_REC"].status_id
                                            });

                                            var AMOUNT_DUE = parseFloat(GL_RECO_AMOUNT) - parseFloat(GL_DUE_RECO_AMOUNT);
                                            log.debug("reduce", "AMOUNT_DUE  [" + v_qm + "] -->" + AMOUNT_DUE);

                                            o_GL_OBJ.setValue({
                                                fieldId: 'custrecord_yil_g_g_due_amount',
                                                value: AMOUNT_DUE
                                            });

                                            if (AMOUNT_DUE > 0) {
                                                o_GL_OBJ.setValue({
                                                    fieldId: 'custrecord_yil_brs_gl_curr_status',
                                                    value: BRS_STATUS_JSON["FL_REC"].status_id
                                                });
                                            } else {
                                                o_GL_OBJ.setValue({
                                                    fieldId: 'custrecord_yil_brs_gl_curr_status',
                                                    value: BRS_STATUS_JSON["PR_REC"].status_id
                                                });
                                            }

                                            TEMP_RECO_AMOUNT = parseFloat(TEMP_RECO_AMOUNT) + parseFloat(GL_DUE_RECO_AMOUNT);
                                            //log.debug("reduce", "TEMP_RECO_AMOUNT [" + v_qm + "] -->" + TEMP_RECO_AMOUNT);

                                            log.debug("reduce", "***** CALCULATED TEMP_RECO_AMOUNT ***** [" + v_qm + "] -->" + TEMP_RECO_AMOUNT);

                                            try {

                                                o_GL_OBJ.setValue({
                                                    fieldId: 'custrecord_yil_brs_ns_gl_data_reco_date',
                                                    value: TODAYS_DATE
                                                });
                                                o_GL_OBJ.setValue({
                                                    fieldId: 'custrecord_yil_brs_gl_data_reco_datetime',
                                                    value: TODAYS_DATETIME
                                                });

                                                if (parseFloat(TEMP_RECO_AMOUNT) <= parseFloat(BS_RECO_AMOUNT)) {
                                                    // var BS_FINAL_REMARKS_ = "";
                                                    // var GL_FINAL_REMARKS_ = ""; 

                                                    if (!LIB._logValidation(GL_REMARKS)) {
                                                        GS_FINAL_REMARKS_ = "Initial Reco done for amount : " + GL_DUE_RECO_AMOUNT + " on " + TODAYS_DATETIME;
                                                    } else {
                                                        GS_FINAL_REMARKS_ = GL_REMARKS + "\n" + "Reco done for amount : " + GL_DUE_RECO_AMOUNT + " on " + TODAYS_DATETIME;
                                                    }

                                                    o_GL_OBJ.setValue({
                                                        fieldId: 'custrecord_yil_brs_ns_gl_data_recoremark',
                                                        value: GS_FINAL_REMARKS_
                                                    });

                                                    if (GL_DUE_RECO_AMOUNT == GL_RECO_AMOUNT) {
                                                        o_GL_OBJ.setValue({
                                                            fieldId: 'custrecord_yil_brs_gl_data_remarks_st',
                                                            value: BRS_STATUS_JSON["B_AMT_KEY_MATCH"].status_id
                                                        });
                                                    } else if ((GL_DUE_RECO_AMOUNT != GL_RECO_AMOUNT)) {
                                                        o_GL_OBJ.setValue({
                                                            fieldId: 'custrecord_yil_brs_gl_data_remarks_st',
                                                            value: BRS_STATUS_JSON["O_KEY_MATCH"].status_id
                                                        });
                                                    }

                                                    TEMP_RECO_AMOUNT_FINAL = TEMP_RECO_AMOUNT;

                                                    //log.debug("o_GL_OBJ  "+v_qm,JSON.stringify(o_GL_OBJ))
                                                    var i_GL_submitID = o_GL_OBJ.save({
                                                        enableSourcing: true,
                                                        ignoreMandatoryFields: true
                                                    });
                                                    log.debug("reduce", " *********GL Submit ID ************ -->" + i_GL_submitID);

                                                    /* if(!LIB._logValidation(BS_GL_PRIMARY_KEY))
                                                     {
                                                    	BS_GL_PRIMARY_KEY =  i_GL_submitID ;
                                                     }
                                                     else 
                                                     {
                                                    	BS_GL_PRIMARY_KEY = BS_GL_PRIMARY_KEY+'_'+i_GL_submitID ; 
                                                     } */
                                                    BS_GL_PRIMARY_KEY = key_ + '' + TIMESTAMP
                                                    TEMP_BRS_GL_IDs.push(GL_NS_ID);
                                                    BRS_GL_IDs.push(i_GL_submitID);
                                                } else {
                                                    record.submitFields({
                                                        type: 'customrecord_yil_brs_ns_gl_data',
                                                        id: GL_NS_ID,
                                                        values: {
                                                            custrecord_yil_brs_ns_gl_data_recoremark: "calculated amount is greter than Bank Amount",
															custrecord_yil_brs_gl_data_remarks_st: BRS_STATUS_JSON["REF_M_BUT_AMT_EX"].status_id
                                                        },
                                                        options: {
                                                            enableSourcing: false,
                                                            ignoreMandatoryFields: true
                                                        }
                                                    });
													//return true; 
                                                }

                                            } catch (escc) {
                                                log.error("ERROR", " ***) Exception Caught (**** -->" + escc);
                                            }
                                            if (parseFloat(TEMP_RECO_AMOUNT) == parseFloat(BS_RECO_AMOUNT)) {
                                                break;
                                            }

                                        } //AMOUNTS MATCHED
                                        else {
                                            record.submitFields({
                                                type: 'customrecord_yil_brs_ns_gl_data',
                                                id: GL_NS_ID,
                                                values: {
                                                    custrecord_yil_brs_ns_gl_data_recoremark: "GL_DUE_RECO_AMOUNT not equale to GL_RECO_AMOUNT",
													custrecord_yil_brs_gl_data_remarks_st: BRS_STATUS_JSON["O_KEY_MATCH"].status_id 
                                                },
                                                options: {
                                                    enableSourcing: false,
                                                    ignoreMandatoryFields: true
                                                }
                                            });
											//return true;
                                        }

                                    } else {
                                        log.debug("545 In Else ") //Amount Mismatched
                                        record.submitFields({
                                            type: 'customrecord_yil_brs_ns_gl_data',
                                            id: GL_NS_ID,
                                            values: {
                                                custrecord_yil_brs_ns_gl_data_recoremark: "Amount is exceeded than Bank Statment amount",
												custrecord_yil_brs_gl_data_remarks_st: BRS_STATUS_JSON["REF_M_BUT_AMT_EX"].status_id 
                                            },
                                            options: {
                                                enableSourcing: false,
                                                ignoreMandatoryFields: true
                                            }
                                        });
										//return true;
                                    }

                                    //log.debug("BRS_GL_IDs",JSON.stringify(BRS_GL_IDs))

                                    log.debug("<<<reduce>>>", " *** GL_STATUS**** -->" + GL_STATUS + ' CHK STATUS' + BRS_STATUS_JSON["FL_REC"].status_id);

                                    if ((GL_STATUS == BRS_STATUS_JSON["FL_REC"].status_id)) {

                                        /* if(!LIB._logValidation(BS_GL_PRIMARY_KEY))
                                         {
                                        	BS_GL_PRIMARY_KEY =  GL_NS_ID ;
                                         }
                                         else
                                         {
                                        	BS_GL_PRIMARY_KEY = BS_GL_PRIMARY_KEY+'_'+GL_NS_ID ; 
                                         } */

                                        BS_GL_PRIMARY_KEY = key_ + '' + TIMESTAMP

                                        TEMP_GS_FINAL_REMARKS_ = GL_REMARKS + "\n" + "Reco key updated : " + BS_GL_PRIMARY_KEY + " on " + TODAYS_DATETIME;

                                        //  BRS_GL_IDs.push(GL_NS_ID);	 
                                    } else {
										 log.debug("583 In Else ")
                                        record.submitFields({
                                            type: 'customrecord_yil_brs_ns_gl_data',
                                            id: GL_NS_ID,
                                            values: {
                                                custrecord_yil_brs_ns_gl_data_recoremark: "Reco key Not updated"
                                            },
                                            options: {
                                                enableSourcing: false,
                                                ignoreMandatoryFields: true
                                            }
                                        });
                                    }

                                } else {
                                    log.error("reduce | GL-BS", GL_RECO_AMOUNT + " amount is sufficient for calculation")
									 log.debug("598 In Else ")
                                    record.submitFields({
                                        type: 'customrecord_yil_brs_ns_gl_data',
                                        id: GL_NS_ID,
                                        values: {
                                            custrecord_yil_brs_ns_gl_data_recoremark: GL_RECO_AMOUNT + " amount is not sufficient for calculation",
											custrecord_yil_brs_gl_data_remarks_st: BRS_STATUS_JSON["REF_M_BUT_AMT_EX"].status_id 
											
                                        },
                                        options: {
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true
                                        }
                                    });
									
									//return true;
                                }
                            } catch (excqt) {
                                log.error("ERROR", "Exception Caught -->" + excqt);
                            }
                        } else {
							 log.debug("620 In Else ")
                            record.submitFields({
                                type: 'customrecord_yil_brs_ns_gl_data',
                                id: GL_NS_ID,
                                values: {
                                    custrecord_yil_brs_ns_gl_data_recoremark: "GL_NS_ID Not Available",
									custrecord_yil_brs_gl_data_remarks_st: BRS_STATUS_JSON["REF_NOT_MATCH"].status_id
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });
							//return true;
                        }
                    }

                    ////////////// BS STATEMENT ////////////

                    try {

                        o_BS_OBJ.setValue({
                            fieldId: 'custrecord_yil_b_b_ns_reco_date',
                            value: TODAYS_DATE
                        });
                        o_BS_OBJ.setValue({
                            fieldId: 'custrecord_yil_b_b_reco_datetime',
                            value: TODAYS_DATETIME
                        });

                        o_BS_OBJ.setValue({
                            fieldId: 'custrecord_yil_b_b_ns_post_reco_primary_',
                            value: BS_GL_PRIMARY_KEY
                        });

                        var AMOUNT_DUE = parseFloat(BS_DUE_RECO_AMOUNT) - parseFloat(TEMP_RECO_AMOUNT_FINAL);
                        log.debug("reduce", "AMOUNT_DUE  [" + v_qm + "] -->" + AMOUNT_DUE);
                        o_BS_OBJ.setValue({
                            fieldId: 'custrecord_yil_b_b_amount',
                            value: AMOUNT_DUE
                        });

                        if (AMOUNT_DUE == 0) {

                        }

                        o_BS_OBJ.setValue({
                            fieldId: 'custrecord_yil_brs_bs_a_m_status',
                            value: BRS_STATUS_JSON["AT_REC"].status_id
                        });

                        TEMP_RECO_AMOUNT_FINAL = parseFloat(BS_RECONCILED_AMOUNT) + parseFloat(TEMP_RECO_AMOUNT_FINAL);
                        log.debug("reduce", "TEMP_RECO_AMOUNT_FINAL -->" + TEMP_RECO_AMOUNT_FINAL);

                        if (parseFloat(TEMP_RECO_AMOUNT_FINAL) == parseFloat(BS_RECO_AMOUNT)) {
                            o_BS_OBJ.setValue({
                                fieldId: 'custrecord_yil_b_b_ns_status',
                                value: BRS_STATUS_JSON["FL_REC"].status_id
                            });
                        } else {
                            o_BS_OBJ.setValue({
                                fieldId: 'custrecord_yil_b_b_ns_status',
                                value: BRS_STATUS_JSON["PR_REC"].status_id
                            });
                        }

                        var i_getGL_ID = o_BS_OBJ.getValue({
                            fieldId: 'custrecord_yil_b_b_gl_reconciled'
                        });

                        log.debug("i_getGL_ID", i_getGL_ID)

                        for (var g = 0; g < i_getGL_ID.length; g++) {
                            BRS_GL_IDs.push(i_getGL_ID[g])
                        }

                        log.debug("BRS_GL_IDs", BRS_GL_IDs)

                        o_BS_OBJ.setValue({
                            fieldId: 'custrecord_yil_b_b_gl_reconciled',
                            value: BRS_GL_IDs
                        });
                        o_BS_OBJ.setValue({
                            fieldId: 'custrecord_yil_b_b_reconciled_amount_',
                            value: TEMP_RECO_AMOUNT_FINAL
                        });
                        o_BS_OBJ.setValue({
                            fieldId: 'custrecord_yil_brs_bs_auto_rec_amt',
                            value: TEMP_RECO_AMOUNT_FINAL
                        });

                        o_BS_OBJ.setValue({
                            fieldId: 'custrecord_yil_b_b_ns_reco_date',
                            value: TODAYS_DATE
                        });
                        o_BS_OBJ.setValue({
                            fieldId: 'custrecord_yil_brs_gl_data_reco_datetime',
                            value: TODAYS_DATE
                        });
                        if (!LIB._logValidation(BS_REMARKS)) {
                            BS_FINAL_REMARKS_ = "Initial Reco done for amount : " + TEMP_RECO_AMOUNT_FINAL + " on " + TODAYS_DATETIME;
                        } else {
                            BS_FINAL_REMARKS_ = BS_REMARKS + "\n" + "Reco done for amount : " + TEMP_RECO_AMOUNT_FINAL + " on " + TODAYS_DATETIME;
                        }

                        o_BS_OBJ.setValue({
                            fieldId: 'custrecord_yil_b_b_reconciled_remarks',
                            value: BS_FINAL_REMARKS_
                        });

                        log.debug('schedulerFunction', '  TEMP_BRS_GL_IDs -->' + TEMP_BRS_GL_IDs);

                        if (LIB._logValidation(BRS_GL_IDs)) {
                            if (TEMP_RECO_AMOUNT_FINAL != 0) {
                                var i_BS_submitID = o_BS_OBJ.save({
                                    enableSourcing: true,
                                    ignoreMandatoryFields: true
                                });
                                log.debug("reduce", " *********BS Submit ID ************ -->" + i_BS_submitID);
                            }
                            for (var g_xz = 0; g_xz < BRS_GL_IDs.length; g_xz++) {
                                try {
                                    //var check_GL = TEMP_BRS_GL_IDs.indexOf(BRS_GL_IDs[g_xz]);  
                                    //log.debug('schedulerFunction','  check_GL ['+g_xz+'] -->'+check_GL);	  
                                    //if(check_GL <= -1)
                                    {
                                        var i_GL_submitID_ = record.submitFields({
                                            type: 'customrecord_yil_brs_ns_gl_data',
                                            id: BRS_GL_IDs[g_xz],
                                            values: {
                                                custrecord_yil_brs_gl_data_post_reco_: BS_GL_PRIMARY_KEY
                                            },
                                            options: {
                                                enableSourcing: false,
                                                ignoreMandatoryFields: true
                                            }
                                        });
                                    }

                                    log.debug('schedulerFunction', '  GL Submit ID [' + g_xz + '] -->' + i_GL_submitID_);

                                } catch (excss) {

                                }
                            }
                        } else {
                            record.submitFields({
                                type: 'customrecord_yil_brs_bank_statement',
                                id: key_,
                                values: {
                                    custrecord_yil_b_b_reconciled_remarks: "GL Data Record data not avaliable"
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });
                        }
                        if (LIB._logValidation(TEMP_BRS_GL_IDs) && LIB._logValidation(BRS_GL_IDs)) {
                            for (var g_xz = 0; g_xz < TEMP_BRS_GL_IDs.length; g_xz++) {
                                try {
                                    var i_GL_submitID_ = record.submitFields({
                                        type: 'customrecord_yil_brs_ns_gl_data',
                                        id: TEMP_BRS_GL_IDs[g_xz],
                                        values: {
                                            custrecord_yil_brs_gl_data_post_reco_: BS_GL_PRIMARY_KEY,
                                            custrecord_yil_brs_ns_gl_data_recoremark: TEMP_GS_FINAL_REMARKS_
                                        },
                                        options: {
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true
                                        }
                                    });

                                    log.debug('schedulerFunction', '  GL Submit ID [' + g_xz + '] -->' + i_GL_submitID_);

                                } catch (excss) {

                                }
                            }
                        } else {
                            record.submitFields({
                                type: 'customrecord_yil_brs_bank_statement',
                                id: key_,
                                values: {
                                    custrecord_yil_b_b_reconciled_remarks: "TEMP_BRS_GL_IDs Or BRS_GL_IDs Not Available"
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });
                        }


                        //updating the GL Data with final status
                        var o_BS_OBJn = record.load({
                            type: 'customrecord_yil_brs_bank_statement',
                            id: key_,
                            isDynamic: true
                        });
                        var i_glIds = o_BS_OBJn.getValue({
                            fieldId: 'custrecord_yil_b_b_gl_reconciled'
                        });

                        log.debug("final i_glIds", i_glIds)

                        var n_dueAmount = o_BS_OBJn.getValue({
                            fieldId: 'custrecord_yil_b_b_amount'
                        });

                        if (n_dueAmount == 0) {
                            for (var q = 0; q < i_glIds.length; q++) {

                                log.debug("i_glIds " + q, i_glIds[q])
                                if (i_glIds[q]) {
                                    var i_GL_submitID_ = record.submitFields({
                                        type: 'customrecord_yil_brs_ns_gl_data',
                                        id: i_glIds[q],
                                        values: {
                                            custrecord_yil_brs_gl_curr_status: BRS_STATUS_JSON["FL_REC"].status_id
                                        },
                                        options: {
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true
                                        }
                                    });
                                } else {
                                    record.submitFields({
                                        type: 'customrecord_yil_brs_bank_statement',
                                        id: key_,
                                        values: {
                                            custrecord_yil_b_b_reconciled_remarks: "i_glIds not avaliable"
                                        },
                                        options: {
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true
                                        }
                                    });
                                }


                            }
                        } else {
                            record.submitFields({
                                type: 'customrecord_yil_brs_bank_statement',
                                id: key_,
                                values: {
                                    custrecord_yil_b_b_reconciled_remarks: "n_dueAmount is greater than 0"
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });
                        }

                    } catch (eaqscc) {
                        log.error("ERROR", " *** Exception Caught**** -->" + eaqscc);
                    }

                }

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
            // log.debug(type + ' parseFloat of Yields', summary.yields);

            /*	var o_script_task_SO = task.create({taskType: task.TaskType.MAP_REDUCE});
            	o_script_task_SO.scriptId = 'customscript_mr_update';
            	o_script_task_SO.deploymentId = null;
            	
            	
            	var o_script_task_SO_ID = o_script_task_SO.submit();
            	log.debug('reschedule_script','  Script Scheduled ....... ');	*/

        }
        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });