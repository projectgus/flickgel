'use strict';

/* Controllers */

function flickrCtrl($scope, $resource, $q) {

    function flickr_api_resource(args) {
        args.api_key = API_KEY;
        args.format = "json",
        args.jsoncallback = "JSON_CALLBACK"
        return $resource('http://api.flickr.com/services/rest/',
                         args,
                         {get:{method:'JSONP'}});
    }

    var res_findByUsername = flickr_api_resource({method:"flickr.people.findByUsername"});
    var res_getPersonInfo = flickr_api_resource({method:"flickr.people.getInfo"});
    var res_searchPhotos = flickr_api_resource({method:"flickr.photos.search", per_page:10});
    var res_getSizes = flickr_api_resource({method:"flickr.photos.getSizes"});

    $scope.search = {tags:"makehackvoid"} // searchPhotos arguments, bound to form fields in the view
    $scope.size = "Medium"; // chosen size to show

    $scope.person_info_promises = {} // lookup table from userid to promise person info

    var getPersonInfo = function(userid) {
        /* Return a promise for personinfo for a particular user id.

         Returns a promises because personinfo is cached.*/
        var val = $scope.person_info_promises[userid];
        if(val) {
            return val;
        }
        var deferred = $q.defer();
        res_getPersonInfo.get({user_id: userid}, deferred.resolve);
        $scope.person_info_promises[userid] = deferred.promise;
        return deferred.promise;
    }

    var getSizes = function(photo, callback) {
        /* This function doesn't return a promise because we're not caching anything so we can
           just use the normal resource callback, with the photo for context.
        */
        return res_getSizes.get({photo_id:photo.id}, function(data) {
            if(callback)
                callback(data, photo);
        });
    }

    $scope.getSize = function(photo) {
        /* Return the currently selected size for a given photo, as chosen by $scope.Size */
        var sizes;
        try {
            sizes = photo.sizes.sizes.size; // array of sizes, deeply nested in flickr api data
        } catch(e) {
            return null;
        }
        for(var j = 0; j < sizes.length; j++) {
            console.log(sizes[j].label);
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
                getPersonInfo(photo.owner).then(function(result) {
                    photo.username = result.person.username._content;
                });
            }
            for(var i=0; i<$scope.photos.length; i++) {
                var photo = $scope.photos[i];
                bind_username_promise(photo);
                photo.sizes = getSizes(photo);
                console.log(photo.sizes);
            }
        });
    }
}
