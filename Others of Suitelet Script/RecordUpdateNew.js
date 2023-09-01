/*************************************************************
 * File Header
 * Script Type: Suitelet
 * Script Name: To remove sister lab items on invoice
 * File Name: RecordUpdateNew.js
 * Created On: 09/06/2022
 * Modified On:
 * Created By: Avinash Lahane(Yantra Inc.)
 * Modified By:
 * Description: To remove sister lab items on invoice
 *********************************************************** */




function suitelet(){
		var invoiceSearch = nlapiSearchRecord("invoice",null,
		[
		   ["type","anyof","CustInvc"], 
		   "AND", 
		   ["datecreated","within","1/6/2022 12:00 am"], 
		   "AND", 
		   ["item","anyof","23425"], 
		   "AND", 
		   ["custbody_mhl_sisterlab_vid","is","F"], 
		   "AND", 
		   ["department","noneof","21"]
		], 
		[
		   new nlobjSearchColumn("tranid"), 
		   new nlobjSearchColumn("custbody_mhl_invoice_vid_number"), 
		   new nlobjSearchColumn("datecreated"), 
		   new nlobjSearchColumn("amount"), 
		   new nlobjSearchColumn("item"),
		   new nlobjSearchColumn("internalid")
		   
		]
		);
			nlapiLogExecution("debug",invoiceSearch.length);
	for(var o in invoiceSearch){
		var internal=invoiceSearch[o].getValue('internalid');
		nlapiLogExecution('debug','internalid',internal);
		
		
	var o_invObj = nlapiLoadRecord('invoice',internal)
	var itemCount=o_invObj.getLineItemCount('item');
	nlapiLogExecution('debug','itemCount',itemCount);
	if(itemCount>1){
	for(var i=0; i<= itemCount; i++){
		
		var itemID=o_invObj.getLineItemValue('item','item',i);
		nlapiLogExecution('debug','internalid',itemID);
		if(itemID==23425){
		o_invObj.removeLineItem('item',i);
		}
		
	}
	nlapiSubmitRecord(o_invObj,true,true);
	}
	//o_invObj.removeLineItem('item',2);
	//nlapiSubmitRecord(o_invObj,true,true);

	}
}