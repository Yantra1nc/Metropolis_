/*************************************************************
 * File Header
 * Script Type: Suitelet
 * Script Name: MHL SU Vendor Invoice approved
 * File Name: MHL SU Vendor Invoice approved.js
 * Created On: 01/06/2022
 * Modified On:
 * Created By: Sunil Khutwad(Yantra Inc.)
 * Modified By:
 * Description: Vendor Invoice approved 
 ************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/ui/serverWidget', 'N/record', 'N/http', 'N/search', 'N/file', 'N/task'],

    function(runtime, serverWidget, record, http, search, file, task) {

        function onRequest(scriptContext) {
            if (scriptContext.request.method === 'GET') {

                var form = serverWidget.createForm({
                    title: 'Vendor Invoice Approved'
                });

                var fileField = form.addField({
                    id: 'custpage_file',
                    type: serverWidget.FieldType.FILE,
                    label: 'File'
                });
                //var fileField = form.addField('custpage_file', 'file', 'File');
                fileField.isMandatory = true;


                form.addSubmitButton({
                    label: 'Submit'
                });

                scriptContext.response.writePage(form);
            } else {

                var fileObj = scriptContext.request.files.custpage_file;
                // fileObj.folder = 451136; //File Saved this folder // SB folder id  Vendor Invoice Approved CSV //File
                fileObj.folder = 567139 // Production folder id   -- Vendor Invoice Approved CSV File
                var id = fileObj.save();

                var fileSearchObj = search.create({
                    type: "file",
                    filters: [
                        ["folder", "anyof", "567139"],
                        "AND", ["filetype", "anyof", "CSV"]
                    ],
                    columns: [
                        search.createColumn({ name: "folder", label: "Folder" }),
                        search.createColumn({ name: "filetype", label: "Type" }),
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        })
                    ]
                });
                var searchResultCount = fileSearchObj.runPaged().count;
                log.debug("fileSearchObj result count", searchResultCount);
                fileSearchObj.run().each(function(result) {
                    // .run().each has a limit of 4,000 results

                    var fileInternalId = result.getValue({
                        name: "internalid"
                    });
                    log.debug("File Internal Id---->", fileInternalId);

                    var csvFile = file.load({
                        id: fileInternalId
                    });
                    // var fileContents = csvFile.getContents();
                    // log.debug("File Content ---->", fileContents);

                    var ven_inv = csvFile.getContents().split(/\n|\n\r/);
                    log.debug("File Content ---->", ven_inv);

                    for (var i = 1; i < ven_inv.length - 1; i++) {
                        var content = ven_inv[i].split(',');
                        log.debug("Content ---->", content);

                        var int_id = content[0];
                        log.debug('Vendor Invoice Internal Id -->', int_id);

                        var o_invRec = record.load({
                            type: 'vendorbill',
                            id: int_id,
                            isDynamic: true
                        });

                        o_invRec.setValue({
                            fieldId: "approvalstatus",
                            value: 2
                        });

                        // var macros = o_invRec.getMacros();
                        // log.debug("CreateReturnAuthorization", "macros==" + JSON.stringify(macros));

                        // var taxTotals = o_invRec.executeMacro({ id: 'calculateTax' });
                        // log.debug("CreateReturnAuthorization", "taxTotals==" + JSON.stringify(taxTotals));

                        var recUpdate = o_invRec.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
						
						if(recUpdate){
							scriptContext.response.write('Record updated successfully.');
						}

                        // var date = content[1];
                        // log.debug('Date -->', date);

                        // var tranNumber = content[2];
                        // log.debug('Transaction Number -->', tranNumber);

                        // var name = content[7];
                        // log.debug('Name -->', name);
                    }
                    return false;

                });
            }
        }
        return {
            onRequest: onRequest
        };
    });