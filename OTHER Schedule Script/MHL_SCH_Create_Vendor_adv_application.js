/**
 * Module Description
 * 
 * Version    Date            Author                File
 * 1.00       19 May 2022     Ganesh Sapakale    MHL_SCH_Create_Vendor_adv_application.js
 *
 */

function scheduled_vendor_application(type) 
{
    try
    {
        var o_context = nlapiGetContext();

        var i_security_deposit = o_context.getSetting('SCRIPT', 'custscript_mhl_security_deposit');
        if(!i_security_deposit)
            i_security_deposit = '1645';
        nlapiLogExecution('DEBUG','prepaymentApplication- '+i_security_deposit);

        /*var id = o_context.getSetting('SCRIPT', 'custscript_mhl_tranid');
        var tranType = o_context.getSetting('SCRIPT', 'custscript_mhl_tran_type');
        var i_security_deposit = o_context.getSetting('SCRIPT', 'custscript_mhl_security_deposit');
        nlapiLogExecution('DEBUG','prepaymentApplication- '+id+'#tranType- '+tranType+'#i_security_deposit- '+i_security_deposit);*/

        var transactionSearch = nlapiSearchRecord("transaction",null,
            [
               ["type","anyof","CuTrPrch150","Custom125"], 
               "AND", 
               ["trandate","onorafter","1/1/2022"], 
               "AND", 
               ["custbody_mhl_auto_vendor_application","is","T"], 
               "AND", 
               ["mainline","is","T"]
            ], 
            [
               new nlobjSearchColumn("internalid").setSort(false), 
               new nlobjSearchColumn("recordtype")
            ]
            );
        if (transactionSearch) 
        {
            if(transactionSearch.length > 0)
            {
                for (var a = 0; a < transactionSearch.length; a++) 
                {
                    var id = transactionSearch[a].getValue('internalid');
                    var tranType = transactionSearch[a].getValue('recordtype');

                    /*if(tranType == 'Vendor Advance Non PO Based' || tranType == 'CuTrPrch') 
                        tranType = 'custompurchase_mhl_vendor_advance_no';
                    if(tranType == 'Vendor Advance Prepayment' || tranType == 'Custom125')
                        tranType = 'customtransaction_vendor_prepayment';*/
                    nlapiLogExecution('DEBUG','prepaymentApplication- '+id,'tranType- '+tranType);

                    var o_rec = nlapiLoadRecord(tranType,id);
                    var prepaymentApplication = getPrepaymentApplication(id);
                    nlapiLogExecution('DEBUG','prepaymentApplication',JSON.stringify(prepaymentApplication));

                    if(tranType == 'customtransaction_vendor_prepayment')
                    {            
                        if (!prepaymentApplication) 
                        {
                            var vendor = o_rec.getFieldValue('custbody_vendor');
                            var subsidiary=o_rec.getFieldValue('subsidiary');
                            var payablesAccount = nlapiLookupField('vendor', vendor, 'payablesaccount') || getDefaultPayablesAccount();
                            var currency = o_rec.getFieldValue('currency')
                            var amount = o_rec.getFieldValue('total');
                            
                            var plantCode = o_rec.getFieldValue('custbody_mhl_pr_plantid');
                            var org = o_rec.getFieldValue('location');
                            var sbu = o_rec.getFieldValue('class');
                            
                            nlapiLogExecution('DEBUG', id + '|' + vendor + '|' + payablesAccount + '|' + currency + '|' + amount + '|' + subsidiary);

                            var record = nlapiCreateRecord('customtransaction_prepayment_application');
                            record.setFieldValue('subsidiary',subsidiary);
                            record.setFieldValue('custbody_vendor', vendor);
                                    
                            record.setFieldValue('class', sbu);
                            record.setFieldValue('location', org);
                            record.setFieldValue('custbody_mhl_pr_plantid', plantCode);
                            record.setFieldValue('custbody_vendor_prepayment', id);
                            record.setFieldValue('currency', currency);
                            record.setFieldValue('custbody_approved_for_payment', parseInt(1)); //Approved
                            record.selectNewLineItem('line');
                            record.setCurrentLineItemValue('line', 'account', payablesAccount);
                            record.setCurrentLineItemValue('line', 'amount', amount);
                            record.setCurrentLineItemValue('line', 'entity', vendor);
                            record.commitLineItem('line');
                            var recordID = nlapiSubmitRecord(record, true, true);
                            nlapiLogExecution('DEBUG','Application recordID: '+recordID);

                            if(recordID)
                            {
                                nlapiSubmitField(tranType,id,'custbody_mhl_auto_vendor_application','F');
                            }
                        }
                    }

                    if(tranType == 'custompurchase_mhl_vendor_advance_no')
                    {           
                        if (!prepaymentApplication) 
                        {
                            var vendor = o_rec.getFieldValue('entity');
                            var subsidiary=o_rec.getFieldValue('subsidiary');
                            
                            var currency = o_rec.getFieldValue('currency');
                            var amount = o_rec.getFieldValue('total');
                            var plantCode = o_rec.getFieldValue('custbody_mhl_pr_plantid');
                            var org = o_rec.getFieldValue('location');
                            var sbu = o_rec.getFieldValue('class');
                            
                            var b_security_deposit = o_rec.getFieldValue('custbody_mhl_do_not_add_def_gl');
                            nlapiLogExecution('AUDIT', 'b_security_deposit- '+b_security_deposit);
                            if(b_security_deposit == 'T' || b_security_deposit == true)
                            {
                                var payablesAccount = i_security_deposit;
                            }
                            else
                            {
                                var payablesAccount = nlapiLookupField('vendor', vendor, 'payablesaccount') || getDefaultPayablesAccount();
                            }
                            nlapiLogExecution('AUDIT', 'payablesAccount- '+payablesAccount);
                            //nlapiLogExecution('ERROR', nlapiGetRecordId() + '|' + vendor + '|' + payablesAccount + '|' + currency + '|' + amount);
                            
                            var memo = o_rec.getFieldValue('memo');
                            var revenue_segment = o_rec.getFieldValue('department');
                            var unit = o_rec.getFieldValue('cseg_mhl_custseg_un');
                            var department = o_rec.getFieldValue('cseg_mhl_custseg_de');
                            var trans_no = o_rec.getFieldValue('transactionnumber');
                            var line_count = nlapiGetLineItemCount('expense');
                            nlapiLogExecution('debug','line_count','line_count='+line_count);
                            /*for(var i=1;i<=line_count;i++){
                                var account_id = nlapiGetLineItemValue('expense','account',i);
                                nlapiLogExecution('debug','account_id','account_id='+account_id);
                                if(parseInt(account_id) == parseInt(1645))
                                {
                                    account_id_Security_Deposits++;
                                    nlapiLogExecution('debug','account_id_Security_Deposits'+account_id_Security_Deposits);
                                }
                            }
                            nlapiLogExecution('debug','account_id_Security_Deposits','account_id_Security_Deposits='+account_id_Security_Deposits);*/
                            //if(account_id_Security_Deposits == 0)
                            {
                                var record = nlapiCreateRecord('customtransaction_prepayment_application');
                                
                                record.setFieldValue('custbody_mhl_ven_adv_non_po', trans_no);
                                record.setFieldValue('memo',memo);
                                record.setFieldValue('department',revenue_segment);
                                record.setFieldValue('cseg_mhl_custseg_un',unit);
                                record.setFieldValue('cseg_mhl_custseg_de',department);
                                
                                record.setFieldValue('subsidiary',subsidiary);
                                record.setFieldValue('custbody_vendor', vendor);
                                record.setFieldValue('class', sbu);
                                record.setFieldValue('location', org);
                                record.setFieldValue('custbody_mhl_pr_plantid', plantCode);
                                record.setFieldValue('custbody_vendor_prepayment', id);
                                record.setFieldValue('currency', currency);
                                record.setFieldValue('custbody_approved_for_payment', 1); //Approved
                                record.selectNewLineItem('line');
                                record.setCurrentLineItemValue('line', 'account', payablesAccount);
                                record.setCurrentLineItemValue('line', 'amount', amount);
                                record.setCurrentLineItemValue('line', 'entity', vendor);
                                
                                record.setCurrentLineItemValue('line', 'cseg_mhl_custseg_un', unit);
                                
                                record.commitLineItem('line');
                                var recordID = nlapiSubmitRecord(record, true, true);
                                nlapiLogExecution('DEBUG','Application recordID: '+recordID);

                                if(recordID)
                                {
                                    nlapiSubmitField(tranType,id,['custbody_mhl_auto_vendor_application','custbody_mhl_vendor_adv_application'],['F',recordID]);
                                }

                                /*if(recordID)
                                {
                                    o_rec.setFieldValue('custbody_mhl_auto_vendor_application', 'F');
                                    o_rec.setFieldValue('custbody_mhl_vendor_adv_application', recordID);
                                    nlapiSubmitRecord(o_rec, true, true);
                                }*/
                            }
                            
                        }
                    }

                }
            }                
        }

        
        
    }
    catch(err)
    {
        nlapiLogExecution('DEBUG','Catch: '+err);
    }
}

/*function deletePrepaymentApplication() {
    var prepaymentApplication = getPrepaymentApplication(id);
    if (prepaymentApplication) {
        nlapiDeleteRecord('customtransaction_prepayment_application', prepaymentApplication);
    }
}

function gotoPaySingleVendor() {
    nlapiSubmitRecord(nlapiGetNewRecord(), true, true);
    nlapiSetRedirectURL('TASKLINK', 'EDIT_TRAN_VENDPYMT', null, null, {entity: nlapiGetFieldValue('custbody_vendor')});
}

function gotoCreateVendorPrepayment() {
    nlapiSetRedirectURL('RECORD', 'customtransaction_vendor_prepayment', null, null, {entity: nlapiGetFieldValue('entity'), poid: id});
}*/

function getPrepaymentApplication(id) {
    var results = nlapiSearchRecord('customtransaction_prepayment_application', null, [new nlobjSearchFilter('custbody_vendor_prepayment', null, 'is', id)]);
    nlapiLogExecution('DEBUG','results',JSON.stringify(results));
    return ((!results || results.length == 0) ? 0 : results[0].getId());
}

function getDefaultPayablesAccount() {
    //var payablesAccount = nlapiLoadConfiguration('accountingpreferences').getFieldValue('APACCOUNT');
    var results = nlapiSearchRecord('account', null, [new nlobjSearchFilter('type', null, 'is', 'AcctPay')]);
    return ((!results || results.length == 0) ? 0 : results[0].getId());
}
