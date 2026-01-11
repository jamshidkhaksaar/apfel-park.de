<?php
// [tm-icontext icon="phone"]Welcome to site[/icontext]
if( !function_exists('themetechmount_sc_icontext') ){
function themetechmount_sc_icontext( $atts, $content=NULL ){
	extract( shortcode_atts( array(
		'icon'    => '',   // Required
		'package' => 'fa', // Optional
	), $atts ) );
	
	$return = '<span class="themetechmount-icontext"><i class="fa fa-'.$package.'-'.$icon.'"></i> '.do_shortcode($content).'</span>';
	return $return;
}
}
add_shortcode( 'tm-icontext', 'themetechmount_sc_icontext' );
