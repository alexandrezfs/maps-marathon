maps-marathon
=============

[Javascript] Jquery library that lets you draw itineraries on a Google Maps and set a custom marker that can progress step by step, for example a runner for a marathon.

![alt tag](https://raw.githubusercontent.com/alexzhxin/maps-marathon/master/maps-marathon.png)

##Installation

1. Include google maps API V3
2. Include Jquery > 1.7
3. Include marathon.query.js

Example :

```
<script type="text/javascript" src="http://maps.google.com/maps/api/js?libraries=geometry&sensor=false"></script>
<script src="//code.jquery.com/jquery-1.11.0.min.js"></script>
<script type="text/javascript" src="marathon.jquery.js"></script>
```

##### Installation by Bower
```
bower install maps-marathon
```

##Initialization

```
var marathon = $("#your_div_element").marathon(options);
```

#####Options
- distanceInterval : The step length, in meters
- opts : The zoom, map type and center coordinates
- places : Array of custom markers you want to add to the map
- routes : Set of itineraries where your "steps runner" will be set up

#####Full example :
```
var options = {
    distanceInterval: 100,
    opts: {
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        center: new google.maps.LatLng(34.691682, 135.820572)
    },
    places: [
        {
            position: new google.maps.LatLng(34.692127, 135.861406),
            title: 'Hello World!',
            contentWindowHtml: 'test description 1'
        },
        {
            position: new google.maps.LatLng(34.691691, 135.861400),
            title: 'Hello World 2!',
            contentWindowHtml: 'test description 2'
        }
    ],
    routes: [
        {
            label: 'Asics 1',
            slug: 'asics1', //The slug is the route ID
            request: {
                origin: new google.maps.LatLng(34.6892735, 135.8117425),
                destination: new google.maps.LatLng(34.6953515, 135.8268809),
                travelMode: google.maps.DirectionsTravelMode.WALKING
            },
            rendering: {
                marker: {
                    icon: $("#runnerIcon").val()
                },
                draggable: true
            }
        },
        {
            label: 'Asics 2',
            slug: 'asics2', //The slug is the route ID
            request: {
                origin: new google.maps.LatLng(34.6900057, 135.8188343),
                destination: new google.maps.LatLng(34.6875179, 135.8352923),
                travelMode: google.maps.DirectionsTravelMode.WALKING
            },
            rendering: {
                marker: {
                    icon: $("#runnerIcon").val()
                },
                draggable: true
            }
        }
    ]
};
```

##Usage

#####Call the run method on a given route to make your marker progress
```
marathon.run(routeId, callback);
```

#####Example :
```
var marathon = $("#your_div_element").marathon(options);

marathon.run("asics1", function() {

    console.log("I'm running !");    

});
```
