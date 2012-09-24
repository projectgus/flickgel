'use strict';

/* Controllers */

function flickrCtrl($scope, $resource, $q) {

    function flickr_api_resource(args) {
        args.api_key = API_KEY;
        args.format = "json",
        args.jsoncallback = "JSON_CALLBACK"
        return $resource('http://api.flickr.com/services/rest/',
                         args,
                         {get:{method:'JSONP',cache:true}});
    }

    var findByUsername = flickr_api_resource({method:"flickr.people.findByUsername"}, {});
    var searchPhotos = flickr_api_resource({method:"flickr.photos.search", per_page:30}, {});
    var getPersonInfo = flickr_api_resource({method:"flickr.people.getInfo"}, {} ,true);
    var getSizes = flickr_api_resource({method:"flickr.photos.getSizes"}, {});

    $scope.search = { // searchPhotos arguments, bound to form fields in the view
                      sort:"date-posted-desc",
                    };
    $scope.size = "Small"; // chosen size to show
    $scope.format = "HTML";
    $scope.username = "";

    $scope.datechanged = function(start, end) {
        $scope.search.min_upload_date = Math.floor(start.getTime()/1000);
        $scope.search.max_upload_date = Math.floor(end.getTime()/1000);
    };

    $scope.find_user = function() {
        $scope.search.user_id = null;
        var re_user_id = /^[\d]+@[\dA-Z]+$/;
        if($scope.username.search(re_user_id) != -1) {
            console.log("match!");
            $scope.search.user_id = $scope.username;
        }
        else {
            $scope.username_loading = true;
            findByUsername.get({username:$scope.username}, function(result) {
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
                getPersonInfo.get({user_id:photo.owner}, function(result) {
                    photo.username = result.person.username._content;
                });
            }
            function bind_size_promise(photo) {
                getSizes.get({photo_id:photo.id}, function(result) {
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
