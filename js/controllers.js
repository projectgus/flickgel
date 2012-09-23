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

    var findByUsername = cachedResource($q, flickr_api_resource({method:"flickr.people.findByUsername"}).get,
                                        "username");
    var searchPhotos = flickr_api_resource({method:"flickr.photos.search", per_page:10});
    var getPersonInfo = cachedResource($q, flickr_api_resource({method:"flickr.people.getInfo"}).get,
                                           "user_id");

    var getSizes = cachedResource($q, flickr_api_resource({method:"flickr.photos.getSizes"}).get,
                                      "photo_id");

    $scope.search = { tags:"makehackvoid",  // searchPhotos arguments, bound to form fields in the view
                      sort:"date-posted-desc",
                    };
    $scope.size = "Small"; // chosen size to show
    $scope.format = "HTML";
    $scope.username = "";

    $scope.find_user = function() {
        $scope.search.user_id = null;
        var re_user_id = /^[\d]+@[\dA-Z]+$/;
        if($scope.username.search(re_user_id) != -1) {
            console.log("match!");
            $scope.search.user_id = $scope.username;
        }
        else {
            $scope.username_loading = true;
            findByUsername({username:$scope.username}).then(function(result) {
                $scope.username_loading = false;
                try {
                    $scope.search.user_id = result.user.id;
                } catch(e) { }
            });
        }
    }

    $scope.run_search = function() {
        searchPhotos.get($scope.search, function(data) {
            console.log(data);
            $scope.photos = data.photos.photo;
            // attach promises to define photo owner's username & size information
            function bind_username_promise(photo) {
                getPersonInfo({user_id:photo.owner}).then(function(result) {
                    photo.username = result.person.username._content;
                });
            }
            function bind_size_promise(photo) {
                getSizes({photo_id:photo.id}).then(function(result) {
                    var src = result.sizes.size; // api has an array nested in it
                    photo.sizes = {}; // make into an associative array
                    for(var j = 0; j < src.length; j++) {
                        photo.sizes[src[j].label] = src[j];
                    }
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
