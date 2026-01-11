<?php
// [tm-logo]
if( !function_exists('themetechmount_sc_logo') ){
function themetechmount_sc_logo( $atts, $content=NULL ){
	
	
	
	$fixtech_theme_options = get_option('fixtech_theme_options');
	
	if( !empty($fixtech_theme_options['logotype']) ){
	
		$return = '<span class="tm-sc-logo tm-sc-logo-type-'.$fixtech_theme_options['logotype'].'">';
		
		if( $fixtech_theme_options['logotype']=='image' ){
			if( isset($fixtech_theme_options['logoimg']) && is_array($fixtech_theme_options['logoimg']) ){
				
				// standard logo
				if( isset($fixtech_theme_options['logoimg']['full-url']) && trim($fixtech_theme_options['logoimg']['full-url'])!='' ){
					$image = $fixtech_theme_options['logoimg']['full-url'];
					$return .= '<img class="themetechmount-logo-img standardlogo" alt="' . get_bloginfo( 'name' ) . '" src="'.$fixtech_theme_options['logoimg']['full-url'].'">';
				
				} else if( isset($fixtech_theme_options['logoimg']['thumb-url']) && trim($fixtech_theme_options['logoimg']['thumb-url'])!='' ){
					$image = $fixtech_theme_options['logoimg']['thumb-url'];
					$return .= '<img class="themetechmount-logo-img standardlogo" alt="' . get_bloginfo( 'name' ) . '" src="'.$fixtech_theme_options['logoimg']['thumb-url'].'">';

				} else if( isset($fixtech_theme_options['logoimg']['id']) && trim($fixtech_theme_options['logoimg']['id'])!='' ){
					$image   = wp_get_attachment_image_src( $fixtech_theme_options['logoimg']['id'], 'full' );
					$return .= '<img class="themetechmount-logo-img standardlogo" alt="' . get_bloginfo( 'name' ) . '" src="'.$image[0].'" width="'.$image[1].'" height="'.$image[2].'">';
					
					
				}
				
				
				// stikcy logo
				if( isset($fixtech_theme_options['logoimg_sticky']) && is_array($fixtech_theme_options['logoimg_sticky']) ){
					
					if( isset($fixtech_theme_options['logoimg_sticky']['full-url']) && trim($fixtech_theme_options['logoimg_sticky']['full-url'])!='' ){
						$sticky_image   = $fixtech_theme_options['logoimg_sticky']['full-url'];
						$return .= '<img class="themetechmount-logo-img stickylogo" alt="' . get_bloginfo( 'name' ) . '" src="'.$fixtech_theme_options['logoimg_sticky']['full-url'].'">';
					
					} else if( isset($fixtech_theme_options['logoimg_sticky']['thumb-url']) && trim($fixtech_theme_options['logoimg_sticky']['thumb-url'])!='' ){
						$sticky_image   = $fixtech_theme_options['logoimg_sticky']['thumb-url'];
						$return .= '<img class="themetechmount-logo-img stickylogo" alt="' . get_bloginfo( 'name' ) . '" src="'.$fixtech_theme_options['logoimg_sticky']['thumb-url'].'">';
					
					} else if( isset($fixtech_theme_options['logoimg_sticky']['id']) && trim($fixtech_theme_options['logoimg_sticky']['id'])!='' ){
						$sticky_image   = wp_get_attachment_image_src( $fixtech_theme_options['logoimg_sticky']['id'], 'full' );
						$return .= '<img class="themetechmount-logo-img stickylogo" alt="' . get_bloginfo( 'name' ) . '" src="'.$sticky_image[0].'" width="'.$sticky_image[1].'" height="'.$image[2].'">';
						
					}
					
				}
				
				
			}
		} else {
			if( !empty($fixtech_theme_options['logotext']) ){
				$return = $fixtech_theme_options['logotext'];
			}
		}
		
		$return .= '</span>';
		
	}
	
	return $return;
}
}
add_shortcode( 'tm-logo', 'themetechmount_sc_logo' );