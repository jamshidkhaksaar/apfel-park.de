<?php
// [tm-topbar-right-menu]
if( !function_exists('themetechmount_sc_topbarrightmenu') ){
function themetechmount_sc_topbarrightmenu( $atts, $content=NULL ){
	$return = '';
	if( has_nav_menu('themetechmount-topbar-right-menu') ){
		$return .= wp_nav_menu( array( 'theme_location' => 'themetechmount-topbar-right-menu', 'menu_class' => 'topbar-nav-menu', 'container' => false, 'echo' => false ) );
	}
	return $return;
}
}
add_shortcode( 'tm-topbar-right-menu', 'themetechmount_sc_topbarrightmenu' );