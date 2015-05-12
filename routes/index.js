var express = require('express');
var router = express.Router();
var tabletop = require('tabletop');
var json2csv = require('json2csv');

router.get('/csv', function(req, res, next) {
	tabletop.init( { key: '1FlFzSqdaQp9lEv4rALC6dND0JxJoDBFAyNE5K-1zdQc',
                   callback: function(incidents, tabletop) { 

						json2csv({ data: incidents, fields : ['incidentid', 'title', 'description', 'locationname', 'latitude', 'longitude', 'contactnumber'] }, function(err, csv) {
						  if (err) console.log(err);
						  	res.set('Content-Type', 'text/csv');
							res.send(csv);
						});

                    },
                   simpleSheet: true } )
  // res.render('index', { title: 'Express' });
});

router.get('/', function(req, res, next) {
   res.render('index', { title: 'Quakemap' });
});

module.exports = router;
