'use strict';

/* Controllers */

function flickrCtrl($scope, $resource) {

    function flickr_api_resource(args) {
        args.api_key = API_KEY;
        args.format = "json",
        args.jsoncallback = "JSON_CALLBACK"
        return $resource('http://api.flickr.com/services/rest/',
                         args,
                         {get:{method:'JSONP'}});
    }

    var findByUsername = flickr_api_resource({method:"flickr.people.findByUsername"});
    var searchPhotos = flickr_api_resource({method:"flickr.photos.search"});

    $scope.resp = GetUsername.get({username: "angusgr"});
}
