<?php
// [tm-heading tag="h1" text="This is heading text"]
if( !function_exists('themetechmount_sc_heading') ){
function themetechmount_sc_heading( $atts, $content=NULL ){
	
	$return = '';
	
	if( function_exists('vc_map') ){
		
		global $tm_sc_params_heading;
		$options_list = themetechmount_create_options_list($tm_sc_params_heading);
		
		extract( shortcode_atts(
			$options_list
		, $atts ) );
		
		// Getting a unique class name applied by the Custom CSS box (via "css_editor") and also custom class name via "el_class".
		$css_class = '';
		if( !empty($css) ){
			$css_class = vc_shortcode_custom_css_class( $css, ' ' );
		}
		
		
		// CSS Animation
		if( ! empty( $css_animation ) ) {
			$css_class .= ' ' . themetechmount_getCSSAnimation( $css_animation );
		}
		
		
		// Custom Class
		if( ! empty( $el_class ) ) {
			$css_class .= ' ' . esc_attr($el_class);
		}
				
		// Reverse heading
		if( $overlay_subheading == 'true' ){
			$css_class .= 'tm-overlay-subheading';
		}
		
		$ctaShortcode = '[tm-cta';
		foreach( $options_list as $key=>$val ){
			if( trim( ${$key} )!=''  ){
				$ctaShortcode .= ' '.$key.'="'.${$key}.'" ';
			}
		}
		$ctaShortcode .= ' add_button="no" i_css_animation="" css="" css_animation=""]'.$content.'[/tm-cta]';

		
		if( !empty($h2)!='' ) {
			
			$cta = do_shortcode($ctaShortcode);
		
			// Changing header order if reverser order
			
			
			$return .= '<div class="tm-element-heading-wrapper tm-heading-inner tm-element-align-'.$txt_align.' tm-seperator-'.$seperator.' tm-heading-style-'.$heading_style.' '.$css_class.'">';
			$return .= $cta;
			$return .= '</div> <!-- .tm-element-heading-wrapper container --> ';
			
			
			
			/******************************************/
			// Inline css
			global $themetechmount_inline_css;
			if( empty($themetechmount_inline_css) ){
				$themetechmount_inline_css = '';
			}
			if( !empty($css) ){
				$themetechmount_inline_css .= $css; // Custom CSS style like padding, margin etc.
			}
			
			/******************************************/
			
		}
		
		
	} else {
		$return .= '<!-- Visual Composer plugin not installed. Please install it to make this shortcode work. -->';
	}
		
	
	return $return;
}
}
add_shortcode( 'tm-heading', 'themetechmount_sc_heading' );