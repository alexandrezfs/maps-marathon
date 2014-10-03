$.fn.marathon = function (options) {

    var options = options;
    var jqueryElement = this;
    var divElement = jqueryElement.attr('id');
    var map = null;
    var directions = {};

    /**
     * Initialize map
     */
    google.maps.event.addDomListener(window, 'load', function () {
        initMap(divElement, options);
    });

    /**
     * Map initializer
     */
    function initMap(divElement, options) {

        var opts = options.opts;
        var places = options.places;
        var routes = options.routes;
        var distanceInterval = options.distanceInterval;

        map = new google.maps.Map(document.getElementById(divElement), opts);

        var bounds = new google.maps.LatLngBounds();

        for (var r = 0; r < routes.length; ++r) {

            bounds.extend(routes[r].request.destination);
            routes[r].rendering.routeId = routes[r].slug;
            routes[r].rendering.dist = distanceInterval;
            routes[r].rendering.step = 0; //each time a tweet is sent, we are gonna ++ it

            requestRoute(routes[r], map);
        }

        map.fitBounds(bounds);

        setupPlacesMarker(places);
    }

    /**
     * Places on the map
     * @param places
     */
    function setupPlacesMarker(places) {

        for (var m = 0; m < places.length; m++) {
            places[m].map = map;
            var marker = new google.maps.Marker(places[m]);

            addInfoWindow(marker, marker.contentWindowHtml);
        }
    }

    /**
     * Add an info window to a marker
     * @param marker
     * @param content
     */
    function addInfoWindow(marker, content) {
        var infoWindow = new google.maps.InfoWindow({
            content: content
        });

        google.maps.event.addListener(marker, 'click', function () {
            infoWindow.open(map, marker);
            console.log("open !");
        });
    }

    /**
     * Take a route and move the marker forward depending on distance
     * @param routeId
     */
    function stepRun(routeId, action) {

        if (directions[routeId]) {

            var direction = directions[routeId];
            var markers = direction.sets[direction.renderer.dist];

            var nextStepIndex = -1;

            if (action == "forward") {
                nextStepIndex = direction.renderer.step;
                directions[routeId].renderer.step++;
            }
            else if (action == "before") {
                nextStepIndex = direction.renderer.step;
                directions[routeId].renderer.step--;
            }

            var values = {
                direction: direction,
                markers: markers,
                nextStepMarker: markers[nextStepIndex],
                marker: markers[direction.renderer.step],
                action: action
            };

            if (values.nextStepMarker) { //set unvisible the previous marker
                values.nextStepMarker.setVisible(false);
            }

            if (values.marker) { //A marker is present.
                values.marker.setVisible(true);
            }
            else { //No more marker... Let's reset steps
                if (action == "forward") {
                    values.direction.renderer.step = 0;
                }
                else if (action == "before") {
                    values.direction.renderer.step = markers.length - 1;
                }
            }

            return values;
        }

        return false;

    }

    /**
     * Display itinerary with a given route
     * @param route
     * @param map
     */
    function requestRoute(route, map) {
        if (!window.gDirSVC) {
            window.gDirSVC = new google.maps.DirectionsService();
        }

        var renderer = new google.maps.DirectionsRenderer(route.rendering);

        renderer.setMap(map);
        renderer.setOptions({preserveViewport: true})

        google.maps.event.addListener(renderer, 'directions_changed', function () {

            if (directions[this.routeId]) {
                //remove markers and reset step to 0
                for (var k in directions[this.routeId].sets) {
                    for (var m = 0; m < directions[this.routeId].sets[k].length; ++m) {
                        directions[this.routeId].sets[k][m].setMap(null);
                    }
                }
            }

            directions[this.routeId] = {renderer: this, sets: {}};
            directions[this.routeId].renderer.step = 0;

            initializeMarkers(this.routeId);

        });

        window.gDirSVC.route(route.request, function (response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                renderer.setDirections(response);
            }
        });
    }

    /**
     * Initialize every markers
     * @param routeId
     */
    function initializeMarkers(routeId) {

        var direction = directions[routeId],
            renderer = direction.renderer,
            dist = renderer.dist,
            marker = renderer.marker,
            map = renderer.getMap(),
            dirs = direction.renderer.getDirections();

        marker.map = map;

        for (var k in direction.sets) {
            var set = directions[ID].sets[k];
            set.visible = !!(k === dist);

            for (var m = 0; m < set.length; ++m) {
                set[m].setMap((set.visible) ? map : null);
            }
        }

        if (!direction.sets[dist]) {
            if (dirs.routes.length) {
                var route = dirs.routes[0];
                var az = 0;

                for (var i = 0; i < route.legs.length; ++i) {
                    if (route.legs[i].distance) {
                        az += route.legs[i].distance.value;
                    }
                }

                dist = Math.max(dist, Math.round(az / 100));
                direction.sets[dist] = gMilestone(route, dist, marker);
            }
        }
    }

    /**
     * Get markers along a google.maps.DirectionsRoute + Set it on the map
     * By default markers are not visible.
     *
     * @param route object google.maps.DirectionsRoute
     * @param dist  int    interval for milestones in meters
     * @param opts  object google.maps.MarkerOptions
     * @return array Array populated with created google.maps.Marker-objects
     **/
    function gMilestone(route, dist, opts) {

        var markers = [],
            geo = google.maps.geometry.spherical,
            path = route.overview_path,
            point = path[0],
            distance = 0,
            leg,
            overflow,
            pos;

        var marker;

        for (var p = 1; p < path.length; ++p) {
            var d1 = distance + 0;
            leg = Math.round(geo.computeDistanceBetween(point, path[p]));
            distance += leg;
            overflow = dist - (d1 % dist);

            if (distance >= dist && leg >= overflow) {
                if (overflow && leg >= overflow) {
                    pos = geo.computeOffset(point, overflow, geo.computeHeading(point, path[p]));
                    opts.position = pos;
                    marker = new google.maps.Marker(opts);
                    marker.setVisible(false);
                    markers.push(marker);
                    distance -= dist;
                }

                while (distance >= dist) {
                    pos = geo.computeOffset(point, dist + overflow, geo.computeHeading(point, path[p]));
                    opts.position = pos;
                    marker = new google.maps.Marker(opts);
                    marker.setVisible(false);
                    markers.push(marker);
                    distance -= dist;
                }
            }
            point = path[p]
        }

        return markers;
    }

    /**
     * @type {{run: Function}}
     */
    var marathonMethods = {

        /**
         * @param routeId
         * @param callback
         */
        run: function (routeId, callback) {

            var response = stepRun(routeId, "forward");

            callback(response);
        },

        /**
         * @param routeId
         * @param callback
         */
        unrun: function (routeId, callback) {

            var response = stepRun(routeId, "before");

            callback(response);
        },

        /**
         * @returns {{}}
         */
        getMap: function () {
            return map;
        },

        /**
         * @returns {*}
         */
        getOptions: function () {
            return options;
        },

        /**
         * @returns {$.fn}
         */
        getUiElement: function () {
            return jqueryElement;
        }
    };

    return marathonMethods;
};