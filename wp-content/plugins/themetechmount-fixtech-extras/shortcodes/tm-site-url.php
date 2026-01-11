<?php
// [tm-site-url]
if( !function_exists('themetechmount_sc_site_url') ){
function themetechmount_sc_site_url( $atts, $content=NULL ){
	return site_url();
}
}
add_shortcode( 'tm-site-url', 'themetechmount_sc_site_url' );