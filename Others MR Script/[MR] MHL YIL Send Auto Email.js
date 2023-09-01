/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: [MR] MHL YIL Send Auto Email
 * File Name: 
 * Created On: 11/05/2023
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: Auto Trigger Email to DOA Approver for Invoice Approval weekly if invoice not approved > 4 days by approver
 *********************************************************** */
	
	/**
	 * Script Name: 
	 * @NApiVersion 2.x
	 * @NScriptType MapReduceScript
	 * @NModuleScope SameAccount
	 */
	define(['N/file', 'N/format', 'N/record', 'N/search', 'N/runtime', './mhllib', './datellib', "./callrestdata", './searchlib','N/email'],
	    /**
	     * @param {file} file
	     * @param {format} format
	     * @param {record} record
	     * @param {search} search
	     * @param {transaction} transaction
	     */
	    function(file, format, record, search, runtime, mhllib, datellib, callrestdata, searchlib, email) {

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
	        function getInputData() {

	            try {
	                var scriptObj = runtime.getCurrentScript();
	                var deploymentId = scriptObj.deploymentId;
	                log.audit("deployment Id", deploymentId)

	                var venObj = search.load({
	                    id: 'customsearch_ven_inv_pen_aprov_more_4day'
	                });
					
					var resultSet = searchlib.mySearch(venObj);
					log.debug("Result Set Length -->", resultSet.length);
					
					if (resultSet) {
						
						var transdetails = [];
						
						for (var i = 0; i < resultSet.length; i++) {
							var intId = resultSet[i].getValue({
								name: "internalid"
							});
							var parent_tran = resultSet[i].getValue({
								name: "transactionnumber",
								join: "CUSTRECORD_MHL_PARENT_TRANSACTION",
								label: "Transaction Number"
							});
							
							var ven_date = resultSet[i].getValue({
								name: "date",
								join: "systemNotes",
								label: "Pending from Date"
							});
							
							var ven_date_format = format.format({
							value: ven_date,
							type: format.Type.DATE
							});
							log.debug("ven_date_format -->", ven_date_format);
							
							var tran_date = resultSet[i].getValue({
								name: "trandate",
								join: "CUSTRECORD_MHL_PARENT_TRANSACTION",
								label: "Date"
							});
							
							var tran_date_format = format.format({
							value: tran_date,
							type: format.Type.DATE
							});
							log.debug("tran_date_format -->", tran_date_format);
											
							var approver_name = resultSet[i].getText({
								name: "custrecord_mhl_pending_with"
							});
							
							var approver_intId = resultSet[i].getValue({
								name: "custrecord_mhl_pending_with"
							});
							
							var ven_email = resultSet[i].getValue({
								name: "email",
								join: "CUSTRECORD_MHL_PENDING_WITH",
								label: "Email"
							});
							
							var ven_name = resultSet[i].getText({
								name: "entity",
								join: "CUSTRECORD_MHL_PARENT_TRANSACTION",
								label: "Name"
							});
							
							var ven_amount = resultSet[i].getValue({
								name: "amount",
								join: "CUSTRECORD_MHL_PARENT_TRANSACTION",
								label: "Amount"
							});
							
							var ven_subsidiary = resultSet[i].getText({
								name: "subsidiary",
								join: "CUSTRECORD_MHL_PARENT_TRANSACTION",
								label: "Subsidiary"
							});
							
							var ven_age_in_days = resultSet[i].getValue({
								name: "date",
								join: "systemNotes",
								label: "Age in days"
							});
							
							var ven_exp_cat = resultSet[i].getText({
								name: "custbody_mhl_expense_category_bill",
								join: "CUSTRECORD_MHL_PARENT_TRANSACTION",
								label: "Expense Category"
							});
							
							transdetails.push({
                                    'approverName': approver_name,
                                    pushdata: {
										'internalId': intId,
										'parentTran': parent_tran,
										'venInvDate': ven_date_format,
										'tranDate': tran_date_format,
										'venAmount': ven_amount,
										'venSubsidiary': ven_subsidiary,
										'approverName': approver_name,
										'ageInDays': ven_age_in_days,
										'expCategory': ven_exp_cat,
										'venEmail': ven_email,
										'venName': ven_name,
										'approverIntId':approver_intId
                                    }
                                });
						}
					}
					
					log.debug("transdetails-->",transdetails);
					
					return transdetails;

	            } catch (e) {
	                log.debug({
	                    title: 'Error Occured while collecting JSON',
	                    details: e
	                });
	            }
	        }

	        function map(context) {
	            try {
	                 
					var a_usage_data = JSON.parse(context.value);
					log.debug("a_usage_data", a_usage_data);

					var tran_approver_name = a_usage_data.approverName;
					log.debug('tran_approver_name ', tran_approver_name);
					
					var venIntId = a_usage_data.pushdata.internalId;
					log.debug('venIntId ', venIntId);
					
					if (tran_approver_name) {
						context.write({
							key: tran_approver_name,
							value: a_usage_data.pushdata
						});
					}
					 
					/* var key = context.key;
					log.debug('key ',key);
					var value = context.value;
					log.debug('value ',value);
					
					var objParsedValue = JSON.parse(value);
					
					var venIntId = objParsedValue.internalId;
					log.debug('venIntId ', venIntId);
					
					var paretnt_transaction = objParsedValue.parentTran;
					log.debug('paretnt_transaction ', paretnt_transaction);
					
					var tran_approver_name = objParsedValue.approverName;
					log.debug('tran_approver_name ', tran_approver_name);
					
					var vendor_email = objParsedValue.venEmail;
					log.debug('vendor_email ', vendor_email); */
				
					
					//context.write(key, value);
					

	            } catch (ex) {
	                log.error({
	                    title: 'Json file doesnt getting',
	                    details: ex
	                });
	            }
	        }
			
			
			function reduce(context) {

				log.debug("reduce KEY", context.key);
				log.debug("reduce Data", context.values);
				log.debug("reduce Length", context.values.length);

				/*  context.write({
					 key: context.key,
					 value: context.values.length
				 });  */
				 
				var o_index = context.values[0];
                var APDetails = JSON.parse(o_index);
                log.debug("APDetails", APDetails);
				
				var email_sales_admin=new Array();

                var approverInternalId = APDetails.approverIntId;
                log.debug("approverInternalId in reduce-->", approverInternalId);
				
				var empSupervisor;
				var supervisorEmail;
				var jobTitle;

				if(approverInternalId){
					var empRecord = record.load({
						type: 'employee',
						id: approverInternalId
					});	
					
					empSupervisor = empRecord.getValue({
						fieldId: 'supervisor'
					});
					
					log.debug("empSupervisor",empSupervisor);
					
					if(empSupervisor){
						var empRecord = record.load({
							type: 'employee',
							id: empSupervisor
						});	
						
						supervisorEmail = empRecord.getValue({
							fieldId: 'email'
						});
						log.debug("supervisorEmail",supervisorEmail);
						
						jobTitle = empRecord.getValue({
							fieldId: 'title'
						});
						log.debug("jobTitle",jobTitle);
					}
				}
				
				var approver_name_reduce = APDetails.approverName;
                log.debug("approver_name_reduce -->", approver_name_reduce);
				
				var approver_email = APDetails.venEmail;
                log.debug("approver_email_reduce -->", approver_email);
				
				var PDFPrint;
					
					PDFPrint = "Dear "+ approver_name_reduce+ ",<br>";
					PDFPrint += "<br>";
					PDFPrint += "The below Invoices pending for your approval for >3 days. Kindly approve the same as earliest.<br>";
					//PDFPrint += " Kindly approve it as soon as possible. <br> ";
					PDFPrint += "<br>";
					PDFPrint += "<table border = \"1\"  width=\"100%\" height=\"100%\">";
					//PDFPrint += "<table width=\"100%\" height=\"100%\">";
	                PDFPrint += "<thead>";
	                PDFPrint += "<tr>";
	    			PDFPrint += " <td border = \"1\" align=\"center\" style=\" font-size:11px; background-color:#85C1E9;\">Transaction <\/b><\/td>";
	    			PDFPrint += " <td border = \"1\" align=\"center\" style=\" font-size:11px; background-color:#85C1E9;\">Date <\/b><\/td>";
	    			PDFPrint += " <td border = \"1\" align=\"center\" style=\" font-size:11px; background-color:#85C1E9;\">Amount <\/b><\/td>";
	    			PDFPrint += " <td border = \"1\" align=\"center\" style=\" font-size:11px; background-color:#85C1E9;\">Subsidiary <\/b><\/td>";
	    			PDFPrint += " <td border = \"1\" align=\"center\" style=\" font-size:11px; background-color:#85C1E9;\">Approver<\/b><\/td>";                
					PDFPrint += " <td border = \"1\" align=\"center\" style=\" font-size:11px; background-color:#85C1E9;\">Vendor<\/b><\/td>";
					PDFPrint += " <td border = \"1\" align=\"center\" style=\" font-size:11px; background-color:#85C1E9;\">Pending From<\/b><\/td>";
					PDFPrint += " <td border = \"1\" align=\"center\" style=\" font-size:11px; background-color:#85C1E9;\">Expense Category<\/b><\/td>";
	            
	                //PDFPrint += " <td border = \"1\" align=\"center\" style=\" font-size:11px; background-color:#85C1E9;\">Email<\/b><\/td>";
	                PDFPrint += " <\/tr>";
	                PDFPrint += "<\/thead>";
				
				for (a = 0; a < context.values.length; a++) {
                    var result = context.values[a];
                    var PRdetail = JSON.parse(result);
                    log.debug("PRdetail", PRdetail);
					
					var approver_name_line = PRdetail.approverName;
					log.debug("approver_name_line -->", approver_name_line);
						
					var approver_email_line = PRdetail.venEmail;
					log.debug("approver_email_reduce -->", approver_email_line);
					
					var intId_line = PRdetail.internalId;
					log.debug("intId_line -->", intId_line);
					
					var tran_date_reduce = PRdetail.tranDate;
					log.debug("tran_date_reduce -->", tran_date_reduce);
					
					var parentTran_line = PRdetail.parentTran;
					log.debug("parentTran_line reduce -->", parentTran_line);
					
					var vendor_name = PRdetail.venName;
					log.debug("vendor_name reduce -->", vendor_name);
					
					var ven_inv_date = PRdetail.venInvDate;
					log.debug("ven_inv_date reduce -->", ven_inv_date);
					
					var ven_inv_amount = PRdetail.venAmount;
					log.debug("ven_inv_amount reduce -->", ven_inv_amount);
					
					var ven_inv_subsidiary = PRdetail.venSubsidiary;
					log.debug("ven_inv_subsidiary reduce -->", ven_inv_subsidiary);
					
					var ven_inv_age_in_days = PRdetail.ageInDays;
					log.debug("ven_inv_age_in_days reduce -->", ven_inv_age_in_days);
					
					var ven_inv_exp_cat = PRdetail.expCategory;
					log.debug("ven_inv_exp_cat reduce -->", ven_inv_exp_cat);
					
					PDFPrint += " <tr>";
					PDFPrint += " <td border = \"1\" style=\"font-size:11px;\" >" + parentTran_line  + "<\/td>";
					PDFPrint += " <td border = \"1\" style=\"font-size:11px;\" >" + tran_date_reduce  + "<\/td>";
					PDFPrint += " <td border = \"1\" style=\"font-size:11px;\" >" + ven_inv_amount  + "<\/td>";
					PDFPrint += " <td border = \"1\" style=\"font-size:11px;\" >" + ven_inv_subsidiary  + "<\/td>";
                    PDFPrint += " <td border = \"1\" style=\"font-size:11px;\" >" + approver_name_line + "<\/td>";
					PDFPrint += " <td border = \"1\" style=\"font-size:11px;\" >" + vendor_name  + "<\/td>";
                    PDFPrint += " <td border = \"1\" style=\"font-size:11px;\" >" + ven_inv_date + "<\/td>";
                    PDFPrint += " <td border = \"1\" style=\"font-size:11px;\" >" + ven_inv_exp_cat + "<\/td>";
                    //PDFPrint += " <td border = \"1\" style=\"font-size:11px;\" >" + approver_email_line + "<\/td>";
					PDFPrint += " <\/tr>";
					
				}
				
				PDFPrint += " <\/table>";
				PDFPrint += " Thank You. ";
				
				
				log.audit("approver_email 336-->",approver_email)
				log.audit("PDFPrint 338-->",PDFPrint)
				log.audit("supervisorEmail 339-->",supervisorEmail)
				
				email_sales_admin.push(supervisorEmail);
                log.debug("array of email SA", email_sales_admin);
				
				var salesAdminEmailId=email_sales_admin;
                
                 //email sending code 
				   /*   var senderId = 77405; //my employee id 
					 var receipientEmail = email_array;
					 var salesAdminEmailId=email_sales_admin;
					 email.send({
						 author: senderId,
						 recipients: receipientEmail,
						 cc: salesAdminEmailId,
						 subject: 'Regarding Agreement ',
						 body: ' your agreement has expired'
						 //content,
					 }); */
					 
					 if(jobTitle == 'Chief Financial Officer' || jobTitle == 'Chief Executive Officer' || jobTitle == 'Managing Director' ){
						 email.send({
							author: 118,
							recipients: approver_email,
							subject: 'Vendor Invoice Pending for Approval',
							body: PDFPrint
						});
					 }else if(approver_email && PDFPrint){
						email.send({
							author: 118,
							recipients: approver_email,
							cc: salesAdminEmailId,
							subject: 'Vendor Invoice Pending for Approval',
							body: PDFPrint
							
						});
						log.audit("Email Sent successfully-->",approver_name_reduce)
					}else{
						log.audit("Email Not Sent !!!!-->",approver_name_reduce)
					}
			}
			
	        /**
	         * Executes when the summarize entry point is triggered and applies to the result set.
	         *
	         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
	         * @since 2015.1
	         */
	        function summarize(summary) {
				
				var tran_ven_email;
				var tran_aprove_name;
				var par_tran_id;
				
				summary.output.iterator().each(function(key, value) {

                    var s_value = JSON.parse(value);
					log.audit("s_value",s_value);
					
					var intId = s_value.internalId;
					log.debug("internalID summary",intId); 
					
					par_tran_id = s_value.parentTran;
					tran_aprove_name = s_value.approverName;
					tran_ven_email = s_value.venEmail;
					
                    return true;
                });
				
				log.debug("tran_ven_email summary",tran_ven_email); 
				log.debug("tran_aprove_name summary",tran_aprove_name); 
				log.debug("par_tran_id summary",par_tran_id); 
				
				var email_content = "Dear "+ tran_aprove_name+ ",";
					email_content += "<br>";
					email_content += par_tran_id + " is pending for approval at your end for more then 4 days.<br>";
					email_content += " Kindly approve it as soon as possible. <br> ";
					email_content += " THANK YOU. ";
					
				log.debug("email_content",email_content);
				
				if(tran_ven_email && email_content){
					email.send({
						author: 118,
						recipients: tran_ven_email,
						subject: 'Approve Vendor Invoice',
						body: email_content,
						cc: supervisorEmail
					});
					
					log.audit("Email Sent successfully",tran_aprove_name)
				}
					
				
				
				
			}
			
			
	        return {
	            getInputData: getInputData,
	            map: map,
				reduce: reduce
	           //summarize: summarize
	        };
			
			

	    });