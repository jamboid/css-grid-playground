// Site namespace
//
// Base namespace for the Site framework
var Site = Site || {};

// Base init function that calls itself and then initialises the modules
Site.init = (function ($) {
    "use strict";

  ///////////////
  // Polyfills //
  ///////////////

  ////////////////////////
  // Initialise Modules //
  ////////////////////////

    // Modules object
    var Modules = {};

    /**
     * Initialise the modules used in this project
     * @function
     */
    Modules.init = function () {
      $(document).ready(function () {
        Site.utils.init();
        Site.events.init();
        Site.analytics.init();
        Site.layout.init();
        Site.navigation.init();
        Site.images.init();
        Site.media.init();
        Site.showhide.init();
        Site.carousel.init();
        Site.modal.init();
        Site.loading.init();
        Site.grid.init();
        Site.forms.init();
        Site.tabs.init();
        Site.maps.init();
        Site.backgroundvideo.init();
      });
    };

    // Automatically call Modules.init function
    return Modules.init();

}(jQuery));