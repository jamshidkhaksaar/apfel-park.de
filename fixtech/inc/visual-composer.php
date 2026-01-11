<?php

/* ------------------------- */
/* --- VC Shared Library --- */
require_once get_template_directory().'/inc/vc/vc-shared.php';

/* ------------------------- */
/* --- VC Shared Library --- */
require_once get_template_directory().'/inc/vc/vc-extras.php';

/* ------------------------- */
/* ---   VC Templates    --- */
require_once get_template_directory().'/inc/vc/vc-templates.php';

/* -------------------- */
/* --- Element List --- */

// tm_custom_heading
add_action( 'vc_after_init', 'themetechmount_vc_custom_element_custom_heading' );
function themetechmount_vc_custom_element_custom_heading(){ get_template_part('inc/vc/element-tm','custom-heading'); }

// themetechmount_icon
add_action( 'vc_after_init', 'themetechmount_vc_custom_element_icon' );
function themetechmount_vc_custom_element_icon(){ get_template_part('inc/vc/element-tm','icon'); }

// themetechmount_btn
add_action( 'vc_after_init', 'themetechmount_vc_custom_element_btn' );
function themetechmount_vc_custom_element_btn(){ get_template_part('inc/vc/element-tm','btn'); }

// themetechmount_cta
add_action( 'vc_after_init', 'themetechmount_vc_custom_element_cta' );
function themetechmount_vc_custom_element_cta(){ get_template_part('inc/vc/element-tm','cta'); }

// themetechmount_heading
add_action( 'vc_after_init', 'themetechmount_vc_custom_element_heading' );
function themetechmount_vc_custom_element_heading(){ get_template_part('inc/vc/element-tm','heading'); }

// themetechmount_servicebox
add_action( 'vc_after_init', 'themetechmount_vc_custom_element_servicebox' );
function themetechmount_vc_custom_element_servicebox(){ get_template_part('inc/vc/element-tm','servicebox'); }

// themetechmount_progress_bar
add_action( 'vc_after_init', 'themetechmount_vc_progress_bar' );
function themetechmount_vc_progress_bar(){ get_template_part('inc/vc/element-tm','progress-bar'); }


// themetechmount_blogbox
add_action( 'vc_after_init', 'themetechmount_vc_custom_element_blogbox' );
function themetechmount_vc_custom_element_blogbox(){ get_template_part('inc/vc/element-tm','blogbox'); }

// themetechmount_portfoliobox
add_action( 'vc_after_init', 'themetechmount_vc_custom_element_portfoliobox' );
function themetechmount_vc_custom_element_portfoliobox(){ get_template_part('inc/vc/element-tm','portfoliobox'); }

// themetechmount_portfoliobox
add_action( 'vc_after_init', 'themetechmount_vc_custom_element_servicesbox' );
function themetechmount_vc_custom_element_servicesbox(){ get_template_part('inc/vc/element-tm','servicesbox'); }

// themetechmount_teambox
add_action( 'vc_after_init', 'themetechmount_vc_custom_element_teambox' );
function themetechmount_vc_custom_element_teambox(){ get_template_part('inc/vc/element-tm','teambox'); }

// themetechmount_testimonialbox
add_action( 'vc_after_init', 'themetechmount_vc_custom_element_testimonialbox' );
function themetechmount_vc_custom_element_testimonialbox(){ get_template_part('inc/vc/element-tm','testimonialbox'); }

// themetechmount_clientsbox
add_action( 'vc_after_init', 'themetechmount_vc_custom_element_clientsbox' );
function themetechmount_vc_custom_element_clientsbox(){ get_template_part('inc/vc/element-tm','clientsbox'); }

// themetechmount_eventsbox
if( class_exists('Tribe__Events__Main') ){
	add_action( 'vc_after_init', 'themetechmount_vc_custom_element_eventsbox' );
	function themetechmount_vc_custom_element_eventsbox(){ get_template_part('inc/vc/element-tm','eventsbox'); }
}

// themetechmount_facts_in_digits
add_action( 'vc_after_init', 'themetechmount_vc_custom_element_facts_in_digits' );
function themetechmount_vc_custom_element_facts_in_digits(){ get_template_part('inc/vc/element-tm','facts-in-digits'); }

// themetechmount_twitterbox
if( function_exists('latest_tweets_render') ){
	add_action( 'vc_after_init', 'themetechmount_vc_custom_element_twitterbox' );
	function themetechmount_vc_custom_element_twitterbox(){ get_template_part('inc/vc/element-tm','twitterbox'); }
}

// themetechmount_contactbox
add_action( 'vc_after_init', 'themetechmount_vc_custom_element_contactbox' );
function themetechmount_vc_custom_element_contactbox(){ get_template_part('inc/vc/element-tm','contactbox'); }

// themetechmount_list
add_action( 'vc_after_init', 'themetechmount_vc_custom_element_list' );
function themetechmount_vc_custom_element_list(){ get_template_part('inc/vc/element-tm','list'); }

// themetechmount_socialbox
add_action( 'vc_after_init', 'themetechmount_vc_custom_element_socialbox' );
function themetechmount_vc_custom_element_socialbox(){ get_template_part('inc/vc/element-tm','socialbox'); }

// themetechmount_pricelistbox
add_action( 'vc_after_init', 'themetechmount_vc_custom_element_pricelistbox' );
function themetechmount_vc_custom_element_pricelistbox(){ get_template_part('inc/vc/element-tm','pricelistbox'); }

// tm-pricing-table
add_action( 'vc_after_init', 'themetechmount_vc_custom_element_pricingtable' );
function themetechmount_vc_custom_element_pricingtable(){ get_template_part('inc/vc/element-tm','pricing-table'); }

// tm-processbox
add_action( 'vc_after_init', 'themetechmount_vc_custom_element_static_contentbox' );
function themetechmount_vc_custom_element_static_contentbox(){ get_template_part('inc/vc/element-tm','processbox'); }