/**
 * Script Name:MR_YIL_BRS_Data_Reconcilation.js
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MR YIL BRS Reconciliation
 * File Name: MR_YIL_BRS_Data_Reconcilation.js
 * Created On: 23/05/2023
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: BRS Reconciliation
 *********************************************************** */

define(['N/file', 'N/format', 'N/record', 'N/search', 'N/runtime', './invoicepdf', './datellib','./LIB_YIL_Bank_Reco_Suite_Process'],
	/**
	 * @param {file} file
	 * @param {format} format
	 * @param {record} record
	 * @param {search} search
	 * @param {transaction} transaction
	 */
	function (file, format, record, search, runtime, invoicepdf, datellib,BRS) {

	/**
	 * Marks the beginning of the Map/Reduce process and generates input data.
	 *
	 * @typedef {Object} ObjectRef
	 * @property {number} id - Internal ID of the record instance
	 * @property {string} type - Record type id
	 *
	 * @return {Array|Object|Search|RecordRef} inputSummary
	 * @since 2015.1
	 */
	 var gl_dataIndex = 0;
	function getInputData() {

		try {

			var scriptObj = runtime.getCurrentScript();
			var deploymentId = scriptObj.deploymentId;
			log.audit("deployment Id", deploymentId)
			
			
			var jsonData = JSON.parse(scriptObj.getParameter({
				name: 'custscript_yil_brs_json_data_params'
			}));
				
			log.debug("jsonData length",jsonData.length)
			//log.debug("jsonData",jsonData)

			return jsonData;

		} catch (e) {
			
			log.error({
				title: 'Error Occured while collecting JSON for VID',
				details: e
			});
		}
	}

	function map(context) {
		try {
				log.debug("<<<MAP>>>","|>___________________________________________________________<|")
				var BRS_STATUS_JSON = BRS.BRS_STATUS();
			//log.debug("context",JSON.stringify(context.value.transaction))
			//log.debug("MAP context",JSON.stringify(context))
			var data = JSON.parse(context.value); //read the data
			//log.debug("context data", JSON.stringify(data))
			
			 var TIMESTAMP = new Date();
			 TIMESTAMP = TIMESTAMP.getTime();
			
			var sessionObj = runtime.getCurrentSession();
			var lineData = data;
			log.debug("data",data)
			var bsData = data;
			//return false;
			var bs_ns_id = bsData.ns_id;
			var BS_GL_PRIMARY_KEY = bs_ns_id+''+TIMESTAMP;
			
			log.audit("bs_ns_id",bs_ns_id)
			if(bs_ns_id)
			{
				var o_bsDataObj = record.load({type:"customrecord_yil_brs_bank_statement",id:bs_ns_id});

				var bs_due_amount = o_bsDataObj.getValue('custrecord_yil_b_b_amount');
				var bs_b_b_ns_bank_amount = o_bsDataObj.getValue('custrecord_yil_b_b_ns_bank_amount');
				var bs_b_b_reconciled_remarks = o_bsDataObj.getValue('custrecord_yil_b_b_reconciled_remarks');
			
				var glData = data.GLData;
				//log.debug("gl_dataIndex",gl_dataIndex);
				
				var nsbsAmount = bsData.nsBankAmount;
				var nsbsCredAmount = bsData.amount_credit;
				var nsbsDebAmount = bsData.amount_debit;
				o_bsDataObj.setValue("custrecord_yil_b_b_amount",nsbsAmount);
				var totalRecoAmount = 0;
				var gl_data_ids = new Array();
				
				var n_bs_reconciled_amount = nsbsAmount;
				for(var g in glData)
				{
					//g = gl_dataIndex;
					var glLineData = glData[g];					
					var gl_ns_id = glLineData.ns_id;
					
					//BS_GL_PRIMARY_KEY = key_+''+TIMESTAMP 
					
					log.debug(gl_ns_id,"############################################################ "+g);
					log.debug("For Loop "+gl_ns_id,"nsbsAmount "+nsbsAmount);
					var o_glDataObj = record.load({type:"customrecord_yil_brs_ns_gl_data",id:gl_ns_id});
					
					var gl_due_amount = o_glDataObj.getValue('custrecord_yil_g_g_due_amount');
					var gl_amount = o_glDataObj.getValue('custrecord_yil_brs_ns_gl_data_gl_amount');
					//var gl_amount = o_glDataObj.getValue('custrecord_yil_g_g_due_amount');
					var gl_brs_g_gl_data = o_glDataObj.getValue('custrecord_yil_brs_g_gl_data');
					var gl_data_recoremark = o_glDataObj.getValue('custrecord_yil_brs_ns_gl_data_recoremark');
				//	o_bsDataObj.setValue("custrecord_yil_brs_bs_a_m_status",2) // need to dynamic value to be enter
					o_bsDataObj.setValue("custrecord_yil_brs_bs_a_m_status",BRS_STATUS_JSON["NT_ST"].status_id) // need to dynamic value to be enter
					
					
					
					var gl_amount = gl_amount;
					if(gl_due_amount > 0)
					{
						gl_amount = gl_due_amount;
					}
					log.debug("GL gl_amount "+gl_ns_id,gl_amount);			
					
					
					//log.debug("totalRecoAmount",totalRecoAmount)
					
					
					if(gl_amount > 0 )
					{
						
						var nsglAmount = glLineData.nsBankAmount;
						
						var TODAYS_DATE = BRS.get_todays_date();
						var TODAYS_DATETIME = BRS.get_todays_datetime(TODAYS_DATE);
						//nsglAmount = parseFloat(nsglAmount) + parseFloat(gl_due_amount);
						
						var recoAmount = parseFloat(nsbsAmount) - parseFloat(gl_amount);
					//	totalRecoAmount = parseFloat(totalRecoAmount) + parseFloat(recoAmount);
						
						o_glDataObj.setValue({fieldId : 'custrecord_yil_brs_gl_data_reco_datetime' , value : TODAYS_DATETIME});
						o_glDataObj.setValue({fieldId : 'custrecord_yil_brs_ns_gl_data_reco_date' , value : TODAYS_DATE}); 	
						nsbsAmount = recoAmount;
						
						log.audit("recoAmount "+gl_ns_id,recoAmount)
						
						
						if(!BRS._logValidation(gl_data_recoremark))
						{
							gl_data_recoremark =  "Initial Reco done for amount : "+gl_amount + " on "+TODAYS_DATETIME ;
						}								
						else
						{
							gl_data_recoremark = gl_data_recoremark+ "\n" +"Reco done for amount : "+gl_amount + " on "+TODAYS_DATETIME ;
						}
						
						if(!BRS._logValidation(bs_b_b_reconciled_remarks))
						{
							bs_b_b_reconciled_remarks = "Initial Reco done for amount : "+gl_amount + " on "+TODAYS_DATETIME ;
						}								
						else
						{
							bs_b_b_reconciled_remarks = gl_data_recoremark+ "\n" +"Reco done for amount : "+gl_amount + " on "+TODAYS_DATETIME ;
						}
						
						
						o_glDataObj.setValue("custrecord_yil_brs_ns_gl_data_recoremark",gl_data_recoremark);
						//o_glDataObj.setValue("custrecord_yil_brs_gl_data_a_m_status",5);
						o_glDataObj.setValue("custrecord_yil_brs_gl_data_a_m_status",BRS_STATUS_JSON["MN_REC"].status_id);
						o_glDataObj.setValue("custrecord_yil_brs_ns_gl_data_final_key",BS_GL_PRIMARY_KEY);
						if(recoAmount == 0)
						{
							//gl_dataIndex++;
							
							log.debug(g+" In IF",recoAmount)
							
							//gl_data_recoremark += ""; 
							
							gl_data_ids.push(gl_ns_id)
							
					
							o_glDataObj.setValue("custrecord_yil_brs_ns_gl_data_status",1);
							o_glDataObj.setValue("custrecord_yil_g_g_due_amount",recoAmount);
							o_glDataObj.save();
							
							o_bsDataObj.setValue("custrecord_yil_b_b_amount",recoAmount);							
							//o_bsDataObj.setValue("custrecord_yil_brs_bs_a_m_status",4);							
							o_bsDataObj.setValue("custrecord_yil_brs_bs_a_m_status",BRS_STATUS_JSON["MN_REC"].status_id);							
							//o_bsDataObj.setValue("custrecord_yil_b_b_ns_status",1);
							o_bsDataObj.setValue("custrecord_yil_b_b_ns_status",BRS_STATUS_JSON["FL_REC"].status_id);
							
							totalRecoAmount = parseFloat(totalRecoAmount) + parseFloat(gl_amount);
							
							break;
							
						}
						else if(recoAmount > 0)
						{
							gl_data_ids.push(gl_ns_id)
							log.debug(g+" In IF else > "+gl_ns_id,recoAmount)
							o_glDataObj.setValue("custrecord_yil_g_g_due_amount",0);// need to dynamic value to be enter
							o_glDataObj.setValue("custrecord_yil_brs_ns_gl_data_rec_amt",gl_amount); // RECONCILED AMOUNT
							o_glDataObj.setValue("custrecord_yil_brs_gl_manu_reco_amt",gl_amount); // RECONCILED AMOUNT
							
							//o_glDataObj.setValue("custrecord_yil_brs_ns_gl_data_status",1);// need to dynamic value to be enter
							o_glDataObj.setValue("custrecord_yil_brs_ns_gl_data_status",BRS_STATUS_JSON["FL_REC"].status_id);
							
							o_bsDataObj.setValue("custrecord_yil_b_b_amount",recoAmount);							
													
							//o_bsDataObj.setValue("custrecord_yil_b_b_gl_reconciled",gl_ns_id)
							
							//log.debug(gl_ns_id,"0 Bank Statement will "+recoAmount+", GL Data will "+recoAmount+" Updated")
							//o_bsDataObj.setValue("custrecord_yil_brs_bs_a_m_status",3);// need to dynamic value to be enter
							o_bsDataObj.setValue("custrecord_yil_brs_bs_a_m_status",BRS_STATUS_JSON["PR_REC"].status_id);// need to dynamic value to be enter
							//o_bsDataObj.setValue("custrecord_yil_b_b_ns_status",3);// need to dynamic value to be enter
							o_bsDataObj.setValue("custrecord_yil_b_b_ns_status",BRS_STATUS_JSON["PR_REC"].status_id);// need to dynamic value to be enter
							
							totalRecoAmount = parseFloat(totalRecoAmount) + parseFloat(gl_amount);
						}
						else if(recoAmount < 0)
						{
							gl_data_ids.push(gl_ns_id)
							log.debug(g+" In IF else < "+gl_ns_id,recoAmount)
							
							var balanceGLAmount = parseFloat(gl_amount) + parseFloat(recoAmount);
							
							
							log.debug("balanceGLAmount "+gl_ns_id,balanceGLAmount)
							
							recoAmount = parseFloat(recoAmount) * parseInt(-1);
							o_glDataObj.setValue("custrecord_yil_brs_ns_gl_data_status",BRS_STATUS_JSON["PR_REC"].status_id);// need to dynamic value to be enter
							o_glDataObj.setValue('custrecord_yil_g_g_due_amount',recoAmount);
							o_glDataObj.setValue("custrecord_yil_brs_ns_gl_data_rec_amt",balanceGLAmount);	
							o_glDataObj.setValue("custrecord_yil_brs_gl_manu_reco_amt",balanceGLAmount);							
							
							
							o_bsDataObj.setValue("custrecord_yil_b_b_amount",0);// need to dynamic value to be enter
							//o_bsDataObj.setValue("custrecord_yil_b_b_gl_reconciled",gl_ns_id);
							o_bsDataObj.setValue("custrecord_yil_brs_bs_a_m_status",BRS_STATUS_JSON["PR_REC"].status_id)// need to dynamic value to be enter
							
							//log.debug(gl_ns_id,"1 Bank Statement will Zero, GL Data will "+recoAmount+" Updated ");
							totalRecoAmount = parseFloat(totalRecoAmount) + parseFloat(recoAmount);
						}
						
						//log.debug("After recoAmount "+gl_ns_id,recoAmount)
						o_glDataObj.setValue("custrecord_yil_brs_g_gl_data",bs_ns_id)	
						
					}
					else
					{
						log.debug("in Else")
					}
					
					o_glDataObj.save();
					
					log.debug("o_glDataObj "+gl_ns_id,JSON.stringify(o_glDataObj))
					
				}// for loop
				log.debug("Final Reco Amount",totalRecoAmount)
				
				
				
				if(totalRecoAmount == bs_b_b_ns_bank_amount)
				{
					o_bsDataObj.setValue("custrecord_yil_b_b_ns_status",BRS_STATUS_JSON["FL_REC"].status_id);// need to dynamic value to be enter
					log.debug("Bank Statement","Changed the status of NS Status, auto / manual status")
				}
				
				var gl_data_ids_string = gl_data_ids.toString();
				gl_data_ids_string = gl_data_ids_string.replace(/,/g,"_");
				
				
				
				
				log.debug("gl_data_ids_string",gl_data_ids_string)
				log.debug("Bank Statement","bs_b_b_reconciled_remarks <br>"+bs_b_b_reconciled_remarks)
				o_bsDataObj.setValue("custrecord_yil_b_b_reconciled_amount_",totalRecoAmount);
				o_bsDataObj.setValue("custrecord_yil_brs_bs_manu_reco_amt",totalRecoAmount);
				//o_bsDataObj.setValue("custrecord_yil_b_b_ns_post_reco_primary_",gl_data_ids_string);
				o_bsDataObj.setValue("custrecord_yil_b_b_reconciled_remarks",bs_b_b_reconciled_remarks);
				o_bsDataObj.setValue("custrecord_yil_b_b_reco_datetime",TODAYS_DATETIME);
				o_bsDataObj.setValue("custrecord_yil_b_b_gl_reconciled",gl_data_ids);
				 o_bsDataObj.setValue({fieldId : 'custrecord_yil_b_b_ns_post_reco_primary_' , value : BS_GL_PRIMARY_KEY}); 
				o_bsDataObj.save();
				log.debug("o_bsDataObj "+bs_ns_id,JSON.stringify(o_bsDataObj))
			}
			
			
			//log.debug("glData 1",glData)
			
			
		} catch (ex) {
			log.error({
				title: 'map: error in creating records',
				details: ex
			});
		   
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Executes when the summarize entry point is triggered and applies to the result set.
	 *
	 * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
	 * @since 2015.1
	 */
	function summarize(summary) {

		try {
			var mapKeysProcessed = 0;
			summary.mapSummary.keys.iterator().each(function (key, executionCount, completionState) {

				if (completionState === 'COMPLETE') {
					mapKeysProcessed++;
				}

				return true;

			});
			log.debug({
				title: 'Map key statistics',
				details: 'Total number of map keys processed successfully: ' + mapKeysProcessed
			});
		} catch (e) {
			log.error({
				title: 'Error Occured in Summary function',
				details: e
			});
		}

	}

	
	function _logValidation(value) {
		if (value != null && value != undefined && value != '' && value != 'undefined') {
			return true;
		} else {
			return false;
		}

	}

	function _nullValidation(val) {
		if (val == null || val == undefined || val == '') {
			return true;
		} else {
			return false;
		}

	}

	return {
		getInputData: getInputData,
		map: map,
		summarize: summarize
	};

});