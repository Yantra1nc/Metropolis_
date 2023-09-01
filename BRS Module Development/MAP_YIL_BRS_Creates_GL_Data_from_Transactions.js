/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 *  Script Name: MAP_YIL_BRS_Creates_GL_Data_from_Transactions.js
	* Author:Ganesh Sapakale	/ Produciton
	* Date: 26/07/2023
	* Description:1] This script will create the GL Data from transactions. 
 */
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
					
					//var o_gl_transactions = search.load('customsearch_yil_brs_non_reco_transactio')
					var o_gl_transactions = search.load('customsearch_yil_brs_non_reco_transact_4')
                    return o_gl_transactions;

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
                 log.debug("map", 'key -->'+key);

                var value = context.value;
                log.debug("map", 'Value -->'+value);

                 context.write(key, value);
                //return false;
            } catch (ex) {
                log.error('map error: ', ex.message);
            }
        }

        function reduce(context) {
			
			var data_reduce = context.values;
			data_reduce = JSON.parse(data_reduce[0]);
			var tran_recType = data_reduce.recordType;

            try {
				
				var data = context.values;

                data = JSON.parse(data[0]);
				
				//log.debug("reduce | data",data)
				var tran_recType = data.recordType;
				//log.debug("reduce | tran_recType",tran_recType)
				var rec_data = data.values
				
				log.debug("rec_data ",JSON.stringify(rec_data))
				
				//log.debug("rec_data internalid",rec_data['GROUP(internalid)'])
				
				var i_tran_internalId = rec_data['GROUP(internalid)'].value;
				
				var yil_gl_reco = rec_data.custbody_yil_gl_reco;
				var memo = removeNone(rec_data['GROUP(memo)']);
				var mhl_utr_number = removeNone(rec_data['GROUP(custbody_mhl_utr_number)']);
				var mhl_utrnumber = removeNone(rec_data['GROUP(custbody_mhl_utrnumber)']);
				var mhl_memo = removeNone(rec_data['GROUP(custbody_mhl_memo)']);
				var creditamount = rec_data['SUM(creditamount)'];
				var debitamount = rec_data['SUM(debitamount)'];
				var bank_reference_key = removeNone(rec_data['GROUP(custbody_bank_reference_key)']);
				var trandate = rec_data['GROUP(trandate)'];
				var trandate =rec_data['GROUP(trandate)'];
				var tran_recType = rec_data['GROUP(type)'].value;
				var tran_recTypeTxt = rec_data['GROUP(type)'].text;
				var i_account = rec_data['GROUP(account)'].value;
				var i_location = rec_data['GROUP(location)'].value;
				
				log.debug('memo',memo+" mhl_utr_number "+mhl_utr_number+" mhl_utrnumber "+mhl_utrnumber+" mhl_memo "+mhl_memo+" creditamount "+creditamount+" i_location "+i_location+" i_account "+i_account+" debitamount "+debitamount)
				
				var referenceKey = '';
				if(LIB._logValidation(memo))
				{
					referenceKey += memo+"_";
				}
				
				if(LIB._logValidation(mhl_utr_number))
				{
					referenceKey += mhl_utr_number+"_";
				}
				
				if(LIB._logValidation(mhl_utrnumber))
				{
					referenceKey += mhl_utrnumber+"_";
				}
				
				if(LIB._logValidation(mhl_memo))
				{
					referenceKey += mhl_memo;
				}

				if(LIB._logValidation(bank_reference_key))
				{
					referenceKey += bank_reference_key;
				}
				//log.debug("reduce | referenceKey",referenceKey);
				
				var o_gl_rec_obj = record.create({type:"customrecord_yil_brs_ns_gl_data"});
				
				var d_tranDate =   format.parse({
					   value: trandate,
					   type: format.Type.DATE
				});
				
				o_gl_rec_obj.setValue("custrecord_ns_brs_pk",referenceKey)
				o_gl_rec_obj.setValue("custrecord_yil_brs_ns_gl_data_bank_name",i_account)
				o_gl_rec_obj.setValue("custrecord_yil_brs_ns_gl_data_gl_amount",debitamount)
				o_gl_rec_obj.setValue("custrecord_yil_brs_ns_gl_data_gl_credit_",creditamount)
				o_gl_rec_obj.setValue("custrecord_yil_brs_ns_gl_data_reference_",i_tran_internalId)
				o_gl_rec_obj.setValue("custrecord_yil_brs_ns_gl_data_gl_date",d_tranDate)
				o_gl_rec_obj.setValue("custrecord_yil_brs_ns_gl_data_memo",memo)
				o_gl_rec_obj.setValue("custrecord_yil_brs_ns_gl_data_memo",memo)
				o_gl_rec_obj.setValue("custrecordyil_brs_ns_gl_data_bk_org_name",i_location)
				//o_gl_rec_obj.setValue("custrecord_yil_brs_ns_gl_data_ref_trn_ty",tran_recType)
				o_gl_rec_obj.setValue("custrecord_yil_brs_ns_gl_data_narration",'1627');
				tran_recType = tran_recType.toLowerCase()
				log.debug("type "+i_tran_internalId,tran_recType.toLowerCase())
				var rec_type = ''
				
				if(tran_recTypeTxt == 'Vendor Advance Prepayment')
					rec_type = 'customtransaction_vendor_prepayment';
				else if(tran_recTypeTxt == 'Vendor Advance Non PO Based')
					rec_type = 'custompurchase_mhl_vendor_advance_no';
				else if(tran_recTypeTxt == 'Payment')
					rec_type = 'customerpayment';
				else if(tran_recTypeTxt == 'Journal')
					rec_type = 'journalentry';
				else if(tran_recTypeTxt == 'Employee Advance')
					rec_type = 'customtransaction_mhl_emp_advance';
				else if(tran_recTypeTxt == 'Deposit')
					rec_type = 'deposit';
				else if(tran_recTypeTxt == 'Bill Payment')
					rec_type = 'vendorpayment';		
				
				
				 
				 var i_gl_id = o_gl_rec_obj.save();
				log.audit("i_gl_id",i_gl_id);
				
				var i_GL_submitID_ = record.submitFields({
					type: rec_type,
					id: i_tran_internalId,
					values: {
						custbody_yil_brs_gl_list: i_gl_id						
					},
					options: {
						enableSourcing: false,
						ignoreMandatoryFields: true
					}
				});  				

				context.write({
					key: context.key,
					value: context.values.length
				});

            } catch (ex) {
                log.error('reduce error: ', ex.message);
                log.error('reduce error: on', tran_recType+" <> "+context.key);
				var i_GL_submitID_ = record.submitFields({
					type: tran_recType,
					id: context.key,
					values: {
						custbody_brs_error_details: ex.message,
						custbody_brs_errorcheckbox: true
					},
					options: {
						enableSourcing: false,
						ignoreMandatoryFields: false
					}
				});
				
            }

        }

        function summarize(summary) {

            var type = summary.toString();
            log.debug(type + ' Usage Consumed', summary.usage);
            log.debug(type + ' Concurrency parseFloat ', summary.concurrency);
            log.debug(type + ' parseFloat of Yields', summary.yields);

            /*	var o_script_task_SO = task.create({taskType: task.TaskType.MAP_REDUCE});
            	o_script_task_SO.scriptId = 'customscript_mr_update';
            	o_script_task_SO.deploymentId = null;
            	
            	
            	var o_script_task_SO_ID = o_script_task_SO.submit();
            	log.debug('reschedule_script','  Script Scheduled ....... ');	*/

        }
		
		function removeNone(string)
		{
			string = string.replace("- None -",'');
			return string;
		}
        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });