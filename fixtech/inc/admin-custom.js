/**
 *  Admin custom JS file
 */
"use strict";
 
 
// Header Style - Change options based on selected header style on click 
function themetechmount_header_style_change_triggers(){
	
	"use strict";
	
	// Default value
	var header_bg_color               = 'white';
	var header_bg_custom_color        = 'darkgrey';
	var titlebar_background_color	  = 'custom';
	var titlebar_text_color			  = 'white';
	var topbar_right_text			  = '[tm-social-links tooltip="no"]';
	var topbar_left_text			  = '<ul class="top-contact"><li><i class="fa fa-phone"></i>+49 123 456 789</li><li><i class="fa fa-envelope-o"></i>info@example.com</li><li><i class="fa fa-map-marker"></i>Bulls Stadium, California</li></ul>';
	var titlebar_height				  = '283';
	var mainmenufont_color            = '#35382f';
	var topbar_bg_color				  = 'darkgrey';
	var header_height                 = '115';
	var logoimg						  = 'logo.png';
	var logo_max_height				  = '40';
	var mainmenu_active_link_color    = 'skin';
	var stickymainmenufontcolor_color = '#35382f';
	var sticky_header_bg_color        = 'white';
	var dropmenu_background_color     = '#ffffff';
	var dropdownmenufont_color        = '#7d7d7d';
	var header_text      			  = '<a href="#">GET AN APPOINTMENT!</a>';
	var infostack_column_one		  = '<div class="header-icon"> <div class="icon"><i class="themifyicon ti-mobile"></i></div></div><div class="header-content"><h3>Call</h3><h5>+123 4567 8910</h5></div>';
	var infostack_column_two		  = '<div class="header-icon"> <div class="icon"><i class="themifyicon ti-comment-alt"></i></div></div><div class="header-content"><h3>Email</h3><h5>info@example.com</h5></div>';
	var infostack_column_three		  = '<div class="header-icon"> <div class="icon"><i class="themifyicon ti-location-pin"></i></div></div><div class="header-content"><h3>Address</h3><h5> 24 Fifth st, Los Angeles, USA</h5></div>';
	
	jQuery('input[name="fixtech_theme_options[headerstyle]"]').change(function() {
		
		var imgurl = jQuery(this).next().attr('src').split('inc');
		imgurl = imgurl[0]+ 'images/';
		
		console.log(this.value);
		
		if (this.value == 'classic') { // Classic
			jQuery('select[name="fixtech_theme_options[header_bg_color]"]').val(header_bg_color).change();
			jQuery('input[name="fixtech_theme_options[titlebar_background][color]"]').iris('color', titlebar_background_color);  // 
			jQuery('select[name="fixtech_theme_options[titlebar_text_color]"]').val(titlebar_text_color);
			jQuery('input[name="fixtech_theme_options[titlebar_height]"').val(titlebar_height);  // Titlebar height
			jQuery('input[name="fixtech_theme_options[show_topbar]"]').prop('checked', false);  // Show topbar
			jQuery('input[name="fixtech_theme_options[header_search]"]').prop('checked', true);  // Show header search
			jQuery('input[name="fixtech_theme_options[mainmenufont][color]"').iris('color', mainmenufont_color);  // 
			jQuery('input[name="fixtech_theme_options[header_height]"]').val(header_height);  // Header Height
			jQuery('input[name="fixtech_theme_options[logoimg][id]"]').val('');
			jQuery('input[name="fixtech_theme_options[logoimg][thumb-url]"]').val( imgurl+logoimg );
			jQuery('input[name="fixtech_theme_options[logoimg][full-url]').val( imgurl+logoimg );
			jQuery('input[name="fixtech_theme_options[logo_max_height]"]').val(logo_max_height);  //
			jQuery('select[name="fixtech_theme_options[mainmenu_active_link_color]"]').val(mainmenu_active_link_color).change(); // Select
			jQuery('input[name="fixtech_theme_options[stickymainmenufontcolor]"]').iris('color', stickymainmenufontcolor_color);  // 
			jQuery('select[name="fixtech_theme_options[sticky_header_bg_color]"]').val(sticky_header_bg_color).change();		
			jQuery('input[name="fixtech_theme_options[dropmenu_background][color]"]').iris('color', dropmenu_background_color);  // Dropdown Menu color
			jQuery('input[name="fixtech_theme_options[dropdownmenufont][color]"]').iris('color', dropdownmenufont_color);  // Dropdown Menu color
			jQuery('textarea[name="fixtech_theme_options[header_text]"]').val('');  //
				
		} else if ( this.value == 'classic-highlight' ) {  // Overlay
			jQuery('select[name="fixtech_theme_options[header_bg_color]"]').val(header_bg_color).change();
			jQuery('input[name="fixtech_theme_options[titlebar_background][color]"]').iris('color', titlebar_background_color);  // 
			jQuery('select[name="fixtech_theme_options[titlebar_text_color]"]').val(titlebar_text_color);
			jQuery('input[name="fixtech_theme_options[titlebar_height]"').val(titlebar_height);  // Titlebar height
			jQuery('input[name="fixtech_theme_options[show_topbar]"]').prop('checked', false);  // Show topbar
			jQuery('input[name="fixtech_theme_options[header_search]"]').prop('checked', true);  // Show header search
			jQuery('input[name="fixtech_theme_options[mainmenufont][color]"').iris('color', mainmenufont_color);  // 
			jQuery('input[name="fixtech_theme_options[header_height]"]').val(header_height);  // Header Height
			jQuery('input[name="fixtech_theme_options[logoimg][id]"]').val('');
			jQuery('input[name="fixtech_theme_options[logoimg][thumb-url]"]').val( imgurl+'logo-white.png' );
			jQuery('input[name="fixtech_theme_options[logoimg][full-url]').val( imgurl+'logo-white.png' );
			jQuery('input[name="fixtech_theme_options[logo_max_height]"]').val(logo_max_height);  //
			jQuery('select[name="fixtech_theme_options[mainmenu_active_link_color]"]').val(mainmenu_active_link_color).change(); // Select
			jQuery('input[name="fixtech_theme_options[stickymainmenufontcolor]"]').iris('color', stickymainmenufontcolor_color);  // 
			jQuery('select[name="fixtech_theme_options[sticky_header_bg_color]"]').val(sticky_header_bg_color).change();		
			jQuery('input[name="fixtech_theme_options[dropmenu_background][color]"]').iris('color', dropmenu_background_color);  // Dropdown Menu color
			jQuery('input[name="fixtech_theme_options[dropdownmenufont][color]"]').iris('color', dropdownmenufont_color);  // Dropdown Menu color
			jQuery('textarea[name="fixtech_theme_options[header_text]"]').val('');  //

		} else if ( this.value == 'classic-overlay' || this.value == 'overlay' ) {  // Overlay
			jQuery('select[name="fixtech_theme_options[header_bg_color]"]').val('custom').change();
			jQuery('input[name="fixtech_theme_options[titlebar_background][color]"]').iris('color', titlebar_background_color);  // 
			jQuery('select[name="fixtech_theme_options[titlebar_text_color]"]').val(titlebar_text_color);
			jQuery('input[name="fixtech_theme_options[show_topbar]"]').prop('checked', true);  // Show topbar
			jQuery('input[name="fixtech_theme_options[titlebar_height]"').val('450');  // Titlebar height
			jQuery('input[name="fixtech_theme_options[header_search]"]').prop('checked', true);  // Show header search
			jQuery('input[name="fixtech_theme_options[mainmenufont][color]"').iris('color', '#ffffff');   // 
			jQuery('select[name="fixtech_theme_options[topbar_bg_color]"]').val('custom').change();
			jQuery('input[name="fixtech_theme_options[header_height]"]').val('99');  // Header Height
			jQuery('input[name="fixtech_theme_options[logoimg][id]"]').val('');
			jQuery('input[name="fixtech_theme_options[logoimg][thumb-url]"]').val( imgurl+'logo-white.png' );
			jQuery('input[name="fixtech_theme_options[logoimg][full-url]').val( imgurl+'logo-white.png' );
			jQuery('input[name="fixtech_theme_options[logo_max_height]"]').val(logo_max_height);  //
			jQuery('select[name="fixtech_theme_options[mainmenu_active_link_color]"]').val(mainmenu_active_link_color).change(); // Select
			jQuery('input[name="fixtech_theme_options[stickymainmenufontcolor]"]').iris('color', '#ffffff');// 
			jQuery('select[name="fixtech_theme_options[sticky_header_bg_color]"]').val('darkgrey').change();
			jQuery('input[name="fixtech_theme_options[dropmenu_background][color]"]').iris('color', dropmenu_background_color); // Dropdown Menu color
			jQuery('input[name="fixtech_theme_options[dropdownmenufont][color]"]').iris('color', dropdownmenufont_color);  
			jQuery('textarea[name="fixtech_theme_options[header_text]"]').val('');  //

		} else if (this.value == 'infostack') {
			jQuery('select[name="fixtech_theme_options[header_bg_color]"]').val(header_bg_color).change();
			jQuery('input[name="fixtech_theme_options[titlebar_background][color]"]').iris('color', titlebar_background_color);  // 
			jQuery('select[name="fixtech_theme_options[titlebar_text_color]"]').val(titlebar_text_color);
			jQuery('select[name="fixtech_theme_options[topbar_text_color]"]').val('dark');
			jQuery('textarea[name="fixtech_theme_options[topbar_left_text]"]').val('<ul class="top-contact"><li>Your Trusted 24 Hours Service Provider!</li></ul>'); 
			jQuery('textarea[name="fixtech_theme_options[topbar_right_text]"]').val('<ul class="top-contact"><li><strong><i class="fa fa-phone tm-skincolor"></i>Talk To Expert :</strong> <span class="tel-no">+49 123 456 789</span></li></ul>[tm-social-links tooltip="no"]'); //
			jQuery('input[name="fixtech_theme_options[titlebar_height]"').val('417');  // Titlebar height
			jQuery('input[name="fixtech_theme_options[show_topbar]"]').prop('checked', true);  // Show topbar
			jQuery('input[name="fixtech_theme_options[header_search]"]').prop('checked', true);  // Show header search
			jQuery('input[name="fixtech_theme_options[mainmenufont][color]"').iris('color', '#ffffff');// 
			jQuery('select[name="fixtech_theme_options[topbar_bg_color]"]').val('grey').change();
			jQuery('input[name="fixtech_theme_options[header_height]"]').val('156');  // Header Height
			jQuery('input[name="fixtech_theme_options[logoimg][id]"]').val('');
			jQuery('input[name="fixtech_theme_options[logoimg][thumb-url]"]').val( imgurl+'logo.png' );
			jQuery('input[name="fixtech_theme_options[logoimg][full-url]').val( imgurl+'logo.png' );
			jQuery('input[name="fixtech_theme_options[logo_max_height]"]').val('48');   //  //
			jQuery('select[name="fixtech_theme_options[mainmenu_active_link_color]"]').val(mainmenu_active_link_color).change(); // Select
			jQuery('input[name="fixtech_theme_options[stickymainmenufontcolor]"]').iris('color', '#ffffff');// 
			jQuery('select[name="fixtech_theme_options[sticky_header_bg_color]"]').val('darkgrey').change();
			jQuery('select[name="fixtech_theme_options[infostack_phone_text]"]').val('').change();
			jQuery('textarea[name="fixtech_theme_options[infostack_column_one]"]').val(infostack_column_one);
			jQuery('textarea[name="fixtech_theme_options[infostack_column_two]"]').val(infostack_column_two);
			jQuery('textarea[name="fixtech_theme_options[infostack_column_three]"]').val(infostack_column_three);
			jQuery('select[name="fixtech_theme_options[header_menu_bg_color]"]').val('darkgrey').change();
			jQuery('select[name="fixtech_theme_options[sticky_header_menu_bg_color]"]').val('darkgrey').change();
			
			jQuery('input[name="fixtech_theme_options[dropmenu_background][color]"]').iris('color', dropmenu_background_color);  // Dropdown Menu color
			jQuery('input[name="fixtech_theme_options[dropdownmenufont][color]"]').iris('color', dropdownmenufont_color);  // Dropdown Menu color
			
		} else if (this.value == 'classicinfo') {
			jQuery('select[name="fixtech_theme_options[header_bg_color]"]').val(header_bg_color).change();
			jQuery('input[name="fixtech_theme_options[show_topbar]"]').prop('checked', true);  // Show topbar
			jQuery('input[name="fixtech_theme_options[header_search]"]').prop('checked', true);  // Show header search
			jQuery('select[name="fixtech_theme_options[topbar_bg_color]"]').val('darkgrey').change();
			jQuery('input[name="fixtech_theme_options[header_height]"]').val('115');  // Header Height
			jQuery('input[name="fixtech_theme_options[logo_max_height]"]').val('40');   //
			jQuery('textarea[name="fixtech_theme_options[topbar_left_text]"]').val('<ul class="top-contact tm-highlight-left"><li><i class="fa fa-phone"></i><strong>Client Services:</strong> +49 123 456 789</li></ul>'); 
			jQuery('textarea[name="fixtech_theme_options[topbar_right_text]"]').val('<ul class="top-contact"><li><i class="fa fa-envelope-o"></i> <strong>Email: </strong><a href="mailto:info@example.com.com">info@example.com</a></li></ul>[tm-social-links tooltip="no"]');  //
			jQuery('input[name="fixtech_theme_options[mainmenufont][color]"').iris('color', mainmenufont_color);  // 
			jQuery('select[name="fixtech_theme_options[mainmenu_active_link_color]"]').val(mainmenu_active_link_color).change();
			jQuery('input[name="fixtech_theme_options[titlebar_height]"').val('283'); // Titlebar height
			jQuery('input[name="fixtech_theme_options[stickymainmenufontcolor]"').iris('color', stickymainmenufontcolor_color);  // 
			jQuery('input[name="fixtech_theme_options[logoimg][id]"]').val('');
			jQuery('input[name="fixtech_theme_options[logoimg][thumb-url]"]').val( imgurl+'logo.png' );
			jQuery('input[name="fixtech_theme_options[logoimg][full-url]').val( imgurl+'logo.png' );		
			jQuery('input[name="fixtech_theme_options[dropmenu_background][color]"]').iris('color', '#ffffff');  // Dropdown Menu color
			jQuery('input[name="fixtech_theme_options[dropdownmenufont][color]"]').iris('color', dropdownmenufont_color);   // Dropdown Menu color
			jQuery('select[name="fixtech_theme_options[sticky_header_bg_color]"]').val(sticky_header_bg_color).change();
			jQuery('textarea[name="fixtech_theme_options[infostack_phone_text]"]').val('');
		} else if (this.value == 'toplogo') {
			jQuery('select[name="boldman_theme_options[header_bg_color]"]').val(header_bg_color).change();
			jQuery('input[name="boldman_theme_options[show_topbar]"]').prop('checked', true);  // Show topbar
			jQuery('input[name="boldman_theme_options[header_search]"]').prop('checked', false);  // Show header search
			jQuery('select[name="boldman_theme_options[topbar_bg_color]"]').val('skincolor').change();
			jQuery('input[name="boldman_theme_options[header_height]"]').val('150');  // Header Height
			jQuery('input[name="boldman_theme_options[logo_max_height]"]').val('45');   //
			jQuery('textarea[name="boldman_theme_options[topbar_left_text]"]').val('<ul class="top-contact"><li>Your Trusted 24 Hours Service Provider!</li></ul>'); 
			jQuery('textarea[name="boldman_theme_options[topbar_right_text]"]').val('<ul class="top-contact"><li><i class="fa fa-envelope-o"></i> <strong>Email: </strong><a href="mailto:info@example.com.com">info@example.com</a></li></ul>[tm-social-links tooltip="no"]');  //
			jQuery('input[name="boldman_theme_options[titlebar_height]"').val('283'); // Titlebar height
			jQuery('input[name="boldman_theme_options[logoimg][id]"]').val('');
			jQuery('input[name="boldman_theme_options[logoimg][thumb-url]"]').val( imgurl+'logo.png' );
			jQuery('input[name="boldman_theme_options[logoimg][full-url]').val( imgurl+'logo.png' );		
			jQuery('input[name="boldman_theme_options[dropmenu_background][color]"]').iris('color', '#ffffff');  // Dropdown Menu color
			jQuery('input[name="boldman_theme_options[dropdownmenufont][color]"]').iris('color', dropdownmenufont_color);   // Dropdown Menu color
			jQuery('select[name="boldman_theme_options[sticky_header_bg_color]"]').val(sticky_header_bg_color).change();
		}
		
	});
}
 

/**
 *  Codestar Framework : themetechmount_background JS
 */
jQuery.fn.TM_CSFRAMEWORK_BG_IMAGE_UPLOADER = function($) {
    return this.each(function() {

	var $this      = jQuery(this),
		$add       = $this.find('.cs-add'),
		$preview   = $this.find('.cs-image-preview'),
		$noimgtext = $this.find('.tm-cs-background-heading-noimg'),
		$closeicon = $this.find('.tm-cs-remove'),
		$remove    = $this.find('.cs-remove'),
		$input     = $this.find('input.tm-background-image'),
		$inputid   = $this.find('input.tm-background-imageid'),
		$img       = $this.find('img'),
		$btntitleadd    = $this.find('.tm-cs-background-text-add-image').text(),
		$btntitlechange = $this.find('.tm-cs-background-text-change-image').text(),
		wp_media_frame;

      $add.on('click', function( e ) {

        e.preventDefault();

        // Check if the `wp.media.gallery` API exists.
        if ( typeof wp === 'undefined' || ! wp.media || ! wp.media.gallery ) {
          return;
        }

        // If the media frame already exists, reopen it.
        if ( wp_media_frame ) {
          wp_media_frame.open();
          return;
        }

        // Create the media frame.
        wp_media_frame = wp.media({
          library: {
            type: 'image'
          }
        });

        // When an image is selected, run a callback.
        wp_media_frame.on( 'select', function() {

          var attachment = wp_media_frame.state().get('selection').first().attributes;
          var thumbnail  = ( typeof attachment.sizes.thumbnail !== 'undefined' ) ? attachment.sizes.thumbnail.url : attachment.url;

          $img.removeClass('hidden');
		  $closeicon.removeClass('hidden');
		  $noimgtext.addClass('hidden');
          $img.attr('src', thumbnail);
          $input.val( attachment.url ).trigger('change');
		  $inputid.val( attachment.id ).trigger('change');
			$add.text($btntitlechange);
        });

        // Finally, open the modal.
        wp_media_frame.open();

      });

      // Remove image
      $remove.on('click', function( e ) {
        e.preventDefault();
        $input.val('').trigger('change');
        $img.addClass('hidden');
		$closeicon.addClass('hidden');
		$noimgtext.removeClass('hidden');
		$add.text($btntitleadd);
      });

    });

  };


/**
 *  Codestar Framework : themetechmount_typography JS
 */
  jQuery.fn.TM_CSFRAMEWORK_TYPOGRAPHY = function() {
    return this.each( function() {

      var typography      = jQuery(this),
          family_select   = typography.find('.cs-typo-family'),
          variants_select = typography.find('.cs-typo-variant'),
          typography_type = typography.find('.cs-typo-font');

      family_select.on('change', function() {

        var _this     = jQuery(this),
            _type     = _this.find(':selected').data('type') || 'custom',
            _variants = _this.find(':selected').data('variants');

        if( variants_select.length ) {

          variants_select.find('option').remove();

          jQuery.each( _variants.split('|'), function( key, text ) {
            variants_select.append('<option value="'+ text +'">'+ text +'</option>');
          });

          variants_select.find('option[value="regular"]').attr('selected', 'selected').trigger('chosen:updated');

        }

        typography_type.val(_type);

      });

    });
  };
  

/**
 *  themetechmount_image 
 */
  jQuery.fn.TM_CSFRAMEWORK_IMAGE_UPLOADER = function() {
    return this.each(function() {

      var $this     = jQuery(this),
          $add      = $this.find('.cs-add'),
          $preview  = $this.find('.cs-image-preview'),
          $remove   = $this.find('.cs-remove'),
          $input    = $this.find('input.tm-cs-imgid'),
		  $thumbimg = $this.find('input.tm-cs-thumburl'),
		  $fullimg  = $this.find('input.tm-cs-fullurl'),
          $img      = $this.find('img'),
          wp_media_frame;

      $add.on('click', function( e ) {

        e.preventDefault();

        // Check if the `wp.media.gallery` API exists.
        if ( typeof wp === 'undefined' || ! wp.media || ! wp.media.gallery ) {
          return;
        }

        // If the media frame already exists, reopen it.
        if ( wp_media_frame ) {
          wp_media_frame.open();
          return;
        }

        // Create the media frame.
        wp_media_frame = wp.media({
          library: {
            type: 'image'
          }
        });

        // When an image is selected, run a callback.
        wp_media_frame.on( 'select', function() {

          var attachment = wp_media_frame.state().get('selection').first().attributes;
          var thumbnail  = ( typeof attachment.sizes.thumbnail !== 'undefined' ) ? attachment.sizes.thumbnail.url : attachment.url;
		  var fullimg    = ( typeof attachment.sizes.full.url !== 'undefined' ) ? attachment.sizes.full.url : '';

          $preview.removeClass('hidden');
          $img.attr('src', thumbnail);
          $input.val( attachment.id ).trigger('change');
		  $fullimg.val( fullimg ).trigger('change');
		  $thumbimg.val( thumbnail ).trigger('change');

        });

        // Finally, open the modal.
        wp_media_frame.open();

      });

      // Remove image
      $remove.on('click', function( e ) {
        e.preventDefault();
        $input.val('').trigger('change');
		$fullimg.val('').trigger('change');
		$thumbimg.val('').trigger('change');
        $preview.addClass('hidden');
      });

    });

  };
  

/**
 *  Titlebar text custom color show/hide
 */ 
function themetechmount_show_hide_titlebar_textcolor(){
	
	var $this      = jQuery( 'select[name="fixtech_theme_options[titlebar_text_color]"]' );
	var $page_this = jQuery( 'select[name="_themetechmount_metabox_group[titlebar_text_color]"]' );
	
	if( $this.length > 0 ){
		if( jQuery($this).val()=='custom' ){
			jQuery( 'input[name="fixtech_theme_options[titlebar_heading_font][color]"]' ).closest('.tm-typography-font-color-w').show();
			jQuery( 'input[name="fixtech_theme_options[titlebar_subheading_font][color]"]' ).closest('.tm-typography-font-color-w').show();
			jQuery( 'input[name="fixtech_theme_options[titlebar_breadcrumb_font][color]"]' ).closest('.tm-typography-font-color-w').show();
		} else {
			jQuery( 'input[name="fixtech_theme_options[titlebar_heading_font][color]"]' ).closest('.tm-typography-font-color-w').hide();
			jQuery( 'input[name="fixtech_theme_options[titlebar_subheading_font][color]"]' ).closest('.tm-typography-font-color-w').hide();
			jQuery( 'input[name="fixtech_theme_options[titlebar_breadcrumb_font][color]"]' ).closest('.tm-typography-font-color-w').hide();
		}
	}
	
	if( $page_this.length > 0 ){
		if( jQuery($page_this).val()=='custom' ){
			jQuery( 'input[name="_themetechmount_metabox_group[titlebar_heading_font][color]"]' ).closest('.tm-typography-font-color-w').show();
			jQuery( 'input[name="_themetechmount_metabox_group[titlebar_subheading_font][color]"]' ).closest('.tm-typography-font-color-w').show();
			jQuery( 'input[name="_themetechmount_metabox_group[titlebar_breadcrumb_font][color]"]' ).closest('.tm-typography-font-color-w').show();
			
		} else {
			jQuery( 'input[name="_themetechmount_metabox_group[titlebar_heading_font][color]"]' ).closest('.tm-typography-font-color-w').hide();
			jQuery( 'input[name="_themetechmount_metabox_group[titlebar_subheading_font][color]"]' ).closest('.tm-typography-font-color-w').hide();
			jQuery( 'input[name="_themetechmount_metabox_group[titlebar_breadcrumb_font][color]"]' ).closest('.tm-typography-font-color-w').hide();
		}
	}		
}
  
 
/**
 *  Titlebar bg custom color show/hide
 */ 
function themetechmount_show_hide_titlebar_bgcolor(){
	
	var $page_this = jQuery( 'select[name="_themetechmount_metabox_group[titlebar_bg_color]"]' );
	
	if( $page_this.length > 0 ){
		if( jQuery($page_this).val()=='custom' ){
			jQuery( 'input[name="_themetechmount_metabox_group[titlebar_background][color]"]' ).closest('.tm-background-color-w').show();
		} else {
			jQuery( 'input[name="_themetechmount_metabox_group[titlebar_background][color]"]' ).closest('.tm-background-color-w').hide();
		}
	}
		
}


/**
 *  ThemetechMount icon picker
 */
function themetechmount_icon_picker(){
	
	if( jQuery('.themetechmount-iconpicker-wrapper').length > 0 ){
		
		jQuery('.themetechmount-iconpicker-wrapper').each(function(){
			
			var mainwrapper = jQuery(this);
			
			// checking if iconpicker already applied
			if( jQuery('.themetechmount-iconpicker-list', mainwrapper ).hasClass('iconpicker') == false ){
				
				// check if click applied
				if( !jQuery( '.tm-ipicker-selector-button', mainwrapper ).hasClass('tm_click_applied') ){
					
					jQuery( '.tm-ipicker-selector-button', mainwrapper ).on('click', function(){
						
						var $btn = jQuery(this);
						if( jQuery( '.themetechmount-iconpicker-list-w', mainwrapper ).css('display')=='none' ){
							
							
							// Apply iconpicker() on click so it will not load the page
							if( !jQuery('.themetechmount-iconpicker-list', mainwrapper ).hasClass('iconpicker') ){
								
								jQuery('.themetechmount-iconpicker-list', mainwrapper ).iconpicker({
									align: 'left', // Only in div tag
									arrowPrevIconClass: 'fa fa-chevron-left',
									arrowNextIconClass: 'fa fa-chevron-right',
									cols: 8,
									icon: jQuery('.themetechmount-iconpicker-list', mainwrapper ).data('icon'),
									iconset: jQuery('.themetechmount-iconpicker-list', mainwrapper ).data('iconset'),
									rows: 5
								});
								jQuery('.themetechmount-iconpicker-list', mainwrapper ).on('change', function(e) {
									jQuery('.tm-ipicker-selected-icon i',mainwrapper).removeClass().addClass( e.icon );
									jQuery('.themetechmount-iconpicker-input',mainwrapper).val(e.icon);
								});
								
							}
							
							jQuery( '.themetechmount-iconpicker-list-w', mainwrapper ).slideDown();
							jQuery( '.tm-ipicker-selector-button i', mainwrapper ).removeClass('fa-arrow-down').addClass('fa-arrow-up');
						} else {
							jQuery( '.themetechmount-iconpicker-list-w', mainwrapper ).slideUp();
							jQuery( '.tm-ipicker-selector-button i', mainwrapper ).removeClass('fa-arrow-up').addClass('fa-arrow-down');
						}
						return false;
					});
					
					
					// adding class so no other click applied
					jQuery( '.tm-ipicker-selector-button', mainwrapper ).addClass('tm_click_applied');
					
				}
			
			
				
				// close when click outside
				jQuery(document).on('click', function(event) { 
					if(!jQuery(event.target).closest('.themetechmount-iconpicker-list-w', mainwrapper ).length) {
						if(jQuery('.themetechmount-iconpicker-list-w', mainwrapper).is(":visible")) {
							jQuery( '.tm-ipicker-selector-button', mainwrapper ).trigger('click');
						}
					}
				});
				
			}
			
		});
		
		jQuery('.tm-ipicker-selector-w' ).each(function(){
			
			// specially for CodeStar element only
			if( jQuery('.themetechmount-iconpicker-element').length > 0 ){
				jQuery('.themetechmount-iconpicker-element').each(function(){
					var wrapper2 = jQuery(this);
					jQuery('.tm-iconpicker-library-selector', wrapper2 ).on('change', function(e){
						
						var curr_library = jQuery('.tm-iconpicker-library-selector', wrapper2).val();
						
						jQuery('.themetechmount-iconpicker-wrapper', wrapper2).each(function(){
							jQuery(this).hide();
							jQuery('.themetechmount-iconpicker-wrapper.tm-iconpicker-'+curr_library, wrapper2).show();
						});
						
					});
					
				});
			};
			
			
			
		});

	}
}
 
 
/**
 *  This is for background with custom color dropdown.. This will will show/hide color picker from the background options.
 */
function themetechmount_show_hide_color_picker_background(){
	
	
	var items = [
		/* ['dropdown_id',         'background_id'], */
		['fbar_bg_color',          'fbar_background'],
		['titlebar_bg_color',      'titlebar_background'],
		['full_footer_bg_color',   'full_footer_bg_all'],
		['first_footer_bg_color',  'first_footer_bg_all'],
		['second_footer_bg_color', 'second_footer_bg_all'],
		['bottom_footer_bg_color', 'bottom_footer_bg_all']
	];
	
	jQuery(items).each(function(n,val){
		
		var dropdown_name   = val[0];
		var background_name = val[1];
		
		var $dropdown_element   = jQuery( 'select[name="fixtech_theme_options['+dropdown_name+']"]' );
		
		// show/hide the color picker on load
		if( $dropdown_element.val()=='custom' ){
			jQuery( 'input[name="fixtech_theme_options['+background_name+'][color]"]' ).closest('.tm-background-color-w').show();
		} else {
			jQuery( 'input[name="fixtech_theme_options['+background_name+'][color]"]' ).closest('.tm-background-color-w').hide();
		}
		
		// on change of the dropdown
		$dropdown_element.change(function() {  // Theme Options
			
			if( jQuery(this).val()=='custom' ){
				jQuery( 'input[name="fixtech_theme_options['+background_name+'][color]"]' ).closest('.tm-background-color-w').show();
			} else {
				jQuery( 'input[name="fixtech_theme_options['+background_name+'][color]"]' ).closest('.tm-background-color-w').hide();
			}
		});
		
	});
	
}


/**
 *  Blog Post Format - Move the Gallery Meta Box to the Gallery Tab content so user can select images directly from Gallery tab.
 */
function themetechmount_gallery_post_format(){
	// moving the gallery meta box after the gallery box
	jQuery("#cfpf-format-gallery-preview").after( jQuery("#_themetechmount_metabox_gallery") );
	
	// hide all box by defualt
	jQuery("#_themetechmount_metabox_gallery").hide();
	
	jQuery("#cfpf-format-gallery-preview").hide();
	jQuery( '#cfpf-format-gallery-preview > label' ).hide();
	jQuery( '#cfpf-format-gallery-preview > .cfpf-gallery-options' ).hide();
	
	
	// show/hide if gallery post format
	if( jQuery('input[name="post_format"]:checked').val() == 'gallery' ){
		jQuery("#_themetechmount_metabox_gallery").show();
	}
	
	jQuery('input[name="post_format"]').change(function() {
		console.log( 'Changed: ' + this.value );
		
		if( this.value == 'gallery' ){
			jQuery("#_themetechmount_metabox_gallery").show();
		} else {
			jQuery("#_themetechmount_metabox_gallery").hide();
		}
		
	});

}


/**
 *  Document Ready Init
 */
jQuery(document).ready( function() {
	
	// stickey header in theme options
	jQuery(".cs-header").stick_in_parent();
	
	// Icon picker in CodeStar framework
	themetechmount_icon_picker();
	
	// When clicking on add group button and the group contains icon picker in it. Specially created for Portfolio List
	jQuery('.cs-field-group').each(function(){
		var groups = jQuery(this);
		jQuery( '.cs-add-group', groups ).on('click', function(){
			setTimeout(function(){
				jQuery('.cs-group:last-child .themetechmount-iconpicker-list', groups ).removeClass('iconpicker');
				themetechmount_icon_picker();
			}, 10);
		});
	});
	
	jQuery('.cs-field-themetechmount_background', this).TM_CSFRAMEWORK_BG_IMAGE_UPLOADER();
	jQuery('.cs-field-themetechmount_typography', this).TM_CSFRAMEWORK_TYPOGRAPHY();
	jQuery('.cs-field-themetechmount_image', this).TM_CSFRAMEWORK_IMAGE_UPLOADER();
	
	
	
	// Titlebar Text Color - Show / Hide color for Text color option
	themetechmount_show_hide_titlebar_textcolor();
	jQuery( 'select[name="fixtech_theme_options[titlebar_text_color]"]' ).change(function() {  // Theme Options
		themetechmount_show_hide_titlebar_textcolor();
	});
	jQuery( 'select[name="_themetechmount_metabox_group[titlebar_text_color]"]' ).change(function() {  // Page Meta Box Option
		themetechmount_show_hide_titlebar_textcolor();
	});
	
	
	// Titlebar BG Color - Show / Hide color for bg color option
	themetechmount_show_hide_titlebar_bgcolor()
	jQuery( 'select[name="_themetechmount_metabox_group[titlebar_bg_color]"]' ).change(function() {  // Page Meta Box Option
		themetechmount_show_hide_titlebar_bgcolor();
	});
	


	/**
	 *  Codestar Framework : themetechmount_skin_color JS
	 */
	jQuery('.cs-field-themetechmount_skin_color').each(function(){
		var $this = jQuery(this);
		jQuery( '.themetechmount-skin-color-list a', $this ).on('click', function() {
			var color = jQuery(this).css('background-color');
			jQuery('.wp-color-picker', $this ).iris('color', color);
			return false;
		});
	});
	
	
	/**
	 *  Add class in page loading option
	 */
	jQuery('*[data-depend-id="loaderimg_1"]').closest('.cs-field-image-select').addClass('tm-pre-loader-option-wrapper');
	jQuery('input[type=radio][name="fixtech_theme_options[loaderimg]"]:checked').closest('label').addClass('tm-pre-loader-option-selected');
	jQuery('input[type=radio][name="fixtech_theme_options[loaderimg]"]').change(function() {
		jQuery('input[type=radio][name="fixtech_theme_options[loaderimg]"]').closest('label').removeClass('tm-pre-loader-option-selected');
		jQuery(this).closest('label').addClass('tm-pre-loader-option-selected');
		return true;
	});
	
	
	// Post formats - Move Gallery meta box in Gallery tab 
	themetechmount_gallery_post_format();
	
	
	/**
	 *  Icon picker init on adding new group in TM Progress Bar
	 */
	if (typeof vc != 'undefined' && typeof vc.atts != 'undefined' ) {
		vc.atts.themetechmount_iconpicker = {
			init: function ( param, $wrapper ) {
				themetechmount_icon_picker();
			}
		};
	}
	
	// on ajax complete
	jQuery( document ).ajaxComplete(function( event, xhr, settings ) {
		themetechmount_icon_picker();
	});
	
	
	/* For all background options - linking dropdown with all color picker for CUSTOM option.. so the color picker will be visiable only when custom color is selected */
	themetechmount_show_hide_color_picker_background();
		
});  // document.ready


/**
 *  Window Load init
 */
jQuery( window ).load(function() {
	
	// Header Styles - change values of some options on change of the header style
	themetechmount_header_style_change_triggers();
	
	
	// Post formats - Open Gallery meta box if closed
	if( jQuery(".js #_themetechmount_metabox_gallery").hasClass('closed') ){
		jQuery(".js #_themetechmount_metabox_gallery button.handlediv").trigger('click');
	}
	
	// Codestar - Remove DISABLED and adding READONLY to the export textarea
	jQuery('textarea[name="_nonce"]').prop("readonly", true);
	jQuery('textarea[name="_nonce"]').removeAttr('disabled');

});  // window.load