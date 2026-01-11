/**
 * Functionality specific to Fixtech.
 *
 * Provides helper functions to enhance the theme experience.
 */
"use strict";

/*------------------------------------------------------------------------------*/
/* Equal Height Div
/*------------------------------------------------------------------------------*/

equalheight = function(container){

var currentTallest = 0,
     currentRowStart = 0,
     rowDivs = new Array(),
     $el,
     topPosition = 0;
 jQuery(container).each(function() {

   $el = jQuery(this);
   jQuery($el).outerHeight('auto')
   topPostion = $el.position().top;

   if (currentRowStart != topPostion) {
     for (currentDiv = 0 ; currentDiv < rowDivs.length ; currentDiv++) {
       rowDivs[currentDiv].height(currentTallest);
     }
     rowDivs.length = 0; // empty the array
     currentRowStart = topPostion;
     currentTallest = $el.outerHeight();
     rowDivs.push($el);
   } else {
     rowDivs.push($el);
     currentTallest = (currentTallest < $el.outerHeight()) ? ($el.outerHeight()) : (currentTallest);
  }
   for (currentDiv = 0 ; currentDiv < rowDivs.length ; currentDiv++) {
     rowDivs[currentDiv].outerHeight(currentTallest);
   }
 });
}	

function themetechmount_sticky(){
	
	// Returns width of browser viewport
	var pageWidth = jQuery( window ).width();	
	// setting height for spacer
	if( parseInt(pageWidth) > parseInt(tm_breakpoint) ){
		jQuery('.tm-stickable-header').stick_in_parent({'parent':'body', 'spacer':false});
	} else {
		console.log('Mobile MODE');
		jQuery('.tm-stickable-header').trigger("sticky_kit:detach");
	}
}

function themetechmount_setCookie(c_name,value,exdays){
	var now  = new Date();
	var time = now.getTime();
	time    += (3600 * 1000) * 24;
	now.setTime(time);

	var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+now.toGMTString() );
	document.cookie=c_name + "=" + c_value;
} // END function themetechmount_setCookie

/*------------------------------------------------------------------------------*/
/* Function to set dynamic height of Testimonial columns
/*------------------------------------------------------------------------------*/
function setHeight(column) {
    var maxHeight = 0;
    //Get all the element with class = col
    column = jQuery(column);
    column.css('height', 'auto');
	
	// Responsive condition: Work only in tablet, desktop and other bigger devices.
	if( jQuery( window ).width() > 479 ){
		
		//Loop all the column
		column.each(function() {       
			//Store the highest value
			if(jQuery(this).height() > maxHeight) {
				maxHeight = jQuery(this).height();
			}
		});
		//Set the height
		column.height(maxHeight);
		
	} // if( jQuery( window ).width() > 479 )
} // END function setHeight
/**************************************************************************/

/*------------------------------------------------------------------------------*/
/* Search form on search results page
/*------------------------------------------------------------------------------*/
if( jQuery('.tm-sresult-form-wrapper').length>0 ){

	jQuery('.tm-sresult-form-wrapper .tm-sresults-settings-btn').on('click', function() {
		jQuery('.tm-sresult-form-wrapper .tm-sresult-form-bottom').slideToggle('400',function(){
			if( jQuery('.tm-sresult-form-wrapper .tm-sresult-form-bottom').is(":hidden") ){
				jQuery('.tm-sresult-form-wrapper .tm-sresults-settings-btn').removeClass('tm-sresult-btn-active');
			} else {
				jQuery('.tm-sresult-form-wrapper .tm-sresults-settings-btn').addClass('tm-sresult-btn-active');
			}
		});
		return false;
	});

	// Check if post_type input is available or not
	if(jQuery('.tm-sresult-form-wrapper form.search-form').length > 0 ){
		if( jQuery(".tm-sresult-form-wrapper form.search-form input[name='post_type']").length==0 ){
		
			jQuery('<input>').attr({
				type : 'hidden',
				name : 'post_type'
			}).appendTo('.tm-sresult-form-wrapper form.search-form');
		}
	}

	// On change of the CPT dropdown
	jQuery(".tm-sresult-form-wrapper .tm-sresult-cpt-select").change(function(){
		jQuery(".tm-sresult-form-wrapper form.search-form input[name='post_type']").val( jQuery(this).val() );
	});

	// Submit the form
	jQuery(".tm-sresult-form-wrapper .tm-sresult-form-sbtbtn").on('click', function() {
		jQuery(".tm-sresult-form-wrapper form.search-form").submit();
	});

}

/*------------------------------------------------------------------------------*/
/* Function to Set Blog Masonry view
/*------------------------------------------------------------------------------*/
function themetechmount_blogmasonry(){
	if( jQuery().isotope ){
		if( jQuery('#content.themetechmount-blog-col-page').length > 0 ){
			
			jQuery('#content.themetechmount-blog-col-page').masonry();
			jQuery('#content.themetechmount-blog-col-page').isotope({
					itemSelector: '.post-box',
					masonry: {
					},
					sortBy : 'original-order'
			});
		}
	}
}

/*------------------------------------------------------------------------------*/
/* Function to set margin bottom for sticky footer
/*------------------------------------------------------------------------------*/
function themetechmount_stickyFooter(){
	if( jQuery('body').hasClass('themetechmount-sticky-footer')){
		jQuery('div#content').css( 'marginBottom', jQuery('footer#colophon').height() );
	}
}

/*------------------------------------------------------------------------------*/
/* Function to add class to select box if default option selected
/*------------------------------------------------------------------------------*/
function setEmptySelectBox(element){
	if(jQuery(element).val() == ""){
		jQuery(element).addClass("empty");
	} else {
		jQuery(element).removeClass("empty");
	}
}

function themetechmount_hide_togle_link(){
	if( jQuery('#navbar div.mega-menu-wrap ul.mega-menu').length > 0 ){
		jQuery('h3.menu-toggle').css('display','none');
	}
}

/*------------------------------------------------------------------------------*/
/* Google Map in Header area
/*------------------------------------------------------------------------------*/
function themetechmount_reset_gmap(){
	jQuery('.themetechmount-fbar-box-w > div > aside').each(function(){
		var mainthis = jQuery(this);
		jQuery( 'iframe[src^="https://www.google.com/maps/"], iframe[src^="http://www.google.com/maps/"]',mainthis ).each(function(){
			if( !jQuery(this).hasClass('themetechmount-set-gmap') ){
				jQuery(this).attr('src',jQuery(this).attr('src')+'');
				jQuery(this).load(function(){
					jQuery(this).addClass('themetechmount-set-gmap').animate({opacity: 1 }, 1000 );
				});	

			}
		})
	});
}
function themetechmount_hide_gmap(){
	jQuery('.themetechmount-fbar-box-w > div > aside').each(function(){
		var mainthis = jQuery(this);
		jQuery( 'iframe[src^="https://www.google.com/maps/"], iframe[src^="http://www.google.com/maps/"]',mainthis ).each(function(){
			if( !jQuery(this).hasClass('themetechmount-set-gmap') ){
				jQuery(this).css({opacity: 0});
				jQuery(this).css('display', 'block');
			}
		})
	});
}	
	
function themetechmount_isotope() {
	jQuery('.themetechmount-boxes-sortable-yes').each(function(){	
		var gallery_item = jQuery('.themetechmount-boxes-row-wrapper', this );
		var filterLinks  = jQuery('.tm-sortable-wrapper a', this );			
		gallery_item.isotope({
			animationEngine : 'best-available'
		})
		filterLinks.on('click', function(e){
			var selector = jQuery(this).attr('data-filter');
			gallery_item.isotope({
				filter : selector,
				itemSelector : '.isotope-item'
			});

			filterLinks.removeClass('selected');
			jQuery('#filter-by li').removeClass('current-cat');
			jQuery(this).addClass('selected');
			e.preventDefault();
		});
		
	});
};	

/******************************/
 
/* One Page Navigation
	   --------------------------------------------------------- */	
	   
jQuery( document ).ready(function($) {
	
	"use strict";
	
	/*------------------------------------------------------------------------------*/
	/* Select2 library for all SELECT element
	/*------------------------------------------------------------------------------*/
	jQuery('select').select2();	
	
	
	/*------------------------------------------------------------------------------*/
	/* Logo Margin Padding
	/*------------------------------------------------------------------------------*/
	fixtech_logMarginPadding();
	fixtech_logMarginPadding_right();

	/*------------------------------------------------------------------------------*/
	/* ROW Equal height : Setting bg image as inline so it will appear in mobile mode
	/*------------------------------------------------------------------------------*/	
	jQuery('.vc_row-o-equal-height, .tm-equalheightdiv').each(function(){
		var thisRow = jQuery(this);
		jQuery('.wpb_column', thisRow).each(function(){
			var thisColumn = jQuery(this);
			if  ( jQuery('.tm-col-wrapper-bg-layer', thisColumn).length > 0 && ( jQuery('.tm-col-wrapper-bg-layer', thisColumn).css('background-image') != 'none') && (jQuery(thisColumn).text().trim() == '') ) {
				var bgimage = jQuery('.tm-col-wrapper-bg-layer', thisColumn).css('background-image').replace('url(','');
				bgimage  = bgimage.replace(')','');					
				
				jQuery('.vc_column-inner', thisColumn).after('<img src=' + bgimage + ' class="tm-equal-height-image" />');
				
				jQuery(thisColumn).addClass('tm-emtydiv');
			}
		});

	});
	
	/*------------------------------------------------------------------------------*/
	/* Smooth Scroller
	/*------------------------------------------------------------------------------*/
	
	jQuery( ".tm-header-search-link a" ).on('click', function() {
	  		jQuery(".tm-search-overlay").addClass('st-show');
			jQuery("body").addClass('st-prevent-scroll');			
			jQuery(".field.searchform-s").focus();					    
	 		return false;
	});		
	jQuery( ".tm-search-overlay" ).on('click', function() {			
	  		jQuery(".tm-search-overlay").removeClass('st-show');
			jQuery("body").removeClass('st-prevent-scroll');					  
	 		return false;
	});	
	jQuery('.tm-site-searchform').on('click', function(event) {
		event.stopPropagation();
	});

	
	/*------------------------------------------------------------------------------*/
	/* One Page setting
	/*------------------------------------------------------------------------------*/	
	if( jQuery('body').hasClass('themetechmount-one-page-site') ){
		var sections = jQuery('.wpb_row, #tm-header-slider'),
		nav = jQuery('.mega-menu-wrap, .menu-main-menu-container'),
		nav_height = nav.outerHeight();	
		jQuery(window).on('scroll', function () {
			if(typeof jQuery(this) != 'undefined'){
				var cur_pos = jQuery(this).scrollTop(); 
				sections.each(function() {
					var top = jQuery(this).offset().top - nav_height,
					bottom = top + jQuery(this).outerHeight(); 
	
					if (cur_pos >= top && cur_pos <= bottom) {
						if( typeof jQuery(this) != 'undefined' && typeof jQuery(this).attr('id')!='undefined' && jQuery(this).attr('id')!='' ){
							var mainThis = jQuery(this);							
							nav.find('a').removeClass('mega-current-menu-item mega-current_page_item current-menu-ancestor current-menu-item current_page_item');						
							jQuery(this).addClass('mega-current-menu-item mega-current_page_item current-menu-ancestor current-menu-item current_page_item');
							var arr = mainThis.attr('id');							
							// Applying active class
							jQuery('#navbar a').parent().removeClass('mega-current-menu-item mega-current_page_item current-menu-ancestor current-menu-item current_page_item');
							nav.find('a').each(function(){
								var menuAttr = jQuery(this).attr('href').split('#')[1];						
								if( menuAttr == arr ){
									jQuery(this).parent().addClass('mega-current-menu-item mega-current_page_item current-menu-ancestor current-menu-item current_page_item');
								}
							})							
						}
					}
				});
			}
	});
	
	nav.find('a').on('click', function () {
	var $el = jQuery(this), 
	id = $el.attr('href');
	var arr=id.split('#')[1];	  
		jQuery('html, body').animate({
			scrollTop: jQuery('#'+ arr).offset().top - nav_height
		  }, 500);  
		  return false;
		});
	}	
		
	if( jQuery("div.search_field.by_treatment select").length > 0 ){
		setEmptySelectBox(jQuery("div.search_field.by_treatment select"));
		// Country dropdown on change
		jQuery("div.search_field.by_treatment select").change(function () {
			setEmptySelectBox( jQuery(this) );
		});
	}
		
	/*------------------------------------------------------------------------------*/
	/* Social icon
	/*------------------------------------------------------------------------------*/ 
	
	jQuery(".themetechmount-row-fullwidth-true.full-colum-height-widht > .grid_section > .vc_column_container img.vc_single_image-img").each(function() {  
       var imgsrc = jQuery(this).attr("src");
	   jQuery(this).parent().parent().parent().parent().parent('.vc_column_container').css('background-image', 'url(' + imgsrc + ')');       
  	});	
			
	/*------------------------------------------------------------------------------*/
	/* Search form
	/*------------------------------------------------------------------------------*/

	jQuery( ".search_box a" ).addClass('sclose');	
	
	jQuery( ".search_box a" ).on('click', function() {
		
		
		if (jQuery('.search_box a').hasClass('sclose')) {			
			jQuery( ".search_box a span" ).removeClass('ti-search').addClass('ti-close');
			jQuery(this).removeClass('sclose').addClass('open');
			
			if (jQuery('#stickable-header-sticky-wrapper').hasClass('is-sticky')) {
				jQuery("html, body").animate({scrollTop: 0}, 1000);
				jQuery(".k_flying_searchform_wrapper").delay(1500).slideDown( 400, function() {
					jQuery(".field.searchform-s").focus();				
				});				
			}else{
				jQuery(".k_flying_searchform_wrapper").slideDown( 400, function() {
					jQuery(".field.searchform-s").focus();				
				});
			}			
			
		} else {
			
			jQuery(this).removeClass('open').addClass('sclose');
			jQuery( ".search_box a span" ).removeClass('ti-close').addClass('ti-search');			
				jQuery(".k_flying_searchform_wrapper").slideUp( 400, function() {						 		
			});	 
		}
		
	});		
			
	 /*------------------------------------------------------------------------------*/
	 /* Applying prettyPhoto to all images
	 /*------------------------------------------------------------------------------*/
	if( typeof jQuery.fn.prettyPhoto == "function" ){
				
		// Gallery
		jQuery('div.gallery a[href*=".jpg"], div.gallery a[href*=".jpeg"], div.gallery a[href*=".png"], div.gallery a[href*=".gif"]').each(function(){
			if( jQuery(this).attr('target')!='_blank' ){
				jQuery(this).attr('rel','prettyPhoto[wp-gallery]');
			}
		});
		
		// WordPress Gallery
		jQuery('.gallery-item a[href*=".jpg"], .gallery-item a[href*=".jpeg"], .gallery-item a[href*=".png"], .gallery-item a[href*=".gif"]').each(function(){
			if( jQuery(this).attr('target')!='_blank' ){
				jQuery(this).attr('rel','prettyPhoto[coregallery]');
			}
		});
		
		// Normal link
		jQuery('a[href*=".jpg"], a[href*=".jpeg"], a[href*=".png"], a[href*=".gif"]').each(function(){
			console.log('Hiiiiiii');
			if( jQuery(this).attr('target')!='_blank' && !jQuery(this).hasClass('prettyphoto') ){
				var attr = $(this).attr('rel');
				// For some browsers, `attr` is undefined; for others,
				// `attr` is false.  Check for both.
				if (typeof attr !== typeof undefined && attr !== false && attr!='prettyPhoto' ) {
					jQuery(this).attr('data-rel','prettyPhoto');
				}
			}
		});
		
		jQuery('a[data-rel^="prettyPhoto"]').prettyPhoto();
		jQuery('a.tm_prettyphoto').prettyPhoto();
		jQuery('a[rel^="prettyPhoto"]').prettyPhoto();

		
		/*------------------------------------------------------------------------------*/
		/* Settting for lightbox content in Portfolio slider
		/*------------------------------------------------------------------------------*/
		jQuery("a.themetechmount-open-gallery").on('click', function() {
			var id   = jQuery(this).data('id');
			var currid = window[ 'api_images_' + id ];
			jQuery.prettyPhoto.open( window[ 'api_images_' + id ] , window[ 'api_titles_' + id ] , window[ 'api_desc_' + id ] );
		});
		
	}
		
	/*------------------------------------------------------------------------------*/
	/* Animation on scroll: Number rotator
	/*------------------------------------------------------------------------------*/
	$("[data-appear-animation]").each(function() {
		var self      = $(this);
		var animation = self.data("appear-animation");
		var delay     = (self.data("appear-animation-delay") ? self.data("appear-animation-delay") : 0);
		
		if( $(window).width() > 959 ) {
			self.html('0');
			self.waypoint(function(direction) {
				if( !self.hasClass('completed') ){
					var from     = self.data('from');
					var to       = self.data('to');
					var interval = self.data('interval');
					self.numinate({
						format: '%counter%',
						from: from,
						to: to,
						runningInterval: 2000,
						stepUnit: interval,
						onComplete: function(elem) {
							self.addClass('completed');
						}
					});
				}
			}, { offset:'85%' });
		} else {
			if( animation == 'animateWidth' ) {
				self.css('width', self.data("width"));
			}
		}
	});

	/*------------------------------------------------------------------------------*/
	/* Scroll to Top
	/*------------------------------------------------------------------------------*/
	var offset   = 85;
    var duration = 500;
    jQuery(window).scroll(function() {
        if (jQuery(this).scrollTop() > offset) {
            jQuery("#totop").fadeIn(duration);
        } else {
            jQuery("#totop").fadeOut(duration);
        }
    });
    jQuery("#totop").on('click', function(event) {
        event.preventDefault();
        jQuery("html, body").animate({scrollTop: 0}, duration);
        return false;
    })
	
	/*------------------------------------------------------------------------------*/
	/* Set height of boxes inside row-column view of Blog and Portfolio
	/*------------------------------------------------------------------------------*/
	if( jQuery('.themetechmount-testimonial-box' ).length > 0 ){
		setHeight('.themetechmount-testimonial-box.col-lg-6.col-sm-6.col-md-6');
		setHeight('.themetechmount-testimonial-box.col-lg-4.col-sm-6.col-md-4');
		setHeight('.themetechmount-testimonial-box.col-lg-3.col-sm-6.col-md-3');
	}
	
	/*------------------------------------------------------------------------------*/
	/* Sticky
	/*------------------------------------------------------------------------------*/
	if( jQuery('.tm-stickable-header').length > 0 ){
		
		// wrapping div for spacer when sticky
		themetechmount_sticky();
	}	

	/*------------------------------------------------------------------------------*/
	/* Return Fasle when # Url
	/*------------------------------------------------------------------------------*/
	$('#site-navigation a[href="#"]').on('click', function() {return false;});	
	
	
	/*------------------------------------------------------------------------------*/
	/* Welcome bar close button
	/*------------------------------------------------------------------------------*/
	$(".themetechmount-close-icon").on('click', function(){
		$("#page").css('padding-top', (parseInt($("#page").css('padding-top')) - parseInt($(".themetechmount-wbar").height()) ) + 'px' );
		$(".themetechmount-wbar").slideUp();
		themetechmount_setCookie('kw_hidewbar','1',1);
	});

	/*------------------------------------------------------------------------------*/
	/* Removing BR tag added by shortcode generator
	/*------------------------------------------------------------------------------*/
	var galleryHTML = jQuery(".gallery-size-full br").each(function(){
		jQuery(this).remove();
	});	

	/*------------------------------------------------------------------------------*/
	/* Settting for lightbox content in Blog
	/*------------------------------------------------------------------------------*/
	jQuery("a.themetechmount-open-gallery").on('click', function(){
		var href   = jQuery(this).attr('href');
		var id     = href.replace("#themetechmount-embed-code-", "");
		var currid = window[ 'api_images_' + id ];
		jQuery.prettyPhoto.open( window[ 'api_images_' + id ] , window[ 'api_titles_' + id ] , window[ 'api_desc_' + id ] );
	});
	
	/*------------------------------------------------------------------------------*/
	/* Carousel effect in Blog and Portfolio section
	/*------------------------------------------------------------------------------*/
	if ( jQuery('.themetechmount-effect-carousel').length > 0 ) {
		jQuery('.themetechmount-effect-carousel').each(function(){
			
			/* Responsive array for "Owl Carousel 2"
			 * http://owlcarousel.owlgraphic.com/index.html
			 */
			var itemsColumns2 = {
				0:{
					items:1
				},
				479:{
					items:2
				},
				768:{
					items:2
				},
				1200:{
					items:3
				}
			};
			
			if( jQuery(this).hasClass('themetechmount-carousel-col-one') ){
				// One Column
				itemsColumns2 = {
					0:{
						items:1
					},
					479:{
						items:1
					},
					768:{
						items:1
					},
					1200:{
						items:1
					}
				};

			} else if( jQuery(this).hasClass('themetechmount-carousel-col-two') ){
				// Two Column		
				itemsColumns2 = {
					0:{
						items:1
					},
					479:{
						items:2
					},
					768:{
						items:2
					},
					1200:{
						items:2
					}
				};
				
			} else if( jQuery(this).hasClass('themetechmount-carousel-col-four') ){
				// Four Column
				itemsColumns2 = {
					0:{
						items:1
					},
					479:{
						items:2
					},
					768:{
						items:2
					},
					1200:{
						items:4
					}
				};
				
				
			} else if( jQuery(this).hasClass('themetechmount-carousel-col-five') ){
				// Four Column
				itemsColumns2 = {
					0:{
						items:1
					},
					479:{
						items:2
					},
					768:{
						items:3
					},
					1200:{
						items:5
					}
				};
				
				
			} else if( jQuery(this).hasClass('themetechmount-carousel-col-six') ){
				// Four Column
				itemsColumns2 = {
					0:{
						items:1
					},
					479:{
						items:2
					},
					768:{
						items:3
					},
					1200:{
						items:6
					}
				};
				
			} // IF
			
			var owlWrap = jQuery(this);
			
			
			// Show/Hide pagination in Owl Carousel
			var paginationOption = false;
			if( jQuery(this).hasClass('themetechmount-with-pagination') ){
				paginationOption = true;
			}
			
			// checking if the dom element exists
			if (owlWrap.length > 0) {
				// check if plugin is loaded
				if (jQuery().owlCarousel) {
					owlWrap.each(function(){
						var carousel = $(this).find('.themetechmount-carousel-items-wrapper'),
						navigation   = $(this).find('.themetechmount-carousel-controls-inner'),
						nextBtn      = navigation.find('a.themetechmount-carousel-next'),
						prevBtn      = navigation.find('a.themetechmount-carousel-prev');
						
						/* Options for "Owl Carousel 2"
						 * http://owlcarousel.owlgraphic.com/index.html
						 */
						var rtloption = false;
						if( jQuery('body').hasClass('rtl') ){
							rtloption = true;
						}
						
						// CAROUSEL OPTIONS
						var val_autoplay        = true;   // default set
						var val_autoplaySpeed   = 800;    // default set
						var val_loop            = false;  // default set
						var val_autoplayTimeout = 4500;   // default set
						var val_animatein       = false;  // default set
						var val_animateout      = false;  // default set
						var val_dots            = false;  // default set
						var val_nav             = false;  // default set
						var val_margin          = 30;     // default set
						var val_pauseonhower    = true;   // default set
						
						if( owlWrap.data('autoplayspeed')!='' ){
							val_autoplaySpeed = jQuery.trim( owlWrap.data('autoplayspeed') );
						}
						if( owlWrap.data('autoplay')=='0' ){
							val_autoplay      = false;
							val_autoplaySpeed = false;
						}
						if( owlWrap.data('loop')=='1' ){
							val_loop = true;
						}
						if( owlWrap.data('autoplaytimeout')!='' ){
							val_autoplayTimeout = jQuery.trim( owlWrap.data('autoplaytimeout') );
						}
						if( owlWrap.data('animatein')!='' && owlWrap.data('animatein')!='none' ){
							val_animatein = jQuery.trim( owlWrap.data('animatein') );
						}
						if( owlWrap.data('animateout')!='' && owlWrap.data('animateout')!='none' ){
							val_animateout = jQuery.trim( owlWrap.data('animateout') );
						}
						if( owlWrap.data('dots')==true ){
							val_dots = true;
						}
						if( owlWrap.data('nav')==true ){
							val_nav = true;
						}
						if( owlWrap.closest('.vc_row').hasClass('vc_row-no-padding') ){
							val_margin = 0;
						}
						if( owlWrap.data('autoplayhoverpause')==false ){
							val_pauseonhower = false;
						}
												
						jQuery('.themetechmount-effect-carousel article.portfolio-box').each(function(){
							jQuery(this).removeClass('col-lg-6 col-sm-6 col-md-6 col-xs-12');
						});
												
						// Full width
						if( typeof carousel.closest('.main_row').data('vc-full-width') !== "undefined" &&
						    typeof carousel.closest('.main_row').data('vc-stretch-content') !== "undefined" &&
							carousel.closest('.main_row').data('vc-full-width') == true &&
							carousel.closest('.main_row').data('vc-stretch-content') == true &&
							carousel.closest('.main_row').hasClass('vc_row-no-padding')
							
						){
							val_margin = 0;
						}
						// ---- END FULL WIDTH  -----
												
						//carousel
						carousel.owlCarousel({
							/* Options for "Owl Carousel 2"
							 * http://owlcarousel.owlgraphic.com/index.html
							 */
							autoplay        : val_autoplay,
							autoplayTimeout : val_autoplayTimeout,
							autoplaySpeed   : val_autoplaySpeed,
							navSpeed        : val_autoplaySpeed,
							dots            : val_dots,
							dotsSpeed       : val_autoplaySpeed,
							//navRewind     : 2000,
							//dotsEach      : 1,
							rtl             : rtloption,
							loop            : val_loop,
							margin          : val_margin,
							nav             : val_nav,
							navText         : [ '<i class="fa fa-angle-double-left"></i>','<i class="fa fa-angle-double-right"></i>' ],
							responsive      : itemsColumns2,
							animateIn       : val_animatein,
							animateOut      : val_animateout,
							autoplayHoverPause : val_pauseonhower,
							baseClass          : "owl-carousel", // base styles
							theme              : "owl-theme" // switch to your own theme
						});
						
						// Custom Navigation Events
						nextBtn.on('click', function() {
							/* Options for "Owl Carousel 2"
							 * http://owlcarousel.owlgraphic.com/index.html
							 */
							carousel.trigger('next.owl.carousel',[val_autoplaySpeed] );						
							
							return false;
						});
						prevBtn.on('click', function() {
							/* Options for "Owl Carousel 2"
							 * http://owlcarousel.owlgraphic.com/index.html
							 */
							carousel.trigger('prev.owl.carousel',[val_autoplaySpeed]);
														
							return false;
						});

						if(val_loop==false){

							carousel.on('changed.owl.carousel', function(event) {
								var newindex = event.item.index + event.page.size;


								if( newindex == event.item.count ){
									var totalTimeout = parseInt(val_autoplayTimeout)+parseInt(val_autoplayTimeout);

									setTimeout(function(){
										carousel.trigger('to.owl.carousel', [0,val_autoplaySpeed,val_autoplaySpeed] );
									}, totalTimeout);
									
								}
							});

						}
						
					});
				};
			};
		});
	}
	
	/*-----------------------------------------------------------------------------------*/
	/*	Isotope
	/*-----------------------------------------------------------------------------------*/
	if( jQuery().isotope ){
		jQuery(window).load(function () {
			themetechmount_isotope();		
		});
		jQuery(window).resize(function(){
			themetechmount_isotope();
		});
	}
		
	/*------------------------------------------------------------------------------*/
	/* Setup Post Likes
	/*------------------------------------------------------------------------------*/
	$('.themetechmount-portfolio-likes').on('click', function(e){
		e.preventDefault();
		var link = $(this);
		if(link.hasClass('like-active')) return false;
		
		$(this).html('<i class="fa fa-circle-o-notch fa fa-spin"></i>');
		
		var id = $(this).attr('id');

		$.post(ajaxurl, {action: 'themetechmount-portfolio-likes', likes_id: id}, function(data){
			$( 'i.fa fa-heart-o', link ).removeClass('fa fa-heart-o').addClass('fa fa-heart');
			link.html(data).addClass('like-active');
		});
	});
		
	/*------------------------------------------------------------------------------*/
	/* Sticky Footer
	/*------------------------------------------------------------------------------*/
	jQuery('footer#colophon').resize(function(){
		themetechmount_stickyFooter();
	});
	themetechmount_stickyFooter();	
	
	/*------------------------------------------------------------------------------*/
	/* Equal Height Div load
	/*------------------------------------------------------------------------------*/	
	equalheight('.tm-equalheightdiv  .wpb_column.vc_column_container');
	
	themetechmount_hide_togle_link();
	
	jQuery( "#tm-header-slider > div > div:contains('Revolution Slider Error')" ).css( "margin", "auto" );
	
	/*------------------------------------------------------------------------------*/
	/*  Timeline view
	/*------------------------------------------------------------------------------*/	
	
		$.fn.smTimeline = function( option, value ) {
			jQuery( this ).each( function() {
				var $sm_timeline = jQuery( this );
				
				var is_mobile_view = jQuery( window ).width() < 768;
				$sm_timeline.find( '.timeline-element' ).each( function() {
					var $this = jQuery( this );
					var $timeline_spine = $this.find( '.tm-timeline-spine' );
					if ( is_mobile_view ) {
						$this.addClass( 'wow fadeInUp' );
						$timeline_spine.attr( 'style', '' );
					} else {
						if ( $this.hasClass( 'left-side' ) ) {
							$this.find( '.tm-animation-wrap' ).addClass( 'wow fadeInLeft' );
						} else if ( $this.hasClass( 'right-side' ) ) {
							$this.find( '.tm-animation-wrap' ).addClass( 'wow fadeInRight' );
						}
						
						if ( $this.next().length == 0 ) return;
						var $next = $this.next();
						var $next_tl_spine = $next.find( '.tm-timeline-spine' );
												
						if ( $next.hasClass( 'tm-date-separator' ) ) {
							$timeline_spine.height( $next.offset().top - $timeline_spine.offset().top - 5 );					
						} else if ( $next_tl_spine.length ) {							
							$timeline_spine.height( $next_tl_spine.offset().top - $timeline_spine.offset().top - 25 );
						} 
					}
				} );
			} );
		}
	
	/* ***************** */
	/*  Carousel effect  */
	/* ***************** */
	jQuery('.themetechmount-boxes-view-carousel').each(function(){
		
		var thisElement = jQuery(this);
		
		// Column
		var tm_column         = 3;
		var tm_slidestoscroll = 3;
		
		var tm_slidestoscroll_1200 = 3;
		var tm_slidestoscroll_992  = 3;
		var tm_slidestoscroll_768  = 2;
		var tm_slidestoscroll_479  = 2;
		var tm_slidestoscroll_0    = 1;
		if( jQuery(this).data('tm-slidestoscroll')=='1' ){  // slides to scroll
			var tm_slidestoscroll      = 1;
			var tm_slidestoscroll_1200 = 1;
			var tm_slidestoscroll_992  = 1;
			var tm_slidestoscroll_768  = 1;
			var tm_slidestoscroll_479  = 1;
			var tm_slidestoscroll_0    = 1;
		}		
		
		// responsive
		var tm_responsive = [
			{ breakpoint: 1200, settings: {
				slidesToShow  : 3,
				slidesToScroll: tm_slidestoscroll_1200
			} },
			{ breakpoint: 768, settings: {
				slidesToShow  : 2,
				slidesToScroll: tm_slidestoscroll_768
			} },
			{ breakpoint: 479, settings: {
				slidesToShow  : 2,
				slidesToScroll: tm_slidestoscroll_479
			} },
			{ breakpoint: 0, settings: {
				slidesToShow  : 1,
				slidesToScroll: tm_slidestoscroll_0
			} }
		];
				
		if( jQuery(this).hasClass('themetechmount-boxes-col-three') ){
			tm_column         = 3;
			tm_slidestoscroll = 3;
			
			var tm_slidestoscroll_1200 = 3;
			var tm_slidestoscroll_768  = 2;
			var tm_slidestoscroll_479  = 2;
			var tm_slidestoscroll_0    = 1;
			if( jQuery(this).data('tm-slidestoscroll')=='1' ){  // slides to scroll
				var tm_slidestoscroll      = 1;
				var tm_slidestoscroll_1200 = 1;
				var tm_slidestoscroll_768  = 1;
				var tm_slidestoscroll_479  = 1;
				var tm_slidestoscroll_0    = 1;
			}
			
			tm_responsive     = [
				{ breakpoint: 1200, settings: {
					slidesToShow  : 3,
					slidesToScroll: tm_slidestoscroll_1200,
				} },
				{ breakpoint: 768, settings: {
					slidesToShow  : 2,
					slidesToScroll: tm_slidestoscroll_768
				} },
				{ breakpoint: 479, settings: {
					slidesToShow  : 2,
					slidesToScroll: tm_slidestoscroll_479
				} },
				{ breakpoint: 0, settings: {
					slidesToShow  : 1,
					slidesToScroll: tm_slidestoscroll_0
				} }
			];
		
		} else if( jQuery(this).hasClass('themetechmount-boxes-col-one') ){
			tm_column         = 1;
			tm_slidestoscroll = 1;
			
			tm_responsive     = [
				{ breakpoint: 1200, settings: {
					slidesToShow  : 1,
					slidesToScroll: 1,
				} },
				{ breakpoint: 768, settings: {
					slidesToShow  : 1,
					slidesToScroll: 1
				} },
				{ breakpoint: 479, settings: {
					slidesToShow  : 1,
					slidesToScroll: 1
				} },
				{ breakpoint: 0, settings: {
					slidesToShow  : 1,
					slidesToScroll: 1
				} }
			];
			
		} else if( jQuery(this).hasClass('themetechmount-boxes-col-two') ){
			tm_column         = 2;
			tm_slidestoscroll = 2;
			
			var tm_slidestoscroll_1200 = 2;
			var tm_slidestoscroll_768  = 2;
			var tm_slidestoscroll_479  = 2;
			var tm_slidestoscroll_0    = 1;
			if( jQuery(this).data('tm-slidestoscroll')=='1' ){  // slides to scroll
				var tm_slidestoscroll      = 1;
				var tm_slidestoscroll_1200 = 1;
				var tm_slidestoscroll_768  = 1;
				var tm_slidestoscroll_479  = 1;
				var tm_slidestoscroll_0    = 1;
			}
			
			tm_responsive     = [
				{ breakpoint: 1200, settings: {
					slidesToShow  : 2,
					slidesToScroll: tm_slidestoscroll_1200
				} },
				{ breakpoint: 768, settings: {
					slidesToShow  : 2,
					slidesToScroll: tm_slidestoscroll_768
				} },
				{ breakpoint: 479, settings: {
					slidesToShow  : 2,
					slidesToScroll: tm_slidestoscroll_479
				} },
				{ breakpoint: 0, settings: {
					slidesToShow  : 1,
					slidesToScroll: tm_slidestoscroll_0
				} }
			];
			
		
		} else if( jQuery(this).hasClass('themetechmount-boxes-col-four') ){
			tm_column         = 4;
			tm_slidestoscroll = 4;
			
			var tm_slidestoscroll_1200 = 4;
			var tm_slidestoscroll_992  = 3;
			var tm_slidestoscroll_768  = 2;
			var tm_slidestoscroll_479  = 2;
			var tm_slidestoscroll_0    = 1;
			if( jQuery(this).data('tm-slidestoscroll')=='1' ){  // slides to scroll
				var tm_slidestoscroll      = 1;
				var tm_slidestoscroll_1200 = 1;
				var tm_slidestoscroll_992  = 1;
				var tm_slidestoscroll_768  = 1;
				var tm_slidestoscroll_479  = 1;
				var tm_slidestoscroll_0    = 1;
			}
			
			tm_responsive     = [
				{ breakpoint: 1200, settings: {
					slidesToShow  : 4,
					slidesToScroll: tm_slidestoscroll_1200
				} },
				{ breakpoint: 992, settings: {
					slidesToShow  : 3,
					slidesToScroll: tm_slidestoscroll_992
				} },
				{ breakpoint: 768, settings: {
					slidesToShow  : 2,
					slidesToScroll: tm_slidestoscroll_768
				} },
				{ breakpoint: 479, settings: {
					slidesToShow  : 2,
					slidesToScroll: tm_slidestoscroll_479
				} },
				{ breakpoint: 0, settings: {
					slidesToShow  : 1,
					slidesToScroll: tm_slidestoscroll_0
				} }
			];
			
			
		} else if( jQuery(this).hasClass('themetechmount-boxes-col-five') ){
			tm_column         = 5;
			tm_slidestoscroll = 5;
			
			var tm_slidestoscroll_1200 = 5;
			var tm_slidestoscroll_768  = 3;
			var tm_slidestoscroll_479  = 2;
			var tm_slidestoscroll_0    = 1;
			if( jQuery(this).data('tm-slidestoscroll')=='1' ){  // slides to scroll
				var tm_slidestoscroll      = 1;
				var tm_slidestoscroll_1200 = 1;
				var tm_slidestoscroll_768  = 1;
				var tm_slidestoscroll_479  = 1;
				var tm_slidestoscroll_0    = 1;
			}
			
			tm_responsive     = [
				{ breakpoint: 1200, settings: {
					slidesToShow  : 5,
					slidesToScroll: tm_slidestoscroll_1200
				} },
				{ breakpoint: 768, settings: {
					slidesToShow  : 3,
					slidesToScroll: tm_slidestoscroll_768
				} },
				{ breakpoint: 479, settings: {
					slidesToShow  : 2,
					slidesToScroll: tm_slidestoscroll_479
				} },
				{ breakpoint: 0, settings: {
					slidesToShow  : 1,
					slidesToScroll: tm_slidestoscroll_0
				} }
			];
			
		} else if( jQuery(this).hasClass('themetechmount-boxes-col-six') ){
			tm_column         = 6;
			tm_slidestoscroll = 6;
			
			var tm_slidestoscroll_1200 = 6;
			var tm_slidestoscroll_768  = 3;
			var tm_slidestoscroll_479  = 2;
			var tm_slidestoscroll_0    = 1;
			if( jQuery(this).data('tm-slidestoscroll')=='1' ){  // slides to scroll
				var tm_slidestoscroll      = 1;
				var tm_slidestoscroll_1200 = 1;
				var tm_slidestoscroll_768  = 1;
				var tm_slidestoscroll_479  = 1;
				var tm_slidestoscroll_0    = 1;
			}
			
			tm_responsive     = [
				{ breakpoint: 1200, settings: {
					slidesToShow  : 6,
					slidesToScroll: tm_slidestoscroll_1200
				} },
				{ breakpoint: 768, settings: {
					slidesToShow  : 3,
					slidesToScroll: tm_slidestoscroll_768
				} },
				{ breakpoint: 479, settings: {
					slidesToShow  : 2,
					slidesToScroll: tm_slidestoscroll_479
				} },
				{ breakpoint: 0, settings: {
					slidesToShow  : 1,
					slidesToScroll: tm_slidestoscroll_0
				} }
			];
		}
		
		// Fade effect
		var tm_fade = false;
		if( jQuery(this).data('tm-effecttype')=='fade' ){
			tm_fade = true;
		}
		
		
		// Transaction Speed
		var tm_speed = 800;
		if( jQuery.trim( jQuery(this).data('tm-speed') ) != '' ){
			tm_speed = jQuery.trim( jQuery(this).data('tm-speed') );
		}
		
		// Autoplay
		var tm_autoplay = false;
		if( jQuery(this).data('tm-autoplay')=='1' ){
			tm_autoplay = true;
		}
		
		// Autoplay Speed
		var tm_autoplayspeed = 2000;
		if( jQuery.trim( jQuery(this).data('tm-autoplayspeed') ) != '' ){
			tm_autoplayspeed = jQuery.trim( jQuery(this).data('tm-autoplayspeed') );
		}
		
		// Loop
		var tm_loop = false;
		if( jQuery.trim( jQuery(this).data('tm-loop') ) == '1' ){
			tm_loop = true;
		}
		
		// Dots
		var tm_dots = false;
		if( jQuery.trim( jQuery(this).data('tm-dots') ) == '1' ){
			tm_dots = true;
		}
		
		// Next / Prev navigation
		var tm_nav = false;
		if( jQuery.trim( jQuery(this).data('tm-nav') ) == '1' || jQuery.trim( jQuery(this).data('tm-nav') ) == 'above' ){
			tm_nav = true;
		}
		
		// Center mode
		var tm_centermode = false;
		if( jQuery.trim( jQuery(this).data('tm-centermode') ) == '1' ){
			tm_centermode = true;
		}
		
		// Pause on Focus
		var tm_pauseonfocus = false;
		if( jQuery.trim( jQuery(this).data('tm-pauseonfocus') ) == '1' ){
			tm_pauseonfocus = true;
		}
		
		// Pause on Hover
		var tm_pauseonhover = false;
		if( jQuery.trim( jQuery(this).data('tm-pauseonhover') ) == '1' ){
			tm_pauseonhover = true;
		}
				
		// RTL
		var tm_rtl = false;
		if( jQuery('body').hasClass('rtl') ){
			tm_rtl = true;
		}
		
		jQuery('.themetechmount-boxes-row-wrapper > div', this).removeClass (function (index, css) {
			return (css.match (/(^|\s)col-\S+/g) || []).join(' ');
		});
				
		console.log(tm_responsive);
		
		//jQuery('.themetechmount-boxes', this).slick({
		jQuery('.themetechmount-boxes-row-wrapper', this).slick({
			/*vertical         : tm_vertical,
			verticalSwiping  : tm_vertical,*/
			fade             : tm_fade,
			speed            : tm_speed,
			centerMode       : tm_centermode,
			pauseOnFocus     : tm_pauseonfocus,
			pauseOnHover     : tm_pauseonhover,
			slidesToShow     : tm_column,
			slidesToScroll   : tm_slidestoscroll,
			autoplay         : tm_autoplay,
			autoplaySpeed    : tm_autoplayspeed,
			rtl              : tm_rtl,
			dots             : tm_dots,
			pauseOnDotsHover : false,
			arrows           : tm_nav,
			adaptiveHeight   : false,
			infinite         : tm_loop,
			responsive       : tm_responsive
  
		});
	});
	
	// Next button in heading area
	jQuery(".tm-slick-arrow.tm-slick-next", this ).on('click', function(){
		jQuery('.themetechmount-boxes-row-wrapper', jQuery(this).closest('.themetechmount-boxes-view-carousel') ).slick('slickNext');
	});
	
	// Pre button in heading area
	jQuery(".tm-slick-arrow.tm-slick-prev", this).on('click', function(){
		jQuery('.themetechmount-boxes-row-wrapper', jQuery(this).closest('.themetechmount-boxes-view-carousel') ).slick('slickPrev');
	});
	
	// Testimonials Slick view
	jQuery('.themetechmount-boxes-view-slickview,.themetechmount-boxes-view-slickview-leftimg .themetechmount-boxes-view-slickview-bottomimg').each(function(){
		
		// Fade effect
		var tm_fade = false;
		if( jQuery(this).data('tm-effecttype')=='fade' ){
			tm_fade = true;
		}
		
		// Transaction Speed
		var tm_speed = 800;
		if( jQuery.trim( jQuery(this).data('tm-speed') ) != '' ){
			tm_speed = jQuery.trim( jQuery(this).data('tm-speed') );
		}
		
		// Autoplay
		var tm_autoplay = false;
		if( jQuery(this).data('tm-autoplay')=='1' ){
			tm_autoplay = true;
		}
		
		// Autoplay Speed
		var tm_autoplayspeed = 2000;
		if( jQuery.trim( jQuery(this).data('tm-autoplayspeed') ) != '' ){
			tm_autoplayspeed = jQuery.trim( jQuery(this).data('tm-autoplayspeed') );
		}
		
		// Loop
		var tm_loop = false;
		if( jQuery.trim( jQuery(this).data('tm-loop') ) == '1' ){
			tm_loop = true;
		}
		
		// Dots
		var tm_dots = false;
		if( jQuery.trim( jQuery(this).data('tm-dots') ) == '1' ){
			tm_dots = true;
		}
		
		// Next / Prev navigation
		var tm_nav = false;
		if( jQuery.trim( jQuery(this).data('tm-nav') ) == '1' ){
			tm_nav = true;
		}
			
		var testinav 	= jQuery('.testimonials-nav', this);
		var testiinfo 	= jQuery('.testimonials-info', this);
		
		// Info
		jQuery('.testimonials-info', this).slick({
			fade			: tm_fade,
			arrows			: tm_nav,
			asNavFor		: testinav,
			adaptiveHeight	: true,
			speed			: tm_speed,
			autoplay		: tm_autoplay,
			autoplaySpeed	: tm_autoplayspeed,
			infinite		: tm_loop,
		});
		// Navigation
	   jQuery('.testimonials-nav', this).slick({
			slidesToShow	: 1,
			asNavFor		: testiinfo,
			centerMode		: true,
			centerPadding	: 0,
			focusOnSelect	: true,
			autoplay		: tm_autoplay,
			autoplaySpeed	: tm_autoplayspeed,
			speed			: tm_speed,
			arrows			: tm_nav,
			dots			: tm_dots,
			variableWidth	: true,
			infinite		: tm_loop,
		});
	});
	
	/*------------------------------------------------------------------------------*/
	/* One Page setting
	/*------------------------------------------------------------------------------*/	
	if( jQuery('body').hasClass('themetechmount-one-page-site') ){
		var sections = jQuery('.tm-row, #tm-header-slider'),
		nav = jQuery('.mega-menu-wrap, div.nav-menu'),
		nav_height = jQuery('#site-navigation').data('sticky-height')-1;
		
		jQuery(window).on('scroll', function () {
			if(typeof jQuery(this) != 'undefined'){
								
				var cur_pos = jQuery(this).scrollTop(); 
				sections.each(function() {
											
					var top = jQuery(this).offset().top - (nav_height+2),
					bottom = top + jQuery(this).outerHeight(); 
		
					if (cur_pos >= top && cur_pos <= bottom) {
		
						if( typeof jQuery(this) != 'undefined' && typeof jQuery(this).attr('id')!='undefined' && jQuery(this).attr('id')!='' ){
							
							console.log('55555555555555');
							
							
							var mainThis = jQuery(this);							
							nav.find('a').removeClass('mega-current-menu-item mega-current_page_item current-menu-ancestor current-menu-item current_page_item');						
							jQuery(this).addClass('mega-current-menu-item mega-current_page_item current-menu-ancestor current-menu-item current_page_item');
							var arr = mainThis.attr('id');							
							// Applying active class
							nav.find('a').parent().removeClass('mega-current-menu-item mega-current_page_item current-menu-ancestor current-menu-item current_page_item');
							nav.find('a').each(function(){
								var menuAttr = jQuery(this).attr('href').split('#')[1];						
								if( menuAttr == arr ){
									jQuery(this).parent().addClass('mega-current-menu-item mega-current_page_item current-menu-ancestor current-menu-item current_page_item');
								}
							})
						}
					}
				});
			}
		});
		
		nav.find('a').on('click', function () {
			var $el = jQuery(this), 
			id = $el.attr('href');
			var arr=id.split('#')[1];	  
			jQuery('html, body').animate({
				scrollTop: jQuery('#'+ arr).offset().top - nav_height
			}, 500);  
			return false;
		});
		
	}
		
} ); // END of  document.ready

function fixtech_logMarginPadding(){
	/**************/
	jQuery('.wpb_column').each(function(){
		if( jQuery(this).hasClass('tm-left-span') ){
			
			// Getting width and padding
			var margin     = jQuery(this).parent().css("padding-left").replace("px", "");
			margin         = parseInt(margin);
			var elewidth   = jQuery(this).css("width").replace("px", "");
			elewidth       = parseInt(elewidth);
			var leftmargin = margin + elewidth;
			var after_inlinecss  = '';
			var before_inlinecss = '';
			// Generating random class
			var randomclass = Math.floor((Math.random() * 1000000) + 1);
			randomclass     = 'fixtech-random-class-' + randomclass;
			
			// adding class to this element
			jQuery(this).addClass(randomclass);
			after_inlinecss += 'padding-left: '+leftmargin+'px;';
			
			
			/* * Background Image * */
			if( jQuery('.vc_column-inner', this).css('background-image')!='none' ){
				var bgimage = jQuery('.vc_column-inner', this).css('background-image');
				jQuery('.vc_column-inner', this).css('background-image','none', '!important');				
				after_inlinecss += 'background-image: '+bgimage+';';
			}
			
			/* * Background Color * */
			if( jQuery('.vc_column-inner', this).css('background-color')!='' || jQuery('.vc_column-inner', this).css('background-color')!='inherit' ){
				var bgcolor = jQuery('.vc_column-inner', this).css('background-color');
				before_inlinecss += 'background-color: '+bgcolor+';';
			}			
			
			// Now adding inline style in HEAD tag
			if( after_inlinecss!='' || before_inlinecss!='' ){
				jQuery( "head" ).append( '<style>.'+randomclass+':after{'+after_inlinecss+'} .'+randomclass+':before{'+before_inlinecss+'} .tm-left-span .vc_column-inner{background-image:none !important;}</style>' );
			}
		}
	});
}

function fixtech_logMarginPadding_right(){
	/**************/
	jQuery('.wpb_column').each(function(){
		if( jQuery(this).hasClass('tm-right-span') ){
			
			// Getting width and padding
			var margin     = jQuery(this).parent().css("padding-right").replace("px", "");
			margin         = parseInt(margin);
			var elewidth   = jQuery(this).css("width").replace("px", "");
			elewidth       = parseInt(elewidth);
			var leftmargin = margin + elewidth;
			var after_inlinecss  = '';
			var before_inlinecss = '';
			// Generating random class
			var randomclass = Math.floor((Math.random() * 1000000) + 1);
			randomclass     = 'fixtech-random-class-' + randomclass;
			
			// adding class to this element
			jQuery(this).addClass(randomclass);
			after_inlinecss += 'padding-right: '+leftmargin+'px;';
			
			
			/* * Background Image * */
			if( jQuery('.vc_column-inner', this).css('background-image')!='none' ){
				var bgimage = jQuery('.vc_column-inner', this).css('background-image');
				jQuery('.vc_column-inner', this).css('background-image','none', '!important');				
				after_inlinecss += 'background-image: '+bgimage+';';
			}
			
			/* * Background Color * */
			if( jQuery('.vc_column-inner', this).css('background-color')!='' || jQuery('.vc_column-inner', this).css('background-color')!='inherit' ){
				var bgcolor = jQuery('.vc_column-inner', this).css('background-color');
				console.log('bgcolor: '+bgcolor);
				before_inlinecss += 'background-color: '+bgcolor+';';
			}
						
			// Now adding inline style in HEAD tag
			if( after_inlinecss!='' || before_inlinecss!='' ){
				jQuery( "head" ).append( '<style>.'+randomclass+':after{'+after_inlinecss+'} .'+randomclass+':before{'+before_inlinecss+'} .tm-right-span .vc_column-inner{background-image:none !important;}</style>' );
			}
				
		}
	});
}

jQuery(window).load(function(){

	"use strict";
	
	//fixtech_logMarginPadding();
	
	
	/*------------------------------------------------------------------------------*/
	/* Hide pre-loader
	/*------------------------------------------------------------------------------*/
	function themetechmount_preloader_fade_out(){ jQuery( '.tm-page-loader-wrapper' ).fadeOut( 1000 ); }
	if ( jQuery( '.tm-page-loader-wrapper' ).length > 0 ) {
		setTimeout(themetechmount_preloader_fade_out, 100);
	}

	// Timeline view function
	if ( jQuery( '.tm-timeline' ).length > 0 ) {
		jQuery( '.tm-timeline' ).smTimeline();
	}
	
	/*------------------------------------------------------------------------------*/
	/* Floating Bar code
	/*------------------------------------------------------------------------------*/
	
	themetechmount_hide_gmap();
	
	// Top btn click event
	jQuery(".themetechmount-fbar-btn").on('click', function(){		
		if( jQuery(this).closest('.themetechmount-fbar-main-w').hasClass('themetechmount-fbar-position-default') ){
			// Fbar top position
			if( jQuery('.themetechmount-fbar-box-w').css('display')=='none' ){
				jQuery('.tm-fbar-open-icon', this).fadeOut();
				jQuery('.tm-fbar-close-icon', this).fadeIn();
				
				jQuery('.themetechmount-fbar-box-w').slideDown();
			} else {
				jQuery('.tm-fbar-open-icon', this).fadeIn();
				jQuery('.tm-fbar-close-icon', this).fadeOut();
				
				jQuery('.themetechmount-fbar-box-w').slideUp();
			}
		} else {
			// Fbar right position
			console.log('fbar right position');
		}		
		
		return false;
	});	
		
	// Right btn click event
	jQuery('.tm-fbar-close, .themetechmount-fbar-btn, .tm-float-overlay').on('click', function(){
		jQuery('.themetechmount-fbar-box-w').toggleClass('animated');
		jQuery('.tm-float-overlay').toggleClass('animated');
		jQuery('.themetechmount-fbar-btn').toggleClass('animated');		
	});

	/*------------------------------------------------------------------------------*/
	/* Hide page-loader on load.
	/*------------------------------------------------------------------------------*/
	jQuery('#pageoverlay').fadeOut(500);
		
	/*------------------------------------------------------------------------------*/
	/* IsoTope
	/*------------------------------------------------------------------------------*/
	var $container = jQuery('.portfolio-wrapper');
	$container.isotope({
		filter: '*',
		animationOptions: {
			duration: 750,
			easing: 'linear',
			queue: false,
		}
	});
	jQuery('nav.portfolio-sortable-list ul li a').on('click', function(){
		var selector = jQuery(this).attr('data-filter');
		$container.isotope({
			filter: selector,
			animationOptions: {
				duration: 750,
				easing: 'linear',
				queue: false,
			}
		});
		// Selected class
		jQuery('nav.portfolio-sortable-list').find('a.selected').removeClass('selected');
		jQuery(this).addClass('selected'); 
		return false;
	});
	
	/*------------------------------------------------------------------------------*/
	/* Nivo Slider
	/*------------------------------------------------------------------------------*/
	if( jQuery('.themetechmount-slider-wrapper .nivoSlider').length>0 ){
		jQuery('.themetechmount-slider-wrapper .nivoSlider').nivoSlider();
	}

	/*------------------------------------------------------------------------------*/
	/* Flex Slider
	/*------------------------------------------------------------------------------*/
	
	/** ABOVE CODE IS NOT IN USED. WE CREATED NEW CODE PLEASE SEE BELOW. **/
	if( jQuery('.tm-flexslider').length > 0 ){
		jQuery('.tm-flexslider').flexslider({
			animation   : "slide",
			controlNav  : true,
			//controlNav  : "thumbnails",
			directionNav: false,
			start: function(){
				if ( jQuery( '.tm-timeline' ).length > 0 ) { jQuery( '.tm-timeline' ).smTimeline(); console.log('Calling smTimeline() after flex'); }
			}
		});
	}
	
	jQuery('.tm-slick-carousel').slick({
		autoplay: true,
		arrows: false,
		dots: true
	});
		 
	/*------------------------------------------------------------------------------*/
	/* Enables menu toggle for small screens.
	/*------------------------------------------------------------------------------*/ 
	 
	( function() {
		var nav = jQuery( '#site-navigation' ), button, menu;
		if ( ! nav )
			return;

		button = nav.find( '.menu-toggle' );
		if ( ! button )
			return;

		// Hide button if menu is missing or empty.
		menu = nav.find( '.nav-menu' );
		if ( ! menu || ! menu.children().length ) {
			button.hide();
			return;
		}

		jQuery( '.menu-toggle' ).on( 'click.fixtech', function() {
			nav.toggleClass( 'toggled-on' );
		} );
	} )();
	
	/*------------------------------------------------------------------------------*/
	/* Add plus icon in menu
	/*------------------------------------------------------------------------------*/ 
	
	jQuery( "#site-navigation .nav-menu > li.menu-item-has-children, #site-navigation div.nav-menu > ul > li.page_item_has_children, .tm-mmmenu-override-yes #navbar #site-navigation .mega-menu-wrap .mega-menu.mega-menu-horizontal > li.mega-menu-item-has-children" ).append( "<span class='righticon'><i class='tmicon-fa-plus-square'></i></span>" );
	
		
	jQuery('#site-header-menu #site-navigation div.nav-menu > ul > li:has(ul), .tm-mmmenu-override-yes #site-header-menu #site-navigation .mega-menu-wrap > ul > li:has(ul)').append("<span class='righticon'><i class='fa fa-angle-down'></i></span>");
		
		
	jQuery('.tm-mmmenu-override-yes #site-navigation .mega-menu-wrap > ul > li.menu-item-language ul').addClass("mega-sub-menu");		
	jQuery('.tm-mmmenu-override-yes #navbar #site-navigation .mega-menu-wrap .mega-menu.mega-menu-horizontal > li.menu-item-language > a').show();
	
	
	jQuery('.menu li.current-menu-item').parents('li.mega-menu-megamenu').addClass('mega-current-menu-ancestor');	
	if (!jQuery('body').hasClass("tm-header-invert")) {	
	//alert("f");
		jQuery( ".nav-menu > li:eq(-2), #site-header-menu #site-navigation div.mega-menu-wrap ul.mega-menu.mega-menu-horizontal > li:eq(-2)" ).addClass( "lastsecond" );
		jQuery( ".nav-menu > li:eq(-1), #site-header-menu #site-navigation div.mega-menu-wrap ul.mega-menu.mega-menu-horizontal > li:eq(-1)" ).addClass( "last" );	
	}
	
	/*------------------------------------------------------------------------------*/
	/* Responsive Menu
	/*------------------------------------------------------------------------------*/
	jQuery('.righticon').on('click', function() {
		if(jQuery(this).siblings('.sub-menu, .children, .mega-sub-menu').hasClass('open')){
			jQuery(this).siblings('.sub-menu, .children, .mega-sub-menu').removeClass('open');
			jQuery( 'i', jQuery(this) ).removeClass('fa fa-minus-square').addClass('fa fa-angle-down');
		} else {
			jQuery(this).siblings('.sub-menu, .children, .mega-sub-menu').addClass('open');			
			jQuery( 'i', jQuery(this) ).removeClass('fa fa-angle-down').addClass('fa fa-angle-up');
		}
		return false;
 	});
	
	/*------------------------------------------------------------------------------*/
	/* Responsive Menu : Open by clicking on the menu text too
	/*------------------------------------------------------------------------------*/
	jQuery('.righticon').each(function() {
		var mainele = this;
		if( jQuery( mainele ).prev().prev().length > 0 ){
			if( jQuery( mainele ).prev().prev().attr('href')=='#' ){
				jQuery( mainele ).prev().prev().on('click', function(){
					jQuery( mainele ).trigger( "click" );
				});
			}
		}
	});
	
	/*------------------------------------------------------------------------------*/
	/* Blog masonry view for 2, 3 and 4 columns
	/*------------------------------------------------------------------------------*/
	themetechmount_blogmasonry();

		jQuery(".themetechmount-fbar-content-wrapper").perfectScrollbar({
			suppressScrollX:true,
			includePadding:true
		});


}); // END of window.load

jQuery(window).resize(function() {
	
	/*------------------------------------------------------------------------------*/
	/* Equal Height Div load
	/*------------------------------------------------------------------------------*/	
	equalheight('.tm-equalheightdiv  .wpb_column.vc_column_container');
	
	
	/*------------------------------------------------------------------------------*/
	/*  Timeline view
	/*------------------------------------------------------------------------------*/	
	
	setTimeout(function() {
		jQuery( '.tm-timeline' ).smTimeline();
	}, 100);
	
	
	/*------------------------------------------------------------------------------*/
	/* onResize: Set height of boxes inside row-column view of Blog and Portfolio
	/*------------------------------------------------------------------------------*/
	if( jQuery('.themetechmount-testimonial-box' ).length > 0 ){
		setHeight('.themetechmount-testimonial-box.col-lg-4.col-sm-6.col-md-4');
		setHeight('.themetechmount-testimonial-box.col-lg-6.col-sm-6.col-md-6');
		setHeight('.themetechmount-testimonial-box.col-lg-3.col-sm-6.col-md-3');
	}
	
	/*------------------------------------------------------------------------------*/
	/* Call header sticky function
	/*------------------------------------------------------------------------------*/
	themetechmount_sticky();
		
	
});  // END of window.resize