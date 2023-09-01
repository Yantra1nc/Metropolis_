/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: MHL UE Due Date Cal Ven Inv
 * File Name: MHL UE Due Date Cal Ven Inv.js
 * Created On: 09/06/2022
 * Modified On: 
 * Created By: Sunil (Yantra Inc.)
 * Modified By: 
 * Description: Due Date calculation on Vendor Invoice
 *********************************************************** */
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/currentRecord', 'N/format' , 'N/runtime'],
    function(record, search, currentRecord, format , runtime) {

        function afterSubmit(scriptContext) {
            try {

                var user = runtime.getCurrentUser();
                var i_current_user = user.id;
                //log.debug('Runtime','i_current_user - ' + i_current_user);
                
                var o_recObj = scriptContext.newRecord;
                var i_rec_id = scriptContext.newRecord.id;
                var s_record_type = scriptContext.newRecord.type;

                /*var recordId = scriptContext.newRecord.id;
                log.debug('recordId :- ', recordId);
                var currObj = scriptContext.newRecord;
				var recObj = record.load({
					type: record.Type.VENDOR_BILL,
					id: recordId,
					isDynamic: true,
				});*/

                var o_recordObj = record.load({type: s_record_type,id: i_rec_id,isDynamic: true});

                var dueDate = o_recordObj.getValue({
                    fieldId: 'duedate'
                });
                log.debug("Due Date = ", dueDate);

                var lastest_date = o_recordObj.getValue({fieldId:'custbody_grn_srn_date'});
                log.debug("lastest_date before_load",lastest_date);
          
                var ven_id= o_recordObj.getValue('entity');
          
                if (ven_id) {
                    var ven_Obj = record.load({
                        type: 'vendor',
                        id: ven_id,
                       isDynamic: true
                    });
                    log.debug("ven obj",ven_Obj);
          
                    var registration= ven_Obj.getValue('custentity_mhl_vendor_msmeregistered');
                    log.debug("registration",registration);
          
                }
          
          
                if(_logValidation(lastest_date) && registration == false){
                /*var venInvDate = recObj.getText({
                    fieldId: 'custbody_mhl_vb_vendorinvoicedate'
                });
                log.debug("Ven Inv Date = ", venInvDate);*/


                   //above code was commented as due date calculation will be down on custom firld sourcing grn date
                //the following chnge is made by Ujjwala
                var venInvDate = o_recordObj.getText({
                    fieldId: 'custbody_grn_srn_date'
                });
                log.debug("Ven Inv Date = if ", venInvDate);
            }
            else{
                var venInvDate = o_recordObj.getText({
                    fieldId: 'custbody_mhl_vb_vendorinvoicedate'
                });
                log.debug("Ven Inv Date =  else", venInvDate);
            }
                var term = o_recordObj.getValue({
                    fieldId: 'terms'
                });
                log.debug("Term -----> ", term);
				
				if(_logValidation(term)){
                var termSearchObj = search.create({
                    type: "term",
                    filters: [
                        ["internalid", "anyof", term]
                    ],
                    columns: [
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({
                            name: "daysuntilnetdue",
                            label: "Days Till Net Due"
                        })
                    ]
                });
				  var dayTerm =''
                var searchResultCount = termSearchObj.runPaged().count;
                log.debug("termSearchObj result count", searchResultCount);
                termSearchObj.run().each(function(result) {
                    // .run().each has a limit of 4,000 results

                     dayTerm = result.getValue({
                        name: 'daysuntilnetdue'
                    });
                    log.debug("Days Until  -----> ", dayTerm);

                    // var formattedFdate = format.format({
                    //     value: venInvDate,
                    //     type: format.Type.DATE
                    // });
                    // log.debug("I date  -----> ", formattedFdate);
                    return true;
                });
				
				if(_logValidation(dayTerm)){
				
				
				var i_date_to_string = addDays(venInvDate, dayTerm);
                    log.debug("I to date  -----> ", i_date_to_string);
					o_recordObj.setText({fieldId:'duedate',text:i_date_to_string})
					var recordId = o_recordObj.save({
								enableSourcing: true,
								ignoreMandatoryFields: true
							});
					//log.debug('Record Updated Succesfully',recordId)
												
                   /* record.submitFields({
                        id: scriptContext.newRecord.id,
                        type: scriptContext.newRecord.type,
                        values: {
                            'duedate': i_date_to_string
                        }
                    })
					*/
				}
				}
            } catch (e) {
                log.debug("Error = ", e);
            }
        }
		
		function beforeLoad(scriptContext) {
            try {
		if(scriptContext.type == scriptContext.UserEventType.VIEW){
                var recordId = scriptContext.newRecord.id;
                log.debug('recordId :- ', recordId);
                var currObj = scriptContext.newRecord;
				var recObj = record.load({
					type: record.Type.VENDOR_BILL,
					id: recordId,
					isDynamic: true,
				});

                var dueDate = recObj.getValue({
                    fieldId: 'duedate'
                });
                log.debug("Due Date = ", dueDate);

                	
                var lastest_date = recObj.getValue({fieldId:'custbody_grn_srn_date'});
                log.debug("lastest_date before_load",lastest_date);
          
                var ven_id= recObj.getValue('entity');
          
                if (ven_id) {
                    var ven_Obj = record.load({
                        type: 'vendor',
                        id: ven_id,
                       isDynamic: true
                    });
                    log.debug("ven obj before_load",ven_Obj);
          
                    var registration= ven_Obj.getValue('custentity_mhl_vendor_msmeregistered');
                    log.debug("registration before_load",registration);
          
                }
                if(_logValidation(lastest_date) && registration == false){

               /* var venInvDate = recObj.getText({
                    fieldId: 'custbody_mhl_vb_vendorinvoicedate'
                });
                log.debug("Ven Inv Date = ", venInvDate);*/

         //above code was commented as due date calculation will be down on custom firld sourcing grn date
                //the following chnge is made by Ujjwala
                var venInvDate = o_recordObj.getText({
                    fieldId: 'custbody_grn_srn_date'
                });
                log.debug("Ven Inv Date = if before_load ", venInvDate);
            }
            else{
                var venInvDate = o_recordObj.getText({
                    fieldId: 'custbody_mhl_vb_vendorinvoicedate'
                });
                log.debug("Ven Inv Date = else before_load ", venInvDate);
            }



                var term = recObj.getValue({
                    fieldId: 'terms'
                });
                log.debug("Term -----> ", term);
				
				if(_logValidation(term)){
                var termSearchObj = search.create({
                    type: "term",
                    filters: [
                        ["internalid", "anyof", term]
                    ],
                    columns: [
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({
                            name: "daysuntilnetdue",
                            label: "Days Till Net Due"
                        })
                    ]
                });
				var dayTerm=''
                var searchResultCount = termSearchObj.runPaged().count;
                log.debug("termSearchObj result count", searchResultCount);
                termSearchObj.run().each(function(result) {
                    // .run().each has a limit of 4,000 results

                     dayTerm = result.getValue({
                        name: 'daysuntilnetdue'
                    });
                    log.debug("Days Until  -----> ", dayTerm);

                    // var formattedFdate = format.format({
                    //     value: venInvDate,
                    //     type: format.Type.DATE
                    // });
                    // log.debug("I date  -----> ", formattedFdate);
                    return true;
                });
				
				if(_logValidation(dayTerm)){
				var i_date_to_string = addDays(venInvDate, dayTerm);
                    log.debug("I to date  -----> ", i_date_to_string);
					recObj.setText({fieldId:'duedate',text:i_date_to_string})
					var recordId = recObj.save({
								enableSourcing: true,
								ignoreMandatoryFields: true
							});
					log.debug('Record Updated Succesfully',recordId)
											
                    /*record.submitFields({
                        id: scriptContext.newRecord.id,
                        type: scriptContext.newRecord.type,
                        values: {
                            'duedate': i_date_to_string
                        }
                    })*/
					
				}
				}
		}
            } catch (e) {
                log.debug("Error = ", e);
            }
        }


        function addDays(date, days) {
            log.debug("Date -->", date)
            var strDate = date.split("/");
			var dateFormat=''
            strDate = strDate[1] + "/" + strDate[0] + "/" + strDate[2]
            var result = new Date(strDate);

            

            result.setDate(result.getDate() + Number(days));
			log.debug("result -->", result)
			dateFormat=result.getDate()+"/"+(result.getMonth()+1)+"/"+result.getFullYear()
			log.debug("dateFormat -->", dateFormat)
            return dateFormat;
        }
		
		
        function _logValidation(value) {
            if (value != 'null' && value != null && value != null && value != '' && value != undefined && value != undefined && value != 'undefined' && value != 'undefined' && value != 'NaN' && value != NaN && value != 'Infinity') {
                return true;
            } else {
                return false;
            }
        }

        return {
			//beforeLoad:beforeLoad,
            afterSubmit: afterSubmit
        }
    });