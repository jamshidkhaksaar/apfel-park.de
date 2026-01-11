<?php
if ( ! defined( 'ABSPATH' ) ) {
	die( '-1' );
}

// [tm-icon type="fontawesome" size="small" bgcolor="grey" align="center" roundborder="yes"]
if( !function_exists('themetechmount_sc_icon') ){
function themetechmount_sc_icon( $atts, $content=NULL ){
	
	$return = '';
	
	if( function_exists('vc_map') ){
		
		global $tm_sc_params_icon;
		
		$options_list = themetechmount_create_options_list($tm_sc_params_icon);
		
		extract( shortcode_atts( 
			$options_list
		, $atts ) );
		
		
		
		// Icon class
		$iconClass = isset( ${'icon_' . $type} ) ? esc_attr( ${'icon_' . $type} ) : 'fa fa-adjust';
				
		
		// Enqueue needed icon font.
		themetechmount_vc_icon_element_fonts_enqueue( $type );
		
		// Builing URL array
		$url = themetechmount_vc_build_link( $link );
		
		
		
		// class according to background style
		$has_style = false;
		if ( strlen( $background_style ) > 0 && $background_style != 'none' )  {
			$has_style = true;
			if ( false !== strpos( $background_style, 'outline' ) ) {
				$background_style .= ' tm-vc_icon_element-outline'; // if we use outline style it is border in css
			} else {
				$background_style .= ' tm-vc_icon_element-background';
			}
		}
		
		
		// main element class
		$main_element_class   = array();
		$main_element_class[] = 'tm-vc_icon_element-align-'. esc_attr( $align );
		$main_element_class[] = ($has_style) ? ' tm-vc_icon_element-have-style' : '' ;
		
		// CSS Animation
		if( ! empty( $css_animation ) ) {
			$main_element_class[] = themetechmount_getCSSAnimation( $css_animation );
		}
		// Extra class
		if ( ! empty( $el_class ) ) {
			$main_element_class[] = $el_class;
		}
		
		// VC custom class
		if ( ! empty( $css ) ) {
			$main_element_class[] = themetechmount_vc_shortcode_custom_css_class( $css );
		}
		
		// inner element class
		$inner_element_class   = array();
		$inner_element_class[] = ($has_style) ? ' tm-vc_icon_element-have-style-inner' : '' ;
		$inner_element_class[] = 'tm-vc_icon_element-color-'. esc_attr( $color );
		$inner_element_class[] = 'tm-vc_icon_element-size-'. esc_attr( $size );
		$inner_element_class[] = 'tm-vc_icon_element-style-'. esc_attr( $background_style );
		$inner_element_class[] = 'tm-vc_icon_element-background-color-'. esc_attr( $background_color );
		
		
		// Custom color style	
		$custom_color_style = ('custom'===$color) ? 'style="color:' . esc_attr( $custom_color ) . ' !important"' : '' ;
		
		
		
		
		
		// innder div custom style
		$style = '';
		if ( 'custom' === $background_color ) {
			if ( false !== strpos( $background_style, 'outline' ) ) {
				$style = 'border-color:' . $custom_background_color;
			} else {
				$style = 'background-color:' . $custom_background_color;
			}
		}
		$style = $style ? ' style="' . esc_attr( $style ) . '"' : '';

		
		
		// A tag link
		$atag = '';
		if ( strlen( $link ) > 0 && strlen( $url['url'] ) > 0 ) {
			$atag = '<a class="tm-vc_icon_element-link" href="' . esc_attr( $url['url'] ) . '" title="' . esc_attr( $url['title'] ) . '" target="' . ( strlen( $url['target'] ) > 0 ? esc_attr( $url['target'] ) : '_self' ) . '"></a>';
		}
		
		
		
		
		
		$return = '<div class="tm-vc_icon_element tm-vc_icon_element-outer '. implode(' ', $main_element_class) .'"><div class="tm-vc_icon_element-inner '. implode(' ', $inner_element_class) .'" '. $style .'><span class="tm-vc_icon_element-icon '. $iconClass .'" '. $custom_color_style .'></span>'. $atag .'</div></div>';
		
		
	} else {
		$return .= '<!-- Visual Composer plugin not installed. Please install it to make this shortcode work. -->';
	}
	
	return $return;
	
}
}
add_shortcode( 'tm-icon', 'themetechmount_sc_icon' );