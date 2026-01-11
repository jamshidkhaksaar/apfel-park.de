<?php
// [tm-themetechmounticonseparator icon="search-1" style="dashed" width="70" el_class="customclass"]
if( !function_exists('themetechmount_sc_icon_separator') ){
function themetechmount_sc_icon_separator( $atts, $content=NULL ){
	
	$return = '';
	
	if( function_exists('vc_map') ){
		
		
		global $tm_sc_params_icon_separator;
		$options_list = themetechmount_create_options_list($tm_sc_params_icon_separator);
		
		extract(shortcode_atts(
			$options_list
		, $atts));
		
		// Icon 
		// We are calling this to add CSS file of the selected icon.
		do_shortcode('[vc_icon type="'.$icon_type.'" icon_fontawesome="'.$icon_icon_fontawesome.'" icon_openiconic="'.$icon_icon_openiconic.'" icon_typicons="'.$icon_icon_typicons.'" icon_entypo="'.$icon_icon_entypo.'" icon_linecons="'.$icon_icon_linecons.'" color="skincolor" align="left"]');
		// This is real icon code
		$icon = '<i class="tm-separatoc-icon '.${'icon_icon_'.$icon_type}.'"></i>';

		
		$newtitle = $icon. ' ' . $title;
		if( $icon_position=='right' ){
			$newtitle = $title. ' ' . $icon;
		}
		
		
		// Separator
		$separator_code = '<div class="tm-sep-with-icon-wrapper">';
		
		// Dynamic shortcode generate [vc_text_separator]
		$separator_shortcode = '[vc_text_separator ';
		foreach( $options_list as $key=>$val ){
			if( trim( ${$key} )!='' ){
				$separator_shortcode .= ' '.$key.'="'.${$key}.'" ';
			}
		}
		$separator_shortcode .= ' ]';
		$separator_code .= do_shortcode($separator_shortcode);
		$separator_code .= '</div>';
		
		if( trim($title)!='' ){
			$separator_code = str_replace( $title, $newtitle, $separator_code );
		} else {
			// If title is emplty and only icon shown
			$separator_code = str_replace( 'Title', $newtitle, $separator_code );
		}
		
		
		$return .= $separator_code;
		
		
	} else {
		$return .= '<!-- Visual Composer plugin not installed. Please install it to make this shortcode work. -->';
	}
		
	// Output
	return $return;
	
	
}
}
add_shortcode( 'tm-icon-separator', 'themetechmount_sc_icon_separator' );