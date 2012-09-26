'use strict';

/* Controllers */

function flickrCtrl($scope, $resource, $q, $timeout) {

    function flickr_api_resource(args) {
        args.api_key = API_KEY;
        args.format = "json",
        args.jsoncallback = "JSON_CALLBACK"
        return $resource('http://api.flickr.com/services/rest/',
                         args,
                         {get:{method:'JSONP',cache:true}});
    }

    var findByUsername = flickr_api_resource({method:"flickr.people.findByUsername"}, {});
    var searchPhotos = flickr_api_resource({method:"flickr.photos.search",
                                            per_page:50,
                                            extras:"url_sq,url_t,url_s,url_q,url_m,url_n,url_z,url_c,url_l,url_o,owner_name",
                                           }, {});

    $scope.search = { // searchPhotos arguments, bound to form fields in the view
        sort:"date-posted-desc"
    };
    $scope.size = "s"; // default to size Small
    $scope.format = "HTML";
    $scope.username = "";
    $scope.message = null;

    $scope.datechanged = function(start, end) {
        $scope.search.min_upload_date = Math.floor(start.getTime()/1000);
        $scope.search.max_upload_date = Math.floor(end.getTime()/1000);
    };

    $scope.find_user = function() {
        delete $scope.search.user_id;
        var re_user_id = /^[\d]+@[\dA-Z]+$/;
        if($scope.username.search(re_user_id) != -1) {
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

    // Trigger find_user after 700ms if no further change event
    var last_trigger_find;
    $scope.trigger_find_user = function() {
        $scope.username_loading = true;
        $timeout.cancel(last_trigger_find);
        $timeout($scope.find_user, 700);
    }

    function fixup_photos(photos) {
        for(var i=0; i<photos.length;i++) {
            if(photos[i].ownername.search(" ") > -1) // replace any photos w/ invalid ownernames
                photos[i].url_owner = photos[i].owner;
            else
                photos[i].url_owner = photos[i].ownername;
        }
    }

    $scope.run_search = function() {
        $scope.message = "Searching...";
        $scope.search.page = 1;
        $scope.error = null;
        searchPhotos.get($scope.search, function(data) {
            $scope.message = null;
            if(!data.photos || data.stat == "fail") {
                $scope.error = "Error: " + data.message;
            } else {
                $scope.photos = data.photos.photo;
                if($scope.photos.length == 0) {
                    $scope.message = "No publicly accessible photos were found :(";
                }
                fixup_photos(data.photos.photo);
            }
        });
    }

    // Infinite scrolling
    $scope.scrolling = false;
    $scope.next_page = function() {
        if($scope.scrolling || !$scope.photos || $scope.photos.length == 0)
            return;
        $scope.scrolling = true;
        $scope.search.page += 1;
        searchPhotos.get($scope.search, function(data) {
            if(data.photos) {
                $scope.photos = $scope.photos.concat(data.photos.photo);
                fixup_photos(data.photos.photo);
                $scope.scrolling = false;
            }
        });
    }

    // bind page scroll event directly. not as elegant as using a directive, but this is a small app!
    $(document).scroll(function() {
        if($(document).scrollTop() > $(document).height() - $(window).height()*2) {
            $scope.$apply(function() {
                $scope.next_page();
            });
        }
    });

    $scope.get_size = function(photo) {
        return {
            url: photo["url_"+$scope.size],
            height: photo["height_"+$scope.size],
            width: photo["width_"+$scope.size],
        };
    }
}
