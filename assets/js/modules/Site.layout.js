// Site.layout.js

// Check if base layout is defined so it isn't overwritten
var Site = Site || {};

// Create child layout
Site.layout = (function ($) {
  "use strict";

  ///////////////
  // Variables //
  ///////////////

  var responsiveSize = 'small',
      newSize,
      scrollDirection,

      selPageHeader = ".st_PgHead",
      atTop = true,

      selFadeInContent = "[data-display=fadeIn]",


  //////////////////
  // Constructors //
  //////////////////

      /**
       * Creates a FadeInContent object to control display of content that fades in as it comes into view
       * @constructor
       */
      FadeInContent = function (elem) {
        var $thisContent = $(elem),
            isDisplayed = false,

        /**
         * If content is in view, add a class to control the fade in
         * @function
         */
        fadeInContentIfInView = function () {
          if(!isDisplayed) {
            if(Site.utils.isElementInView($thisContent)){
              $thisContent.addClass('is_Displayed');
              isDisplayed = true;
            }
          }
        },

        /**
         * Subscribe object to Global Messages
         * @function
         */
        subscribeToEvents = function () {
          $.subscribe('page/loaded', function () { fadeInContentIfInView(); });
          $.subscribe('page/scroll', function () { fadeInContentIfInView(); });
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
       * Creates a StickyHeader object to control display of the page header
       * @constructor
       */
      StickyHeader = function (elem) {
        var $pageHeader = $(elem),

        /*
        What states do we need?
        - At top of page -> Header is absolutely positioned as normal
        - Not at top of page and scrolling down -> Header is fixed, but hidden
        - Not at top of page and scrolling up -> Header is fixed and displayed

        Classes - is_Sticky - sets position to fixed, updates padding and hides header off the top of the page
                  is_InView - sets the header to show at the top of the page

        */

        /**
         * Set the initial state of the header
         * @function
         */
        setInitialHeaderState = function () {
          if(!atTop) {
            $pageHeader.addClass('is_Sticky');
          }
        },

        /**
         * When the page is scrolling down, make the header sticky, but hide it from view
         * @function
         */
        setHeaderScrollingDown = function () {
          $pageHeader.addClass('is_Sticky');
          $pageHeader.removeClass('is_InView');
        },

        /**
         * When not at the top of the page, make the header sticky
         * @function
         */
        setHeaderWhenPageNotAtTop = function () {
          $pageHeader.addClass('is_Sticky');
        },

        /**
         * Set the sticky header to be in view
         * @function
         */
        setHeaderInView = function () {
          $pageHeader.addClass('is_InView');
          //Site.utils.cl('setHeaderInView');
        },

        /**
         * When the page scroll is set to a special position (e.g. to align with particular component) set the
         * sticky header to not show, so it doesn't overlay the component
         * @function
         */
        setHeaderForSpecialPosition = function () {
          $pageHeader.removeClass('is_InView');
          Site.utils.cl('setHeaderForSpecialPosition');
        },

        /**
         * When the page scroll position is at the top, stop it being sticky
         * @function
         */
        setHeaderAtTop = function () {
          $pageHeader.removeClass('is_Sticky');
          $pageHeader.removeClass('is_InView');
        },

        /**
         * Subscribe object to Global Messages
         * @function
         */
        subscribeToEvents = function () {
          $.subscribe('page/loaded', function () { setInitialHeaderState(); });
          $.subscribe('scroll/down', function () { setHeaderScrollingDown(); });
          $.subscribe('scroll/up', function () { setHeaderInView(); });
          $.subscribe('scroll/top', function () { setHeaderAtTop(); });
          $.subscribe('scroll/notTop', function () { setHeaderWhenPageNotAtTop(); });
          $.subscribe('scroll/positioned', function () { setHeaderForSpecialPosition(); });
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
       * Creates a ResponsiveLayoutManager object to manage general layout state
       * @constructor
       */
      ResponsiveLayoutManager = function () {
        var

        /**
         * Publish a message when the breakpoint changes
         * @function
         */
        checkBreakpointChange = function (newSize) {
          if (responsiveSize !== newSize) {
            responsiveSize = newSize;
            $.publish('breakpoint/change');
          }
        },

        /**
         * Set and update the responsiveSize variable based on current screen width
         * @function
         */
        updateResponsiveSize = function () {
          var screenWidth = $(window).width(),
              screenSizeIs = {
                "small": 600,
                "medium": 800,
                "large": 1200,
                "xlarge": 1600
              };

          switch(true) {
            // Case for static (non-media query) browsers, using Modernizr MQ test
            // - use this if you want to load static-specific images
            //   (e.g. correctly sized background images that can't be scaled with CSS)
            case(!Modernizr.mq('only all')):
              responsiveSize = 'static';
              break;
            case(screenWidth <= screenSizeIs.small):
              newSize = 'small';
              checkBreakpointChange(newSize);
              break;
            case(screenWidth <= screenSizeIs.medium):
              newSize = 'medium';
              checkBreakpointChange(newSize);
              break;
            case(screenWidth <= screenSizeIs.large):
              newSize = 'large';
              checkBreakpointChange(newSize);
              break;
            case(screenWidth <= screenSizeIs.xlarge):
              newSize = 'xlarge';
              checkBreakpointChange(newSize);
              break;
            case(screenWidth > screenSizeIs.xlarge):
              newSize = 'xxlarge';
              checkBreakpointChange(newSize);
              break;
          }
        },

        /**
         * Subscribe object to Global Messages
         * @function
         */
        subscribeToEvents = function () {
          $.subscribe('page/resize', function () { updateResponsiveSize(); });
        };

        /**
         * Initialise this object
         * @function
         */
        this.init = function () {
          subscribeToEvents();
          updateResponsiveSize();
        };
      },

      /**
       * Creates a ResponsiveTextManager object to manage responsive text
       * - uses the FitText jQuery plugin so make sure this is included in the src/assets/js/libs folder
       * @constructor
       */
      ResponsiveTextManager = function () {
        var fitTextSel = '.cpResult .result',

        setFitText = function () {
          $(fitTextSel).fitText(0.4, { minFontSize: '100px', maxFontSize: '180px' });
        };


        /**
         * Initialise this object
         * @function
         */
        this.init = function () {
          setFitText();
        };
      },

      /**
       * Creates a ScrollManager object to manage scrolling events
       * @constructor
       */
      ScrollManager = function () {

        var $pageFooter = $('.stFooter').eq(0),
            footerReached = false,
            scrollTop = 0,
            newScrollTop = 0,
            pixelDelay = 20,

        /**
         * Record the current scroll direction
         * @function
         */
        updateScrollDirection = function () {
          newScrollTop = $(document).scrollTop();

          if(newScrollTop > (scrollTop + pixelDelay) ){
            scrollTop = newScrollTop;

            if(scrollDirection !== 'down'){
              $.publish('scroll/down');
              scrollDirection = 'down';
            }

          } else if (newScrollTop < (scrollTop - pixelDelay) ){
            scrollTop = newScrollTop;

            if(scrollDirection !== 'up'){
              $.publish('scroll/up');
              scrollDirection = 'up';
            }
          }

          // Check and publish message if at the top of the page
          if(newScrollTop <= 0) {
            atTop = true;
            $.publish('scroll/top');
            //Site.utils.cl("At Top");
            //Site.utils.cl(atTop);
          } else {
            atTop = false;
            $.publish('scroll/notTop');
            //Site.utils.cl(atTop);
          }
        },

        /**
         * Check if the page footer has been reached when the page is scrolled
         * @function
         */
        checkIfFooterHasBeenReached = function () {
          if($pageFooter.length > 0 ){
            if(Site.utils.isElementInView($pageFooter) && !footerReached){
              footerReached = true;
              Site.analytics.trackPageEvent('Page Navigation','scroll','Footer reached');
            }
          }
        },

        /**
         * Subscribe object to Global Messages
         * @function
         */
        subscribeToEvents = function () {
          $.subscribe('page/scroll', function () { updateScrollDirection(); });
          //$.subscribe('page/scroll', function () { checkIfFooterHasBeenReached(); });
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
       * Creates a HeightManager object to manage component heights
       * @constructor
       */
      HeightManager = function () {

        var

        // JSON object that holds group (groupSel) and item (itemSel) selectors for height equalisation,
        // along with a group name for reference (although the function below simply loops through them all)
        groups = {
                  "minireviews": {
                    "groupSel": ".gp_MiniReviews",
                    "itemSel": ".reviewText"
                  }
                },

        /**
         * Match the heights of all the groups of elements in the groups var
         * @function
         */
        updateHeights = function () {
          $.each(groups,function(i,v) {
            $(v.groupSel).each(function() {
              var $thisGroup = $(this),
                  items = $thisGroup.find(v.itemSel);

              Site.utils.equaliseMinHeights(items);
            });
          });
        },

        /**
         * Subscribe object to Global Messages
         * @function
         */
        subscribeToEvents = function () {
          $.subscribe('page/resize', function () { updateHeights(); });
        };

        /**
         * Initialise this object
         * @function
         */
        this.init = function () {
          subscribeToEvents();
          updateHeights();
        };
       },

  ///////////////
  // Functions //
  ///////////////

      /**
       * Return the value of the responsiveSize variable
       * @function
       */
      getResponsiveSize = function () {
        return responsiveSize;
      },

      /**
       * Get the value of the scrollDirection variable
       * @function
       */
      getScrollDirection = function () {
        return scrollDirection;
      },

      /**
       * Set the value of the scrollDirection variable
       * @function
       */
      setScrollDirection = function (newDirection) {
        scrollDirection = newDirection;
      },


      /**
       * Initialise this module
       * @function
       */
      init = function () {
        Site.utils.cl("Site.layout initialised");

        // Create a new ResponsiveLayoutManager object
        var thisResponsiveLayoutManager = new ResponsiveLayoutManager();
        thisResponsiveLayoutManager.init();

        // Create a new ResponsiveTextManager object
        var thisResponsiveTextManager = new ResponsiveTextManager();
        thisResponsiveTextManager.init();

        // Create a new ScrollManager object
        var thisScrollManager = new ScrollManager();
        thisScrollManager.init();

        // Create a new HeightManager object
        if($('html').hasClass('legacy')) {
          var thisHeightManager = new HeightManager();
          thisHeightManager.init();
        }

        $(selPageHeader).each(function () {
          var newStickyHeader = new StickyHeader(this);
          newStickyHeader.init();
        });

        $(selFadeInContent).each(function () {
          var newFadeInContent = new FadeInContent(this);
          newFadeInContent.init();
        });
      };

  ///////////////////////
  // Return Public API //
  ///////////////////////

  return {
    init: init,
    getResponsiveSize: getResponsiveSize,
    getScrollDirection: getScrollDirection,
    setScrollDirection: setScrollDirection
  };
}(jQuery));
