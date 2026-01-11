<?php
// [tm-site-title]
if( !function_exists('themetechmount_sc_site_title') ){
function themetechmount_sc_site_title( $atts, $content=NULL ){
	return get_bloginfo('name');
}
}
add_shortcode( 'tm-site-title', 'themetechmount_sc_site_title' );