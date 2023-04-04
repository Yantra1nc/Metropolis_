/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: MHL UE total amount in words
 * File Name: MHL_UE_amount_in_words.js
 * Created On: 29/06/2022
 * Modified On: 
 * Created By: Sunil K (Yantra Inc.)
 * Modified By: 
 * Description: Amount in words.
 *************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/ui/serverWidget', 'N/search', 'N/format', 'N/runtime'],
    function (record, serverWidget, search, format, runtime) {
        function afterSubmit(context) {
            log.debug("runtime.executionContext", runtime.executionContext);
            log.debug("context.type", context.type);
            try {

                //if (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.CREATE)
                {

                    var currentRecord = context.newRecord;
                    var recordid = currentRecord.id;
                    var recordtype = currentRecord.type;
                    log.debug({
                        title: 'record type',
                        details: recordtype + ',' + recordid
                    });
                    var recObj = record.load({
                        type: recordtype,
                        id: recordid,
                        isDynamic: true
                    });
                    var total = recObj.getValue({
                        fieldId: 'total'
                    });
					
                 
                    var amtPayable = recObj.getValue({
                        fieldId: 'custbody_mhl_b2b_balance_amt'
                    });

                    var currencyId = recObj.getValue({
                        fieldId: 'currency'
                    });
					
                    log.debug({
                        title: 'currency',
                        details: currencyId
                    });

                    var ISOCode = recObj.getValue({
                        fieldId: 'currencysymbol'
                    });
                    log.debug({
                       title: 'ISOCode',
                       details: ISOCode
                    });
                    //var amtInWordsTaxtotalText = '';
                   
                   var amtInWordsTotalText = getAmtInWords(total, currencyId,ISOCode);
				   if(amtPayable > 0){
                   var amtPaybaleInWordsTotalText = getAmtInWords(amtPayable, currencyId,ISOCode);
				   }

                    log.debug({
                        title: 'amtInWordsTotalText',
                        details: amtInWordsTotalText + " " + "Only"
                    });
					
					log.audit("Testing Tanzania 1");
                    
                    record.submitFields({
                        type: recordtype,
                        id: recordid,
                        values: {
                            custbodyamountinwords: amtInWordsTotalText,
                            custbody_payble_amt_in_words: amtPaybaleInWordsTotalText,
                        }
                    });
                    
                }
            } catch (e) {

                var errString = 'afterSubmit ' + e.name + ' : ' + e.type + ' : ' + e.message;
                log.error({
                    title: 'afterSubmit',
                    details: errString
                });

            }
        }

        //*******************************************Start Convert Amount in Words*******************************************

        function getAmtInWords(total, currencyId, ISOCode) {
            

            var data = total.toString().split(".");

           
            var str = "";
            var str1 = "";
            var word = "";
            var amountInWords = "";

            if (currencyId == 1 && ISOCode == 'INR') //If currency is Indian Rupee & ISOCode is PKR
            {

                str = "" + convert_number(data[0], ISOCode);
                //log.debug("getAmtInWords","str 1 "+str)
                if (Number(data[0]) > 0) {
                    str1 = " and " + convert_number(data[1], ISOCode);
                }
				
				amountInWords = rupees2text(total);
				
            } else if (currencyId == 2 && ISOCode == 'USD') //If currency is US Dollar & ISOCode is USD
            {
                str = convert_number(data[0], ISOCode);
                if (Number(data[0]) > 0) {
                    str1 = " and " + convert_number(data[1], ISOCode);
                }
				amountInWords = dollars2text(total);
            } else if (currencyId == 3 && ISOCode == 'CAD') // If currency is Canadian Dollar & ISOCode is CAD
            {
                str = convert_number(data[0], ISOCode);
                if (Number(data[0]) > 0) {
                    str1 = " and " + convert_number(data[1], ISOCode);
                }
				amountInWords = dollars2text(total);
            } else if (currencyId == 4 && ISOCode == 'EUR') //If currency is Euro & ISOCode is EUR
            {
                str = convert_number(data[0], ISOCode);
                if (Number(data[0]) > 0) {
                    str1 = " and " + convert_number(data[1], ISOCode);
                }
				amountInWords = euro2text(total);		
            } else if (currencyId == 5 && ISOCode == 'GBP') //If currency is British pound & ISOCode is GBP
            {
                str = convert_number(data[0], ISOCode);
                if (Number(data[0]) > 0) {
                    str1 = " and " + convert_number(data[1], ISOCode);
                }
            } else if (currencyId == 13&& ISOCode == 'SGD') //If currency is Australian Dollar & ISOCode is AUD
            {
                str = convert_number(data[0], ISOCode);
                if (Number(data[0]) > 0) {
                    str1 = " and " + convert_number(data[1], ISOCode);
                }
            } else if (currencyId == 12 && ISOCode == 'TZS') //If currency Tanzania
            {
                str = convert_number(data[0], ISOCode);
                if (Number(data[1]) > 0) {
                    str1 = " and " + convert_number(data[1], ISOCode);
                }
				amountInWords = tanzania2text(total);
				//amountInWords = dollars2text(total);
				log.audit("Tanzania");
            }else if (currencyId == 9 && ISOCode == 'GHS') //If Ghana
            {
                str = convert_number(data[0], ISOCode);
                if (Number(data[1]) > 0) {
                    str1 = " and " + convert_number(data[1], ISOCode);
                }
				amountInWords = ghana2text(total);
				//amountInWords = dollars2text(total);
				log.audit("Ghana");
            }else if (currencyId == 11&& ISOCode == 'KES') //If Kenya
            {
                str = convert_number(data[0], ISOCode);
                if (Number(data[1]) > 0) {
                    str1 = " and " + convert_number(data[1], ISOCode);
                }
				amountInWords = kenya2text(total);
				//amountInWords = dollars2text(total);
				log.audit("Kenya");
            }else if (currencyId == 10 && ISOCode == 'ZMW') //If Zambia
            {
                str = convert_number(data[0], ISOCode);
                if (Number(data[1]) > 0) {
                    str1 = " and " + convert_number(data[1], ISOCode);
                }
				amountInWords = zambia2text(total);
				//amountInWords = dollars2text(total);
				log.audit("Zambia");
            }else if (currencyId == 6 && ISOCode == 'LKR') //If Srilanka
            {
                str = convert_number(data[0], ISOCode);
                if (Number(data[1]) > 0) {
                    str1 = " and " + convert_number(data[1], ISOCode);
                }
				amountInWords = srilanka2text(total);
				//amountInWords = dollars2text(total);
				log.audit("Srilanka");
            }
           /*  log.debug({
                title: 'str',
                details: str
            });  */
			
			log.debug({
                title: 'amountInWords',
                details: amountInWords
            });
         /*    log.debug({
                title: 'str1',
                details: str1
            }); */
            word = str + str1;

            //nlapiLogExecution('Debug', 'word==>>', word);
           /*  log.debug({
                title: 'word',
                details: word
            }); */

            if (ISOCode == 'INR')
                word + " " + "Paisa" + " " + "Only";

            return amountInWords;
        } //function getAmtInWords(total, currencyId, ISOCod
        function convert_number(number, ISOCode) {

            //if (ISOCode == 'INR' || ISOCode == 'TZS') {
            if (ISOCode == 'INR') {
                if ((number < 0) || (number > 999999999)) {
                    return "Number is out of range";
                } //if ((number < 0) || (number > 999999999))

                var Gn = Math.floor(number / 10000000); /* Crore */
                number -= Gn * 10000000;
                var kn = Math.floor(number / 100000); /* lakhs */
                number -= kn * 100000;
                var Hn = Math.floor(number / 1000); /* thousand */
                number -= Hn * 1000;
                var Dn = Math.floor(number / 100); /* Tens (deca) */
                number = number % 100; /* Ones */
                var tn = Math.floor(number / 10);
                var one = Math.floor(number % 10);
                var res = "";

                if (Gn > 0) {
                    res += (convert_number(Gn, ISOCode) + " Crore");
                }
                if (kn > 0) {
                    res += (((res == "") ? "" : " ") +
                        convert_number(kn, ISOCode) + " Lakhs");
                }
                if (Hn > 0) {
                    res += (((res == "") ? "" : " ") +
                        convert_number(Hn, ISOCode) + " Thousand");
                }
                if (Dn) {
                    res += (((res == "") ? "" : " ") +
                        convert_number(Dn, ISOCode) + " Hundred");
                }

                var ones = Array("", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen");
                var tens = Array("", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety");

                if (tn > 0 || one > 0) {

                    if (!(res == "")) {
                        //res += " and ";
                        res += " ";
                    }
                    if (tn < 2) {
                        res += ones[tn * 10 + one];
                    } else {
                        res += tens[tn];
                        if (one > 0) {
                            res += ("-" + ones[one]);
                        }
                    }
                } //if (tn>0 || one>0)

                if (res == "") {
                    res = "zero";
                }
                return res;
            } else {
                var neStr = toWordsUSD(number)
                log.debug("convert_number", "NON INR neStr : " + neStr)
                return neStr;
            }

        }

        function toWordsUSD(s) {
            var th = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];
            var dg = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
            var tn = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
            var tw = ['Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
            s = s.toString();
            s = s.replace(/[\, ]/g, '');
            if (s != parseFloat(s)) return 'not a number';
            var x = s.indexOf('.');
            if (x == -1)
                x = s.length;
            if (x > 15)
                return 'too big';
            var n = s.split('');
            var str = '';
            var sk = 0;
            for (var i = 0; i < x; i++) {
                if ((x - i) % 3 == 2) {
                    if (n[i] == '1') {
                        str += tn[Number(n[i + 1])] + ' ';
                        i++;
                        sk = 1;
                    } else if (n[i] != 0) {
                        str += tw[n[i] - 2] + ' ';
                        sk = 1;
                    }
                } else if (n[i] != 0) { // 0235
                    str += dg[n[i]] + ' ';
                    if ((x - i) % 3 == 0) str += 'Hundred ';
                    sk = 1;
                }
                if ((x - i) % 3 == 1) {
                    if (sk)
                        str += th[(x - i - 1) / 3] + ' ';
                    sk = 0;
                }
            }

            if (x != s.length) {
                var y = s.length;
                str += 'and '; //point
                for (var i = x + 1; i < y; i++)
                    str += dg[n[i]] + ' ';
            }
            return str.replace(/\s+/g, ' ');
        }

        //*************************************** Dollar Conversion (All except Indian Rupees) **************************************************
        function dollars2text(value) {

            if ((value < 0) || (value > 99999999999999)) {
                return "AMOUNT OUT OF RANGE!";
            }
            var fraction = Math.round(frac(value) * 100);
            var f_text = "";

            if (fraction > 0) {
                f_text = "AND " + dollars_number(fraction) + " Cents";
            }

            return dollars_number(value) + " Dollars " + f_text;
        }

        function dollars_number(number) {
            if ((number < 0) || (number > 99999999999999)) {
                return "NUMBER OUT OF RANGE!";
            }
            var Ar = Math.floor(number / 1000000000000); /* Trillion */
            number -= Ar * 1000000000000;
            var Gn = Math.floor(number / 10000000000); /* Billion */
            number -= Gn * 10000000000;
            var kn = Math.floor(number / 1000000); /* Million */
            number -= kn * 1000000;
            var Hn = Math.floor(number / 1000); /* Thousand */
            number -= Hn * 1000;
            var Dn = Math.floor(number / 100); /* Tens (deca) */
            number = number % 100; /* Ones */
            var tn = Math.floor(number / 10);
            var one = Math.floor(number % 10);
            var res = "";

            if (Ar > 0) {
                res += (dollars_number(Ar) + " Trillion");
            }
            if (Gn > 0) {
                res += (((res == "") ? "" : " ") +
                    dollars_number(Gn) + " Billion");
                //		res += (dollars_number(Gn) + " CRORE"); 
            }
            if (kn > 0) {
                res += (((res == "") ? "" : " ") +
                    dollars_number(kn) + " Million");
            }
            if (Hn > 0) {
                res += (((res == "") ? "" : " ") +
                    dollars_number(Hn) + " Thousand");
            }

            if (Dn) {
                res += (((res == "") ? "" : " ") +
                    dollars_number(Dn) + " Hundred");
            }

            var ones = Array("", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen");
            var tens = Array("", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety");

            if (tn > 0 || one > 0) {
                if (!(res == "")) {
                    res += " And ";
                }
                if (tn < 2) {
                    res += ones[tn * 10 + one];
                } else {

                    res += tens[tn];
                    if (one > 0) {
                        res += ("-" + ones[one]);
                    }
                }
            }

            /*  if (res=="")
            { 
            	res = "zero"; 
            } */

            if (res == "") {
                res = "Zero";
            }
            return res;
        }

        function frac(f) {
            return f % 1;
        }
        //****************************************** Swiss Frnac conversion ***************************************************//
        function Swissfranc2text(value) {

            if ((value < 0) || (value > 99999999999999)) {
                return "AMOUNT OUT OF RANGE!";
            }
            var fraction = Math.round(frac(value) * 100);
            var f_text = "";

            if (fraction > 0) {
                f_text = "And " + Swissfranc_number(fraction) + " Rappen";
            }

            return Swissfranc_number(value) + " Francs " + f_text;
        }

        function Swissfranc_number(number) {
            if ((number < 0) || (number > 99999999999999)) {
                return "NUMBER OUT OF RANGE!";
            }
            var Ar = Math.floor(number / 1000000000000); /* Trillion */
            number -= Ar * 1000000000000;
            var Gn = Math.floor(number / 10000000000); /* Billion */
            number -= Gn * 10000000000;
            var kn = Math.floor(number / 1000000); /* Million */
            number -= kn * 1000000;
            var Hn = Math.floor(number / 1000); /* Thousand */
            number -= Hn * 1000;
            var Dn = Math.floor(number / 100); /* Tens (deca) */
            number = number % 100; /* Ones */
            var tn = Math.floor(number / 10);
            var one = Math.floor(number % 10);
            var res = "";

            if (Ar > 0) {
                res += (Swissfranc_number(Ar) + " TRillion");
            }
            if (Gn > 0) {
                res += (((res == "") ? "" : " ") +
                    Swissfranc_number(Gn) + " Billion");
                //		res += (dollars_number(Gn) + " CRORE"); 
            }
            if (kn > 0) {
                res += (((res == "") ? "" : " ") +
                    Swissfranc_number(kn) + " Million");
            }
            if (Hn > 0) {
                res += (((res == "") ? "" : " ") +
                    Swissfranc_number(Hn) + " Thousand");
            }

            if (Dn) {
                res += (((res == "") ? "" : " ") +
                    Swissfranc_number(Dn) + " Hundred");
            }

            var ones = Array("", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen");
            var tens = Array("", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety");

            if (tn > 0 || one > 0) {
                if (!(res == "")) {
                    res += " And ";
                }
                if (tn < 2) {
                    res += ones[tn * 10 + one];
                } else {

                    res += tens[tn];
                    if (one > 0) {
                        res += ("-" + ones[one]);
                    }
                }
            }

            /*  if (res=="")
            { 
            	res = "zero"; 
            } */

            if (res == "") {
                res = "Zero";
            }
            return res;
        }
        //****************************************** POUND Conversion *********************************************************//
        function pounds2text(value) {

            if ((value < 0) || (value > 99999999999999)) {
                return "AMOUNT OUT OF RANGE!";
            }
            var fraction = Math.round(frac(value) * 100);
            var f_text = "";

            if (fraction > 0) {
                f_text = "And " + pounds_number(fraction) + " Pence";
            }

            return pounds_number(value) + " Pound " + f_text;
        }

        function pounds_number(number) {
            if ((number < 0) || (number > 99999999999999)) {
                return "NUMBER OUT OF RANGE!";
            }
            var Ar = Math.floor(number / 1000000000000); /* Trillion */
            number -= Ar * 1000000000000;
            var Gn = Math.floor(number / 10000000000); /* Billion */
            number -= Gn * 10000000000;
            var kn = Math.floor(number / 1000000); /* Million */
            number -= kn * 1000000;
            var Hn = Math.floor(number / 1000); /* Thousand */
            number -= Hn * 1000;
            var Dn = Math.floor(number / 100); /* Tens (deca) */
            number = number % 100; /* Ones */
            var tn = Math.floor(number / 10);
            var one = Math.floor(number % 10);
            var res = "";

            if (Ar > 0) {
                res += (pounds_number(Ar) + " Trillion");
            }
            if (Gn > 0) {
                res += (((res == "") ? "" : " ") +
                    pounds_number(Gn) + " Billion");
                //		res += (dollars_number(Gn) + " CRORE"); 
            }
            if (kn > 0) {
                res += (((res == "") ? "" : " ") +
                    pounds_number(kn) + " Million");
            }
            if (Hn > 0) {
                res += (((res == "") ? "" : " ") +
                    pounds_number(Hn) + " Thousand");
            }

            if (Dn) {
                res += (((res == "") ? "" : " ") +
                    pounds_number(Dn) + " Hundred");
            }

            var ones = Array("", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen");
            var tens = Array("", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety");

            if (tn > 0 || one > 0) {
                if (!(res == "")) {
                    res += " And ";
                }
                if (tn < 2) {
                    res += ones[tn * 10 + one];
                } else {

                    res += tens[tn];
                    if (one > 0) {
                        res += ("-" + ones[one]);
                    }
                }
            }

            /*  if (res=="")
            { 
            	res = "zero"; 
            } */

            if (res == "") {
                res = "Zero";
            }
            return res;
        }

        //****************************************** EURO Conversion 
        function euro2text(value) {

            if ((value < 0) || (value > 99999999999999)) {
                return "AMOUNT OUT OF RANGE!";
            }
            var fraction = Math.round(frac(value) * 100);
            var f_text = "";

            if (fraction > 0) {
                f_text = "And " + euro_number(fraction) + " Cents";
            }

            return euro_number(value) + " Euro " + f_text;
        }

        function euro_number(number) {
            if ((number < 0) || (number > 99999999999999)) {
                return "NUMBER OUT OF RANGE!";
            }
            var Ar = Math.floor(number / 1000000000000); /* Trillion */
            number -= Ar * 1000000000000;
            var Gn = Math.floor(number / 10000000000); /* Billion */
            number -= Gn * 10000000000;
            var kn = Math.floor(number / 1000000); /* Million */
            number -= kn * 1000000;
            var Hn = Math.floor(number / 1000); /* Thousand */
            number -= Hn * 1000;
            var Dn = Math.floor(number / 100); /* Tens (deca) */
            number = number % 100; /* Ones */
            var tn = Math.floor(number / 10);
            var one = Math.floor(number % 10);
            var res = "";

            if (Ar > 0) {
                res += (euro_number(Ar) + " Trillion");
            }
            if (Gn > 0) {
                res += (((res == "") ? "" : " ") +
                    euro_number(Gn) + " Billion");
                //		res += (dollars_number(Gn) + " CRORE"); 
            }
            if (kn > 0) {
                res += (((res == "") ? "" : " ") +
                    euro_number(kn) + " Million");
            }
            if (Hn > 0) {
                res += (((res == "") ? "" : " ") +
                    euro_number(Hn) + " Thousand");
            }

            if (Dn) {
                res += (((res == "") ? "" : " ") +
                    euro_number(Dn) + " Hundred");
            }

            var ones = Array("", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen");
            var tens = Array("", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety");

            if (tn > 0 || one > 0) {
                if (!(res == "")) {
                    res += " And ";
                }
                if (tn < 2) {
                    res += ones[tn * 10 + one];
                } else {

                    res += tens[tn];
                    if (one > 0) {
                        res += ("-" + ones[one]);
                    }
                }
            }

            if (res == "") {
                res = "Zero";
            }
            return res;
        }

        //*************************************** Indian Conversion **************************************************
        function rupees2text(value) {

            if ((value < 0) || (value > 999999999)) {
                return "AMOUNT OUT OF RANGE!";
            }
            var fraction = Math.round(frac(value) * 100);
            var f_text = "";

            if (fraction > 0) {
                f_text = "And " + rupees_number(fraction) + " Paise";
            }

            return rupees_number(value) + " Rupees " + f_text + " Only";
        }
		
		
		//Updated Code - Sunil k - 16-03-2023 ====
		//Tanzania 
		
		function tanzania2text(value) {
			
			
			if ((value < 0) || (value > 99999999999999)) {
                return "AMOUNT OUT OF RANGE!";
            }
            var fraction = Math.round(frac(value) * 100);
            var f_text = "";

            /* if (fraction > 0) {
                f_text = "AND " + dollars_number(fraction) + " Cents";
            } */

            return dollars_number(value) + " Tanzanian Shilling " + f_text;
			

            /* if ((value < 0) || (value > 999999999)) {
                return "AMOUNT OUT OF RANGE!";
            }
            var fraction = Math.round(frac(value) * 100);
            var f_text = "";

            // if (fraction > 0) {
              //  f_text = "And " + rupees_number(fraction) + " Shilling";
           // } 

            return rupees_number(value) + " Tanzanian Shilling"; */
            //return rupees_number(value) + " Srilankan";
        }
		
		//===========End==========
		
		//Ghana 
		
		function ghana2text(value) {
			
			
			if ((value < 0) || (value > 99999999999999)) {
                return "AMOUNT OUT OF RANGE!";
            }
            var fraction = Math.round(frac(value) * 100);
            var f_text = "";

            /* if (fraction > 0) {
                f_text = "AND " + dollars_number(fraction) + " Cents";
            } */

            return dollars_number(value) + " Ghanaian Cedi" + f_text;
			

            /* if ((value < 0) || (value > 999999999)) {
                return "AMOUNT OUT OF RANGE!";
            }
            var fraction = Math.round(frac(value) * 100);
            var f_text = "";

            // if (fraction > 0) {
              //  f_text = "And " + rupees_number(fraction) + " Shilling";
           // } 

            return rupees_number(value) + " Tanzanian Shilling"; */
            //return rupees_number(value) + " Srilankan";
        }
		
		//===========End==========
		
		
		
		//Kenya
		
		function kenya2text(value) {
			
			
			if ((value < 0) || (value > 99999999999999)) {
                return "AMOUNT OUT OF RANGE!";
            }
            var fraction = Math.round(frac(value) * 100);
            var f_text = "";

            /* if (fraction > 0) {
                f_text = "AND " + dollars_number(fraction) + " Cents";
            } */

            return dollars_number(value) + " Kenyan Shilling" + f_text;
			

            /* if ((value < 0) || (value > 999999999)) {
                return "AMOUNT OUT OF RANGE!";
            }
            var fraction = Math.round(frac(value) * 100);
            var f_text = "";

            // if (fraction > 0) {
              //  f_text = "And " + rupees_number(fraction) + " Shilling";
           // } 

            return rupees_number(value) + " Tanzanian Shilling"; */
            //return rupees_number(value) + " Srilankan";
        }
		
		//===========End==========
		
		
		
		//Zambia
		
		function zambia2text(value) {
			
			
			if ((value < 0) || (value > 99999999999999)) {
                return "AMOUNT OUT OF RANGE!";
            }
            var fraction = Math.round(frac(value) * 100);
            var f_text = "";

            /* if (fraction > 0) {
                f_text = "AND " + dollars_number(fraction) + " Cents";
            } */

            return dollars_number(value) + " Zambian Kwacha" + f_text;
			

            /* if ((value < 0) || (value > 999999999)) {
                return "AMOUNT OUT OF RANGE!";
            }
            var fraction = Math.round(frac(value) * 100);
            var f_text = "";

            // if (fraction > 0) {
              //  f_text = "And " + rupees_number(fraction) + " Shilling";
           // } 

            return rupees_number(value) + " Tanzanian Shilling"; */
            //return rupees_number(value) + " Srilankan";
        }
		
		//===========End==========
		
		
		
		//Zambia
		
		function srilanka2text(value) {
			
			
			if ((value < 0) || (value > 99999999999999)) {
                return "AMOUNT OUT OF RANGE!";
            }
            var fraction = Math.round(frac(value) * 100);
            var f_text = "";

            /* if (fraction > 0) {
                f_text = "AND " + dollars_number(fraction) + " Cents";
            } */

            return dollars_number(value) + " Sri Lankan Rupee Only" + f_text;
			

            /* if ((value < 0) || (value > 999999999)) {
                return "AMOUNT OUT OF RANGE!";
            }
            var fraction = Math.round(frac(value) * 100);
            var f_text = "";

            // if (fraction > 0) {
              //  f_text = "And " + rupees_number(fraction) + " Shilling";
           // } 

            return rupees_number(value) + " Tanzanian Shilling"; */
            //return rupees_number(value) + " Srilankan";
        }
		
		//===========End==========

        function rupees_number(number) {
            if ((number < 0) || (number > 99999999999)) {
                return "NUMBER OUT OF RANGE!";
            }
            var Ar = Math.floor(number / 1000000000); /* Arab */
            number -= Ar * 1000000000;
            var Gn = Math.floor(number / 10000000); /* Crore */
            number -= Gn * 10000000;
            var kn = Math.floor(number / 100000); /* lakhs */
            number -= kn * 100000;
            var Hn = Math.floor(number / 1000); /* thousand */
            number -= Hn * 1000;
            var Dn = Math.floor(number / 100); /* Tens (deca) */
            number = number % 100; /* Ones */
            var tn = Math.floor(number / 10);
            var one = Math.floor(number % 10);
            var res = "";

            if (Ar > 0) {
                res += (rupees_number(Ar) + " Arab");
            }
            if (Gn > 0) {
                res += (((res == "") ? "" : " ") +
                    rupees_number(Gn) + " Crore");
            }
            if (kn > 0) {
                res += (((res == "") ? "" : " ") +
                    rupees_number(kn) + " Lakh");
            }
            if (Hn > 0) {
                res += (((res == "") ? "" : " ") +
                    rupees_number(Hn) + " Thousand");
            }

            if (Dn) {
                res += (((res == "") ? "" : " ") +
                    rupees_number(Dn) + " Hundred");
            }

            var ones = Array("", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen");
            var tens = Array("", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety");

            if (tn > 0 || one > 0) {
                if (!(res == "")) {
                    res += " And ";
                }
                if (tn < 2) {
                    res += ones[tn * 10 + one];
                } else {

                    res += tens[tn];
                    if (one > 0) {
                        res += ("-" + ones[one]);
                    }
                }
            }
            if (res == "") {
                res = "Zero";
            }
            return res;
        }
        //*************************************** Other Currency Conversion **************************************************
        function amt2words(value) {
            if ((value < 0) || (value > 99999999999999)) {
                return "AMOUNT OUT OF RANGE!";
            }
            var fraction = Math.round(frac(value) * 100);
            var f_text = "";

            if (fraction > 0) {
                //f_text = "AND " + amt2text(fraction)+ " CENTS";
                f_text = "And " + fraction + "/100";
            }

            //return dollars_number(value) + " DOLLARS " + f_text;
            return amt2text(value) + " " + f_text;
        }

        function amt2text(number) {
            if ((number < 0) || (number > 99999999999999)) {
                return "NUMBER OUT OF RANGE!";
            }
            var Ar = Math.floor(number / 1000000000000); /* Trillion */
            number -= Ar * 1000000000000;
            var Gn = Math.floor(number / 10000000000); /* Billion */
            number -= Gn * 10000000000;
            var kn = Math.floor(number / 1000000); /* Million */
            number -= kn * 1000000;
            var Hn = Math.floor(number / 1000); /* Thousand */
            number -= Hn * 1000;
            var Dn = Math.floor(number / 100); /* Tens (deca) */
            number = number % 100; /* Ones */
            var tn = Math.floor(number / 10);
            var one = Math.floor(number % 10);
            var res = "";

            if (Ar > 0) {
                res += (amt2text(Ar) + " Trillion");
            }
            if (Gn > 0) {
                res += (((res == "") ? "" : " ") +
                    amt2text(Gn) + " Billion");
            }
            if (kn > 0) {
                res += (((res == "") ? "" : " ") +
                    amt2text(kn) + " Million");
            }
            if (Hn > 0) {
                res += (((res == "") ? "" : " ") +
                    amt2text(Hn) + " Thousand");
            }

            if (Dn) {
                res += (((res == "") ? "" : " ") +
                    amt2text(Dn) + " Hundred");
            }

            var ones = Array("", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen");
            var tens = Array("", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety");

            if (tn > 0 || one > 0) {
                if (!(res == "")) {
                    res += " And ";
                }
                if (tn < 2) {
                    res += ones[tn * 10 + one];
                } else {

                    res += tens[tn];
                    if (one > 0) {
                        res += ("-" + ones[one]);
                    }
                }
            }
            if (res == "") {
                res = "Zero";
            }
            return res;
        }

        function frac(f) {
            return f % 1;
        }

        return {

            afterSubmit: afterSubmit
        };
    }); //function convert_number(number)