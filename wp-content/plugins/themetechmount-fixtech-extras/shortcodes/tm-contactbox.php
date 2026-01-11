<?php
// [tm-contactbox]
if( !function_exists('themetechmount_sc_contactbox') ){
function themetechmount_sc_contactbox( $atts, $content=NULL ){
	
	$return = '';
	
	if( function_exists('vc_map') ){
		
		global $tm_sc_params_contactbox;
		$options_list = themetechmount_create_options_list($tm_sc_params_contactbox);
		
		extract( shortcode_atts(
			$options_list
		, $atts ) );
		
		$class = array( 'fixtech_contact_widget_wrapper', 'themetechmount_vc_contact_wrapper' );
		
		
		// CSS Animation
		if ( !empty( $css_animation ) ) {
			$class[] = themetechmount_getCSSAnimation( $css_animation );
		}
		
		// Extra Class
		if( !empty($el_class) ){
			$class[] = $el_class;
		}
		
		// VC custom class
		if ( ! empty( $css ) ) {
			$class[] = themetechmount_vc_shortcode_custom_css_class( $css );
		}
		
		
		$class = implode(' ', $class );
		
		$return = '<ul class="' . $class . '">';
		if( trim($address)!='' ) {
			$return .= '<li class="themetechmount-contact-address  tm-fixtech-icon-location-pin">' . themetechmount_wp_kses($address) . '</li>';
		}
		if( trim($phone)!='' ) {
			$return .= '<li class="themetechmount-contact-phonenumber tm-fixtech-icon-mobile">'.themetechmount_wp_kses($phone).'</li>';
		}
		if( trim($email)!='' ) {
			$return .= '<li class="themetechmount-contact-email tm-fixtech-icon-comment-1"><a href="mailto:'.trim($email).'">'.trim($email).'</a></li>';
		}
		if( trim($website)!='' ) {
			$return .= '<li class="themetechmount-contact-website tm-fixtech-icon-world"><a href="'.esc_url(themetechmount_addhttp($website)).'">'.esc_url($website).'</a></li>';
		}
		if( trim($time)!='' ) {
			$return .= '<li class="themetechmount-contact-time tm-fixtech-icon-clock">' . themetechmount_wp_kses($time) . '</li>';
		}
		$return .= '</ul>';
		
	} else {
		$return .= '<!-- Visual Composer plugin not installed. Please install it to make this shortcode work. -->';
	}
	
	return $return;
}
}
add_shortcode( 'tm-contactbox', 'themetechmount_sc_contactbox' );