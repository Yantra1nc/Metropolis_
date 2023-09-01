/*************************************************************
 * File Header
 * Script Type: Map Reduce
 * Script Name: [MR]MHL YIL Employee Advance Send Email
 * File Name: 
 * Created On: 22/05/2023
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: Employee advance reminder to be sent from NetSuite on employee email ID if advance is not settled within 30 days
 *********************************************************** */

/**
 * Script Name: 
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/file', 'N/format', 'N/record', 'N/search', 'N/runtime', './mhllib', './datellib', "./callrestdata", './searchlib', 'N/email'],
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
                    id: 'customsearch_employee_advance_report'
                });

                var resultSet = searchlib.mySearch(venObj);
                log.debug("Result Set Length -->", resultSet.length);

                if (resultSet) {

                    var transdetails = [];

                    for (var i = 0; i < resultSet.length; i++) {
                        var empCode = resultSet[i].getValue({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        });
                        var emp_name_id = resultSet[i].getText({
                            name: "custrecord_employee_id",
                            label: "Employee ID"
                        });
                        var emp_email_id = resultSet[i].getValue({
                            name: "custrecord_employee_email",
                            label: "Employee Email"
                        });
                        var document_number = resultSet[i].getValue({
                            name: "custrecord_document_number",
                            label: "Document Number"
                        });
                        var op_bal_amt = resultSet[i].getValue({
                            name: "custrecord_opening_balance",
                            label: "Opening Balance"
                        });
                        var days_age = resultSet[i].getValue({
                            name: "custrecord_age",
                            label: "Age"
                        });
                        var ven_date = resultSet[i].getValue({
                            name: "custrecord_advance_date",
                            label: "Advance Date"
                        });
						var int_id = resultSet[i].getValue({
                           name: "internalid", 
						   label: "Internal ID"
                        });
                        var ven_date_format = format.format({
                            value: ven_date,
                            type: format.Type.DATE
                        });
                        //log.debug("ven_date_format -->", ven_date_format);

                        transdetails.push({
                            'empNameId': emp_name_id,
                            pushdata: {
                                'employeeCode': empCode,
                                'empNameId': emp_name_id,
                                'emailId': emp_email_id,
                                'docNumber': document_number,
                                'emAdvDate': ven_date_format,
                                'opBalance': op_bal_amt,
                                'dayAge': days_age,
								'empVenId':int_id
                            }
                        });
                    }
                }

                log.audit("transdetails-->", transdetails);

                return transdetails;

                //return false;

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

                var employee_name_id = a_usage_data.empNameId;
                log.debug('employee_name_id ', employee_name_id);

                var emp_code = a_usage_data.pushdata.empCode;
                log.debug('emp_code ', emp_code);

                if (employee_name_id) {
                    context.write({
                        key: employee_name_id,
                        value: a_usage_data.pushdata
                    });
                }

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

            var o_index = context.values[0];
            var APDetails = JSON.parse(o_index);
            log.debug("APDetails", APDetails);
			
			/* var internal_id = APDetails.empVenId;
			log.debug("internal_id -->", internal_id); */

            var employee_name_reduce = APDetails.empNameId;
            log.debug("employee_name_reduce -->", employee_name_reduce);

            var email_reduce = APDetails.emailId;
            log.debug("email_reduce -->", email_reduce); 
			
            var PDFPrint;

            PDFPrint = "Dear " + employee_name_reduce + ",<br>";
            PDFPrint += "<br>";
            PDFPrint += "Please find below employee advance laying in your employee ledger. Kindly clear the same as earliest. <br/>Kindly discuss with Nilesh Ambavkar (nilesh.ju@metropolisindia.com) and Aniket Tambadkar (aniket.tambadkar@metropolisindia.com) for any query<br>";
            PDFPrint += "<br>";
            PDFPrint += "<table border = \"1\" width=\"100%\" height=\"100%\">";
            PDFPrint += "<thead>";
            PDFPrint += "<tr>";
            PDFPrint += " <td border = \"1\"align=\"center\" style=\" font-size:11px; background-color:#85C1E9;\">Employee<\/b><\/td>";
            PDFPrint += " <td border = \"1\"align=\"center\" style=\" font-size:11px; background-color:#85C1E9;\">Document Number <\/b><\/td>";
            PDFPrint += " <td border = \"1\"align=\"center\" style=\" font-size:11px; background-color:#85C1E9;\">Date <\/b><\/td>";
            PDFPrint += " <td border = \"1\"align=\"center\" style=\" font-size:11px; background-color:#85C1E9;\">Amount <\/b><\/td>";
            PDFPrint += " <td border = \"1\"align=\"center\" style=\" font-size:11px; background-color:#85C1E9;\">Days Aging <\/b><\/td>";

            PDFPrint += " <\/tr>";
            PDFPrint += "<\/thead>";

            for (a = 0; a < context.values.length; a++) {
                var result = context.values[a];
                var PRdetail = JSON.parse(result);
                log.debug("PRdetail", PRdetail);
				
				var internal_id = PRdetail.empVenId;
				log.debug("internal_id -->", internal_id);

                var balance_reduce = PRdetail.opBalance;
                log.debug("balance_reduce -->", balance_reduce);

                var emp_doc_number = PRdetail.docNumber;
                log.debug("emp_doc_number -->", emp_doc_number);

                var emp_name_final = PRdetail.empNameId;
                log.debug("emp_name_final -->", emp_name_final);

                var emp_adv_date = PRdetail.emAdvDate;
                log.debug("emp_adv_date -->", emp_adv_date);

                var days_age_reduce = PRdetail.dayAge;
                log.debug("days_age_reduce -->", days_age_reduce);

                PDFPrint += " <tr>";
                PDFPrint += " <td border = \"1\" style=\"font-size:11px;\" >" + emp_name_final + "<\/td>";
                PDFPrint += " <td border = \"1\" style=\"font-size:11px;\" >" + emp_doc_number + "<\/td>";
                PDFPrint += " <td border = \"1\" style=\"font-size:11px;\" >" + emp_adv_date + "<\/td>";
                PDFPrint += " <td border = \"1\" style=\"font-size:11px;\" >" + balance_reduce + "<\/td>";
                PDFPrint += " <td border = \"1\" style=\"font-size:11px;\" >" + days_age_reduce + "<\/td>";
                PDFPrint += " <\/tr>";
				
				var empAdv = record.load({
                    type: 'customrecord_employee_advance',
                    id: internal_id
                });

				empAdv.setValue({
					fieldId: 'custrecord_send_email_employee_advance',
					value: true
                });
              
                var invRecord = empAdv.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

            }

            PDFPrint += " <\/table>";
            PDFPrint += " Thank You. <br>";
            PDFPrint += " P2P Team ";


            if (email_reduce && PDFPrint) {
                email.send({
                    author: 118,
                    recipients: email_reduce,
                    subject: 'Employee advance settlement Reminder',
                    body: PDFPrint
                });
				
				

                log.audit("Email Sent successfully-->", employee_name_reduce)
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
                log.audit("s_value", s_value);

                var intId = s_value.internalId;
                log.debug("internalID summary", intId);

                par_tran_id = s_value.parentTran;
                tran_aprove_name = s_value.approverName;
                tran_ven_email = s_value.venEmail;

                return true;
            });

            log.debug("tran_ven_email summary", tran_ven_email);
            log.debug("tran_aprove_name summary", tran_aprove_name);
            log.debug("par_tran_id summary", par_tran_id);

            var email_content = "Dear " + tran_aprove_name + ",";
            email_content += "<br>";
            email_content += par_tran_id + " is pending for approval at your end for more then 4 days.<br>";
            email_content += " Kindly approve it as soon as possible. <br> ";
            email_content += " THANK YOU. ";

            log.debug("email_content", email_content);

            if (tran_ven_email && email_content) {
                email.send({
                    author: 118,
                    recipients: tran_ven_email,
                    subject: 'Employee Advance Not Setteled ',
                    body: email_content
                });

                log.audit("Email Sent successfully", tran_aprove_name)

                var empAdv = record.load({
                    type: 'customrecord_employee_advance',
                    id: intId
                });

				empAdv.setValue({
					fieldId: 'custrecord_send_email_employee_advance',
					value: true
                });
              
                var invRecord = empAdv.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
            }
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce
            //summarize: summarize
        };



    });