<?php

// [tm-eventsbox]
if( !function_exists('themetechmount_sc_eventsbox') ){
function themetechmount_sc_eventsbox( $atts, $content=NULL ){
	
	$return = '';
	
	if( function_exists('vc_map') ){
		
		global $tm_sc_params_eventsbox;
		
		$options_list = themetechmount_create_options_list($tm_sc_params_eventsbox);
		
		extract( shortcode_atts(
			$options_list
		, $atts ) );
		
		if( function_exists('tribe_exit') ){
			
			// Starting wrapper of the whole arear
			$return .= themetechmount_box_wrapper( 'start', 'events', get_defined_vars() );
			
				// Heading element
				$return .= themetechmount_vc_element_heading( get_defined_vars() );
				
				
				
				// Getting $args for WP_Query
				$args = themetechmount_get_query_args( 'events', get_defined_vars() );
				
				// Wp query to fetch posts
				$posts = new WP_Query( $args );
				
				if ( $posts->have_posts() ) {
					$return .= themetechmount_get_boxes( 'events', get_defined_vars() );
				}
				
			
			// Ending wrapper of the whole arear
			$return .= themetechmount_box_wrapper( 'end', 'events', get_defined_vars() );
			
			/* Restore original Post Data */
			wp_reset_postdata();
		}	
		
	} else {
		$return .= '<!-- Visual Composer plugin not installed. Please install it to make this shortcode work. -->';
	}
	
	return $return;
}
}
add_shortcode( 'tm-eventsbox', 'themetechmount_sc_eventsbox' );