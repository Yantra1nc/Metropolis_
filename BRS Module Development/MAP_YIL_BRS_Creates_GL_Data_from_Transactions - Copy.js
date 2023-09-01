/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MAP_YIL_BRS_Creates_GL_Data_from_Transac
 * File Name: MAP_YIL_BRS_Creates_GL_Data_from_Transactions - Copy.js
 * Created On: 17/08/2023
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: BRS creates GL Data from transactions
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
					
					//var o_gl_transactions = search.load('customsearch_yil_brs_non_reco_transactio')
					var o_gl_transactions = search.load('customsearch_yil_brs_non_reco_transact_2')
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
                 //log.debug("map", 'key -->'+key);

                var value = context.value;
                //log.debug("map", 'Value -->'+value);

                 context.write(key, value);
                //return false;
            } catch (ex) {
                log.error('map error: ', ex.message);
            }
        }

        function reduce(context) {

            try {
				
				var data = context.values;
				
				var internalId = context.key;
				log.debug("internalId",internalId);
				
				var refNumber = '';
				
				var customrecord_yil_brs_ns_gl_dataSearchObj = search.create({
				   type: "customrecord_yil_brs_ns_gl_data",
				   filters:
				   [
					 // ["custrecord_yil_brs_ns_gl_data_reference_.internalidnumber","equalto",internalId],
					  ["custrecord_yil_brs_ns_gl_data_reference_","anyof",internalId]
				   ],
				   columns:
				   [
					  search.createColumn({name: "internalid", label: "Internal ID"}),
					  search.createColumn({name: "custrecord_yil_brs_ns_gl_data_reference_", label: "NS Reference Transaction"})
   
				   ]
				});
				var searchResultCount = customrecord_yil_brs_ns_gl_dataSearchObj.runPaged().count;
				log.debug("customrecord_yil_brs_ns_gl_dataSearchObj result count",searchResultCount);
				/* customrecord_yil_brs_ns_gl_dataSearchObj.run().each(function(result){
				   // .run().each has a limit of 4,000 results
				   
				    refNumber = result.getValue({ name: "custrecord_yil_brs_ns_gl_data_reference_", label: "NS Reference Transaction"})
				   
				   return true;
				}); */
				
				//log.debug("refNumber",refNumber);
				
				//return false;
				
				if(searchResultCount <= 0)
				{
					log.debug("Bill Payment Not Found Data");
				
					//return false;

                data = JSON.parse(data[0]);
				
				log.debug("reduce | data",data)
				var tran_recType = data.recordType;
				log.debug("reduce | tran_recType",tran_recType)
				var rec_data = data.values
				
				var yil_gl_reco = rec_data.custbody_yil_gl_reco;
				var memo = rec_data.memo;
				var mhl_utr_number = rec_data.custbody_mhl_utr_number;
				var mhl_utrnumber = rec_data.custbody_mhl_utrnumber;
				var mhl_memo = rec_data.custbody_mhl_memo;
				var creditamount = rec_data.creditamount;
				var debitamount = rec_data.debitamount;
				var bank_reference_key = rec_data.custbody_bank_reference_key;
				var trandate = rec_data.trandate;
				var trandate = rec_data.trandate;
				var i_account = rec_data.account.value
				var i_location = rec_data.location.value
				
				//log.debug('memo',memo)
				
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
				
				
				log.debug("reduce | referenceKey",referenceKey);
				
				
				var o_gl_rec_obj = record.create({type:"customrecord_yil_brs_ns_gl_data"});
				
				var d_tranDate =   format.parse({
						   value: trandate,
						   type: format.Type.DATE
					});
				
				o_gl_rec_obj.setValue("custrecord_ns_brs_pk",referenceKey)
				o_gl_rec_obj.setValue("custrecord_yil_brs_ns_gl_data_bank_name",i_account)
				o_gl_rec_obj.setValue("custrecord_yil_brs_ns_gl_data_gl_amount",debitamount)
				o_gl_rec_obj.setValue("custrecord_yil_brs_ns_gl_data_gl_credit_",creditamount)
				o_gl_rec_obj.setValue("custrecord_yil_brs_ns_gl_data_reference_",context.key)
				o_gl_rec_obj.setValue("custrecord_yil_brs_ns_gl_data_gl_date",d_tranDate)
				o_gl_rec_obj.setValue("custrecord_yil_brs_ns_gl_data_memo",memo)
				o_gl_rec_obj.setValue("custrecordyil_brs_ns_gl_data_bk_org_name",i_location)
				
				//New Code added //17-08-2023
				o_gl_rec_obj.setValue("custrecord_yil_brs_ns_gl_data_narration","1734")
				o_gl_rec_obj.setValue("custrecord_yil_brs_ns_gl_data_ref_trn_ty",18)
				
				var i_gl_id = o_gl_rec_obj.save()
				log.audit("i_gl_id",i_gl_id)
				
			
				
				 var i_GL_submitID_ = record.submitFields({
										type: tran_recType,
										id: context.key,
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
				
				}else{
					log.debug("Bill Payment Found Data");
				}

            } catch (ex) {
                log.error('reduce error: ', ex.message);
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
        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });