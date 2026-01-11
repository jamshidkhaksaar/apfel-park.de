<?php
// [tm-custom-heading tag="h1" text="This is heading text"]
if( !function_exists('themetechmount_sc_custom_heading') ){
function themetechmount_sc_custom_heading( $atts, $content=NULL ){
	
	$return = '';
	
	if( function_exists('vc_map') ){
		
		$source = $text = $link = $google_fonts = $font_container = $el_class = $css = $font_container_data = $google_fonts_data = '';
		
		global $tm_sc_params_custom_heading;
		$options_list = themetechmount_create_options_list($tm_sc_params_custom_heading);
		
		extract( shortcode_atts(
			$options_list
		, $atts ) );
		
		$inline_style = '';
		$css_class    = 'tm-custom-heading';
		
		// converting vc value to array
		$font_container_data = themetechmount_vc_parse_multi_attribute(
			$font_container,
			array(
				'tag'         => 'h2',
				'text_align'  => '',
				'font_size'   => '',
				'line_height' => '',
				'color'       => '',
			)
		);
		
		
		$google_fonts_data   = themetechmount_vc_parse_multi_attribute(
			$google_fonts,
			array(
				'font_family' => '',
				'font_style'  => '',
			)
		);
		
		// merging all values so we can process it
		$alldata = array_merge( $font_container_data, $google_fonts_data );
		
		
		// Title
		if ( 'post_title' === $source ) {
			$text = get_the_title( get_the_ID() );
		}
		
		// CSS Animation
		if( ! empty( $css_animation ) ) {
			$css_class .= ' ' . themetechmount_getCSSAnimation( $css_animation );
		}
		
		// custom class
		if( !empty($el_class) ){
			$css_class .= ' '.esc_attr($el_class);
		}
		

		if( !empty($css_class) ){
			// Gettings class name from "Desing Options" tab settings
			$design_option_class = themetechmount_vc_shortcode_custom_css_class( $css );
			$css_class .= ' '.$design_option_class;
			$css_class = ' class="'.$css_class.'" ';
		}
		
		
		// Link
		if ( ! empty( $link ) ) {
			$link = themetechmount_vc_build_link( $link );
			$text = '<a href="' . esc_attr( $link['url'] ) . '"'
				. ( !empty($link['target']) ? ' target="' . trim(esc_attr( $link['target'] )) . '"' : '' )
				. ( !empty($link['title']) ? ' title="' . esc_attr( $link['title'] ) . '"' : '' )
				. '>' . $text . '</a>';
		}
		
		
		
		// inline style : Text align
		
		foreach( $alldata as $key=>$val ){
			
			$origial_val = $val;
			
			$key = str_replace( '_', '-', $key );
			if( ($key=='text-align' || $key=='font-size' || $key=='line-height' || $key=='color' || $key=='font-family' || $key=='font-style' ) && !empty($val) ){
				
				
				if( $key=='font-family' || $key=='font-style' ){
					
					$breakpoint = ( $key=='font-style' ) ? ' ' : ':' ;
					
					if( $use_theme_fonts!='yes'){  // font family changes
						
						if( strpos( $val, $breakpoint ) !== false ){
							$val = explode( $breakpoint, $val );
							$val = $val[0];
						}
						
						if( $key=='font-family' ){ $val = "'".$val."',Arial,Helvetica"; }
						
						if( $key=='font-style' ){
							$key = 'font-weight';
							
							if (strpos($origial_val, 'italic') !== false) {  // check if font-style is italic
								$inline_style .= 'font-style:italic;';
							}
							
						} // converting font-style to font-weight
						
						$inline_style .= $key.':'.$val.';';
					}
					
					
				} else {
					
					$inline_style .= $key.':'.$val.';';
					
				}
				
			}
		}
		
		
		// global variable for Google Fonts
		if( !empty($alldata['font_family']) ){
			
			$font_weight = 'regular';
			
			if( !empty($alldata['font_family']) ){
				$font_family = $alldata['font_family'];
				if( strpos( $font_family, ':' ) !== false ){
					$font_family = explode( ':', $font_family );
					$font_family = $font_family[0];
					$font_family = str_replace(' ', '+', $font_family );
				}
				
				$font_weight = $alldata['font_style'];
				if( strpos( $font_weight, ' ' ) !== false ){
					$font_weight = explode( ' ', $font_weight );
					$font_weight = $font_weight[0];
					if( $font_weight=='400' ){ $font_weight='regular'; }
				}
			}
			
			themetechmount_footer_google_fonts_array( $font_family , $font_weight );
		}
		
		
		
		if( !empty($inline_style) ){
			$inline_style = ' style="'.$inline_style.'"';
		}
		
		
		
		// final output
		$return .= '<' . $font_container_data['tag'] . $inline_style . $css_class . '>';
		$return .= $text;
		$return .= '</' . $font_container_data['tag'] . '>'."\n";
	

	
	} else {
		$return .= '<!-- Visual Composer plugin not installed. Please install it to make this shortcode work. -->';
	}
		
	return $return;
	
}
}
add_shortcode( 'tm-custom-heading', 'themetechmount_sc_custom_heading' );