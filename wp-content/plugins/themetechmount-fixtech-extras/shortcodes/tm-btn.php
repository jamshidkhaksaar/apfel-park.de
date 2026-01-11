<?php
if ( ! defined( 'ABSPATH' ) ) {
	die( '-1' );
}

// [tm-btn type="fontawesome" size="small" bgcolor="grey" align="center" roundborder="yes"]
if( !function_exists('themetechmount_sc_btn') ){
function themetechmount_sc_btn( $atts, $content=NULL ) {
	
	$return = '';
	
	if( function_exists('vc_map') ){
		
		global $tm_sc_params_btn;
		$options_list   = themetechmount_create_options_list($tm_sc_params_btn);
		
		extract( shortcode_atts( 
			$options_list
		, $atts ) );
		
		
		
		$styles         = array();
		$button_classes = array();
		$icon_wrapper   = false;
		$colors         = array(
			'blue' => '#5472d2',
			'turquoise' => '#00c1cf',
			'pink' => '#fe6c61',
			'violet' => '#8d6dc4',
			'peacoc' => '#4cadc9',
			'chino' => '#cec2ab',
			'mulled-wine' => '#50485b',
			'vista-blue' => '#75d69c',
			'orange' => '#f7be68',
			'sky' => '#5aa1e3',
			'green' => '#6dab3c',
			'juicy-pink' => '#f4524d',
			'sandy-brown' => '#f79468',
			'purple' => '#b97ebb',
			'black' => '#2a2a2a',
			'grey' => '#ebebeb',
			'white' => '#ffffff',
		);
		
		
		//parse link
		$link = ( '||' === $link ) ? '' : $link;
		$link = themetechmount_vc_build_link( $link );
		$use_link = false;
		$a_href = $a_title = $a_target = $a_rel = '';
		
		if ( strlen( $link['url'] ) > 0 ) {
			$use_link = true;
			$a_href = $link['url'];
			$a_title = $link['title'];
			$a_target = $link['target'];
			$a_rel = ( !empty($link['rel']) ) ? $link['rel'] : '' ;
		}

		
		// CSS classes in DIV
		$css_class   = array();
		$css_class[] = 'tm-vc_btn3-container';
		
		
		// button align class
		if( !empty($align) ){
			$css_class[] = 'vc_btn3-' . $align;
		}
		
		
		
		// extra class
		if( !empty($el_class) ){
			$css_class[] = $el_class;
		}
		
		
		
		
		// CSS animation class
		if( !empty($css_animation) ){
			$css_animation = themetechmount_getCSSAnimation( $css_animation );
			$css_class[] = themetechmount_getCSSAnimation( $css_animation );
		}
		
		
		

		
		
		$wrapper_classes = array(
			'tm-vc_btn3-container',
			themetechmount_getExtraClass( $el_class ),
			themetechmount_getCSSAnimation( $css_animation ),
			'tm-vc_btn3-' . $align,
		);
		
		
		
		$button_classes = array(
			'tm-vc_general',
			'tm-vc_btn3',
			'tm-vc_btn3-size-' . $size,
			'tm-vc_btn3-shape-' . $shape,
			'tm-vc_btn3-style-' . $style,
			'tm-vc_btn3-weight-' . $font_weight,
		);
		
		
		// Text style - adding outline class to set all text color
		if( $style=='text' ){
			//$button_classes[] = 'tm-vc_btn3-style-outline';
		}
		
		
		// Button Title
		$button_html = $title;
		if ( '' === trim( $title ) ) {
			$button_classes[] = 'tm-vc_btn3-o-empty';
			$button_html = '<span class="tm-vc_btn3-placeholder">&nbsp;</span>';
		}
		
		
		
		if ( 'true' === $button_block && 'inline' !== $align ) {
			$button_classes[] = 'tm-vc_btn3-block';
		}
		if ( 'true' === $add_icon ) {
			$button_classes[] = 'tm-vc_btn3-icon-' . $i_align;
			themetechmount_vc_icon_element_fonts_enqueue( $i_type );

			if ( isset( ${'i_icon_' . $i_type} ) ) {
				if ( 'pixelicons' === $i_type ) {
					$icon_wrapper = true;
				}
				$icon_class = ${'i_icon_' . $i_type};
			} else {
				$icon_class = 'fa fa-adjust';
			}
			
			if ( $icon_wrapper==true ) {
				$icon_html = '<i class="tm-vc_btn3-icon"><span class="tm-vc_btn3-icon-inner ' . esc_attr( $icon_class ) . '"></span></i>';
			} else {
				$icon_html = '<i class="tm-vc_btn3-icon ' . esc_attr( $icon_class ) . '"></i>';
			}

			if ( 'left' === $i_align ) {
				$button_html = $icon_html . ' ' . $button_html;
			} else {
				$button_html .= ' ' . $icon_html;
			}

		}
		
		
		
		
		
		/*****************/
		

		
			
		if ( 'custom' === $style ) {
			if ( $custom_background ) {
				$styles[] = tm_vc_get_css_color( 'background-color', $custom_background );
			}

			if ( $custom_text ) {
				$styles[] = tm_vc_get_css_color( 'color', $custom_text );
			}

			if ( ! $custom_background && ! $custom_text ) {
				$button_classes[] = 'tm-vc_btn3-color-grey';
			}
		} elseif ( 'outline-custom' === $style ) {
			if ( $outline_custom_color ) {
				$styles[] = tm_vc_get_css_color( 'border-color', $outline_custom_color );
				$styles[] = tm_vc_get_css_color( 'color', $outline_custom_color );
				$attributes[] = 'onmouseleave="this.style.borderColor=\'' . $outline_custom_color . '\'; this.style.backgroundColor=\'transparent\'; this.style.color=\'' . $outline_custom_color . '\'"';
			} else {
				$attributes[] = 'onmouseleave="this.style.borderColor=\'\'; this.style.backgroundColor=\'transparent\'; this.style.color=\'\'"';
			}

			$onmouseenter = array();
			if ( $outline_custom_hover_background ) {
				$onmouseenter[] = 'this.style.borderColor=\'' . $outline_custom_hover_background . '\';';
				$onmouseenter[] = 'this.style.backgroundColor=\'' . $outline_custom_hover_background . '\';';
			}
			if ( $outline_custom_hover_text ) {
				$onmouseenter[] = 'this.style.color=\'' . $outline_custom_hover_text . '\';';
			}
			if ( $onmouseenter ) {
				$attributes[] = 'onmouseenter="' . implode( ' ', $onmouseenter ) . '"';
			}

			if ( ! $outline_custom_color && ! $outline_custom_hover_background && ! $outline_custom_hover_text ) {
				$button_classes[] = 'tm-vc_btn3-color-inverse';

				foreach ( $button_classes as $k => $v ) {
					if ( 'tm-vc_btn3-style-outline-custom' === $v ) {
						unset( $button_classes[ $k ] );
						break;
					}
				}
				$button_classes[] = 'tm-vc_btn3-style-outline';
			}
		} elseif( 'gradient' === $style || 'gradient-custom' === $style ) {
			
			$gradient_color_1 = $colors[$gradient_color_1];
			$gradient_color_2 = $colors[$gradient_color_2];

			$button_text_color = "#fff";
			if('gradient-custom' === $style ){
				$gradient_color_1 = $gradient_custom_color_1;
				$gradient_color_2 = $gradient_custom_color_2;
				$button_text_color = $gradient_text_color;
			}

			$gradient_css = array();
			$gradient_css[] = 'color: ' . $button_text_color;
			$gradient_css[] = 'border: none';
			$gradient_css[] = 'background-color: ' . $gradient_color_1;
			$gradient_css[] = 'background-image: -webkit-linear-gradient(left, ' . $gradient_color_1 . ' 0%, ' . $gradient_color_2 . ' 50%,' . $gradient_color_1 . ' 100%)';
			$gradient_css[] = 'background-image: linear-gradient(to right, ' . $gradient_color_1 . ' 0%, ' . $gradient_color_2 . ' 50%,' . $gradient_color_1 . ' 100%)';
			$gradient_css[] = '-webkit-transition: all .2s ease-in-out';
			$gradient_css[] = 'transition: all .2s ease-in-out';
			$gradient_css[] = 'background-size: 200% 100%';

			// hover css
			$gradient_css_hover = array();
			$gradient_css_hover[] = 'color: ' . $button_text_color;
			$gradient_css_hover[] = 'background-color: ' . $gradient_color_2;
			$gradient_css_hover[] = 'border: none';
			$gradient_css_hover[] = 'background-position: 100% 0';

			$uid = uniqid();
			$return .= '<style type="text/css">.tm-vc_btn3-style-' . $style . '.tm-vc_btn-gradient-btn-' . $uid . ':hover{' . implode( ';',
					$gradient_css_hover ) . ';' . '}</style>';
			$return .= '<style type="text/css">.tm-vc_btn3-style-' . $style . '.tm-vc_btn-gradient-btn-' . $uid . '{' . implode( ';',
					$gradient_css ) . ';' . '}</style>';
			$button_classes[] = 'tm-vc_btn-gradient-btn-' . $uid;
			$attributes[] = 'data-vc-gradient-1="' . $gradient_color_1 . '"';
			$attributes[] = 'data-vc-gradient-2="' . $gradient_color_2 . '"';
		} else {
			$button_classes[] = 'tm-vc_btn3-color-' . $color;
		}

		if ( $styles ) {
			$attributes[] = 'style="' . implode( ' ', $styles ) . '"';
		}

		$class_to_filter = implode( ' ', array_filter( $wrapper_classes ) );
		$class_to_filter .= vc_shortcode_custom_css_class( $css, ' ' );
		$css_class       = trim( $class_to_filter );

		if ( $button_classes ) {
			$button_classes = implode( ' ', $button_classes );
			$attributes[] = 'class="' . trim( $button_classes ) . '"';
		}

		if ( isset($use_link) ) {
			$attributes[] = 'href="' . esc_url( trim( $a_href ) ) . '"';
			$attributes[] = 'title="' . esc_attr( trim( $a_title ) ) . '"';
			if ( ! empty( $a_target ) ) {
				$attributes[] = 'target="' . esc_attr( trim( $a_target ) ) . '"';
			}
		}

		$attributes = implode( ' ', $attributes );

		
		// button code
		if ( isset($use_link) ) {
			$btn_code_html = '<a ' . $attributes . '>' . $button_html . '</a>';
		} else {
			$btn_code_html = '<button ' . $attributes . '>' . $button_html . '</button>';
		}
		
		$return .= '
		<div class="'. trim( esc_attr( $css_class ) ) .'">'. 
		$btn_code_html .'</div>';// adding extra enter at start of div to add space between two buttons. 
	
	} else {
		$return .= '<!-- Visual Composer plugin not installed. Please install it to make this shortcode work. -->';
	}
	
	return $return;
	
}
}
add_shortcode( 'tm-btn', 'themetechmount_sc_btn' );