var express = require('express');
var router = express.Router();
var tabletop = require('tabletop');
var json2csv = require('json2csv');
var request = require('request');

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

				readableIncidents.push(incident);

	    	}

	    	json2csv({ data: readableIncidents, fields: quakemap.fields}, function(err, csv) {
			  if (err) console.log(err);
			  res.send(csv);
			});
	    }
	});

}); 

router.get('/', function(req, res, next) {
   res.render('index', { title: 'Quakemap' });
});

module.exports = router;
