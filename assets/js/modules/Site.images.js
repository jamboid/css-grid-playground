// Site.images.js

// Check if base namespace is defined so it isn't overwritten
var Site = Site || {};

// Create child namespace
Site.images = (function ($) {
  "use strict";

  ///////////////
  // Variables //
  ///////////////

  var defaults = { },
      smartImageSel = '[data-image-load]',

  //////////////////
  // Constructors //
  //////////////////

      /**
       * Creates a SmartImage object to manage a lazy-loaded image component
       * @constructor
       */
      SmartImage = function (elem) {

        var $thisSmartImage = $(elem),
            $placeholderImage = $thisSmartImage.find('> img').eq(0),
            loadingMethod = $thisSmartImage.data('image-load'),
            imageConfig = $thisSmartImage.data('image-config') || {},
            imageType = imageConfig.type || 'inline',
            imageReloader = imageConfig.reload || false,
            imageTargetSel = $thisSmartImage.data('image-target') || null,
            imageLoaded = false,
            imageToAdd = $('<img>'),

            /**
             * Display a pre-loaded lazy image, adding atrributes set on
             * the sprite container
             * @function
             * @parameter path (String)
             */
            displayImageInContainer = function (image) {
              var $thisImage = $(image),
                  imageAlt = $thisSmartImage.data('alt') || 'image';

              // Add 'loading' class to SmartImage container
              $thisSmartImage.addClass('ob_Image--loading');

              if(imageAlt.length > 0){
                $thisImage.attr('alt', imageAlt);
              }

              if($placeholderImage.length > 0) {
                $placeholderImage.attr('src', $thisImage.attr('src')).removeClass('placeholder').removeAttr('width').removeAttr('height');
              } else {

                if(imageTargetSel !== null){
                  $thisSmartImage.parent().find(imageTargetSel).eq(0).append($thisImage);
                } else {
                  $thisSmartImage.prepend($thisImage);
                }

                $placeholderImage = $thisImage;
              }

              $thisSmartImage.addClass('ob_Image--loaded');
              // Need to allow browser a moment to process the addition of the image before displaying it
              window.setTimeout(function () {
                $thisSmartImage.addClass('ob_Image--displayed');
                $.publish('content/update');
              }, 50);
              imageLoaded = true;
            },

            /**
             * Display a lazy-loading image as a CSS background image
             * @function
             * @parameter path (String)
             */
            displayImageAsBackground = function (path) {
              var smartImage = 'url(' + path + ')',
                  imageBackgroundPos = $thisSmartImage.data('position'),
                  imageBackgroundColor = $thisSmartImage.data('background-color');

              $thisSmartImage.addClass('ob_Image--loaded').css('background-image', smartImage).addClass(imageBackgroundPos).css('background-color', imageBackgroundColor) ;

              window.setTimeout(function () {
                $thisSmartImage.addClass('ob_Image--displayed');
                $.publish('content/update');
              }, 50);

              imageLoaded = true;
            },

            /**
             * Create and preload a new image based on a sprite src
             * then call a function once the image is loaded into memory
             * @function
             */
            getImageFile = function () {
              var thisImageData = 'src-' + Site.layout.getResponsiveSize(),
                  thisImageUrl = $thisSmartImage.data(thisImageData);

                if(thisImageUrl !== 'none'){
                  imageToAdd.attr('src',thisImageUrl);

                  if(imageType === 'inline') {

                    // The imagesLoaded function is called for image we want to load.
                    // The initial callback is the displayImageInContainer function to add the
                    // image to the page, or swap the image src with an existing placeholder.
                    // NOTE: This happens *immediately*. Making this the callback of the imagesLoaded function doesn't delay this.
                    $(imageToAdd).imagesLoaded(displayImageInContainer(imageToAdd))

                    // When the "done" event occurs...
                    .done(function() {
                      // We remove the "isLoading" class from the image.
                      // By default, this controls CSS for changing the <img> element's opacity from 0 to 1, with a CSS transition
                      $thisSmartImage.removeClass('ob_Image--loading');
                      // We send a Global message indicating a change in page layout
                      $.publish('image/loaded');
                      $.publish('layout/change');
                    });
                  } else if (imageType === 'background') {

                    // The imagesLoaded function is called for image we want to load.
                    // There is no initial callback because everything we want to do can wait
                    // until the image is fully downloaded.
                    $(imageToAdd).imagesLoaded()

                    // When the "done" event occurs...
                    .done(function() {
                      // Add the class that gives the container its layout
                      $thisSmartImage.addClass('ob_Image--flex');
                      // We call the function that adds the correct CSS to the the container
                      displayImageAsBackground(thisImageUrl)
                      // We send a Global message indicating a change in page layout
                      $.publish('image/loaded');
                      $.publish('layout/change');
                    });
                  }
                }
            },

            /**
             * Load and display a smart image - use this when being in view doesn't matter
             * @function
             */
            loadImage = function () {
              if(imageType === 'inline') {
                if(imageLoaded === false || imageReloader === true){
                  getImageFile($thisSmartImage);
                }
              } else if(imageType === 'background') {
                $thisSmartImage.addClass('ob_Image--flex');
                if(imageLoaded === false || imageReloader === true){
                  getImageFile($thisSmartImage);
                }
              }
            },

            /**
             * Check if a sprite is in view, and if so load and display it
             * @function
             */
            loadImageIfInView = function () {
              if(imageType === 'inline') {
                if(Site.utils.isElementInView($thisSmartImage) && (imageLoaded === false || imageReloader === true)){
                  getImageFile($thisSmartImage);
                }
              } else if(imageType === 'background') {
                if(Site.utils.isElementInView($thisSmartImage.parent()) && (imageLoaded === false || imageReloader === true)){
                  getImageFile($thisSmartImage);
                }
              }
            },

            /**
             * Bind custom message events for this object
             * @function
             */
            bindCustomMessageEvents = function () {
              // Load lazy images
              $thisSmartImage.on('loadSmartImage', function (e) {
                e.preventDefault();

                // Check if image has already been loaded!
                if(imageLoaded === false){
                  loadImageIfInView($thisSmartImage);
                }
              });

              $thisSmartImage.on('reloadImage', function (e) {
                e.preventDefault();

                // Check that image already been loaded and has been set to reload
                if(imageLoaded === true && imageReloader === true){
                  getImageFile($thisSmartImage);
                }
              });

              $thisSmartImage.on('loadSmartImageOnClick', function (e) {
                e.preventDefault();

                // Check if image has already been loaded!
                if(imageLoaded === false){
                  loadImage($thisSmartImage);
                }
              });
            },

            /**
             * Subscribe object to Global Messages
             * @function
             */
            subscribeToEvents = function () {
              if(loadingMethod !== 'click' && loadingMethod !== 'pageload' && loadingMethod !== 'display') {
                $.subscribe('page/scroll', function () {$(this).trigger('loadSmartImage');},$thisSmartImage);
                $.subscribe('page/resize', function () {$(this).trigger('loadSmartImage');},$thisSmartImage);
                $.subscribe('page/load', function () {$(this).trigger('loadSmartImage');},$thisSmartImage);
                $.subscribe('layout/change', function () {$(this).trigger('loadSmartImage');},$thisSmartImage);
              }

              $.subscribe('breakpoint/change', function () {$(this).trigger('reloadImage');},$thisSmartImage);
            };

        /**
         * Initialise this object
         * @function
         */
        this.init = function () {
          if(imageType === 'background') {
            $thisSmartImage.addClass('ob_Image--flex');
          }

          if(loadingMethod === 'click' || loadingMethod === 'display') {
            // Do nothing
            Site.utils.cl('do nothing');
          }
          // If image is set to display when container is in view
          else if (loadingMethod === 'view') {
            loadImageIfInView($thisSmartImage);
          }
          // Otherwise load the image on page load
          else if (loadingMethod === 'pageload') {
            getImageFile($thisSmartImage);
          }

          bindCustomMessageEvents(); 
          subscribeToEvents();

          Site.utils.cl($thisSmartImage);
        };
      },

      /**
       * Creates an SmartImageManager object to manage dynamic creation of SmartImage objects
       * @constructor
       */
      SmartImageManager = function () {
        var

        /**
         * Initalise new SmartImage objects to manage newly created smart image components
         * @function
         * @parameter elems (Object)
         */
        createNewSmartImageObjects = function (elems) {
          var newSmartImages = $(elems).find(smartImageSel);
          $(newSmartImages).each(function () {
            var thisSmartImage = new SmartImage(this);
            thisSmartImage.init();
          });
        },

        /**
         * Display all display-type smart images within a DOM element
         * @function
         * @parameter elems (Object)
         */
        displaySmartImages = function (elem) {
          var $smartImages = $(elem).find(smartImageSel);
          $smartImages.each(function () {
            var $smartImage = $(this);
            if($smartImage.data('image-load') === 'display') {
              Site.utils.cl('load smart image');
              $(this).trigger('loadSmartImage');
            }
          });
        },

        /**
         * Subscribe object to Global Messages
         * @function
         */
        subscribeToEvents = function () {
          // On a content change, the newly-added elements are passed as parameters to a function
          // that finds any smartImages and initialises controlling objects for each
          $.subscribe('content/change', function (topic,data) { createNewSmartImageObjects(data); });
          $.subscribe('content/displayed', function (topic,data) { displaySmartImages(data); });
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
        Site.events.delegate('click', '[data-image-load=click]', 'loadSmartImageOnClick');
      },

      /**
       * init function for this module
       * @function
       */
      init = function () {
        Site.utils.cl("Site.images initialised");

        $(smartImageSel).each(function () {
          var thisSmartImage = new SmartImage(this);
          thisSmartImage.init();
        });

        // Create a new SmartImageManager object
        var thisSmartImageManager = new SmartImageManager();
        thisSmartImageManager.init();

        delegateEvents();
      };

  ///////////////////////
  // Return Public API //
  ///////////////////////

  return {
    init: init
  };

}(jQuery));
