<?php
// [tm-facts-in-digits]
if( !function_exists('themetechmount_sc_facts_in_digits') ){
function themetechmount_sc_facts_in_digits($atts, $content=NULL ) {
	
	$return = '';
	
	if( function_exists('vc_map') ){
		
		global $tm_sc_params_facts_in_digits;
		$options_list = themetechmount_create_options_list($tm_sc_params_facts_in_digits);
		
		// This global variable will be used in template file for design
		global $tm_global_fid_element_values;
		$tm_global_fid_element_values = array();
		
		
		extract( shortcode_atts(
			$options_list
		, $atts ) );
		
		// Required JS files
		wp_enqueue_script( 'waypoints', array( 'jquery' ) );
		if( in_array($view, array( 'thin-progressbar', 'strong-progressbar' ) ) ){
			wp_enqueue_script( 'jquery-circle-progress', array( 'jquery' ) );
		} else {
			wp_enqueue_script( 'numinate',  array( 'jquery' ) );
		}
				
		
		
		//  Before or after text
		
		$before_text = '';
		$after_text  = '';
		
		if( trim($before)!='' ){
			if( $beforetextstyle=='sup' || $beforetextstyle=='sub' || $beforetextstyle=='span' ){
				$before_text = '<'.$beforetextstyle.'>'.trim($before).'</'.$beforetextstyle.'>';
			}
		}
		
		if( trim($after)!='' ){
			if( $aftertextstyle=='sup' || $aftertextstyle=='sub' || $aftertextstyle=='span' ){
				$after_text = '<'.$aftertextstyle.'>'.trim($after).'</'.$aftertextstyle.'>';
			}
		}
		
		
		// Icon
		$lefticoncode  = '';
		$righticoncode = '';
		$class         = array();
		$class_icon         = 'tm-fid-without-icon';
		if( $add_icon=='true' ){
			$class_icon = 'tm-fid-with-icon';
			
			if( !isset($i_icon_linecons) ){
				$i_icon_linecons = '';
			}
			if( !isset($i_icon_themify) ){
				$i_icon_themify = '';
			}
			
			
			// We are calling this to add CSS file of the selected icon.
			do_shortcode('[tm-icon type="'.$i_type.'" icon_fontawesome="'.$i_icon_fontawesome.'" icon_linecons="'.$i_icon_linecons.'" icon_themify="'.$i_icon_themify.'" color="skincolor" align="left"]');
			
			// This is real icon code
			$icon_class   = ( !empty( ${'i_icon_'.$i_type} ) ) ? ${'i_icon_'.$i_type} : '' ;
			$lefticoncode = '<div class="tm-fid-icon-wrapper"><i class="' . $icon_class . '"></i></div>';
			
		}  // if( $add_icon=='true' )
		
		// icon exists class
		$class[] = $class_icon;
		

		if( !empty($view) ){
			$class[] = 'tm-fid-view-'.$view;
		}
		
		if ( !empty( $css_animation ) ) {
			$class[] = themetechmount_getCSSAnimation( $css_animation );
		}
		
		// with border?
		if( !empty($add_border) ) {
			$class[] = 'tm-fid-with-border'; 
		} else {
			$class[] = 'tm-fid-no-border' ;
		}
		
		// Extra Class
		if( !empty($el_class) ){
			$class[] = $el_class;
		}
		
		// VC custom class
		if ( ! empty( $css ) ) {
			$class[] = themetechmount_vc_shortcode_custom_css_class( $css );
		}
		
		// storing in global varibales to be used in template file
		$tm_global_fid_element_values['title']         = $title;
		$tm_global_fid_element_values['main-class']    = implode(' ', $class);
		$tm_global_fid_element_values['lefticoncode']  = $lefticoncode;
		$tm_global_fid_element_values['righticoncode'] = $righticoncode;
		$tm_global_fid_element_values['before_text']   = $before_text;
		$tm_global_fid_element_values['after_text']    = $after_text;
		$tm_global_fid_element_values['digit']         = $digit;
		$tm_global_fid_element_values['interval']      = $interval;
		$tm_global_fid_element_values['view']          = $view;
		
		$tm_global_fid_element_values['before']          = $before;
		$tm_global_fid_element_values['beforetextstyle'] = $beforetextstyle;
		$tm_global_fid_element_values['after']           = $after;
		$tm_global_fid_element_values['aftertextstyle']  = $aftertextstyle;
		$tm_global_fid_element_values['circle_fill_color']  = $circle_fill_color;
		$tm_global_fid_element_values['circle_empty_color']  = $circle_empty_color;
		
		
		// calling template depending on the selected VIEW option
		ob_start();
		get_template_part('template-parts/fidbox/fidbox', $view);
		$return = ob_get_contents();
		ob_end_clean();
	
	
		
	} else {
		$return .= '<!-- Visual Composer plugin not installed. Please install it to make this shortcode work. -->';
	}
	
	return $return;
}
}
add_shortcode( 'tm-facts-in-digits', 'themetechmount_sc_facts_in_digits' );