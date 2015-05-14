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
				incident.incidentactive = incident.incidentactive?"YES":"NO";
				incident.incidentverified = incident.incidentverified?"YES":"NO";

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
"INCIDENT TITLE",
"INCIDENT DATE",
"DESCRIPTION",
"CATEGORY",
"LATITUDE",
"LONGITUDE",
"Phone Number",
"Most Affected District",
"Location Accuracy - the report is from in this",
"FIRST NAME",
"LAST NAME",
"EMAIL",
"APPROVED",
"VERIFIED",
"ACTIONABLE",
"ACTION TAKEN",
"ACTION SUMMARY",
"COMMENT"
];

quakemap.csvOutputFields = JSON.parse(JSON.stringify(quakemap.csvFields));
quakemap.csvOutputFields[0] = "ID";
quakemap.badCSV = path.join(__dirname, '../public', 'quakemap-data.csv'); 
quakemap.goodCSV = path.join(__dirname, '../public', 'quakemap-data-cleaned.csv');


// Reads the bad CSV location, fixes it and writes it to the good CSV location
quakemap.fixCSV = function(){
	//new converter instance
	var csvConverter=new Converter();

	//end_parsed will be emitted once parsing finished
	csvConverter.on("end_parsed",function(jsonObj){
	    json2csv({ data: jsonObj, fields : quakemap.csvFields, fieldNames: quakemap.csvOutputFields}, function(err, csv) {
						  if (err){
						  	return console.log(err);
						  } else {
						  	fs.writeFile(quakemap.goodCSV, body, function(err) {
				    			if(err) {
				        			console.log(err);
				    			}
							});
							res.sendFile("Data refreshed");
						  }
				});
	});

	//read from file
	fs.createReadStream(quakemap.badCSV).pipe(csvConverter);
}

router.get('/refresh', function(req, res){
	quakemap.fixCSV();
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
});

router.get('/csv-fixed', function(req, res, next){
	res.sendFile(quakemap.goodCSV);
});

router.get('/', function(req, res, next) {
   res.render('index', { title: 'Quakemap' });
});

module.exports = router;
