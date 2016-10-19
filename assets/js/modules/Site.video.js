//

/**
 * Site.video.js
 *
 * This module contains functionality for loading, displaying and
 * controlling HTML5 and embedded video components
 *
*/

// Check if base namespace is defined so it isn't overwritten
var Site = Site || {};

// Create child namespace
Site.video = (function ($) {
    "use strict";

  ///////////////
  // Variables //
  ///////////////

    var selVideoOverlay = "[data-video-overlay=component]",
        selVideoOverlayContainer = "[data-video-overlay=container]",
        selVideoOverlayClose = "[data-video-overlay=close]",

        selVideoAutoplayer = "[data-video-autoplay=container], .cp_ArtSec__body video",

        selCarouselAutoplayerVideo = "video[data-src]",

  //////////////////
  // Constructors //
  //////////////////

        /**
         * Creates an VideoOverlay object
         *
         * This controls a component where an image is clicked and an embedded video is loaded
         * in top of it in an overlay. The overlay can then be closed, removing the video
         * from the DOM
         *
         * @constructor
         */
        VideoOverlay = function (elem) {

          var $thisVideoOverlay = $(elem),
              $thisVideoOverlayContainer = $thisVideoOverlay.find(selVideoOverlayContainer).eq(0),
              videoURL = $thisVideoOverlay.data('video-url'),
              $contentScaffold,

          /**
           * Open an iframe containing the video as an overlay
           * @function
           */
          openOverlay = function () {

            if(!$thisVideoOverlay.hasClass('videoLoaded')) {

              // If the video source is YouTube, append a parameter to the URL to use the YouTube API
              if(videoURL.indexOf('youtube') > -1) {
                if(videoURL.indexOf('?') > -1 && videoURL.indexOf('enablejsapi=1') === -1) {
                  videoURL = videoURL + '&enablejsapi=1';
                } else {
                  videoURL = videoURL + '?enablejsapi=1';
                }
              }
              // If the video source is Vimeo, append a parameter to the URL to use the Vimeo API
              // CURRENTLY NOT USED AS THE VIMEO API IS HELLA COMPLICATED
              // AND WE HAVEN'T NEEDED TO ON ANY PROJECTS
              //
              // else if (videoURL.indexOf('vimeo') > -1) {
              //   if(videoURL.indexOf('?') > -1 && videoURL.indexOf('api=1') === -1) {
              //     videoURL = videoURL + '&api=1';
              //   } else {
              //     videoURL = videoURL + '?api=1';
              //   }
              // }

              $contentScaffold = $('<iframe class="cp_VideoOverlay__iframe"></iframe>');
              $contentScaffold.attr('src',videoURL).attr('width',600).attr('height',400);

              //Site.utils.cl($contentScaffold);
              $thisVideoOverlayContainer.append($contentScaffold);

              Site.analytics.trackPageEvent("Video Overlay","opened");
            }

            $thisVideoOverlay.addClass('videoDisplayed').closest('[data-carousel=component]').addClass('inVideoMode');
            Site.analytics.trackPageEvent('Video Overlay', 'Open');
            $.publish('video/open');
          },

           /**
           * Open an iframe containing the video as an overlay
           * @function
           */
          closeOverlay = function () {
            // Currently closing the video overlay removes the video iframe to prevent the video playing on in the background.
            // If time allows it would be good to refine this a bit using the YouTube/Vimeo APIs to pause the video instead.
            $thisVideoOverlay.removeClass('videoDisplayed').closest('[data-carousel=component]').removeClass('inVideoMode');
            $thisVideoOverlayContainer.find('iframe').remove();

            Site.analytics.trackPageEvent("Video Overlay","closed");
          },

          /**
           * Bind custom message events for this object
           * @function
           */
          bindCustomMessageEvents = function () {
            $thisVideoOverlay.on('openVideoOverlay', function (e) {
              e.preventDefault();
              openOverlay();
            });

            $thisVideoOverlay.on('closeVideoOverlay', function (e) {
              e.preventDefault();
              closeOverlay();
            });
          },

          /**
           * Subscribe object to Global Messages
           * @function
           */
          subscribeToEvents = function () {

          };

          /**
           * Initialise this object
           * @function
           */
          this.init = function () {
            bindCustomMessageEvents();
            subscribeToEvents();
          };
        },

        /**
         * Creates an VideoOverlayManager object to control VideoOverlay objects.
         * What this current does specifically is reset any Video Overlays if they
         * are in a component that is hidden (e.g. a carousel or other showcase)
         * e.g. The client showcases on the Good 2016 website
         * @constructor
         */
        VideoOverlayManager = function () {

          var

          /**
           * Reset all video overlays within a DOM element
           * @function
           * @parameter elems (Object)
           */
          resetVideoOverlay = function (elem) {
            var $videoOverlays = $(elem).find(selVideoOverlay);
            $videoOverlays.each(function () {
              $(this).trigger('closeVideoOverlay');
            });
          },

          /**
           * Subscribe object to Global Messages
           * @function
           */
          subscribeToEvents = function () {
            // On a content change, the newly-added elements are passed as parameters to a function
            // that finds any smartImages and initialises controlling objects for each
            $.subscribe('content/hidden', function (topic,data) { resetVideoOverlay(data); });
          };

          /**
           * Initialise this object
           * @function
           */
          this.init = function () {
            subscribeToEvents();
          };
        },

        /**
         * Creates an VideoAutoplayer object
         * @constructor
         */
        VideoAutoplayer = function (elem) {
          var $thisVideo = $(elem),
              isPlaying = false,

          /**
           * Check if the video is in view and if it is start it playing
           * @function
           */
          playVideoIfInView = function () {
            if(Site.utils.isElementInView($thisVideo)) {
              //Site.utils.cl("play video");
              isPlaying = true;
              $thisVideo.get(0).play();
            }
          },

          /**
           * Bind custom message events for this object
           * @function
           */
          bindCustomMessageEvents = function () {
            $thisVideo.on('play', function (e) {
              e.preventDefault();
              playVideoIfInView();
            });
          },

          /**
           * Subscribe object to Global Messages
           * @function
           */
          subscribeToEvents = function () {
            // On page scroll...
            $.subscribe('page/scroll', function () {
              // If video has not yet been set to play, trigger the play custom event
              if(!isPlaying) {
                $(this).trigger('play');
              }
            } , $thisVideo);
          };

          /**
           * Initialise this object
           * @function
           */
          this.init = function () {
            subscribeToEvents();
            bindCustomMessageEvents();
          };
        },

        /**
         * Creates an CarouselSlideAutoplayVideoManager object to manage the display and
         * playing of autoplay videos in hidden carousel slides
         * @constructor
         */
        CarouselSlideAutoplayVideoManager = function () {
          var

          initialiseVideo = function (content) {
            var $videos = $(content).find(selCarouselAutoplayerVideo);

            // For each video, get the video path and add it as a 'src' attribute to the video tag
            $videos.each(function () {
              var $thisVideo = $(this),
                  videoPath = $(this).data('src'),
                  posterPath = $(this).data('poster');

              $thisVideo.attr('src', videoPath).attr('poster', posterPath);
            });
          },

          /**
           * Subscribe object to Global Messages
           * @function
           */
          subscribeToEvents = function () {
            $.subscribe('content/displayed', function (topic,data) { initialiseVideo(data); });
          };

          /**
           * Initialise this object
           * @function
           */
          this.init = function () {
            subscribeToEvents();
          };
        },

  ///////////////
  // Functions //
  ///////////////

        /**
         * Create delegate event listeners for this module
         * @function
         */
        delegateEvents = function () {
          Site.events.delegate('click', selVideoOverlay, 'openVideoOverlay');
          Site.events.delegate('click', selVideoOverlayClose, 'closeVideoOverlay');
        },

        /**
         * Initialise a new Object for an element added after the DOM is ready
         * @function
         */
        //  createVideoOverlay = function (elem) {
        //    var newVideoOverlay = new VideoOverlay(elem);
        //     newVideoOverlay.init();
        //  },

        /**
         * init function for this module
         * @function
         */
        init = function () {
          //Site.utils.cl("Site.video initialised");

          // Initialise Objects objects based on DOM objects
          $(selVideoOverlay).each(function () {
            var thisVideoOverlay = new VideoOverlay(this);
            thisVideoOverlay.init();
          });

          $(selVideoAutoplayer).each(function () {
            var thisVideoAutoplayer = new VideoAutoplayer(this);
            thisVideoAutoplayer.init();
          });

          // Create a new SmartImageManager object
          var thisVideoOverlayManager = new VideoOverlayManager();
          thisVideoOverlayManager.init();

          // Create a new SmartImageManager object
          var thisCarouselSlideAutoplayVideoManager = new CarouselSlideAutoplayVideoManager();
          thisCarouselSlideAutoplayVideoManager.init();


          // Add delegate event listeners for this module
          delegateEvents();
        };

    // Return Public API
    return {
      init: init
    };

}(jQuery));
