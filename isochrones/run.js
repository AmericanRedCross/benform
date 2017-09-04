var fs = require('fs');
var flow = require('flow');
var path = require('path');
var request = require('request');
var moment = require("moment");

var API_KEY = "mapzen-ADD YOUR KEY HERE";
var mode = 'auto'
// var mode = 'multimodal'

var allPoints = []
var isochroneFc = { type: 'FeatureCollection', features: [] };

function pullPoints(data, cb){
  var fc = JSON.parse(data);
  for (var i = 0; i < fc.features.length; i++) {
    if(fc.features[i].geometry){
      allPoints.push({
        "lat":fc.features[i].geometry.coordinates[1],
        "lon":fc.features[i].geometry.coordinates[0]
      })
    }
    if(i+1 === fc.features.length) { cb(null); }
  }
}

var fetchIsochrone = function(pointIndex, cb) {
  var url = 'https://matrix.mapzen.com/isochrone?json=';
  var json = {
    locations: [{
      "lat": allPoints[pointIndex].lat.toFixed(5),
      "lon": allPoints[pointIndex].lon.toFixed(5)
    }],
    costing: mode,
    contours: [{"time":15},{"time":30},{"time":45},{"time":60}],
    polygons: true,
    // denoise: 0.5,
    // generalize: 150
  };
  url += escape(JSON.stringify(json));
  url+= '&api_key='+ API_KEY;
  request({
    method: 'GET',
    uri: url
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var jsonResponse = JSON.parse(body);
      console.log(pointIndex)
      for(var i=0; i<jsonResponse.features.length; i++){
        isochroneFc.features.push(jsonResponse.features[i])
      }
      cb();
    } else {
      console.log("failed getting isochrone")
      console.log(url)
      cb();
    }

  });

}


var throttleIsochrone = function(cb){
  var targetCount = 0;
  var counter = 0;
  targetCount = allPoints.length
  console.log(allPoints.length)
  for (var i=0;i<targetCount;i++) {
     (function(ind) {
         setTimeout(function(){
           // # # # throttle process to limit the speed of calls to download files from the server
           fetchIsochrone(ind, function(){
             counter ++;
             if(counter === targetCount){ cb(null); }
           })
         }, 500 + (3000 * ind));
     })(i);
  }
}


flow.exec(
  function() {
    fs.readFile('../data/ace.geojson', 'utf8', this.MULTI('ace'))
    fs.readFile('../data/cvs.geojson', 'utf8', this.MULTI('cvs'))
    fs.readFile('../data/mc.geojson', 'utf8', this.MULTI('mc'))
    fs.readFile('../data/walmart.geojson', 'utf8', this.MULTI('walmart'))
  }
  ,function(data) {
    pullPoints(data.ace["1"], this.MULTI())
    pullPoints(data.cvs["1"], this.MULTI())
    pullPoints(data.mc["1"], this.MULTI())
    pullPoints(data.walmart["1"], this.MULTI())
  }
  ,function() {
    throttleIsochrone(function(){
      var timestamp = moment().format('YYYYMMDD-HHmmss');
      var filePath = path.join(__dirname,"output",mode + timestamp + ".geojson");
      fs.writeFile(filePath, JSON.stringify(isochroneFc));
    });
  }
)
