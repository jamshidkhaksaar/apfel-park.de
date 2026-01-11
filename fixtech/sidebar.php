<?php
/**
 * The sidebar containing the sidebar right (Sidebar 1).
 *
 */

global $fixtech_theme_options;


if( is_page() ){

	$sidebar_right      = 'sidebar-right-page';
	$sidebar_right_page = get_post_meta($post->ID,'_themetechmount_page_options_rightsidebar',true);
	if( trim($sidebar_right_page)!='' ){ $sidebar_right = trim($sidebar_right_page); }
	
	
	
	// The Events Calendar
	if( function_exists('tribe_is_upcoming') ){
		if (get_post_type()=='tribe_events'){
			$events_sidebar = !empty($fixtech_theme_options['sidebar_events']) ? esc_attr($fixtech_theme_options['sidebar_events']) : 'no' ; // Global settings
			if( $events_sidebar=='right' ){
				$sidebar_right = 'sidebar-events';
			}
		}
	}
	

} elseif( is_home() || is_single() ){
	
	$pageid   = get_option('page_for_posts');
	$postType = 'page';
	if( is_single() ){
		global $post;
		$pageid   = $post->ID;
		$postType = 'post';
	}
	

	
	$sidebar_right      = 'sidebar-right-blog';
	$sidebar_right_blog = get_post_meta( $pageid ,'_themetechmount_'.$postType.'_options_rightsidebar',true);
	if( trim($sidebar_right_blog)!='' ){ $sidebar_right = trim($sidebar_right_blog); }
	
	
	// The Events Calendar
	if( function_exists('tribe_is_upcoming') ){
		if ( get_post_type() == 'tribe_events' || tribe_is_upcoming() || tribe_is_month() || tribe_is_by_date() || tribe_is_day() || is_single('tribe_events')){
			$events_sidebar = ( isset($fixtech_theme_options['sidebar_events']) && trim($fixtech_theme_options['sidebar_events'])!='' ) ? esc_attr($fixtech_theme_options['sidebar_events']) : 'no' ; // Global settings
			if( $events_sidebar=='right' ){
				$sidebar_right = 'sidebar-events';
			}
		}
	}
	
	
	
} elseif( is_search() ) {
	$sidebar_right = 'sidebar-right-search';
	
	
} elseif( function_exists('is_bbpress') && is_bbpress() ) {
	$bbpressSidebar = isset($fixtech_theme_options['sidebar_bbpress']) ? esc_attr($fixtech_theme_options['sidebar_bbpress']) : 'right' ;
	
	if( $bbpressSidebar=='right' ){
		$sidebar_right = 'sidebar-bbpress';
	}
	
	
	
} elseif( (function_exists('tribe_is_upcoming')) && (get_post_type() == 'tribe_events' || tribe_is_upcoming() || tribe_is_month() || tribe_is_by_date() || tribe_is_day() || is_single('tribe_events'))){
	$sidebar_right = 'sidebar-events';

	
} else {
	
	$sidebar_right = esc_attr($fixtech_theme_options['sidebar_post']); // Global settings
	$sidebar_right = 'sidebar-right-blog';
	$sidebar_right_post = get_post_meta($post->ID,'_themetechmount_post_options_rightsidebar',true);
	if( trim($sidebar_right_post)!='' ){ $sidebar_right = trim($sidebar2_post); }
	
}

?>


<aside id="sidebar-right" class="widget-area col-md-3 col-lg-3 col-xs-12 sidebar" role="complementary">
	<?php dynamic_sidebar( $sidebar_right ); ?>
</aside><!-- #sidebar-right -->


