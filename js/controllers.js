'use strict';

/* Controllers */

/* A cached resource function returns a promise which either resolves to a
 * pre-fetch resource, or to the resource once it is loaded.
 *
 *  Resources are keyed based on field named key_field.
 */
function cachedResource($q, resource_function, key_field) {
    var cache = {};
    return function(args) {
        var key = args[key_field];
        if(!cache[key]) {
            var deferred = $q.defer();
            resource_function(args, deferred.resolve);
            cache[key] = deferred.promise;
        }
        return cache[key];
    }
}

function flickrCtrl($scope, $resource, $q) {

    function flickr_api_resource(args) {
        args.api_key = API_KEY;
        args.format = "json",
        args.jsoncallback = "JSON_CALLBACK"
        return $resource('http://api.flickr.com/services/rest/',
                         args,
                         {get:{method:'JSONP'}});
    }

    /*
    var res_findByUsername = cachedResource($q, flickr_api_resource.({method:"flickr.people.findByUsername"}).get,
                                            "username");
    */
    var res_searchPhotos = flickr_api_resource({method:"flickr.photos.search", per_page:10});
    var res_getPersonInfo = cachedResource($q, flickr_api_resource({method:"flickr.people.getInfo"}).get,
                                           "user_id");

    var res_getSizes = cachedResource($q, flickr_api_resource({method:"flickr.photos.getSizes"}).get,
                                      "photo_id");

    $scope.search = {tags:"makehackvoid"} // searchPhotos arguments, bound to form fields in the view
    $scope.size = "Medium"; // chosen size to show

    $scope.person_info_promises = {} // lookup table from userid to promise person info

    $scope.getSize = function(photo) {
        /* Return the currently selected size for a given photo, as chosen by $scope.Size */
        var sizes;
        try {
            sizes = photo.sizes.sizes.size; // array of sizes, deeply nested in flickr api data
        } catch(e) {
            return null;
        }
        for(var j = 0; j < sizes.length; j++) {
            if(sizes[j].label == $scope.size)
                return sizes[j];
        }
        return sizes.length ? sizes[0] : null;
    }

    $scope.run_search = function() {
        res_searchPhotos.get($scope.search, function(data) {
            $scope.photos = data.photos.photo;
            // attach promises to define photo owner's username & size information
            function bind_username_promise(photo) {
                res_getPersonInfo({user_id:photo.owner}).then(function(result) {
                    photo.username = result.person.username._content;
                });
            }
            function bind_size_promise(photo) {
                res_getSizes({photo_id:photo.id}).then(function(result) {
                    photo.sizes = result;
                });
            }
            for(var i=0; i<$scope.photos.length; i++) {
                var photo = $scope.photos[i];
                bind_username_promise(photo);
                bind_size_promise(photo);
            }
        });
    }
}
