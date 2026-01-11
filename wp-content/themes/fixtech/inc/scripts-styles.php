<?php

/* For security */
if ( !defined( 'ABSPATH' ) ) {
	die( 'No direct access allowed' );
}

/**
 * Login page CSS script
 */
if( !function_exists('themetechmount_login_stylesheet') ){
function themetechmount_login_stylesheet() {
    wp_enqueue_style( 'fixtech-login-style', get_template_directory_uri() . '/style-login.min.css' );
}
}
add_action( 'login_enqueue_scripts', 'themetechmount_login_stylesheet' );


/*
 *  Check if MIN css or not
 */
if( !function_exists('themetechmount_min_css') ){
function themetechmount_min_css(){
	global $fixtech_theme_options;
	
	// Checking if MIN enabled
	if(!is_admin()) {
		if( isset($fixtech_theme_options['minify']) && $fixtech_theme_options['minify']==true ){
			define('TM_MIN', '.min');
		} else {
			define('TM_MIN', '');
		}
	}
	else {
		define('TM_MIN', '.min');	
	}
}
}
add_action( 'init', 'themetechmount_min_css' );


/**
 * Enqueue scripts and styles for the front end.
 *
 * @since Fixtech 1.0
 *
 * @return void
 */
if( !function_exists('fixtech_scripts_styles') ){
function fixtech_scripts_styles() {
	global $fixtech_theme_options;
	/*
	 * Adds JavaScript to pages with the comment form to support
	 * sites with threaded comments (when in use).
	 */
	$thread_comments_option = get_option( 'thread_comments' );
	
	if ( is_singular() && comments_open() && $thread_comments_option ){
		wp_enqueue_script( 'comment-reply' );
	}
	

	// fontawesome
	wp_enqueue_style( 'fontawesome', get_template_directory_uri().'/assets/font-awesome/css/font-awesome.min.css' );
	
	
	// Animsition - Add page translation effect
	if( isset($fixtech_theme_options['pagetranslation']) && $fixtech_theme_options['pagetranslation']!='no'){
		wp_register_script( 'animsition', get_template_directory_uri() . '/assets/animsition/js/jquery.animsition.min.js', array( 'jquery' ), '', true );
		wp_register_style( 'animsition', get_template_directory_uri() . '/assets/animsition/css/animsition.min.css' );
	}
	
	// Perfect Scrollbar
	wp_enqueue_script( 'perfect-scrollbar', get_template_directory_uri() . '/assets/perfect-scrollbar/perfect-scrollbar.jquery.min.js', array( 'jquery' ), '', true );
	wp_enqueue_style( 'perfect-scrollbar', get_template_directory_uri() . '/assets/perfect-scrollbar/perfect-scrollbar.min.css' );
	
	
	// hower.css : Hover effect (we are using min version)
	wp_register_style( 'hover', get_template_directory_uri() . '/assets/hover/hover-min.css' );
	
	// Chris Bracco Tooltip
	wp_enqueue_style( 'chrisbracco-tooltip', get_template_directory_uri() . '/assets/chrisbracco-tooltip/chrisbracco-tooltip.min.css' );
	
	// multi-columns-row
	wp_enqueue_style( 'multi-columns-row', get_template_directory_uri() . '/css/multi-columns-row.css' );
	
	// Select2
	wp_enqueue_script( 'select2', get_template_directory_uri() . '/assets/select2/select2.min.js', array( 'jquery' ), '', true );
	wp_enqueue_style( 'select2', get_template_directory_uri() . '/assets/select2/select2.min.css' );
	
	// IsoTope
	wp_enqueue_script( 'isotope', get_template_directory_uri() . '/assets/isotope/isotope.pkgd.min.js', array( 'jquery' ), '', true );
	
	// jquery-mousewheel
	wp_enqueue_script( 'jquery-mousewheel', get_template_directory_uri() . '/assets/jquery-mousewheel/jquery.mousewheel.min.js', array( 'jquery' ), '', true );
	
	// Flex Slider
	wp_enqueue_script( 'flexslider', get_template_directory_uri() . '/assets/flexslider/jquery.flexslider-min.js', array( 'jquery' ), '', true );
	wp_enqueue_style( 'flexslider', get_template_directory_uri() . '/assets/flexslider/flexslider.css' );
	
	
	// Sticky
	if( !empty($fixtech_theme_options['sticky_header']) && $fixtech_theme_options['sticky_header']=='y' ){
		wp_enqueue_script( 'sticky-kit', get_template_directory_uri() . '/assets/sticky-kit/jquery.sticky-kit.min.js', array( 'jquery' ) , '', true );
	}
	
	// TM Social Icons CSS Library
	wp_enqueue_style( 'tm-fixtech-icons', get_template_directory_uri() . '/assets/tm-fixtech-icons/css/tm-fixtech-icons.css' );
	
	// Extra icons related to different businesses
	wp_enqueue_style( 'themetechmount-fixtech-extra-icons', get_template_directory_uri() . '/assets/themetechmount-fixtech-extra-icons/font/flaticon.css' );
	
	// animate.css
	if ( !wp_style_is( 'animate-css', 'registered' ) ) { // If library is not registered
		wp_register_style( 'animate-css', get_template_directory_uri() . '/assets/animate/animate.min.css' );
	}
	wp_register_script( 'nivo-slider', get_template_directory_uri() . '/assets/nivo-slider/jquery.nivo.slider.pack.js', array( 'jquery' ), '', true );
	wp_register_style( 'nivo-slider-css', get_template_directory_uri() . '/assets/nivo-slider/nivo-slider.css' );
	wp_register_style( 'nivo-slider-theme', get_template_directory_uri() . '/assets/nivo-slider/themes/default/default.css' );
	
	// Numinate plugin
	if ( !wp_script_is( 'waypoints', 'registered' ) ) { // If library is not registered
		wp_register_script( 'waypoints', get_template_directory_uri() . '/assets/waypoints/jquery.waypoints.min.js', array( 'jquery' ), '', true );
	}
	wp_register_script( 'numinate', get_template_directory_uri() . '/assets/numinate/numinate.min.js', array( 'jquery' ), '', true );
	
	// Slick library
	wp_enqueue_script( 'slick', get_template_directory_uri() . '/assets/slick/slick.min.js', array('jquery'), '', true );
	wp_enqueue_style( 'slick', get_template_directory_uri() . '/assets/slick/slick.css' );
	wp_enqueue_style( 'slick-theme', get_template_directory_uri() . '/assets/slick/slick-theme.css', array('slick') );
	
	// PrettyPhoto
	if ( !wp_script_is( 'prettyphoto', 'registered' ) ) { // If library is not registered
		$prettyphoto_js = get_template_directory_uri() . '/assets/prettyphoto/js/jquery.prettyPhoto.js';
		if( file_exists( WP_PLUGIN_URL . '/js_composer/assets/lib/prettyphoto/js/jquery.prettyPhoto.js') ){
			$prettyphoto_js = WP_PLUGIN_URL . '/js_composer/assets/lib/prettyphoto/js/jquery.prettyPhoto.js';
		}
		wp_register_script( 'prettyphoto', $prettyphoto_js, array('jquery') , '', true);
	}
	if ( !wp_style_is( 'prettyphoto', 'registered' ) ) { // If library is not registered
		$prettyphoto_css = get_template_directory_uri() . '/assets/prettyphoto/css/prettyPhoto.css';
		if( file_exists( WP_PLUGIN_URL . '/js_composer/assets/lib/prettyphoto/css/prettyPhoto.css') ){
			$prettyphoto_css = WP_PLUGIN_URL . '/js_composer/assets/lib/prettyphoto/css/prettyPhoto.css';
		}
		wp_register_style( 'prettyphoto', $prettyphoto_css );
	}
	
	// CSSgram
	wp_register_style( 'cssgram', get_template_directory_uri() . '/assets/cssgram/cssgram.min.css' );
	
	// Twemoji Awesome
	wp_register_style( 'twemojiawesome', get_template_directory_uri() . '/assets/twemoji-awesome/twemoji-awesome.css' );
			
	// jquery-circle-progress
	wp_register_script( 'jquery-circle-progress', get_template_directory_uri() . '/assets/jquery-circle-progress/circle-progress.min.js', array('jquery'), '', true );
	
	// Loading prettyPhoto by default
	wp_enqueue_script( 'prettyphoto' );
	wp_enqueue_style( 'prettyphoto' );
	
}
}
add_action( 'wp_enqueue_scripts', 'fixtech_scripts_styles', 10 );


if( !function_exists('fixtech_scripts_styles_14') ){
function fixtech_scripts_styles_14() {
	wp_enqueue_style( 'bootstrap', get_template_directory_uri() . '/css/bootstrap.min.css' );
	wp_enqueue_style( 'multi-columns-row', get_template_directory_uri() . '/css/multi-columns-row.min.css', array('bootstrap') );
	wp_enqueue_style( 'bootstrap-theme', get_template_directory_uri() . '/css/bootstrap-theme.min.css', array('bootstrap') );
	
	if ( file_exists( ABSPATH . 'wp-content/plugins/js_composer/assets/css/js_composer_tta.min.css') ) {
		wp_enqueue_style( 'vc_tta_style',  plugins_url() . '/js_composer/assets/css/js_composer_tta.min.css' );
	}
	
	wp_enqueue_style( 'fixtech-base-style', get_template_directory_uri() . '/css/base'.TM_MIN.'.css', array('bootstrap','bootstrap-theme') );
}
}
add_action( 'wp_enqueue_scripts', 'fixtech_scripts_styles_14', 14 );


if( !function_exists('fixtech_scripts_styles_15') ){
function fixtech_scripts_styles_15() {
	global $fixtech_theme_options;
	$min = TM_MIN;
	if( is_child_theme() ){
		$min = '';
	}
	if( defined( 'WPB_VC_VERSION' ) ){
		wp_enqueue_style( 'fixtech-main-style', get_template_directory_uri() . '/css/main'.TM_MIN.'.css' , array('js_composer_front') );
		wp_register_style( 'fixtech-dark', get_template_directory_uri() . '/css/dark'.TM_MIN.'.css' , array('js_composer_front', 'fixtech-main-style') );  // Dark
	} else {
		wp_enqueue_style( 'fixtech-main-style', get_template_directory_uri() . '/css/main'.TM_MIN.'.css' );
		wp_register_style( 'fixtech-dark', get_template_directory_uri() . '/css/dark'.TM_MIN.'.css' , array( 'fixtech-main-style') );  // Dark
	}
	
	// Service box animation css
	wp_enqueue_style( 'fixtech-servicebox-animation', get_template_directory_uri() . '/css/servicebox-animation'.TM_MIN.'.css', array( 'fixtech-main-style') );
	
	// Load dark.css if dark layout
	if( isset($fixtech_theme_options['inner_background']['background-color']) && trim($fixtech_theme_options['inner_background']['background-color'])!='' && themetechmount_check_dark_color($fixtech_theme_options['inner_background']['background-color']) ){
		wp_enqueue_style('fixtech-dark');
	}
}
}
add_action( 'wp_enqueue_scripts', 'fixtech_scripts_styles_15', 15 );


if( !function_exists('fixtech_scripts_styles_17') ){
function fixtech_scripts_styles_17() {
	// Responsive
	global $fixtech_theme_options;
	
	// Responsive CSS
	wp_enqueue_style( 'fixtech-responsive-style', get_template_directory_uri() . '/css/responsive'.TM_MIN.'.css' );
	
	// Loads JavaScript file with functionality specific to Fixtech.
	if ( wp_script_is( 'wpb_composer_front_js', 'registered' ) ) {
		wp_enqueue_script( 'fixtech-script', get_template_directory_uri() . '/js/functions'.TM_MIN.'.js', array( 'jquery', 'wpb_composer_front_js' ), '1.0', true );
	} else {
		wp_enqueue_script( 'fixtech-script', get_template_directory_uri() . '/js/functions'.TM_MIN.'.js', array( 'jquery' ), '1.0', true );
	}
	
	wp_enqueue_style( 'fixtech-last-checkpoint', get_template_directory_uri() . '/css/fixtech-last-checkpoint.min.css' );
	
	
}
}
add_action( 'wp_enqueue_scripts', 'fixtech_scripts_styles_17', 17 );
function fixtech_enqueue_tailwind() {
    wp_enqueue_style( 'fixtech-tailwind', get_template_directory_uri() . '/assets/css/tailwind-build.css', array(), time() + 2 );
}
add_action( 'wp_enqueue_scripts', 'fixtech_enqueue_tailwind', 99 );
