var express = require('express');
var router = express.Router();
var tabletop = require('tabletop');
var json2csv = require('json2csv');
var request = require('request');
var csv = require('csv');
var fs = require('fs');
var path = require('path');
//Converter Class
var Converter=require("csvtojson").core.Converter;
var exec = require('child_process').exec;
var http = require('http');
var wget = require('wget');
var winston = require('winston');
winston.level = 'debug';

router.get('/csv', function(req, res, next) {
	tabletop.init( { key: '1FlFzSqdaQp9lEv4rALC6dND0JxJoDBFAyNE5K-1zdQc',
                   callback: function(incidents, tabletop) { 
						json2csv({ data: incidents, fields : ['incidentid', 'incidentreportdate', 'title', 'description', 'locationname', 'latitude', 'longitude', 'contactnumber'] }, function(err, csv) {
						  if (err) console.log(err);
						  	res.set('Content-Type', 'text/csv');
							res.send(csv);
						});

                    },
                   simpleSheet: true } )
  // res.render('index', { title: 'Express' });
});

var quakemap = {};
quakemap.readableIncidentMode = function(incidentModeCode){
	switch(incidentModeCode){
		case "1":
			return "WEB";
		case "2":
			return "SMS";
		case "3":
			return "EMAIL";
		case "4":
			return "TWITTER";
	}
};

quakemap.fields = [
  "incidentid",
  "incidentlink",
  "incidenttitle",
  "incidentdescription",
  "incidentdate",
  "incidentmode", 
  "incidentactive",
  "incidentverified",
  "locationname",
  "locationlatitude",
  "locationlongitude"
  ];

router.get('/autorefresh', function(req, res, next){
	request('http://quakemap.org/api?task=incidents', function (error, response, body) {
	    if (!error && response.statusCode == 200) {
	    	var body = JSON.parse(body);
	    	var incidents = body.payload.incidents;
	    	var readableIncidents = [];

			for(var i=0; i<incidents.length; i++){
				var incident = incidents[i].incident;
				incident.incidentlink = "http://quakemap.org/reports/view/" + incident.incidentid;		 	
				incident.incidentmode = quakemap.readableIncidentMode(incident.incidentmode);
				incident.incidentactive = parseInt(incident.incidentactive)?"YES":"NO";

				incident.incidentverified = parseInt(incident.incidentverified)?"YES":"NO";

				var customfields = incidents[i].customfields;
				for(key in customfields){
					if (customfields.hasOwnProperty(key)) {
   						var customfield = customfields[key];
   						if(quakemap.fields.indexOf(customfield["field_name"]) == -1) {
							quakemap.fields.push(customfield["field_name"]);
						}
						incident[customfield["field_name"]] = customfield["field_response"];
  					}
				}

				var comments = incidents[i].comments;
				if(comments.length > 0) { console.warn("Found a comment");}

				readableIncidents.push(incident);

	    	}

	    	json2csv({ data: readableIncidents, fields: quakemap.fields}, function(err, csv) {
			  if (err) console.log(err);
			  res.send(csv);
			});
	    }
	});

});

quakemap.csvFields = [
"",
"INCIDENT LINK",
"INCIDENT TITLE",
"INCIDENT DATE",
"LOCATION",
"DESCRIPTION",
"CATEGORY",
"LATITUDE",
"LONGITUDE",
"Phone Number",
"Most Affected District",
"VDC",
"Location Accuracy - the report is from in this",
"For Approval or Status Adjustment",
"Dispatch Status - Quakemap.org team has contacted an organization and they have agreed to respond to this report",
"Dispatched organization capacity",
"Closed Status - nothing more needed from quakemap.org team",
"Number of times contact attempted",
"Number of times reached",
"Location accuracy checked or fixed by",
"FIRST NAME",	
"LAST NAME",
"EMAIL",
"APPROVED",
"VERIFIED",	
"ACTIONABLE",
"ACTION TAKEN",	
"URGENT",
"CLOSED",
"ACTION SUMMARY",
"COMMENT",
"COMMENT DATE"
];

quakemap.filterHelpText = "Click to apply filter";

quakemap.filters = {
	"Most Affected District" : {
		selected: quakemap.filterHelpText, 
		choices: [quakemap.filterHelpText]
	},
	"Location Accuracy - the report is from in this" : {
		selected: quakemap.filterHelpText, 
		choices: [quakemap.filterHelpText]
	},
	"APPROVED" : {
		selected: quakemap.filterHelpText, 
		choices: [quakemap.filterHelpText]
	},
	"VERIFIED" : {
		selected: quakemap.filterHelpText, 
		choices: [quakemap.filterHelpText]
	},
	"ACTIONABLE" : {
		selected: quakemap.filterHelpText, 
		choices: [quakemap.filterHelpText]
	},
	"ACTION TAKEN" : {
		selected: quakemap.filterHelpText, 
		choices: [quakemap.filterHelpText]
	}
};

quakemap.csvOutputFields = JSON.parse(JSON.stringify(quakemap.csvFields));
quakemap.csvOutputFields[0] = "ID";
quakemap.badCSV = path.join(__dirname, '../public', 'quakemap-data.csv'); 
quakemap.goodCSV = path.join(__dirname, '../public', 'quakemap-data-cleaned.csv');
quakemap.csvImportUrl = "http://quakemap.org/index.php/export_reports/index/csv/";

// Reads the bad CSV location, fixes it and writes it to the good CSV location
quakemap.fixCSV = function(){
	//new converter instance	
};

router.get('/refresh', function(req, res){
			var csvConverter=new Converter();
			//read from file
			fs.createReadStream(quakemap.badCSV).pipe(csvConverter);

			//end_parsed will be emitted once parsing finished
			csvConverter.on("end_parsed",function(jsonObj){
				for(var i=0, len=jsonObj.length; i<len; i++){
					var report = jsonObj[i];
					report["INCIDENT LINK"] = "http://quakemap.org/reports/view/" + report[""];
				}
				//res.send(JSON.stringify(jsonObj, null, '\t'));
			    json2csv({ data: jsonObj, fields : quakemap.csvFields, fieldNames: quakemap.csvOutputFields}, function(err, csv) {
					  	fs.writeFile(quakemap.goodCSV, csv, function(err) {
			    			res.send("Data refreshed successfully");
						});				  
				});
			});
});

	//  request('http://quakemap.org/index.php/export_reports/index/csv/', function (error, response, body) {
				
	//       if (!error && response.statusCode == 200) {
	//       	res.send("Worked");
	//       }
	//       else {
	//       	res.send(error);
	//       }
	// //      	res.send(body);
	// //  //    	console.log("Got data from the server");
	// //  //    	//update file
	// //  //    	fs.writeFile(quakemap.badCSV, body, function(err) {
	// //  //    		console.log("Wrote to bad CSV");
 // //  //   			quakemap.fixCSV();
 // //  //   			console.log("Fixed bad csv");
	// // 	// 	});
	// // 	 }
	//  });


router.get('/csv-fixed', function(req, res, next){
	res.sendFile(quakemap.goodCSV);
});


// router.get('/wget', function(req, res){
	
// 	download.on('error', function(err) {
// 	    console.log(err);
// 	});
// 	download.on('end', function(output) {
// 	    res.send("Downloaded!");
// 	});
// 	download.on('progress', function(progress) {
// 	    // code to show progress bar
// 	});
// });

router.get('/', function(req, res, next) {
   res.render('index', { title: 'Quakemap' });
});


router.get('/reports', function(req, res){
	fs.readFile(quakemap.goodCSV, 'utf8', function(err, data){
		var csvConverter=new Converter();
			//read from file
		fs.createReadStream(quakemap.goodCSV).pipe(csvConverter);
		//end_parsed will be emitted once parsing finished
		csvConverter.on("end_parsed",function(jsonObj){

			for(var i=0, len=jsonObj.length; i<len; i++){
					var report = jsonObj[i];
					report["DESCRIPTION"] = report["DESCRIPTION"].replace(/&lt;/g, "<")
																.replace(/&gt;/g, ">")
																.replace(/&quot;/g,"'")
																.replace(/\\n/g, "<br/>")
																.replace(/\\t/g, "&nbsp;&nbsp;");
				//	report["INCIDENT DESCRIPTION"] = report["INCIDENT DESCRIPTION"].replace("Facebook", 'Twitter');
					//Add the unique values to the filters
					for(filter in quakemap.filters) {
						if(quakemap.filters[filter].choices.indexOf(report[filter])==-1){
							quakemap.filters[filter].choices.push(report[filter]);		 
						}
					}
			}

			//Loop through filters
			for(var field in req.query){
				if(quakemap.csvOutputFields.indexOf(field) !== -1 && 
					req.query[field]!=quakemap.filterHelpText){

					quakemap.filters[field].selected = req.query[field];
					//filter the json data
					jsonObj = jsonObj.filter(function(report) {
						return report[field] == req.query[field];
					});
				}
			}
			//res.send(filters);
			res.render('reports', {title: "Quakemap Printable Reports", reports: jsonObj, filters: quakemap.filters});		
		});	
	});
});

module.exports = router;