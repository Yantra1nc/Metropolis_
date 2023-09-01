/*************************************************************
 * File Header
 * Script Type: Scheduled
 * Script Name: MHL SCH MDS Customer 24 Hours Re CSV 2.0
 * File Name: MHL SCH MDS Customer 24 hours CSV Report.js
 * Created On: 30/03/2022
 * Modified On:
 * Created By: Ganesh Sapakale(Yantra Inc.)
 * Modified By:
 * Description: MDS Customer 24 hours CSV Report 
 *********************************************************** */
/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
define(['N/task', 'N/log', 'N/file', 'N/search', 'N/runtime', 'N/record','N/email', 'N/url'],

	function(task, log, file, search, runtime, record, email,url) {
		function execute(context) {
			try {

				var scriptObj = runtime.getCurrentScript();
				var searchId = scriptObj.getParameter({
					name: 'custscript_last_search_id_new'
				});
				var deploymentId = scriptObj.getParameter({
					name: 'custscript_deployment_internal_id_new'
				});

				if (searchId) {
					try {
						// Deleting the search
						search.delete({
							id: searchId
						});
					} catch (e) {

					}
				}

				var fileObj = file.create({
					name: 'Customer Master 24 Hours Report' + ' ' + getCompanyCurrentDateTime() + '.csv',
					fileType: file.Type.CSV,
					contents: null
				});
              	fileObj.isOnline = true;
				fileObj.folder = 474795;

				var id = fileObj.save();

				//create search task
				var myTask = task.create({
					taskType: task.TaskType.SEARCH
				});
				//	myTask.savedSearchId = 802;
				var i_searchOd = searchData();
				log.audit('i_searchOd', i_searchOd);
				myTask.savedSearchId = i_searchOd;
				myTask.fileId = id;
				var myTaskId = myTask.submit();
				log.debug({
					title: "CSV File generated",
					details: "Put results of savedSearchId:802 in csv file InternalID: " + id + ""
				});
				

				var deploymentRec = record.load({
					type: 'scriptdeployment',
					id: deploymentId
				});

				deploymentRec.setValue({
					fieldId: 'custscript_last_search_id_new',
					value: i_searchOd
				});
				deploymentRec.save();
				
				
				var accountLink = url.resolveDomain({
					hostType: url.HostType.APPLICATION
				});
				
				var o_fileObj = file.load({
					id: id
                }); 
					 
				var URL = o_fileObj.url
				var finalURL = 'https://'+accountLink+URL	
					 log.debug("finalURL",finalURL)
				
			email.send({
						author: 118,
						recipients: ['vinod.jadhav@metropolisindia.com','Mdsgroup@metropolisindia.com','pranav.pal@metropolisindia.com','a_tejvir.singh@metropolisindia.com'],
						subject: 'Customer Master 24 Hours Report '+ getCompanyCurrentDateTime(),
						body: 'Hello User, \n Please find the URL To Download Customer Master 24 Hours Report \n URL:: \n '+finalURL ,
						
					});
					

			} catch (e) {
				log.error({
					title: "Error",
					details: e
				});
			}

		}

		function searchData() {
			var s_srattime = getStartTime(); //'30/8/2020 07:00 pm';//getStartTime();
			var s_endtime = getEndTime(); //'29/8/2020 03:00 pm';//getEndTime();
			log.debug({
				title: "searchData",
				details: "Start time " + s_srattime + ""
			});
			log.debug({
				title: "searchData",
				details: "End time " + s_endtime + ""
			});
			var customerSearchObj = search.create({
				type: "customer",
				title: 'MDS Customer Master 24 Hours Report Extract',
				filters: [
					["custentity_mhl_customer_customer_status", "anyof", "2"],
					"AND", ["systemnotes.context", "noneof", ["CSV"]],
					"AND", ["lastmodifieddate", "within", s_srattime, s_endtime],
					"AND", ["systemnotes.context","noneof","SCH"], 
					"AND", ["systemnotes.context","noneof","MPR"]
					/*"AND", ["lastmodifieddate", "within", "15/10/2020 5:00 pm", "15/10/2020 6:00 pm"]*/
					/*["internalid", "anyof", 70060]*/
				],
				columns: [
					search.createColumn({
						name: "formulatext",
						label: "Name",
						formula: "NVL(REGEXP_REPLACE({companyname}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"
					}),
					search.createColumn({
						name: "formulatext",
						label: "CLIENT_CODE",
						formula: "NVL(REGEXP_REPLACE({entityid}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"
					}),
					/*search.createColumn({
						name: "formulanumeric",
						label: "LIMS_ORGANIZATION_CODE",
						formula:"TO_NUMBER({custentity_mhl_extended_to_org.custrecord_mhl_mds_lims_org_id})"

					}),*/

					search.createColumn({
						name: "formulatext",
						label: "LIMS_ORGANIZATION_CODE",
						formula: "NVL(REGEXP_REPLACE({custrecord_mhl_cust_code_ref_ext_org.custrecord_mhl_lims_org_id_of_ext_org}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),

					search.createColumn({
						name: "formulatext",
						label: "CLIENT_LOCATION_CODE",
						formula: "NVL(REGEXP_REPLACE({custrecord_mhl_cust_code_ref_ext_org.custrecord_mhl_collection_center_code}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "BUSINESS_TYPE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_businesstype}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SEGMENT",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_revenue_segment}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "CLIENT_TYPE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_client_type}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PAYMENT_MODE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_customer_payment_mode}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "ADDRESS_LINE_1",
						formula: "NVL(REGEXP_REPLACE({billaddress1}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "ADDRESS_LINE_2",
						formula: "NVL(REGEXP_REPLACE({billaddress2}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SUBURB",
						formula: "NVL(REGEXP_REPLACE({billingaddress.custrecord_mhl_af_suburb}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "CITY",
						formula: "NVL(REGEXP_REPLACE({billcity}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "DISTRICT",
						formula: "NVL(REGEXP_REPLACE({billingaddress.custrecord_mhl_af_district}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "STATE",
						formula: "NVL(REGEXP_REPLACE({billstate}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "COUNTRY",
						formula: "NVL(REGEXP_REPLACE({billcountry}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PIN_CODE",
						formula: "NVL(REGEXP_REPLACE({billzipcode}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "EMAIL_ID",
						formula: "NVL(REGEXP_REPLACE({billingaddress.custrecord_mhl_af_emailaddress}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "COUNTRY_CODE",
						formula: "NVL(REGEXP_REPLACE({billingaddress.custrecord_mhl_af_countrycode}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PRIMARY_MOBILE",
						formula: "NVL(REGEXP_REPLACE({billingaddress.custrecord_mhl_af_primarymob}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SECONDARY_MOBILE",
						formula: "NVL(REGEXP_REPLACE({billingaddress.custrecord_mhl_af_secondarymob}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "STD_CODE",
						formula: "NVL(REGEXP_REPLACE({billingaddress.custrecord_mhl_af_std_code}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "LANDLINE",
						formula: "NVL(REGEXP_REPLACE({billphone}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "FAX_NO",
						formula: "NVL(REGEXP_REPLACE({billingaddress.custrecord_mhl_af_faxno}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "LOGO_PRINT",
						formula: "NVL(REGEXP_REPLACE(CASE {custentity_mhl_cust_logo_print} WHEN 'F' THEN 'No' ELSE 'Yes' END, '[^0-9A-Za-z_ ,.@%-]', ''), '')"
					}),
					search.createColumn({
						name: "formulatext",
						label: "HUB",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_hub}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "ZONE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_zone}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "ROUTE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_route}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "LOCATION",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_location}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PRINT_LOCATION",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_print_location}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "IS_REMOTE_REGISTRATION",
						formula: "NVL(REGEXP_REPLACE(CASE {custentity_mhl_cust_is_remote_resgtrtn} WHEN 'F' THEN 'No' ELSE 'Yes' END, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "IS_CLIENT_ACCESS",
						formula: "NVL(REGEXP_REPLACE(CASE {custentity_mhl_cust_is_client_access} WHEN 'F' THEN 'No' ELSE 'Yes' END, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "IS_OUTSTATION",
						formula: "NVL(REGEXP_REPLACE(CASE {custentity_mhl_cust_is_outstation} WHEN 'F' THEN 'No' ELSE 'Yes' END, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "ONLY_MAPPED_SERVICES",
						formula: "NVL(REGEXP_REPLACE(CASE {custentity_mhl_cust_only_mapped_services} WHEN 'F' THEN 'No' ELSE 'Yes' END, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "BILLING_CYCLE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_invoicing_cycle}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "BILLING_CYCLE_PERIOD",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_billing_cycle_period}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "CST_NUMBER",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_cst_number}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "GST_NUMBER",
						formula: "NVL(REGEXP_REPLACE({defaulttaxreg}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PAN_NUMBER",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_customer_pan_number}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SERVICE_TAX_NUMBER",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_service_tax_no}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "OWNER_NAME",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_ownname}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "OWNER_MOBILE_NUMBER",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_ownmobno}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PRIMARY_PERSON_NAME",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_prpername}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PRIMARY_PERSON_MOBILE_NUMBER_1",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_prpermobno1}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PRIMARY_PERSON_MOBILE_NUMBER_2",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_prpermobno2}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PRIMARY_LANDLINE_NUMBER",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_prlandno}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PRIMARY_EMAIL_ID",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_premlid}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "ACCOUNT_PERSON_NAME",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_acpername}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "ACCOUNT_PERSON_MOBILE_NUMBER_1",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_acpermobno1}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "ACCOUNT_PERSON_MOBILE_NUMBER_2",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_acpermobno2}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "ACCOUNT_PERSON_LANDLINE_NUMBER",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_acperlandno}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "ACCOUNT_PERSON_EMAIL_ID",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_acperemlid}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "FINANCE_PERSON_NAME",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_fipername}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "FINANCE_PERSON_MOBILE_NUMBER_1",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_fipermobno1}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "FINANCE_PERSON_MOBILE_NUMBER_2",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_fipermobno2}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "FINANCE_PERSON_LANDLINE_NUMBER",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_fiperlandno}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "FINANCE_PERSON_EMAIL_ID",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_fiperemlid}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PATIENT_PORTAL",
						formula: "NVL(REGEXP_REPLACE(CASE {custentity_mhl_cust_patient_portal} WHEN 'F' THEN 'No' ELSE 'Yes' END, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "HAS_HEALTH_COUPON",
						formula: "NVL(REGEXP_REPLACE(CASE {custentity_mhl_cust_has_health_coupon} WHEN 'F' THEN 'No' ELSE 'Yes' END, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "RELEASE_DUE_REPORT",
						formula: "NVL(REGEXP_REPLACE(CASE {custentity_mhl_cust_release_due_report} WHEN 'F' THEN 'No' ELSE 'Yes' END, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PROMOTIONAL_EMAIL",
						formula: "NVL(REGEXP_REPLACE(CASE {custentity_mhl_cust_promotional_email} WHEN 'F' THEN 'No' ELSE 'Yes' END, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SUMMARY_REPORT",
						formula: "NVL(REGEXP_REPLACE(CASE {custentity_mhl_cust_summary_mail} WHEN 'F' THEN 'No' ELSE 'Yes' END, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "REPORT_PASSWORD_PROTECTION",
						formula: "NVL(REGEXP_REPLACE(CASE {custentity_mhl_cust_report_paswrd_protec} WHEN 'F' THEN 'No' ELSE 'Yes' END, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "TREND_REPORT",
						formula: "NVL(REGEXP_REPLACE(CASE {custentity_mhl_cust_trend} WHEN 'F' THEN 'No' ELSE 'Yes' END, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "HIDE_CLIENT_NAME_&_ADDRESS",
						formula: "NVL(REGEXP_REPLACE(CASE {custentity_mhl_cust_hide_client_name} WHEN 'F' THEN 'No' ELSE 'Yes' END, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "IS_PARENT_CLIENT",
						formula: "NVL(REGEXP_REPLACE(CASE {custentity_mhl_cust_parent_client} WHEN 'F' THEN 'No' ELSE 'Yes' END, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "IS_GRAND_PARENT_CLIENT",
						formula: "NVL(REGEXP_REPLACE(CASE {custentity_mhl_cust_is_grnd_parentclient} WHEN 'F' THEN 'No' ELSE 'Yes' END, '[^0-9A-Za-z_ ,.@%-]', ''), '')"
					}),
					search.createColumn({
						name: "formulatext",
						label: "IS_CENTRALIZED_BILLING",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_is_centralized_bill}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "IS_BILLING_AT_PARENT_LOCATION",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_is_bill_at_prnt_lctn}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "IS_BILLING_AT_GRAND_PARENT_LOCATION",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_billat_grndprnt_lctn}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "IS_BILLING_AT_CHILD_LOCATION",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_is_billat_child_lctn}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PARENT_CLIENT_CODE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_parent_client_code}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "GRAND_PARENT_CLIENT_CODE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_grnd_prnt_clint_code}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "BANK_NAME_1",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_bank_name_1}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "BANK_BRANCH_NAME_1",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_bank_branch_name_1}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "BANK_ACCOUNT_NUMBER_1",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_bank_account_no_1}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "BANK_ACCOUNT_TYPE_1",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_bank_account_type_1}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "BANK_IFSC_CODE_1",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_bank_ifsc_code_1}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "BANK_NAME_2",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_bank_name_2}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "BANK_BRANCH_NAME_2",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_bank_branch_name_2}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "BANK_ACCOUNT_NUMBER_2",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_bank_account_no_2}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "BANK_ACCOUNT_TYPE_2",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_bank_account_type_2}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "BANK_IFSC_CODE_2",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_bank_ifsc_code_2}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "IS_COPAYMENT",
						formula: "NVL(REGEXP_REPLACE(CASE {custentity_mhl_cust_is_copay} WHEN 'F' THEN 'No' ELSE 'Yes' END, '[^0-9A-Za-z_ ,.@%-]', ''), '')"
					}),
					search.createColumn({
						name: "formulatext",
						label: "COPAYMENT_CLIENT_PERC",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_copayment_clint_perc}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "COPAYMENT_PATIENT_PERC",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_copay_patient_perc}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					/*search.createColumn({
						name: "custentity_mhl_cust_nature_of_entity",
						label: "NATURE_OF_ENTITY"
					}),*/
					search.createColumn({
						name: "formulatext",
						label: "NATURE_OF_ENTITY",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_client_type}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "REPORT_DELIVERY_MODE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_report_delivery_mode}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "REPORT_TYPE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_report_type}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "RECOMMENDED_BY",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_recommended_by}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "DEPOSIT_AMOUNT",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_deposit_amount}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SAP_CODE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_sap_code}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "ALLOW_DISCOUNT",
						formula: "NVL(REGEXP_REPLACE(CASE {custentity_mhl_cust_allow_discount} WHEN 'F' THEN 'No' ELSE 'Yes' END, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "INVOICE_APPROVAL_NEEDED",
						formula: "NVL(REGEXP_REPLACE(CASE {custentity_mhl_cust_inv_approval_needed} WHEN 'F' THEN 'No' ELSE 'Yes' END, '[^0-9A-Za-z_ ,.@%-]', ''), '')"
					}),

					search.createColumn({
						name: "formulatext",
						label: "INVOICE_GENERATION_LOCATION_CODE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_inv_gen_location_cod}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "INVOICE_GENERATION_LOCATION_NAME",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_invoice_gen_location}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PURCHASE_ORDER_NUMBER",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_purchase_order_no}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formuladate",
						label: "PURCHASE_ORDER_VALID_FROM_DATE",
						formula: "{custentity_mhl_cust_po_valid_from_date}"

					}),
					search.createColumn({
						name: "formuladate",
						label: "PURCHASE_ORDER_VALID_TO_DATE",
						formula: "{custentity_mhl_cust_po_valid_to_date}"

					}),
					search.createColumn({
						name: "formulatext",
						label: "LAST_CLIENT_SCORE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_last_client_score}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "IS_TRUSTED",
						formula: "NVL(REGEXP_REPLACE(CASE {custentity_mhl_cust_is_trusted} WHEN 'F' THEN 'No' ELSE 'Yes' END, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "CREDIT_LIMIT_BY_AMOUNT",
						formula: "TO_NUMBER({creditlimit})"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "CREDIT_LIMIT_BY_DAYS",
						formula: "TO_NUMBER({custentity_terms_in_days})"

					}),

					search.createColumn({
						name: "formulanumeric",
						label: "OUTSTANDING_AMOUNT_LIMIT",
						formula: "TO_NUMBER({custentity_mhl_cust_outstanding_amt_limt})"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "GRACE_LIMIT_BY_DAYS",
						formula: "TO_NUMBER({custentity_mhl_cust_grace_days})"

					}),
					search.createColumn({
						name: "formulatext",
						label: "LOGIC",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_logic}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "TEST_TO_BE_ORDERED_BEYOND_CREDIT_LIMIT",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_tst_odr_bynd_crdt_lm}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "CURRENCY",
						formula: "NVL(REGEXP_REPLACE({currency}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "IS_ROLLING_ADVANCE_CLIENT",
						formula: "NVL(REGEXP_REPLACE(CASE {custentity_mhl_cust_rolling_advance} WHEN 'F' THEN 'No' ELSE 'Yes' END, '[^0-9A-Za-z_ ,.@%-]', ''), '')"
					}),
					search.createColumn({
						name: "formulanumeric",
						label: "ROLLING_ADVANCE_AMOUNT",
						formula: "TO_NUMBER({custentity_mhl_cust_rolling_advance_amt})"

					}),
					search.createColumn({
						name: "formulatext",
						label: "ROLLING_ADVANCE_RECHARGE_LIMIT",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_ra_threshold_amt}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "ROLLING_ADVANCE_RECHARGE_LIMIT__PERCENTAGE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_ra_rchrge_limit__per}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "OVERDUE_AMOUNT",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_overdue_amount}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "DSO_DAYS",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_dso_days}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "LAST_BILLING_AMOUNT",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_last_billing_amount}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formuladate",
						label: "LAST_BILLING_DATE",
						formula: "{custentity_mhl_cust_last_billing_date}"

					}),
					search.createColumn({
						name: "formulatext",
						label: "CURRENT_BILLING_AMOUNT",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_current_billing_amt}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "LAST_PAYMENT_RECEIVED_AMOUNT",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_last_pymt_rcived_amt}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formuladate",
						label: "LAST_PAYMENT_RECEIVED_DATE",
						formula: "{custentity_mhl_cust_last_pymt_rcived_dat}"

					}),
					search.createColumn({
						name: "formulatext",
						label: "RATE_CARD_CODE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_rate_card_code}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "RATE_CARD_PRIORITY",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_rate_card_priority}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "DISCOUNT_PERCENTAGE_L1",
						formula: "TO_NUMBER({custentity_mhl_discount_percentage_l1})"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "DISCOUNT_PERCENTAGE_L2",
						formula: "TO_NUMBER({custentity_mhl_discount_percentage_l2})"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "DISCOUNT_PERCENTAGE_L3",
						formula: "TO_NUMBER({custentity_mhl_discount_percentage_l3})"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "DISCOUNT_PERCENTAGE_L4",
						formula: "TO_NUMBER({custentitymhl_discount_percentage_l4})"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "DISCOUNT_PERCENTAGE_L5",
						formula: "TO_NUMBER({custentity_mhl_discount_percentage_l5})"

					}),
					search.createColumn({
						name: "formulatext",
						label: "DISCOUNT_GROUP",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_discount_group}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "AGREEMENT_ID",
						formula: "NVL(REGEXP_REPLACE({custrecord_mhl_ad_customer.custrecord_mhl_ad_agreementid}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formuladate",
						label: "AGREEMENT_VALID_FROM_DATE",
						formula: "{custrecord_mhl_ad_customer.custrecord_mhl_ad_start_date}"

					}),
					search.createColumn({
						name: "formuladate",
						label: "AGREEMENT_VALID_TO_DATE",
						formula: "{custrecord_mhl_ad_customer.custrecord_mhl_ad_end_date}"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PENDING_DOCUMENTS",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_pending_documents}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "FLAT_DISCOUNT_PERC",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_flat_discount_perc}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SPECIAL_APPROVAL_DISCOUNT",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_spcl_approval_discnt}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SPECIAL_ALLIANCE_DISCOUNT",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_spcl_alliance_discnt}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PHOTO_LINK",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_photo_link}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "AGREEMENT_LINK",
						formula: "NVL(REGEXP_REPLACE({custrecord_mhl_ad_customer.custrecord_mhl_ad_link}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "CONTRACT_DETAILS_LINK",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_contract_detail_link}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "ADDRESS_PROOF_DOCUMENT_LINK",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_addrs_proof_doc_link}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "IDENTITY_PROOF_DOCUMENT_LINK",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_id_proof_doc_link}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SALES_EXECUTIVE_EMPLOYEE_NUMBER",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_sales_exec_emlee_no}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SALES_EXECUTIVE_EMPLOYEE_NAME",
						formula: "NVL(REGEXP_REPLACE({salesrep}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SALES_EXECUTIVE_CONTACT_NUMBER",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_sale_exec_contact_no}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "REGIONAL_SALES_EXECUTIVE_EMPLOYEE_NUMBER",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_rgnl_sal_ex_emlee_no}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "REGIONAL_SALES_EXECUTIVE_EMPLOYEE_NAME",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_rgnlsalex_emlee_name}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "REGIONAL_SALES_EXECUTIVE_CONTACT_NUMBER",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_renl_sal_ex_cont_no}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formuladatetime",
						label: "CODE_OPEN_DATE",
						formula: "{datecreated}"

					}),
					search.createColumn({
						name: "formulatext",
						label: "CODE_OPEN_BY",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_created_by}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "METROPOLIS_EMAIL_ID",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_metropolis_email_id}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SHIP_TO_ADDRESS_LINE_1",
						formula: "NVL(REGEXP_REPLACE({shipaddress1}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SHIP_TO_ADDRESS_LINE_2",
						formula: "NVL(REGEXP_REPLACE({shipaddress2}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SHIP_TO_COUNTRY",
						formula: "NVL(REGEXP_REPLACE({shipcountry}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SHIP_TO_STATE",
						formula: "NVL(REGEXP_REPLACE({shipstate}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SHIP_TO_DISTRICT",
						formula: "NVL(REGEXP_REPLACE({shippingaddress.custrecord_mhl_af_district}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SHIP_TO_CITY",
						formula: "NVL(REGEXP_REPLACE({shipcity}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SHIP_TO_SUBURB",
						formula: "NVL(REGEXP_REPLACE({shippingaddress.custrecord_mhl_af_suburb}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SHIP_TO_PIN_CODE",
						formula: "NVL(REGEXP_REPLACE({shipzip}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SHIP_TO_EMAIL_ID",
						formula: "NVL(REGEXP_REPLACE({shippingaddress.custrecord_mhl_af_emailaddress}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SHIP_TO_FAX_NO",
						formula: "NVL(REGEXP_REPLACE({shippingaddress.custrecord_mhl_af_faxno}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SHIP_TO_COUNTRY_CODE",
						formula: "NVL(REGEXP_REPLACE({shippingaddress.custrecord_mhl_af_countrycode}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SHIP_TO_PRIMARY_MOBILE",
						formula: "NVL(REGEXP_REPLACE({shippingaddress.custrecord_mhl_af_primarymob}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SHIP_TO_SECONDARY_MOBILE",
						formula: "NVL(REGEXP_REPLACE({shippingaddress.custrecord_mhl_af_secondarymob}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SHIP_TO_STD_CODE",
						formula: "NVL(REGEXP_REPLACE({shippingaddress.custrecord_mhl_af_std_code}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SHIP_TO_LANDLINE",
						formula: "NVL(REGEXP_REPLACE({shipphone}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "ADHAR_CARD_NUMBER",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_adhar_card_number}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "EXPECTED_SPECIALIZED_TEST_BY_AMOUNT",
						formula: "TO_NUMBER({custentity_mhl_cust_expctd_spcl_tst_amt})"

					}),
					search.createColumn({
						name: "formulatext",
						label: "EXPECTED_SPECIALIZED_TEST_BY_SAMPLE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_expctdspcltst_sample}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "EXPECTED_ROUTINE_TEST_BY_AMOUNT",
						formula: "TO_NUMBER({custentity_mhl_cust_expctd_rutne_tst_amt})"

					}),
					search.createColumn({
						name: "formulatext",
						label: "EXPECTED_ROUTINE_TEST_BY_SAMPLE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_expct_rutn_tst_sampl}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "TOTAL_EXPECTED_BUSINESS_BY_AMOUNT_MANDATORY_FIELD",
						formula: "TO_NUMBER({custentity_mhl_cust_total_expct_busi_amt})"

					}),
					search.createColumn({
						name: "formulatext",
						label: "TOTAL_NUMBER_OF_PARTNERS",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_total_no_of_partners}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PARTNER_NAME_1",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_parname1}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PARTNER_MOBILE_NUMBER_1",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_parmobno1}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PARTNER_EMAIL_ID_1",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_pareml1}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PARTNER_NAME_2",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_parname2}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PARTNER_MOBILE_NUMBER_2",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_parmobno2}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PARTNER_EMAIL_ID_2",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_pareml2}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PARTNER_NAME_3",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_parname3}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PARTNER_MOBILE_NUMBER_3",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_parmobno3}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PARTNER_EMAIL_ID_3",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_pareml3}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PARTNER_NAME_4",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_parname4}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PARTNER_MOBILE_NUMBER_4",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_parmobno4}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PARTNER_EMAIL_ID_4",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_pareml4}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PARTNER_NAME_5",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_parname5}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PARTNER_MOBILE_NUMBER_5",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_parmobno5}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PARTNER_EMAIL_ID_5",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_pareml5}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PARTNER_NAME_6",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_parname6}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PARTNER_MOBILE_NUMBER_6",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_parmobno6}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PARTNER_EMAIL_ID_6",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cus_pareml6}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "TOD_1_AMOUNT",
						formula: "TO_NUMBER({custentity_mhl_cust_tod_1_amount})"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "TOD_1_DISCOUNT_IN_%",
						formula: "TO_NUMBER({custentity_mhl_cust_tod_1_discount_per})"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "TOD_2_AMOUNT",
						formula: "TO_NUMBER({custentity_mhl_cust_tod_2_amount})"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "TOD_2_DISCOUNT_IN_%",
						formula: "TO_NUMBER({custentity_mhl_cust_tod_2_discount_per})"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "TOD_3_AMOUNT",
						formula: "TO_NUMBER({custentity_mhl_cust_tod_3_amount})"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "TOD_3_DISCOUNT_IN_%",
						formula: "TO_NUMBER({custentity_mhl_cust_tod_3_discount_per})"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "TOD_4_AMOUNT",
						formula: "TO_NUMBER({custentity_mhl_cust_tod_4_amount})"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "TOD_4_DISCOUNT_IN_%",
						formula: "TO_NUMBER({custentity_mhl_cust_tod_4_discount_pre})"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "TOD_5_AMOUNT",
						formula: "TO_NUMBER({custentity_mhl_cust_tod_5_amount})"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "TOD_5_DISCOUNT_IN_%",
						formula: "({custentity_mhl_cust_tod_5_discount_pre})"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_1_TEST_CODE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_1_test_code}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_1_TEST_NAME",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_1_test_name}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "VOD_1_NO_OF_TEST_SAMPLE",
						formula: "TO_NUMBER({custentity_mhl_cust_vod_1_no_of_tst_smpl})"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_1_DISCOUNT",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_1_discount}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_2_TEST_CODE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_2_test_code}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_2_TEST_NAME",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_2_test_name}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "VOD_2_NO_OF_TEST_SAMPLE",
						formula: "TO_NUMBER({custentity_mhl_cust_vod_2_no_of_tst_smpl})"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_2_DISCOUNT",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_2_discount}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_3_TEST_CODE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_3_test_code}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_3_TEST_NAME",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_3_test_name}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "VOD_3_NO_OF_TEST_SAMPLE",
						formula: "TO_NUMBER({custentity_mhl_cust_vod_3_no_of_tst_smpl})"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_3_DISCOUNT",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_3_discount}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_4_TEST_NAME",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_4_test_name}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "VOD_4_NO_OF_TEST_SAMPLE",
						formula: "TO_NUMBER({custentity_mhl_cust_vod_4_no_of_tst_smpl})"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_4_DISCOUNT",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_4_discount}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_4_TEST_CODE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_4_test_code}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_5_TEST_NAME",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_5_test_name}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "VOD_5_NO_OF_TEST_SAMPLE",
						formula: "TO_NUMBER({custentity_mhl_cust_vod_5_no_of_tst_smpl})"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_5_DISCOUNT",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_5_discount}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_5_TEST_CODE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_5_test_code}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_6_TEST_NAME",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_6_test_name}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "VOD_6_NO_OF_TEST_SAMPLE",
						formula: "TO_NUMBER({custentity_mhl_cust_vod_6_no_of_tst_smpl})"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_6_DISCOUNT",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_6_discount}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_6_TEST_CODE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_6__test_code}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_7_TEST_CODE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_7_test_code}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_7_TEST_NAME",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_7_test_name}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "VOD_7_NO_OF_TEST_SAMPLE",
						formula: "TO_NUMBER({custentity_mhl_cust_vod_7_no_of_tst_smpl})"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_7_DISCOUNT",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_7_discount}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_8_TEST_NAME",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_8_test_name}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "VOD_8_NO_OF_TEST_SAMPLE",
						formula: "TO_NUMBER({custentity_mhl_cust_vod_8_no_of_tst_smpl})"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_8_DISCOUNT",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_8_discount}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_8_TEST_CODE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_8_test_code}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_9_TEST_NAME",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_9_test_name}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "VOD_9_NO_OF_TEST_SAMPLE",
						formula: "TO_NUMBER({custentity_mhl_cust_vod_9_no_of_tst_smpl})"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_9_DISCOUNT",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_9_discount}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_9_TEST_CODE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_9_test_code}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_10_TEST_NAME",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_10_test_name}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "VOD_10_NO_OF_TEST_SAMPLE",
						formula: "TO_NUMBER({custentity_mhl_cust_vod_10_no_of_tst_smp})"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_10_DISCOUNT",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_10_discount}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "VOD_10_TEST_CODE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_vod_10_test_code}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "RESULT_REPORT_EMAIL_STATIONARY",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_rsultrprtmailstatnry}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "RESULT_REPORT_PRINT_STATIONARY",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_rsultrprtprt_statnry}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "CLIENT_STATUS",
						formula: "NVL(REGEXP_REPLACE({custrecord_mhl_cust_code_ref_ext_org.custrecord_mhl_client_status_as_per_org}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "STATUS_REASON",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_status_reason}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formuladate",
						label: "BLOCK_FROM_DATE",
						formula: "{custentity_mhl_cust_block_from_date}"

					}),
					search.createColumn({
						name: "formuladate",
						label: "BLOCK_TO_DATE",
						formula: "{custentity_mhl_cust_block_to_date}"

					}),
					search.createColumn({
						name: "formulatext",
						label: "MODIFIED_BY",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_modified_by}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formuladate",
						formula: "{lastmodifieddate}",
						label: "MODIFIED_AT",
					}),

					search.createColumn({
						name: "formulatext",
						label: "CREDIT_CONTROL_COMMENT",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_credit_control_comen}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "SAP_PROFIT_CENTRE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_sap_profit_centre}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulanumeric",
						label: "DISCOUNT_PERCENTAGE_L0",
						formula: "TO_NUMBER({custentity_mhl_discount_percentage_l0})"

					}),
					search.createColumn({
						name: "formuladate",
						label: "SPECIFIC_INVOICE_DATE",
						formula: "{custentity_mhl_cust_specific_invoice_dat}"

					}),
					search.createColumn({
						name: "formulatext",
						label: "PATIENT_TYPE",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_patient_type}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					}),
					search.createColumn({
						name: "formulatext",
						label: "ADD TEST_OUTSIDE_RATECARD",
						formula: "NVL(REGEXP_REPLACE({custentity_mhl_cust_ad_tst_otsid_rat_crd}, '[^0-9A-Za-z_ ,.@%-]', ''), '')"

					})
				]
			});
			return customerSearchObj.save();
		}

		function getStartTime() {
			var now = getCompanyCurrentDateTime();
			var date = now.getDate() -1;
			var month = now.getMonth() + 1;
			var year = now.getFullYear();
			var hour = now.getHours();

			var ap = "am";
			if (hour > 11)
				ap = "pm";

			if (hour > 12)
				hour = hour - 12;

			if (hour == 0)
				hour = 12;

			if (hour < 10)
				hour = hour;

			var timeString = date + '/' + month + '/' + year + ' ' + hour + ':' + "00" + ' ' + ap;
			log.debug("timeString",timeString);
			return timeString;
		}

		function getEndTime() {

			var now = getCompanyCurrentDateTime();
			var date = now.getDate();
			var month = now.getMonth() + 1;
			var year = now.getFullYear();
			var hour = now.getHours();

			var ap = "am";
			if (hour > 11)
				ap = "pm";

			if (hour > 12)
				hour = hour - 12;

			if (hour == 0)
				hour = 12;

			if (hour < 10)
				hour = hour;

			var timeString = date + '/' + month + '/' + year + ' ' + hour + ':' + "00" + ' ' + ap;
			return timeString;

		}

		function getCompanyCurrentDateTime() {

			var currentDateTime = new Date();
			//var companyTimeZone = nlapiLoadConfiguration('companyinformation').getFieldText('timezone');
			var companyTimeZone = '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi';
			var timeZoneOffSet = (companyTimeZone.indexOf('(GMT)') == 0) ? 0 : new Number(companyTimeZone.substr(4, 6).replace(/\+|:00/gi, '').replace(/:30/gi, '.5'));
			var UTC = currentDateTime.getTime() + (currentDateTime.getTimezoneOffset() * 60000);
			var companyDateTime = UTC + (timeZoneOffSet * 60 * 60 * 1000);

			return new Date(companyDateTime);
		}

		return {
			execute: execute
		}
	});