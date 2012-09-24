'use strict';

/* Directives

Copyright (c) 2012 Angus Gratton. Licensed under the New BSD License.
*/

angular.module('flickgel.directives', []).
/*
  Enable angular.js binding for Dan Grossman's bootstrap-daterangepicker
   Binding is the name of a callback taking arguments (start end)
*/
directive('ngDaterangepicker', function() {
      return function postLink(scope, element, attrs) {
          $(element).daterangepicker({format:"yyyy-MM-dd"}, function(start, end) {
              var callback = scope.$eval(attrs.ngDaterangepicker);
              scope.$apply(callback(start,end));
          });
      };
});

