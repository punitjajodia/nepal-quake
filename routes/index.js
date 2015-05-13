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

router.get('/autorefresh', function(req, res, next){
	console.log(quakemap.readableIncidentMode(1));
	
	request('http://quakemap.org/api?task=incidents', function (error, response, body) {
	    if (!error && response.statusCode == 200) {
	    	var body = JSON.parse(body);
	   
	    	var incidents = body.payload.incidents;
	    	var columns = [];
	    	var rows = [];

			 for(var i=0; i<incidents.length; i++){
			 	var incident = incidents[i].incident;
			 	columns.push(incident.incidentid);
			 	columns.push(incident.incidenttitle);
				columns.push(incident.incidentdescription);
				columns.push(incident.incidentdate);
				columns.push(quakemap.readableIncidentMode(incident.incidentmode));
				columns.push(incident.incidentactive?"YES":"NO");
				columns.push(incident.incidentverified?"YES":"NO");
				columns.push(incident.locationname);
				columns.push(incident.locationlatitude);
				columns.push(incident.locationlongitude);
				
				rows.push(columns.map(function(column){
					return '"' + column + '"';
				}).join(","));
				columns = [];
	    	}
	    	res.send(rows.join("<br/>"));
	    }
	});

}); 

router.get('/', function(req, res, next) {
   res.render('index', { title: 'Quakemap' });
});

module.exports = router;
