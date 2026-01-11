<?php



/**** Icon Libraries ****/
function themetechmount_fixtech_enqueue_icon_libraries(){

	// FontAwesome Library
	if ( !wp_style_is( 'font-awesome', 'registered' ) ) { // If library is not registered
		$fontawesome_css = get_template_directory_uri() . '/assets/font-awesome/css/font-awesome.min.css';
		if( file_exists( WP_PLUGIN_URL . '/js_composer/assets/lib/bower/font-awesome/css/font-awesome.min.css') ){
			$fontawesome_css = WP_PLUGIN_URL . '/js_composer/assets/lib/bower/font-awesome/css/font-awesome.min.css';
		}
		wp_register_style( 'font-awesome', $fontawesome_css );
	}

	// Enqueue FontAwesome library for general use (we are using font awesome on single portfolio page)
	wp_enqueue_style( 'font-awesome' );



	// themify
	wp_enqueue_style( 'themify', get_template_directory_uri() . '/assets/themify-icons/themify-icons.css' );



	// vc_linecons
	if ( !wp_style_is( 'vc_linecons', 'registered' ) ) { // If library is not registered
		$linecons_css    = get_template_directory_uri() . '/assets/vc-linecons/vc_linecons_icons.min.css';
		$vc_linecons_css = WP_PLUGIN_URL . '/js_composer/assets/css/lib/vc_linecons/vc_linecons_icons.min.css';
		if( file_exists( $vc_linecons_css ) ){
			$linecons_css = $vc_linecons_css;
		}
		wp_register_style( 'vc_linecons', $linecons_css );
	}



	// vc_openiconic
	if ( !wp_style_is( 'vc_openiconic', 'registered' ) ) { // If library is not registered
		$openiconic_css    = get_template_directory_uri() . '/assets/vc-open-iconic/css/vc-openiconic.min.css';
		$vc_openiconic_css = WP_PLUGIN_URL . '/js_composer/assets/css/lib/vc-open-iconic/vc_openiconic.min.css';
		if( file_exists( $vc_openiconic_css ) ){
			$openiconic_css = $vc_openiconic_css;
		}
		wp_register_style( 'vc_openiconic', $openiconic_css );
	}


	// vc_typicons
	if ( !wp_style_is( 'typicons', 'registered' ) ) { // If library is not registered
		$typicons_css    = get_template_directory_uri() . '/assets/typicons/src/font/typicons.min.css';
		$vc_typicons_css = WP_PLUGIN_URL . '/js_composer/assets/css/lib/typicons/src/font/typicons.min.css';
		if( file_exists( $vc_typicons_css ) ){
			$typicons_css = $vc_typicons_css;
		}
		wp_register_style( 'vc_typicons', $typicons_css );
	}

	// vc_entypo
	if ( !wp_style_is( 'vc_entypo', 'registered' ) ) { // If library is not registered
		$entypo_css    = get_template_directory_uri() . '/assets/vc_entypo/vc_entypo.min.css';
		$vc_entypo_css = WP_PLUGIN_URL . '/js_composer/assets/css/lib/vc_entypo/vc_entypo.min.css';
		if( file_exists( $vc_entypo_css ) ){
			$entypo_css = $vc_entypo_css;
		}
		wp_register_style( 'vc_entypo', $entypo_css );
	}


}
#hook the function to wp_enqueue_scripts
add_action( 'wp_enqueue_scripts', 'themetechmount_fixtech_enqueue_icon_libraries' );








/**
 *  Admin enqueue scripts and styles
 */
function themetechmount_fixtech_admin_scripts_styles() {
	
	
	/* ThemeTechMount Icon Picker - JS files */
	
	// Bootstrap icon picker
	wp_enqueue_script( 'bootstrap', get_template_directory_uri().'/inc/assets/bootstrap/js/bootstrap.min.js', array( 'jquery' ) );
	
	// iconset-fontawesome
	wp_enqueue_script( 'iconset-fontawesome', TMTE_URI . '/vc/themetechmount_iconpicker/iconset-fontawesome.js', array( 'bootstrap' ) );
	
	// iconset-linecons
	wp_enqueue_script( 'iconset-linecons', TMTE_URI . '/vc/themetechmount_iconpicker/iconset-linecons.js', array( 'bootstrap' ) );
	
	// iconset-themify
	wp_enqueue_script( 'iconset-themify', TMTE_URI . '/vc/themetechmount_iconpicker/iconset-themify.js', array( 'bootstrap' ) );
	
	// iconset-themify
	wp_enqueue_script( 'iconset-kw_fixtech', TMTE_URI . '/vc/themetechmount_iconpicker/iconset-kw_fixtech.js', array( 'bootstrap' ) );
	
	
	// Bootstrap icon picker
	wp_enqueue_script( 'bootstrap-iconpicker', get_template_directory_uri().'/inc/assets/bootstrap-iconpicker/js/bootstrap-iconpicker.js', array( 'bootstrap', 'iconset-fontawesome', 'iconset-linecons', 'iconset-themify', 'iconset-kw_fixtech' ) );
	
	
	/* ThemeTechMount Icon Picker - CSS files */
	
	// Bootstrap icon picker - CSS
	wp_enqueue_style( 'bootstrap-iconpicker', get_template_directory_uri() . '/inc/assets/bootstrap-iconpicker/css/bootstrap-iconpicker.min.css' );
	
	// iconset-fontawesome
	wp_enqueue_style( 'fontawesome', get_template_directory_uri().'/assets/font-awesome/css/font-awesome.min.css' );
	
	// iconset-kw_fixtech
	wp_enqueue_style( 'kw_fixtech', get_template_directory_uri().'/assets/themetechmount-fixtech-extra-icons/font/flaticon.css' );
	
	// iconset-fontawesome
	wp_enqueue_style( 'vc_linecons', get_template_directory_uri().'/assets/vc-linecons/vc_linecons_icons.min.css' );
	
	// iconset-themify
	wp_enqueue_style( 'themify', get_template_directory_uri().'/assets/themify-icons/themify-icons.css' );
	
	
	// themify
	wp_enqueue_style( 'themify' );
	
}
add_action( 'admin_enqueue_scripts', 'themetechmount_fixtech_admin_scripts_styles' );




/**** ****/









function themetechmount_iconpicker_settings_field( $settings, $value ) {
	
	$type = ( !empty($settings['settings']['type']) ) ? $settings['settings']['type'] : 'fontawesome' ;
	
	$return = '<div class="themetechmount-iconpicker-wrapper">';
	
	$return .= '<input name="' . esc_attr( $settings['param_name'] ) . '" class="wpb_vc_param_value wpb-textinput themetechmount-iconpicker-input ' .
	esc_attr( $settings['param_name'] ) . ' ' .
	esc_attr( $settings['type'] ) . '_field" type="hidden" value="' . esc_attr( $value ) . '" />';
	
	
	
	$i_value = explode( ' ', $value );
	if( !empty($i_value[1]) ){
		$i_value = $i_value[1];
	} else {
		$i_value = 'fa-anchor';
	}
	
	
	$return .= '
		<!-- icon picker -->
		<div class="tm-ipicker-selector-w">
			<div class="tm-ipicker-selector">
				<span class="tm-ipicker-selected-icon">
					<i class="' . esc_attr( $value ) . '"></i>
				</span>
				<span class="tm-ipicker-selector-button">
					<i class="fip-fa fa fa-arrow-down"></i>
				</span>
			</div>
			<div class="themetechmount-iconpicker-list-w" style="display:none;">
				<div id="tm-ipicker-library-' . esc_attr( $type ) . '" class="themetechmount-iconpicker-list" data-iconset="' . esc_attr( $type ) . '" data-icon="' . esc_attr( $i_value ) . '" role="iconpicker"></div>
			</div>
		</div><!-- .tm-ipicker-selector-w -->
	';
	
	$return .= '</div><!-- .themetechmount-iconpicker-wrapper -->';
	
	return $return; // New button element
}
vc_add_shortcode_param( 'themetechmount_iconpicker', 'themetechmount_iconpicker_settings_field', TMTE_URI . '/vc/themetechmount_iconpicker/themetechmount_iconpicker.js');




