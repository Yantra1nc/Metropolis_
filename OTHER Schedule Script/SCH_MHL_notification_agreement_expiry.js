/*

Script Name: SCH_MHL_notification_agreement_expiry.js  
Script Type: ScheduledScript
Created Date: 11/11/2021
Created By: Trupti Gujarathi.
Company : Yantra Inc.
Description: 
*************************************************************/
/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
 define(['N/search', 'N/record', 'N/email', 'N/runtime'],
 function(search, record, email, runtime) {

     function execute(context) {
         try {
             log.debug('in execute load ');
             RunSaveSearch(context);
             return true;
         } catch (e) {
             log.error('function execute error message: ', e.message);
         }
     }

     function RunSaveSearch(context) {
         log.debug('in saved search load ');
         var mySearch = search.load({
             id: 'customsearch1206738' //savedsearch id name Agreement Details Search_12
         })
         var array = [];
         mySearch.run().each(function(result) {
             log.debug('result', result);
         });
         var a_search_results = mySearch.run().getRange({
             start: 0,
             end: 1000
         });
         log.debug('schedulerFunction', '  Search Results  -->', a_search_results);

         if (_logValidation(a_search_results)) {
             for (var i = 0; i < a_search_results.length; i++) {
                 var i_entityid = a_search_results[i].getValue({
                     name: "custrecord_mhl_ad_customer",
                 });
                 log.debug('custrecord_mhl_ad_customer', i_entityid);

                 var clientName = a_search_results[i].getText({
                    name: "custrecord_mhl_ad_customer",
                });   //client name. 
                
                 var salesrep = a_search_results[i].getValue({
                     name: "salesrep",
                     join: "CUSTRECORD_MHL_AD_CUSTOMER"

                 });
                 log.debug('sales rep', salesrep);
                 // customer record load
                 var orgId = a_search_results[i].getValue({
                    name: "custentity_mhl_cust_lims_org_code",
                    join: "CUSTRECORD_MHL_AD_CUSTOMER"

                });  
                //org id.
                log.debug("OrgId",orgId);
                
                var orgName = a_search_results[i].getValue({
                    name: "custentity_mhl_cus_org",
                    join: "CUSTRECORD_MHL_AD_CUSTOMER"
               });  //org name.
               
               log.debug("Org name",orgName);
               
               var orgNameText = a_search_results[i].getText({
                    name: "custentity_mhl_cus_org",
                    join: "CUSTRECORD_MHL_AD_CUSTOMER"
               });  //org name.
               
               var clientCode = a_search_results[i].getValue({
                   name: "custentity_mhl_cust_code_old",
                   join: "CUSTRECORD_MHL_AD_CUSTOMER"
               });
               
               log.debug("clientCode",clientCode);
               
               var paymentMode = a_search_results[i].getValue({
                   name: "custentity_mhl_customer_payment_mode",
                   join: "CUSTRECORD_MHL_AD_CUSTOMER"
               });
               
               var paymentModeText = a_search_results[i].getText({
                   name: "custentity_mhl_customer_payment_mode",
                   join: "CUSTRECORD_MHL_AD_CUSTOMER"
               });
               
               log.debug("paymentMode",paymentMode);
               
               var startDate = a_search_results[i].getValue({
                   name: "custrecord_mhl_ad_start_date"
               });
               
               log.debug("startDate",startDate);
               
               var endDate = a_search_results[i].getValue({
                   name: "custrecord_mhl_ad_end_date"
               });
               
               log.debug("endDate",endDate);
// customer record load
                 var o_recCust_obj = record.load({
                     type: record.Type.CUSTOMER,
                     id: i_entityid,
                     isDynamic: true,
                 });
                 //revenue segment value 
                 var rev_segment = o_recCust_obj.getValue({
                    fieldId: "custentity_mhl_cus_revenue_segment"
                });
                log.debug('rev_segment', rev_segment);
                
                var rev_segmentText = o_recCust_obj.getText({
                    fieldId: "custentity_mhl_cus_revenue_segment"
                });

                 var o_recOrg_obj = record.load({
                     type: record.Type.LOCATION,
                     id: orgName,
                     isDynamic: true,
                 });
                 
                 var s_sales_team_count = o_recCust_obj.getLineCount({
                     sublistId: 'salesteam'
                 });

                 log.debug("sales count", s_sales_team_count);
                 var email_array = new Array();
                 var email_sales_admin=new Array();

                 for (var j = 0; j < s_sales_team_count; j++) {


                     var i_sales_team_id = o_recCust_obj.getSublistValue({
                         sublistId: 'salesteam', //salesteam 
                         fieldId: 'employee', //employee
                         line: j //for var
                     });
                     log.debug("i_sales_team_id", i_sales_team_id);

                     var o_recEmpObj = record.load({
                         type: record.Type.EMPLOYEE,
                         id: i_sales_team_id,
                         isDynamic: true,
                     });
                     //get value email

                     var emp_cust_email_id = o_recEmpObj.getValue({
                         fieldId: 'email'
                     });
                     log.debug("email ids", emp_cust_email_id);
                     email_array.push(emp_cust_email_id);
                     //push into array
                     log.debug("array of email", email_array);

                 } //inner for loop end !!!
                 var org_sales_admin_emailId = o_recOrg_obj.getValue({
                    fieldId: "custrecord198"
                })
                log.debug('org_sales_admin_emailId', org_sales_admin_emailId);

                email_sales_admin.push(org_sales_admin_emailId);
                log.debug("array of email SA", email_sales_admin);
                
                 //email sending code 
                 var senderId = 223775; // nikhil shettey id
                 var receipientEmail = email_array;
                 var salesAdminEmailId=email_sales_admin;
                 
                 //email code to add table data.
				 log.debug("table started....")
				 try
				 {
				 var strVar="";
						strVar += "<!DOCTYPE html>";
						strVar += "<html>";
						strVar += "<head>";
						strVar += "<style>";
						strVar += "table {";
						strVar += "  font-family: arial, sans-serif;";
						strVar += "  border-collapse: collapse;";
						strVar += "  width: 100%;";
						strVar += "}";
						strVar += "";
						strVar += "td, th {";
						strVar += "  border: 1px solid #dddddd;";
						strVar += "  text-align: left;";
						strVar += "  padding: 8px;";
						strVar += "}";
						strVar += "";
						strVar += "tr{";
						strVar += "  background-color: #FFFFFF;";
						strVar += "}";
						strVar += "<\/style>";
						strVar += "<\/head>";
						strVar += "<body>";
                        strVar +="Dear Sir / Madam, <br><br>"
                        strVar +="Please find the client details for which agreement will be expiring in next 30 days <br><br>"
						strVar += "<table>";
						strVar += "  <tr>";
						strVar += "  <\/tr>";
						strVar += "  <tr>";
						strVar += '    <th style="border: 1px solid;">Org Name<\/th>';
						strVar += '   <td style="border: 1px solid;">'+ orgNameText + '</td>';
						strVar += "  <\/tr>";
						strVar += "  <tr>";
						strVar += '    <th style="border: 1px solid;">Org Id<\/th>';
						strVar += '   <td style="border: 1px solid;">'+ orgId + '</td>';
						strVar += "  <\/tr>";
						strVar += "  <tr>";
						strVar += '    <th style="border: 1px solid;">Client Code<\/th>';
						strVar += '   <td style="border: 1px solid;">'+ clientCode + '</td>';
						strVar += "  <\/tr>";
						strVar += "  <tr>";
						strVar += '    <th style="border: 1px solid;">Client Name<\/th>';
						strVar += '   <td style="border: 1px solid;">'+ clientName + '</td>';
						strVar += "  <\/tr>";
						strVar += "  <tr>";
						strVar += '   <th style="border: 1px solid;">Payment Mode<\/th>';
						strVar += '   <td style="border: 1px solid;">'+ paymentModeText + '</td>';
						strVar += "  <\/tr>";
						strVar += "  <tr>";
						strVar += '    <th style="border: 1px solid;">Revenue Segment<\/th>';
						strVar += '   <td style="border: 1px solid;">'+ rev_segmentText + '</td>';
						strVar += "  <\/tr>";
						strVar += "  <tr>";
						strVar += '    <th style="border: 1px solid;">Start Date<\/th>';
						strVar += '   <td style="border: 1px solid;">'+ startDate + '</td>';
						strVar += "  <\/tr>";
						strVar += "  <tr>";
						strVar += '    <th style="border: 1px solid;">End Date<\/th>';
						strVar += '   <td style="border: 1px solid;">'+ endDate + '</td>';
						strVar += "  <\/tr>";
						
						strVar += '</table>';
						strVar += "<\/body>";
						strVar += "<\/html>";
						strVar += "";
				 }
				 catch(e)
				 {
					 log.error("Error occured",e);
				 }

                 email.send({
                     author: 223775,
                     recipients: receipientEmail,
                     cc: salesAdminEmailId,
                     subject: 'Your agreement will be expiring in next 30 days ',
                     body: strVar
                     //content,

                 });
                 log.debug("email send")
             } //Outer for loop end

         }

     }

     function _logValidation(value) {
         if (value != null && value != '' && value != undefined && value.toString() != 'NaN' && value != NaN) {
             return true;
         } else {
             return false;
         }
     }
     return {
         execute: execute,
         RunSaveSearch: RunSaveSearch
     };
 });