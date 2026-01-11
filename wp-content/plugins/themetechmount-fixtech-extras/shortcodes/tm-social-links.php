<?php
// [tm-social-links]
if( !function_exists('themetechmount_sc_social_links') ){
function themetechmount_sc_social_links( $atts, $content=NULL ){
	
	extract( shortcode_atts( array(
		'tooltip'		   => 'yes',
		'tooltip_position' => 'top',
	), $atts ) );
	
	
	
	$wrapperStart = '<div class="themetechmount-social-links-wrapper">';
	$wrapperEnd   = '</div>';
	return $wrapperStart . themetechmount_get_social_links($tooltip_position, $tooltip) . $wrapperEnd;
}
}
add_shortcode( 'tm-social-links', 'themetechmount_sc_social_links' );






/**
 *  Preparing Social Links
 */
if( !function_exists('themetechmount_get_social_links') ){
function themetechmount_get_social_links( $tooltip_position='top' , $tooltip='yes' ){
	global $fixtech_theme_options;
	
	$socialArray = array(
		/* <social-id>  =>  <social-name> */
		'twitter'      => 'Twitter',
		'youtube'      => 'YouTube',
		'flickr'       => 'Flickr',
		'facebook'     => 'Facebook',
		'linkedin'     => 'LinkedIn',
		'gplus'        => 'Google+',
		'yelp'         => 'Yelp',
		'dribbble'     => 'Dribbble',
		'pinterest'    => 'Pinterest',
		'podcast'      => 'Podcast',
		'instagram'    => 'Instagram',
		'xing'         => 'Xing',
		'vimeo'        => 'Vimeo',
		'vk'           => 'VK',
		'houzz'        => 'Houzz',
		'issuu'        => 'Issuu',
		'google-drive' => 'Google Drive',
		'rss'          => 'RSS',
	);
	
	
	$return = '';
	if( !empty($fixtech_theme_options['social_icons_list']) ){
		foreach( $fixtech_theme_options['social_icons_list'] as $socialicon ){
			
			$social_id   = $socialicon['social_service_name'];
			$social_name = $socialArray[ $socialicon['social_service_name'] ];
			$social_link = ( !empty($socialicon['social_service_link']) ) ? trim($socialicon['social_service_link']) : '' ;
			
			
			// check for valid position for tooltip
			$class = '';
			$valie_tooltip_positions = array('top','right','bottom','left');
			if ( in_array( $tooltip_position, $valie_tooltip_positions ) ){
				$class = 'tooltip-' . $tooltip_position;
			}
			
			// If tooltip show or hide
			$data_tooltip = 'data-tooltip="'. $social_name .'"';
			if( !empty($tooltip) && $tooltip=='no' ){
				$data_tooltip = '';
			}
			
			// Link according to type of link
			$href = '#';
			if( $social_id == 'rss' ){
				$href = get_bloginfo('rss2_url');
			} else {
				$href = $social_link;
			}
			
			$return .= '<li class="tm-social-' . $social_id . '"><a class=" ' . sanitize_html_class($class) . '" target="_blank" href="' . $href . '" ' . $data_tooltip . '><i class="tm-fixtech-icon-' . $social_id . '"></i></a></li>' . "\n";
			
			
		}
	}
	
	
	
	
	
	foreach( $socialArray as $key=>$value ){
		
		if( $key == 'rss' ){
			if( isset($fixtech_theme_options['rss']) && $fixtech_theme_options['rss']=='1' ){
				$return .= '<li class="'.$key.'"><a target="_blank" href="'.get_bloginfo('rss2_url').'" data-tooltip="'.$value[1].'"><i class="tm-social-icon-'.$value[0].'"></i></a></li>';
			}
		} else {
			if( isset($fixtech_theme_options[$key]) && trim($fixtech_theme_options[$key])!='' ){
				$return .= '<li class="'.$key.'"><a target="_blank" href="'.esc_url($fixtech_theme_options[$key]).'" data-tooltip="'.$value[1].'"><i class="tm-social-icon-'.$value[0].'"></i></a></li>';
			}
		}
	}
	
	if( $return!='' ){
		$return = '<ul class="social-icons">'.$return.'</ul>';
	}
	
	return $return;
}
}


/**
 *  Preparing Footer Socialbar Links
 */
if( !function_exists('themetechmount_get_socialbar_links') ){
function themetechmount_get_socialbar_links( $tooltip_position='top' , $tooltip='yes' ){
	global $fixtech_theme_options;
	
	$socialArray = array(
		/* <social-id>  =>  <social-name> */
		'twitter'      => 'Twitter',
		'youtube'      => 'YouTube',
		'flickr'       => 'Flickr',
		'facebook'     => 'Facebook',
		'linkedin'     => 'LinkedIn',
		'gplus'        => 'Google+',
		'yelp'         => 'Yelp',
		'dribbble'     => 'Dribbble',
		'pinterest'    => 'Pinterest',
		'podcast'      => 'Podcast',
		'instagram'    => 'Instagram',
		'xing'         => 'Xing',
		'vimeo'        => 'Vimeo',
		'vk'           => 'VK',
		'houzz'        => 'Houzz',
		'issuu'        => 'Issuu',
		'google-drive' => 'Google Drive',
		'rss'          => 'RSS',
	);
	
	
	$return = '';
	if( !empty($fixtech_theme_options['social_icons_list']) ){
		foreach( $fixtech_theme_options['social_icons_list'] as $socialicon ){
			
			$social_id   = $socialicon['social_service_name'];
			$social_name = $socialArray[ $socialicon['social_service_name'] ];
			$social_link = ( !empty($socialicon['social_service_link']) ) ? trim($socialicon['social_service_link']) : '' ;
			
			
			// check for valid position for tooltip
			$class = '';
			$valie_tooltip_positions = array('top','right','bottom','left');
			if ( in_array( $tooltip_position, $valie_tooltip_positions ) ){
				$class = 'tooltip-' . $tooltip_position;
			}
			
			// If tooltip show or hide
			$data_tooltip = 'data-tooltip="'. $social_name .'"';
			if( !empty($tooltip) && $tooltip=='no' ){
				$data_tooltip = '';
			}
			
			// Link according to type of link
			$href = '#';
			if( $social_id == 'rss' ){
				$href = get_bloginfo('rss2_url');
			} else {
				$href = $social_link;
			}
			
			$return .= '<li class="tm-social-' . $social_id . ' tm-socialbox-i-wrapper"><a class="tm-socialbox-icon-link tm-socialbox-icon-link-' . $social_id . ' ' . sanitize_html_class($class) . '" target="_blank" href="' . $href . '"><span class="frame-hover"></span><i class="tm-fixtech-icon-' . $social_id . '"></i><span class="social_name">'.$social_name.'</span></a></li>' . "\n";
		}
	}

	foreach( $socialArray as $key=>$value ){
		
		if( $key == 'rss' ){
			if( isset($fixtech_theme_options['rss']) && $fixtech_theme_options['rss']=='1' ){
				$return .= '<li class="'.$key.'"><a target="_blank" href="'.get_bloginfo('rss2_url').'" data-tooltip="'.$value[1].'"><i class="tm-social-icon-'.$value[0].'"></i></a></li>';
			}
		} else {
			if( isset($fixtech_theme_options[$key]) && trim($fixtech_theme_options[$key])!='' ){
				$return .= '<li class="'.$key.' "><a target="_blank" href="'.esc_url($fixtech_theme_options[$key]).'" data-tooltip="'.$value[1].'"><i class="tm-social-icon-'.$value[0].'"></i></a></li>';
			}
		}
	}
	
	if( $return!='' ){
		$return = '<ul class="social-icons tm-socialbox-links-wrapper">'.$return.'</ul>';
	}
	
	return $return;
}
}