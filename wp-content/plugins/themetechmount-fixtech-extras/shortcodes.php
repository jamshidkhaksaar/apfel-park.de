<?php


/*
 * Shortcode list and their calls - Depends on Visual Composer
 */
$shortcodeList = array(
	'tm-blogbox',
	'tm-btn',
	'tm-cta',
	'tm-clientsbox',
	'tm-contactbox',
	'tm-custom-heading',
	'tm-heading',
	'tm-facts-in-digits',
	'tm-heading',
	'tm-icon',
	'tm-icontext',
	'tm-wpml-language-switcher',
	'tm-icon-separator',
	'tm-portfoliobox',
	'tm-servicesbox',
	'tm-eventsbox',
	'tm-servicebox',
	'tm-list',
	'tm-teambox',
	'tm-testimonialbox',
	'tm-twitterbox',
	'tm-socialbox',
	'tm-progress-bar',
	'tm-team-details-single',	
	'tm-current-year',
	'tm-social-links',
	'tm-site-tagline',
	'tm-site-title',
	'tm-site-url',
	'tm-footermenu',
	'tm-topbar-left-menu',
	'tm-topbar-right-menu',
	'tm-logo',
	'tm-dropcap',
	'tm-skincolor',
	'tm-pricelistbox',
	'tm-servicebox',
	'tm-processbox',
	'tm-pricing-table',
);
//if( function_exists('vc_map') && class_exists('WPBMap') ){
	foreach( $shortcodeList as $shortcode ){
		if( file_exists(get_template_directory() . '/inc/shortcodes/'.$shortcode.'.php') ){
			include_once( get_template_directory() . '/inc/shortcodes/'.$shortcode.'.php');
		} else {
			require_once TMTE_DIR . 'shortcodes/'.$shortcode.'.php';
		}
	}
//}