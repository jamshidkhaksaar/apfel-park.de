<?php
// [tm-servicebox]
if( !function_exists('themetechmount_sc_servicebox') ){
function themetechmount_sc_servicebox( $atts, $content=NULL ){
	
	$return = '';
	
	if( function_exists('vc_map') ){
		
		global $tm_sc_params_servicebox;
		$options_list = themetechmount_create_options_list($tm_sc_params_servicebox);
		
		extract( shortcode_atts(
			$options_list
		, $atts ) );
		
		
		// We are passing this var to TM-CTA shortcode directly and removing from this Servicebox shortcode as we need custom CSS to be applied directly to tm-cta shortcode
		$css_copy = '';
		
		
		
		$return = $class = $iconcodeleft = $iconcoderight = '';
		
		// If hover effect is enabled
		if( $hover!='' && $hover!='none' ){
			wp_enqueue_style('hover');
		}
		
		
		
		// Icon Position changes
		$add_icon_new = $add_icon;
		$add_icon = 'top'; // by default, icon will be at top
		if( $add_icon_new=='bottom-center' ){
			$add_icon = 'bottom';
		}
		if( $add_icon_new=='left-spacing' ){
			$add_icon = 'left';
		}
		if( $add_icon_new=='right-spacing' ){
			$add_icon = 'right';
		}
		if( $add_icon_new=='before-heading' ){
			$add_icon = 'beforeheading';
		}
		if( $add_icon_new=='after-heading' ){
			$add_icon = 'afterheading';
		}
		if( $add_icon_new=='without-icon' ){
			$add_icon = 'withouticon';
		}	
		
		
		
		
		
		// Service Box class structure
		$tm_sbox_class = array();
		$tm_sbox_class[] = 'tm-sbox';
		$tm_sbox_class[] = 'tm-sbox-iconalign-'.$add_icon_new;
		$tm_sbox_class[] = $hover;
		$tm_sbox_class[] = 'tm-sbox-bgcolor-' . $bgcolor . ' tm-bgcolor-' . $bgcolor;  // BG Color
		$tm_sbox_class[] = 'tm-sbox-textcolor-' . $textcolor . ' tm-textcolor-' . $textcolor;  // Text Color
		
		// icon size
		if( !empty($i_size) ){
			$tm_sbox_class[] = 	'tm-sbox-isize-' . $i_size;  // Icon size
		}
		
		// icon size
		if( !empty($i_size) ){
			$tm_sbox_class[] = 	'tm-sbox-isize-' . $i_size;  // Icon size
		}
		
		// icon background style
		if( !empty($i_background_style) ){
			$tm_sbox_class[] = 'tm-sbox-istyle-'.$i_background_style;
		}
		
		// Custom div and classes for overlay color if bgimage is set from design options tab
		$tm_smbox_custom_div = '';
		$tm_bgimage			 = false;
		$cssclass 			 = themetechmount_vc_shortcode_custom_css_class($css);
		$tm_sbox_class[] 	 = $cssclass;
		
		// box effect
		if( !empty($box_effect) ){
			$tm_sbox_class[] = 'tm-sbox-effect-'.$box_effect;
		}
		
		// Check if bg image is set
		if( strpos($css, 'url(') !== false ){
			$tm_bgimage		 = true;
			$tm_sbox_class[] = 'tm-bg';
			$tm_sbox_class[] = 'tm-bgimage-yes';
			$tm_smbox_custom_div .= '<div class="tm-sbox-bgimage-layer tm-bgimage-layer"></div>';	
		}
		
		// Check if BG color set
		if( themetechmount_check_if_bg_color_in_css($css)==true || ( !empty($bgcolor) && $bgcolor!='transparent' ) ){
			$tm_sbox_class[] = 'tm-bgcolor-yes';
		}	
		
		if( $tm_bgimage == true ){
			$tm_smbox_custom_div .= '<div class="tm-sbox-wrapper-bg-layer tm-bg-layer"></div>';	
		}
		
		
		
		
		if( !empty($h2) && empty($h4) ){
			$tm_sbox_class[] = 'tm-sbox-heading-only';
		} else if( empty($h2) && !empty($h4) ){
			$tm_sbox_class[] = 'tm-sbox-subheading-only';
		} else if( !empty($h2) && !empty($h4) ){
			$tm_sbox_class[] = 'tm-sbox-both-headings';
		}
		
		// Custom Class
		if ( ! empty( $el_class ) ) {
			$tm_sbox_class[] = trim($el_class);
		}
		
		// CSS Animation
		if ( ! empty( $css_animation ) ) {
			$tm_sbox_class[] = themetechmount_getCSSAnimation( $css_animation );
		}
		
		
		// Button align same as text align
		$options_list['btn_align'] = $add_icon_new;
		
		
		
		// Generating CTA shortcode
		$ctaShortcode = '[tm-cta servicebox="true" ';
		
		if( !isset($options_list['add_button']) || empty($options_list['add_button']) ){
			$ctaShortcode .= 'add_button="no" ';
		}
		
		foreach( $options_list as $key=>$val ){
			if( isset(${$key}) && trim( ${$key} )!='' && $key!='i_on_border' && $key!='el_class' && $key!='css' ){
				$ctaShortcode .= ' '.$key.'="'.${$key}.'" ';
			}
		}
		if( !empty($tm_i_on_border) ){
			$ctaShortcode .= $tm_i_on_border;  // icon on border
		}
		$ctaShortcode .= ' i_css_animation="" css="'.$css_copy.'" css_animation=""]'.$content.'[/tm-cta]';
		
		$return = do_shortcode($ctaShortcode);
		
		
		// Wrapping custom class to slyle
		$return = '<div class="' . themetechmount_sanitize_html_classes( implode(' ',$tm_sbox_class) ) . '">'. $tm_smbox_custom_div . $return .'</div>';
		
		/* Added by ThemeTechMount - code start */
		$customStyle = '';
		if(trim($css)!= ''){

			
			/******************************************/
			// Inline css
			global $themetechmount_inline_css;
			if( empty($themetechmount_inline_css) ){
				$themetechmount_inline_css = '';
			}
			// Remove BG image from main DIV
			// BG color layer
			$themetechmount_inline_css .= '.' . vc_shortcode_custom_css_class( $css, '' ) . ' .tm-bg-layer{' . themetechmount_bg_only_from_css($css) . 'background-image: none !important;}';
			// BG image DIV for bg-hover effect
			$themetechmount_inline_css .= '.' . vc_shortcode_custom_css_class( $css, '' ) . ' .tm-bgimage-layer{' . themetechmount_bg_only_from_css($css) . '}';
			// Removing padding and margin from tm-sbox div
			$themetechmount_inline_css .= '.wpb_wrapper > .' . vc_shortcode_custom_css_class( $css, '' ) . '{padding:0 !important; margin:0 !important; border:none !important;}';

			
			
			// Applying custom CSS to inner layer too
			$new_bgimage_element2 = vc_shortcode_custom_css_class( $css, '' ). ' > .tm-vc_cta3-container';
			$newCSS2   			  = str_replace( vc_shortcode_custom_css_class( $css, '' ), $new_bgimage_element2, $css );
			$themetechmount_inline_css    .= str_replace( '}', 'background-image:none !important;}', $newCSS2 );
			/******************************************/
			
			
			
		}
		/* Added by ThemeTechMount - code end */
		
		
	} else {
		$return .= '<!-- Visual Composer plugin not installed. Please install it to make this shortcode work. -->';
	}

	
	return $return;
}
}
add_shortcode( 'tm-servicebox', 'themetechmount_sc_servicebox' );



if( !function_exists('themetechmount_bg_only_from_css') ){
function themetechmount_bg_only_from_css( $css ){
	// Check if '{' charactor exists
	if( strpos($css,'{' )!=false ){
		$css = substr($css, strpos($css,'{' )+1 ); // returns "d"
		$css = str_replace('}','', $css );
		$new_css_array = explode(';',$css);
		$bgonly_css = '';
		foreach( $new_css_array as $css_line ){
			if( substr($css_line,0,10)=='background' ){
				$bgonly_css .= $css_line.';';
			}
		}
	}
	return $bgonly_css;
}
}



if( !function_exists('themetechmount_check_if_bg_color_in_css') ){
function themetechmount_check_if_bg_color_in_css( $css ){
	$return = false;
	
	// Check if '{' charactor exists
	if( strpos($css,'{' )!=false ){
		$css = substr($css, strpos($css,'{' )+1 ); // returns "d"
		$css = str_replace('}','', $css );
		$new_css_array = explode(';',$css);
		foreach( $new_css_array as $css_line ){
			if( substr($css_line,0,11)=='background:' ){
				$css_line = explode(' ',$css_line);
				foreach($css_line as $line){
					if( substr($line,0,5)=='rgba(' || substr($line,0,5)=='#' ){
						$return = true;
					}
				}
			}
		}
	}
	
	return $return;
}
}