<?php
// [tm-current-year]
if( !function_exists('themetechmount_sc_current_year') ){
function themetechmount_sc_current_year( $atts, $content=NULL ){
	return date("Y");
}
}
add_shortcode( 'tm-current-year', 'themetechmount_sc_current_year' );