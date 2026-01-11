<?php
// [tm-site-tagline]
if( !function_exists('themetechmount_sc_site_tagline') ){
function themetechmount_sc_site_tagline( $atts, $content=NULL ){
	return get_bloginfo('description');
}
}
add_shortcode( 'tm-site-tagline', 'themetechmount_sc_site_tagline' );