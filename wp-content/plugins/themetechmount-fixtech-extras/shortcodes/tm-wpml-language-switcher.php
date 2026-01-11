<?php
// [tm-wpml-language-switcher]
if( !function_exists('themetechmount_sc_wpml_language_switcher') ){
function themetechmount_sc_wpml_language_switcher( $atts ) {
	$return = '';
	if( function_exists('icl_get_languages') ){
		ob_start();
		do_action('icl_language_selector');
		$langDropdown = ob_get_clean();
		$return .= '<div class="tm-wpml-lang-switcher">'.$langDropdown.'</div>';
	}
	return $return;
}
}
add_shortcode( 'tm-wpml-language-switcher', 'themetechmount_sc_wpml_language_switcher' );