<?php

if( !function_exists('themetechmount_logo') ){
function themetechmount_logo(){
	$logotype       = themetechmount_get_option('logotype');
	$logoimg        = themetechmount_get_option('logoimg');
	$logoimg_sticky = themetechmount_get_option('logoimg_sticky');
	
	$return = '<span class="tm-sc-logo tm-sc-logo-type-' . sanitize_html_class($logotype) . '">';
	if( $logotype=='image' ){
		if( isset($logoimg) && is_array($logoimg) ){
			
			// standard logo
			if( isset($logoimg['full-url']) && trim($logoimg['full-url'])!='' ){
				$image = $logoimg['full-url'];
				$return .= '<img class="themetechmount-logo-img standardlogo" src="'.$logoimg['full-url'].'" >';
			
			} else if( isset($logoimg['thumb-url']) && trim($logoimg['thumb-url'])!='' ){
				$image = $logoimg['thumb-url'];
				$return .= '<img class="themetechmount-logo-img standardlogo" src="'.$logoimg['thumb-url'].'" >';

			} else if( isset($logoimg['id']) && trim($logoimg['id'])!='' ){
				$image   = wp_get_attachment_image_src( $logoimg['id'], 'full' );
				$return .= '<img class="themetechmount-logo-img standardlogo" src="'.$image[0].'" width="'.$image[1].'" height="'.$image[2].'">';
				
				
			}
			
			
			// stikcy logo
			if( isset($logoimg_sticky) && is_array($logoimg_sticky) ){
				
				if( isset($logoimg_sticky['full-url']) && trim($logoimg_sticky['full-url'])!='' ){
					$sticky_image   = $logoimg_sticky['full-url'];
					$return .= '<img class="themetechmount-logo-img stickylogo" src="'.$logoimg_sticky['full-url'].'" alt="" >';
				
				} else if( isset($logoimg_sticky['thumb-url']) && trim($logoimg_sticky['thumb-url'])!='' ){
					$sticky_image   = $logoimg_sticky['thumb-url'];
					$return .= '<img class="themetechmount-logo-img stickylogo" src="'.$logoimg_sticky['thumb-url'].'" alt="" >';
				
				} else if( isset($logoimg_sticky['id']) && trim($logoimg_sticky['id'])!='' ){
					$sticky_image   = wp_get_attachment_image_src( $logoimg_sticky['id'], 'full' );
					$return .= '<img class="themetechmount-logo-img stickylogo" src="'.$sticky_image[0].'" width="'.$sticky_image[1].'" height="'.$image[2].'" alt="">';
					
				}
				
			}
			
			
		}
	} else {
		
		$return = themetechmount_get_option('logotext');
	}
	$return .= '</span>';
	
	return $return;
}
}





/**
 *  List of Social services that used for Social Links section
 */
if( !function_exists('themetechmount_shared_social_list') ){
function themetechmount_shared_social_list(){
	/**
	 *  'social_id' => array('social_name')
	 *  'social_name' can also be used for icon class
	 */
	$sociallist = array(
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
	);
	
	return $sociallist;
}
}




/**
 *  List of Social services that used for Social Links section
 */
if( !function_exists('themetechmount_a_color') ){
function themetechmount_a_color(){
	$return = '';
	
	$skincolor  = themetechmount_get_option('skincolor');
	$link_color = themetechmount_get_option('link-color');
	
	// default
	$normal_color = '#202020';
	$hover_color  = $skincolor;
	
	if( $link_color=='darkhover' ){
		$normal_color = $skincolor;
		$hover_color  = '#202020';
		
	} else if( $link_color=='custom' ){
		$normal_color = themetechmount_get_option('link-color-regular');
		$hover_color  = themetechmount_get_option('link-color-hover');
		
	}
	
	$return = '
	a{color:' . $normal_color . ';}
	a:hover{color:' . $hover_color . ';}
	';
	
	echo $return;

}
}




/**
 *  Add HTTP if not found in URL
 */
if( !function_exists('themetechmount_vc_get_bg_css_only') ){
function themetechmount_vc_get_bg_css_only($css, $nobg='') {
	
	$return = '';
	
	if( !empty($css) ){
		$css_array = explode( '{', $css );
		$css_selector = $css_array[0];
		$css_array = $css_array[1];
		$css_array = str_replace( '}', '', $css_array );
		$css_array = trim($css_array);
		$css_array = explode( ';', $css_array );
		
		foreach( $css_array as $css_rule ){
			if ( substr( $css_rule, 0, 10 ) == 'background' ) {
				$return .= $css_rule . ';';
			}
		}
	}
	
	// no bg
	if( $nobg=='nobg' && !empty($return) ){
		$return .= 'background-image:none !important;';
	}
	
	if( !empty($css_selector) && !empty($return) ){
		$return = $css_selector . '{' . $return . '}' ;
	}
	
	return $return;
	
}
}






/**
 *  Add HTTP if not found in URL
 */
if( !function_exists('themetechmount_addhttp') ){
function themetechmount_addhttp($url) {
    if (!preg_match("~^(?:f|ht)tps?://~i", $url)) {
        $url = "http://" . $url;
    }
    return $url;
}
}



/**
 *  Previous/next page navigation.
 */
if( !function_exists('themetechmount_pagination') ){
function themetechmount_pagination( $wp_query_data=false ){
	
	if( $wp_query_data==false ){
		global $wp_query;
	} else {
		$wp_query = $wp_query_data;
	}
	
	
	$return  = '';
	$return .= themetechmount_wp_kses('<div class="clearfix"></div>');
		
	
	$big = 999999999; // need an unlikely integer
		
	// Array to check if pagination data exists
	$paginateLinks = paginate_links( array(
		'base'      => str_replace( $big, '%#%', esc_url( get_pagenum_link( $big ) ) ),
		'format'    => '?paged=%#%',
		'current'   => max( 1, get_query_var('paged') ),
		'total'     => $wp_query->max_num_pages,
		'type'      => 'array',
		'prev_text' => '<i class="tm-fixtech-icon-arrow-left"></i> <span class="tm-hide tm-pagination-text tm-pagination-text-prev">' . esc_attr__( 'Previous page', 'fixtech' ) . '</span>',
		'next_text' => '<span class="tm-hide tm-pagination-text tm-pagination-text-next">' . esc_attr__( 'Next page', 'fixtech' ) . '</span> <i class="tm-fixtech-icon-arrow-right"></i>',
	) );
	
	
	if( $paginateLinks!=NULL ){
		$big = 999999999; // need an unlikely integer
		$return .= '<div class="themetechmount-pagination">';
		$return .= paginate_links( array(
			'base'      => str_replace( $big, '%#%', esc_url( get_pagenum_link( $big ) ) ),
			'format'    => '?paged=%#%',
			'current'   => max( 1, get_query_var('paged') ),
			'total'     => $wp_query->max_num_pages,
			'prev_text' => '<i class="tm-fixtech-icon-arrow-left"></i> <span class="tm-hide tm-pagination-text tm-pagination-text-prev">' . esc_attr__( 'Previous page', 'fixtech' ) . '</span>',
			'next_text' => '<span class="tm-hide tm-pagination-text tm-pagination-text-next">' . esc_attr__( 'Next page', 'fixtech' ) . '</span> <i class="tm-fixtech-icon-arrow-right"></i>',
		) );
		$return .= '</div><!-- .themetechmount-pagination -->';
	}
	
	
	
	return $return;
}
}




/**
 *   Get theme options. If value is not set than it will fetch default value
 */
if( !function_exists('themetechmount_get_option') ){
function themetechmount_get_option( $option, $inner_option='' ){
	
	global $fixtech_theme_options;
	if( !is_array($fixtech_theme_options) ){
		$fixtech_theme_options = get_option('fixtech_theme_options');
	}
	
	$return = '';
	
	if( isset($fixtech_theme_options[$option]) ){
		$return = $fixtech_theme_options[$option];
	} else {
		include( get_template_directory() . '/cs-framework-override/config/framework-options.php' );
		
		if( isset($tm_framework_options) && is_array($tm_framework_options) && count($tm_framework_options)>0 ){
			foreach( $tm_framework_options as $fields ){
				if( isset($fields['fields']) && is_array($fields['fields']) && count($fields['fields'])>0 ){
					foreach( $fields['fields'] as $field ){
						if( !empty($field['id']) && $field['id'] == $option && isset($field['default']) ){
							$return = $field['default'];
						}
					}
				}
			}
		}
	}
	
	// if required inner option
	if( !empty($inner_option) ){
		if( isset($return[$inner_option]) ){
			$return = $return[$inner_option];
		}
	}
	
	return $return;
	
}
}




/**
 *  Get all registed sidebars. This will also return custom sidebars too.
 */
if( !function_exists('themetechmount_get_all_registered_sidebars') ){
function themetechmount_get_all_registered_sidebars(){
	global $wp_registered_sidebars;
	$return = array( '' => esc_attr__('Default', 'fixtech') );
	foreach( $wp_registered_sidebars as $sidebar_id=>$sidebar_info ){
		$return[$sidebar_id] = $sidebar_info['name'];
	}
	return $return;
}
}



/**
 *  Convert VC options to list of array with default values
 */
if( !function_exists('themetechmount_create_options_list') ){
function themetechmount_create_options_list( $optionslist=array() ){
	$options_list = array();
	
	if( is_array($optionslist) && count($optionslist)>0 ){
		foreach( $optionslist as $options ){
			
			if( $options['param_name']!='content' ){
				$std = ( !empty($options['std']) ) ? trim($options['std']) : '' ;
				$std = ( empty($std) && !empty($options['value']) && !is_array($options['value']) ) ? trim($options['value']) : $std ;
				
				// if type == dropdown   than fetch first option as std value
				if( !empty($options['type']) && $options['type']=='dropdown' && empty($options['std']) ){
					$std = $options['value'][key($options['value'])];
				}
				
				// if type == iconpicker   than fetch value as default std value
				if( !empty($options['type']) && $options['type']=='themetechmount_iconpicker' ){
					$std = $options['value'];
				}
				
				
				$options_list[$options['param_name']] = $std;
			}
		}
	}
	return $options_list;
}
}





/**
 * Function to prepare DATA tag values
 */
if( !function_exists('themetechmount_carousel_data_html') ){
function themetechmount_carousel_data_html( $allVar ){
	$return = '';
	
	if( $allVar['boxview'] == 'carousel' || $allVar['boxview'] == 'slickview' ){
		
		wp_enqueue_script( 'slick');
		wp_enqueue_style( 'slick');
		wp_enqueue_style( 'slick-theme');
		
		
		foreach( $allVar as $key=>$value ){
			$var = substr($key, 0 , 9 );
			if( $var=='carousel_' ){
				$datatitle = str_replace('carousel_','data-tm-',$key);
				$return .= ' '.$datatitle.'="'.$value.'"';
			}
		}
	}
	return $return;
}
}







/**
 *  Heading in our custom element like Blogbox, Portfoliobox etc.
 */
if( !function_exists('themetechmount_vc_element_heading') ){
function themetechmount_vc_element_heading( $allVar ){
	
	$return = '';
	
	$ctaOptions = array(
		'h2',
		'h2_link',
		'h2_use_theme_fonts',
		'use_custom_fonts_h2',
		'h2_font_container',
		'h2_google_fonts',
		'h2_el_class',
		'h4',
		'h4_link',
		'h4_use_theme_fonts',
		'use_custom_fonts_h4',
		'h4_font_container',
		'h4_google_fonts',
		'h4_el_class',
		'txt_align',
		'shape',
		'style',
		'custom_background',
		'custom_text',
		'color',
		'add_button',
		'reverse_heading',
		'overlay_subheading',
		'seperator',
		'heading_style',
	);
	
	

	if( !empty($allVar['h2']) ) {
		$return .= '<div class="themetechmount-box-heading-wrapper tm-element-align-'.$allVar['txt_align'].'">';
		
		if( !isset($allVar['content']) ){
			$allVar['content'] = '';
		}
		$allVar['style'] = 'transparent';
		// Preparing Heading Shortcode
		$ctaShortcode = '[tm-heading ';
		foreach( $ctaOptions as $option ){
			if( isset($allVar[$option]) ){
				$ctaShortcode .= $option.'="'.$allVar[$option].'" ';
			}
		}
		if( isset($allVar['add_icon_new']) ){
			$ctaShortcode .= 'add_icon="'.$allVar['add_icon_new'].'" ';
		}
	
		$ctaShortcode .= 'el_width="100%" css_animation=""]'.$allVar['content'].'[/tm-heading]';
		$return .= do_shortcode($ctaShortcode);
		

		$return .= '</div> <!-- .tm-element-heading-wrapper container --> ';
		
	}
	
	return $return;

}
}




if( !function_exists('themetechmount_hex2rgb') ){
function themetechmount_hex2rgb($hex) {
	$hex = str_replace("#", "", $hex);

	if(strlen($hex) == 3) {
		$r = hexdec(substr($hex,0,1).substr($hex,0,1));
		$g = hexdec(substr($hex,1,1).substr($hex,1,1));
		$b = hexdec(substr($hex,2,1).substr($hex,2,1));
	} else {
		$r = hexdec(substr($hex,0,2));
		$g = hexdec(substr($hex,2,2));
		$b = hexdec(substr($hex,4,2));
	}
	$rgb = array($r, $g, $b);
	return implode(",", $rgb); // returns the rgb values separated by commas
	//return $rgb; // returns an array with the rgb values
}
}





if( !function_exists('themetechmount_adjustBrightness') ){
function themetechmount_adjustBrightness($hex, $steps) {
    // Steps should be between -255 and 255. Negative = darker, positive = lighter
    $steps = max(-255, min(255, $steps));

    // Format the hex color string
    $hex = str_replace('#', '', $hex);
    if (strlen($hex) == 3) {
        $hex = str_repeat(substr($hex,0,1), 2).str_repeat(substr($hex,1,1), 2).str_repeat(substr($hex,2,1), 2);
    }

    // Get decimal values
    $r = hexdec(substr($hex,0,2));
    $g = hexdec(substr($hex,2,2));
    $b = hexdec(substr($hex,4,2));

    // Adjust number of steps and keep it inside 0 to 255
    $r = max(0,min(255,$r + $steps));
    $g = max(0,min(255,$g + $steps));  
    $b = max(0,min(255,$b + $steps));

    $r_hex = str_pad(dechex($r), 2, '0', STR_PAD_LEFT);
    $g_hex = str_pad(dechex($g), 2, '0', STR_PAD_LEFT);
    $b_hex = str_pad(dechex($b), 2, '0', STR_PAD_LEFT);

    return '#'.$r_hex.$g_hex.$b_hex;
}
}







/*
 * Function to get count of total sidebar
 */
if( !function_exists('themetechmount_get_widgets_count') ){
function themetechmount_get_widgets_count( $sidebar_id ){
	$sidebars_widgets = wp_get_sidebars_widgets();
	if( isset($sidebars_widgets[ $sidebar_id ]) ){
		return (int) count( (array) $sidebars_widgets[ $sidebar_id ] );
	}
}
}


/**
 *  Widget count class
 */
if( !function_exists('themetechmount_class_for_widgets_count') ){
function themetechmount_class_for_widgets_count( $count=0 ){
	$return = '';
	if( $count<1 ){ $count = 1; }
	if( $count>4 ){ $count = 4; }
	switch( $count ){
		case 1:
			$return = 'col-xs-12 col-sm-12 col-md-12 col-lg-12';
			break;
		case 2:
			$return = 'col-xs-12 col-sm-6 col-md-6 col-lg-6';
			break;
		case 3:
			$return = 'col-xs-12 col-sm-6 col-md-4 col-lg-4';
			break;
		case 4:
			$return = 'col-xs-12 col-sm-6 col-md-3 col-lg-3';
			break;
	}
	return $return;
}
}






/**
 * Custom template tags for Fixtech
 *
 * Eventually, some of the functionality here could be replaced by core features.
 *
 * @package WordPress
 * @subpackage Fixtech
 * @since Fixtech 1.0
 */

if ( ! function_exists( 'fixtech_comment_nav' ) ) :
/**
 * Display navigation to next/previous comments when applicable.
 *
 * @since Fixtech 1.0
 */
function fixtech_comment_nav() {
	// Are there comments to navigate through?
	if ( get_comment_pages_count() > 1 && get_option( 'page_comments' ) ) :
	?>
	<nav class="navigation comment-navigation" role="navigation">
		<h2 class="screen-reader-text"><?php esc_attr_e( 'Comment navigation', 'fixtech' ); ?></h2>
		<div class="nav-links">
			<?php
				if ( $prev_link = get_previous_comments_link( esc_attr__( 'Older Comments', 'fixtech' ) ) ) :
					printf( '<div class="nav-previous">%s</div>', $prev_link );
				endif;

				if ( $next_link = get_next_comments_link( esc_attr__( 'Newer Comments', 'fixtech' ) ) ) :
					printf( '<div class="nav-next">%s</div>', $next_link );
				endif;
			?>
		</div><!-- .nav-links -->
	</nav><!-- .comment-navigation -->
	<?php
	endif;
}
endif;




if ( ! function_exists( 'fixtech_entry_meta' ) ) :
/**
 * Prints HTML with meta information for the categories, tags.
 *
 * @since Fixtech 1.0
 */
function fixtech_entry_meta( $metafor="blogbox" ) {
	
	if( !in_array($metafor, array('blogclassic','blogbox') ) ){
		$metafor = "blogclassic";
	}
	
	$return       = '';
	$social_share = '';
	$metalist     = themetechmount_get_option( $metafor . '_meta_list' );
	$date_format  = themetechmount_get_option( $metafor . '_meta_dateformat' );
	$cat_link     = themetechmount_get_option( $metafor . '_meta_catlink' );
	$tag_link     = themetechmount_get_option( $metafor . '_meta_taglink' );
	$author_link  = themetechmount_get_option( $metafor . '_meta_authorlink' );
	
	
	if( !empty($metalist['enabled']) && is_array($metalist['enabled']) && count($metalist['enabled'])>0 ){
		
		foreach( $metalist['enabled'] as $meta_id=>$meta_name ){
			
			switch( $meta_id ){
				
				case 'date':
					
					// date format
					if ( in_array( get_post_type(), array( 'post', 'attachment' ) ) ) {
						
						$time_string = '<time class="entry-date published updated" datetime="%1$s">%2$s</time>';

						if ( get_the_time( 'U' ) !== get_the_modified_time( 'U' ) ) {
							$time_string = '<time class="entry-date published" datetime="%1$s">%2$s</time><time class="updated tm-hide" datetime="%3$s">%4$s</time>';
						}

						$time_string = sprintf( $time_string,
							esc_attr( get_the_date( 'c' ) ),
							get_the_date($date_format),
							esc_attr( get_the_modified_date( 'c' ) ),
							get_the_modified_date($date_format)
						);

						$return .= sprintf( '<span class="tm-meta-line posted-on"><i class="tm-fixtech-icon-clock"></i> <span class="screen-reader-text tm-hide">%1$s </span><a href="%2$s" rel="bookmark">%3$s</a></span>',
							esc_attr_x( 'Posted on', 'Used before publish date.', 'fixtech' ),
							esc_url( get_permalink() ),
							$time_string
						);
						
					}
					
					break;
					
				
				case 'author':
					
					
					
					if ( 'post' === get_post_type() ) {
						//$author_avatar_size = apply_filters( 'twentysixteen_author_avatar_size', 49 );
						
						// preparing link
						$author	= '<a class="url fn n" href="' . esc_url( get_author_posts_url( get_the_author_meta( 'ID' ) ) ) . '">'.get_the_author().'</a>';
						
						if( $author_link!=true ){
							$author = strip_tags($author);
						}
						
						$return .= sprintf( '<span class="tm-meta-line byline"><i class="tm-fixtech-icon-user"></i> <span class="author vcard"><span class="screen-reader-text tm-hide">%1$s </span>%2$s</span></span>',
							esc_attr_x( 'Author', 'Used before post author name.', 'fixtech' ),
							$author
						);
					}


					break;
					
					
					
				case 'comment':
				
					if ( ! post_password_required() && ( comments_open() || get_comments_number() ) ) {
						$return .= '<span class="tm-meta-line comments-link"><i class="tm-fixtech-icon-comments-smiley"></i> ';
						ob_start();
						comments_popup_link( esc_attr__( 'Leave a comment', 'fixtech' ) );
						$return .= ob_get_contents();
						ob_end_clean();
						$return .=  '</span>';
					}
					
					break;



				case 'cat':
					$categories_list = get_the_category_list( ', ' );
					if ( !empty($categories_list) ) {
						if( $cat_link!=true ){
							$categories_list = strip_tags($categories_list);
						}
						$return .= sprintf( '<span class="tm-meta-line cat-links"><i class="tm-fixtech-icon-category"></i> <span class="screen-reader-text tm-hide">%1$s </span>%2$s</span>',
							esc_attr_x( 'Categories', 'Used before category names.', 'fixtech' ),
							$categories_list
						);
					}
					
					break;
					
				case 'tag':
					$tags_list = get_the_tag_list( '', esc_attr_x( ', ', 'Used between list items, there is a space after the comma.', 'fixtech' ) );
					if ( !empty($tags_list) ) {
						if( $tag_link!=true ){
							$tags_list = strip_tags($tags_list);
						}
						$return .= sprintf( '<span class="tm-meta-line tags-links"><i class="tm-fixtech-icon-tag"></i> <span class="screen-reader-text tm-hide" tm-hide>%1$s </span>%2$s</span>',
							esc_attr_x( 'Tags', 'Used before tag names.', 'fixtech' ),
							$tags_list
						);
					}
					
					break;
					
			} // switch
			
		} // foreach
		
	}
	
	
	
	// Social share
	if( $metafor != "blogbox" ){
		$social_share = themetechmount_social_share_box('post');
	}
	
	// meta details
	if( !empty($return) ){
		$return = '<div class="tm-entry-meta-wrapper"><div class="entry-meta tm-entry-meta tm-entry-meta-' . $metafor . '">' . $return . '</div>' . $social_share .  '</div>' ;
	}
	
	if( 'link' == get_post_format() || 'quote' == get_post_format() ){
		$return = '';
	}
	
	return $return;
	
	
}
endif;








/**
 * Determine whether blog/site has more than one category.
 *
 * @since Fixtech 1.0
 *
 * @return bool True of there is more than one category, false otherwise.
 */
if( ! function_exists('fixtech_categorized_blog') ){
function fixtech_categorized_blog() {
	if ( false === ( $all_the_cool_cats = get_transient( 'fixtech_categories' ) ) ) {
		// Create an array of all the categories that are attached to posts.
		$all_the_cool_cats = get_categories( array(
			'fields'     => 'ids',
			'hide_empty' => 1,

			// We only need to know if there is more than one category.
			'number'     => 2,
		) );

		// Count the number of categories that are attached to the posts.
		$all_the_cool_cats = count( $all_the_cool_cats );

		set_transient( 'fixtech_categories', $all_the_cool_cats );
	}

	if ( $all_the_cool_cats > 1 ) {
		// This blog has more than 1 category so fixtech_categorized_blog should return true.
		return true;
	} else {
		// This blog has only 1 category so fixtech_categorized_blog should return false.
		return false;
	}
}
}




/*
 *  This function will reset the TGM Activation message box to show if user need to update any plugin or not. This function will call after theme version changed.
 */
if( !function_exists('themetechmount_reset_tgm_infobox') ){
function themetechmount_reset_tgm_infobox(){
	update_user_meta( get_current_user_id(), 'tgmpa_dismissed_notice_tgmpa', '0' );
}
}





/**
 *  CSS Minifier
 */
if( !function_exists('themetechmount_minify_css') ){
function themetechmount_minify_css( $css ){
	if( !empty($css) ){
		// Remove comments
		$css = preg_replace('!/\*[^*]*\*+([^/][^*]*\*+)*/!', '', $css);
		
		// Remove new line charactor
		$css = str_replace(array("\r\n", "\r", "\n", "\t"), '', $css);
		
		// Remove whitespace
		$css = str_replace(array('  ', '   ', '    ', '     ', '      ', '       ', '        ', '         ', '          '), ' ', $css);
		
		// Remove space after colons
		$css = str_replace(': ', ':', $css);
		
		// Remove space near commas
		$css = str_replace(', ', ',', $css);
		$css = str_replace(' ,', ',', $css);

		// Remove space before brackets
		$css = str_replace('{ ', '{', $css);
		$css = str_replace('} ', '}', $css);
		$css = str_replace(' {', '{', $css);
		$css = str_replace(' }', '}', $css);

		// Remove last dot with comma
		$css = str_replace(';}', '}', $css);
		
		// Remove whitespace again
		$css = str_replace(array('  ', '   ', '    ', '     ', '      ', '       ', '        ', '         ', '          '), ' ', $css);
		
		// Remove extra space
		$css = str_replace('; }', ';}', $css);
		
	}
	return $css;
}
}














/**
 *  Get options which has only specific type
 */
if( !function_exists('themetechmount_get_options_type') ){
function themetechmount_get_options_type( $type='themetechmount_background' ){
	$return = array();
	include( get_template_directory() .'/cs-framework-override/config/framework-options.php' );
	foreach( $tm_framework_options as $options_key => $options_val ){
		if( !empty($options_val['fields']) ){
			foreach( $options_val['fields'] as $curr_id=>$field ){
				if( !empty($field['type']) && $field['type']==$type && !empty($field['id']) ){
					$output = ( !empty($field['output']) ) ? $field['output'] : '' ;
					//$return[$field['id']] = $output;
					$return[$field['id']] = $options_val['fields'][$curr_id];
				}
			}
		}
	}
	return $return;
}
}






/**
 *  The properties that can be set, are: background-color, background-image, background-position, background-size, background-repeat, background-origin, background-clip, and background-attachment.
 */
if( !function_exists('themetechmount_get_background_css') ){
function themetechmount_get_background_css( $element_array, $values, $exclude=array() ){
	//$selector        = ( !empty($element_array['output']) ) ? $element_array['output'] : '' ;
	
	$selector = '';
	if( !empty($element_array) && is_array($element_array) && isset($element_array['output']) ){
		$selector = $element_array['output'];
	} else if( !empty($element_array) && is_string($element_array) ){
		$selector = $element_array;
	} 
	
	$return          = array();
	$return_bglayer  = array();
	$rgb_color_layer = '';
	$valid_options   = array(
		'image',
		'color',
		'position',
		'size',
		'repeat',
		'attachment',
	);
	
	
	// color in dropdown
	$dropdown_color = '';
	if( !empty($element_array['color_dropdown_id']) ){
		$dropdown_color = themetechmount_get_option($element_array['color_dropdown_id']);
	}
	

	
	foreach( $valid_options as $option ){
		
		if( isset($values[$option]) && trim($values[$option])!='' ){
			if( $option=='image' ){
				$return[] = 'background-image:url(\''. $values[$option] .'\')';
			} else if( $option=='color' ){
				
				// setting transparent
				if( $dropdown_color=='transparent' ){ $values[$option]='transparent'; }
				
				
				// background color
				
				if( !in_array('background-color',$exclude) && !in_array($dropdown_color, array('grey','darkgrey','white','skincolor') ) ){
					if( substr($values[$option],0,5)=='rgba(' ){
						//$return[]        = 'background-color:'. tm_removeRGBopacity( $values[$option] ); // If RGB color
						$return[]        = 'background-color:'. $values[$option]; // If RGB color
						$rgb_color_layer = 'background-color:'. $values[$option];
					} else {
						$return[] = 'background-color:'. $values[$option];
					}
				}
				
				// bg layer class
				if( !in_array('background-color',$exclude) ){
					$return_bglayer[] = 'background-color:'. $values[$option]; // If RGB color
				}
				
			} else {
				$return[] = 'background-'. $option .':'. $values[$option];
			}
		}
		
	}
	
	
	
	
	
	
	
	
	// Return
	if( count($return)>0 ){
		
		if( $selector=='' ){
			$return = implode( ';', $return ).';';
		} else {
			$return = $selector.'{'.implode( ';', $return ).';}'."\n";
		}
		
		
		// modify selector to select bg layer too
		if( /*$dropdown_color=='custom' &&*/ !in_array('output_bglayer',$exclude) && is_array($return_bglayer) && count($return_bglayer)>0  ){
			if( $selector!='' ){
				$return .= $selector.' > .tm-bg-layer{'.implode( ';', $return_bglayer ).';}'."\n";
			}
		}
		
		
		
	} else {
		$return = '';
	}
	
	
	// Return data
	return $return;
	
	
}
}








/**
 *  The properties that can be set, are: background-color, background-image, background-position, background-size, background-repeat, background-origin, background-clip, and background-attachment.
 */
if( !function_exists('themetechmount_get_all_background_css') ){
function themetechmount_get_all_background_css( $echo=true ){
	$return = array();
	
	// Getting all "themetechmount_background" options 
	$element_ids = themetechmount_get_options_type('themetechmount_background');
	
	
	foreach( $element_ids as $element_id=>$optionlist ){
		$selector_class = $optionlist['output'];
		// modify thissss
		$element_id_val = themetechmount_get_option($element_id);
		$return[]       = themetechmount_get_background_css( $optionlist, $element_id_val );
	}
	
	$return = implode( ' ', $return );
	
	// return data
	return $return;
		
}
}





/**
 *  Generate CSS for all background options
 */
if( !function_exists('themetechmount_get_all_font_css') ){
function themetechmount_get_all_font_css(){
	$return = array();
	
	// Getting all "themetechmount_background" options 
	$element_ids = themetechmount_get_options_type('themetechmount_typography');
	
	
	foreach( $element_ids as $element_id=>$optionlist ){
		$selector_class = $optionlist['output'];
		$element_id_val = themetechmount_get_option($element_id);
		$return[] = themetechmount_get_font_css( $selector_class, $element_id_val );
	}
	
	
	$return = implode( ' ', $return );
	
	// return data
	return $return;
	
}
}





/**
 *  Generate CSS for all font options
 */
if( !function_exists('themetechmount_get_font_css') ){
function themetechmount_get_font_css( $selector, $values, $important=false ){
	$return = array();
	$family = '';
	
	$valid_options = array(
		'variant',
		'text-transform',
		'font-size',
		'line-height',
		'letter-spacing',
		'color',
	);
	
	// Main font
	if( !empty($values['family']) ){
		$family = '"'.$values['family'].'"';
	}
	
	// Backup font
	if( !empty($values['backup-family']) ){
		$family .= ', '.$values['backup-family'];
	}
	$return[] = 'font-family:'. $family;
	
	$important = ($important==true) ? ' !important' : '' ;
	
	
	// Loop other font css
	foreach( $valid_options as $option ){
		if( !empty($values[$option]) ){
			
			// Prefix
			$prefix = (
				   $option=='font-size'
				|| $option=='line-height'
				|| $option=='letter-spacing'
			) ? 'px' : '' ;
		
			if( $option=='variant' ){
				if( $values[$option]!='regular' ){
					$return[] = 'font-weight:'.$values[$option] . $important;
				}
			} else {
				$return[] = trim($option).':'.$values[$option] . $prefix . $important;
			}
		}
	}
	
	
	
	
	// Return
	if( count($return)>0 ){
		if( $selector!='' ){
			$return = $selector .'{'.implode( ';', $return ).';}'."\n";
		} else {
			$return = implode( ';', $return ).';';
		}
		
	} else {
		$return = '';
	}
	
	// return data
	return $return;
	
	
}
}










/*
 *  Check if color is dark. This is new version. This will return TRUE if dark color.
 */
if( !function_exists('themetechmount_check_dark_color') ){
function themetechmount_check_dark_color($hex){
	//$hex = "78ff2f"; //Bg color in hex, without any prefixing #!
	
	// strip off any leading #
	$hex = str_replace('#', '', $hex);

	//break up the color in its RGB components
	$r = hexdec(substr($hex,0,2));
	$g = hexdec(substr($hex,2,2));
	$b = hexdec(substr($hex,4,2));

	//do simple weighted avarage
	//
	//(This might be overly simplistic as different colors are perceived
	// differently. That is a green of 128 might be brighter than a red of 128.
	// But as long as it's just about picking a white or black text color...)
	if($r + $g + $b > 382){
		return false;
		//bright color, use dark font
	}else{
		return true;
		//dark color, use bright font
	}
}
}








/*
 *  Max Mega Menu : Default theme setup
 */
if( !function_exists('themetechmount_mmmenu_theme_setup') ){
function themetechmount_mmmenu_theme_setup(){
	$megamenu_themes       = get_option('megamenu_themes');
	$tm_mmmenu_theme_saved = get_option('tm_mmmenu_theme_saved');
	
	if( $tm_mmmenu_theme_saved!=='yes' ){
		$megamenu_themes['default'] = array(
			"title" => "Default",
			"arrow_up" => "dash-f343",
			"arrow_down" => "dash-f347",
			"arrow_left" => "dash-f341",
			"arrow_right" => "dash-f345",
			"responsive_breakpoint" => "1200px",
			"responsive_text" => "",
			"line_height" => "1.7",
			"z_index" => "999",
			"shadow_horizontal" => "0px",
			"shadow_vertical" => "0px",
			"shadow_blur" => "5px",
			"shadow_spread" => "0px",
			"shadow_color" => "rgba(0, 0, 0, 0.1)",
			"container_background_from" =>  "rgba(34, 34, 34, 0)",
			"container_background_to" =>  "rgba(34, 34, 34, 0)",
			"container_padding_top" => "0px",
			"container_padding_right" => "0px",
			"container_padding_bottom" => "0px",
			"container_padding_left" => "0px",
			"container_border_radius_top_left" => "0px",
			"container_border_radius_top_right" => "0px",
			"container_border_radius_bottom_right" => "0px",
			"container_border_radius_bottom_left" => "0px",
			"menu_item_align" => "left",
			"menu_item_background_from" => "rgba(0,0,0,0)",
			"menu_item_background_to" => "rgba(0,0,0,0)",
			"menu_item_background_hover_from" => "#333",
			"menu_item_background_hover_to" => "#333",
			"menu_item_spacing" => "0px",
			"menu_item_link_height" => "40px",
			"menu_item_link_color" => "#ffffff",
			"menu_item_link_font_size" => "14px",
			"menu_item_link_font" => "inherit",
			"menu_item_link_text_transform" => "none",
			"menu_item_link_weight" => "normal",
			"menu_item_link_text_decoration" => "none",
			"menu_item_link_color_hover" => "#ffffff",
			"menu_item_link_weight_hover" => "bold",
			"menu_item_link_text_decoration_hover" => "none",
			"menu_item_link_padding_top" => "0px",
			"menu_item_link_padding_right" => "10px",
			"menu_item_link_padding_bottom" => "0px",
			"menu_item_link_padding_left" => "10px",
			"menu_item_border_color" => "#fff",
			"menu_item_border_top" => "0px",
			"menu_item_border_right" => "0px",
			"menu_item_border_bottom" => "0px",
			"menu_item_border_left" => "0px",
			"menu_item_border_color_hover" => "#fff",
			"menu_item_link_border_radius_top_left" => "0px",
			"menu_item_link_border_radius_top_right" => "0px",
			"menu_item_link_border_radius_bottom_right" => "0px",
			"menu_item_link_border_radius_bottom_left" => "0px",
			"menu_item_divider_color" => "rgba(255, 255, 255, 0.1)",
			"menu_item_divider_glow_opacity" => "0.1",
			"panel_background_from" => "#f1f1f1",
			"panel_background_to" => "#f1f1f1",
			"panel_width" => "100%",
			"panel_padding_top" => "0px",
			"panel_padding_right" => "0px",
			"panel_padding_bottom" => "0px",
			"panel_padding_left" => "0px",
			"panel_border_color" => "#fff",
			"panel_border_top" => "0px",
			"panel_border_right" => "0px",
			"panel_border_bottom" => "0px",
			"panel_border_left" => "0px",
			"panel_border_radius_top_left" => "0px",
			"panel_border_radius_top_right" => "0px",
			"panel_border_radius_bottom_right" => "0px",
			"panel_border_radius_bottom_left" => "0px",
			"panel_widget_padding_top" => "15px",
			"panel_widget_padding_right" => "15px",
			"panel_widget_padding_bottom" => "15px",
			"panel_widget_padding_left" => "15px",
			"panel_header_color" => "#555",
			"panel_header_font_size" => "16px",
			"panel_header_font" => "inherit",
			"panel_header_font_weight" => "bold",
			"panel_header_text_transform" => "uppercase",
			"panel_header_text_decoration" => "none",
			"panel_font_color" => "#666",
			"panel_font_size" => "14px",
			"panel_font_family" => "inherit",
			"panel_header_padding_top" => "0px",
			"panel_header_padding_right" => "0px",
			"panel_header_padding_bottom" => "5px",
			"panel_header_padding_left" => "0px",
			"panel_header_margin_top" => "0px",
			"panel_header_margin_right" => "0px",
			"panel_header_margin_bottom" => "0px",
			"panel_header_margin_left" => "0px",
			"panel_header_border_color" => "#555",
			"panel_header_border_top" => "0px",
			"panel_header_border_right" => "0px",
			"panel_header_border_bottom" => "0px",
			"panel_header_border_left" => "0px",
			"panel_second_level_font_color" => "#555",
			"panel_second_level_font_size" => "16px",
			"panel_second_level_font" => "inherit",
			"panel_second_level_font_weight" => "bold",
			"panel_second_level_text_transform" => "uppercase",
			"panel_second_level_text_decoration" => "none",
			"panel_second_level_font_color_hover" => "#555",
			"panel_second_level_font_weight_hover" => "bold",
			"panel_second_level_text_decoration_hover" => "none",
			"panel_second_level_background_hover_from" => "rgba(0,0,0,0)",
			"panel_second_level_background_hover_to" => "rgba(0,0,0,0)",
			"panel_second_level_padding_top" => "0px",
			"panel_second_level_padding_right" => "0px",
			"panel_second_level_padding_bottom" => "0px",
			"panel_second_level_padding_left" => "0px",
			"panel_second_level_margin_top" => "0px",
			"panel_second_level_margin_right" => "0px",
			"panel_second_level_margin_bottom" => "0px",
			"panel_second_level_margin_left" => "0px",
			"panel_second_level_border_color" => "#555",
			"panel_second_level_border_top" => "0px",
			"panel_second_level_border_right" => "0px",
			"panel_second_level_border_bottom" => "0px",
			"panel_second_level_border_left" => "0px",
			"panel_third_level_font_color" => "#666",
			"panel_third_level_font_size" => "14px",
			"panel_third_level_font" => "inherit",
			"panel_third_level_font_weight" => "normal",
			"panel_third_level_text_transform" => "none",
			"panel_third_level_text_decoration" => "none",
			"panel_third_level_font_color_hover" => "#666",
			"panel_third_level_font_weight_hover" => "normal",
			"panel_third_level_text_decoration_hover" => "none",
			"panel_third_level_background_hover_from" => "rgba(0,0,0,0)",
			"panel_third_level_background_hover_to" => "rgba(0,0,0,0)",
			"panel_third_level_padding_top" => "0px",
			"panel_third_level_padding_right" => "0px",
			"panel_third_level_padding_bottom" => "0px",
			"panel_third_level_padding_left" => "0px",
			"flyout_menu_background_from" => "#f1f1f1",
			"flyout_menu_background_to" => "#f1f1f1",
			"flyout_width" => "150px",
			"flyout_padding_top" => "0px",
			"flyout_padding_right" => "0px",
			"flyout_padding_bottom" => "0px",
			"flyout_padding_left" => "0px",
			"flyout_border_color" => "#ffffff",
			"flyout_border_top" => "0px",
			"flyout_border_right" => "0px",
			"flyout_border_bottom" => "0px",
			"flyout_border_left" => "0px",
			"flyout_border_radius_top_left" => "0px",
			"flyout_border_radius_top_right" => "0px",
			"flyout_border_radius_bottom_right" => "0px",
			"flyout_border_radius_bottom_left" => "0px",
			"flyout_background_from" => "#f1f1f1",
			"flyout_background_to" => "#f1f1f1",
			"flyout_background_hover_from" => "#dddddd",
			"flyout_background_hover_to" => "#dddddd",
			"flyout_link_height" => "35px",
			"flyout_link_padding_top" => "0px",
			"flyout_link_padding_right" => "10px",
			"flyout_link_padding_bottom" => "0px",
			"flyout_link_padding_left" => "10px",
			"flyout_link_color" => "#666",
			"flyout_link_size" => "14px",
			"flyout_link_family" => "inherit",
			"flyout_link_text_transform" => "none",
			"flyout_link_weight" => "normal",
			"flyout_link_text_decoration" => "none",
			"flyout_link_color_hover" => "#666",
			"flyout_link_weight_hover" => "normal",
			"flyout_link_text_decoration_hover" => "none",
			"flyout_menu_item_divider_color" =>  "rgba(255, 255, 255, 0.1)",
			"custom_css" => '#{$wrap} #{$menu} {
			/** Custom styles should be added below this line **/
			}
			#{$wrap} { 
			clear: both;
			}'
		);
		
		//  Saving new theme
		update_option('megamenu_themes', $megamenu_themes);
		update_option('tm_mmmenu_theme_saved', 'yes');
	}
}  // function themetechmount_mmmenu_theme_setup()
}








/**
 *  Custom code - Body start code
 */
if( !function_exists('themetechmount_body_start_code') ){
function themetechmount_body_start_code(){
	$return               = '';
	$page_loader          = '';
	$customhtml_bodystart = trim(themetechmount_get_option('customhtml_bodystart'));
	$loaderimg            = themetechmount_get_option('loaderimg');
	$loaderimage_custom   = themetechmount_get_option('loaderimage_custom');
	
	// Body Start
	if( !empty( $customhtml_bodystart ) ){
		// We are not sanitizing this as we are expecting any (HTML, CSS, JS) code here
		$return .= $customhtml_bodystart;
	}
	
	// Show page loader if enabled
	if( !empty( $loaderimg ) ){
		if( $loaderimg=='custom' ){
			if( !empty($loaderimage_custom) ){
				$imgdata = wp_get_attachment_image_src( $loaderimage_custom, 'full' );
				if( !empty($imgdata[0]) ){
					$page_loader = '<div class="tm-page-loader-wrapper"></div>';  // We are not sanitizing this as we are expecting any (HTML, CSS, JS) code here
				}
				
			}
		} else {
			$page_loader = '<div class="tm-page-loader-wrapper"></div>';  // We are not sanitizing this as we are expecting any (HTML, CSS, JS) code here
		}
		
		
	}
	
	echo $return . $page_loader;
	
}
}








/**
 *  Custom code - Body start code
 */
if( !function_exists('themetechmount_get_page_loader_css') ){
function themetechmount_get_page_loader_css(){
	$return             = '';
	$loaderimg          = themetechmount_get_option('loaderimg');
	$loaderimage_custom = themetechmount_get_option('loaderimage_custom');
	
	
	if( !empty( $loaderimg ) ){
		
		$img_src = '';
		
		if( $loaderimg=='custom' ){
			if( !empty($loaderimage_custom) ){
				$imgdata = wp_get_attachment_image_src( $loaderimage_custom, 'full' );
				if( !empty($imgdata[0]) ){ $img_src = $imgdata[0]; }
			}
		} else {
			$img_src = get_template_directory_uri() .'/images/loader'. $loaderimg .'.gif';
		}


		$return = '.tm-page-loader-wrapper{background-image:url(' . esc_url( $img_src ) . ')}';
		
	};
	
	return $return;
}
}













/**
 *  Blogbox footer meta options
 */
if ( !function_exists( 'themetechmount_blogbox_footer' ) ){
function themetechmount_blogbox_footer(){
	
	$return = '';
	
	ob_start();
	get_template_part('template-parts/blogbox/blogbox','footer');
	$return = ob_get_contents();
	ob_end_clean();
	
	return $return;
}
}








/**
 * Print HTML with icon for current post.
 *
 * Create your own themetechmount_blogbox_comment_count() to override in a child theme.
 *
 * @since Fixtech 1.0
 *
 */
if ( !function_exists( 'themetechmount_blogbox_comment_count' ) ){
function themetechmount_blogbox_comment_count( $echo = false ) {
	$return = '';
	if( comments_open() ){
		//$return .= '<div class="themetechmount-blogbox-footer-right themetechmount-wrap-cell">';
		$comments = wp_count_comments( get_the_ID() );
		$comments = $comments->approved; //Get Total Comments
		$return .= '<div class="themetechmount-blogbox-comment"><i class="tm-fixtech-icon-comment"></i> '. $comments .'</div>';
		//$return .= '</div>';
	}
	return $return;
}
}





/**
 *  Post thumbnail. This will echo post thumbnail according to port format like video, audio etc.
 */
if ( !function_exists( 'themetechmount_featured_image' ) ){
function themetechmount_featured_image($size='full'){
	$return = '';
	/*
	if( has_post_thumbnail() ){
		$return = get_the_post_thumbnail( get_the_ID(), $size );
	}
	*/
	if( has_post_thumbnail() ){
		$img_attribs = wp_get_attachment_image_src( get_post_thumbnail_id(), $size ); // returns an array
		if( $img_attribs ) {
			$return = '<img src="' . $img_attribs[0] . '" width="' . $img_attribs[1] . '" height="' . $img_attribs[2] . '" alt="' . get_the_title() . '" class="attachment-' . $size . ' size-' . $size . ' wp-post-image">';
		}
	}
	
	
	if( !empty($return) ){
		$return = '
		<div class="themetechmount-item-thumbnail">
			<div class="themetechmount-item-thumbnail-inner">
				' . $return . '
			</div>
		</div>';
	}
	
	return $return;
	
}
}






/******************************************************************/
/* ----------------------- Team Member  ------------------------- */

/* Get single team member view style */
if ( !function_exists( 'themetechmount_team_member_single_view' ) ){
function themetechmount_team_member_single_view() {
	$view = '';
	$team_member_viewstyle = themetechmount_get_option('team_member_viewstyle');
	
	// Fetching global value for Single Portfolio View style
	if( !empty($team_member_viewstyle) ){
		$view = $team_member_viewstyle;
	}
	
	// Fetching this single portfolio value... if set
	$single_viewstyle = get_post_meta( get_the_ID(), 'themetechmount_team_member_single_view', true );
	if( !empty($single_viewstyle['viewstyle']) ){
		$view = $single_viewstyle['viewstyle'];
	}
	
	return $view;
}
}



/**
 *  Get single team member - position
 */
if ( !function_exists( 'themetechmount_team_member_single_meta' ) ){
function themetechmount_team_member_single_meta( $type='position', $post_id='' ) {
	$return = '';
	if( empty($post_id) ){
		$post_id = get_the_ID();
	}
	
	$types = array( 'position', 'phone', 'email', 'website' );
	
	if( !empty($type) ){
		
		// Position
		if( in_array( $type, $types ) ){
			$meta_data = get_post_meta( $post_id, 'themetechmount_team_member_details', true );
			if( !empty($meta_data['tm_team_info']['team_details_line_'.$type]) ){
				$return = $meta_data['tm_team_info']['team_details_line_'.$type];
			}
		}
		
		// Preparing output according to data type
		if( !empty($return) ){
			
			switch( $type ){
				case 'position':
					$return = '<h5 class="tm-team-member-single-position">' . $return . '</h5>';
					break;
					
				case 'phone':
					$return = '<div class="tm-team-list-title tm-skincolor"><i class="tm-fixtech-icon-phone"></i> '. esc_attr__('Phone','fixtech') .'</div>
						<div class="tm-team-list-value"><a href="tel:' . $return . '">' . $return . '</a></div>';
					break;
					
				case 'email':
					$return = '<div class="tm-team-list-title tm-skincolor"><i class="tm-fixtech-icon-mail"></i> '. esc_attr__('Email','fixtech') .'</div>
						<div class="tm-team-list-value"><a href="mailto:' . $return . '">' . $return . '</a></div>';
					break;
					
				case 'website':
					
					$return_link = $return;
					if( substr($return_link, 0, 3)=='www' ){
						$return_link = 'http://'.$return;
					}
				
					$return = '<div class="tm-team-list-title tm-skincolor"><i class="tm-fixtech-icon-world"></i> '. esc_attr__('Website','fixtech') .'</div>
						<div class="tm-team-list-value"><a target="_blank" href="' . $return_link . '">' . $return . '</a></div>';
					break;
			
			}
			
		}
		
	}
	
	
	return $return;
}
}





/**
 *  Single Team member content
 */
if ( !function_exists( 'themetechmount_team_member_meta_details' ) ){
function themetechmount_team_member_meta_details( $post_id='' ){
	$return  = '';
	$phone   = themetechmount_wp_kses( themetechmount_team_member_single_meta( 'phone' ) );
	$email   = themetechmount_wp_kses( themetechmount_team_member_single_meta( 'email' ) );
	$website = themetechmount_wp_kses( themetechmount_team_member_single_meta( 'website' ) ); 
	
	
	if( !empty($phone) ){
		$return .= '<li class="tm-team-details-line tm-team-extra-details-line-phone">' . $phone . '</li>';
	}
	if( !empty($email) ){
		$return .= '<li class="tm-team-details-line tm-team-extra-details-line-email">' . $email . '</li>';
	}
	if( !empty($website) ){
		$return .= '<li class="tm-team-details-line tm-team-extra-details-line-website">' . $website . '</li>';
	}
	
	
	
	// final output
	if( !empty($return) ){
		$return = '<div class="tm-team-details-wrapper"><ul class="tm-team-details-list">' . $return . '</ul></div>';
	}
	
	return $return;
}
}





/**
 *  Single Team member extra details (list items)
 */
if ( !function_exists( 'themetechmount_team_member_extra_details' ) ){
function themetechmount_team_member_extra_details( $post_id='' ){
	$return                   = '';
	$team_extra_details_lines = themetechmount_get_option('team_extra_details_lines');

	if( empty($post_id) ){
		$post_id = get_the_ID();
	}
	
	if( !empty($team_extra_details_lines) && is_array($team_extra_details_lines) && count($team_extra_details_lines) > 0 ){
		
		// getting value from single team member
		$post_meta = get_post_meta( $post_id, 'themetechmount_team_member_details', true );
		
		foreach( $team_extra_details_lines as $key=>$val ){
			
			
			
			if( !empty($post_meta['tm_team_info']['team_extra_details_line_'.$key]) ){
				$icon  = themetechmount_create_icon_from_data( $val['team_extra_details_line_icon'], true );
				$title = (!empty($val['team_extra_details_line_title'])) ? esc_attr($val['team_extra_details_line_title']) . ' ' : '' ;
				$value =  $post_meta['tm_team_info']['team_extra_details_line_'.$key];
				
				// Check if icon not exists so we can set class
				$icon_none = ( !empty($icon) ) ? '' : 'tm-list-detail-no-icon' ;
				
				$return .= '<li class="tm-team-details-line tm-team-extra-details-line-' . $key . ' ' . $icon_none . '">
					<div class="tm-team-list-title tm-skincolor">' . $icon . $title . '</div>
					<div class="tm-team-list-value">' . $value . '</div>
				</li>';
				
			}
			
		} // foreach
		
	} // if
	
	
	if( !empty($return) ){
		$return = '<div class="tm-team-details-wrapper tm-team-extra-details-wrapper"><ul class="tm-team-details-list tm-team-extra-details-list">' . $return . '</ul></div>';
	}
	
	
	return $return;
	
}
}






/**
 *  Icon from array
 */
if ( !function_exists( 'themetechmount_create_icon_from_data' ) ){
function themetechmount_create_icon_from_data( $data, $i_tag_only=false ){

	$return = '';
	
	if( isset($data['library']) && isset($data['library_fontawesome']) && isset($data['library_linecons']) && isset($data['library_themify']) ){
		
		$library             = $data['library'];
		$library_fontawesome = $data['library_fontawesome'];
		$library_linecons    = $data['library_linecons'];
		$library_themify     = $data['library_themify'];
		
		if( !empty($$library) ){
			
			$return = do_shortcode('[tm-icon type="'.$library.'" icon_fontawesome="'.$library_fontawesome.'" icon_linecons="'.$library_linecons.'" icon_themify="'.$library_themify.'"]');
			
			if( $i_tag_only==true ){
				$return = '<i class="' . ${'library_'.$library} . '"></i>';
			}
			
		}
		
	}
	
	return $return;
	
}
}


/**
 *  Single Team member content
 */
if ( !function_exists( 'themetechmount_team_member_content' ) ){
function themetechmount_team_member_content( $post_id='' ){
	$return = '';
	
	// processing content
	$content = get_the_content( null, false );
	$content = apply_filters( 'the_content', $content );
	$content = str_replace( ']]>', ']]&gt;', $content );
	
	// preparing final output
	$return = '<div class="tm-team-member-content">' . $content . '</div><!-- .tm-team-member-content -->';
	
	return $return;
}
}



/**
 *  Single Team member show category
 */
if ( !function_exists( 'themetechmount_team_member_single_category_list' ) ){
function themetechmount_team_member_single_category_list( $post_id='' ){
	$return = '';
	
	if( empty($post_id) ){
		$post_id = get_the_ID();
	}
	
	
	$categories_list = wp_get_post_terms( $post_id, 'tm_team_group' );
	
	//var_dump($categories_list);
	
	if( is_array($categories_list) && count($categories_list)>0 ){
		$x = 1;
		foreach( $categories_list as $category ){
			if( $x != 1 ){ $return .= '&nbsp; / &nbsp;'; } $x++;
			$return .= '<a href="' . get_term_link( $category->term_id ) . '">' . esc_attr($category->name) . '</a>';
			
		}
	}
	
	
	if( !empty($return) ){
		$return = '<div class="tm-team-member-single-category">' . $return . '</div>';
	}
	
	return $return;
	
}
}





/**
 *  Single Team member extra details (list items)
 */
if ( !function_exists( 'themetechmount_team_member_single_excerpt' ) ){
function themetechmount_team_member_single_excerpt(){
	$return  = '';
	$excerpt = get_the_excerpt();
	
	if( !empty($excerpt) ){
		$excerpt = apply_filters( 'the_content', $excerpt );
		$excerpt = str_replace( ']]>', ']]&gt;', $excerpt );
		$return = '<div class="tm-team-member-excerpt">' . $excerpt . '</div>';
	}
	
	return $return;
	
}
}









/******************************************************************/
/* ----------------------- Portfolio box ------------------------- */
if ( !function_exists( 'themetechmount_portfolio_next_prev_btn' ) ){
function themetechmount_portfolio_next_prev_btn() {
	$return = '';
	
	if( is_singular('tm_portfolio') ){
		
		$return = get_the_post_navigation( array(
			'next_text' => '<span class="meta-nav tm-hide" aria-hidden="true">' . __( 'Next', 'fixtech' ) . '</span> ' .
				'<span class="screen-reader-text tm-hide">' . __( 'Next post:', 'fixtech' ) . '</span> ' .
				'<span class="post-title tm-hide">%title</span>',
			'prev_text' => '<span class="meta-nav tm-hide" aria-hidden="true">' . __( 'Previous', 'fixtech' ) . '</span> ' .
				'<span class="screen-reader-text tm-hide">' . __( 'Previous post:', 'fixtech' ) . '</span> ' .
				'<span class="post-title tm-hide">%title</span>',
		) );

	}
	
	return $return;
	
}
}



if ( !function_exists( 'themetechmount_portfolio_category' ) ){
function themetechmount_portfolio_category( $link=true ) {
	$return = get_the_term_list( get_the_ID(), 'tm_portfolio_category', '', ', ' );
	if( $link!=true ){
		$return = strip_tags($return);
	}
	return $return;
}
}





/* Get single portfolio view style */
if ( !function_exists( 'themetechmount_portfolio_single_view' ) ){
function themetechmount_portfolio_single_view() {
	$view                = '';
	$portfolio_viewstyle = themetechmount_get_option('portfolio_viewstyle');
	
	// Fetching global value for Single Portfolio View style
	if( !empty($portfolio_viewstyle) ){
		$view = $portfolio_viewstyle;
	}
	
	// Fetching this single portfolio value... if set
	$single_viewstyle = get_post_meta( get_the_ID(), 'themetechmount_portfolio_view', true );
	if( !empty($single_viewstyle['viewstyle']) ){
		$view = $single_viewstyle['viewstyle'];
	}
	
	return $view;
}
}







/* Portfolio details box */
if( !function_exists('themetechmount_portfolio_detailsbox') ){
function themetechmount_portfolio_detailsbox(){
	$return                    = '';
	$portfolio_project_details = themetechmount_get_option('portfolio_project_details');
	$pf_details_line           = themetechmount_get_option('pf_details_line');
	
	// Box title
	$box_title = '';
	if( !empty($portfolio_project_details) ){
		$box_title = esc_attr( $portfolio_project_details );
	}
	if( !empty($box_title) ){
		$box_title = '<h2 class="themetechmount-pf-detailbox-title">'.$box_title.'</h2>';
	}
	
	$return .= '
	<div class="themetechmount-pf-detailbox">
		<div class="themetechmount-pf-detailbox-inner">
			' . $box_title . '
			<ul class="themetechmount-pf-detailbox-list">';
	
	$page_values = get_post_meta( get_the_ID(), 'themetechmount_portfolio_list_data', true );
	$page_values = $page_values['tm_pf_list_data'];
	
	
	if( isset($pf_details_line) && is_array($pf_details_line) && count($pf_details_line)>0 ){
		foreach( $pf_details_line as $key=>$val ){
			
			$row_title = '';
			$row_value = '';
			$icon      = themetechmount_create_icon_from_data( $val['pf_details_line_icon'], true );
			
			if( !empty($val['pf_details_line_title']) ){ $row_title = sprintf( __('%s', 'fixtech'), $val['pf_details_line_title'] ); }
			if( !empty($page_values['pf_details_line_'.$key]) ){ $row_value = nl2br($page_values['pf_details_line_'.$key]); }
			
			// Dynamic value
			if( !empty($val['data']) ){
				if($val['data']=='date'){
					$row_value = get_the_date();
				} else if($val['data']=='category'){
					$row_value = strip_tags( get_the_term_list( $post_id, 'tm_portfolio_category', '', ', ', '' ) );
				} else if($val['data']=='category_link'){
					$row_value = get_the_term_list( $post_id, 'tm_portfolio_category', '', ', ', '' );
				} else if($val['data']=='tag'){
					$row_value = strip_tags( get_the_term_list( $post_id, 'tm_portfolio_tags', '', ', ', '' ) );
				} else if($val['data']=='tag_link'){
					$row_value = get_the_term_list( $post_id, 'tm_portfolio_tags', '', ', ', '' );
				}
			}
			
			
			if( !empty($row_value) ){
				$return .= '
						<li class="tm-pf-details-date">
							<span class="tm-pf-left-details">'. $icon .' '. $row_title .'</span>
							<span class="tm-pf-right-details">'. $row_value .'</span>
						</li>';
			}
		
		
		}
	}
	
	
	$return .= '
			</ul>
		</div><!-- .themetechmount-pf-detailbox-inner -->
	</div><!-- .themetechmount-pf-detailbox -->
	
	';
	
	
	return $return;
}
}





/**
 *  Blogbox class : themetechmount_portfoliobox_class()
 */
if ( !function_exists( 'themetechmount_portfoliobox_class' ) ){
function themetechmount_portfoliobox_class(){
	$return = '';
	
	return $return;
	
}
}




if ( !function_exists( 'themetechmount_portfoliobox_media_link' ) ){
function themetechmount_portfoliobox_media_link( $default_icon='tm-fixtech-icon-search', $video_icon='tm-fixtech-icon-video', $audio_icon='tm-fixtech-icon-music-alt', $slider_icon='tm-fixtech-icon-gallery-1' ){

	$icon_code='<i class="tm-fixtech-icon-search"></i>';
	if( !empty($default_icon) ){
		$icon_code='<i class="' . $default_icon . '"></i>';
	}
	

	// getting single portfolio feature type
	$portfolio_featured = get_post_meta( get_the_ID(), 'themetechmount_portfolio_featured' , true );
	
	// default output
	$return = '<a class="tm_prettyphoto" title="' . get_the_title() . '" href="' . esc_url(themetechmount_portfolio_single_image_path()) . '">' . $icon_code . '</a>';
	
	
	// preparing output
	if( !empty($portfolio_featured['featuredtype']) ){
		
		switch( $portfolio_featured['featuredtype'] ){
			
			case 'slider':
				// icon
				if( !empty($slider_icon) ){
					$icon_code='<i class="' . $slider_icon . '"></i>';
				}
				
				$return = '<a title="' . get_the_title() . '" class="themetechmount-open-gallery" data-id="' . get_the_ID() . '" href="#themetechmount-embed-code-' . get_the_ID() . '">' . $icon_code . '</a>';
				
				if( !empty($portfolio_featured['slide_images']) ){
					$slider_images = explode( ',', $portfolio_featured['slide_images'] );
					if( is_array($slider_images) && count($slider_images)>0 ){
						
						$api_images_src   = '';
						$api_images_title = '';
						$api_images_desc  = '';
						
						$x = 1;
						foreach( $slider_images as $slide_image ){
							$comma = ( $x!=1 ) ? ',' : '' ;
							
							$img_src = wp_get_attachment_image_src($slide_image, 'full');
							$img_src = $img_src[0];
							
							$api_images_src   .= $comma . '"' . $img_src . '"';
							$api_images_title .= $comma . '"' . get_the_title() . '"';
							$api_images_desc  .= $comma . '""';
							$x++;
						}
						
						$return .= '<script type="text/javascript">';
							$return .= 'api_images_' . get_the_ID() . ' = ['.$api_images_src.'];';
							$return .= 'api_titles_' . get_the_ID() . ' = ['.$api_images_title.'];';
							$return .= 'api_desc_' . get_the_ID() . ' = ['.$api_images_desc.'];';
						$return .= '</script>';
						
						
					}
				}
				
				break;
				
			case 'video':
				
				// icon
				if( !empty($video_icon) ){
					$icon_code='<i class="' . $video_icon . '"></i>';
				}
				
				if( !empty($portfolio_featured['video_code']) ){
					$return = '<a title="' . get_the_title() . '" class="tm_prettyphoto" href="' . esc_url( $portfolio_featured['video_code'] ) . '">' . $icon_code . '</a>';
				}
				break;
				
			case 'audioembed':
				
				// icon
				if( !empty($audio_icon) ){
					$icon_code='<i class="' . $audio_icon . '"></i>';
				}
				
				$return = '<a title="' . get_the_title() . '" class="tm_prettyphoto" href="#themetechmount-embed-code-' . get_the_ID() . '">' . $icon_code . '</a>';
				if( !empty($portfolio_featured['audio_code']) ){
					$return .= '<div class="tm-hide" id="themetechmount-embed-code-' . get_the_ID() . '">' . $portfolio_featured['audio_code'] . '</div>';
				}
				break;
			
		}
		
		
	}
	
	return $return;
}
}






if ( !function_exists( 'themetechmount_portfoliobox_footer' ) ){
function themetechmount_portfoliobox_footer(){
	$return = '';
	return $return;
}
}


if ( !function_exists( 'themetechmount_get_meta' ) ){
function themetechmount_get_meta( $meta_group='', $meta_id='' , $meta_sub_id='' ){
	$return = '';
	
	$meta_group_value = get_post_meta( get_the_ID(), $meta_group, true );
	
	if( !empty($meta_group_value[$meta_id][$meta_sub_id]) ){
		$return = $meta_group_value[$meta_id][$meta_sub_id];
	} else if( !empty($meta_group_value[$meta_id]) ){
		$return = $meta_group_value[$meta_id];
	}
	
	
	// return data
	return $return;
	
}
}




/**
 *  Portfolio Gallery - DEVELOPMENT PENDING
 */
if( !function_exists('themetechmount_featured_gallery_slider') ){
function themetechmount_featured_gallery_slider(){
	$return = '';
	return $return;
}
}





/**
 *  Social share box
 */
if ( !function_exists( 'themetechmount_social_share_box' ) ){
function themetechmount_social_share_box($post_type='portfolio'){
	
	$return       = '';
	$social_links = '';
	$button_html  = '';
	$portfolio_single_top_btn_title = themetechmount_get_option('portfolio_single_top_btn_title');
	$portfolio_single_top_btn_link  = themetechmount_get_option('portfolio_single_top_btn_link');
	$portfolio_social_share_title   = themetechmount_get_option('portfolio_social_share_title');
	
	
	// preparing social links
	switch($post_type){
		case 'portfolio':
			if( themetechmount_get_option('portfolio_show_social_share')==true ){
				$social_links = themetechmount_social_share_links('portfolio');
			}
			break;
		case 'post':
			$social_links = themetechmount_social_share_links('post');
			break;
	}
	
	
	// preparing button
	if( !empty($portfolio_single_top_btn_title) && !empty($portfolio_single_top_btn_title) ){
		$button_html  = '<div class="tm-single-top-btn">';
		
		$button_html .= do_shortcode('[tm-btn title="' . $portfolio_single_top_btn_title . '" style="outline" shape="square" color="black" size="sm" i_align="right" i_icon_themify="themifyicon ti-arrow-right" add_icon="true" link="url:' . urlencode(esc_url($portfolio_single_top_btn_link)) . '|||"]');
		$button_html .= '</div>';
	}
	
	
	if( !empty($social_links) ){
		
		// preparing output according to CPT
		if( $post_type=='portfolio' ){
			$return = '<div class="tm-social-share-wrapper tm-social-share-' . $post_type . '-wrapper">';
			
			// social share title
			if( !empty($portfolio_social_share_title) ){
				$return .= '<div class="tm-social-share-title">'. $portfolio_social_share_title .'</div>';
			}
			
			// social links
			$return .= $social_links;
			
			// button after this
			$return .= $button_html;
			
			$return .= '</div>';
			$return .= '<div class="clearfix"></div>';
		}
		
		
		
		if( $post_type=='post' ){
			$return = '<div class="tm-social-share-wrapper tm-social-share-' . $post_type . '-wrapper">';
				$return .= $social_links; // social links
			$return .= '</div>';
			$return .= '<div class="clearfix"></div>';
		}
		
		
	}
	
	
	return $return;
}
}






/**
 *  Social share links only
 */
if ( !function_exists( 'themetechmount_social_share_links' ) ){
function themetechmount_social_share_links( $post_type='portfolio' ){
	$post_type = esc_attr($post_type);
	
	if( !empty($post_type) ){
		
		$post_type = esc_attr($post_type);
		
		${ $post_type.'_social_share_services' } = themetechmount_get_option( $post_type.'_social_share_services' );
		
		$return = '';
		
		if( !empty( ${ $post_type.'_social_share_services' } ) && is_array( ${$post_type.'_social_share_services'} ) && count( ${$post_type.'_social_share_services'} > 0 ) ){
			foreach( ${$post_type.'_social_share_services'} as $social ){
				
				switch($social){
					case 'facebook':
						$link = '//web.facebook.com/sharer/sharer.php?u='.urlencode(get_permalink()). '&_rdr';
						break;
						
					case 'twitter':
						$link = '//twitter.com/share?url='. get_permalink();
						break;
					
					case 'gplus':
						$link = '//plus.google.com/share?url='. get_permalink();
						break;
					
					case 'pinterest':
						$link = '//www.pinterest.com/pin/create/button/?url='. get_permalink();
						break;
						
					case 'linkedin':
						$link = '//www.linkedin.com/shareArticle?mini=true&url='. get_permalink();
						break;
						
					case 'stumbleupon':
						$link = '//stumbleupon.com/submit?url='. get_permalink();
						break;
					
					case 'tumblr':
						$link = '//tumblr.com/share/link?url='. get_permalink();
						break;
						
					case 'reddit':
						$link = '//reddit.com/submit?url='. get_permalink();
						break;
						
					case 'digg':
						$link = '//www.digg.com/submit?url='. get_permalink();
						break;
						
				} // switch end here
				
				// Now preparing the icon
				$return .= '<li class="tm-social-share tm-social-share-'. $social .'">
				<a href="javascript:void(0)" onClick="TMSocialWindow=window.open(\''. esc_url($link) .'\',\'TMSocialWindow\',width=600,height=100); return false;"><i class="tm-fixtech-icon-'. sanitize_html_class($social) .'"></i></a>
				</li>';
				
			}  // foreach
			
		} // if
		
		// preparing final output
		if( $return != '' ){
			$return = '<div class="tm-social-share-links"><ul>'. $return .'</ul></div>';
		}
		
	}
	
	// return data
	return $return;
	
}
}





/**
 *  Post thumbnail. This will echo post thumbnail according to port format like video, audio etc.
 */
if ( !function_exists( 'themetechmount_portfolio_featured_media' ) ){
function themetechmount_portfolio_featured_media( $post_id='', $size='full' ){
	
	$return = '';
	
	if( empty($post_id) ){
		$post_id = get_the_ID();
	}
	
	// get post meta
	$post_meta = get_post_meta( $post_id, 'themetechmount_portfolio_featured', true );
	
	
	if( !empty($post_meta['featuredtype']) ){
		
		switch($post_meta['featuredtype']){
			case 'image':
				$return .= themetechmount_get_featured_media();
			
		}
		
	}
	
	
}
}




/**
 *  Porfolio description content
 */
if ( !function_exists( 'themetechmount_portfolio_description' ) ){
function themetechmount_portfolio_description( $post_id='' ){
	$return = '';
	
	// processing content
	$content = get_the_content( null, false );
	$content = apply_filters( 'the_content', $content );
	$content = str_replace( ']]>', ']]&gt;', $content );
	
	// preparing final output
	$return = '<div class="tm-portfolio-description">' . $content . '</div><!-- .tm-portfolio-description -->';
	
	return $return;
}
}



/**
 *  Related Portfolio
 */
if ( !function_exists( 'themetechmount_portfolio_related' ) ){
function themetechmount_portfolio_related(){
	$portfolio_show_related   = themetechmount_get_option('portfolio_show_related');
	$portfolio_related_column = themetechmount_get_option('portfolio_related_column');
	$portfolio_related_show   = themetechmount_get_option('portfolio_related_show');
	$portfolio_related_view   = themetechmount_get_option('$portfolio_related_view');
	$portfolio_related_title  = themetechmount_get_option('portfolio_related_title');
	
	$return   = '';
	
	if( $portfolio_show_related===true ){
		
		// Tempoary delcated this variables.. please correct it
		$column        = ( !empty($portfolio_related_column) ) ? $portfolio_related_column : 'four' ;
		$show          = ( !empty($portfolio_related_show) ) ? $portfolio_related_show : '4' ;
		$cpt           = 'portfolio'; // This will be used in themetechmount_get_boxes() automatically.
		$view          = ( !empty($portfolio_related_view) ) ? $portfolio_related_view : 'overlay' ;
		$related_title = ( !empty($portfolio_related_title) ) ? '<h3 class="tm-pf-single-related-title">' . $portfolio_related_title . '</h3>' : '' ;
		
		$catid      = wp_get_post_terms( get_the_ID() , 'tm_portfolio_category', array("fields" => "ids"));
		$thisPostID = array(get_the_ID());
		
		// Title
		
		$args = array(
			'post__not_in' => $thisPostID,
			'post_type'    => 'tm_portfolio',
			'showposts'    => $show,
			'tax_query'    => array(
				array(
					'taxonomy' => 'tm_portfolio_category',
					'field'    => 'id',
					'terms'    => $catid,
				)
			),
			'orderby' => 'rand',
		);
		
		global $posts;
		$original_posts = $posts;
		
		$posts = new WP_Query( $args );
		
		
		if ( $posts->have_posts() ) {
			$return .= '<div class="tm-pf-single-related-wrapper">
				' . $related_title . '
				' . themetechmount_get_boxes( 'portfolio', get_defined_vars() ) . '
			</div>';
		}
		
		$posts = $original_posts;
		
		// Restore original Post Data
		wp_reset_postdata();
		
		$posts = $original_posts;
		
	}
	
	return $return;
}
}




/**
 *  Blog only - Extra class to each classic view of post
 */
if ( !function_exists( 'themetechmount_post_class' ) ){
function themetechmount_post_class(){
	$return = '';
	$classes = array();
	
	// If no featured content found
	if( themetechmount_get_featured_media()=='' ){
		$classes[] = 'tm-no-featured-content';
	}
	
	// creating string from array
	if( !empty($classes) && count($classes)>0 ){
		$return = implode( ' ', $classes );
	}
	
	return $return;
}
}






if ( !function_exists( 'themetechmount_get_post_format_icon' ) ){
function themetechmount_get_post_format_icon( $post_id='' ){
	$return = '';
	
	if( empty($post_id) ){
		$post_id = get_the_ID();
	}
	
	$post_type   = get_post_type($post_id);
	$post_format = get_post_format( $post_id );
	
	$valid_post_formats_icon = array(
		'aside'		=> 'aside',
		'gallery' 	=> 'gallery-1',
		'link' 		=> 'link',
		'image' 	=> 'image',
		'quote' 	=> 'quote-left',
		'status' 	=> 'status',
		'video' 	=> 'video',
		'audio'	 	=> 'music-alt',
		'chat' 		=> 'chat',
	);
	
	if( $post_type=='post' ){
	
		$icon_class = 'pencil';
		
		if( $post_format != false && array_key_exists( $post_format, $valid_post_formats_icon ) ){
			$icon_class = $valid_post_formats_icon[$post_format];
		}
		
		$return = '<i class="tm-fixtech-icon-' . $icon_class . '"></i>';
	
	}
	
	if( !empty($return) ){
		$return = '<div class="tm-post-format-icon-wrapper">' . $return . '</div>';
	}
	
	return $return;
	
}
}



/**
 * THIS IS FINAL FUNCTION - Getting featured media like image, gallery, video, audio etc
 */
if ( !function_exists( 'themetechmount_get_featured_media' ) ){
function themetechmount_get_featured_media( $post_id='', $size='full', $imgonly=false ){
	
	$return        = '';
	$class         = 'tm-' . sanitize_html_class( get_post_type() ) . '-featured-wrapper';
	$featured_type = 'image';
	$video_code    = '';
	$audio_code    = '';
	$slide_images  = '';
	
	if( empty($post_id) ){
		$post_id = get_the_ID();
	}
	
	
	if( !empty($post_id) ){
		
		// Getting post type
		$post_type = get_post_type($post_id);
		
		
		// If blog post
		if( $post_type=='post' ){
			$featured_type = get_post_format( $post_id );
			$video_code    = trim( get_post_meta( $post_id, '_format_video_embed', true) );
			$audio_code    = trim( get_post_meta( $post_id, '_format_audio_embed', true) );
			$slide_images  =  get_post_meta( $post_id, '_themetechmount_metabox_gallery', true) ;
			$slide_images  = ( !empty($slide_images['gallery_images']) ) ? $slide_images['gallery_images'] : '' ;
			$class        .= ' tm-post-format-' . get_post_format();
		}
		
		
		// If portfolio
		if( $post_type=='tm_portfolio' ){
			
			// get post meta
			$post_meta  = get_post_meta( $post_id, 'themetechmount_portfolio_featured', true );
			
			$video_code   = ( !empty($post_meta['video_code']) ) ? trim($post_meta['video_code']) : '' ;
			$audio_code   = ( !empty($post_meta['audio_code']) ) ? trim($post_meta['audio_code']) : '' ;
			$slide_images = ( !empty($post_meta['slide_images']) ) ? trim($post_meta['slide_images']) : '' ;
			
			// getting featured type
			if( !empty($post_meta['featuredtype']) ){
				$featured_type = $post_meta['featuredtype'];
			}
			
		}
		
		// If imageonly than return only featured image
		if( $imgonly==true ){
			$featured_type = 'image';
		}
		
		
		// Now preparing the output
		switch( $featured_type ){
			case 'image':
			default:
				if ( has_post_thumbnail() ) {
					$return .= get_the_post_thumbnail( $post_id, $size );
				}
				break;
			
			case 'video':
				if( $video_code!='' ){
					$return .= themetechmount_oembed_get($video_code);
				}
				break;
				
			case 'audio':
				if( $audio_code!='' ){
					$return .= themetechmount_oembed_get($audio_code);
					if( strtolower(substr($audio_code, -4)) == ".mp3" ){
						$class .= ' tm-post-format-audio-mp3';
					}
				}
				break;
				
			case 'gallery':
			case 'slider':
				$return .= themetechmount_create_slider($slide_images, $size);
				break;
				
			case 'quote':
				$return .= themetechmount_featured_quote();
				break;
				
			case 'link':
				$return .= themetechmount_featured_link();
				break;
		}
		
		
		
		
		
	} // if( empty($post_id) )

	
	// Adding wrapper
	if( !empty($return) ){
		$return = '<div class="tm-featured-wrapper ' . $class . '">' . $return . '</div>';
	}

	return $return;
	
}
}






/**
 *  Post Format - Link
 */
if ( !function_exists( 'themetechmount_featured_link' ) ){
function themetechmount_featured_link($code=''){
	
	$return = '';
	
	if( get_post_format() == 'link' ){
		
		$inline_style = '';
		if( has_post_thumbnail() ){
			if ( has_post_thumbnail() ) { // check if the post has a Post Thumbnail assigned to it.
				$inline_style = 'style="background-image:url(\'' . get_the_post_thumbnail_url( get_the_ID(), 'full') . '\');"';
			}
		}
		
		// preparing content
		$content  = '';
		$link_url = get_post_meta( get_the_ID(), '_format_link_url', true );
		if( !empty($link_url) ){
			$content .= '<h3 class="tm-format-link-title"><a href="' . esc_url($link_url) . '">' . get_the_title() . '</a></h3>';
			$content .= '<span class="tm-format-link-url"><a href="' . esc_url($link_url) . '">' . esc_url($link_url) . '</a></span>';
		} else {
			$content .= '<h3 class="tm-format-link-title">' . get_the_title() . '</h3>';
		}
		
		
		
		// Final output
		$return = '
			<div class="tm-post-featured-link-wrapper" ' . $inline_style . '>
				<div class="tm-post-featured-link">
					' . $content . '
				</div>
			</div>
			';
		
	}
	
	return $return;
	
}
}





/**
 *  Post Format - Quote
 */
if ( !function_exists( 'themetechmount_featured_quote' ) ){
function themetechmount_featured_quote($code=''){
	
	$return = '';
	
	if( get_post_format() == 'quote' ){
		
		$inline_style = '';
		if( has_post_thumbnail() ){
			if ( has_post_thumbnail() ) { // check if the post has a Post Thumbnail assigned to it.
				$inline_style = 'style="background-image:url(\'' . get_the_post_thumbnail_url( get_the_ID(), 'full') . '\');"';
			}
		}
		
		// Quote Source Name
		$source_name    = get_post_meta( get_the_ID(), '_format_quote_source_name', true );
		$source_url     = get_post_meta( get_the_ID(), '_format_quote_source_url', true );
		$link_start     = '';
		$link_end       = '';
		$source_content = '';
		if( !empty($source_url) ){
			$link_start = '<a href="' . $source_url . '">';
			$link_end   = '</a>';
		}
		if( !empty($source_name) ){
			$source_content = '<cite>' . $link_start . $source_name . $link_end . '</cite>';
		}
		
		// Content
		$get_the_content = get_the_content();
		$content         = $get_the_content;
		if ( strpos( $get_the_content, '<blockquote>' ) === false) {
			$content = '<blockquote>' . $get_the_content . $source_content . '</blockquote>';
		}
		
		// Final output
		$return = '<div class="tm-post-featured-quote" ' . $inline_style . '>' . $content . '</div>';
		
	}
	
	return $return;
	
}
}




if ( !function_exists( 'themetechmount_oembed_get' ) ){
function themetechmount_oembed_get($code=''){
	$return = '';
	$code   = trim($code); // Removing extra white space
	
	if( !empty($code) ){
		
		if( substr($code, -4) != ".mp3" && substr($code, 0, 4) == "http" ){
			$return = wp_oembed_get($code);
			if( $return==false ){  // 1st retry
				$return = wp_oembed_get($code);
			}
			if( $return==false ){  // 2nd retry
				$return = wp_oembed_get($code);
			}
			if( $return==false ){ // 3rd retry
				$return = wp_oembed_get($code);
			}

		} else if( substr($code, -4) == ".mp3" ){  // MP3 file
			$return = '<div class="tm-blogbox-audio-mp3player-w">'.do_shortcode( '[audio src="'.$code.'"]' ).'</div>';
			
		} else {  // MP3 file
			$return = '<div class="tm-blogbox-audio-mp3player-w">' . $code . '</div>';
			
		}
	}
	
	return $return;
	
}
}





if ( !function_exists( 'themetechmount_create_slider' ) ){
function themetechmount_create_slider($images='', $size='full'){
	$return = '';
	
	if( !empty($images) ){
		$images_array = explode(',', $images);
		if( count($images_array)>0 ){
			foreach( $images_array as $image_id ){
				$thumb = wp_get_attachment_image_src( $image_id, 'medium' );
				$thumb = $thumb[0];
				if( is_numeric($image_id) ){
					$return .= '<div data-thumb="' . $thumb . '">' . wp_get_attachment_image( $image_id, $size ) . '</div>';
				}
			}
		}
	}
	
	// preparing final output as flex slider
	if( !empty($return) ){
		$return = '<div class="tm-slick-carousel-wrapper"><div class="tm-slick-carousel">' . $return . '</div></div>';
	}
	
	return $return;
	
}
}


/**
 * get Boxes for CPT
 */
if( !function_exists('themetechmount_get_boxes') ){
function themetechmount_get_boxes( $cpt='blog', $vars=array() ){
	$return            = '';
	$sortable_category = array();
	$posts    = (!empty($vars['posts']))   ? $vars['posts'] : '' ;
	$column   = (!empty($vars['column']))  ? $vars['column'] : '' ;
	$template = (!empty($vars['view']))    ? $vars['view'] : 'top-image' ;
	$allword  = (!empty($vars['allword'])) ? $vars['allword'] : esc_attr__('All', 'fixtech');
	$boxview  = (!empty($vars['boxview'])) ? $vars['boxview'] : '';
	$show_tooltip = (!empty($vars['show_tooltip'])) ? $vars['show_tooltip'] : 'yes' ;
	$add_link     = (!empty($vars['add_link']))     ? $vars['add_link'] : 'yes' ;
	
	
	if( empty($posts) ){
		global $posts;
	}
	
	
	
	
	if( !empty($boxview) && $boxview == 'slickview' && $cpt == 'testimonial' ){
		
		$template 			= 'slickview';
		$column				= 'one';
		$startwrapper 		= themetechmount_column_div('start', $column ).'<div class="testimonial_wrapper">';
		$closewrapper 		= '</div>'.themetechmount_column_div('end', $column );
		$infowrapper		= '<div class="testimonials-info">';
		$infowrapperend 	= '</div>';
		$footerwrapper		= '<div class="testimonials-nav">';
		$footerwrapperend   = '</div>';
	
		while ( $posts->have_posts() ) {
			$posts->the_post();
			
			//content
			ob_start();
			get_template_part('template-parts/'. $cpt .'box/'. $cpt .'box', $template . '-top' );
			$content .= ob_get_contents();
			ob_end_clean();
			
			// image and title
			ob_start();
			get_template_part('template-parts/'. $cpt .'box/'. $cpt .'box', $template . '-bottom' );
			$footer .= ob_get_contents();
			ob_end_clean();
			
		}
		
		$return =	$startwrapper.
						$infowrapper.
							$content.
						$infowrapperend.
						$footerwrapper.
							$footer.
						$footerwrapperend.
					$closewrapper;
		
	/*} else if( $cpt == 'client' ){
		
		$return = themetechmount_get_clientboxes( $vars );*/
			
	} else {
		
		/** Box start **/
		while ( $posts->have_posts() ) {
			$posts->the_post();
			
			// Portfolio box sortable category links
			if( !empty($vars['sortable']) && $vars['sortable']=='yes' ){
				$post_terms = wp_get_post_terms( get_the_ID(), themetechmount_get_taxonomy_from_cpt() );
				foreach( $post_terms as $term ){
					$sortable_category[ $term->name ] = $term->slug;
				}
			}
			
			
			
			// Client Logos
			$client_wrap_start = '';
			$client_wrap_end   = '';
			if( $cpt == 'client' ){
				$client_wrap_start .= '<div class="tm-client-logo-box-w">';
				$client_wrap_end    = '</div><!-- .tm-client-logo-box-w --> ' . $client_wrap_end;
					
				if( $show_tooltip == 'yes' ){
					$client_wrap_start .= '<div class="tm-client-logo-tooltip" data-tooltip="' . get_the_title() . '">';
					$client_wrap_end    = '</div>' . $client_wrap_end;
				}
				if( $add_link == 'yes' && themetechmount_client_single_link()!='' ){
					$client_wrap_start .= '<a class="tm-client-logo-link" href="' . themetechmount_client_single_link() . '">';
					$client_wrap_end    = '</a>' . $client_wrap_end;
				}
			}
			
			
			ob_start();
			get_template_part('template-parts/'. $cpt .'box/'. $cpt .'box', $template);
			$boxes = ob_get_contents();
			ob_end_clean();
			
			$return .= themetechmount_column_div('start', $column );
				$return .= $client_wrap_start;
					$return .= $boxes;
				$return .= $client_wrap_end;
			$return .= themetechmount_column_div('end', $column );
		
		} // while
	}
	
	
	
	if( !empty($return) ){
		
		// Sortable
		$sortable_category_html = '';
		if( !empty($sortable_category) && is_array($sortable_category) && count($sortable_category)>0 ){
			$sortable_category_html .= '<li class="tm-sortable-link tm-sortable-all-link"><a class="selected" href="javascript:void(0);" data-filter="*"> ' . $allword . ' </a></li>';
			foreach($sortable_category as $key=>$val){
				$sortable_category_html .= '<li class="tm-sortable-link"><a href="javascript:void(0);" data-filter=".' . $val . '">' . $key . '</a></li>';
			}
			$sortable_category_html = '<div class="tm-sortable-wrapper tm-sortable-wrapper-' . $cpt . '"><nav class="tm-sortable-list"><ul>' . $sortable_category_html . '</ul></nav></div>';
		}
		
		// Boxes
		$return = '
			' . $sortable_category_html . '
			<div class="row multi-columns-row themetechmount-boxes-row-wrapper">
				'.$return.'
			</div>
		';
		
		
		// Pagination
		if( isset($vars['pagination']) && $vars['pagination']=='yes' && $vars['boxview']!='carousel' ){
			$return .= themetechmount_pagination( $posts );
		}
		
		return $return;
	}
	return '';
	
}
}




/**
 *  ThemeTechMount Box class function
 */
if( !function_exists('themetechmount_box_class') ){
function themetechmount_box_class( $extra_class='' ){
	$return = '';
	
	// getting taxonomy
	$taxonomy = themetechmount_get_taxonomy_from_cpt();
	
	// getting term list for current taxonomy
	$terms = wp_get_post_terms( get_the_ID(), $taxonomy ); // Get all terms of a taxonomy
	
	if( is_array($terms) && count($terms)>0 ){
		foreach( $terms as $term ){
			$return .= $term->slug . ' ';
		}
	}
	
	// removing extra space
	$return = trim($return);
	
	// extra class
	if( !empty($extra_class) ){
		$return .= ' ' . themetechmount_sanitize_html_classes($extra_class);
	}
	
	return trim($return);
	
	
}
}




/**
 *  ThemeTechMount Box class function
 */
if( !function_exists('themetechmount_get_taxonomy_from_cpt') ){
function themetechmount_get_taxonomy_from_cpt(){
	$return = 'category';
	
	if( get_post_type() == 'tm_portfolio' ){
		$return = 'tm_portfolio_category';
	} else if( get_post_type() == 'tm_team_member' ){
		$return = 'tm_team_group';
	} else if( get_post_type() == 'tm_testimonial' ){
		$return = 'tm_testimonial_group';
	}
	
	return $return;
}
}





/**
 *  Global function - This will return array of Portfolio templates
 */
if( !function_exists('themetechmount_global_portfolio_template_list') ){
function themetechmount_global_portfolio_template_list( $for_vc=false ){
	$return = array(
		'overlay'    => esc_attr__('Content overlay on image view', 'fixtech'),
		'top-image'  => esc_attr__('Top Image and Bottom Content view', 'fixtech'),
	);
	
	if( $for_vc==true ){ // for vc
		$return = array_flip( $return );
	}
	
	return $return;
}
}




/**
 *  Global function - This will return array of Blogbox templates
 */
if( !function_exists('themetechmount_global_blog_template_list') ){
function themetechmount_global_blog_template_list( $for_vc=false ){
	$return = array(
		"top-image"       => esc_attr__("Top image and bottom content (default)", "fixtech"),
		"left-image"      => esc_attr__('Left image and right content ', "fixtech"),
		"right-image"     => esc_attr__('Right image and left content ', "fixtech"),
		"content-overlay" => esc_attr__('Content overlay on image', "fixtech"),
	);
	
	if( $for_vc==true ){ // for vc
		$return = array_flip( $return );
	}
	
	return $return;
}
}



/**
 *  Global function - This will return array of Team Member templates
 */
if( !function_exists('themetechmount_global_team_member_template_list') ){
function themetechmount_global_team_member_template_list( $for_vc=false ){
	$return = array(
		"overlay"    => esc_attr__("Overlay content on Image (Default)", "fixtech"),
		"left-image" => esc_attr__("Left Image and Right Content", "fixtech"),
	);
	
	if( $for_vc==true ){ // for vc
		$return = array_flip( $return );
	}
	
	return $return;
}
}



/**
 *  Global function - This will return array of Client templates
 */
if( !function_exists('themetechmount_global_client_template_list') ){
function themetechmount_global_client_template_list( $for_vc=false ){
	$return = array(
		'simple-logo'    => esc_attr__('Simple Logo view', 'fixtech'),
		'separator-logo' => esc_attr__('Logo with Separator view', 'fixtech'),
		'boxed-logo'     => esc_attr__('Boxed view', 'fixtech'),
		//'logo-with-title' => esc_attr__('Logo with Title view', 'fixtech'),
	);
	
	if( $for_vc==true ){ // for vc
		$return = array_flip( $return );
	}
	
	return $return;
}
}


/**
 *  Client Logos - Link for single client logo
 */
if( !function_exists('themetechmount_client_single_link') ){
function themetechmount_client_single_link( $for_vc=false ){
	$return = '';
	if( get_the_ID() ){
		$post_meta = get_post_meta( get_the_ID(), 'themetechmount_clients_details' , true );
		if( !empty($post_meta['clienturl']) ){
			$return = $post_meta['clienturl'];
		}
		
	}
	
	return $return;
	
}
}









if( !function_exists('themetechmount_column_div') ){
function themetechmount_column_div($type='start', $column='three' ){
	
	$return   = '';
	$boxClass = 'tm-box-col-wrapper ';
	
	switch($column){
		case 'one':
			$boxClass .= 'col-lg-12 col-sm-12 col-md-12 col-xs-12';
			break;
		case 'two':
			$boxClass .= 'col-lg-6 col-sm-6 col-md-6 col-xs-12';
			break;
		case 'three':
			$boxClass .= 'col-lg-4 col-sm-6 col-md-4 col-xs-12';
			break;
		case 'four':
		default:
			$boxClass .= 'col-lg-3 col-sm-6 col-md-3 col-xs-12';
			break;
		case 'five':
			$boxClass .= 'col-lg-20percent col-sm-4 col-md-4 col-xs-12';
			break;
		case 'six':
			$boxClass .= 'col-lg-2 col-sm-4 col-md-4 col-xs-12';
			break;
		case 'mix':
			$boxClass .= 'col-lg-3 col-sm-6 col-md-3 col-xs-12';
			break;
		case 'fix':
			$boxClass .= 'blog-slider-box-width';
			break;
		case 'timeline':
			$boxClass .= 'tm-blogbox-timeline';
			break;
	}
	
	// adding term based class for Isotope sorting
	$boxClass .= ' '.themetechmount_box_class();
	
	
	if( $type == 'start' ){
		$return .= '<div class="'. $boxClass .'">';
	} else {
		$return .= '</div>';
	}
	
	
	return $return;
	
}
}







/**
 * Print HTML with title of the post.
 *
 * Create your own themetechmount_box_title() to override in a child theme.
 *
 * @since Fixtech 1.0
 *
 * @return void
 */
if ( !function_exists( 'themetechmount_box_title' ) ){
function themetechmount_box_title() {
	$return = '';
	
	if( 'link' != get_post_format() && 'quote' != get_post_format() ){
		$return = '<div class="themetechmount-box-title"><h4><a href="' . get_permalink() . '">' . get_the_title() . '</a></h4></div>';
	}
	
	
	return $return;
}
}









/**
 * Print blog description for blogbox shortcode
 *
 * Create your own themetechmount_blogbox_description() to override in a child theme.
 *
 * @since Fixtech 1.0
 *
 * @return void
 */
if ( !function_exists( 'themetechmount_blogbox_description' ) ){
function themetechmount_blogbox_description($limit=''){
	
	$blog_text_limit = themetechmount_get_option('blog_text_limit');
	$return = '';
	
	// Short Description
	if( $blog_text_limit>0 && $limit!='full' ){
		$return  = nl2br( themetechmount_get_short_desc() );
	} else if( has_excerpt() ){
		$return  = nl2br( get_the_excerpt() );
		$return  = do_shortcode($return);
	} else {
		global $more;
		$more = 0;
		$return = strip_shortcodes( nl2br(get_the_content( '' )) );
	}
	
	if( 'link' == get_post_format() || 'quote' == get_post_format() ){
		$return = '';
	}
	
	return $return;
	
}
}





/**
 * Print blog readmore text for blogbox shortcode
 *
 * Create your own themetechmount_blogbox_readmore_text() to override in a child theme.
 *
 * @since Fixtech 1.0
 *
 * @return void
 */
if ( !function_exists( 'themetechmount_blogbox_readmore_text' ) ){
function themetechmount_blogbox_readmore_text(){
	$blog_readmore_text = themetechmount_get_option('blog_readmore_text');
	$return             = esc_attr__('Read More', 'fixtech');
	
	// Get text from Theme Options
	if( !empty($blog_readmore_text) ){
		$return = esc_attr($blog_readmore_text);
	}
	
	return $return;
}
}





/**
 * Print Read More link
 *
 * Create your own themetechmount_blogbox_readmore() to override in a child theme.
 *
 * @since Fixtech 1.0
 *
 * @return void
 */
if ( !function_exists( 'themetechmount_blogbox_readmore' ) ){
function themetechmount_blogbox_readmore(){
	
	$return        = '';
	$readMore_text = themetechmount_blogbox_readmore_text();  // Read More word
	
	if( strpos(get_the_content(), '"more-link"')!==false && get_post_format()!='quote' && get_post_format()!='link' ) {
		$return .= '<div class="themetechmount-blogbox-footer-left themetechmount-wrap-cell">';
		$return .= '<a href="'.get_permalink().'">'.$readMore_text.'</a>';
		$return .= '</div>';
	}
	
	return $return;
	
}
}




if ( !function_exists( 'themetechmount_get_short_desc' ) ){
function themetechmount_get_short_desc(){
	$blog_text_limit = themetechmount_get_option('blog_text_limit');
	$content = '';
	if( $blog_text_limit>0 ){
		$content = get_the_content('',FALSE,'');
		$content = wp_strip_all_tags($content);
		$content = strip_shortcodes($content);
		$content = str_replace(']]>', ']]>', $content);
		$content = substr($content,0, $blog_text_limit );
		$content = trim(preg_replace( '/\s+/', ' ', $content));
		$content = $content.'...';
	}
	return $content;
}
}




/**
 * Print HTML with icon for current post.
 *
 * Create your own themetechmount_entry_icon() to override in a child theme.
 *
 * @since Fixtech 1.0
 *
 */
if ( !function_exists( 'themetechmount_entry_icon' ) ){
function themetechmount_entry_icon() {
	$iconCode = '';
	$postFormat = get_post_format();
	if( is_sticky() ){ $postFormat = 'sticky'; }
	$icon = 'pencil';
	switch($postFormat){
		case 'sticky':
			$icon = 'sticky';
			break;
		case 'aside':
			$icon = 'aside';
			break;
		case 'audio':
			$icon = 'music';
			break;
		case 'chat':
			$icon = 'chat';
			break;
		case 'gallery':
			$icon = 'gallery';
			break;
		case 'image':
			$icon = 'picture';
			break;
		case 'link':
			$icon = 'link';
			break;
		case 'quote':
			$icon = 'quote-left';
			break;
		case 'status':
			$icon = 'status';
			break;
		case 'video':
			$icon = 'video';
			break;
	}
	
	$iconCode .= '<i class="tm-fixtech-icon-'.$icon.'"></i>';
	
	
	// return data
	return $iconCode;
	
}
}




/*
 *  ThemeTechMount Box Wrapper
 */
if( !function_exists('themetechmount_box_wrapper') ){
function themetechmount_box_wrapper( $position='start', $cptname='blog', $vars=array() ){
	
	$return 	 = '';
	$view        = (!empty($vars['view']))   ? $vars['view'] : 'top-image' ;
	$column      = (!empty($vars['column'])) ? $vars['column'] : 'three' ;
	$box_spacing = (!empty($vars['box_spacing'])) ? $vars['box_spacing'] : '' ;
	$boxview     = (!empty($vars['boxview'])) ? $vars['boxview'] : 'default' ;
	$sortable    = (!empty($vars['sortable'])) ? $vars['sortable'] : '' ;
	$txt_align   = (!empty($vars['txt_align'])) ? $vars['txt_align'] : '' ;
	
	
	
	
	if( $position=='start' ){
		
		$classArray = array();
		
		
		// Data tags
		$datatags = themetechmount_carousel_data_html( $vars );
	
		
		$classArray[] = 'themetechmount-boxes';
		$classArray[] = 'themetechmount-boxes-'.$cptname;
		$classArray[] = 'themetechmount-boxes-view-'.$boxview;
		$classArray[] = 'themetechmount-boxes-col-'. $column;
		$classArray[] = 'themetechmount-boxes-sortable-'. $sortable;
		$classArray[] = 'themetechmount-boxes-textalign-'. $txt_align;
		if( !empty($box_spacing) ){ $classArray[] = 'themetechmount-boxes-spacing-'. $box_spacing; }
		
		// Carousel special class for carousel arrows
		if ( $boxview=='carousel' ) {
			if( $vars['carousel_nav']=='above' ){
				$classArray[] = 'tm-boxes-carousel-arrows-above';
				if ( !empty( $vars['txt_align'] ) ) {
					$classArray[] = 'tm-boxes-txtalign-' . $vars['txt_align'];
				}
			} else {
				$classArray[] = 'tm-boxes-carousel-arrows-side';
			}
		}
		
		
		
		
		// CSS Animation
		if ( ! empty( $vars['css_animation'] ) ) {
			$classArray[] = themetechmount_getCSSAnimation( $vars['css_animation'] );
		}
		// Extra class
		if ( ! empty( $vars['el_class'] ) ) {
			$classArray[] = $vars['el_class'];
		}
		
		//Design Options tab css class
		if( !empty($vars['css']) ){
			$classArray[] = themetechmount_vc_shortcode_custom_css_class($vars['css']);
		}
		
		$return = '<div class="'. implode(' ',$classArray) .'"'. $datatags .'>
		<div class="themetechmount-boxes-inner themetechmount-boxes-'. $cptname .'-inner ">';
		
		
		
	} else {
		
		
		$return = '</div><!-- .themetechmount-boxes-inner -->   </div><!-- .themetechmount-boxes -->  ';
		
	}
	
	return $return;
	
}
}  // themetechmount_box_wrapper()








if( !function_exists('themetechmount_get_query_args') ){
function themetechmount_get_query_args( $cptname='blog', $vars=array() ){
	
	$show     	= (!empty($vars['show'])) ? $vars['show'] : '3' ;
	$category 	= (!empty($vars['category'])) ? $vars['category'] : '' ;
	$orderby	= (!empty($vars['orderby'])) ? $vars['orderby'] : 'date' ;
	$order		= (!empty($vars['order'])) ? $vars['order'] : 'DESC' ;
	
	$valid_post_types = array(
		'blog',
		'portfolio',
		'team',
		'testimonial',
		'client',
		'events',
	);
	
	$post_type = array(
		'blog' => array(
			'post_type' => 'post',
			'taxonomy' 	=> 'category',
		),
		'portfolio' => array(
			'post_type' => 'tm_portfolio',
			'taxonomy' 	=> 'tm_portfolio_category',
		),
		'team' => array(
			'post_type' => 'tm_team_member',
			'taxonomy' 	=> 'tm_team_group',
		),
		'testimonial' => array(
			'post_type' => 'tm_testimonial',
			'taxonomy' 	=> 'tm_testimonial_group',
		),
		'client' => array(
			'post_type' => 'tm_client',
			'taxonomy' 	=> 'tm_client_group',
		),
		'events' => array(
			'post_type' => 'tribe_events',
			'taxonomy' 	=> 'tribe_events_cat',
		),
	);
	
	
	
	// check if not called directly
	if( count($vars)>0 ){
		
		$paged = ( get_query_var('paged') ) ? get_query_var('paged') : 1;
		
		// default args passing blog data, if no matching post type
		$args = array(
			'post_type'				=> 'post',
			'paged'                 => esc_attr($paged),
			'ignore_sticky_posts'	=> true,
			'orderby'				=> esc_attr($orderby),
			'order'					=> esc_attr($order),
		);
	
		// args if post type names match valid post types.  
		if( in_array( $cptname, $valid_post_types ) ){
			
			$args = array(
				'post_type'				=> $post_type[$cptname]['post_type'],
				'paged'                 => esc_attr($paged),
				'posts_per_page'		=> $show,
				'ignore_sticky_posts'	=> true,
				'orderby'				=> $orderby,
				'order'					=> $order,
			);
			// Creating array for multiple category
			if( strpos($category, ',') !== false ) {
				$category = explode(',',$category);
			}
			// Category
			if( $category != '' ){
				$args['tax_query'] = array(
					array(
						'taxonomy' 	=> $post_type[$cptname]['taxonomy'],
						'field' 	=> 'slug',
						'terms' 	=> $category
					),
				);
			}
			
		}

		return $args;
	
	}
	
}
}




/**
 * Blogbox meta boxes - show or hide
 *
 * Create your own themetechmount_blogbox_show_meta() to override in a child theme.
 *
 * @since Fixtech 1.0
 *
 */
if ( !function_exists( 'themetechmount_blogbox_show_meta' ) ){
function themetechmount_blogbox_show_meta() {
	return true;
}
}





/**
 * Blogbox meta boxes
 *
 * Create your own themetechmount_blogbox_single_meta() to override in a child theme.
 *
 * @since Fixtech 1.0
 *
 */
if ( !function_exists( 'themetechmount_blogbox_single_meta' ) ){
function themetechmount_blogbox_single_meta( $option='date', $args=array() ) {
	$return      = '';
	$icon        = '';
	$icon_prefix = 'tm-fixtech-icon';
	
	switch($option){
		
		case 'date' :
		default :
			$icon           = ( !empty($args['icon']) ) ? $args['icon'] : '<i class="'. $icon_prefix .'-date"></i>' ;
			$date_structure = ( !empty($args['date_structure']) ) ? $args['date_structure'] : 'j M Y' ;
			$return         = get_the_time( $date_structure );
			break;
			
		case 'user' :
			$icon   = ( !empty($args['icon']) ) ? $args['icon'] : '<i class="'. $icon_prefix .'-user"></i>' ;
			$return = sprintf( '<span class="author vcard"><a class="url fn n" href="%1$s">%2$s</a></span>',
				esc_url( get_author_posts_url( get_the_author_meta( 'ID' ) ) ),
				get_the_author()
			);
			break;
			
		case 'comment' :
			$icon   = ( !empty($args['icon']) ) ? $args['icon'] : '<i class="'. $icon_prefix .'-comment"></i>' ;
			$return = '';
			break;
			
		case 'category' :
			$icon            = ( !empty($args['icon']) ) ? $args['icon'] : '<i class="'. $icon_prefix .'-category"></i>' ;
			$categories_list = get_the_category_list( esc_attr_x( ', ', 'Used between list items, there is a space after the comma.', 'fixtech' ) );
			if ( !empty($categories_list) ) {
				$return = sprintf( '<span class="themetechmount-category-links">%2$s</span>',
					$categories_list
				);
			}
			break;
			
		case 'tags' :
			$icon      = ( !empty($args['icon']) ) ? $args['icon'] : '<i class="'. $icon_prefix .'-tags"></i>' ;
			$tags_list = get_the_tag_list( '', esc_attr_x( ', ', 'Used between list items, there is a space after the comma.', 'fixtech' ) );
			if ( $tags_list ) {
				$return = sprintf( '<span class="themetechmount-tags-links">%2$s</span>',
					$tags_list
				);
			}
			break;
			
	}
	
	
	// now preparing the output
	if( $return!='' ){
		$return = '<span class="themetechmount-blogbox-meta-row themetechmount-blogbox-meta-row-'. $option .'">'. $icon .' '. $return .'</span>';
	}
	
	return $return;
	
}
}





/* =============================================================== */
/* -------------------- Titlebar functions  ---------------------- */

if( !function_exists('themetechmount_titlebar_classes') ){
function themetechmount_titlebar_classes(){
	$titlebar_bg_color    = themetechmount_get_option('titlebar_bg_color');
	$titlebar_text_color  = themetechmount_get_option('titlebar_text_color');
	$titlebar_view        = themetechmount_get_option('titlebar_view');
	$titlebar_background  = themetechmount_get_option('titlebar_background');
	$breadcrumb_on_bottom = themetechmount_get_option('breadcrumb_on_bottom');
	
	//global $tm_inline_css;
	$reurn                = array();
	$titlebar_if_bg_image = 'no';
	$breadcrum_on_bottom  = "";
	
	$titlebar_viewlist  = array( 'default','allleft','allright' );
	
	
	
	
	// If bg image is there
	if( !empty($titlebar_background['image']) ){
		$titlebar_if_bg_image = 'yes';
	}
	
	// Breadcrumb on bottom
	if( !empty($breadcrumb_on_bottom) && $breadcrumb_on_bottom[0] == 'yes' ){
		$breadcrum_on_bottom = "yes";
	}
	
	
	// Singuler of shop page
	$post_id = false;
	if( is_singular() ){
		$post_id = get_the_ID();
	} else if( function_exists('is_woocommerce') ) {
		if( is_woocommerce() ){
			$post_id = get_option( 'woocommerce_shop_page_id' );
		}
	}
	
	
	// Single overwrite
	if( $post_id ){
		$single_tbar_options = get_post_meta( $post_id, '_themetechmount_metabox_group', true );
		
		
		// ** ALL bg options ** 
		if( !empty($single_tbar_options['titlebar_bg_custom_options']) && $single_tbar_options['titlebar_bg_custom_options']=='custom' ){
			
			// BG  Color
			if( !empty($single_tbar_options['titlebar_bg_color']) ){
				$titlebar_bg_color = $single_tbar_options['titlebar_bg_color'];
			}
			
			// If bg image is there
			if( !empty($single_tbar_options['titlebar_background']['image']) ){
				$titlebar_if_bg_image = 'yes';
			} else {
				$titlebar_if_bg_image = 'no';
			}
			
		}
		

		
		if( !empty($single_tbar_options['titlebar_font_custom_options']) && $single_tbar_options['titlebar_font_custom_options']=='custom' ){
			
			// Text Color
			if( !empty($single_tbar_options['titlebar_text_color']) && !empty($single_tbar_options['titlebar_text_color']) ){
				$titlebar_text_color = $single_tbar_options['titlebar_text_color'];
			}
		
		}
		
		// Titlebar Align
		if( !empty($single_tbar_options['titlebar_view']) && !empty($single_tbar_options['titlebar_view']) ){
			$titlebar_view = $single_tbar_options['titlebar_view'];
		}
		
	}
	
	
	
	if( !empty($titlebar_bg_color) ){
		$reurn[] = 'tm-bgcolor-'.$titlebar_bg_color;
	}
	if( !empty($titlebar_view) ){
		$reurn[] = 'tm-titlebar-align-'.$titlebar_view;
	}
	if( !empty($titlebar_text_color) ){
		$reurn[] = 'tm-textcolor-'.$titlebar_text_color;
	}
	if( !empty($titlebar_if_bg_image) ){
		//$reurn[] = 'tm-titlebar-bgimage-'.$titlebar_if_bg_image;
		$reurn[] = 'tm-bgimage-'.$titlebar_if_bg_image;
	}
	if( $breadcrum_on_bottom == 'yes' && in_array( $titlebar_view, $titlebar_viewlist ) ){
		$reurn[] = 'tm-breadcrumb-on-bottom';
	}
	
	$reurn = implode( ' ', $reurn );
	
	// Return data
	return $reurn;
	
}
}







if( !function_exists('themetechmount_get_framework_raw_option') ){
function themetechmount_get_framework_raw_option( $element_id ){
	$return = '';
	
	include( get_template_directory() .'/cs-framework-override/config/framework-options.php' );
	
	foreach( $tm_framework_options as $tm_framework_option ){
		//var_dump($tm_framework_option);
		foreach( $tm_framework_option as $options ){
			if( is_array($options) && count($options)>0 ){
				foreach( $options as $option ){
					if( !empty($option['id']) && $option['id']==$element_id ){
						$return = $option['output'];
					}
				}
			}
		}
	}
	
	return $return;
	
}
}









if( !function_exists('themetechmount_titlebar_title') ){
function themetechmount_titlebar_title(){
	
	
	
	$title    = get_the_title();
	$subtitle = '';
	
	
	if( is_singular() || is_home() ){  // single page, single post and single cpt
		$pageID = get_the_ID();
		if( is_home() ){
			$pageID = get_option( 'page_for_posts' );
			$title = esc_attr__( 'Blog', 'fixtech' );  // Setting for Titlebar title
		}
		
		
		
		$single_tbar_settings = get_post_meta( $pageID, '_themetechmount_metabox_group', true );
		$title    = ( !empty($single_tbar_settings['title']) ) ? trim($single_tbar_settings['title']) : $title ;
		$subtitle = ( !empty($single_tbar_settings['subtitle']) ) ? trim($single_tbar_settings['subtitle']) : $subtitle ;
		
		
		
		
	} else if( function_exists('is_woocommerce')  && is_woocommerce() ){ // WooCommerce
		$pageID = get_option( 'woocommerce_shop_page_id' );
		
		$single_tbar_settings = get_post_meta( $pageID, '_themetechmount_metabox_group', true );
		$title    = ( !empty($single_tbar_settings['title']) ) ? trim($single_tbar_settings['title']) : get_the_title($pageID) ;
		$subtitle = ( !empty($single_tbar_settings['subtitle']) ) ? trim($single_tbar_settings['subtitle']) : '' ;
	
	
	
	
	} else if( is_category() ){ // Category
		$adv_tbar_catarc = themetechmount_get_option('adv_tbar_catarc');
		$adv_tbar_catarc = ( !empty($adv_tbar_catarc) ) ? esc_attr($adv_tbar_catarc.' %s') : esc_attr__('Category Archives: %s', 'fixtech') ;
		$title = sprintf(
			$adv_tbar_catarc,
			'<span class="tm-titlebar-heading tm-tbar-category-title">' . esc_attr(single_cat_title( '', false)) . '</span>'  // for WPML
		);
		$subtitle = category_description();
		
		
		
		
	} else if( is_tag() ){ // Tag
		$adv_tbar_tagarc = themetechmount_get_option('adv_tbar_tagarc');
		$adv_tbar_tagarc = ( !empty( $adv_tbar_tagarc ) ) ? esc_attr($adv_tbar_tagarc.' %s') : esc_attr__('Tag Archives: %s','fixtech') ;
		$title = sprintf(
			$adv_tbar_tagarc,
			'<span class="tm-titlebar-heading tm-tbar-tag-title">' . esc_attr( single_tag_title( '', false)) . '</span>'  // for WPML
		);
		$subtitle        = tag_description();
		
		
	
	
		
	} else if( is_tax() ){ // Taxonomy
		global $wp_query;
		$tax = $wp_query->get_queried_object();
		
		if( is_tax('tm_team_group') || is_tax('tm_portfolio_category') ){
			$title = '<span class="tm-titlebar-heading tm-tbar-taxonomy-title">' . esc_attr($tax->name) . '</span>';
			
		} else {
			$adv_tbar_postclassified = themetechmount_get_option('adv_tbar_postclassified');
			global $wp_query;
			$adv_tbar_postclassified = ( !empty($adv_tbar_postclassified) ) ? esc_attr($adv_tbar_postclassified.' %s') : esc_attr__('Posts classified under: %s', 'fixtech') ;
		
			$title = sprintf(
				$adv_tbar_postclassified,
				'<span>' . esc_attr($tax->name) . '</span>'
			);
			
		}
			
	
		
	} else if( is_author() ){ // Author
		
		if ( have_posts() ){
			the_post();
			$adv_tbar_authorarc = themetechmount_get_option('adv_tbar_authorarc');
			$adv_tbar_authorarc = ( !empty( $adv_tbar_authorarc ) ) ? esc_attr($adv_tbar_authorarc.' %s') : esc_attr__('Author Archives: %s', 'fixtech');
			$title = sprintf(
				$adv_tbar_authorarc,
				'<span class="tm-titlebar-heading tm-tbar-author-title">' . get_the_author() . '</span>'
			);
			
		}



	} else if( is_search()  ){ // Search Results
		$title    = sprintf( esc_attr__( 'Search Results for %s', 'fixtech' ), '<span class="tm-titlebar-heading tm-tbar-search-title">' . get_search_query() . '</span>' );

		
		
		
		
	} else if( is_404() ){ // 404
		if( function_exists('tribe_is_past') && function_exists('tribe_is_upcoming') && (tribe_is_past() || tribe_is_upcoming() || tribe_is_month() || tribe_is_day() && !is_tax()) ){
			$title = esc_attr__( 'EVENTS', 'fixtech' );
		}
	

	
	} else if( is_archive() ){
		// Title for events calendar pages
		if( function_exists('tribe_is_month') && tribe_is_month() && !is_tax() ) { // The Main Calendar Page
			$title = esc_attr__( 'Events Calendar', 'fixtech' );
			
		} elseif( function_exists('tribe_is_month') && tribe_is_month() && is_tax() ) { // Calendar Category Pages
			$title = single_term_title('', false);
			
		} elseif( function_exists('tribe_is_event') &&  tribe_is_event() && !tribe_is_day() && !is_single() ) { // The Main Events List
			$title = esc_attr__( 'Events', 'fixtech' );

		} elseif( function_exists('tribe_is_event') && tribe_is_event() && is_single() ) { // Single Events
			$title = get_the_title();
			
		} elseif( function_exists('tribe_is_day') && tribe_is_day() ) { // Single Event Days
			global $wp_query;
			$title = esc_attr__( 'Events on: ', 'fixtech' ). date('F j, Y', strtotime($wp_query->query_vars['eventDate']));
			
		} elseif( function_exists('tribe_is_venue') && tribe_is_venue() ) { // Single Venues
			$title =	get_the_title();
			
			
		// BBPress section
		} else if( function_exists('is_bbpress') && is_bbpress() ) {
			$title = esc_attr__( 'Forum', 'fixtech' );
		} else if( is_post_type_archive() ){
			$title = post_type_archive_title('', false);
		} else if ( is_day() ){
			$title = sprintf( esc_attr__( 'Daily Archives: %s', 'fixtech' ), '<span>' . get_the_date() . '</span>' );
		} elseif( is_month() ){
			$title = sprintf( esc_attr__( 'Monthly Archives: %s', 'fixtech' ), '<span>' . get_the_date( esc_attr_x( 'F Y', 'monthly archives date format', 'fixtech' ) ) . '</span>' );
		} elseif( is_year() ){
			$title = sprintf( esc_attr__( 'Yearly Archives: %s', 'fixtech' ), '<span>' . get_the_date( esc_attr_x( 'Y', 'yearly archives date format', 'fixtech' ) ) . '</span>' );
		} else {
			if( function_exists('is_bbpress') && is_bbpress() ) {
				$title = esc_attr__( 'Forum', 'fixtech' );
			} else {
				$title = esc_attr__( 'Archives', 'fixtech' );
			}
		};
		
		
		
	} else {
		$title = get_the_title();
		
	}
	
	
	// return data
	$return  = '';
	$return .= ( !empty($title) ) ? '<h1 class="entry-title"> '. do_shortcode($title) . '</h1>' : '' ;
	$return .= ( !empty($subtitle) ) ? '<h3 class="entry-subtitle"> '. do_shortcode($subtitle) .'</h3>' : '' ;
	
	if( $return!='' ){
		$return = '<div class="entry-title-wrapper"><div class="container">'.$return.'</div></div>';
	}
	
	// Return data
	return $return;
	
}
}










if( !function_exists('themetechmount_titlebar_content') ){
function themetechmount_titlebar_content(){
	
	$titlebar_hide_breadcrumb = themetechmount_get_option('titlebar_hide_breadcrumb');
	$titlebar_view            = themetechmount_get_option('titlebar_view');
	
	$leftContent  = '';
	$rightContent = '';
	
	
	$post_id = false;
	if( is_singular() ){
		$post_id = get_the_ID();
	} else if( function_exists('is_woocommerce') ) {
		if( is_woocommerce() ){
			$post_id = get_option( 'woocommerce_shop_page_id' );
		}
	}
	
	
	
	
	// Left content
	$leftContent = themetechmount_titlebar_title();
	
	// Right content
	if( !empty($titlebar_hide_breadcrumb) && $titlebar_hide_breadcrumb!='yes' ){
		$rightContent = themetechmount_titlebar_breadcrumb();
	}
	
	
	
	// if single page,post etc
	if( $post_id ){
		$single_titlebar = get_post_meta( $post_id, '_themetechmount_metabox_group', true );
		// View
		if( !empty($single_titlebar['titlebar_hide_breadcrumb']) ){
			if( $single_titlebar['titlebar_hide_breadcrumb'] == 'yes' ){
				$rightContent = '';
			} else if( $single_titlebar['titlebar_hide_breadcrumb'] == 'no' ){
				$rightContent = themetechmount_titlebar_breadcrumb();
			}
		}
	}
	
	
	
	// All content
	$allContent = $leftContent . $rightContent;
	if( !empty($titlebar_view) && $titlebar_view == 'right' ){  // Right align
		$allContent = $rightContent . $leftContent;
	}
	
	// if single page,post etc
	if( $post_id ){
		$single_titlebar = get_post_meta( $post_id, '_themetechmount_metabox_group', true );
		// View
		if( !empty($single_titlebar['titlebar_view']) && $single_titlebar['titlebar_view'] == 'right' ){  // Right align
			$allContent = $rightContent . $leftContent;
		}
	}
	
	
	
	if( !empty($titlebar_view) && $titlebar_view == 'right' ){  // Right align
		$allContent = $rightContent . $leftContent;
	}
	
	
	
	// Return data
	return $allContent;
	
	
}
}




if( !function_exists('themetechmount_titlebar_show') ){
function themetechmount_titlebar_show(){
	$return = true;
	
	$post_id = false;
	if( is_singular() ){
		$post_id = get_the_ID();
	} else if( function_exists('is_woocommerce') ) {
		if( is_woocommerce() ){
			$post_id = get_option( 'woocommerce_shop_page_id' );
		}
	}
	
	if( $post_id ){
		$single_view = get_post_meta( $post_id, '_themetechmount_metabox_group', true );
		if( !empty($single_view['hide_titlebar']) && $single_view['hide_titlebar']==true ){
			$return = false;
		}
	}
	
	return $return;
}
}







if( !function_exists('themetechmount_titlebar_breadcrumb') ){
function themetechmount_titlebar_breadcrumb(){
	$return = '';
	if(function_exists('bcn_display')){
		$return .=  '<!-- Breadcrumb NavXT output -->';
		$return .= bcn_display(true);
	} else if( function_exists('is_woocommerce') && is_woocommerce() ) {
		$return .=  '<!-- woocommerce_breadcrumb -->';
		ob_start();
		woocommerce_breadcrumb(); //would normally get printed to the screen/output to browser
		$tm_wc_bcrumb_output = ob_get_contents();
		ob_end_clean();
		$return .= $tm_wc_bcrumb_output;
	}
	
	if( !empty($return) ){
		$return = '<div class="breadcrumb-wrapper"><div class="container">'. $return .'</div></div>';
	}
	
	return $return;
	
}
}






/**
 *  Adding inline style css for Titlebar
 */
if( !function_exists('themetechmount_titlebar_inline_style') ){
function themetechmount_titlebar_inline_style(){
	$css = '';
	
	
	// Singuler of shop page
	$post_id = false;
	if( is_singular() ){
		$post_id = get_the_ID();
	} else if( function_exists('is_woocommerce') ) {
		if( is_woocommerce() ){
			$post_id = get_option( 'woocommerce_shop_page_id' );
		}
	}
	
	if( $post_id ){
		$page_titlebar = get_post_meta( $post_id, '_themetechmount_metabox_group' ,true );
		
		// Background options
		if( !empty($page_titlebar['titlebar_bg_custom_options']) && $page_titlebar['titlebar_bg_custom_options']=='custom' ){
			
			$bg_exclude = array();
			if( !empty($page_titlebar['titlebar_bg_color']) && $page_titlebar['titlebar_bg_color']!='custom' ){
				$bg_exclude = array('background-color');
			}
			
			
			$css .= themetechmount_get_background_css(
				'div.tm-titlebar-wrapper',
				$page_titlebar['titlebar_background'],
				$bg_exclude // exclude array
			);
		}
		
		// custom fonts
		if( !empty($page_titlebar['titlebar_font_custom_options']) && $page_titlebar['titlebar_font_custom_options']=='custom' ){
			
			// heading
			$css .= themetechmount_get_font_css(
				'.tm-titlebar-wrapper .tm-titlebar-main h1.entry-title',
				$page_titlebar['titlebar_heading_font'],
				true
			);
			
			// sub-heading
			$css .= themetechmount_get_font_css(
				'.tm-titlebar-wrapper .tm-titlebar-main h3.entry-subtitle',
				$page_titlebar['titlebar_subheading_font'],
				true
			);
			
			// breadcrumb
			$css .= themetechmount_get_font_css(
				'.tm-titlebar .breadcrumb-wrapper, .tm-titlebar .breadcrumb-wrapper a',
				$page_titlebar['titlebar_breadcrumb_font'],
				true
			);
			
			// add Google fonts css
			themetechmount_enqueue_google_fonts(
				array(
					$page_titlebar['titlebar_heading_font'],
					$page_titlebar['titlebar_subheading_font'],
					$page_titlebar['titlebar_breadcrumb_font']
				)
			);
			
		}
		
		
		
		// Titlebar Height
		if( !empty($page_titlebar['titlebar_height']) ){
			$css .= '.tm-titlebar-wrapper .tm-titlebar-inner-wrapper{height:'. $page_titlebar['titlebar_height'] .'px;}';
		}
	
	}
	
	
	return $css;
	
	
}
}
add_action( 'wp_enqueue_scripts', 'themetechmount_titlebar_inline_style', 18 );





/**
 *  themetechmount_enqueue_google_fonts function
 */
if( !function_exists('themetechmount_enqueue_google_fonts') ){
function themetechmount_enqueue_google_fonts( $fontsdata ){
	
	foreach( $fontsdata as $font ){
		if( !empty($font['family']) ){
			themetechmount_footer_google_fonts_array( $font['family'] , $font['variant'] );
		}
	}
	
}
}



/* =============================================================== */
/* --------------------- Topbar functions  ----------------------- */

if( !function_exists('themetechmount_topbar_show') ){
function themetechmount_topbar_show(){
	$return = true;
	
	
	$show_topbar = themetechmount_get_option('show_topbar');
	if( isset($show_topbar) ){
		$return = $show_topbar;
	}
	
	
	$post_id = false;
	if( is_singular() ){
		$post_id = get_the_ID();
	} else if( function_exists('is_woocommerce') ) {
		if( is_woocommerce() ){
			$post_id = get_option( 'woocommerce_shop_page_id' );
		}
	}
	
	if( $post_id ){
		$single_view = get_post_meta( $post_id, '_themetechmount_metabox_group', true );
		if( !empty($single_view['show_topbar']) ){
			if( $single_view['show_topbar']=='yes' ){
				$return = true;
			} else if( $single_view['show_topbar']=='no' ){
				$return = false;
			}
		}
	}
	
	return $return;
}
}






if( !function_exists('themetechmount_topbar_classes') ){
function themetechmount_topbar_classes(){
	global $tm_inline_css;
	$full_wide_elements = themetechmount_get_option('full_wide_elements');
	$topbar_bg_color    = themetechmount_get_option('topbar_bg_color');
	$topbar_text_color  = themetechmount_get_option('topbar_text_color');
	$layout             = themetechmount_get_option('layout');
	$return = array();

	
	// Singuler or Shop page
	$post_id = false;
	if( is_singular() ){
		$post_id = get_the_ID();
	} else if( function_exists('is_woocommerce') ) {
		if( is_woocommerce() ){
			$post_id = get_option( 'woocommerce_shop_page_id' );
		}
	}
	
	// Single overwrite
	if( $post_id ){
		$single_tbar_options = get_post_meta( $post_id, '_themetechmount_metabox_group', true );
		
		if( !empty($single_tbar_options['topbar_bg_color']) ){
			$topbar_bg_color = $single_tbar_options['topbar_bg_color'];
		}
		
		// Text Color
		if( !empty($single_tbar_options['topbar_text_color']) ){
			$topbar_text_color = $single_tbar_options['topbar_text_color'];
		}
		
	}  //  if( is_singular() )
	
	
	
	if( !empty($topbar_bg_color) ){
		$return[] = 'tm-bgcolor-'.$topbar_bg_color;
	}
	if( !empty($topbar_view) ){
		$return[] = 'tm-topbar-align-'.$topbar_view;
	}
	if( !empty($topbar_text_color) ){
		$return[] = 'tm-textcolor-'.$topbar_text_color;
	}
	
	//Full Wide class
	if( $layout=='fullwide' && is_array($full_wide_elements) && count($full_wide_elements)>0 ){
		if( in_array('topbar', $full_wide_elements ) ){
			$return[] = 'container-full';
		}
	} 
	
	// output
	$return = implode( ' ', $return );
	
	
	// Return data
	return $return;

}
}







if( !function_exists('themetechmount_topbar_content') ){
function themetechmount_topbar_content(){
	$return = $topbar_left_text = $topbar_right_text = '';
	$topbar_left_text  = themetechmount_get_option('topbar_left_text');
	$topbar_right_text = themetechmount_get_option('topbar_right_text');
	
	
	// Singuler or Shop page
	$post_id = false;
	if( is_singular() ){
		$post_id = get_the_ID();
	} else if( function_exists('is_woocommerce') ) {
		if( is_woocommerce() ){
			$post_id = get_option( 'woocommerce_shop_page_id' );
		}
	}
	
	if( $post_id ){
		$single_tbar_options = get_post_meta( $post_id, '_themetechmount_metabox_group', true );
		
		if( !empty($single_tbar_options['topbar_left_text']) ){
			$topbar_left_text = $single_tbar_options['topbar_left_text'];
		}
		
		// Right text
		if( !empty($single_tbar_options['topbar_right_text']) ){
			$topbar_right_text = $single_tbar_options['topbar_right_text'];
		}
		
	}
	
	
	
	if( !empty($topbar_left_text) ){
		$topbar_left_text = '<div class="tm-wrap-cell">'. do_shortcode($topbar_left_text) .'</div>';
	}
	if( !empty($topbar_right_text) ){
		$topbar_right_text = '<div class="tm-wrap-cell tm-align-right">'. do_shortcode($topbar_right_text) .'</div>';
	}
	
	if( !empty($topbar_left_text) || !empty($topbar_right_text) ){
		$return = '<div class="tm-wrap tm-topbar-content">'. $topbar_left_text . $topbar_right_text .'</div>';
	}
	
	
	
	// Return data
	return $return;
	
}
}





if( !function_exists('themetechmount_topbar_inline_style') ){
function themetechmount_topbar_inline_style(){
	$return                   = '';
	$topbar_bg_color          =  themetechmount_get_option('topbar_bg_color');
	$topbar_bg_custom_color   =  themetechmount_get_option('topbar_bg_custom_color');
	$topbar_text_color        =  themetechmount_get_option('topbar_text_color');
	$topbar_text_custom_color =  themetechmount_get_option('topbar_text_custom_color');
	
	// Getting singluar id or shop id
	$post_id = false;
	if( is_singular() ){
		$post_id = get_the_ID();
	} else if( function_exists('is_woocommerce') && is_woocommerce() ) {
		$post_id = get_option( 'woocommerce_shop_page_id' );
	}
	
	
	// Single overwrite
	if( $post_id ){
		$single_tbar_options = get_post_meta( $post_id, '_themetechmount_metabox_group', true );
		
		// BG Color
		if( !empty($single_tbar_options['topbar_bg_color']) ){
			$topbar_bg_color        = $single_tbar_options['topbar_bg_color'];
			$topbar_bg_custom_color = $single_tbar_options['topbar_bg_custom_color'];
		}
		
		// Text Color
		if( !empty($single_tbar_options['topbar_text_color']) ){
			$topbar_text_color        = $single_tbar_options['topbar_text_color'];
			$topbar_text_custom_color = $single_tbar_options['topbar_text_custom_color'];
		}
		
	}
	
	
	// BG Color CSS code
	if( $topbar_bg_color=='custom' ){
		$return .= '.themetechmount-topbar-wrapper{background-color:'. $topbar_bg_custom_color .';}';
	}
	
	// Text Color CSS code
	if( $topbar_text_color=='custom' ){
		$return .= '.themetechmount-topbar-wrapper, .themetechmount-topbar-wrapper a{color:'. $topbar_text_custom_color .';}';
	}
	
	return $return;
	
}
}





/* =============================================================== */
/* --------------------- Header functions  ----------------------- */


/**
 *  Main logo
 */
if( !function_exists('themetechmount_site_logo') ){
function themetechmount_site_logo( $logo_type = '' ){
	$logoimg_sticky = themetechmount_get_option('logoimg_sticky');
	$logoseo        = themetechmount_get_option('logoseo');
	$logotype       = themetechmount_get_option('logotype');
	$return     = '';
	$stickylogo = '';
	
	
	// sticky logo class
	$stickyLogoClass = 'no';
	if( !empty($logoimg_sticky['id']) || !empty($logoimg_sticky['thumb-url']) || !empty($logoimg_sticky['full-url']) ){
		$stickyLogoClass = 'yes';
	}
	
	// Logo code
	$logo_html = themetechmount_logo();
	
	// Logo tag for SEO
	$logotag    = ( $logoseo=='h1homeonly' && !is_front_page() ) ? 'span' : 'h1' ;
	
	// Preparing logo
	$return .= '<div class="headerlogo themetechmount-logotype-'. sanitize_html_class($logotype) .' tm-stickylogo-'. sanitize_html_class($stickyLogoClass) .'">';
		$return .= '<'.esc_attr($logotag) .' class="site-title">';
			$return .= '<a class="home-link" href="'. esc_url( home_url( '/' ) ) .'" title="'. esc_attr( get_bloginfo( 'name', 'display' ) ) .'" rel="home">';
				$return .= $logo_html;
			$return .= '</a>';
		$return .= '</'. esc_attr($logotag) .'>';
		$return .= '<h2 class="site-description">'. get_bloginfo( 'description' ) .'</h2>';
	$return .= '</div>';
	return $return;
}
}






if( !function_exists('themetechmount_header_links') ){
function themetechmount_header_links(){
	$return         = '';
	$header_search  = themetechmount_get_option('header_search');
	$wc_header_icon = themetechmount_get_option('wc-header-icon');
	$header_style   = themetechmount_get_option('headerstyle');
	$class          = 'tm-fbar-link-only';
	
	// Floating bar icon
	if( themetechmount_fbar_show()==true ){
		$return .= '
		<span class="themetechmount-fbar-btn ' . themetechmount_sanitize_html_classes(themetechmount_fbar_btn_classes()) . '">
			<a href="javascript:void(0);" class="themetechmount-fbar-btn-link tm-icolor-' . themetechmount_sanitize_html_classes( themetechmount_get_option('fbar_icon_color') ) . ' tm-bgcolor-' . themetechmount_sanitize_html_classes( themetechmount_get_option('fbar_btn_bg_color') ) . '">
				' . themetechmount_fbar_open_icon() . '
				' . themetechmount_fbar_close_icon() . '
				<span class="tm-hide">' . esc_attr__('Open', 'fixtech') . '</span>
			</a>
		</span>';
	}
	
	
	if( in_array($header_style, array('infostack','infostack-rtl','infostack-overlay','infostack-overlay-rtl' ) ) ){
		$header_btn_url  = themetechmount_get_option('header_btn_url');
		$header_btn_text = themetechmount_get_option('header_btn_text');
		if( !empty($header_btn_url) && !empty($header_btn_text) ){
			$return  .= '<span class="tm-header-icon tm-header-btn-w"><a href="' . esc_url($header_btn_url) . '">' . esc_attr($header_btn_text) . '</a></span>';
		}
		
	}
	
	
	// Woo Commerce cart icon
	if( function_exists('is_woocommerce') && $wc_header_icon==true ){
		global $woocommerce;
		$class    = '';
		$cart_url = $woocommerce->cart->get_cart_url();
		$return  .= '<span class="tm-header-icon tm-header-wc-cart-link"><a href="' . $cart_url . '"><i class="tm-fixtech-icon-cart"></i><span class="number-cart">&nbsp;</span></a></span>';
	}
	
	
	// Search icon
	if( $header_search==true ){
		$class   = '';
		$return .= '<span class="tm-header-icon tm-header-search-link"><a href="javascript:void(0);"><i class="tm-fixtech-icon-search"></i></a></span>';
	}
	
	
	
	if( $return!='' ){
		$return = '<div class="tm-header-icons ' . $class . '">'. $return .'</div>';
	}
	
	return $return;
}
}



/**
 *  One page website
 */
if( !function_exists('themetechmount_one_page_site_js') ){
function themetechmount_one_page_site_js(){
	$one_page_site = themetechmount_get_option('one_page_site');
	if( $one_page_site==true ){
	?>
	
	<script type="text/javascript">
		var x = 1;
		jQuery('.mega-menu a, .menu-tm-main-menu-container a').each(function(){
			if( x != 1 ){
				jQuery(this).parent().removeClass('mega-current-menu-item mega-current_page_item current-menu-ancestor current-menu-item current_page_item');
			}
			x = 0;
		});
	</script>
	
	<?php
	}
}
}




/**
 *  Header container classes
 */
if( !function_exists('themetechmount_header_container_class') ){
function themetechmount_header_container_class(){
	
	$class = '';
	$class = themetechmount_container_class('header');
	
	// Return data
	return $class;
	
}
}


/**
 *  Page container class (optional)
 */
if( !function_exists('themetechmount_page_container_optional') ){
function themetechmount_page_container_optional(){
	$return = '';
	
	if( is_page() ){
		if( !function_exists('vc_lean_map') ){
			$return = 'container';
		} else {
			$page_object = get_page( get_the_ID() );
			$content     =  $page_object->post_content;
			if ( strpos( $content, '[vc_row' ) === false ) {
				$return = 'container';
			}
		}
	}
	
	return $return;
	
}
}



/**
 *  Footer container classes
 */
if( !function_exists('themetechmount_footer_container_class') ){
function themetechmount_footer_container_class( $class = array() ){
	
	$class = '';
	$class = themetechmount_container_class('footer');
	
	// Return data
	return $class;
	
}
}


/**
 *  Floating Bar container classes
 */
if( !function_exists('themetechmount_floatingbar_container_class') ){
function themetechmount_floatingbar_container_class(){
	
	$class = '';
	$class = themetechmount_container_class('floatingbar');
	
	// Return data
	return $class;
	
}
}


/**
 *  Topbar container classes
 */
if( !function_exists('themetechmount_topbar_container_class') ){
function themetechmount_topbar_container_class(){
	
	$class = '';
	$class = themetechmount_container_class('topbar');
	
	// Return data
	return $class;
	
}
}


/**
 *  Content-area container classes
 */
if( !function_exists('themetechmount_contentarea_container_class') ){
function themetechmount_contentarea_container_class(){
	
	$class = '';
	$class = themetechmount_container_class('content');
	
	// Return data
	return $class;
	
}
}


/**
 *   Container classes for wide and full wide layout
 */
if( !function_exists('themetechmount_container_class') ){
function themetechmount_container_class($section='header'){
	
	$class              = '';
	$layout             = themetechmount_get_option('layout');
	$full_wide_elements = themetechmount_get_option('full_wide_elements');
	
	if( $layout=='fullwide' && is_array($full_wide_elements) && in_array($section, $full_wide_elements) ){
		$class = 'container-fullwide';
	} else {
		$class = 'container';
	}
	
	$class .= ' tm-container-for-'.$section; // adding general class
	
	return $class;
	
}
}





/**
 *  Header main classes
 */
if( !function_exists('themetechmount_header_class') ){
function themetechmount_header_class( $extra_class='' ){
	$header_bg_color              = themetechmount_get_option( 'header_bg_color' );
	$header_responsive_icon_color = themetechmount_get_option( 'header_responsive_icon_color' );
	$megamenu_override            = themetechmount_get_option( 'megamenu-override' );
	$sticky_header_bg_color       = themetechmount_get_option( 'sticky_header_bg_color' );
	$header_menu_position         = themetechmount_get_option( 'header_menu_position' );
	
	$class				= array();
	$headerstyle 		= themetechmount_get_headerstyle();
	$valid_headerstyle	= array(
							'classic',
							'classic-overlay',
						);
	
	
	// header bg class
	if( !empty($header_bg_color) ) {
		$class[] = 'tm-bgcolor-'.esc_attr( $header_bg_color );
	};
	
	// sticky header bg class
	if( !empty($sticky_header_bg_color) ) {
		$class[] = 'tm-sticky-bgcolor-'.esc_attr( $sticky_header_bg_color );
	};
	
	// Responsive icon (like responsive menu, cart icon, search icon) color
	if( !empty($header_responsive_icon_color) && $header_bg_color=='custom' ) {
		$class[] = 'tm-responsive-icon-'.esc_attr( $header_responsive_icon_color );
	};
	
	
	// Header Menu Postion class for specific header styles only
	if( in_array( $headerstyle, $valid_headerstyle ) && !empty( $header_menu_position ) ){
		$class[] = 'tm-header-menu-position-'. sanitize_html_class( $header_menu_position );
	}
	
	
	// Override Max Mega Menu style
	if( $megamenu_override == true ){
		$class[] = 'tm-mmmenu-override-yes';
	}
	
	
	// extra class
	if( !empty($extra_class) ){
		$class[] = $extra_class;
	}
	
	// processing and preparing all class
	if( count($class)>0 ){
		$class = implode(' ', $class );
	} else {
		$class = '';
	}
	
	// Return data
	return $class;

}
}



/**
 * adding height for menu area in selected headerstyle only
 */
if( !function_exists('themetechmount_header_menuarea_height') ){
function themetechmount_header_menuarea_height(){
	$return                 = '60';
	$header_menuarea_height = themetechmount_get_option('header_menuarea_height');
	
	if( !empty($header_menuarea_height) ){
		$return = $header_menuarea_height;
	}
	return $return;
	
}
}
 



/**
 *  Header main classes
 */
if( !function_exists('themetechmount_sticky_header_class') ){
function themetechmount_sticky_header_class(){
	$class         = '';
	$sticky_header = themetechmount_get_option('sticky_header');
	
	// Check if sticky header enabled
	if( $sticky_header==true) {
		$class .= ' ' . sanitize_html_class('tm-stickable-header');
	};
	
	// Return data
	return $class;

}
}






/*
 *  Header dynamic class for different settings
 */
if ( !function_exists('themetechmount_headerclass') ){
function themetechmount_headerclass(){
	$mainmenu_active_link_color = themetechmount_get_option('mainmenu_active_link_color');
	$dropmenu_active_link_color = themetechmount_get_option('dropmenu_active_link_color');
	$dropdown_menu_separator    = themetechmount_get_option('dropdown_menu_separator');
	
	$headerClassList = array();
	
	// Main Menu active link color
	if( !empty($mainmenu_active_link_color) ){
		$headerClassList[] = 'tm-mmenu-active-color-'.sanitize_html_class($mainmenu_active_link_color);
	} else {
		$headerClassList[] = 'tm-mmenu-active-color-skin';
	}
	
	// Dropdown Menu active link color
	if( !empty($dropmenu_active_link_color) ){
		$headerClassList[] = 'tm-dmenu-active-color-'. sanitize_html_class($dropmenu_active_link_color);
	} else {
		$headerClassList[] = 'tm-dmenu-active-color-skin';
	}
	
	// Dropdown Menu separator
	if( !empty($dropdown_menu_separator) ){
		$headerClassList[] = 'tm-dmenu-sep-'. sanitize_html_class($dropdown_menu_separator);
	} else {
		$headerClassList[] = 'tm-dmenu-sep-grey';
	}
	
	return ' '.implode(' ', $headerClassList);
}
}






/*
 *  Header dynamic class for different settings
 */
if ( !function_exists('themetechmount_get_headerstyle') ){
function themetechmount_get_headerstyle(){
	$return      = 'classic';
	$headerstyle = themetechmount_get_option('headerstyle');
	
	if( !empty($headerstyle) ){
		$return = $headerstyle;
	}
		
	// Return data
	return $return;
	
}
}




/*
 *  Header dynamic class for different settings
 */
if ( !function_exists('themetechmount_header_style_class') ){
function themetechmount_header_style_class( $echo=false ){
	$return = '';
	
	// Main header class so we can understand the selected header style
	$headerstyle = themetechmount_get_headerstyle();
	$headerstyle = str_replace('-overlay','', $headerstyle);
	$headerstyle = str_replace('-rtl','', $headerstyle);
	$return     .= ' tm-header-style-'. $headerstyle;
	
	if (strpos( themetechmount_get_headerstyle(), 'overlay') !== false) {
		$return .= ' tm-header-overlay';
	}
	
	if (strpos( themetechmount_get_headerstyle(), 'rtl') !== false) {
		$return .= ' tm-header-invert';
	}
	
	
	
	return $return;
	
}
}







/**
 *  Header inline style
 */
if( !function_exists('themetechmount_header_menu_class') ){
function themetechmount_header_menu_class(){
	global $fixtech_theme_options;
	
	$class                       = '';
	$header_menu_bg_color        = themetechmount_get_option('header_menu_bg_color');
	$sticky_header_menu_bg_color = themetechmount_get_option('sticky_header_menu_bg_color');
	
	
	if( !empty($header_menu_bg_color) ){
		$class .= ' tm-header-menu-bg-color-'. sanitize_html_class($header_menu_bg_color) .' tm-bgcolor-'. sanitize_html_class($header_menu_bg_color);
	}
	
	// sticky class
	if( !empty($sticky_header_menu_bg_color) ){
		$class .= ' tm-sticky-bgcolor-'. sanitize_html_class($sticky_header_menu_bg_color);
	}
	
	
	// Return data
	return $class;
	
}
}








/* ===================================================================== */
/* --------------------- Floating Bar functions  ----------------------- */


/**
 *  ThemeTechMount Floating Bar classes
 */
if( !function_exists('themetechmount_fbar_show') ){
function themetechmount_fbar_show(){
	$fbar_show = themetechmount_get_option('fbar_show');
	$return    = false;
	
	if( $fbar_show==true ){
		$return = true;
	}
	
	return $return;
}
}


/**
 *  Floating Bar button classes
 */
if( !function_exists('themetechmount_fbar_btn') ){
function themetechmount_fbar_btn(){
	$return = '<!-- Open/close button -->
			<span class="themetechmount-fbar-btn ' . themetechmount_sanitize_html_classes(themetechmount_fbar_btn_classes()) . '">
				<a href="javascript:void(0)" class="themetechmount-fbar-btn-link">
					' . themetechmount_fbar_open_icon() . '
					' . themetechmount_fbar_close_icon() . '
					<span class="tm-hide">' . esc_attr__('Open', 'fixtech') . '</span>
				</a>
			</span>';
			
	return $return;
}
}


/**
 *  Floating Bar button classes
 */
if( !function_exists('themetechmount_fbar_btn_classes') ){
function themetechmount_fbar_btn_classes(){
		
	$topbarbgcolor = themetechmount_get_option('topbarbgcolor');
	$fbar_position = themetechmount_get_option('fbar-position');
	
	
	$return = array();
	
	if( !empty($topbarbgcolor) && trim($topbarbgcolor)=='skincolor' ){
		$return[] = 'tm-fbar-btn-bgnoskin';
	}
	
	// Floating bar position class
	if( !empty($fbar_position) ){
		$return[] = 'tm-fbar-btn-cposition-' . $fbar_position;
	}
	
	return implode(' ',$return);
}
}






/**
 *  ThemeTechMount Floating Bar close icon
 */
if( !function_exists('themetechmount_fbar_open_icon') ){
function themetechmount_fbar_open_icon(){
	$return = '';
	
	$fbar_handler_icon = themetechmount_get_option('fbar_handler_icon');
	$return = '<span class="tm-fbar-open-icon">' . themetechmount_create_icon_from_data( $fbar_handler_icon, true ) . '</span>';
	
	return $return;
}
}

/**
 *  ThemeTechMount Floating Bar close icon
 */
if( !function_exists('themetechmount_fbar_close_icon') ){
function themetechmount_fbar_close_icon(){
	$return = '';
	
	$fbar_handler_icon_close = themetechmount_get_option('fbar_handler_icon_close');
	$return = '<span class="tm-fbar-close-icon" style="display:none;">' . themetechmount_create_icon_from_data( $fbar_handler_icon_close, true ) . '</span>';
	
	return $return;
}
}


/**
 *  ThemeTechMount Floating Bar close icon for content area
 */
if( !function_exists('themetechmount_fbar_close_icon_for_content_area') ){
function themetechmount_fbar_close_icon_for_content_area(){
	$return = '';
	
	$fbar_handler_icon_close = themetechmount_get_option('fbar_handler_icon_close');
	$return = themetechmount_create_icon_from_data( $fbar_handler_icon_close, true );
	
	return $return;
}
}



/**
 *  ThemeTechMount Floating Bar classes
 */
if( !function_exists('themetechmount_fbar_classes') ){
function themetechmount_fbar_classes(){
	global $fixtech_theme_options;
	
	$fbar_background = themetechmount_get_option('fbar_background');
	$topbarbgcolor   = themetechmount_get_option('topbarbgcolor');
	
	$optionsArray = array(
						'fbar_show',
						'fbar_bg_color',
						'fbar_text_color',
						'fbar_text_custom_color',
						'fbar_background',
						'fbar_handler_icon',
						'fbar_handler_icon_close'
	);

	// Creating variables
	foreach( $optionsArray as $option ){
		
		$current_val = themetechmount_get_option($option);
		
		if( !is_array($current_val) ){  // bypassing color value which is array by default
			$fbar_opt = esc_attr($current_val);
		} else {
			$fbar_opt = $current_val;
		}
		$$option = $fbar_opt;
	
	}
	
	
	$classes = array();
	$classes[] = 'tm-textcolor-'. sanitize_html_class($fbar_text_color); // Text Color
	$classes[] = 'tm-bgcolor-'. sanitize_html_class($fbar_bg_color); // BG Color
	
	// Bg image class
	
	
	
	
	if( !empty($fbar_background['image']) ){
		$classes[] = 'tm-bg';
		$classes[] = 'tm-bgimage-yes';
	} else {
		$classes[] = 'tm-bgimage-no';
	}
	
	
	// If Topbar bg color is set to SKIN color than set the icon color with grey or dark-grey color so it will be visible
	if( $topbarbgcolor == 'skincolor' ){
		$classes[] = 'tm-fbar-btn-bgnoskin';
	}
	
	// Return data
	return implode(' ',$classes);
}
}




/**
 * Add inline CSS for Floating Bar area based on certain conditions. 
 */
if(!function_exists('themetechmount_floatingbar_inline_css')){
function themetechmount_floatingbar_inline_css(){
	
	
	$return = '';
	
	// getting options
	$fbar_show                = themetechmount_get_option('fbar_show');
	$fbar_bg_color            = themetechmount_get_option('fbar_bg_color');
	$fbar_text_color          = themetechmount_get_option('fbar_text_color');
	$fbar_text_custom_color   = themetechmount_get_option('fbar_text_custom_color');
	$fbar_icon_color          = themetechmount_get_option('fbar_icon_color');
	$fbar_icon_custom_color   = themetechmount_get_option('fbar_icon_custom_color');
	$fbar_btn_bg_color        = themetechmount_get_option('fbar_btn_bg_color');
	$fbar_btn_bg_custom_color = themetechmount_get_option('fbar_btn_bg_custom_color');

	
	if($fbar_show){
	
		// Inline style
		$inlineStyleAll			= '';
		$inlineStyle     		= '';
		$inlineStyle_a   		= '';
		$inlineStyle_ah  		= '';
		$inlineStyle_h   		= '';
		$inlineStyle_border   	= '';
	
		// Custom Background color RGB
		if( $fbar_bg_color == 'custom' && !empty( $fbar_bg_custom_color['rgba'] ) ){
			$return .= '.themetechmount-fbar-box-w:after{background-color:'.esc_attr($fbar_bg_custom_color['rgba']).';}';
		}
		
		// Custom Text Color
		if( $fbar_text_color == 'custom' && !empty($fbar_text_custom_color) ){
			$fbar_text_custom_color  = esc_attr($fbar_text_custom_color);
			$inlineStyle			.= 'color: rgba( ' . themetechmount_hex2rgb($fbar_text_custom_color) . ', 0.7);';
			$inlineStyle_a			.= 'color: rgba( ' . themetechmount_hex2rgb($fbar_text_custom_color) . ', 1);';
			$inlineStyle_ah			.= 'color: rgba( ' . themetechmount_hex2rgb($fbar_text_custom_color) . ', 0.7);';
			$inlineStyle_h  		.= 'color: rgba( ' . themetechmount_hex2rgb($fbar_text_custom_color) . ', 1);';
			$inlineStyle_border  	.= 'border-color: rgba( ' . themetechmount_hex2rgb($fbar_text_custom_color) . ', 0.7);';
			
			$return .= "
				.themetechmount-fbar-box-w *, .tm-wrap-cell.tm-fbar-input .search_field.selectbox:after, .themetechmount-fbar-box .search_field select, .themetechmount-content-team-search-box .search_field select, .themetechmount-fbar-box .search_field i, .themetechmount-content-team-search-box .search_field i { $inlineStyle }
				.themetechmount-fbar-box-w a, .widget_calendar #today{ $inlineStyle_a }
				.themetechmount-fbar-box-w a:hover{ $inlineStyle_ah }
				.themetechmount-fbar-box-w .widget .widget-title{ $inlineStyle_h }
				.themetechmount-fbar-box-w .widget .widget-title, .themetechmount-fbar-box-w .widget_calendar table, .themetechmount-fbar-box-w .widget_calendar th, .themetechmount-fbar-box-w .widget_calendar td, .themetechmount-fbar-box .search_field, .contact-info{ $inlineStyle_border }
			";
		}
		
		
		// Icon buttons
		if( $fbar_btn_bg_color=='custom' ){
			$return .= '
			.themetechmount-fbar-btn a{
				background-color: ' . $fbar_btn_bg_custom_color . ';
			}
			';
		}
		
		if( $fbar_icon_color=='custom' ){
			$return .= '
			.themetechmount-fbar-btn a i{
				color: ' . $fbar_icon_custom_color . ';
			}
			';
		}
		
	} 
	
	return $return;
	
}
}
//add_action( 'wp_enqueue_scripts', 'themetechmount_floatingbar_inline_css', 16 );









/* =============================================================== */
/* --------------------- Footer functions  ----------------------- */
if( !function_exists('themetechmount_footer_row_class') ){
function themetechmount_footer_row_class( $row='first' ){
	$class = '';
	global $fixtech_theme_options;
	
	// BG color
	if( !empty($fixtech_theme_options[$row.'_footer_bg_color']) ){
		$class .= ' tm-bg tm-bgcolor-'.sanitize_html_class($fixtech_theme_options[$row.'_footer_bg_color']);
	}
	
	// Text color
	if( !empty($fixtech_theme_options[$row.'_footer_text_color']) ){
		$class .= ' tm-textcolor-'.sanitize_html_class($fixtech_theme_options[$row.'_footer_text_color']);
	}
	
	// If bg image is there
	if( !empty($fixtech_theme_options[$row.'_footer_bg_all']['image']) ){
		$class .= ' tm-bgimage-yes';
	} else {
		$class .= ' tm-bgimage-no';
	}
	
	
	// Return data
	return $class;
	
}
}


/**
 *  Create list of google fonts to set in footer
 *  usage: themetechmount_footer_google_fonts_array('Raleway', '100');
 */
if( !function_exists('themetechmount_footer_google_fonts_array') ){
function themetechmount_footer_google_fonts_array( $font_family, $font_weight='normal' ){
	$font_family = str_replace(' ','+', $font_family);
	$font_family = str_replace(' ','+', $font_family);
	$font_family = str_replace(' ','+', $font_family);
	
	global $tm_global_footer_gfonts;
	
	if( !is_array($tm_global_footer_gfonts) ){
		$tm_global_footer_gfonts = array();
	}
	// check if font_family already exists
	if( isset($tm_global_footer_gfonts[$font_family]) ){
		// check if font_weight already exists
		
		if( is_array($tm_global_footer_gfonts[$font_family]) && !in_array($font_weight, $tm_global_footer_gfonts[$font_family] ) ){
			$tm_global_footer_gfonts[$font_family][] = $font_weight;
		}
	} else {
		// font not found in global variable
		$tm_global_footer_gfonts[$font_family] = array($font_weight);
	}
	
}
}








if( !function_exists('themetechmount_portfolio_single_image_path') ){
function themetechmount_portfolio_single_image_path(){
	$image = '';
	if (has_post_thumbnail()){
		$image = wp_get_attachment_image_src( get_post_thumbnail_id( get_the_ID() ), 'full' );
		//var_dump($image);
		if( !empty($image[0]) ){
			$image = $image[0];
		}
	};
	
	
	// Return data
	return $image;
	
}
}





/* =============================================================== */
/* ---------------------  Team Member box  ----------------------- */
if( !function_exists('themetechmount_box_team_social_links') ){
function themetechmount_box_team_social_links(){
	$return = '';
	
	$data   = themetechmount_get_meta( 'themetechmount_team_member_social', 'social_icons_list' );
	
	if( !empty($data) && is_array($data) && count($data)>0 ){
		$return .= '<div class="tm-team-social-links-wrapper">';
		$return .= '<ul class="tm-team-social-links">';
		
		// getting all social name with slug
		$all_social = themetechmount_shared_social_list();
		
		foreach($data as $social ){
			
			$social_name = ( !empty($all_social[$social['social_icons_list_icon']]) ) ? $all_social[ $social['social_icons_list_icon'] ] : ucwords($social['social_icons_list_icon']) ;
			
			$return .= '<li><a href="'. $social['social_icons_list_link'] .'" target="_blank"><i class="tm-fixtech-icon-'. $social['social_icons_list_icon'] .'"></i><span class="tm-hide">'. $social_name .'</span></a></li>';
		}
		
		$return .= '</ul> <!-- .tm-team-social-links --> ';
		$return .= '</div> <!-- .tm-team-social-links-wrapper --> ';
	}
	
	// Return data
	return $return;
}
}



if( !function_exists('themetechmount_short_desc') ){
function themetechmount_short_desc(){
	$return = '';
	
	if( has_excerpt() ){
		$return  = nl2br( get_the_excerpt() );
		$return  = do_shortcode($return);
	} else {
		$return = get_the_content('Read more');
	}
	
	if( !empty($return) ){
		$return = '<div class="tm-short-desc">'. $return .'</div>';
	}
	
	return $return;
}
}

/**
 * Add HTTP to url if not added already
 */
if( !function_exists('fixtech_addhttp') ){
	function fixtech_addhttp($url){
		if (!preg_match("~^(?:f|ht)tps?://~i", $url)){
			$url = "http://" . $url;
		}
		return $url;
	}
}


/**
 * Change order of heading
 */
if( !function_exists('themetechmount_change_heading_order') ){
function themetechmount_change_heading_order($input_code=''){
	
	
	// finding and fetching <h2> and <h4> tag
	preg_match("/<h2>(.*?)<\/h2>/", $input_code, $h2_output_array);
	preg_match("/<h4>(.*?)<\/h4>/", $input_code, $h4_output_array);
	

	// heading with attributes
	preg_match('#<h([2]) .*?class="(.*?)".*?>(.*?)<\/h[2]>#si', $input_code, $h2_custom);
	preg_match('#<h([4]) .*?class="(.*?)".*?>(.*?)<\/h[4]>#si', $input_code, $h4_custom);
	
	
	// now checking if both tags are available
	if( !empty($h2_output_array) && is_array($h2_output_array) && count($h2_output_array)==2 &&
	!empty($h4_output_array) && is_array($h4_output_array) && count($h4_output_array)==2 ){
	
		$input_code = preg_replace('/<h4>(.*?)<\/h4>/', '', $input_code);
		
		$replace_word = $h4_output_array[0];
		$input_code = str_replace( '<h2>' , $replace_word.'<h2>' , $input_code );
		
	}

	if( !empty($h2_custom) && !empty($h4_custom) ){
		
		$string_h2 = $h4_custom[0];
		$string_h4 = $h2_custom[0] ;
		$string_h6 = '<h6 class="">this is sample </h6>';
		
		$input_code = preg_replace('#<h([2]) .*?class="(.*?)".*?>(.*?)<\/h[2]>#si', $string_h6, $input_code);
		
		$input_code = preg_replace('#<h([4]) .*?class="(.*?)".*?>(.*?)<\/h[4]>#si', $string_h4, $input_code);
		
		$input_code = preg_replace('#<h([6]) .*?class="(.*?)".*?>(.*?)<\/h[6]>#si', $string_h2, $input_code);
		
	}
	
	return $input_code;

}
}


/**
 * Testimonials Title and Designation details
 *
 * Create your own themetechmount_testimonial_title() to override in a child theme.
 *
 * @since Fixtech 1.0
 *
 */
if(!function_exists('themetechmount_testimonial_title')){
function themetechmount_testimonial_title(){
	
	$return      		= '';
	$testimonial_meta   = get_post_meta( get_the_id(), 'themetechmount_testimonials_details', true );
	$clienturl 			= trim($testimonial_meta['clienturl']);
	$designation		= trim($testimonial_meta['designation']);
	
	$return .= ( !empty($clienturl) ) ? '<span class="themetechmount-author-name"><a href="'.esc_url($clienturl).'" target="_blank">'.get_the_title().'</a></span>' : '<span class="themetechmount-author-name">'.get_the_title().'</span>' ;
	$return .= ( !empty($designation) ) ? '<span class="themetechmount-box-footer">'.esc_attr($designation).'</span>' : '';
	
	return $return;
		
}
}


/**
 * Testimonials Featured Image
 *
 * Create your own themetechmount_testimonial_featured_image() to override in a child theme.
 *
 * @since Fixtech 1.0
 *
 */
if(!function_exists('themetechmount_testimonial_featured_image')){
function themetechmount_testimonial_featured_image($size='thumbnail'){
	
	$return = "";
	$featured_image = themetechmount_featured_image($size);
	
	$return = ( !empty($featured_image) ) ? $featured_image : '<span class="themetechmount-icon-box"><i class="demo-icon tm-fixtech-icon-quote-left"></i></span>';
	
	return $return;

}
}


/**
 * Header Text Area depending on header sytle
 *
 * Create your own themetechmount_header_button() to override in a child theme.
 *
 * @since Fixtech 1.0
 *
 */
if( !function_exists('themetechmount_header_text') ){
function themetechmount_header_text(){
	$return		 = '';
	$headerstyle = themetechmount_get_headerstyle();
	$header_text = themetechmount_get_option('header_text');
	
	// list of valid header style where the text area will appear
	$valid_headerstyle = array(
							'classic',
							'classic-overlay',
							'classic-box-overlay',
							'classic-box-overlay-rtl',
							'classic-rtl',
							'classic-overlay-rtl',						
						);
	
	if( in_array( $headerstyle, $valid_headerstyle ) && !empty( $header_text ) ){
		$header_text = themetechmount_wp_kses( $header_text );
		$return      = '<div class="tm-header-text-area">'.do_shortcode( $header_text ).'</div>';
	}

	echo  $return;
	
}
}



/**
 * Client Logo boxes. 
 *
 * Create your own themetechmount_get_clientboxes() to override in a child theme.
 *
 * @since Fixtech 1.0
 *
 */
if( !function_exists('themetechmount_get_clientboxes') ){
function themetechmount_get_clientboxes( $vars = array() ){
	$return 			= '';
	$group 				= ( !empty( $vars['group'] ) ) ? $vars['group'] : '' ;
	$column 			= ( !empty( $vars['column'] ) ) ? $vars['column'] : '' ;
	$show 				= ( !empty( $vars['show'] ) ) ? $vars['show'] : '' ;
	$clients 			= themetechmount_get_option('clients');
	$list_of_clients 	= array();
	$finalkeys			= array();
	
	
	

	// created groups array
	if( !empty( $group ) ){
		$group = explode(',',$group);
	}
	
	
	//creating clients list
	if( is_array( $group ) && !empty( $group ) ){
		foreach( $clients as $key => $val ){	
			if( isset( $val['client_group'] ) && is_array( $val['client_group'] ) ){
				foreach( $group as $gkey => $gval ){
					if( in_array( $gval, $val['client_group']) ){
						$finalkeys[] = $key;
					}
				}
			}
		}
		
		$finalkeys = array_unique( $finalkeys );
		
		if( !empty( $finalkeys ) ){
			foreach( $finalkeys as $key => $val ){
				$list_of_clients[] = $clients[$val];
			}
		}
		
	} else{
		$list_of_clients = $clients;
	}
	
	
	$i = 0;
	foreach( $list_of_clients as $key => $val ){
		$i++;
		
		$client_name 	= trim( $val['client_name'] );
		$client_website = trim( $val['client_website'] );
		$client_logo    = wp_get_attachment_image( $val['client_logo'], 'full');
		$linktarget 	= '';
		
		// settings links target attribute
		if( $client_website != '' ){
			$linktarget = 'target="_blank"';
		} else {
			$client_website = 'javascript:void(0);';
		}
		
		
		if( !empty( $client_logo ) ){
			$return .= themetechmount_column_div( 'start', $column );
			$return .= '<a href="'.esc_url( $client_website ).'" '.$linktarget.' data-tooltip="'.esc_attr( $client_name ).'" title="'.esc_attr( $client_name ).'">';
			$return .= $client_logo;
			$return .= '</a>';
			$return .= themetechmount_column_div( 'end', $column );
		} else {
			$return .= '<!-- No Featured Image For this Client -->';
		}
		
		// breaking out of loop when items equals show
		if($i == $show){
			break;
		}

	}
	
	return $return;
}
}






/**
 *  Show RevolutionSlider select option
 */
if( !function_exists('themetechmount_revslider_array') ){
function themetechmount_revslider_array( $countonly=false ) {
	$sliders = array();
	
	// Add This only if RevSlider is Activated
	if ( class_exists( 'RevSlider' ) ) {
		
		/* get revolution array */
		$slider     = new RevSlider();
		$arrSliders = $slider->getArrSlidersShort();
		
		if( count($arrSliders)>0 ){
			foreach( $arrSliders as $arrSlider ){
				$sliders[$arrSlider] = $arrSlider;
			}
		}
	}
	
	if( $countonly==true ){
		return count($sliders);
	} else {
		// Check if slider created
		if( count($sliders)==0 ){
			$sliders[''] = esc_attr__('(No Slider Found)', 'fixtech');
		}
		return $sliders;
	}
}
}




if( !function_exists('themetechmount_layerslider_array') ){
function themetechmount_layerslider_array( $countonly=false ){
	
	//check if LayerSlider plugins is active 
	if ( function_exists('lsSliders') ) {
		
		$sliders 		= lsSliders();
		$slider_names  	= array();
		
		foreach( $sliders as $key => $val ){		
			$slider_names[$val['id']] = $val['name'].' (ID: '. $val['id'] .')';
		}
		
		if( $countonly == true ){
			return count($slider_names);
		} else {
			// Check if slider created
			if( count($slider_names) == 0 ){
				$slider_names[''] = esc_attr__('(No Slider Found)', 'fixtech');
			}
			return $slider_names;
		}
		
	}
	
	
	
}
}



/************************* Header Slider Functions ******************************/

if( !function_exists('themetechmount_header_slider_show') ){
function themetechmount_header_slider_show(){
	$return  = false;
	$post_id = false;
	
	if( is_singular() ){
		$post_id = get_the_ID();
		
	} else if( function_exists('is_woocommerce') ) {
		
		if( is_woocommerce() ){
			$post_id = get_option( 'woocommerce_shop_page_id' );
		}
	}
	
	if( $post_id ){
		$page_slider = get_post_meta( $post_id, '_themetechmount_metabox_group', true );
		if( !empty($page_slider['slidertype']) ){
			$return = true;
		}
	}
	
	
	
	return $return;
}
}

if( !function_exists('themetechmount_header_slider') ){
function themetechmount_header_slider(){
	$return = '';
	$post_id = false;
	
	if( is_singular() ){
		$post_id = get_the_ID();
		
	} else if( function_exists('is_woocommerce') ) {
		
		if( is_woocommerce() ){
			$post_id = get_option( 'woocommerce_shop_page_id' );
		}
	}
	
	if( $post_id ){
		$page_slider = get_post_meta( $post_id, '_themetechmount_metabox_group', true );
		if( !empty($page_slider['slidertype']) ){
			
			switch( $page_slider['slidertype'] ){
				case 'revslider':
					if( !empty($page_slider['revslider']) ){
						$return = do_shortcode('[rev_slider alias="'. esc_attr($page_slider['revslider']) .'"]');
					}
					break;
					
				case 'layerslider':
					if( !empty($page_slider['layerslider']) ){
						$return = do_shortcode('[layerslider id="'. esc_attr($page_slider['layerslider']) .'"]');
					}
					break;
					
				case 'custom':
					if( !empty($page_slider['customslider']) ){
						$return = do_shortcode( $page_slider['customslider'] );
					}
					break;
					
			} // switch()
			
			$wrapper_class = 'themetechmount-slider-wide';
			// Boxed layout wrapper
			if( !empty($page_slider['slider_width']) && esc_attr($page_slider['slider_width'])=='boxed' ){
				$wrapper_class = 'container themetechmount-slider-boxed';
			}
			$return = '<div class="'. themetechmount_sanitize_html_classes($wrapper_class) .'">'.$return.'</div>';
			
		}
	}
	return $return;
}
}




/*************************************************************************/
/* ---------------------- Sidebar related functions -------------------- */


/**
 *  Return sidebar class for Row container or content container
 */
if( !function_exists('themetechmount_sidebar_class') ){
function themetechmount_sidebar_class($for='row'){
	$return_container    = 'container';
	$return_row          = '';
	$return_content_area = '';
	
	$container = 'container';
	
	
	if( themetechmount_get_option('layout')=='fullwide' ){
		$container = themetechmount_contentarea_container_class();
	}
	
	
	// If page than remove container
	if( is_page() ){
		$return_container = '';
		if( function_exists('is_woocommerce') && ( is_cart() || is_checkout() ) ){
			$return_container = $container;
		}
	}
	
	if( in_array( esc_attr(themetechmount_get_sidebar_info()), array('left','right') ) ){
		$return_container    = $container;
		$return_row          = 'row multi-columns-row';
		$return_content_area = 'col-md-9 col-lg-9 col-xs-12';
		
	} else if( in_array( esc_attr(themetechmount_get_sidebar_info()), array('both','bothleft','bothright') ) ){
		$return_container    = $container;
		$return_row          = 'row multi-columns-row';
		$return_content_area = 'col-md-6 col-lg-6 col-xs-12';
	}
	
	// container for portfolio category
	if( is_tax( array('tm_portfolio_category','tm_team_group') ) ){
		$return_container = $container;
	}
	
	
	if( $for == 'content-area' ){
		return $return_content_area;
	} else if( $for == 'container' ){
		return $return_container;
	} else {
		return $return_row;
	}
	
	
}
}




/**
 *  Check for sidebar enabled for the side
 */
if( !function_exists('themetechmount_get_sidebar_info') ){
function themetechmount_get_sidebar_info(){
	
	// Sidebar Class
	$sidebar = esc_attr( themetechmount_get_option('sidebar_post') ); // Global settings
	
	// if page or single
	if( is_home() || is_page() || is_singular() ){
		
		// Getting page/post/singluar id 
		$page_id = get_the_ID();
		if( is_home() ){
			$page_id = get_option('page_for_posts');
		}
		
		// global sidebar for page
		if( is_page() ){
			$sidebar = esc_attr( themetechmount_get_option('sidebar_page') ); // Global settings
		}
		
		// if Team member
		if( is_singular('tm_team_member') ){
			$sidebar = esc_attr( themetechmount_get_option('sidebar_team_member') ); // Global settings
		}
		
		// if Portfolio
		if( is_singular('tm_portfolio') ){
			$sidebar = esc_attr( themetechmount_get_option('sidebar_portfolio') ); // Global settings
		}
		
		
		// Getting sidebar value from Single (page/post/singluar)
		if( !empty($page_id) ){
			$single_sidebar = get_post_meta( $page_id, '_themetechmount_metabox_sidebar', true);
			if( !empty($single_sidebar['sidebar']) ){
				$sidebar = $single_sidebar['sidebar'];
			}
		}
		
		// The Events Calendar
		if( is_singular('tribe_events') ){
			$sidebar_events = themetechmount_get_option('sidebar_events');
			$sidebar = ( !empty( $sidebar_events ) ) ? esc_attr( $sidebar_events ) : 'no' ; // Global settings
		}
		
		
	}
	
	
	// Portfolio Category
	if( is_tax('tm_portfolio_category') ){
		$sidebar = esc_attr( themetechmount_get_option('sidebar_portfolio_category') ); // Global settings
	}
	
	// Team Group
	if( is_tax('tm_team_group') ){
		$sidebar = esc_attr( themetechmount_get_option('sidebar_team_member_group') ); // Global settings
	}
	
	
	/* TESING PENDING FOR THIS CODE: */
	
	// WooCommerce sidebar class
	if( function_exists('is_woocommerce') && is_woocommerce() ) {
		$sidebar_woocommerce = themetechmount_get_option('sidebar_woocommerce');
		$sidebar = !empty( $sidebar_woocommerce ) ? esc_attr( $sidebar_woocommerce ) : 'right' ;
		
		
		$post_id = get_option( 'woocommerce_shop_page_id' );
		if( !empty($post_id) ){
			$single_sidebar = get_post_meta( $post_id, '_themetechmount_metabox_sidebar', true);
			if( !empty($single_sidebar['sidebar']) ){
				$sidebar = $single_sidebar['sidebar'];
			}
		}
		
	}
	
	// BBPress sidebar class
	if( function_exists('is_bbpress') && is_bbpress() ) {
		$sidebar_bbpress = themetechmount_get_option('sidebar_bbpress');
		$sidebar = !empty( $sidebar_bbpress ) ? esc_attr( $sidebar_bbpress ) : 'right' ;
	}
	
	// Tribe Events (The Events Calendar plugin)
	if( function_exists('tribe_is_upcoming') ){
		if ( get_post_type() == 'tribe_events' || tribe_is_upcoming() || tribe_is_month() || tribe_is_by_date() || tribe_is_day() || is_single('tribe_events')){
			$sidebar_events = themetechmount_get_option('sidebar_events');
			$sidebar = ( !empty( $sidebar_events ) ) ? esc_attr( $sidebar_events ) : 'no' ; // Global settings
		}
	}
	
	
	// Search results page sidebar
	if( is_search() ){
		$sidebar_search = themetechmount_get_option('sidebar_search');
		$sidebar = ( !empty( $sidebar_search ) && trim( $sidebar_search )!='' ) ? esc_attr( $sidebar_search ) : 'no' ; // Global settings for search results page
	}
	
	// If 404 page
	if( is_404() ){
		$sidebar = 'no';
	}
	
	
	return $sidebar;
	
}
}





/**
 *  Get sidebar value of single page/post/cpt type.
 */
if( !function_exists('themetechmount_single_get_sidebar_value') ){
function themetechmount_single_get_sidebar_value(){
	
	// Getting global sidebar value
	global $fixtech_theme_options;
	
	// Globally the sidebar of POST will be used
	$sidebar = $fixtech_theme_options['sidebar_post'];
	
	if( is_page() || is_singular() ){
		
		$cpt = get_post_type();
		
		// Single page/post ID
		$single_id = get_the_ID();
		if( is_home() ){ $single_id = get_option( 'page_for_posts' ); }
		
		// Single view of any of our CPT
		if( !empty($fixtech_theme_options['sidebar_'.$cpt]) ){
			$sidebar = $fixtech_theme_options['sidebar_'.$cpt];
		}
		
		// Getting single meta for sidebar
		$single_meta = get_post_meta( $single_id, '_themetechmount_metabox_sidebar', true );
		if( !empty( $single_meta['sidebar'] ) ){
			$sidebar = $single_meta['sidebar'];
		}
		
	}
	
	
	// If search results page
	if( is_search() ){
		$sidebar = $fixtech_theme_options['sidebar_search'];
	}
	
	
	// If search results page
	if( is_search() ){
		$sidebar = $fixtech_theme_options['sidebar_search'];
	}
	
	
	return $sidebar;
}
}






/**
 *  Single content area class
 */
if( !function_exists('themetechmount_single_contentarea_class') ){
function themetechmount_single_contentarea_class(){
	$return = 'col-md-12 col-lg-12 col-xs-12';
	
	if( is_page() || is_singular() ){
		
		$sidebar = themetechmount_single_get_sidebar_value();
		
		// Preparing return
		// adding class
		if( !empty($sidebar) && $sidebar!='no' ){
			if( $sidebar=='left' || $sidebar=='right' ){
				$return = 'col-md-9 col-lg-9 col-xs-12';
			} else {
				$return = 'col-md-6 col-lg-6 col-xs-12';
			}
		}
		
	}
	
	return $return;
	
}
}




/**
 *  Show sidebar of hide sidebar
 */
if( !function_exists('themetechmount_single_show_sidebar') ){
function themetechmount_single_show_sidebar( $side='left' ){
	$return = false;
	
	if( is_page() || is_singular() ){
		
		$sidebar = themetechmount_single_get_sidebar_value();
		
		// Preparing return
		if( $side=='left' ){
			if( $sidebar=='left' || $sidebar=='both' || $sidebar=='bothleft' || $sidebar=='bothright' ){
				$return = true;
			}
		} else {
			if( $sidebar=='right' || $sidebar=='both' || $sidebar=='bothleft' || $sidebar=='bothright' ){
				$return = true;
			}
		}
		
	}
	
	return $return;
	
}
}





/**
 *  Left Sidebar
 */
if( !function_exists('themetechmount_get_left_sidebar') ){
function themetechmount_get_left_sidebar(){
	if( in_array( esc_attr(themetechmount_get_sidebar_info()), array('left','bothleft','bothright','both') ) ){
		get_sidebar( 'left' );
	}
}
}


/**
 *  Right Sidebar
 */
if( !function_exists('themetechmount_get_right_sidebar') ){
function themetechmount_get_right_sidebar(){
	if( in_array( esc_attr(themetechmount_get_sidebar_info()), array('right','bothleft','bothright','both') ) ){
		get_sidebar( 'right' );
	}
}
}





/*************************************************************************/
/* ------------------------ The Events Calendar ------------------------ */

/**
 *  Show event price
 */
if( !function_exists('themetechmount_event_price') ){
function themetechmount_event_price(){
	$return = '';
	if( function_exists('tribe_get_formatted_cost') ){
		$cost = tribe_get_formatted_cost();
		if ( ! empty( $cost ) ){
			$return = themetechmount_wp_kses('<div class="tribe-events-event-cost"><span> ' . esc_attr( tribe_get_formatted_cost() ) . ' </span></div>');
		}
	}

	return $return;
	
}
}

/**
 *  Events Box meta details
 */
if( !function_exists('themetechmount_event_meta') ){
function themetechmount_event_meta(){
	$return = '';
	$price = '';
	
	
	$time_format = get_option( 'time_format', Tribe__Date_Utils::TIMEFORMAT );
	$time_range_separator = tribe_get_option( 'timeRangeSeparator', ' - ' );

	$start_datetime = tribe_get_start_date();
	$start_date = tribe_get_start_date( null, false );
	$start_time = tribe_get_start_date( null, false, $time_format );
	$start_ts = tribe_get_start_date( null, false, Tribe__Date_Utils::DBDATEFORMAT );

	$end_datetime = tribe_get_end_date();
	$end_date = tribe_get_end_date( null, false );
	$end_time = tribe_get_end_date( null, false, $time_format );
	$end_ts = tribe_get_end_date( null, false, Tribe__Date_Utils::DBDATEFORMAT );
	
	if( function_exists('tribe_get_formatted_cost') ){
		$cost = tribe_get_formatted_cost();
		if ( ! empty( $cost ) ){
			$price = '<span class="tribe-events-event-cost"> ' . esc_attr( tribe_get_formatted_cost() ) . ' </span>';
		}
	}
	
	
	
	
	
	$return .= '<div class="themetechmount-meta-details themetechmount-event-meta-details">';
		$return .= '<span class="themetechmount-event-meta-item themetechmount-event-date"> ';
			$return .= '<i class="fa fa-clock-o"></i> ';
			// All day (multiday) events
			if ( tribe_event_is_all_day() && tribe_event_is_multiday() ){
				

				$return .= '
					<span class="themetechmount-event-meta-dtstart" title="' . esc_attr( $start_ts ) . '"> ' .  esc_attr( $start_date ) . ' </span> - 
					<span class="themetechmount-event-meta-dtend" title="' . esc_attr( $end_ts ) . '"> ' . esc_attr( $end_date ) . ' </span>';

			
			// All day (single day) events
			} elseif ( tribe_event_is_all_day() ){
				$return .= '<span class="themetechmount-event-meta-onedate" title="'. esc_attr( $start_ts ) . '"> ' . esc_attr( $start_date ) . '</span>';

			
			// Multiday events
			} elseif ( tribe_event_is_multiday() ){
				
				$return .= '<span class="themetechmount-event-meta-dtstart" title="' . esc_attr( $start_ts ) . '"> ' . esc_attr( $start_datetime ) . ' </span> - ';
				$return .= '<span class="themetechmount-event-meta-dtend" title="' . esc_attr( $end_ts ) . '"> ' .  esc_attr( $end_datetime ) .' </span>';


			// Single day events
			} else {
				
				$return .= '<span class="themetechmount-event-meta-dtstart" title="' . esc_attr( $start_ts ) . '"> ' . esc_attr( $start_date ) . ' </span> - ';

				$return .= '<span class="themetechmount-event-meta-dtend" title="' . esc_attr( $end_ts ) . '">';
					if ( $start_time == $end_time ) {
						$return .= esc_attr( $start_time );
					} else {
						$var_diff_time = $start_time . $time_range_separator . $end_time;
						$return .= esc_attr( $var_diff_time );
					}

				$return .=' </span>';
			}
		$return .=' </span>';
		$return .= '
			&nbsp;&nbsp; <span class="themetechmount-event-meta-item themetechmount-event-price">
				'.$price.'
			</span>';
	$return .= '</div>';
	return $return;
}
}



/**
 *  Events Short Description
 */
if( !function_exists('themetechmount_event_description') ){
function themetechmount_event_description(){ 
	$return   = '';
	$readMore = esc_attr__('See Event', 'fixtech') . ' <i class="kwicon-fa-angle-right"></i>';
	
	if( has_excerpt() ){
		$return  = get_the_excerpt();
		$return .= '<div class="themetechmount-post-readmore"><a href="'.get_permalink().'">'.$readMore.'</a></div>';
	} else {
		global $more;
		$more = 0;
		$return = get_the_content( $readMore );
	}
	return $return;
}
}










/**************** Post comment functions **************/
/**
 *  Show sidebar of hide sidebar
 */
if( !function_exists('themetechmount_comment_row_template') ){
function themetechmount_comment_row_template($comment, $args, $depth){
	if ( 'div' === $args['style'] ) {
        $tag       = 'div';
        $add_below = 'comment';
    } else {
        $tag       = 'li';
        $add_below = 'div-comment';
    }
    ?>
    <<?php echo $tag ?> <?php comment_class( empty( $args['has_children'] ) ? '' : 'parent' ) ?> id="comment-<?php comment_ID() ?>">
    <?php if ( 'div' != $args['style'] ) : ?>
        <div id="div-comment-<?php comment_ID() ?>" class="comment-body">
    <?php endif; ?>
    <div class="comment-author vcard">
        <?php if ( $args['avatar_size'] != 0 ) echo get_avatar( $comment, $args['avatar_size'] ); ?>
    </div>
    <?php if ( $comment->comment_approved == '0' ) : ?>
         <em class="comment-awaiting-moderation"><?php esc_attr_e( 'Your comment is awaiting moderation.', 'fixtech' ); ?></em>
          <br />
    <?php endif; ?>

    <div class="comment-meta commentmetadata">
		<?php printf( esc_attr__( '<cite class="tm-comment-owner fn">%s</cite> <span class="says">says:</span>', 'fixtech' ), get_comment_author_link() ); ?>
		
		<a href="<?php echo htmlspecialchars( get_comment_link( $comment->comment_ID ) ); ?>">
		<?php
		/* translators: 1: date, 2: time */
        printf( esc_attr__( '%1$s at %2$s', 'fixtech' ), get_comment_date(),  get_comment_time() ); ?></a><?php edit_comment_link( esc_attr__( '(Edit)', 'fixtech' ), '  ', '' );
        ?>
    </div>

    <?php comment_text(); ?>

    <div class="reply">
        <?php comment_reply_link( array_merge( $args, array( 'add_below' => $add_below, 'depth' => $depth, 'max_depth' => $args['max_depth'] ) ) ); ?>
    </div>
    <?php if ( 'div' != $args['style'] ) : ?>
    </div>
    <?php endif; ?>
    <?php
	
}
}






/**
 *  Author social links for Author Bio box
 */
if( !function_exists('themetechmount_author_social_links') ){
function themetechmount_author_social_links(){
	$return = '';
	$all_socials = array();
	
	// fetching all values
	// $all_socials[SOCIAL_CLASS]  => get_the_author_meta( 'INPUT_NAME' );
	// The "INPUT_NAME" is defined in hooks.php in themetechmount_author_socials() function. You can add more socials in that function.
	$all_socials['twitter']  = get_the_author_meta( 'twitter' );
	$all_socials['facebook'] = get_the_author_meta( 'facebook' );
	$all_socials['linkedin'] = get_the_author_meta( 'linkedin' );
	$all_socials['gplus']    = get_the_author_meta( 'gplus' );
	
	foreach( $all_socials as $social_class => $social_link ){
		if( !empty($social_link) ){
			$return .= '<li><a href="'. $social_link .'" target="_blank"><i class="tm-fixtech-icon-'. $social_class .'"></i><span class="tm-hide">'. ucwords($social_class) .'</span></a></li>';
		}
	}
	
	if( !empty($return) ){
		$return = '<div class="tm-author-social-links-wrapper"><ul class="tm-author-social-links">' . $return . '</ul> <!-- .tm-team-social-links -->  </div> <!-- .tm-team-social-links-wrapper -->';
	}
	
	// Return data
	return $return;
	
	
	
	
	
}
}







/**************** 404 page functions **************/


/**
 *  Getting 404 page big icon
 */
if( !function_exists('themetechmount_404_icon') ){
function themetechmount_404_icon(){
	$icon   = themetechmount_get_option('error404_big_icon');
	$return = ( !empty($icon['library_' . $icon['library']] ) ) ? '<div class="tm-big-icon"><i class="' . $icon['library_' . $icon['library']] . '"></i></div>' : '' ;
	return $return;
}
}



/**
 *  Getting 404 heading
 */
if( !function_exists('themetechmount_404_heading') ){
function themetechmount_404_heading(){
	$heading = themetechmount_get_option('error404_big_text');
	$return  = ( !empty($heading) ) ? '<header class="page-header"> <h1 class="page-title">' . esc_attr( $heading ) . '</h1> </header><!-- .page-header -->' : '' ;
	return $return;
}
}


/**
 *  Getting 404 description
 */
if( !function_exists('themetechmount_404_description') ){
function themetechmount_404_description(){
	$description = themetechmount_get_option('error404_medium_text');
	$return  = ( !empty($description) ) ? '<div class="page-content"> <p>' . esc_attr( $description ) . '</p> </div><!-- .page-content -->' : '' ;
	return $return;
}
}










/**************** Search Results page **************/

/**
 *  Search results page content
 *
 *  Accepts either an array of '$classes', or a space separated string of classes and
 *  sanitizes them using the 'sanitize_html_class' function.
 */
if( !function_exists('themetechmount_search_results_content') ){
function themetechmount_search_results_content(){
	$return  = '';
	
	// total counter
	$total_page           = 10;
	$total_post           = 5;
	$total_tm_portfolio   = 3;
	$total_tm_team_member = 3;
	$total_product        = 3;
	$total_tribe_events   = 3;

	
	// zero counter to calculate
	$curr_total_page           = 1;
	$curr_total_post           = 1;
	$curr_total_tm_portfolio   = 1;
	$curr_total_tm_team_member = 1;
	$curr_total_product        = 1;
	$curr_total_tribe_events   = 1;
	
	// storing data in this variables
	$data_page           = array();  // for page
	$data_post           = array();  // for post
	$data_tm_portfolio   = '';
	$data_tm_team_member = '';
	$data_product        = '';
	$data_tribe_events   = '';
	
	
	// If on single CPT search results page
	if( get_query_var('post_type')=='tm_portfolio'
		|| get_query_var('post_type')=='tm_team_member'
		|| get_query_var('post_type')=='product'
		|| get_query_var('post_type')=='tribe_events'
	){
		$total_tm_portfolio   = 9;
		$total_tm_team_member = 9;
		$total_tm_testimonial = 9;
		$total_product        = 9;
		$total_tribe_events   = 9;
	} else if( isset($_GET['post_type']) && $_GET['post_type']=='page' ){
		$total_page           = 20;
	} else if( isset($_GET['post_type']) && $_GET['post_type']=='post' ){
		// show 20 results for rest CPT
		$total_post           = 20;
	}
	
	
	// creating
	//$x = 1;
	while ( have_posts() ) : the_post();
		
		$post_type = get_post_type();
		
		
		switch( $post_type ){
			
			
			case 'post' :
				if( $curr_total_post < $total_post ){
					$data_post[] = themetechmount_recent_posts();
					$curr_total_post++;
				}
				break;
				
				
			case 'page' :
				if( $curr_total_page <= $total_page ){
					
					// this involves base 64 enc function so we created function in our plugin to enc ode it
					$data = themetechmount_enc_data('<a href="' . get_permalink() . '">' . get_the_title() . '</a>');
					
					$data_page[] = ' line' . $curr_total_page . '="' . $data . '" ';
					$curr_total_page++;
				}
				break;
			
			
			case 'tm_portfolio' :
				
				//$total_tm_portfolio      = (!isset($total_tm_portfolio)) ? 3 : $total_tm_portfolio ;
				//$curr_total_tm_portfolio = (!isset($curr_total_tm_portfolio)) ? 1 : $curr_total_tm_portfolio ;
				
				
				if( $curr_total_tm_portfolio <= $total_tm_portfolio ){
					$column   = 'three';
					$template = themetechmount_get_option('pfcat_view');
					
					ob_start();
					get_template_part('template-parts/portfoliobox/portfoliobox', $template);
					$boxes = ob_get_contents();
					ob_end_clean();
					
					$data_tm_portfolio .= themetechmount_column_div('start', $column );
						$data_tm_portfolio .= $boxes;
					$data_tm_portfolio .= themetechmount_column_div('end', $column );
					
					//$data_tm_portfolio .= ' PORTFOLIO ';
					
					$curr_total_tm_portfolio++;
				}
				break;
				
				
			case 'tm_team_member' :
				
				if( $curr_total_tm_team_member <= $total_tm_team_member ){
					$column   = 'three';
					$template = themetechmount_get_option('teamcat_view');
					
					ob_start();
					get_template_part('template-parts/teambox/teambox', $template);
					$boxes = ob_get_contents();
					ob_end_clean();
					
					$data_tm_team_member .= themetechmount_column_div('start', $column );
						$data_tm_team_member .= $boxes;
					$data_tm_team_member .= themetechmount_column_div('end', $column );
					
					
					$curr_total_tm_team_member++;
				}
				break;
				
				
				
			case 'product' :
				
				if( function_exists('is_woocommerce') ){

					
					if( $curr_total_product <= $total_product ){
						$column   = 'three';
						$template = themetechmount_get_option('teamcat_view');
						
						// Getting ID of the product
						if( !empty($data_product) ){ $data_product .= ','; }
						$data_product .= get_the_ID();
						
						$curr_total_product++;
					}
				}
				break;
				
				
				
			case 'tribe_events' :
				
				if( function_exists('tribe_is_month') ){
					
					if( $curr_total_tribe_events <= $total_tribe_events ){
						$column   = 'three';
						$template = themetechmount_get_option('teamcat_view');
						
						// Getting ID of the product
						
						ob_start();
						get_template_part('template-parts/eventsbox/eventsbox', 'top-image' );
						$boxes = ob_get_contents();
						ob_end_clean();
						
						$data_tribe_events .= themetechmount_column_div('start', $column );
							$data_tribe_events .= $boxes;
						$data_tribe_events .= themetechmount_column_div('end', $column );
						
						
						$curr_total_tribe_events++;
					}
				}
				break;
				
			
		} // switch
		
	endwhile;
	
	
	
	
	
	
	
	// PAGE
	if( is_array($data_page) && count($data_page)>0 ){
		$data_page_html = '';
		
		// if more than 10
		if( !empty($_GET['post_type']) && $_GET['post_type']=='page' ){
			$shortcode1 = '';
			$shortcode2 = '';
			
			// first row
			for ($x = 0; $x < 10; $x++) {
				$shortcode1 .= ' '.$data_page[$x];
			}
			// second row
			for ($x = 10; $x < 20; $x++) {

				$shortcode2 .= ' '.$data_page[$x];
			}
			
			
			$data_page_html .= '<div class="row multi-column-row">';
			$data_page_html .= '<div class="col-sm-6">';
			$data_page_html .= do_shortcode('[tm-list icon_icon_fontawesome="fa fa-file-text-o" ' . $shortcode1 . ']');
			$data_page_html .= '</div>';
			$data_page_html .= '<div class="col-sm-6">';
			$data_page_html .= do_shortcode('[tm-list icon_icon_fontawesome="fa fa-file-text-o" ' . $shortcode2 . ']');
			$data_page_html .= '</div>';
			$data_page_html .= '</div><!-- .row -->';
			
			$data_page = $data_page_html;
			
		} else {
			
			$shortcode = '';
			
			// first row
			$shortcode = implode(' ', $data_page);
			$data_page_html .= do_shortcode('[tm-list icon_icon_fontawesome="fa fa-file-text-o" ' . $shortcode . ']');
			
			$data_page = $data_page_html;
			
		}

	}
	
	
	
	
	// POST
	if( is_array($data_post) && count($data_post)>0 ){
		
		$data_post_html = '';
		
		// POST - if more than 10
		if( !empty($_GET['post_type']) && $_GET['post_type']=='post' ){
			$html_left  = '';
			$html_right = '';
			
			// first row
			for ($x = 0; $x < 10; $x++) {
				if( !empty($data_post[$x]) ){
					$html_left .= ' '.$data_post[$x];
				}
			}
			// second row
			for ($x = 10; $x < 20; $x++) {
				if( !empty($data_post[$x]) ){
					$html_right .= ' '.$data_post[$x];
				}
			}
			
			$data_post_html .= '<div class="row multi-column-row">';
			$data_post_html .= '<div class="col-sm-6">';
			$data_post_html .= '<ul class="tm-recent-post-list">' . $html_left . '</ul>';
			$data_post_html .= '</div>';
			$data_post_html .= '<div class="col-sm-6">';
			$data_post_html .= '<ul class="tm-recent-post-list">' . $html_right . '</ul>';
			$data_post_html .= '</div>';
			$data_post_html .= '</div><!-- .row -->';
			
			$data_post = $data_post_html;
			
		} else {
			// Array to string
			$data_post = '<ul class="tm-recent-post-list">' . implode('', $data_post) . '</ul>';
		}
	}
	

	
	// Columns - On Search results main page only
	if( empty($_GET['post_type']) ){
			
		if( !empty($data_page) || !empty($data_page) ){
			
			$return .= '<div class="tm-sresults-first-row row">';
			if( !empty($data_page) ){
				$return .= '<div class="col-sm-6">' . themetechmount_search_results_box_title( 'page' ) . $data_page . '</div>';
			}
			if( !empty($data_post) ){
				$return .= '<div class="col-sm-6">' . themetechmount_search_results_box_title( 'post' ) . $data_post . '</div>';
			}
			$return .= '</div>';
			
		}
	} else if( !empty($_GET['post_type']) && $_GET['post_type']=='page' ){
		$return .= '<div class="tm-results-page">' . $data_page . '</div>';
	} else if( !empty($_GET['post_type']) && $_GET['post_type']=='post' ){
		$return .= '<div class="tm-results-post">' . $data_post . '</div>';
	}
	
	
	
	// PORTFOLIO
	if( !empty($data_tm_portfolio) ){
		
		// Getting title
		$page_title = ( empty($_GET['post_type']) ) ? themetechmount_search_results_box_title( 'tm_portfolio' ) : '' ;
		
		$return .= '
		<div class="tm-sresults-cta-wrapper">
			' . $page_title . '
			<div class="tm-sresults-second-row row">
				' . $data_tm_portfolio . '
			</div>
		</div>';
	}
	
	
	// TEAM MEMBER
	if( !empty($data_tm_team_member) ){
		
		$page_title = ( empty($_GET['post_type']) ) ? themetechmount_search_results_box_title( 'tm_team_member' ) : '' ;
		
		$return .= '
		<div class="tm-sresults-cta-wrapper">
			' . $page_title . '
			<div class="tm-sresults-second-row row multi-columns-row">
				' . $data_tm_team_member . '
			</div>
		</div>';
	}
	
	
	// PRODUCT
	if( !empty($data_product) && function_exists('is_woocommerce') ){
		
		$page_title = ( empty($_GET['post_type']) ) ? themetechmount_search_results_box_title( 'product' ) : '' ;
		
		$return .= '
		<div class="tm-sresults-cta-wrapper">
			' . $page_title . '
			' . /*$data_product*/ do_shortcode('[products ids="' . $data_product . '" columns="3"]') . '
		</div>';
	}
	
	
	// EVENTS
	if( !empty($data_tribe_events) ){
		
		$page_title = ( empty($_GET['post_type']) ) ? themetechmount_search_results_box_title( 'tribe_events' ) : '' ;
		
		$return .= '
		<div class="tm-sresults-cta-wrapper">
			' . $page_title . '
			<div class="tm-sresults-second-row row multi-columns-row">
				' . $data_tribe_events . '
			</div>
		</div>';
	}
	
	
	
	
	
	
	return $return;
	
	
}
}





/**
 *  Recent Posts widget function
 */
if( !function_exists('themetechmount_search_results_box_title') ){
function themetechmount_search_results_box_title( $post_type='post' ){
	$return        = '';
	$singular_name = '';
	
	$small_link = '<small><a href="'. esc_url(get_home_url()).'?s='.get_search_query().'" class="label label-default"><i class="tm-fixtech-icon-angle-left"></i> '.esc_attr__('Back to results','fixtech').'</a></small>';
	if( empty($_GET['post_type']) ){
		$small_link = '<small><a href="'. esc_url(get_home_url()).'?s='.get_search_query().'&post_type=' . $post_type . '" class="label label-default">'.esc_attr__('View more','fixtech').'</a></small>';
	}
		
	if( !empty($post_type) ){
		$obj = get_post_type_object( $post_type );
		$singular_name = $obj->labels->singular_name;
	}
	
	if( !empty($singular_name) ){
		
		$return .= '<div class="tm-sresults-title-w"><h2 class="tm-sresults-title">' . sprintf(
				esc_attr__('Search results for %s','fixtech'),
				'<strong>' . esc_attr($singular_name) . '</strong>'
			)  . ' 
			&nbsp;
			'.$small_link.'
			</h2></div>';
	}

	
	return $return;
	

}
}



if( !function_exists('themetechmount_search_form') ){
function themetechmount_search_form(){
	$return = '';
	
	
	$cptList = array(
		'any'            => esc_attr__('All selections', 'fixtech'),
		'page'           => esc_attr__('Pages', 'fixtech'),
		'post'           => esc_attr__('Blog posts', 'fixtech'),
	);
	
	$cpt_obj_portfolio   = get_post_type_object( 'tm_portfolio' );
	if( !empty($cpt_obj_portfolio->label) ){
		$cptList['tm_portfolio'] = esc_attr($cpt_obj_portfolio->label);
	}
	
	$cpt_obj_team   = get_post_type_object( 'tm_team_member' );
	if( !empty($cpt_obj_team->label) ){
		$cptList['tm_team_member'] = esc_attr($cpt_obj_team->label);
	}
	
	$cpt_obj_product   = get_post_type_object( 'product' );
	if( !empty($cpt_obj_product->label) ){
		$cptList['product'] = esc_attr($cpt_obj_product->label);
	}
	
	$cpt_obj_tribe_events   = get_post_type_object( 'tribe_events' );
	if( !empty($cpt_obj_tribe_events->label) ){
		$cptList['tribe_events'] = esc_attr($cpt_obj_tribe_events->label);
	}
	
	
	
	// CPT Dropdown
	$dropdown = '<select class="tm-sresult-cpt-select">';
	foreach( $cptList as $cptkey=>$cptval ){
		$selected = ( isset($_GET['post_type']) && $_GET['post_type']==$cptkey ) ? ' selected="selected" ' : '' ;
		$dropdown .= '<option value="'.$cptkey.'" class="'.$cptkey.'" '.$selected.'>'.$cptval.'</option>';
	}
	$dropdown .= '</select>';
	
	
	
	// Form
	$return .= '
	<div class="tm-sresult-form-wrapper">
					<div class="tm-sresult-form-top">
						<h2>
							<i class="fa fa-search"></i>
							' . esc_attr__('You searched for', 'fixtech') . '
						</h2>
						' . get_search_form(false) . '
						<div class="tm-sresults-settings-wrapper">
							<a class="tm-sresults-settings-btn" href="#">
								<i class="fa fa-gear"></i>  
								<span>' . esc_attr__('Settings', 'fixtech') . '</span>
							</a>
						</div>
						<div class="clr clear"></div>
					</div>
					<div class="tm-sresult-form-bottom-w">
						<div class="tm-sresult-form-bottom row" style="display:none;">
						<div class="tm-search-main-box clearfix">
                            <div class="tm-search-text"><strong>' . esc_attr__('Search in:','fixtech') . '</strong></div>
							<div class="tm-search-select-box">
								' . $dropdown . '
                              <div class="tm-sresult-form-sbtbtn-wrapper">
								<input class="tm-sresult-form-sbtbtn" type="submit" value="' . esc_attr__('Search now','fixtech') . '" />
							  </div>
						  </div>
							
                          </div>
						</div><!-- .tm-sresult-form-bottom -->
					</div><!-- .tm-sresult-form-bottom-w -->
				</div>
	
	';
				
	return $return;
	
}
}




			
			
			
			

/**************** Recent Posts widget function **************/

/**
 *  Recent Posts widget function
 */
if( !function_exists('themetechmount_recent_posts') ){
function themetechmount_recent_posts( $post='' ){
	
	$return = '';
	
	$return .= '<li class="tm-recent-post-list-li">';
		if( has_post_thumbnail() ){
			$return .= '<a href="' . get_permalink() . '">' . get_the_post_thumbnail( get_the_ID(), 'thumbnail') . '</a>';
		}
		$return .= '<span class="post-date">' . get_the_date() . '</span>';
		$return .= '<a href="' . get_permalink() . '">' . get_the_title() . '</a>';
	$return .= '</li>';

	return $return;
	
}
}








/**************** The Events Calendar functions **************/
/**
 *  Events Calendar correction for data
 */
if( !function_exists('themetechmount_events_calendar_correction') ){
function themetechmount_events_calendar_correction(){
	global $posts;
	global $post;
	if( !empty($posts[0]->ID) ){
		$post = $posts[0];
	}
}
}











/**************** Sanitize functions **************/

/**
 *  Sanitize multiple HTML classes in one pass.
 *
 *  Accepts either an array of '$classes', or a space separated string of classes and
 *  sanitizes them using the 'sanitize_html_class' function.
 */
if( !function_exists('themetechmount_sanitize_html_classes') ){
function themetechmount_sanitize_html_classes($classes, $return_format = 'input'){
	if ( 'input' === $return_format ) {
		$return_format = is_array( $classes ) ? 'array' : 'string';
	}

	$classes = is_array( $classes ) ? $classes : explode( ' ', $classes );

	$sanitized_classes = array_map( 'sanitize_html_class', $classes );

	if ( 'array' === $return_format ){
		return $sanitized_classes;
	}else{
		return implode( ' ', $sanitized_classes );
	}

}
}




/**
 *  Sanitize HTML content here
 *
 */
if( !function_exists('themetechmount_wp_kses') ){
function themetechmount_wp_kses( $string, $allowed_html_type='' ){
	
	// default allowed html list
	$allowed_html = array(
		'aside' => array(
			'class' => array(),
			'id'    => array(),
			'role'  => array(),
		),
		'div' => array(
			'class'        => array(),
			'style'        => array(),
			'id'           => array(),
			'data-iconset' => array(),
			'data-icon'    => array(),
			'role'         => array(),
		),
		'span'   => array(
			'class'  => array(),
			'style'  => array(),
			'id'     => array(),
		),
		'i'   => array(
			'class'  => array(),
		),
		'h1'   => array(
			'class'  => array(),
		),
		'h2'   => array(
			'class'  => array(),
		),
		'h3'   => array(
			'class'  => array(),
		),
		'h4'   => array(
			'class'  => array(),
		),
		'h5'   => array(
			'class'  => array(),
		),
		'h6'   => array(
			'class'  => array(),
		),
		'input'   => array(
			'type'  => array(),
			'name'  => array(),
			'value' => array(),
			'class' => array(),
		),
		'a' => array(
			'href'  => array(),
			'title' => array(),
			'class' => array()
		),
		'br'     => array(),
		'em'     => array(),
		'strong' => array(),
		'ol'     => array(),
		'ul'     => array(
			'class'  => array(),
		),
		'li'     => array(
			'class'  => array(),
		),
		'p'    => array(
			'class' => array(),
		),
		'img' => array(
			'class'  => array(),
			'src'    => array(),
			'alt'    => array(),
			'title'  => array(),
			'width'  => array(),
			'height' => array(),
		),
		'sup'    => array(
			'class' => array(),
		),
		'sub'    => array(
			'class' => array(),
		),
		'iframe' => array(
			'src'         => array(),
			'width'       => array(),
			'height'      => array(),
			'scrolling'   => array(),
			'frameborder' => array(),
		),
	);
	
	
	
	// Optional - Change the allowed tag array.
	if( !empty($allowed_html_type) ){
		
		switch($allowed_html_type){
			case 'fid_icon': // Facts In Digits icon
				$allowed_html = array(
					'div' => array(
						'class' => array(),
						'id'    => array(),
					),
					'i'   => array(
						'class'  => array(),
					),
				);
				break;
		}
		
	}
	
	
	
	// final filter
	return wp_kses( $string, $allowed_html );

}
}


/**
 *  responsive padding margin
 */
if( !function_exists('themetechmount_responsive_padding_margin') ){
function themetechmount_responsive_padding_margin( $data='' , $parent_class='' ){
	
	$return = '';
	
	if( !empty($data) ){
		
		$data_array = explode('|',$data);
		
		$css_1200   = '';
		$css_991    = '';
		$css_767    = '';
		$css_custom = '';
		$custom_column_break	='';
		foreach( $data_array as $key=>$val ){
			if($key!=0 && $key!=1 && $key!=10 && $key!=19 && $key!=29 ){
				if( !empty($val) && substr($val, -2)!='px' && substr($val, -2)!='em' && substr($val, -1)!='%' ){
					$data_array[$key] = trim($val).'px';
				}
			}
		}
	
		$class		= ( !empty($data_array[0]) ) ? $data_array[0] : '' ;
	
		$css_1200	.= ( isset($data_array[2]) && ($data_array[2])!='' ) ? 'margin-top:'.$data_array[2].' !important;'			: '' ;
		$css_1200	.= ( isset($data_array[3]) && ($data_array[3])!='' ) ? 'margin-right:'.$data_array[3].' !important;'		: '' ;
		$css_1200	.= ( isset($data_array[4]) && ($data_array[4])!='' ) ? 'margin-bottom:'.$data_array[4].' !important;'		: '' ;
		$css_1200	.= ( isset($data_array[5]) && ($data_array[5])!='' ) ? 'margin-left:'.$data_array[5].' !important;'		: '' ;
		$css_1200	.= ( isset($data_array[6]) && ($data_array[6])!='' ) ? 'padding-top:'.$data_array[6].' !important;'		: '' ;
		$css_1200	.= ( isset($data_array[7]) && ($data_array[7])!='' ) ? 'padding-right:'.$data_array[7].' !important;'		: '' ;
		$css_1200	.= ( isset($data_array[8]) && ($data_array[8])!='' ) ? 'padding-bottom:'.$data_array[8].' !important;'		: '' ;
		$css_1200	.= ( isset($data_array[9]) && ($data_array[9])!='' ) ? 'padding-left:'.$data_array[9].' !important;'		: '' ;
		
		$css_991	.= ( isset($data_array[11]) && ($data_array[11])!='' )  ? 'margin-top:'.$data_array[11].' !important;'		: '' ;
		$css_991	.= ( isset($data_array[12]) && ($data_array[12])!='' ) ? 'margin-right:'.$data_array[12].' !important;'		: '' ;
		$css_991	.= ( isset($data_array[13]) && ($data_array[13])!='' ) ? 'margin-bottom:'.$data_array[13].' !important;'	: '' ;
		$css_991	.= ( isset($data_array[14]) && ($data_array[14])!='' ) ? 'margin-left:'.$data_array[14].' !important;'		: '' ;
		$css_991	.= ( isset($data_array[15]) && ($data_array[15])!='' ) ? 'padding-top:'.$data_array[15].' !important;'		: '' ;
		$css_991	.= ( isset($data_array[16]) && ($data_array[16])!='' ) ? 'padding-right:'.$data_array[16].' !important;'	: '' ;
		$css_991	.= ( isset($data_array[17]) && ($data_array[17])!='' ) ? 'padding-bottom:'.$data_array[17].' !important;'	: '' ;
		$css_991	.= ( isset($data_array[18]) && ($data_array[18])!='' ) ? 'padding-left:'.$data_array[18].' !important;'		: '' ;
		
		$css_767	.= ( isset($data_array[20]) && ($data_array[20])!='' ) ? 'margin-top:'.$data_array[20].' !important;'		: '' ;
		$css_767	.= ( isset($data_array[21]) && ($data_array[21])!='' ) ? 'margin-right:'.$data_array[21].' !important;'		: '' ;
		$css_767	.= ( isset($data_array[22]) && ($data_array[22])!='' ) ? 'margin-bottom:'.$data_array[22].' !important;'	: '' ;
		$css_767	.= ( isset($data_array[23]) && ($data_array[23])!='' ) ? 'margin-left:'.$data_array[23].' !important;'		: '' ;
		$css_767	.= ( isset($data_array[24]) && ($data_array[24])!='' ) ? 'padding-top:'.$data_array[24].' !important;'		: '' ;
		$css_767	.= ( isset($data_array[25]) && ($data_array[25])!='' ) ? 'padding-right:'.$data_array[25].' !important;'	: '' ;
		$css_767	.= ( isset($data_array[26]) && ($data_array[26])!='' ) ? 'padding-bottom:'.$data_array[26].' !important;'	: '' ;
		$css_767	.= ( isset($data_array[27]) && ($data_array[27])!='' ) ? 'padding-left:'.$data_array[27].' !important;'		: '' ;
		
		$custom_width = ( !empty($data_array[28]) ) ? $data_array[28] : '' ;
		
		$css_custom	.= ( isset($data_array[30]) && ($data_array[30])!='' ) ? 'margin-top:'.$data_array[30].' !important;'		: '' ;
		$css_custom	.= ( isset($data_array[31]) && ($data_array[31])!='' ) ? 'margin-right:'.$data_array[31].' !important;'		: '' ;
		$css_custom	.= ( isset($data_array[32]) && ($data_array[32])!='' ) ? 'margin-bottom:'.$data_array[32].' !important;'	: '' ;
		$css_custom	.= ( isset($data_array[33]) && ($data_array[33])!='' ) ? 'margin-left:'.$data_array[33].' !important;'		: '' ;
		$css_custom	.= ( isset($data_array[34]) && ($data_array[34])!='' ) ? 'padding-top:'.$data_array[34].' !important;'		: '' ;
		$css_custom	.= ( isset($data_array[35]) && ($data_array[35])!='' ) ? 'padding-right:'.$data_array[35].' !important;'	: '' ;
		$css_custom	.= ( isset($data_array[36]) && ($data_array[36])!='' ) ? 'padding-bottom:'.$data_array[36].' !important;'	: '' ;
		$css_custom	.= ( isset($data_array[37]) && ($data_array[37])!='' ) ? 'padding-left:'.$data_array[37].' !important;'		: '' ;
		$custom_column_break	.= ( isset($data_array[29]) && ($data_array[29])!='' ) ? 'display: block;float: none;width: 100%;': '' ;
		
		
		
		if( !empty($css_1200)   ){ $return .= '@media (max-width: 1200px){ '.$parent_class.'.tm-responsive-custom-'.$class.'{'.$css_1200.'} }'; }
		if( !empty($css_991)    ){ $return .= '@media (max-width: 991px ){ '.$parent_class.'.tm-responsive-custom-'.$class.'{'.$css_991.'} }'; }
		if( !empty($css_767)    ){ $return .= '@media (max-width: 767px ){ '.$parent_class.'.tm-responsive-custom-'.$class.'{'.$css_767.'} }'; }
		if( !empty($css_custom) ){ $return .= '@media (max-width: '.$custom_width.' ){ '.$parent_class.'.tm-responsive-custom-'.$class.'{'.$css_custom.'} }'; }
		if( !empty($custom_column_break) ){ $return .= '@media (max-width: '.$custom_width.' ){ .break-custom-colum .wpb_column{'.$custom_column_break.'} }'; }
		

		
	}
	
	
	return $return;
	
}
}


/**
 *  Checking responsive padding margin class
 */
if( !function_exists('themetechmount_responsive_padding_margin_class') ){
function themetechmount_responsive_padding_margin_class( $data='' ){
	$return = '';
	if( !empty($data) ){
		$data_array = explode('|',$data);
		$return = ( !empty($data_array[0]) ) ? 'tm-responsive-custom-'.$data_array[0] : '' ;
	}
	return $return;
}
}

/*---- End of tools.php file ----*/
