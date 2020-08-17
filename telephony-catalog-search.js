// Script that search OTE Public Telephony Catalog to might find the caller address (only works if the caller calls from a landline)
// Created by George Tomzaridis
// covid-info.gr / helpfwd.com

const request = require('request');
const jsdom = require("jsdom");
const utf8 = require('utf8');
const unescapeJs = require('unescape-js');
var AGIServer = require('ding-dong');

var complete_street_personal = "";
var complete_street_business = "";
var complete_street_organazation = "";
var final_street_exit = "";
var caller_number_id = "";


var handler = function (context) {
    context.onEvent('variables')
        .then(function (vars) {
            caller_number_id = vars['agi_callerid']; // Get the caller number from asterisk pbx
        }).then((result) => {
            request('https://www.11888.gr/antistrofh-anazhthsh-me-arithmo-thlefwnou/'+ caller_number_id +'/', { json: true, encoding: 'utf-8', gzip: true }, (err, res, body) => {
                var business_data_json = "-";
                var personal_data_json = "-";
                var public_data_json = "-";
                if (err) { return console.log(err); }
                var htmlarray1 = body.split("$('#cosid_md_login')");
                var htmlarray2 = htmlarray1[1].split("window._pageData = JSON.parse('{}');");
                var jsoncode = htmlarray2[0];
                var prefinal1 = jsoncode.substring(170);
                var prefinal2 = prefinal1.replace("');", "");
                var prefinal3 = utf8.encode(prefinal2);
                var final = unescapeJs(prefinal3);
                console.log(final);


                var callerinfo = JSON.parse(final);
                var findresults = 0;

                if(callerinfo.results.hasOwnProperty('yp')){
                    var business_catalog_num_results = callerinfo.results.yp.length;
                    if(business_catalog_num_results > 0){
                        business_data_json = '{ "results": [';
                        console.log("------BUSINESS CATALOG RESULTS------");
                        findresults = 1;
                        for(var a = 0; a <= business_catalog_num_results - 1; a++){
                            var companyName = callerinfo.results.yp[a].companyName;
                            console.log('[*] '+ companyName);
                            business_data_json += '{ "companyname": "'+ companyName +'", ';
                            var phones_catalog_count = callerinfo.results.yp[a].phones.length;
                            console.log('[*] Phones');
                            business_data_json += ' "phones": [';
                            for(var b = 0; b <= phones_catalog_count - 1; b++){
                                var number = callerinfo.results.yp[a].phones[b].number;
                                var phoneType = callerinfo.results.yp[a].phones[b].phoneType;
                                var provider = callerinfo.results.yp[a].phones[b].provider;
                                console.log('  (+) ['+ phoneType + ' '+ provider +'] '+ number);
                                if(b == phones_catalog_count - 1){
                                    business_data_json += '{ "number": "'+ number +'", "phonetype": "'+phoneType+'", "provider": "'+provider+'" }';
                                }else{
                                    business_data_json += '{ "number": "'+ number +'", "phonetype": "'+phoneType+'", "provider": "'+provider+'" },';
                                }
                            }
                            var city = callerinfo.results.yp[a].address.subregion['name'];
                            try{
                                try{
                                    var municipality = callerinfo.results.yp[a].address.municipality['name'];
                                }catch{
                                    var municipality = callerinfo.results.yp[a].address.residential['name'];
                                }
                            }catch{
                                var municipality = callerinfo.results.yp[a].address.subregion['name'];
                            }
                            var street = callerinfo.results.yp[a].address.street1;
                            if(street == null){
                                street = "-";
                            }
                            var addrnumber = callerinfo.results.yp[a].address.number1;
                            if(addrnumber == null){
                                addrnumber = "-";
                            }
                            var postalcode = callerinfo.results.yp[a].address.postal_code;
                            if(postalcode == null){
                                postalcode = "-";
                            }
                            console.log('[*] Street');
                            console.log('  (+) '+ street +' '+ addrnumber + ', '+ municipality + ', '+ city + ' ΤΚ: '+ postalcode);
                            if(a == business_catalog_num_results - 1){
                                business_data_json += '], "street": "'+ street +' '+ addrnumber + ', '+ municipality + ', '+ city + ' ΤΚ: '+ postalcode +'" }';
                            }else{
                                business_data_json += '], "street": "'+ street +' '+ addrnumber + ', '+ municipality + ', '+ city + ' ΤΚ: '+ postalcode +'" },';
                            }
                        
                            complete_street_business = street +' '+ addrnumber + '.'+ municipality + '.'+ city + '.'+ postalcode;
                        
                        }
                        business_data_json += ' ]}';
                        console.log('\n');
                        console.log(business_data_json);
                    }else{
                        complete_street_business = "noresults";
                    }
                }else{
                    complete_street_business = "noresults";
                }
            
                console.log("\n");
            
                if(callerinfo.results.hasOwnProperty('wp')){
                    var personal_catalog_num_results = callerinfo.results.wp.length;
                    if(personal_catalog_num_results > 0){
                        personal_data_json = '{ "results": [';
                        console.log("------PERSONAL CATALOG RESULTS------");
                        findresults = 1;
                        for(var c = 0; c <= personal_catalog_num_results - 1; c++){
                            if(callerinfo.results.wp[c].name['first'] == null){
                                var personName = callerinfo.results.wp[c].name['last'];
                            }else if(callerinfo.results.wp[c].name['last'] == null){
                                var personName = callerinfo.results.wp[c].name['first'];
                            }else{
                                var personName = callerinfo.results.wp[c].name['first'] + ' '+ callerinfo.results.wp[c].name['last'];
                            }
                        
                            console.log('[*] '+ personName);
                            personal_data_json += '{ "personname": "'+ personName +'", ';
                            var phones_catalog_count2 = callerinfo.results.wp[c].phones.length;
                            console.log('[*] Phones');
                            console.log('Phones count: '+ phones_catalog_count2);
                            personal_data_json += ' "phones": [';
                            for(var d = 0; d <= phones_catalog_count2 - 1; d++){
                                var number = callerinfo.results.wp[c].phones[d].number;
                                var provider = callerinfo.results.wp[c].phones[d].provider;
                                console.log('  (+) ['+ provider +'] '+ number);
                                if(d === phones_catalog_count2 - 1){
                                    personal_data_json += '{ "number": "'+ number +'", "provider": "'+provider+'" }';
                                }else{
                                    personal_data_json += '{ "number": "'+ number +'", "provider": "'+provider+'" },';
                                }
                            
                            }
                        
                            try{
                                var city = callerinfo.results.wp[c].address.subregion['name'];
                            }catch{
                                var city = "-";
                            }
                        
                            try{
                                var municipality = callerinfo.results.wp[c].address.municipality['name'];
                            }catch{
                                try{
                                    var municipality = callerinfo.results.wp[c].address.residential['name'];
                                }catch{
                                    try{
                                        var municipality = callerinfo.results.wp[c].address.subregion['name'];
                                    }catch{
                                        var municipality = "-";
                                    }
                                }
                            }
                        
                        
                        
                            var street = callerinfo.results.wp[c].address.street1;
                            if(street == null){
                                street = "-";
                            }
                            var addrnumber = callerinfo.results.wp[c].address.number1;
                            if(addrnumber == null){
                                addrnumber = "-";
                            }
                            var postalcode = callerinfo.results.wp[c].address.postal_code;
                            if(postalcode == null){
                                postalcode = "-";
                            }
                            console.log('[*] Street');
                            console.log('  (+) '+ street +' '+ addrnumber + ', '+ municipality + ', '+ city + ' ΤΚ: '+ postalcode);
                            if(c === personal_catalog_num_results - 1){
                                personal_data_json += '], "street": "'+ street +' '+ addrnumber + ', '+ municipality + ', '+ city + ' ΤΚ: '+ postalcode +'" }';
                            }else{
                                personal_data_json += '], "street": "'+ street +' '+ addrnumber + ', '+ municipality + ', '+ city + ' ΤΚ: '+ postalcode +'" },';
                            }
                        
                            complete_street_personal = street +'.'+ addrnumber + '.'+ municipality + '.'+ city + '.'+ postalcode;
                        
                        
                        
                        }
                        personal_data_json += ' ]}';
                        console.log('\n');
                        console.log(personal_data_json);
                    }else{
                        complete_street_personal = "noresults";
                    }
                }else{
                    complete_street_personal = "noresults";
                }
            
                console.log("\n");
            
                if(callerinfo.results.hasOwnProperty('ps')){
                    var public_catalog_num_results = callerinfo.results.ps.length;
                    if(public_catalog_num_results > 0){
                        public_data_json = '{ "results": [';
                        console.log("------PUBLIC CATALOG RESULTS------");
                        findresults = 1;
                        for(var e = 0; e <= public_catalog_num_results - 1; e++){
                            var publicName = callerinfo.results.ps[e].name;
                            console.log('[*] '+ publicName);
                            public_data_json += '{ "publicname": "'+ publicName +'", ';
                            var phones_catalog_count3 = callerinfo.results.ps[e].phones.length;
                            try{
                                var city = callerinfo.results.ps[e].address.subregion['name'];
                            }catch{
                                var city = "-";
                            }
                            try{
                                try{
                                    var municipality = callerinfo.results.ps[e].address.municipality['name'];
                                }catch{
                                    var municipality = callerinfo.results.ps[e].address.residential['name'];
                                }
                            }catch{
                                var municipality = callerinfo.results.ps[e].address.subregion['name'];
                            }
                            try{
                                var street = callerinfo.results.ps[e].address.street1;
                            }catch {
                                var street = "-";
                            }
                            if(street == null){
                                street = "-";
                            }
                            var addrnumber = callerinfo.results.ps[e].address.number1;
                            if(addrnumber == null){
                                addrnumber = "-";
                            }
                            var postalcode = callerinfo.results.ps[e].address.postal_code;
                            if(postalcode == null){
                                postalcode = "-";
                            }
                            console.log('[*] Street');
                            console.log('  (+) '+ street +' '+ addrnumber + ', '+ municipality + ', '+ city + ' ΤΚ: '+ postalcode);
                            if(e == public_catalog_num_results - 1){
                                public_data_json += '"street": "'+ street +' '+ addrnumber + ', '+ municipality + ', '+ city + ' ΤΚ: '+ postalcode + '"}';
                            }else{
                                public_data_json += '"street": "'+ street +' '+ addrnumber + ', '+ municipality + ', '+ city + ' ΤΚ: '+ postalcode + '"},';
                            }
                            complete_street_organazation =  street +'.'+ addrnumber + '.'+ municipality + '.'+ city + '.'+ postalcode;
                        }
                        public_data_json += ' ]}';
                        console.log('\n');
                        console.log(public_data_json);
                    }else{
                        complete_street_organazation = "noresults";
                    }
                }else{
                    complete_street_organazation = "noresults";
                }
            
            
                console.log("Personal Complete Address: "+ complete_street_personal);
                console.log("Busines Complete Address: "+ complete_street_business);
                console.log("Organazation Complete Address: "+ complete_street_organazation);
            
                var arr_storage_addr = { };
            
                if(complete_street_personal != "noresults"){
                    arr_storage_addr['personal'] = ((complete_street_personal).match(/-/g) || []).length;
                }
            
                if(complete_street_business != "noresults"){
                    arr_storage_addr['business'] = ((complete_street_business).match(/-/g) || []).length;
                }
            
                if(complete_street_organazation != "noresults"){
                    arr_storage_addr['organazation'] = ((complete_street_organazation).match(/,/g) || []).length;
                }
            
                if(findresults == 0){
                    final_street_exit = "no";
                    console.log("No results found :(");
                    //return context.close();

                   
                }else{
                
                    console.log(arr_storage_addr);
                
                    var [lowestItems] = Object.entries(arr_storage_addr).sort(([ ,v1], [ ,v2]) => v1 - v2);
                    console.log(`Lowest value is ${lowestItems[1]}, with a key of ${lowestItems[0]}`);
                
                
                    if(lowestItems[0] == "personal"){
                        final_street_exit = complete_street_personal;
                    }
                
                    if(lowestItems[0] == "business"){
                        final_street_exit = complete_street_business;
                    }
                
                    if(lowestItems[0] == "organazation"){
                        final_street_exit = complete_street_organazation;
                    }
                
                    final_street_exit = final_street_exit.replace("-", "");
                    final_street_exit = final_street_exit.replace("[Δημος]", "");
                    final_street_exit = final_street_exit.replace(".-.", ".");
                    final_street_exit = final_street_exit.replace(".-", ".");
                    final_street_exit = final_street_exit.replace("-.", ".");
                    console.log("FINAL ADDRESS: " + final_street_exit);
                    
                }
            
                // Sending to asterisk the street value from the caller (Asterisk Variable Saving)
                context.setVariable("caller-street-"+ caller_number_id, final_street_exit);
                return context.end();
            });
            
        });
};
 
var agi = new AGIServer(handler);
agi.start(3000);






