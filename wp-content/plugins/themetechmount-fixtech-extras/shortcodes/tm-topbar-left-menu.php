<?php
// [tm-topbar-left-menu]
if( !function_exists('themetechmount_sc_topbarleftmenu') ){
function themetechmount_sc_topbarleftmenu( $atts, $content=NULL ){
	$return = '';
	if( has_nav_menu('themetechmount-topbar-left-menu') ){
		$return .= wp_nav_menu( array( 'theme_location' => 'themetechmount-topbar-left-menu', 'menu_class' => 'topbar-nav-menu', 'container' => false, 'echo' => false ) );
	}
	return $return;
}
}
add_shortcode( 'tm-topbar-left-menu', 'themetechmount_sc_topbarleftmenu' );