L.Mapzen.apiKey = 'mapzen-C3iQrQn';
var map = L.Mapzen.map('map', {
  tangramOptions: {
    scene: L.Mapzen.BasemapStyles.Refill
  }
});
map.setView([29.7630556, -95.3630556], 8);

var locator = L.Mapzen.locator();
locator.setPosition('bottomright');
locator.addTo(map);

var attrib = new L.Control.Attribution({
  position: 'bottomleft'
});
attrib.addAttribution('Map Data &copy; <a href="http://redcross.org">Red Cross</a>');
map.addControl(attrib);

//cvspoints
$.getJSON("data/cvs.geojson", function(data){
    var cvsPoints = L.geoJson(data);
    cvsPoints.addTo(map);
    controlLayers.addOverlay(cvsPoints, "cvs Points");
});
