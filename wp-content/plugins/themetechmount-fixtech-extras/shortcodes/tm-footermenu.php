<?php
// [tm-footermenu]
if( !function_exists('themetechmount_sc_footermenu') ){
function themetechmount_sc_footermenu( $atts, $content=NULL ){
	$return = '';
	if( has_nav_menu('themetechmount-footer-menu') ){
		$return .= wp_nav_menu( array( 'theme_location' => 'themetechmount-footer-menu', 'menu_class' => 'footer-nav-menu', 'container' => false, 'echo' => false ) );
	}
	return $return;
}
}
add_shortcode( 'tm-footermenu', 'themetechmount_sc_footermenu' );