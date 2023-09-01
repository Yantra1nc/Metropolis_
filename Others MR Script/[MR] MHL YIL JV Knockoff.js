	//1481
/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: MR MHL YIL JV Knockoff
 * File Name: [MR] MHL YIL JV Knockoff.js
 * Created On: 23/05/2023
 * Modified On:
 * Created By:Avinash Lahane(Yantra Inc.)
 * Modified By:
 * Description: JV Knockoff
 *********************************************************** */

	/**
	 * Script Name: 
	 * @NApiVersion 2.x
	 * @NScriptType MapReduceScript
	 * @NModuleScope SameAccount
	 */
	define(['N/file', 'N/format', 'N/record', 'N/search', 'N/runtime', './mhllib', './datellib','./searchlib','N/url','N/email'],
	    /**
	     * @param {file} file
	     * @param {format} format
	     * @param {record} record
	     * @param {search} search
	     * @param {transaction} transaction
	     */
	    function(file, format, record, search, runtime, mhllib, datellib,searchlib,url,email) {

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
	                var My_ARR = [];
	                var scriptObj = runtime.getCurrentScript();
	                var deploymentId = scriptObj.deploymentId;
	                //log.audit("deployment Id", deploymentId)

	                 var param_user_id = scriptObj.getParameter({
	                    name: 'custscript_jv_test'
	                });
					
					var param_user_email = scriptObj.getParameter({
	                    name: 'custscript_jv_email'
	                });
					log.debug("param_user_email", param_user_email);
	                //log.debug("In Map Reduce Call Successfully", param_user_id); 

	               // var param_user_id = 31409960;

	                //log.debug("In Get Input Reduce Call Successfully", param_user_id);

	                My_ARR.push({'userId':param_user_id,'email':param_user_email});
					
					log.debug("My_ARR",My_ARR);

	                return My_ARR;

	            } catch (e) {

	                log.debug({
	                    title: 'Error Occured while collecting JSON',
	                    details: e
	                });
	            }
	        }

	        function map(context) {
	            log.debug("In Map");
				var key= context.key;
				
				var userValue = context.value; //read the data
				var objParsedValue = JSON.parse(userValue);
				log.debug('userValue', userValue);
				var fileInternalId = objParsedValue.userId;
	            log.debug('fileInternalId', fileInternalId);
				var useremail = objParsedValue.email;
                log.debug('useremail', useremail);
				
				context.write({
					key: useremail,
					value: fileInternalId
				});
				
				
	            /* try {
					var recDate = new Date();
	                var userValue = context.value; //read the data
					var objParsedValue = JSON.parse(userValue);
					log.debug('userValue', userValue);
					var fileInternalId = objParsedValue.userId;
	                log.debug('fileInternalId', fileInternalId);
					var useremail = objParsedValue.email;
	                log.debug('useremail', useremail);
					
	                var csvFile = file.load({
	                    id: fileInternalId
	                });

	                var fileContents = csvFile.getContents();
	                var rowData = fileContents.split("\r\n");
	                var rowDataLen = rowData.length;
	                log.debug("no of rows", rowDataLen);
					
					//var VendorID;
					var s_req_error_file_name = "JV Error File_"+recDate+".csv";
					var s_error_Contents = 'Expence Report External ID , Error \n';

	                for (var k = 1; k < rowData.length - 1; k++) {

	                    var lineValues = rowData[k].split(',');
						
						var VendorID = lineValues[0];
	                    log.debug("VendorID", VendorID);
						var AP_Account = lineValues[1];
	                    log.debug("AP_Account", AP_Account);
						var Account = lineValues[2];
	                    log.debug("Account", Account);
						var Subsidairy = lineValues[3];
	                    log.debug("Subsidairy", Subsidairy);
						var Org = lineValues[4];
	                    log.debug("Org", Org);
						var vendorInvRefNo = lineValues[5];
	                    log.debug("vendorInvRefNo", vendorInvRefNo);
						var jvRefNo = lineValues[6];
	                    log.debug("jvRefNo", jvRefNo);
						var vendorInvAmt = lineValues[7];
	                    log.debug("vendorInvAmt", vendorInvAmt);
						var jvRefAmt = lineValues[8];
	                    log.debug("jvRefAmt", jvRefAmt);
						var JvDate = lineValues[9];
	                    log.debug("JvDate", JvDate);
						var jvMemo = lineValues[10];
	                    log.debug("jvMemo", jvMemo);
						
						var venIntID=vendorSerach(VendorID);
						log.debug("venIntID", venIntID);
						var apAccIntId=accountSearch(AP_Account);
						log.debug("apAccIntId", apAccIntId);
						var accountID=accountSearch(Account);
						log.debug("accountID", accountID);
						var subId=subsidiarySearch(Subsidairy);
						log.debug("subId", subId);
						//return false;

	                    
						
						
						try{
	                        var paymentObj = record.transform({
	                            fromType: "vendor",
	                            fromId: Number(venIntID),
	                            toType: "vendorpayment",
	                            isDynamic: true
	                        });

	                        var flag = 0;

	                        paymentObj.setValue({fieldId: 'apacct',value: apAccIntId});
	                        paymentObj.setValue({fieldId: 'account',value: accountID});
	                        paymentObj.setValue({fieldId: 'subsidiary',value: subId});
	                        paymentObj.setText({fieldId: 'location',text: Org});
	                        paymentObj.setText({fieldId: 'trandate',text: JvDate});
	                        paymentObj.setText({fieldId: 'custbody_mhl_memo',text: jvMemo});
	                      
							
	                        var creditCount = paymentObj.getLineCount({
	                            sublistId: 'apply'
	                        });
							//paymentObj = clearApplyLine(paymentObj);
							var InvAmount;					
							var applyAmount;
	                        for (var t = 0; t < creditCount; t++) {
	                            paymentObj.selectLine({
	                                sublistId: 'apply',
	                                line: t
	                            });
	                            var jv_line_ref_num = paymentObj.getCurrentSublistValue({
	                                sublistId: 'apply',
	                                fieldId: 'internalid'
	                            });
	                          log.debug("jv_line_ref_num1",jv_line_ref_num);
	                            if (jv_line_ref_num == vendorInvRefNo) {
	                               
								 InvAmount=paymentObj.getCurrentSublistValue({
	                                    sublistId: 'apply',
	                                    fieldId: 'total'
	                             });
								 log.debug("InvAmount",InvAmount);

	                            }
								if (jv_line_ref_num == jvRefNo) {
									
								   applyAmount=paymentObj.getCurrentSublistValue({
	                                    sublistId: 'apply',
	                                    fieldId: 'total'
									});
									log.debug("applyAmount",applyAmount);
									applyAmount=(-1)*(applyAmount)
									log.debug("applyAmount",applyAmount);
									
									
								}
	                        }
							
							
							if(InvAmount&&applyAmount){
								log.debug("sencond loop");
							for (var t = 0; t < creditCount; t++) {
								paymentObj.selectLine({
	                                sublistId: 'apply',
	                                line: t
	                            });
	                            var jv_line_ref_num = paymentObj.getCurrentSublistValue({
	                                sublistId: 'apply',
	                                fieldId: 'internalid'
	                            });
								 log.debug("jv_line_ref_num 2",jv_line_ref_num);
								if (jv_line_ref_num == vendorInvRefNo) {
	                               
	                                paymentObj.setCurrentSublistValue({
	                                    sublistId: 'apply',
	                                    fieldId: 'apply',
	                                    value: true
	                                });
									 paymentObj.setCurrentSublistValue({
	                                    sublistId: 'apply',
	                                    fieldId: 'amount',
	                                    value: vendorInvAmt
	                                });
									 paymentObj.commitLine({		
	                                    sublistId: 'apply'
	                                });
								}
								
								if (jv_line_ref_num == jvRefNo) {
									
									paymentObj.setCurrentSublistValue({
	                                    sublistId: 'apply',
	                                    fieldId: 'apply',
	                                    value: true
	                                });
								
										//log.debug("Myyyyyyyyyyttttesssst");
									 paymentObj.setCurrentSublistValue({
	                                    sublistId: 'apply',
	                                    fieldId: 'amount',
	                                    value: jvRefAmt
	                                });
									
									
									paymentObj.commitLine({		
	                                    sublistId: 'apply'
	                                });
								}
							}
							}

	                    
						paymentObj.save();
						csvFile.folder = '501836';
	                    csvFile.save();
						
						

	                }catch(ex){
						log.error(ex.message);
					
					var s_String = vendorInvRefNo + ','  + ex.message;
					s_error_Contents += s_String + '\n';
					var errorID=Jv_Error_Logs(s_req_error_file_name,s_error_Contents);
					log.debug("errorID",errorID);
					} 
					}//end for loop
					
					


	            } catch (ex) {
	                log.error(ex.message);
					var s_String = vendorInvRefNo + ','  + ex.message;
					s_error_Contents += s_String + '\n';
					var errorID=Jv_Error_Logs(s_req_error_file_name,s_error_Contents);
					log.debug("errorID",errorID);
	            }
				if(errorID) {
						context.write({
								key: errorID,
								value: objParsedValue
							});
						}else{
						context.write({
								key: key,
								value: objParsedValue
							});
						} */
	        }
			
			
			function reduce(context) {

				log.debug("reduce KEY", context.key);
				log.debug("reduce Data", context.values);
				log.debug("reduce Length", context.values.length);

				var fileInternalId = context.values[0];
                log.debug("fileInternalId reduce", fileInternalId);

                var email_reduce = context.key;
                log.audit("email_reduce -->", email_reduce);
				
				try {
					var recDate = new Date();
	                
	                var csvFile = file.load({
	                    id: fileInternalId
	                });

	                var fileContents = csvFile.getContents();
	                var rowData = fileContents.split("\r\n");
	                var rowDataLen = rowData.length;
	                log.debug("no of rows", rowDataLen);
					
					//var VendorID;
					var s_req_error_file_name = "JV Error File_"+recDate+".csv";
					var s_error_Contents = 'Expence Report External ID , Error \n';

	                for (var k = 1; k < rowData.length - 1; k++) {

	                    var lineValues = rowData[k].split(',');
						
						var VendorID = lineValues[0];
	                    log.debug("VendorID", VendorID);
						var AP_Account = lineValues[1];
	                    log.debug("AP_Account", AP_Account);
						var Account = lineValues[2];
	                    log.debug("Account", Account);
						var Subsidairy = lineValues[3];
	                    log.debug("Subsidairy", Subsidairy);
						var Org = lineValues[4];
	                    log.debug("Org", Org);
						var vendorInvRefNo = lineValues[5];
	                    log.debug("vendorInvRefNo", vendorInvRefNo);
						var jvRefNo = lineValues[6];
	                    log.debug("jvRefNo", jvRefNo);
						var vendorInvAmt = lineValues[7];
	                    log.debug("vendorInvAmt", vendorInvAmt);
						var jvRefAmt = lineValues[8];
	                    log.debug("jvRefAmt", jvRefAmt);
						var JvDate = lineValues[9];
	                    log.debug("JvDate", JvDate);
						var jvMemo = lineValues[10];
	                    log.debug("jvMemo", jvMemo);
						
						var venIntID=vendorSerach(VendorID);
						log.debug("venIntID", venIntID);
						var apAccIntId=accountSearch(AP_Account);
						log.debug("apAccIntId", apAccIntId);
						var accountID=accountSearch(Account);
						log.debug("accountID", accountID);
						var subId=subsidiarySearch(Subsidairy);
						log.debug("subId", subId);
						//return false;

	                    
						
						
						try{
	                        var paymentObj = record.transform({
	                            fromType: "vendor",
	                            fromId: Number(venIntID),
	                            toType: "vendorpayment",
	                            isDynamic: true
	                        });

	                        var flag = 0;

	                        paymentObj.setValue({fieldId: 'apacct',value: Number(apAccIntId)});
	                        paymentObj.setValue({fieldId: 'subsidiary',value: Number(subId)});
							paymentObj.setValue({fieldId: 'account',value: Number(accountID)});
	                        paymentObj.setText({fieldId: 'location',text: Org});
	                        paymentObj.setText({fieldId: 'trandate',text: JvDate});
	                        paymentObj.setText({fieldId: 'custbody_mhl_memo',text: jvMemo});
	                      
							
	                        var creditCount = paymentObj.getLineCount({
	                            sublistId: 'apply'
	                        });
							//paymentObj = clearApplyLine(paymentObj);
							var InvAmount;					
							var applyAmount;
	                        for (var t = 0; t < creditCount; t++) {
	                            paymentObj.selectLine({
	                                sublistId: 'apply',
	                                line: t
	                            });
	                            var jv_line_ref_num = paymentObj.getCurrentSublistValue({
	                                sublistId: 'apply',
	                                fieldId: 'internalid'
	                            });
								
	                          log.debug("jv_line_ref_num1",jv_line_ref_num);
							  
							  //11749517 = 21885
							  //11749517 = 60125595
	                            if (jv_line_ref_num == vendorInvRefNo) {
	                               
								 InvAmount=paymentObj.getCurrentSublistValue({
	                                    sublistId: 'apply',
	                                    fieldId: 'total'
	                             });
								 log.debug("InvAmount",InvAmount);

	                            }
								
								// 11749517 = 11749517
								if (jv_line_ref_num == jvRefNo) {
									
								   applyAmount=paymentObj.getCurrentSublistValue({
	                                    sublistId: 'apply',
	                                    fieldId: 'total'
									});
									log.debug("applyAmount",applyAmount);
									applyAmount=(-1)*(applyAmount)
									log.debug("applyAmount",applyAmount);
									
									
								}
	                        }
							
							
							if(InvAmount || applyAmount){
								log.debug("sencond loop");
							for (var t = 0; t < creditCount; t++) {
								paymentObj.selectLine({
	                                sublistId: 'apply',
	                                line: t
	                            });
	                            var jv_line_ref_num = paymentObj.getCurrentSublistValue({
	                                sublistId: 'apply',
	                                fieldId: 'internalid'
	                            });
								 log.debug("jv_line_ref_num 2",jv_line_ref_num);
								 
								//
									
								if (jv_line_ref_num == vendorInvRefNo) {
	                               
	                                paymentObj.setCurrentSublistValue({
	                                    sublistId: 'apply',
	                                    fieldId: 'apply',
	                                    value: true
	                                });
									 paymentObj.setCurrentSublistValue({
	                                    sublistId: 'apply',
	                                    fieldId: 'amount',
	                                    value: vendorInvAmt
	                                });
									 paymentObj.commitLine({		
	                                    sublistId: 'apply'
	                                });
								}
								
								if (jv_line_ref_num == jvRefNo) {
									
									paymentObj.setCurrentSublistValue({
	                                    sublistId: 'apply',
	                                    fieldId: 'apply',
	                                    value: true
	                                });
								
										//log.debug("Myyyyyyyyyyttttesssst");
									 paymentObj.setCurrentSublistValue({
	                                    sublistId: 'apply',
	                                    fieldId: 'amount',
	                                    value: jvRefAmt
	                                });
									
									
									paymentObj.commitLine({		
	                                    sublistId: 'apply'
	                                });
								}
							}
							}

	                    
						paymentObj.save();
						csvFile.folder = '501836';
	                    csvFile.save();
						
						

	                }catch(ex){
						log.error(ex.message);
					
					var s_String = vendorInvRefNo + ','  + ex.message;
					s_error_Contents += s_String + '\n';
					var errorID=Jv_Error_Logs(s_req_error_file_name,s_error_Contents);
					log.debug("errorID",errorID);
					} 
					}//end for loop
					


	            } catch (ex) {
	                log.error(ex.message);
					var s_String = vendorInvRefNo + ','  + ex.message;
					s_error_Contents += s_String + '\n';
					var errorID=Jv_Error_Logs(s_req_error_file_name,s_error_Contents);
					log.debug("errorID",errorID);
	            }
				
				if(errorID) {
					context.write(errorID,email_reduce);
					//context.write('email',email_reduce);
					}else{
					context.write('error',email_reduce);
					//context.write('emailsecond',email_reduce);
				}
		
				
				//return false;

				/*  context.write({
					 key: context.key,
					 value: context.values.length
				 });  */
				 
				/* var o_index = context.values[0];
                var APDetails = JSON.parse(o_index);
                log.debug("APDetails", APDetails);

                var email_name_reduce = APDetails.email;
                log.audit("email_name_reduce -->", email_name_reduce);
				
				var errorfileID=context.key;
				 
				 try{
					var accountLink = url.resolveDomain({
					hostType: url.HostType.APPLICATION
					});
				 var csvFile = file.load({
	                    id: errorfileID
	                });
					
						var URL = csvFile.url
						var finalURL = 'https://'+accountLink+URL  

						log.debug("Pdf Url ---->", finalURL);
					
				 }catch(e){
					 log.debug("Error File Not Found");
				 }
				 var PDFPrint; 
				 if(finalURL){
				 //var PDFPrint;
                    PDFPrint = "Dear User,<br>";
                    PDFPrint += "<br>";
                    PDFPrint += "The JV Knockoff file process is completed, Please find below URL for error record.<br>";
					PDFPrint += "<br>";
					PDFPrint += "Report Url:: "+ finalURL+ "<br>";
				 }else{
					PDFPrint = "Dear User,<br>";
                    PDFPrint += "<br>";
                    PDFPrint += "The JV Knockoff file process Successfully completed.<br>";
				 }
				 
				 if(email_name_reduce && PDFPrint){
                    email.send({
                        author: 118,
                        recipients: email_name_reduce,
                        subject: 'JV Knockoff Process Status',
                        body: PDFPrint
                    });
                    
                    log.audit("Email Sent successfully-->",email_name_reduce);
                }
				  */

				
				//return false;
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
				
				var s_key;
				var s_value;
				
				summary.output.iterator().each(function(key, value) {

					s_key = key;
                    s_value = value;
					
                    return true;
                });
				log.audit("s_key summary",s_key);
				log.audit("s_value summary",s_value);
				
				//log.debug("s_value",s_value); 
				/* log.debug("tran_aprove_name summary",tran_aprove_name); 
				log.debug("par_tran_id summary",par_tran_id);  */
				
				//return false;
				
				try{
					var accountLink = url.resolveDomain({
					hostType: url.HostType.APPLICATION
					});
				 var csvFile = file.load({
	                    id: s_key
	                });
					
						var URL = csvFile.url
						var finalURL = 'https://'+accountLink+URL  

						log.debug("Pdf Url ---->", finalURL);
					
				 }catch(e){
					 log.debug("Error File Not Found");
				 }
				 var PDFPrint; 
				 if(finalURL){
				 //var PDFPrint;
                    PDFPrint = "Dear User,<br>";
                    PDFPrint += "<br>";
                    PDFPrint += "The JV Knockoff file process is completed, Please find below URL for error record.<br>";
					PDFPrint += "<br>";
					PDFPrint += "Report Url:: "+ finalURL+ "<br>";
				 }else{
					PDFPrint = "Dear User,<br>";
                    PDFPrint += "<br>";
                    PDFPrint += "The JV Knockoff file process Successfully completed.<br>";
				 }
				 
				 if(s_value && PDFPrint){
                    email.send({
                        author: 118,
                        recipients: s_value,
                        subject: 'JV Knockoff Process Status',
                        body: PDFPrint
                    });
                    
                    log.audit("Email Sent successfully-->",s_value);
                }
			}
			
			
			
		function Jv_Error_Logs(s_file_name,s_file_contents)
		{
			var o_file_headers = { name: s_file_name, fileType: file.Type.CSV, contents: s_file_contents, folder: 1198803 };
			var o_file_obj = file.create(o_file_headers);
			var i_error_file_id = o_file_obj.save();
			log.debug("i_error_file_id",i_error_file_id);
			return i_error_file_id;
		}
 
			 function vendorSerach(venInvId){
				 var vendorSearchObj = search.create({
						   type: "vendor",
						   filters:
						   [
							  [["custentity_mhl_vendor_sapreferencecode","is",venInvId],"OR",["entityid","is",venInvId]]
						   ],
						   columns:
						   [
							  search.createColumn({name: "internalid", label: "Internal ID"}),
							  search.createColumn({name: "altname", label: "Name"})
						   ]
						});
						
						var resultSet = vendorSearchObj.run().getRange({
							start: 0,
							end: 1
						});
						var vendorId = resultSet[0].getValue({
								name: "internalid",
								label: "Internal ID"
						   });
						   return vendorId;
			 }
			 
			 function accountSearch(account){
				 var accountSearchObj = search.create({
					   type: "account",
					   filters:
					   [
						  ["number","is",account]
					   ],
					   columns:
					   [
						  search.createColumn({name: "internalid", label: "Internal ID"})
					   ]
					});
					
					var resultSet = accountSearchObj.run().getRange({
						start: 0,
						end: 1
					});
					
					var accIntId = resultSet[0].getValue({
							name: "internalid",
							label: "Internal ID"
					   });
					   return accIntId;
			 }
			 
			 function subsidiarySearch(subsidiary){
				 var subsidiarySearchObj = search.create({
				   type: "subsidiary",
				   filters:
				   [
					  ["name","contains",subsidiary]
				   ],
				   columns:
				   [
					  search.createColumn({name: "internalid", label: "Internal ID"})
				   ]
				});
				
					var resultSet = subsidiarySearchObj.run().getRange({
						start: 0,
						end: 1
					});
					
					var subID = resultSet[0].getValue({
							name: "internalid",
							label: "Internal ID"
					   });
					   return subID;
				
				/* var searchResultCount = subsidiarySearchObj.runPaged().count;
				log.debug("subsidiarySearchObj result count",searchResultCount);
				subsidiarySearchObj.run().each(function(result){
				   // .run().each has a limit of 4,000 results
				   return true;
				}); */

			 }
			
	        return {
	            getInputData: getInputData,
	            map: map,
				reduce:reduce,
	            summarize: summarize
	        };

	    });